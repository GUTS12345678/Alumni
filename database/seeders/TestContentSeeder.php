<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Announcement;
use App\Models\JobPosting;
use Carbon\Carbon;

class TestContentSeeder extends Seeder
{
    /**
     * Seed example announcements and job postings for testing.
     */
    public function run(): void
    {
        $this->seedAnnouncements();
        $this->seedJobPostings();
    }

    private function seedAnnouncements(): void
    {
        $announcements = [
            [
                'title' => 'Alumni Homecoming 2026',
                'content' => '<p>Join us for the <strong>EARIST Alumni Homecoming 2026</strong>! Reconnect with old friends, meet new alumni, and celebrate our shared EARIST heritage.</p><p><strong>Date:</strong> March 15, 2026</p><p><strong>Venue:</strong> EARIST Main Campus Gymnasium</p><p>Register now to secure your spot!</p>',
                'priority' => 'high',
                'is_published' => true,
                'status' => 'published',
                'show_on_landing' => true,
                'featured_image' => 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&h=400&fit=crop',
                'campus_id' => 1,
                'created_by' => 1,
                'published_at' => Carbon::now(),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'title' => 'New Career Development Workshop Series',
                'content' => '<p>Enhance your professional skills with our <strong>Career Development Workshop Series</strong>!</p><ul><li>Resume Writing - Feb 10</li><li>Interview Skills - Feb 17</li><li>LinkedIn Optimization - Feb 24</li></ul><p>All workshops are <strong>FREE</strong> for EARIST alumni.</p>',
                'priority' => 'normal',
                'is_published' => true,
                'status' => 'published',
                'show_on_landing' => true,
                'featured_image' => 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
                'campus_id' => 1,
                'created_by' => 1,
                'published_at' => Carbon::now(),
                'created_at' => Carbon::now()->subDays(2),
                'updated_at' => Carbon::now()->subDays(2),
            ],
            [
                'title' => 'URGENT: Alumni Survey Deadline Extended',
                'content' => '<p><strong>Good news!</strong> The deadline for the 2026 Alumni Tracer Survey has been extended to <strong>February 28, 2026</strong>.</p><p>If you have not completed your survey yet, please do so as soon as possible. Your feedback helps us improve our programs!</p>',
                'priority' => 'urgent',
                'is_published' => true,
                'status' => 'published',
                'show_on_landing' => true,
                'featured_image' => 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop',
                'campus_id' => null,
                'is_multi_campus' => true,
                'created_by' => 1,
                'published_at' => Carbon::now(),
                'created_at' => Carbon::now()->subDay(),
                'updated_at' => Carbon::now()->subDay(),
            ],
            [
                'title' => 'Alumni Association Election Results',
                'content' => '<p>We are pleased to announce the results of the <strong>2026 Alumni Association Election</strong>!</p><p>Congratulations to our newly elected officers. Thank you to all alumni who participated in the voting process.</p><p>The new officers will be inducted on March 1, 2026.</p>',
                'priority' => 'normal',
                'is_published' => true,
                'status' => 'published',
                'show_on_landing' => true,
                'featured_image' => 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
                'campus_id' => 1,
                'created_by' => 1,
                'published_at' => Carbon::now(),
                'created_at' => Carbon::now()->subDays(3),
                'updated_at' => Carbon::now()->subDays(3),
            ],
            [
                'title' => 'Scholarship Program for Alumni Dependents',
                'content' => '<p>EARIST is now accepting applications for the <strong>Alumni Dependent Scholarship Program</strong>.</p><p><strong>Eligibility:</strong></p><ul><li>Must be a dependent of a verified EARIST alumnus</li><li>Must have a GWA of 85% or higher</li><li>Must be enrolled full-time</li></ul><p>Application deadline: March 31, 2026</p>',
                'priority' => 'high',
                'is_published' => true,
                'status' => 'published',
                'show_on_landing' => true,
                'featured_image' => 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&h=400&fit=crop',
                'campus_id' => null,
                'is_multi_campus' => true,
                'created_by' => 1,
                'published_at' => Carbon::now(),
                'created_at' => Carbon::now()->subDays(5),
                'updated_at' => Carbon::now()->subDays(5),
            ],
        ];

        foreach ($announcements as $announcement) {
            Announcement::create($announcement);
        }

        $this->command->info('Created ' . count($announcements) . ' sample announcements');
    }

