<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Permission extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'display_name',
        'description',
        'category',
        'module',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the roles that have this permission
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'permission_role');
    }

    /**
     * Get users who have this permission directly assigned
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'user_permissions')
            ->withPivot('is_granted')
            ->withTimestamps();
    }

    /**
     * Get all users who have this permission (through roles or direct assignment)
     */
    public function getAllUsersWithPermission()
    {
        // Users through roles
        $roleUserIds = $this->roles()->with('users')->get()->pluck('users')->flatten()->pluck('id')->unique();
        
        // Users with direct permission
        $directUserIds = $this->users()->wherePivot('is_granted', true)->pluck('users.id');
        
        return User::whereIn('id', $roleUserIds->merge($directUserIds)->unique())->get();
    }
}
