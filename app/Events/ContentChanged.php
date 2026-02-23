<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast when any content item (announcement, job, page, etc.) is created, updated, or deleted.
 * Admin pages listen on the 'admin.content' channel and refresh their data.
 */
class ContentChanged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $contentType;
    public string $action;
    public ?int $contentId;
    public ?string $title;

    /**
     * @param string $contentType  e.g. 'announcement', 'job', 'survey', 'content'
     * @param string $action       e.g. 'created', 'updated', 'deleted', 'published'
     * @param int|null $contentId
     * @param string|null $title
     */
    public function __construct(string $contentType, string $action, ?int $contentId = null, ?string $title = null)
    {
        $this->contentType = $contentType;
        $this->action = $action;
        $this->contentId = $contentId;
        $this->title = $title;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.content'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'content_type' => $this->contentType,
            'action' => $this->action,
            'content_id' => $this->contentId,
            'title' => $this->title,
            'timestamp' => now()->toISOString(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'content.changed';
    }
}
