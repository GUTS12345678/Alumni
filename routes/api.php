<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SurveyController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\EmailOtpController;
use App\Http\Controllers\Api\MessagingController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\JobBoardController;
use App\Http\Controllers\Api\ContentController;
use App\Http\Controllers\Api\CampusController;
use App\Http\Controllers\Api\PublicLandingController;
use App\Http\Controllers\Api\LandingContentController;
use App\Http\Controllers\Api\CertificateController;


// Public routes (no authentication required)
Route::prefix('v1')->group(function () {
    // Landing page public routes
    Route::prefix('public')->group(function () {
        Route::get('/announcements', [PublicLandingController::class, 'getAnnouncements']);
        Route::get('/jobs', [PublicLandingController::class, 'getJobs']);
        Route::get('/stats', [PublicLandingController::class, 'getStats']);
        Route::get('/content', [PublicLandingController::class, 'getContent']);
        Route::post('/search-alumni', [PublicLandingController::class, 'searchAlumni']);
        Route::get('/appearance', [\App\Http\Controllers\Api\V1\Admin\AppearanceController::class, 'index']);
    });

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
        Route::get('/departments/{id}/courses', [\App\Http\Controllers\Admin\DepartmentController::class, 'getCourses']);
    });

    // Campus routes (public - for registration dropdowns)
    Route::get('/campuses', [CampusController::class, 'index']);
    Route::get('/campuses/options', [CampusController::class, 'options']);

    // Validation endpoints for registration
    Route::post('/check-email', [AuthController::class, 'checkEmail']);
    Route::post('/check-student-id', [AuthController::class, 'checkStudentId']);
    Route::post('/check-phone', [AuthController::class, 'checkPhone']);
    Route::post('/check-login', [AuthController::class, 'checkLogin']);
});

// ============================================================
// PUBLIC ASSET SERVE ROUTE (no auth — branding, department images)
// Only serves whitelisted paths: appearance/, departments/
// ============================================================
Route::get('v1/assets/{path}', [\App\Http\Controllers\FileServeController::class, 'servePublic'])
    ->where('path', '.*')
    ->name('assets.serve');

// ============================================================
// PRIVATE FILE SERVE ROUTE
// Files uploaded to private storage (storage/app/uploads/) are
// streamed through this authenticated route instead of being
// directly accessible from the public web root.
// ============================================================
Route::get('v1/files/{path}', [\App\Http\Controllers\FileServeController::class, 'serve'])
    ->where('path', '.*')
    ->middleware('auth:sanctum')
    ->name('files.serve');

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

    // Campus routes (authenticated) - literal routes MUST come before {campus} wildcard
    Route::get('/campuses/comparison', [CampusController::class, 'comparison']);
    Route::get('/campuses/distribution', [CampusController::class, 'distribution']);
    Route::get('/campuses/employment-breakdown', [CampusController::class, 'employmentBreakdown']);
    Route::get('/campuses/can-switch', [CampusController::class, 'canSwitch']);
    Route::get('/campuses/effective', [CampusController::class, 'effective']);
    Route::get('/campuses/{campus}', [CampusController::class, 'show']);
    Route::get('/campuses/{campus}/statistics', [CampusController::class, 'statistics']);
});

// Alumni-only routes (authentication + alumni role required)
Route::prefix('v1/alumni')->middleware(['auth:sanctum', 'alumni'])->group(function () {
    // Alumni profile
    Route::get('/profile', [AuthController::class, 'alumniProfile']);
    Route::put('/profile', [AuthController::class, 'updateAlumniProfile']);
    
    // Two-Factor Authentication for alumni
    // Route::post('/two-factor/verify-setup', [\App\Http\Controllers\Auth\TwoFactorSetupController::class, 'verifySetup']);
});

// ============================================================
// CERTIFICATES ROUTES
// ============================================================
Route::prefix('v1/certificates')->middleware(['auth:sanctum'])->group(function () {
    Route::get('/', [CertificateController::class, 'index']);
    Route::get('/stats', [CertificateController::class, 'stats']);
    Route::get('/{id}', [CertificateController::class, 'show']);
    Route::get('/{id}/download', [CertificateController::class, 'download']);
    Route::post('/request-membership', [CertificateController::class, 'requestMembershipCertificate']);
});

