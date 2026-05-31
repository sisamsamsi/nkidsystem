<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductVariantController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductionTaskController;
use App\Http\Controllers\Api\StationController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\QcReportController;
use App\Http\Controllers\Api\ProcessTemplateController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\SubProcessController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| NKids Production Management System API
| Base URL: /api
|
*/

// ===========================================
// PUBLIC ROUTES (No Authentication Required)
// ===========================================

Route::get('/track/{po_number}', [OrderController::class, 'track'])
    ->name('api.track');

// ===========================================
// AUTHENTICATION ROUTES
// ===========================================

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->name('api.auth.login');
    Route::post('/register', [AuthController::class, 'register'])->name('api.auth.register');
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout'])->name('api.auth.logout');
        Route::get('/user', [AuthController::class, 'user'])->name('api.auth.user');
    });
});

// ===========================================
// STATION MODE ROUTES (PIN-based Auth)
// ===========================================

Route::prefix('station')->group(function () {
    Route::get('/', [StationController::class, 'index'])->name('api.station.index');
    Route::post('/auth', [StationController::class, 'authenticate'])->name('api.station.auth');
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/tasks', [StationController::class, 'tasks'])->name('api.station.tasks');
        Route::get('/tasks/{id}', [StationController::class, 'showTask'])->name('api.station.tasks.show');
        Route::post('/tasks/{id}/log', [StationController::class, 'logWork'])->name('api.station.tasks.log');
        Route::post('/qc-reports', [QcReportController::class, 'store'])->name('api.station.qc-reports.store');
    });
});

// ===========================================
// PROTECTED ROUTES (Requires Authentication)
// ===========================================

Route::middleware([\App\Http\Middleware\LogApiResponses::class, 'auth:sanctum'])->group(function () {

    // -------------------------------------------
    // MASTER DATA RESOURCES
    // -------------------------------------------
    
    Route::apiResource('users', UserController::class);
    Route::apiResource('customers', CustomerController::class);
    Route::get('products/generate-style-code', [ProductController::class, 'generateStyleCode']);
    Route::apiResource('products', ProductController::class);
    Route::apiResource('product-variants', ProductVariantController::class);
    Route::get('product-variants/{productVariant}/sub-processes', [ProductVariantController::class, 'getSubProcesses']);
    Route::post('product-variants/{productVariant}/sub-processes', [ProductVariantController::class, 'syncSubProcesses']);
    Route::get('process-templates', [ProcessTemplateController::class, 'index'])->name('process-templates.index');
    Route::apiResource('sub-processes', SubProcessController::class);
    
    // -------------------------------------------
    // TRANSACTION RESOURCES
    // -------------------------------------------
    
    Route::apiResource('orders', OrderController::class);
    Route::post('orders/generate-po-number', [OrderController::class, 'generatePoNumber'])->name('orders.generate-po-number');
    Route::post('orders/import', [OrderController::class, 'import'])->name('orders.import');
    Route::post('orders/{order}/recalculate', [OrderController::class, 'recalculate'])->name('orders.recalculate');
    Route::post('orders/{order}/generate-tasks', [OrderController::class, 'regenerateTasks'])->name('orders.generate-tasks');
    
    Route::apiResource('production-tasks', ProductionTaskController::class)->only(['index', 'show', 'update']);
    Route::post('production-tasks/{id}/log-work', [ProductionTaskController::class, 'logWork'])->name('production-tasks.log-work');
    
    // -------------------------------------------
    // REPORTS
    // -------------------------------------------
    
    Route::prefix('reports')->group(function () {
        Route::get('/employee-performance', [ReportController::class, 'employeePerformance'])
            ->name('api.reports.employee-performance');
        Route::get('/production-summary', [ReportController::class, 'productionSummary'])
            ->name('api.reports.production-summary');
        Route::get('/dashboard', [ReportController::class, 'dashboard'])
            ->name('api.reports.dashboard');
    });

});
