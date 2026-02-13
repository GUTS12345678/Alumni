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
            // Add job mismatch reason field
            if (!Schema::hasColumn('alumni_profiles', 'job_mismatch_reason')) {
                $table->enum('job_mismatch_reason', [
                    'overqualified',
                    'underqualified',
                    'unfit',
                    'career_change',
                    'location',
                    'salary',
                    'other',
                    'none'
                ])->nullable();
            }

            // Add job satisfaction rating (1-5 scale)
            if (!Schema::hasColumn('alumni_profiles', 'job_satisfaction')) {
                $table->tinyInteger('job_satisfaction')->nullable();
            }

            // Add reason for unemployment (for unemployed alumni)
            if (!Schema::hasColumn('alumni_profiles', 'unemployment_reason')) {
                $table->enum('unemployment_reason', [
                    'lack_of_opportunities',
                    'overqualified',
                    'underqualified',
                    'location_constraints',
                    'health_reasons',
                    'family_obligations',
                    'continuing_education',
                    'other'
                ])->nullable();
            }
        });

        // Index for analytics queries (silently skip if already exists)
        try {
            Schema::table('alumni_profiles', function (Blueprint $table) {
                $table->index('job_mismatch_reason');
            });
        } catch (\Exception $e) {
            // Index may already exist
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('alumni_profiles', function (Blueprint $table) {
            $table->dropIndex(['job_mismatch_reason']);
            $table->dropColumn(['job_mismatch_reason', 'job_satisfaction', 'unemployment_reason']);
        });
    }
};
