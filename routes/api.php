<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SurveyController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\EmailOtpController;


// Public routes (no authentication required)
Route::prefix('v1')->group(function () {
    // Authentication routes
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    // Email OTP verification routes
    Route::post('/otp/send', [EmailOtpController::class, 'sendOtp']);
    Route::post('/otp/verify', [EmailOtpController::class, 'verifyOtp']);
    Route::post('/otp/resend', [EmailOtpController::class, 'resendOtp']);
    Route::post('/otp/check', [EmailOtpController::class, 'checkVerification']);

    // Public survey routes (accessible via invitation token)
    Route::get('/surveys/{survey}', [SurveyController::class, 'show']);
    Route::post('/surveys/{survey}/start', [SurveyController::class, 'startResponse']);
    Route::post('/surveys/{survey}/answer', [SurveyController::class, 'submitAnswer']);
    Route::post('/surveys/{survey}/complete', [SurveyController::class, 'completeResponse']);
    Route::get('/surveys/{survey}/progress', [SurveyController::class, 'getProgress']);
    
    // Public department/course endpoints (for registration dropdowns)
    Route::prefix('admin')->group(function () {
        Route::get('/departments/active', [\App\Http\Controllers\Admin\DepartmentController::class, 'getActive']);
        Route::get('/departments/{id}', [\App\Http\Controllers\Admin\DepartmentController::class, 'show']);
        Route::put('/departments/{id}', [\App\Http\Controllers\Admin\DepartmentController::class, 'update']);
        Route::get('/departments/{id}/courses', [\App\Http\Controllers\Admin\DepartmentController::class, 'getCourses']);
        Route::get('/departments/{id}/alumni', [\App\Http\Controllers\Admin\DepartmentController::class, 'getAlumni']);
        Route::get('/departments/{id}/analytics', [\App\Http\Controllers\Admin\DepartmentController::class, 'getAnalytics']);
        Route::get('/departments/{id}/analytics/export', [\App\Http\Controllers\Admin\DepartmentController::class, 'exportAnalytics']);
        Route::post('/departments/upload-image', [\App\Http\Controllers\Admin\DepartmentController::class, 'uploadImage']);
    });

    // Validation endpoints for registration
    Route::post('/check-email', [AuthController::class, 'checkEmail']);
    Route::post('/check-student-id', [AuthController::class, 'checkStudentId']);
});

// Protected routes (authentication required)
Route::prefix('v1')->middleware(['auth:sanctum'])->group(function () {
    // Authentication routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::post('/get-token', [AuthController::class, 'getToken']);

    // Authenticated survey routes
    Route::get('/my-surveys', [SurveyController::class, 'mySurveys']);
    Route::get('/my-responses', [SurveyController::class, 'myResponses']);
    Route::get('/survey-response/{responseToken}/download', [SurveyController::class, 'downloadResponsePDF']);
    
    // Survey taking routes
    Route::get('/surveys/{surveyId}/take', [SurveyController::class, 'getSurveyToTake']);
    Route::post('/surveys/{surveyId}/start', [SurveyController::class, 'startSurvey']);
    Route::post('/survey-responses/{responseId}/answer', [SurveyController::class, 'saveAnswer']);
    Route::post('/survey-responses/{responseId}/submit', [SurveyController::class, 'submitSurvey']);
});

// Alumni-only routes (authentication + alumni role required)
Route::prefix('v1/alumni')->middleware(['auth:sanctum', 'alumni'])->group(function () {
    // Alumni profile
    Route::get('/profile', [AuthController::class, 'alumniProfile']);
    Route::put('/profile', [AuthController::class, 'updateAlumniProfile']);
    
    // Two-Factor Authentication for alumni
    // Route::post('/two-factor/verify-setup', [\App\Http\Controllers\Auth\TwoFactorSetupController::class, 'verifySetup']);
});

// Two-Factor Authentication challenge (public - no auth required)
// Route::prefix('v1/alumni')->group(function () {
//     Route::post('/two-factor/verify', [\App\Http\Controllers\Auth\TwoFactorChallengeController::class, 'verify']);
// });

// Profile routes (all authenticated users)
Route::prefix('v1/profile')->middleware(['auth:sanctum,web'])->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\V1\ProfileController::class, 'show']);
    Route::post('/', [\App\Http\Controllers\Api\V1\ProfileController::class, 'update']);
    Route::post('/upload-image', [\App\Http\Controllers\Api\V1\ProfileController::class, 'uploadImage']);
    Route::delete('/delete-image', [\App\Http\Controllers\Api\V1\ProfileController::class, 'deleteImage']);
    Route::post('/password', [\App\Http\Controllers\Api\V1\ProfileController::class, 'updatePassword']);
});

