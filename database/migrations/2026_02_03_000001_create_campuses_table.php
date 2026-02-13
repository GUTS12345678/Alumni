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
        // Create campuses table
        if (!Schema::hasTable('campuses')) {
        Schema::create('campuses', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('code', 10)->unique();
            $table->string('display_name', 150);
            $table->text('address')->nullable();
            $table->string('contact_email', 255)->nullable();
            $table->string('contact_phone', 20)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('code');
            $table->index('is_active');
        });
        }

        // Insert default campuses
        DB::table('campuses')->insert([
            [
                'name' => 'EARIST Main Campus',
                'code' => 'MAIN',
                'display_name' => 'Main Campus - Manila',
                'address' => 'Nagtahan, Sampaloc, Manila',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'EARIST Cavite Campus',
                'code' => 'CAV',
                'display_name' => 'Cavite Campus',
                'address' => 'Rosario, Cavite',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('campuses');
    }
};
