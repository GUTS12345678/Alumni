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
    Route::get('/alumni/dashboard', function () {
        return Inertia::render('alumni/Dashboard');
    })->name('alumni.dashboard');
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
