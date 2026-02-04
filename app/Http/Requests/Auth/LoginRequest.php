<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Allow either email OR student_id for login
        return [
            'email' => ['nullable', 'string', 'email', 'required_without:student_id'],
            'student_id' => ['nullable', 'string', 'required_without:email'],
            'password' => ['required', 'string', 'min:8'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        // Determine login credentials (email or student_id)
        $credentials = ['password' => $this->input('password')];
        $loginField = 'email';
        
        if ($this->filled('email')) {
            $credentials['email'] = $this->input('email');
            $loginField = 'email';
        } elseif ($this->filled('student_id')) {
            // Find user by student_id from alumni_profiles table
            $profile = \App\Models\AlumniProfile::where('student_id', $this->input('student_id'))->first();
            
            if (!$profile) {
                RateLimiter::hit($this->throttleKey());
                throw ValidationException::withMessages([
                    'login' => 'Student ID not found in our records.',
                    'general' => 'Invalid student ID or password. Please try again.',
                ]);
            }
            
            // Get the user associated with this profile
            $user = $profile->user;
            if (!$user) {
                RateLimiter::hit($this->throttleKey());
                throw ValidationException::withMessages([
                    'login' => 'Account not found for this student ID.',
                    'general' => 'Invalid student ID or password. Please try again.',
                ]);
            }
            
            // Manually verify password
            if (!\Illuminate\Support\Facades\Hash::check($this->input('password'), $user->password)) {
                RateLimiter::hit($this->throttleKey());
                throw ValidationException::withMessages([
                    'login' => 'These credentials do not match our records.',
                    'general' => 'Invalid student ID or password. Please try again.',
                ]);
            }
            
            // Manually log in the user
            Auth::login($user, $this->boolean('remember'));
            
            // Update last login
            $user->last_login_at = now();
            $user->save();
            
            RateLimiter::clear($this->throttleKey());
            return;
        }

        // Standard email authentication
        if (! Auth::attempt($credentials, $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'login' => 'These credentials do not match our records.',
                'general' => 'Invalid email or password. Please try again.',
            ]);
        }

        // Update last login
        $user = Auth::user();
        $user->last_login_at = now();
        $user->save();

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'general' => __('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        $identifier = $this->filled('email') 
            ? $this->string('email') 
            : $this->string('student_id');
            
        return Str::transliterate(Str::lower($identifier).'|'.$this->ip());
    }
}
