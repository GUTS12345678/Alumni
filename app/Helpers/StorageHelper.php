<?php

use Illuminate\Support\Facades\Storage;

if (!function_exists('private_url')) {
    /**
     * Generate a URL for a privately stored file served through the app.
     * Files are stored in the 'uploads' disk (storage/app/uploads/)
     * and served via the authenticated /api/v1/files/{path} route.
     */
    function private_url(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        return url('/api/v1/files/' . ltrim($path, '/'));
    }
}

if (!function_exists('public_file_url')) {
    /**
     * Generate a publicly accessible URL for branding/appearance assets
     * stored in the 'uploads' disk (logos, favicons, department images).
     * These are served via the unauthenticated /api/v1/assets/{path} route.
     */
    function public_file_url(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        // If it's already a full URL (http/https), return as-is
        if (str_starts_with($path, 'http') || str_starts_with($path, '/')) {
            return $path;
        }

        return url('/api/v1/assets/' . ltrim($path, '/'));
    }
}

if (!function_exists('private_storage_exists')) {
    /**
     * Check if a privately stored file exists on the uploads disk.
     */
    function private_storage_exists(string $path): bool
    {
        return Storage::disk('uploads')->exists($path);
    }
}

if (!function_exists('private_storage_delete')) {
    /**
     * Delete a privately stored file from the uploads disk.
     */
    function private_storage_delete(string $path): bool
    {
        return Storage::disk('uploads')->delete($path);
    }
}
