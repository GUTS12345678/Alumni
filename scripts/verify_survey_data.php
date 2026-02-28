<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== DASHBOARD METRICS CHECK ===\n\n";

// Total users
$totalUsers = DB::table('users')->count();
$alumniUsers = DB::table('users')->where('role', 'alumni')->count();
echo "Total users: {$totalUsers}\n";
echo "Alumni users: {$alumniUsers}\n\n";

// Survey responses
$totalResponses = DB::table('survey_responses')->count();
$completed = DB::table('survey_responses')->where('status', 'completed')->count();
echo "Total survey responses: {$totalResponses}\n";
echo "Completed: {$completed}\n";
echo "Response rate: " . ($totalResponses > 0 ? round(($completed / $totalResponses) * 100, 2) : 0) . "%\n\n";

// By survey
echo "By survey:\n";
$bySurvey = DB::table('survey_responses')
    ->join('surveys', 'survey_responses.survey_id', '=', 'surveys.id')
    ->selectRaw('surveys.id, surveys.title, COUNT(*) as total, SUM(CASE WHEN survey_responses.status = "completed" THEN 1 ELSE 0 END) as completed')
    ->groupBy('surveys.id', 'surveys.title')
    ->get();
foreach ($bySurvey as $s) {
    echo "  Survey {$s->id} ({$s->title}): {$s->completed}/{$s->total}\n";
}

// Survey 1 question analysis sample  
echo "\nSurvey 1 - Q1 (First Name) answer distribution sample:\n";
$q1Answers = DB::table('survey_answers')
    ->where('survey_question_id', 1)
    ->whereNotNull('answer_text')
    ->selectRaw('answer_text, COUNT(*) as cnt')
    ->groupBy('answer_text')
    ->orderByDesc('cnt')
    ->limit(10)
    ->get();
$totalQ1 = DB::table('survey_answers')->where('survey_question_id', 1)->count();
echo "  Total answers: {$totalQ1}\n";
foreach ($q1Answers as $a) {
    $pct = round(($a->cnt / $totalQ1) * 100, 1);
    echo "  {$a->answer_text}: {$a->cnt} ({$pct}%)\n";
}

echo "\nSurvey 1 - Q12 (Employment Status) distribution:\n";
$q12Answers = DB::table('survey_answers')
    ->where('survey_question_id', 12)
    ->whereNotNull('answer_text')
    ->selectRaw('answer_text, COUNT(*) as cnt')
    ->groupBy('answer_text')
    ->orderByDesc('cnt')
    ->get();
foreach ($q12Answers as $a) {
    echo "  {$a->answer_text}: {$a->cnt}\n";
}
