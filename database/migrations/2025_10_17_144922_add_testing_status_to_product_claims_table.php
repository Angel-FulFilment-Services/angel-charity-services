<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('product_claims', function (Blueprint $table) {
            // Update status column to include 'testing' option
            DB::statement("ALTER TABLE product_claims MODIFY COLUMN status ENUM('pending', 'processing', 'completed', 'expired', 'testing') DEFAULT 'pending'");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_claims', function (Blueprint $table) {
            // Remove 'testing' from status enum
            DB::statement("ALTER TABLE product_claims MODIFY COLUMN status ENUM('pending', 'processing', 'completed', 'expired') DEFAULT 'pending'");
        });
    }
};
