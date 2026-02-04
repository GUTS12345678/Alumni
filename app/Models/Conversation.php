<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'name',
        'description',
        'avatar_path',
        'created_by',
        'is_support_ticket',
        'support_status',
    ];

    protected $casts = [
        'is_support_ticket' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the creator of the conversation
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get all participants
     */
    public function participants(): HasMany
    {
        return $this->hasMany(ConversationParticipant::class);
    }

    /**
     * Get active participants (not left, invitation accepted)
     */
    public function activeParticipants(): HasMany
    {
        return $this->hasMany(ConversationParticipant::class)
            ->whereNull('left_at')
            ->where('invitation_status', 'accepted');
    }

    /**
     * Get the users in this conversation
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'conversation_participants')
            ->withPivot(['role', 'nickname', 'joined_at', 'left_at', 'last_read_at', 'is_muted', 'invitation_status'])
            ->withTimestamps();
    }

    /**
     * Get all messages
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class)->orderBy('created_at', 'asc');
    }

    /**
     * Get the latest message
     */
    public function latestMessage(): HasOne
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    /**
     * Get the last message (alias for latestMessage)
     */
    public function lastMessage(): HasOne
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    /**
     * Scope for direct conversations
     */
    public function scopeDirect($query)
    {
        return $query->where('type', 'direct');
    }

    /**
     * Scope for group conversations
     */
    public function scopeGroup($query)
    {
        return $query->where('type', 'group');
    }

    /**
     * Scope for support tickets
     */
    public function scopeSupport($query)
    {
        return $query->where('type', 'support');
    }

    /**
     * Scope for open support tickets
     */
    public function scopeOpenSupport($query)
    {
        return $query->support()->whereIn('support_status', ['open', 'in_progress']);
    }

    /**
     * Check if user is a participant
     */
    public function hasParticipant(int $userId): bool
    {
        return $this->activeParticipants()->where('user_id', $userId)->exists();
    }

    /**
     * Get participant info for a user
     */
    public function getParticipant(int $userId): ?ConversationParticipant
    {
        return $this->participants()->where('user_id', $userId)->first();
    }

    /**
     * Check if user is admin or owner
     */
    public function userIsAdmin(int $userId): bool
    {
        return $this->participants()
            ->where('user_id', $userId)
            ->whereIn('role', ['admin', 'owner'])
            ->exists();
    }

    /**
     * Get the display name for the conversation
     */
    public function getDisplayNameAttribute(): string
    {
        if ($this->type === 'group' || $this->type === 'support') {
            return $this->name ?? 'Unnamed Group';
        }

        // For direct messages, return the other user's name
        return 'Direct Message';
    }

    /**
     * Get unread count for a specific user
     */
    public function getUnreadCountForUser(int $userId): int
    {
        $participant = $this->getParticipant($userId);
        if (!$participant || !$participant->last_read_at) {
            return $this->messages()->count();
        }

        return $this->messages()
            ->where('created_at', '>', $participant->last_read_at)
            ->where('sender_id', '!=', $userId)
            ->count();
    }

    /**
     * Find or create a direct conversation between two users
     */
    public static function findOrCreateDirect(int $userId1, int $userId2): self
    {
        // Find existing direct conversation
        $conversation = self::where('type', 'direct')
            ->whereHas('participants', function ($q) use ($userId1) {
                $q->where('user_id', $userId1)->where('invitation_status', 'accepted');
            })
            ->whereHas('participants', function ($q) use ($userId2) {
                $q->where('user_id', $userId2)->where('invitation_status', 'accepted');
            })
            ->first();

        if ($conversation) {
            return $conversation;
        }

        // Create new direct conversation
        $conversation = self::create([
            'type' => 'direct',
            'created_by' => $userId1,
        ]);

        // Add both participants
        $conversation->participants()->createMany([
            ['user_id' => $userId1, 'role' => 'member', 'invitation_status' => 'accepted'],
            ['user_id' => $userId2, 'role' => 'member', 'invitation_status' => 'accepted'],
        ]);

        return $conversation;
    }
}
