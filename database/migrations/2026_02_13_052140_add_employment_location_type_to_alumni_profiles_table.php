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
        Schema::table('alumni_profiles', function (Blueprint $table) {
            $table->enum('employment_location_type', [
                'local',       // Working in the Philippines
                'foreign',     // OFW / working abroad
                'remote',      // Remote work for foreign company
                'not_applicable' // Unemployed / student
            ])->nullable()->after('employment_status')->index('idx_employment_location_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('alumni_profiles', function (Blueprint $table) {
            $table->dropColumn('employment_location_type');
        });
    }
};
