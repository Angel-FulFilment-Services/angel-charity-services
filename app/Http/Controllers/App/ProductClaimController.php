<?php

namespace App\Http\Controllers\App;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\Controller;
use App\Models\App\Customer;
use Illuminate\Support\Facades\URL;
use AshAllenDesign\ShortURL\Facades\ShortURL;
use Illuminate\Support\Facades\Log;

class ProductClaimController extends Controller
{
    /**
     * Display the product claim form
     */
    public function show($guid, Request $request)
    {
        try {
            // Validate GUID format
            if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $guid)) {
                abort(400, 'Invalid GUID format');
            }

            // Check if request has valid signature (temporary signed URL)
            if (!$request->hasValidSignature()) {
                Log::warning('Invalid signature for product claim', ['guid' => $guid]);
                // TODO: return redirect()->route('claim_expired', $guid);
                abort(403, 'Invalid or expired link');
            }

            // Find customer by GUID
            $customer = Customer::where('guid', $guid)->first();

            if (!$customer) {
                Log::warning('Customer not found for GUID', ['guid' => $guid]);
                // TODO: return redirect()->route('claim_not_found', $guid);
                abort(404, 'Claim not found');
            }

            // Check if customer record is expired or completed
            if ($customer->status === 'expired') {
                Log::info('Attempted access to expired claim', ['guid' => $guid]);
                
                // Load expired page data
                $expiredData = [
                    'guid' => $customer->guid,
                    'client_image' => $customer->client_image,
                    'client_name' => $customer->client_name,
                    'expired_title' => $customer->expired_title,
                    'expired_message' => $customer->expired_message,
                    'client_url' => $customer->client_url,
                    'contact_url' => $customer->contact_url,
                    'theme_colour' => $customer->theme_colour,
                    'status' => 'expired'
                ];
                
                // TODO: return Inertia::render('ProductExpired', $expiredData);
                abort(410, 'This claim link has expired');
            }

            // Prepare claim data for the form
            $claimData = [
                'guid' => $customer->guid,
                'title' => $customer->title,
                'surname' => $customer->surname,
                'client_image' => $customer->client_image,
                'client_name' => $customer->client_name,
                'loading_title' => $customer->loading_title,
                'loading_message' => $customer->loading_message,
                'completed_title' => $customer->completed_title,
                'completed_message' => $customer->completed_message,
                'expired_title' => $customer->expired_title,
                'expired_message' => $customer->expired_message,
                'product_title' => $customer->product_title,
                'product_message' => $customer->product_message,
                'product_name' => $customer->product_name,
                'product_image' => $customer->product_image,
                'client_url' => $customer->client_url,
                'contact_url' => $customer->contact_url,
                'privacy_url' => $customer->privacy_url,
                'theme_colour' => $customer->theme_colour,
                'status' => $customer->status
            ];

            // Log successful access
            Log::info('Product claim form accessed', [
                'guid' => $guid,
                'customer_id' => $customer->id,
                'client_ref' => $customer->client_ref,
                'status' => $customer->status
            ]);

