<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Email Notification System Tables
 * 
 * Implements email preferences and tracking for alumni notifications
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Jobs table for queue (if not exists)
        if (!Schema::hasTable('jobs')) {
            Schema::create('jobs', function (Blueprint $table) {
                $table->id();
                $table->string('queue')->index();
                $table->longText('payload');
                $table->unsignedTinyInteger('attempts');
                $table->unsignedInteger('reserved_at')->nullable();
                $table->unsignedInteger('available_at');
                $table->unsignedInteger('created_at');
            });
        }

        // Failed jobs table
        if (!Schema::hasTable('failed_jobs')) {
            Schema::create('failed_jobs', function (Blueprint $table) {
                $table->id();
                $table->string('uuid')->unique();
                $table->text('connection');
                $table->text('queue');
                $table->longText('payload');
                $table->longText('exception');
                $table->timestamp('failed_at')->useCurrent();
            });
        }

        // Job batches table
        if (!Schema::hasTable('job_batches')) {
            Schema::create('job_batches', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->string('name');
                $table->integer('total_jobs');
                $table->integer('pending_jobs');
                $table->integer('failed_jobs');
                $table->longText('failed_job_ids');
                $table->mediumText('options')->nullable();
                $table->integer('cancelled_at')->nullable();
                $table->integer('created_at');
                $table->integer('finished_at')->nullable();
            });
        }

        // Email preferences table - allows alumni to control notification settings
        if (!Schema::hasTable('email_preferences')) {
            Schema::create('email_preferences', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                
                // Notification type preferences
                $table->boolean('announcements_enabled')->default(true);
                $table->boolean('job_postings_enabled')->default(true);
                $table->boolean('surveys_enabled')->default(true);
                $table->boolean('messages_enabled')->default(true);
                $table->boolean('system_updates_enabled')->default(true);
                
                // Frequency settings
                $table->enum('frequency', ['instant', 'daily', 'weekly', 'never'])->default('instant');
                
                // Last digest sent
                $table->timestamp('last_digest_sent_at')->nullable();
                
                // Unsubscribe token for one-click unsubscribe
                $table->string('unsubscribe_token', 64)->unique()->nullable();
                
                $table->timestamps();
                
                $table->index(['user_id', 'frequency']);
            });
        }

        // Email logs table - track all sent emails
        if (!Schema::hasTable('email_logs')) {
            Schema::create('email_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->string('email_address');
                $table->string('email_type', 50)->index(); // announcement, job_posting, survey, etc.
                $table->unsignedBigInteger('reference_id')->nullable(); // ID of the announcement, job, etc.
                $table->string('reference_type', 100)->nullable(); // Model class name
                $table->string('subject');
                $table->enum('status', ['queued', 'sent', 'failed', 'bounced', 'opened', 'clicked'])->default('queued');
                $table->text('error_message')->nullable();
                $table->timestamp('sent_at')->nullable();
                $table->timestamp('opened_at')->nullable();
                $table->timestamp('clicked_at')->nullable();
                $table->timestamps();
                
                $table->index(['email_type', 'reference_id']);
                $table->index(['user_id', 'status']);
                $table->index('created_at');
            });
        }

        // Email queue batches - for tracking bulk email operations
        if (!Schema::hasTable('email_batches')) {
            Schema::create('email_batches', function (Blueprint $table) {
                $table->id();
                $table->string('batch_id', 36)->unique(); // UUID
                $table->string('email_type', 50);
                $table->unsignedBigInteger('reference_id')->nullable();
                $table->string('reference_type', 100)->nullable();
                $table->integer('total_recipients')->default(0);
                $table->integer('sent_count')->default(0);
                $table->integer('failed_count')->default(0);
                $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled'])->default('pending');
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('started_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->timestamps();
                
                $table->index(['status', 'created_at']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_batches');
        Schema::dropIfExists('email_logs');
        Schema::dropIfExists('email_preferences');
        Schema::dropIfExists('job_batches');
        Schema::dropIfExists('failed_jobs');
        Schema::dropIfExists('jobs');
    }
};
