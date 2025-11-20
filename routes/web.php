<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;


// Public Alumni Survey/Registration Route
Route::get('/', function () {
    // Clear any stored previous URL to prevent redirects
    session()->forget('url.intended');
    return Inertia::render('Alumni/SurveyRegistration');
})->name('home');

Route::get('/survey/{id}', function ($id) {
    return Inertia::render('Alumni/SurveyRegistration', ['surveyId' => $id]);
})->name('survey.take');

// Admin Dashboard Routes  
Route::middleware(['web', 'auth', 'admin'])->group(function () {
    Route::get('/admin/dashboard', function () {
        return Inertia::render('admin/Dashboard', [
            'user' => Auth::user()
        ]);
    })->name('admin.dashboard');

    Route::get('/admin/analytics', function () {
        return Inertia::render('admin/Analytics', [
            'user' => Auth::user()
        ]);
    })->name('admin.analytics');

    // Alumni Management
    Route::get('/admin/alumni', function () {
        return Inertia::render('admin/AlumniBank', [
            'user' => Auth::user()
        ]);
    })->name('admin.alumni');

    Route::get('/admin/batches', function () {
        return Inertia::render('admin/Batches', [
            'user' => Auth::user()
        ]);
    })->name('admin.batches');

    // Survey System
    Route::get('/admin/surveys', function () {
        return Inertia::render('admin/SurveyBank', [
            'user' => Auth::user()
        ]);
    })->name('admin.surveys');

    Route::get('/admin/surveys/create', function () {
        return Inertia::render('admin/CreateSurvey', [
            'user' => Auth::user()
        ]);
    })->name('admin.surveys.create');

    Route::get('/admin/questions', function () {
        return Inertia::render('admin/Questions', [
            'user' => Auth::user()
        ]);
    })->name('admin.questions');

    Route::get('/admin/survey-analytics', function () {
        return Inertia::render('admin/SurveyAnalytics', [
            'user' => Auth::user()
        ]);
    })->name('admin.survey-analytics');

    // User Management
    Route::get('/admin/users', function () {
        return Inertia::render('admin/UserManagement', [
            'user' => Auth::user()
        ]);
    })->name('admin.users');

    Route::get('/admin/permissions', function () {
        return Inertia::render('SuperAdmin/PermissionMatrix', [
            'auth' => [
                'user' => Auth::user()
            ]
        ]);
    })->name('admin.permissions');

    // Role Management Routes
    Route::get('/admin/roles/create', function () {
        return Inertia::render('admin/RoleForm', [
            'user' => Auth::user(),
            'mode' => 'create'
        ]);
    })->name('admin.roles.create');

    Route::get('/admin/roles/{id}', function ($id) {
        return Inertia::render('admin/RoleView', [
            'user' => Auth::user(),
            'roleId' => $id
        ]);
    })->name('admin.roles.view');

    Route::get('/admin/roles/{id}/edit', function ($id) {
        return Inertia::render('admin/RoleForm', [
            'user' => Auth::user(),
            'roleId' => $id,
            'mode' => 'edit'
        ]);
    })->name('admin.roles.edit');

    Route::get('/admin/activity', function () {
        return Inertia::render('admin/ActivityLogs', [
            'user' => Auth::user()
        ]);
    })->name('admin.activity');

    // System
    Route::get('/admin/email-templates', function () {
        return Inertia::render('admin/EmailTemplates', [
            'user' => Auth::user()
        ]);
    })->name('admin.email-templates');

    Route::get('/admin/email-templates/create', function () {
        return Inertia::render('admin/TemplateForm', [
            'user' => Auth::user(),
            'mode' => 'create'
        ]);
    })->name('admin.email-templates.create');

    Route::get('/admin/email-templates/{id}', function ($id) {
        return Inertia::render('admin/TemplateView', [
            'user' => Auth::user(),
            'templateId' => $id
        ]);
    })->name('admin.email-templates.view');

    Route::get('/admin/email-templates/{id}/edit', function ($id) {
        return Inertia::render('admin/TemplateForm', [
            'user' => Auth::user(),
            'templateId' => $id,
            'mode' => 'edit'
        ]);
    })->name('admin.email-templates.edit');

    Route::get('/admin/backup', function () {
        return Inertia::render('admin/Backup', [
            'user' => Auth::user()
        ]);
    })->name('admin.backup');

    // Profile Settings (accessible to all admins)
    Route::get('/admin/profile', function () {
        return Inertia::render('shared/ProfileSettings', [
            'auth' => [
                'user' => Auth::user()
            ]
        ]);
    })->name('admin.profile');

    // Two-Factor Authentication Settings (Google Authenticator only)
    // Route::get('/admin/2fa/settings', [App\Http\Controllers\Admin\TwoFactorController::class, 'index'])->name('admin.2fa.settings');
    // Route::get('/admin/2fa/setup-google-auth', [App\Http\Controllers\Admin\TwoFactorController::class, 'setupGoogleAuth'])->name('admin.2fa.setup-google');
    // Route::post('/admin/2fa/verify-google-auth', [App\Http\Controllers\Admin\TwoFactorController::class, 'verifyGoogleAuth'])->name('admin.2fa.verify-google');
    // Route::post('/admin/2fa/disable-google-auth', [App\Http\Controllers\Admin\TwoFactorController::class, 'disableGoogleAuth'])->name('admin.2fa.disable-google');
});

