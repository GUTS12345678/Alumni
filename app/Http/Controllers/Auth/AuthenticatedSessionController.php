<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\ActivityLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        // Clear stale intended URLs that would redirect back to public pages
        if ($request->session()->has('url.intended')) {
            $intended = $request->session()->get('url.intended');
            $publicUrls = [url('/'), route('home'), url('/login'), route('login')];
            if (in_array(rtrim($intended, '/'), array_map(fn($u) => rtrim($u, '/'), $publicUrls))) {
                $request->session()->forget('url.intended');
            }
        }

        // Compute real stats for the login page
        $totalAlumniProfiles = \App\Models\AlumniProfile::count();
        $employedAlumni = \App\Models\AlumniProfile::whereIn('employment_status', [
            'employed_full_time', 'employed_part_time', 'self_employed'
        ])->count();
        $employmentRate = $totalAlumniProfiles > 0 ? round(($employedAlumni / $totalAlumniProfiles) * 100) : 0;

        $stats = [
            'totalAlumni'    => \App\Models\User::where('role', 'alumni')->count(),
            'employmentRate' => $employmentRate,
            'industries'     => \App\Models\AlumniProfile::whereNotNull('company_industry')
                ->where('company_industry', '!=', '')
                ->distinct('company_industry')
                ->count('company_industry'),
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
    public function store(LoginRequest $request): SymfonyResponse
    {
        $request->authenticate();

        $user = $request->user();

        // Check if user has 2FA enabled
        if ($user && $user->google2fa_secret) {
            Auth::guard('web')->logout();
            session(['2fa:user:id' => $user->id]);
            return redirect()->route('two-factor.challenge');
        }

        $request->session()->regenerate();

        // Log successful login
        ActivityLog::logLogin($user->id, $request->ip());

        // Determine redirect target
        if ($user->must_change_password) {
            $target = route('force-change-password');
        } else {
            // Pull intended URL, but sanitize it first
            $intended = session()->pull('url.intended');
            
            // Only use intended URL if it's a valid protected page (not public/login pages)
            if ($intended) {
                $publicUrls = [url('/'), route('home'), url('/login'), route('login')];
                $normalizedIntended = rtrim($intended, '/');
                $normalizedPublic = array_map(fn($u) => rtrim($u, '/'), $publicUrls);
                
                // Discard if it's a public page
                if (in_array($normalizedIntended, $normalizedPublic)) {
                    $intended = null;
                }
            }
            
            if ($intended) {
                $target = $intended;
            } elseif (in_array($user->role, ['super_admin', 'admin'])) {
                $target = route('admin.dashboard');
            } elseif ($user->role === 'alumni') {
                $target = route('alumni.dashboard');
            } else {
                $target = route('dashboard');
            }
        }

        // Use Inertia::location() to force a full-page redirect.
        // This ensures the browser does a real navigation (not XHR)
        // so the new session cookie from regenerate() is properly applied.
        return Inertia::location($target);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $userId = Auth::id();
        
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Log logout activity
        if ($userId) {
            ActivityLog::logLogout($userId);
        }

        return redirect('/');
    }
}
