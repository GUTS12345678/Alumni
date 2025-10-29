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
            $table->enum('job_mismatch_reason', [
                'overqualified',        // Job requires less education than alumni has
                'underqualified',       // Job requires more education than alumni has
                'unfit',               // Job is not related to degree/field of study
                'career_change',       // Intentional career change
                'location',            // Geographic constraints
                'salary',              // Salary not matching expectations
                'other',               // Other reasons
                'none'                 // Job is a good match
            ])->nullable()->after('job_related_to_degree');
            
            // Add job satisfaction rating (1-5 scale)
            $table->tinyInteger('job_satisfaction')->nullable()->after('job_mismatch_reason');
            
            // Add reason for unemployment (for unemployed alumni)
            $table->enum('unemployment_reason', [
                'lack_of_opportunities',
                'overqualified',
                'underqualified',
                'location_constraints',
                'health_reasons',
                'family_obligations',
                'continuing_education',
                'other'
            ])->nullable()->after('job_satisfaction');
            
            // Index for analytics queries
            $table->index('job_mismatch_reason');
        });
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
