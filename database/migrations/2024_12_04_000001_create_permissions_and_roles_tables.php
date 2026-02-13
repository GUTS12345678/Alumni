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
        // Permissions table
        if (!Schema::hasTable('permissions')) {
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // e.g., 'users.view', 'surveys.create'
            $table->string('display_name'); // e.g., 'View Users'
            $table->string('description')->nullable();
            $table->string('category'); // e.g., 'User Management', 'Survey Management'
            $table->string('module'); // e.g., 'users', 'surveys', 'analytics'
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        }

        // Roles table (predefined + custom roles)
        if (!Schema::hasTable('roles')) {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // e.g., 'super_admin', 'admin', 'custom_role_1'
            $table->string('display_name'); // e.g., 'Super Administrator'
            $table->string('description')->nullable();
            $table->boolean('is_system_role')->default(false); // true for super_admin, admin, alumni
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        }

        // Permission-Role pivot table
        if (!Schema::hasTable('permission_role')) {
        Schema::create('permission_role', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permission_id')->constrained()->onDelete('cascade');
            $table->foreignId('role_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->unique(['permission_id', 'role_id']);
        });
        }

        // Add role_id to users table
        if (!Schema::hasColumn('users', 'role_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->foreignId('role_id')->nullable()->constrained()->onDelete('set null');
                // Keep the old 'role' column for backward compatibility
            });
        }

        // User custom permissions (direct permissions assigned to specific users)
        if (!Schema::hasTable('user_permissions')) {
        Schema::create('user_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('permission_id')->constrained()->onDelete('cascade');
            $table->boolean('is_granted')->default(true); // true = grant, false = deny
            $table->timestamps();

            $table->unique(['user_id', 'permission_id']);
        });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropColumn('role_id');
        });
        
        Schema::dropIfExists('user_permissions');
        Schema::dropIfExists('permission_role');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('permissions');
    }
};
