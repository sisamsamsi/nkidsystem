<?php

namespace App\Actions;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductionTask;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;

class CreateOrderAction
{
    /**
     * Create order with items and auto-generate production tasks
     *
     * @param array $orderData
     * @param array $items
     * @return Order
     */
    public function execute(array $orderData, array $items): Order
    {
        return DB::transaction(function () use ($orderData, $items) {
            // Create order
            $order = Order::create([
                'po_number' => $orderData['po_number'],
                'date' => $orderData['date'],
                'deadline_date' => $orderData['deadline_date'] ?? null,
                'customer_id' => $orderData['customer_id'],
                'branch_id' => $orderData['branch_id'] ?? null,
                'priority' => $orderData['priority'] ?? 'normal',
                'notes' => $orderData['notes'] ?? null,
                'status' => 'pending',
                'overall_progress' => 0,
            ]);

            // Create order items with production tasks
            foreach ($items as $itemData) {
                $orderItem = $this->createOrderItem($order, $itemData);
                $this->createProductionTasks($orderItem, $itemData['product_variant_id']);
            }

            return $order->load(['items.productionTasks.processTemplate']);
        });
    }

    /**
     * Create order item
     */
    private function createOrderItem(Order $order, array $itemData): OrderItem
    {
        return $order->items()->create([
            'product_variant_id' => $itemData['product_variant_id'],
            'color' => $itemData['color'],
            'size' => $itemData['size'],
            'quantity' => $itemData['quantity'],
            'status' => 'pending',
            'progress_percent' => 0,
        ]);
    }

    /**
     * Auto-create production tasks based on variant processes
     */
    private function createProductionTasks(OrderItem $orderItem, int $variantId): void
    {
        $variant = ProductVariant::with('processes')->find($variantId);

        if (!$variant || $variant->processes->isEmpty()) {
            return;
        }

        foreach ($variant->processes as $variantProcess) {
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
