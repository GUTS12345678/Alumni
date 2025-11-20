<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_appearance_settings', function (Blueprint $table) {
            $table->id();
            $table->string('logo_light_path')->nullable();
            $table->string('logo_dark_path')->nullable();
            $table->string('favicon_path')->nullable();
            $table->string('background_image_path')->nullable();
            $table->string('primary_color', 7)->default('#7C2529');
            $table->string('secondary_color', 7)->default('#B89968');
            $table->string('accent_color', 7)->default('#D4AF37');
            $table->boolean('enable_dark_mode')->default(true);
            $table->string('default_theme', 20)->default('light'); // light, dark, system
            $table->string('font_family', 100)->default('Inter');
            $table->text('custom_css')->nullable();
            $table->text('custom_js')->nullable();
            $table->timestamps();
        });

        // Insert default settings
        DB::table('system_appearance_settings')->insert([
            'primary_color' => '#7C2529',
            'secondary_color' => '#B89968',
            'accent_color' => '#D4AF37',
            'enable_dark_mode' => true,
            'default_theme' => 'light',
            'font_family' => 'Inter',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('system_appearance_settings');
    }
};
