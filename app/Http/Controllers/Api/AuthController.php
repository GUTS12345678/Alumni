<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AlumniProfile;
use App\Models\Survey;
use App\Models\SurveyResponse;
use App\Models\SurveyQuestion;
use App\Models\SurveyAnswer;
use App\Models\ActivityLog;
use App\Models\Batch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Register a new user (admin only can create other users)
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6|confirmed',
            'role' => 'required|in:admin,alumni',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'status' => $request->role === 'admin' ? 'active' : 'pending',
        ]);

        // Create alumni profile if user is alumni
        if ($user->role === 'alumni') {
            AlumniProfile::create([
                'user_id' => $user->id,
                'first_name' => $request->first_name ?? '',
                'last_name' => $request->last_name ?? '',
                'profile_completed' => false,
            ]);
        }

        ActivityLog::logActivity(
            $user->id,
            'user_registered',
            "New {$user->role} account created",
            'User',
            $user->id
        );

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                ],
                'token' => $token,
            ]
        ], 201);
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        $user = Auth::user();

        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Account is not active'
            ], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        ActivityLog::logLogin($user->id, $request->ip());

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                ],
                'token' => $token,
            ]
        ]);
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        $user = $request->user();

        if ($user) {
            ActivityLog::logLogout($user->id);
            $user->currentAccessToken()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout successful'
        ]);
    }

    /**
     * Get API token for already authenticated session user
     */
    public function getToken(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated'
            ], 401);
        }

        // Delete any existing tokens for this user to maintain single session
        $user->tokens()->delete();

        // Create a new token
        $token = $user->createToken('web-session-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $token,
                'user' => $user
            ]
        ]);
    }

    /**
     * Get current user profile
     */
    public function profile(Request $request)
    {
        $user = $request->user();
        $profile = null;

        if ($user->role === 'alumni') {
            $profile = $user->alumniProfile()->with('batch')->first();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                    'created_at' => $user->created_at,
                ],
                'profile' => $profile,
            ]
        ]);
    }

    /**
     * Get alumni profile (alumni-only endpoint)
     */
    public function alumniProfile(Request $request)
    {
        $user = $request->user();
        $profile = $user->alumniProfile()->with('batch')->first();

        if (!$profile) {
            return response()->json([
                'success' => false,
                'message' => 'Alumni profile not found'
            ], 404);
        }

        // Check if survey was completed by looking for any survey responses
        $surveyCompleted = SurveyResponse::where('respondent_email', $user->email)
            ->where('status', 'completed')
            ->exists();

        // Calculate profile completion percentage
        $completionPercentage = $this->calculateProfileCompletion($profile);

        return response()->json([
            'success' => true,
            'data' => [
                // User info
                'id' => $profile->user_id,
                'email' => $user->email,
                'created_at' => $user->created_at,
                'survey_completed' => $surveyCompleted,
                
                // Personal information
                'first_name' => $profile->first_name,
                'last_name' => $profile->last_name,
                'middle_name' => $profile->middle_name,
                'student_id' => $profile->student_id,
                'birth_date' => $profile->birth_date,
                'gender' => $profile->gender,
                'phone' => $profile->phone,
                'alternate_email' => $profile->alternate_email,
                
                // Address
                'current_address' => $profile->current_address,
                'city' => $profile->city,
                'state_province' => $profile->state_province,
                'postal_code' => $profile->postal_code,
                'country' => $profile->country,
                
                // Academic information
                'batch_id' => $profile->batch_id,
                'batch' => $profile->batch,
                'degree_program' => $profile->degree_program,
                'major' => $profile->major,
                'minor' => $profile->minor,
                'gpa' => $profile->gpa,
                'graduation_year' => $profile->graduation_year,
                'graduation_date' => $profile->graduation_date,
                
                // Employment information
                'employment_status' => $profile->employment_status,
                'current_job_title' => $profile->current_job_title,
                'current_employer' => $profile->current_employer,
                'company_industry' => $profile->company_industry,
                'company_size' => $profile->company_size,
                'current_salary' => $profile->current_salary,
                'salary_currency' => $profile->salary_currency,
                'job_start_date' => $profile->job_start_date,
                'job_description' => $profile->job_description,
                'job_related_to_degree' => $profile->job_related_to_degree,
                'job_mismatch_reason' => $profile->job_mismatch_reason,
                'job_satisfaction' => $profile->job_satisfaction,
                'unemployment_reason' => $profile->unemployment_reason,
                
                // Skills and career
                'skills' => $profile->skills,
                'certifications' => $profile->certifications,
                'career_goals' => $profile->career_goals,
                'feedback_to_institution' => $profile->feedback_to_institution,
                
                // Networking
                'willing_to_mentor' => $profile->willing_to_mentor,
                'willing_to_hire_alumni' => $profile->willing_to_hire_alumni,
                
                // Profile status
                'profile_completed' => $profile->profile_completed,
                'profile_completed_at' => $profile->profile_completed_at,
                'completion_percentage' => $completionPercentage,
            ]
        ]);
    }

    /**
     * Update alumni profile
     */
    public function updateAlumniProfile(Request $request)
    {
        $user = $request->user();
        $profile = $user->alumniProfile()->first();

        if (!$profile) {
            return response()->json([
                'success' => false,
                'message' => 'Alumni profile not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'middle_name' => 'sometimes|nullable|string|max:255',
            'student_id' => 'sometimes|nullable|string|max:255',
            'birth_date' => 'sometimes|nullable|date',
            'gender' => 'sometimes|nullable|in:male,female,other,prefer_not_to_say',
            'phone' => 'sometimes|nullable|string|max:50',
            'alternate_email' => 'sometimes|nullable|email|max:255',
            'current_address' => 'sometimes|nullable|string|max:500',
            'city' => 'sometimes|nullable|string|max:255',
            'state_province' => 'sometimes|nullable|string|max:255',
            'postal_code' => 'sometimes|nullable|string|max:20',
            'country' => 'sometimes|nullable|string|max:255',
            'degree_program' => 'sometimes|nullable|string|max:255',
            'major' => 'sometimes|nullable|string|max:255',
            'minor' => 'sometimes|nullable|string|max:255',
            'gpa' => 'sometimes|nullable|numeric|min:0|max:5',
            'graduation_year' => 'sometimes|nullable|integer|min:1900|max:2100',
            'graduation_date' => 'sometimes|nullable|date',
            'employment_status' => 'sometimes|nullable|in:employed_full_time,employed_part_time,self_employed,unemployed_looking,unemployed_not_looking,further_education,other',
            'current_job_title' => 'sometimes|nullable|string|max:255',
            'current_employer' => 'sometimes|nullable|string|max:255',
            'company_industry' => 'sometimes|nullable|string|max:255',
            'company_size' => 'sometimes|nullable|string|max:50',
            'job_start_date' => 'sometimes|nullable|date',
            'job_description' => 'sometimes|nullable|string',
            'job_related_to_degree' => 'sometimes|nullable|boolean',
            'job_satisfaction' => 'sometimes|nullable|integer|min:1|max:5',
            'unemployment_reason' => 'sometimes|nullable|string',
            'skills' => 'sometimes|nullable|array',
            'certifications' => 'sometimes|nullable|array',
            'career_goals' => 'sometimes|nullable|string',
            'feedback_to_institution' => 'sometimes|nullable|string',
            'willing_to_mentor' => 'sometimes|nullable|boolean',
            'willing_to_hire_alumni' => 'sometimes|nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $profile->update($request->all());

            // Check if profile should be marked as completed
            if ($profile->isProfileComplete() && !$profile->profile_completed) {
                $profile->markAsCompleted();
            }

            ActivityLog::logActivity(
                $user->id,
                'profile_updated',
                'Alumni profile updated',
                'AlumniProfile',
                $profile->id
            );

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => $profile->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate profile completion percentage
     */
    private function calculateProfileCompletion($profile): int
    {
        $fields = [
            // Personal (20 points)
            'first_name' => 2,
            'last_name' => 2,
            'birth_date' => 2,
            'gender' => 2,
            'phone' => 2,
            'current_address' => 2,
            'city' => 2,
            'state_province' => 2,
            'country' => 2,
            'postal_code' => 2,
            
            // Academic (30 points)
            'degree_program' => 6,
            'major' => 6,
            'graduation_year' => 6,
            'graduation_date' => 6,
            'gpa' => 6,
            
            // Employment (40 points)
            'employment_status' => 10,
            'current_job_title' => 10,
            'current_employer' => 10,
            'job_related_to_degree' => 10,
            
            // Career (10 points)
            'career_goals' => 5,
            'skills' => 5,
        ];

        $totalPoints = 0;
        $earnedPoints = 0;

        foreach ($fields as $field => $points) {
            $totalPoints += $points;
            $value = $profile->$field;
            
            if ($field === 'skills' && is_array($value) && count($value) > 0) {
                $earnedPoints += $points;
            } elseif (!empty($value)) {
                $earnedPoints += $points;
            }
        }

        return round(($earnedPoints / $totalPoints) * 100);
    }
}

