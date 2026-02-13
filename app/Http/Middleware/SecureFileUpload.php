<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Secure File Upload Middleware
 * 
 * Implements secure file upload handling following:
 * - OWASP Top 10 (A04:2021 - Insecure Design, A08:2021 - Software and Data Integrity Failures)
 * - DICT Philippines Cybersecurity Guidelines
 * - ISO 27001 File Handling Controls
 */
class SecureFileUpload
{
    /**
     * Allowed MIME types by category
     */
    protected array $allowedMimeTypes = [
        'images' => [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
        ],
        'documents' => [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv',
        ],
    ];

    /**
     * Dangerous file extensions
     */
    protected array $dangerousExtensions = [
        'php', 'php3', 'php4', 'php5', 'php7', 'phtml', 'phar',
        'exe', 'bat', 'cmd', 'sh', 'bash', 'zsh',
        'js', 'vbs', 'vbe', 'jse', 'wsf', 'wsh',
        'msi', 'dll', 'scr', 'com',
        'jar', 'class',
        'asp', 'aspx', 'cer', 'csr',
        'jsp', 'jspx',
        'cgi', 'pl', 'py', 'rb',
        'htaccess', 'htpasswd',
        'svg', // Can contain JavaScript
    ];

    /**
     * Maximum file size in bytes (10MB)
     */
    protected int $maxFileSize = 10485760;

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->hasFile('file') || $request->hasFile('files') || $request->hasFile('image') || $request->hasFile('document')) {
            $files = [];
            
            // Collect all uploaded files
            foreach (['file', 'files', 'image', 'document', 'attachment', 'attachments'] as $fieldName) {
                if ($request->hasFile($fieldName)) {
                    $uploadedFiles = $request->file($fieldName);
                    if (is_array($uploadedFiles)) {
                        $files = array_merge($files, $uploadedFiles);
                    } else {
                        $files[] = $uploadedFiles;
                    }
                }
            }

            foreach ($files as $file) {
                $validation = $this->validateFile($file);
                
                if (!$validation['valid']) {
                    Log::warning('Malicious file upload attempt blocked', [
                        'ip' => $request->ip(),
                        'user_id' => $request->user()?->id,
                        'filename' => $file->getClientOriginalName(),
                        'mime_type' => $file->getMimeType(),
                        'reason' => $validation['reason'],
                    ]);

                    return response()->json([
                        'success' => false,
                        'message' => 'File upload rejected: ' . $validation['reason'],
                    ], 400);
                }
            }
        }

        return $next($request);
    }

    /**
     * Validate uploaded file
     */
    protected function validateFile($file): array
    {
        // Check file size
        if ($file->getSize() > $this->maxFileSize) {
            return [
                'valid' => false,
                'reason' => 'File size exceeds maximum allowed size.',
            ];
        }

        // Check extension
        $extension = strtolower($file->getClientOriginalExtension());
        if (in_array($extension, $this->dangerousExtensions)) {
            return [
                'valid' => false,
                'reason' => 'File type not allowed.',
            ];
        }

        // Check for double extensions (e.g., file.php.jpg)
        $filename = $file->getClientOriginalName();
        if ($this->hasDoubleExtension($filename)) {
            return [
                'valid' => false,
                'reason' => 'Invalid file name format.',
            ];
        }

        // Validate MIME type matches extension
        $mimeType = $file->getMimeType();
        if (!$this->isValidMimeType($extension, $mimeType)) {
            return [
                'valid' => false,
                'reason' => 'File type mismatch detected.',
            ];
        }

        // Check for PHP code in image files
        if ($this->isImageExtension($extension)) {
            if ($this->containsPhpCode($file)) {
                return [
                    'valid' => false,
                    'reason' => 'Invalid file content detected.',
                ];
            }
        }

        // Check file content for malicious patterns
        if ($this->containsMaliciousContent($file)) {
            return [
                'valid' => false,
                'reason' => 'Potentially malicious content detected.',
            ];
        }

        return ['valid' => true, 'reason' => null];
    }

    /**
     * Check for double extension attack
     */
    protected function hasDoubleExtension(string $filename): bool
    {
        $parts = explode('.', $filename);
        if (count($parts) < 3) {
            return false;
        }

        // Check if any middle extension is dangerous
        for ($i = 1; $i < count($parts) - 1; $i++) {
            if (in_array(strtolower($parts[$i]), $this->dangerousExtensions)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Validate MIME type for extension
     */
    protected function isValidMimeType(string $extension, string $mimeType): bool
    {
        $extensionMimeMap = [
            'jpg' => ['image/jpeg'],
            'jpeg' => ['image/jpeg'],
            'png' => ['image/png'],
            'gif' => ['image/gif'],
            'webp' => ['image/webp'],
            'pdf' => ['application/pdf'],
            'doc' => ['application/msword'],
            'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            'xls' => ['application/vnd.ms-excel'],
            'xlsx' => ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
            'txt' => ['text/plain'],
            'csv' => ['text/csv', 'text/plain', 'application/csv'],
        ];

        if (!isset($extensionMimeMap[$extension])) {
            return false;
        }

        return in_array($mimeType, $extensionMimeMap[$extension]);
    }

    /**
     * Check if extension is an image type
     */
    protected function isImageExtension(string $extension): bool
    {
        return in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']);
    }

    /**
     * Check if file contains PHP code
     */
    protected function containsPhpCode($file): bool
    {
        $content = file_get_contents($file->getRealPath());
        
        return preg_match('/<\?php|<\?=|<\?(?!\s*xml)/i', $content) === 1;
    }

    /**
     * Check for malicious content in file
     */
    protected function containsMaliciousContent($file): bool
    {
        $content = file_get_contents($file->getRealPath());
        
        $maliciousPatterns = [
            '/eval\s*\(/i',
            '/base64_decode\s*\(/i',
            '/system\s*\(/i',
            '/shell_exec\s*\(/i',
            '/passthru\s*\(/i',
            '/exec\s*\(/i',
            '/popen\s*\(/i',
            '/proc_open\s*\(/i',
            '/<script\b/i',
            '/javascript\s*:/i',
        ];

        foreach ($maliciousPatterns as $pattern) {
            if (preg_match($pattern, $content)) {
                return true;
            }
        }

        return false;
    }
}
