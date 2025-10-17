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
        Schema::table('product_claims', function (Blueprint $table) {
            // Add temporary image path fields for preview functionality
            $table->string('product_image_path', 1000)->nullable()->after('product_image');
            $table->string('client_image_path', 1000)->nullable()->after('client_image');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_claims', function (Blueprint $table) {
            $table->dropColumn(['product_image_path', 'client_image_path']);
        });
    }
};
