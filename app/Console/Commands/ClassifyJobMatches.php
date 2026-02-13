<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\JobClassifierService;
use App\Models\AlumniProfile;
use Illuminate\Support\Str;

class ClassifyJobMatches extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'alumni:classify-jobs 
                            {--force : Force reclassification of all alumni}
                            {--test : Test mode - show what would be classified without saving}
                            {--id= : Classify a specific alumni by ID}';

    /**
     * The console command description.
     */
    protected $description = 'Classify job qualification matches for all employed alumni using intelligent rule-based analysis';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $classifier = new JobClassifierService();
        
        $this->newLine();
        $this->info('🎓 Alumni Job Qualification Classifier');
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->newLine();

        // Single alumni test
        if ($id = $this->option('id')) {
            return $this->classifySingle($classifier, $id);
        }

        // Test mode
        if ($this->option('test')) {
            return $this->testClassification($classifier);
        }

        // Full classification
        return $this->classifyAll($classifier);
    }

    /**
     * Classify a single alumni for testing
     */
    private function classifySingle(JobClassifierService $classifier, int $id): int
    {
        $alumni = AlumniProfile::find($id);

        if (!$alumni) {
            $this->error("❌ Alumni with ID {$id} not found.");
            return 1;
        }

        $this->info("📋 Analyzing: {$alumni->first_name} {$alumni->last_name}");
        $this->newLine();

        $this->table(['Field', 'Value'], [
            ['Degree Program', $alumni->degree_program ?? 'N/A'],
            ['Current Job Title', $alumni->current_job_title ?? 'N/A'],
            ['Company', $alumni->current_employer ?? 'N/A'],
            ['Industry', $alumni->company_industry ?? 'N/A'],
            ['Employment Status', $alumni->employment_status ?? 'N/A'],
            ['Current Classification', $alumni->job_mismatch_reason ?? 'Not classified'],
        ]);

        $result = $classifier->classify($alumni);

        if ($result === null) {
            $this->warn('⚠️  Cannot classify - missing employment data or unemployed.');
            return 0;
        }

        $this->newLine();
        $this->info('🔍 Classification Result:');
        $this->newLine();

        $classificationLabel = match($result['classification']) {
            'none' => '✅ Good Match',
            'overqualified' => '⚠️  Overqualified',
            'underqualified' => '⚠️  Underqualified',
            'unfit' => '❌ Unfit/Mismatch',
            default => $result['classification'],
        };

        $this->table(['Metric', 'Value'], [
            ['Classification', $classificationLabel],
            ['Confidence', ucfirst($result['confidence'])],
            ['Job Satisfaction', $result['job_satisfaction'] . '/5'],
            ['Related to Degree', $result['job_related_to_degree'] ? 'Yes' : 'No'],
            ['Education Level', $result['analysis']['education_level']],
            ['Job Level', $result['analysis']['job_level']],
            ['Field Match Score', $result['analysis']['field_match_score'] . '/100'],
            ['Field Match Reason', $result['analysis']['field_match_reason']],
        ]);

        if ($this->confirm('💾 Save this classification?', true)) {
            $classifier->classifyAndUpdate($alumni);
            $this->info('✅ Classification saved!');
        }

        return 0;
    }

    /**
     * Test classification without saving
     */
    private function testClassification(JobClassifierService $classifier): int
    {
        $this->info('🧪 Test Mode - No changes will be saved');
        $this->newLine();

        $alumni = AlumniProfile::whereIn('employment_status', [
            'employed_full_time',
            'employed_part_time',
            'self_employed',
        ])
        ->whereNotNull('current_job_title')
        ->limit(10)
        ->get();

        if ($alumni->isEmpty()) {
            $this->warn('No employed alumni with job titles found.');
            return 0;
        }

        $results = [];
        foreach ($alumni as $profile) {
            $result = $classifier->classify($profile);
            
            if ($result) {
                $results[] = [
                    'name' => $profile->first_name . ' ' . $profile->last_name,
                    'degree' => Str::limit($profile->degree_program ?? '', 25),
                    'job' => Str::limit($profile->current_job_title ?? '', 25),
                    'current' => $profile->job_mismatch_reason ?? 'none',
                    'new' => $result['classification'],
                    'confidence' => $result['confidence'],
                    'score' => $result['analysis']['field_match_score'],
                ];
            }
        }

        $this->table(
            ['Name', 'Degree', 'Job', 'Current', 'New', 'Confidence', 'Score'],
            $results
        );

        return 0;
    }

    /**
     * Classify all employed alumni
     */
    private function classifyAll(JobClassifierService $classifier): int
    {
        $force = $this->option('force');

        $totalEmployed = AlumniProfile::whereIn('employment_status', [
            'employed_full_time',
            'employed_part_time',
            'self_employed',
        ])->count();

        $this->info("📊 Found {$totalEmployed} employed alumni");
        
        if ($force) {
            $this->warn('🔄 Force mode: All alumni will be reclassified');
        } else {
            $this->info('📝 Normal mode: Only unclassified or stale classifications will be updated');
            $this->info('   Use --force to reclassify all');
        }

        $this->newLine();

        if (!$this->confirm('Proceed with classification?', true)) {
            $this->info('Cancelled.');
            return 0;
        }

        $this->newLine();
        $this->info('🔄 Processing...');
        $this->newLine();

        $bar = $this->output->createProgressBar($totalEmployed);
        $bar->start();

        $stats = [
            'none' => 0,
            'overqualified' => 0,
            'underqualified' => 0,
            'unfit' => 0,
            'skipped' => 0,
            'errors' => 0,
        ];

        AlumniProfile::whereIn('employment_status', [
            'employed_full_time',
            'employed_part_time',
            'self_employed',
        ])->chunk(100, function ($alumni) use ($classifier, $force, &$stats, $bar) {
            foreach ($alumni as $profile) {
                try {
                    // Skip if recently classified (unless force)
                    if (!$force && $profile->job_mismatch_reason && 
                        $profile->updated_at && 
                        $profile->updated_at->diffInDays(now()) < 30) {
                        $stats['skipped']++;
                        $bar->advance();
                        continue;
                    }

                    $result = $classifier->classify($profile);

                    if ($result === null) {
                        $stats['skipped']++;
                        $bar->advance();
                        continue;
                    }

                    $profile->update([
                        'job_mismatch_reason' => $result['classification'],
                        'job_satisfaction' => $result['job_satisfaction'],
                        'job_related_to_degree' => $result['job_related_to_degree'],
                    ]);

                    $key = $result['classification'] === 'none' ? 'none' : $result['classification'];
                    if (isset($stats[$key])) {
                        $stats[$key]++;
                    }
                } catch (\Exception $e) {
                    $stats['errors']++;
                }

                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine(2);

        // Calculate totals
        $totalClassified = $stats['none'] + $stats['overqualified'] + 
                          $stats['underqualified'] + $stats['unfit'];

        $this->info('✅ Classification Complete!');
        $this->newLine();

        $this->table(
            ['Classification', 'Count', 'Percentage'],
            [
                ['✅ Good Match', $stats['none'], $totalClassified > 0 ? round(($stats['none'] / $totalClassified) * 100, 1) . '%' : '0%'],
                ['⚠️  Overqualified', $stats['overqualified'], $totalClassified > 0 ? round(($stats['overqualified'] / $totalClassified) * 100, 1) . '%' : '0%'],
                ['⚠️  Underqualified', $stats['underqualified'], $totalClassified > 0 ? round(($stats['underqualified'] / $totalClassified) * 100, 1) . '%' : '0%'],
                ['❌ Unfit/Mismatch', $stats['unfit'], $totalClassified > 0 ? round(($stats['unfit'] / $totalClassified) * 100, 1) . '%' : '0%'],
                ['───────────────', '─────', '──────────'],
                ['Total Classified', $totalClassified, '100%'],
                ['Skipped', $stats['skipped'], ''],
                ['Errors', $stats['errors'], ''],
            ]
        );

        $this->newLine();
        $this->info('💡 Classification Logic:');
        $this->info('   ✓ Education level vs job level analysis');
        $this->info('   ✓ 40+ Philippine degree program mappings');
        $this->info('   ✓ Job title seniority detection');
        $this->info('   ✓ Industry alignment checking');
        $this->newLine();
        $this->info('💡 Commands:');
        $this->info('   php artisan alumni:classify-jobs --id=123  (test single alumni)');
        $this->info('   php artisan alumni:classify-jobs --test    (preview mode)');
        $this->info('   php artisan alumni:classify-jobs --force   (reclassify all)');

        return 0;
    }
}
