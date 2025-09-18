<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\AlumniProfile;
use App\Models\Employment;
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
            ->leftJoin('employments', function($join) {
                $join->on('alumni_profiles.id', '=', 'employments.alumni_id')
                     ->whereRaw('employments.start_date = (
                         SELECT MIN(start_date) 
                         FROM employments 
                         WHERE employments.alumni_id = alumni_profiles.id
                     )');
            })
            ->select(
                DB::raw('alumni_profiles.graduation_year'),
                DB::raw('AVG(DATEDIFF(employments.start_date, alumni_profiles.graduation_date)) as avg_days_to_job'),
                DB::raw('COUNT(alumni_profiles.id) as total_alumni'),
                DB::raw('COUNT(employments.id) as employed_alumni'),
                DB::raw('(COUNT(employments.id) / COUNT(alumni_profiles.id)) * 100 as employment_rate')
            )
            ->whereNotNull('alumni_profiles.graduation_date')
            ->groupBy('graduation_year');

        if ($yearFilter) {
            $query->whereIn('alumni_profiles.graduation_year', $yearFilter);
        }

        $yearlyResults = $query->orderBy('graduation_year')->get();

        $data = [];
        foreach ($yearlyResults as $year) {
            // Get program breakdown for this year
            $programBreakdown = $this->getProgramBreakdownForYear($year->graduation_year);
            
            $data[] = [
                'graduation_year' => (int) $year->graduation_year,
                'avg_days_to_job' => round((float) $year->avg_days_to_job, 1),
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
            ->leftJoin('employments', function($join) {
                $join->on('alumni_profiles.id', '=', 'employments.alumni_id')
                     ->whereRaw('employments.start_date = (
                         SELECT MIN(start_date) 
                         FROM employments 
                         WHERE employments.alumni_id = alumni_profiles.id
                     )');
            })
            ->select(
                'alumni_profiles.degree_program as program',
                DB::raw('AVG(DATEDIFF(employments.start_date, alumni_profiles.graduation_date)) as avg_days'),
                DB::raw('COUNT(alumni_profiles.id) as alumni_count')
            )
            ->where('alumni_profiles.graduation_year', $year)
            ->whereNotNull('alumni_profiles.graduation_date')
            ->groupBy('alumni_profiles.degree_program')
            ->having('alumni_count', '>', 0)
            ->orderBy('avg_days')
            ->get();

        $colors = ['#800000', '#B22222', '#D4AF37', '#DAA520', '#CD853F', '#8B4513'];
        $data = [];
        
        foreach ($programs as $index => $program) {
            $data[] = [
                'program' => $program->program,
                'avg_days' => round((float) $program->avg_days, 1),
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
            ->leftJoin('employments', function($join) {
                $join->on('alumni_profiles.id', '=', 'employments.alumni_id')
                     ->whereRaw('employments.start_date = (
                         SELECT MIN(start_date) 
                         FROM employments 
                         WHERE employments.alumni_id = alumni_profiles.id
                     )');
            })
            ->select(DB::raw('DATEDIFF(employments.start_date, alumni_profiles.graduation_date) as days_to_job'))
            ->where('alumni_profiles.graduation_year', $year)
            ->whereNotNull('alumni_profiles.graduation_date')
            ->whereNotNull('employments.start_date')
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
            ->leftJoin('employments', function($join) {
                $join->on('alumni_profiles.id', '=', 'employments.alumni_id')
                     ->whereRaw('employments.start_date = (
                         SELECT MIN(start_date) 
                         FROM employments 
                         WHERE employments.alumni_id = alumni_profiles.id
                     )');
            })
            ->whereNotNull('alumni_profiles.graduation_date')
            ->whereNotNull('employments.start_date');

        if ($yearFilter) {
            $overallQuery->whereIn('alumni_profiles.graduation_year', $yearFilter);
        }

        $overallAvg = $overallQuery->avg(DB::raw('DATEDIFF(employments.start_date, alumni_profiles.graduation_date)')) ?? 0;

        // Current year average
        $currentYear = date('Y');
        $currentYearAvg = DB::table('alumni_profiles')
            ->leftJoin('employments', function($join) {
                $join->on('alumni_profiles.id', '=', 'employments.alumni_id')
                     ->whereRaw('employments.start_date = (
                         SELECT MIN(start_date) 
                         FROM employments 
                         WHERE employments.alumni_id = alumni_profiles.id
                     )');
            })
            ->where('alumni_profiles.graduation_year', $currentYear)
            ->whereNotNull('alumni_profiles.graduation_date')
            ->whereNotNull('employments.start_date')
            ->avg(DB::raw('DATEDIFF(employments.start_date, alumni_profiles.graduation_date)')) ?? 0;

        // Previous year for improvement calculation
        $previousYear = $currentYear - 1;
        $previousYearAvg = DB::table('alumni_profiles')
            ->leftJoin('employments', function($join) {
                $join->on('alumni_profiles.id', '=', 'employments.alumni_id')
                     ->whereRaw('employments.start_date = (
                         SELECT MIN(start_date) 
                         FROM employments 
                         WHERE employments.alumni_id = alumni_profiles.id
                     )');
            })
            ->where('alumni_profiles.graduation_year', $previousYear)
            ->whereNotNull('alumni_profiles.graduation_date')
            ->whereNotNull('employments.start_date')
            ->avg(DB::raw('DATEDIFF(employments.start_date, alumni_profiles.graduation_date)')) ?? 0;

        // Calculate improvement rate (negative means faster employment, which is better)
        $improvementRate = 0;
        if ($previousYearAvg > 0) {
            $improvementRate = (($currentYearAvg - $previousYearAvg) / $previousYearAvg) * 100;
        }

        // Fastest employment program
        $fastestProgram = DB::table('alumni_profiles')
            ->leftJoin('employments', function($join) {
                $join->on('alumni_profiles.id', '=', 'employments.alumni_id')
                     ->whereRaw('employments.start_date = (
                         SELECT MIN(start_date) 
                         FROM employments 
                         WHERE employments.alumni_id = alumni_profiles.id
                     )');
            })
            ->select(
                'alumni_profiles.degree_program as name',
                DB::raw('AVG(DATEDIFF(employments.start_date, alumni_profiles.graduation_date)) as avg_days')
            )
            ->whereNotNull('alumni_profiles.graduation_date')
            ->whereNotNull('employments.start_date')
            ->groupBy('alumni_profiles.degree_program')
            ->orderBy('avg_days')
            ->first();

        // Total tracked alumni
        $totalTracked = DB::table('alumni_profiles')
            ->leftJoin('employments', function($join) {
                $join->on('alumni_profiles.id', '=', 'employments.alumni_id')
                     ->whereRaw('employments.start_date = (
                         SELECT MIN(start_date) 
                         FROM employments 
                         WHERE employments.alumni_id = alumni_profiles.id
                     )');
            })
            ->whereNotNull('alumni_profiles.graduation_date')
            ->whereNotNull('employments.start_date')
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
}