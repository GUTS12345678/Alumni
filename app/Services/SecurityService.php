<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;

/**
 * Security Service
 * 
 * Centralized security operations following:
 * - OWASP Top 10 2021
 * - DICT Philippines Cybersecurity Framework
 * - ISO 27001:2022 Information Security Management
 * - NIST Cybersecurity Framework
 */
class SecurityService
{
    /**
     * Log security event
     * 
     * OWASP A09:2021 - Security Logging and Monitoring Failures
     */
    public function logSecurityEvent(string $event, array $context = [], string $level = 'info'): void
    {
        $logData = array_merge($context, [
            'event' => $event,
            'timestamp' => now()->toIso8601String(),
            'session_id' => session()->getId(),
            'request_id' => request()->header('X-Request-ID'),
        ]);

        // Store in security_logs table for audit trail
        DB::table('security_logs')->insert([
            'event_type' => $event,
            'level' => $level,
            'user_id' => $context['user_id'] ?? null,
            'ip_address' => $context['ip'] ?? request()->ip(),
            'user_agent' => $context['user_agent'] ?? request()->userAgent(),
            'details' => json_encode($logData),
            'created_at' => now(),
        ]);

        // Also log to file for SIEM integration
        match ($level) {
            'emergency' => Log::emergency($event, $logData),
            'alert' => Log::alert($event, $logData),
            'critical' => Log::critical($event, $logData),
            'error' => Log::error($event, $logData),
            'warning' => Log::warning($event, $logData),
            'notice' => Log::notice($event, $logData),
            'debug' => Log::debug($event, $logData),
            default => Log::info($event, $logData),
        };
    }

    /**
     * Check if IP is blocked
     * 
     * OWASP A07:2021 - Identification and Authentication Failures
     */
    public function isIpBlocked(string $ip): bool
    {
        // Check temporary blocks
        if (Cache::has("blocked_ip:{$ip}")) {
            return true;
        }

        // Check permanent blocks in database
        return DB::table('blocked_ips')
            ->where('ip_address', $ip)
            ->where(function ($query) {
                $query->whereNull('expires_at')
                      ->orWhere('expires_at', '>', now());
            })
            ->exists();
    }

    /**
     * Block an IP address
     */
    public function blockIp(string $ip, ?int $durationMinutes = null, string $reason = ''): void
    {
        if ($durationMinutes) {
            Cache::put("blocked_ip:{$ip}", true, now()->addMinutes($durationMinutes));
        }

        DB::table('blocked_ips')->updateOrInsert(
            ['ip_address' => $ip],
            [
                'reason' => $reason,
                'blocked_at' => now(),
                'expires_at' => $durationMinutes ? now()->addMinutes($durationMinutes) : null,
                'updated_at' => now(),
            ]
        );

        $this->logSecurityEvent('ip_blocked', [
            'ip' => $ip,
            'duration' => $durationMinutes,
            'reason' => $reason,
        ], 'warning');
    }

    /**
     * Validate password strength
     * 
     * OWASP A07:2021 - Identification and Authentication Failures
     * DICT Password Policy Guidelines
     */
    public function validatePasswordStrength(string $password): array
    {
        $errors = [];
        $score = 0;

        // Minimum length (DICT recommends 8-12 characters minimum)
        if (strlen($password) < 12) {
            $errors[] = 'Password must be at least 12 characters long.';
        } else {
            $score += 20;
        }

        // Uppercase letters
        if (!preg_match('/[A-Z]/', $password)) {
            $errors[] = 'Password must contain at least one uppercase letter.';
        } else {
            $score += 20;
        }

        // Lowercase letters
        if (!preg_match('/[a-z]/', $password)) {
            $errors[] = 'Password must contain at least one lowercase letter.';
        } else {
            $score += 20;
        }

        // Numbers
        if (!preg_match('/[0-9]/', $password)) {
            $errors[] = 'Password must contain at least one number.';
        } else {
            $score += 20;
        }

        // Special characters
        if (!preg_match('/[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]/', $password)) {
            $errors[] = 'Password must contain at least one special character.';
        } else {
            $score += 20;
        }

        // Check against common passwords
        if ($this->isCommonPassword($password)) {
            $errors[] = 'This password is too common and easily guessable.';
            $score = 0;
        }

        // Check for sequential characters
        if ($this->hasSequentialCharacters($password)) {
            $errors[] = 'Password should not contain sequential characters (e.g., 123, abc).';
            $score -= 10;
        }

        // Check for repeated characters
        if ($this->hasRepeatedCharacters($password)) {
            $errors[] = 'Password should not contain more than 2 repeated characters in a row.';
            $score -= 10;
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'score' => max(0, min(100, $score)),
            'strength' => $this->getPasswordStrengthLabel($score),
        ];
    }

    /**
     * Check if password is in common passwords list
     */
    protected function isCommonPassword(string $password): bool
    {
        $commonPasswords = [
            'password', 'password123', '123456', '123456789', 'qwerty',
            'abc123', 'monkey', 'master', 'dragon', 'letmein',
            'login', 'welcome', 'admin', 'passw0rd', 'pass@123',
            'password1', 'iloveyou', 'princess', 'sunshine', 'football',
        ];

        return in_array(strtolower($password), $commonPasswords);
    }

