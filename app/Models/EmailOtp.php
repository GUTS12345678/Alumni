<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class EmailOtp extends Model
{
    protected $fillable = [
        'email',
        'otp',
        'purpose',
        'verified',
        'expires_at',
    ];

    protected $casts = [
        'verified' => 'boolean',
        'expires_at' => 'datetime',
    ];

    /**
     * Generate a new OTP for the given email
     */
    public static function generateOtp(string $email, string $purpose = 'registration'): self
    {
        // Delete any existing OTPs for this email and purpose
        self::where('email', $email)
            ->where('purpose', $purpose)
            ->delete();

        // Generate a 6-digit OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Create new OTP record with 10-minute expiration
        return self::create([
            'email' => $email,
            'otp' => $otp,
            'purpose' => $purpose,
            'verified' => false,
            'expires_at' => Carbon::now()->addMinutes(10),
        ]);
    }

    /**
     * Verify an OTP
     */
    public static function verifyOtp(string $email, string $otp, string $purpose = 'registration'): bool
    {
        $record = self::where('email', $email)
            ->where('otp', $otp)
            ->where('purpose', $purpose)
            ->where('verified', false)
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if ($record) {
            $record->update(['verified' => true]);
            return true;
        }

        return false;
    }

    /**
     * Check if email has a verified OTP
     */
    public static function isEmailVerified(string $email, string $purpose = 'registration'): bool
    {
        return self::where('email', $email)
            ->where('purpose', $purpose)
            ->where('verified', true)
            ->where('expires_at', '>', Carbon::now()->subHour()) // Valid for 1 hour after verification
            ->exists();
    }

    /**
     * Clean up expired OTPs
     */
    public static function cleanupExpired(): int
    {
        return self::where('expires_at', '<', Carbon::now()->subHours(24))->delete();
    }
}
