<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserSettings extends Model
{
    protected $fillable = [
        'user_id',
        'email_notifications',
        'survey_reminders',
        'network_updates',
        'profile_visibility',
        'show_employment_status',
        'allow_connection_requests',
    ];

    protected $casts = [
        'email_notifications' => 'boolean',
        'survey_reminders' => 'boolean',
        'network_updates' => 'boolean',
        'profile_visibility' => 'boolean',
        'show_employment_status' => 'boolean',
        'allow_connection_requests' => 'boolean',
    ];

    /**
     * Get the user that owns the settings
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
