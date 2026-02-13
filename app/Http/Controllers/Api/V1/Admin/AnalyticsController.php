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
            $campusId = $request->get('campus_id');
            
            if ($years) {
                $yearFilter = explode(',', $years);
            }

            // Get yearly analytics data
            $yearlyData = $this->getYearlyTimeToJobData($yearFilter, $campusId);
            
            // Get KPI metrics
            $kpiMetrics = $this->getKPIMetrics($yearFilter, $campusId);
            
            // Get job mismatch statistics
            $mismatchStats = $this->getJobMismatchStatistics($yearFilter, $campusId);

            return response()->json([
                'success' => true,
                'data' => [
                    'yearly_data' => $yearlyData,
                    'kpi_metrics' => $kpiMetrics,
                    'job_mismatch_stats' => $mismatchStats
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
     * Export comprehensive analytics data (ALL analytics)
     */
    public function exportComprehensiveAnalytics(Request $request)
    {
        $format = $request->get('format', 'csv');
        
        try {
            $campusId = $request->get('campus_id');

            // Gather all analytics data
            $data = [
                'time_to_job' => $this->getYearlyTimeToJobData(null, $campusId),
                'enrollment_metrics' => $this->getEnrollmentMetrics($campusId),
                'performance_indicator' => $this->getPerformanceIndicator($campusId),
                'job_alignment' => $this->getJobAlignmentStats($campusId),
                'attrition_rate' => $this->getAttritionRate($campusId),
                'program_performance' => $this->getProgramWisePerformance($campusId),
                'college_breakdown' => $this->getCollegeEnrollmentBreakdown($campusId),
                'course_breakdown' => $this->getCourseEnrollmentBreakdown($campusId),
                'employment_location' => $this->getEmploymentLocationStats($campusId),
            ];

            switch ($format) {
                case 'csv':
                    return $this->exportComprehensiveToCsv($data);
                case 'excel':
                    return $this->exportComprehensiveToExcel($data);
                case 'pdf':
                    return $this->exportComprehensiveToPdf($data);
                default:
                    return response()->json(['error' => 'Invalid format'], 400);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export comprehensive analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export analytics data (legacy - time to job only)
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

            $yearlyData = $this->getYearlyTimeToJobData($yearFilter, $request->get('campus_id'));

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
     * Uses alumni_profiles table directly (graduation_year field)
     * Falls back to employments table if available
     */
    private function getYearlyTimeToJobData($yearFilter = null, $campusId = null): array
    {
        // First, check if we have data in employments table
        $hasEmploymentRecords = DB::table('employments')->exists();
        
        // Get data directly from alumni_profiles using graduation_year field
        $queryFromProfiles = DB::table('alumni_profiles')
            ->select(
                'graduation_year',
                DB::raw('COUNT(id) as total_alumni'),
                DB::raw('SUM(CASE WHEN employment_status IN ("employed_full_time", "employed_part_time", "self_employed") THEN 1 ELSE 0 END) as employed_alumni'),
                DB::raw('AVG(CASE WHEN job_start_date IS NOT NULL AND employment_status IN ("employed_full_time", "employed_part_time", "self_employed") AND DATEDIFF(job_start_date, COALESCE(graduation_date, CONCAT(graduation_year, "-06-01"))) BETWEEN 0 AND 1825 THEN DATEDIFF(job_start_date, COALESCE(graduation_date, CONCAT(graduation_year, "-06-01"))) ELSE NULL END) as avg_days_from_profile')
            )
            ->whereNotNull('graduation_year')
            ->when($yearFilter, function ($q) use ($yearFilter) {
                return $q->whereIn('graduation_year', $yearFilter);
            })
            ->when($campusId, function ($q) use ($campusId) {
                return $q->where('campus_id', $campusId);
            })
            ->groupBy('graduation_year')
            ->orderBy('graduation_year')
            ->get();

        // If we have employment records, also get data from there
        $queryFromJobs = collect();
        if ($hasEmploymentRecords) {
            $queryFromJobs = DB::table('alumni_profiles as ap')
                ->join('employments as e', 'ap.id', '=', 'e.alumni_id')
                ->select(
                    'ap.graduation_year',
                    DB::raw('AVG(CASE WHEN DATEDIFF(e.start_date, COALESCE(ap.graduation_date, CONCAT(ap.graduation_year, "-06-01"))) BETWEEN 0 AND 1825 THEN DATEDIFF(e.start_date, COALESCE(ap.graduation_date, CONCAT(ap.graduation_year, "-06-01"))) ELSE NULL END) as avg_days_to_job'),
                    DB::raw('COUNT(DISTINCT ap.id) as total_alumni_with_jobs')
                )
                ->whereNotNull('ap.graduation_year')
                ->whereNotNull('e.start_date')
                ->when($yearFilter, function ($q) use ($yearFilter) {
                    return $q->whereIn('ap.graduation_year', $yearFilter);
                })
                ->when($campusId, function ($q) use ($campusId) {
                    return $q->where('ap.campus_id', $campusId);
                })
                ->groupBy('ap.graduation_year')
                ->orderBy('ap.graduation_year')
                ->get()
                ->keyBy('graduation_year');
        }

        $data = [];
        foreach ($queryFromProfiles as $yearData) {
            $year = $yearData->graduation_year;
            $jobData = $queryFromJobs->get($year);
            
            // Prefer data from employments table, fallback to profiles
            $avgDays = $jobData && $jobData->total_alumni_with_jobs > 0 
                ? $jobData->avg_days_to_job 
                : $yearData->avg_days_from_profile;
            
            $employmentRate = $yearData->total_alumni > 0
                ? ($yearData->employed_alumni / $yearData->total_alumni) * 100
                : 0;
            
            // Get program breakdown for this year
            $programBreakdown = $this->getProgramBreakdownForYear($year, $campusId);
            
            $data[] = [
                'graduation_year' => (int) $year,
                'avg_days_to_job' => round((float) ($avgDays ?? 0), 1),
                'total_alumni' => (int) $yearData->total_alumni,
                'employed_alumni' => (int) $yearData->employed_alumni,
                'employment_rate' => round((float) $employmentRate, 1),
                'median_days' => $this->getMedianDaysForYear($year, $campusId),
                'program_breakdown' => $programBreakdown,
                'data_source' => $jobData && $jobData->total_alumni_with_jobs > 0 ? 'employments_table' : 'profiles_only'
            ];
        }

        return $data;
    }

    /**
     * Get program breakdown for a specific year
     * Uses alumni_profiles directly (graduation_year field)
     */
    private function getProgramBreakdownForYear($year, $campusId = null): array
    {
        // First, check if we have data in employments table
        $hasEmploymentRecords = DB::table('employments')->exists();
        
        // Get data from profiles using course relationship (COALESCE degree_program with courses.name)
        // This ensures we get program names even when degree_program field is NULL
        $programsFromProfiles = DB::table('alumni_profiles as ap')
            ->leftJoin('courses as c', 'ap.course_id', '=', 'c.id')
            ->select(
                DB::raw('COALESCE(ap.degree_program, c.name) as program'),
                DB::raw('AVG(CASE WHEN ap.job_start_date IS NOT NULL AND DATEDIFF(ap.job_start_date, COALESCE(ap.graduation_date, CONCAT(ap.graduation_year, "-06-01"))) BETWEEN 0 AND 1825 THEN DATEDIFF(ap.job_start_date, COALESCE(ap.graduation_date, CONCAT(ap.graduation_year, "-06-01"))) ELSE NULL END) as avg_days'),
                DB::raw('COUNT(ap.id) as alumni_count')
            )
            ->where('ap.graduation_year', $year)
            ->whereRaw('COALESCE(ap.degree_program, c.name) IS NOT NULL')
            ->whereRaw("COALESCE(ap.degree_program, c.name) != ''")
            ->whereIn('ap.employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
            ->when($campusId, function ($q) use ($campusId) {
                return $q->where('ap.campus_id', $campusId);
            })
            ->groupBy(DB::raw('COALESCE(ap.degree_program, c.name)'))
            ->having('alumni_count', '>', 0)
            ->get();
        
        // If we have employment records, also get data from there
        $programsFromJobs = collect();
        if ($hasEmploymentRecords) {
            $programsFromJobs = DB::table('alumni_profiles as ap')
                ->join('employments as e', 'ap.id', '=', 'e.alumni_id')
                ->leftJoin('courses as c', 'ap.course_id', '=', 'c.id')
                ->select(
                    DB::raw('COALESCE(ap.degree_program, c.name) as program'),
                    DB::raw('AVG(CASE WHEN DATEDIFF(e.start_date, COALESCE(ap.graduation_date, CONCAT(ap.graduation_year, "-06-01"))) BETWEEN 0 AND 1825 THEN DATEDIFF(e.start_date, COALESCE(ap.graduation_date, CONCAT(ap.graduation_year, "-06-01"))) ELSE NULL END) as avg_days'),
                    DB::raw('COUNT(DISTINCT ap.id) as alumni_count')
                )
                ->where('ap.graduation_year', $year)
                ->whereNotNull('e.start_date')
                ->whereRaw('COALESCE(ap.degree_program, c.name) IS NOT NULL')
                ->whereRaw("COALESCE(ap.degree_program, c.name) != ''")
                ->when($campusId, function ($q) use ($campusId) {
                    return $q->where('ap.campus_id', $campusId);
                })
                ->groupBy(DB::raw('COALESCE(ap.degree_program, c.name)'))
                ->having('alumni_count', '>', 0)
                ->get()
                ->keyBy('program');
        }
        
        // Combine both sources, preferring jobs data when available
        $combinedPrograms = [];
        
        // Add programs from profiles first
        foreach ($programsFromProfiles as $data) {
            $program = $data->program;
            $jobData = $programsFromJobs->get($program);
            
            // Use jobs data if available, otherwise use profile data
            if ($jobData && $jobData->alumni_count > 0) {
                $combinedPrograms[$program] = [
                    'avg_days' => $jobData->avg_days,
                    'alumni_count' => $jobData->alumni_count,
                ];
            } else {
                $combinedPrograms[$program] = [
                    'avg_days' => $data->avg_days,
                    'alumni_count' => $data->alumni_count,
                ];
            }
        }
        
        // Sort by avg_days (ascending)
        uasort($combinedPrograms, function ($a, $b) {
            return ($a['avg_days'] ?? 0) <=> ($b['avg_days'] ?? 0);
        });

        $colors = ['#800000', '#B22222', '#D4AF37', '#DAA520', '#CD853F', '#8B4513'];
        $result = [];
        $index = 0;
        
        foreach ($combinedPrograms as $program => $data) {
            $result[] = [
                'program' => $program,
                'avg_days' => round((float) ($data['avg_days'] ?? 0), 1),
                'alumni_count' => (int) $data['alumni_count'],
                'color' => $colors[$index % count($colors)]
            ];
            $index++;
        }

        return $result;
    }

    /**
     * Get median days for a specific year
     * Uses alumni_profiles directly (graduation_year field)
     */
    private function getMedianDaysForYear($year, $campusId = null): float
    {
        // First, check if we have data in employments table
        $hasEmploymentRecords = DB::table('employments')->exists();
        
        // Get days from profiles directly (only positive days - job after graduation, capped at 5 years)
        $daysFromProfiles = DB::table('alumni_profiles')
            ->select(DB::raw('DATEDIFF(job_start_date, COALESCE(graduation_date, CONCAT(graduation_year, "-06-01"))) as days_to_job'))
            ->where('graduation_year', $year)
            ->whereNotNull('job_start_date')
            ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
            ->whereRaw('DATEDIFF(job_start_date, COALESCE(graduation_date, CONCAT(graduation_year, "-06-01"))) BETWEEN 0 AND 1825')
            ->when($campusId, function ($q) use ($campusId) {
                return $q->where('campus_id', $campusId);
            })
            ->pluck('days_to_job')
            ->toArray();
            
        // Get days from employments table if available (with >= 0 filter and 5-year cap)
        $daysFromJobs = [];
        if ($hasEmploymentRecords) {
            $daysFromJobs = DB::table('alumni_profiles as ap')
                ->join('employments as e', 'ap.id', '=', 'e.alumni_id')
                ->select(DB::raw('DATEDIFF(e.start_date, COALESCE(ap.graduation_date, CONCAT(ap.graduation_year, "-06-01"))) as days_to_job'))
                ->where('ap.graduation_year', $year)
                ->whereNotNull('e.start_date')
                ->whereRaw('DATEDIFF(e.start_date, COALESCE(ap.graduation_date, CONCAT(ap.graduation_year, "-06-01"))) BETWEEN 0 AND 1825')
                ->when($campusId, function ($q) use ($campusId) {
                    return $q->where('ap.campus_id', $campusId);
                })
                ->pluck('days_to_job')
                ->toArray();
        }
        
        // Use jobs data if available, otherwise use profiles
        $days = !empty($daysFromJobs) ? $daysFromJobs : $daysFromProfiles;
        sort($days);

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
     * Uses employments table + alumni_profiles for comprehensive tracking
     */
    private function getKPIMetrics($yearFilter = null, $campusId = null): array
    {
        // Overall average days from employments table (only positive days, capped at 5 years)
        // Use COALESCE to fall back to graduation_year-06-01 when graduation_date is NULL
        $overallFromJobs = DB::table('alumni_profiles as ap')
            ->join('employments as e', 'ap.id', '=', 'e.alumni_id')
            ->whereNotNull('ap.graduation_year')
            ->whereNotNull('e.start_date')
            ->whereRaw('DATEDIFF(e.start_date, COALESCE(ap.graduation_date, CONCAT(ap.graduation_year, "-06-01"))) BETWEEN 0 AND 1825')
            ->when($yearFilter, function ($q) use ($yearFilter) {
                return $q->whereIn('ap.graduation_year', $yearFilter);
            })
            ->when($campusId, function ($q) use ($campusId) {
                return $q->where('ap.campus_id', $campusId);
            })
            ->avg(DB::raw('DATEDIFF(e.start_date, COALESCE(ap.graduation_date, CONCAT(ap.graduation_year, "-06-01")))'));
            
        // Overall average days from profiles (fallback, capped at 5 years)
        $overallFromProfiles = DB::table('alumni_profiles')
            ->whereNotNull('graduation_year')
            ->whereNotNull('job_start_date')
            ->whereRaw('DATEDIFF(job_start_date, COALESCE(graduation_date, CONCAT(graduation_year, "-06-01"))) BETWEEN 0 AND 1825')
            ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                      ->from('employments')
                      ->whereColumn('employments.alumni_id', 'alumni_profiles.id');
            })
            ->when($yearFilter, function ($q) use ($yearFilter) {
                return $q->whereIn('graduation_year', $yearFilter);
            })
            ->when($campusId, function ($q) use ($campusId) {
                return $q->where('campus_id', $campusId);
            })
            ->avg(DB::raw('DATEDIFF(job_start_date, COALESCE(graduation_date, CONCAT(graduation_year, "-06-01")))'));
        
        // Weighted average
        $overallAvg = ($overallFromJobs ?? 0) ?: ($overallFromProfiles ?? 0);

        // Current year average
        $currentYear = date('Y');
        $currentYearFromJobs = DB::table('alumni_profiles as ap')
            ->join('employments as e', 'ap.id', '=', 'e.alumni_id')
            ->where('ap.graduation_year', $currentYear)
            ->whereNotNull('ap.graduation_year')
            ->whereNotNull('e.start_date')
            ->whereRaw('DATEDIFF(e.start_date, COALESCE(ap.graduation_date, CONCAT(ap.graduation_year, "-06-01"))) BETWEEN 0 AND 1825')
            ->avg(DB::raw('DATEDIFF(e.start_date, COALESCE(ap.graduation_date, CONCAT(ap.graduation_year, "-06-01")))'));
            
        $currentYearFromProfiles = DB::table('alumni_profiles')
            ->where('graduation_year', $currentYear)
            ->whereNotNull('graduation_year')
            ->whereNotNull('job_start_date')
            ->whereRaw('DATEDIFF(job_start_date, COALESCE(graduation_date, CONCAT(graduation_year, "-06-01"))) BETWEEN 0 AND 1825')
            ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                      ->from('employments')
                      ->whereColumn('employments.alumni_id', 'alumni_profiles.id');
            })
            ->avg(DB::raw('DATEDIFF(job_start_date, COALESCE(graduation_date, CONCAT(graduation_year, "-06-01")))'));
        
        $currentYearAvg = ($currentYearFromJobs ?? 0) ?: ($currentYearFromProfiles ?? 0);

        // Previous year for improvement calculation
        $previousYear = $currentYear - 1;
        $previousYearFromJobs = DB::table('alumni_profiles as ap')
            ->join('employments as e', 'ap.id', '=', 'e.alumni_id')
            ->where('ap.graduation_year', $previousYear)
            ->whereNotNull('ap.graduation_year')
            ->whereNotNull('e.start_date')
            ->whereRaw('DATEDIFF(e.start_date, COALESCE(ap.graduation_date, CONCAT(ap.graduation_year, "-06-01"))) BETWEEN 0 AND 1825')
            ->avg(DB::raw('DATEDIFF(e.start_date, COALESCE(ap.graduation_date, CONCAT(ap.graduation_year, "-06-01")))'));
            
        $previousYearFromProfiles = DB::table('alumni_profiles')
            ->where('graduation_year', $previousYear)
            ->whereNotNull('graduation_year')
            ->whereNotNull('job_start_date')
            ->whereRaw('DATEDIFF(job_start_date, COALESCE(graduation_date, CONCAT(graduation_year, "-06-01"))) BETWEEN 0 AND 1825')
            ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                      ->from('employments')
                      ->whereColumn('employments.alumni_id', 'alumni_profiles.id');
            })
            ->avg(DB::raw('DATEDIFF(job_start_date, COALESCE(graduation_date, CONCAT(graduation_year, "-06-01")))'));
        
        $previousYearAvg = ($previousYearFromJobs ?? 0) ?: ($previousYearFromProfiles ?? 0);

        // Calculate improvement rate (negative means faster employment, which is better)
        $improvementRate = 0;
        if ($previousYearAvg > 0) {
            $improvementRate = (($previousYearAvg - $currentYearAvg) / $previousYearAvg) * 100;
        }

        // Fastest employment program (from both sources)
        $fastestFromJobs = DB::table('alumni_profiles as ap')
            ->join('employments as e', 'ap.id', '=', 'e.alumni_id')
            ->select(
                'ap.degree_program as name',
                DB::raw('AVG(DATEDIFF(e.start_date, COALESCE(ap.graduation_date, CONCAT(ap.graduation_year, "-06-01")))) as avg_days')
            )
            ->whereNotNull('ap.graduation_year')
            ->whereNotNull('e.start_date')
            ->whereRaw('DATEDIFF(e.start_date, COALESCE(ap.graduation_date, CONCAT(ap.graduation_year, "-06-01"))) BETWEEN 0 AND 1825')
            ->groupBy('ap.degree_program')
            ->orderBy('avg_days')
            ->first();
            
        $fastestFromProfiles = DB::table('alumni_profiles')
            ->select(
                'degree_program as name',
                DB::raw('AVG(DATEDIFF(job_start_date, COALESCE(graduation_date, CONCAT(graduation_year, "-06-01")))) as avg_days')
            )
            ->whereNotNull('graduation_year')
            ->whereNotNull('job_start_date')
            ->whereRaw('DATEDIFF(job_start_date, COALESCE(graduation_date, CONCAT(graduation_year, "-06-01"))) BETWEEN 0 AND 1825')
            ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
            ->groupBy('degree_program')
            ->orderBy('avg_days')
            ->first();
        
        $fastestProgram = $fastestFromJobs ?? $fastestFromProfiles;

        // Total tracked alumni (from both sources)
        $totalFromJobs = DB::table('alumni_profiles as ap')
            ->join('employments as e', 'ap.id', '=', 'e.alumni_id')
            ->whereNotNull('ap.graduation_year')
            ->whereNotNull('e.start_date')
            ->count(DB::raw('DISTINCT ap.id'));
            
        $totalFromProfiles = DB::table('alumni_profiles')
            ->whereNotNull('graduation_year')
            ->whereNotNull('job_start_date')
            ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                      ->from('employments')
                      ->whereColumn('employments.alumni_id', 'alumni_profiles.id');
            })
            ->count();
        
        $totalTracked = $totalFromJobs + $totalFromProfiles;

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
     * Export comprehensive analytics to CSV (ALL data)
     */
    private function exportComprehensiveToCsv($data)
    {
        $filename = 'comprehensive-analytics-' . date('Y-m-d') . '.csv';
        
        $handle = fopen('php://temp', 'w+');
        
        // SECTION 1: Time to Job Analytics
        fputcsv($handle, ['=== TIME TO JOB ANALYTICS ===']);
        fputcsv($handle, ['Graduation Year', 'Avg Days to Job', 'Total Alumni', 'Employed Alumni', 'Employment Rate (%)', 'Median Days']);
        foreach ($data['time_to_job'] as $row) {
            fputcsv($handle, [
                $row['graduation_year'],
                $row['avg_days_to_job'],
                $row['total_alumni'],
                $row['employed_alumni'],
                $row['employment_rate'],
                $row['median_days']
            ]);
        }
        fputcsv($handle, []);
        
        // SECTION 2: Enrollment Metrics
        fputcsv($handle, ['=== ENROLLMENT METRICS ===']);
        fputcsv($handle, ['Summary']);
        fputcsv($handle, ['Total Enrolled', $data['enrollment_metrics']['summary']['total_enrolled']]);
        fputcsv($handle, ['Total Graduated', $data['enrollment_metrics']['summary']['total_graduated']]);
        fputcsv($handle, ['Total Dropout', $data['enrollment_metrics']['summary']['total_dropout']]);
        fputcsv($handle, ['Total Transferred', $data['enrollment_metrics']['summary']['total_transferred']]);
        fputcsv($handle, ['Graduation Rate (%)', $data['enrollment_metrics']['summary']['overall_graduation_rate']]);
        fputcsv($handle, []);
        fputcsv($handle, ['Year', 'Enrolled', 'Graduated', 'Employed', 'Dropout', 'Transferred', 'Graduation Rate (%)']);
        foreach ($data['enrollment_metrics']['yearly_breakdown'] as $row) {
            fputcsv($handle, [
                $row['year'],
                $row['enrolled'],
                $row['graduated'],
                $row['employed'],
                $row['dropout'],
                $row['transferred'],
                $row['graduation_rate']
            ]);
        }
        fputcsv($handle, []);
        
        // SECTION 3: Performance Indicator
        fputcsv($handle, ['=== PERFORMANCE INDICATOR (Employed Within 2 Years) ===']);
        fputcsv($handle, ['Total Graduates', $data['performance_indicator']['total_graduates']]);
        fputcsv($handle, ['Employed Within 2 Years', $data['performance_indicator']['employed_within_2_years']]);
        fputcsv($handle, ['Performance Rate (%)', $data['performance_indicator']['performance_rate']]);
        fputcsv($handle, []);
        fputcsv($handle, ['Year', 'Total Graduates', 'Total Employed', 'Employed Within 2 Years', 'Performance Rate (%)']);
        foreach ($data['performance_indicator']['yearly_breakdown'] as $row) {
            fputcsv($handle, [
                $row['year'],
                $row['total_graduates'],
                $row['total_employed'],
                $row['employed_within_2_years'],
                $row['performance_rate']
            ]);
        }
        fputcsv($handle, []);
        
        // SECTION 4: Job Alignment
        fputcsv($handle, ['=== JOB ALIGNMENT STATISTICS ===']);
        fputcsv($handle, ['Total Employed', $data['job_alignment']['total_employed']]);
        fputcsv($handle, ['Aligned', $data['job_alignment']['aligned']['count'] . ' (' . $data['job_alignment']['aligned']['percentage'] . '%)']);
        fputcsv($handle, ['Overqualified', $data['job_alignment']['overqualified']['count'] . ' (' . $data['job_alignment']['overqualified']['percentage'] . '%)']);
        fputcsv($handle, ['Underqualified', $data['job_alignment']['underqualified']['count'] . ' (' . $data['job_alignment']['underqualified']['percentage'] . '%)']);
        fputcsv($handle, ['Unfit', $data['job_alignment']['unfit']['count'] . ' (' . $data['job_alignment']['unfit']['percentage'] . '%)']);
        fputcsv($handle, ['Alignment Rate (%)', $data['job_alignment']['alignment_rate']]);
        fputcsv($handle, []);
        
        // SECTION 5: Attrition Rate
        fputcsv($handle, ['=== ATTRITION RATE ===']);
        fputcsv($handle, ['Total Enrolled', $data['attrition_rate']['summary']['total_enrolled']]);
        fputcsv($handle, ['Total Dropout', $data['attrition_rate']['summary']['total_dropout']]);
        fputcsv($handle, ['Total Transferred', $data['attrition_rate']['summary']['total_transferred']]);
        fputcsv($handle, ['Overall Attrition Rate (%)', $data['attrition_rate']['summary']['overall_attrition_rate']]);
        if (isset($data['attrition_rate']['summary']['data_note'])) {
            fputcsv($handle, ['Note', $data['attrition_rate']['summary']['data_note']]);
        }
        fputcsv($handle, []);
        fputcsv($handle, ['Year', 'Enrolled', 'Dropout', 'Transferred', 'Attrition Rate (%)']);
        foreach ($data['attrition_rate']['yearly_breakdown'] as $row) {
            fputcsv($handle, [
                $row['year'],
                $row['enrolled'],
                $row['dropout'],
                $row['transferred'],
                $row['attrition_rate']
            ]);
        }
        fputcsv($handle, []);
        
        // SECTION 6: Program Performance
        fputcsv($handle, ['=== PROGRAM-WISE PERFORMANCE ===']);
        fputcsv($handle, ['Program', 'Total Alumni', 'Employed', 'Employment Rate (%)', 'Aligned', 'Alignment Rate (%)', 'Avg Days to Job']);
        foreach ($data['program_performance'] as $row) {
            fputcsv($handle, [
                $row['program'],
                $row['total_alumni'],
                $row['employed'],
                $row['employment_rate'],
                $row['aligned'],
                $row['alignment_rate'],
                $row['avg_days_to_job']
            ]);
        }
        fputcsv($handle, []);
        
        // SECTION 7: College Breakdown
        fputcsv($handle, ['=== COLLEGE/DEPARTMENT BREAKDOWN ===']);
        fputcsv($handle, ['College', 'Code', 'Total Alumni', 'Employed', 'Aligned', 'Employment Rate (%)', 'Alignment Rate (%)']);
        foreach ($data['college_breakdown'] as $row) {
            fputcsv($handle, [
                $row['college'],
                $row['college_code'],
                $row['total_alumni'],
                $row['employed'],
                $row['aligned'],
                $row['employment_rate'],
                $row['alignment_rate']
            ]);
        }
        fputcsv($handle, []);
        
        // SECTION 8: Course Breakdown
        fputcsv($handle, ['=== COURSE BREAKDOWN ===']);
        fputcsv($handle, ['Course', 'Code', 'College', 'Total Alumni', 'Employed', 'Aligned', 'Employment Rate (%)', 'Alignment Rate (%)']);
        foreach ($data['course_breakdown'] as $row) {
            fputcsv($handle, [
                $row['course'],
                $row['course_code'],
                $row['college'],
                $row['total_alumni'],
                $row['employed'],
                $row['aligned'],
                $row['employment_rate'],
                $row['alignment_rate']
            ]);
        }
        fputcsv($handle, []);
        
        // SECTION 9: Employment Location
        fputcsv($handle, ['=== EMPLOYMENT LOCATION STATISTICS ===']);
        fputcsv($handle, ['Summary']);
        fputcsv($handle, ['Total Employed', $data['employment_location']['summary']['total_employed']]);
        fputcsv($handle, ['Local', $data['employment_location']['summary']['local'] . ' (' . $data['employment_location']['summary']['local_rate'] . '%)']);
        fputcsv($handle, ['Foreign', $data['employment_location']['summary']['foreign'] . ' (' . $data['employment_location']['summary']['foreign_rate'] . '%)']);
        fputcsv($handle, ['Remote', $data['employment_location']['summary']['remote'] . ' (' . $data['employment_location']['summary']['remote_rate'] . '%)']);
        fputcsv($handle, []);
        fputcsv($handle, ['Year', 'Local', 'Foreign', 'Remote', 'Total', 'Foreign Rate (%)']);
        foreach ($data['employment_location']['yearly_trend'] as $row) {
            fputcsv($handle, [
                $row['year'],
                $row['local'],
                $row['foreign'],
                $row['remote'],
                $row['total'],
                $row['foreign_rate']
            ]);
        }
        fputcsv($handle, []);
        fputcsv($handle, ['Department', 'Local', 'Foreign', 'Remote', 'Total']);
        foreach ($data['employment_location']['department_breakdown'] as $row) {
            fputcsv($handle, [
                $row['department'],
                $row['local'],
                $row['foreign'],
                $row['remote'],
                $row['total']
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
     * Export comprehensive analytics to Excel
     */
    private function exportComprehensiveToExcel($data)
    {
        $filename = 'comprehensive-analytics-' . date('Y-m-d') . '.xlsx';
        
        return $this->exportComprehensiveToCsv($data)
            ->header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    /**
     * Export comprehensive analytics to PDF
     */
    private function exportComprehensiveToPdf($data)
    {
        $filename = 'comprehensive-analytics-' . date('Y-m-d') . '.pdf';
        
        $content = "COMPREHENSIVE ANALYTICS REPORT\n";
        $content .= "Generated on: " . date('Y-m-d H:i:s') . "\n";
        $content .= str_repeat('=', 80) . "\n\n";
        
        // Time to Job
        $content .= "TIME TO JOB ANALYTICS\n" . str_repeat('-', 80) . "\n";
        foreach ($data['time_to_job'] as $row) {
            $content .= "Year {$row['graduation_year']}: {$row['avg_days_to_job']} days avg, {$row['employed_alumni']}/{$row['total_alumni']} employed ({$row['employment_rate']}%)\n";
        }
        $content .= "\n";
        
        // Enrollment
        $content .= "ENROLLMENT METRICS\n" . str_repeat('-', 80) . "\n";
        $content .= "Total Enrolled: {$data['enrollment_metrics']['summary']['total_enrolled']}\n";
        $content .= "Total Graduated: {$data['enrollment_metrics']['summary']['total_graduated']}\n";
        $content .= "Graduation Rate: {$data['enrollment_metrics']['summary']['overall_graduation_rate']}%\n\n";
        
        // Performance
        $content .= "PERFORMANCE INDICATOR\n" . str_repeat('-', 80) . "\n";
        $content .= "Employed Within 2 Years: {$data['performance_indicator']['employed_within_2_years']}/{$data['performance_indicator']['total_graduates']}\n";
        $content .= "Performance Rate: {$data['performance_indicator']['performance_rate']}%\n\n";
        
        // Job Alignment
        $content .= "JOB ALIGNMENT\n" . str_repeat('-', 80) . "\n";
        $content .= "Aligned: {$data['job_alignment']['aligned']['count']} ({$data['job_alignment']['aligned']['percentage']}%)\n";
        $content .= "Overqualified: {$data['job_alignment']['overqualified']['count']} ({$data['job_alignment']['overqualified']['percentage']}%)\n";
        $content .= "Underqualified: {$data['job_alignment']['underqualified']['count']} ({$data['job_alignment']['underqualified']['percentage']}%)\n";
        $content .= "Unfit: {$data['job_alignment']['unfit']['count']} ({$data['job_alignment']['unfit']['percentage']}%)\n\n";
        
        // Program Performance
        $content .= "PROGRAM-WISE PERFORMANCE (Top Programs)\n" . str_repeat('-', 80) . "\n";
        foreach (array_slice($data['program_performance'], 0, 10) as $row) {
            $content .= "{$row['program']}: {$row['employed']}/{$row['total_alumni']} employed ({$row['employment_rate']}%), {$row['avg_days_to_job']} days avg\n";
        }
        $content .= "\n";
        
        // Employment Location
        $content .= "EMPLOYMENT LOCATION\n" . str_repeat('-', 80) . "\n";
        $content .= "Local: {$data['employment_location']['summary']['local']} ({$data['employment_location']['summary']['local_rate']}%)\n";
        $content .= "Foreign: {$data['employment_location']['summary']['foreign']} ({$data['employment_location']['summary']['foreign_rate']}%)\n";
        $content .= "Remote: {$data['employment_location']['summary']['remote']} ({$data['employment_location']['summary']['remote_rate']}%)\n";
        
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
            $avgCompletionTime = 0;
            try {
                $avgCompletionTime = DB::table('survey_responses')
                    ->where('survey_id', $surveyId)
                    ->whereNotNull('completed_at')
                    ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, created_at, completed_at)) as avg_time')
                    ->when($days !== 'all', function ($query) use ($days) {
                        return $query->where('created_at', '>=', Carbon::now()->subDays((int) $days));
                    })
                    ->value('avg_time') ?? 0;
            } catch (\Exception $e) {
                // If time calculation fails, default to 0
                $avgCompletionTime = 0;
            }

            // Response rate by date
            $responsesByDate = [];
            try {
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
            } catch (\Exception $e) {
                $responsesByDate = [];
            }

            // Employment status distribution (if available)
            $employmentDistribution = [];
            try {
                $employmentQuestion = DB::table('survey_questions')
                    ->where('survey_id', $surveyId)
                    ->where(function ($query) {
                        $query->where('question_text', 'LIKE', '%employment status%')
                              ->orWhere('question_text', 'LIKE', '%current employment%')
                              ->orWhere('question_text', 'LIKE', '%work status%')
                              ->orWhere('question_text', 'LIKE', '%job status%')
                              ->orWhere('question_text', 'LIKE', '%employment situation%');
                    })
                    ->first();

                if ($employmentQuestion) {
                    $employmentData = DB::table('survey_answers')
                        ->join('survey_responses', 'survey_answers.survey_response_id', '=', 'survey_responses.id')
                        ->where('survey_answers.survey_question_id', $employmentQuestion->id)
                        ->where('survey_responses.survey_id', $surveyId)
                        ->when($days !== 'all', function ($query) use ($days) {
                            return $query->where('survey_responses.created_at', '>=', Carbon::now()->subDays((int) $days));
                        })
                        ->whereNotNull('survey_answers.answer_text')
                        ->where('survey_answers.answer_text', '!=', '')
                        ->where('survey_answers.answer_text', '!=', 'N/A')
                        ->select('survey_answers.answer_text')
                        ->get();

                    if ($employmentData->count() > 0) {
                        $statusCounts = $employmentData->groupBy('answer_text');
                        $total = $employmentData->count();
                        
                        foreach ($statusCounts as $status => $answers) {
                            $count = $answers->count();
                            $employmentDistribution[] = [
                                'status' => $status ?: 'Not Specified',
                                'count' => $count,
                                'percentage' => round(($count / $total) * 100, 1)
                            ];
                        }
                        
                        // Sort by count descending
                        usort($employmentDistribution, function($a, $b) {
                            return $b['count'] <=> $a['count'];
                        });
                    }
                }
            } catch (\Exception $e) {
                // If employment distribution fails, continue without it
                $employmentDistribution = [];
            }

            // Question analytics - Simplified approach
            $questionAnalytics = [];
            try {
                $questions = DB::table('survey_questions')
                    ->where('survey_id', $surveyId)
                    ->select('id', 'question_text', 'question_type', 'order')
                    ->orderBy('order')
                    ->get();

                foreach ($questions as $question) {
                    // Count answers for this question
                    $answersQuery = DB::table('survey_answers')
                        ->join('survey_responses', 'survey_answers.survey_response_id', '=', 'survey_responses.id')
                        ->where('survey_answers.survey_question_id', $question->id)
                        ->where('survey_responses.survey_id', $surveyId);
                    
                    if ($days !== 'all') {
                        $answersQuery->where('survey_responses.created_at', '>=', Carbon::now()->subDays((int) $days));
                    }
                    
                    $totalAnswers = $answersQuery->count();
                    $skippedCount = $totalResponses - $totalAnswers;
                    $skipRate = $totalResponses > 0 ? (($skippedCount / $totalResponses) * 100) : 0;
                    
                    $questionAnalytics[] = [
                        'question_id' => $question->id,
                        'question_text' => $question->question_text,
                        'question_type' => $question->question_type,
                        'total_responses' => (int) $totalAnswers,
                        'skip_rate' => round($skipRate, 1),
                        'response_distribution' => []
                    ];
                }
            } catch (\Exception $e) {
                // If question analytics fails, continue with empty array
                $questionAnalytics = [];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'survey' => [
                        'id' => $survey->id,
                        'title' => $survey->title,
                        'description' => $survey->description ?? '',
                        'status' => $survey->status,
                        'created_at' => $survey->created_at,
                        'responses_count' => $totalResponses,
                        'completion_rate' => round($completionRate, 1),
                        'avg_completion_time' => round($avgCompletionTime, 1),
                        'target_audience' => !empty($survey->target_audience) ? json_decode($survey->target_audience, true) : []
                    ],
                    'total_responses' => (int) $totalResponses,
                    'completion_rate' => round($completionRate, 1),
                    'avg_completion_time' => round($avgCompletionTime, 1),
                    'response_rate_by_date' => $responsesByDate,
                    'completion_rate_by_batch' => [],
                    'employment_status_distribution' => $employmentDistribution,
                    'question_analytics' => $questionAnalytics,
                    'demographic_insights' => []
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Survey Analytics Error', [
                'survey_id' => $surveyId,
                'days' => $request->get('days', 30),
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch survey analytics',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while fetching analytics'
            ], 500);
        }
    }

    /**
     * Get individual survey responses with their answers
     */
    public function getSurveyResponses(Request $request, $surveyId): JsonResponse
    {
        try {
            $days = $request->get('days', 'all');
            $page = $request->get('page', 1);
            $perPage = $request->get('per_page', 20);
            $search = $request->get('search', '');
            $withAnswersOnly = $request->get('with_answers', 'false') === 'true';
            $statusFilter = $request->get('status', 'all'); // all, completed, in_progress
            
            // Get survey details
            $survey = DB::table('surveys')->where('id', $surveyId)->first();
            if (!$survey) {
                return response()->json([
                    'success' => false,
                    'message' => 'Survey not found'
                ], 404);
            }

            // Get questions for this survey
            $questions = DB::table('survey_questions')
                ->where('survey_id', $surveyId)
                ->orderBy('order')
                ->get();

            // Build response query
            $responseQuery = DB::table('survey_responses')
                ->where('survey_id', $surveyId);
            
            // Apply date filter
            if ($days !== 'all') {
                $responseQuery->where('created_at', '>=', Carbon::now()->subDays((int) $days));
            }
            
            // Apply status filter
            if ($statusFilter !== 'all') {
                $responseQuery->where('status', $statusFilter);
            }
            
            // Apply "with answers only" filter
            if ($withAnswersOnly) {
                $responseQuery->whereIn('id', function ($subQuery) {
                    $subQuery->select('survey_response_id')
                        ->from('survey_answers')
                        ->distinct();
                });
            }
            
            // Apply search filter (search in answers)
            if ($search) {
                $responseQuery->where(function ($q) use ($search) {
                    $q->where('respondent_name', 'LIKE', "%{$search}%")
                      ->orWhere('respondent_email', 'LIKE', "%{$search}%")
                      ->orWhereIn('id', function ($subQuery) use ($search) {
                          $subQuery->select('survey_response_id')
                              ->from('survey_answers')
                              ->where('answer_text', 'LIKE', "%{$search}%");
                      });
                });
            }

            // Get total count
            $totalResponses = $responseQuery->count();
            
            // Get paginated responses
            $responses = $responseQuery
                ->orderBy('created_at', 'desc')
                ->offset(($page - 1) * $perPage)
                ->limit($perPage)
                ->get();

            // Get answers for these responses
            $responseIds = $responses->pluck('id')->toArray();
            $allAnswers = DB::table('survey_answers')
                ->whereIn('survey_response_id', $responseIds)
                ->get()
                ->groupBy('survey_response_id');

            // Build response data with answers
            $responseData = $responses->map(function ($response) use ($questions, $allAnswers) {
                $answers = $allAnswers->get($response->id, collect());
                
                // Build answers array keyed by question_id
                $answersMap = [];
                foreach ($answers as $answer) {
                    $answersMap[$answer->survey_question_id] = [
                        'answer_text' => $answer->answer_text,
                        'answer_json' => $answer->answer_json ? json_decode($answer->answer_json, true) : null,
                        'answered_at' => $answer->answered_at,
                    ];
                }

                // Get respondent name from first/last name answers if not set
                $respondentName = $response->respondent_name;
                if (!$respondentName) {
                    $firstName = '';
                    $lastName = '';
                    foreach ($questions as $q) {
                        if (stripos($q->question_text, 'first name') !== false && isset($answersMap[$q->id])) {
                            $firstName = $answersMap[$q->id]['answer_text'] ?? '';
                        }
                        if (stripos($q->question_text, 'last name') !== false && isset($answersMap[$q->id])) {
                            $lastName = $answersMap[$q->id]['answer_text'] ?? '';
                        }
                    }
                    $respondentName = trim($firstName . ' ' . $lastName) ?: 'Anonymous';
                }

                // Get email from answers if not set
                $respondentEmail = $response->respondent_email;
                if (!$respondentEmail) {
                    foreach ($questions as $q) {
                        if (stripos($q->question_text, 'email') !== false && isset($answersMap[$q->id])) {
                            $respondentEmail = $answersMap[$q->id]['answer_text'] ?? '';
                            break;
                        }
                    }
                }

                return [
                    'id' => $response->id,
                    'respondent_name' => $respondentName,
                    'respondent_email' => $respondentEmail ?: 'N/A',
                    'status' => $response->status,
                    'started_at' => $response->started_at ?? $response->created_at,
                    'completed_at' => $response->completed_at,
                    'created_at' => $response->created_at,
                    'answers' => $answersMap,
                    'answered_count' => count($answersMap),
                    'total_questions' => count($questions),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'survey' => [
                        'id' => $survey->id,
                        'title' => $survey->title,
                    ],
                    'questions' => $questions->map(function ($q) {
                        return [
                            'id' => $q->id,
                            'question_text' => $q->question_text,
                            'question_type' => $q->question_type,
                            'order' => $q->order,
                        ];
                    }),
                    'responses' => $responseData,
                    'pagination' => [
                        'current_page' => (int) $page,
                        'per_page' => (int) $perPage,
                        'total' => $totalResponses,
                        'last_page' => ceil($totalResponses / $perPage),
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Survey Responses Error', [
                'survey_id' => $surveyId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch survey responses',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
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
        
        // Employment Status Distribution
        if (!empty($data['employment_status_distribution'])) {
            fputcsv($handle, ['Employment Status Distribution']);
            fputcsv($handle, ['Status', 'Count', 'Percentage (%)']);
            foreach ($data['employment_status_distribution'] as $statusData) {
                fputcsv($handle, [
                    $statusData['status'],
                    $statusData['count'],
                    $statusData['percentage']
                ]);
            }
            fputcsv($handle, []);
        }
        
        // Question Analytics
        if (!empty($data['question_analytics'])) {
            fputcsv($handle, ['Question Analytics']);
            fputcsv($handle, ['Question', 'Type', 'Total Responses', 'Skip Rate (%)']);
            foreach ($data['question_analytics'] as $question) {
                fputcsv($handle, [
                    $question['question_text'],
                    $question['question_type'],
                    $question['total_responses'],
                    $question['skip_rate']
                ]);
            }
        }
        
        rewind($handle);
        $content = stream_get_contents($handle);
        fclose($handle);
        
        return $content;
    }

    /**
     * Export analytics for all surveys
     */
    public function exportAllSurveys(Request $request)
    {
        try {
            $days = $request->get('days', 30);
            
            // Get all surveys
            $surveys = Survey::with(['responses' => function ($query) use ($days) {
                $query->where('submitted_at', '>=', now()->subDays($days));
            }])
            ->orderBy('created_at', 'desc')
            ->get();
            
            $filename = 'all_surveys_analytics_' . date('Y-m-d') . '.xlsx';
            
            $content = $this->generateAllSurveysExcel($surveys, $days);
            
            return response($content)
                ->header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to export all surveys analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate Excel content for all surveys
     */
    private function generateAllSurveysExcel($surveys, $days): string
    {
        $handle = fopen('php://temp', 'w+');
        
        // Header
        fputcsv($handle, ['All Surveys Analytics Report']);
        fputcsv($handle, ['Generated on:', date('Y-m-d H:i:s')]);
        fputcsv($handle, ['Period:', "Last {$days} days"]);
        fputcsv($handle, []);
        
        // Summary
        fputcsv($handle, ['Summary']);
        fputcsv($handle, ['Total Surveys:', $surveys->count()]);
        fputcsv($handle, ['Total Responses:', $surveys->sum(fn($s) => $s->responses->count())]);
        fputcsv($handle, []);
        
        // Individual Survey Details
        fputcsv($handle, ['Survey Details']);
        fputcsv($handle, ['Survey Title', 'Status', 'Created Date', 'Total Responses', 'Completion Rate (%)', 'Avg Time (min)']);
        
        foreach ($surveys as $survey) {
            $totalResponses = $survey->responses->count();
            $completedResponses = $survey->responses->whereNotNull('submitted_at')->count();
            $completionRate = $totalResponses > 0 ? round(($completedResponses / $totalResponses) * 100, 1) : 0;
            
            // Calculate average completion time
            $avgTime = $survey->responses->whereNotNull('submitted_at')
                ->map(function ($response) {
                    if ($response->submitted_at && $response->started_at) {
                        return \Carbon\Carbon::parse($response->started_at)
                            ->diffInMinutes(\Carbon\Carbon::parse($response->submitted_at));
                    }
                    return null;
                })
                ->filter()
                ->avg();
            
            fputcsv($handle, [
                $survey->title,
                ucfirst($survey->status),
                $survey->created_at->format('Y-m-d'),
                $totalResponses,
                $completionRate,
                $avgTime ? round($avgTime, 1) : 'N/A'
            ]);
        }
        
        fputcsv($handle, []);
        
        // Detailed breakdown by survey
        foreach ($surveys as $survey) {
            fputcsv($handle, []);
            fputcsv($handle, ['=== ' . $survey->title . ' ===']);
            fputcsv($handle, ['Description:', $survey->description]);
            fputcsv($handle, ['Status:', ucfirst($survey->status)]);
            fputcsv($handle, ['Total Questions:', $survey->questions->count()]);
            fputcsv($handle, ['Total Responses:', $survey->responses->count()]);
            fputcsv($handle, []);
            
            // Response dates
            if ($survey->responses->count() > 0) {
                fputcsv($handle, ['Responses by Date']);
                $responsesByDate = $survey->responses
                    ->groupBy(fn($r) => \Carbon\Carbon::parse($r->submitted_at)->format('Y-m-d'))
                    ->map(fn($group) => $group->count())
                    ->sortKeys();
                
                fputcsv($handle, ['Date', 'Count']);
                foreach ($responsesByDate as $date => $count) {
                    fputcsv($handle, [$date, $count]);
                }
            }
            
            fputcsv($handle, []);
        }
        
        rewind($handle);
        $content = stream_get_contents($handle);
        fclose($handle);
        
        return $content;
    }

    /**
     * Get job mismatch statistics (Overqualified/Unfit)
     * Uses employments table for job history, falls back to alumni_profiles status
     */
    private function getJobMismatchStatistics($yearFilter = null, $campusId = null): array
    {
        // Get employed alumni from employments table (with current jobs)
        $employedQuery = DB::table('alumni_profiles as ap')
            ->join('employments as e', 'ap.id', '=', 'e.alumni_id')
            ->where('e.is_current', true);
            
        if ($yearFilter) {
            $employedQuery->whereIn('ap.graduation_year', $yearFilter);
        }
        if ($campusId) {
            $employedQuery->where('ap.campus_id', $campusId);
        }
        
        $totalEmployedFromJobs = $employedQuery->count();
        
        // Get alumni with employment status but no job records
        $employedFromStatusQuery = DB::table('alumni_profiles')
            ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                      ->from('employments')
                      ->whereColumn('employments.alumni_id', 'alumni_profiles.id')
                      ->where('employments.is_current', true);
            });
            
        if ($yearFilter) {
            $employedFromStatusQuery->whereIn('graduation_year', $yearFilter);
        }
        if ($campusId) {
            $employedFromStatusQuery->where('campus_id', $campusId);
        }
        
        $totalEmployedFromStatus = $employedFromStatusQuery->count();
        $totalEmployed = $totalEmployedFromJobs + $totalEmployedFromStatus;
        
        // Job mismatch breakdown (from employments table with job_mismatch_reason)
        $mismatchBreakdownFromJobs = DB::table('alumni_profiles as ap')
            ->join('employments as e', 'ap.id', '=', 'e.alumni_id')
            ->select('ap.job_mismatch_reason', DB::raw('COUNT(*) as count'))
            ->where('e.is_current', true)
            ->whereNotNull('ap.job_mismatch_reason')
            ->when($yearFilter, function ($q) use ($yearFilter) {
                return $q->whereIn('ap.graduation_year', $yearFilter);
            })
            ->when($campusId, function ($q) use ($campusId) {
                return $q->where('ap.campus_id', $campusId);
            })
            ->groupBy('ap.job_mismatch_reason')
            ->get();
            
        // Job mismatch from profiles without employment records
        $mismatchBreakdownFromStatus = DB::table('alumni_profiles')
            ->select('job_mismatch_reason', DB::raw('COUNT(*) as count'))
            ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
            ->whereNotNull('job_mismatch_reason')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                      ->from('employments')
                      ->whereColumn('employments.alumni_id', 'alumni_profiles.id')
                      ->where('employments.is_current', true);
            })
            ->when($yearFilter, function ($q) use ($yearFilter) {
                return $q->whereIn('graduation_year', $yearFilter);
            })
            ->when($campusId, function ($q) use ($campusId) {
                return $q->where('campus_id', $campusId);
            })
            ->groupBy('job_mismatch_reason')
            ->get();
        
        // Combine both sources
        $mismatchCombined = collect($mismatchBreakdownFromJobs)
            ->concat($mismatchBreakdownFromStatus)
            ->groupBy('job_mismatch_reason')
            ->map(function ($group) {
                return $group->sum('count');
            });
        
        $mismatchBreakdown = $mismatchCombined->mapWithKeys(function ($count, $reason) use ($totalEmployed) {
            return [
                $reason => [
                    'count' => (int) $count,
                    'percentage' => $totalEmployed > 0 ? round(($count / $totalEmployed) * 100, 1) : 0
                ]
            ];
        })->toArray();
        
        // Unemployment reasons breakdown
        $unemploymentReasons = DB::table('alumni_profiles')
            ->select('unemployment_reason', DB::raw('COUNT(*) as count'))
            ->whereIn('employment_status', ['unemployed_seeking', 'unemployed_not_seeking'])
            ->whereNotNull('unemployment_reason')
            ->when($yearFilter, function ($q) use ($yearFilter) {
                return $q->whereIn('graduation_year', $yearFilter);
            })
            ->groupBy('unemployment_reason')
            ->get()
            ->mapWithKeys(function ($item) {
                return [
                    $item->unemployment_reason => (int) $item->count
                ];
            })
            ->toArray();
        
        // Job satisfaction average (from profiles with current employment)
        $avgJobSatisfactionFromJobs = DB::table('alumni_profiles as ap')
            ->join('employments as e', 'ap.id', '=', 'e.alumni_id')
            ->where('e.is_current', true)
            ->whereNotNull('ap.job_satisfaction')
            ->when($yearFilter, function ($q) use ($yearFilter) {
                return $q->whereIn('ap.graduation_year', $yearFilter);
            })
            ->avg('ap.job_satisfaction');
            
        $avgJobSatisfactionFromStatus = DB::table('alumni_profiles')
            ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
            ->whereNotNull('job_satisfaction')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                      ->from('employments')
                      ->whereColumn('employments.alumni_id', 'alumni_profiles.id')
                      ->where('employments.is_current', true);
            })
            ->when($yearFilter, function ($q) use ($yearFilter) {
                return $q->whereIn('graduation_year', $yearFilter);
            })
            ->avg('job_satisfaction');
        
        // Weighted average
        $avgJobSatisfaction = 0;
        if ($totalEmployedFromJobs > 0 && $totalEmployedFromStatus > 0) {
            $avgJobSatisfaction = (($avgJobSatisfactionFromJobs ?? 0) * $totalEmployedFromJobs + 
                                   ($avgJobSatisfactionFromStatus ?? 0) * $totalEmployedFromStatus) / 
                                  $totalEmployed;
        } elseif ($totalEmployedFromJobs > 0) {
            $avgJobSatisfaction = $avgJobSatisfactionFromJobs ?? 0;
        } elseif ($totalEmployedFromStatus > 0) {
            $avgJobSatisfaction = $avgJobSatisfactionFromStatus ?? 0;
        }
        
        // Job-related to degree statistics (from employments + profiles)
        $jobRelatedFromJobs = DB::table('alumni_profiles as ap')
            ->join('employments as e', 'ap.id', '=', 'e.alumni_id')
            ->select(
                DB::raw('SUM(CASE WHEN ap.job_related_to_degree = 1 THEN 1 ELSE 0 END) as related_count'),
                DB::raw('SUM(CASE WHEN ap.job_related_to_degree = 0 THEN 1 ELSE 0 END) as unrelated_count')
            )
            ->where('e.is_current', true)
            ->whereNotNull('ap.job_related_to_degree')
            ->when($yearFilter, function ($q) use ($yearFilter) {
                return $q->whereIn('ap.graduation_year', $yearFilter);
            })
            ->first();
            
        $jobRelatedFromStatus = DB::table('alumni_profiles')
            ->select(
                DB::raw('SUM(CASE WHEN job_related_to_degree = 1 THEN 1 ELSE 0 END) as related_count'),
                DB::raw('SUM(CASE WHEN job_related_to_degree = 0 THEN 1 ELSE 0 END) as unrelated_count')
            )
            ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
            ->whereNotNull('job_related_to_degree')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                      ->from('employments')
                      ->whereColumn('employments.alumni_id', 'alumni_profiles.id')
                      ->where('employments.is_current', true);
            })
            ->when($yearFilter, function ($q) use ($yearFilter) {
                return $q->whereIn('graduation_year', $yearFilter);
            })
            ->first();
        
        $relatedCount = ($jobRelatedFromJobs->related_count ?? 0) + ($jobRelatedFromStatus->related_count ?? 0);
        $unrelatedCount = ($jobRelatedFromJobs->unrelated_count ?? 0) + ($jobRelatedFromStatus->unrelated_count ?? 0);
        $totalWithData = $relatedCount + $unrelatedCount;
        
        return [
            'total_employed' => (int) $totalEmployed,
            'employed_with_jobs' => (int) $totalEmployedFromJobs,
            'employed_from_status' => (int) $totalEmployedFromStatus,
            'job_mismatch_breakdown' => $mismatchBreakdown,
            'overqualified_count' => $mismatchBreakdown['overqualified']['count'] ?? 0,
            'overqualified_percentage' => $mismatchBreakdown['overqualified']['percentage'] ?? 0,
            'unfit_count' => $mismatchBreakdown['unfit']['count'] ?? 0,
            'unfit_percentage' => $mismatchBreakdown['unfit']['percentage'] ?? 0,
            'underqualified_count' => $mismatchBreakdown['underqualified']['count'] ?? 0,
            'underqualified_percentage' => $mismatchBreakdown['underqualified']['percentage'] ?? 0,
            'good_match_count' => ($mismatchBreakdown['none']['count'] ?? 0) + ($mismatchBreakdown[null]['count'] ?? 0) + ($mismatchBreakdown['']['count'] ?? 0),
            'good_match_percentage' => $totalEmployed > 0 ? round(((($mismatchBreakdown['none']['count'] ?? 0) + ($mismatchBreakdown[null]['count'] ?? 0) + ($mismatchBreakdown['']['count'] ?? 0)) / $totalEmployed) * 100, 1) : 0,
            'unemployment_reasons' => $unemploymentReasons,
            'avg_job_satisfaction' => round((float) $avgJobSatisfaction, 1),
            'job_related_to_degree' => [
                'related_count' => (int) $relatedCount,
                'unrelated_count' => (int) $unrelatedCount,
                'related_percentage' => $totalWithData > 0 ? round(($relatedCount / $totalWithData) * 100, 1) : 0,
                'unrelated_percentage' => $totalWithData > 0 ? round(($unrelatedCount / $totalWithData) * 100, 1) : 0
            ]
        ];
    }

    /**
     * Get comprehensive analytics including new metrics
     * - Enrollment vs Graduation
     * - Attrition Rate
     * - Job Alignment
     * - Performance Indicator (employed within 2 years)
     */
    public function getComprehensiveAnalytics(Request $request): JsonResponse
    {
        try {
            $campusId = $request->get('campus_id');

            // Get enrollment metrics from batches
            $enrollmentMetrics = $this->getEnrollmentMetrics($campusId);
            
            // Get performance indicator (employed within 2 years)
            $performanceIndicator = $this->getPerformanceIndicator($campusId);
            
            // Get job alignment statistics (from job classifier)
            $jobAlignmentStats = $this->getJobAlignmentStats($campusId);
            
            // Get attrition rate
            $attritionRate = $this->getAttritionRate($campusId);
            
            // Get program-wise performance
            $programPerformance = $this->getProgramWisePerformance($campusId);
            
            // Get college-level enrollment/attrition breakdown
            $collegeBreakdown = $this->getCollegeEnrollmentBreakdown($campusId);
            
            // Get course-level enrollment/attrition breakdown
            $courseBreakdown = $this->getCourseEnrollmentBreakdown($campusId);

            // Get employment location breakdown (local/foreign/remote)
            $employmentLocationStats = $this->getEmploymentLocationStats($campusId);

            return response()->json([
                'success' => true,
                'data' => [
                    'enrollment_metrics' => $enrollmentMetrics,
                    'performance_indicator' => $performanceIndicator,
                    'job_alignment' => $jobAlignmentStats,
                    'attrition_rate' => $attritionRate,
                    'program_performance' => $programPerformance,
                    'college_breakdown' => $collegeBreakdown,
                    'course_breakdown' => $courseBreakdown,
                    'employment_location' => $employmentLocationStats,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch comprehensive analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get enrollment vs graduation metrics from batches
     * Groups by year only (not by batch name) for chart display
     * Derives graduated counts from alumni_profiles, uses batch enrollment data if available
     */
    private function getEnrollmentMetrics($campusId = null): array
    {
        // Get actual alumni counts by graduation year from alumni_profiles
        $alumniByYear = DB::table('alumni_profiles')
            ->select(
                'graduation_year',
                DB::raw('COUNT(*) as graduated'),
                DB::raw('SUM(CASE WHEN employment_status IN ("employed_full_time", "employed_part_time", "self_employed") THEN 1 ELSE 0 END) as employed')
            )
            ->whereNotNull('graduation_year')
            ->when($campusId, function ($q) use ($campusId) {
                return $q->where('campus_id', $campusId);
            })
            ->groupBy('graduation_year')
            ->orderBy('graduation_year', 'desc')
            ->limit(10)
            ->get()
            ->keyBy('graduation_year');

        // Get batch enrollment data if available (manual entry)
        $batchEnrollment = DB::table('batches')
            ->select(
                'graduation_year',
                DB::raw('SUM(COALESCE(initial_enrollment, 0)) as enrolled'),
                DB::raw('SUM(COALESCE(dropout_count, 0)) as dropout'),
                DB::raw('SUM(COALESCE(transferred_count, 0)) as transferred')
            )
            ->where('status', 'active')
            ->whereNotNull('graduation_year')
            ->when($campusId, function ($q) use ($campusId) {
                return $q->where('campus_id', $campusId);
            })
            ->groupBy('graduation_year')
            ->get()
            ->keyBy('graduation_year');

        // Merge: prefer batch enrollment if > 0, otherwise estimate from alumni count
        $allYears = $alumniByYear->keys()->merge($batchEnrollment->keys())->unique()->sortDesc()->take(10);

        $yearlyBreakdown = $allYears->map(function ($year) use ($alumniByYear, $batchEnrollment) {
            $alumni = $alumniByYear->get($year);
            $batch = $batchEnrollment->get($year);

            $graduated = $alumni ? (int) $alumni->graduated : 0;
            $employed = $alumni ? (int) $alumni->employed : 0;
            $enrolled = ($batch && $batch->enrolled > 0) ? (int) $batch->enrolled : $graduated;
            $dropout = ($batch && $batch->dropout > 0) ? (int) $batch->dropout : 0;
            $transferred = ($batch && $batch->transferred > 0) ? (int) $batch->transferred : 0;

            return [
                'year' => $year,
                'enrolled' => $enrolled,
                'graduated' => $graduated,
                'employed' => $employed,
                'dropout' => $dropout,
                'transferred' => $transferred,
                'graduation_rate' => $enrolled > 0 ? round(($graduated / $enrolled) * 100, 1) : 0,
            ];
        })->values()->toArray();

        // Summary totals
        $totalGraduated = $alumniByYear->sum('graduated');
        $totalEmployed = $alumniByYear->sum('employed');
        $totalEnrolled = $batchEnrollment->sum('enrolled');
        if ($totalEnrolled == 0) $totalEnrolled = $totalGraduated; // fallback
        $totalDropout = $batchEnrollment->sum('dropout');
        $totalTransferred = $batchEnrollment->sum('transferred');

        return [
            'yearly_breakdown' => $yearlyBreakdown,
            'summary' => [
                'total_enrolled' => (int) $totalEnrolled,
                'total_graduated' => (int) $totalGraduated,
                'total_dropout' => (int) $totalDropout,
                'total_transferred' => (int) $totalTransferred,
                'overall_graduation_rate' => $totalEnrolled > 0 ? round(($totalGraduated / $totalEnrolled) * 100, 1) : 0,
            ]
        ];
    }

    /**
     * Get performance indicator - percentage employed within 2 years
     */
    private function getPerformanceIndicator($campusId = null): array
    {
        // Get alumni with graduation date and job start date — employed within 2 years
        $employedWithin2Years = DB::table('alumni_profiles')
            ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
            ->whereNotNull('job_start_date')
            ->whereNotNull('graduation_year')
            ->when($campusId, function ($q) use ($campusId) {
                return $q->where('campus_id', $campusId);
            })
            ->whereRaw('DATEDIFF(job_start_date, COALESCE(graduation_date, CONCAT(graduation_year, "-06-01"))) BETWEEN 0 AND 730') // 2 years = 730 days
            ->count();

        // Count all employed alumni who have graduation data
        $totalEmployedWithGradData = DB::table('alumni_profiles')
            ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
            ->whereNotNull('graduation_year')
            ->when($campusId, function ($q) use ($campusId) {
                return $q->where('campus_id', $campusId);
            })
            ->count();

        // Total graduates (all alumni profiles)
        $totalGraduates = DB::table('alumni_profiles')
            ->whereNotNull('graduation_year')
            ->when($campusId, function ($q) use ($campusId) {
                return $q->where('campus_id', $campusId);
            })
            ->count();

        // Calculate performance by year
        $yearlyPerformance = DB::table('alumni_profiles')
            ->select(
                'graduation_year',
                DB::raw('COUNT(*) as total_graduates'),
                DB::raw('SUM(CASE WHEN employment_status IN ("employed_full_time", "employed_part_time", "self_employed") THEN 1 ELSE 0 END) as total_employed'),
                DB::raw('SUM(CASE WHEN employment_status IN ("employed_full_time", "employed_part_time", "self_employed") AND job_start_date IS NOT NULL AND DATEDIFF(job_start_date, COALESCE(graduation_date, CONCAT(graduation_year, "-06-01"))) BETWEEN 0 AND 730 THEN 1 ELSE 0 END) as employed_within_2_years')
            )
            ->whereNotNull('graduation_year')
            ->when($campusId, function ($q) use ($campusId) {
                return $q->where('campus_id', $campusId);
            })
            ->groupBy('graduation_year')
            ->orderBy('graduation_year', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                $employed = (int) $item->total_employed;
                return [
                    'year' => $item->graduation_year,
                    'total_graduates' => (int) $item->total_graduates,
                    'total_employed' => $employed,
                    'employed_within_2_years' => (int) $item->employed_within_2_years,
                    'performance_rate' => $item->total_graduates > 0 
                        ? round(($item->employed_within_2_years / $item->total_graduates) * 100, 1) 
                        : 0,
                ];
            });

        // Performance rate = % of ALL graduates who found jobs within 2 years
        $performanceRate = $totalGraduates > 0 
            ? round(($employedWithin2Years / $totalGraduates) * 100, 1) 
            : 0;

        return [
            'employed_within_2_years' => (int) $employedWithin2Years,
            'total_employed_with_data' => (int) $totalEmployedWithGradData,
            'total_graduates' => (int) $totalGraduates,
            'performance_rate' => $performanceRate,
            'yearly_breakdown' => $yearlyPerformance->toArray(),
        ];
    }

    /**
     * Get job alignment statistics from job mismatch classifications
     */
    private function getJobAlignmentStats($campusId = null): array
    {
        $stats = DB::table('alumni_profiles')
            ->select(
                'job_mismatch_reason',
                DB::raw('COUNT(*) as count')
            )
            ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
            ->when($campusId, function ($q) use ($campusId) {
                return $q->where('campus_id', $campusId);
            })
            ->groupBy('job_mismatch_reason')
            ->get();

        $total = $stats->sum('count');
        // NULL or 'none' job_mismatch_reason means the job is a good match (aligned)
        $nullCount = $stats->whereNull('job_mismatch_reason')->first()->count ?? 0;
        $noneCount = $stats->where('job_mismatch_reason', 'none')->first()->count ?? 0;
        $aligned = $nullCount + $noneCount;
        $overqualified = $stats->where('job_mismatch_reason', 'overqualified')->first()->count ?? 0;
        $underqualified = $stats->where('job_mismatch_reason', 'underqualified')->first()->count ?? 0;
        $unfit = $stats->where('job_mismatch_reason', 'unfit')->first()->count ?? 0;

        return [
            'total_employed' => (int) $total,
            'aligned' => [
                'count' => (int) $aligned,
                'percentage' => $total > 0 ? round(($aligned / $total) * 100, 1) : 0,
            ],
            'overqualified' => [
                'count' => (int) $overqualified,
                'percentage' => $total > 0 ? round(($overqualified / $total) * 100, 1) : 0,
            ],
            'underqualified' => [
                'count' => (int) $underqualified,
                'percentage' => $total > 0 ? round(($underqualified / $total) * 100, 1) : 0,
            ],
            'unfit' => [
                'count' => (int) $unfit,
                'percentage' => $total > 0 ? round(($unfit / $total) * 100, 1) : 0,
            ],
            'alignment_rate' => $total > 0 ? round(($aligned / $total) * 100, 1) : 0,
        ];
    }

    /**
     * Get attrition rate from batches, supplemented by alumni_profiles data
     */
    private function getAttritionRate($campusId = null): array
    {
        // Get alumni employment breakdown by graduation year
        $alumniByYear = DB::table('alumni_profiles')
            ->select(
                'graduation_year',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN employment_status IN ("employed_full_time", "employed_part_time", "self_employed") THEN 1 ELSE 0 END) as employed'),
                DB::raw('SUM(CASE WHEN employment_status IN ("unemployed_seeking", "unemployed_not_seeking") THEN 1 ELSE 0 END) as unemployed'),
                DB::raw('SUM(CASE WHEN employment_status = "continuing_education" THEN 1 ELSE 0 END) as continuing_education')
            )
            ->whereNotNull('graduation_year')
            ->when($campusId, function ($q) use ($campusId) {
                return $q->where('campus_id', $campusId);
            })
            ->groupBy('graduation_year')
            ->orderBy('graduation_year', 'desc')
            ->limit(10)
            ->get()
            ->keyBy('graduation_year');

        // Also get batch data if manually entered
        $batchData = DB::table('batches')
            ->select(
                'graduation_year',
                DB::raw('SUM(COALESCE(initial_enrollment, 0)) as enrolled'),
                DB::raw('SUM(COALESCE(dropout_count, 0)) as dropout'),
                DB::raw('SUM(COALESCE(transferred_count, 0)) as transferred')
            )
            ->where('status', 'active')
            ->whereNotNull('graduation_year')
            ->when($campusId, function ($q) use ($campusId) {
                return $q->where('campus_id', $campusId);
            })
            ->groupBy('graduation_year')
            ->get()
            ->keyBy('graduation_year');

        $allYears = $alumniByYear->keys()->merge($batchData->keys())->unique()->sortDesc()->take(10);

        $yearlyBreakdown = $allYears->map(function ($year) use ($alumniByYear, $batchData) {
            $alumni = $alumniByYear->get($year);
            $batch = $batchData->get($year);

            $total = $alumni ? (int) $alumni->total : 0;
            $unemployed = $alumni ? (int) $alumni->unemployed : 0;
            $continuing = $alumni ? (int) $alumni->continuing_education : 0;
            
            // Use actual batch data if available; otherwise use employment-based proxies
            // with honest labeling (these are NOT true dropout/transfer numbers)
            $hasBatchData = ($batch && $batch->enrolled > 0);
            $enrolled = $hasBatchData ? (int) $batch->enrolled : $total;
            $dropout = $hasBatchData ? (int) $batch->dropout : $unemployed;
            $transferred = $hasBatchData ? (int) $batch->transferred : $continuing;

            $attrition = $enrolled > 0
                ? round((($dropout + $transferred) / $enrolled) * 100, 1)
                : 0;

            return [
                'year' => $year,
                'enrolled' => $enrolled,
                'dropout' => $dropout,
                'transferred' => $transferred,
                'attrition_rate' => $attrition,
            ];
        })->values()->toArray();

        $totalEnrolled = collect($yearlyBreakdown)->sum('enrolled');
        $totalDropout = collect($yearlyBreakdown)->sum('dropout');
        $totalTransferred = collect($yearlyBreakdown)->sum('transferred');

        $overallAttrition = $totalEnrolled > 0
            ? round((($totalDropout + $totalTransferred) / $totalEnrolled) * 100, 1)
            : 0;

        // Check if any batch actually has enrollment data
        $hasBatchData = DB::table('batches')
            ->whereNotNull('initial_enrollment')
            ->where('initial_enrollment', '>', 0)
            ->exists();

        return [
            'yearly_breakdown' => $yearlyBreakdown,
            'summary' => [
                'total_enrolled' => (int) $totalEnrolled,
                'total_dropout' => (int) $totalDropout,
                'total_transferred' => (int) $totalTransferred,
                'overall_attrition_rate' => $overallAttrition,
                'has_batch_data' => $hasBatchData,
                'data_note' => $hasBatchData 
                    ? null 
                    : 'No batch enrollment data available. Showing Unemployed as "Dropout" proxy and Continuing Education as "Transferred" proxy.',
            ]
        ];
    }

    /**
     * Get program-wise performance data
     */
    private function getProgramWisePerformance($campusId = null): array
    {
        $programData = DB::table('alumni_profiles as ap')
            ->leftJoin('courses as c', 'ap.course_id', '=', 'c.id')
            ->select(
                DB::raw('COALESCE(ap.degree_program, c.name) as program'),
                DB::raw('COUNT(ap.id) as total_alumni'),
                DB::raw('SUM(CASE WHEN ap.employment_status IN ("employed_full_time", "employed_part_time", "self_employed") THEN 1 ELSE 0 END) as employed'),
                DB::raw('SUM(CASE WHEN ap.employment_status IN ("employed_full_time", "employed_part_time", "self_employed") AND (ap.job_mismatch_reason IS NULL OR ap.job_mismatch_reason = "none") THEN 1 ELSE 0 END) as aligned'),
                DB::raw('AVG(CASE WHEN ap.employment_status IN ("employed_full_time", "employed_part_time", "self_employed") AND ap.job_start_date IS NOT NULL AND ap.graduation_year IS NOT NULL AND DATEDIFF(ap.job_start_date, COALESCE(ap.graduation_date, CONCAT(ap.graduation_year, "-06-01"))) BETWEEN 0 AND 1825 THEN DATEDIFF(ap.job_start_date, COALESCE(ap.graduation_date, CONCAT(ap.graduation_year, "-06-01"))) ELSE NULL END) as avg_days_to_job')
            )
            ->whereRaw('COALESCE(ap.degree_program, c.name) IS NOT NULL')
            ->when($campusId, function ($q) use ($campusId) {
                return $q->where('ap.campus_id', $campusId);
            })
            ->groupBy(DB::raw('COALESCE(ap.degree_program, c.name)'))
            ->having('total_alumni', '>', 0)
            ->orderBy('total_alumni', 'desc')
            ->limit(20)
            ->get();

        return $programData->map(function ($item) {
            $totalAlumni = $item->total_alumni ?? 0;
            $employed = $item->employed ?? 0;
            $aligned = $item->aligned ?? 0;
            
            return [
                'program' => $item->program,
                'total_alumni' => (int) $totalAlumni,
                'employed' => (int) $employed,
                'employment_rate' => $totalAlumni > 0 ? round(($employed / $totalAlumni) * 100, 1) : 0,
                'aligned' => (int) $aligned,
                'alignment_rate' => $employed > 0 ? round(($aligned / $employed) * 100, 1) : 0,
                'avg_days_to_job' => round((float) ($item->avg_days_to_job ?? 0), 1),
            ];
        })->toArray();
    }

    /**
     * Get enrollment/attrition breakdown by college (department)
     * Uses alumni_profiles with course relationship since batches don't have department_id
     */
    private function getCollegeEnrollmentBreakdown($campusId = null): array
    {
        $collegeData = DB::table('alumni_profiles as ap')
            ->join('courses as c', 'ap.course_id', '=', 'c.id')
            ->join('departments as d', 'c.department_id', '=', 'd.id')
            ->select(
                'd.id as department_id',
                'd.name as college',
                'd.code as college_code',
                DB::raw('COUNT(*) as total_alumni'),
                DB::raw("SUM(CASE WHEN ap.employment_status IN ('employed_full_time', 'employed_part_time', 'self_employed') THEN 1 ELSE 0 END) as employed"),
                DB::raw("SUM(CASE WHEN ap.employment_status IN ('employed_full_time', 'employed_part_time', 'self_employed') AND (ap.job_mismatch_reason IS NULL OR ap.job_mismatch_reason = 'none') THEN 1 ELSE 0 END) as aligned")
            )
            ->when($campusId, function ($q) use ($campusId) {
                return $q->where('ap.campus_id', $campusId);
            })
            ->groupBy('d.id', 'd.name', 'd.code')
            ->orderBy('total_alumni', 'desc')
            ->get();

        return $collegeData->map(function ($item) {
            $total = $item->total_alumni ?? 0;
            $employed = $item->employed ?? 0;
            $aligned = $item->aligned ?? 0;
            
            return [
                'college' => $item->college,
                'college_code' => $item->college_code,
                'total_alumni' => (int) $total,
                'employed' => (int) $employed,
                'aligned' => (int) $aligned,
                'employment_rate' => $total > 0 ? round(($employed / $total) * 100, 1) : 0,
                'alignment_rate' => $employed > 0 ? round(($aligned / $employed) * 100, 1) : 0,
            ];
        })->toArray();
    }

    /**
     * Get enrollment/attrition breakdown by course
     * Uses alumni_profiles for per-course statistics
     */
    private function getCourseEnrollmentBreakdown($campusId = null): array
    {
        $courseData = DB::table('alumni_profiles as ap')
            ->join('courses as c', 'ap.course_id', '=', 'c.id')
            ->join('departments as d', 'c.department_id', '=', 'd.id')
            ->select(
                'c.id as course_id',
                'c.name as course',
                'c.code as course_code',
                'd.name as college',
                'd.code as college_code',
                DB::raw('COUNT(*) as total_alumni'),
                DB::raw("SUM(CASE WHEN ap.employment_status IN ('employed_full_time', 'employed_part_time', 'self_employed') THEN 1 ELSE 0 END) as employed"),
                DB::raw("SUM(CASE WHEN ap.employment_status IN ('employed_full_time', 'employed_part_time', 'self_employed') AND (ap.job_mismatch_reason IS NULL OR ap.job_mismatch_reason = 'none') THEN 1 ELSE 0 END) as aligned")
            )
            ->when($campusId, function ($q) use ($campusId) {
                return $q->where('ap.campus_id', $campusId);
            })
            ->groupBy('c.id', 'c.name', 'c.code', 'd.name', 'd.code')
            ->orderBy('total_alumni', 'desc')
            ->limit(15)
            ->get();

        return $courseData->map(function ($item) {
            $total = $item->total_alumni ?? 0;
            $employed = $item->employed ?? 0;
            $aligned = $item->aligned ?? 0;
            
            return [
                'course' => $item->course,
                'course_code' => $item->course_code,
                'college' => $item->college,
                'college_code' => $item->college_code,
                'total_alumni' => (int) $total,
                'employed' => (int) $employed,
                'aligned' => (int) $aligned,
                'employment_rate' => $total > 0 ? round(($employed / $total) * 100, 1) : 0,
                'alignment_rate' => $employed > 0 ? round(($aligned / $employed) * 100, 1) : 0,
            ];
        })->toArray();
    }

    /**
     * Get employment location breakdown (local vs foreign vs remote)
     * Includes per-year trends and department breakdown
     */
    private function getEmploymentLocationStats($campusId = null): array
    {
        $baseQuery = AlumniProfile::whereIn('employment_status', [
            'employed_full_time', 'employed_part_time', 'self_employed'
        ])->when($campusId, fn($q) => $q->where('campus_id', $campusId));

        $totalEmployed = (clone $baseQuery)->count();

        // Overall counts
        $locationCounts = DB::table('alumni_profiles')
            ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
            ->whereNotNull('employment_location_type')
            ->when($campusId, fn($q) => $q->where('campus_id', $campusId))
            ->selectRaw('employment_location_type, COUNT(*) as count')
            ->groupBy('employment_location_type')
            ->pluck('count', 'employment_location_type')
            ->toArray();

        $local = $locationCounts['local'] ?? 0;
        $foreign = $locationCounts['foreign'] ?? 0;
        $remote = $locationCounts['remote'] ?? 0;

        // Per-year trend
        $yearlyTrend = DB::table('alumni_profiles')
            ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
            ->whereNotNull('employment_location_type')
            ->whereNotNull('graduation_year')
            ->when($campusId, fn($q) => $q->where('campus_id', $campusId))
            ->selectRaw('graduation_year, employment_location_type, COUNT(*) as count')
            ->groupBy('graduation_year', 'employment_location_type')
            ->orderBy('graduation_year')
            ->get()
            ->groupBy('graduation_year')
            ->map(function ($items, $year) {
                $counts = $items->pluck('count', 'employment_location_type')->toArray();
                $total = array_sum($counts);
                return [
                    'year' => (int) $year,
                    'local' => (int) ($counts['local'] ?? 0),
                    'foreign' => (int) ($counts['foreign'] ?? 0),
                    'remote' => (int) ($counts['remote'] ?? 0),
                    'total' => $total,
                    'foreign_rate' => $total > 0 ? round((($counts['foreign'] ?? 0) + ($counts['remote'] ?? 0)) / $total * 100, 1) : 0,
                ];
            })
            ->values()
            ->toArray();

        // Per-department breakdown
        $departmentBreakdown = DB::table('alumni_profiles')
            ->join('departments', 'alumni_profiles.department_id', '=', 'departments.id')
            ->whereIn('alumni_profiles.employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
            ->whereNotNull('alumni_profiles.employment_location_type')
            ->when($campusId, fn($q) => $q->where('alumni_profiles.campus_id', $campusId))
            ->selectRaw('departments.name as department, alumni_profiles.employment_location_type, COUNT(*) as count')
            ->groupBy('departments.name', 'alumni_profiles.employment_location_type')
            ->get()
            ->groupBy('department')
            ->map(function ($items, $dept) {
                $counts = $items->pluck('count', 'employment_location_type')->toArray();
                $total = array_sum($counts);
                return [
                    'department' => $dept,
                    'local' => (int) ($counts['local'] ?? 0),
                    'foreign' => (int) ($counts['foreign'] ?? 0),
                    'remote' => (int) ($counts['remote'] ?? 0),
                    'total' => $total,
                ];
            })
            ->values()
            ->toArray();

        return [
            'summary' => [
                'total_employed' => $totalEmployed,
                'local' => $local,
                'foreign' => $foreign,
                'remote' => $remote,
                'local_rate' => $totalEmployed > 0 ? round($local / $totalEmployed * 100, 1) : 0,
                'foreign_rate' => $totalEmployed > 0 ? round($foreign / $totalEmployed * 100, 1) : 0,
                'remote_rate' => $totalEmployed > 0 ? round($remote / $totalEmployed * 100, 1) : 0,
            ],
            'yearly_trend' => $yearlyTrend,
            'department_breakdown' => $departmentBreakdown,
        ];
    }
}