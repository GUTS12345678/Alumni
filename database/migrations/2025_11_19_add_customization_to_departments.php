<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            if (!Schema::hasColumn('departments', 'logo_path')) {
                $table->string('logo_path')->nullable();
            }
            if (!Schema::hasColumn('departments', 'background_image_path')) {
                $table->string('background_image_path')->nullable();
            }
            if (!Schema::hasColumn('departments', 'primary_color')) {
                $table->string('primary_color', 7)->default('#7C2529');
            }
            if (!Schema::hasColumn('departments', 'secondary_color')) {
                $table->string('secondary_color', 7)->default('#B89968');
            }
            if (!Schema::hasColumn('departments', 'custom_css')) {
                $table->text('custom_css')->nullable();
            }
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
