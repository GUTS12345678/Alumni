<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

// Get all surveys
$surveys = DB::table('surveys')->get();
echo "=== SURVEYS ===\n";
foreach ($surveys as $s) {
    echo "ID:{$s->id} | {$s->title} | status:{$s->status} | campus_id:" . ($s->campus_id ?? 'null') . "\n";
}

// Get all questions with their options for survey 1
echo "\n=== SURVEY 1 QUESTIONS (with options) ===\n";
$questions = DB::table('survey_questions')->where('survey_id', 1)->orderBy('id')->get();
foreach ($questions as $q) {
    $options = $q->options ? json_decode($q->options, true) : null;
    $optStr = $options ? ' options=[' . implode(', ', $options) . ']' : '';
    $required = $q->is_required ? ' REQUIRED' : '';
    echo "Q{$q->id} [{$q->question_type}]{$required}: {$q->question_text}{$optStr}\n";
}

// Check survey_questions columns
echo "\n=== SURVEY_QUESTIONS COLUMNS ===\n";
$cols = DB::getSchemaBuilder()->getColumnListing('survey_questions');
echo implode(', ', $cols) . "\n";
