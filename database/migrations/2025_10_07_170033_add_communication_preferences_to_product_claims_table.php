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
            // Add communication channels field to store array of channel configurations
            $table->json('communication_channels')->nullable()->after('theme_colour'); // JSON column for channel configurations
            
            // Add communication preferences field to store selected user preferences (encrypted)
            $table->json('communication_preferences')->nullable()->after('country'); // AES encrypted user selections
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_claims', function (Blueprint $table) {
            $table->dropColumn(['communication_channels', 'communication_preferences']);
        });
    }
};
