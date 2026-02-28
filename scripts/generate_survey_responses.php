<?php
/**
 * Clean stale survey data and generate realistic survey responses for all 800 alumni.
 * 
 * Generates responses for:
 *   - Survey 1: Alumni Registration & Initial Survey (22 questions) — all alumni
 *   - Survey 5: Alumni Employment & Job Satisfaction Survey (12 questions) — ~70% of alumni
 *   - Survey 7: Employment Quality & Job Satisfaction Survey (13 questions) — ~40% of alumni
 */

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\AlumniProfile;

// ─── STEP 1: Clean all stale survey data ────────────────────────────
echo "=== STEP 1: Cleaning stale survey data ===\n";

// Delete all existing survey answers
$deletedAnswers = DB::table('survey_answers')->delete();
echo "  Deleted {$deletedAnswers} survey answers\n";

// Delete all existing survey responses
$deletedResponses = DB::table('survey_responses')->delete();
echo "  Deleted {$deletedResponses} survey responses\n";

// Reset survey response_rate columns
DB::table('surveys')->update(['response_rate' => 0]);
echo "  Reset survey response_rate fields\n\n";

// ─── STEP 2: Load alumni data ───────────────────────────────────────
echo "=== STEP 2: Loading alumni profiles ===\n";
$alumni = AlumniProfile::with('user')->get();
echo "  Found {$alumni->count()} alumni profiles\n\n";

if ($alumni->isEmpty()) {
    echo "❌ No alumni found. Run populate_alumni.php first.\n";
    exit(1);
}

// ─── Helper functions ───────────────────────────────────────────────
function generateResponseToken(): string {
    return Str::random(40);
}

function randomDate(string $startDate, string $endDate): string {
    $start = strtotime($startDate);
    $end = strtotime($endDate);
    $ts = mt_rand($start, $end);
    return date('Y-m-d H:i:s', $ts);
}

function randomTimeSpent(int $numQuestions): int {
    // Average 15-60 seconds per question
    return $numQuestions * mt_rand(15, 60);
}

// Employment status mapping from profile to survey option text
$empStatusMap = [
    'employed_full_time' => 'Employed Full-time',
    'employed_part_time' => 'Employed Part-time',
    'self_employed' => 'Self-employed',
    'unemployed_seeking' => 'Unemployed (seeking work)',
    'unemployed_not_seeking' => 'Unemployed (not seeking work)',
    'continuing_education' => 'Continuing Education',
    'other' => 'Other',
];

// Survey 5 employment mapping
$empStatusMapS5 = [
    'employed_full_time' => 'Employed (Full-Time)',
    'employed_part_time' => 'Employed (Part-Time)',
    'self_employed' => 'Self-Employed',
    'unemployed_seeking' => 'Unemployed (Seeking Employment)',
    'unemployed_not_seeking' => 'Unemployed (Not Seeking Employment)',
    'continuing_education' => 'Continuing Education',
    'other' => 'Other',
];

// Survey 7 employment mapping
$empStatusMapS7 = [
    'employed_full_time' => 'Employed (Full-Time)',
    'employed_part_time' => 'Employed (Part-Time)',
    'self_employed' => 'Self-Employed',
    'unemployed_seeking' => 'Unemployed (Seeking Employment)',
    'unemployed_not_seeking' => 'Unemployed (Not Seeking)',
    'continuing_education' => 'Continuing Education',
    'other' => 'Other',
];

$mentorOptions = ['Yes', 'No', 'Maybe'];
$feedbackOptions = [
    'Great university experience overall. Would recommend to others.',
    'The curriculum was solid but could use more industry-oriented courses.',
    'I wish there were more internship opportunities during my studies.',
    'The faculty members were very supportive and knowledgeable.',
    'More hands-on training would have been beneficial.',
    'The career guidance office helped me find my first job.',
    'I learned a lot from my classmates and group projects.',
    'The facilities could be improved, especially the computer labs.',
    'Good balance of theoretical and practical learning.',
    'I appreciate the mentorship programs available.',
    'The alumni network has been very helpful in my career.',
    'Would love to see more industry partnerships and OJT opportunities.',
    'The education I received gave me a strong foundation for my career.',
    null, // Some people leave it blank
    null,
    null,
];

