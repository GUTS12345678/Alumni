<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminSessionController extends Controller
{
    /**
     * Get all active sessions across all users (admin view).
     * Reads from the `sessions` database table (web guard sessions).
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = DB::table('sessions')
                ->leftJoin('users', 'sessions.user_id', '=', 'users.id')
                ->select(
                    'sessions.id',
                    'sessions.user_id',
                    'sessions.ip_address',
                    'sessions.user_agent',
                    'sessions.last_activity',
                    'users.name as user_name',
                    'users.email as user_email',
                    'users.role as user_role'
                )
                ->orderByDesc('sessions.last_activity');

            // Search filter
            if ($search = $request->input('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('sessions.ip_address', 'like', "%{$search}%")
                      ->orWhere('sessions.user_agent', 'like', "%{$search}%")
                      ->orWhere('users.name', 'like', "%{$search}%")
                      ->orWhere('users.email', 'like', "%{$search}%");
                });
            }

            // Role filter
            if ($role = $request->input('role')) {
                if ($role === 'guest') {
                    $query->whereNull('sessions.user_id');
                } else {
                    $query->where('users.role', $role);
                }
            }

            $perPage = min($request->input('per_page', 20), 100);
            $page = $request->input('page', 1);
            $total = (clone $query)->count();
            $items = $query->offset(($page - 1) * $perPage)->limit($perPage)->get();
            $lastPage = max(1, (int) ceil($total / $perPage));

            $data = $items->map(function ($session) {
                $parsed = $this->parseUserAgent($session->user_agent);
                $lastActive = Carbon::createFromTimestamp($session->last_activity);

                return [
                    'id' => $session->id,
                    'user' => $session->user_id ? [
                        'id' => (int) $session->user_id,
                        'name' => $session->user_name ?? 'Unknown',
                        'email' => $session->user_email ?? '',
                        'role' => $session->user_role ?? 'unknown',
                    ] : null,
                    'device_name' => $parsed['device'],
                    'browser' => $parsed['browser'],
                    'platform' => $parsed['platform'],
                    'device_type' => $parsed['device_type'],
                    'ip_address' => $session->ip_address ?? 'Unknown',
                    'last_active' => $lastActive->diffForHumans(),
                    'last_active_at' => $lastActive->toISOString(),
                    'created_at' => $lastActive->diffForHumans(),
                    'created_at_date' => $lastActive->toISOString(),
                ];
            });

            // Stats from sessions table
            $fiveMinutesAgo = now()->subMinutes(5)->timestamp;
            $totalSessions = DB::table('sessions')->count();
            $uniqueUsers = DB::table('sessions')->whereNotNull('user_id')->distinct('user_id')->count('user_id');
            $recentlyActive = DB::table('sessions')->where('last_activity', '>=', $fiveMinutesAgo)->count();

            $adminSessions = DB::table('sessions')
                ->join('users', 'sessions.user_id', '=', 'users.id')
                ->whereIn('users.role', ['admin', 'super_admin'])
                ->count();

            $alumniSessions = DB::table('sessions')
                ->join('users', 'sessions.user_id', '=', 'users.id')
                ->where('users.role', 'alumni')
                ->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'sessions' => $data,
                    'pagination' => [
                        'current_page' => (int) $page,
                        'last_page' => $lastPage,
                        'per_page' => $perPage,
                        'total' => $total,
                    ],
                    'stats' => [
                        'total_sessions' => $totalSessions,
                        'unique_users' => $uniqueUsers,
                        'recently_active' => $recentlyActive,
                        'admin_sessions' => $adminSessions,
                        'alumni_sessions' => $alumniSessions,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch sessions',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Revoke a specific session (delete from sessions table).
     */
    public function destroy(Request $request, $sessionId): JsonResponse
    {
        try {
            $session = DB::table('sessions')->where('id', $sessionId)->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found.',
                ], 404);
            }

            // Don't let admin revoke their own current session
            $currentUser = $request->user();
            $currentSessionId = $request->session()->getId();
            if ($sessionId === $currentSessionId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot revoke your own current session.',
                ], 422);
            }

            $targetUser = $session->user_id ? User::find($session->user_id) : null;
            $parsed = $this->parseUserAgent($session->user_agent);

            DB::table('sessions')->where('id', $sessionId)->delete();

            ActivityLog::logActivity(
                $currentUser->id,
                'admin_session_revoked',
                "Admin revoked session for user: " . ($targetUser?->email ?? 'guest') . " - Device: {$parsed['device']}",
                'User',
                $targetUser?->id
            );

            return response()->json([
                'success' => true,
                'message' => 'Session revoked successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to revoke session',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Revoke all sessions for a specific user.
     */
    public function destroyUserSessions(Request $request, $userId): JsonResponse
    {
        try {
            $currentUser = $request->user();
            $targetUser = User::find($userId);

            if (!$targetUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found.',
                ], 404);
            }

            $sessionsQuery = DB::table('sessions')->where('user_id', $userId);

            // Exclude current session if revoking own
            $currentSessionId = $request->session()->getId();
            if ((int) $currentUser->id === (int) $userId) {
                $sessionsQuery->where('id', '!=', $currentSessionId);
            }

            $count = $sessionsQuery->count();
            $sessionsQuery->delete();

            ActivityLog::logActivity(
                $currentUser->id,
                'admin_all_user_sessions_revoked',
                "Admin revoked {$count} session(s) for user: {$targetUser->email}",
                'User',
                $targetUser->id
            );

            return response()->json([
                'success' => true,
                'message' => "Revoked {$count} session(s) for {$targetUser->email}.",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to revoke user sessions',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Parse a user agent string into browser, platform, device info.
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

        $platform = 'Unknown';
        if (preg_match('/Windows/i', $userAgent)) {
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

        $deviceType = 'desktop';
        if (preg_match('/Mobile|Android|iPhone|iPod/i', $userAgent)) {
            $deviceType = 'mobile';
        } elseif (preg_match('/iPad|Tablet/i', $userAgent)) {
            $deviceType = 'tablet';
        }

        return [
            'browser' => $browser,
            'platform' => $platform,
            'device' => $platform . ' - ' . $browser,
            'device_type' => $deviceType,
        ];
    }
}
