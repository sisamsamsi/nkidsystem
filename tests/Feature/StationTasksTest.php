<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Tests\TestCase;
use App\Models\User;
use App\Models\ProcessTemplate;
use App\Models\Customer;
use App\Models\Branch;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductionTask;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class, TestCase::class);

test('cutting station sees only cutting tasks', function () {
    // Arrange
    $cutting = ProcessTemplate::create(['name' => 'CUTTING']);
    $sewing = ProcessTemplate::create(['name' => 'SEWING']);

    $customer = Customer::create(['name' => 'ACME', 'code' => 'AC1']);
    $branch = Branch::create(['name' => 'Main']);
    $product = Product::create(['name' => 'Shirt', 'customer_id' => $customer->id]);
    $variant = ProductVariant::create(['product_id' => $product->id, 'name' => 'Default', 'colors' => 'Red', 'sizes' => 'M']);

    $order = Order::create(['po_number' => 'PO-1', 'date' => now()->toDateString(), 'customer_id' => $customer->id, 'branch_id' => $branch->id]);
    $item = OrderItem::create(['order_id' => $order->id, 'product_variant_id' => $variant->id, 'color' => 'Red', 'size' => 'M', 'quantity' => 10]);

    $task1 = ProductionTask::create(['order_item_id' => $item->id, 'process_template_id' => $cutting->id]);
    $task2 = ProductionTask::create(['order_item_id' => $item->id, 'process_template_id' => $sewing->id]);

    $stationCutting = User::create(['name' => 'Amir', 'email' => 'amir@example.test', 'password' => 'password', 'is_station' => true, 'division' => 'Cutting']);

    // Act
    Sanctum::actingAs($stationCutting);
    $response = $this->get('/api/station/tasks', ['Accept' => 'application/json']);

    // Assert
    $response->assertStatus(200);
    $data = $response->json('data');
    expect(collect($data)->pluck('process_template.name')->unique()->all())->toEqual(['CUTTING']);
});

test('admin station sees all tasks', function () {
    // Arrange
    $cutting = ProcessTemplate::create(['name' => 'CUTTING']);
    $sewing = ProcessTemplate::create(['name' => 'SEWING']);

    $customer = Customer::create(['name' => 'ACME', 'code' => 'AC2']);
    $branch = Branch::create(['name' => 'Main']);
    $product = Product::create(['name' => 'Shirt', 'customer_id' => $customer->id]);
    $variant = ProductVariant::create(['product_id' => $product->id, 'name' => 'Default', 'colors' => 'Red', 'sizes' => 'M']);

    $order = Order::create(['po_number' => 'PO-2', 'date' => now()->toDateString(), 'customer_id' => $customer->id, 'branch_id' => $branch->id]);
    $item = OrderItem::create(['order_id' => $order->id, 'product_variant_id' => $variant->id, 'color' => 'Red', 'size' => 'M', 'quantity' => 10]);

    $task1 = ProductionTask::create(['order_item_id' => $item->id, 'process_template_id' => $cutting->id]);
    $task2 = ProductionTask::create(['order_item_id' => $item->id, 'process_template_id' => $sewing->id]);

    $admin = User::create(['name' => 'Admin', 'email' => 'admin@example.test', 'password' => 'password', 'is_station' => true, 'division' => 'Admin']);

    // Act
    Sanctum::actingAs($admin);
    $response = $this->get('/api/station/tasks', ['Accept' => 'application/json']);

    // Assert
    $response->assertStatus(200);
    $data = $response->json('data');
    expect(count($data))->toBe(2);
});
