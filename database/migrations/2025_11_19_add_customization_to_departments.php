<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->string('logo_path')->nullable()->after('description');
            $table->string('background_image_path')->nullable()->after('logo_path');
            $table->string('primary_color', 7)->default('#7C2529')->after('background_image_path');
            $table->string('secondary_color', 7)->default('#B89968')->after('primary_color');
            $table->text('custom_css')->nullable()->after('secondary_color');
        });
    }

    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->dropColumn([
                'logo_path',
                'background_image_path',
                'primary_color',
                'secondary_color',
                'custom_css'
            ]);
        });
    }
};
