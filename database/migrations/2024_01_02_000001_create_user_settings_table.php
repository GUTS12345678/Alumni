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
        if (!Schema::hasTable('user_settings')) {
        Schema::create('user_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // Notification Settings
            $table->boolean('email_notifications')->default(true);
            $table->boolean('survey_reminders')->default(true);
            $table->boolean('network_updates')->default(true);
            
            // Privacy Settings
            $table->boolean('profile_visibility')->default(true);
            $table->boolean('show_employment_status')->default(true);
            $table->boolean('allow_connection_requests')->default(true);
            
            $table->timestamps();
            
            // Ensure one settings record per user
            $table->unique('user_id');
        });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_settings');
    }
};