// Super Admin Routes (Super Admin Only)
Route::middleware(['web', 'auth', 'super_admin'])->prefix('super-admin')->group(function () {
    // Department & Course Management
    Route::get('/departments', function () {
        return Inertia::render('SuperAdmin/DepartmentManagement', [
            'auth' => [
                'user' => Auth::user()
            ]
        ]);
    })->name('super-admin.departments');

    // Department Dashboard
    Route::get('/departments/{id}', function ($id) {
        return Inertia::render('SuperAdmin/DepartmentDashboard', [
            'auth' => [
                'user' => Auth::user()
            ],
            'departmentId' => $id
        ]);
    })->name('super-admin.departments.view');

    Route::get('/courses', function () {
        return Inertia::render('SuperAdmin/CourseManagement', [
            'auth' => [
                'user' => Auth::user()
            ]
        ]);
    })->name('super-admin.courses');

    // Permission Management
    Route::get('/permissions', function () {
        return Inertia::render('SuperAdmin/PermissionMatrix', [
            'auth' => [
                'user' => Auth::user()
            ]
        ]);
    })->name('super-admin.permissions');

    // System Analytics
    Route::get('/analytics', function () {
        return Inertia::render('SuperAdmin/Analytics', [
            'auth' => [
                'user' => Auth::user()
            ]
        ]);
    })->name('super-admin.analytics');

    // System Metrics
    Route::get('/metrics', function () {
        return Inertia::render('SuperAdmin/SystemMetrics', [
            'auth' => [
                'user' => Auth::user()
            ]
        ]);
    })->name('super-admin.metrics');

    // System Settings
    Route::get('/settings', function () {
        return Inertia::render('SuperAdmin/ImprovedSystemSettings', [
            'auth' => [
                'user' => Auth::user()
            ]
        ]);
    })->name('super-admin.settings');
    
    // Legacy System Settings (keep old route for backward compatibility)
    Route::get('/settings-old', function () {
        return Inertia::render('SuperAdmin/SystemSettings', [
            'auth' => [
                'user' => Auth::user()
            ]
        ]);
    })->name('super-admin.settings-old');
});

// Super Admin API Routes (with CSRF protection via web middleware)
Route::middleware(['auth', 'super_admin'])->prefix('api/v1/admin/super-admin')->group(function () {
    // Departments
    Route::get('/departments', [\App\Http\Controllers\Admin\DepartmentController::class, 'index']);
    Route::post('/departments', [\App\Http\Controllers\Admin\DepartmentController::class, 'store']);
    Route::get('/departments/statistics', [\App\Http\Controllers\Admin\DepartmentController::class, 'statistics']);
    Route::get('/departments/{id}', [\App\Http\Controllers\Admin\DepartmentController::class, 'show']);
    Route::put('/departments/{id}', [\App\Http\Controllers\Admin\DepartmentController::class, 'update']);
    Route::delete('/departments/{id}', [\App\Http\Controllers\Admin\DepartmentController::class, 'destroy']);
    Route::post('/departments/{id}/restore', [\App\Http\Controllers\Admin\DepartmentController::class, 'restore']);

    // Courses
    Route::get('/courses', [\App\Http\Controllers\Admin\CourseController::class, 'index']);
    Route::post('/courses', [\App\Http\Controllers\Admin\CourseController::class, 'store']);
    Route::get('/courses/statistics', [\App\Http\Controllers\Admin\CourseController::class, 'statistics']);
    Route::get('/courses/{id}', [\App\Http\Controllers\Admin\CourseController::class, 'show']);
    Route::put('/courses/{id}', [\App\Http\Controllers\Admin\CourseController::class, 'update']);
    Route::post('/courses/{id}/reassign', [\App\Http\Controllers\Admin\CourseController::class, 'reassignAlumni']);
    Route::delete('/courses/{id}', [\App\Http\Controllers\Admin\CourseController::class, 'destroy']);
    Route::post('/courses/{id}/restore', [\App\Http\Controllers\Admin\CourseController::class, 'restore']);
});

