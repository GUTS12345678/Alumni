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
        // Add missing columns to job_postings if they don't exist
        Schema::table('job_postings', function (Blueprint $table) {
            if (!Schema::hasColumn('job_postings', 'posted_by')) {
                $table->foreignId('posted_by')->nullable()->after('id')->constrained('users')->onDelete('cascade');
            }
            if (!Schema::hasColumn('job_postings', 'application_deadline')) {
                $table->date('application_deadline')->nullable()->after('application_email');
            }
            if (!Schema::hasColumn('job_postings', 'contact_person')) {
                $table->string('contact_person')->nullable()->after('skills_required');
            }
            if (!Schema::hasColumn('job_postings', 'contact_phone')) {
                $table->string('contact_phone')->nullable()->after('contact_person');
            }
            if (!Schema::hasColumn('job_postings', 'is_featured')) {
                $table->boolean('is_featured')->default(false)->after('contact_phone');
            }
            if (!Schema::hasColumn('job_postings', 'remote_work_allowed')) {
                $table->boolean('remote_work_allowed')->default(false)->after('is_featured');
            }
            if (!Schema::hasColumn('job_postings', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        // Create job_applications table if it doesn't exist
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

        // Create saved_jobs table if it doesn't exist
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
        Schema::table('job_postings', function (Blueprint $table) {
            $table->dropColumn([
                'posted_by',
                'application_deadline',
                'contact_person',
                'contact_phone',
                'is_featured',
                'remote_work_allowed',
                'deleted_at'
            ]);
        });

        Schema::dropIfExists('saved_jobs');
        Schema::dropIfExists('job_applications');
    }
};
