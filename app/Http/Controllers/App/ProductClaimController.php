<?php

namespace App\Http\Controllers\App;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\Controller;
use App\Models\App\Customer;
use App\Models\App\Template;
use Illuminate\Support\Facades\URL;
use AshAllenDesign\ShortURL\Facades\ShortURL;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;

class ProductClaimController extends Controller
{
    /**
     * Abort with additional data for error pages
     */
    private function abortWithData($status, $message, $data = [])
    {
        // Store the data in session so the error handler can access it
        if (!empty($data)) {
            session()->flash('error_page_data', $data);
        }
        
        abort($status, $message);
    }

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

            // Find customer by GUID and load template relationship
            $customer = Customer::with('template')->where('guid', $guid)->first();

            if (!$customer) {
                Log::warning('Customer not found for GUID', ['guid' => $guid]);
                // TODO: return redirect()->route('claim_not_found', $guid);
                abort(404, 'Claim not found');
            }

            // Check if request has valid signature (temporary signed URL)
            if (!$request->hasValidSignature()) {
                // If we have customer data, pass it to the error page using template configuration
                $errorData = $customer ? array_merge([
                    'guid' => $customer->guid,    
                    'title' => $customer->title,
                    'surname' => $customer->surname,
                ], $customer->getTemplateConfig()) : [];
                
                Log::info('Expired or invalid signature for claim link', ['guid' => $guid]);

                $this->abortWithData(410, 'Invalid or expired link', $errorData);
            }

            // Check if customer record is expired or completed
            if ($customer->status === 'expired' || $customer->status === 'completed') {
                // Load expired page data using template configuration
                $expiredData = array_merge([
                    'guid' => $customer->guid,
                    'title' => $customer->title,
                    'surname' => $customer->surname,
                    'status' => 'expired'
                ], $customer->getTemplateConfig());

                Log::info('Claim link expired', ['guid' => $guid]);

                $this->abortWithData(410, 'This claim link has expired', $expiredData);
            }

            if ($customer->status === 'processing') {
                // Load processing page data using template configuration
                $processingData = array_merge([
                    'guid' => $customer->guid,
                    'title' => $customer->title,
                    'surname' => $customer->surname,
                    'status' => 'processing'
                ], $customer->getTemplateConfig());

                return Inertia::render('Forms/ClaimFreeProduct', $processingData);
            }

            // Prepare claim data for the form using template configuration
            $claimData = array_merge([
                'guid' => $customer->guid,
                'title' => $customer->title,
                'surname' => $customer->surname,
                'communication_channels' => $customer->communication_channels,
                'privacy_notice' => $customer->privacy_notice,
                'status' => $customer->status,
                'ngn' => $customer->ngn
            ], $customer->getTemplateConfig());

            return Inertia::render('Forms/ClaimFreeProduct', $claimData);

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

            abort(500, 'An error occurred while loading the claim form, please try again later.');
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
                'communicationPreferences' => 'nullable|array',
                'communicationPreferences.*' => 'string|max:50',
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
                
                // Communication preferences
                'communication_preferences' => $validated['communicationPreferences'] ?? [],
                
