<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SavedJob extends Model
{
    protected $fillable = [
        'job_posting_id',
        'user_id',
    ];

    /**
     * Get the job posting
     */
    public function jobPosting(): BelongsTo
    {
        return $this->belongsTo(JobPosting::class);
    }

    /**
     * Get the user who saved the job
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
