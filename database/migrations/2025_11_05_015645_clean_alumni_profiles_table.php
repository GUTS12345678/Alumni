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
        // Delete all alumni profiles without department or course assignments
        // This is a clean slate approach - all old test data will be removed
        DB::table('alumni_profiles')->whereNull('department_id')->orWhereNull('course_id')->delete();
        
        // Optionally, you can also truncate the entire table to start fresh
        // DB::table('alumni_profiles')->truncate();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Cannot restore deleted records
        // This is an irreversible migration
    }
};
