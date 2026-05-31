<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QcReport;
use App\Models\ProductionTask;
use Illuminate\Http\Request;

class QcReportController extends Controller
{
    /**
     * Store a new QC report
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'production_task_id' => 'required|exists:production_tasks,id',
            'passed_quantity' => 'required|integer|min:0',
            'reject_quantity' => 'required|integer|min:0',
            'reject_reason' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        // Get inspector from auth
        $inspectorId = $request->user()->id;

        $qcReport = QcReport::create([
            'production_task_id' => $validated['production_task_id'],
            'inspector_id' => $inspectorId,
            'passed_quantity' => $validated['passed_quantity'],
            'reject_quantity' => $validated['reject_quantity'],
            'reject_reason' => json_encode($validated['reject_reason'] ?? []),
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'QC report submitted successfully',
            'data' => $qcReport->load(['task', 'inspector']),
        ], 201);
    }

    /**
     * Get QC reports for a task
     */
    public function index(Request $request)
    {
        $query = QcReport::with(['task.orderItem.order', 'inspector']);

        if ($request->has('production_task_id')) {
            $query->where('production_task_id', $request->production_task_id);
        }

        return response()->json([
            'success' => true,
            'data' => $query->latest()->paginate(20),
        ]);
    }
}
