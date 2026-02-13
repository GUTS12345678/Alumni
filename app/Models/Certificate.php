<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Certificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'description',
        'issued_date',
        'reference_id',
        'reference_type',
        'certificate_number',
        'status',
        'metadata',
    ];

    protected $casts = [
        'issued_date' => 'date',
        'metadata' => 'array',
    ];

    /**
     * Certificate types
     */
    const TYPE_SURVEY_COMPLETION = 'survey_completion';
    const TYPE_MEMBERSHIP = 'membership';
    const TYPE_PARTICIPATION = 'participation';
    const TYPE_ACHIEVEMENT = 'achievement';

    /**
     * Certificate statuses
     */
    const STATUS_AVAILABLE = 'available';
    const STATUS_PENDING = 'pending';
    const STATUS_EXPIRED = 'expired';

    /**
     * Get the user that owns the certificate
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the related model (survey response, etc.)
     */
    public function reference()
    {
        return $this->morphTo();
    }

    /**
     * Generate a unique certificate number
     */
    public static function generateCertificateNumber(): string
    {
        $prefix = 'CERT';
        $year = date('Y');
        $random = strtoupper(substr(md5(uniqid()), 0, 8));
        return "{$prefix}-{$year}-{$random}";
    }

    /**
     * Create a survey completion certificate
     */
    public static function createForSurveyCompletion(User $user, $surveyResponse): self
    {
        $survey = $surveyResponse->survey;
        
        return self::create([
            'user_id' => $user->id,
            'type' => self::TYPE_SURVEY_COMPLETION,
            'title' => 'Survey Completion Certificate',
            'description' => "Certificate of completion for {$survey->title}",
            'issued_date' => now(),
            'reference_id' => $surveyResponse->id,
            'reference_type' => get_class($surveyResponse),
            'certificate_number' => self::generateCertificateNumber(),
            'status' => self::STATUS_AVAILABLE,
            'metadata' => [
                'survey_id' => $survey->id,
                'survey_title' => $survey->title,
                'completed_at' => $surveyResponse->completed_at,
            ],
        ]);
    }

    /**
     * Create a membership certificate
     */
    public static function createMembershipCertificate(User $user): self
    {
        return self::create([
            'user_id' => $user->id,
            'type' => self::TYPE_MEMBERSHIP,
            'title' => 'Alumni Membership Certificate',
            'description' => 'Certificate of membership in the Alumni Association',
            'issued_date' => now(),
            'certificate_number' => self::generateCertificateNumber(),
            'status' => self::STATUS_AVAILABLE,
            'metadata' => [
                'member_since' => $user->created_at,
            ],
        ]);
    }

    /**
     * Get download URL for the certificate
     */
    public function getDownloadUrlAttribute(): string
    {
        return route('certificates.download', $this->id);
    }
}
