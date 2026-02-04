<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add campus_id to all related tables with default value of 1 (Main Campus)
     */
    public function up(): void
    {
        // Add campus_id to users table
        if (!Schema::hasColumn('users', 'campus_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->unsignedBigInteger('campus_id')->default(1)->after('id');
                $table->index('campus_id');
            });

            // Add foreign key after column exists
            Schema::table('users', function (Blueprint $table) {
                $table->foreign('campus_id')
                    ->references('id')
                    ->on('campuses')
                    ->onDelete('restrict');
            });
        }

        // Add campus_id to alumni_profiles table
        if (!Schema::hasColumn('alumni_profiles', 'campus_id')) {
            Schema::table('alumni_profiles', function (Blueprint $table) {
                $table->unsignedBigInteger('campus_id')->default(1)->after('user_id');
                $table->index('campus_id');
            });

            Schema::table('alumni_profiles', function (Blueprint $table) {
                $table->foreign('campus_id')
                    ->references('id')
                    ->on('campuses')
                    ->onDelete('restrict');
            });
        }

        // Add campus_id to batches table
        if (!Schema::hasColumn('batches', 'campus_id')) {
            Schema::table('batches', function (Blueprint $table) {
                $table->unsignedBigInteger('campus_id')->default(1)->after('id');
                $table->index('campus_id');
            });

            Schema::table('batches', function (Blueprint $table) {
                $table->foreign('campus_id')
                    ->references('id')
                    ->on('campuses')
                    ->onDelete('restrict');
            });
        }

        // Add campus_id to courses table
        if (!Schema::hasColumn('courses', 'campus_id')) {
            Schema::table('courses', function (Blueprint $table) {
                $table->unsignedBigInteger('campus_id')->default(1)->after('id');
                $table->index('campus_id');
            });

            Schema::table('courses', function (Blueprint $table) {
                $table->foreign('campus_id')
                    ->references('id')
                    ->on('campuses')
                    ->onDelete('restrict');
            });
        }

        // Add campus_id to departments table
        if (!Schema::hasColumn('departments', 'campus_id')) {
            Schema::table('departments', function (Blueprint $table) {
                $table->unsignedBigInteger('campus_id')->default(1)->after('id');
                $table->index('campus_id');
            });

            Schema::table('departments', function (Blueprint $table) {
                $table->foreign('campus_id')
                    ->references('id')
                    ->on('campuses')
                    ->onDelete('restrict');
            });
        }

        // Add campus_id to surveys table (nullable for multi-campus surveys)
        if (!Schema::hasColumn('surveys', 'campus_id')) {
            Schema::table('surveys', function (Blueprint $table) {
                $table->unsignedBigInteger('campus_id')->nullable()->after('id');
                $table->boolean('is_multi_campus')->default(false)->after('campus_id');
                $table->index('campus_id');
            });

            Schema::table('surveys', function (Blueprint $table) {
                $table->foreign('campus_id')
                    ->references('id')
                    ->on('campuses')
                    ->onDelete('set null');
            });
        }

        // Add campus_id to survey_responses table
        if (Schema::hasTable('survey_responses') && !Schema::hasColumn('survey_responses', 'campus_id')) {
            Schema::table('survey_responses', function (Blueprint $table) {
                $table->unsignedBigInteger('campus_id')->default(1)->after('id');
                $table->index('campus_id');
            });

            Schema::table('survey_responses', function (Blueprint $table) {
                $table->foreign('campus_id')
                    ->references('id')
                    ->on('campuses')
                    ->onDelete('restrict');
            });
        }

        // Add campus_id to job_postings table (nullable for multi-campus jobs)
        if (Schema::hasTable('job_postings') && !Schema::hasColumn('job_postings', 'campus_id')) {
            Schema::table('job_postings', function (Blueprint $table) {
                $table->unsignedBigInteger('campus_id')->nullable()->after('id');
                $table->boolean('is_multi_campus')->default(true)->after('campus_id');
                $table->index('campus_id');
            });

            Schema::table('job_postings', function (Blueprint $table) {
                $table->foreign('campus_id')
                    ->references('id')
                    ->on('campuses')
                    ->onDelete('set null');
            });
        }

        // Add campus_id to announcements table (nullable for multi-campus announcements)
        if (Schema::hasTable('announcements') && !Schema::hasColumn('announcements', 'campus_id')) {
            Schema::table('announcements', function (Blueprint $table) {
                $table->unsignedBigInteger('campus_id')->nullable()->after('id');
                $table->boolean('is_multi_campus')->default(true)->after('campus_id');
                $table->index('campus_id');
            });

            Schema::table('announcements', function (Blueprint $table) {
                $table->foreign('campus_id')
                    ->references('id')
                    ->on('campuses')
                    ->onDelete('set null');
            });
        }

        // Add campus_id to employments table
        if (Schema::hasTable('employments') && !Schema::hasColumn('employments', 'campus_id')) {
            Schema::table('employments', function (Blueprint $table) {
                $table->unsignedBigInteger('campus_id')->default(1)->after('id');
                $table->index('campus_id');
            });

            Schema::table('employments', function (Blueprint $table) {
                $table->foreign('campus_id')
                    ->references('id')
                    ->on('campuses')
                    ->onDelete('restrict');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'users',
            'alumni_profiles',
            'batches',
            'courses',
            'departments',
            'surveys',
            'survey_responses',
            'job_postings',
            'announcements',
            'employments',
        ];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'campus_id')) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    $table->dropForeign([$tableName . '_campus_id_foreign']);
                    $table->dropIndex([$tableName . '_campus_id_index']);
                    $table->dropColumn('campus_id');
                });

                // Drop is_multi_campus if exists
                if (Schema::hasColumn($tableName, 'is_multi_campus')) {
                    Schema::table($tableName, function (Blueprint $table) {
                        $table->dropColumn('is_multi_campus');
                    });
                }
            }
        }
    }
};
