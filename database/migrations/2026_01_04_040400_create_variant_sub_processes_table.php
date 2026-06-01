<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('variant_sub_processes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_variant_id')->constrained('product_variants')->onDelete('cascade');
            $table->foreignId('sub_process_id')->constrained('sub_processes')->onDelete('cascade');
            $table->integer('sequence_order')->default(1);
            $table->integer('weight')->default(1);
            $table->timestamps();
            
            $table->unique(['product_variant_id', 'sub_process_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('variant_sub_processes');
    }
};
