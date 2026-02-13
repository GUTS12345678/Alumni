<?php

namespace App\Mail;

use App\Models\Announcement;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AnnouncementNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public Announcement $announcement;
    public string $recipientName;
    public string $recipientEmail;
    public ?string $unsubscribeUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(
        Announcement $announcement,
        string $recipientName,
        string $recipientEmail,
        ?string $unsubscribeToken = null
    ) {
        $this->announcement = $announcement;
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
        $priorityEmoji = match($this->announcement->priority) {
            'urgent' => '🚨',
            'high' => '📌',
            default => '📢',
        };

        return new Envelope(
            subject: "{$priorityEmoji} New Announcement: {$this->announcement->title}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.announcement-notification',
            with: [
                'announcement' => $this->announcement,
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