$salaryS5 = [
    'Below ₱250,000', '₱250,000 - ₱500,000', '₱500,000 - ₱750,000',
    '₱750,000 - ₱1,000,000', '₱1,000,000 - ₱1,500,000', 'Above ₱1,500,000', 'Prefer not to say',
];

$salaryS7 = [
    'Below ₱200,000', '₱200,000 - ₱300,000', '₱300,000 - ₱400,000',
    '₱400,000 - ₱500,000', '₱500,000 - ₱750,000', '₱750,000 - ₱1,000,000',
    'Above ₱1,000,000', 'Prefer not to say',
];

$jobMatchS5 = [
    'Perfect match - Job requires my level of education',
    'Overqualified - Job requires less education than I have',
    'Underqualified - Job requires more education than I have',
    'Unfit - Job is in a completely different field',
    'Career change by choice',
];

$jobMatchS7 = [
    'Perfect match - My job requires exactly my level of education',
    'Overqualified - My job requires less education than I have',
    'Underqualified - My job requires more education/training than I have',
    'Unfit - My job is not in my field of study at all',
    'Career change by choice',
];

$jobRelatedS5 = ['Yes, directly related', 'Yes, somewhat related', 'No, not related at all'];

$timeToJobOptions = [
    'Less than 1 month', '1-3 months', '3-6 months',
    '6-12 months', 'More than 1 year', 'Had a job before graduation',
];

$unemployReasonS5 = [
    'Lack of job opportunities in my field',
    'Overqualified for available positions',
    'Underqualified for desired positions',
    'Location constraints',
    'Health reasons',
    'Family obligations',
    'Continuing education/Further studies',
    'Waiting for better opportunities',
    'Other',
];

$unemployReasonS7 = [
    'Lack of job opportunities in my field',
    'Overqualified for available positions',
    'Underqualified - need additional training/certifications',
    'Location constraints',
    'Health reasons',
    'Family obligations',
    'Continuing education/further studies',
    'Recently graduated - still searching',
    'Other',
];

$skillsFeedback = [
    'More practical programming and software development skills.',
    'Business communication and presentation skills.',
    'Digital marketing and social media management.',
    'Project management and leadership training.',
    'Financial literacy and investment knowledge.',
    'Advanced data analysis and statistics.',
    'Industry-specific certifications.',
    'Foreign language skills for international careers.',
    'Entrepreneurship and business startup knowledge.',
    null,
    null,
];

$skillsUsedS7 = [
    'Technical/specialized knowledge',
    'Research and analysis',
    'Critical thinking',
    'Communication skills',
    'Teamwork and collaboration',
    'Problem-solving',
    'Leadership',
    'Project management',
    'Computer/technology skills',
];

// ─── STEP 3: Generate Survey 1 responses (all alumni) ───────────────
echo "=== STEP 3: Generating Survey 1 responses (Registration Survey) ===\n";

$totalQuestions = 22;
$created1 = 0;

