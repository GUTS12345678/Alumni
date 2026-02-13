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
            if (!Schema::hasColumn('users', 'gmail_otp_enabled')) {
                $table->boolean('gmail_otp_enabled')->default(false)->after('remember_token');
            }
            if (!Schema::hasColumn('users', 'google_auth_enabled')) {
                $table->boolean('google_auth_enabled')->default(false);
            }
            if (!Schema::hasColumn('users', 'google_auth_secret')) {
                $table->string('google_auth_secret')->nullable();
            }
            if (!Schema::hasColumn('users', 'otp_code')) {
                $table->string('otp_code')->nullable();
            }
            if (!Schema::hasColumn('users', 'otp_expires_at')) {
                $table->timestamp('otp_expires_at')->nullable();
            }
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
