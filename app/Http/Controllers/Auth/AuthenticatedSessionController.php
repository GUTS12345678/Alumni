<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        // If accessing login directly, clear any stale intended URL
        if (!$request->session()->has('url.intended')) {
            $request->session()->forget('url.intended');
        }

        // Compute real stats for the login page
        $totalAlumniProfiles = \App\Models\AlumniProfile::count();
        $employedAlumni = \App\Models\AlumniProfile::whereIn('employment_status', [
            'employed_full_time', 'employed_part_time', 'self_employed'
        ])->count();
        $employmentRate = $totalAlumniProfiles > 0 ? round(($employedAlumni / $totalAlumniProfiles) * 100) : 0;

        $stats = [
            'totalAlumni'    => \App\Models\User::where('role_id', 3)->count(),
            'employmentRate' => $employmentRate,
            'industries'     => \App\Models\CareerHistory::whereNotNull('industry')
                ->where('industry', '!=', '')
                ->distinct('industry')
                ->count('industry'),
        ];

        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
            'stats' => $stats,
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        // Check if user has 2FA enabled
        $user = $request->user();
        if ($user && $user->google2fa_secret) {
            // Don't log in yet, store user ID for 2FA verification
            Auth::guard('web')->logout();
            session(['2fa:user:id' => $user->id]);
            
            return redirect()->route('two-factor.challenge');
        }

        $request->session()->regenerate();

        // Use the central dashboard route which handles role-based redirects
        return redirect()->intended(route('dashboard'));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