            return Inertia::render('ProductCapture', $claimData);

        } catch (\Exception $e) {
            // Log the error
            Log::error('Failed to load product claim form', [
                'guid' => $guid,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Handle different types of errors gracefully
            if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpException) {
                throw $e; // Re-throw HTTP exceptions (400, 403, 404, etc.)
            }

            abort(500, 'An error occurred while loading the claim form');
        }
    }

    /**
     * Handle the product claim form submission
     */
    public function store(Request $request)
    {
        try {
            // Validate the form data
            $validated = $request->validate([
                'guid' => 'required|string|uuid',
                'title' => 'required|string|max:10',
                'firstName' => 'required|string|max:50',
                'surname' => 'required|string|max:50',
                'address.line1' => 'required|string|max:100',
                'address.line2' => 'nullable|string|max:100',
                'address.line3' => 'nullable|string|max:100',
                'address.city' => 'required|string|max:50',
                'address.county' => 'required|string|max:50',
                'address.postcode' => 'required|string|max:10',
                'address.country' => 'required|string|max:50',
            ]);

            // Find the customer record by GUID
            $customer = Customer::where('guid', $validated['guid'])->first();

            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer record not found for this form.',
                    'error_code' => 'CUSTOMER_NOT_FOUND'
                ], 404);
            }

            // Check if customer is still in pending status
            if ($customer->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'This form is no longer available for submission.',
                    'error_code' => 'FORM_NOT_AVAILABLE'
                ], 410);
            }

            // Update customer record with form data
            $customer->update([
                // Update title and surname (in case they were changed)
                'title' => $validated['title'],
                'surname' => $validated['surname'],
                
                // Add the new form data
                'first_name' => $validated['firstName'],
                'address_line1' => $validated['address']['line1'],
                'address_line2' => $validated['address']['line2'],
                'address_line3' => $validated['address']['line3'],
                'city' => $validated['address']['city'],
                'county' => $validated['address']['county'],
                'postcode' => $validated['address']['postcode'],
                'country' => $validated['address']['country'],
                'submitted_at' => now(),
                'status' => 'submitted'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Product claim submitted successfully!',
                'data' => [
                    'guid' => $customer->guid,
                    'status' => $customer->status,
                    'submitted_at' => $customer->submitted_at->toISOString()
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
                'error_code' => 'VALIDATION_ERROR'
            ], 422);

        } catch (\Exception $e) {
            // Log the error
            Log::error('Failed to submit product claim form', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An unexpected error occurred while submitting your claim.',
                'error_code' => 'INTERNAL_ERROR'
            ], 500);
        }
    }

    // API - Preload Customer Information and Generate Claim URL
    public function preload_customer_information(Request $request)
    {
        try {
            // Validate incoming data
            $validated = $request->validate([
                'GUID' => 'required|string|uuid',
                'title' => 'required|string|max:10',
                'surname' => 'required|string|max:100',
                'client_ref' => 'required|string|max:100',
                'client_name' => 'required|string|max:255',
                'client_image' => 'nullable|string|max:500',
                'client_url' => 'nullable|url|max:500',
                'contact_url' => 'nullable|url|max:500',
                'privacy_url' => 'nullable|url|max:500',
                'ngn' => 'nullable|string|max:100',
                'theme_colour' => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
                'product_title' => 'nullable|string|max:500',
                'product_message' => 'nullable|string|max:1000',
                'product_name' => 'nullable|string|max:255',
                'product_image' => 'nullable|string|max:500',
                'loading_title' => 'nullable|string|max:500',
                'loading_message' => 'nullable|string|max:1000',
                'completed_title' => 'nullable|string|max:500',
                'completed_message' => 'nullable|string|max:1000',
                'expired_title' => 'nullable|string|max:500',
                'expired_message' => 'nullable|string|max:1000',
            ]);

            // Check if customer already exists
            if (Customer::where('guid', $validated['GUID'])->exists()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'A claim with this GUID already exists in the database.',
                    'error_code' => 'DUPLICATE_GUID'
                ], 409); // 409 Conflict
            }

            // Create customer record
            $customer = Customer::create([
                'guid' => $validated['GUID'],
                
                // Personal information (conditionally encrypted based on environment)
                'title' => $validated['title'],
                'surname' => $validated['surname'],

                // Client information
                'client_ref' => $validated['client_ref'],
                'client_name' => $validated['client_name'],
                'client_image' => $validated['client_image'],
                'client_url' => $validated['client_url'],
                'contact_url' => $validated['contact_url'],
                'privacy_url' => $validated['privacy_url'],
                'ngn' => $validated['ngn'],
                'theme_colour' => $validated['theme_colour'],

                // Product information
                'product_title' => $validated['product_title'],
                'product_message' => $validated['product_message'],
                'product_name' => $validated['product_name'],
                'product_image' => $validated['product_image'],

                // Message content
                'loading_title' => $validated['loading_title'],
                'loading_message' => $validated['loading_message'],
                'completed_title' => $validated['completed_title'],
                'completed_message' => $validated['completed_message'],
                'expired_title' => $validated['expired_title'],
                'expired_message' => $validated['expired_message'],
                
                // Initial status
                'status' => 'pending',
            ]);

            // Generate URLs with configurable expiry time
            $expiryMinutes = config('app.claim_url_expiry_minutes', 2880);
            $expiryTime = now()->addMinutes($expiryMinutes);
            
            $url = URL::temporarySignedRoute(
                'product.claim', 
                $expiryTime, 
                ['guid' => $validated['GUID']]
            );
            
            $shortUrl = ShortURL::destinationUrl($url)
                ->secure()
                ->trackVisits(false)
                ->deactivateAt($expiryTime)
                ->make()
                ->default_short_url;

            return response()->json([
                'status' => 'success',
                'data' => [
                    'customer_id' => $customer->id,
                    'guid' => $customer->guid,
                    'url' => $url,
                    'short_url' => $shortUrl,
                    'expires_at' => $expiryTime->toISOString(),
                    'expires_in_minutes' => $expiryMinutes
                ],
                'message' => 'Customer information successfully created and claim URL generated.'
            ], 201); // 201 Created

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
                'error_code' => 'VALIDATION_ERROR'
            ], 422); // 422 Unprocessable Entity

        } catch (\Exception $e) {
            // Log the error for debugging
            \Log::error('Failed to preload customer information', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'An unexpected error occurred while processing your request.',
                'error_code' => 'INTERNAL_ERROR'
            ], 500); // 500 Internal Server Error
        }
    }

    /**
     * Get customer callback data and mark as completed
     */
    public function get_callback($guid)
    {
        try {
            // Validate GUID format
            if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $guid)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid GUID format provided.',
                    'error_code' => 'INVALID_GUID_FORMAT'
                ], 400); // 400 Bad Request
            }

            // Find customer by GUID
            $customer = Customer::where('guid', $guid)->first();

            if (!$customer) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Customer with this GUID was not found.',
                    'error_code' => 'GUID_NOT_FOUND'
                ], 404); // 404 Not Found
            }

            // Check top level customer information to see if customer has completed the form
            if (!$customer->first_name || !$customer->postcode || !$customer->address_line1) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Customer information not yet complete.',
                    'error_code' => 'INCOMPLETE_DATA',
                ], 422); // 422 Unprocessable Entity
            }

            // Prepare response data before deletion
            $responseData = [
                'GUID' => $customer->guid,
                'title' => $customer->title,
                'first_name' => $customer->first_name,
                'surname' => $customer->surname,
                'postcode' => $customer->postcode,
                'address_line1' => $customer->address_line1,
                'address_line2' => $customer->address_line2,
                'address_line3' => $customer->address_line3,
                'city' => $customer->city,
                'county' => $customer->county,
                'country' => $customer->country,
                'submitted_at' => $customer->submitted_at,
                'created_at' => $customer->created_at,
            ];

            // Mark as completed and processed
            $customer->markAsCompleted();

            // Optionally delete the record after successful callback
            // Uncomment the line below if you want to delete after callback
            // $customer->delete();

            return response()->json([
                'status' => 'success',
                'message' => $responseData,
                'processed_at' => now()->toISOString()
            ], 200); // 200 OK

        } catch (\Exception $e) {
            // Log the error for debugging
            Log::error('Failed to process customer callback', [
                'guid' => $guid,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'An unexpected error occurred while processing the callback.',
                'error_code' => 'INTERNAL_ERROR'
            ], 500); // 500 Internal Server Error
        }
    }

    /**
     * Revoke customer form access by marking as expired
     */
    public function revoke_customer_form_access(Request $request)
    {
        try {
            // Validate incoming data
            $validated = $request->validate([
                'GUID' => 'required|string|uuid'
            ]);

            // Find customer by GUID
            $customer = Customer::where('guid', $validated['GUID'])->first();

            if (!$customer) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Customer with this GUID does not exist in the database.',
                    'error_code' => 'GUID_NOT_FOUND'
                ], 404); // 404 Not Found
            }

            // Check if already expired
            if ($customer->status === 'expired') {
                return response()->json([
                    'status' => 'warning',
                    'message' => 'Customer form access is already expired.',
                    'error_code' => 'ALREADY_EXPIRED'
                ], 200); // 200 OK
            }

            // Mark as expired
            $customer->markAsExpired();

            // Log the revocation
            Log::info('Customer form access revoked', [
                'guid' => $validated['GUID'],
                'customer_id' => $customer->id,
                'client_ref' => $customer->client_ref,
                'previous_status' => $customer->getOriginal('status')
            ]);

            return response()->json([
                'status' => 'success',
                'data' => [
                    'guid' => $customer->guid,
                    'status' => $customer->status,
                    'expired_at' => now()->toISOString()
                ],
                'message' => 'Customer form access successfully revoked.'
            ], 200); // 200 OK

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
                'error_code' => 'VALIDATION_ERROR'
            ], 422); // 422 Unprocessable Entity

        } catch (\Exception $e) {
            // Log the error for debugging
            Log::error('Failed to revoke customer form access', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'An unexpected error occurred while processing your request.',
                'error_code' => 'INTERNAL_ERROR'
            ], 500); // 500 Internal Server Error
        }
    }
}