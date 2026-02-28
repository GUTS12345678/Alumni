<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add missing standalone indexes to frequently queried columns.
     * Foreign key indexes and composites already exist where noted.
     */
    public function up(): void
    {
        // Users table — role and status are filtered on almost every query
        // Currently only has: email (unique), role_id (FK), campus_id
        Schema::table('users', function (Blueprint $table) {
            $table->index('role', 'idx_users_role');
            $table->index('status', 'idx_users_status');
            $table->index(['role', 'status'], 'idx_users_role_status');
        });

        // Alumni profiles — standalone indexes for columns only in composites
        // Already has: user_id (FK), department_id (FK), course_id (FK), campus_id,
        //   [graduation_year, employment_status] composite, [batch_id, employment_status] composite
        Schema::table('alumni_profiles', function (Blueprint $table) {
            // Standalone indexes — the composites can't be used for single-column filters
            $table->index('employment_status', 'idx_alumni_profiles_emp_status');
            $table->index('graduation_year', 'idx_alumni_profiles_grad_year');
            $table->index('job_start_date', 'idx_alumni_profiles_job_start');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_role');
            $table->dropIndex('idx_users_status');
            $table->dropIndex('idx_users_role_status');
        });

        Schema::table('alumni_profiles', function (Blueprint $table) {
            $table->dropIndex('idx_alumni_profiles_emp_status');
            $table->dropIndex('idx_alumni_profiles_grad_year');
            $table->dropIndex('idx_alumni_profiles_job_start');
        });
    }
};
