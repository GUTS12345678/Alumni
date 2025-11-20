<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('profile_picture_path')->nullable()->after('email');
            $table->string('cover_photo_path')->nullable()->after('profile_picture_path');
            $table->string('phone_number', 20)->nullable()->after('cover_photo_path');
            $table->text('bio')->nullable()->after('phone_number');
            $table->string('location', 100)->nullable()->after('bio');
            $table->string('website', 255)->nullable()->after('location');
            $table->json('social_links')->nullable()->after('website'); // linkedin, facebook, twitter, etc.
            $table->string('preferred_theme', 20)->default('system')->after('social_links'); // light, dark, system
            $table->string('preferred_language', 10)->default('en')->after('preferred_theme');
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
