<?php

namespace App\Services;

use App\Models\AlumniProfile;
use Illuminate\Support\Str;

/**
 * Intelligent Job Qualification Classifier
 * 
 * Classifies alumni job matches based on:
 * - Education level vs job level
 * - Degree program vs job field alignment
 * - Skills matching
 * - Philippine education/job standards
 * 
 * Classifications:
 * - good_match (none): Job aligns with education level and field
 * - overqualified: Education level too high for job
 * - underqualified: Education level too low for job  
 * - unfit: Job field doesn't match degree field
 */
class JobClassifierService
{
    /**
     * Education level hierarchy (Philippine standards)
     */
    private array $educationLevels = [
        'high_school' => 1,
        'vocational' => 2,
        'associate' => 3,
        'bachelor' => 4,
        'post_graduate_diploma' => 5,
        'master' => 6,
        'doctorate' => 7,
        'phd' => 7,
    ];

    /**
     * Job title patterns indicating seniority level
     */
    private array $seniorPatterns = [
        'ceo', 'cto', 'cfo', 'coo', 'cio', 'chief',
        'president', 'vice president', 'vp',
        'director', 'head', 'principal',
        'senior manager', 'general manager', 'country manager',
        'partner', 'owner', 'founder', 'proprietor',
    ];

    private array $midSeniorPatterns = [
        'manager', 'supervisor', 'superintendent', 'lead',
        'senior', 'specialist', 'consultant', 'architect',
        'team lead', 'section head', 'department head',
    ];

    private array $midLevelPatterns = [
        'engineer', 'developer', 'programmer', 'analyst',
        'accountant', 'nurse', 'teacher', 'professor',
        'designer', 'coordinator', 'officer', 'executive',
        'technician', 'therapist', 'pharmacist',
    ];

    private array $entryLevelPatterns = [
        'junior', 'trainee', 'intern', 'apprentice',
        'assistant', 'associate', 'aide', 'helper',
        'clerk', 'encoder', 'staff', 'representative',
        'cashier', 'teller', 'receptionist', 'secretary',
    ];

    private array $laborPatterns = [
        'driver', 'messenger', 'utility', 'janitor', 'cleaner',
        'security guard', 'guard', 'laborer', 'worker',
        'helper', 'crew', 'service crew', 'barista',
        'waiter', 'waitress', 'dishwasher', 'busboy',
        'vendor', 'peddler', 'factory worker',
    ];