// ============================================================
// MESSAGING SYSTEM ROUTES
// ============================================================
Route::prefix('v1/messaging')->middleware(['auth:sanctum,web'])->group(function () {
    // Conversations
    Route::get('/conversations', [MessagingController::class, 'getConversations']);
    Route::get('/conversations/{conversation}', [MessagingController::class, 'getConversation']);
    Route::post('/conversations', [MessagingController::class, 'createConversation']);
    Route::post('/conversations/{conversation}/leave', [MessagingController::class, 'leaveConversation']);
    
    // Messages
    Route::post('/conversations/{conversation}/messages', [MessagingController::class, 'sendMessage']);
    Route::post('/conversations/{conversation}/read', [MessagingController::class, 'markAsRead']);
    Route::post('/conversations/{conversation}/typing', [MessagingController::class, 'typing']);
    
    // Group invitations
    Route::get('/invitations', [MessagingController::class, 'getPendingInvitations']);
    Route::post('/conversations/{conversation}/accept', [MessagingController::class, 'acceptInvitation']);
    Route::post('/conversations/{conversation}/decline', [MessagingController::class, 'declineInvitation']);
    
    // Blocking
    Route::get('/blocked', [MessagingController::class, 'getBlockedUsers']);
    Route::post('/block', [MessagingController::class, 'blockUser']);
    Route::post('/unblock', [MessagingController::class, 'unblockUser']);
    
    // User search for messaging
    Route::get('/users/search', [MessagingController::class, 'searchUsers']);
    
    // Unread count
    Route::get('/unread-count', [MessagingController::class, 'getUnreadCount']);

    // Admin archive / history (admin-only)
    Route::get('/archive/conversations', [MessagingController::class, 'getArchiveConversations']);
    Route::get('/archive/conversations/{conversation}', [MessagingController::class, 'getArchiveMessages']);
    Route::get('/archive/conversations/{conversation}/export', [MessagingController::class, 'exportConversation']);
});

// ============================================================
// UNIFIED CONTENT ROUTES (replaces separate announcements/jobs)
// ============================================================
Route::prefix('v1/content')->middleware(['auth:sanctum'])->group(function () {
    // Public/Alumni viewing
    Route::get('/', [ContentController::class, 'index']);
    Route::get('/featured', [ContentController::class, 'getFeatured']);
    Route::get('/recent', [ContentController::class, 'getRecent']);
    Route::get('/unread-count', [ContentController::class, 'getUnreadCount']);
    Route::get('/categories', [ContentController::class, 'getCategories']);
    Route::get('/{content}', [ContentController::class, 'show']);
    Route::post('/{content}/read', [ContentController::class, 'markAsRead']);

    // Admin routes
    Route::middleware(['admin'])->group(function () {
        Route::get('/admin/list', [ContentController::class, 'adminIndex']);
        Route::get('/admin/statistics', [ContentController::class, 'getStatistics']);
        Route::get('/admin/export', [ContentController::class, 'exportContent']);
        Route::get('/admin/batch-years', [ContentController::class, 'getBatchYears']);
        Route::post('/admin/create', [ContentController::class, 'store']);
        Route::put('/admin/{content}', [ContentController::class, 'update']);
        Route::delete('/admin/{content}', [ContentController::class, 'destroy']);
        Route::post('/admin/bulk-status', [ContentController::class, 'bulkUpdateStatus']);
        Route::post('/admin/upload-media', [ContentController::class, 'uploadMedia']);

        // Category management
        Route::post('/admin/categories', [ContentController::class, 'storeCategory']);
        Route::put('/admin/categories/{category}', [ContentController::class, 'updateCategory']);
        Route::delete('/admin/categories/{category}', [ContentController::class, 'destroyCategory']);
    });
});

// ============================================================
// LEGACY ANNOUNCEMENTS ROUTES (backward compatibility)
// ============================================================
Route::prefix('v1/announcements')->middleware(['auth:sanctum'])->group(function () {
    // Alumni routes (viewing announcements)
    Route::get('/', [AnnouncementController::class, 'index']);
    Route::get('/unread-count', [AnnouncementController::class, 'getUnreadCount']);
    Route::get('/{announcement}', [AnnouncementController::class, 'show']);
    Route::post('/{announcement}/read', [AnnouncementController::class, 'markAsRead']);
    
    // Admin routes (managing announcements)
    Route::middleware(['admin'])->group(function () {
        Route::get('/admin/list', [AnnouncementController::class, 'adminIndex']);
        Route::get('/admin/export', [AnnouncementController::class, 'exportAnnouncements']);
        Route::get('/admin/batch-years', [AnnouncementController::class, 'getBatchYears']);
        Route::post('/admin/create', [AnnouncementController::class, 'store']);
        Route::put('/admin/{announcement}', [AnnouncementController::class, 'update']);
        Route::delete('/admin/{announcement}', [AnnouncementController::class, 'destroy']);
    });
});

