<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

// Survey responses breakdown
$total = DB::table('survey_responses')->count();
$completed = DB::table('survey_responses')->where('status', 'completed')->count();
$inProgress = DB::table('survey_responses')->where('status', 'in_progress')->count();
$other = DB::table('survey_responses')->whereNotIn('status', ['completed', 'in_progress'])->count();

echo "=== SURVEY RESPONSES ===\n";
echo "Total: {$total}\n";
echo "Completed: {$completed}\n";
echo "In Progress: {$inProgress}\n";
echo "Other status: {$other}\n";
echo "Response Rate calc: " . ($total > 0 ? round(($completed / $total) * 100, 2) : 0) . "%\n\n";

// Status breakdown
$statuses = DB::table('survey_responses')->selectRaw('status, COUNT(*) as cnt')->groupBy('status')->get();
echo "Status breakdown:\n";
foreach ($statuses as $s) {
    echo "  {$s->status}: {$s->cnt}\n";
}

// Survey response answers
$cols = DB::getSchemaBuilder()->getColumnListing('survey_answers');
echo "\n=== SURVEY ANSWERS TABLE COLUMNS ===\n";
echo implode(', ', $cols) . "\n";

$answers = DB::table('survey_answers')->count();
echo "\nTotal answer rows: {$answers}\n";

// By question - just count rows per question
echo "\nAnswers per question:\n";
$byQuestion = DB::table('survey_answers')
    ->join('survey_questions', 'survey_answers.survey_question_id', '=', 'survey_questions.id')
    ->selectRaw('survey_questions.id, survey_questions.question_text, COUNT(*) as total_rows')
    ->groupBy('survey_questions.id', 'survey_questions.question_text')
    ->orderBy('survey_questions.id')
    ->get();
foreach ($byQuestion as $q) {
    echo "  Q{$q->id}: {$q->question_text} => {$q->total_rows} rows\n";
}
