<?php

namespace App\Events;

use App\Models\Announcement;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AnnouncementPublished implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Announcement $announcement;

    /**
     * Create a new event instance.
     */
    public function __construct(Announcement $announcement)
    {
        $this->announcement = $announcement->load('createdBy');
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [];

        // If targeting all alumni
        if ($this->announcement->target_type === 'all') {
            $channels[] = new PrivateChannel('announcements.all');
        }

        // If targeting specific batches
        if ($this->announcement->target_type === 'batch' && $this->announcement->target_batch_years) {
            foreach ($this->announcement->target_batch_years as $year) {
                $channels[] = new PrivateChannel('announcements.batch.' . $year);
            }
        }

        // If targeting specific departments
        if ($this->announcement->target_type === 'department' && $this->announcement->target_department_ids) {
            foreach ($this->announcement->target_department_ids as $deptId) {
                $channels[] = new PrivateChannel('announcements.department.' . $deptId);
            }
        }

        return $channels;
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'announcement' => [
                'id' => $this->announcement->id,
                'title' => $this->announcement->title,
                'content' => $this->announcement->content,
                'priority' => $this->announcement->priority,
                'target_type' => $this->announcement->target_type,
                'created_at' => $this->announcement->created_at->toISOString(),
                'created_by' => [
                    'id' => $this->announcement->createdBy->id,
                    'name' => $this->announcement->createdBy->name,
                ],
            ],
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'announcement.published';
    }
}