    /**
     * Philippine degree programs mapped to related job fields
     * Based on CHED program classifications
     */
    private array $degreeJobMapping = [
        // ===== COLLEGE OF COMPUTING STUDIES (CCS) =====
        'computer science' => [
            'fields' => ['software', 'developer', 'programmer', 'engineer', 'it', 'tech', 'data', 'web', 'mobile', 'application', 'system', 'database', 'network', 'cyber', 'security', 'analyst', 'architect', 'devops', 'qa', 'testing', 'ai', 'machine learning', 'cloud'],
            'industries' => ['technology', 'it', 'software', 'telecommunications', 'fintech', 'e-commerce', 'gaming'],
            'level' => 4,
        ],
        'information technology' => [
            'fields' => ['it', 'tech', 'technology', 'system', 'network', 'support', 'administrator', 'analyst', 'helpdesk', 'infrastructure', 'technical', 'computer', 'hardware', 'software'],
            'industries' => ['technology', 'it', 'telecommunications', 'bpo', 'consulting'],
            'level' => 4,
        ],
        'information systems' => [
            'fields' => ['system', 'analyst', 'business', 'it', 'database', 'erp', 'sap', 'consultant', 'project', 'manager'],
            'industries' => ['technology', 'consulting', 'finance', 'banking'],
            'level' => 4,
        ],
        'data science' => [
            'fields' => ['data', 'analyst', 'scientist', 'analytics', 'machine learning', 'ai', 'statistics', 'big data', 'business intelligence', 'bi'],
            'industries' => ['technology', 'finance', 'consulting', 'research'],
            'level' => 4,
        ],

        // ===== COLLEGE OF ENGINEERING (CEN) =====
        'civil engineering' => [
            'fields' => ['civil', 'construction', 'structural', 'infrastructure', 'surveyor', 'project', 'engineer', 'site', 'building', 'design', 'architect'],
            'industries' => ['construction', 'engineering', 'infrastructure', 'real estate', 'government'],
            'level' => 4,
        ],
        'mechanical engineering' => [
            'fields' => ['mechanical', 'manufacturing', 'production', 'maintenance', 'design', 'cad', 'automotive', 'hvac', 'engineer', 'machine'],
            'industries' => ['manufacturing', 'automotive', 'engineering', 'energy', 'construction'],
            'level' => 4,
        ],
        'electrical engineering' => [
            'fields' => ['electrical', 'electronics', 'power', 'automation', 'control', 'instrumentation', 'engineer', 'technician', 'maintenance'],
            'industries' => ['energy', 'manufacturing', 'utilities', 'telecommunications', 'construction'],
            'level' => 4,
        ],
        'electronics engineering' => [
            'fields' => ['electronics', 'electrical', 'semiconductor', 'embedded', 'hardware', 'circuit', 'engineer', 'technician', 'telecommunications'],
            'industries' => ['electronics', 'telecommunications', 'manufacturing', 'semiconductor'],
            'level' => 4,
        ],
        'chemical engineering' => [
            'fields' => ['chemical', 'process', 'plant', 'manufacturing', 'quality', 'production', 'engineer', 'laboratory'],
            'industries' => ['chemical', 'pharmaceutical', 'food', 'manufacturing', 'oil and gas'],
            'level' => 4,
        ],
        'industrial engineering' => [
            'fields' => ['industrial', 'process', 'operations', 'quality', 'production', 'supply chain', 'logistics', 'manufacturing', 'engineer', 'analyst'],
            'industries' => ['manufacturing', 'logistics', 'consulting', 'operations'],
            'level' => 4,
        ],
        'computer engineering' => [
            'fields' => ['hardware', 'software', 'embedded', 'firmware', 'engineer', 'developer', 'system', 'network', 'computer'],
            'industries' => ['technology', 'electronics', 'telecommunications', 'semiconductor'],
            'level' => 4,
        ],

        // ===== COLLEGE OF BUSINESS ADMINISTRATION (CBA) =====
        'business administration' => [
            'fields' => ['business', 'management', 'administrator', 'operations', 'supervisor', 'coordinator', 'executive', 'analyst', 'officer', 'manager'],
            'industries' => ['any'],
            'level' => 4,
        ],
        'accountancy' => [
            'fields' => ['accountant', 'auditor', 'bookkeeper', 'financial', 'tax', 'payroll', 'cpa', 'accounts', 'finance', 'controller', 'treasurer'],
            'industries' => ['accounting', 'finance', 'banking', 'consulting', 'any'],
            'level' => 4,
        ],
        'accounting' => [
            'fields' => ['accountant', 'auditor', 'bookkeeper', 'financial', 'tax', 'payroll', 'accounts', 'finance', 'billing', 'clerk'],
            'industries' => ['accounting', 'finance', 'banking', 'any'],
            'level' => 4,
        ],
        'finance' => [
            'fields' => ['financial', 'analyst', 'banker', 'investment', 'portfolio', 'credit', 'wealth', 'treasury', 'finance', 'loan', 'underwriter'],
            'industries' => ['finance', 'banking', 'investment', 'insurance'],
            'level' => 4,
        ],
        'marketing' => [
            'fields' => ['marketing', 'brand', 'social media', 'content', 'digital', 'advertising', 'promotion', 'campaign', 'sales', 'product'],
            'industries' => ['marketing', 'advertising', 'retail', 'fmcg', 'any'],
            'level' => 4,
        ],
        'human resource' => [
            'fields' => ['hr', 'human resource', 'recruitment', 'talent', 'recruiter', 'people', 'personnel', 'training', 'compensation', 'benefits'],
            'industries' => ['any'],
            'level' => 4,
        ],
        'entrepreneurship' => [
            'fields' => ['founder', 'entrepreneur', 'startup', 'business owner', 'ceo', 'self-employed', 'manager', 'proprietor', 'owner'],
            'industries' => ['any'],
            'level' => 4,
        ],
        'management' => [
            'fields' => ['manager', 'supervisor', 'administrator', 'coordinator', 'operations', 'project', 'team lead', 'executive'],
            'industries' => ['any'],
            'level' => 4,
        ],
        'office administration' => [
            'fields' => ['admin', 'administrative', 'secretary', 'executive assistant', 'office', 'clerk', 'coordinator', 'receptionist'],
            'industries' => ['any'],
            'level' => 4,
        ],

        // ===== COLLEGE OF EDUCATION (CED) =====
        'elementary education' => [
            'fields' => ['teacher', 'elementary', 'primary', 'grade school', 'tutor', 'educator', 'instructor', 'academic'],
            'industries' => ['education', 'academic', 'training'],
            'level' => 4,
        ],
        'secondary education' => [
            'fields' => ['teacher', 'high school', 'secondary', 'subject teacher', 'instructor', 'educator', 'professor', 'academic'],
            'industries' => ['education', 'academic', 'training'],
            'level' => 4,
        ],
        'education' => [
            'fields' => ['teacher', 'professor', 'instructor', 'tutor', 'trainer', 'educator', 'academic', 'lecturer', 'teaching', 'school'],
            'industries' => ['education', 'academic', 'training', 'government'],
            'level' => 4,
        ],
        'physical education' => [
            'fields' => ['teacher', 'coach', 'trainer', 'fitness', 'sports', 'athletic', 'physical education', 'pe'],
            'industries' => ['education', 'sports', 'fitness', 'recreation'],
            'level' => 4,
        ],

        // ===== COLLEGE OF ARTS AND SCIENCES (CAS) =====
        'psychology' => [
            'fields' => ['psychologist', 'therapist', 'counselor', 'mental health', 'clinical', 'behavioral', 'hr', 'human resource', 'research'],
            'industries' => ['healthcare', 'education', 'hr', 'consulting'],
            'level' => 4,
        ],
        'communication' => [
            'fields' => ['communications', 'public relations', 'pr', 'media', 'content', 'writer', 'journalist', 'broadcaster', 'editor'],
            'industries' => ['media', 'advertising', 'marketing', 'entertainment'],
            'level' => 4,
        ],
        'journalism' => [
            'fields' => ['journalist', 'reporter', 'editor', 'writer', 'news', 'media', 'content', 'broadcaster', 'correspondent'],
            'industries' => ['media', 'publishing', 'broadcasting', 'entertainment'],
            'level' => 4,
        ],
        'political science' => [
            'fields' => ['government', 'public', 'policy', 'research', 'analyst', 'diplomat', 'law', 'paralegal', 'ngo'],
            'industries' => ['government', 'ngo', 'legal', 'consulting', 'education'],
            'level' => 4,
        ],
        'biology' => [
            'fields' => ['biologist', 'research', 'laboratory', 'lab', 'scientist', 'biotech', 'clinical', 'medical', 'technologist'],
            'industries' => ['healthcare', 'pharmaceutical', 'research', 'education'],
            'level' => 4,
        ],
        'chemistry' => [
            'fields' => ['chemist', 'laboratory', 'research', 'chemical', 'analyst', 'quality control', 'qc', 'qa', 'pharmaceutical'],
            'industries' => ['pharmaceutical', 'chemical', 'food', 'manufacturing', 'research'],
            'level' => 4,
        ],
        'mathematics' => [
            'fields' => ['mathematician', 'statistician', 'analyst', 'data', 'actuary', 'teacher', 'researcher', 'quantitative'],
            'industries' => ['finance', 'insurance', 'education', 'research', 'technology'],
            'level' => 4,
        ],
        'physics' => [
            'fields' => ['physicist', 'research', 'laboratory', 'scientist', 'analyst', 'engineer', 'technical'],
            'industries' => ['research', 'education', 'technology', 'energy'],
            'level' => 4,
        ],
        'english' => [
            'fields' => ['teacher', 'writer', 'editor', 'content', 'esl', 'english', 'tutor', 'instructor', 'communications'],
            'industries' => ['education', 'publishing', 'media', 'bpo'],
            'level' => 4,
        ],
        'social work' => [
            'fields' => ['social worker', 'case manager', 'counselor', 'community', 'welfare', 'support', 'ngo', 'development'],
            'industries' => ['ngo', 'government', 'healthcare', 'education'],
            'level' => 4,
        ],

        // ===== COLLEGE OF HOSPITALITY AND TOURISM MANAGEMENT (CHTM) =====
        'hospitality management' => [
            'fields' => ['hotel', 'restaurant', 'hospitality', 'food service', 'catering', 'front desk', 'housekeeping', 'f&b', 'food and beverage', 'manager', 'supervisor'],
            'industries' => ['hospitality', 'hotel', 'restaurant', 'tourism', 'food'],
            'level' => 4,
        ],
        'tourism management' => [
            'fields' => ['travel', 'tourism', 'tour', 'hotel', 'resort', 'airline', 'hospitality', 'guide', 'agent', 'coordinator'],
            'industries' => ['tourism', 'travel', 'hospitality', 'airline', 'hotel'],
            'level' => 4,
        ],
        'culinary' => [
            'fields' => ['chef', 'cook', 'culinary', 'kitchen', 'pastry', 'food', 'baker', 'sous chef', 'catering'],
            'industries' => ['food', 'restaurant', 'hospitality', 'hotel', 'catering'],
            'level' => 4,
        ],

        // ===== COLLEGE OF FINE ARTS (CAFA) =====
        'fine arts' => [
            'fields' => ['artist', 'designer', 'graphic', 'visual', 'creative', 'illustrator', 'animator', 'multimedia', 'art'],
            'industries' => ['design', 'advertising', 'media', 'entertainment', 'art'],
            'level' => 4,
        ],
        'architecture' => [
            'fields' => ['architect', 'design', 'architectural', 'urban', 'planning', 'interior', 'landscape', 'cad', 'drafting'],
            'industries' => ['architecture', 'construction', 'real estate', 'design'],
            'level' => 4,
        ],
        'interior design' => [
            'fields' => ['interior', 'designer', 'decorator', 'space', 'furnishing', 'cad', 'design'],
            'industries' => ['design', 'architecture', 'real estate', 'retail'],
            'level' => 4,
        ],
        'multimedia arts' => [
            'fields' => ['multimedia', 'video', 'animation', 'graphics', 'production', 'editor', 'motion', 'vfx', 'designer', 'creative'],
            'industries' => ['media', 'entertainment', 'advertising', 'gaming', 'technology'],
            'level' => 4,
        ],

        // ===== COLLEGE OF INDUSTRIAL TECHNOLOGY (CIT) =====
        'industrial technology' => [
            'fields' => ['technician', 'technical', 'manufacturing', 'production', 'maintenance', 'operator', 'mechanic', 'electrician'],
            'industries' => ['manufacturing', 'construction', 'utilities', 'automotive'],
            'level' => 4,
        ],
        'automotive technology' => [
            'fields' => ['automotive', 'mechanic', 'technician', 'car', 'vehicle', 'maintenance', 'repair', 'engine'],
            'industries' => ['automotive', 'manufacturing', 'transportation'],
            'level' => 4,
        ],
        'electronics technology' => [
            'fields' => ['electronics', 'technician', 'repair', 'maintenance', 'circuit', 'electrical', 'technical'],
            'industries' => ['electronics', 'telecommunications', 'manufacturing', 'retail'],
            'level' => 4,
        ],

        // ===== GRADUATE STUDIES =====
        'master' => [
            'fields' => ['manager', 'director', 'specialist', 'consultant', 'senior', 'lead', 'supervisor', 'analyst', 'researcher', 'professor'],
            'industries' => ['any'],
            'level' => 6,
        ],
        'doctorate' => [
            'fields' => ['professor', 'researcher', 'director', 'specialist', 'consultant', 'scientist', 'expert', 'dean', 'chief'],
            'industries' => ['any'],
            'level' => 7,
        ],

        // ===== HEALTHCARE =====
        'nursing' => [
            'fields' => ['nurse', 'rn', 'lpn', 'healthcare', 'medical', 'clinical', 'hospital', 'patient', 'care', 'health'],
            'industries' => ['healthcare', 'hospital', 'clinic', 'pharmaceutical'],
            'level' => 4,
        ],
        'medical technology' => [
            'fields' => ['medical technologist', 'laboratory', 'lab', 'clinical', 'diagnostic', 'pathology', 'blood bank', 'technician'],
            'industries' => ['healthcare', 'hospital', 'laboratory', 'diagnostic'],
            'level' => 4,
        ],
        'pharmacy' => [
            'fields' => ['pharmacist', 'pharmaceutical', 'pharmacy', 'drug', 'medication', 'clinical', 'retail'],
            'industries' => ['pharmaceutical', 'healthcare', 'retail', 'hospital'],
            'level' => 4,
        ],
        'physical therapy' => [
            'fields' => ['physical therapist', 'pt', 'rehabilitation', 'therapy', 'therapist', 'healthcare', 'clinical'],
            'industries' => ['healthcare', 'hospital', 'rehabilitation', 'sports'],
            'level' => 4,
        ],
        'radiologic technology' => [
            'fields' => ['radiologic', 'x-ray', 'imaging', 'technologist', 'radiology', 'ct scan', 'mri', 'diagnostic'],
            'industries' => ['healthcare', 'hospital', 'diagnostic', 'clinic'],
            'level' => 4,
        ],

        // ===== LAW =====
        'law' => [
            'fields' => ['lawyer', 'attorney', 'legal', 'counsel', 'paralegal', 'law clerk', 'advocate', 'judge', 'prosecutor'],
            'industries' => ['legal', 'government', 'corporate', 'consulting'],
            'level' => 6,
        ],
        'criminology' => [
            'fields' => ['police', 'law enforcement', 'officer', 'detective', 'corrections', 'security', 'investigator', 'criminal'],
            'industries' => ['government', 'security', 'law enforcement'],
            'level' => 4,
        ],
    ];