    private function seedJobPostings(): void
    {
        $jobs = [
            [
                'title' => 'Software Engineer',
                'company_name' => 'TechCorp Philippines',
                'description' => '<p>We are looking for a talented <strong>Software Engineer</strong> to join our growing team!</p><p><strong>Responsibilities:</strong></p><ul><li>Develop and maintain web applications</li><li>Collaborate with cross-functional teams</li><li>Write clean, maintainable code</li></ul><p><strong>Requirements:</strong></p><ul><li>Bachelor\'s degree in Computer Science or related field</li><li>2+ years experience in PHP, JavaScript</li><li>Familiarity with Laravel and React is a plus</li></ul>',
                'location' => 'Makati City',
                'job_type' => 'full_time',
                'employment_type' => 'full_time',
                'experience_level' => 'mid',
                'salary_min' => 40000,
                'salary_max' => 60000,
                'is_salary_visible' => true,
                'status' => 'published',
                'show_on_landing' => true,
                'poster_image' => 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop',
                'background_image' => 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=600&fit=crop',
                'campus_id' => 1,
                'created_by' => 1,
                'published_at' => Carbon::now(),
                'application_deadline' => Carbon::now()->addMonth(),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'title' => 'Civil Engineer',
                'company_name' => 'BuildRight Construction',
                'description' => '<p>Join our engineering team as a <strong>Civil Engineer</strong>!</p><p><strong>What we offer:</strong></p><ul><li>Competitive salary package</li><li>Health insurance</li><li>Career growth opportunities</li></ul><p><strong>Qualifications:</strong></p><ul><li>Licensed Civil Engineer</li><li>1-3 years experience preferred</li><li>Fresh graduates are welcome to apply</li></ul>',
                'location' => 'Quezon City',
                'job_type' => 'full_time',
                'employment_type' => 'full_time',
                'experience_level' => 'entry',
                'salary_min' => 35000,
                'salary_max' => 50000,
                'is_salary_visible' => true,
                'status' => 'published',
                'show_on_landing' => true,
                'poster_image' => 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=400&fit=crop',
                'background_image' => 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&h=600&fit=crop',
                'campus_id' => 1,
                'created_by' => 1,
                'published_at' => Carbon::now(),
                'application_deadline' => Carbon::now()->addWeeks(3),
                'created_at' => Carbon::now()->subDay(),
                'updated_at' => Carbon::now()->subDay(),
            ],
            [
                'title' => 'Accountant',
                'company_name' => 'FinanceHub Inc.',
                'description' => '<p>We are hiring an <strong>Accountant</strong> for our Manila office.</p><p><strong>Duties:</strong></p><ul><li>Prepare financial statements</li><li>Handle tax computations and filings</li><li>Manage accounts payable/receivable</li></ul><p><strong>Requirements:</strong></p><ul><li>BS Accountancy graduate</li><li>CPA is a plus but not required</li><li>Proficient in accounting software</li></ul>',
                'location' => 'Manila',
                'job_type' => 'full_time',
                'employment_type' => 'full_time',
                'experience_level' => 'entry',
                'salary_min' => 30000,
                'salary_max' => 45000,
                'is_salary_visible' => true,
                'status' => 'published',
                'show_on_landing' => true,
                'poster_image' => 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop',
                'background_image' => 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop',
                'campus_id' => null,
                'is_multi_campus' => true,
                'created_by' => 1,
                'published_at' => Carbon::now(),
                'application_deadline' => Carbon::now()->addWeeks(2),
                'created_at' => Carbon::now()->subDays(2),
                'updated_at' => Carbon::now()->subDays(2),
            ],
            [
                'title' => 'Marketing Associate',
                'company_name' => 'BrandX Marketing Agency',
                'description' => '<p>Exciting opportunity for a creative <strong>Marketing Associate</strong>!</p><p><strong>What you will do:</strong></p><ul><li>Create engaging marketing content</li><li>Manage social media accounts</li><li>Assist in campaign planning and execution</li></ul><p><strong>Ideal candidate:</strong></p><ul><li>Business or Marketing degree</li><li>Creative mindset with attention to detail</li><li>Strong communication skills</li></ul>',
                'location' => 'Ortigas, Pasig',
                'job_type' => 'full_time',
                'employment_type' => 'full_time',
                'experience_level' => 'entry',
                'salary_min' => 25000,
                'salary_max' => 35000,
                'is_salary_visible' => true,
                'status' => 'published',
                'show_on_landing' => true,
                'poster_image' => 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&h=400&fit=crop',
                'background_image' => 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=600&fit=crop',
                'campus_id' => 1,
                'created_by' => 1,
                'published_at' => Carbon::now(),
                'application_deadline' => Carbon::now()->addMonth(),
                'created_at' => Carbon::now()->subDays(3),
                'updated_at' => Carbon::now()->subDays(3),
            ],
            [
                'title' => 'IT Support Specialist',
                'company_name' => 'CloudServe Solutions',
                'description' => '<p>Be part of our IT team as an <strong>IT Support Specialist</strong>!</p><p><strong>Key responsibilities:</strong></p><ul><li>Provide technical support to end users</li><li>Troubleshoot hardware and software issues</li><li>Maintain IT equipment and systems</li></ul><p><strong>Requirements:</strong></p><ul><li>IT or Computer Science degree</li><li>Knowledge of Windows/Linux systems</li><li>Good problem-solving skills</li></ul>',
                'location' => 'BGC, Taguig',
                'job_type' => 'full_time',
                'employment_type' => 'full_time',
                'experience_level' => 'entry',
                'salary_min' => 28000,
                'salary_max' => 40000,
                'is_salary_visible' => true,
                'status' => 'published',
                'show_on_landing' => true,
                'poster_image' => 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&h=400&fit=crop',
                'background_image' => 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&h=600&fit=crop',
                'campus_id' => 1,
                'created_by' => 1,
                'published_at' => Carbon::now(),
                'application_deadline' => Carbon::now()->addWeeks(4),
                'created_at' => Carbon::now()->subDays(4),
                'updated_at' => Carbon::now()->subDays(4),
            ],
            [
                'title' => 'Part-Time Data Entry Clerk',
                'company_name' => 'DataFirst Services',
                'description' => '<p>Looking for a reliable <strong>Part-Time Data Entry Clerk</strong>.</p><p><strong>Schedule:</strong> Flexible, 4 hours/day</p><p><strong>Tasks:</strong></p><ul><li>Input data into company systems</li><li>Verify accuracy of data</li><li>Generate reports as needed</li></ul><p>Perfect for students or those seeking part-time work!</p>',
                'location' => 'Work from Home',
                'job_type' => 'part_time',
                'employment_type' => 'part_time',
                'experience_level' => 'any',
                'salary_min' => 12000,
                'salary_max' => 15000,
                'is_salary_visible' => true,
                'status' => 'published',
                'show_on_landing' => true,
                'poster_image' => 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=400&fit=crop',
                'background_image' => 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=1200&h=600&fit=crop',
                'campus_id' => null,
                'is_multi_campus' => true,
                'created_by' => 1,
                'published_at' => Carbon::now(),
                'application_deadline' => Carbon::now()->addWeeks(2),
                'created_at' => Carbon::now()->subDays(5),
                'updated_at' => Carbon::now()->subDays(5),
            ],
        ];

        foreach ($jobs as $job) {
            JobPosting::create($job);
        }

        $this->command->info('Created ' . count($jobs) . ' sample job postings');
    }
}
