<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class RoleManagementController extends Controller
{
    /**
     * Update user role
     */
    public function updateRole(Request $request, $userId)
    {
        // Validate request
        $validated = $request->validate([
            'role' => ['required', Rule::in(['super_admin', 'admin', 'alumni'])],
            'reason' => 'nullable|string|max:500',
        ]);

        // Find the target user
        $targetUser = User::findOrFail($userId);
        $currentUser = Auth::user();

        // Authorization checks
        if (!$currentUser->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Only Super Admins can change user roles',
            ], 403);
        }

        // Prevent demoting yourself
        if ($targetUser->id === $currentUser->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot change your own role',
            ], 403);
        }

        // Prevent creating another super admin without confirmation
        if ($validated['role'] === 'super_admin' && !$request->has('confirm_super_admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Creating another Super Admin requires confirmation',
                'requires_confirmation' => true,
            ], 422);
        }

        $oldRole = $targetUser->role;
        
        // Update role
        DB::beginTransaction();
        try {
            $targetUser->update([
                'role' => $validated['role'],
            ]);

            // Log the activity
            ActivityLog::create([
                'user_id' => $currentUser->id,
                'action' => 'role_changed',
                'description' => sprintf(
                    'Changed role of %s (%s) from %s to %s%s',
                    $targetUser->name ?? $targetUser->email,
                    $targetUser->email,
                    $oldRole,
                    $validated['role'],
                    $validated['reason'] ? '. Reason: ' . $validated['reason'] : ''
                ),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'User role updated successfully',
                'data' => [
                    'user' => [
                        'id' => $targetUser->id,
                        'email' => $targetUser->email,
                        'name' => $targetUser->name,
                        'role' => $targetUser->role,
                        'status' => $targetUser->status,
                    ],
                    'old_role' => $oldRole,
                    'new_role' => $validated['role'],
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user role: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get role change history for a user
     */
    public function getRoleHistory($userId)
    {
        $user = User::findOrFail($userId);
        
        // Get activity logs related to this user's role changes
        $roleHistory = ActivityLog::where('action', 'role_changed')
            ->where('description', 'like', '%' . $user->email . '%')
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'changed_by' => $log->user ? [
                        'id' => $log->user->id,
                        'email' => $log->user->email,
                        'name' => $log->user->name,
                    ] : null,
                    'description' => $log->description,
                    'timestamp' => $log->created_at->format('Y-m-d H:i:s'),
                    'relative_time' => $log->created_at->diffForHumans(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'name' => $user->name,
                    'current_role' => $user->role,
                ],
                'history' => $roleHistory,
            ],
        ]);
    }

    /**
     * Get available roles
     */
    public function getAvailableRoles()
    {
        $currentUser = Auth::user();
        
        $roles = [
            [
                'value' => 'alumni',
                'label' => 'Alumni',
                'description' => 'Regular alumni user with access to alumni features',
                'color' => 'blue',
                'can_assign' => $currentUser->isSuperAdmin(),
            ],
            [
                'value' => 'admin',
                'label' => 'Administrator',
                'description' => 'Admin user with access to admin panel and management features',
                'color' => 'purple',
                'can_assign' => $currentUser->isSuperAdmin(),
            ],
            [
                'value' => 'super_admin',
                'label' => 'Super Administrator',
                'description' => 'Full system access with ability to manage other admins',
                'color' => 'red',
                'can_assign' => $currentUser->isSuperAdmin(),
                'requires_confirmation' => true,
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'roles' => $roles,
                'current_user_role' => $currentUser->role,
            ],
        ]);
    }
}
