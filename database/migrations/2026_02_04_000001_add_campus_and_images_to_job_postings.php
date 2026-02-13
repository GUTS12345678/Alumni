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
        Schema::table('job_postings', function (Blueprint $table) {
            // Add campus support
            if (!Schema::hasColumn('job_postings', 'campus_id')) {
                $table->foreignId('campus_id')->nullable()->after('id')->constrained('campuses')->onDelete('set null');
                $table->index('campus_id');
            }
            if (!Schema::hasColumn('job_postings', 'is_multi_campus')) {
                $table->boolean('is_multi_campus')->default(true)->after('campus_id');
                $table->index('is_multi_campus');
            }
            
            // Add image fields
            if (!Schema::hasColumn('job_postings', 'poster_image')) {
                $table->string('poster_image')->nullable()->after('company_logo');
            }
            if (!Schema::hasColumn('job_postings', 'background_image')) {
                $table->string('background_image')->nullable()->after('poster_image');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_postings', function (Blueprint $table) {
            if (Schema::hasColumn('job_postings', 'campus_id')) {
                $table->dropForeign(['campus_id']);
                $table->dropColumn('campus_id');
            }
            if (Schema::hasColumn('job_postings', 'is_multi_campus')) {
                $table->dropColumn('is_multi_campus');
            }
            if (Schema::hasColumn('job_postings', 'poster_image')) {
                $table->dropColumn('poster_image');
            }
            if (Schema::hasColumn('job_postings', 'background_image')) {
                $table->dropColumn('background_image');
            }
        });
    }
};
