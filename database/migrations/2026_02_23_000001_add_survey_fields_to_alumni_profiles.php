<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add survey-specific fields to alumni_profiles that match the registration/survey form.
     */
    public function up(): void
    {
        Schema::table('alumni_profiles', function (Blueprint $table) {
            // Personal information fields from survey
            if (!Schema::hasColumn('alumni_profiles', 'maiden_name')) {
                $table->string('maiden_name')->nullable()->after('last_name');
            }
            if (!Schema::hasColumn('alumni_profiles', 'age')) {
                $table->integer('age')->nullable()->after('birth_date');
            }
            if (!Schema::hasColumn('alumni_profiles', 'place_of_birth')) {
                $table->string('place_of_birth')->nullable()->after('gender');
            }
            if (!Schema::hasColumn('alumni_profiles', 'civil_status')) {
                $table->string('civil_status')->nullable()->after('place_of_birth');
            }
            if (!Schema::hasColumn('alumni_profiles', 'spouse_name')) {
                $table->string('spouse_name')->nullable()->after('civil_status');
            }
            if (!Schema::hasColumn('alumni_profiles', 'number_of_children')) {
                $table->integer('number_of_children')->nullable()->after('spouse_name');
            }
            if (!Schema::hasColumn('alumni_profiles', 'mobile_no')) {
                $table->string('mobile_no', 20)->nullable()->after('phone');
            }

            // School information
            if (!Schema::hasColumn('alumni_profiles', 'enrollment_year')) {
                $table->integer('enrollment_year')->nullable()->after('graduation_year');
            }
            if (!Schema::hasColumn('alumni_profiles', 'honors_awards')) {
                $table->text('honors_awards')->nullable()->after('enrollment_year');
            }

            // Employment details from survey
            if (!Schema::hasColumn('alumni_profiles', 'presently_employed')) {
                $table->string('presently_employed', 10)->nullable()->after('employment_status');
            }
            if (!Schema::hasColumn('alumni_profiles', 'company_address')) {
                $table->string('company_address', 500)->nullable()->after('current_employer');
            }
            if (!Schema::hasColumn('alumni_profiles', 'date_hired')) {
                $table->date('date_hired')->nullable()->after('job_start_date');
            }
            if (!Schema::hasColumn('alumni_profiles', 'years_of_service')) {
                $table->decimal('years_of_service', 5, 1)->nullable()->after('date_hired');
            }
            if (!Schema::hasColumn('alumni_profiles', 'job_aligned_to_course')) {
                $table->string('job_aligned_to_course', 10)->nullable()->after('job_related_to_degree');
            }
            if (!Schema::hasColumn('alumni_profiles', 'average_monthly_income')) {
                $table->string('average_monthly_income')->nullable()->after('current_salary');
            }
            if (!Schema::hasColumn('alumni_profiles', 'job_level_position')) {
                $table->string('job_level_position')->nullable()->after('employment_status');
            }
            if (!Schema::hasColumn('alumni_profiles', 'major_line_of_business')) {
                $table->string('major_line_of_business')->nullable()->after('company_industry');
            }

            // Achievements & About
            if (!Schema::hasColumn('alumni_profiles', 'achievements')) {
                $table->text('achievements')->nullable()->after('certifications');
            }
            if (!Schema::hasColumn('alumni_profiles', 'about_me')) {
                $table->text('about_me')->nullable()->after('achievements');
            }
        });
    }

    public function down(): void
    {
        Schema::table('alumni_profiles', function (Blueprint $table) {
            $cols = [
                'maiden_name', 'age', 'place_of_birth', 'civil_status', 'spouse_name',
                'number_of_children', 'mobile_no', 'enrollment_year', 'honors_awards',
                'presently_employed', 'company_address', 'date_hired', 'years_of_service',
                'job_aligned_to_course', 'average_monthly_income', 'job_level_position',
                'major_line_of_business', 'achievements', 'about_me',
            ];
            foreach ($cols as $col) {
                if (Schema::hasColumn('alumni_profiles', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
