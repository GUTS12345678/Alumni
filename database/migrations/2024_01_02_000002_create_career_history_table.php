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
        Schema::create('career_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // Position details
            $table->string('job_title');
            $table->string('company_name');
            $table->string('company_location')->nullable();
            $table->string('employment_type')->nullable(); // full-time, part-time, contract, freelance
            $table->text('job_description')->nullable();
            
            // Duration
            $table->date('start_date');
            $table->date('end_date')->nullable(); // null means current position
            $table->boolean('is_current')->default(false);
            
            // Additional info
            $table->string('industry')->nullable();
            $table->json('skills_used')->nullable(); // Array of skills
            $table->json('achievements')->nullable(); // Array of achievements
            $table->decimal('salary', 10, 2)->nullable();
            $table->string('salary_currency', 3)->default('PHP');
            
            // Metadata
            $table->integer('order')->default(0); // For custom ordering
            $table->timestamps();
            
            // Indexes
            $table->index(['user_id', 'start_date']);
            $table->index(['user_id', 'is_current']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('career_history');
    }
};
