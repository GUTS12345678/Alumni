<?php

namespace App\Mail;

use App\Models\Survey;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SurveyNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public Survey $survey;
    public string $recipientName;
    public string $recipientEmail;
    public ?string $unsubscribeUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(
        Survey $survey,
        string $recipientName,
        string $recipientEmail,
        ?string $unsubscribeToken = null
    ) {
        $this->survey = $survey;
        $this->recipientName = $recipientName;
        $this->recipientEmail = $recipientEmail;
        $this->unsubscribeUrl = $unsubscribeToken 
            ? config('app.url') . '/api/v1/email/unsubscribe/' . $unsubscribeToken
            : null;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "📋 Survey Invitation: {$this->survey->title}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.survey-notification',
            with: [
                'survey' => $this->survey,
                'recipientName' => $this->recipientName,
                'recipientEmail' => $this->recipientEmail,
                'unsubscribeUrl' => $this->unsubscribeUrl,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
