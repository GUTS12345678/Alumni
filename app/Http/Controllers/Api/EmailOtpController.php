<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\EmailOtpMail;
use App\Models\EmailOtp;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\RateLimiter;

class EmailOtpController extends Controller
{
    /**
     * Send OTP to email for verification
     */
    public function sendOtp(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'purpose' => 'sometimes|string|in:registration,password_reset',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = strtolower($request->email);
        $purpose = $request->purpose ?? 'registration';

        // Rate limiting: max 3 OTP requests per email per 10 minutes
        $key = 'otp_send_' . $email;
        if (RateLimiter::tooManyAttempts($key, 3)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'success' => false,
                'message' => "Too many OTP requests. Please try again in {$seconds} seconds.",
            ], 429);
        }
        RateLimiter::hit($key, 600); // 10 minutes

        // For registration: check if email already exists
        if ($purpose === 'registration') {
            $existingUser = User::where('email', $email)->first();
            if ($existingUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'This email is already registered. Please login instead.',
                ], 409);
            }
        }

        // For password reset: check if email exists
        if ($purpose === 'password_reset') {
            $existingUser = User::where('email', $email)->first();
            if (!$existingUser) {
                // Don't reveal if email exists for security
                return response()->json([
                    'success' => true,
                    'message' => 'If this email exists, an OTP has been sent.',
                ]);
            }
        }

        try {
            // Generate OTP
            $otpRecord = EmailOtp::generateOtp($email, $purpose);

            // Send email
            Mail::to($email)->send(new EmailOtpMail($email, $otpRecord->otp, $purpose));

            return response()->json([
                'success' => true,
                'message' => 'Verification code sent to your email. Please check your inbox.',
                'expires_in' => 600, // 10 minutes in seconds
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to send OTP email: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to send verification code. Please try again.',
            ], 500);
        }
    }

    /**
     * Verify OTP code
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
            'purpose' => 'sometimes|string|in:registration,password_reset',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = strtolower($request->email);
        $otp = $request->otp;
        $purpose = $request->purpose ?? 'registration';

        // Rate limiting: max 5 verification attempts per email per 10 minutes
        $key = 'otp_verify_' . $email;
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'success' => false,
                'message' => "Too many verification attempts. Please try again in {$seconds} seconds.",
            ], 429);
        }
        RateLimiter::hit($key, 600); // 10 minutes

        // Verify OTP
        $isValid = EmailOtp::verifyOtp($email, $otp, $purpose);

        if ($isValid) {
            // Clear rate limiter on success
            RateLimiter::clear($key);

            return response()->json([
                'success' => true,
                'message' => 'Email verified successfully!',
                'verified' => true,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Invalid or expired verification code. Please try again.',
            'verified' => false,
        ], 400);
    }

    /**
     * Check if email is verified
     */
    public function checkVerification(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'purpose' => 'sometimes|string|in:registration,password_reset',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = strtolower($request->email);
        $purpose = $request->purpose ?? 'registration';

        $isVerified = EmailOtp::isEmailVerified($email, $purpose);

        return response()->json([
            'success' => true,
            'verified' => $isVerified,
        ]);
    }

    /**
     * Resend OTP
     */
    public function resendOtp(Request $request): JsonResponse
    {
        return $this->sendOtp($request);
    }
}
