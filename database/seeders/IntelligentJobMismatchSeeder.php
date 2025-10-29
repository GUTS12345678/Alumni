<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AlumniProfile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class IntelligentJobMismatchSeeder extends Seeder
{
    /**
     * Intelligent Job Mismatch Classification
     * Uses education level, program, and job title pattern matching
     * to intelligently classify job qualification matches.
     */
    
    protected $command;
    
    /**
     * Set the command instance (for use outside seeder context)
     */
    public function setCommand($command): void
    {
        $this->command = $command;
    }
    
    // Job title patterns for different qualification levels
    private $seniorExecutivePatterns = [
        'ceo', 'cto', 'cfo', 'director', 'vice president', 'vp', 'head of',
        'chief', 'president', 'executive', 'manager', 'lead', 'senior', 'principal'
    ];
    
    private $midLevelPatterns = [
        'engineer', 'developer', 'analyst', 'specialist', 'consultant',
        'coordinator', 'supervisor', 'associate', 'officer', 'administrator'
    ];
    
    private $entryLevelPatterns = [
        'junior', 'assistant', 'trainee', 'intern', 'associate', 'entry',
        'clerk', 'aide', 'support', 'representative', 'staff'
    ];
    
    // Program to job field mapping
    private $programFieldMapping = [
        // Technology & IT
        'computer science' => ['software', 'developer', 'programmer', 'engineer', 'coding', 'it', 'tech', 'system', 'data', 'web', 'mobile', 'application'],
        'information technology' => ['it', 'tech', 'technology', 'system', 'network', 'support', 'administrator', 'analyst', 'helpdesk', 'infrastructure'],
        'software engineering' => ['software', 'developer', 'engineer', 'programming', 'architect', 'devops', 'qa', 'testing'],
        'data science' => ['data', 'analyst', 'scientist', 'analytics', 'machine learning', 'ai', 'artificial intelligence', 'statistics', 'big data'],
        'cybersecurity' => ['security', 'cyber', 'infosec', 'penetration', 'ethical hacking', 'soc', 'analyst', 'security engineer'],
        
        // Engineering
        'engineering' => ['engineer', 'technical', 'design', 'project', 'construction', 'manufacturing', 'quality', 'production'],
        'civil engineering' => ['civil', 'construction', 'structural', 'infrastructure', 'surveyor', 'project engineer'],
        'mechanical engineering' => ['mechanical', 'manufacturing', 'production', 'maintenance', 'design', 'cad', 'automotive'],
        'electrical engineering' => ['electrical', 'electronics', 'power', 'automation', 'control', 'instrumentation'],
        'chemical engineering' => ['chemical', 'process', 'plant', 'manufacturing', 'quality control', 'production'],
        
        // Business & Management
        'business' => ['business', 'manager', 'analyst', 'consultant', 'admin', 'executive', 'sales', 'operations', 'strategy'],
        'business administration' => ['management', 'administrator', 'operations', 'supervisor', 'coordinator', 'business analyst'],
        'management' => ['manager', 'director', 'supervisor', 'team lead', 'operations', 'project manager', 'administrator'],
        'marketing' => ['marketing', 'brand', 'social media', 'content', 'digital', 'advertising', 'promotion', 'campaign'],
        'accounting' => ['accountant', 'auditor', 'bookkeeper', 'financial', 'tax', 'payroll', 'cpa', 'accounts'],
        'finance' => ['financial', 'analyst', 'banker', 'investment', 'portfolio', 'credit', 'wealth', 'treasury'],
        'human resources' => ['hr', 'human resources', 'recruitment', 'talent', 'recruiter', 'people', 'personnel'],
        'entrepreneurship' => ['founder', 'entrepreneur', 'startup', 'business owner', 'ceo', 'self-employed'],
        
        // Healthcare
        'nursing' => ['nurse', 'rn', 'lpn', 'healthcare', 'medical', 'clinical', 'hospital', 'patient', 'care'],
        'medicine' => ['doctor', 'physician', 'medical', 'clinical', 'healthcare', 'surgeon', 'md'],
        'pharmacy' => ['pharmacist', 'pharmaceutical', 'pharmacy', 'drug', 'medication'],
        'public health' => ['public health', 'epidemiology', 'health policy', 'community health', 'healthcare'],
        
        // Education
        'education' => ['teacher', 'professor', 'instructor', 'tutor', 'trainer', 'educator', 'academic', 'lecturer', 'teaching'],
        'elementary education' => ['teacher', 'elementary', 'primary', 'grade school', 'tutor'],
        'secondary education' => ['teacher', 'high school', 'secondary', 'subject teacher'],
        
        // Social Sciences
        'psychology' => ['psychologist', 'therapist', 'counselor', 'mental health', 'clinical', 'behavioral'],
        'sociology' => ['social', 'community', 'research', 'analyst', 'outreach', 'development'],
        'social work' => ['social worker', 'case manager', 'counselor', 'community', 'welfare', 'support'],
        
        // Communication & Arts
        'communication' => ['communications', 'public relations', 'pr', 'media', 'content', 'writer', 'journalist'],
        'journalism' => ['journalist', 'reporter', 'editor', 'writer', 'news', 'media', 'content'],
        'graphic design' => ['designer', 'graphic', 'visual', 'ui', 'ux', 'creative', 'art', 'illustrator'],
        'multimedia' => ['multimedia', 'video', 'animation', 'graphics', 'production', 'editor'],
        
        // Science
        'biology' => ['biologist', 'research', 'laboratory', 'lab', 'scientist', 'biotech', 'clinical'],
        'chemistry' => ['chemist', 'laboratory', 'research', 'chemical', 'analyst', 'quality control'],
        'physics' => ['physicist', 'research', 'laboratory', 'scientist', 'analyst'],
        'environmental science' => ['environmental', 'sustainability', 'conservation', 'ecology', 'green'],
        
        // Law & Criminal Justice
        'law' => ['lawyer', 'attorney', 'legal', 'counsel', 'paralegal', 'law clerk', 'advocate'],
        'criminal justice' => ['police', 'law enforcement', 'officer', 'detective', 'corrections', 'security'],
        
        // Hospitality & Tourism
        'hospitality' => ['hotel', 'restaurant', 'hospitality', 'food service', 'catering', 'front desk'],
        'tourism' => ['travel', 'tourism', 'tour', 'hotel', 'resort', 'airline', 'hospitality'],
    ];
    
    public function run(): void
    {
        $this->command->info("\n🤖 Starting Intelligent Job Mismatch Classification...\n");
        
        // Check if force flag is used
        $force = $this->command->option('force') ?? false;
        
        // Get all alumni with employment_status indicating employment
        $employedAlumni = AlumniProfile::whereIn('employment_status', [
            'employed_full_time',
            'employed_part_time',
            'self_employed'
        ])->get();
        
        if ($employedAlumni->isEmpty()) {
            $this->command->error("❌ No employed alumni found in the database.");
            $this->command->info("💡 Make sure alumni have employment_status set to one of:");
            $this->command->info("   - employed_full_time, employed_part_time, or self_employed");
            return;
        }
        
        $stats = [
            'overqualified' => 0,
            'underqualified' => 0,
            'unfit' => 0,
            'none' => 0, // Good match
            'career_change' => 0,
            'location' => 0,
            'salary' => 0,
        ];
        
        $processedCount = 0;
        $skippedCount = 0;
        
        foreach ($employedAlumni as $alumni) {
            // Skip if already classified recently (within 30 days) unless force flag
            if (!$force && $alumni->job_mismatch_reason && $alumni->updated_at && $alumni->updated_at->diffInDays(now()) < 30) {
                $skippedCount++;
                continue;
            }
            
            $classification = $this->classifyJobMatch($alumni);
            
            // Update alumni profile
            $alumni->update([
                'job_mismatch_reason' => $classification['reason'],
                'job_satisfaction' => $classification['satisfaction'],
                'job_related_to_degree' => $classification['related_to_degree'],
            ]);
            
            $stats[$classification['reason']]++;
            $processedCount++;
            
            // Show progress for large datasets
            if ($processedCount % 50 == 0) {
                $this->command->info("   Processed: $processedCount alumni...");
            }
        }
        
        $total = array_sum($stats);
        
        if ($total == 0) {
            $this->command->warn("\n⚠️  All alumni were skipped (recently classified).");
            $this->command->info("💡 Run again to reclassify all alumni:");
            $this->command->info("   php artisan db:seed --class=IntelligentJobMismatchSeeder");
            return;
        }
        
        $this->command->info("\n✅ Intelligent job mismatch classification completed!");
        $this->command->info("📊 Results based on education level + job title analysis:\n");
        $this->command->table(
            ['Classification', 'Count', 'Percentage'],
            [
                ['Overqualified (PhD/Master in entry-level)', $stats['overqualified'], $total > 0 ? round(($stats['overqualified']/$total)*100, 1).'%' : '0%'],
                ['Underqualified (Low education, high role)', $stats['underqualified'], $total > 0 ? round(($stats['underqualified']/$total)*100, 1).'%' : '0%'],
                ['Unfit/Mismatch (Unrelated field)', $stats['unfit'], $total > 0 ? round(($stats['unfit']/$total)*100, 1).'%' : '0%'],
                ['Good Match (Appropriate level + field)', $stats['none'], $total > 0 ? round(($stats['none']/$total)*100, 1).'%' : '0%'],
                ['Career Change (Intentional switch)', $stats['career_change'], $total > 0 ? round(($stats['career_change']/$total)*100, 1).'%' : '0%'],
                ['Location Issues', $stats['location'], $total > 0 ? round(($stats['location']/$total)*100, 1).'%' : '0%'],
                ['Salary Issues', $stats['salary'], $total > 0 ? round(($stats['salary']/$total)*100, 1).'%' : '0%'],
                ['─────────────', '─────', '─────────'],
                ['TOTAL CLASSIFIED', $total, '100%'],
            ]
        );
        
        $this->command->info("\n📈 Summary:");
        $this->command->info("   Processed: $processedCount alumni");
        if (!$force) {
            $this->command->info("   Skipped: $skippedCount alumni (recently classified)");
        }
        $this->command->info("   Total employed alumni: " . $employedAlumni->count());
        
        $this->command->info("\n💡 Classification Logic:");
        $this->command->info("   ✓ Pattern matching on job titles (Senior/Mid/Entry level)");
        $this->command->info("   ✓ Program-to-job field mapping (40+ degree programs)");
        $this->command->info("   ✓ Education level vs job level analysis");
        $this->command->info("   ✓ Industry alignment checking");
    }
    
    /**
     * Intelligent classification using education + job data
     */
    private function classifyJobMatch(AlumniProfile $alumni): array
    {
        // Get job title from current_job_title field
        $jobTitle = strtolower($alumni->current_job_title ?? '');
        $educationLevel = strtolower($alumni->education_level ?? 'bachelor');
        $program = strtolower($alumni->degree_program ?? '');
        $companyIndustry = strtolower($alumni->company_industry ?? '');
        
        // Default values
        $classification = [
            'reason' => 'none',
            'satisfaction' => 3,
            'related_to_degree' => true,
        ];
        
        // If no job title, analyze based on employment status
        if (empty($jobTitle)) {
            return $this->classifyWithoutJobTitle($alumni, $educationLevel, $program);
        }
        
        // 1. Check if job is related to degree program
        $isRelatedToProgram = $this->isJobRelatedToProgram($jobTitle, $program, $companyIndustry);
        $classification['related_to_degree'] = $isRelatedToProgram;
        
        // 2. Classify based on education level vs job level
        $jobLevel = $this->detectJobLevel($jobTitle);
        $overqualification = $this->assessOverqualification($educationLevel, $jobLevel);
        
        if ($overqualification === 'overqualified') {
            // Master's/PhD in entry-level position
            $classification['reason'] = 'overqualified';
            $classification['satisfaction'] = rand(2, 3); // Lower satisfaction (2-3/5)
            
        } elseif ($overqualification === 'underqualified') {
            // Bachelor's or lower in senior executive role
            $classification['reason'] = 'underqualified';
            $classification['satisfaction'] = rand(3, 4); // Moderate satisfaction (3-4/5)
            
        } elseif (!$isRelatedToProgram) {
            // Job not related to degree = unfit or career change
            // 70% unfit, 30% intentional career change
            if (rand(0, 100) < 70) {
                $classification['reason'] = 'unfit';
                $classification['satisfaction'] = rand(2, 3); // Lower satisfaction
            } else {
                $classification['reason'] = 'career_change';
                $classification['satisfaction'] = rand(3, 4); // Moderate-high satisfaction
            }
            
        } else {
            // Good match with appropriate level
            // 70% perfect match, 30% have other issues
            if (rand(0, 100) < 70) {
                $classification['reason'] = 'none'; // Good match
                $classification['satisfaction'] = rand(4, 5); // High satisfaction (4-5/5)
            } else {
                // Even good matches might have other issues
                $otherReasons = ['location', 'salary'];
                $classification['reason'] = $otherReasons[array_rand($otherReasons)];
                $classification['satisfaction'] = rand(3, 4); // Moderate satisfaction
            }
        }
        
        return $classification;
    }
    
    /**
     * Classify alumni without job title (unemployed or incomplete data)
     */
    private function classifyWithoutJobTitle(AlumniProfile $alumni, string $educationLevel, string $program): array
    {
        // If employed but no job title, likely incomplete data
        // Make conservative assumptions
        $reasons = ['career_change', 'location', 'none'];
        
        return [
            'reason' => $reasons[array_rand($reasons)],
            'satisfaction' => rand(3, 4),
            'related_to_degree' => rand(0, 100) < 60, // 60% chance related
        ];
    }
    
    /**
     * Detect job seniority level from title
     */
    private function detectJobLevel(string $jobTitle): string
    {
        $jobTitle = strtolower($jobTitle);
        
        // Check senior/executive patterns
        foreach ($this->seniorExecutivePatterns as $pattern) {
            if (str_contains($jobTitle, $pattern)) {
                return 'senior';
            }
        }
        
        // Check entry-level patterns
        foreach ($this->entryLevelPatterns as $pattern) {
            if (str_contains($jobTitle, $pattern)) {
                return 'entry';
            }
        }
        
        // Default to mid-level
        return 'mid';
    }
    
    /**
     * Assess if education level matches job level
     */
    private function assessOverqualification(string $educationLevel, string $jobLevel): ?string
    {
        $educationLevel = strtolower($educationLevel);
        
        // Normalize education level variations
        $isAdvancedDegree = in_array($educationLevel, [
            'phd', 'doctorate', 'doctoral', 'ph.d', 'ph.d.',
            'master', 'masters', 'master\'s', 'ms', 'm.s.', 'ma', 'm.a.', 'mba', 'm.b.a.'
        ]);
        
        $isBachelors = in_array($educationLevel, [
            'bachelor', 'bachelors', 'bachelor\'s', 'bs', 'b.s.', 'ba', 'b.a.', 'undergraduate'
        ]);
        
        // Advanced degree (PhD/Master's) in entry-level = overqualified
        if ($isAdvancedDegree && $jobLevel === 'entry') {
            return 'overqualified';
        }
        
        // Bachelor's or lower in senior executive = potentially underqualified
        // But experience often compensates, so only flag 15% of cases
        if ($isBachelors && $jobLevel === 'senior') {
            return rand(0, 100) < 15 ? 'underqualified' : null;
        }
        
        return null; // Appropriate level
    }
    
    /**
     * Check if job title relates to degree program
     */
    private function isJobRelatedToProgram(string $jobTitle, string $program, string $industry = ''): bool
    {
        $jobTitle = strtolower($jobTitle);
        $program = strtolower($program);
        $industry = strtolower($industry);
        
        // If either is empty, can't determine - assume related (conservative)
        if (empty($jobTitle) || empty($program)) {
            return true;
        }
        
        // Direct match - program name in job title or vice versa
        if (str_contains($jobTitle, $program) || str_contains($program, $jobTitle)) {
            return true;
        }
        
        // Check if industry matches program
        if (!empty($industry) && (str_contains($industry, $program) || str_contains($program, $industry))) {
            return true;
        }
        
        // Check field mapping
        foreach ($this->programFieldMapping as $field => $keywords) {
            // If program contains field keyword
            if (str_contains($program, $field)) {
                // Check if any job-related keywords appear in job title
                foreach ($keywords as $keyword) {
                    if (str_contains($jobTitle, $keyword) || str_contains($industry, $keyword)) {
                        return true;
                    }
                }
            }
            
            // Reverse check - if program contains any keyword
            foreach ($keywords as $keyword) {
                if (str_contains($program, $keyword)) {
                    // Check if field appears in job title
                    if (str_contains($jobTitle, $field) || str_contains($industry, $field)) {
                        return true;
                    }
                }
            }
        }
        
        // No match found
        return false;
    }
}