DB::beginTransaction();
try {
    foreach ($alumni as $a) {
        $user = $a->user;
        if (!$user) continue;

        // Response date: somewhere between their creation date and now
        $startDate = $a->created_at->format('Y-m-d H:i:s');
        $responseDate = randomDate($startDate, '2026-02-25 12:00:00');
        $completedDate = date('Y-m-d H:i:s', strtotime($responseDate) + mt_rand(300, 1800));
        $timeSpent = randomTimeSpent($totalQuestions);

        // Insert survey response
        $responseId = DB::table('survey_responses')->insertGetId([
            'survey_id' => 1,
            'user_id' => $user->id,
            'campus_id' => $a->campus_id,
            'response_token' => generateResponseToken(),
            'status' => 'completed',
            'started_at' => $responseDate,
            'completed_at' => $completedDate,
            'last_updated_at' => $completedDate,
            'respondent_email' => $user->email,
            'respondent_name' => $a->first_name . ' ' . $a->last_name,
            'respondent_student_id' => $a->student_id,
            'total_questions' => $totalQuestions,
            'answered_questions' => $totalQuestions,
            'completion_percentage' => 100.00,
            'time_spent_seconds' => $timeSpent,
            'is_valid_response' => true,
            'created_at' => $responseDate,
            'updated_at' => $completedDate,
        ]);

        $isEmployed = in_array($a->employment_status, ['employed_full_time', 'employed_part_time', 'self_employed']);
        $mentor = $a->willing_to_mentor ? 'Yes' : $mentorOptions[array_rand($mentorOptions)];
        $feedback = $feedbackOptions[array_rand($feedbackOptions)];

        // Build answers array for all 22 questions
        $answers = [
            // Q1: First Name
            ['survey_question_id' => 1, 'answer_text' => $a->first_name],
            // Q2: Last Name
            ['survey_question_id' => 2, 'answer_text' => $a->last_name],
            // Q3: Student ID
            ['survey_question_id' => 3, 'answer_text' => $a->student_id],
            // Q4: Email Address
            ['survey_question_id' => 4, 'answer_text' => $user->email],
            // Q5: Phone Number
            ['survey_question_id' => 5, 'answer_text' => $a->phone],
            // Q6: Date of Birth
            ['survey_question_id' => 6, 'answer_date' => $a->birth_date ? $a->birth_date->format('Y-m-d') : null],
            // Q7: Gender
            ['survey_question_id' => 7, 'answer_text' => $a->gender],
            // Q8: Degree Program
            ['survey_question_id' => 8, 'answer_text' => $a->degree_program],
            // Q9: Major
            ['survey_question_id' => 9, 'answer_text' => $a->major ?? $a->degree_program],
            // Q10: Graduation Year
            ['survey_question_id' => 10, 'answer_number' => $a->graduation_year],
            // Q11: GPA
            ['survey_question_id' => 11, 'answer_number' => round(mt_rand(250, 400) / 100, 2)],
            // Q12: Current Employment Status
            ['survey_question_id' => 12, 'answer_text' => $empStatusMap[$a->employment_status] ?? 'Other'],
            // Q13: Current Job Title
            ['survey_question_id' => 13, 'answer_text' => $a->current_job_title],
            // Q14: Current Employer
            ['survey_question_id' => 14, 'answer_text' => $a->current_employer],
            // Q15: Annual Salary (Optional) — convert salary_range to rough number
            ['survey_question_id' => 15, 'answer_number' => $isEmployed ? mt_rand(150000, 1500000) : null],
            // Q16: Current Address
            ['survey_question_id' => 16, 'answer_text' => $a->current_address],
            // Q17: City
            ['survey_question_id' => 17, 'answer_text' => $a->city],
            // Q18: Country
            ['survey_question_id' => 18, 'answer_text' => $a->country ?? 'Philippines'],
            // Q19: Willing to mentor
            ['survey_question_id' => 19, 'answer_text' => $mentor],
            // Q20: Additional Comments
            ['survey_question_id' => 20, 'answer_text' => $feedback],
            // Q21: Create Password (dummy, wouldn't store real)
            ['survey_question_id' => 21, 'answer_text' => '********'],
            // Q22: Confirm Password
            ['survey_question_id' => 22, 'answer_text' => '********'],
        ];

        foreach ($answers as $answer) {
            $answerTime = date('Y-m-d H:i:s', strtotime($responseDate) + mt_rand(5, $timeSpent));
            DB::table('survey_answers')->insert(array_merge([
                'survey_response_id' => $responseId,
                'answered_at' => $answerTime,
                'time_spent_seconds' => mt_rand(5, 60),
                'is_skipped' => false,
                'created_at' => $answerTime,
                'updated_at' => $answerTime,
            ], $answer));
        }

        $created1++;
        if ($created1 % 100 === 0) {
            echo "  Created {$created1}/{$alumni->count()} Survey 1 responses...\n";
        }
    }
    DB::commit();
    echo "  ✅ Survey 1: {$created1} completed responses\n\n";
} catch (\Exception $e) {
    DB::rollBack();
    echo "  ❌ Survey 1 Error: {$e->getMessage()}\n";
    echo "  Line: {$e->getLine()}\n";
    exit(1);
}

