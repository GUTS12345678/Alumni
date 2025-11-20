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
            $table->boolean('gmail_otp_enabled')->default(false)->after('remember_token');
            $table->boolean('google_auth_enabled')->default(false)->after('gmail_otp_enabled');
            $table->string('google_auth_secret')->nullable()->after('google_auth_enabled');
            $table->string('otp_code')->nullable()->after('google_auth_secret');
            $table->timestamp('otp_expires_at')->nullable()->after('otp_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'gmail_otp_enabled',
                'google_auth_enabled',
                'google_auth_secret',
                'otp_code',
                'otp_expires_at'
            ]);
        });
    }
};
