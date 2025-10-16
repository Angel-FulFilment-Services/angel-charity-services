<?php

namespace App\Models\App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Casts\EncryptedWithCustomKey;

class Customer extends Model
{
    use HasFactory;

    // Use the product_claims table
    protected $table = 'product_claims';

    protected $fillable = [
        'guid',
        'client_ref',
        'ngn',
        'client_image',
        'client_name',
        'loading_title',
        'loading_message',
        'completed_title',
        'completed_message',
        'expired_title',
        'expired_message',
        'product_title',
        'product_message',
        'product_name',
        'product_image',
        'client_url',
        'contact_url',
        'privacy_url',
        'theme_colour',
        'communication_channels',
        'privacy_notice',
        'title',
        'first_name',
        'surname',
        'address_line1',
        'address_line2',
        'address_line3',
        'city',
        'county',
        'postcode',
        'country',
        'communication_preferences',
        'status',
        'submitted_at',
        'processed_at',
        'notes'
    ];

    protected $casts = [
        // Date fields
        'submitted_at' => 'datetime',
        'processed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        
        // JSON fields
        'communication_channels' => 'array',
    ];

    /**
     * Get the casts array with conditional encryption based on environment
     */
    public function getCasts(): array
    {
        $casts = parent::getCasts();
        
        // Only encrypt PI in production environment
        if (app()->environment('production')) {
            $encryptedFields = [
                'title',
                'first_name', 
                'surname',
                'address_line1',
                'address_line2', 
                'address_line3',
                'city',
                'county',
                'postcode',
                'country',
            ];
            
            foreach ($encryptedFields as $field) {
                $casts[$field] = EncryptedWithCustomKey::class;
            }
        } else {
            // In non-production, cast communication_preferences as array
            $casts['communication_preferences'] = 'array';
        }
        
        return $casts;
    }

    /**
     * Get the customer's full name
     */
    public function getFullNameAttribute()
    {
        return trim($this->title . ' ' . $this->first_name . ' ' . $this->surname);
    }

    /**
     * Get the customer's full address
     */
    public function getFullAddressAttribute()
    {
        $addressParts = array_filter([
            $this->address_line1,
            $this->address_line2,
            $this->address_line3,
            $this->city,
            $this->county,
            $this->postcode,
            $this->country
        ]);

        return implode(', ', $addressParts);
    }

    /**
     * Scope to find by GUID
     */
    public function scopeByGuid($query, $guid)
    {
        return $query->where('guid', $guid);
    }

    /**
     * Scope to find by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to find by client
     */
    public function scopeByClient($query, $clientName)
    {
        return $query->where('client_name', $clientName);
    }

    /**
     * Check if the claim has expired (you can add expiry logic here)
     */
    public function isExpired()
    {
        return $this->status === 'expired';
    }

    /**
     * Check if the claim is completed
     */
    public function isCompleted()
    {
        return $this->status === 'completed';
    }

    /**
     * Mark claim as submitted
     */
    public function markAsSubmitted()
    {
        $this->update([
            'status' => 'processing',
            'submitted_at' => now()
        ]);
    }

    /**
     * Mark claim as completed
     */
    public function markAsCompleted()
    {
        $this->update([
            'status' => 'completed',
            'processed_at' => now()
        ]);
    }

    /**
     * Mark claim as expired
     */
    public function markAsExpired()
    {
        $this->update([
            'status' => 'expired'
        ]);
    }
}
