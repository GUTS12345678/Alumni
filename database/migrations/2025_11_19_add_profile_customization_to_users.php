<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'profile_picture_path')) {
                $table->string('profile_picture_path')->nullable()->after('email');
            }
            if (!Schema::hasColumn('users', 'cover_photo_path')) {
                $table->string('cover_photo_path')->nullable();
            }
            if (!Schema::hasColumn('users', 'phone_number')) {
                $table->string('phone_number', 20)->nullable();
            }
            if (!Schema::hasColumn('users', 'bio')) {
                $table->text('bio')->nullable();
            }
            if (!Schema::hasColumn('users', 'location')) {
                $table->string('location', 100)->nullable();
            }
            if (!Schema::hasColumn('users', 'website')) {
                $table->string('website', 255)->nullable();
            }
            if (!Schema::hasColumn('users', 'social_links')) {
                $table->json('social_links')->nullable();
            }
            if (!Schema::hasColumn('users', 'preferred_theme')) {
                $table->string('preferred_theme', 20)->default('system');
            }
            if (!Schema::hasColumn('users', 'preferred_language')) {
                $table->string('preferred_language', 10)->default('en');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'profile_picture_path',
                'cover_photo_path',
                'phone_number',
                'bio',
                'location',
                'website',
                'social_links',
                'preferred_theme',
                'preferred_language'
            ]);
        });
    }
};
