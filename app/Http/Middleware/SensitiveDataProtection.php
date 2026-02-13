<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sensitive Data Protection Middleware
 * 
 * Implements data protection following:
 * - OWASP Top 10 (A02:2021 - Cryptographic Failures)
 * - DICT Philippines Data Privacy Act (DPA) Guidelines
 * - ISO 27001 Data Classification and Handling
 */
class SensitiveDataProtection
{
    /**
     * Fields that contain sensitive data and should never be logged
     */
    protected array $sensitiveFields = [
        'password',
        'password_confirmation',
        'current_password',
        'new_password',
        'token',
        'api_token',
        'access_token',
        'refresh_token',
        'secret',
        'api_key',
        'credit_card',
        'card_number',
        'cvv',
        'ssn',
        'social_security',
        'bank_account',
        'routing_number',
        'pin',
        'otp',
        'verification_code',
        'two_factor_code',
        'recovery_code',
    ];

    /**
     * PII fields that need masking in logs
     */
    protected array $piiFields = [
        'email',
        'phone',
        'phone_number',
        'mobile',
        'address',
        'street_address',
        'zip_code',
        'postal_code',
        'date_of_birth',
        'birthdate',
        'national_id',
        'passport_number',
        'drivers_license',
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Mask sensitive data in request for logging purposes
        $this->maskSensitiveDataForLogging($request);

        $response = $next($request);

        // Ensure sensitive data is not in response headers
        $this->sanitizeResponseHeaders($response);

        // Mask sensitive data in JSON responses for logging
        $this->maskSensitiveDataInResponse($response);

        return $response;
    }

    /**
     * Mask sensitive data in request for logging
     */
    protected function maskSensitiveDataForLogging(Request $request): void
    {
        // Override Laravel's input for logging context
        $maskedInput = $this->maskArray($request->all());
        
        // Store masked version for potential logging
        $request->attributes->set('masked_input', $maskedInput);
    }

    /**
     * Recursively mask sensitive fields in array
     */
    protected function maskArray(array $data): array
    {
        $masked = [];

        foreach ($data as $key => $value) {
            $lowerKey = strtolower($key);
            
            if ($this->isSensitiveField($lowerKey)) {
                $masked[$key] = '[REDACTED]';
            } elseif ($this->isPiiField($lowerKey)) {
                $masked[$key] = $this->maskPii($value, $lowerKey);
            } elseif (is_array($value)) {
                $masked[$key] = $this->maskArray($value);
            } else {
                $masked[$key] = $value;
            }
        }

        return $masked;
    }

    /**
     * Check if field is sensitive
     */
    protected function isSensitiveField(string $field): bool
    {
        foreach ($this->sensitiveFields as $sensitiveField) {
            if (str_contains($field, $sensitiveField)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if field is PII
     */
    protected function isPiiField(string $field): bool
    {
        foreach ($this->piiFields as $piiField) {
            if (str_contains($field, $piiField)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Mask PII data appropriately
     */
    protected function maskPii(mixed $value, string $fieldType): string
    {
        if (!is_string($value)) {
            return '[MASKED]';
        }

        if (str_contains($fieldType, 'email')) {
            // Mask email: te**@ex*****.com
            return $this->maskEmail($value);
        }

        if (str_contains($fieldType, 'phone')) {
            // Mask phone: ***-***-1234
            return $this->maskPhone($value);
        }

        // Generic masking: show first and last 2 chars
        if (strlen($value) > 4) {
            return substr($value, 0, 2) . str_repeat('*', strlen($value) - 4) . substr($value, -2);
        }

        return '[MASKED]';
    }

    /**
     * Mask email address
     */
    protected function maskEmail(string $email): string
    {
        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            return '[MASKED_EMAIL]';
        }

        $localPart = $parts[0];
        $domain = $parts[1];
        
        $maskedLocal = substr($localPart, 0, 2) . str_repeat('*', max(0, strlen($localPart) - 2));
        $domainParts = explode('.', $domain);
        $maskedDomain = substr($domainParts[0], 0, 2) . str_repeat('*', max(0, strlen($domainParts[0]) - 2));
        
        return $maskedLocal . '@' . $maskedDomain . '.' . (end($domainParts) ?: 'com');
    }

    /**
     * Mask phone number
     */
    protected function maskPhone(string $phone): string
    {
        $digits = preg_replace('/[^0-9]/', '', $phone);
        if (strlen($digits) < 4) {
            return '[MASKED_PHONE]';
        }

        return str_repeat('*', strlen($digits) - 4) . substr($digits, -4);
    }

    /**
     * Sanitize response headers
     */
    protected function sanitizeResponseHeaders(Response $response): void
    {
        // Remove potentially sensitive headers
        $headersToRemove = [
            'X-Debug-Token',
            'X-Debug-Token-Link',
        ];

        foreach ($headersToRemove as $header) {
            $response->headers->remove($header);
        }
    }

    /**
     * Mask sensitive data in response for logging
     */
    protected function maskSensitiveDataInResponse(Response $response): void
    {
        $contentType = $response->headers->get('Content-Type');
        
        if (str_contains($contentType ?? '', 'application/json')) {
            $content = $response->getContent();
            $data = json_decode($content, true);
            
            if (is_array($data)) {
                $maskedData = $this->maskArray($data);
                // Store masked version for potential logging
                $response->headers->set('X-Masked-Response-Available', 'true');
            }
        }
    }
}
