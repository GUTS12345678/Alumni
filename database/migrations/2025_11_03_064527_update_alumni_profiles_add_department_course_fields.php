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
            // Add new foreign key columns
            if (!Schema::hasColumn('alumni_profiles', 'department_id')) {
                $table->foreignId('department_id')->nullable()->after('user_id')->constrained('departments')->onDelete('set null');
            }
            if (!Schema::hasColumn('alumni_profiles', 'course_id')) {
                $table->foreignId('course_id')->nullable()->after('department_id')->constrained('courses')->onDelete('set null');
            }
            if (!Schema::hasColumn('alumni_profiles', 'profile_complete')) {
                $table->boolean('profile_complete')->default(false);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('alumni_profiles', function (Blueprint $table) {
            $table->dropForeign(['course_id']);
            $table->dropForeign(['department_id']);
            $table->dropColumn(['department_id', 'course_id', 'profile_complete']);
        });
    }
};
