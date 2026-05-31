<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('po_number')->unique();
            $table->date('date');
            $table->foreignId('customer_id')->constrained('customers');
            $table->foreignId('branch_id')->constrained('branches');
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            $table->enum('status', ['pending', 'processing', 'completed', 'cancelled'])->default('pending');
            $table->text('notes')->nullable();
            $table->integer('overall_progress')->default(0);
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->foreignId('product_variant_id')->constrained('product_variants');
            $table->string('color');
            $table->string('size');
            $table->integer('quantity');
            $table->enum('status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->integer('progress_percent')->default(0);
            $table->timestamps();
        });

        Schema::create('production_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_item_id')->constrained('order_items')->onDelete('cascade');
            $table->foreignId('process_template_id')->constrained('process_templates');
            $table->enum('status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->integer('progress_percent')->default(0);
            $table->integer('completed_quantity')->default(0);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();
        });

        Schema::create('work_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_task_id')->constrained('production_tasks')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users');
            $table->integer('quantity');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('task_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_task_id')->constrained('production_tasks');
            $table->foreignId('user_id')->constrained('users');
            $table->date('assigned_date');
            $table->date('completed_date')->nullable();
            $table->timestamps();
        });

        Schema::create('qc_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_task_id')->constrained('production_tasks');
            $table->foreignId('inspector_id')->constrained('users');
            $table->integer('passed_quantity');
            $table->integer('reject_quantity');
            $table->text('reject_reason')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders');
            $table->string('tracking_number')->nullable();
            $table->date('shipped_date');
            $table->enum('status', ['pending', 'shipped', 'delivered'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders');
            $table->string('invoice_number')->unique();
            $table->date('issue_date');
            $table->date('due_date');
            $table->decimal('total_amount', 15, 2);
            $table->enum('status', ['draft', 'sent', 'paid', 'overdue'])->default('draft');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('shipments');
        Schema::dropIfExists('qc_reports');
        Schema::dropIfExists('task_assignments');
        Schema::dropIfExists('work_logs');
        Schema::dropIfExists('production_tasks');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
