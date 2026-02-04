<?php

namespace App\Http\Controllers\Alumni;

use App\Http\Controllers\Controller;
use App\Models\MentorProfile;
use App\Models\Mentorship;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class MentorshipController extends Controller
{
    /**
     * Display mentorship program page
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Check if user is a mentor
        $mentorProfile = MentorProfile::where('user_id', $user->id)->first();

        // Get available mentors with search and filters
        $query = MentorProfile::with('user.alumniProfile')
            ->active()
            ->where('user_id', '!=', $user->id);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('user', function($user) use ($search) {
                    $user->where('name', 'like', "%{$search}%");
                })
                ->orWhere('expertise_area', 'like', "%{$search}%")
                ->orWhere('bio', 'like', "%{$search}%");
            });
        }

        // Expertise filter
        if ($request->filled('expertise')) {
            $query->where('expertise_area', $request->expertise);
        }

        $mentors = $query->paginate(12);

        // Transform mentors data for frontend
        $mentors->getCollection()->transform(function($mentor) {
            return [
                'id' => $mentor->user_id,
                'name' => $mentor->user->name,
                'email' => $mentor->user->email,
                'graduation_year' => $mentor->user->alumniProfile?->graduation_year,
                'current_position' => $mentor->user->alumniProfile?->current_job_title,
                'current_company' => $mentor->user->alumniProfile?->current_employer,
                'expertise' => $mentor->specializations ?? [],
                'mentoring_experience' => $mentor->bio,
                'availability' => $mentor->availability,
                'rating' => $mentor->rating ?? 0,
                'review_count' => $mentor->review_count ?? 0,
            ];
        });

        return Inertia::render('Alumni/Mentorship', [
            'mentors' => $mentors,
            'filters' => $request->only(['search', 'expertise']),
            'mentorProfile' => $mentorProfile,
        ]);
    }

    /**
     * Create mentor profile
     */
    public function createMentorProfile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'expertise_area' => 'required|string|max:255',
            'bio' => 'required|string',
            'specializations' => 'required|array|min:1',
            'years_of_experience' => 'required|integer|min:1',
            'max_mentees' => 'required|integer|min:1|max:10',
            'availability' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $user = $request->user();

        // Check if profile already exists
        if (MentorProfile::where('user_id', $user->id)->exists()) {
            return redirect()->back()->with('error', 'You already have a mentor profile!');
        }

        $profile = MentorProfile::create([
            'user_id' => $user->id,
            ...$request->all(),
            'status' => 'active',
            'is_available' => true,
        ]);

        ActivityLog::logActivity(
            $user->id,
            'mentor_profile_created',
            "Created mentor profile in {$profile->expertise_area}",
            'MentorProfile',
            $profile->id
        );

        return redirect()->back()->with('success', 'Mentor profile created successfully!');
    }

    /**
     * Update mentor profile
     */
    public function updateMentorProfile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'expertise_area' => 'required|string|max:255',
            'bio' => 'required|string',
            'specializations' => 'required|array|min:1',
            'years_of_experience' => 'required|integer|min:1',
            'max_mentees' => 'required|integer|min:1|max:10',
            'availability' => 'nullable|array',
            'is_available' => 'boolean',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $user = $request->user();

        $profile = MentorProfile::where('user_id', $user->id)->firstOrFail();
        $profile->update($request->all());

        ActivityLog::logActivity(
            $user->id,
            'mentor_profile_updated',
            "Updated mentor profile",
            'MentorProfile',
            $profile->id
        );

        return redirect()->back()->with('success', 'Mentor profile updated successfully!');
    }

    /**
     * Request mentorship
     */
    public function requestMentorship(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'mentor_id' => 'required|exists:users,id',
            'message' => 'required|string',
            'goals' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $user = $request->user();

        // Check if already has active mentorship with this mentor
        $existing = Mentorship::where('mentee_id', $user->id)
            ->where('mentor_id', $request->mentor_id)
            ->whereIn('status', ['pending', 'active'])
            ->exists();

        if ($existing) {
            return redirect()->back()->with('error', 'You already have a mentorship request with this mentor!');
        }

        // Check if mentor can accept more mentees
        $mentorProfile = MentorProfile::where('user_id', $request->mentor_id)->first();
        if (!$mentorProfile || !$mentorProfile->canAcceptMentees()) {
            return redirect()->back()->with('error', 'This mentor is not available at the moment!');
        }

        $mentorship = Mentorship::create([
            'mentor_id' => $request->mentor_id,
            'mentee_id' => $user->id,
            'mentee_message' => $request->message,
            'goals' => $request->goals,
            'status' => 'pending',
        ]);

        ActivityLog::logActivity(
            $user->id,
            'mentorship_requested',
            "Requested mentorship from mentor ID: {$request->mentor_id}",
            'Mentorship',
            $mentorship->id
        );

        return redirect()->back()->with('success', 'Mentorship request sent!');
    }

    /**
     * Accept mentorship request
     */
    public function acceptMentorship(Request $request, $id)
    {
        $user = $request->user();

        $mentorship = Mentorship::where('id', $id)
            ->where('mentor_id', $user->id)
            ->where('status', 'pending')
            ->firstOrFail();

        $mentorship->update([
            'status' => 'active',
            'start_date' => now(),
            'mentor_response' => $request->response,
        ]);

        ActivityLog::logActivity(
            $user->id,
            'mentorship_accepted',
            "Accepted mentorship request from {$mentorship->mentee->name}",
            'Mentorship',
            $mentorship->id
        );

        return redirect()->back()->with('success', 'Mentorship request accepted!');
    }

    /**
     * Reject mentorship request
     */
    public function rejectMentorship(Request $request, $id)
    {
        $user = $request->user();

        $mentorship = Mentorship::where('id', $id)
            ->where('mentor_id', $user->id)
            ->where('status', 'pending')
            ->firstOrFail();

        $mentorship->update([
            'status' => 'cancelled',
            'mentor_response' => $request->response,
        ]);

        return redirect()->back()->with('success', 'Mentorship request rejected!');
    }

    /**
     * Complete mentorship
     */
    public function completeMentorship(Request $request, $id)
    {
        $user = $request->user();

        $mentorship = Mentorship::where('id', $id)
            ->where(function($query) use ($user) {
                $query->where('mentor_id', $user->id)
                      ->orWhere('mentee_id', $user->id);
            })
            ->where('status', 'active')
            ->firstOrFail();

        $mentorship->update([
            'status' => 'completed',
            'end_date' => now(),
            'notes' => $request->notes,
        ]);

        ActivityLog::logActivity(
            $user->id,
            'mentorship_completed',
            "Completed mentorship",
            'Mentorship',
            $mentorship->id
        );

        return redirect()->back()->with('success', 'Mentorship marked as completed!');
    }

    /**
     * Cancel mentorship
     */
    public function cancelMentorship(Request $request, $id)
    {
        $user = $request->user();

        $mentorship = Mentorship::where('id', $id)
            ->where(function($query) use ($user) {
                $query->where('mentor_id', $user->id)
                      ->orWhere('mentee_id', $user->id);
            })
            ->whereIn('status', ['pending', 'active'])
            ->firstOrFail();

        $mentorship->update([
            'status' => 'cancelled',
            'end_date' => now(),
        ]);

        return redirect()->back()->with('success', 'Mentorship cancelled!');
    }

    /**
     * Express interest in becoming a mentor
     */
    public function becomeMentor(Request $request)
    {
        $user = $request->user();

        // Check if user already has a mentor profile
        if (MentorProfile::where('user_id', $user->id)->exists()) {
            return redirect()->back()->with('error', 'You are already registered as a mentor!');
        }

        // Create a basic mentor interest record (could be a separate table or just log it)
        ActivityLog::logActivity(
            $user->id,
            'mentor_interest_expressed',
            "User expressed interest in becoming a mentor",
            'User',
            $user->id
        );

        return redirect()->back()->with('success', 'Thank you for your interest! Our team will contact you soon.');
    }
}
