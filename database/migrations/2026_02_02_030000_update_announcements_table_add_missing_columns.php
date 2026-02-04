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
            // Add is_published boolean (replaces status enum for simpler logic)
            $table->boolean('is_published')->default(false)->after('priority');
            
            // Add target_type to replace 'type' for clarity with target_batch_years/target_department_ids
            $table->enum('target_type', ['all', 'batch', 'department'])->default('all')->after('content');
            
            // Add target_batch_years and target_department_ids as JSON
            $table->json('target_batch_years')->nullable()->after('target_type');
            $table->json('target_department_ids')->nullable()->after('target_batch_years');
        });
        
        // Update existing records: if status was 'published', set is_published = true
        \DB::table('announcements')
            ->where('status', 'published')
            ->update(['is_published' => true]);
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
