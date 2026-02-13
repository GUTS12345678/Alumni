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
        // Mentor profiles
        if (!Schema::hasTable('mentor_profiles')) {
        Schema::create('mentor_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('expertise_area');
            $table->text('bio');
            $table->json('specializations')->nullable(); // Array of specialization topics
            $table->integer('years_of_experience');
            $table->integer('max_mentees')->default(5);
            $table->boolean('is_available')->default(true);
            $table->json('availability')->nullable(); // Days/times available
            $table->enum('status', ['active', 'inactive', 'pending'])->default('pending');
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('is_available');
        });
        }

        // Mentorship relationships
        if (!Schema::hasTable('mentorships')) {
        Schema::create('mentorships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mentor_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('mentee_id')->constrained('users')->onDelete('cascade');
            $table->enum('status', ['pending', 'active', 'completed', 'cancelled'])->default('pending');
            $table->text('mentee_message')->nullable();
            $table->text('mentor_response')->nullable();
            $table->json('goals')->nullable(); // Mentorship goals
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->integer('sessions_completed')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['mentor_id', 'status']);
            $table->index(['mentee_id', 'status']);
        });
        }

        // Mentorship sessions
        if (!Schema::hasTable('mentorship_sessions')) {
        Schema::create('mentorship_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mentorship_id')->constrained()->onDelete('cascade');
            $table->dateTime('scheduled_at');
            $table->integer('duration_minutes')->default(60);
            $table->enum('status', ['scheduled', 'completed', 'cancelled'])->default('scheduled');
            $table->text('agenda')->nullable();
            $table->text('notes')->nullable();
            $table->text('action_items')->nullable();
            $table->timestamps();

            $table->index(['mentorship_id', 'scheduled_at']);
        });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mentorship_sessions');
        Schema::dropIfExists('mentorships');
        Schema::dropIfExists('mentor_profiles');
    }
};
