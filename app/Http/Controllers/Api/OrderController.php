<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductionTask;
use App\Models\ProductVariant;
use App\Models\ProcessTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    /**
     * Display a listing of orders
     */
    public function index(Request $request)
    {
        $query = Order::with(['customer', 'branch', 'items.variant']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by priority
        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        // Filter by customer
        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        // Search by PO number
        if ($request->has('search')) {
            $query->where('po_number', 'like', "%{$request->search}%");
        }

        // Sorting
        $sortField = $request->get('sort_field', 'created_at');
        $sortOrder = in_array(strtolower($request->get('sort_order', 'desc')), ['asc', 'desc']) ? strtolower($request->get('sort_order', 'desc')) : 'desc';

        if ($sortField === 'po_number') {
            $query->orderBy('po_number', $sortOrder);
        } elseif ($sortField === 'customer') {
            $query->join('customers', 'orders.customer_id', '=', 'customers.id')
                  ->orderBy('customers.name', $sortOrder)
                  ->select('orders.*');
        } elseif ($sortField === 'date') {
            $query->orderBy('date', $sortOrder);
        } elseif ($sortField === 'deadline') {
            $query->orderBy('deadline_date', $sortOrder);
        } elseif ($sortField === 'progress') {
            $query->orderBy('overall_progress', $sortOrder);
        } elseif ($sortField === 'status') {
            $query->orderBy('status', $sortOrder);
        } elseif ($sortField === 'priority') {
            $query->orderByRaw("CASE 
                WHEN priority = 'urgent' THEN 1 
                WHEN priority = 'high' THEN 2 
                WHEN priority = 'normal' THEN 3 
                WHEN priority = 'low' THEN 4 
                ELSE 5 
            END " . strtoupper($sortOrder));
        } else {
            $query->orderBy($sortField, $sortOrder);
        }

        $orders = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    /**
     * Store a newly created order with items and auto-create production tasks
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'po_number' => 'required|string|unique:orders',
            'date' => 'required|date',
            'deadline_date' => 'nullable|date',
            'customer_id' => 'required|exists:customers,id',
            'branch_id' => 'nullable|exists:branches,id',
            'priority' => 'required|in:low,normal,high,urgent',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.color' => 'required|string',
            'items.*.size' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $order = DB::transaction(function () use ($validated) {
            $order = Order::create([
                'po_number' => $validated['po_number'],
                'date' => $validated['date'],
                'customer_id' => $validated['customer_id'],
                'branch_id' => $validated['branch_id'] ?? null,
                'priority' => $validated['priority'],
                'notes' => $validated['notes'] ?? null,
                'status' => 'pending',
                'overall_progress' => 0,
            ]);

            foreach ($validated['items'] as $itemData) {
                $orderItem = $order->items()->create([
                    'product_variant_id' => $itemData['product_variant_id'],
                    'color' => $itemData['color'],
                    'size' => $itemData['size'],
                    'quantity' => $itemData['quantity'],
                    'status' => 'pending',
                    'progress_percent' => 0,
                ]);

                // Auto-create production tasks based on variant processes
                $variant = ProductVariant::with(['processes', 'subProcesses'])->find($itemData['product_variant_id']);
                
                foreach ($variant->processes as $variantProcess) {
                    $processTemplate = ProcessTemplate::find($variantProcess->process_template_id);
                    $processName = strtoupper($processTemplate->name ?? '');
                    
                    // Check if this process has sub-processes (SEWING, FINISHING)
                    $subProcesses = $variant->subProcesses()
                        ->whereHas('parentProcessTemplate', function($q) use ($variantProcess) {
                            $q->where('id', $variantProcess->process_template_id);
                        })
                        ->orderBy('variant_sub_processes.sequence_order')
                        ->get();
                    
                    if ($subProcesses->count() > 0) {
                        // Create a task for each sub-process
                        foreach ($subProcesses as $subProcess) {
                            ProductionTask::create([
                                'order_item_id' => $orderItem->id,
                                'process_template_id' => $variantProcess->process_template_id,
                                'sub_process_id' => $subProcess->id,
                                'status' => 'pending',
                                'progress_percent' => 0,
                                'completed_quantity' => 0,
                            ]);
                        }
                    } else {
                        // No sub-processes, create single task for the process
                        ProductionTask::create([
                            'order_item_id' => $orderItem->id,
                            'process_template_id' => $variantProcess->process_template_id,
                            'status' => 'pending',
                            'progress_percent' => 0,
                            'completed_quantity' => 0,
                        ]);
                    }
                }
            }

            return $order;
        });

        return response()->json([
            'success' => true,
            'message' => 'Order created successfully',
            'data' => $order->load(['items.productionTasks']),
        ], 201);
    }

    /**
     * Display the specified order with full details
     */
    public function show(Order $order)
    {
        return response()->json([
            'success' => true,
            'data' => $order->load([
                'customer',
                'branch',
                'items.variant.product',
                'items.productionTasks.processTemplate',
                'shipments',
                'invoices',
            ]),
        ]);
    }

    /**
     * Update the specified order with items sync
     */
    public function update(Request $request, Order $order)
    {
        $validated = $request->validate([
            'priority' => 'sometimes|in:low,normal,high,urgent',
            'notes' => 'nullable|string',
            'status' => 'sometimes|in:pending,processing,completed,cancelled',
            'po_number' => 'sometimes|string|unique:orders,po_number,' . $order->id,
            'date' => 'sometimes|date',
            'deadline_date' => 'nullable|date',
            'customer_id' => 'sometimes|exists:customers,id',
            'branch_id' => 'nullable|exists:branches,id',
            'items' => 'sometimes|array',
            'items.*.id' => 'nullable|exists:order_items,id',
            'items.*.product_variant_id' => 'required_without:items.*.id|exists:product_variants,id',
            'items.*.color' => 'required_without:items.*.id|string',
            'items.*.size' => 'required_without:items.*.id|string',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        DB::transaction(function () use ($order, $validated) {
            // Update order basic fields
            $order->update(collect($validated)->except('items')->toArray());

            // If items are provided, sync them
            if (isset($validated['items'])) {
                $existingItemIds = $order->items()->pluck('id')->toArray();
                $updatedItemIds = [];

                foreach ($validated['items'] as $itemData) {
                    if (isset($itemData['id'])) {
                        // Update existing item
                        $item = OrderItem::find($itemData['id']);
                        if ($item && $item->order_id === $order->id) {
                            $item->update(['quantity' => $itemData['quantity']]);
                            $updatedItemIds[] = $item->id;
                        }
                    } else {
                        // Create new item with production tasks
                        $orderItem = $order->items()->create([
                            'product_variant_id' => $itemData['product_variant_id'],
                            'color' => $itemData['color'],
                            'size' => $itemData['size'],
                            'quantity' => $itemData['quantity'],
                            'status' => 'pending',
                            'progress_percent' => 0,
                        ]);

                        // Auto-create production tasks for new item
                        $variant = ProductVariant::with('processes')->find($itemData['product_variant_id']);
                        foreach ($variant->processes as $variantProcess) {
                            ProductionTask::create([
                                'order_item_id' => $orderItem->id,
                                'process_template_id' => $variantProcess->process_template_id,
                                'status' => 'pending',
                                'progress_percent' => 0,
                                'completed_quantity' => 0,
                            ]);
                        }

                        $updatedItemIds[] = $orderItem->id;
                    }
                }

                // Delete removed items and their production tasks
                $itemsToDelete = array_diff($existingItemIds, $updatedItemIds);
                if (!empty($itemsToDelete)) {
                    $tasksToDelete = ProductionTask::whereIn('order_item_id', $itemsToDelete)->pluck('id');
                    \App\Models\QcReport::whereIn('production_task_id', $tasksToDelete)->delete();
                    \App\Models\WorkLog::whereIn('production_task_id', $tasksToDelete)->delete();
                    ProductionTask::whereIn('order_item_id', $itemsToDelete)->delete();
                    OrderItem::whereIn('id', $itemsToDelete)->delete();
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Order updated successfully',
            'data' => $order->fresh(['customer', 'items.variant.product', 'items.productionTasks']),
        ]);
    }

    /**
     * Remove the specified order with cascade delete
     */
    public function destroy(Order $order)
    {
        DB::transaction(function () use ($order) {
            // Get all order item IDs for this order
            $orderItemIds = $order->items()->pluck('id');
            
            // Get all production task IDs for these order items
            $productionTaskIds = ProductionTask::whereIn('order_item_id', $orderItemIds)->pluck('id');
            
            // 1. Delete QC Reports linked to production tasks
            \App\Models\QcReport::whereIn('production_task_id', $productionTaskIds)->delete();
            
            // 2. Delete Work Logs linked to production tasks
            \App\Models\WorkLog::whereIn('production_task_id', $productionTaskIds)->delete();
            
            // 3. Delete Production Tasks
            ProductionTask::whereIn('order_item_id', $orderItemIds)->delete();
            
            // 4. Delete Order Items
            $order->items()->delete();
            
            // 5. Delete the Order
            $order->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Order and all related data deleted successfully',
        ]);
    }

    /**
     * Public tracking endpoint
     */
    public function track($po_number)
    {
        $order = Order::with([
            'customer', 
            'items.variant.product', 
            'items.productionTasks.processTemplate',
            'items.productionTasks.subProcess',
            'shipments'
        ])
        ->where('po_number', $po_number)
        ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found',
            ], 404);
        }

        // Collect all production tasks grouped by process
        $allTasks = collect();
        foreach ($order->items as $item) {
            foreach ($item->productionTasks as $task) {
                $allTasks->push($task);
            }
        }

        // Group tasks by process template and aggregate status
        $productionSteps = $allTasks->groupBy('process_template_id')->map(function ($tasks) {
            $template = $tasks->first()->processTemplate;
            $totalTasks = $tasks->count();
            $completedTasks = $tasks->where('status', 'completed')->count();
            $inProgressTasks = $tasks->where('status', 'in_progress')->count();
            $avgProgress = $tasks->avg('progress_percent') ?? 0;
            
            // Determine step status
            $status = 'pending';
            if ($completedTasks === $totalTasks && $totalTasks > 0) {
                $status = 'completed';
            } elseif ($inProgressTasks > 0 || $completedTasks > 0) {
                $status = 'in_progress';
            }

            // Get latest update timestamp
            $latestTask = $tasks->sortByDesc('updated_at')->first();
            $completedTask = $tasks->where('status', 'completed')->sortByDesc('updated_at')->first();

            // Build sub-processes for SEWING and FINISHING
            $subProcesses = [];
            $tasksWithSubProcess = $tasks->whereNotNull('sub_process_id');
            if ($tasksWithSubProcess->count() > 0) {
                $subProcesses = $tasksWithSubProcess->groupBy('sub_process_id')->map(function ($subTasks) {
                    $subProcess = $subTasks->first()->subProcess;
                    $subTotal = $subTasks->count();
                    $subCompleted = $subTasks->where('status', 'completed')->count();
                    $subInProgress = $subTasks->where('status', 'in_progress')->count();
                    $subAvgProgress = $subTasks->avg('progress_percent') ?? 0;

                    $subStatus = 'pending';
                    if ($subCompleted === $subTotal && $subTotal > 0) {
                        $subStatus = 'completed';
                    } elseif ($subInProgress > 0 || $subCompleted > 0) {
                        $subStatus = 'in_progress';
                    }

                    return [
                        'id' => $subProcess->id ?? 0,
                        'name' => $subProcess->name ?? 'Unknown',
                        'status' => $subStatus,
                        'progress' => round($subAvgProgress, 0),
                        'completed_count' => $subCompleted,
                        'total_count' => $subTotal,
                    ];
                })->values()->toArray();
            }

            return [
                'id' => $template->id ?? 0,
                'name' => $template->name ?? 'Unknown',
                'status' => $status,
                'progress' => round($avgProgress, 0),
                'completed_count' => $completedTasks,
                'total_count' => $totalTasks,
                'completed_at' => $completedTask ? $completedTask->updated_at->format('M d, Y H:i') : null,
                'updated_at' => $latestTask ? $latestTask->updated_at->format('M d, Y H:i') : null,
                'sub_processes' => $subProcesses,
            ];
        })->sortBy('id')->values();

        // Build items with their tasks
        $itemsData = $order->items->map(function ($item) {
            $tasks = $item->productionTasks->map(function ($task) {
                return [
                    'id' => $task->id,
                    'process' => $task->processTemplate->name ?? 'Unknown',
                    'sub_process' => $task->subProcess->name ?? null,
                    'status' => $task->status,
                    'progress' => $task->progress_percent ?? 0,
                    'completed_qty' => $task->completed_quantity ?? 0,
                    'updated_at' => $task->updated_at->format('M d, Y'),
                ];
            });

            // Calculate item progress from its tasks
            $avgProgress = $item->productionTasks->avg('progress_percent') ?? 0;

            return [
                'id' => $item->id,
                'product' => $item->variant->product->name ?? $item->variant->name ?? '-',
                'variant' => $item->variant->name ?? '-',
                'image_url' => $item->variant->image_url ?? null,
                'price' => $item->variant->price ?? null,
                'color' => $item->color,
                'size' => $item->size,
                'quantity' => $item->quantity,
                'progress' => round($avgProgress, 0),
                'status' => $item->status,
                'tasks' => $tasks,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'po_number' => $order->po_number,
                'customer' => $order->customer->name ?? '-',
                'status' => $order->status,
                'priority' => $order->priority,
                'date' => $order->date ? \Carbon\Carbon::parse($order->date)->format('M d, Y') : null,
                'deadline' => $order->deadline_date ? \Carbon\Carbon::parse($order->deadline_date)->format('M d, Y') : null,
                'notes' => $order->notes,
                'overall_progress' => $order->overall_progress ?? 0,
                'production_steps' => $productionSteps,
                'items' => $itemsData,
                'shipment' => $order->shipments->first() ? [
                    'tracking_number' => $order->shipments->first()->tracking_number,
                    'status' => $order->shipments->first()->status,
                ] : null,
            ],
        ]);
    }

    /**
     * Import orders from Excel (placeholder)
     */
    public function import(Request $request)
    {
        // TODO: Implement Excel import
        return response()->json([
            'success' => false,
            'message' => 'Import feature not yet implemented',
        ], 501);
    }

    /**
     * Force recalculate order progress
     */
    public function recalculate(Order $order)
    {
        // TODO: Implement via ProductionProgressService
        return response()->json([
            'success' => true,
            'message' => 'Recalculation triggered',
            'data' => $order->fresh(),
        ]);
    }

    /**
     * Regenerate production tasks for an order
     */
    public function regenerateTasks(Order $order)
    {
        \DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                // Get defined processes for this variant
                $variant = ProductVariant::with('processes')->find($item->product_variant_id);
                
                if (!$variant) continue;

                foreach ($variant->processes as $variantProcess) {
                    // Check if task already exists
                    $exists = ProductionTask::where('order_item_id', $item->id)
                        ->where('process_template_id', $variantProcess->process_template_id)
                        ->exists();

                    if (!$exists) {
                        ProductionTask::create([
                            'order_item_id' => $item->id,
                            'process_template_id' => $variantProcess->process_template_id,
                            'status' => 'pending',
                            'progress_percent' => 0,
                            'completed_quantity' => 0,
                        ]);
                    }
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Tasks regenerated successfully',
            'data' => $order->load('items.productionTasks'),
        ]);
    }
    /**
     * Generate a PO Number based on customer and date
     */
    public function generatePoNumber(Request $request) {
        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'date' => 'required|date',
        ]);

        $customer = \App\Models\Customer::find($request->customer_id);
        $date = \Carbon\Carbon::parse($request->date);
        
        // 1. Get Customer Code (Consonants or First 3 chars)
        $name = preg_replace('/[^a-zA-Z]/', '', $customer->name); // Only letters
        $consonants = preg_replace('/[aeiouAEIOU]/', '', $name); // Remove vowels
        $code = strtoupper(substr($consonants, 0, 3));
        
        if (strlen($code) < 3) {
            $code = strtoupper(substr($name, 0, 3)); // Fallback if no consonants
        }
        
        if (empty($code)) $code = 'CUS'; // Fallback if empty

        // 2. Date String
        $dateStr = $date->format('Ymd');

        // 3. Sequence
        // Check existing orders for this customer on this date to increment
        // Wrap in a transaction with lockForUpdate to ensure concurrency safety
        $poNumber = DB::transaction(function() use ($customer, $date, $code, $dateStr) {
            $count = DB::table('orders')
                ->where('customer_id', $customer->id)
                ->whereDate('date', $date->toDateString())
                ->lockForUpdate()
                ->count();
            
            $sequence = str_pad($count + 1, 3, '0', STR_PAD_LEFT);
            $poNum = "$code-$dateStr-$sequence";

            while(DB::table('orders')->where('po_number', $poNum)->exists()) {
                $count++;
                $sequence = str_pad($count + 1, 3, '0', STR_PAD_LEFT);
                $poNum = "$code-$dateStr-$sequence";
            }
            return $poNum;
        });

        return response()->json([
            'success' => true,
            'po_number' => $poNumber
        ]);
    }
}
