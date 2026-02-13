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
        Schema::table('batches', function (Blueprint $table) {
            if (!Schema::hasColumn('batches', 'initial_enrollment')) {
                $table->unsignedInteger('initial_enrollment')->nullable()
                    ->comment('Number of students who initially enrolled in this batch');
            }
            if (!Schema::hasColumn('batches', 'graduated_count')) {
                $table->unsignedInteger('graduated_count')->nullable()
                    ->comment('Number of students who graduated from this batch');
            }
            if (!Schema::hasColumn('batches', 'dropout_count')) {
                $table->unsignedInteger('dropout_count')->nullable()
                    ->comment('Number of students who dropped out');
            }
            if (!Schema::hasColumn('batches', 'transferred_count')) {
                $table->unsignedInteger('transferred_count')->nullable()
                    ->comment('Number of students who transferred');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('batches', function (Blueprint $table) {
            $table->dropColumn([
                'initial_enrollment', 
                'graduated_count', 
                'dropout_count', 
                'transferred_count'
            ]);
        });
    }
};
