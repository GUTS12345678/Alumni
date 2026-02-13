@extends('emails.layouts.notification')

@section('title', 'New Survey: ' . $survey->title)

@section('header-subtitle', 'Survey Invitation')

@section('content')
    <h2>📋 {{ $survey->title }}</h2>
    
    <p>Dear {{ $recipientName }},</p>
    
    <p>You're invited to participate in a new survey. Your feedback is valuable and helps us improve our services for the alumni community.</p>
    
    @if($survey->description)
    <div class="content">
        {!! nl2br(e($survey->description)) !!}
    </div>
    @endif
    
    <div class="meta-info">
        <div class="meta-item">
            <div class="label">Survey Type</div>
            <div class="value">{{ ucfirst($survey->type ?? 'General') }}</div>
        </div>
        <div class="meta-item">
            <div class="label">Estimated Time</div>
            <div class="value">{{ $survey->estimated_time ?? '5-10' }} minutes</div>
        </div>
        @if($survey->ends_at)
        <div class="meta-item">
            <div class="label">Deadline</div>
            <div class="value">{{ $survey->ends_at->format('M d, Y') }}</div>
        </div>
        @endif
        @if($survey->is_anonymous)
        <div class="meta-item">
            <div class="label">Privacy</div>
            <div class="value">🔒 Anonymous</div>
        </div>
        @endif
    </div>
    
    <div class="info-box info">
        <strong>Why participate?</strong><br>
        Your responses help us understand alumni needs, improve our programs, and strengthen our community. 
        @if($survey->is_anonymous)
            All responses are completely anonymous.
        @endif
    </div>
    
    <div class="button-wrapper">
        <a href="{{ config('app.url') }}/alumni/surveys/{{ $survey->id }}/take" class="button">
            Take the Survey
        </a>
    </div>
    
    @if($survey->ends_at)
    <p style="text-align: center; font-size: 14px; color: #f44336;">
        <strong>⏰ Please respond by:</strong> {{ $survey->ends_at->format('F d, Y') }}
    </p>
    @endif
    
    <p style="font-size: 14px; color: #666666;">
        You're receiving this email because you're a registered alumni. 
        Survey participation is voluntary.
    </p>
@endsection
