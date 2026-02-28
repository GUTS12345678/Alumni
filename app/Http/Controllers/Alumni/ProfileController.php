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
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        try {
            $profile->update($request->only([
                'first_name', 'last_name', 'middle_name', 'student_id', 'birth_date',
                'gender', 'phone', 'alternate_email', 'current_address', 'city',
                'state_province', 'postal_code', 'country', 'degree_program', 'major',
                'minor', 'gpa', 'graduation_year', 'graduation_date', 'maiden_name',
                'suffix', 'age', 'place_of_birth', 'civil_status', 'spouse_name',
                'number_of_children', 'mobile_no', 'enrollment_year', 'honors_awards',
                'employment_status', 'presently_employed', 'employment_location_type',
                'current_job_title', 'current_employer', 'company_address',
                'company_industry', 'company_size', 'major_line_of_business',
                'average_monthly_income', 'salary_range', 'career_field',
                'job_level_position', 'job_start_date', 'date_hired', 'years_of_service',
                'job_description', 'job_related_to_degree', 'job_aligned_to_course',
                'job_satisfaction', 'unemployment_reason', 'skills', 'certifications',
                'achievements', 'about_me', 'career_goals', 'feedback_to_institution',
                'willing_to_mentor', 'willing_to_hire_alumni',
            ]));

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
