<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Conversation;
use App\Models\ConversationParticipant;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

/**
 * User's personal channel for private notifications
 * - New message notifications
 * - Conversation invitations
 * - Typing indicators from other conversations
 */
Broadcast::channel('user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

/**
 * Conversation channel for real-time messages
 * Only participants can join this channel
 */
Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    // Check if user is a participant in this conversation
    return ConversationParticipant::where('conversation_id', $conversationId)
        ->where('user_id', $user->id)
        ->where('invitation_status', 'accepted')
        ->whereNull('left_at')
        ->exists();
});

/**
 * Presence channel for conversation - shows online users
 * Returns user data for presence tracking
 */
Broadcast::channel('presence.conversation.{conversationId}', function ($user, $conversationId) {
    // Check if user is a participant
    $isParticipant = ConversationParticipant::where('conversation_id', $conversationId)
        ->where('user_id', $user->id)
        ->where('invitation_status', 'accepted')
        ->whereNull('left_at')
        ->exists();

    if ($isParticipant) {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'avatar' => $user->profile_picture_path,
            'role' => $user->role,
        ];
    }

    return false;
});

/**
 * Admin support channel
 * All admins can listen to this for incoming support requests
 */
Broadcast::channel('admin.support', function ($user) {
    return $user->hasAdminPrivileges();
});

/**
 * Announcements channel for specific user
 * Receives broadcast announcements targeted to this user
 */
Broadcast::channel('announcements.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

/**
 * Online status channel - presence channel for all users
 * Used to track who is online in the system
 */
Broadcast::channel('online', function ($user) {
    if ($user) {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'avatar' => $user->profile_picture_path,
        ];
    }
    return false;
});
