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
            // Add privacy notice field after communication_channels
            $table->text('privacy_notice')->nullable()->after('communication_channels');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_claims', function (Blueprint $table) {
            $table->dropColumn('privacy_notice');
        });
    }
};
