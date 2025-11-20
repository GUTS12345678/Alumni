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
            $table->dropColumn(['gmail_otp_enabled', 'otp_code', 'otp_expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('gmail_otp_enabled')->default(false)->after('google_auth_secret');
            $table->string('otp_code', 6)->nullable()->after('gmail_otp_enabled');
            $table->timestamp('otp_expires_at')->nullable()->after('otp_code');
        });
    }
};
