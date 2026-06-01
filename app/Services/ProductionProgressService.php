<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductionTask;
use App\Models\VariantProcess;

class ProductionProgressService
{
    /**
     * Get remaining quantity for a task
     */
    public function getRemainingQuantity(ProductionTask $task): int
    {
        $orderItem = $task->orderItem;
        if (!$orderItem) {
            return 0;
        }
        $totalRequired = $orderItem->quantity;
        return max(0, $totalRequired - $task->completed_quantity);
    }

    /**
     * Check if a task can be worked on (sequential visibility)
     * A task can only be worked on if all previous sequence tasks are completed
     */
    public function canWorkOnTask(ProductionTask $task, $variantProcesses = null, $incompleteTasks = null): bool
    {
        $orderItem = $task->orderItem;
        if (!$orderItem) {
            return false;
        }
        $variant = $orderItem->variant;
        if (!$variant) {
            return true;
        }

        // If pre-fetched collections are provided, use them to avoid DB queries (N+1 avoidance)
        if ($variantProcesses !== null && $incompleteTasks !== null) {
            $variantProcessesForVar = $variantProcesses->get($variant->id) ?? collect();
            
            $currentProcess = $variantProcessesForVar
                ->where('process_template_id', $task->process_template_id)
                ->first();

            if (!$currentProcess) {
                return true;
            }

            $previousProcessTemplateIds = $variantProcessesForVar
                ->where('sequence_order', '<', $currentProcess->sequence_order)
                ->pluck('process_template_id')
                ->toArray();

            if (empty($previousProcessTemplateIds)) {
                return true;
            }

            $incompleteTasksForOrder = $incompleteTasks->get($orderItem->id) ?? collect();
            
            $incompletePreviousTasks = $incompleteTasksForOrder
                ->whereIn('process_template_id', $previousProcessTemplateIds)
                ->isNotEmpty();

            return !$incompletePreviousTasks;
        }

        // Fallback to standard DB queries if not pre-fetched (keeping signature compatible)
        $currentProcess = VariantProcess::where('product_variant_id', $variant->id)
            ->where('process_template_id', $task->process_template_id)
            ->first();

        if (!$currentProcess) {
            return true; // If no sequence defined, allow work
        }

        // Get all previous sequence tasks
        $previousProcesses = VariantProcess::where('product_variant_id', $variant->id)
            ->where('sequence_order', '<', $currentProcess->sequence_order)
            ->pluck('process_template_id');

        if ($previousProcesses->isEmpty()) {
            return true; // This is the first task
        }

        // Check if all previous tasks are completed
        $incompletePreviousTasks = ProductionTask::where('order_item_id', $orderItem->id)
            ->whereIn('process_template_id', $previousProcesses)
            ->where('status', '!=', 'completed')
            ->exists();

        return !$incompletePreviousTasks;
    }

    /**
     * Get all workable tasks for a specific process (station)
     */
    public function getWorkableTasks(int $processTemplateId): \Illuminate\Database\Eloquent\Collection
    {
        $tasks = ProductionTask::with(['orderItem.order', 'orderItem.variant.product'])
            ->where('process_template_id', $processTemplateId)
            ->where('status', '!=', 'completed')
            ->get();

        if ($tasks->isEmpty()) {
            return $tasks;
        }

        // Extract IDs for bulk pre-fetching (Avoiding N+1 queries!)
        $variantIds = $tasks->pluck('orderItem.product_variant_id')->unique()->filter()->toArray();
        $orderItemIds = $tasks->pluck('order_item_id')->unique()->filter()->toArray();

        // Fetch variant processes and incomplete tasks in bulk
        $variantProcesses = VariantProcess::whereIn('product_variant_id', $variantIds)
            ->get()
            ->groupBy('product_variant_id');

        $incompleteTasksByOrderItem = ProductionTask::whereIn('order_item_id', $orderItemIds)
            ->where('status', '!=', 'completed')
            ->get()
            ->groupBy('order_item_id');

        // Filter by sequential visibility
        return $tasks->filter(fn($task) => $this->canWorkOnTask($task, $variantProcesses, $incompleteTasksByOrderItem));
    }

    /**
     * Calculate weighted progress for an order item
     */
    public function calculateOrderItemProgress(OrderItem $orderItem): int
    {
        $tasks = $orderItem->productionTasks()->get();
        
        if ($tasks->isEmpty()) {
            return 0;
        }

        $totalWeight = 0;
        $weightedProgress = 0;

        // Optimasi N+1 Queries: pre-fetch variant processes
        $variantProcesses = VariantProcess::where('product_variant_id', $orderItem->product_variant_id)
            ->get()
            ->keyBy('process_template_id');

        foreach ($tasks as $task) {
            $variantProcess = $variantProcesses->get($task->process_template_id);
            $weight = $variantProcess ? $variantProcess->weight : 1;
            $totalWeight += $weight;
            $weightedProgress += ($task->progress_percent * $weight);
        }

        return $totalWeight > 0 ? round($weightedProgress / $totalWeight) : 0;
    }

    /**
     * Calculate overall order progress
     */
    public function calculateOrderProgress(Order $order): int
    {
        $items = $order->items;
        
        if ($items->isEmpty()) {
            return 0;
        }

        return round($items->avg('progress_percent'));
    }

    /**
     * Get production statistics for dashboard
     */
    public function getDashboardStats(): array
    {
        return [
            'total_orders' => Order::count(),
            'pending_orders' => Order::where('status', 'pending')->count(),
            'processing_orders' => Order::where('status', 'processing')->count(),
            'completed_orders' => Order::where('status', 'completed')->count(),
            'urgent_orders' => Order::where('priority', 'urgent')
                ->whereIn('status', ['pending', 'processing'])
                ->count(),
            'total_tasks' => ProductionTask::count(),
            'tasks_in_progress' => ProductionTask::where('status', 'in_progress')->count(),
            'tasks_completed_today' => ProductionTask::whereDate('end_date', today())->count(),
        ];
    }
}
