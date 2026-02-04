<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('job_postings', function (Blueprint $table) {
            // Add columns if they don't exist
            if (!Schema::hasColumn('job_postings', 'employment_type')) {
                $table->enum('employment_type', ['full_time', 'part_time', 'contract', 'internship', 'freelance'])
                      ->default('full_time')
                      ->after('job_type');
            }
            
            if (!Schema::hasColumn('job_postings', 'work_arrangement')) {
                $table->enum('work_arrangement', ['onsite', 'remote', 'hybrid'])
                      ->default('onsite')
                      ->after('is_remote');
            }
            
            if (!Schema::hasColumn('job_postings', 'salary_min')) {
                $table->decimal('salary_min', 12, 2)->nullable()->after('salary_range');
            }
            
            if (!Schema::hasColumn('job_postings', 'salary_max')) {
                $table->decimal('salary_max', 12, 2)->nullable()->after('salary_min');
            }
            
            if (!Schema::hasColumn('job_postings', 'salary_currency')) {
                $table->string('salary_currency', 3)->default('PHP')->after('salary_max');
            }
            
            if (!Schema::hasColumn('job_postings', 'salary_period')) {
                $table->enum('salary_period', ['hourly', 'monthly', 'yearly'])
                      ->default('monthly')
                      ->after('salary_currency');
            }
            
            if (!Schema::hasColumn('job_postings', 'is_salary_visible')) {
                $table->boolean('is_salary_visible')->default(true)->after('salary_period');
            }
            
            if (!Schema::hasColumn('job_postings', 'company_website')) {
                $table->string('company_website', 500)->nullable()->after('company_logo');
            }
            
            if (!Schema::hasColumn('job_postings', 'external_url')) {
                $table->string('external_url', 500)->nullable()->after('application_url');
            }
            
            if (!Schema::hasColumn('job_postings', 'expires_at')) {
                $table->date('expires_at')->nullable()->after('application_deadline');
            }
            
            if (!Schema::hasColumn('job_postings', 'views_count')) {
                $table->unsignedInteger('views_count')->default(0)->after('views');
            }
        });

        // Copy data from job_type to employment_type where applicable
        DB::statement("UPDATE job_postings SET employment_type = job_type WHERE job_type IN ('full_time', 'part_time', 'contract', 'internship')");
        
        // Set work_arrangement based on is_remote
        DB::statement("UPDATE job_postings SET work_arrangement = 'remote' WHERE is_remote = 1");
        
        // Copy application_deadline to expires_at if it exists
        DB::statement("UPDATE job_postings SET expires_at = application_deadline WHERE application_deadline IS NOT NULL");
        
        // Copy views to views_count
        DB::statement("UPDATE job_postings SET views_count = views WHERE views > 0");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_postings', function (Blueprint $table) {
            $columns = [
                'employment_type',
                'work_arrangement',
                'salary_min',
                'salary_max',
                'salary_currency',
                'salary_period',
                'is_salary_visible',
                'company_website',
                'external_url',
                'expires_at',
                'views_count',
            ];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('job_postings', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
