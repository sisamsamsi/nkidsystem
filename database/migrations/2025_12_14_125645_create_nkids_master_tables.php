<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('location')->nullable();
            $table->timestamps();
        });

        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('brand_name')->nullable();
            $table->text('contact_info')->nullable();
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('customer_id')->constrained('customers')->onDelete('restrict');
            $table->string('style_code')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->string('name');
            $table->text('colors'); // Comma separated
            $table->text('sizes'); // Comma separated
            $table->timestamps();
        });

        Schema::create('process_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('default_weight')->default(0);
            $table->boolean('parallel_allowed')->default(false);
            $table->timestamps();
        });

        Schema::create('variant_processes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_variant_id')->constrained('product_variants')->onDelete('cascade');
            $table->foreignId('process_template_id')->constrained('process_templates')->onDelete('restrict');
            $table->integer('weight');
            $table->integer('sequence_order');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('variant_processes');
        Schema::dropIfExists('process_templates');
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('products');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('branches');
    }
};
