<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\JobPosting;
use App\Models\Content;
use App\Models\AlumniProfile;
use App\Models\User;
use App\Models\LandingContent;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PublicLandingController extends Controller
{
    /**
     * Helper to get the correct image URL.
     * Returns external URLs as-is, uses /api/v1/assets/ for local paths
     * (public landing page content served without authentication).
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
        
        // If it already has /api/ prefix, return as-is
        if (str_starts_with($path, '/api/')) {
            return $path;
        }
        
        // Strip legacy /storage/ prefix if present
        if (str_starts_with($path, '/storage/')) {
            $path = substr($path, 9);
        }
        
        // Serve through public assets route (no auth required for landing page)
        return '/api/v1/assets/' . $path;
    }

    /**
     * Get public announcements for landing page.
     */
    public function getAnnouncements(Request $request): JsonResponse
    {
        $limit = $request->get('limit', 6);
        
        $announcements = Content::where('content_type', 'announcement')
            ->where('status', 'published')
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
                'is_featured',
                'priority',
                'published_at',
                'created_at'
            ])
            ->orderBy('published_at', 'desc')
            ->orderBy('created_at', 'desc')
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
        
        $jobs = Content::where('content_type', 'job')
            ->where('status', 'published')
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
                'featured_image',
                'content',
                'pages',
                'use_pages',
                'location',
                'job_type',
                'salary_min',
                'salary_max',
                'work_arrangement',
                'is_featured',
                'application_deadline',
                'published_at',
                'created_at',
                'external_url'
            ])
            ->orderBy('published_at', 'desc')
            ->orderBy('created_at', 'desc')
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

            // Format salary range
            $salaryRange = null;
            if ($job->salary_min || $job->salary_max) {
                $salaryRange = ($job->salary_min ? '₱' . number_format($job->salary_min) : '') . 
                    ($job->salary_min && $job->salary_max ? ' - ' : '') . 
                    ($job->salary_max ? '₱' . number_format($job->salary_max) : '');
            }

            return [
                'id' => $job->id,
                'title' => $job->title,
                'slug' => $job->slug,
                'company_name' => $job->company_name,
                'company_logo' => $this->getImageUrl($job->company_logo),
                'poster_image' => $this->getImageUrl($job->featured_image),
                'description' => \Illuminate\Support\Str::limit(strip_tags($job->content), 120),
                'full_description' => $job->content,
                'pages' => $pages,
                'use_pages' => (bool) $job->use_pages,
                'location' => $job->location,
                'job_type' => $job->job_type,
                'job_type_label' => $this->getJobTypeLabel($job->job_type),
                'salary_range' => $salaryRange,
                'is_remote' => $job->work_arrangement === 'remote',
                'work_arrangement' => $job->work_arrangement,
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

    /**
     * Get other published content (events, news, blogs, scholarships, resources) for landing page.
     */
    public function getContentByTypes(Request $request): JsonResponse
    {
        $limit = $request->get('limit', 12);
        $types = ['event', 'news', 'blog', 'scholarship', 'resource'];

        $items = Content::whereIn('content_type', $types)
            ->where('status', 'published')
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            })
            ->select([
                'id',
                'title',
                'slug',
                'content_type',
                'content',
                'pages',
                'use_pages',
                'featured_image',
                'gallery_images',
                'is_featured',
                'location',
                'start_date',
                'external_url',
                'published_at',
                'created_at',
            ])
            ->orderBy('published_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        $items = $items->map(function ($item) {
            $galleryImages = $item->gallery_images;
            if (is_array($galleryImages)) {
                $galleryImages = array_map(fn($img) => $this->getImageUrl($img), $galleryImages);
            }

            $pages = $item->pages;
            if (is_array($pages)) {
                $pages = array_map(function ($page) {
                    if (!empty($page['image'])) {
                        $page['image'] = $this->getImageUrl($page['image']);
                    }
                    return $page;
                }, $pages);
            }

            return [
                'id' => $item->id,
                'title' => $item->title,
                'slug' => $item->slug,
                'content_type' => $item->content_type,
                'content_type_label' => $this->getContentTypeLabel($item->content_type),
                'excerpt' => \Illuminate\Support\Str::limit(strip_tags($item->content), 150),
                'full_content' => $item->content,
                'pages' => $pages,
                'use_pages' => (bool) $item->use_pages,
                'featured_image' => $this->getImageUrl($item->featured_image),
                'gallery_images' => $galleryImages,
                'is_featured' => $item->is_featured,
                'location' => $item->location,
                'event_date' => $item->start_date?->format('M d, Y'),
                'external_url' => $item->external_url,
                'published_at' => $item->published_at?->format('M d, Y'),
                'created_at' => $item->created_at->format('M d, Y'),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    /**
     * Get content type label.
     */
    private function getContentTypeLabel(string $type): string
    {
        $labels = [
            'event' => 'Event',
            'news' => 'News',
            'blog' => 'Blog',
            'scholarship' => 'Scholarship',
            'resource' => 'Resource',
            'announcement' => 'Announcement',
            'job' => 'Job',
        ];

        return $labels[$type] ?? ucfirst(str_replace('_', ' ', $type));
    }

    /**
     * Get custom landing page content.
     */
    public function getContent(Request $request): JsonResponse
    {
        $query = LandingContent::where('is_active', true)
            ->where('is_published', true)
            ->where(function ($q) {
                $q->whereNull('published_at')
                  ->orWhere('published_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            });

        // Filter by campus
        if ($request->has('campus_id')) {
            $campusId = $request->campus_id;
            $query->where(function ($q) use ($campusId) {
                $q->where('campus_id', $campusId)
                  ->orWhere('is_multi_campus', true)
                  ->orWhereNull('campus_id');
            });
        }

        // Filter by content type
        if ($request->has('type')) {
            $query->where('content_type', $request->type);
        }

        $contents = $query->orderBy('display_order', 'asc')
            ->orderBy('created_at', 'desc')
            ->get();

        // Transform data for frontend
        $contents = $contents->map(function ($content) {
            // Process gallery images
            $galleryImages = $content->gallery_images;
            if (is_array($galleryImages)) {
                $galleryImages = array_map(fn($img) => $this->getImageUrl($img), $galleryImages);
            }

            // Process pages images
            $pages = $content->pages;
            if (is_array($pages)) {
                $pages = array_map(function ($page) {
                    if (!empty($page['image'])) {
                        $page['image'] = $this->getImageUrl($page['image']);
                    }
                    return $page;
                }, $pages);
            }

            return [
                'id' => $content->id,
                'title' => $content->title,
                'description' => $content->description,
                'content_type' => $content->content_type,
                'media_url' => $content->media_url,
                'media_file_url' => $this->getImageUrl($content->media_file),
                'thumbnail_url' => $this->getImageUrl($content->thumbnail),
                'gallery_images' => $galleryImages,
                'content' => $content->content,
                'pages' => $pages,
                'use_pages' => (bool) $content->use_pages,
                'metadata' => $content->metadata,
                'layout' => $content->layout,
                'background_color' => $content->background_color,
                'text_color' => $content->text_color,
                'section_id' => $content->section_id,
                'display_order' => $content->display_order,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $contents,
        ]);
    }
}