    /**
     * Classify an alumni's job match
     */
    public function classify(AlumniProfile $alumni): ?array
    {
        // Skip if no employment data
        if (!$this->hasEmploymentData($alumni)) {
            return null;
        }

        $jobTitle = strtolower(trim($alumni->current_job_title ?? ''));
        
        // Get degree program from course relationship if degree_program field is empty
        $degreeProgram = $this->getDegreeProgram($alumni);
        
        $companyIndustry = strtolower(trim($alumni->company_industry ?? ''));
        
        // Detect job level from title
        $jobLevel = $this->detectJobLevel($jobTitle);
        
        // Get education level
        $educationLevel = $this->getEducationLevel($degreeProgram);
        
        // Check field alignment
        $fieldMatch = $this->checkFieldAlignment($degreeProgram, $jobTitle, $companyIndustry);
        
        // Determine classification
        $classification = $this->determineClassification(
            $educationLevel,
            $jobLevel,
            $fieldMatch
        );

        return [
            'classification' => $classification['reason'],
            'confidence' => $classification['confidence'],
            'job_satisfaction' => $classification['satisfaction'],
            'job_related_to_degree' => $classification['related'],
            'analysis' => [
                'education_level' => $educationLevel,
                'job_level' => $jobLevel,
                'field_match_score' => $fieldMatch['score'],
                'field_match_reason' => $fieldMatch['reason'],
                'degree_program' => $degreeProgram,
            ],
        ];
    }

