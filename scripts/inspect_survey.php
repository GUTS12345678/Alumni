<?php
require_once __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use App\Models\SurveyAnswer;

// Find the registration survey
$survey = Survey::where('title', 'like', '%Registration%')
    ->orWhere('title', 'like', '%Initial%')
    ->first();

if (!$survey) {
    echo "No registration survey found!\n";
    exit(1);
}

echo "Survey: {$survey->id} - {$survey->title}\n";
echo "Total responses: " . $survey->responses()->count() . "\n";
echo "Completed: " . $survey->responses()->where('status', 'completed')->count() . "\n\n";

// List questions
$questions = SurveyQuestion::where('survey_id', $survey->id)->orderBy('order')->get();
echo "=== QUESTIONS ===\n";
foreach ($questions as $q) {
    echo "{$q->order}. [{$q->question_type}] ID:{$q->id}: " . substr($q->question_text, 0, 100) . "\n";
}

// Show sample answers for completed responses
echo "\n=== SAMPLE RESPONSE (first completed) ===\n";
$response = SurveyResponse::where('survey_id', $survey->id)
    ->where('status', 'completed')
    ->first();

if ($response) {
    echo "Response ID: {$response->id}, Name: {$response->respondent_name}, Email: {$response->respondent_email}\n";
    $answers = SurveyAnswer::where('survey_response_id', $response->id)->get();
    foreach ($answers as $a) {
        $q = $questions->firstWhere('id', $a->survey_question_id);
        $qText = $q ? substr($q->question_text, 0, 60) : 'Unknown Q';
        $val = $a->answer_text ?? json_encode($a->answer_json);
        echo "  Q{$q->order}: {$qText} => " . substr($val, 0, 120) . "\n";
    }
}

// Count unique respondent names
echo "\n=== UNIQUE RESPONDENTS ===\n";
$completedResponses = SurveyResponse::where('survey_id', $survey->id)
    ->where('status', 'completed')
    ->get();
echo "Total completed: " . $completedResponses->count() . "\n";
$uniqueNames = $completedResponses->pluck('respondent_name')->unique();
echo "Unique names: " . $uniqueNames->count() . "\n";
