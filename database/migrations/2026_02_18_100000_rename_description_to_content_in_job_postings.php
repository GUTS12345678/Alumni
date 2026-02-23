<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Rename 'description' to 'content' in job_postings table
     * to match the field name used in announcements table.
     */
    public function up(): void
    {
        Schema::table('job_postings', function (Blueprint $table) {
            $table->renameColumn('description', 'content');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_postings', function (Blueprint $table) {
            $table->renameColumn('content', 'description');
        });
    }
};
