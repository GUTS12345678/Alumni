<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\MessageRead;
use App\Models\BlockedUser;
use App\Models\User;
use App\Events\MessageSent;
use App\Events\MessageRead as MessageReadEvent;
use App\Events\UserTyping;
use App\Events\ConversationCreated;
use App\Events\GroupInvitationReceived;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class MessagingController extends Controller
{
    /**
     * Get all conversations for the authenticated user.
     */
    public function getConversations(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $conversations = Conversation::whereHas('participants', function ($query) use ($user) {
            $query->where('user_id', $user->id)
                  ->where('invitation_status', 'accepted')
                  ->whereNull('left_at');
        })
        ->with(['participants.user:id,name,email,profile_picture_path', 'lastMessage.sender:id,name'])
        ->withCount(['messages as unread_count' => function ($query) use ($user) {
            $query->whereDoesntHave('reads', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })->where('sender_id', '!=', $user->id);
        }])
        ->orderBy('updated_at', 'desc')
        ->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $conversations,
        ]);
    }

    /**
     * Get a single conversation with messages.
     */
    public function getConversation(Conversation $conversation, Request $request): JsonResponse
    {
        $user = Auth::user();
        
        // Check if user is a participant
        $participant = $conversation->participants()
            ->where('user_id', $user->id)
            ->where('invitation_status', 'accepted')
            ->whereNull('left_at')
            ->first();
            
        if (!$participant) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a participant of this conversation.',
            ], 403);
        }

        $conversation->load(['participants.user:id,name,email,profile_picture_path,role']);

        $messages = $conversation->messages()
            ->with(['sender:id,name,profile_picture_path', 'reads.user:id,name'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 50));

        // Mark messages as read
        $this->markMessagesAsRead($conversation, $user);

        return response()->json([
            'success' => true,
            'data' => [
                'conversation' => $conversation,
                'messages' => $messages,
            ],
        ]);
    }

    /**
     * Create a new conversation (direct or group).
     */
    public function createConversation(Request $request): JsonResponse
    {
        $request->validate([
            'type' => ['required', Rule::in(['direct', 'group', 'admin_support'])],
            'title' => 'required_if:type,group|nullable|string|max:255',
            'participant_ids' => 'required_if:type,direct,group|array',
            'participant_ids.*' => 'exists:users,id',
            'initial_message' => 'nullable|string|max:5000',
        ]);

        $user = Auth::user();
        $type = $request->type;

        // Validate messaging permissions
        if (!$this->canCreateConversation($user, $type, $request->participant_ids ?? [])) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to create this type of conversation.',
            ], 403);
        }

        // Check for blocked users
        if ($type === 'direct' && count($request->participant_ids) === 1) {
            $otherUserId = $request->participant_ids[0];
            if ($this->isBlocked($user->id, $otherUserId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot start conversation with this user.',
                ], 403);
            }

            // Check for existing direct conversation
            $existingConversation = $this->findExistingDirectConversation($user->id, $otherUserId);
            if ($existingConversation) {
                return response()->json([
                    'success' => true,
                    'data' => $existingConversation->load(['participants.user', 'lastMessage']),
                    'message' => 'Existing conversation found.',
                ]);
            }
        }

        DB::beginTransaction();
        try {
            $conversation = Conversation::create([
                'type' => $type,
                'title' => $type === 'group' ? $request->title : null,
                'created_by' => $user->id,
            ]);

            // Add creator as participant
            ConversationParticipant::create([
                'conversation_id' => $conversation->id,
                'user_id' => $user->id,
                'role' => $type === 'group' ? 'owner' : 'member',
                'invitation_status' => 'accepted',
                'joined_at' => now(),
            ]);

            // Add other participants
            if ($request->participant_ids) {
                foreach ($request->participant_ids as $participantId) {
                    if ($participantId == $user->id) continue;
                    
                    $status = $type === 'group' ? 'pending' : 'accepted';
                    
                    ConversationParticipant::create([
                        'conversation_id' => $conversation->id,
                        'user_id' => $participantId,
                        'role' => 'member',
                        'invitation_status' => $status,
                        'joined_at' => $status === 'accepted' ? now() : null,
                    ]);

                    // Send group invitation notification
                    if ($type === 'group') {
                        broadcast(new GroupInvitationReceived(
                            $participantId,
                            $conversation->id,
                            $conversation->title,
                            $user->name
                        ))->toOthers();
                    }
                }
            }

            // Send initial message if provided
            if ($request->initial_message) {
                $message = Message::create([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $user->id,
                    'content' => $request->initial_message,
                    'message_type' => 'text',
                ]);

                $conversation->update(['last_message_id' => $message->id]);
                
                broadcast(new MessageSent($message))->toOthers();
            }

            DB::commit();

            $conversation->load(['participants.user', 'lastMessage']);
            
            broadcast(new ConversationCreated($conversation))->toOthers();

            return response()->json([
                'success' => true,
                'data' => $conversation,
                'message' => 'Conversation created successfully.',
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create conversation.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Send a message in a conversation.
     */
    public function sendMessage(Conversation $conversation, Request $request): JsonResponse
    {
        $request->validate([
            'content' => 'required_without:attachments|nullable|string|max:5000',
            'message_type' => ['nullable', Rule::in(['text', 'image', 'file', 'system'])],
            'attachments' => 'nullable|array',
            'attachments.*.url' => 'required|string',
            'attachments.*.name' => 'required|string',
            'attachments.*.type' => 'required|string',
            'attachments.*.size' => 'required|integer',
        ]);

        $user = Auth::user();
        
        // Check if user is active participant
        $participant = $conversation->participants()
            ->where('user_id', $user->id)
            ->where('invitation_status', 'accepted')
            ->whereNull('left_at')
            ->first();
            
        if (!$participant) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot send messages in this conversation.',
            ], 403);
        }

        // Check if blocked (for direct conversations)
        if ($conversation->type === 'direct') {
            $otherParticipant = $conversation->participants()
                ->where('user_id', '!=', $user->id)
                ->first();
            
            if ($otherParticipant && $this->isBlocked($user->id, $otherParticipant->user_id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot send messages to this user.',
                ], 403);
            }
        }

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'content' => $request->content,
            'message_type' => $request->message_type ?? 'text',
            'attachments' => $request->attachments,
        ]);

        $conversation->update(['last_message_id' => $message->id]);

        $message->load(['sender:id,name,profile_picture_path']);

        broadcast(new MessageSent($message))->toOthers();

        return response()->json([
            'success' => true,
            'data' => $message,
        ], 201);
    }

    /**
     * Mark messages as read.
     */
    public function markAsRead(Conversation $conversation, Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $participant = $conversation->participants()
            ->where('user_id', $user->id)
            ->where('invitation_status', 'accepted')
            ->whereNull('left_at')
            ->first();
            
        if (!$participant) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a participant of this conversation.',
            ], 403);
        }

        $lastMessage = $this->markMessagesAsRead($conversation, $user);

        if ($lastMessage) {
            broadcast(new MessageReadEvent(
                $conversation->id,
                $user->id,
                $lastMessage->id,
                now()->toISOString()
            ))->toOthers();
        }

        return response()->json([
            'success' => true,
            'message' => 'Messages marked as read.',
        ]);
    }

    /**
     * Broadcast typing indicator.
     */
    public function typing(Conversation $conversation, Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $participant = $conversation->participants()
            ->where('user_id', $user->id)
            ->where('invitation_status', 'accepted')
            ->whereNull('left_at')
            ->first();
            
        if (!$participant) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a participant of this conversation.',
            ], 403);
        }

        broadcast(new UserTyping(
            $conversation->id,
            $user,
            $request->get('is_typing', true)
        ))->toOthers();

        return response()->json(['success' => true]);
    }

    /**
     * Accept group invitation.
     */
    public function acceptInvitation(Conversation $conversation): JsonResponse
    {
        $user = Auth::user();
        
        $participant = $conversation->participants()
            ->where('user_id', $user->id)
            ->where('invitation_status', 'pending')
            ->first();
            
        if (!$participant) {
            return response()->json([
                'success' => false,
                'message' => 'No pending invitation found.',
            ], 404);
        }

        $participant->update([
            'invitation_status' => 'accepted',
            'joined_at' => now(),
        ]);

        // Add system message
        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'content' => $user->name . ' joined the group.',
            'message_type' => 'system',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Invitation accepted.',
        ]);
    }

    /**
     * Decline group invitation.
     */
    public function declineInvitation(Conversation $conversation): JsonResponse
    {
        $user = Auth::user();
        
        $participant = $conversation->participants()
            ->where('user_id', $user->id)
            ->where('invitation_status', 'pending')
            ->first();
            
        if (!$participant) {
            return response()->json([
                'success' => false,
                'message' => 'No pending invitation found.',
            ], 404);
        }

        $participant->delete();

        return response()->json([
            'success' => true,
            'message' => 'Invitation declined.',
        ]);
    }

    /**
     * Get pending group invitations.
     */
    public function getPendingInvitations(): JsonResponse
    {
        $user = Auth::user();
        
        $invitations = ConversationParticipant::where('user_id', $user->id)
            ->where('invitation_status', 'pending')
            ->with(['conversation.createdBy:id,name', 'conversation:id,title,type,created_by'])
            ->get()
            ->map(function ($participant) {
                return [
                    'conversation_id' => $participant->conversation_id,
                    'title' => $participant->conversation->title,
                    'invited_by' => $participant->conversation->createdBy->name,
                    'created_at' => $participant->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $invitations,
        ]);
    }

    /**
     * Leave a conversation.
     */
    public function leaveConversation(Conversation $conversation): JsonResponse
    {
        $user = Auth::user();
        
        $participant = $conversation->participants()
            ->where('user_id', $user->id)
            ->where('invitation_status', 'accepted')
            ->whereNull('left_at')
            ->first();
            
        if (!$participant) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a participant of this conversation.',
            ], 403);
        }

        if ($conversation->type === 'direct') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot leave direct conversations. You can block the user instead.',
            ], 400);
        }

        $participant->update(['left_at' => now()]);

        // Add system message
        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'content' => $user->name . ' left the group.',
            'message_type' => 'system',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'You have left the conversation.',
        ]);
    }

    /**
     * Block a user.
     */
    public function blockUser(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'reason' => 'nullable|string|max:500',
        ]);

        $user = Auth::user();
        
        if ($request->user_id == $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot block yourself.',
            ], 400);
        }

        BlockedUser::updateOrCreate(
            [
                'user_id' => $user->id,
                'blocked_user_id' => $request->user_id,
            ],
            [
                'reason' => $request->reason,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'User blocked successfully.',
        ]);
    }

    /**
     * Unblock a user.
     */
    public function unblockUser(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $user = Auth::user();
        
        BlockedUser::where('user_id', $user->id)
            ->where('blocked_user_id', $request->user_id)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'User unblocked successfully.',
        ]);
    }

    /**
     * Get blocked users.
     */
    public function getBlockedUsers(): JsonResponse
    {
        $user = Auth::user();
        
        $blockedUsers = BlockedUser::where('user_id', $user->id)
            ->with('blockedUser:id,name,email,profile_picture_path')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $blockedUsers,
        ]);
    }

    /**
     * Search users for messaging.
     * Supports searching by name, email, student ID, batch year, and department.
     */
    public function searchUsers(Request $request): JsonResponse
    {
        $request->validate([
            'query' => 'required|string|min:2|max:100',
        ]);

        $user = Auth::user();
        $searchQuery = $request->query('query');

        // Get blocked user IDs (both directions)
        $blockedIds = BlockedUser::where('user_id', $user->id)
            ->orWhere('blocked_user_id', $user->id)
            ->pluck('blocked_user_id')
            ->merge(
                BlockedUser::where('blocked_user_id', $user->id)->pluck('user_id')
            )
            ->unique()
            ->toArray();

        $usersQuery = User::where('id', '!=', $user->id)
            ->whereNotIn('id', $blockedIds)
            ->where(function ($q) use ($searchQuery) {
                // Search by user name and email
                $q->where('name', 'like', "%{$searchQuery}%")
                  ->orWhere('email', 'like', "%{$searchQuery}%")
                  // Search by alumni profile fields
                  ->orWhereHas('alumniProfile', function ($profileQuery) use ($searchQuery) {
                      $profileQuery->where('student_id', 'like', "%{$searchQuery}%")
                          ->orWhere('first_name', 'like', "%{$searchQuery}%")
                          ->orWhere('last_name', 'like', "%{$searchQuery}%")
                          ->orWhere('graduation_year', 'like', "%{$searchQuery}%")
                          ->orWhere('current_employer', 'like', "%{$searchQuery}%")
                          ->orWhere('current_job_title', 'like', "%{$searchQuery}%");
                  })
                  // Search by department name
                  ->orWhereHas('alumniProfile.department', function ($deptQuery) use ($searchQuery) {
                      $deptQuery->where('name', 'like', "%{$searchQuery}%")
                          ->orWhere('code', 'like', "%{$searchQuery}%");
                  })
                  // Search by batch year
                  ->orWhereHas('alumniProfile.batch', function ($batchQuery) use ($searchQuery) {
                      $batchQuery->where('graduation_year', 'like', "%{$searchQuery}%")
                          ->orWhere('name', 'like', "%{$searchQuery}%");
                  });
            });

        // Alumni can only message other alumni and admins
        if ($user->role === 'alumni') {
            $usersQuery->whereIn('role', ['alumni', 'admin', 'super_admin']);
        }

        $users = $usersQuery->with(['alumniProfile:id,user_id,first_name,last_name,student_id,graduation_year,department_id', 'alumniProfile.department:id,name,code'])
            ->select('id', 'name', 'email', 'profile_picture_path', 'role')
            ->limit(20)
            ->get()
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'profile_picture' => $u->profile_picture_path,
                    'role' => $u->role,
                    'student_id' => $u->alumniProfile?->student_id,
                    'graduation_year' => $u->alumniProfile?->graduation_year,
                    'department' => $u->alumniProfile?->department?->name,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    /**
     * Get unread message count.
     */
    public function getUnreadCount(): JsonResponse
    {
        $user = Auth::user();
        
        $count = Message::whereHas('conversation.participants', function ($query) use ($user) {
            $query->where('user_id', $user->id)->where('invitation_status', 'accepted')->whereNull('left_at');
        })
        ->where('sender_id', '!=', $user->id)
        ->whereDoesntHave('reads', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->count();

        return response()->json([
            'success' => true,
            'data' => ['unread_count' => $count],
        ]);
    }

    // =========== HELPER METHODS ===========

    private function canCreateConversation(User $user, string $type, array $participantIds): bool
    {
        // Admins can create any type of conversation
        if (in_array($user->role, ['admin', 'super_admin'])) {
            return true;
        }

        // Alumni can create direct and group chats
        if ($user->role === 'alumni') {
            if ($type === 'admin_support') {
                return true; // Alumni can request admin support
            }

            if (in_array($type, ['direct', 'group'])) {
                // Verify all participants are valid (alumni or admins)
                $validRoles = ['alumni', 'admin', 'super_admin'];
                $participants = User::whereIn('id', $participantIds)->get();
                
                foreach ($participants as $participant) {
                    if (!in_array($participant->role, $validRoles)) {
                        return false;
                    }
                }
                return true;
            }
        }

        return false;
    }

    private function isBlocked(int $userId1, int $userId2): bool
    {
        return BlockedUser::where(function ($query) use ($userId1, $userId2) {
            $query->where('user_id', $userId1)->where('blocked_user_id', $userId2);
        })->orWhere(function ($query) use ($userId1, $userId2) {
            $query->where('user_id', $userId2)->where('blocked_user_id', $userId1);
        })->exists();
    }

    private function findExistingDirectConversation(int $userId1, int $userId2): ?Conversation
    {
        return Conversation::where('type', 'direct')
            ->whereHas('participants', function ($query) use ($userId1) {
                $query->where('user_id', $userId1);
            })
            ->whereHas('participants', function ($query) use ($userId2) {
                $query->where('user_id', $userId2);
            })
            ->first();
    }

    private function markMessagesAsRead(Conversation $conversation, User $user): ?Message
    {
        $unreadMessages = $conversation->messages()
            ->where('sender_id', '!=', $user->id)
            ->whereDoesntHave('reads', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->get();

        $lastMessage = null;
        foreach ($unreadMessages as $message) {
            MessageRead::create([
                'message_id' => $message->id,
                'user_id' => $user->id,
                'read_at' => now(),
            ]);
            $lastMessage = $message;
        }

        return $lastMessage;
    }
}
