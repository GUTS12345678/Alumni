<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SurveyController;
use App\Http\Controllers\Api\AdminController;


// Public routes (no authentication required)
Route::prefix('v1')->group(function () {
    // Authentication routes
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    // Public survey routes (accessible via invitation token)
    Route::get('/surveys/{survey}', [SurveyController::class, 'show']);
    Route::post('/surveys/{survey}/start', [SurveyController::class, 'startResponse']);
    Route::post('/surveys/{survey}/answer', [SurveyController::class, 'submitAnswer']);
    Route::post('/surveys/{survey}/complete', [SurveyController::class, 'completeResponse']);
    Route::get('/surveys/{survey}/progress', [SurveyController::class, 'getProgress']);
});

// Protected routes (authentication required)
Route::prefix('v1')->middleware(['auth:web,sanctum'])->group(function () {
    // Authentication routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::post('/get-token', [AuthController::class, 'getToken']);

    // Authenticated survey routes
    Route::get('/my-surveys', [SurveyController::class, 'mySurveys']);
    Route::get('/my-responses', [SurveyController::class, 'myResponses']);
});

// Alumni-only routes (authentication + alumni role required)
Route::prefix('v1/alumni')->middleware(['auth:web,sanctum', 'alumni'])->group(function () {
    // Alumni profile
    Route::get('/profile', [AuthController::class, 'alumniProfile']);
});

// Admin-only routes (authentication + admin role required)
Route::prefix('v1/admin')->middleware(['auth:web,sanctum', 'admin'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [AdminController::class, 'dashboard']);

    // Alumni management (Alumni Bank)
    Route::get('/alumni', [AdminController::class, 'getAlumni']);
    Route::get('/alumni/stats', [AdminController::class, 'getAlumniStats']);
    Route::get('/alumni/export', [AdminController::class, 'exportAlumni']);
    Route::get('/alumni/{id}', [AdminController::class, 'getAlumniProfile']);

    // Survey management (Survey Bank)
    Route::get('/surveys', [AdminController::class, 'getSurveys']);
    Route::post('/surveys', [AdminController::class, 'createSurvey']);
    Route::get('/surveys/{id}', [AdminController::class, 'getSurveyDetails']);
    Route::put('/surveys/{id}', [AdminController::class, 'updateSurvey']);
    Route::delete('/surveys/{id}', [AdminController::class, 'deleteSurvey']);
    Route::post('/surveys/{id}/duplicate', [AdminController::class, 'duplicateSurvey']);
    Route::get('/surveys/{survey}/responses', [AdminController::class, 'getSurveyResponses']);
    Route::get('/surveys/{survey}/export', [AdminController::class, 'exportSurveyResponses']);

    // Survey Questions management
    Route::post('/surveys/{survey}/questions', [AdminController::class, 'createSurveyQuestion']);
    Route::put('/surveys/{survey}/questions/{question}', [AdminController::class, 'updateSurveyQuestion']);
    Route::delete('/surveys/{survey}/questions/{question}', [AdminController::class, 'deleteSurveyQuestion']);
    Route::post('/surveys/{survey}/questions/reorder', [AdminController::class, 'reorderSurveyQuestions']);

    // Analytics routes
    Route::get('/analytics/time-to-job', [\App\Http\Controllers\Api\V1\Admin\AnalyticsController::class, 'getTimeToJobAnalytics']);
    Route::get('/analytics/time-to-job/export', [\App\Http\Controllers\Api\V1\Admin\AnalyticsController::class, 'exportTimeToJobAnalytics']);

    // Batch management
    Route::get('/batches', [AdminController::class, 'getBatches']);

    // Activity logs management
    Route::get('/activity-logs', [AdminController::class, 'getActivityLogs']);
    Route::get('/activity-logs/export', [AdminController::class, 'exportActivityLogs']);

    // User Management
    Route::get('/users', [AdminController::class, 'getUsers']);
    Route::post('/users', [AdminController::class, 'createUser']);
    Route::put('/users/{id}', [AdminController::class, 'updateUser']);
    Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);

    // Permissions Management  
    Route::get('/permissions', [AdminController::class, 'getPermissions']);
    Route::get('/roles', [AdminController::class, 'getRoles']);
    Route::post('/permissions', [AdminController::class, 'createPermission']);
    Route::put('/permissions/{id}', [AdminController::class, 'updatePermission']);

    // Email Templates
    Route::get('/email-templates', [AdminController::class, 'getEmailTemplates']);
    Route::post('/email-templates', [AdminController::class, 'createEmailTemplate']);
    Route::put('/email-templates/{id}', [AdminController::class, 'updateEmailTemplate']);
    Route::delete('/email-templates/{id}', [AdminController::class, 'deleteEmailTemplate']);

    // System Settings
    Route::get('/settings', [AdminController::class, 'getSystemSettings']);
    Route::put('/settings', [AdminController::class, 'updateSystemSettings']);

    // Backup & Export
    Route::get('/backup', [AdminController::class, 'getBackupInfo']);
    Route::post('/backup/create', [AdminController::class, 'createBackup']);
    Route::get('/backup/download/{file}', [AdminController::class, 'downloadBackup']);
});

// Health check route
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
        'version' => '1.0.0'
    ]);
});
