<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorController extends Controller
{
    /**
     * Show the 2FA challenge page
     */
    public function challenge()
    {
        if (!session()->has('2fa:user:id')) {
            return redirect()->route('login');
        }

        return Inertia::render('auth/TwoFactorChallenge');
    }

    /**
     * Verify the 2FA code
     */
    public function verify(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $userId = session('2fa:user:id');
        
        if (!$userId) {
            return redirect()->route('login')->withErrors(['code' => 'Session expired. Please login again.']);
        }

        $user = User::find($userId);

        if (!$user) {
            return redirect()->route('login')->withErrors(['code' => 'User not found.']);
        }

        $google2fa = new Google2FA();
        $valid = $google2fa->verifyKey($user->google2fa_secret, $request->code);

        if ($valid) {
            Auth::login($user);
            session()->forget('2fa:user:id');
            $request->session()->regenerate();
            $request->session()->save();

            // Log successful login after 2FA verification
            ActivityLog::logLogin($user->id, $request->ip());

            return redirect()->intended('/dashboard');
        }

        return back()->withErrors(['code' => 'Invalid verification code. Please try again.']);
    }
}
