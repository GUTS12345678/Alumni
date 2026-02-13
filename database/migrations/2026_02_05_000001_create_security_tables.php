<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Security Infrastructure Tables
 * 
 * Implements security logging and monitoring following:
 * - OWASP A09:2021 - Security Logging and Monitoring Failures
 * - DICT Philippines Cybersecurity Guidelines
 * - ISO 27001:2022 - Audit Trail Requirements
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Security Events Log - For SIEM integration
        if (!Schema::hasTable('security_logs')) {
            Schema::create('security_logs', function (Blueprint $table) {
                $table->id();
                $table->string('event_type', 100)->index();
                $table->enum('level', ['emergency', 'alert', 'critical', 'error', 'warning', 'notice', 'info', 'debug'])->default('info');
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->string('ip_address', 45)->nullable()->index();
                $table->text('user_agent')->nullable();
                $table->json('details')->nullable();
                $table->timestamp('created_at')->useCurrent()->index();
            });
        }

        // Blocked IPs - For threat management
        if (!Schema::hasTable('blocked_ips')) {
            Schema::create('blocked_ips', function (Blueprint $table) {
                $table->id();
                $table->string('ip_address', 45)->unique();
                $table->string('reason')->nullable();
                $table->timestamp('blocked_at')->useCurrent();
                $table->timestamp('expires_at')->nullable()->index();
                $table->string('blocked_by')->nullable();
                $table->timestamps();
            });
        }

        // Audit Logs - For compliance (DICT DPA, ISO 27001)
        if (!Schema::hasTable('audit_logs')) {
            Schema::create('audit_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->string('action', 100)->index();
                $table->string('entity_type', 100)->nullable()->index();
                $table->unsignedBigInteger('entity_id')->nullable();
                $table->json('old_values')->nullable();
                $table->json('new_values')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->json('details')->nullable();
                $table->timestamp('created_at')->useCurrent()->index();
            });
        }

        // Login Attempts - For brute force detection
        if (!Schema::hasTable('login_attempts')) {
            Schema::create('login_attempts', function (Blueprint $table) {
                $table->id();
                $table->string('email')->index();
                $table->string('ip_address', 45)->index();
                $table->boolean('successful')->default(false);
                $table->text('user_agent')->nullable();
                $table->string('failure_reason')->nullable();
                $table->timestamp('created_at')->useCurrent()->index();
            });
        }

        // Password History - For password reuse prevention
        if (!Schema::hasTable('password_history')) {
            Schema::create('password_history', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('password_hash');
                $table->timestamp('created_at')->useCurrent()->index();
            });
        }

        // Session Logs - For session management
        if (!Schema::hasTable('session_logs')) {
            Schema::create('session_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('session_id', 128)->index();
                $table->string('ip_address', 45);
                $table->text('user_agent')->nullable();
                $table->string('device_type', 50)->nullable();
                $table->string('browser', 50)->nullable();
                $table->string('os', 50)->nullable();
                $table->string('location', 100)->nullable();
                $table->timestamp('started_at')->useCurrent();
                $table->timestamp('last_activity_at')->useCurrent();
                $table->timestamp('ended_at')->nullable();
                $table->enum('end_reason', ['logout', 'timeout', 'revoked', 'security'])->nullable();
            });
        }

        // Data Access Logs - For sensitive data access tracking (DICT DPA compliance)
        if (!Schema::hasTable('data_access_logs')) {
            Schema::create('data_access_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->string('data_type', 100)->index();
                $table->unsignedBigInteger('data_id')->nullable();
                $table->enum('access_type', ['view', 'create', 'update', 'delete', 'export', 'bulk_access'])->index();
                $table->string('ip_address', 45)->nullable();
                $table->json('accessed_fields')->nullable();
                $table->timestamp('created_at')->useCurrent()->index();
            });
        }

        // Security Configurations - For dynamic security settings
        if (!Schema::hasTable('security_configurations')) {
            Schema::create('security_configurations', function (Blueprint $table) {
                $table->id();
                $table->string('key', 100)->unique();
                $table->text('value');
                $table->string('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });

            // Insert default security configurations
            DB::table('security_configurations')->insert([
                [
                    'key' => 'max_login_attempts',
                    'value' => '5',
                    'description' => 'Maximum failed login attempts before temporary lockout',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'key' => 'lockout_duration_minutes',
                    'value' => '30',
                    'description' => 'Duration of account lockout in minutes',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'key' => 'password_min_length',
                    'value' => '12',
                    'description' => 'Minimum password length',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'key' => 'password_history_count',
                    'value' => '5',
                    'description' => 'Number of previous passwords to check for reuse',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'key' => 'session_timeout_minutes',
                    'value' => '120',
                    'description' => 'Session timeout in minutes',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'key' => 'require_2fa_for_admins',
                    'value' => 'true',
                    'description' => 'Require two-factor authentication for admin users',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'key' => 'api_rate_limit_per_minute',
                    'value' => '60',
                    'description' => 'Maximum API requests per minute per user',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'key' => 'enable_ip_blocking',
                    'value' => 'true',
                    'description' => 'Enable automatic IP blocking for suspicious activity',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('security_configurations');
        Schema::dropIfExists('data_access_logs');
        Schema::dropIfExists('session_logs');
        Schema::dropIfExists('password_history');
        Schema::dropIfExists('login_attempts');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('blocked_ips');
        Schema::dropIfExists('security_logs');
    }
};