    /**
     * Get degree program - checks degree_program field first, then course relationship
     */
    private function getDegreeProgram(AlumniProfile $alumni): string
    {
        // First check the degree_program field
        if (!empty(trim($alumni->degree_program ?? ''))) {
            return strtolower(trim($alumni->degree_program));
        }
        
        // Fall back to course relationship
        if ($alumni->course) {
            return strtolower(trim($alumni->course->name ?? ''));
        }
        
        // Try loading the relationship if not loaded
        $alumni->load('course');
        if ($alumni->course) {
            return strtolower(trim($alumni->course->name ?? ''));
        }
        
        return '';
    }

    /**
     * Check if alumni has valid employment data for classification
     */
    private function hasEmploymentData(AlumniProfile $alumni): bool
    {
        // Must be employed
        $employedStatuses = ['employed_full_time', 'employed_part_time', 'self_employed'];
        if (!in_array($alumni->employment_status, $employedStatuses)) {
            return false;
        }

        // Must have job title
        if (empty(trim($alumni->current_job_title ?? ''))) {
            return false;
        }

        // Must have degree program (from field or course relationship)
        $degreeProgram = $this->getDegreeProgram($alumni);
        if (empty($degreeProgram)) {
            return false;
        }

        return true;
    }

    /**
     * Detect job seniority level from title
     * Returns: 1 (labor) to 5 (senior executive)
     */
    private function detectJobLevel(string $jobTitle): int
    {
        $jobTitle = strtolower($jobTitle);

        // Check senior executive patterns first
        foreach ($this->seniorPatterns as $pattern) {
            if (Str::contains($jobTitle, $pattern)) {
                return 5; // Senior executive
            }
        }

        // Check mid-senior patterns
        foreach ($this->midSeniorPatterns as $pattern) {
            if (Str::contains($jobTitle, $pattern)) {
                return 4; // Mid-senior
            }
        }

        // Check mid-level patterns
        foreach ($this->midLevelPatterns as $pattern) {
            if (Str::contains($jobTitle, $pattern)) {
                return 3; // Mid-level professional
            }
        }

        // Check entry-level patterns
        foreach ($this->entryLevelPatterns as $pattern) {
            if (Str::contains($jobTitle, $pattern)) {
                return 2; // Entry-level
            }
        }

        // Check labor patterns
        foreach ($this->laborPatterns as $pattern) {
            if (Str::contains($jobTitle, $pattern)) {
                return 1; // Labor/basic
            }
        }

        // Default to entry level if unknown
        return 2;
    }

