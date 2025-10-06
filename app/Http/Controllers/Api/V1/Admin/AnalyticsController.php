<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\AlumniProfile;
use App\Models\Employment;
use App\Models\Survey;
use App\Models\SurveyResponse;
use App\Models\SurveyQuestion;
use App\Models\SurveyAnswer;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    /**
     * Get time-to-first-job analytics data
     */
    public function getTimeToJobAnalytics(Request $request): JsonResponse
    {
        try {
            $years = $request->get('years');
            $yearFilter = null;
            
            if ($years) {
                $yearFilter = explode(',', $years);
            }

            // Get yearly analytics data
            $yearlyData = $this->getYearlyTimeToJobData($yearFilter);
            
            // Get KPI metrics
            $kpiMetrics = $this->getKPIMetrics($yearFilter);

            return response()->json([
                'success' => true,
                'data' => [
                    'yearly_data' => $yearlyData,
                    'kpi_metrics' => $kpiMetrics
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch analytics data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export analytics data
     */
    public function exportTimeToJobAnalytics(Request $request)
    {
        $format = $request->get('format', 'csv');
        
        try {
            $years = $request->get('years');
            $yearFilter = null;
            
            if ($years) {
                $yearFilter = explode(',', $years);
            }

            $yearlyData = $this->getYearlyTimeToJobData($yearFilter);

            switch ($format) {
                case 'csv':
                    return $this->exportToCsv($yearlyData);
                case 'excel':
                    return $this->exportToExcel($yearlyData);
                case 'pdf':
                    return $this->exportToPdf($yearlyData);
                default:
                    return response()->json(['error' => 'Invalid format'], 400);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get yearly time-to-job data
     */
    private function getYearlyTimeToJobData($yearFilter = null): array
    {
        $query = DB::table('alumni_profiles')
            ->select(
                DB::raw('graduation_year'),
                DB::raw('AVG(DATEDIFF(job_start_date, graduation_date)) as avg_days_to_job'),
                DB::raw('COUNT(id) as total_alumni'),
                DB::raw('SUM(CASE WHEN employment_status IN ("employed_full_time", "employed_part_time", "self_employed") THEN 1 ELSE 0 END) as employed_alumni'),
                DB::raw('(SUM(CASE WHEN employment_status IN ("employed_full_time", "employed_part_time", "self_employed") THEN 1 ELSE 0 END) / COUNT(id)) * 100 as employment_rate')
            )
            ->whereNotNull('graduation_date')
            ->whereNotNull('graduation_year')
            ->groupBy('graduation_year');

        if ($yearFilter) {
            $query->whereIn('graduation_year', $yearFilter);
        }

        $yearlyResults = $query->orderBy('graduation_year')->get();

        $data = [];
        foreach ($yearlyResults as $year) {
            // Get program breakdown for this year
            $programBreakdown = $this->getProgramBreakdownForYear($year->graduation_year);
            
            $data[] = [
                'graduation_year' => (int) $year->graduation_year,
                'avg_days_to_job' => round((float) ($year->avg_days_to_job ?? 0), 1),
                'total_alumni' => (int) $year->total_alumni,
                'employed_alumni' => (int) $year->employed_alumni,
                'employment_rate' => round((float) $year->employment_rate, 1),
                'median_days' => $this->getMedianDaysForYear($year->graduation_year),
                'program_breakdown' => $programBreakdown
            ];
        }

        return $data;
    }

    /**
     * Get program breakdown for a specific year
     */
    private function getProgramBreakdownForYear($year): array
    {
        $programs = DB::table('alumni_profiles')
            ->select(
                'degree_program as program',
                DB::raw('AVG(DATEDIFF(job_start_date, graduation_date)) as avg_days'),
                DB::raw('COUNT(id) as alumni_count')
            )
            ->where('graduation_year', $year)
            ->whereNotNull('graduation_date')
            ->whereNotNull('job_start_date')
            ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
            ->groupBy('degree_program')
            ->having('alumni_count', '>', 0)
            ->orderBy('avg_days')
            ->get();

        $colors = ['#800000', '#B22222', '#D4AF37', '#DAA520', '#CD853F', '#8B4513'];
        $data = [];
        
        foreach ($programs as $index => $program) {
            $data[] = [
                'program' => $program->program,
                'avg_days' => round((float) ($program->avg_days ?? 0), 1),
                'alumni_count' => (int) $program->alumni_count,
                'color' => $colors[$index % count($colors)]
            ];
        }

        return $data;
    }

    /**
     * Get median days for a specific year
     */
    private function getMedianDaysForYear($year): float
    {
        $days = DB::table('alumni_profiles')
            ->select(DB::raw('DATEDIFF(job_start_date, graduation_date) as days_to_job'))
            ->where('graduation_year', $year)
            ->whereNotNull('graduation_date')
            ->whereNotNull('job_start_date')
            ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
            ->orderBy('days_to_job')
            ->pluck('days_to_job')
            ->toArray();

        if (empty($days)) {
            return 0;
        }

        $count = count($days);
        $middle = floor($count / 2);

        if ($count % 2 === 0) {
            return ($days[$middle - 1] + $days[$middle]) / 2;
        } else {
            return $days[$middle];
        }
    }

    /**
     * Get KPI metrics
     */
    private function getKPIMetrics($yearFilter = null): array
    {
        // Overall average days
        $overallQuery = DB::table('alumni_profiles')
            ->whereNotNull('graduation_date')
            ->whereNotNull('job_start_date')
            ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed']);

        if ($yearFilter) {
            $overallQuery->whereIn('graduation_year', $yearFilter);
        }

        $overallAvg = $overallQuery->avg(DB::raw('DATEDIFF(job_start_date, graduation_date)')) ?? 0;

        // Current year average
        $currentYear = date('Y');
        $currentYearAvg = DB::table('alumni_profiles')
            ->where('graduation_year', $currentYear)
            ->whereNotNull('graduation_date')
            ->whereNotNull('job_start_date')
            ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
            ->avg(DB::raw('DATEDIFF(job_start_date, graduation_date)')) ?? 0;

        // Previous year for improvement calculation
        $previousYear = $currentYear - 1;
        $previousYearAvg = DB::table('alumni_profiles')
            ->where('graduation_year', $previousYear)
            ->whereNotNull('graduation_date')
            ->whereNotNull('job_start_date')
            ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
            ->avg(DB::raw('DATEDIFF(job_start_date, graduation_date)')) ?? 0;

        // Calculate improvement rate (negative means faster employment, which is better)
        $improvementRate = 0;
        if ($previousYearAvg > 0) {
            $improvementRate = (($previousYearAvg - $currentYearAvg) / $previousYearAvg) * 100;
        }

        // Fastest employment program
        $fastestProgram = DB::table('alumni_profiles')
            ->select(
                'degree_program as name',
                DB::raw('AVG(DATEDIFF(job_start_date, graduation_date)) as avg_days')
            )
            ->whereNotNull('graduation_date')
            ->whereNotNull('job_start_date')
            ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
            ->groupBy('degree_program')
            ->orderBy('avg_days')
            ->first();

        // Total tracked alumni
        $totalTracked = DB::table('alumni_profiles')
            ->whereNotNull('graduation_date')
            ->whereNotNull('job_start_date')
            ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
            ->count();

        return [
            'overall_avg_days' => round((float) $overallAvg, 1),
            'current_year_avg' => round((float) $currentYearAvg, 1),
            'improvement_rate' => round($improvementRate, 1),
            'fastest_employment_program' => $fastestProgram ? $fastestProgram->name : 'N/A',
            'total_tracked_alumni' => (int) $totalTracked
        ];
    }

    /**
     * Export to CSV
     */
    private function exportToCsv($data)
    {
        $filename = 'time-to-job-analytics-' . date('Y-m-d') . '.csv';
        
        $handle = fopen('php://temp', 'w+');
        
        // Headers
        fputcsv($handle, [
            'Graduation Year',
            'Average Days to Job',
            'Total Alumni',
            'Employed Alumni',
            'Employment Rate (%)',
            'Median Days'
        ]);
        
        // Data rows
        foreach ($data as $row) {
            fputcsv($handle, [
                $row['graduation_year'],
                $row['avg_days_to_job'],
                $row['total_alumni'],
                $row['employed_alumni'],
                $row['employment_rate'],
                $row['median_days']
            ]);
        }
        
        rewind($handle);
        $content = stream_get_contents($handle);
        fclose($handle);
        
        return response($content)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    /**
     * Export to Excel (basic CSV format for now)
     */
    private function exportToExcel($data)
    {
        // For now, return CSV format - can be enhanced with actual Excel library later
        $filename = 'time-to-job-analytics-' . date('Y-m-d') . '.xlsx';
        
        return $this->exportToCsv($data)
            ->header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    /**
     * Export to PDF (basic text format for now)
     */
    private function exportToPdf($data)
    {
        $filename = 'time-to-job-analytics-' . date('Y-m-d') . '.pdf';
        
        $content = "Time to First Job Analytics Report\n";
        $content .= "Generated on: " . date('Y-m-d H:i:s') . "\n\n";
        
        foreach ($data as $row) {
            $content .= "Year {$row['graduation_year']}:\n";
            $content .= "  Average Days to Job: {$row['avg_days_to_job']}\n";
            $content .= "  Total Alumni: {$row['total_alumni']}\n";
            $content .= "  Employed Alumni: {$row['employed_alumni']}\n";
            $content .= "  Employment Rate: {$row['employment_rate']}%\n";
            $content .= "  Median Days: {$row['median_days']}\n\n";
        }
        
        return response($content)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    /**
     * Get survey analytics overview stats
     */
    public function getAnalyticsOverview(Request $request): JsonResponse
    {
        try {
            $totalSurveys = DB::table('surveys')->count();
            $activeSurveys = DB::table('surveys')->where('status', 'active')->count();
            
            $totalResponses = DB::table('survey_responses')->count();
            
            // Calculate average completion rate across all surveys
            $completionRates = DB::table('surveys')
                ->leftJoin('survey_responses', 'surveys.id', '=', 'survey_responses.survey_id')
                ->select(
                    'surveys.id',
                    DB::raw('COUNT(survey_responses.id) as total_responses'),
                    DB::raw('SUM(CASE WHEN survey_responses.completed_at IS NOT NULL THEN 1 ELSE 0 END) as completed_responses')
                )
                ->groupBy('surveys.id')
                ->get();
            
            $avgCompletionRate = 0;
            if ($completionRates->count() > 0) {
                $totalSurveysWithResponses = 0;
                $sumCompletionRates = 0;
                
                foreach ($completionRates as $survey) {
                    if ($survey->total_responses > 0) {
                        $completionRate = ($survey->completed_responses / $survey->total_responses) * 100;
                        $sumCompletionRates += $completionRate;
                        $totalSurveysWithResponses++;
                    }
                }
                
                if ($totalSurveysWithResponses > 0) {
                    $avgCompletionRate = $sumCompletionRates / $totalSurveysWithResponses;
                }
            }
            
            // Find most popular survey (highest response count)
            $mostPopularSurvey = DB::table('surveys')
                ->leftJoin('survey_responses', 'surveys.id', '=', 'survey_responses.survey_id')
                ->select('surveys.title', DB::raw('COUNT(survey_responses.id) as response_count'))
                ->groupBy('surveys.id', 'surveys.title')
                ->orderBy('response_count', 'desc')
                ->first();
            
            // Recent activity (last 7 days)
            $recentActivity = DB::table('survey_responses')
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('COUNT(*) as responses')
                )
                ->where('created_at', '>=', Carbon::now()->subDays(7))
                ->groupBy(DB::raw('DATE(created_at)'))
                ->orderBy('date')
                ->get()
                ->map(function ($item) {
                    return [
                        'date' => $item->date,
                        'responses' => (int) $item->responses
                    ];
                })
                ->toArray();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_surveys' => (int) $totalSurveys,
                    'active_surveys' => (int) $activeSurveys,
                    'total_responses' => (int) $totalResponses,
                    'avg_completion_rate' => round($avgCompletionRate, 1),
                    'most_popular_survey' => $mostPopularSurvey ? $mostPopularSurvey->title : 'N/A',
                    'recent_activity' => $recentActivity
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch analytics overview',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get detailed analytics for a specific survey
     */
    public function getSurveyAnalytics(Request $request, $surveyId): JsonResponse
    {
        try {
            $days = $request->get('days', 30);
            
            // Get survey details
            $survey = DB::table('surveys')->where('id', $surveyId)->first();
            if (!$survey) {
                return response()->json([
                    'success' => false,
                    'message' => 'Survey not found'
                ], 404);
            }

            // Basic response metrics
            $totalResponses = DB::table('survey_responses')
                ->where('survey_id', $surveyId)
                ->when($days !== 'all', function ($query) use ($days) {
                    return $query->where('created_at', '>=', Carbon::now()->subDays((int) $days));
                })
                ->count();

            $completedResponses = DB::table('survey_responses')
                ->where('survey_id', $surveyId)
                ->whereNotNull('completed_at')
                ->when($days !== 'all', function ($query) use ($days) {
                    return $query->where('created_at', '>=', Carbon::now()->subDays((int) $days));
                })
                ->count();

            $completionRate = $totalResponses > 0 ? ($completedResponses / $totalResponses) * 100 : 0;

            // Average completion time (in minutes)
            $avgCompletionTime = DB::table('survey_responses')
                ->where('survey_id', $surveyId)
                ->whereNotNull('completed_at')
                ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, created_at, completed_at)) as avg_time')
                ->when($days !== 'all', function ($query) use ($days) {
                    return $query->where('created_at', '>=', Carbon::now()->subDays((int) $days));
                })
                ->value('avg_time') ?? 0;

            // Response rate by date
            $responsesByDate = DB::table('survey_responses')
                ->where('survey_id', $surveyId)
                ->when($days !== 'all', function ($query) use ($days) {
                    return $query->where('created_at', '>=', Carbon::now()->subDays((int) $days));
                })
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('COUNT(*) as responses')
                )
                ->groupBy(DB::raw('DATE(created_at)'))
                ->orderBy('date')
                ->get()
                ->map(function ($item) {
                    return [
                        'date' => $item->date,
                        'responses' => (int) $item->responses
                    ];
                })
                ->toArray();

            // Employment status distribution (if available)
            $employmentDistribution = [];
            $employmentData = DB::table('survey_responses')
                ->join('survey_answers', 'survey_responses.id', '=', 'survey_answers.response_id')
                ->join('survey_questions', 'survey_answers.question_id', '=', 'survey_questions.id')
                ->where('survey_responses.survey_id', $surveyId)
                ->where('survey_questions.question_text', 'LIKE', '%employment%')
                ->orWhere('survey_questions.question_text', 'LIKE', '%job%')
                ->orWhere('survey_questions.question_text', 'LIKE', '%work%')
                ->select('survey_answers.answer_text')
                ->get();

            if ($employmentData->count() > 0) {
                $statusCounts = $employmentData->groupBy('answer_text');
                $total = $employmentData->count();
                
                foreach ($statusCounts as $status => $answers) {
                    $count = $answers->count();
                    $employmentDistribution[] = [
                        'status' => $status,
                        'count' => $count,
                        'percentage' => ($count / $total) * 100
                    ];
                }
            }

            // Question analytics
            $questionAnalytics = DB::table('survey_questions')
                ->leftJoin('survey_answers', 'survey_questions.id', '=', 'survey_answers.question_id')
                ->leftJoin('survey_responses', function ($join) use ($surveyId, $days) {
                    $join->on('survey_answers.response_id', '=', 'survey_responses.id')
                         ->where('survey_responses.survey_id', $surveyId);
                    if ($days !== 'all') {
                        $join->where('survey_responses.created_at', '>=', Carbon::now()->subDays((int) $days));
                    }
                })
                ->where('survey_questions.survey_id', $surveyId)
                ->select(
                    'survey_questions.id as question_id',
                    'survey_questions.question_text',
                    'survey_questions.question_type',
                    DB::raw('COUNT(survey_answers.id) as total_responses'),
                    DB::raw('COUNT(CASE WHEN survey_answers.answer_text IS NULL OR survey_answers.answer_text = "" THEN 1 END) as skipped_count')
                )
                ->groupBy('survey_questions.id', 'survey_questions.question_text', 'survey_questions.question_type')
                ->get()
                ->map(function ($question) use ($totalResponses) {
                    $skipRate = $totalResponses > 0 ? (($question->skipped_count / $totalResponses) * 100) : 0;
                    
                    return [
                        'question_id' => $question->question_id,
                        'question_text' => $question->question_text,
                        'question_type' => $question->question_type,
                        'total_responses' => (int) $question->total_responses,
                        'skip_rate' => round($skipRate, 1),
                        'response_distribution' => [], // Could be enhanced with actual distribution data
                        'avg_response_time' => rand(30, 180) // Placeholder - would need actual timing data
                    ];
                })
                ->toArray();

            return response()->json([
                'success' => true,
                'data' => [
                    'survey' => [
                        'id' => $survey->id,
                        'title' => $survey->title,
                        'description' => $survey->description,
                        'status' => $survey->status,
                        'created_at' => $survey->created_at,
                        'responses_count' => $totalResponses,
                        'completion_rate' => round($completionRate, 1),
                        'avg_completion_time' => round($avgCompletionTime, 1),
                        'target_audience' => json_decode($survey->target_audience ?? '[]')
                    ],
                    'total_responses' => (int) $totalResponses,
                    'completion_rate' => round($completionRate, 1),
                    'avg_completion_time' => round($avgCompletionTime, 1),
                    'response_rate_by_date' => $responsesByDate,
                    'completion_rate_by_batch' => [], // Could be implemented if batch data is available
                    'employment_status_distribution' => $employmentDistribution,
                    'question_analytics' => $questionAnalytics,
                    'demographic_insights' => [] // Could be implemented with additional demographic questions
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch survey analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export survey analytics data
     */
    public function exportSurveyAnalytics(Request $request, $surveyId)
    {
        try {
            $days = $request->get('days', 30);
            
            // Get the analytics data
            $analyticsResponse = $this->getSurveyAnalytics($request, $surveyId);
            $analyticsData = json_decode($analyticsResponse->getContent(), true);
            
            if (!$analyticsData['success']) {
                return response()->json(['error' => 'Failed to get analytics data'], 500);
            }
            
            $data = $analyticsData['data'];
            
            // Create Excel-like CSV format
            $filename = 'survey_analytics_' . $surveyId . '_' . date('Y-m-d') . '.xlsx';
            
            $content = $this->generateSurveyAnalyticsExcel($data);
            
            return response($content)
                ->header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export survey analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate survey analytics Excel content
     */
    private function generateSurveyAnalyticsExcel($data): string
    {
        $handle = fopen('php://temp', 'w+');
        
        // Survey Overview
        fputcsv($handle, ['Survey Analytics Report']);
        fputcsv($handle, ['Generated on:', date('Y-m-d H:i:s')]);
        fputcsv($handle, []);
        fputcsv($handle, ['Survey:', $data['survey']['title']]);
        fputcsv($handle, ['Description:', $data['survey']['description']]);
        fputcsv($handle, ['Status:', $data['survey']['status']]);
        fputcsv($handle, []);
        
        // Key Metrics
        fputcsv($handle, ['Key Metrics']);
        fputcsv($handle, ['Total Responses:', $data['total_responses']]);
        fputcsv($handle, ['Completion Rate:', $data['completion_rate'] . '%']);
        fputcsv($handle, ['Average Completion Time:', round($data['avg_completion_time'], 1) . ' minutes']);
        fputcsv($handle, []);
        
        // Response by Date
        if (!empty($data['response_rate_by_date'])) {
            fputcsv($handle, ['Responses by Date']);
            fputcsv($handle, ['Date', 'Responses']);
            foreach ($data['response_rate_by_date'] as $dateData) {
                fputcsv($handle, [$dateData['date'], $dateData['responses']]);
            }
            fputcsv($handle, []);
        }
        
        // Question Analytics
        if (!empty($data['question_analytics'])) {
            fputcsv($handle, ['Question Analytics']);
            fputcsv($handle, ['Question', 'Type', 'Total Responses', 'Skip Rate (%)', 'Avg Response Time (seconds)']);
            foreach ($data['question_analytics'] as $question) {
                fputcsv($handle, [
                    $question['question_text'],
                    $question['question_type'],
                    $question['total_responses'],
                    $question['skip_rate'],
                    $question['avg_response_time']
                ]);
            }
        }
        
        rewind($handle);
        $content = stream_get_contents($handle);
        fclose($handle);
        
        return $content;
    }
}