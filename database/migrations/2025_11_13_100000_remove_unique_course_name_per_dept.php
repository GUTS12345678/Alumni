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
        try {
            Schema::table('courses', function (Blueprint $table) {
                $table->dropUnique('unique_course_per_dept');
            });
        } catch (\Exception $e) {
            // Unique constraint may not exist
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            // Restore the unique constraint if rolled back
            $table->unique(['department_id', 'name'], 'unique_course_per_dept');
        });
    }
};
