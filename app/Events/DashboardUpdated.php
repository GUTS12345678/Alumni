<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast when dashboard statistics change (new alumni, survey response, etc.).
 * Admin dashboard listens on 'admin.dashboard' and refreshes stats.
 */
class DashboardUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $trigger;

    /**
     * @param string $trigger  What caused the update, e.g. 'new_alumni', 'survey_response', 'job_application'
     */
    public function __construct(string $trigger = 'general')
    {
        $this->trigger = $trigger;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.dashboard'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'trigger' => $this->trigger,
            'timestamp' => now()->toISOString(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'dashboard.updated';
    }
}
