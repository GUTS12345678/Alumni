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
        // Skip if table doesn't exist yet (will be created by later migration)
        if (!Schema::hasTable('job_postings')) {
            return;
        }

        Schema::table('job_postings', function (Blueprint $table) {
            // Add columns if they don't exist
            if (!Schema::hasColumn('job_postings', 'employment_type')) {
                $table->enum('employment_type', ['full_time', 'part_time', 'contract', 'internship', 'freelance'])
                      ->default('full_time')
                      ->nullable();
            }
            
            if (!Schema::hasColumn('job_postings', 'work_arrangement')) {
                $table->enum('work_arrangement', ['onsite', 'remote', 'hybrid'])
                      ->default('onsite')
                      ->nullable();
            }
            
            if (!Schema::hasColumn('job_postings', 'salary_min') && !Schema::hasColumn('job_postings', 'salary_range')) {
                $table->decimal('salary_min', 12, 2)->nullable();
            } elseif (!Schema::hasColumn('job_postings', 'salary_min')) {
                $table->decimal('salary_min', 12, 2)->nullable();
            }
            
            if (!Schema::hasColumn('job_postings', 'salary_max')) {
                $table->decimal('salary_max', 12, 2)->nullable();
            }
            
            if (!Schema::hasColumn('job_postings', 'salary_currency')) {
                $table->string('salary_currency', 3)->default('PHP')->nullable();
            }
            
            if (!Schema::hasColumn('job_postings', 'salary_period')) {
                $table->enum('salary_period', ['hourly', 'monthly', 'yearly'])
                      ->default('monthly')
                      ->nullable();
            }
            
            if (!Schema::hasColumn('job_postings', 'is_salary_visible')) {
                $table->boolean('is_salary_visible')->default(true);
            }
            
            if (!Schema::hasColumn('job_postings', 'company_website')) {
                $table->string('company_website', 500)->nullable();
            }
            
            if (!Schema::hasColumn('job_postings', 'external_url')) {
                $table->string('external_url', 500)->nullable();
            }
            
            if (!Schema::hasColumn('job_postings', 'expires_at')) {
                $table->date('expires_at')->nullable();
            }
            
            if (!Schema::hasColumn('job_postings', 'views_count')) {
                $table->unsignedInteger('views_count')->default(0);
            }
        });

        // Safely copy data if columns exist
        try {
            if (Schema::hasColumn('job_postings', 'job_type') && Schema::hasColumn('job_postings', 'employment_type')) {
                DB::statement("UPDATE job_postings SET employment_type = job_type WHERE job_type IN ('full_time', 'part_time', 'contract', 'internship')");
            }
            if (Schema::hasColumn('job_postings', 'is_remote') && Schema::hasColumn('job_postings', 'work_arrangement')) {
                DB::statement("UPDATE job_postings SET work_arrangement = 'remote' WHERE is_remote = 1");
            }
            if (Schema::hasColumn('job_postings', 'application_deadline') && Schema::hasColumn('job_postings', 'expires_at')) {
                DB::statement("UPDATE job_postings SET expires_at = application_deadline WHERE application_deadline IS NOT NULL");
            }
            if (Schema::hasColumn('job_postings', 'views') && Schema::hasColumn('job_postings', 'views_count')) {
                DB::statement("UPDATE job_postings SET views_count = views WHERE views > 0");
            }
        } catch (\Exception $e) {
            // Data migration steps may fail on empty/fresh installs - that's OK
        }
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