    /**
     * Get education level from degree program
     */
    private function getEducationLevel(string $degreeProgram): int
    {
        $program = strtolower($degreeProgram);

        // Check for advanced degrees
        // Note: "Doctor of Philosophy" starts with "doctor" not "doctorate"
        if (Str::contains($program, ['phd', 'ph.d', 'doctorate', 'doctoral', 'doctor of'])) {
            return 7; // PhD
        }
        if (Str::contains($program, ['master', 'mba', 'm.a.', 'm.s.', 'llm', 'med', 'mpa'])) {
            return 6; // Master's
        }
        if (Str::contains($program, ['post graduate', 'postgraduate', 'diploma'])) {
            return 5; // Post-grad diploma
        }
        if (Str::contains($program, ['bachelor', 'bs', 'b.s.', 'ba', 'b.a.', 'ab', 'bsba', 'bsit', 'bscs', 'bsed', 'beed'])) {
            return 4; // Bachelor's
        }
        if (Str::contains($program, ['associate', 'two-year', '2-year'])) {
            return 3; // Associate
        }
        if (Str::contains($program, ['vocational', 'tesda', 'nc ii', 'nc iii', 'certificate'])) {
            return 2; // Vocational
        }

        // Default to Bachelor's for most Philippine alumni
        return 4;
    }

