<?php

namespace App\Actions;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductionTask;
use App\Models\VariantProcess;

class RecalculateProgressAction
{
    /**
     * Recalculate progress for a production task's parent order item and order
     * This is called asynchronously via event listener
     *
     * @param ProductionTask $task
     * @return void
     */
    public function execute(ProductionTask $task): void
    {
        $orderItem = $task->orderItem;
        
        if (!$orderItem) {
            return;
        }

        // Recalculate order item progress (weighted)
        $this->recalculateOrderItemProgress($orderItem);

        // Recalculate order overall progress
        $this->recalculateOrderProgress($orderItem->order);
    }

    /**
     * Recalculate order item progress using weighted average
     */
    private function recalculateOrderItemProgress(OrderItem $orderItem): void
    {
        $tasks = $orderItem->productionTasks;
        
        if ($tasks->isEmpty()) {
            return;
        }

        $totalWeight = 0;
        $weightedProgress = 0;

        foreach ($tasks as $task) {
            // Get weight from variant_processes
            $variantProcess = VariantProcess::where('product_variant_id', $orderItem->product_variant_id)
                ->where('process_template_id', $task->process_template_id)
                ->first();

            $weight = $variantProcess ? $variantProcess->weight : 1;
            $totalWeight += $weight;
            $weightedProgress += ($task->progress_percent * $weight);
        }

        // Calculate weighted average
        $progress = $totalWeight > 0 ? round($weightedProgress / $totalWeight) : 0;

        // Update status
        $status = 'pending';
        if ($progress >= 100) {
            $status = 'completed';
        } elseif ($progress > 0) {
            $status = 'in_progress';
        }

        // Update order item (snapshot)
        $orderItem->update([
            'progress_percent' => $progress,
            'status' => $status,
        ]);
    }

    /**
     * Recalculate order overall progress
     */
    private function recalculateOrderProgress(Order $order): void
    {
        $items = $order->items()->get();
        
        if ($items->isEmpty()) {
            return;
        }

        // Calculate average progress of all items
        $totalProgress = $items->sum('progress_percent');
        $averageProgress = round($totalProgress / $items->count());

        // Determine order status
        $status = 'pending';
        $allCompleted = $items->every(fn($item) => $item->status === 'completed');
        $anyInProgress = $items->contains(fn($item) => $item->status === 'in_progress');

        if ($allCompleted) {
            $status = 'completed';
        } elseif ($anyInProgress || $averageProgress > 0) {
            $status = 'processing';
        }

        // Update order (snapshot)
        $order->update([
            'overall_progress' => $averageProgress,
            'status' => $status,
        ]);
    }

    /**
     * Force recalculate entire order (for manual trigger)
     */
    public function recalculateOrder(Order $order): Order
    {
        foreach ($order->items as $item) {
            $this->recalculateOrderItemProgress($item);
        }

        $this->recalculateOrderProgress($order->fresh());

        return $order->fresh();
    }
}
