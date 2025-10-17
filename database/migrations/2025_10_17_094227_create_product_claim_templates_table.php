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
        Schema::create('product_claim_templates', function (Blueprint $table) {
            $table->id();
            $table->string('client_ref', 100)->nullable(); // Client reference identifier
            $table->string('ngn', 100)->nullable(); // NGN field
            $table->string('client_image', 255)->nullable();
            $table->string('client_name', 255)->nullable();
            $table->string('loading_title', 500)->nullable();
            $table->text('loading_message')->nullable();
            $table->string('completed_title', 500)->nullable();
            $table->text('completed_message')->nullable();
            $table->string('expired_title', 500)->nullable();
            $table->text('expired_message')->nullable();
            $table->string('product_title', 500)->nullable();
            $table->text('product_message')->nullable();
            $table->string('product_name', 255)->nullable();
            $table->string('product_image', 500)->nullable();
            $table->string('client_url', 500)->nullable();
            $table->string('contact_url', 500)->nullable();
            $table->string('privacy_url', 500)->nullable();
            $table->string('theme_colour', 20)->nullable(); // Hex/RGB color values
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['client_ref', 'product_name']); // For filtering by client/product
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_claim_templates');
    }
};
