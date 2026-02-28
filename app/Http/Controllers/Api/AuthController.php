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
     * Register a new alumni user (public registration)
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8|confirmed',
            'role' => 'sometimes|in:alumni',
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
            'role' => 'alumni',
            'status' => 'pending',
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

        // Enforce device limit
        $maxDevices = config('security.authentication.session.max_devices', 5);
        $activeTokens = $user->tokens()->count();

        if ($activeTokens >= $maxDevices) {
            // Remove the oldest token to make room
            $user->tokens()
                ->orderBy('last_used_at', 'asc')
                ->first()
                ?->delete();
        }

        // Create token with device info
        $newToken = $user->createToken('auth-token');
        $accessToken = $newToken->accessToken;
        $accessToken->ip_address = $request->ip();
        $accessToken->user_agent = $request->userAgent();
        $accessToken->device_name = $this->generateDeviceName($request->userAgent());
        $accessToken->save();

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
                'token' => $newToken->plainTextToken,
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

        // Revoke only the current web-session token (not all devices)
        $user->tokens()->where('name', 'web-session-token')->delete();

        // Create a new token with device info
        $newToken = $user->createToken('web-session-token');
        $accessToken = $newToken->accessToken;
        $accessToken->ip_address = $request->ip();
        $accessToken->user_agent = $request->userAgent();
        $accessToken->device_name = $this->generateDeviceName($request->userAgent());
        $accessToken->save();

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $newToken->plainTextToken,
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
            // Auto-create a stub profile so the dashboard doesn't crash
            $nameParts = explode(' ', $user->name, 2);
            $profile = $user->alumniProfile()->create([
                'first_name' => $nameParts[0] ?? '',
                'last_name' => $nameParts[1] ?? '',
                'campus_id' => $user->campus_id ?? 1,
            ]);
            $profile->load('batch');
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
                'maiden_name' => $profile->maiden_name,
                'suffix' => $profile->suffix,
                'student_id' => $profile->student_id,
                'birth_date' => $profile->birth_date,
                'age' => $profile->age,
                'gender' => $profile->gender,
                'place_of_birth' => $profile->place_of_birth,
                'civil_status' => $profile->civil_status,
                'spouse_name' => $profile->spouse_name,
                'number_of_children' => $profile->number_of_children,
                'phone' => $profile->phone,
                'mobile_no' => $profile->mobile_no,
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
                'enrollment_year' => $profile->enrollment_year,
                'honors_awards' => $profile->honors_awards,
                
                // Employment information
                'employment_status' => $profile->employment_status,
                'presently_employed' => $profile->presently_employed,
                'employment_location_type' => $profile->employment_location_type,
                'current_job_title' => $profile->current_job_title,
                'current_employer' => $profile->current_employer,
                'company_address' => $profile->company_address,
                'company_industry' => $profile->company_industry,
                'company_size' => $profile->company_size,
                'major_line_of_business' => $profile->major_line_of_business,
                'current_salary' => $profile->current_salary,
                'salary_currency' => $profile->salary_currency,
                'salary_range' => $profile->salary_range,
                'average_monthly_income' => $profile->average_monthly_income,
                'career_field' => $profile->career_field,
                'job_level_position' => $profile->job_level_position,
                'job_start_date' => $profile->job_start_date,
                'date_hired' => $profile->date_hired,
                'years_of_service' => $profile->years_of_service,
                'job_description' => $profile->job_description,
                'job_related_to_degree' => $profile->job_related_to_degree,
                'job_aligned_to_course' => $profile->job_aligned_to_course,
                'job_mismatch_reason' => $profile->job_mismatch_reason,
                'job_satisfaction' => $profile->job_satisfaction,
                'unemployment_reason' => $profile->unemployment_reason,
                
                // Skills and career
                'skills' => $profile->skills,
                'certifications' => $profile->certifications,
                'achievements' => $profile->achievements,
                'about_me' => $profile->about_me,
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

        // SECURITY: Prevent campus_id changes for non-admin users
        if ($request->has('campus_id') && !in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: Campus assignment cannot be changed by alumni users.'
            ], 403);
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
            'maiden_name' => 'sometimes|nullable|string|max:255',
            'suffix' => 'sometimes|nullable|string|max:10',
            'age' => 'sometimes|nullable|integer|min:0|max:150',
            'place_of_birth' => 'sometimes|nullable|string|max:255',
            'civil_status' => 'sometimes|nullable|string|max:50',
            'spouse_name' => 'sometimes|nullable|string|max:255',
            'number_of_children' => 'sometimes|nullable|integer|min:0',
            'mobile_no' => 'sometimes|nullable|string|max:20',
            'enrollment_year' => 'sometimes|nullable|integer|min:1900|max:2100',
            'honors_awards' => 'sometimes|nullable|string',
            'employment_status' => 'sometimes|nullable|in:employed_full_time,employed_part_time,self_employed,unemployed_seeking,unemployed_not_seeking,continuing_education,military_service,other',
            'presently_employed' => 'sometimes|nullable|string|max:10',
            'employment_location_type' => 'sometimes|nullable|in:local,foreign,remote,not_applicable',
            'current_job_title' => 'sometimes|nullable|string|max:255',
            'current_employer' => 'sometimes|nullable|string|max:255',
            'company_address' => 'sometimes|nullable|string|max:500',
            'company_industry' => 'sometimes|nullable|string|max:255',
            'company_size' => 'sometimes|nullable|string|max:50',
            'major_line_of_business' => 'sometimes|nullable|string|max:255',
            'average_monthly_income' => 'sometimes|nullable|string|max:255',
            'salary_range' => 'sometimes|nullable|string|max:50',
            'career_field' => 'sometimes|nullable|string|max:100',
            'job_level_position' => 'sometimes|nullable|string|max:255',
            'job_start_date' => 'sometimes|nullable|date',
            'date_hired' => 'sometimes|nullable|date',
            'years_of_service' => 'sometimes|nullable|numeric|min:0',
            'job_description' => 'sometimes|nullable|string',
            'job_related_to_degree' => 'sometimes|nullable|boolean',
            'job_aligned_to_course' => 'sometimes|nullable|string|max:10',
            'job_satisfaction' => 'sometimes|nullable|integer|min:1|max:5',
            'unemployment_reason' => 'sometimes|nullable|string',
            'skills' => 'sometimes|nullable|array',
            'certifications' => 'sometimes|nullable|array',
            'achievements' => 'sometimes|nullable|string',
            'about_me' => 'sometimes|nullable|string',
            'career_goals' => 'sometimes|nullable|string',
            'feedback_to_institution' => 'sometimes|nullable|string',
            'willing_to_mentor' => 'sometimes|nullable|boolean',
            'willing_to_hire_alumni' => 'sometimes|nullable|boolean',
            'campus_id' => 'prohibited', // SECURITY: Block campus_id in updates
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Remove campus_id from request data (extra security layer)
            $updateData = $request->except(['campus_id', 'user_id', 'id']);
            $profile->update($updateData);

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

    /**
     * Update alumni department and course (one-time profile update)
     */
    public function updateDepartmentCourse(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'department_id' => 'required|exists:departments,id',
            'course_id' => 'required|exists:courses,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();

        // Check if user has alumni profile
        $profile = AlumniProfile::where('user_id', $user->id)->first();

        if (!$profile) {
            return response()->json([
                'success' => false,
                'message' => 'Alumni profile not found'
            ], 404);
        }

        // Verify the course belongs to the selected department
        $course = \App\Models\Course::find($request->course_id);
        if ($course->department_id != $request->department_id) {
            return response()->json([
                'success' => false,
                'message' => 'The selected course does not belong to the selected department'
            ], 422);
        }

        // Update the profile
        $profile->update([
            'department_id' => $request->department_id,
            'course_id' => $request->course_id,
            'profile_complete' => true,
        ]);

        // Log the activity
        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'profile_department_course_updated',
            'description' => "Updated department and course information",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => [
                'department_id' => $profile->department_id,
                'course_id' => $profile->course_id,
                'profile_complete' => $profile->profile_complete,
            ]
        ]);
    }

    /**
     * Check if email already exists
     */
    public function checkEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email format',
                'exists' => false
            ], 422);
        }

        $exists = User::where('email', $request->email)->exists();

        return response()->json([
            'success' => true,
            'exists' => $exists,
            'message' => $exists ? 'Email already registered' : 'Email available'
        ]);
    }

    /**
     * Check if student ID already exists
     */
    public function checkStudentId(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_id' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid student ID',
                'exists' => false
            ], 422);
        }

        $exists = AlumniProfile::where('student_id', $request->student_id)->exists();

        return response()->json([
            'success' => true,
            'exists' => $exists,
            'message' => $exists ? 'Student ID already registered' : 'Student ID available'
        ]);
    }

    /**
     * Check if phone number already exists in alumni profiles
     */
    public function checkPhone(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string|min:7',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid phone number',
                'exists' => false
            ], 422);
        }

        // Normalize phone (strip spaces, dashes, parens)
        $phone = preg_replace('/[\s\-\(\)]/', '', $request->phone);

        $exists = AlumniProfile::where(function ($q) use ($phone) {
            $q->where('phone', 'LIKE', "%{$phone}%")
              ->orWhere('phone', 'LIKE', "%{$phone}");
        })->exists();

        return response()->json([
            'success' => true,
            'exists' => $exists,
            'message' => $exists ? 'Phone number already registered' : 'Phone number available'
        ]);
    }

    /**
     * Check if login (email or student_id) exists
     * Used by login page to validate credentials before submission
     */
    public function checkLogin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'login' => 'required|string',
            'type' => 'required|in:email,student_id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid input',
                'exists' => false
            ], 422);
        }

        $exists = false;
        $message = '';

        if ($request->type === 'email') {
            $exists = User::where('email', $request->login)->exists();
            $message = $exists ? 'Email found in our records' : 'Email not registered';
        } else {
            $exists = AlumniProfile::where('student_id', $request->login)->exists();
            $message = $exists ? 'Student ID found in our records' : 'Student ID not found';
        }

        return response()->json([
            'success' => true,
            'exists' => $exists,
            'message' => $message
        ]);
    }

    /**
     * Generate a human-readable device name from user agent string.
     */
    private function generateDeviceName(?string $userAgent): string
    {
        if (!$userAgent) {
            return 'Unknown Device';
        }

        // Detect browser
        $browser = 'Unknown Browser';
        if (preg_match('/Edg\/(\d+)/i', $userAgent)) {
            $browser = 'Edge';
        } elseif (preg_match('/OPR\/(\d+)/i', $userAgent) || preg_match('/Opera/i', $userAgent)) {
            $browser = 'Opera';
        } elseif (preg_match('/Chrome\/(\d+)/i', $userAgent) && !preg_match('/Edg/i', $userAgent)) {
            $browser = 'Chrome';
        } elseif (preg_match('/Firefox\/(\d+)/i', $userAgent)) {
            $browser = 'Firefox';
        } elseif (preg_match('/Safari\/(\d+)/i', $userAgent) && !preg_match('/Chrome/i', $userAgent)) {
            $browser = 'Safari';
        }

        // Detect platform
        $platform = 'Unknown';
        if (preg_match('/Windows/i', $userAgent)) {
            $platform = 'Windows';
        } elseif (preg_match('/Macintosh|Mac OS X/i', $userAgent)) {
            $platform = 'macOS';
        } elseif (preg_match('/Android/i', $userAgent)) {
            $platform = 'Android';
        } elseif (preg_match('/iPhone|iPad|iPod/i', $userAgent)) {
            $platform = 'iOS';
        } elseif (preg_match('/Linux/i', $userAgent)) {
            $platform = 'Linux';
        }

        return "{$browser} on {$platform}";
    }
}
