<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Laravel\Sanctum\TransientToken;

class SessionController extends Controller
{
    /**
     * Get all active sessions/devices for the authenticated user.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $token = $user->currentAccessToken();
        $currentTokenId = $token instanceof PersonalAccessToken ? $token->id : null;

        $tokens = $user->tokens()
            ->orderByDesc('last_used_at')
            ->get()
            ->map(function ($token) use ($currentTokenId) {
                $parsed = $this->parseUserAgent($token->user_agent);

                return [
                    'id' => $token->id,
                    'device_name' => $token->device_name ?? $parsed['device'],
                    'browser' => $parsed['browser'],
                    'platform' => $parsed['platform'],
                    'device_type' => $parsed['device_type'],
                    'ip_address' => $token->ip_address ?? 'Unknown',
                    'last_active' => $token->last_used_at?->diffForHumans() ?? 'Never',
                    'last_active_at' => $token->last_used_at?->toISOString(),
                    'created_at' => $token->created_at->diffForHumans(),
                    'is_current' => $token->id === $currentTokenId,
                ];
            });

        $maxDevices = config('security.session.max_devices', 5);

        return response()->json([
            'success' => true,
            'data' => [
                'sessions' => $tokens,
                'current_token_id' => $currentTokenId,
                'max_devices' => $maxDevices,
                'active_count' => $tokens->count(),
            ],
        ]);
    }

    /**
     * Revoke a specific session/device.
     */
    public function destroy(Request $request, $tokenId)
    {
        $user = $request->user();
        $token = $user->currentAccessToken();
        $currentTokenId = $token instanceof PersonalAccessToken ? $token->id : null;

        // Prevent revoking the current session
        if ((int) $tokenId === $currentTokenId) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot revoke your current session. Use logout instead.',
            ], 422);
        }

        $token = $user->tokens()->find($tokenId);

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Session not found.',
            ], 404);
        }

        $deviceInfo = $token->device_name ?? $this->parseUserAgent($token->user_agent)['device'];
        $token->delete();

        ActivityLog::logActivity(
            $user->id,
            'session_revoked',
            "Revoked session: {$deviceInfo} (IP: {$token->ip_address})",
            'PersonalAccessToken',
            $tokenId
        );

        return response()->json([
            'success' => true,
            'message' => 'Session revoked successfully.',
        ]);
    }

    /**
     * Revoke all sessions except the current one.
     */
    public function destroyOthers(Request $request)
    {
        $user = $request->user();
        $token = $user->currentAccessToken();
        $currentTokenId = $token instanceof PersonalAccessToken ? $token->id : null;

        $count = $user->tokens()
            ->where('id', '!=', $currentTokenId)
            ->count();

        $user->tokens()
            ->where('id', '!=', $currentTokenId)
            ->delete();

        ActivityLog::logActivity(
            $user->id,
            'all_other_sessions_revoked',
            "Revoked {$count} other session(s)",
            'User',
            $user->id
        );

        return response()->json([
            'success' => true,
            'message' => "Revoked {$count} other session(s) successfully.",
        ]);
    }

    /**
     * Parse a user agent string to extract browser, platform, and device info.
     */
    private function parseUserAgent(?string $userAgent): array
    {
        if (!$userAgent) {
            return [
                'browser' => 'Unknown',
                'platform' => 'Unknown',
                'device' => 'Unknown Device',
                'device_type' => 'desktop',
            ];
        }

        // Detect browser
        $browser = 'Unknown';
        if (preg_match('/Edg\/(\d+)/i', $userAgent)) {
            $browser = 'Microsoft Edge';
        } elseif (preg_match('/OPR\/(\d+)/i', $userAgent) || preg_match('/Opera/i', $userAgent)) {
            $browser = 'Opera';
        } elseif (preg_match('/Chrome\/(\d+)/i', $userAgent) && !preg_match('/Edg/i', $userAgent)) {
            $browser = 'Google Chrome';
        } elseif (preg_match('/Firefox\/(\d+)/i', $userAgent)) {
            $browser = 'Firefox';
        } elseif (preg_match('/Safari\/(\d+)/i', $userAgent) && !preg_match('/Chrome/i', $userAgent)) {
            $browser = 'Safari';
        } elseif (preg_match('/MSIE|Trident/i', $userAgent)) {
            $browser = 'Internet Explorer';
        }

        // Detect platform
        $platform = 'Unknown';
        if (preg_match('/Windows NT 10/i', $userAgent)) {
            $platform = 'Windows';
        } elseif (preg_match('/Windows/i', $userAgent)) {
            $platform = 'Windows';
        } elseif (preg_match('/Macintosh|Mac OS X/i', $userAgent)) {
            $platform = 'macOS';
        } elseif (preg_match('/Linux/i', $userAgent) && !preg_match('/Android/i', $userAgent)) {
            $platform = 'Linux';
        } elseif (preg_match('/Android/i', $userAgent)) {
            $platform = 'Android';
        } elseif (preg_match('/iPhone|iPad|iPod/i', $userAgent)) {
            $platform = 'iOS';
        } elseif (preg_match('/CrOS/i', $userAgent)) {
            $platform = 'Chrome OS';
        }

        // Detect device type
        $deviceType = 'desktop';
        if (preg_match('/Mobile|Android|iPhone|iPod/i', $userAgent)) {
            $deviceType = 'mobile';
        } elseif (preg_match('/iPad|Tablet/i', $userAgent)) {
            $deviceType = 'tablet';
        }

        $device = $platform . ' - ' . $browser;

        return [
            'browser' => $browser,
            'platform' => $platform,
            'device' => $device,
            'device_type' => $deviceType,
        ];
    }
}
