<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\App\ProductClaimController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:api')->get('/user', function (Request $request) {
    return $request->user();
});

// Preload Customer Information
Route::post('customer/preload-customer-information',[ProductClaimController::class, 'preload_customer_information'])->name('preload_customer_information')
    ->withoutMiddleware('throttle:api')
    ->middleware('throttle:2000,1')
    ->middleware('auth:api');

// Revoke Customer Form Access
Route::post('customer/revoke-customer-form-access',[ProductClaimController::class, 'revoke_customer_form_access'])->name('revoke_customer_form_access')
    ->withoutMiddleware('throttle:api')
    ->middleware('throttle:2000,1')
    ->middleware('auth:api');

// Customer Callback
Route::get('customer/get-callback/GUID={guid}', [ProductClaimController::class, 'get_callback'])->name('get_callback')
    ->withoutMiddleware('throttle:api')
    ->middleware('throttle:2000,1')
    ->middleware('auth:api');

// API route for generating signed template creation URLs
Route::post('template/generate-template-url', [ProductClaimController::class, 'generateTemplateCreationUrl'])->name('template.generate-url')
    ->withoutMiddleware('throttle:api')
    ->middleware('throttle:2000,1')
    ->middleware('auth:api');

// Internal routes protected by a server-side token
Route::prefix('internal')->middleware(['api.token'])->group(function () {
    // Generate a preview link (testing mode)
    Route::post('template/preview', [ProductClaimController::class, 'previewTemplate'])->name('template.preview')
        ->withoutMiddleware('throttle:api')
        ->middleware('throttle:2000,1');
    
    // Return internal API token (for server-side use only)
    Route::get('token', function () {
        $token = config('api_auth.internal_api_token');
        if ($token) return response()->json(['token' => $token]);
        $path = config('api_auth.token_file_path');
        if (file_exists($path)) return response()->json(['token' => trim(file_get_contents($path))]);
        return response()->json(['token' => null], 404);
    })->name('internal.token');
});