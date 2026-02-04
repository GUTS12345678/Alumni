<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BlockedUser extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'blocked_user_id',
        'reason',
    ];

    /**
     * Get the user who blocked
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the blocked user
     */
    public function blockedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'blocked_user_id');
    }

    /**
     * Check if user1 has blocked user2
     */
    public static function hasBlocked(int $userId, int $blockedUserId): bool
    {
        return self::where('user_id', $userId)
            ->where('blocked_user_id', $blockedUserId)
            ->exists();
    }

    /**
     * Check if either user has blocked the other
     */
    public static function isBlocked(int $userId1, int $userId2): bool
    {
        return self::where(function ($q) use ($userId1, $userId2) {
            $q->where('user_id', $userId1)->where('blocked_user_id', $userId2);
        })->orWhere(function ($q) use ($userId1, $userId2) {
            $q->where('user_id', $userId2)->where('blocked_user_id', $userId1);
        })->exists();
    }

    /**
     * Block a user
     */
    public static function blockUser(int $userId, int $blockedUserId, ?string $reason = null): self
    {
        return self::firstOrCreate([
            'user_id' => $userId,
            'blocked_user_id' => $blockedUserId,
        ], [
            'reason' => $reason,
        ]);
    }

    /**
     * Unblock a user
     */
    public static function unblockUser(int $userId, int $blockedUserId): bool
    {
        return self::where('user_id', $userId)
            ->where('blocked_user_id', $blockedUserId)
            ->delete() > 0;
    }
}