// ─── STEP 4: Generate Survey 5 responses (~70% of alumni) ───────────
echo "=== STEP 4: Generating Survey 5 responses (Employment Survey) ===\n";

$survey5Questions = 12; // Q25-Q36
$created5 = 0;
$shuffledAlumni = $alumni->shuffle();
$survey5Alumni = $shuffledAlumni->take((int)($alumni->count() * 0.70));

DB::beginTransaction();
try {
    foreach ($survey5Alumni as $a) {
        $user = $a->user;
        if (!$user) continue;

        $isEmployed = in_array($a->employment_status, ['employed_full_time', 'employed_part_time', 'self_employed']);
        
        $responseDate = randomDate('2025-06-01', '2026-02-25 12:00:00');
        $completedDate = date('Y-m-d H:i:s', strtotime($responseDate) + mt_rand(180, 900));
        $timeSpent = randomTimeSpent($survey5Questions);
        $answered = mt_rand(9, 12); // Most people answer 9-12 of 12

        $responseId = DB::table('survey_responses')->insertGetId([
            'survey_id' => 5,
            'user_id' => $user->id,
            'campus_id' => $a->campus_id,
            'response_token' => generateResponseToken(),
            'status' => 'completed',
            'started_at' => $responseDate,
            'completed_at' => $completedDate,
            'last_updated_at' => $completedDate,
            'respondent_email' => $user->email,
            'respondent_name' => $a->first_name . ' ' . $a->last_name,
            'respondent_student_id' => $a->student_id,
            'total_questions' => $survey5Questions,
            'answered_questions' => $answered,
            'completion_percentage' => 100.00,
            'time_spent_seconds' => $timeSpent,
            'is_valid_response' => true,
            'created_at' => $responseDate,
            'updated_at' => $completedDate,
        ]);

        // Q25: Employment status
        $empText = $empStatusMapS5[$a->employment_status] ?? 'Other';
        DB::table('survey_answers')->insert([
            'survey_response_id' => $responseId,
            'survey_question_id' => 25,
            'answer_text' => $empText,
            'answered_at' => $responseDate,
            'time_spent_seconds' => mt_rand(5, 30),
            'is_skipped' => false,
            'created_at' => $responseDate,
            'updated_at' => $responseDate,
        ]);

        // Q26: Job title (if employed)
        DB::table('survey_answers')->insert([
            'survey_response_id' => $responseId,
            'survey_question_id' => 26,
            'answer_text' => $a->current_job_title,
            'is_skipped' => !$isEmployed,
            'answered_at' => $responseDate,
            'time_spent_seconds' => mt_rand(5, 20),
            'created_at' => $responseDate,
            'updated_at' => $responseDate,
        ]);

        // Q27: Employer (if employed)
        DB::table('survey_answers')->insert([
            'survey_response_id' => $responseId,
            'survey_question_id' => 27,
            'answer_text' => $a->current_employer,
            'is_skipped' => !$isEmployed,
            'answered_at' => $responseDate,
            'time_spent_seconds' => mt_rand(5, 20),
            'created_at' => $responseDate,
            'updated_at' => $responseDate,
        ]);

        // Q28: Job related to degree
        $jobRelated = $isEmployed ? $jobRelatedS5[array_rand($jobRelatedS5)] : null;
        DB::table('survey_answers')->insert([
            'survey_response_id' => $responseId,
            'survey_question_id' => 28,
            'answer_text' => $jobRelated,
            'is_skipped' => !$isEmployed,
            'answered_at' => $responseDate,
            'time_spent_seconds' => mt_rand(5, 20),
            'created_at' => $responseDate,
            'updated_at' => $responseDate,
        ]);

        // Q29: Job match quality
        $jobMatch = $isEmployed ? $jobMatchS5[array_rand(array_slice($jobMatchS5, 0, 4))] : null;
        DB::table('survey_answers')->insert([
            'survey_response_id' => $responseId,
            'survey_question_id' => 29,
            'answer_text' => $jobMatch,
            'is_skipped' => !$isEmployed,
            'answered_at' => $responseDate,
            'time_spent_seconds' => mt_rand(5, 30),
            'created_at' => $responseDate,
            'updated_at' => $responseDate,
        ]);

        // Q30: Job satisfaction rating (1-5)
        $satisfaction = $isEmployed ? mt_rand(2, 5) : null;
        DB::table('survey_answers')->insert([
            'survey_response_id' => $responseId,
            'survey_question_id' => 30,
            'answer_number' => $satisfaction,
            'is_skipped' => !$isEmployed,
            'answered_at' => $responseDate,
            'time_spent_seconds' => mt_rand(5, 15),
            'created_at' => $responseDate,
            'updated_at' => $responseDate,
        ]);

        // Q31: Salary range
        $salaryText = $isEmployed ? $salaryS5[array_rand($salaryS5)] : null;
        DB::table('survey_answers')->insert([
            'survey_response_id' => $responseId,
            'survey_question_id' => 31,
            'answer_text' => $salaryText,
            'is_skipped' => !$isEmployed || (mt_rand(1, 100) <= 15), // 15% skip salary
            'answered_at' => $responseDate,
            'time_spent_seconds' => mt_rand(5, 15),
            'created_at' => $responseDate,
            'updated_at' => $responseDate,
        ]);

        // Q32: Time to find first job
        $timeToJob = $isEmployed ? $timeToJobOptions[array_rand($timeToJobOptions)] : null;
        DB::table('survey_answers')->insert([
            'survey_response_id' => $responseId,
            'survey_question_id' => 32,
            'answer_text' => $timeToJob,
            'is_skipped' => !$isEmployed,
            'answered_at' => $responseDate,
            'time_spent_seconds' => mt_rand(5, 15),
            'created_at' => $responseDate,
            'updated_at' => $responseDate,
        ]);

        // Q33: Unemployment reason (only for unemployed)
        $isUnemployed = in_array($a->employment_status, ['unemployed_seeking', 'unemployed_not_seeking']);
        $unemployReason = $isUnemployed ? $unemployReasonS5[array_rand($unemployReasonS5)] : null;
        DB::table('survey_answers')->insert([
            'survey_response_id' => $responseId,
            'survey_question_id' => 33,
            'answer_text' => $unemployReason,
            'is_skipped' => !$isUnemployed,
            'answered_at' => $responseDate,
            'time_spent_seconds' => mt_rand(5, 20),
            'created_at' => $responseDate,
            'updated_at' => $responseDate,
        ]);

        // Q34: Skills wished they learned more
        $skillWish = $skillsFeedback[array_rand($skillsFeedback)];
        DB::table('survey_answers')->insert([
            'survey_response_id' => $responseId,
            'survey_question_id' => 34,
            'answer_text' => $skillWish,
            'is_skipped' => $skillWish === null,
            'answered_at' => $responseDate,
            'time_spent_seconds' => mt_rand(10, 60),
            'created_at' => $responseDate,
            'updated_at' => $responseDate,
        ]);

        // Q35: Education preparation rating (1-5)
        $eduRating = mt_rand(2, 5);
        DB::table('survey_answers')->insert([
            'survey_response_id' => $responseId,
            'survey_question_id' => 35,
            'answer_number' => $eduRating,
            'is_skipped' => false,
            'answered_at' => $responseDate,
            'time_spent_seconds' => mt_rand(5, 15),
            'created_at' => $responseDate,
            'updated_at' => $responseDate,
        ]);

        // Q36: Additional feedback
        $addFeedback = mt_rand(1, 100) <= 40 ? $feedbackOptions[array_rand($feedbackOptions)] : null;
        DB::table('survey_answers')->insert([
            'survey_response_id' => $responseId,
            'survey_question_id' => 36,
            'answer_text' => $addFeedback,
            'is_skipped' => $addFeedback === null,
            'answered_at' => $responseDate,
            'time_spent_seconds' => mt_rand(10, 60),
            'created_at' => $responseDate,
            'updated_at' => $responseDate,
        ]);

        $created5++;
        if ($created5 % 100 === 0) {
            echo "  Created {$created5}/{$survey5Alumni->count()} Survey 5 responses...\n";
        }
    }
    DB::commit();
    echo "  ✅ Survey 5: {$created5} completed responses\n\n";
} catch (\Exception $e) {
    DB::rollBack();
    echo "  ❌ Survey 5 Error: {$e->getMessage()}\n";
    echo "  Line: {$e->getLine()}\n";
    exit(1);
}

