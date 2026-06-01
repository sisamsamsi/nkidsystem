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

uses(RefreshDatabase::class);

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

test('station is blocked from viewing or logging tasks in another division', function () {
    // Arrange
    $sewing = ProcessTemplate::create(['name' => 'SEWING']);

    $customer = Customer::create(['name' => 'ACME', 'code' => 'AC3']);
    $branch = Branch::create(['name' => 'Main']);
    $product = Product::create(['name' => 'Shirt', 'customer_id' => $customer->id]);
    $variant = ProductVariant::create(['product_id' => $product->id, 'name' => 'Default', 'colors' => 'Red', 'sizes' => 'M']);

    $order = Order::create(['po_number' => 'PO-3', 'date' => now()->toDateString(), 'customer_id' => $customer->id, 'branch_id' => $branch->id]);
    $item = OrderItem::create(['order_id' => $order->id, 'product_variant_id' => $variant->id, 'color' => 'Red', 'size' => 'M', 'quantity' => 10]);

    $task = ProductionTask::create([
        'order_item_id' => $item->id,
        'process_template_id' => $sewing->id,
        'completed_quantity' => 0,
        'progress_percent' => 0,
        'status' => 'pending',
    ]);

    $stationCutting = User::create(['name' => 'Amir2', 'email' => 'amir2@example.test', 'password' => 'password', 'is_station' => true, 'division' => 'Cutting']);

    // Act 1: GET details of a sewing task by cutting station
    Sanctum::actingAs($stationCutting);
    $responseGet = $this->get("/api/station/tasks/{$task->id}", ['Accept' => 'application/json']);

    // Assert 1: Should be 403 Forbidden
    $responseGet->assertStatus(403);

    // Act 2: POST log work on a sewing task by cutting station
    $operator = User::create(['name' => 'Operator', 'email' => 'operator@example.test', 'password' => 'password', 'pin_code' => bcrypt('1234')]);
    $responsePost = $this->postJson("/api/station/tasks/{$task->id}/log", [
        'operator_id' => $operator->id,
        'pin_code' => '1234',
        'quantity' => 2,
    ]);

    // Assert 2: Should be 403 Forbidden
    $responsePost->assertStatus(403);
});
