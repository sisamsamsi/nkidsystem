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

        if (!Hash::check($request->pin_code, $station->pin_code)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid PIN code',
            ], 401);
        }

        $token = $station->createToken('station-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'station' => [
                'id' => $station->id,
                'name' => $station->name,
                'email' => $station->email,
                'role' => $station->role,
                'is_station' => $station->is_station,
                'division' => $station->division,
            ],
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

        $tasks = $query->limit(100)->get();

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
        $user = auth()->user();
        $task = ProductionTask::with([
            'orderItem.order',
            'orderItem.variant.product',
            'processTemplate',
        ])->findOrFail($id);

        if ($user && $user->division && strtolower($user->division) !== 'admin') {
            $division = strtolower($user->division);
            $taskDivision = strtolower($task->processTemplate->name ?? '');
            if ($division !== $taskDivision) {
                return response()->json([
                    'success' => false,
                    'message' => "Stasiun Anda ({$user->division}) tidak berwenang untuk mengakses tugas divisi " . ($task->processTemplate->name ?? 'unknown') . ".",
                ], 403);
            }
        }

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
    public function logWork(Request $request, $id, \App\Actions\LogWorkAction $action)
    {
        $validated = $request->validate([
            'operator_id' => 'required|exists:users,id',
            'pin_code' => 'required|string',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        // Verify operator PIN — null guard critical
        $operator = User::find($validated['operator_id']);
        if (!$operator) {
            return response()->json([
                'success' => false,
                'message' => 'Operator not found.',
            ], 404);
        }
        if (!$operator->pin_code || !Hash::check($validated['pin_code'], $operator->pin_code)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid operator PIN',
            ], 401);
        }

        // Verify station division access (S2)
        $user = auth()->user();
        $task = ProductionTask::with('processTemplate')->findOrFail($id);
        if ($user && $user->division && strtolower($user->division) !== 'admin') {
            $division = strtolower($user->division);
            $taskDivision = strtolower($task->processTemplate->name ?? '');
            if ($division !== $taskDivision) {
                return response()->json([
                    'success' => false,
                    'message' => "Stasiun Anda ({$user->division}) tidak berwenang untuk mengakses tugas divisi " . ($task->processTemplate->name ?? 'unknown') . ".",
                ], 403);
            }
        }

        // Atomic work logging with proper exception handling via LogWorkAction (B2)
        try {
            $result = $action->execute(
                $id,
                $operator->id,
                $validated['quantity'],
                $validated['notes'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Work logged successfully',
                'data' => [
                    'work_log' => $result['work_log'],
                    'task' => $result['task'],
                    'operator' => $operator->name,
                ],
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Task not found.',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
