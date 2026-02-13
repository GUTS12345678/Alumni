@extends('emails.layouts.notification')

@section('title', 'New Job Opportunity: ' . $jobPosting->title)

@section('header-subtitle', 'New Job Posting')

@section('content')
    <h2>💼 {{ $jobPosting->title }}</h2>
    
    @if($jobPosting->is_featured)
    <div class="info-box success">
        <strong>⭐ Featured Opportunity</strong> - This is a featured job posting recommended for you.
    </div>
    @endif
    
    <p>Dear {{ $recipientName }},</p>
    
    <p>A new job opportunity has been posted that may match your profile:</p>
    
    <div class="meta-info">
        <div class="meta-item">
            <div class="label">Company</div>
            <div class="value">{{ $jobPosting->company_name }}</div>
        </div>
        <div class="meta-item">
            <div class="label">Location</div>
            <div class="value">{{ $jobPosting->location ?? 'Not specified' }}</div>
        </div>
        <div class="meta-item">
            <div class="label">Work Type</div>
            <div class="value">{{ ucfirst(str_replace('_', ' ', $jobPosting->employment_type ?? 'Full Time')) }}</div>
        </div>
        <div class="meta-item">
            <div class="label">Arrangement</div>
            <div class="value">{{ ucfirst($jobPosting->work_arrangement ?? 'Onsite') }}</div>
        </div>
    </div>
    
    @if($jobPosting->is_salary_visible && ($jobPosting->salary_min || $jobPosting->salary_max))
    <div class="info-box info">
        <strong>💰 Salary Range:</strong> 
        @if($jobPosting->salary_min && $jobPosting->salary_max)
            {{ $jobPosting->salary_currency ?? 'PHP' }} {{ number_format($jobPosting->salary_min) }} - {{ number_format($jobPosting->salary_max) }}
            @if($jobPosting->salary_period)
                / {{ $jobPosting->salary_period }}
            @endif
        @elseif($jobPosting->salary_min)
            From {{ $jobPosting->salary_currency ?? 'PHP' }} {{ number_format($jobPosting->salary_min) }}
        @else
            Up to {{ $jobPosting->salary_currency ?? 'PHP' }} {{ number_format($jobPosting->salary_max) }}
        @endif
    </div>
    @endif
    
    <div class="content">
        <strong>Job Description:</strong><br><br>
        {!! nl2br(e(Str::limit($jobPosting->description, 400))) !!}
        @if(strlen($jobPosting->description) > 400)
            <p style="margin-top: 10px;"><em>... [Read more on the job board]</em></p>
        @endif
    </div>
    
    @if($jobPosting->requirements)
    <p style="margin-top: 20px;"><strong>Key Requirements:</strong></p>
    <div style="padding-left: 20px; color: #444444; font-size: 14px;">
        {!! nl2br(e(Str::limit($jobPosting->requirements, 200))) !!}
    </div>
    @endif
    
    <div class="button-wrapper">
        <a href="{{ config('app.url') }}/alumni/jobs/{{ $jobPosting->slug ?? $jobPosting->id }}" class="button">
            View Job Details
        </a>
    </div>
    
    @if($jobPosting->application_deadline)
    <p style="text-align: center; font-size: 14px; color: #f44336;">
        <strong>⏰ Application Deadline:</strong> {{ $jobPosting->application_deadline->format('F d, Y') }}
    </p>
    @endif
    
    <p style="font-size: 14px; color: #666666;">
        You're receiving this email because you've opted to receive job notifications. 
        <a href="{{ config('app.url') }}/alumni/settings" style="color: #800000;">Update your preferences</a>
    </p>
@endsection
