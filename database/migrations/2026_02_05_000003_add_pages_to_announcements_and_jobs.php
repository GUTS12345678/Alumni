<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration adds multi-page support for announcements and job postings.
     * The 'pages' column stores a JSON array of page objects, each containing:
     * - title: Optional page title
     * - content: HTML content for the page
     * - image: Optional image URL for the page
     * - layout: 'text-only' | 'image-left' | 'image-right' | 'image-top' | 'image-full'
     */
    public function up(): void
    {
        // Add pages column to announcements
        Schema::table('announcements', function (Blueprint $table) {
            if (!Schema::hasColumn('announcements', 'pages')) {
                $table->json('pages')->nullable()->after('content');
            }
            if (!Schema::hasColumn('announcements', 'use_pages')) {
                $table->boolean('use_pages')->default(false)->after('pages');
            }
        });

        // Add pages column to job_postings
        Schema::table('job_postings', function (Blueprint $table) {
            if (!Schema::hasColumn('job_postings', 'pages')) {
                $table->json('pages')->nullable()->after('description');
            }
            if (!Schema::hasColumn('job_postings', 'use_pages')) {
                $table->boolean('use_pages')->default(false)->after('pages');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            if (Schema::hasColumn('announcements', 'pages')) {
                $table->dropColumn('pages');
            }
            if (Schema::hasColumn('announcements', 'use_pages')) {
                $table->dropColumn('use_pages');
            }
        });

        Schema::table('job_postings', function (Blueprint $table) {
            if (Schema::hasColumn('job_postings', 'pages')) {
                $table->dropColumn('pages');
            }
            if (Schema::hasColumn('job_postings', 'use_pages')) {
                $table->dropColumn('use_pages');
            }
        });
    }
};
