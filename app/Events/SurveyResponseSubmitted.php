<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast when a survey response is submitted.
 * Notifies admins via the admin.dashboard and admin.content channels.
 */
class SurveyResponseSubmitted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $surveyId;
    public string $surveyTitle;
    public int $respondentId;
    public string $respondentName;

    public function __construct(int $surveyId, string $surveyTitle, int $respondentId, string $respondentName)
    {
        $this->surveyId = $surveyId;
        $this->surveyTitle = $surveyTitle;
        $this->respondentId = $respondentId;
        $this->respondentName = $respondentName;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.dashboard'),
            new PrivateChannel('admin.content'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'survey_id' => $this->surveyId,
            'survey_title' => $this->surveyTitle,
            'respondent_id' => $this->respondentId,
            'respondent_name' => $this->respondentName,
            'timestamp' => now()->toISOString(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'survey.response.submitted';
    }
}