// ─── STEP 5: Generate Survey 7 responses (~40% of alumni) ───────────
echo "=== STEP 5: Generating Survey 7 responses (Employment Quality Survey) ===\n";

$survey7Questions = 13; // Q40-Q52
$created7 = 0;
$survey7Alumni = $shuffledAlumni->take((int)($alumni->count() * 0.40));

DB::beginTransaction();
try {
    foreach ($survey7Alumni as $a) {
        $user = $a->user;
        if (!$user) continue;

        $isEmployed = in_array($a->employment_status, ['employed_full_time', 'employed_part_time', 'self_employed']);
        $isUnemployed = in_array($a->employment_status, ['unemployed_seeking', 'unemployed_not_seeking']);

        $responseDate = randomDate('2025-09-01', '2026-02-25 12:00:00');
        $completedDate = date('Y-m-d H:i:s', strtotime($responseDate) + mt_rand(300, 1200));
        $timeSpent = randomTimeSpent($survey7Questions);
        $answered = mt_rand(10, 13);

        $responseId = DB::table('survey_responses')->insertGetId([
            'survey_id' => 7,
            'user_id' => $user->id,
            'campus_id' => $a->campus_id,
            'response_token' => generateResponseToken(),
            'status' => 'completed',
            'started_at' => $responseDate,
            'completed_at' => $completedDate,
            'last_updated_at' => $completedDate,
            'respondent_email' => $user->email,
            'respondent_name' => $a->first_name . ' ' . $a->last_name,
            'respondent_student_id' => $a->student_id,
            'total_questions' => $survey7Questions,
            'answered_questions' => $answered,
            'completion_percentage' => 100.00,
            'time_spent_seconds' => $timeSpent,
            'is_valid_response' => true,
            'created_at' => $responseDate,
            'updated_at' => $completedDate,
        ]);

        // Q40: Employment status
        DB::table('survey_answers')->insert([
            'survey_response_id' => $responseId,
            'survey_question_id' => 40,
            'answer_text' => $empStatusMapS7[$a->employment_status] ?? 'Other',
            'is_skipped' => false,
            'answered_at' => $responseDate,
            'time_spent_seconds' => mt_rand(5, 20),
            'created_at' => $responseDate,
            'updated_at' => $responseDate,
        ]);

        // Q41: Job title
        DB::table('survey_answers')->insert([
            'survey_response_id' => $responseId,
            'survey_question_id' => 41,
            'answer_text' => $a->current_job_title,
            'is_skipped' => !$isEmployed,
            'answered_at' => $responseDate,
            'time_spent_seconds' => mt_rand(5, 20),
            'created_at' => $responseDate,
            'updated_at' => $responseDate,
        ]);

        // Q42: Employer
        DB::table('survey_answers')->insert([
            'survey_response_id' => $responseId,
            'survey_question_id' => 42,
            'answer_text' => $a->current_employer,
            'is_skipped' => !$isEmployed,
            'answered_at' => $responseDate,
            'time_spent_seconds' => mt_rand(5, 20),
            'created_at' => $responseDate,
            'updated_at' => $responseDate,
        ]);

        // Q43: Job related to degree (Yes/No)
        DB::table('survey_answers')->insert([
            'survey_response_id' => $responseId,
            'survey_question_id' => 43,
            'answer_text' => $isEmployed ? (mt_rand(1, 100) <= 65 ? 'Yes' : 'No') : null,
            'is_skipped' => !$isEmployed,
            'answered_at' => $responseDate,
            'time_spent_seconds' => mt_rand(5, 15),
            'created_at' => $responseDate,
            'updated_at' => $responseDate,
        ]);

        // Q44: Job match quality
        DB::table('survey_answers')->insert([
            'survey_response_id' => $responseId,
            'survey_question_id' => 44,
            'answer_text' => $isEmployed ? $jobMatchS7[array_rand(array_slice($jobMatchS7, 0, 4))] : null,
            'is_skipped' => !$isEmployed,
            'answered_at' => $responseDate,
            'time_spent_seconds' => mt_rand(5, 30),
            'created_at' => $responseDate,
            'updated_at' => $responseDate,
        ]);

        // Q45: Job satisfaction rating
        DB::table('survey_answers')->insert([
            'survey_response_id' => $responseId,
            'survey_question_id' => 45,
            'answer_number' => $isEmployed ? mt_rand(2, 5) : null,
            'is_skipped' => !$isEmployed,
            'answered_at' => $responseDate,
            'time_spent_seconds' => mt_rand(5, 15),
            'created_at' => $responseDate,
            'updated_at' => $responseDate,
        ]);

        // Q46: Matrix - satisfaction aspects (skip for simplicity, mark as skipped)
        DB::table('survey_answers')->insert([
            'survey_response_id' => $responseId,
            'survey_question_id' => 46,
            'answer_json' => $isEmployed ? json_encode([
                'Work-Life Balance' => mt_rand(2, 5),
                'Salary & Benefits' => mt_rand(2, 5),
                'Career Growth' => mt_rand(2, 5),
                'Work Environment' => mt_rand(2, 5),
                'Job Security' => mt_rand(2, 5),
            ]) : null,
            'is_skipped' => !$isEmployed,
            'answered_at' => $responseDate,
            'time_spent_seconds' => mt_rand(15, 45),
            'created_at' => $responseDate,
            'updated_at' => $responseDate,
        ]);

        // Q47: Salary range
        DB::table('survey_answers')->insert([
            'survey_response_id' => $responseId,
            'survey_question_id' => 47,
            'answer_text' => $isEmployed ? $salaryS7[array_rand($salaryS7)] : null,
            'is_skipped' => !$isEmployed || (mt_rand(1, 100) <= 20),
            'answered_at' => $responseDate,
            'time_spent_seconds' => mt_rand(5, 15),
            'created_at' => $responseDate,
            'updated_at' => $responseDate,
        ]);

        // Q48: Skills used (multiple choice)
        $numSkills = mt_rand(2, 5);
        $selectedSkills = array_slice($skillsUsedS7, 0, $numSkills);
        shuffle($selectedSkills);
        DB::table('survey_answers')->insert([
            'survey_response_id' => $responseId,
            'survey_question_id' => 48,
            'answer_json' => $isEmployed ? json_encode(array_slice($selectedSkills, 0, $numSkills)) : null,
            'is_skipped' => !$isEmployed,
            'answered_at' => $responseDate,
            'time_spent_seconds' => mt_rand(10, 30),
            'created_at' => $responseDate,
            'updated_at' => $responseDate,
        ]);

        // Q49: Unemployment reason
        DB::table('survey_answers')->insert([
            'survey_response_id' => $responseId,
            'survey_question_id' => 49,
            'answer_text' => $isUnemployed ? $unemployReasonS7[array_rand($unemployReasonS7)] : null,
            'is_skipped' => !$isUnemployed,
            'answered_at' => $responseDate,
            'time_spent_seconds' => mt_rand(5, 20),
            'created_at' => $responseDate,
            'updated_at' => $responseDate,
        ]);

        // Q50: Education preparation rating
        DB::table('survey_answers')->insert([
            'survey_response_id' => $responseId,
            'survey_question_id' => 50,
            'answer_number' => mt_rand(2, 5),
            'is_skipped' => false,
            'answered_at' => $responseDate,
            'time_spent_seconds' => mt_rand(5, 15),
            'created_at' => $responseDate,
            'updated_at' => $responseDate,
        ]);

        // Q51: What could university have done better
        $suggestion = mt_rand(1, 100) <= 50 ? $skillsFeedback[array_rand($skillsFeedback)] : null;
        DB::table('survey_answers')->insert([
            'survey_response_id' => $responseId,
            'survey_question_id' => 51,
            'answer_text' => $suggestion,
            'is_skipped' => $suggestion === null,
            'answered_at' => $responseDate,
            'time_spent_seconds' => mt_rand(10, 60),
            'created_at' => $responseDate,
            'updated_at' => $responseDate,
        ]);

        // Q52: Additional comments
        $comment = mt_rand(1, 100) <= 30 ? $feedbackOptions[array_rand($feedbackOptions)] : null;
        DB::table('survey_answers')->insert([
            'survey_response_id' => $responseId,
            'survey_question_id' => 52,
            'answer_text' => $comment,
            'is_skipped' => $comment === null,
            'answered_at' => $responseDate,
            'time_spent_seconds' => mt_rand(10, 60),
            'created_at' => $responseDate,
            'updated_at' => $responseDate,
        ]);

        $created7++;
        if ($created7 % 100 === 0) {
            echo "  Created {$created7}/{$survey7Alumni->count()} Survey 7 responses...\n";
        }
    }
    DB::commit();
    echo "  ✅ Survey 7: {$created7} completed responses\n\n";
} catch (\Exception $e) {
    DB::rollBack();
    echo "  ❌ Survey 7 Error: {$e->getMessage()}\n";
    echo "  Line: {$e->getLine()}\n";
    exit(1);
}

