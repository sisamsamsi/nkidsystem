<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductionTask;
use App\Models\User;
use App\Models\WorkLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class StationController extends Controller
{
    /**
     * List all station workstations
     */
    public function index()
    {
        $stations = User::where('is_station', true)
            ->get(['id', 'name', 'email'])
            ->map(function($s) {
                // Add a mock code for the UI if not present
                $s->code = substr($s->id . '000', 0, 3);
                return $s;
            });

        return response()->json([
            'success' => true,
            'data' => $stations
        ]);
    }

    /**
     * Authenticate station with PIN
     */
    public function authenticate(Request $request)
    {
        $request->validate([
            'station_id' => 'required|exists:users,id',
            'pin_code' => 'required|string',
        ]);

        $station = User::where('id', $request->station_id)
            ->where('is_station', true)
            ->first();

        if (!$station) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid station account',
            ], 401);
        }

        if ($station->pin_code !== $request->pin_code) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid PIN code',
            ], 401);
        }

        $token = $station->createToken('station-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'station' => $station,
            'token' => $token,
        ]);
    }

    /**
     * Get available tasks for station
     */
    public function tasks(Request $request)
    {
        $user = auth()->user();
        $query = ProductionTask::with([
            'orderItem.order',
            'orderItem.variant.product',
            'processTemplate',
            'subProcess',
        ])->where('production_tasks.status', '!=', 'completed');

        // Automatic filtering by division
        if ($user && $user->division && strtolower($user->division) !== 'admin') {
            $division = strtolower($user->division);
            $query->whereHas('processTemplate', function($q) use ($division) {
                $q->whereRaw('LOWER(name) = ?', [$division]);
            });
        }

        // Manual override from request if provided
        if ($request->has('process_template_id')) {
            $query->where('production_tasks.process_template_id', $request->process_template_id);
        }

        // Order by priority (SQLite compatible)
        $query->join('order_items', 'production_tasks.order_item_id', '=', 'order_items.id')
              ->join('orders', 'order_items.order_id', '=', 'orders.id')
              ->orderByRaw("CASE 
                  WHEN orders.priority = 'urgent' THEN 1 
                  WHEN orders.priority = 'high' THEN 2 
                  WHEN orders.priority = 'normal' THEN 3 
                  WHEN orders.priority = 'low' THEN 4 
                  ELSE 5 
              END")
              ->select('production_tasks.*');

        $tasks = $query->get();

        return response()->json([
            'success' => true,
            'data' => $tasks,
            'filtered_by' => $user->division ?? 'all'
        ]);
    }

    /**
     * Get single task details
     */
    public function showTask($id)
    {
        $task = ProductionTask::with([
            'orderItem.order',
            'orderItem.variant.product',
            'processTemplate',
        ])->findOrFail($id);

        $remaining = $task->orderItem->quantity - $task->completed_quantity;

        return response()->json([
            'success' => true,
            'data' => $task,
            'remaining_quantity' => $remaining,
        ]);
    }

    /**
     * Log work from station (with operator PIN verification)
     */
    public function logWork(Request $request, $id)
    {
        $validated = $request->validate([
            'operator_id' => 'required|exists:users,id',
            'pin_code' => 'required|string',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        // Verify operator PIN
        $operator = User::find($validated['operator_id']);
        if ($operator->pin_code !== $validated['pin_code']) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid operator PIN',
            ], 401);
        }

        // Atomic work logging
        $result = DB::transaction(function () use ($id, $validated, $operator) {
            $task = ProductionTask::lockForUpdate()->findOrFail($id);
            $orderItem = $task->orderItem;

            $totalRequired = $orderItem->quantity;
            $remaining = $totalRequired - $task->completed_quantity;

            if ($validated['quantity'] > $remaining) {
                throw new \Exception("Cannot exceed remaining quantity ({$remaining} pcs)");
            }

            // Create work log
            $workLog = WorkLog::create([
                'production_task_id' => $task->id,
                'user_id' => $operator->id,
                'quantity' => $validated['quantity'],
                'notes' => $validated['notes'] ?? null,
            ]);

            // Update snapshot
            $newCompleted = $task->completed_quantity + $validated['quantity'];
            $task->completed_quantity = $newCompleted;
            $task->progress_percent = round(($newCompleted / $totalRequired) * 100);
            
            if ($task->progress_percent >= 100) {
                $task->status = 'completed';
                $task->end_date = now();
            } elseif ($task->status === 'pending') {
                $task->status = 'in_progress';
                $task->start_date = $task->start_date ?? now();
            }
            
            $task->save();

            return [
                'work_log' => $workLog,
                'task' => $task->fresh(),
                'operator' => $operator->name,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Work logged successfully',
            'data' => $result,
        ]);
    }
}
