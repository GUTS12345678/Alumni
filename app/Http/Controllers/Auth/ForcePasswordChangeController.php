<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class ForcePasswordChangeController extends Controller
{
    /**
     * Show the force password change page.
     */
    public function show(Request $request)
    {
        $user = $request->user();

        // If user doesn't need to change password, redirect to dashboard
        if (!$user->must_change_password) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('auth/ForcePasswordChange', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'has_placeholder_email' => str_ends_with($user->email, '@imported.alumni'),
            ],
        ]);
    }

    /**
     * Update the user's password and optionally their email.
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $rules = [
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];

        // If user has a placeholder email, require a real email
        if (str_ends_with($user->email, '@imported.alumni')) {
            $rules['email'] = ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id];
        } else {
            $rules['email'] = ['nullable', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id];
        }

        $validated = $request->validate($rules);

        // Update password
        $user->password = Hash::make($validated['password']);
        $user->must_change_password = false;

        // Update email if provided
        if (!empty($validated['email'])) {
            $user->email = $validated['email'];
        }

        $user->save();

        return redirect()->route('dashboard')->with('success', 'Password updated successfully. Welcome to the Alumni Tracer System!');
    }
}
