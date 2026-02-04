<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Disable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        
        // Drop related tables first
        Schema::dropIfExists('saved_jobs');
        Schema::dropIfExists('job_applications');
        
        // Check if old job_postings table exists and drop it
        if (Schema::hasTable('job_postings')) {
            Schema::dropIfExists('job_postings');
        }
        
        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1');
        
        // Create fresh job_postings table
        Schema::create('job_postings', function (Blueprint $table) {
            $table->id();
            
            // Basic Info
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('company_name');
            $table->string('company_logo')->nullable();
            $table->text('description');
            
            // Category & Type
            $table->foreignId('category_id')->nullable()->constrained('job_categories')->onDelete('set null');
            $table->enum('job_type', ['full_time', 'part_time', 'contract', 'internship', 'temporary']);
            $table->enum('experience_level', ['entry', 'mid', 'senior', 'executive', 'any'])->default('any');
            
            // Location
            $table->string('location');
            $table->boolean('is_remote')->default(false);
            
            // Contact Information
            $table->string('contact_person')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone', 50)->nullable();
            
            // External Application
            $table->string('application_url', 500)->nullable();
            $table->text('application_instructions')->nullable();
            
            // Additional Info
            $table->string('salary_range', 100)->nullable();
            $table->text('benefits')->nullable();
            $table->text('requirements')->nullable();
            $table->text('qualifications')->nullable();
            
            // Dates
            $table->date('application_deadline')->nullable();
            $table->date('start_date')->nullable();
            
            // Status & Tracking
            $table->enum('status', ['draft', 'published', 'closed', 'expired'])->default('draft');
            $table->boolean('is_featured')->default(false);
            $table->date('featured_until')->nullable();
            $table->unsignedInteger('views')->default(0);
            
            // Admin tracking
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamp('published_at')->nullable();
            
            // Timestamps
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('status');
            $table->index('job_type');
            $table->index('experience_level');
            $table->index('is_featured');
            $table->index('is_remote');
            $table->index('application_deadline');
            $table->index('published_at');
            $table->index(['status', 'published_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_postings');
    }
};
