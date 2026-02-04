<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Campus extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'code',
        'display_name',
        'address',
        'contact_email',
        'contact_phone',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Campus codes constant
     */
    const CODE_MAIN = 'MAIN';
    const CODE_CAVITE = 'CAV';

    // ==========================================
    // RELATIONSHIPS
    // ==========================================

    /**
     * Get all users belonging to this campus.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get all alumni profiles belonging to this campus.
     */
    public function alumniProfiles(): HasMany
    {
        return $this->hasMany(AlumniProfile::class);
    }

    /**
     * Get all batches belonging to this campus.
     */
    public function batches(): HasMany
    {
        return $this->hasMany(Batch::class);
    }

    /**
     * Get all courses belonging to this campus.
     */
    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }

    /**
     * Get all departments belonging to this campus.
     */
    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }

    /**
     * Get all surveys specific to this campus.
     */
    public function surveys(): HasMany
    {
        return $this->hasMany(Survey::class);
    }

    /**
     * Get all job postings specific to this campus.
     */
    public function jobPostings(): HasMany
    {
        return $this->hasMany(JobPosting::class);
    }

    /**
     * Get all announcements specific to this campus.
     */
    public function announcements(): HasMany
    {
        return $this->hasMany(Announcement::class);
    }

    // ==========================================
    // SCOPES
    // ==========================================

    /**
     * Scope to get only active campuses.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to find campus by code.
     */
    public function scopeByCode($query, string $code)
    {
        return $query->where('code', strtoupper($code));
    }

    // ==========================================
    // ACCESSORS
    // ==========================================

    /**
     * Get formatted display name with code.
     */
    public function getFullDisplayNameAttribute(): string
    {
        return "{$this->display_name} ({$this->code})";
    }

    // ==========================================
    // STATIC HELPERS
    // ==========================================

    /**
     * Get the main campus.
     */
    public static function main(): ?self
    {
        return static::byCode(self::CODE_MAIN)->first();
    }

    /**
     * Get the Cavite campus.
     */
    public static function cavite(): ?self
    {
        return static::byCode(self::CODE_CAVITE)->first();
    }

    /**
     * Get campus ID by code.
     */
    public static function getIdByCode(string $code): ?int
    {
        return static::byCode($code)->value('id');
    }

    /**
     * Get all campus codes as array.
     */
    public static function getCodes(): array
    {
        return static::pluck('code')->toArray();
    }

    /**
     * Get campuses as options array for dropdowns.
     */
    public static function getOptions(): array
    {
        return static::active()
            ->orderBy('name')
            ->get()
            ->map(fn($campus) => [
                'value' => $campus->id,
                'label' => $campus->display_name,
                'code' => $campus->code,
            ])
            ->toArray();
    }
}
