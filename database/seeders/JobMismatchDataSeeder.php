<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AlumniProfile;
use Illuminate\Support\Facades\DB;

class JobMismatchDataSeeder extends Seeder
{
    /**
     * Seed job mismatch data for existing employed alumni
     */
    public function run(): void
    {
        // Get all employed alumni
        $employedAlumni = AlumniProfile::whereIn('employment_status', [
            'employed_full_time',
            'employed_part_time',
            'self_employed'
        ])->get();

        $mismatchReasons = ['overqualified', 'underqualified', 'unfit', 'career_change', 'location', 'salary', 'none'];
        
        foreach ($employedAlumni as $alumni) {
            // Randomly assign job mismatch data
            $mismatchReason = $mismatchReasons[array_rand($mismatchReasons)];
            
            // Job satisfaction: 1-5 scale, weighted towards higher satisfaction
            $satisfaction = rand(1, 10) <= 7 ? rand(3, 5) : rand(1, 2);
            
            // Job related to degree: 70% yes, 30% no
            $jobRelated = rand(1, 10) <= 7 ? true : false;
            
            $alumni->update([
                'job_mismatch_reason' => $mismatchReason,
                'job_satisfaction' => $satisfaction,
                'job_related_to_degree' => $jobRelated
            ]);
        }

        $this->command->info('Job mismatch data seeded for ' . $employedAlumni->count() . ' employed alumni');
    }
}
