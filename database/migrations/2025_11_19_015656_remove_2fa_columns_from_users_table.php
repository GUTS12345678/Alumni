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
        Schema::table('users', function (Blueprint $table) {
            $columnsToDrop = array_filter(
                ['google_auth_enabled', 'google_auth_secret'],
                fn($col) => Schema::hasColumn('users', $col)
            );
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Restore 2FA columns if rolled back
            $table->boolean('google_auth_enabled')->default(false)->after('remember_token');
            $table->string('google_auth_secret')->nullable()->after('google_auth_enabled');
        });
    }
};
