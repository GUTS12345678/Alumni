<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SurveyResponseSeeder extends Seeder
{
    /**
     * Seed realistic survey responses for alumni
     * 
     * Strategy:
     * - Active surveys get more responses (60-80% response rate)
     * - Draft surveys get no new responses
     * - Responses are distributed across time (not all at once)
     * - Realistic completion rates (some start but don't finish)
     */
    public function run(): void
    {
        echo "\n╔══════════════════════════════════════════════════════════════╗\n";
        echo "║         SURVEY RESPONSES SEEDING                             ║\n";
        echo "╚══════════════════════════════════════════════════════════════╝\n\n";

        // Get active surveys
        $surveys = DB::table('surveys')
            ->where('status', 'active')
            ->get();

        if ($surveys->isEmpty()) {
            echo "❌ No active surveys found. Skipping response generation.\n";
            return;
        }

        echo "✅ Found " . $surveys->count() . " active surveys\n\n";

        // Get all alumni (excluding preserved accounts if needed)
        $preservedEmails = ['nacu.a.bscs@gmail.com', 'adriankurtnacu@gmail.com'];
        $alumni = DB::table('users')
            ->where('role', 'alumni')
            ->whereNotIn('email', $preservedEmails)
            ->get();

        echo "✅ Found " . $alumni->count() . " new alumni for responses\n\n";

        $totalResponsesCreated = 0;

        foreach ($surveys as $survey) {
            echo "⏳ Processing: {$survey->title}\n";
            
            // Get survey questions
            $questions = DB::table('survey_questions')
                ->where('survey_id', $survey->id)
                ->get();

            if ($questions->isEmpty()) {
                echo "   ⚠️  No questions found, skipping...\n\n";
                continue;
            }

            echo "   Questions: {$questions->count()}\n";

            // Determine response rate based on survey type
            $responseRate = $this->getResponseRate($survey->title);
            $targetResponses = (int) ($alumni->count() * ($responseRate / 100));
            
            echo "   Target: {$targetResponses} responses ({$responseRate}% rate)\n";

            // Randomly select alumni to respond
            $respondents = $alumni->random(min($targetResponses, $alumni->count()));

            $responsesCreated = 0;

            foreach ($respondents as $respondent) {
                // Get alumni profile for campus_id
                $profile = DB::table('alumni_profiles')
                    ->where('user_id', $respondent->id)
                    ->first();

                if (!$profile) {
                    continue; // Skip if no profile
                }

                // 80% complete, 20% incomplete
                $isComplete = mt_rand(1, 100) <= 80;
                $status = $isComplete ? 'completed' : 'incomplete';

                // Random response date between survey creation and now
                $surveyCreated = Carbon::parse($survey->created_at);
                $now = Carbon::now();
                $daysRange = max(1, $surveyCreated->diffInDays($now));
                $responseDays = mt_rand(0, $daysRange);
                $responseDate = $surveyCreated->copy()->addDays($responseDays);

                // Generate unique response token
                $responseToken = 'resp_' . uniqid() . '_' . bin2hex(random_bytes(8));

                // Create survey response
                $responseId = DB::table('survey_responses')->insertGetId([
                    'survey_id' => $survey->id,
                    'user_id' => $respondent->id,
                    'response_token' => $responseToken,
                    'status' => $isComplete ? 'completed' : 'in_progress',
                    'started_at' => $responseDate,
                    'completed_at' => $isComplete ? $responseDate->copy()->addMinutes(mt_rand(5, 30)) : null,
                    'total_questions' => $questions->count(),
                    'answered_questions' => $isComplete ? $questions->count() : mt_rand(1, $questions->count() - 1),
                    'completion_percentage' => $isComplete ? 100.00 : mt_rand(20, 80),
                    'time_spent_seconds' => mt_rand(300, 1800), // 5-30 minutes
                    'is_valid_response' => true,
                    'created_at' => $responseDate,
                    'updated_at' => $responseDate,
                ]);

                // Create answers for questions (if completed or partial)
                $questionsToAnswer = $isComplete 
                    ? $questions 
                    : $questions->random(mt_rand(1, max(1, $questions->count() - 1)));

                foreach ($questionsToAnswer as $question) {
                    $answer = $this->generateAnswer($question, $profile);

                    if ($answer !== null) {
                        DB::table('survey_answers')->insert([
                            'survey_response_id' => $responseId,
                            'survey_question_id' => $question->id,
                            'answer_text' => $answer,
                            'created_at' => $responseDate,
                            'updated_at' => $responseDate,
                        ]);
                    }
                }

                $responsesCreated++;
                $totalResponsesCreated++;
            }

            echo "   ✅ Created {$responsesCreated} responses\n\n";
        }

        echo "╔══════════════════════════════════════════════════════════════╗\n";
        echo "║                  SEEDING COMPLETE                            ║\n";
        echo "╚══════════════════════════════════════════════════════════════╝\n\n";

        echo "Total Responses Created: {$totalResponsesCreated}\n";
        
        // Final stats
        $finalStats = [
            'Total Surveys' => DB::table('surveys')->count(),
            'Active Surveys' => DB::table('surveys')->where('status', 'active')->count(),
            'Total Responses' => DB::table('survey_responses')->count(),
            'Completed Responses' => DB::table('survey_responses')->where('status', 'completed')->count(),
        ];

        echo "\nFinal Statistics:\n";
        foreach ($finalStats as $label => $value) {
            echo "  - {$label}: {$value}\n";
        }
        echo "\n";
    }

    /**
     * Determine response rate based on survey type/title
     */
    private function getResponseRate(string $title): int
    {
        $title = strtolower($title);

        // Tracer surveys typically get higher response rates
        if (str_contains($title, 'tracer') || str_contains($title, 'graduate')) {
            return mt_rand(70, 85); // 70-85% response rate
        }

        // Employment/job satisfaction surveys
        if (str_contains($title, 'employment') || str_contains($title, 'job')) {
            return mt_rand(60, 75); // 60-75% response rate
        }

        // Registration/initial surveys
        if (str_contains($title, 'registration') || str_contains($title, 'initial')) {
            return mt_rand(80, 95); // 80-95% response rate
        }

        // General surveys
        return mt_rand(50, 70); // 50-70% response rate
    }

    /**
     * Generate realistic answer based on question type and alumni profile
     */
    private function generateAnswer($question, $profile): ?string
    {
        $questionText = strtolower($question->question_text ?? '');

        // Multiple choice/select questions
        if ($question->question_type === 'multiple_choice' || $question->question_type === 'select') {
            $options = json_decode($question->options ?? '[]', true);
            if (!empty($options)) {
                return $options[array_rand($options)];
            }
        }

        // Yes/No questions
        if ($question->question_type === 'yes_no') {
            return mt_rand(0, 1) ? 'Yes' : 'No';
        }

        // Rating questions
        if ($question->question_type === 'rating' || str_contains($questionText, 'rate') || str_contains($questionText, 'satisfaction')) {
            return (string) mt_rand(1, 10);
        }

        // Text/textarea questions - generate contextual responses
        if ($question->question_type === 'text' || $question->question_type === 'textarea') {
            // Employment status questions
            if (str_contains($questionText, 'employment') || str_contains($questionText, 'job') || str_contains($questionText, 'work')) {
                return $profile->employment_status ?? 'employed_full_time';
            }

            // Company/employer questions
            if (str_contains($questionText, 'company') || str_contains($questionText, 'employer')) {
                return $profile->current_employer ?? 'Private Company';
            }

            // Position/title questions
            if (str_contains($questionText, 'position') || str_contains($questionText, 'title') || str_contains($questionText, 'role')) {
                return $profile->current_job_title ?? 'Professional';
            }

            // Skills questions
            if (str_contains($questionText, 'skill')) {
                $skills = ['Programming', 'Communication', 'Leadership', 'Problem Solving', 'Teamwork'];
                return $skills[array_rand($skills)];
            }

            // Feedback/suggestions questions
            if (str_contains($questionText, 'feedback') || str_contains($questionText, 'suggest') || str_contains($questionText, 'improve')) {
                $feedbacks = [
                    'More industry partnerships needed',
                    'Update curriculum with latest technologies',
                    'More practical training and internships',
                    'Better career counseling services',
                    'Strengthen alumni network',
                    'More job placement assistance',
                    'Overall satisfied with the education received'
                ];
                return $feedbacks[array_rand($feedbacks)];
            }

            // Generic text response
            return 'Provided feedback';
        }

        // Checkbox (multi-select)
        if ($question->question_type === 'checkbox') {
            $options = json_decode($question->options ?? '[]', true);
            if (!empty($options)) {
                $numSelections = mt_rand(1, min(3, count($options)));
                $selected = array_rand($options, $numSelections);
                if (!is_array($selected)) {
                    $selected = [$selected];
                }
                return json_encode(array_map(fn($i) => $options[$i], $selected));
            }
        }

        // Default fallback
        return 'Response provided';
    }
}
