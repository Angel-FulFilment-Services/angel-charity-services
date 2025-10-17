<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\App\ProductClaimController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/claim-free-product/guid={guid}', [ProductClaimController::class, 'show'])->name('product.claim');

Route::post('/product-claim', [ProductClaimController::class, 'store'])->name('product.claim.submit');

Route::post('/claim-free-product/expired/guid={guid}', [ProductClaimController::class, 'expired'])->name('product.claim.expired');

Route::post('/claim-free-product/process/guid={guid}', [ProductClaimController::class, 'store'])->name('product.claim.store');

// Template management routes (require signed URLs for security)
Route::get('/templates/claim-free-product/create', [ProductClaimController::class, 'createTemplate'])->name('template.create');

Route::post('/templates/claim-free-product/store', [ProductClaimController::class, 'storeTemplate'])->name('template.store');
