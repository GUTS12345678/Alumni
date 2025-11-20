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
        Schema::table('alumni_profiles', function (Blueprint $table) {
            // Add missing fields for enhanced statistics
            
            // Salary Range (for privacy, using Philippine Peso ranges)
            $table->enum('salary_range', [
                'below_15k',      // Below ₱15,000
                '15k_25k',        // ₱15,000 - ₱25,000
                '25k_35k',        // ₱25,000 - ₱35,000
                '35k_50k',        // ₱35,000 - ₱50,000
                '50k_75k',        // ₱50,000 - ₱75,000
                '75k_100k',       // ₱75,000 - ₱100,000
                'above_100k',     // Above ₱100,000
                'prefer_not_say'
            ])->nullable()->after('current_salary');
            
            // Career Field Categorization
            $table->enum('career_field', [
                'information_technology',
                'education',
                'business_management',
                'healthcare',
                'engineering',
                'government',
                'finance',
                'marketing',
                'hospitality',
                'manufacturing',
                'agriculture',
                'other'
            ])->nullable()->after('company_industry');
            
            // Engagement Tracking
            $table->integer('survey_participation_count')->default(0)->after('profile_completed_at');
            $table->timestamp('last_profile_update')->nullable()->after('survey_participation_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('alumni_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'salary_range',
                'career_field',
                'survey_participation_count',
                'last_profile_update'
            ]);
        });
    }
};
