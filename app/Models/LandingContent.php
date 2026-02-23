<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LandingContent extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'landing_page_contents';

    protected $fillable = [
        'title',
        'description',
        'content_type',
        'media_url',
        'media_file',
        'thumbnail',
        'gallery_images',
        'content',
        'pages',
        'use_pages',
        'metadata',
        'display_order',
        'is_active',
        'layout',
        'background_color',
        'text_color',
        'section_id',
        'campus_id',
        'is_multi_campus',
        'is_published',
        'published_at',
        'expires_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'gallery_images' => 'array',
        'pages' => 'array',
        'metadata' => 'array',
        'use_pages' => 'boolean',
        'is_active' => 'boolean',
        'is_multi_campus' => 'boolean',
        'is_published' => 'boolean',
        'published_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    protected $appends = [
        'media_file_url',
        'thumbnail_url',
    ];

    /**
     * Get the URL for the media file.
     */
    public function getMediaFileUrlAttribute(): ?string
    {
        if (!$this->media_file) {
            return null;
        }

        // If it's already a full URL, return as-is
        if (str_starts_with($this->media_file, 'http://') || str_starts_with($this->media_file, 'https://')) {
            return $this->media_file;
        }

        // If it already has /api/ prefix, return as-is
        if (str_starts_with($this->media_file, '/api/')) {
            return $this->media_file;
        }

        // Strip legacy /storage/ prefix if present
        $path = $this->media_file;
        if (str_starts_with($path, '/storage/')) {
            $path = substr($path, 9);
        }

        return '/api/v1/files/' . $path;
    }

    /**
     * Get the URL for the thumbnail.
     */
    public function getThumbnailUrlAttribute(): ?string
    {
        if (!$this->thumbnail) {
            return null;
        }

        // If it's already a full URL, return as-is
        if (str_starts_with($this->thumbnail, 'http://') || str_starts_with($this->thumbnail, 'https://')) {
            return $this->thumbnail;
        }

        // If it already has /api/ prefix, return as-is
        if (str_starts_with($this->thumbnail, '/api/')) {
            return $this->thumbnail;
        }

        // Strip legacy /storage/ prefix if present
        $path = $this->thumbnail;
        if (str_starts_with($path, '/storage/')) {
            $path = substr($path, 9);
        }

        return '/api/v1/files/' . $path;
    }

    /**
     * Get the campus that owns the content.
     */
    public function campus(): BelongsTo
    {
        return $this->belongsTo(Campus::class);
    }

    /**
     * Get the user who created the content.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated the content.
     */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Scope for active content.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for published content.
     */
    public function scopePublished($query)
    {
        return $query->where('is_published', true)
            ->where(function ($q) {
                $q->whereNull('published_at')
                  ->orWhere('published_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            });
    }

    /**
     * Scope for ordering by display order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('display_order', 'asc')->orderBy('created_at', 'desc');
    }

    /**
     * Scope for specific campus or multi-campus content.
     */
    public function scopeForCampus($query, $campusId)
    {
        return $query->where(function ($q) use ($campusId) {
            $q->where('campus_id', $campusId)
              ->orWhere('is_multi_campus', true)
              ->orWhereNull('campus_id');
        });
    }
}
