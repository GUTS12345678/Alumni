<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\TwoFactorSetupMail;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;
use PragmaRX\Google2FA\Google2FA;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        // Generate 2FA secret key
        $google2fa = new Google2FA();
        $secretKey = $google2fa->generateSecretKey();

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'alumni', // Default role for registration
            'google2fa_secret' => $secretKey, // Store 2FA secret
        ]);

        // Generate QR code URL
        $qrCodeUrl = $google2fa->getQRCodeUrl(
            config('app.name'),
            $user->email,
            $secretKey
        );

        // Send 2FA setup email
        try {
            Mail::to($user->email)->send(new TwoFactorSetupMail($user, $qrCodeUrl, $secretKey));
        } catch (\Exception $e) {
            \Log::error('Failed to send 2FA setup email: ' . $e->getMessage());
        }

        event(new Registered($user));

        Auth::login($user);

        // Redirect to dashboard with success message
        return redirect()->route('dashboard')->with([
            'success' => 'Registration successful! Please check your email for Two-Factor Authentication setup instructions.',
            'show2FASetup' => true,
        ]);
    }
}
