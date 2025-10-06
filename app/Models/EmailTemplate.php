<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmailTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'subject',
        'body',
        'category',
        'type',
        'status',
        'variables',
        'usage_count',
        'last_sent_at',
        'created_by',
    ];

    protected $casts = [
        'variables' => 'array',
        'usage_count' => 'integer',
        'last_sent_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who created this template
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Increment usage count and update last sent timestamp
     */
    public function recordUsage()
    {
        $this->increment('usage_count');
        $this->update(['last_sent_at' => now()]);
    }

    /**
     * Scope to get active templates
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to get templates by type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope to get templates by category
     */
    public function scopeInCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Replace variables in template with actual values
     */
    public function render(array $data = []): string
    {
        $body = $this->body;
        
        foreach ($this->variables as $variable) {
            $placeholder = '{{' . $variable . '}}';
            $value = $data[$variable] ?? $placeholder;
            $body = str_replace($placeholder, $value, $body);
        }
        
        return $body;
    }

    /**
     * Get subject with replaced variables
     */
    public function renderSubject(array $data = []): string
    {
        $subject = $this->subject;
        
        foreach ($this->variables as $variable) {
            $placeholder = '{{' . $variable . '}}';
            $value = $data[$variable] ?? $placeholder;
            $subject = str_replace($placeholder, $value, $subject);
        }
        
        return $subject;
    }
}
