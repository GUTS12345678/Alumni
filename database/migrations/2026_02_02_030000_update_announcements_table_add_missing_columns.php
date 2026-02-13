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
        Schema::table('announcements', function (Blueprint $table) {
            if (!Schema::hasColumn('announcements', 'is_published')) {
                $table->boolean('is_published')->default(false);
            }
            if (!Schema::hasColumn('announcements', 'target_type')) {
                $table->enum('target_type', ['all', 'batch', 'department'])->default('all');
            }
            if (!Schema::hasColumn('announcements', 'target_batch_years')) {
                $table->json('target_batch_years')->nullable();
            }
            if (!Schema::hasColumn('announcements', 'target_department_ids')) {
                $table->json('target_department_ids')->nullable();
            }
        });
        
        // Update existing records: if status was 'published', set is_published = true
        if (Schema::hasColumn('announcements', 'status') && Schema::hasColumn('announcements', 'is_published')) {
            \DB::table('announcements')
                ->where('status', 'published')
                ->update(['is_published' => true]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropColumn(['is_published', 'target_type', 'target_batch_years', 'target_department_ids']);
        });
    }
};
