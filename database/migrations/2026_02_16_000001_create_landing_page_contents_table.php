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
        Schema::create('landing_page_contents', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('content_type', ['hero', 'video', 'image', 'text', 'carousel', 'stats', 'testimonial', 'feature', 'custom'])->default('custom');
            
            // Media fields
            $table->string('media_url')->nullable(); // For videos (YouTube, Vimeo) or external images
            $table->string('media_file')->nullable(); // For uploaded videos/images
            $table->string('thumbnail')->nullable(); // For video thumbnails
            $table->json('gallery_images')->nullable(); // For multiple images
            
            // Text content
            $table->longText('content')->nullable(); // Rich text content
            $table->json('pages')->nullable(); // Multi-page content like announcements/jobs
            $table->boolean('use_pages')->default(false);
            
            // Additional data (for stats, features, etc.)
            $table->json('metadata')->nullable(); // Flexible JSON for stats, icons, etc.
            
            // Display settings
            $table->integer('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->enum('layout', ['full_width', 'contained', 'two_column', 'three_column', 'grid'])->default('contained');
            $table->string('background_color')->nullable();
            $table->string('text_color')->nullable();
            $table->string('section_id')->nullable(); // Custom HTML ID for scrolling
            
            // Campus and targeting
            $table->foreignId('campus_id')->nullable()->constrained('campuses')->nullOnDelete();
            $table->boolean('is_multi_campus')->default(true);
            
            // Publishing
            $table->boolean('is_published')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            
            // Tracking
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['is_active', 'is_published', 'display_order']);
            $table->index(['content_type', 'is_active']);
            $table->index('campus_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('landing_page_contents');
    }
};
