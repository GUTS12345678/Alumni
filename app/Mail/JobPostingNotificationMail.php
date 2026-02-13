<?php

namespace App\Mail;

use App\Models\JobPosting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class JobPostingNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public JobPosting $jobPosting;
    public string $recipientName;
    public string $recipientEmail;
    public ?string $unsubscribeUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(
        JobPosting $jobPosting,
        string $recipientName,
        string $recipientEmail,
        ?string $unsubscribeToken = null
    ) {
        $this->jobPosting = $jobPosting;
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
        $emoji = $this->jobPosting->is_featured ? '⭐' : '💼';

        return new Envelope(
            subject: "{$emoji} New Job: {$this->jobPosting->title} at {$this->jobPosting->company_name}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.job-posting-notification',
            with: [
                'jobPosting' => $this->jobPosting,
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