    /**
     * Check if job field aligns with degree program
     */
    private function checkFieldAlignment(string $degreeProgram, string $jobTitle, string $industry): array
    {
        $program = strtolower($degreeProgram);
        $job = strtolower($jobTitle);
        $industry = strtolower($industry);

        $bestMatch = [
            'score' => 0,
            'reason' => 'No matching fields found',
            'matched_program' => null,
        ];

        // Check each degree mapping
        foreach ($this->degreeJobMapping as $programKey => $mapping) {
            if (Str::contains($program, $programKey)) {
                $score = 0;
                $matchedFields = [];

                // Check job title against fields
                foreach ($mapping['fields'] as $field) {
                    if (Str::contains($job, $field)) {
                        $score += 20;
                        $matchedFields[] = $field;
                    }
                }

                // Check industry alignment
                if (in_array('any', $mapping['industries'])) {
                    $score += 10; // Flexible degree
                } else {
                    foreach ($mapping['industries'] as $ind) {
                        if (Str::contains($industry, $ind)) {
                            $score += 15;
                            break;
                        }
                    }
                }

                // Cap score at 100
                $score = min(100, $score);

                if ($score > $bestMatch['score']) {
                    $bestMatch = [
                        'score' => $score,
                        'reason' => $score >= 40 
                            ? 'Job aligns with degree field' 
                            : 'Limited field alignment',
                        'matched_program' => $programKey,
                        'matched_fields' => $matchedFields,
                    ];
                }
            }
        }

        // If no mapping found, do basic keyword matching
        if ($bestMatch['score'] === 0) {
            // Extract key words from degree and check in job
            $degreeWords = preg_split('/[\s\-\_]+/', $program);
            foreach ($degreeWords as $word) {
                if (strlen($word) > 3 && Str::contains($job, $word)) {
                    $bestMatch['score'] += 15;
                }
                if (strlen($word) > 3 && Str::contains($industry, $word)) {
                    $bestMatch['score'] += 10;
                }
            }
            
            if ($bestMatch['score'] > 0) {
                $bestMatch['reason'] = 'Partial keyword match found';
            }
        }

        return $bestMatch;
    }