// Public routes (no authentication required)
Route::prefix('v1/public')->group(function () {
    Route::get('/appearance', [\App\Http\Controllers\Api\V1\Admin\AppearanceController::class, 'index']);
});

// Admin-only routes (authentication + admin role required)
Route::prefix('v1/admin')->middleware(['auth', 'admin'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [AdminController::class, 'dashboard']);

    // System Appearance Settings
    Route::get('/appearance', [\App\Http\Controllers\Api\V1\Admin\AppearanceController::class, 'index']);
    Route::post('/appearance', [\App\Http\Controllers\Api\V1\Admin\AppearanceController::class, 'update']);
    Route::post('/appearance/upload', [\App\Http\Controllers\Api\V1\Admin\AppearanceController::class, 'uploadImage']);
    Route::delete('/appearance/delete', [\App\Http\Controllers\Api\V1\Admin\AppearanceController::class, 'deleteImage']);

    // Department Appearance Settings
    Route::get('/departments/{id}/appearance', [\App\Http\Controllers\Api\V1\Admin\DepartmentAppearanceController::class, 'show']);
    Route::post('/departments/{id}/appearance', [\App\Http\Controllers\Api\V1\Admin\DepartmentAppearanceController::class, 'update']);
    Route::post('/departments/{id}/appearance/upload', [\App\Http\Controllers\Api\V1\Admin\DepartmentAppearanceController::class, 'uploadImage']);
    Route::delete('/departments/{id}/appearance/delete', [\App\Http\Controllers\Api\V1\Admin\DepartmentAppearanceController::class, 'deleteImage']);

    // Alumni management (Alumni Bank)
    Route::get('/alumni', [AdminController::class, 'getAlumni']);
    Route::get('/alumni/stats', [AdminController::class, 'getAlumniStats']);
    Route::get('/alumni/export', [AdminController::class, 'exportAlumni']);
    Route::get('/alumni/{id}', [AdminController::class, 'getAlumniProfile']);
    Route::put('/alumni/{id}', [AdminController::class, 'updateAlumni']);
    Route::delete('/alumni/{id}', [AdminController::class, 'deleteAlumni']);
    Route::delete('/alumni/bulk-delete', [AdminController::class, 'bulkDeleteAlumni']);

    // Profile management
    Route::put('/profiles/{id}', [AdminController::class, 'updateProfile']);

    // Survey management (Survey Bank)
    Route::get('/surveys', [AdminController::class, 'getSurveys']);
    Route::get('/surveys/export', [AdminController::class, 'exportSurveys']);
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
    
    // Survey Analytics routes
    Route::get('/analytics/overview', [\App\Http\Controllers\Api\V1\Admin\AnalyticsController::class, 'getAnalyticsOverview']);
    Route::get('/analytics/surveys/{survey}', [\App\Http\Controllers\Api\V1\Admin\AnalyticsController::class, 'getSurveyAnalytics']);
    Route::get('/analytics/surveys/{survey}/responses', [\App\Http\Controllers\Api\V1\Admin\AnalyticsController::class, 'getSurveyResponses']);
    Route::post('/analytics/surveys/{survey}/export', [\App\Http\Controllers\Api\V1\Admin\AnalyticsController::class, 'exportSurveyAnalytics']);
    Route::post('/analytics/surveys/export-all', [\App\Http\Controllers\Api\V1\Admin\AnalyticsController::class, 'exportAllSurveys']);

    // Batch management
    Route::get('/batches', [AdminController::class, 'getBatches']);
    Route::post('/batches', [AdminController::class, 'createBatch']);
    Route::put('/batches/{id}', [AdminController::class, 'updateBatch']);
    Route::delete('/batches/{id}', [AdminController::class, 'deleteBatch']);

    // Activity logs management
    Route::get('/activity-logs', [AdminController::class, 'getActivityLogs']);
    Route::get('/activity-logs/export', [AdminController::class, 'exportActivityLogs']);

    // System Metrics
    Route::get('/system-metrics', [\App\Http\Controllers\Admin\SystemMetricsController::class, 'getMetrics']);

    // User Management
    Route::get('/users', [AdminController::class, 'getUsers']);
    Route::post('/users', [AdminController::class, 'createUser']);
    Route::put('/users/{id}', [AdminController::class, 'updateUser']);
    Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
    Route::patch('/users/{id}/status', [AdminController::class, 'updateUserStatus']);
    Route::post('/users/{id}/reset-password', [AdminController::class, 'resetUserPassword']);

    // Role Management (Super Admin only)
    Route::prefix('role-management')->middleware(['super_admin'])->group(function () {
        Route::post('/users/{userId}/change-role', [\App\Http\Controllers\Admin\RoleManagementController::class, 'updateRole']);
        Route::get('/users/{userId}/role-history', [\App\Http\Controllers\Admin\RoleManagementController::class, 'getRoleHistory']);
        Route::get('/available-roles', [\App\Http\Controllers\Admin\RoleManagementController::class, 'getAvailableRoles']);
    });

    // NOTE: Super Admin routes moved outside auth:sanctum group to support CSRF validation
    // See below for actual super-admin department/course management routes

    // Permissions Management  
    Route::get('/permissions', [AdminController::class, 'getPermissions']);
    Route::get('/permissions/{id}/users', [AdminController::class, 'getPermissionUsers']);
    Route::get('/permissions/stats', [AdminController::class, 'getPermissionsStats']);
    Route::get('/roles', [AdminController::class, 'getRoles']);
    Route::get('/roles/{id}', [AdminController::class, 'getRole']);
    Route::post('/roles', [AdminController::class, 'createRole']);
    Route::put('/roles/{id}', [AdminController::class, 'updateRole']);
    Route::put('/roles/{id}/permissions', [AdminController::class, 'updateRolePermissions']);
    Route::delete('/roles/{id}', [AdminController::class, 'deleteRole']);
    Route::get('/users/with-roles', [AdminController::class, 'getUsersWithRoles']);
    Route::post('/permissions', [AdminController::class, 'createPermission']);
    Route::put('/permissions/{id}', [AdminController::class, 'updatePermission']);
    Route::post('/users/{id}/permissions', [AdminController::class, 'giveUserPermission']);
    Route::delete('/users/{id}/permissions/{permissionId}', [AdminController::class, 'revokeUserPermission']);

    // Email Templates
    Route::get('/email-templates', [AdminController::class, 'getEmailTemplates']);
    Route::get('/email-templates/stats', [AdminController::class, 'getEmailTemplateStats']);
    Route::get('/email-templates/export', [AdminController::class, 'exportEmailTemplates']);
    Route::get('/email-templates/{id}', [AdminController::class, 'getEmailTemplate']);
    Route::post('/email-templates', [AdminController::class, 'createEmailTemplate']);
    Route::put('/email-templates/{id}', [AdminController::class, 'updateEmailTemplate']);
    Route::delete('/email-templates/{id}', [AdminController::class, 'deleteEmailTemplate']);
    Route::post('/email-templates/{id}/duplicate', [AdminController::class, 'duplicateEmailTemplate']);
    Route::post('/email-templates/{id}/test', [AdminController::class, 'testEmailTemplate']);

    // System Settings
    Route::get('/settings', [AdminController::class, 'getSystemSettings']);
    Route::post('/settings', [AdminController::class, 'updateSystemSettings']);
    
    // System Stats & Maintenance
    Route::get('/system/stats', [AdminController::class, 'getSystemStats']);
    Route::get('/system/info', [AdminController::class, 'getSystemInfo']);
    Route::post('/system/cache/clear', [AdminController::class, 'clearCache']);
    
    // Backup Management
    Route::get('/backups', [AdminController::class, 'getBackups']);
    Route::post('/backups', [AdminController::class, 'createBackup']);
    Route::get('/backups/download/{filename}', [AdminController::class, 'downloadBackup']);
    Route::delete('/backups/{id}', [AdminController::class, 'deleteBackup']);
    Route::post('/system/backup', [AdminController::class, 'createBackup']); // Legacy endpoint

    // Bulk Operations
    Route::post('/bulk/delete', [\App\Http\Controllers\Api\V1\Admin\BulkOperationsController::class, 'bulkDelete']);
    Route::post('/bulk/restore', [\App\Http\Controllers\Api\V1\Admin\BulkOperationsController::class, 'bulkRestore']);
    Route::post('/bulk/export', [\App\Http\Controllers\Api\V1\Admin\BulkOperationsController::class, 'bulkExport']);
    Route::post('/bulk/update-status', [\App\Http\Controllers\Api\V1\Admin\BulkOperationsController::class, 'bulkUpdateStatus']);
});

// NOTE: Super Admin department/course routes moved to routes/web.php for proper CSRF protection

// Health check route
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
        'version' => '1.0.0'
    ]);
});
