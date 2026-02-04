<?php

namespace App\Events;

use App\Models\Conversation;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConversationCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Conversation $conversation;
    public array $participantIds;

    /**
     * Create a new event instance.
     */
    public function __construct(Conversation $conversation)
    {
        $this->conversation = $conversation->load(['participants.user', 'lastMessage']);
        $this->participantIds = $conversation->participants->pluck('user_id')->toArray();
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        // Broadcast to each participant's private channel
        return collect($this->participantIds)->map(function ($userId) {
            return new PrivateChannel('user.' . $userId);
        })->toArray();
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'conversation' => [
                'id' => $this->conversation->id,
                'type' => $this->conversation->type,
                'title' => $this->conversation->title,
                'created_by' => $this->conversation->created_by,
                'created_at' => $this->conversation->created_at->toISOString(),
                'participants' => $this->conversation->participants->map(function ($participant) {
                    return [
                        'id' => $participant->id,
                        'user_id' => $participant->user_id,
                        'role' => $participant->role,
                        'status' => $participant->status,
                        'user' => [
                            'id' => $participant->user->id,
                            'name' => $participant->user->name,
                            'profile_picture' => $participant->user->profile_picture,
                        ],
                    ];
                }),
            ],
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'conversation.created';
    }
}
