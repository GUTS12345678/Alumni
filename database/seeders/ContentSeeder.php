<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ContentSeeder extends Seeder
{
    /**
     * Seed announcements and job postings with photos and multi-page content.
     */
    public function run(): void
    {
        $this->command->info('Downloading sample images...');
        $this->downloadSampleImages();

        $this->command->info('Seeding announcements...');
        $this->seedAnnouncements();

        $this->command->info('Seeding job categories...');
        $this->seedJobCategories();

        $this->command->info('Seeding job postings...');
        $this->seedJobPostings();

        $this->command->info('Content seeding complete!');
    }

    private function downloadSampleImages(): void
    {
        $announcementDir = storage_path('app/public/announcements');
        $jobDir = storage_path('app/public/jobs');

        if (!is_dir($announcementDir)) mkdir($announcementDir, 0755, true);
        if (!is_dir($jobDir)) mkdir($jobDir, 0755, true);

        // Download announcement images (using picsum for placeholder images)
        $announcementImages = [
            'graduation_ceremony.jpg' => 'https://picsum.photos/seed/graduation/1200/600',
            'alumni_homecoming.jpg' => 'https://picsum.photos/seed/homecoming/1200/600',
            'career_fair.jpg' => 'https://picsum.photos/seed/careerfair/1200/600',
            'scholarship_program.jpg' => 'https://picsum.photos/seed/scholarship/1200/600',
            'tech_workshop.jpg' => 'https://picsum.photos/seed/techworkshop/1200/600',
            'community_outreach.jpg' => 'https://picsum.photos/seed/community/1200/600',
            'sports_fest.jpg' => 'https://picsum.photos/seed/sportsfest/1200/600',
            'research_symposium.jpg' => 'https://picsum.photos/seed/research/1200/600',
            'gallery_1.jpg' => 'https://picsum.photos/seed/gallery1/800/600',
            'gallery_2.jpg' => 'https://picsum.photos/seed/gallery2/800/600',
            'gallery_3.jpg' => 'https://picsum.photos/seed/gallery3/800/600',
            'gallery_4.jpg' => 'https://picsum.photos/seed/gallery4/800/600',
            'gallery_5.jpg' => 'https://picsum.photos/seed/gallery5/800/600',
            'gallery_6.jpg' => 'https://picsum.photos/seed/gallery6/800/600',
            'gallery_7.jpg' => 'https://picsum.photos/seed/gallery7/800/600',
            'gallery_8.jpg' => 'https://picsum.photos/seed/gallery8/800/600',
            'gallery_9.jpg' => 'https://picsum.photos/seed/gallery9/800/600',
            'gallery_10.jpg' => 'https://picsum.photos/seed/gallery10/800/600',
            'gallery_11.jpg' => 'https://picsum.photos/seed/gallery11/800/600',
            'gallery_12.jpg' => 'https://picsum.photos/seed/gallery12/800/600',
        ];

        foreach ($announcementImages as $filename => $url) {
            $filepath = $announcementDir . '/' . $filename;
            if (!file_exists($filepath)) {
                $this->command->info("  Downloading {$filename}...");
                $ctx = stream_context_create(['http' => ['follow_location' => true, 'timeout' => 30], 'ssl' => ['verify_peer' => false, 'verify_peer_name' => false]]);
                $data = @file_get_contents($url, false, $ctx);
                if ($data) {
                    file_put_contents($filepath, $data);
                } else {
                    // Create a colored placeholder image if download fails
                    $this->createPlaceholderImage($filepath, 1200, 600, $filename);
                }
            }
        }

        // Download job posting images
        $jobImages = [
            'tech_company.jpg' => 'https://picsum.photos/seed/techcompany/1200/600',
            'finance_firm.jpg' => 'https://picsum.photos/seed/financefirm/1200/600',
            'engineering_corp.jpg' => 'https://picsum.photos/seed/engineering/1200/600',
            'healthcare_org.jpg' => 'https://picsum.photos/seed/healthcare/1200/600',
            'education_inst.jpg' => 'https://picsum.photos/seed/education/1200/600',
            'startup_office.jpg' => 'https://picsum.photos/seed/startup/1200/600',
            'government_agency.jpg' => 'https://picsum.photos/seed/government/1200/600',
            'creative_agency.jpg' => 'https://picsum.photos/seed/creative/1200/600',
            'manufacturing.jpg' => 'https://picsum.photos/seed/manufacturing/1200/600',
            'consulting.jpg' => 'https://picsum.photos/seed/consulting/1200/600',
            'logo_accenture.jpg' => 'https://picsum.photos/seed/accenture/200/200',
            'logo_globe.jpg' => 'https://picsum.photos/seed/globetel/200/200',
            'logo_bdo.jpg' => 'https://picsum.photos/seed/bdouni/200/200',
            'logo_sm.jpg' => 'https://picsum.photos/seed/smprime/200/200',
            'logo_ayala.jpg' => 'https://picsum.photos/seed/ayaland/200/200',
            'logo_pldt.jpg' => 'https://picsum.photos/seed/pldtinc/200/200',
            'logo_jollibee.jpg' => 'https://picsum.photos/seed/jollibee/200/200',
            'logo_deped.jpg' => 'https://picsum.photos/seed/depedph/200/200',
            'logo_doh.jpg' => 'https://picsum.photos/seed/dohphl/200/200',
            'logo_meralco.jpg' => 'https://picsum.photos/seed/meralco/200/200',
        ];

        foreach ($jobImages as $filename => $url) {
            $filepath = $jobDir . '/' . $filename;
            if (!file_exists($filepath)) {
                $this->command->info("  Downloading {$filename}...");
                $ctx = stream_context_create(['http' => ['follow_location' => true, 'timeout' => 30], 'ssl' => ['verify_peer' => false, 'verify_peer_name' => false]]);
                $data = @file_get_contents($url, false, $ctx);
                if ($data) {
                    file_put_contents($filepath, $data);
                } else {
                    $size = str_contains($filename, 'logo_') ? 200 : 1200;
                    $height = str_contains($filename, 'logo_') ? 200 : 600;
                    $this->createPlaceholderImage($filepath, $size, $height, $filename);
                }
            }
        }
    }

    private function createPlaceholderImage(string $filepath, int $w, int $h, string $text): void
    {
        $img = imagecreatetruecolor($w, $h);
        $colors = [
            [124, 37, 41],   // maroon
            [40, 80, 120],   // blue
            [60, 120, 60],   // green
            [140, 100, 40],  // gold
            [80, 40, 100],   // purple
        ];
        $c = $colors[crc32($text) % count($colors)];
        $bg = imagecolorallocate($img, $c[0], $c[1], $c[2]);
        imagefill($img, 0, 0, $bg);
        $white = imagecolorallocate($img, 255, 255, 255);
        $label = pathinfo($text, PATHINFO_FILENAME);
        imagestring($img, 5, (int)(($w - strlen($label) * 9) / 2), (int)($h / 2 - 8), $label, $white);
        imagejpeg($img, $filepath, 90);
        imagedestroy($img);
    }

    private function seedAnnouncements(): void
    {
        $now = now();
        $adminId = DB::table('users')->where('role_id', 1)->value('id')
            ?? DB::table('users')->where('role_id', 2)->value('id')
            ?? 1;

        $announcements = [
            // 1. Multi-page Graduation Ceremony announcement with gallery
            [
                'campus_id' => null,
                'is_multi_campus' => true,
                'title' => 'EARIST 79th Commencement Exercises — Class of 2026',
                'content' => '<p>The Eulogio "Amang" Rodriguez Institute of Science and Technology proudly announces its 79th Commencement Exercises for the graduating class of 2026.</p><p>All graduating students, parents, and alumni are cordially invited to witness this momentous occasion.</p>',
                'use_pages' => true,
                'pages' => json_encode([
                    [
                        'title' => 'Ceremony Details',
                        'content' => '<h2>79th Commencement Exercises</h2><p>The graduation ceremony will be held at the <strong>EARIST Main Campus Gymnasium</strong> on <strong>March 28, 2026</strong> at 8:00 AM.</p><h3>Schedule of Activities</h3><ul><li><strong>7:00 AM</strong> — Assembly and Registration</li><li><strong>8:00 AM</strong> — Academic Procession</li><li><strong>8:30 AM</strong> — Opening Ceremonies and National Anthem</li><li><strong>9:00 AM</strong> — Conferring of Degrees</li><li><strong>10:30 AM</strong> — Keynote Address by Guest Speaker</li><li><strong>11:00 AM</strong> — Recognition of Honor Graduates</li><li><strong>11:30 AM</strong> — Closing Remarks and Recessional</li></ul><p>The ceremony will be presided over by <strong>Dr. Maria Santos</strong>, University President.</p>',
                    ],
                    [
                        'title' => 'Guidelines & Reminders',
                        'content' => '<h2>Guidelines for Graduates</h2><h3>Dress Code</h3><p>All graduates must wear the official <strong>academic regalia</strong> (toga and mortarboard). Colored tassels will be distributed according to your college.</p><h3>Ticket Distribution</h3><ul><li>Each graduate is entitled to <strong>4 guest tickets</strong></li><li>Tickets will be available at the Registrar\'s Office starting <strong>March 15, 2026</strong></li><li>Present your clearance certificate and valid ID upon claiming</li></ul><h3>Prohibited Items</h3><p>No balloons, confetti, ribbons, or party poppers inside the venue. Proper decorum is expected at all times.</p><h3>Parking</h3><p>Limited parking is available. Graduates and guests are encouraged to use public transportation or carpooling. Overflow parking is available at the adjacent SM Manila lot.</p>',
                    ],
                    [
                        'title' => 'Post-Graduation Activities',
                        'content' => '<h2>Post-Graduation Events</h2><h3>Alumni Registration</h3><p>All graduates are encouraged to register with the <strong>EARIST Alumni Association</strong> immediately after the ceremony. Registration booths will be set up at the gymnasium lobby.</p><h3>Photo Opportunities</h3><p>Professional photographers will be stationed at designated photo areas around the campus. Group photos per college/department will be taken at the <strong>Freedom Park</strong> area from 12:00 PM to 2:00 PM.</p><h3>Alumni Homecoming Dinner</h3><p>A special dinner will be held at <strong>Manila Hotel</strong> on <strong>March 29, 2026</strong> at 6:00 PM. Class of 2026 graduates get a 50% discount. Reserve your slot through the Alumni Office.</p><h3>Career Fair</h3><p>Join our exclusive post-graduation career fair on <strong>April 2, 2026</strong> at the EARIST Multi-Purpose Hall. Over 30 partner companies will be present with job opportunities.</p>',
                    ],
                ]),
                'featured_image' => 'announcements/graduation_ceremony.jpg',
                'gallery_images' => json_encode([
                    'announcements/gallery_1.jpg',
                    'announcements/gallery_2.jpg',
                    'announcements/gallery_3.jpg',
                    'announcements/gallery_4.jpg',
                ]),
                'type' => 'general',
                'priority' => 'urgent',
                'created_by' => $adminId,
                'published_at' => $now->copy()->subDays(2),
                'expires_at' => $now->copy()->addMonths(2),
                'status' => 'published',
                'is_published' => true,
                'show_on_landing' => true,
                'target_type' => 'all',
                'created_at' => $now->copy()->subDays(3),
                'updated_at' => $now->copy()->subDays(2),
            ],

            // 2. Multi-page Alumni Homecoming with gallery
            [
                'campus_id' => 1,
                'is_multi_campus' => false,
                'title' => 'Grand Alumni Homecoming 2026 — "Coming Home to EARIST"',
                'content' => '<p>Calling all EARIST alumni! Join us for the biggest reunion event of the decade. Reconnect with batchmates, celebrate achievements, and create new memories.</p>',
                'use_pages' => true,
                'pages' => json_encode([
                    [
                        'title' => 'Event Overview',
                        'content' => '<h2>Grand Alumni Homecoming 2026</h2><p>Theme: <strong>"Coming Home to EARIST — Where Legends Begin"</strong></p><p>After years of building careers and making an impact in various industries, it\'s time to come back to where it all started. This homecoming celebrates the enduring bond of the EARIST community.</p><h3>Event Date</h3><p><strong>April 19, 2026 (Saturday)</strong><br/>8:00 AM — 10:00 PM</p><h3>Venue</h3><p>EARIST Main Campus, Nagtahan, Sampaloc, Manila</p><h3>Theme Colors</h3><p>Maroon and Gold — wear your EARIST pride!</p><h3>Registration Fee</h3><table><tr><th>Category</th><th>Price</th></tr><tr><td>Alumni (Individual)</td><td>₱500</td></tr><tr><td>Alumni with Family</td><td>₱800</td></tr><tr><td>Silver Jubilarian (25 yrs)</td><td>₱300</td></tr><tr><td>Golden Jubilarian (50 yrs)</td><td>FREE</td></tr></table>',
                    ],
                    [
                        'title' => 'Program Schedule',
                        'content' => '<h2>Full Day Program</h2><h3>Morning Activities (8:00 AM - 12:00 PM)</h3><ul><li><strong>8:00 AM</strong> — Registration and Welcome Coffee</li><li><strong>9:00 AM</strong> — Opening Ceremony and Flag Raising</li><li><strong>9:30 AM</strong> — University President\'s Address</li><li><strong>10:00 AM</strong> — Recognition of Outstanding Alumni Awardees</li><li><strong>11:00 AM</strong> — Campus Tour (see the new facilities!)</li></ul><h3>Afternoon Activities (1:00 PM - 5:00 PM)</h3><ul><li><strong>1:00 PM</strong> — Batch Reunions per Department</li><li><strong>2:00 PM</strong> — Sports Fest (Basketball, Volleyball, Badminton)</li><li><strong>3:00 PM</strong> — Career Mentorship Sessions</li><li><strong>4:00 PM</strong> — Cultural Presentations</li></ul><h3>Evening Gala (6:00 PM - 10:00 PM)</h3><ul><li><strong>6:00 PM</strong> — Cocktails and Networking</li><li><strong>7:00 PM</strong> — Gala Dinner</li><li><strong>8:00 PM</strong> — Alumni Band Performance</li><li><strong>9:00 PM</strong> — Raffle Draw (Grand Prize: Trip for 2 to Boracay)</li></ul>',
                    ],
                    [
                        'title' => 'How to Register',
                        'content' => '<h2>Registration Methods</h2><h3>Online Registration</h3><p>Register through the EARIST Alumni Tracer System at <strong>akndev.tech</strong>. Log in with your alumni account and navigate to Events.</p><h3>Walk-in Registration</h3><p>Visit the Alumni Affairs Office at the 2nd Floor, Admin Building, EARIST Main Campus. Office hours: Monday to Friday, 8:00 AM to 5:00 PM.</p><h3>Payment Methods</h3><ul><li><strong>GCash:</strong> 0917-XXX-XXXX (EARIST Alumni Fund)</li><li><strong>Bank Transfer:</strong> BDO Account No. XXXX-XXXX-XXXX</li><li><strong>Cash:</strong> At the Alumni Affairs Office</li></ul><h3>Batch Coordinators</h3><p>Connect with your batch coordinator to join the group registration. Batch discounts are available for groups of 10 or more.</p><p>For inquiries, contact the Alumni Office at <strong>(02) 8715-4468</strong> or email <strong>alumni@earist.edu.ph</strong></p>',
                    ],
                ]),
                'featured_image' => 'announcements/alumni_homecoming.jpg',
                'gallery_images' => json_encode([
                    'announcements/gallery_5.jpg',
                    'announcements/gallery_6.jpg',
                    'announcements/gallery_7.jpg',
                ]),
                'type' => 'general',
                'priority' => 'high',
                'created_by' => $adminId,
                'published_at' => $now->copy()->subDays(5),
                'expires_at' => $now->copy()->addMonths(3),
                'status' => 'published',
                'is_published' => true,
                'show_on_landing' => true,
                'target_type' => 'all',
                'created_at' => $now->copy()->subDays(6),
                'updated_at' => $now->copy()->subDays(5),
            ],

            // 3. Career Fair (single page, with gallery)
            [
                'campus_id' => null,
                'is_multi_campus' => true,
                'title' => 'EARIST Career Fair 2026 — Your Future Starts Here!',
                'content' => '<p>The EARIST Office of Career Development and Placement is organizing the <strong>Annual Career Fair 2026</strong> on <strong>April 2-3, 2026</strong> at the EARIST Multi-Purpose Hall.</p><p>Over <strong>40 partner companies</strong> from various industries will be present, offering job opportunities for fresh graduates and experienced alumni alike.</p><h3>Participating Companies Include:</h3><ul><li>Accenture Philippines</li><li>Globe Telecom</li><li>BDO Unibank</li><li>SM Investments</li><li>Ayala Corporation</li><li>PLDT Inc.</li><li>Department of Education (DepEd)</li><li>Department of Health (DOH)</li><li>And many more!</li></ul><h3>What to Bring:</h3><ul><li>Multiple copies of your updated resume</li><li>Valid government ID</li><li>TOR / Diploma (if available)</li><li>Portfolio (for creative and tech roles)</li></ul><h3>Pre-Registration:</h3><p>Pre-register through the EARIST Alumni Tracer portal to skip the walk-in line. You\'ll receive a QR code for express entry. Walk-ins are welcome but pre-registered attendees get priority interviews.</p>',
                'use_pages' => false,
                'pages' => null,
                'featured_image' => 'announcements/career_fair.jpg',
                'gallery_images' => json_encode([
                    'announcements/gallery_8.jpg',
                    'announcements/gallery_9.jpg',
                ]),
                'type' => 'general',
                'priority' => 'high',
                'created_by' => $adminId,
                'published_at' => $now->copy()->subDays(1),
                'expires_at' => $now->copy()->addMonths(2),
                'status' => 'published',
                'is_published' => true,
                'show_on_landing' => true,
                'target_type' => 'all',
                'created_at' => $now->copy()->subDays(2),
                'updated_at' => $now->copy()->subDays(1),
            ],

            // 4. Scholarship announcement (multi-page)
            [
                'campus_id' => null,
                'is_multi_campus' => true,
                'title' => 'EARIST Alumni Scholarship Fund — Applications Now Open',
                'content' => '<p>The EARIST Alumni Association is pleased to announce the opening of applications for the <strong>Alumni Scholarship Fund</strong> for Academic Year 2026-2027.</p><p>This scholarship aims to support deserving EARIST students and children of alumni who demonstrate academic excellence and financial need.</p>',
                'use_pages' => true,
                'pages' => json_encode([
                    [
                        'title' => 'Scholarship Details',
                        'content' => '<h2>About the Scholarship</h2><p>The EARIST Alumni Scholarship Fund was established in 2010 with the vision of giving back to the institution that shaped our careers. To date, the fund has supported over <strong>500 scholars</strong> across all campuses.</p><h3>Scholarship Types</h3><table><tr><th>Type</th><th>Coverage</th><th>Slots</th></tr><tr><td>Full Scholarship</td><td>100% tuition + ₱5,000/month stipend</td><td>10</td></tr><tr><td>Partial Scholarship</td><td>50% tuition</td><td>25</td></tr><tr><td>Book Allowance</td><td>₱3,000/semester</td><td>50</td></tr></table><h3>Eligibility</h3><ul><li>Currently enrolled at EARIST (any campus)</li><li>Maintaining a GWA of 1.75 or better</li><li>No failing grades in the previous semester</li><li>Children of EARIST alumni are given priority</li></ul>',
                    ],
                    [
                        'title' => 'How to Apply',
                        'content' => '<h2>Application Process</h2><h3>Requirements</h3><ol><li>Completed application form (downloadable from the Alumni Office website)</li><li>Certified True Copy of grades from the previous 2 semesters</li><li>Certificate of enrollment for current semester</li><li>Proof of family income (ITR or Certificate of Indigency)</li><li>1x1 and 2x2 ID photos</li><li>Personal essay: "How EARIST is Shaping My Future" (500 words)</li></ol><h3>Submission Deadline</h3><p><strong>May 15, 2026</strong> — No late submissions will be accepted.</p><h3>Where to Submit</h3><p>Alumni Affairs Office, 2nd Floor Admin Building, EARIST Main Campus<br/>Or email to: <strong>scholarship@earist-alumni.org</strong></p><h3>Selection Process</h3><p>Applications undergo a 3-stage evaluation: document screening, academic review, and interview by the Alumni Scholarship Committee. Results will be announced by <strong>June 15, 2026</strong>.</p>',
                    ],
                ]),
                'featured_image' => 'announcements/scholarship_program.jpg',
                'gallery_images' => null,
                'type' => 'general',
                'priority' => 'normal',
                'created_by' => $adminId,
                'published_at' => $now->copy()->subDays(7),
                'expires_at' => $now->copy()->addMonths(4),
                'status' => 'published',
                'is_published' => true,
                'show_on_landing' => true,
                'target_type' => 'all',
                'created_at' => $now->copy()->subDays(8),
                'updated_at' => $now->copy()->subDays(7),
            ],

            // 5. Tech workshop (single page)
            [
                'campus_id' => 1,
                'is_multi_campus' => false,
                'title' => 'Free Web Development Workshop for Alumni — React & Laravel',
                'content' => '<p>Upskill yourself! The EARIST College of Computer Studies Alumni Chapter is hosting a <strong>3-day intensive Web Development Workshop</strong> covering modern full-stack technologies.</p><h3>Workshop Details</h3><ul><li><strong>Dates:</strong> March 14-16, 2026 (Friday to Sunday)</li><li><strong>Time:</strong> 9:00 AM — 5:00 PM daily</li><li><strong>Venue:</strong> CCS Computer Lab, 3rd Floor, EARIST Main Campus</li><li><strong>Instructor:</strong> Engr. Juan dela Cruz, Senior Developer at Accenture PH</li></ul><h3>Topics Covered</h3><ol><li>Day 1: React.js Fundamentals — Components, Hooks, State Management</li><li>Day 2: Laravel Backend — API Development, Authentication, Database Design</li><li>Day 3: Full-Stack Integration — Connecting React + Laravel, Deployment</li></ol><h3>Requirements</h3><ul><li>Bring your own laptop</li><li>Basic knowledge of HTML/CSS/JavaScript</li><li>Pre-install: VS Code, Node.js, PHP 8.2+, Composer</li></ul><p>This workshop is <strong>FREE</strong> for all EARIST alumni. Limited to 30 participants only. Register now through the Alumni Tracer System!</p>',
                'use_pages' => false,
                'pages' => null,
                'featured_image' => 'announcements/tech_workshop.jpg',
                'gallery_images' => json_encode([
                    'announcements/gallery_10.jpg',
                    'announcements/gallery_11.jpg',
                ]),
                'type' => 'department',
                'priority' => 'normal',
                'created_by' => $adminId,
                'published_at' => $now->copy()->subDays(3),
                'expires_at' => $now->copy()->addMonths(1),
                'status' => 'published',
                'is_published' => true,
                'show_on_landing' => false,
                'target_type' => 'all',
                'created_at' => $now->copy()->subDays(4),
                'updated_at' => $now->copy()->subDays(3),
            ],

            // 6. Community outreach (single page)
            [
                'campus_id' => null,
                'is_multi_campus' => true,
                'title' => 'EARIST Alumni Community Outreach — Bagong Silang, Caloocan',
                'content' => '<p>Give back to the community! The EARIST Alumni Association is organizing a <strong>Community Outreach Program</strong> in Bagong Silang, Caloocan City.</p><h3>Activities</h3><ul><li>Free medical and dental mission</li><li>School supplies distribution for 200 children</li><li>Career orientation for out-of-school youth</li><li>Free haircut and grooming services</li><li>Feeding program</li></ul><h3>Date & Time</h3><p><strong>March 22, 2026 (Saturday)</strong>, 6:00 AM — 4:00 PM</p><h3>Assembly Point</h3><p>EARIST Main Gate, 6:00 AM sharp. Bus transportation will be provided.</p><h3>How to Volunteer</h3><p>Sign up through the Alumni Tracer System or contact the Alumni Office. We need volunteers for: registration, medical assistance, logistics, photography, and traffic management.</p><p>Donations of school supplies, clothing, and canned goods are also welcome. Drop-off point: Alumni Office, EARIST Main Campus. Deadline: March 20, 2026.</p>',
                'use_pages' => false,
                'pages' => null,
                'featured_image' => 'announcements/community_outreach.jpg',
                'gallery_images' => json_encode([
                    'announcements/gallery_12.jpg',
                ]),
                'type' => 'general',
                'priority' => 'normal',
                'created_by' => $adminId,
                'published_at' => $now->copy()->subDays(4),
                'expires_at' => $now->copy()->addMonths(2),
                'status' => 'published',
                'is_published' => true,
                'show_on_landing' => true,
                'target_type' => 'all',
                'created_at' => $now->copy()->subDays(5),
                'updated_at' => $now->copy()->subDays(4),
            ],

            // 7. Sports fest
            [
                'campus_id' => null,
                'is_multi_campus' => true,
                'title' => 'EARIST Alumni Sports Festival 2026',
                'content' => '<p>Get your game on! The Annual Alumni Sports Festival is back. Battle it out with fellow alumni in basketball, volleyball, badminton, table tennis, and chess.</p><h3>Event Details</h3><ul><li><strong>Date:</strong> April 12-13, 2026 (Saturday-Sunday)</li><li><strong>Venue:</strong> EARIST Gymnasium and Sports Complex</li><li><strong>Registration Fee:</strong> ₱200 per person (includes event shirt)</li></ul><h3>Sports Categories</h3><table><tr><th>Sport</th><th>Format</th><th>Max Teams</th></tr><tr><td>Basketball</td><td>5v5</td><td>16 teams</td></tr><tr><td>Volleyball</td><td>6v6</td><td>12 teams</td></tr><tr><td>Badminton</td><td>Singles & Doubles</td><td>32 players</td></tr><tr><td>Table Tennis</td><td>Singles</td><td>24 players</td></tr><tr><td>Chess</td><td>Rapid Format</td><td>32 players</td></tr></table><p>Form your team by batch year or department! Cash prizes and trophies await the champions. Register by batch at the Alumni Office.</p>',
                'use_pages' => false,
                'pages' => null,
                'featured_image' => 'announcements/sports_fest.jpg',
                'gallery_images' => null,
                'type' => 'general',
                'priority' => 'normal',
                'created_by' => $adminId,
                'published_at' => $now->copy()->subDays(10),
                'expires_at' => $now->copy()->addMonths(2),
                'status' => 'published',
                'is_published' => true,
                'show_on_landing' => false,
                'target_type' => 'all',
                'created_at' => $now->copy()->subDays(11),
                'updated_at' => $now->copy()->subDays(10),
            ],

            // 8. Research symposium (multi-page)
            [
                'campus_id' => 2,
                'is_multi_campus' => false,
                'title' => 'EARIST Cavite Research Symposium 2026 — Call for Papers',
                'content' => '<p>The EARIST Cavite Campus Research and Development Office invites alumni researchers and professionals to submit papers for the <strong>Annual Research Symposium 2026</strong>.</p>',
                'use_pages' => true,
                'pages' => json_encode([
                    [
                        'title' => 'Symposium Details',
                        'content' => '<h2>Annual Research Symposium 2026</h2><p>Theme: <strong>"Innovation and Sustainability: Research for National Development"</strong></p><h3>Important Dates</h3><ul><li><strong>Abstract Submission Deadline:</strong> March 31, 2026</li><li><strong>Notification of Acceptance:</strong> April 15, 2026</li><li><strong>Full Paper Submission:</strong> May 15, 2026</li><li><strong>Symposium Date:</strong> June 5-6, 2026</li></ul><h3>Research Tracks</h3><ol><li>Computing and Information Technology</li><li>Engineering and Manufacturing</li><li>Business and Entrepreneurship</li><li>Education and Social Sciences</li><li>Environmental Science and Sustainability</li></ol>',
                    ],
                    [
                        'title' => 'Submission Guidelines',
                        'content' => '<h2>Paper Submission Guidelines</h2><h3>Abstract Format</h3><ul><li>Maximum 300 words</li><li>Include: Title, Author(s), Affiliation, Keywords (3-5)</li><li>Submit as PDF or DOCX</li></ul><h3>Full Paper Format</h3><ul><li>IEEE format, 6-10 pages</li><li>Font: Times New Roman, 10pt</li><li>Must include: Abstract, Introduction, Methodology, Results, Discussion, Conclusion, References</li></ul><h3>Submission Portal</h3><p>Submit via email to <strong>research@earist-cavite.edu.ph</strong></p><h3>Registration Fees</h3><table><tr><th>Category</th><th>Early Bird (by April 30)</th><th>Regular</th></tr><tr><td>Alumni Presenter</td><td>₱1,500</td><td>₱2,000</td></tr><tr><td>Student Presenter</td><td>₱500</td><td>₱800</td></tr><tr><td>Attendee</td><td>₱300</td><td>₱500</td></tr></table><p>Accepted papers will be published in the <strong>EARIST Research Journal</strong> (ISSN pending).</p>',
                    ],
                ]),
                'featured_image' => 'announcements/research_symposium.jpg',
                'gallery_images' => null,
                'type' => 'general',
                'priority' => 'normal',
                'created_by' => $adminId,
                'published_at' => $now->copy()->subDays(14),
                'expires_at' => $now->copy()->addMonths(5),
                'status' => 'published',
                'is_published' => true,
                'show_on_landing' => false,
                'target_type' => 'all',
                'created_at' => $now->copy()->subDays(15),
                'updated_at' => $now->copy()->subDays(14),
            ],
        ];

        foreach ($announcements as $announcement) {
            DB::table('announcements')->insert($announcement);
        }
    }

    private function seedJobCategories(): void
    {
        $categories = [
            ['name' => 'Information Technology', 'slug' => 'information-technology', 'description' => 'Software, IT, and Computer Science roles', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Engineering', 'slug' => 'engineering', 'description' => 'Civil, Mechanical, Electrical, and Industrial Engineering', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Education', 'slug' => 'education', 'description' => 'Teaching, Training, and Academic positions', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Business & Finance', 'slug' => 'business-finance', 'description' => 'Accounting, Banking, and Business Management', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Healthcare', 'slug' => 'healthcare', 'description' => 'Medical, Nursing, and Health Science roles', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Government', 'slug' => 'government', 'description' => 'Public sector and civil service positions', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Creative & Media', 'slug' => 'creative-media', 'description' => 'Design, Multimedia, and Communications', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Manufacturing', 'slug' => 'manufacturing', 'description' => 'Production, Quality, and Operations', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ];

        foreach ($categories as $cat) {
            DB::table('job_categories')->updateOrInsert(['slug' => $cat['slug']], $cat);
        }
    }

    private function seedJobPostings(): void
    {
        $now = now();
        $adminId = DB::table('users')->where('role_id', 1)->value('id')
            ?? DB::table('users')->where('role_id', 2)->value('id')
            ?? 1;

        // Get category IDs
        $categories = DB::table('job_categories')->pluck('id', 'slug')->toArray();

        $jobs = [
            // 1. Multi-page IT job with company logo and poster
            [
                'campus_id' => null,
                'is_multi_campus' => true,
                'title' => 'Junior Software Developer',
                'slug' => 'junior-software-developer-accenture-2026',
                'company_name' => 'Accenture Philippines',
                'company_logo' => 'jobs/logo_accenture.jpg',
                'poster_image' => 'jobs/tech_company.jpg',
                'background_image' => null,
                'description' => '<p>Accenture Philippines is hiring Junior Software Developers! Join a global leader in consulting and technology services. We\'re looking for fresh graduates and early-career professionals passionate about building innovative solutions.</p>',
                'category_id' => $categories['information-technology'] ?? null,
                'job_type' => 'full_time',
                'experience_level' => 'entry',
                'location' => 'BGC, Taguig City',
                'is_remote' => false,
                'work_arrangement' => 'hybrid',
                'contact_person' => 'HR Recruitment Team',
                'contact_email' => 'careers.ph@accenture.com',
                'contact_phone' => '(02) 8582-7000',
                'application_url' => 'https://www.accenture.com/ph-en/careers',
                'application_instructions' => 'Apply online through our careers portal. Upload your resume, transcript of records, and a brief cover letter.',
                'salary_min' => 25000.00,
                'salary_max' => 35000.00,
                'salary_currency' => 'PHP',
                'salary_range' => '₱25,000 - ₱35,000',
                'salary_period' => 'monthly',
                'is_salary_visible' => true,
                'benefits' => "Health Insurance (HMO)\nLife Insurance\nPaid Leaves (15 VL + 15 SL)\nPerformance Bonus\nTraining & Certifications\nHybrid Work Setup\nFree Shuttle Service",
                'requirements' => "Bachelor's degree in Computer Science, IT, or related field\n0-2 years of experience\nKnowledge of at least one programming language (Java, Python, JavaScript, C#)\nBasic understanding of databases and SQL\nGood communication skills in English",
                'qualifications' => "Fresh graduates are welcome to apply\nEARIST alumni preferred\nWith or without board exam certification\nWilling to work in BGC, Taguig",
                'skills_required' => null,
                'external_url' => null,
                'use_pages' => true,
                'pages' => json_encode([
                    [
                        'title' => 'Role Overview',
                        'content' => '<h2>About the Role</h2><p>As a Junior Software Developer at Accenture, you will be part of a dynamic team delivering cutting-edge technology solutions to global clients. You\'ll work on real-world projects across industries including banking, telecommunications, and retail.</p><h3>Key Responsibilities</h3><ul><li>Develop and maintain software applications using modern frameworks</li><li>Participate in Agile/Scrum development processes</li><li>Write clean, testable, and well-documented code</li><li>Collaborate with cross-functional teams including designers and QA engineers</li><li>Participate in code reviews and contribute to team knowledge sharing</li><li>Debug and resolve software defects</li></ul><h3>Tech Stack</h3><p>Depending on the project, you may work with:</p><ul><li><strong>Frontend:</strong> React, Angular, Vue.js</li><li><strong>Backend:</strong> Java (Spring Boot), Node.js, .NET Core</li><li><strong>Database:</strong> MySQL, PostgreSQL, MongoDB</li><li><strong>Cloud:</strong> AWS, Azure, Google Cloud</li><li><strong>Tools:</strong> Git, Jenkins, Docker, Jira</li></ul>',
                    ],
                    [
                        'title' => 'Benefits & Growth',
                        'content' => '<h2>Why Join Accenture?</h2><h3>Comprehensive Benefits Package</h3><ul><li><strong>Health & Wellness:</strong> HMO coverage for you and 2 dependents, dental and optical benefits</li><li><strong>Financial:</strong> Competitive salary, 13th month pay, performance bonus (up to 2 months), stock purchase plan</li><li><strong>Leave Benefits:</strong> 15 vacation leaves, 15 sick leaves, birthday leave</li><li><strong>Professional Development:</strong> Access to Accenture\'s learning platform with 30,000+ online courses, certification sponsorship, conference attendance</li></ul><h3>Career Growth Path</h3><table><tr><th>Level</th><th>Title</th><th>Timeline</th></tr><tr><td>12</td><td>Associate Software Engineer</td><td>Entry</td></tr><tr><td>11</td><td>Software Engineer</td><td>1-2 years</td></tr><tr><td>10</td><td>Senior Software Engineer</td><td>3-4 years</td></tr><tr><td>9</td><td>Team Lead / Specialist</td><td>5-6 years</td></tr><tr><td>8</td><td>Manager</td><td>7+ years</td></tr></table><p>Accenture promotes from within. Your growth is limited only by your ambition!</p>',
                    ],
                    [
                        'title' => 'How to Apply',
                        'content' => '<h2>Application Process</h2><h3>Steps</h3><ol><li><strong>Online Application:</strong> Submit your resume through our careers portal or through the EARIST Alumni Tracer</li><li><strong>Initial Screening:</strong> HR review of your qualifications (1-2 business days)</li><li><strong>Technical Assessment:</strong> Online coding test covering algorithms and problem-solving (60 minutes)</li><li><strong>Technical Interview:</strong> 1-on-1 with a senior developer discussing your projects and technical knowledge</li><li><strong>HR Interview:</strong> Behavioral and situational questions</li><li><strong>Job Offer:</strong> If successful, expect an offer within 5 business days</li></ol><h3>Tips for EARIST Graduates</h3><ul><li>Highlight your capstone/thesis project</li><li>Mention relevant certifications (Oracle, AWS, etc.)</li><li>Practice coding challenges on LeetCode or HackerRank</li><li>Prepare a GitHub portfolio showcasing your personal projects</li></ul><p><strong>Application Deadline: March 30, 2026</strong></p>',
                    ],
                ]),
                'show_on_landing' => true,
                'application_deadline' => '2026-03-30',
                'start_date' => '2026-05-01',
                'status' => 'published',
                'is_featured' => true,
                'featured_until' => '2026-03-30',
                'views' => 245,
                'views_count' => 245,
                'created_by' => $adminId,
                'published_at' => $now->copy()->subDays(5),
                'created_at' => $now->copy()->subDays(6),
                'updated_at' => $now->copy()->subDays(5),
            ],

            // 2. Finance job
            [
                'campus_id' => null,
                'is_multi_campus' => true,
                'title' => 'Bank Teller / Customer Service Associate',
                'slug' => 'bank-teller-bdo-2026',
                'company_name' => 'BDO Unibank, Inc.',
                'company_logo' => 'jobs/logo_bdo.jpg',
                'poster_image' => 'jobs/finance_firm.jpg',
                'background_image' => null,
                'description' => '<p>BDO Unibank is looking for Bank Tellers and Customer Service Associates for multiple branches in Metro Manila. We welcome fresh graduates with strong interpersonal skills and numerical aptitude.</p><h3>Responsibilities</h3><ul><li>Process customer deposits, withdrawals, and fund transfers</li><li>Provide excellent customer service at the bank counter</li><li>Verify documents and maintain accurate transaction records</li><li>Cross-sell bank products (savings accounts, credit cards, loans)</li><li>Comply with BDO policies and BSP regulations</li></ul>',
                'category_id' => $categories['business-finance'] ?? null,
                'job_type' => 'full_time',
                'experience_level' => 'entry',
                'location' => 'Multiple Branches, Metro Manila',
                'is_remote' => false,
                'work_arrangement' => 'onsite',
                'contact_person' => 'BDO Talent Acquisition',
                'contact_email' => 'recruitment@bdo.com.ph',
                'contact_phone' => '(02) 8840-7000',
                'application_url' => 'https://www.bdo.com.ph/careers',
                'application_instructions' => null,
                'salary_min' => 18000.00,
                'salary_max' => 22000.00,
                'salary_currency' => 'PHP',
                'salary_range' => '₱18,000 - ₱22,000',
                'salary_period' => 'monthly',
                'is_salary_visible' => true,
                'benefits' => "HMO\n13th Month Pay\nPerformance Bonus\nRetirement Plan\nEmployee Banking Privileges",
                'requirements' => "Bachelor's degree in Business, Accounting, Finance, or related field\nFresh graduates welcome\nGood numerical and analytical skills\nExcellent customer service orientation\nWilling to be assigned to any branch in Metro Manila",
                'qualifications' => null,
                'skills_required' => null,
                'external_url' => null,
                'use_pages' => false,
                'pages' => null,
                'show_on_landing' => true,
                'application_deadline' => '2026-04-15',
                'start_date' => '2026-05-15',
                'status' => 'published',
                'is_featured' => false,
                'featured_until' => null,
                'views' => 189,
                'views_count' => 189,
                'created_by' => $adminId,
                'published_at' => $now->copy()->subDays(3),
                'created_at' => $now->copy()->subDays(4),
                'updated_at' => $now->copy()->subDays(3),
            ],

            // 3. Telecom engineering job (multi-page)
            [
                'campus_id' => null,
                'is_multi_campus' => true,
                'title' => 'Network Engineer — 5G Infrastructure',
                'slug' => 'network-engineer-globe-telecom-2026',
                'company_name' => 'Globe Telecom, Inc.',
                'company_logo' => 'jobs/logo_globe.jpg',
                'poster_image' => 'jobs/engineering_corp.jpg',
                'background_image' => null,
                'description' => '<p>Globe Telecom is expanding its 5G network across the Philippines and is hiring Network Engineers to support the nationwide rollout. This is an exciting opportunity to be at the forefront of telecommunications technology.</p>',
                'category_id' => $categories['engineering'] ?? null,
                'job_type' => 'full_time',
                'experience_level' => 'mid',
                'location' => 'The Globe Tower, BGC, Taguig City',
                'is_remote' => false,
                'work_arrangement' => 'hybrid',
                'contact_person' => 'Globe Engineering HR',
                'contact_email' => 'techcareers@globe.com.ph',
                'contact_phone' => '(02) 7730-2000',
                'application_url' => 'https://www.globe.com.ph/about-us/careers.html',
                'application_instructions' => null,
                'salary_min' => 40000.00,
                'salary_max' => 60000.00,
                'salary_currency' => 'PHP',
                'salary_range' => '₱40,000 - ₱60,000',
                'salary_period' => 'monthly',
                'is_salary_visible' => true,
                'benefits' => "HMO for employee + 3 dependents\nLife Insurance\nRice Subsidy\n15 VL + 15 SL\nTelecommunications Allowance\nPerformance Bonus\nStock Options",
                'requirements' => "BS in Electronics Engineering, Computer Engineering, or related field\n2-4 years experience in network engineering or telecommunications\nKnowledge of IP networking, RF systems, and fiber optics\nCCNA/CCNP certification preferred\nWilling to do occasional fieldwork",
                'qualifications' => null,
                'skills_required' => null,
                'external_url' => null,
                'use_pages' => true,
                'pages' => json_encode([
                    [
                        'title' => 'Role Details',
                        'content' => '<h2>Network Engineer — 5G Infrastructure</h2><h3>About Globe Telecom</h3><p>Globe Telecom is a leading digital solutions platform in the Philippines, serving over 80 million customers. We are at the forefront of the country\'s digital transformation, driving innovations in 5G, fiber broadband, and digital services.</p><h3>Key Responsibilities</h3><ul><li>Plan, design, and optimize 5G network infrastructure</li><li>Conduct site surveys and RF planning for cell tower deployment</li><li>Monitor network performance and troubleshoot issues</li><li>Collaborate with vendors (Huawei, Ericsson, Nokia) for equipment deployment</li><li>Prepare technical documentation and network topology diagrams</li><li>Ensure compliance with NTC regulations</li></ul>',
                    ],
                    [
                        'title' => 'Requirements & Benefits',
                        'content' => '<h2>What We\'re Looking For</h2><h3>Technical Skills</h3><ul><li>Strong knowledge of TCP/IP, BGP, OSPF, MPLS</li><li>Experience with network monitoring tools (SolarWinds, Nagios, PRTG)</li><li>Understanding of 4G LTE and 5G NR technologies</li><li>Proficiency in Linux/Unix systems</li><li>Scripting skills (Python, Bash) a plus</li></ul><h3>Certifications (Preferred)</h3><ul><li>CCNA / CCNP</li><li>Nokia SRC / Huawei HCIA</li><li>CompTIA Network+</li></ul><h3>Benefits</h3><p>Globe Telecom offers one of the most competitive compensation packages in the Philippine telecommunications industry. Join us and enjoy career growth, cutting-edge technology exposure, and a vibrant work culture.</p>',
                    ],
                ]),
                'show_on_landing' => true,
                'application_deadline' => '2026-04-30',
                'start_date' => '2026-06-01',
                'status' => 'published',
                'is_featured' => true,
                'featured_until' => '2026-04-30',
                'views' => 312,
                'views_count' => 312,
                'created_by' => $adminId,
                'published_at' => $now->copy()->subDays(7),
                'created_at' => $now->copy()->subDays(8),
                'updated_at' => $now->copy()->subDays(7),
            ],

            // 4. Teaching job
            [
                'campus_id' => null,
                'is_multi_campus' => true,
                'title' => 'Senior High School Teacher — STEM Track',
                'slug' => 'shs-teacher-deped-2026',
                'company_name' => 'Department of Education (DepEd)',
                'company_logo' => 'jobs/logo_deped.jpg',
                'poster_image' => 'jobs/education_inst.jpg',
                'background_image' => null,
                'description' => '<p>The Department of Education is hiring Senior High School Teachers for the STEM track in various divisions across the National Capital Region. If you\'re passionate about shaping the next generation of Filipino scientists and engineers, this is your calling!</p><h3>Positions Available</h3><ul><li>General Mathematics Teacher</li><li>General Biology / General Chemistry Teacher</li><li>Pre-Calculus / Basic Calculus Teacher</li><li>Research in Daily Life Teacher</li></ul><h3>Qualifications</h3><ul><li>Bachelor\'s degree in Education (major in Math/Science) or related field with 18 units of Education</li><li>Valid Professional Teaching License (LET Passer)</li><li>At least 1 year teaching experience preferred</li><li>Proficiency in DepEd-prescribed curriculum</li></ul>',
                'category_id' => $categories['education'] ?? null,
                'job_type' => 'full_time',
                'experience_level' => 'entry',
                'location' => 'Various Divisions, NCR',
                'is_remote' => false,
                'work_arrangement' => 'onsite',
                'contact_person' => 'DepEd NCR HR Division',
                'contact_email' => 'hr.ncr@deped.gov.ph',
                'contact_phone' => '(02) 8633-7228',
                'application_url' => 'https://www.deped.gov.ph/careers/',
                'application_instructions' => 'Submit application through the DepEd Online Application System (DOAS). Include your PRC license, TOR, and service records.',
                'salary_min' => 27000.00,
                'salary_max' => 27000.00,
                'salary_currency' => 'PHP',
                'salary_range' => '₱27,000 (SG-11)',
                'salary_period' => 'monthly',
                'is_salary_visible' => true,
                'benefits' => "GSIS\nPhilHealth\nPag-IBIG\nPERA (₱2,000/month)\nClothing Allowance\nMid-Year Bonus\nYear-End Bonus\nCash Gift\nService Recognition Pay",
                'requirements' => "LET Passer with valid PRC License\nBachelor's degree in Education or related field\nCSC Professional/Sub-Professional Eligibility\nGood moral character\nPhysically and mentally fit",
                'qualifications' => null,
                'skills_required' => null,
                'external_url' => null,
                'use_pages' => false,
                'pages' => null,
                'show_on_landing' => true,
                'application_deadline' => '2026-03-31',
                'start_date' => '2026-06-15',
                'status' => 'published',
                'is_featured' => false,
                'featured_until' => null,
                'views' => 421,
                'views_count' => 421,
                'created_by' => $adminId,
                'published_at' => $now->copy()->subDays(10),
                'created_at' => $now->copy()->subDays(11),
                'updated_at' => $now->copy()->subDays(10),
            ],

            // 5. Healthcare job
            [
                'campus_id' => null,
                'is_multi_campus' => true,
                'title' => 'Medical Technologist II',
                'slug' => 'medical-technologist-doh-2026',
                'company_name' => 'Department of Health (DOH)',
                'company_logo' => 'jobs/logo_doh.jpg',
                'poster_image' => 'jobs/healthcare_org.jpg',
                'background_image' => null,
                'description' => '<p>The Department of Health is hiring Medical Technologists for government hospitals in the National Capital Region. Be part of the healthcare team that serves the Filipino people.</p><h3>Job Description</h3><ul><li>Perform laboratory tests (Hematology, Clinical Chemistry, Microbiology, Blood Banking)</li><li>Operate and maintain laboratory equipment</li><li>Prepare laboratory reports and ensure quality control</li><li>Follow biosafety and infection control protocols</li><li>Participate in proficiency testing programs</li></ul><h3>Qualifications</h3><ul><li>BS Medical Technology graduate</li><li>Registered Medical Technologist (RMT) license</li><li>CSC Professional Eligibility</li><li>Preferably with hospital experience</li></ul>',
                'category_id' => $categories['healthcare'] ?? null,
                'job_type' => 'full_time',
                'experience_level' => 'entry',
                'location' => 'Government Hospitals, NCR',
                'is_remote' => false,
                'work_arrangement' => 'onsite',
                'contact_person' => 'DOH HHRDB',
                'contact_email' => 'hr@doh.gov.ph',
                'contact_phone' => '(02) 8651-7800',
                'application_url' => 'https://careers.doh.gov.ph',
                'application_instructions' => null,
                'salary_min' => 33575.00,
                'salary_max' => 33575.00,
                'salary_currency' => 'PHP',
                'salary_range' => '₱33,575 (SG-15)',
                'salary_period' => 'monthly',
                'is_salary_visible' => true,
                'benefits' => "GSIS\nPhilHealth\nPag-IBIG\nHazard Pay\nSubsistence Allowance\nLaundry Allowance\n13th Month Bonus\nCash Gift",
                'requirements' => "BS Medical Technology\nRegistered Medical Technologist (PRC)\nCSC Professional Eligibility\nPhysically and mentally fit",
                'qualifications' => null,
                'skills_required' => null,
                'external_url' => null,
                'use_pages' => false,
                'pages' => null,
                'show_on_landing' => false,
                'application_deadline' => '2026-04-30',
                'start_date' => null,
                'status' => 'published',
                'is_featured' => false,
                'featured_until' => null,
                'views' => 156,
                'views_count' => 156,
                'created_by' => $adminId,
                'published_at' => $now->copy()->subDays(8),
                'created_at' => $now->copy()->subDays(9),
                'updated_at' => $now->copy()->subDays(8),
            ],

            // 6. Retail/Management trainee
            [
                'campus_id' => null,
                'is_multi_campus' => true,
                'title' => 'Management Trainee — Retail Operations',
                'slug' => 'management-trainee-sm-2026',
                'company_name' => 'SM Investments Corporation',
                'company_logo' => 'jobs/logo_sm.jpg',
                'poster_image' => 'jobs/startup_office.jpg',
                'background_image' => null,
                'description' => '<p>SM Investments is looking for dynamic and driven fresh graduates to join our Management Trainee Program. Accelerate your career in one of the Philippines\' largest conglomerates!</p><h3>Program Overview</h3><p>The 18-month Management Trainee Program provides hands-on experience across multiple business units of the SM Group including SM Retail, SM Supermalls, and SM Development Corporation.</p><h3>Benefits</h3><ul><li>Competitive salary with housing allowance</li><li>Rotation across 3 business units</li><li>Dedicated mentor from senior management</li><li>Fast-track promotion upon program completion</li><li>HMO, life insurance, and employee discounts</li></ul>',
                'category_id' => $categories['business-finance'] ?? null,
                'job_type' => 'full_time',
                'experience_level' => 'entry',
                'location' => 'SM Corporate Offices, Pasay City',
                'is_remote' => false,
                'work_arrangement' => 'onsite',
                'contact_person' => 'SM Talent Acquisition',
                'contact_email' => 'careers@sminvestments.com',
                'contact_phone' => '(02) 8862-7000',
                'application_url' => 'https://www.sminvestments.com/careers',
                'application_instructions' => null,
                'salary_min' => 30000.00,
                'salary_max' => 35000.00,
                'salary_currency' => 'PHP',
                'salary_range' => '₱30,000 - ₱35,000',
                'salary_period' => 'monthly',
                'is_salary_visible' => true,
                'benefits' => "HMO\n13th Month Pay\nPerformance Bonus\nEmployee Discounts (SM Stores)\nHousing Allowance\nTransportation Allowance",
                'requirements' => "Bachelor's degree in Business, Management, Marketing, or related field\nFresh graduates or with up to 1 year experience\nStrong leadership and communication skills\nWilling to undergo 18-month rotation program\nAbove average academic standing (top 30% of batch preferred)",
                'qualifications' => null,
                'skills_required' => null,
                'external_url' => null,
                'use_pages' => false,
                'pages' => null,
                'show_on_landing' => true,
                'application_deadline' => '2026-04-01',
                'start_date' => '2026-06-01',
                'status' => 'published',
                'is_featured' => true,
                'featured_until' => '2026-04-01',
                'views' => 523,
                'views_count' => 523,
                'created_by' => $adminId,
                'published_at' => $now->copy()->subDays(2),
                'created_at' => $now->copy()->subDays(3),
                'updated_at' => $now->copy()->subDays(2),
            ],

            // 7. Government (Meralco)
            [
                'campus_id' => 1,
                'is_multi_campus' => false,
                'title' => 'Electrical Engineer — Power Distribution',
                'slug' => 'electrical-engineer-meralco-2026',
                'company_name' => 'Manila Electric Company (Meralco)',
                'company_logo' => 'jobs/logo_meralco.jpg',
                'poster_image' => 'jobs/manufacturing.jpg',
                'background_image' => null,
                'description' => '<p>Meralco, the Philippines\' largest electric distribution utility, is hiring Electrical Engineers for power distribution operations across the franchise area.</p><h3>Key Responsibilities</h3><ul><li>Design and plan power distribution systems</li><li>Conduct load analysis and system capacity studies</li><li>Supervise installation and maintenance of distribution equipment</li><li>Ensure compliance with PEC and Philippine Grid Code</li><li>Coordinate with LGUs and contractors for infrastructure projects</li></ul>',
                'category_id' => $categories['engineering'] ?? null,
                'job_type' => 'full_time',
                'experience_level' => 'mid',
                'location' => 'Meralco Center, Ortigas, Pasig City',
                'is_remote' => false,
                'work_arrangement' => 'onsite',
                'contact_person' => 'Meralco HR',
                'contact_email' => 'careers@meralco.com.ph',
                'contact_phone' => '(02) 16211',
                'application_url' => 'https://company.meralco.com.ph/careers',
                'application_instructions' => null,
                'salary_min' => 35000.00,
                'salary_max' => 50000.00,
                'salary_currency' => 'PHP',
                'salary_range' => '₱35,000 - ₱50,000',
                'salary_period' => 'monthly',
                'is_salary_visible' => true,
                'benefits' => "HMO\nLife Insurance\nElectricity Discount\nRice Subsidy\nPerformance Bonus\nRetirement Plan",
                'requirements' => "BS Electrical Engineering graduate\nRegistered Electrical Engineer (REE) license\n2-4 years experience in power distribution\nKnowledge of ETAP, AutoCAD, GIS\nWilling to do fieldwork",
                'qualifications' => null,
                'skills_required' => null,
                'external_url' => null,
                'use_pages' => false,
                'pages' => null,
                'show_on_landing' => false,
                'application_deadline' => '2026-05-15',
                'start_date' => null,
                'status' => 'published',
                'is_featured' => false,
                'featured_until' => null,
                'views' => 87,
                'views_count' => 87,
                'created_by' => $adminId,
                'published_at' => $now->copy()->subDays(12),
                'created_at' => $now->copy()->subDays(13),
                'updated_at' => $now->copy()->subDays(12),
            ],

            // 8. Real estate / Ayala
            [
                'campus_id' => null,
                'is_multi_campus' => true,
                'title' => 'Project Engineer — Construction',
                'slug' => 'project-engineer-ayala-land-2026',
                'company_name' => 'Ayala Land, Inc.',
                'company_logo' => 'jobs/logo_ayala.jpg',
                'poster_image' => 'jobs/consulting.jpg',
                'background_image' => null,
                'description' => '<p>Ayala Land, a premier real estate developer, is hiring Project Engineers for residential and commercial construction projects in key growth areas nationwide.</p><h3>Responsibilities</h3><ul><li>Oversee daily construction activities and ensure compliance with plans and specifications</li><li>Coordinate with contractors, architects, and consultants</li><li>Monitor project timelines, budgets, and quality standards</li><li>Prepare progress reports and manage project documentation</li><li>Ensure compliance with DPWH, DENR, and LGU regulations</li></ul><h3>Qualifications</h3><ul><li>BS Civil Engineering or Architecture graduate</li><li>Licensed Civil Engineer or Architect</li><li>2-5 years experience in building construction</li><li>Proficiency in AutoCAD, Primavera/MS Project, Excel</li><li>Willing to be assigned to project sites nationwide</li></ul>',
                'category_id' => $categories['engineering'] ?? null,
                'job_type' => 'full_time',
                'experience_level' => 'mid',
                'location' => 'Makati City / Various Project Sites',
                'is_remote' => false,
                'work_arrangement' => 'onsite',
                'contact_person' => 'Ayala Land HR',
                'contact_email' => 'careers@ayalaland.com.ph',
                'contact_phone' => '(02) 7908-3000',
                'application_url' => 'https://www.ayalaland.com.ph/careers',
                'application_instructions' => null,
                'salary_min' => 35000.00,
                'salary_max' => 55000.00,
                'salary_currency' => 'PHP',
                'salary_range' => '₱35,000 - ₱55,000',
                'salary_period' => 'monthly',
                'is_salary_visible' => true,
                'benefits' => "HMO\nLife Insurance\n15 VL + 15 SL\nProject Allowance\nPerformance Bonus\nRetirement Fund\nTraining & Development",
                'requirements' => "BS Civil Engineering or Architecture\nPRC License (CE or Architect)\n2-5 years construction experience\nAutoCAD, Primavera/MS Project proficiency\nWilling for provincial assignment",
                'qualifications' => null,
                'skills_required' => null,
                'external_url' => null,
                'use_pages' => false,
                'pages' => null,
                'show_on_landing' => false,
                'application_deadline' => '2026-05-31',
                'start_date' => null,
                'status' => 'published',
                'is_featured' => false,
                'featured_until' => null,
                'views' => 134,
                'views_count' => 134,
                'created_by' => $adminId,
                'published_at' => $now->copy()->subDays(6),
                'created_at' => $now->copy()->subDays(7),
                'updated_at' => $now->copy()->subDays(6),
            ],

            // 9. PLDT IT job
            [
                'campus_id' => null,
                'is_multi_campus' => true,
                'title' => 'IT Support Specialist',
                'slug' => 'it-support-specialist-pldt-2026',
                'company_name' => 'PLDT Inc.',
                'company_logo' => 'jobs/logo_pldt.jpg',
                'poster_image' => 'jobs/creative_agency.jpg',
                'background_image' => null,
                'description' => '<p>PLDT, the Philippines\' largest integrated telco company, is looking for IT Support Specialists to join the Enterprise Group\'s technical operations team.</p><h3>Responsibilities</h3><ul><li>Provide Level 1 and Level 2 technical support for enterprise clients</li><li>Troubleshoot network, hardware, and software issues</li><li>Manage IT service tickets through ServiceNow</li><li>Perform user account management (Active Directory, O365)</li><li>Conduct preventive maintenance on IT infrastructure</li><li>Document solutions and update the knowledge base</li></ul>',
                'category_id' => $categories['information-technology'] ?? null,
                'job_type' => 'full_time',
                'experience_level' => 'entry',
                'location' => 'PLDT Makati / PLDT Clark, Pampanga',
                'is_remote' => false,
                'work_arrangement' => 'onsite',
                'contact_person' => 'PLDT IT Recruitment',
                'contact_email' => 'itcareers@pldt.com.ph',
                'contact_phone' => '(02) 7171-0000',
                'application_url' => 'https://pldt.com/careers',
                'application_instructions' => null,
                'salary_min' => 22000.00,
                'salary_max' => 30000.00,
                'salary_currency' => 'PHP',
                'salary_range' => '₱22,000 - ₱30,000',
                'salary_period' => 'monthly',
                'is_salary_visible' => true,
                'benefits' => "HMO\nTelco Allowance\n13th Month Pay\nPerformance Bonus\nLeave Benefits\nTraining Programs",
                'requirements' => "BS in IT, Computer Science, or related field\n0-2 years IT support experience\nKnowledge of Windows Server, Active Directory, O365\nBasic networking knowledge (CCNA a plus)\nExcellent troubleshooting and communication skills\nWilling to work on shifting schedule",
                'qualifications' => null,
                'skills_required' => null,
                'external_url' => null,
                'use_pages' => false,
                'pages' => null,
                'show_on_landing' => false,
                'application_deadline' => '2026-04-15',
                'start_date' => '2026-05-01',
                'status' => 'published',
                'is_featured' => false,
                'featured_until' => null,
                'views' => 198,
                'views_count' => 198,
                'created_by' => $adminId,
                'published_at' => $now->copy()->subDays(4),
                'created_at' => $now->copy()->subDays(5),
                'updated_at' => $now->copy()->subDays(4),
            ],

            // 10. Food industry / Jollibee
            [
                'campus_id' => null,
                'is_multi_campus' => true,
                'title' => 'Quality Assurance Analyst — Food Manufacturing',
                'slug' => 'qa-analyst-jollibee-2026',
                'company_name' => 'Jollibee Foods Corporation',
                'company_logo' => 'jobs/logo_jollibee.jpg',
                'poster_image' => 'jobs/government_agency.jpg',
                'background_image' => null,
                'description' => '<p>Jollibee Foods Corporation, a global multi-brand restaurant company, is seeking Quality Assurance Analysts for its food manufacturing plants in Cavite and Laguna.</p><h3>Key Responsibilities</h3><ul><li>Conduct quality inspections and testing of raw materials and finished products</li><li>Monitor compliance with food safety standards (HACCP, GMP, ISO 22000)</li><li>Implement corrective and preventive actions on quality issues</li><li>Perform supplier audits and assessments</li><li>Prepare quality reports and documentation</li></ul>',
                'category_id' => $categories['manufacturing'] ?? null,
                'job_type' => 'full_time',
                'experience_level' => 'entry',
                'location' => 'JFC Manufacturing Plants, Cavite / Laguna',
                'is_remote' => false,
                'work_arrangement' => 'onsite',
                'contact_person' => 'JFC Manufacturing HR',
                'contact_email' => 'manufacturing.careers@jollibee.com.ph',
                'contact_phone' => '(02) 8634-1111',
                'application_url' => 'https://www.jollibeegroup.com/careers/',
                'application_instructions' => null,
                'salary_min' => 20000.00,
                'salary_max' => 28000.00,
                'salary_currency' => 'PHP',
                'salary_range' => '₱20,000 - ₱28,000',
                'salary_period' => 'monthly',
                'is_salary_visible' => true,
                'benefits' => "HMO\n13th Month Pay\nMeal Allowance\nTransportation Allowance\nPerformance Bonus\nJFC Product Discounts",
                'requirements' => "BS Food Technology, Chemistry, Chemical Engineering, or related field\nFresh graduates welcome\nKnowledge of HACCP, GMP, ISO 22000 preferred\nGood analytical and problem-solving skills\nWilling to work in manufacturing environment\nWilling to be assigned in Cavite or Laguna",
                'qualifications' => null,
                'skills_required' => null,
                'external_url' => null,
                'use_pages' => false,
                'pages' => null,
                'show_on_landing' => false,
                'application_deadline' => '2026-04-30',
                'start_date' => null,
                'status' => 'published',
                'is_featured' => false,
                'featured_until' => null,
                'views' => 95,
                'views_count' => 95,
                'created_by' => $adminId,
                'published_at' => $now->copy()->subDays(9),
                'created_at' => $now->copy()->subDays(10),
                'updated_at' => $now->copy()->subDays(9),
            ],
        ];

        foreach ($jobs as $job) {
            DB::table('job_postings')->insert($job);
        }
    }
}
