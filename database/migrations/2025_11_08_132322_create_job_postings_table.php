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
            $table->string('company_logo')->nullable();
            $table->text('description');
            $table->text('requirements')->nullable();
            $table->string('location');
            $table->enum('job_type', ['full_time', 'part_time', 'contract', 'remote', 'internship'])->default('full_time');
            $table->enum('experience_level', ['entry', 'mid', 'senior', 'executive'])->default('mid');
            $table->string('salary_min')->nullable();
            $table->string('salary_max')->nullable();
            $table->string('salary_currency', 10)->default('USD');
            $table->string('application_url')->nullable();
            $table->string('application_email')->nullable();
            $table->date('application_deadline')->nullable();
            $table->enum('status', ['active', 'closed', 'draft'])->default('active');
            $table->integer('views')->default(0);
            $table->timestamps();

            $table->index('posted_by');
            $table->index('status');
            $table->index('job_type');
            $table->index('experience_level');
        });
        }

        // Saved jobs table
        if (!Schema::hasTable('saved_jobs')) {
        Schema::create('saved_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('job_posting_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->unique(['user_id', 'job_posting_id']);
        });
        }

        // Job applications tracking
        if (!Schema::hasTable('job_applications')) {
        Schema::create('job_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('job_posting_id')->constrained()->onDelete('cascade');
            $table->enum('status', ['applied', 'reviewing', 'interviewed', 'offered', 'rejected', 'accepted', 'declined'])->default('applied');
            $table->text('cover_letter')->nullable();
            $table->string('resume_path')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'job_posting_id']);
            $table->index('status');
        });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_postings');
    }
};