// ============================================================
// JOB BOARD ROUTES (PUBLIC)
// ============================================================
Route::prefix('v1/jobs')->group(function () {
    // Public routes (no auth required for viewing)
    Route::get('/', [JobBoardController::class, 'index']);
    Route::get('/categories', [JobBoardController::class, 'getCategories']);
    Route::get('/featured', [JobBoardController::class, 'getFeatured']);
    Route::get('/recent', [JobBoardController::class, 'getRecent']);
    Route::get('/{jobPosting}', [JobBoardController::class, 'show']);
});

// JOB BOARD ADMIN ROUTES
Route::prefix('v1/admin/jobs')->middleware(['auth:sanctum', 'admin'])->group(function () {
    // Job postings management
    Route::get('/', [JobBoardController::class, 'adminIndex']);
    Route::post('/', [JobBoardController::class, 'store']);
    Route::get('/export', [JobBoardController::class, 'exportJobs']);
    Route::get('/statistics', [JobBoardController::class, 'getStatistics']);
    Route::get('/{jobPosting}', [JobBoardController::class, 'show']);
    Route::put('/{jobPosting}', [JobBoardController::class, 'update']);
    Route::delete('/{jobPosting}', [JobBoardController::class, 'destroy']);
    Route::post('/bulk-status', [JobBoardController::class, 'bulkUpdateStatus']);
    
    // Category management
    Route::post('/categories', [JobBoardController::class, 'storeCategory']);
    Route::put('/categories/{category}', [JobBoardController::class, 'updateCategory']);
    Route::delete('/categories/{category}', [JobBoardController::class, 'destroyCategory']);
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

    // Session/Device management
    Route::get('/sessions', [\App\Http\Controllers\Api\SessionController::class, 'index']);
    Route::delete('/sessions/{tokenId}', [\App\Http\Controllers\Api\SessionController::class, 'destroy']);
    Route::delete('/sessions', [\App\Http\Controllers\Api\SessionController::class, 'destroyOthers']);
});

// Public routes (no authentication required)
Route::prefix('v1/public')->group(function () {
    Route::get('/appearance', [\App\Http\Controllers\Api\V1\Admin\AppearanceController::class, 'index']);
});

