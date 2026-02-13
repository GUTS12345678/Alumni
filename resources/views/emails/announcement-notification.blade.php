@extends('emails.layouts.notification')

@section('title', 'New Announcement: ' . $announcement->title)

@section('header-subtitle', 'New Announcement')

@section('content')
    <h2>📢 {{ $announcement->title }}</h2>
    
    @if($announcement->priority === 'urgent')
    <div class="info-box">
        <strong>⚠️ Urgent Announcement</strong> - This is a high-priority announcement that requires your attention.
    </div>
    @elseif($announcement->priority === 'high')
    <div class="info-box info">
        <strong>📌 Important Notice</strong> - Please review this announcement.
    </div>
    @endif
    
    <p>Dear {{ $recipientName }},</p>
    
    <p>A new announcement has been published that may be of interest to you:</p>
    
    <div class="content">
        {!! nl2br(e(Str::limit($announcement->content, 500))) !!}
        @if(strlen($announcement->content) > 500)
            <p style="margin-top: 10px;"><em>... [Read more on the portal]</em></p>
        @endif
    </div>
    
    <div class="meta-info">
        <div class="meta-item">
            <div class="label">Published</div>
            <div class="value">{{ $announcement->published_at ? $announcement->published_at->format('M d, Y') : 'Just now' }}</div>
        </div>
        <div class="meta-item">
            <div class="label">Priority</div>
            <div class="value">{{ ucfirst($announcement->priority ?? 'Normal') }}</div>
        </div>
        @if($announcement->target_type !== 'all')
        <div class="meta-item">
            <div class="label">Target Audience</div>
            <div class="value">{{ ucfirst($announcement->target_type) }}</div>
        </div>
        @endif
    </div>
    
    <div class="button-wrapper">
        <a href="{{ config('app.url') }}/alumni/announcements" class="button">
            View Full Announcement
        </a>
    </div>
    
    <p style="font-size: 14px; color: #666666;">
        You're receiving this email because you're a registered alumni. 
        You can manage your email preferences in your account settings.
    </p>
@endsection
