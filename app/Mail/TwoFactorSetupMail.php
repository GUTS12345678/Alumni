<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TwoFactorSetupMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $qrCodeUrl;
    public $secretKey;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, string $qrCodeUrl, string $secretKey)
    {
        $this->user = $user;
        $this->qrCodeUrl = $qrCodeUrl;
        $this->secretKey = $secretKey;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Setup Two-Factor Authentication - Alumni Tracer System',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.two-factor-setup',
            with: [
                'userName' => $this->user->name,
                'qrCodeUrl' => $this->qrCodeUrl,
                'secretKey' => $this->secretKey,
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
