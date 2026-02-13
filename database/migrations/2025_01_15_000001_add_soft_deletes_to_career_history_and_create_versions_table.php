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
        // Add soft deletes to career_history table
        Schema::table('career_history', function (Blueprint $table) {
            if (!Schema::hasColumn('career_history', 'deleted_at')) {
                $table->softDeletes();
            }
            if (!Schema::hasColumn('career_history', 'archived_reason')) {
                $table->string('archived_reason')->nullable();
            }
        });

        // Create career_history_versions table
        if (!Schema::hasTable('career_history_versions')) {
        Schema::create('career_history_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('career_history_id')->constrained('career_history')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('modified_by')->nullable()->constrained('users')->onDelete('set null');
            
            // Version info
            $table->integer('version_number')->default(1);
            $table->enum('action_type', ['created', 'updated', 'archived', 'restored'])->default('created');
            
            // Snapshot of data at this version
            $table->string('job_title');
            $table->string('company_name');
            $table->string('company_location')->nullable();
            $table->string('employment_type')->nullable();
            $table->text('job_description')->nullable();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->boolean('is_current')->default(false);
            $table->string('industry')->nullable();
            $table->json('skills_used')->nullable();
            $table->json('achievements')->nullable();
            $table->decimal('salary', 10, 2)->nullable();
            $table->string('salary_currency', 3)->default('PHP');
            
            // Changes tracking
            $table->json('changes')->nullable(); // Stores what changed from previous version
            $table->text('change_notes')->nullable(); // Optional notes from user
            
            $table->timestamps();
            
            // Indexes
            $table->index(['career_history_id', 'version_number']);
            $table->index(['user_id', 'created_at']);
            $table->index('action_type');
        });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('career_history_versions');
        
        Schema::table('career_history', function (Blueprint $table) {
            $table->dropColumn(['deleted_at', 'archived_reason']);
        });
    }
};
