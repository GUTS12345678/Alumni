<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class EmailPreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'announcements_enabled',
        'job_postings_enabled',
        'surveys_enabled',
        'messages_enabled',
        'system_updates_enabled',
        'frequency',
        'last_digest_sent_at',
        'unsubscribe_token',
    ];

    protected $casts = [
        'announcements_enabled' => 'boolean',
        'job_postings_enabled' => 'boolean',
        'surveys_enabled' => 'boolean',
        'messages_enabled' => 'boolean',
        'system_updates_enabled' => 'boolean',
        'last_digest_sent_at' => 'datetime',
    ];

    /**
     * Get the user that owns the preferences
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get or create preferences for a user
     */
    public static function getOrCreateForUser(int $userId): self
    {
        return static::firstOrCreate(
            ['user_id' => $userId],
            [
                'announcements_enabled' => true,
                'job_postings_enabled' => true,
                'surveys_enabled' => true,
                'messages_enabled' => true,
                'system_updates_enabled' => true,
                'frequency' => 'instant',
                'unsubscribe_token' => Str::random(64),
            ]
        );
    }

    /**
     * Check if a specific notification type is enabled
     */
    public function isEnabled(string $type): bool
    {
        $field = $type . '_enabled';
        return $this->$field ?? true;
    }

    /**
     * Generate a new unsubscribe token
     */
    public function regenerateUnsubscribeToken(): string
    {
        $this->unsubscribe_token = Str::random(64);
        $this->save();
        return $this->unsubscribe_token;
    }

    /**
     * Disable all notifications
     */
    public function disableAll(): void
    {
        $this->update([
            'announcements_enabled' => false,
            'job_postings_enabled' => false,
            'surveys_enabled' => false,
            'messages_enabled' => false,
            'system_updates_enabled' => false,
            'frequency' => 'never',
        ]);
    }
}
