<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('job_postings')) {
        Schema::create('job_postings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('posted_by')->nullable()->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->string('company_name');
            $table->text('description');
            $table->text('requirements')->nullable();
            $table->string('location');
            $table->enum('job_type', ['full_time', 'part_time', 'contract', 'remote', 'internship'])->default('full_time');
            $table->enum('experience_level', ['entry', 'mid', 'senior', 'executive'])->default('entry');
            $table->string('salary_min')->nullable();
            $table->string('salary_max')->nullable();
            $table->string('salary_currency', 10)->default('USD');
            $table->string('application_url')->nullable();
            $table->string('application_email')->nullable();
            $table->date('application_deadline')->nullable();
            $table->enum('status', ['active', 'closed', 'filled'])->default('active');
            $table->integer('views')->default(0);
            $table->json('skills_required')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('contact_phone')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('remote_work_allowed')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('job_type');
            $table->index('experience_level');
            $table->index('posted_by');
            $table->index('created_at');
        });
        }

        // Job Applications Table
        if (!Schema::hasTable('job_applications')) {
        Schema::create('job_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_posting_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('cover_letter')->nullable();
            $table->string('resume_path')->nullable();
            $table->enum('status', ['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamp('applied_at')->useCurrent();
            $table->timestamps();

            $table->unique(['job_posting_id', 'user_id']);
            $table->index('user_id');
            $table->index('status');
        });
        }

        // Saved Jobs Table
        if (!Schema::hasTable('saved_jobs')) {
        Schema::create('saved_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_posting_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->unique(['job_posting_id', 'user_id']);
            $table->index('user_id');
        });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('saved_jobs');
        Schema::dropIfExists('job_applications');
        Schema::dropIfExists('job_postings');
    }
};