    /**
     * Determine final classification based on all factors
     */
    private function determineClassification(int $educationLevel, int $jobLevel, array $fieldMatch): array
    {
        $classification = [
            'reason' => 'none', // Good match by default
            'confidence' => 'medium',
            'satisfaction' => 3,
            'related' => true,
        ];

        // Education level mapping to expected job level
        // Bachelor's (4) should be in Mid-level (3) or higher jobs
        // Master's (6) should be in Mid-senior (4) or higher
        // PhD (7) should be in Senior (5) or Senior-Mid (4)
        $expectedMinJobLevel = match(true) {
            $educationLevel >= 7 => 4, // PhD expects mid-senior+
            $educationLevel >= 6 => 3, // Master's expects mid-level+
            $educationLevel >= 4 => 2, // Bachelor's expects entry+
            default => 1,
        };

        // Calculate level gap
        $levelGap = $educationLevel - ($jobLevel + 2); // Normalize scales

        // === OVERQUALIFIED ===
        // High education in low-level job
        if ($educationLevel >= 6 && $jobLevel <= 2) {
            // Master's/PhD in entry-level or labor job
            $classification['reason'] = 'overqualified';
            $classification['confidence'] = 'high';
            $classification['satisfaction'] = rand(2, 3);
            $classification['related'] = $fieldMatch['score'] >= 30;
            return $classification;
        }
        
        if ($educationLevel >= 4 && $jobLevel === 1) {
            // Bachelor's in labor job
            $classification['reason'] = 'overqualified';
            $classification['confidence'] = 'high';
            $classification['satisfaction'] = rand(2, 3);
            $classification['related'] = false;
            return $classification;
        }

        // === UNDERQUALIFIED ===
        // Low education in high-level job (rare, usually experience compensates)
        if ($educationLevel <= 3 && $jobLevel >= 4) {
            // Associate or lower in managerial role
            $classification['reason'] = 'underqualified';
            $classification['confidence'] = 'medium';
            $classification['satisfaction'] = rand(3, 4);
            $classification['related'] = $fieldMatch['score'] >= 30;
            return $classification;
        }

        // === UNFIT ===
        // Field mismatch regardless of level
        if ($fieldMatch['score'] < 20) {
            // Very low field alignment
            $classification['reason'] = 'unfit';
            $classification['confidence'] = $fieldMatch['score'] < 10 ? 'high' : 'medium';
            $classification['satisfaction'] = rand(2, 4);
            $classification['related'] = false;
            return $classification;
        }

        // === GOOD MATCH ===
        // Appropriate level and field alignment
        if ($fieldMatch['score'] >= 40 && $jobLevel >= $expectedMinJobLevel) {
            $classification['reason'] = 'none'; // Good match
            $classification['confidence'] = $fieldMatch['score'] >= 60 ? 'high' : 'medium';
            $classification['satisfaction'] = rand(4, 5);
            $classification['related'] = true;
            return $classification;
        }

        // === PARTIAL MATCH ===
        // Some alignment but not perfect
        if ($fieldMatch['score'] >= 20 && $fieldMatch['score'] < 40) {
            // Could be career change or adjacent field
            $classification['reason'] = 'none'; // Still acceptable
            $classification['confidence'] = 'low';
            $classification['satisfaction'] = rand(3, 4);
            $classification['related'] = true;
            return $classification;
        }

        // Default: Good match with medium confidence
        $classification['confidence'] = 'medium';
        $classification['satisfaction'] = rand(3, 4);
        
        return $classification;
    }