// Admin-only routes (authentication + admin role required)
Route::prefix('v1/admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [AdminController::class, 'dashboard']);
    Route::post('/dashboard/refresh-cache', [AdminController::class, 'refreshDashboardCache']);
    
    // Cache Management
    Route::post('/cache/clear-all', [AdminController::class, 'clearAllCaches']);
    Route::get('/cache/health', [AdminController::class, 'cacheHealthCheck']);

    // Department management (protected - requires admin auth)
    Route::put('/departments/{id}', [\App\Http\Controllers\Admin\DepartmentController::class, 'update']);
    Route::get('/departments/{id}/alumni', [\App\Http\Controllers\Admin\DepartmentController::class, 'getAlumni']);
    Route::get('/departments/{id}/analytics', [\App\Http\Controllers\Admin\DepartmentController::class, 'getAnalytics']);
    Route::get('/departments/{id}/analytics/export', [\App\Http\Controllers\Admin\DepartmentController::class, 'exportAnalytics']);
    Route::post('/departments/upload-image', [\App\Http\Controllers\Admin\DepartmentController::class, 'uploadImage']);

    // Landing Page Content Management (Admin & Counselor)
    Route::prefix('landing-content')->group(function () {
        Route::get('/', [LandingContentController::class, 'index']);
        Route::get('/statistics', [LandingContentController::class, 'getStatistics']);
        Route::post('/', [LandingContentController::class, 'store']);
        Route::get('/{content}', [LandingContentController::class, 'show']);
        Route::put('/{content}', [LandingContentController::class, 'update']);
        Route::delete('/{content}', [LandingContentController::class, 'destroy']);
        Route::post('/{content}/toggle-publish', [LandingContentController::class, 'togglePublish']);
        Route::post('/reorder', [LandingContentController::class, 'reorder']);
    });

    // General file uploads (for announcements, job postings, etc.)
    Route::post('/upload/image', [\App\Http\Controllers\Api\UploadController::class, 'uploadImage']);
    Route::delete('/upload/image', [\App\Http\Controllers\Api\UploadController::class, 'deleteImage']);

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
    Route::post('/alumni', [AdminController::class, 'createAlumni']);
    Route::post('/alumni/import/preview', [\App\Http\Controllers\Api\AlumniImportController::class, 'preview']);
    Route::post('/alumni/import', [\App\Http\Controllers\Api\AlumniImportController::class, 'import']);
    Route::get('/alumni/import/template', [\App\Http\Controllers\Api\AlumniImportController::class, 'downloadTemplate']);
    Route::delete('/alumni/bulk-delete', [AdminController::class, 'bulkDeleteAlumni']);
    Route::get('/alumni/{id}', [AdminController::class, 'getAlumniProfile']);
    Route::put('/alumni/{id}', [AdminController::class, 'updateAlumni']);
    Route::delete('/alumni/{id}', [AdminController::class, 'deleteAlumni']);

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
    Route::get('/analytics/comprehensive', [\App\Http\Controllers\Api\V1\Admin\AnalyticsController::class, 'getComprehensiveAnalytics']);
    Route::get('/analytics/comprehensive/export', [\App\Http\Controllers\Api\V1\Admin\AnalyticsController::class, 'exportComprehensiveAnalytics']);
    
    // Survey Analytics routes
    Route::get('/analytics/overview', [\App\Http\Controllers\Api\V1\Admin\AnalyticsController::class, 'getAnalyticsOverview']);
    Route::get('/analytics/surveys/{survey}', [\App\Http\Controllers\Api\V1\Admin\AnalyticsController::class, 'getSurveyAnalytics']);
    Route::get('/analytics/surveys/{survey}/responses', [\App\Http\Controllers\Api\V1\Admin\AnalyticsController::class, 'getSurveyResponses']);
    Route::post('/analytics/surveys/{survey}/export', [\App\Http\Controllers\Api\V1\Admin\AnalyticsController::class, 'exportSurveyAnalytics']);
    Route::post('/analytics/surveys/export-all', [\App\Http\Controllers\Api\V1\Admin\AnalyticsController::class, 'exportAllSurveys']);

    // Job Classification routes
    Route::prefix('job-classifier')->group(function () {
        Route::get('/stats', [\App\Http\Controllers\Api\JobClassifierController::class, 'getStats']);
        Route::post('/preview', [\App\Http\Controllers\Api\JobClassifierController::class, 'preview']);
        Route::get('/alumni/{alumniId}', [\App\Http\Controllers\Api\JobClassifierController::class, 'classify']);
        Route::post('/alumni/{alumniId}', [\App\Http\Controllers\Api\JobClassifierController::class, 'classifyAndSave']);
        Route::post('/classify-all', [\App\Http\Controllers\Api\JobClassifierController::class, 'classifyAll']);
    });

    // Batch management
    Route::get('/batches', [AdminController::class, 'getBatches']);
    Route::get('/batches/export', [AdminController::class, 'exportBatches']);
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
    Route::get('/users/export', [AdminController::class, 'exportUsers']);
    Route::post('/users', [AdminController::class, 'createUser']);
    Route::put('/users/{id}', [AdminController::class, 'updateUser']);
    Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
    Route::patch('/users/{id}/status', [AdminController::class, 'updateUserStatus']);
    Route::post('/users/{id}/reset-password', [AdminController::class, 'resetUserPassword']);
    Route::post('/users/{id}/set-password', [AdminController::class, 'setUserPassword']);

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

    // Admin Session Management
    Route::get('/sessions', [\App\Http\Controllers\Api\AdminSessionController::class, 'index']);
    Route::delete('/sessions/{tokenId}', [\App\Http\Controllers\Api\AdminSessionController::class, 'destroy']);
    Route::delete('/sessions/user/{userId}', [\App\Http\Controllers\Api\AdminSessionController::class, 'destroyUserSessions']);

    // Archive (soft-deleted items)
    Route::get('/archive', [\App\Http\Controllers\Api\V1\Admin\ArchiveController::class, 'index']);
    Route::post('/archive/{type}/{id}/restore', [\App\Http\Controllers\Api\V1\Admin\ArchiveController::class, 'restore']);
    Route::delete('/archive/{type}/{id}', [\App\Http\Controllers\Api\V1\Admin\ArchiveController::class, 'forceDelete']);
    Route::post('/archive/bulk-restore', [\App\Http\Controllers\Api\V1\Admin\ArchiveController::class, 'bulkRestore']);
    Route::post('/archive/bulk-delete', [\App\Http\Controllers\Api\V1\Admin\ArchiveController::class, 'bulkForceDelete']);
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
