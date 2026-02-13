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
        if (!Schema::hasTable('certificates')) {
        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type'); // survey_completion, membership, participation, achievement
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('issued_date');
            $table->nullableMorphs('reference'); // For linking to surveys, events, etc.
            $table->string('certificate_number')->unique();
            $table->string('status')->default('available'); // available, pending, expired
            $table->json('metadata')->nullable(); // Additional data like survey title, event name, etc.
            $table->timestamps();
            
            $table->index(['user_id', 'type']);
            $table->index(['user_id', 'status']);
        });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('certificates');
    }
};