// Alumni Dashboard Routes
Route::middleware(['web', 'auth', 'alumni'])->group(function () {
    // Dashboard
    Route::get('/alumni/dashboard', function () {
        return Inertia::render('Alumni/Dashboard');
    })->name('alumni.dashboard');

    // Profile Routes
    Route::get('/alumni/profile', function () {
        return Inertia::render('Alumni/Profile/View');
    })->name('alumni.profile.view');

    Route::get('/alumni/profile/edit', function () {
        return Inertia::render('Alumni/Profile/Edit');
    })->name('alumni.profile.edit');

    Route::put('/alumni/profile', [App\Http\Controllers\Alumni\ProfileController::class, 'update'])
        ->name('alumni.profile.update');

    // Settings Routes
    Route::get('/alumni/settings', function () {
        return Inertia::render('shared/ProfileSettings', [
            'auth' => [
                'user' => Auth::user()
            ]
        ]);
    })->name('alumni.settings');
    
    // Legacy Settings Routes (keep for backward compatibility)
    Route::get('/alumni/settings-old', [App\Http\Controllers\Alumni\SettingsController::class, 'index'])
        ->name('alumni.settings-old');
    Route::put('/alumni/settings/password', [App\Http\Controllers\Alumni\SettingsController::class, 'updatePassword'])
        ->name('alumni.settings.password');
    Route::put('/alumni/settings/notifications', [App\Http\Controllers\Alumni\SettingsController::class, 'updateNotifications'])
        ->name('alumni.settings.notifications');
    Route::put('/alumni/settings/privacy', [App\Http\Controllers\Alumni\SettingsController::class, 'updatePrivacy'])
        ->name('alumni.settings.privacy');

    // Survey Routes
    Route::get('/alumni/surveys', function () {
        return Inertia::render('Alumni/Surveys/MySurveys');
    })->name('alumni.surveys');

    Route::get('/alumni/surveys/history', function () {
        return Inertia::render('Alumni/Surveys/SurveyHistory');
    })->name('alumni.surveys.history');
    
    Route::get('/alumni/survey-history', function () {
        return Inertia::render('Alumni/Surveys/SurveyHistory');
    })->name('alumni.survey.history');

    Route::get('/alumni/surveys/{surveyId}/take', function ($surveyId) {
        return Inertia::render('Alumni/Surveys/TakeSurvey', [
            'surveyId' => $surveyId
        ]);
    })->name('alumni.surveys.take');

    Route::get('/alumni/certificates', function () {
        return Inertia::render('Alumni/Certificates');
    })->name('alumni.certificates');

    // Career Routes
    Route::get('/alumni/career', [App\Http\Controllers\Alumni\CareerController::class, 'index'])
        ->name('alumni.career');
    Route::post('/alumni/career', [App\Http\Controllers\Alumni\CareerController::class, 'store'])
        ->name('alumni.career.store');
    Route::put('/alumni/career/{id}', [App\Http\Controllers\Alumni\CareerController::class, 'update'])
        ->name('alumni.career.update');
    Route::delete('/alumni/career/{id}', [App\Http\Controllers\Alumni\CareerController::class, 'destroy'])
        ->name('alumni.career.destroy');

    // Job Board Routes
    Route::get('/alumni/jobs', [App\Http\Controllers\Alumni\JobController::class, 'index'])
        ->name('alumni.jobs');
    Route::get('/alumni/jobs/saved', [App\Http\Controllers\Alumni\JobController::class, 'savedJobs'])
        ->name('alumni.jobs.saved');
    Route::get('/alumni/jobs/applications', [App\Http\Controllers\Alumni\JobController::class, 'myApplications'])
        ->name('alumni.jobs.applications');
    Route::get('/alumni/jobs/{id}', [App\Http\Controllers\Alumni\JobController::class, 'show'])
        ->name('alumni.jobs.show');
    Route::post('/alumni/jobs', [App\Http\Controllers\Alumni\JobController::class, 'store'])
        ->name('alumni.jobs.store');
    Route::post('/alumni/jobs/{id}/save', [App\Http\Controllers\Alumni\JobController::class, 'saveJob'])
        ->name('alumni.jobs.save');
    Route::delete('/alumni/jobs/{id}/unsave', [App\Http\Controllers\Alumni\JobController::class, 'unsaveJob'])
        ->name('alumni.jobs.unsave');
    Route::post('/alumni/jobs/{id}/apply', [App\Http\Controllers\Alumni\JobController::class, 'apply'])
        ->name('alumni.jobs.apply');
    Route::delete('/alumni/jobs/applications/{id}', [App\Http\Controllers\Alumni\JobController::class, 'withdrawApplication'])
        ->name('alumni.jobs.withdraw');
    Route::put('/alumni/jobs/{id}', [App\Http\Controllers\Alumni\JobController::class, 'update'])
        ->name('alumni.jobs.update');
    Route::delete('/alumni/jobs/{id}', [App\Http\Controllers\Alumni\JobController::class, 'destroy'])
        ->name('alumni.jobs.destroy');

    // Education Routes
    Route::get('/alumni/education', function () {
        return Inertia::render('Alumni/Education/History');
    })->name('alumni.education');

    // Network Routes
    Route::get('/alumni/network', [App\Http\Controllers\Alumni\NetworkController::class, 'index'])
        ->name('alumni.network');
    Route::get('/alumni/connections', [App\Http\Controllers\Alumni\NetworkController::class, 'connections'])
        ->name('alumni.connections');
    Route::get('/alumni/network/requests', [App\Http\Controllers\Alumni\NetworkController::class, 'requests'])
        ->name('alumni.network.requests');
    Route::post('/alumni/network/connect', [App\Http\Controllers\Alumni\NetworkController::class, 'sendRequest'])
        ->name('alumni.network.connect');
    Route::put('/alumni/network/{id}/accept', [App\Http\Controllers\Alumni\NetworkController::class, 'acceptRequest'])
        ->name('alumni.network.accept');
    Route::put('/alumni/network/{id}/reject', [App\Http\Controllers\Alumni\NetworkController::class, 'rejectRequest'])
        ->name('alumni.network.reject');
    Route::delete('/alumni/network/{id}', [App\Http\Controllers\Alumni\NetworkController::class, 'removeConnection'])
        ->name('alumni.network.remove');

    Route::get('/alumni/messages', function () {
        return Inertia::render('Alumni/Network/Messages');
    })->name('alumni.messages');

    // Mentorship Routes
    Route::get('/alumni/mentorship', [App\Http\Controllers\Alumni\MentorshipController::class, 'index'])
        ->name('alumni.mentorship');
    Route::post('/alumni/mentorship/profile', [App\Http\Controllers\Alumni\MentorshipController::class, 'createMentorProfile'])
        ->name('alumni.mentorship.profile.create');
    Route::put('/alumni/mentorship/profile', [App\Http\Controllers\Alumni\MentorshipController::class, 'updateMentorProfile'])
        ->name('alumni.mentorship.profile.update');
    Route::post('/alumni/mentorship/request', [App\Http\Controllers\Alumni\MentorshipController::class, 'requestMentorship'])
        ->name('alumni.mentorship.request');
    Route::put('/alumni/mentorship/{id}/accept', [App\Http\Controllers\Alumni\MentorshipController::class, 'acceptMentorship'])
        ->name('alumni.mentorship.accept');
    Route::put('/alumni/mentorship/{id}/reject', [App\Http\Controllers\Alumni\MentorshipController::class, 'rejectMentorship'])
        ->name('alumni.mentorship.reject');
    Route::put('/alumni/mentorship/{id}/complete', [App\Http\Controllers\Alumni\MentorshipController::class, 'completeMentorship'])
        ->name('alumni.mentorship.complete');
    Route::delete('/alumni/mentorship/{id}', [App\Http\Controllers\Alumni\MentorshipController::class, 'cancelMentorship'])
        ->name('alumni.mentorship.cancel');

    // Resources
    Route::get('/alumni/documents', function () {
        return Inertia::render('Alumni/Documents');
    })->name('alumni.documents');

    // Help & Support
    Route::get('/alumni/help', function () {
        return Inertia::render('Alumni/Help');
    })->name('alumni.help');
});

// Dashboard route that redirects based on user role
Route::middleware(['web', 'auth'])->get('/dashboard', function () {
    $user = Auth::user();
    
    // Super admins and regular admins both go to admin dashboard
    if ($user && in_array($user->role, ['super_admin', 'admin'])) {
        return redirect()->route('admin.dashboard');
    } elseif ($user && $user->role === 'alumni') {
        return redirect()->route('alumni.dashboard');
    } else {
        return redirect('/')->with('error', 'Invalid user role');
    }
})->name('dashboard');

// Two-Factor Authentication Routes
// Route::middleware(['web', 'auth'])->group(function () {
//     Route::get('/two-factor/setup', [App\Http\Controllers\Auth\TwoFactorSetupController::class, 'show'])->name('two-factor.setup');
// });

// Auth routes for web-based authentication
require __DIR__.'/auth.php';
