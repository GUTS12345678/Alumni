<?php

namespace App\Http\Controllers\Alumni;

use App\Http\Controllers\Controller;
use App\Models\AlumniProfile;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class ProfileController extends Controller
{
    /**
     * Update the authenticated alumni's profile
     */
    public function update(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'alumni') {
            return redirect()->back()->with('error', 'Unauthorized');
        }

        $profile = $user->alumniProfile;

        if (!$profile) {
            return redirect()->back()->with('error', 'Profile not found');
        }

        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
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
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
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

            return redirect()->back()->with('success', 'Profile updated successfully!');

        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to update profile: ' . $e->getMessage())
                ->withInput();
        }
    }
}
