<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // MySQL doesn't support ALTER COLUMN for ENUM, so we need to use raw SQL
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'admin', 'alumni') NOT NULL DEFAULT 'alumni'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert any super_admin users to admin before removing the enum value
        DB::table('users')->where('role', 'super_admin')->update(['role' => 'admin']);
        
        // Restore original enum
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'alumni') NOT NULL DEFAULT 'alumni'");
    }
};
