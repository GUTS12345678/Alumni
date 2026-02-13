<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add missing indexes for frequently-queried columns.
     */
    public function up(): void
    {
        // career_history.industry — used in dashboard/login for distinct industry count
        Schema::table('career_history', function (Blueprint $table) {
            $table->index('industry', 'idx_career_history_industry');
        });

        // announcements.is_published — filtered on every announcement listing
        Schema::table('announcements', function (Blueprint $table) {
            $table->index('is_published', 'idx_announcements_is_published');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('career_history', function (Blueprint $table) {
            $table->dropIndex('idx_career_history_industry');
        });

        Schema::table('announcements', function (Blueprint $table) {
            $table->dropIndex('idx_announcements_is_published');
        });
    }
};
