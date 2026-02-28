<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

foreach ([5, 6, 7, 8] as $surveyId) {
    $survey = DB::table('surveys')->find($surveyId);
    echo "\n=== SURVEY {$surveyId}: {$survey->title} ===\n";
    $questions = DB::table('survey_questions')->where('survey_id', $surveyId)->orderBy('id')->get();
    echo "Questions: " . $questions->count() . "\n";
    foreach ($questions as $q) {
        $options = $q->options ? json_decode($q->options, true) : null;
        $optStr = $options ? ' options=[' . implode(', ', array_map(function($o) { return is_array($o) ? ($o['label'] ?? json_encode($o)) : $o; }, $options)) . ']' : '';
        $required = $q->is_required ? ' REQ' : '';
        echo "  Q{$q->id} [{$q->question_type}]{$required}: {$q->question_text}{$optStr}\n";
    }
    
    // Check responses
    $responses = DB::table('survey_responses')->where('survey_id', $surveyId)->count();
    $completed = DB::table('survey_responses')->where('survey_id', $surveyId)->where('status', 'completed')->count();
    echo "  Responses: {$responses} total, {$completed} completed\n";
}