// ─── STEP 6: Update survey response_rate fields ─────────────────────
echo "=== STEP 6: Updating survey statistics ===\n";

foreach ([1, 5, 7] as $surveyId) {
    $total = DB::table('survey_responses')->where('survey_id', $surveyId)->count();
    $completed = DB::table('survey_responses')->where('survey_id', $surveyId)->where('status', 'completed')->count();
    $rate = $total > 0 ? round(($completed / $total) * 100, 2) : 0;
    DB::table('surveys')->where('id', $surveyId)->update(['response_rate' => $rate]);
    echo "  Survey {$surveyId}: {$completed}/{$total} = {$rate}% response rate\n";
}

// ─── STEP 7: Clear caches ───────────────────────────────────────────
echo "\n=== STEP 7: Clearing caches ===\n";
Illuminate\Support\Facades\Artisan::call('cache:clear');
echo "  Cache cleared.\n";

// ─── Summary ────────────────────────────────────────────────────────
echo "\n=== SUMMARY ===\n";
$totalResponses = DB::table('survey_responses')->count();
$totalCompleted = DB::table('survey_responses')->where('status', 'completed')->count();
$totalAnswers = DB::table('survey_answers')->count();
echo "Total survey responses: {$totalResponses}\n";
echo "Total completed: {$totalCompleted}\n";
echo "Total answer records: {$totalAnswers}\n";
echo "Survey 1 responses: {$created1}\n";
echo "Survey 5 responses: {$created5}\n";
echo "Survey 7 responses: {$created7}\n";
echo "\n✅ Done!\n";
