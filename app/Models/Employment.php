<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Employment extends Model
{
    protected $fillable = [
        'alumni_id',
        'company_name',
        'position',
        'start_date',
        'end_date',
        'is_current',
        'salary',
        'industry',
        'location',
        'employment_type'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_current' => 'boolean',
        'salary' => 'decimal:2'
    ];

    public function alumni(): BelongsTo
    {
        return $this->belongsTo(AlumniProfile::class, 'alumni_id');
    }
}
