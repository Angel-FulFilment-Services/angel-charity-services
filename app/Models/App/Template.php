<?php

namespace App\Models\App;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\App\Customer;

class Template extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'product_claim_templates';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
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
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'communication_channels' => 'array',
    ];

    /**
     * Get the customers that use this template.
     */
    public function customers()
    {
        return $this->hasMany(Customer::class, 'template_id');
    }
}