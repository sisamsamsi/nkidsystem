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
        $totalRequired = $task->orderItem->quantity;
        return max(0, $totalRequired - $task->completed_quantity);
    }

    /**
     * Check if a task can be worked on (sequential visibility)
     * A task can only be worked on if all previous sequence tasks are completed
     */
    public function canWorkOnTask(ProductionTask $task): bool
    {
        $orderItem = $task->orderItem;
        $variant = $orderItem->variant;

        // Get this task's sequence order
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

        // Filter by sequential visibility
        return $tasks->filter(fn($task) => $this->canWorkOnTask($task));
    }

    /**
     * Calculate weighted progress for an order item
     */
    public function calculateOrderItemProgress(OrderItem $orderItem): int
    {
        $tasks = $orderItem->productionTasks;
        
        if ($tasks->isEmpty()) {
            return 0;
        }

        $totalWeight = 0;
        $weightedProgress = 0;

        foreach ($tasks as $task) {
            $variantProcess = VariantProcess::where('product_variant_id', $orderItem->product_variant_id)
                ->where('process_template_id', $task->process_template_id)
                ->first();

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