                'submitted_at' => now(),
                'status' => 'processing'
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
                'ngn' => 'nullable|string|max:100',
                'template_id' => 'nullable|integer|exists:product_claim_templates,id',
                // Template override fields (optional - will use template defaults if not provided)
                'client_ref' => 'nullable|string|max:100',
                'client_name' => 'nullable|string|max:255',
                'client_image' => 'nullable|string|max:500',
                'client_url' => 'nullable|url|max:500',
                'contact_url' => 'nullable|url|max:500',
                'privacy_url' => 'nullable|url|max:500',
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
                'communication_channels' => 'nullable|array',
                'communication_channels.*.channel' => 'required_with:communication_channels|string|max:50',
                'communication_channels.*.label' => 'required_with:communication_channels|string|max:255',
                'communication_channels.*.type' => 'nullable|string|in:opt-in,opt-out',
                'privacy_notice' => 'nullable|string|max:2000',
            ]);

            // Check if customer already exists
            if (Customer::where('guid', $validated['GUID'])->exists()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'A claim with this GUID already exists in the database.',
                    'error_code' => 'DUPLICATE_GUID'
                ], 409); // 409 Conflict
            }

            // Prepare customer data - only include fields that are explicitly provided (for overrides)
            $customerData = [
                'guid' => $validated['GUID'],
                'template_id' => $validated['template_id'] ?? null,
                
                // Personal information (conditionally encrypted based on environment)
                'title' => $validated['title'],
                'surname' => $validated['surname'],

                // Communication preferences configuration
                'communication_channels' => $validated['communication_channels'] ?? null,
                'privacy_notice' => $validated['privacy_notice'] ?? null,
                
                // Initial status
                'status' => 'pending',
            ];

            // Template fields - copy from template if template_id provided, or use overrides if explicitly provided
            $templateFields = [
                'client_ref', 'client_name', 'client_image', 'client_url', 'contact_url', 
                'privacy_url', 'theme_colour', 'product_title', 'product_message', 
                'product_name', 'product_image', 'loading_title', 'loading_message', 
                'completed_title', 'completed_message', 'expired_title', 'expired_message', 'communication_channels'
            ];

            // If template_id is provided, copy template values for historical tracking
            if (!empty($validated['template_id'])) {
                $template = Template::find($validated['template_id']);
                if ($template) {
                    foreach ($templateFields as $field) {
                        // Use explicit override if provided, otherwise copy from template
                        if (isset($validated[$field]) && !is_null($validated[$field])) {
                            $customerData[$field] = $validated[$field]; // Override
                        } else {
                            $customerData[$field] = $template->{$field}; // Copy from template
                        }
                    }
                }
            } else {
                // No template - only set fields that are explicitly provided
                foreach ($templateFields as $field) {
                    if (isset($validated[$field]) && !is_null($validated[$field])) {
                        $customerData[$field] = $validated[$field];
                    }
                }
            }

            // Create customer record
            $customer = Customer::create($customerData);

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

    /**
     * Display the template creation page for claim free product forms
     * Requires signed URL for authentication
     */
    public function createTemplate(Request $request)
    {
        // Check if request has valid signature (signed URL authentication)
        if (!$request->hasValidSignature()) {
            Log::warning('Unauthorized template creation attempt', [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'url' => $request->fullUrl()
            ]);
            
            abort(403, 'Access denied. This page requires a valid signed URL.');
        }

        // Generate a signed URL for the store route with same expiry as current request
        $storeSignedUrl = URL::temporarySignedRoute(
            'template.store',
            now()->addHours(4)
        );

        // Fetch clients from external API
        try {
            $clientsApiUrl = config('app.clients_api_url', 'https://pulse.angelfs.co.uk/api/system/clients');
            $clientsApiToken = config('app.clients_api_token');
            
            $apiResponse = Http::timeout(10)
                ->withToken($clientsApiToken)
                ->get($clientsApiUrl);
            
            if ($apiResponse->successful()) {
                $clients = $apiResponse->json('data', []);
                
                // Validate and format the response to ensure it matches expected structure
                $clients = collect($clients)->map(function ($client) {
                    return [
                        'id' => $client['id'] ?? null,
                        'value' => $client['client_name'] ?? $client['value'] ?? '',
                        'client_ref' => $client['client_ref'] ?? ''
                    ];
                })->filter(function ($client) {
                    // Filter out any clients with missing required data
                    return !empty($client['id']) && !empty($client['value']);
                })->sortBy('value')->values()->toArray();
            } else {
                Log::warning('Failed to fetch clients from API', [
                    'status' => $apiResponse->status(),
                    'response' => $apiResponse->body()
                ]);
                
                // Fallback to empty array or default clients
                $clients = [];
            }
        } catch (\Exception $e) {
            Log::error('Error calling clients API', [
                'error' => $e->getMessage(),
                'url' => $clientsApiUrl ?? 'not configured'
            ]);
            
            // Fallback to empty array
            $clients = [];
        }

        // Sample template data - this will eventually come from database
        $templateData = [
            'loading_title' => 'Preparing Your Free {{product_name}}!',
            'loading_message' => 'Setting up your personalized claim form...',
            'completed_title' => 'Thank You!',
            'completed_message' => 'Your free {{product_name}} claim has been submitted successfully. We\'ll process your request and arrange delivery soon.',
            'expired_title' => 'This claim form has now expired.',
            'expired_message' => 'This {{product_name}} claim link has expired and is no longer valid.',
            'product_title' => 'Claim Your Free {{product_name}}',
            'product_message' => 'Complete this form to claim your free {{product_name}}. We\'ll use your details to arrange delivery and keep you updated.',
            'privacy_notice' => 'By claiming your free product, you agree to our terms of service and privacy policy. Your information will be used solely for product delivery and customer support. We will never sell or share your personal information with third parties without your consent.',
            'theme_colour' => '#008DA9',
            'clients' => $clients,
            'store_url' => $storeSignedUrl,
        ];

        return Inertia::render('Forms/CreateClaimFreeProductTemplate', $templateData);
    }

    /**
     * Store a new template from the template builder
     * Requires signed URL for authentication
     */
    public function storeTemplate(Request $request)
    {
        try {
            // Check if request has valid signature (signed URL authentication)
            if (!$request->hasValidSignature()) {
                Log::warning('Unauthorized template store attempt', [
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'request_data' => $request->all()
                ]);
                
                return response()->json([
                    'status' => 'error',
                    'message' => 'Access denied. Invalid or expired signed URL.',
                    'error_code' => 'INVALID_SIGNATURE'
                ], 403);
            }

            // Validate the template data structure
            $validated = $request->validate([
                // Prerequisites section
                'prerequisites.client_ref' => 'required|string|max:100',
                'prerequisites.client_name' => 'required|string|max:255',
                'prerequisites.client_image' => 'nullable|string|max:500',
                'prerequisites.client_image_file' => 'nullable|file|mimes:jpeg,jpg,png,gif,webp|max:2048',
                'prerequisites.product_name' => 'required|string|max:255',
                'prerequisites.product_image' => 'nullable|string|max:500',
                'prerequisites.product_image_file' => 'nullable|file|mimes:jpeg,jpg,png,gif,webp|max:5120',
                'prerequisites.client_url' => 'nullable|url|max:500',
                'prerequisites.contact_url' => 'nullable|url|max:500',
                'prerequisites.privacy_url' => 'nullable|url|max:500',
                
                // Template content section
                'template.loading_title' => 'nullable|string|max:500',
                'template.loading_message' => 'nullable|string|max:1000',
                'template.completed_title' => 'nullable|string|max:500',
                'template.completed_message' => 'nullable|string|max:1000',
                'template.expired_title' => 'nullable|string|max:500',
                'template.expired_message' => 'nullable|string|max:1000',
                'template.form_title' => 'nullable|string|max:500',
                'template.form_message' => 'nullable|string|max:1000',
                'template.privacy_notice' => 'nullable|string|max:2000',
                'template.theme_colour' => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
                
                // Communication preferences
                'template.communication_preferences' => 'nullable|array',
                'template.communication_preferences.*.enabled' => 'boolean',
                'template.communication_preferences.*.value' => 'string|max:50',
                'template.communication_preferences.*.label' => 'string|max:255',
                'template.communication_preferences.*.type' => 'string|in:opt-in,opt-out',
            ]);

            // Handle file uploads if present
            $templateData = [];
            
            // Process client image upload
            if ($request->hasFile('prerequisites.client_image_file')) {
                $clientImageFile = $request->file('prerequisites.client_image_file');
                
                // Upload file with random filename to prevent conflicts
                $clientImagePath = $clientImageFile->store('clients/images/logos', 'r2-public');
                $templateData['client_image'] = basename($clientImagePath);
                
                Log::info('Client image uploaded to bucket', [
                    'uploaded_path' => $clientImagePath,
                    'original_filename' => $clientImageFile->getClientOriginalName(),
                    'stored_filename' => basename($clientImagePath)
                ]);
            } else {
                // Extract filename from URL if provided
                $clientImageUrl = $validated['prerequisites']['client_image'] ?? null;
                
                // Check if we have a URL and it's not empty
                if ($clientImageUrl && !empty(trim($clientImageUrl))) {
                    // Extract filename from URL (e.g., "https://cdn.angelfs.co.uk/clients/images/logos/ss-logo.png" -> "ss-logo.png")
                    $templateData['client_image'] = basename($clientImageUrl);
                } else {
                    $templateData['client_image'] = null;
                }
            }

            // Process product image upload
            if ($request->hasFile('prerequisites.product_image_file')) {
                $productImageFile = $request->file('prerequisites.product_image_file');
                
                // Upload file with random filename to prevent conflicts
                $productImagePath = $productImageFile->store('clients/images/products', 'r2-public');
                $templateData['product_image'] = basename($productImagePath);
                
                Log::info('Product image uploaded to bucket', [
                    'uploaded_path' => $productImagePath,
                    'original_filename' => $productImageFile->getClientOriginalName(),
                    'stored_filename' => basename($productImagePath)
                ]);
            } else {
                // Extract filename from URL if provided
                $productImageUrl = $validated['prerequisites']['product_image'] ?? null;
                if ($productImageUrl && !empty(trim($productImageUrl))) {
                    // Extract filename from URL
                    $templateData['product_image'] = basename($productImageUrl);
                } else {
                    $templateData['product_image'] = null;
                }
            }

            // Map form data to template model structure
            $templateData = array_merge($templateData, [
                'client_ref' => $validated['prerequisites']['client_ref'],
                'client_name' => $validated['prerequisites']['client_name'],
                'client_url' => $validated['prerequisites']['client_url'] ?? null,
                'contact_url' => $validated['prerequisites']['contact_url'] ?? null,
                'privacy_url' => $validated['prerequisites']['privacy_url'] ?? null,
                'product_name' => $validated['prerequisites']['product_name'],
                'loading_title' => $validated['template']['loading_title'] ?? null,
                'loading_message' => $validated['template']['loading_message'] ?? null,
                'completed_title' => $validated['template']['completed_title'] ?? null,
                'completed_message' => $validated['template']['completed_message'] ?? null,
                'expired_title' => $validated['template']['expired_title'] ?? null,
                'expired_message' => $validated['template']['expired_message'] ?? null,
                'product_title' => $validated['template']['form_title'] ?? null,
                'product_message' => $validated['template']['form_message'] ?? null,
                'theme_colour' => $validated['template']['theme_colour'] ?? '#008DA9',
            ]);

            // Process communication preferences - only include enabled ones
            $communicationChannels = [];
            if (isset($validated['template']['communication_preferences'])) {
                foreach ($validated['template']['communication_preferences'] as $channel => $preferences) {
                    // Convert string '1'/'0' to boolean for enabled check
                    $enabled = is_string($preferences['enabled']) ? $preferences['enabled'] === '1' : (bool)$preferences['enabled'];
                    
                    if ($enabled) {
                        $communicationChannels[] = [
                            'channel' => $preferences['value'],
                            'label' => $preferences['label'],
                            'type' => $preferences['type']
                        ];
                    }
                }
            }
            $templateData['communication_channels'] = $communicationChannels;

            // Create the template record
            $template = Template::create($templateData);

            // Log successful creation
            Log::info('Template created successfully', [
                'template_id' => $template->id,
                'client_ref' => $template->client_ref,
                'product_name' => $template->product_name,
                'communication_channels_count' => count($communicationChannels),
                'communication_channels' => $communicationChannels,
                'created_by_ip' => $request->ip()
            ]);

            return response()->json([
                'status' => 'success',
                'data' => [
                    'template_id' => $template->id,
                    'client_ref' => $template->client_ref,
                    'product_name' => $template->product_name,
                    'created_at' => $template->created_at->toISOString()
                ],
                'message' => 'Template created successfully!'
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
                'error_code' => 'VALIDATION_ERROR'
            ], 422);

        } catch (\Exception $e) {
            // Log the error for debugging
            Log::error('Failed to create template', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'An unexpected error occurred while creating the template.',
                'error_code' => 'INTERNAL_ERROR'
            ], 500);
        }
    }

    /**
     * Generate a signed URL for template creation access
     * This method would be called from your external system
     */
    public function generateTemplateCreationUrl()
    {
        try {
            // Generate a signed URL valid for 4 hours
            $expiryTime = now()->addHours(4);
            
            $signedUrl = URL::temporarySignedRoute(
                'template.create',
                $expiryTime
            );

            return response()->json([
                'status' => 'success',
                'data' => [
                    'signed_url' => $signedUrl,
                    'expires_at' => $expiryTime->toISOString(),
                    'expires_in_hours' => 4
                ],
                'message' => 'Signed URL generated successfully for template creation.'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to generate template creation URL', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate signed URL.',
                'error_code' => 'URL_GENERATION_ERROR'
            ], 500);
        }
    }
}