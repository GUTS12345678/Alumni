<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Public Alumni Survey/Registration Route
Route::get('/', function () {
    return Inertia::render('Alumni/SurveyRegistration');
})->name('home');

Route::get('/survey/{id}', function ($id) {
    return Inertia::render('Alumni/SurveyRegistration', ['surveyId' => $id]);
})->name('survey.take');

// Login Route
Route::get('/login', function () {
    return Inertia::render('auth/login');
})->name('login');

// Admin Dashboard Routes
Route::get('/admin/dashboard', function () {
    return Inertia::render('admin/Dashboard');
})->name('admin.dashboard');

// Alumni Dashboard Routes
Route::get('/alumni/dashboard', function () {
    return Inertia::render('alumni/Dashboard');
})->name('alumni.dashboard');

// Remove old auth routes - we'll handle this in the survey
// require __DIR__.'/auth.php';
