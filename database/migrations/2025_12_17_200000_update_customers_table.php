<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            // Make code nullable
            $table->string('code')->nullable()->change();
            
            // Rename brand_name to brand if exists
            if (Schema::hasColumn('customers', 'brand_name')) {
                $table->renameColumn('brand_name', 'brand');
            }
            
            // Add new columns
            if (!Schema::hasColumn('customers', 'email')) {
                $table->string('email')->nullable()->after('brand');
            }
            if (!Schema::hasColumn('customers', 'phone')) {
                $table->string('phone', 50)->nullable()->after('email');
            }
            if (!Schema::hasColumn('customers', 'address')) {
                $table->text('address')->nullable()->after('phone');
            }
        });

        // Remove old contact_info if exists
        if (Schema::hasColumn('customers', 'contact_info')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->dropColumn('contact_info');
            });
        }
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('code')->nullable(false)->change();
            $table->dropColumn(['email', 'phone', 'address']);
            $table->text('contact_info')->nullable();
            if (Schema::hasColumn('customers', 'brand')) {
                $table->renameColumn('brand', 'brand_name');
            }
        });
    }
};
