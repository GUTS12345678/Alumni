<?php

/**
 * Security Configuration
 * 
 * Military-grade security settings following:
 * - OWASP Top 10 2021
 * - DICT Philippines Cybersecurity Framework
 * - ISO 27001:2022 Information Security Management
 * - NIST Cybersecurity Framework
 */

return [
    /*
    |--------------------------------------------------------------------------
    | Security Headers Configuration
    |--------------------------------------------------------------------------
    */
    'headers' => [
        'enabled' => env('SECURITY_HEADERS_ENABLED', true),
        'hsts_max_age' => env('HSTS_MAX_AGE', 31536000), // 1 year
        'hsts_include_subdomains' => env('HSTS_INCLUDE_SUBDOMAINS', true),
        'hsts_preload' => env('HSTS_PRELOAD', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting Configuration
    |--------------------------------------------------------------------------
    | OWASP A04:2021 - Insecure Design
    | Protects against brute force, DDoS, and API abuse
    */
    'rate_limiting' => [
        'enabled' => env('RATE_LIMITING_ENABLED', true),
        
        // Per-endpoint limits
        'limits' => [
            'login' => [
                'attempts' => env('RATE_LIMIT_LOGIN_ATTEMPTS', 5),
                'decay_minutes' => env('RATE_LIMIT_LOGIN_DECAY', 5),
            ],
            'register' => [
                'attempts' => env('RATE_LIMIT_REGISTER_ATTEMPTS', 3),
                'decay_minutes' => env('RATE_LIMIT_REGISTER_DECAY', 60),
            ],
            'api' => [
                'attempts' => env('RATE_LIMIT_API_ATTEMPTS', 60),
                'decay_minutes' => env('RATE_LIMIT_API_DECAY', 1),
            ],
            'password_reset' => [
                'attempts' => env('RATE_LIMIT_PASSWORD_RESET_ATTEMPTS', 3),
                'decay_minutes' => env('RATE_LIMIT_PASSWORD_RESET_DECAY', 60),
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Authentication Security
    |--------------------------------------------------------------------------
    | OWASP A07:2021 - Identification and Authentication Failures
    */
    'authentication' => [
        // Password requirements
        'password' => [
            'min_length' => env('PASSWORD_MIN_LENGTH', 12),
            'require_uppercase' => env('PASSWORD_REQUIRE_UPPERCASE', true),
            'require_lowercase' => env('PASSWORD_REQUIRE_LOWERCASE', true),
            'require_numbers' => env('PASSWORD_REQUIRE_NUMBERS', true),
            'require_special_chars' => env('PASSWORD_REQUIRE_SPECIAL', true),
            'history_count' => env('PASSWORD_HISTORY_COUNT', 5), // Prevent reuse of last N passwords
            'max_age_days' => env('PASSWORD_MAX_AGE_DAYS', 90), // Force password change
        ],

        // Account lockout
        'lockout' => [
            'enabled' => env('ACCOUNT_LOCKOUT_ENABLED', true),
            'max_attempts' => env('ACCOUNT_LOCKOUT_MAX_ATTEMPTS', 5),
            'lockout_duration_minutes' => env('ACCOUNT_LOCKOUT_DURATION', 30),
            'progressive_lockout' => env('ACCOUNT_PROGRESSIVE_LOCKOUT', true), // Increases lockout with each failure
        ],

        // Two-factor authentication
        '2fa' => [
            'enabled' => env('2FA_ENABLED', true),
            'required_for_admins' => env('2FA_REQUIRED_FOR_ADMINS', true),
            'required_for_alumni' => env('2FA_REQUIRED_FOR_ALUMNI', false),
        ],

        // Session management
        'session' => [
            'timeout_minutes' => env('SESSION_TIMEOUT_MINUTES', 120),
            'validate_ip' => env('SESSION_VALIDATE_IP', false), // Can break mobile users
            'single_session' => env('SESSION_SINGLE_SESSION', false), // Only allow one active session
            'regenerate_on_login' => env('SESSION_REGENERATE_ON_LOGIN', true),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Input Validation & Sanitization
    |--------------------------------------------------------------------------
    | OWASP A03:2021 - Injection
    */
    'input_validation' => [
        'sql_injection_prevention' => env('SQL_INJECTION_PREVENTION_ENABLED', true),
        'xss_prevention' => env('XSS_PREVENTION_ENABLED', true),
        'file_upload_validation' => env('FILE_UPLOAD_VALIDATION_ENABLED', true),
        
        // File upload restrictions
        'file_upload' => [
            'max_size_mb' => env('FILE_UPLOAD_MAX_SIZE_MB', 10),
            'allowed_extensions' => ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx'],
            'scan_for_malware' => env('FILE_UPLOAD_SCAN_MALWARE', true),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | IP Management
    |--------------------------------------------------------------------------
    */
    'ip_management' => [
        'blocking_enabled' => env('IP_BLOCKING_ENABLED', true),
        'auto_block_threshold' => env('IP_AUTO_BLOCK_THRESHOLD', 10), // Block after N violations
        'auto_block_duration_hours' => env('IP_AUTO_BLOCK_DURATION', 24),
        
        // Whitelist - IPs that should never be blocked
        'whitelist' => array_filter(explode(',', env('IP_WHITELIST', '127.0.0.1,::1'))),
        
        // Blacklist - IPs that are always blocked
        'blacklist' => array_filter(explode(',', env('IP_BLACKLIST', ''))),
    ],

    /*
    |--------------------------------------------------------------------------
    | Logging & Monitoring
    |--------------------------------------------------------------------------
    | OWASP A09:2021 - Security Logging and Monitoring Failures
    */
    'logging' => [
        'enabled' => env('SECURITY_LOGGING_ENABLED', true),
        'log_login_attempts' => env('LOG_LOGIN_ATTEMPTS', true),
        'log_api_requests' => env('LOG_API_REQUESTS', true),
        'log_data_access' => env('LOG_DATA_ACCESS', true),
        'log_admin_actions' => env('LOG_ADMIN_ACTIONS', true),
        'log_file_uploads' => env('LOG_FILE_UPLOADS', true),
        
        // Alert thresholds
        'alerts' => [
            'failed_logins_threshold' => env('ALERT_FAILED_LOGINS', 10), // Alert after N failed logins
            'suspicious_activity_threshold' => env('ALERT_SUSPICIOUS_ACTIVITY', 5),
        ],
        
        // Log retention (days)
        'retention' => [
            'security_logs' => env('LOG_RETENTION_SECURITY', 365),
            'audit_logs' => env('LOG_RETENTION_AUDIT', 730), // 2 years for compliance
            'session_logs' => env('LOG_RETENTION_SESSION', 90),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Data Protection (DICT DPA Compliance)
    |--------------------------------------------------------------------------
    */
    'data_protection' => [
        'encrypt_sensitive_fields' => env('ENCRYPT_SENSITIVE_FIELDS', true),
        'mask_pii_in_logs' => env('MASK_PII_IN_LOGS', true),
        'data_retention_years' => env('DATA_RETENTION_YEARS', 5),
        
        // Personal data access controls
        'pii_access' => [
            'log_all_access' => env('LOG_PII_ACCESS', true),
            'require_justification' => env('REQUIRE_PII_JUSTIFICATION', true),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | CSRF Protection
    |--------------------------------------------------------------------------
    | OWASP A01:2021 - Broken Access Control
    */
    'csrf' => [
        'enabled' => env('CSRF_ENABLED', true),
        'token_lifetime_minutes' => env('CSRF_TOKEN_LIFETIME', 120),
    ],

    /*
    |--------------------------------------------------------------------------
    | Content Security Policy
    |--------------------------------------------------------------------------
    */
    'csp' => [
        'enabled' => env('CSP_ENABLED', true),
        'report_only' => env('CSP_REPORT_ONLY', false),
        'report_uri' => env('CSP_REPORT_URI', null),
    ],

    /*
    |--------------------------------------------------------------------------
    | API Security
    |--------------------------------------------------------------------------
    */
    'api' => [
        'require_https' => env('API_REQUIRE_HTTPS', true),
        'token_expiry_minutes' => env('API_TOKEN_EXPIRY', 60),
        'refresh_token_expiry_days' => env('API_REFRESH_TOKEN_EXPIRY', 30),
    ],
];
