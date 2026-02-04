<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Survey;
use App\Models\SurveyResponse;
use App\Models\SurveyQuestion;
use App\Models\SurveyAnswer;
use App\Models\SurveyInvitation;
use App\Models\AlumniProfile;
use App\Models\Batch;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SurveyController extends Controller
{
    /**
     * Get survey by ID or token (for public access)
     */
    public function show(Request $request, $surveyId)
    {
        $token = $request->query('token');

        $survey = Survey::with(['questions' => function ($query) {
            $query->active()->orderBy('order');
        }])->find($surveyId);

        if (!$survey) {
            return response()->json([
                'success' => false,
                'message' => 'Survey not found'
            ], 404);
        }

        // Check if survey is currently active
        if (!$survey->isCurrentlyActive()) {
            return response()->json([
                'success' => false,
                'message' => 'Survey is not currently active'
            ], 403);
        }

        // For token-based access (invitation links)
        $invitation = null;
        if ($token) {
            $invitation = SurveyInvitation::where('invitation_token', $token)
                ->where('survey_id', $surveyId)
                ->first();

            if (!$invitation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid invitation token'
                ], 403);
            }

            // Mark invitation as clicked
            $invitation->markAsClicked();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'survey' => [
                    'id' => $survey->id,
                    'title' => $survey->title,
                    'description' => $survey->description,
                    'instructions' => $survey->instructions,
                    'type' => $survey->type,
                    'is_registration_survey' => $survey->is_registration_survey,
                    'is_anonymous' => $survey->is_anonymous,
                    'questions' => $survey->questions->map(function ($question) {
                        return [
                            'id' => $question->id,
                            'question_text' => $question->question_text,
                            'description' => $question->description,
                            'question_type' => $question->question_type,
                            'options' => $question->formatted_options,
                            'is_required' => $question->is_required,
                            'order' => $question->order,
                            'placeholder' => $question->placeholder,
                            'help_text' => $question->help_text,
                            'rating_min' => $question->rating_min,
                            'rating_max' => $question->rating_max,
                            'rating_min_label' => $question->rating_min_label,
                            'rating_max_label' => $question->rating_max_label,
                        ];
                    }),
                ],
                'invitation' => $invitation ? [
                    'token' => $invitation->invitation_token,
                    'email' => $invitation->email,
                    'name' => $invitation->name,
                ] : null,
            ]
        ]);
    }

    /**
     * Start a new survey response
     */
    public function startResponse(Request $request, $surveyId)
    {
        $token = $request->query('token');
        $survey = Survey::find($surveyId);

        if (!$survey || !$survey->isCurrentlyActive()) {
            return response()->json([
                'success' => false,
                'message' => 'Survey not available'
            ], 404);
        }

        $userId = null;
        $invitation = null;

        // Handle authenticated users
        if ($request->user()) {
            $userId = $request->user()->id;

            // Check if user already has a response for this survey
            if (!$survey->allow_multiple_responses) {
                $existingResponse = SurveyResponse::where('survey_id', $surveyId)
                    ->where('user_id', $userId)
                    ->first();

                if ($existingResponse) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You have already responded to this survey',
                        'data' => ['response_token' => $existingResponse->response_token]
                    ], 409);
                }
            }
        }

        // Handle invitation token
        if ($token) {
            $invitation = SurveyInvitation::where('invitation_token', $token)
                ->where('survey_id', $surveyId)
                ->first();
        }

        // Create new response
        $response = SurveyResponse::create([
            'survey_id' => $surveyId,
            'user_id' => $userId,
            'status' => 'in_progress',
            'started_at' => now(),
            'last_updated_at' => now(),
            'respondent_email' => $invitation ? $invitation->email : null,
            'respondent_name' => $invitation ? $invitation->name : null,
            'respondent_student_id' => $invitation ? $invitation->student_id : null,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $response->updateProgress();

        if ($userId) {
            ActivityLog::logSurveyStarted($userId, $surveyId, $response->id);
        }

        return response()->json([
            'success' => true,
            'message' => 'Survey response started',
            'data' => [
                'response_token' => $response->response_token,
                'survey_id' => $surveyId,
                'total_questions' => $response->total_questions,
            ]
        ], 201);
    }

    /**
     * Submit answer to a question
     */
    public function submitAnswer(Request $request, $surveyId)
    {
        $validator = Validator::make($request->all(), [
            'response_token' => 'required|string',
            'question_id' => 'required|integer|exists:survey_questions,id',
            'answer' => 'nullable',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $response = SurveyResponse::where('response_token', $request->response_token)
            ->where('survey_id', $surveyId)
            ->first();

        if (!$response) {
            return response()->json([
                'success' => false,
                'message' => 'Survey response not found'
            ], 404);
        }

        if ($response->status === 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Survey response is already completed'
            ], 400);
        }

        $question = SurveyQuestion::where('id', $request->question_id)
            ->where('survey_id', $surveyId)
            ->first();

        if (!$question) {
            return response()->json([
                'success' => false,
                'message' => 'Question not found'
            ], 404);
        }

        // Validate required questions
        if ($question->is_required && empty($request->answer)) {
            return response()->json([
                'success' => false,
                'message' => 'This question is required'
            ], 422);
        }

        // Find or create answer
        $answer = SurveyAnswer::firstOrNew([
            'survey_response_id' => $response->id,
            'survey_question_id' => $question->id,
        ]);

        // Set answer value based on question type
        if (!empty($request->answer)) {
            $answer->setAnswerValue($request->answer, $question);
            $answer->is_skipped = false;
        } else {
            $answer->is_skipped = true;
        }

        $answer->answered_at = now();
        $answer->save();

        // Update progress
        $response->updateProgress();

        return response()->json([
            'success' => true,
            'message' => 'Answer submitted successfully',
            'data' => [
                'question_id' => $question->id,
                'answer_id' => $answer->id,
                'completion_percentage' => $response->completion_percentage,
                'answered_questions' => $response->answered_questions,
                'total_questions' => $response->total_questions,
            ]
        ]);
    }

    /**
     * Complete survey response and handle registration if needed
     */
    public function completeResponse(Request $request, $surveyId)
    {
        $validator = Validator::make($request->all(), [
            'response_token' => 'required|string',
            'email' => 'sometimes|email',
            'password' => [
                'sometimes',
                'min:8',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/', // Must contain lowercase, uppercase, and number
            ],
        ], [
            'password.min' => 'Password must be at least 8 characters long.',
            'password.regex' => 'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $response = SurveyResponse::where('response_token', $request->response_token)
            ->where('survey_id', $surveyId)
            ->with(['survey', 'answers.surveyQuestion'])
            ->first();

        if (!$response) {
            return response()->json([
                'success' => false,
                'message' => 'Survey response not found'
            ], 404);
        }

        if ($response->status === 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Survey response is already completed'
            ], 400);
        }

        $survey = $response->survey;
        $user = null;

        // Handle registration for registration surveys
        if ($survey->is_registration_survey && $request->email && $request->password) {
            // Check if user already exists
            $existingUser = User::where('email', $request->email)->first();

            if ($existingUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email already exists'
                ], 409);
            }

            // Check for student ID in answers to validate before creating profile
            $studentIdAnswer = null;
            $tempAnswers = $response->answers()->with('surveyQuestion')->get();
            foreach ($tempAnswers as $answer) {
                $questionText = strtolower($answer->surveyQuestion->question_text);
                if (str_contains($questionText, 'student id') || str_contains($questionText, 'student number')) {
                    $studentIdAnswer = $answer->formatted_answer;
                    break;
                }
            }

            // Validate student ID doesn't already exist
            if ($studentIdAnswer) {
                $existingProfile = AlumniProfile::where('student_id', $studentIdAnswer)->first();
                if ($existingProfile) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Student ID already registered. If you believe this is an error, please contact support.'
                    ], 409);
                }
            }

            // Create new user
            $user = User::create([
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'alumni',
                'status' => 'active',
            ]);

            // Create alumni profile from survey answers
            $this->createAlumniProfileFromAnswers($user, $response);

            // Update response with user
            $response->update(['user_id' => $user->id]);

            ActivityLog::logActivity(
                $user->id,
                'user_registered_via_survey',
                'Alumni registered via survey completion',
                'Survey',
                $surveyId,
                ['response_id' => $response->id]
            );
        }

        // Mark response as completed
        $response->markAsCompleted();

        // Update invitation status if exists
        if ($response->respondent_email) {
            $invitation = SurveyInvitation::where('survey_id', $surveyId)
                ->where('email', $response->respondent_email)
                ->first();
            if ($invitation) {
                $invitation->markAsResponded();
            }
        }

        // Log activity
        if ($response->user_id) {
            ActivityLog::logSurveyCompleted($response->user_id, $surveyId, $response->id);
        }

        // Update survey statistics
        $survey->updateResponseStats();

        $responseData = [
            'message' => 'Survey completed successfully',
            'response_id' => $response->id,
            'completion_percentage' => $response->completion_percentage,
        ];

        if ($user) {
            $token = $user->createToken('auth-token')->plainTextToken;
            $responseData['user'] = [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
            ];
            $responseData['token'] = $token;
            $responseData['message'] = 'Survey completed and account created successfully';
        }

        return response()->json([
            'success' => true,
            'data' => $responseData
        ]);
    }

    /**
     * Create alumni profile from survey answers
     */
    private function createAlumniProfileFromAnswers(User $user, SurveyResponse $response)
    {
        $answers = $response->answers()->with('surveyQuestion')->get();
        $profileData = ['user_id' => $user->id];

        // Map survey answers to profile fields
        $fieldMapping = [
            'first_name' => ['First Name', 'first name'],
            'last_name' => ['Last Name', 'last name'],
            'student_id' => ['Student ID', 'student id'],
            'phone' => ['Phone Number', 'phone'],
            'birth_date' => ['Date of Birth', 'birth date'],
            'gender' => ['Gender'],
            'degree_program' => ['Degree Program', 'degree'],
            'major' => ['Major'],
            'graduation_year' => ['Graduation Year', 'graduation'],
            'gpa' => ['GPA'],
            'employment_status' => ['Employment Status', 'employment'],
            'current_job_title' => ['Job Title', 'current job'],
            'current_employer' => ['Employer', 'company'],
            'current_salary' => ['Salary'],
            'current_address' => ['Address'],
            'city' => ['City'],
            'country' => ['Country'],
        ];

        foreach ($answers as $answer) {
            $questionText = strtolower($answer->surveyQuestion->question_text);

            foreach ($fieldMapping as $field => $keywords) {
                foreach ($keywords as $keyword) {
                    if (str_contains($questionText, strtolower($keyword))) {
                        $value = $answer->formatted_answer;

                        // Handle special cases
                        if ($field === 'employment_status') {
                            $value = $this->mapEmploymentStatus($value);
                        } elseif ($field === 'gender') {
                            $value = strtolower($value);
                        }

                        $profileData[$field] = $value;
                        break 2;
                    }
                }
            }
        }

        // Find or create batch based on graduation year
        if (isset($profileData['graduation_year'])) {
            $batch = Batch::where('graduation_year', $profileData['graduation_year'])->first();
            if ($batch) {
                $profileData['batch_id'] = $batch->id;
            }
        }

        $profileData['profile_completed'] = true;
        $profileData['profile_completed_at'] = now();

        AlumniProfile::create($profileData);
    }

    /**
     * Map employment status from survey answer to database enum
     */
    private function mapEmploymentStatus($status)
    {
        $mapping = [
            'Employed Full-time' => 'employed_full_time',
            'Employed Part-time' => 'employed_part_time',
            'Self-employed' => 'self_employed',
            'Unemployed (seeking work)' => 'unemployed_seeking',
            'Unemployed (not seeking work)' => 'unemployed_not_seeking',
            'Continuing Education' => 'continuing_education',
            'Military Service' => 'military_service',
        ];

        return $mapping[$status] ?? 'other';
    }

    /**
     * Get response progress
     */
    public function getProgress(Request $request, $surveyId)
    {
        $responseToken = $request->query('response_token');

        if (!$responseToken) {
            return response()->json([
                'success' => false,
                'message' => 'Response token is required'
            ], 400);
        }

        $response = SurveyResponse::where('response_token', $responseToken)
            ->where('survey_id', $surveyId)
            ->with(['answers.surveyQuestion'])
            ->first();

        if (!$response) {
            return response()->json([
                'success' => false,
                'message' => 'Survey response not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'response_token' => $response->response_token,
                'status' => $response->status,
                'completion_percentage' => $response->completion_percentage,
                'answered_questions' => $response->answered_questions,
                'total_questions' => $response->total_questions,
                'started_at' => $response->started_at,
                'last_updated_at' => $response->last_updated_at,
                'answers' => $response->answers->map(function ($answer) {
                    return [
                        'question_id' => $answer->survey_question_id,
                        'answer' => $answer->formatted_answer,
                        'answered_at' => $answer->answered_at,
                    ];
                }),
            ]
        ]);
    }

    /**
     * Get available surveys for the authenticated alumni
     */
    public function mySurveys(Request $request)
    {
        $user = $request->user();

        // Get active surveys
        $surveys = Survey::where('status', 'active')
            ->where(function ($query) use ($user) {
                // Public surveys (target_batches is null or empty)
                $query->whereNull('target_batches')
                      ->orWhereRaw("JSON_LENGTH(target_batches) = 0");
                
                // If alumni, also include surveys for their batch
                if ($user->role === 'alumni') {
                    $profile = $user->alumniProfile;
                    if ($profile && $profile->batch_id) {
                        // Check if batch_id is in the target_batches JSON array
                        $query->orWhereRaw("JSON_CONTAINS(target_batches, '\"" . $profile->batch_id . "\"')");
                    }
                }
            })
            ->with(['questions'])
            ->get();

        // Get user's responses to determine survey status
        $responses = SurveyResponse::where('respondent_email', $user->email)
            ->orWhere('user_id', $user->id)
            ->get()
            ->keyBy('survey_id');

        $surveysWithStatus = $surveys->map(function ($survey) use ($responses) {
            $response = $responses->get($survey->id);
            
            $status = 'not_started';
            $responseToken = null;
            $completedAt = null;
            $progress = 0;

            if ($response) {
                $status = $response->status;
                $responseToken = $response->response_token;
                $completedAt = $response->completed_at;
                $progress = $response->completion_percentage ?? 0;
            }

            return [
                'id' => $survey->id,
                'title' => $survey->title,
                'description' => $survey->description,
                'type' => $survey->type,
                'is_anonymous' => $survey->is_anonymous,
                'is_registration_survey' => $survey->is_registration_survey,
                'start_date' => $survey->start_date,
                'end_date' => $survey->end_date,
                'estimated_time' => $survey->estimated_time,
                'total_questions' => $survey->questions->count(),
                'status' => $status,
                'response_token' => $responseToken,
                'completed_at' => $completedAt,
                'progress' => $progress,
                'can_retake' => $survey->can_retake && $status === 'completed',
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'surveys' => $surveysWithStatus,
                'stats' => [
                    'total' => $surveysWithStatus->count(),
                    'not_started' => $surveysWithStatus->where('status', 'not_started')->count(),
                    'in_progress' => $surveysWithStatus->where('status', 'in_progress')->count(),
                    'completed' => $surveysWithStatus->where('status', 'completed')->count(),
                ],
            ]
        ]);
    }

    /**
     * Get user's survey response history
     */
    public function myResponses(Request $request)
    {
        $user = $request->user();

        $responses = SurveyResponse::where('respondent_email', $user->email)
            ->orWhere('user_id', $user->id)
            ->with(['survey', 'answers.surveyQuestion'])
            ->orderBy('completed_at', 'desc')
            ->orderBy('started_at', 'desc')
            ->get();

        $responsesData = $responses->map(function ($response) {
            // Calculate time taken in minutes
            $timeTakenMinutes = null;
            if ($response->completed_at && $response->started_at) {
                $start = \Carbon\Carbon::parse($response->started_at);
                $end = \Carbon\Carbon::parse($response->completed_at);
                $timeTakenMinutes = (int) $start->diffInMinutes($end);
            }

            // Map answers with proper structure
            $answersData = $response->answers->map(function ($answer) {
                return [
                    'id' => $answer->id,
                    'survey_question_id' => $answer->survey_question_id,
                    'question' => [
                        'id' => $answer->surveyQuestion->id,
                        'question_text' => $answer->surveyQuestion->question_text,
                        'question_type' => $answer->surveyQuestion->question_type,
                        'is_required' => $answer->surveyQuestion->is_required,
                        'order' => $answer->surveyQuestion->order,
                    ],
                    'answer_text' => $answer->answer_text,
                    'answer_value' => $answer->answer_value,
                ];
            });

            return [
                'id' => $response->id,
                'response_token' => $response->response_token,
                'respondent_email' => $response->respondent_email,
                'status' => $response->status,
                'started_at' => $response->started_at,
                'completed_at' => $response->completed_at,
                'time_taken_minutes' => $timeTakenMinutes,
                'survey' => [
                    'id' => $response->survey->id,
                    'title' => $response->survey->title,
                    'description' => $response->survey->description,
                    'type' => $response->survey->type,
                    'is_anonymous' => $response->survey->is_anonymous,
                ],
                'answers' => $answersData,
                'total_questions' => $response->survey->questions()->count(),
                'answered_questions' => $response->answers->count(),
                'completion_percentage' => $response->answers->count() > 0 
                    ? round(($response->answers->count() / $response->survey->questions()->count()) * 100)
                    : 0,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'responses' => $responsesData,
                'stats' => [
                    'total' => $responsesData->count(),
                    'completed' => $responsesData->where('status', 'completed')->count(),
                    'draft' => $responsesData->whereIn('status', ['draft', 'in_progress'])->count(),
                ],
            ]
        ]);
    }

    /**
     * Download survey response as PDF
     */
    public function downloadResponsePDF($responseToken)
    {
        $user = auth()->user();

        // Find the response
        $response = SurveyResponse::with(['survey', 'answers.surveyQuestion'])
            ->where('response_token', $responseToken)
            ->first();

        if (!$response) {
            return response()->json([
                'success' => false,
                'message' => 'Survey response not found'
            ], 404);
        }

        // Verify ownership
        if ($response->respondent_email !== $user->email) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access to this survey response'
            ], 403);
        }

        // Generate HTML content for the PDF
        $html = $this->generateResponseHTML($response);

        // Create filename
        $filename = 'survey_response_' . $responseToken . '_' . now()->format('Ymd') . '.pdf';

        // For now, return the HTML as a downloadable file
        // In production, you would use a PDF library like dompdf or wkhtmltopdf
        return response($html)
            ->header('Content-Type', 'text/html')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '.html"')
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    /**
     * Generate HTML content for survey response
     */
    private function generateResponseHTML($response)
    {
        $timeTaken = null;
        if ($response->started_at && $response->completed_at) {
            $start = \Carbon\Carbon::parse($response->started_at);
            $end = \Carbon\Carbon::parse($response->completed_at);
            $minutes = $start->diffInMinutes($end);
            $timeTaken = $minutes < 60 ? "{$minutes} minutes" : floor($minutes / 60) . " hours " . ($minutes % 60) . " minutes";
        }

        $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Survey Response - ' . htmlspecialchars($response->survey->title) . '</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #7f1d1d;
            color: white;
            padding: 20px;
            margin-bottom: 30px;
            border-radius: 8px;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0;
            font-size: 14px;
        }
        .info-section {
            background-color: #f5f5f5;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 8px;
            border-left: 4px solid #7f1d1d;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding: 5px 0;
        }
        .info-label {
            font-weight: bold;
            color: #7f1d1d;
        }
        .question-block {
            margin-bottom: 30px;
            padding: 20px;
            background-color: #fff;
            border: 1px solid #e5e5e5;
            border-radius: 8px;
        }
        .question-number {
            color: #7f1d1d;
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 10px;
        }
        .question-text {
            font-size: 16px;
            margin-bottom: 15px;
            color: #1f2937;
        }
        .answer {
            background-color: #fef3c7;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #f59e0b;
        }
        .no-answer {
            color: #9ca3af;
            font-style: italic;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e5e5;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
        }
        .required {
            color: #dc2626;
            font-weight: bold;
        }
        .rating {
            font-size: 18px;
            font-weight: bold;
            color: #7f1d1d;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>' . htmlspecialchars($response->survey->title) . '</h1>
        <p>' . htmlspecialchars($response->survey->description ?? '') . '</p>
    </div>

    <div class="info-section">
        <div class="info-row">
            <span class="info-label">Response Token:</span>
            <span>' . htmlspecialchars($response->response_token) . '</span>
        </div>
        <div class="info-row">
            <span class="info-label">Status:</span>
            <span>' . ucfirst($response->status) . '</span>
        </div>
        <div class="info-row">
            <span class="info-label">Started:</span>
            <span>' . \Carbon\Carbon::parse($response->started_at)->format('F j, Y g:i A') . '</span>
        </div>';

        if ($response->completed_at) {
            $html .= '<div class="info-row">
                <span class="info-label">Completed:</span>
                <span>' . \Carbon\Carbon::parse($response->completed_at)->format('F j, Y g:i A') . '</span>
            </div>';
        }

        if ($timeTaken) {
            $html .= '<div class="info-row">
                <span class="info-label">Time Taken:</span>
                <span>' . $timeTaken . '</span>
            </div>';
        }

        if (!$response->survey->is_anonymous) {
            $html .= '<div class="info-row">
                <span class="info-label">Respondent:</span>
                <span>' . htmlspecialchars($response->respondent_email) . '</span>
            </div>';
        }

        $html .= '</div>

    <h2 style="color: #7f1d1d; margin-bottom: 20px;">Responses</h2>';

        $questionNumber = 1;
        foreach ($response->answers as $answer) {
            $question = $answer->surveyQuestion;
            
            $html .= '<div class="question-block">
                <div class="question-number">Question ' . $questionNumber . ($question->is_required ? ' <span class="required">*</span>' : '') . '</div>
                <div class="question-text">' . htmlspecialchars($question->question_text) . '</div>
                <div class="answer">';

            if ($answer->answer_text) {
                $html .= nl2br(htmlspecialchars($answer->answer_text));
            } elseif ($answer->answer_value !== null) {
                $html .= '<span class="rating">Rating: ' . $answer->answer_value . '/5</span>';
            } else {
                $html .= '<span class="no-answer">No answer provided</span>';
            }

            $html .= '</div>
            </div>';

            $questionNumber++;
        }

        $html .= '
    <div class="footer">
        <p>Generated on ' . now()->format('F j, Y g:i A') . '</p>
        <p>Alumni Tracer System - Survey Response Report</p>
    </div>
</body>
</html>';

        return $html;
    }

    /**
     * Get survey details for taking (authenticated user)
     */
    public function getSurveyToTake($surveyId)
    {
        try {
            $user = auth()->user();
            
            $survey = Survey::with(['questions' => function ($query) {
                $query->where('is_active', true)->orderBy('order')->orderBy('id');
            }])->findOrFail($surveyId);

            // Check if survey is active
            if ($survey->status !== 'active') {
                return response()->json([
                    'success' => false,
                    'message' => 'This survey is not currently active'
                ], 403);
            }

            // Check if user already has a response
            $existingResponse = SurveyResponse::where('survey_id', $surveyId)
                ->where('user_id', $user->id)
                ->first();

            // If completed and not allowing retakes, block access
            if ($existingResponse && $existingResponse->status === 'completed' && !$survey->allow_multiple_responses) {
                return response()->json([
                    'success' => false,
                    'message' => 'You have already completed this survey'
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'survey' => $survey,
                    'existing_response' => $existingResponse,
                    'can_edit' => $existingResponse && $existingResponse->status === 'draft'
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load survey: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Start a new survey response or resume existing draft
     */
    public function startSurvey(Request $request, $surveyId)
    {
        try {
            $user = auth()->user();
            $profile = $user->alumniProfile;

            $survey = Survey::findOrFail($surveyId);

            // Check for existing response
            $response = SurveyResponse::where('survey_id', $surveyId)
                ->where('user_id', $user->id)
                ->where('status', 'draft')
                ->first();

            if (!$response) {
                // Create new response
                $response = SurveyResponse::create([
                    'survey_id' => $surveyId,
                    'user_id' => $user->id,
                    'batch_id' => $profile->batch_id ?? null,
                    'respondent_email' => $user->email,
                    'respondent_type' => 'alumni',
                    'response_token' => Str::random(32),
                    'status' => 'draft',
                    'started_at' => now(),
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);

                ActivityLog::logActivity(
                    $user->id,
                    'survey_started',
                    'Started survey: ' . $survey->title,
                    'SurveyResponse',
                    $response->id
                );
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'response' => $response,
                    'message' => 'Survey started successfully'
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to start survey: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Save answer to a question
     */
    public function saveAnswer(Request $request, $responseId)
    {
        try {
            $user = auth()->user();
            
            $response = SurveyResponse::where('id', $responseId)
                ->where('user_id', $user->id)
                ->firstOrFail();

            // Don't allow editing completed responses
            if ($response->status === 'completed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot edit a completed survey'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'question_id' => 'required|exists:survey_questions,id',
                'answer_text' => 'nullable|string',
                'answer_value' => 'nullable|numeric',
                'selected_options' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Save or update answer
            $answer = SurveyAnswer::updateOrCreate(
                [
                    'response_id' => $response->id,
                    'question_id' => $request->question_id,
                ],
                [
                    'answer_text' => $request->answer_text,
                    'answer_value' => $request->answer_value,
                    'selected_options' => $request->selected_options,
                ]
            );

            return response()->json([
                'success' => true,
                'data' => $answer,
                'message' => 'Answer saved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save answer: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Submit (complete) survey response
     */
    public function submitSurvey(Request $request, $responseId)
    {
        try {
            $user = auth()->user();
            
            $response = SurveyResponse::where('id', $responseId)
                ->where('user_id', $user->id)
                ->with(['survey.questions'])
                ->firstOrFail();

            // Check if all required questions are answered
            $requiredQuestions = $response->survey->questions->where('is_required', true);
            $answeredQuestionIds = $response->answers->pluck('question_id');

            $missingRequired = [];
            foreach ($requiredQuestions as $question) {
                if (!$answeredQuestionIds->contains($question->id)) {
                    $missingRequired[] = $question->question_text;
                }
            }

            if (!empty($missingRequired)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please answer all required questions',
                    'missing_questions' => $missingRequired
                ], 422);
            }

            // Mark as completed
            $response->update([
                'status' => 'completed',
                'completed_at' => now(),
                'completion_percentage' => 100
            ]);

            ActivityLog::logActivity(
                $user->id,
                'survey_completed',
                'Completed survey: ' . $response->survey->title,
                'SurveyResponse',
                $response->id
            );

            return response()->json([
                'success' => true,
                'data' => $response->fresh(),
                'message' => 'Survey submitted successfully!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit survey: ' . $e->getMessage()
            ], 500);
        }
    }
}
