<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\JobPosting;
use App\Models\AlumniProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PublicLandingController extends Controller
{
    /**
     * Helper to get the correct image URL.
     * Returns external URLs as-is, prepends /storage/ to local paths.
     */
    private function getImageUrl(?string $path): ?string
    {
        if (!$path) {
            return null;
        }
        
        // If it's already a full URL (http/https), return as-is
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }
        
        // If it already has /storage prefix, return as-is
        if (str_starts_with($path, '/storage')) {
            return $path;
        }
        
        // Otherwise, prepend /storage/
        return '/storage/' . $path;
    }

    /**
     * Get public announcements for landing page.
     */
    public function getAnnouncements(Request $request): JsonResponse
    {
        $limit = $request->get('limit', 6);
        
        $announcements = Announcement::where('status', 'published')
            ->where('show_on_landing', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            })
            ->select([
                'id',
                'title',
                'content',
                'pages',
                'use_pages',
                'featured_image',
                'gallery_images',
                'priority',
                'published_at',
                'created_at'
            ])
            ->orderBy('priority', 'desc')
            ->orderBy('published_at', 'desc')
            ->limit($limit)
            ->get();

        // Transform the data for the landing page
        $announcements = $announcements->map(function ($announcement) {
            // Process gallery images
            $galleryImages = $announcement->gallery_images;
            if (is_array($galleryImages)) {
                $galleryImages = array_map(fn($img) => $this->getImageUrl($img), $galleryImages);
            }

            // Process pages images
            $pages = $announcement->pages;
            if (is_array($pages)) {
                $pages = array_map(function ($page) {
                    if (!empty($page['image'])) {
                        $page['image'] = $this->getImageUrl($page['image']);
                    }
                    return $page;
                }, $pages);
            }

            return [
                'id' => $announcement->id,
                'title' => $announcement->title,
                'content' => \Illuminate\Support\Str::limit(strip_tags($announcement->content), 150),
                'full_content' => $announcement->content,
                'pages' => $pages,
                'use_pages' => (bool) $announcement->use_pages,
                'featured_image' => $this->getImageUrl($announcement->featured_image),
                'gallery_images' => $galleryImages,
                'priority' => $announcement->priority,
                'published_at' => $announcement->published_at?->format('M d, Y'),
                'created_at' => $announcement->created_at->format('M d, Y'),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $announcements,
        ]);
    }

    /**
     * Get public job postings for landing page.
     */
    public function getJobs(Request $request): JsonResponse
    {
        $limit = $request->get('limit', 6);
        
        $jobs = JobPosting::where('status', 'published')
            ->where('show_on_landing', true)
            ->where(function ($q) {
                $q->whereNull('application_deadline')
                  ->orWhere('application_deadline', '>', now());
            })
            ->select([
                'id',
                'title',
                'slug',
                'company_name',
                'company_logo',
                'poster_image',
                'description',
                'pages',
                'use_pages',
                'location',
                'job_type',
                'salary_range',
                'is_remote',
                'is_featured',
                'application_deadline',
                'published_at',
                'created_at',
                'external_url'
            ])
            ->orderBy('is_featured', 'desc')
            ->orderBy('published_at', 'desc')
            ->limit($limit)
            ->get();

        // Transform the data for the landing page
        $jobs = $jobs->map(function ($job) {
            // Process pages images
            $pages = $job->pages;
            if (is_array($pages)) {
                $pages = array_map(function ($page) {
                    if (!empty($page['image'])) {
                        $page['image'] = $this->getImageUrl($page['image']);
                    }
                    return $page;
                }, $pages);
            }

            return [
                'id' => $job->id,
                'title' => $job->title,
                'slug' => $job->slug,
                'company_name' => $job->company_name,
                'company_logo' => $this->getImageUrl($job->company_logo),
                'poster_image' => $this->getImageUrl($job->poster_image),
                'description' => \Illuminate\Support\Str::limit(strip_tags($job->description), 120),
                'full_description' => $job->description,
                'pages' => $pages,
                'use_pages' => (bool) $job->use_pages,
                'location' => $job->location,
                'job_type' => $job->job_type,
                'job_type_label' => $this->getJobTypeLabel($job->job_type),
                'salary_range' => $job->salary_range,
                'is_remote' => $job->is_remote,
                'is_featured' => $job->is_featured,
                'application_deadline' => $job->application_deadline?->format('M d, Y'),
                'published_at' => $job->published_at?->format('M d, Y'),
                'external_url' => $job->external_url,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $jobs,
        ]);
    }

    /**
     * Search alumni by email or student ID.
     */
    public function searchAlumni(Request $request): JsonResponse
    {
        $request->validate([
            'search' => 'required|string|min:3',
            'search_type' => 'required|in:email,student_id',
        ]);

        $search = $request->input('search');
        $searchType = $request->input('search_type');

        // Search in alumni_profiles and users table
        if ($searchType === 'email') {
            // Search by email in users table
            $user = User::where('email', $search)
                ->where('role_id', 3) // Alumni role
                ->first();

            if ($user) {
                $profile = AlumniProfile::where('user_id', $user->id)->first();
                
                if ($profile) {
                    return response()->json([
                        'success' => true,
                        'found' => true,
                        'message' => 'Alumni record found in the database.',
                        'data' => [
                            'registered' => true,
                            'name' => $profile->first_name . ' ' . $profile->last_name,
                            'graduation_year' => $profile->graduation_year,
                            'course' => $profile->degree_program,
                            'profile_complete' => $profile->profile_completed ?? false,
                        ],
                    ]);
                }
            }

            // Check if email exists in imported alumni records (without user account)
            $importedProfile = AlumniProfile::whereNull('user_id')
                ->where('alternate_email', $search)
                ->first();

            if ($importedProfile) {
                return response()->json([
                    'success' => true,
                    'found' => true,
                    'message' => 'Your record was found in our database. Please complete your registration.',
                    'data' => [
                        'registered' => false,
                        'name' => $importedProfile->first_name . ' ' . $importedProfile->last_name,
                        'graduation_year' => $importedProfile->graduation_year,
                        'course' => $importedProfile->degree_program,
                        'can_register' => true,
                    ],
                ]);
            }
        } else {
            // Search by student ID
            $profile = AlumniProfile::where('student_id', $search)->first();

            if ($profile) {
                $hasAccount = $profile->user_id !== null;
                
                return response()->json([
                    'success' => true,
                    'found' => true,
                    'message' => $hasAccount 
                        ? 'Alumni record found in the database.' 
                        : 'Your record was found in our database. Please complete your registration.',
                    'data' => [
                        'registered' => $hasAccount,
                        'name' => $profile->first_name . ' ' . $profile->last_name,
                        'graduation_year' => $profile->graduation_year,
                        'course' => $profile->degree_program,
                        'profile_complete' => $profile->profile_completed ?? false,
                        'can_register' => !$hasAccount,
                    ],
                ]);
            }
        }

        // Not found
        return response()->json([
            'success' => true,
            'found' => false,
            'message' => 'No alumni record found matching your search criteria.',
            'data' => null,
        ]);
    }

    /**
     * Get landing page statistics.
     */
    public function getStats(): JsonResponse
    {
        $totalProfiles = AlumniProfile::count();
        $totalAlumni = User::where('role_id', 3)->count();
        
        $employedAlumni = AlumniProfile::whereIn('employment_status', [
            'employed_full_time',
            'employed_part_time',
            'self_employed',
        ])->count();
        
        $employmentRate = $totalProfiles > 0 
            ? round(($employedAlumni / $totalProfiles) * 100) 
            : 0;
        
        $activeJobs = JobPosting::where('status', 'published')
            ->where(function ($q) {
                $q->whereNull('application_deadline')
                  ->orWhere('application_deadline', '>', now());
            })
            ->count();
            
        $surveysCompleted = DB::table('survey_responses')
            ->where('status', 'completed')
            ->count();

        $batchYears = AlumniProfile::distinct('graduation_year')
            ->whereNotNull('graduation_year')
            ->count('graduation_year');

        $departments = DB::table('departments')->count();

        $courses = DB::table('courses')->count();

        $industries = AlumniProfile::distinct('company_industry')
            ->whereNotNull('company_industry')
            ->where('company_industry', '!=', '')
            ->count('company_industry');

        return response()->json([
            'success' => true,
            'data' => [
                'totalAlumni' => max($totalAlumni, $totalProfiles),
                'employmentRate' => $employmentRate,
                'activeJobs' => $activeJobs,
                'surveysCompleted' => $surveysCompleted,
                'batchYears' => $batchYears,
                'departments' => $departments,
                'courses' => $courses,
                'industries' => $industries,
            ],
        ]);
    }

    /**
     * Get job type label.
     */
    private function getJobTypeLabel(string $type): string
    {
        $labels = [
            'full_time' => 'Full Time',
            'part_time' => 'Part Time',
            'contract' => 'Contract',
            'internship' => 'Internship',
            'temporary' => 'Temporary',
        ];

        return $labels[$type] ?? ucfirst(str_replace('_', ' ', $type));
    }
}