    /**
     * Classify and update an alumni profile
     */
    public function classifyAndUpdate(AlumniProfile $alumni): bool
    {
        $result = $this->classify($alumni);

        if ($result === null) {
            // No classification possible, clear any existing
            $alumni->update([
                'job_mismatch_reason' => null,
                'job_satisfaction' => null,
                'job_related_to_degree' => null,
            ]);
            return false;
        }

        $alumni->update([
            'job_mismatch_reason' => $result['classification'],
            'job_satisfaction' => $result['job_satisfaction'],
            'job_related_to_degree' => $result['job_related_to_degree'],
        ]);

        return true;
    }

    /**
     * Batch classify all employed alumni
     */
    public function classifyAll(bool $force = false): array
    {
        $stats = [
            'none' => 0, // Good match
            'overqualified' => 0,
            'underqualified' => 0,
            'unfit' => 0,
            'skipped' => 0,
            'errors' => 0,
        ];

        $alumni = AlumniProfile::whereIn('employment_status', [
            'employed_full_time',
            'employed_part_time', 
            'self_employed',
        ])->get();

        foreach ($alumni as $profile) {
            try {
                // Skip if already classified recently (unless force)
                if (!$force && $profile->job_mismatch_reason && 
                    $profile->updated_at && 
                    $profile->updated_at->diffInDays(now()) < 30) {
                    $stats['skipped']++;
                    continue;
                }

                $result = $this->classify($profile);

                if ($result === null) {
                    $stats['skipped']++;
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
        }

        return $stats;
    }

    /**
     * Get classification statistics
     */
    public function getStats(): array
    {
        return [
            'good_match' => AlumniProfile::where('job_mismatch_reason', 'none')
                ->orWhereNull('job_mismatch_reason')
                ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
                ->count(),
            'overqualified' => AlumniProfile::where('job_mismatch_reason', 'overqualified')->count(),
            'underqualified' => AlumniProfile::where('job_mismatch_reason', 'underqualified')->count(),
            'unfit' => AlumniProfile::where('job_mismatch_reason', 'unfit')->count(),
        ];
    }
}
