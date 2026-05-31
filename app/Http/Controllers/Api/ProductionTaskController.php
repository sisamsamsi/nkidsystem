<?php

namespace App\Http\Controllers\Api;

use App\Actions\LogWorkAction;
use App\Http\Controllers\Controller;
use App\Models\ProductionTask;
use Illuminate\Http\Request;

class ProductionTaskController extends Controller
{
    /**
     * Display production tasks (Kanban board data)
     */
    public function index(Request $request)
    {
        $query = ProductionTask::with([
            'orderItem.order',
            'orderItem.variant.product',
            'processTemplate',
        ]);

        // Filter by process
        if ($request->has('process_template_id')) {
            $query->where('process_template_id', $request->process_template_id);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by order priority
        if ($request->has('priority') && $request->priority !== 'all') {
            $query->whereHas('orderItem.order', function ($q) use ($request) {
                $q->where('priority', $request->priority);
            });
        }

        // Search by PO Number or Product Name
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('orderItem.order', function($sq) use ($search) {
                    $sq->where('po_number', 'like', "%{$search}%");
                })
                ->orWhereHas('orderItem.variant.product', function($sq) use ($search) {
                    $sq->where('name', 'like', "%{$search}%");
                });
            });
        }

        // Sorting
        $sortField = $request->get('sort_field', 'priority');
        $sortOrder = in_array(strtolower($request->get('sort_order', 'asc')), ['asc', 'desc']) ? strtolower($request->get('sort_order', 'asc')) : 'asc';

        if ($request->get('sort') === 'recent' || $sortField === 'updated_at') {
            $query->latest();
        } elseif ($sortField === 'po_number') {
            $query->join('order_items', 'production_tasks.order_item_id', '=', 'order_items.id')
                  ->join('orders', 'order_items.order_id', '=', 'orders.id')
                  ->orderBy('orders.po_number', $sortOrder)
                  ->select('production_tasks.*');
        } elseif ($sortField === 'product_name') {
            $query->join('order_items', 'production_tasks.order_item_id', '=', 'order_items.id')
                  ->join('product_variants', 'order_items.product_variant_id', '=', 'product_variants.id')
                  ->join('products', 'product_variants.product_id', '=', 'products.id')
                  ->orderBy('products.name', $sortOrder)
                  ->select('production_tasks.*');
        } elseif ($sortField === 'station') {
            $query->join('process_templates', 'production_tasks.process_template_id', '=', 'process_templates.id')
                  ->orderBy('process_templates.name', $sortOrder)
                  ->select('production_tasks.*');
        } elseif ($sortField === 'progress') {
            $query->orderBy('progress_percent', $sortOrder);
        } elseif ($sortField === 'priority') {
            // Default: Order by priority (urgent first)
            $query->join('order_items', 'production_tasks.order_item_id', '=', 'order_items.id')
                  ->join('orders', 'order_items.order_id', '=', 'orders.id')
                  ->orderByRaw("CASE 
                      WHEN orders.priority = 'urgent' THEN 1 
                      WHEN orders.priority = 'high' THEN 2 
                      WHEN orders.priority = 'normal' THEN 3 
                      WHEN orders.priority = 'low' THEN 4 
                      ELSE 5 
                  END ASC")
                  ->select('production_tasks.*');
        } else {
            $query->orderBy($sortField, $sortOrder);
        }

        $tasks = $query->paginate($request->get('per_page', 50));

        return response()->json([
            'success' => true,
            'data' => $tasks,
        ]);
    }

    /**
     * Display the specified task
     */
    public function show(ProductionTask $productionTask)
    {
        return response()->json([
            'success' => true,
            'data' => $productionTask->load([
                'orderItem.order',
                'orderItem.variant.product',
                'processTemplate',
                'workLogs.user',
            ]),
        ]);
    }

    /**
     * Update task status
     */
    public function update(Request $request, ProductionTask $productionTask)
    {
        $validated = $request->validate([
            'status' => 'sometimes|in:pending,in_progress,completed',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        $productionTask->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Task updated successfully',
            'data' => $productionTask,
        ]);
    }

    /**
     * Log work on a production task (CRITICAL - Uses LogWorkAction)
     */
    public function logWork(Request $request, $id, LogWorkAction $action)
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        try {
            $result = $action->execute(
                $id,
                auth()->id(),
                $validated['quantity'],
                $validated['notes'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Work logged successfully',
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}