    /**
     * Check for sequential characters
     */
    protected function hasSequentialCharacters(string $password): bool
    {
        $sequences = [
            '123', '234', '345', '456', '567', '678', '789', '890',
            'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij',
            'ijk', 'jkl', 'klm', 'lmn', 'mno', 'nop', 'opq', 'pqr',
            'qrs', 'rst', 'stu', 'tuv', 'uvw', 'vwx', 'wxy', 'xyz',
            'qwerty', 'asdf', 'zxcv',
        ];

        $lowerPassword = strtolower($password);
        foreach ($sequences as $seq) {
            if (str_contains($lowerPassword, $seq)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check for repeated characters
     */
    protected function hasRepeatedCharacters(string $password): bool
    {
        return preg_match('/(.)\1{2,}/', $password) === 1;
    }

    /**
     * Get password strength label
     */
    protected function getPasswordStrengthLabel(int $score): string
    {
        return match (true) {
            $score >= 80 => 'strong',
            $score >= 60 => 'good',
            $score >= 40 => 'fair',
            $score >= 20 => 'weak',
            default => 'very_weak',
        };
    }

    /**
     * Detect account takeover attempt
     * 
     * OWASP A07:2021 - Identification and Authentication Failures
     */
    public function detectAccountTakeover(int $userId, Request $request): bool
    {
        $currentIp = $request->ip();
        $currentAgent = $request->userAgent();

        // Get user's known devices/IPs
        $knownDevices = Cache::get("user_devices:{$userId}", []);

        // If this is a completely new device and IP, flag for review
        $isNewDevice = true;
        foreach ($knownDevices as $device) {
            if ($device['ip'] === $currentIp || $device['user_agent'] === $currentAgent) {
                $isNewDevice = false;
                break;
            }
        }

        if ($isNewDevice && count($knownDevices) > 0) {
            // Check for suspicious patterns
            $recentLogins = DB::table('activity_logs')
                ->where('user_id', $userId)
                ->where('action', 'login')
                ->where('created_at', '>=', now()->subHours(24))
                ->distinct('ip_address')
                ->count('ip_address');

            // If user logged in from more than 5 different IPs in 24 hours
            if ($recentLogins >= 5) {
                $this->logSecurityEvent('potential_account_takeover', [
                    'user_id' => $userId,
                    'ip' => $currentIp,
                    'user_agent' => $currentAgent,
                    'recent_ips' => $recentLogins,
                ], 'alert');

                return true;
            }
        }

        // Add current device to known devices
        $knownDevices[] = [
            'ip' => $currentIp,
            'user_agent' => $currentAgent,
            'timestamp' => now()->toIso8601String(),
        ];

        // Keep only last 10 devices
        $knownDevices = array_slice($knownDevices, -10);
        Cache::put("user_devices:{$userId}", $knownDevices, now()->addDays(30));

        return false;
    }

    /**
     * Generate secure random token
     * 
     * OWASP A02:2021 - Cryptographic Failures
     */
    public function generateSecureToken(int $length = 32): string
    {
        return bin2hex(random_bytes($length / 2));
    }

    /**
     * Hash sensitive data for storage
     * 
     * OWASP A02:2021 - Cryptographic Failures
     * ISO 27001 - Cryptographic Controls
     */
    public function hashSensitiveData(string $data): string
    {
        return Hash::make($data);
    }

    /**
     * Encrypt data for storage
     */
    public function encryptData(string $data): string
    {
        return encrypt($data);
    }

    /**
     * Decrypt stored data
     */
    public function decryptData(string $encryptedData): string
    {
        return decrypt($encryptedData);
    }

    /**
     * Sanitize user input
     * 
     * OWASP A03:2021 - Injection
     */
    public function sanitizeInput(string $input, array $options = []): string
    {
        // Remove null bytes
        $input = str_replace(chr(0), '', $input);

        // Remove control characters
        $input = preg_replace('/[\x00-\x1F\x7F]/u', '', $input);

        // HTML encode by default
        if (!($options['allow_html'] ?? false)) {
            $input = htmlspecialchars($input, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }

        // Trim whitespace
        $input = trim($input);

        // Apply length limit
        if (isset($options['max_length'])) {
            $input = mb_substr($input, 0, $options['max_length']);
        }

        return $input;
    }

    /**
     * Audit trail for sensitive operations
     * 
     * ISO 27001 - Audit Logging
     * DICT - Data Protection Requirements
     */
    public function auditTrail(string $action, int $userId, array $details = []): void
    {
        DB::table('audit_logs')->insert([
            'user_id' => $userId,
            'action' => $action,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'details' => json_encode($details),
            'created_at' => now(),
        ]);
    }

    /**
     * Check session validity
     * 
     * OWASP A07:2021 - Identification and Authentication Failures
     */
    public function validateSession(): bool
    {
        $session = session();

        // Check session age
        $sessionAge = now()->diffInMinutes($session->get('last_activity', now()));
        if ($sessionAge > config('session.lifetime', 120)) {
            return false;
        }

        // Check IP consistency (optional, can break for mobile users)
        if (config('security.validate_session_ip', false)) {
            $originalIp = $session->get('original_ip');
            if ($originalIp && $originalIp !== request()->ip()) {
                $this->logSecurityEvent('session_ip_mismatch', [
                    'original_ip' => $originalIp,
                    'current_ip' => request()->ip(),
                ], 'warning');
                return false;
            }
        }

        // Update last activity
        $session->put('last_activity', now());

        return true;
    }

    /**
     * Calculate and store request fingerprint
     * 
     * Used for detecting automated attacks
     */
    public function getRequestFingerprint(Request $request): string
    {
        $components = [
            $request->ip(),
            $request->userAgent(),
            $request->header('Accept-Language'),
            $request->header('Accept-Encoding'),
        ];

        return hash('sha256', implode('|', $components));
    }
}
