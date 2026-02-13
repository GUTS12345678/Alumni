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
        if (!Schema::hasColumn('surveys', 'campus_id')) {
            Schema::table('surveys', function (Blueprint $table) {
                $table->foreignId('campus_id')->nullable()->after('id')->constrained('campuses')->onDelete('cascade');
            });
        }
        if (!Schema::hasColumn('surveys', 'is_multi_campus')) {
            Schema::table('surveys', function (Blueprint $table) {
                $table->boolean('is_multi_campus')->default(false);
            });
        }

        // Add indexes (silently skip if they already exist)
        try {
            Schema::table('surveys', function (Blueprint $table) {
                $table->index('campus_id');
            });
        } catch (\Exception $e) {
            // Index may already exist
        }
        try {
            Schema::table('surveys', function (Blueprint $table) {
                $table->index('is_multi_campus');
            });
        } catch (\Exception $e) {
            // Index may already exist
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('surveys', function (Blueprint $table) {
            $table->dropForeign(['campus_id']);
            $table->dropIndex(['campus_id']);
            $table->dropIndex(['is_multi_campus']);
            $table->dropColumn(['campus_id', 'is_multi_campus']);
        });
    }
};
