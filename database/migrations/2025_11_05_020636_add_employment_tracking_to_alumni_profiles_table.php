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
            // Salary Range (for privacy, using Philippine Peso ranges)
            if (!Schema::hasColumn('alumni_profiles', 'salary_range')) {
                $table->enum('salary_range', [
                    'below_15k',
                    '15k_25k',
                    '25k_35k',
                    '35k_50k',
                    '50k_75k',
                    '75k_100k',
                    'above_100k',
                    'prefer_not_say'
                ])->nullable();
            }

            // Career Field Categorization
            if (!Schema::hasColumn('alumni_profiles', 'career_field')) {
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
                ])->nullable();
            }

            // Engagement Tracking
            if (!Schema::hasColumn('alumni_profiles', 'survey_participation_count')) {
                $table->integer('survey_participation_count')->default(0);
            }
            if (!Schema::hasColumn('alumni_profiles', 'last_profile_update')) {
                $table->timestamp('last_profile_update')->nullable();
            }
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
