<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContentView extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'content_id',
        'user_id',
        'ip_address',
        'user_agent',
        'viewed_at',
    ];

    protected $casts = [
        'viewed_at' => 'datetime',
    ];

    public function content(): BelongsTo
    {
        return $this->belongsTo(Content::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Record a view.
     */
    public static function recordView(int $contentId, ?int $userId = null, ?string $ip = null, ?string $userAgent = null): self
    {
        return self::create([
            'content_id' => $contentId,
            'user_id' => $userId,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'viewed_at' => now(),
        ]);
    }
}
