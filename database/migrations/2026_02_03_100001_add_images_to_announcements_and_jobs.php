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
        // Add image fields to announcements
        Schema::table('announcements', function (Blueprint $table) {
            if (!Schema::hasColumn('announcements', 'featured_image')) {
                $table->string('featured_image')->nullable()->after('content');
            }
            if (!Schema::hasColumn('announcements', 'gallery_images')) {
                $table->json('gallery_images')->nullable()->after('featured_image');
            }
            if (!Schema::hasColumn('announcements', 'show_on_landing')) {
                $table->boolean('show_on_landing')->default(false)->after('status');
            }
        });

        // Add image fields to job_postings
        Schema::table('job_postings', function (Blueprint $table) {
            if (!Schema::hasColumn('job_postings', 'poster_image')) {
                $table->string('poster_image')->nullable()->after('company_logo');
            }
            if (!Schema::hasColumn('job_postings', 'show_on_landing')) {
                $table->boolean('show_on_landing')->default(false)->after('status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropColumn(['featured_image', 'gallery_images', 'show_on_landing']);
        });

        Schema::table('job_postings', function (Blueprint $table) {
            $table->dropColumn(['poster_image', 'show_on_landing']);
        });
    }
};
