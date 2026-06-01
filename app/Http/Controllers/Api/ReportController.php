<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkLog;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            \Illuminate\Support\Facades\Gate::authorize('admin-only');
            return $next($request);
        });
    }

    /**
     * Employee performance report
     */
    public function employeePerformance(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $startDateStr = $request->input('start_date', now()->subDays(30)->format('Y-m-d'));
        $endDateStr = $request->input('end_date', now()->format('Y-m-d'));

        $start = \Carbon\Carbon::parse($startDateStr);
        $end = \Carbon\Carbon::parse($endDateStr);

        if ($start->diffInDays($end) > 90) {
            return response()->json([
                'success' => false,
                'message' => 'Rentang tanggal pencarian laporan tidak boleh melebihi 90 hari.'
            ], 422);
        }

        $startDate = $start->format('Y-m-d');
        $endDate = $end->format('Y-m-d');

        // Get only users who have work logs in the date range (N+1 Optimization)
        $users = \App\Models\User::whereHas('workLogs', function ($query) use ($startDate, $endDate) {
            $query->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
        })->with(['workLogs' => function ($query) use ($startDate, $endDate) {
            $query->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                  ->with(['task.processTemplate', 'task.orderItem.order']);
        }])->get();

        $performance = $users->map(function ($user) use ($startDate, $endDate) {
            $logs = $user->workLogs;
            $totalQuantity = $logs->sum('quantity');
            $logCount = $logs->count();
            
            // Calculate unique work days
            $workDays = $logs->groupBy(function ($log) {
                return $log->created_at->format('Y-m-d');
            })->count();
            
            // Calculate average per day (avoid division by zero)
            $avgPerDay = $workDays > 0 ? round($totalQuantity / $workDays, 1) : 0;

            return [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'user_email' => $user->email,
                'role' => $user->role ?? 'Operator',
                'division' => $user->division ?? '-',
                'total_quantity' => $totalQuantity,
                'task_count' => $logCount,
                'work_days' => $workDays,
                'avg_per_day' => $avgPerDay,
                'status' => 'active',
                'logs' => $logs->map(function ($log) {
                    return [
                        'id' => $log->id,
                        'date' => $log->created_at->format('M d, Y'),
                        'datetime' => $log->created_at->format('Y-m-d H:i'),
                        'po_number' => $log->task->orderItem->order->po_number ?? 'N/A',
                        'process' => $log->task->processTemplate->name ?? 'N/A',
                        'quantity' => $log->quantity,
                        'notes' => $log->notes ?? '-',
                    ];
                })->values(),
            ];
        })
        ->filter(function ($item) {
            // Only include users who have work logs
            return $item['task_count'] > 0;
        })
        ->sortByDesc('total_quantity')
        ->values();

        // Calculate summary stats
        $totalEmployees = \App\Models\User::where('role', 'operator')->count();
        
        $summary = [
            'total_employees' => $totalEmployees,
            'active_employees' => $performance->count(),
            'total_output' => $performance->sum('total_quantity'),
            'total_logs' => $performance->sum('task_count'),
            'date_range' => [
                'start' => $startDate,
                'end' => $endDate,
            ],
        ];

        return response()->json([
            'success' => true,
            'summary' => $summary,
            'data' => $performance,
        ]);
    }

    /**
     * Production summary report
     */
    public function productionSummary(Request $request)
    {
        $pipeline = \App\Models\ProductionTask::query()
            ->selectRaw('process_templates.name as label, COUNT(*) as count, AVG(production_tasks.progress_percent) as val')
            ->join('process_templates', 'production_tasks.process_template_id', '=', 'process_templates.id')
            ->where('production_tasks.status', '!=', 'completed')
            ->groupBy('process_templates.id', 'process_templates.name')
            ->get()
            ->map(function ($item) {
                $val = round((float) $item->val, 0);
                return [
                    'label' => $item->label,
                    'val' => $val,
                    'count' => (int) $item->count,
                    'width' => $val . '%'
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $pipeline,
        ]);
    }

    /**
     * Dashboard stats
     */
    public function dashboard()
    {
        $totalOrders = \App\Models\Order::count();
        $inProgress = \App\Models\Order::where('status', 'processing')->count();
        $completed = \App\Models\Order::where('status', 'completed')->count();
        $urgent = \App\Models\Order::where('priority', 'urgent')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_orders' => $totalOrders,
                'in_progress' => $inProgress,
                'completed' => $completed,
                'urgent' => $urgent,
            ]
        ]);
    }
}
