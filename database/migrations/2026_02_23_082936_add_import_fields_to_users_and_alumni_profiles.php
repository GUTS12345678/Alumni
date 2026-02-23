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
        // Add must_change_password to users table
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('must_change_password')->default(false)->after('password');
        });

        // Add suffix, import_source, imported_at to alumni_profiles table
        Schema::table('alumni_profiles', function (Blueprint $table) {
            if (!Schema::hasColumn('alumni_profiles', 'suffix')) {
                $table->string('suffix', 10)->nullable()->after('middle_name');
            }
            if (!Schema::hasColumn('alumni_profiles', 'import_source')) {
                $table->string('import_source')->nullable()->after('last_profile_update');
            }
            if (!Schema::hasColumn('alumni_profiles', 'imported_at')) {
                $table->timestamp('imported_at')->nullable()->after('import_source');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('must_change_password');
        });

        Schema::table('alumni_profiles', function (Blueprint $table) {
            $table->dropColumn(['suffix', 'import_source', 'imported_at']);
        });
    }
};
