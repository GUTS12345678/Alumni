<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class FileServeController extends Controller
{
    /**
     * Serve a privately stored file.
     *
     * Files are stored in the 'uploads' disk (storage/app/uploads/).
     * This controller streams them only to authenticated users,
     * so files are never directly accessible via the public web root.
     */
    public function serve(Request $request, string $path)
    {
        // Ensure the user is authenticated
        if (!Auth::check()) {
            abort(403, 'Unauthorized. Please log in to access this file.');
        }

        // Sanitize: prevent directory traversal attacks
        $path = ltrim(str_replace(['..', '\\'], '', $path), '/');

        if (empty($path)) {
            abort(404, 'File not found.');
        }

        // Check that the file exists in the private uploads disk
        if (!Storage::disk('uploads')->exists($path)) {
            abort(404, 'File not found.');
        }

        // Resolve the absolute path on disk
        $absolutePath = Storage::disk('uploads')->path($path);

        // Detect MIME type
        $mimeType = Storage::disk('uploads')->mimeType($path) ?: 'application/octet-stream';

        // Determine disposition: inline for images/videos/audio, attachment for others
        $isInline = str_starts_with($mimeType, 'image/')
            || str_starts_with($mimeType, 'video/')
            || str_starts_with($mimeType, 'audio/')
            || $mimeType === 'application/pdf';

        $disposition = $isInline ? 'inline' : 'attachment';

        return response()->file($absolutePath, [
            'Content-Type'        => $mimeType,
            'Content-Disposition' => $disposition . '; filename="' . basename($path) . '"',
            'Cache-Control'       => 'private, max-age=3600',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    /**
     * Serve a public branding/appearance asset without requiring authentication.
     *
     * Only paths under whitelisted prefixes (appearance/, departments/) are served
     * to prevent this endpoint from being used as an open file proxy.
     */
    public function servePublic(Request $request, string $path)
    {
        $path = ltrim(str_replace(['..', '\\'], '', $path), '/');

        // Whitelist: public content directories (branding assets + landing page content)
        $allowed = ['appearance/', 'departments/', 'announcements/', 'jobs/', 'content-media/'];
        $isAllowed = false;
        foreach ($allowed as $prefix) {
            if (str_starts_with($path, $prefix)) {
                $isAllowed = true;
                break;
            }
        }

        if (!$isAllowed || empty($path)) {
            abort(404, 'File not found.');
        }

        // Serve from private uploads disk only
        if (!Storage::disk('uploads')->exists($path)) {
            abort(404, 'File not found.');
        }

        $absolutePath = Storage::disk('uploads')->path($path);
        $mimeType = Storage::disk('uploads')->mimeType($path) ?: 'application/octet-stream';

        return response()->file($absolutePath, [
            'Content-Type'           => $mimeType,
            'Content-Disposition'    => 'inline; filename="' . basename($path) . '"',
            'Cache-Control'          => 'public, max-age=86400',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
