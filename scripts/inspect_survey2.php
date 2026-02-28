<?php
require_once __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\SurveyResponse;
use App\Models\SurveyAnswer;
use App\Models\SurveyQuestion;
use App\Models\Campus;
use App\Models\Batch;
use App\Models\Course;
use App\Models\Department;

$surveyId = 1;

// Get all responses with answers (not just completed)
$responses = SurveyResponse::where('survey_id', $surveyId)->get();
echo "Total responses (all statuses): " . $responses->count() . "\n";
echo "Statuses: " . $responses->groupBy('status')->map->count()->toJson() . "\n\n";

// Get questions
$questions = SurveyQuestion::where('survey_id', $surveyId)->orderBy('order')->get();

// Show first 5 responses with all answers
$responsesWithAnswers = SurveyResponse::where('survey_id', $surveyId)
    ->whereHas('answers')
    ->take(5)
    ->get();

echo "Responses with at least 1 answer: " . SurveyResponse::where('survey_id', $surveyId)->whereHas('answers')->count() . "\n\n";

foreach ($responsesWithAnswers as $r) {
    echo "--- Response #{$r->id} (status: {$r->status}) ---\n";
    $answers = SurveyAnswer::where('survey_response_id', $r->id)->get();
    foreach ($answers as $a) {
        $q = $questions->firstWhere('id', $a->survey_question_id);
        if (!$q) continue;
        $val = $a->answer_text ?? json_encode($a->answer_json);
        echo "  Q{$q->order} ({$q->question_text}): {$val}\n";
    }
    echo "\n";
}

// Show campuses and batches
echo "=== CAMPUSES ===\n";
$campuses = Campus::all();
foreach ($campuses as $c) {
    echo "  ID:{$c->id} - {$c->name} ({$c->code})\n";
}

echo "\n=== BATCHES ===\n";
$batches = Batch::orderBy('graduation_year', 'desc')->take(15)->get();
foreach ($batches as $b) {
    echo "  ID:{$b->id} - {$b->name} (grad: {$b->graduation_year}), campus: {$b->campus_id}\n";
}

echo "\n=== DEPARTMENTS/COURSES (sample) ===\n";
$depts = Department::take(10)->get();
foreach ($depts as $d) {
    echo "  Dept ID:{$d->id} - {$d->name} (campus: {$d->campus_id})\n";
    $courses = Course::where('department_id', $d->id)->take(3)->get();
    foreach ($courses as $c) {
        echo "    Course ID:{$c->id} - {$c->name}\n";
    }
}

// Check Q8 (Degree Program) and Q9 (Major) - they seem to store IDs
echo "\n=== Q8 (Degree Program) unique values ===\n";
$q8Answers = SurveyAnswer::where('survey_question_id', 1) // Q1: First Name
    ->whereNotNull('answer_text')
    ->where('answer_text', '!=', '')
    ->pluck('answer_text');
echo "Unique first names: " . $q8Answers->unique()->count() . "\n";

$degreeAnswers = SurveyAnswer::where('survey_question_id', 8)
    ->whereNotNull('answer_text')
    ->pluck('answer_text');
echo "Q8 degree values: " . $degreeAnswers->unique()->take(20)->implode(', ') . "\n";

$majorAnswers = SurveyAnswer::where('survey_question_id', 9)
    ->whereNotNull('answer_text')
    ->pluck('answer_text');
echo "Q9 major values: " . $majorAnswers->unique()->take(20)->implode(', ') . "\n";

// Q10 graduation year
$gradYears = SurveyAnswer::where('survey_question_id', 10)
    ->whereNotNull('answer_text')
    ->pluck('answer_text');
echo "Q10 grad year values: " . $gradYears->unique()->take(20)->implode(', ') . "\n";
