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
        Schema::create('product_claims', function (Blueprint $table) {
            $table->id();
            $table->uuid('guid')->unique(); // For temporary link generation
            
            // Unencrypted configuration fields
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
            
            // AES encrypted form data fields (wide enough for encrypted content)
            $table->text('title')->nullable(); // AES encrypted title (Mr, Mrs, etc.)
            $table->text('first_name')->nullable(); // AES encrypted first name
            $table->text('surname')->nullable(); // AES encrypted surname
            $table->text('address_line1')->nullable(); // AES encrypted address line 1
            $table->text('address_line2')->nullable(); // AES encrypted address line 2
            $table->text('address_line3')->nullable(); // AES encrypted address line 3
            $table->text('city')->nullable(); // AES encrypted city
            $table->text('county')->nullable(); // AES encrypted county
            $table->text('postcode')->nullable(); // AES encrypted postcode
            $table->text('country')->nullable(); // AES encrypted country
            
            // Status and tracking fields
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'expired'])->default('pending');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->text('notes')->nullable(); // For admin notes or processing information
            
            $table->timestamps();
            
            // Indexes for performance
            $table->index('guid');
            $table->index('status');
            $table->index('submitted_at');
            $table->index(['client_name', 'product_name']); // For filtering by client/product
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_claims');
    }
};
