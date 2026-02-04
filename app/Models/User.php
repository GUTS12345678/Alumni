<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Traits\BelongsToCampus;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, BelongsToCampus;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'role_id',
        'status',
        'last_login_at',
        'phone_number',
        'bio',
        'location',
        'website',
        'social_links',
        'profile_picture_path',
        'cover_photo_path',
        'preferred_theme',
        'preferred_language',
        'campus_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_login_at' => 'datetime',
        ];
    }

    /**
     * Check if user is super admin
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    /**
     * Check if user is admin (includes super_admin)
     */
    public function isAdmin(): bool
    {
        return in_array($this->role, ['super_admin', 'admin']);
    }

    /**
     * Check if user is regular admin (not super admin)
     */
    public function isRegularAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user is alumni
     */
    public function isAlumni(): bool
    {
        return $this->role === 'alumni';
    }

    /**
     * Check if user has admin privileges (super_admin or admin)
     */
    public function hasAdminPrivileges(): bool
    {
        return in_array($this->role, ['super_admin', 'admin']);
    }

    /**
     * Get the role assigned to this user
     */
    public function assignedRole()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     * Get custom permissions assigned directly to this user
     */
    public function customPermissions()
    {
        return $this->belongsToMany(Permission::class, 'user_permissions')
            ->withPivot('is_granted')
            ->withTimestamps();
    }

    /**
     * Get all permissions for this user (from role + custom permissions)
     */
    public function getAllPermissions()
    {
        $rolePermissions = collect();
        if ($this->assignedRole) {
            $rolePermissions = $this->assignedRole->permissions;
        }

        $customGranted = $this->customPermissions()->wherePivot('is_granted', true)->get();
        $customDenied = $this->customPermissions()->wherePivot('is_granted', false)->pluck('name');

        return $rolePermissions->merge($customGranted)->reject(function ($permission) use ($customDenied) {
            return $customDenied->contains($permission->name);
        })->unique('id');
    }

    /**
     * Check if user has a specific permission
     */
    public function hasPermission($permissionName)
    {
        // Super admin always has all permissions
        if ($this->isSuperAdmin()) {
            return true;
        }

        // Check if permission is denied
        $denied = $this->customPermissions()
            ->wherePivot('is_granted', false)
            ->where('name', $permissionName)
            ->exists();

        if ($denied) {
            return false;
        }

        // Check custom granted permissions
        $customGranted = $this->customPermissions()
            ->wherePivot('is_granted', true)
            ->where('name', $permissionName)
            ->exists();

        if ($customGranted) {
            return true;
        }

        // Check role permissions
        if ($this->assignedRole) {
            return $this->assignedRole->hasPermission($permissionName);
        }

        return false;
    }

    /**
     * Grant permission to user
     */
    public function givePermission($permission)
    {
        if (is_string($permission)) {
            $permission = Permission::where('name', $permission)->firstOrFail();
        }

        return $this->customPermissions()->syncWithoutDetaching([
            $permission->id => ['is_granted' => true]
        ]);
    }

    /**
     * Deny permission to user
     */
    public function denyPermission($permission)
    {
        if (is_string($permission)) {
            $permission = Permission::where('name', $permission)->firstOrFail();
        }

        return $this->customPermissions()->syncWithoutDetaching([
            $permission->id => ['is_granted' => false]
        ]);
    }

    /**
     * Remove custom permission from user (revert to role default)
     */
    public function revokePermission($permission)
    {
        if (is_string($permission)) {
            $permission = Permission::where('name', $permission)->firstOrFail();
        }

        return $this->customPermissions()->detach($permission);
    }

    /**
     * Get the alumni profile for this user
     */
    public function alumniProfile()
    {
        return $this->hasOne(AlumniProfile::class);
    }

    /**
     * Get survey responses for this user
     */
    public function surveyResponses()
    {
        return $this->hasMany(SurveyResponse::class);
    }

    /**
     * Get activity logs for this user
     */
    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }

    /**
     * Get the settings for this user
     */
    public function settings()
    {
        return $this->hasOne(UserSettings::class);
    }

    /**
     * Get career history for this user
     */
    public function careerHistory()
    {
        return $this->hasMany(CareerHistory::class);
    }

    /**
     * Get job postings created by this user
     */
    public function jobPostings()
    {
        return $this->hasMany(JobPosting::class);
    }

    /**
     * Get connections where user is sender
     */
    public function sentConnections()
    {
        return $this->hasMany(AlumniConnection::class, 'sender_id');
    }

    /**
     * Get connections where user is receiver
     */
    public function receivedConnections()
    {
        return $this->hasMany(AlumniConnection::class, 'receiver_id');
    }

    /**
     * Get mentor profile
     */
    public function mentorProfile()
    {
        return $this->hasOne(MentorProfile::class);
    }

    /**
     * Get mentorships where user is mentor
     */
    public function asMentor()
    {
        return $this->hasMany(Mentorship::class, 'mentor_id');
    }

    /**
     * Get mentorships where user is mentee
     */
    public function asMentee()
    {
        return $this->hasMany(Mentorship::class, 'mentee_id');
    }

    // ==========================================
    // MESSAGING SYSTEM RELATIONSHIPS
    // ==========================================

    /**
     * Get conversations this user is part of
     */
    public function conversations()
    {
        return $this->belongsToMany(Conversation::class, 'conversation_participants')
            ->withPivot(['role', 'nickname', 'joined_at', 'left_at', 'last_read_at', 'is_muted', 'invitation_status'])
            ->withTimestamps()
            ->wherePivot('invitation_status', 'accepted')
            ->wherePivotNull('left_at');
    }

    /**
     * Get all conversation participations (including pending invites)
     */
    public function conversationParticipations()
    {
        return $this->hasMany(ConversationParticipant::class);
    }

    /**
     * Get pending group invitations
     */
    public function pendingInvitations()
    {
        return $this->hasMany(ConversationParticipant::class)
            ->where('invitation_status', 'pending')
            ->whereNull('left_at');
    }

    /**
     * Get messages sent by this user
     */
    public function sentMessages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    /**
     * Get users blocked by this user
     */
    public function blockedUsers()
    {
        return $this->hasMany(BlockedUser::class, 'user_id');
    }

    /**
     * Get users who blocked this user
     */
    public function blockedByUsers()
    {
        return $this->hasMany(BlockedUser::class, 'blocked_user_id');
    }

    /**
     * Check if this user has blocked another user
     */
    public function hasBlocked(int $userId): bool
    {
        return BlockedUser::hasBlocked($this->id, $userId);
    }

    /**
     * Check if this user is blocked by another user
     */
    public function isBlockedBy(int $userId): bool
    {
        return BlockedUser::hasBlocked($userId, $this->id);
    }

    /**
     * Get unread message count across all conversations
     */
    public function getUnreadMessagesCountAttribute(): int
    {
        $count = 0;
        foreach ($this->conversations as $conversation) {
            $count += $conversation->getUnreadCountForUser($this->id);
        }
        return $count;
    }

    /**
     * Get announcements for this user
     */
    public function announcements()
    {
        return Announcement::active()->forUser($this);
    }

    /**
     * Get unread announcements count
     */
    public function getUnreadAnnouncementsCountAttribute(): int
    {
        return $this->announcements()
            ->whereDoesntHave('reads', function ($q) {
                $q->where('user_id', $this->id);
            })
            ->count();
    }

}
