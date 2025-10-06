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

    Route::get('/admin/profiles', function () {
        return Inertia::render('admin/Profiles', [
            'user' => Auth::user()
        ]);
    })->name('admin.profiles');

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
        return Inertia::render('admin/Permissions', [
            'user' => Auth::user()
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

    Route::get('/admin/settings', function () {
        return Inertia::render('admin/SystemSettings', [
            'user' => Auth::user()
        ]);
    })->name('admin.settings');

    Route::get('/admin/backup', function () {
        return Inertia::render('admin/Backup', [
            'user' => Auth::user()
        ]);
    })->name('admin.backup');
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

    Route::get('/alumni/settings', function () {
        return Inertia::render('Alumni/Settings');
    })->name('alumni.settings');

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

    Route::get('/alumni/certificates', function () {
        return Inertia::render('Alumni/Certificates');
    })->name('alumni.certificates');

    // Career Routes
    Route::get('/alumni/career', function () {
        return Inertia::render('Alumni/Career/Timeline');
    })->name('alumni.career');

    Route::get('/alumni/jobs', function () {
        return Inertia::render('Alumni/Jobs');
    })->name('alumni.jobs');

    // Education Routes
    Route::get('/alumni/education', function () {
        return Inertia::render('Alumni/Education/History');
    })->name('alumni.education');

    // Network Routes
    Route::get('/alumni/network', function () {
        return Inertia::render('Alumni/Network/AlumniDirectory');
    })->name('alumni.network');

    Route::get('/alumni/connections', function () {
        return Inertia::render('Alumni/Network/MyConnections');
    })->name('alumni.connections');

    Route::get('/alumni/messages', function () {
        return Inertia::render('Alumni/Network/Messages');
    })->name('alumni.messages');

    Route::get('/alumni/mentorship', function () {
        return Inertia::render('Alumni/Mentorship');
    })->name('alumni.mentorship');

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
    
    if ($user && $user->role === 'admin') {
        return redirect()->route('admin.dashboard');
    } elseif ($user && $user->role === 'alumni') {
        return redirect()->route('alumni.dashboard');
    } else {
        return redirect('/')->with('error', 'Invalid user role');
    }
})->name('dashboard');

// Auth routes for web-based authentication
require __DIR__.'/auth.php';
