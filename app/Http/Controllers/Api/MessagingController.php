<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AlumniConnection;
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
        ->with([
            'participants.user:id,name,email,profile_picture_path,role',
            'participants.user.alumniProfile:id,user_id,first_name,last_name',
            'lastMessage.sender:id,name,role',
            'lastMessage.sender.alumniProfile:id,user_id,first_name,last_name'
        ])
        ->withCount(['messages as unread_count' => function ($query) use ($user) {
            $query->whereDoesntHave('reads', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })->where('sender_id', '!=', $user->id);
        }])
        ->orderBy('updated_at', 'desc')
        ->paginate($request->get('per_page', 20));

        // Transform: add other_participant (for direct chats) and latest_message
        $conversations->getCollection()->transform(function ($conversation) use ($user) {
            return $this->transformConversation($conversation, $user);
        });

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

        $conversation->load([
            'participants.user:id,name,email,profile_picture_path,role',
            'participants.user.alumniProfile:id,user_id,first_name,last_name'
        ]);

        $messages = $conversation->messages()
            ->with([
                'sender:id,name,profile_picture_path,role',
                'sender.alumniProfile:id,user_id,first_name,last_name',
                'reads.user:id,name'
            ])
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
                $existingConversation->load([
                    'participants.user:id,name,email,profile_picture_path,role',
                    'participants.user.alumniProfile:id,user_id,first_name,last_name',
                    'lastMessage.sender:id,name,role',
                ]);
                $this->transformConversation($existingConversation, $user);
                return response()->json([
                    'success' => true,
                    'data' => $existingConversation,
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
                    'type' => 'text',
                ]);

                $conversation->update(['last_message_id' => $message->id]);
                
                broadcast(new MessageSent($message))->toOthers();
            }

            DB::commit();

            $conversation->load([
                'participants.user:id,name,email,profile_picture_path,role',
                'participants.user.alumniProfile:id,user_id,first_name,last_name',
                'lastMessage.sender:id,name,role',
            ]);
            $this->transformConversation($conversation, $user);
            
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
            'type' => $request->type ?? $request->message_type ?? 'text',
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
            'type' => 'system',
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
            'type' => 'system',
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
            'connections_only' => 'nullable|boolean',
        ]);

        $user = Auth::user();
        $searchQuery = $request->query('query');
        $connectionsOnly = $request->boolean('connections_only', false);

        // Get blocked user IDs (both directions)
        $blockedIds = BlockedUser::where('user_id', $user->id)
            ->orWhere('blocked_user_id', $user->id)
            ->pluck('blocked_user_id')
            ->merge(
                BlockedUser::where('blocked_user_id', $user->id)->pluck('user_id')
            )
            ->unique()
            ->toArray();

        // Get connected alumni IDs if alumni user
        $connectedAlumniIds = [];
        if ($user->role === 'alumni') {
            $connectedAlumniIds = AlumniConnection::where(function($q) use ($user) {
                $q->where('sender_id', $user->id)->orWhere('receiver_id', $user->id);
            })
            ->where('status', 'accepted')
            ->get()
            ->map(function($conn) use ($user) {
                return $conn->sender_id === $user->id ? $conn->receiver_id : $conn->sender_id;
            })
            ->toArray();
        }

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

        // Alumni can only message other alumni (if connected) and admins
        if ($user->role === 'alumni') {
            if ($connectionsOnly) {
                // Only show connected alumni and admins
                $usersQuery->where(function($q) use ($connectedAlumniIds) {
                    $q->whereIn('id', $connectedAlumniIds)
                      ->orWhereIn('role', ['admin', 'super_admin']);
                });
            } else {
                $usersQuery->whereIn('role', ['alumni', 'admin', 'super_admin']);
            }
        }

        $users = $usersQuery->with(['alumniProfile:id,user_id,first_name,last_name,student_id,graduation_year,department_id', 'alumniProfile.department:id,name,code'])
            ->select('id', 'name', 'email', 'profile_picture_path', 'role')
            ->limit(20)
            ->get()
            ->map(function ($u) use ($user, $connectedAlumniIds) {
                $isConnected = in_array($u->id, $connectedAlumniIds);
                $canMessage = $u->role !== 'alumni' || $isConnected;
                
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'profile_picture' => $u->profile_picture_path,
                    'profile_picture_path' => $u->profile_picture_path,
                    'role' => $u->role,
                    'student_id' => $u->alumniProfile?->student_id,
                    'graduation_year' => $u->alumniProfile?->graduation_year,
                    'department' => $u->alumniProfile?->department?->name,
                    'is_connected' => $isConnected,
                    'can_message' => $canMessage,
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

    /**
     * Transform a conversation model to include other_participant and latest_message
     * so the frontend receives the expected shape.
     */
    private function transformConversation(Conversation $conversation, $user): Conversation
    {
        $conversation->latest_message = $conversation->lastMessage;

        if ($conversation->type === 'direct') {
            $other = $conversation->participants
                ->where('user_id', '!=', $user->id)
                ->first();
            $conversation->other_participant = $other?->user;
        }

        unset($conversation->lastMessage);

        return $conversation;
    }

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
                    
                    // For direct chats, alumni must be connected with other alumni
                    if ($type === 'direct' && $participant->role === 'alumni') {
                        if (!AlumniConnection::areConnected($user->id, $participant->id)) {
                            return false;
                        }
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

    // =========== ADMIN ARCHIVE / HISTORY ===========

    /**
     * Get all conversations for admin archival view (admin-only).
     */
    public function getArchiveConversations(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $query = Conversation::with([
            'participants.user:id,name,email,profile_picture_path,role',
            'participants.user.alumniProfile:id,user_id,first_name,last_name',
            'lastMessage.sender:id,name,role',
            'creator:id,name,email',
        ])
        ->withCount('messages')
        ->withCount(['participants as active_participants_count' => function ($q) {
            $q->whereNull('left_at')->where('invitation_status', 'accepted');
        }]);

        // Search by participant name/email or conversation name
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhereHas('participants.user', function ($subQ) use ($search) {
                      $subQ->where('name', 'like', "%{$search}%")
                           ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by type
        if ($type = $request->get('type')) {
            $query->where('type', $type);
        }

        // Date range
        if ($from = $request->get('from')) {
            $query->where('created_at', '>=', $from);
        }
        if ($to = $request->get('to')) {
            $query->where('created_at', '<=', $to . ' 23:59:59');
        }

        $conversations = $query->orderBy('updated_at', 'desc')
            ->paginate($request->get('per_page', 20));

        // Transform to add participant names for display
        $conversations->getCollection()->transform(function ($conversation) {
            $participants = $conversation->participants->map(function ($p) {
                $u = $p->user;
                if (!$u) return null;
                $name = $u->name;
                if ($u->alumniProfile) {
                    $full = trim(($u->alumniProfile->first_name ?? '') . ' ' . ($u->alumniProfile->last_name ?? ''));
                    if ($full) $name = $full;
                }
                return [
                    'id' => $u->id,
                    'name' => $name,
                    'email' => $u->email,
                    'role' => $u->role,
                    'profile_picture_path' => $u->profile_picture_path,
                ];
            })->filter()->values();

            $conversation->participant_list = $participants;
            $conversation->latest_message = $conversation->lastMessage;
            unset($conversation->lastMessage);

            return $conversation;
        });

        // Stats
        $stats = [
            'total_conversations' => Conversation::count(),
            'total_messages' => Message::count(),
            'direct_conversations' => Conversation::where('type', 'direct')->count(),
            'group_conversations' => Conversation::where('type', 'group')->count(),
            'today_messages' => Message::whereDate('created_at', today())->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $conversations,
            'stats' => $stats,
        ]);
    }

    /**
     * Get all messages in a conversation for archival viewing (admin-only).
     */
    public function getArchiveMessages(Conversation $conversation, Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $conversation->load([
            'participants.user:id,name,email,profile_picture_path,role',
            'participants.user.alumniProfile:id,user_id,first_name,last_name',
            'creator:id,name,email',
        ]);

        $query = $conversation->messages()
            ->with([
                'sender:id,name,email,profile_picture_path,role',
                'sender.alumniProfile:id,user_id,first_name,last_name',
            ]);

        // Search within messages
        if ($search = $request->get('search')) {
            $query->where('content', 'like', "%{$search}%");
        }

        $messages = $query->orderBy('created_at', 'asc')
            ->paginate($request->get('per_page', 100));

        return response()->json([
            'success' => true,
            'data' => [
                'conversation' => $conversation,
                'messages' => $messages,
            ],
        ]);
    }

    /**
     * Export conversation messages as JSON (admin-only).
     */
    public function exportConversation(Conversation $conversation): JsonResponse
    {
        $user = Auth::user();
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $conversation->load([
            'participants.user:id,name,email,role',
            'participants.user.alumniProfile:id,user_id,first_name,last_name',
        ]);

        $messages = $conversation->messages()
            ->with('sender:id,name,email,role')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($msg) {
                return [
                    'id' => $msg->id,
                    'sender' => $msg->sender?->name ?? 'Unknown',
                    'sender_email' => $msg->sender?->email ?? '',
                    'content' => $msg->content,
                    'type' => $msg->type,
                    'sent_at' => $msg->created_at->toIso8601String(),
                    'is_edited' => $msg->is_edited,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'conversation' => [
                    'id' => $conversation->id,
                    'type' => $conversation->type,
                    'name' => $conversation->name,
                    'created_at' => $conversation->created_at->toIso8601String(),
                    'participants' => $conversation->participants->map(fn($p) => [
                        'name' => $p->user?->name ?? 'Unknown',
                        'email' => $p->user?->email ?? '',
                        'role' => $p->user?->role ?? '',
                    ]),
                ],
                'messages' => $messages,
                'exported_at' => now()->toIso8601String(),
            ],
        ]);
    }
}
