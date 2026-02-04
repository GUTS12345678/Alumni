<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConversationParticipant extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'user_id',
        'role',
        'nickname',
        'joined_at',
        'left_at',
        'last_read_at',
        'is_muted',
        'invitation_status',
        'invited_by',
    ];

    protected $casts = [
        'is_muted' => 'boolean',
        'joined_at' => 'datetime',
        'left_at' => 'datetime',
        'last_read_at' => 'datetime',
    ];

    /**
     * Get the conversation
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Get the user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the user who invited this participant
     */
    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    /**
     * Scope for active participants (not left)
     */
    public function scopeActive($query)
    {
        return $query->whereNull('left_at');
    }

    /**
     * Scope for accepted invitations
     */
    public function scopeAccepted($query)
    {
        return $query->where('invitation_status', 'accepted');
    }

    /**
     * Scope for pending invitations
     */
    public function scopePending($query)
    {
        return $query->where('invitation_status', 'pending');
    }

    /**
     * Check if participant is owner
     */
    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }

    /**
     * Check if participant is admin or owner
     */
    public function isAdmin(): bool
    {
        return in_array($this->role, ['admin', 'owner']);
    }

    /**
     * Mark all messages as read
     */
    public function markAllRead(): void
    {
        $this->update(['last_read_at' => now()]);
    }

    /**
     * Leave the conversation
     */
    public function leave(): void
    {
        $this->update(['left_at' => now()]);
    }

    /**
     * Accept invitation
     */
    public function acceptInvitation(): void
    {
        $this->update([
            'invitation_status' => 'accepted',
            'joined_at' => now(),
        ]);
    }

    /**
     * Decline invitation
     */
    public function declineInvitation(): void
    {
        $this->update(['invitation_status' => 'declined']);
    }
}
