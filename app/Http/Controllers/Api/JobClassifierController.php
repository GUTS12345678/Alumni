<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AlumniProfile;
use App\Services\JobClassifierService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobClassifierController extends Controller
{
    protected JobClassifierService $classifier;

    public function __construct(JobClassifierService $classifier)
    {
        $this->classifier = $classifier;
    }

    /**
     * Get classification for a specific alumni
     */
    public function classify(int $alumniId): JsonResponse
    {
        $alumni = AlumniProfile::find($alumniId);

        if (!$alumni) {
            return response()->json([
                'success' => false,
                'message' => 'Alumni not found',
            ], 404);
        }

        $result = $this->classifier->classify($alumni);

        if ($result === null) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot classify - alumni is not employed or missing job data',
                'employment_status' => $alumni->employment_status,
                'has_job_title' => !empty($alumni->current_job_title),
            ]);
        }

        return response()->json([
            'success' => true,
            'alumni' => [
                'id' => $alumni->id,
                'name' => $alumni->full_name,
                'degree_program' => $alumni->degree_program,
                'job_title' => $alumni->current_job_title,
                'employer' => $alumni->current_employer,
                'industry' => $alumni->company_industry,
            ],
            'classification' => $result,
        ]);
    }

    /**
     * Classify and save for a specific alumni
     */
    public function classifyAndSave(int $alumniId): JsonResponse
    {
        $alumni = AlumniProfile::find($alumniId);

        if (!$alumni) {
            return response()->json([
                'success' => false,
                'message' => 'Alumni not found',
            ], 404);
        }

        $result = $this->classifier->classify($alumni);

        if ($result === null) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot classify - alumni is not employed or missing job data',
            ]);
        }

        // Save the classification
        $alumni->update([
            'job_mismatch_reason' => $result['classification'],
            'job_satisfaction' => $result['job_satisfaction'],
            'job_related_to_degree' => $result['job_related_to_degree'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Classification saved successfully',
            'classification' => $result,
        ]);
    }

    /**
     * Batch classify all employed alumni
     */
    public function classifyAll(Request $request): JsonResponse
    {
        $force = $request->boolean('force', false);

        $stats = $this->classifier->classifyAll($force);

        $totalClassified = $stats['none'] + $stats['overqualified'] + 
                          $stats['underqualified'] + $stats['unfit'];

        return response()->json([
            'success' => true,
            'message' => "Classified {$totalClassified} alumni",
            'stats' => [
                'good_match' => $stats['none'],
                'overqualified' => $stats['overqualified'],
                'underqualified' => $stats['underqualified'],
                'unfit' => $stats['unfit'],
                'skipped' => $stats['skipped'],
                'errors' => $stats['errors'],
                'total_classified' => $totalClassified,
            ],
            'percentages' => $totalClassified > 0 ? [
                'good_match' => round(($stats['none'] / $totalClassified) * 100, 1),
                'overqualified' => round(($stats['overqualified'] / $totalClassified) * 100, 1),
                'underqualified' => round(($stats['underqualified'] / $totalClassified) * 100, 1),
                'unfit' => round(($stats['unfit'] / $totalClassified) * 100, 1),
            ] : null,
        ]);
    }

    /**
     * Get classification statistics
     */
    public function getStats(): JsonResponse
    {
        $stats = $this->classifier->getStats();
        $total = array_sum($stats);

        return response()->json([
            'success' => true,
            'stats' => $stats,
            'total' => $total,
            'percentages' => $total > 0 ? [
                'good_match' => round(($stats['good_match'] / $total) * 100, 1),
                'overqualified' => round(($stats['overqualified'] / $total) * 100, 1),
                'underqualified' => round(($stats['underqualified'] / $total) * 100, 1),
                'unfit' => round(($stats['unfit'] / $total) * 100, 1),
            ] : null,
        ]);
    }

    /**
     * Preview classification for given data (without saving)
     */
    public function preview(Request $request): JsonResponse
    {
        $request->validate([
            'degree_program' => 'required|string',
            'job_title' => 'required|string',
            'industry' => 'nullable|string',
        ]);

        // Create a temporary model for classification
        $tempAlumni = new AlumniProfile([
            'degree_program' => $request->degree_program,
            'current_job_title' => $request->job_title,
            'company_industry' => $request->industry ?? '',
            'employment_status' => 'employed_full_time',
        ]);

        $result = $this->classifier->classify($tempAlumni);

        if ($result === null) {
            return response()->json([
                'success' => false,
                'message' => 'Could not classify with provided data',
            ]);
        }

        return response()->json([
            'success' => true,
            'preview' => true,
            'input' => [
                'degree_program' => $request->degree_program,
                'job_title' => $request->job_title,
                'industry' => $request->industry,
            ],
            'classification' => $result,
        ]);
    }
}
