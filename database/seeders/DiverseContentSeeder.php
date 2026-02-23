<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

/**
 * Diverse content seeder – creates representative content across all 7 content types:
 *  announcement, job, event, news, blog, scholarship, resource
 *
 * Content bodies use rich HTML suitable for the TipTap editor / dangerouslySetInnerHTML display.
 *
 * Run: php artisan db:seed --class=DiverseContentSeeder
 */
class DiverseContentSeeder extends Seeder
{
    public function run(): void
    {
        // Find an admin user to set as creator
        $admin = DB::table('users')
            ->whereIn('role', ['super_admin', 'admin'])
            ->first();

        $createdBy = $admin?->id ?? 1;
        $now = Carbon::now();

        $items = [

            // ── Announcements ─────────────────────────────────────────────────────
            [
                'content_type' => 'announcement',
                'title'        => 'Alumni Homecoming 2025 – Save the Date!',
                'content'      => '<h2>Welcome Back, Alumni!</h2>
<p>We are thrilled to announce our <strong>Annual Alumni Homecoming 2025</strong> scheduled for <strong>April 26–27, 2025</strong> at the Main Campus Auditorium.</p>
<h3>Highlights</h3>
<ul>
  <li>Grand reunion dinner with batch recognition</li>
  <li>Campus tour and facilities showcase</li>
  <li>Networking mixer for batch leaders</li>
  <li>Alumni achievement awards ceremony</li>
</ul>
<p>Registration details will be sent via email. For inquiries, contact the <a href="mailto:alumni@university.edu">Alumni Relations Office</a>.</p>
<blockquote>Once a Wildcat, always a Wildcat!</blockquote>',
                'status'       => 'published',
                'target_type'  => 'all',
                'priority'     => 'high',
                'is_featured'  => true,
                'show_on_landing' => true,
            ],
            [
                'content_type' => 'announcement',
                'title'        => 'Update: Alumni ID Card Renewal Process',
                'content'      => '<p>Dear Alumni,</p>
<p>The Alumni Affairs Office is pleased to announce the streamlined renewal process for <strong>Alumni ID Cards</strong> effective March 1, 2025.</p>
<h3>Requirements</h3>
<ol>
  <li>Completed online renewal form (available on the portal)</li>
  <li>1 piece 2×2 ID photo (white background)</li>
  <li>Proof of graduation (diploma copy or transcript)</li>
  <li>Processing fee: ₱150.00</li>
</ol>
<p>Cards will be ready within <strong>5–7 business days</strong> and can be claimed at the Registrar\'s Office or mailed to your registered address.</p>',
                'status'       => 'published',
                'target_type'  => 'all',
                'priority'     => 'normal',
                'is_featured'  => false,
                'show_on_landing' => false,
            ],

            // ── Jobs ──────────────────────────────────────────────────────────────
            [
                'content_type'    => 'job',
                'title'           => 'Senior Software Engineer – FinTech Division',
                'content'         => '<p>Join our fast-growing FinTech team as a <strong>Senior Software Engineer</strong> and help build the next generation of digital banking infrastructure.</p>
<h3>Responsibilities</h3>
<ul>
  <li>Design and implement scalable microservices using Node.js and Python</li>
  <li>Lead code reviews and mentor junior developers</li>
  <li>Collaborate with product and design teams in Agile sprints</li>
  <li>Ensure 99.9% uptime for payment processing APIs</li>
</ul>
<h3>Qualifications</h3>
<ul>
  <li>BS Computer Science or related field</li>
  <li>5+ years backend development experience</li>
  <li>Strong knowledge of AWS, Docker, and Kubernetes</li>
  <li>Experience with PostgreSQL and Redis</li>
</ul>',
                'status'          => 'published',
                'company_name'    => 'BDO Unibank Technology Group',
                'job_type'        => 'full_time',
                'work_arrangement'=> 'hybrid',
                'location'        => 'Ortigas Center, Pasig City',
                'salary_min'      => 80000,
                'salary_max'      => 130000,
                'salary_currency' => 'PHP',
                'salary_period'   => 'monthly',
                'contact_email'   => 'careers@bdotech.com',
                'application_deadline' => $now->copy()->addDays(30)->toDateTimeString(),
                'is_featured'     => true,
                'show_on_landing' => false,
            ],
            [
                'content_type'    => 'job',
                'title'           => 'Marketing Associate – Consumer Goods',
                'content'         => '<p>We are looking for a passionate <strong>Marketing Associate</strong> to support our brand campaigns across digital and traditional channels.</p>
<h3>Key Responsibilities</h3>
<ul>
  <li>Develop and execute social media content calendars</li>
  <li>Assist in organizing trade events and promotional activations</li>
  <li>Analyze campaign performance and prepare weekly reports</li>
  <li>Coordinate with external agencies and suppliers</li>
</ul>
<h3>Requirements</h3>
<ul>
  <li>Graduate of Marketing, Business Administration, or Communications</li>
  <li>1–2 years marketing experience preferred (fresh graduates welcome)</li>
  <li>Excellent written and verbal communication skills</li>
  <li>Proficiency in Canva, Meta Ads Manager, or Google Analytics is a plus</li>
</ul>',
                'status'          => 'published',
                'company_name'    => 'Unilever Philippines',
                'job_type'        => 'full_time',
                'work_arrangement'=> 'onsite',
                'location'        => 'McKinley Hill, Taguig City',
                'salary_min'      => 22000,
                'salary_max'      => 30000,
                'salary_currency' => 'PHP',
                'salary_period'   => 'monthly',
                'contact_email'   => 'ph.careers@unilever.com',
                'application_deadline' => $now->copy()->addDays(21)->toDateTimeString(),
                'is_featured'     => false,
                'show_on_landing' => false,
            ],

            // ── Events ────────────────────────────────────────────────────────────
            [
                'content_type' => 'event',
                'title'        => 'Tech Summit 2025: AI & the Future of Work',
                'content'      => '<p>Join us for <strong>Tech Summit 2025</strong>, a full-day conference bringing together industry leaders, innovators, and alumni professionals to explore how artificial intelligence is reshaping the workforce.</p>
<h3>Program Schedule</h3>
<ol>
  <li><strong>08:00 AM</strong> – Registration & Networking Breakfast</li>
  <li><strong>09:00 AM</strong> – Keynote: "AI in the Philippine Enterprise" by CTO, Globe Telecom</li>
  <li><strong>10:30 AM</strong> – Panel: Alumni in Tech – Success Stories</li>
  <li><strong>12:00 PM</strong> – Lunch Break</li>
  <li><strong>01:00 PM</strong> – Workshop: Prompt Engineering for Professionals</li>
  <li><strong>03:00 PM</strong> – Startup Pitching Competition (Alumni Edition)</li>
  <li><strong>05:00 PM</strong> – Closing Remarks & Networking Cocktails</li>
</ol>
<p>Limited seats available. Register at the Alumni Portal or email <a href="mailto:events@university.edu">events@university.edu</a>.</p>',
                'status'       => 'published',
                'location'     => 'SMX Convention Center, Manila',
                'start_date'   => $now->copy()->addDays(45)->toDateTimeString(),
                'priority'     => 'high',
                'is_featured'  => true,
                'show_on_landing' => true,
            ],
            [
                'content_type' => 'event',
                'title'        => 'Alumni Blood Donation Drive – March 2025',
                'content'      => '<p>In partnership with the <strong>Philippine Red Cross</strong>, the Alumni Association is organizing a <strong>Blood Donation Drive</strong> open to all alumni, faculty, and staff.</p>
<p>Your one donation can save up to <strong>3 lives</strong>. No appointment needed — walk-ins are welcome!</p>
<h3>Details</h3>
<ul>
  <li><strong>Date:</strong> March 15, 2025 (Saturday)</li>
  <li><strong>Time:</strong> 8:00 AM – 3:00 PM</li>
  <li><strong>Venue:</strong> Gymnasium, Main Campus</li>
</ul>
<h3>Requirements for Donors</h3>
<ul>
  <li>18–65 years old</li>
  <li>At least 50 kg body weight</li>
  <li>No major illness in the past 6 months</li>
  <li>Must not have donated blood in the past 3 months</li>
</ul>
<p>Light snacks and certificate of participation will be provided.</p>',
                'status'       => 'published',
                'location'     => 'Main Campus Gymnasium',
                'start_date'   => $now->copy()->addDays(12)->toDateTimeString(),
                'priority'     => 'normal',
                'is_featured'  => false,
                'show_on_landing' => false,
            ],

            // ── News ──────────────────────────────────────────────────────────────
            [
                'content_type' => 'news',
                'title'        => 'Three Alumni Win National Engineering Awards 2025',
                'content'      => '<p>The university community celebrates as <strong>three distinguished alumni</strong> received honors at the <em>2025 National Engineering Awards</em> held last February 12 in Davao City.</p>
<h3>Awardees</h3>
<ul>
  <li><strong>Engr. Maria Santos (BS Civil Eng, 2010)</strong> – Outstanding Young Engineer for her work on sustainable housing projects in Visayas</li>
  <li><strong>Engr. Juan dela Cruz (BS Electrical Eng, 2008)</strong> – National Grid Reliability Award for overseeing the Luzon interconnection upgrade</li>
  <li><strong>Engr. Ana Reyes (BS Environmental Eng, 2015)</strong> – Green Innovation Award for developing low-cost water filtration systems deployed in 12 municipalities</li>
</ul>
<p>"This recognition belongs not just to me but to the entire university community that shaped who I am," said Engr. Santos during her acceptance speech.</p>
<p>The Alumni Affairs Office extends its warmest congratulations to all three awardees.</p>',
                'status'       => 'published',
                'priority'     => 'high',
                'is_featured'  => true,
                'show_on_landing' => false,
            ],
            [
                'content_type' => 'news',
                'title'        => 'University Ranked #4 in ASEAN for Computer Science Programs',
                'content'      => '<p>The <em>QS World University Rankings by Subject 2025</em> has placed our institution at <strong>#4 in Southeast Asia</strong> for Computer Science and Information Systems, a significant jump from last year\'s #7 ranking.</p>
<p>The ranking is based on four factors: academic reputation, employer reputation, research citations per paper, and International Research Network score.</p>
<blockquote>"This achievement reflects the hard work of our faculty, the excellence of our graduates, and the trust of our industry partners," said the University President.</blockquote>
<p>The Computer Science Department currently has over <strong>4,200 active alumni</strong> working across 38 countries, contributing to the institution\'s strong employer reputation score.</p>',
                'status'       => 'published',
                'priority'     => 'normal',
                'is_featured'  => false,
                'show_on_landing' => false,
            ],

            // ── Blog ──────────────────────────────────────────────────────────────
            [
                'content_type' => 'blog',
                'title'        => 'From Campus to Corporate: My First Year as a Software Engineer',
                'content'      => '<p><em>By: Andrei Villanueva, BS Computer Science Class of 2023</em></p>
<hr>
<p>When I walked across the stage to receive my diploma, I had one question echoing in my head: <em>"Am I really ready?"</em> One year later, I can finally say — mostly yes, but the learning never stops.</p>
<h2>The Gap Between School and Work</h2>
<p>The biggest shock wasn\'t the technical complexity — it was the <strong>communication overhead</strong>. In school, I coded solo or in small groups with a clear spec. At work, every feature involves product managers, designers, QA engineers, and at least two rounds of stakeholder feedback.</p>
<p>My advice: take every opportunity in school to work in teams. The soft skills matter more than you think.</p>
<h2>What Actually Helped</h2>
<ul>
  <li>The university\'s capstone project — working with a real client prepared me for ambiguity</li>
  <li>My thesis partner who taught me git branching strategies we still use at work</li>
  <li>The algorithms course I once dreaded — a coding interview is nothing but that course on a deadline</li>
</ul>
<h2>Year Two Goals</h2>
<p>I\'m targeting a cloud certification and hoping to give back by mentoring junior developers or speaking at the next Alumni Tech Summit. If you\'re a graduating CS student reading this — <strong>you\'ve got this</strong>.</p>',
                'status'       => 'published',
                'priority'     => 'normal',
                'is_featured'  => true,
                'show_on_landing' => false,
            ],
            [
                'content_type' => 'blog',
                'title'        => '5 Financial Habits Every Young Professional Should Build Now',
                'content'      => '<p><em>By: Kristine Mercado, BS Accountancy Class of 2018, CPA</em></p>
<hr>
<p>I spent my first two years after graduation earning a decent salary and saving almost nothing. If I could go back, here are the five habits I would build from day one.</p>
<h3>1. Automate Your Savings</h3>
<p>Set up an automatic transfer to a separate savings account on payday. Even ₱2,000/month compounds dramatically over time. Don\'t rely on willpower — automate it.</p>
<h3>2. Cash Flow Tracking (Not Just Budgeting)</h3>
<p>Budgeting tells you where money <em>should</em> go. Cash flow tracking tells you where it <em>actually</em> went. Use a spreadsheet or an app like Money Manager for at least 90 days.</p>
<h3>3. Emergency Fund First, Investments Second</h3>
<p>Three to six months of living expenses in a liquid, interest-bearing account before you put a single peso into the stock market. This is non-negotiable.</p>
<h3>4. Invest in Tax-Exempt Instruments Early</h3>
<p>PERA (Personal Equity Retirement Account) gives you a 5% tax credit on contributions up to ₱100,000/year. Most young professionals don\'t know this exists.</p>
<h3>5. Pay Yourself Before You Pay Your Wants</h3>
<p>The order matters: income → savings → needs → wants. Most people reverse the last two — that\'s why they\'re broke at the end of the month.</p>
<p>Savings rate is more important than investment returns when you\'re starting out. Build the habit first.</p>',
                'status'       => 'published',
                'priority'     => 'normal',
                'is_featured'  => false,
                'show_on_landing' => false,
            ],

            // ── Scholarships ──────────────────────────────────────────────────────
            [
                'content_type' => 'scholarship',
                'title'        => 'CHED Graduate Education Scholarship – AY 2025–2026',
                'content'      => '<p>The <strong>Commission on Higher Education (CHED)</strong> is now accepting applications for the <em>Graduate Education Scholarship (GES)</em> for Academic Year 2025–2026.</p>
<h3>Benefits</h3>
<ul>
  <li>Full tuition and miscellaneous fees</li>
  <li>Monthly stipend: ₱12,000 (Masters) / ₱18,000 (Doctorate)</li>
  <li>Book allowance: ₱10,000 per academic year</li>
  <li>Thesis/Dissertation grant: up to ₱50,000</li>
</ul>
<h3>Eligibility</h3>
<ul>
  <li>Filipino citizen, not more than 55 years old at the time of application</li>
  <li>Faculty member or academic staff of a CHED-supervised institution</li>
  <li>Admission to a CHED-identified priority program</li>
  <li>Must not have an existing CHED scholarship</li>
</ul>
<h3>Application Deadline</h3>
<p><strong>March 31, 2025.</strong> Submit complete documentary requirements to the CHED Regional Office.</p>
<p>For the full list of priority programs and application forms, visit <a href="https://ched.gov.ph" target="_blank" rel="noopener noreferrer">ched.gov.ph</a>.</p>',
                'status'       => 'published',
                'priority'     => 'high',
                'is_featured'  => true,
                'show_on_landing' => false,
                'expires_at'   => $now->copy()->addDays(45)->toDateTimeString(),
            ],
            [
                'content_type' => 'scholarship',
                'title'        => 'DOST-SEI Undergraduate Scholarship – Science & Engineering Tracks',
                'content'      => '<p>Alumni are encouraged to share this opportunity with qualified incoming freshmen. The <strong>Department of Science and Technology – Science Education Institute (DOST-SEI)</strong> is offering undergraduate scholarships for first-year college students entering S&T priority programs.</p>
<h3>Covered Programs</h3>
<p>Agriculture, Fisheries, Forestry, Chemistry, Biology, Environmental Science, Mathematics, Statistics, Physics, Geology, Computer Science, Engineering (all branches), Architecture, and Nursing.</p>
<h3>Scholarship Package</h3>
<ul>
  <li>Tuition and other school fees</li>
  <li>Monthly stipend: ₱7,000</li>
  <li>Annual book allowance: ₱10,000</li>
  <li>Graduation allowance: ₱5,000</li>
</ul>
<h3>How to Apply</h3>
<p>Take the <strong>DOST-SEI S&T Undergraduate Scholarship Examination</strong> (exam fee waived). Applications open January–February annually. Visit <a href="https://sei.dost.gov.ph" target="_blank" rel="noopener noreferrer">sei.dost.gov.ph</a> for the latest announcement.</p>',
                'status'       => 'published',
                'priority'     => 'normal',
                'is_featured'  => false,
                'show_on_landing' => false,
            ],

            // ── Resources ─────────────────────────────────────────────────────────
            [
                'content_type' => 'resource',
                'title'        => 'Alumni Career Development Resource Hub',
                'content'      => '<p>This resource guide consolidates the most useful tools, platforms, and guides to support your career growth as an alumnus of our institution.</p>
<h2>Job Search Platforms</h2>
<ul>
  <li><a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a> – Professional networking and job postings</li>
  <li><a href="https://jobstreet.ph" target="_blank" rel="noopener noreferrer">JobStreet Philippines</a> – Local job board with 50,000+ listings</li>
  <li><a href="https://www.kalibrr.com" target="_blank" rel="noopener noreferrer">Kalibrr</a> – Skills-based job matching</li>
  <li><a href="https://www.indeed.com" target="_blank" rel="noopener noreferrer">Indeed</a> – International job aggregator</li>
</ul>
<h2>Resume & Portfolio Tools</h2>
<ul>
  <li><a href="https://www.canva.com/resumes" target="_blank" rel="noopener noreferrer">Canva Resume Builder</a> – Free professional templates</li>
  <li><a href="https://resume.io" target="_blank" rel="noopener noreferrer">Resume.io</a> – ATS-friendly resume builder</li>
  <li><a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a> – For tech alumni showcasing projects</li>
  <li><a href="https://behance.net" target="_blank" rel="noopener noreferrer">Behance</a> – Portfolio platform for creatives</li>
</ul>
<h2>Professional Certifications (Free/Low-Cost)</h2>
<ul>
  <li><a href="https://www.coursera.org" target="_blank" rel="noopener noreferrer">Coursera</a> – University-grade courses with financial aid</li>
  <li><a href="https://www.edx.org" target="_blank" rel="noopener noreferrer">edX</a> – MIT, Harvard, and top university courses</li>
  <li><a href="https://aws.amazon.com/training" target="_blank" rel="noopener noreferrer">AWS Training</a> – Cloud certifications recognized globally</li>
  <li><a href="https://learn.microsoft.com" target="_blank" rel="noopener noreferrer">Microsoft Learn</a> – Azure, Power Platform, and more</li>
</ul>
<h2>Alumni-Exclusive Benefits</h2>
<p>Registered alumni have access to free career counseling sessions. Schedule an appointment via the portal or email <a href="mailto:career@university.edu">career@university.edu</a>.</p>',
                'status'       => 'published',
                'priority'     => 'normal',
                'is_featured'  => false,
                'show_on_landing' => false,
            ],
            [
                'content_type' => 'resource',
                'title'        => 'Mental Health & Wellness Guide for Working Alumni',
                'content'      => '<p>Transitioning from academic life to the professional world can be overwhelming. This guide provides mental health resources specifically curated for working alumni.</p>
<h2>Recognizing Burnout</h2>
<p>Burnout is not just tiredness. Warning signs include:</p>
<ul>
  <li>Chronic exhaustion that sleep doesn\'t fix</li>
  <li>Increasing cynicism about your work or colleagues</li>
  <li>Declining productivity despite longer hours</li>
  <li>Physical symptoms: headaches, insomnia, frequent illness</li>
</ul>
<h2>Free & Low-Cost Support in the Philippines</h2>
<ul>
  <li><strong>National Center for Mental Health (NCMH) Crisis Hotline:</strong> 1553 (24/7, toll-free)</li>
  <li><strong>In Touch Community Services:</strong> +63 2 893-7603 (counseling and crisis line)</li>
  <li><strong>Hopeline Philippines:</strong> 0804-4673 (HOPE) or text 2919 for Globe/TM users</li>
  <li><strong>MindNation App:</strong> Free EAP sessions for select employers; individual plans also available</li>
</ul>
<h2>Self-Care Strategies That Work</h2>
<ol>
  <li><strong>Set hard stop times</strong> – Log off at a fixed time. Work expands to fill available space.</li>
  <li><strong>Movement counts</strong> – Even 20 minutes of walking reduces cortisol levels measurably.</li>
  <li><strong>Protect sleep</strong> – Sleep deprivation impairs judgment as severely as intoxication.</li>
  <li><strong>Invest in relationships</strong> – Social connection is consistently the #1 predictor of wellbeing.</li>
</ol>
<p>Remember: seeking help is a sign of self-awareness, not weakness.</p>',
                'status'       => 'published',
                'priority'     => 'normal',
                'is_featured'  => false,
                'show_on_landing' => false,
            ],
        ];

        foreach ($items as $item) {
            $base = [
                'content_type'  => $item['content_type'],
                'title'         => $item['title'],
                'slug'          => Str::slug($item['title']) . '-' . Str::random(4),
                'content'       => $item['content'],
                'status'        => $item['status'],
                'is_published'  => $item['status'] === 'published',
                'is_featured'   => $item['is_featured'] ?? false,
                'show_on_landing' => $item['show_on_landing'] ?? false,
                'target_type'   => $item['target_type'] ?? null,
                'priority'      => $item['priority'] ?? 'normal',
                'created_by'    => $createdBy,
                'published_at'  => $item['status'] === 'published' ? $now->toDateTimeString() : null,
                'created_at'    => $now->toDateTimeString(),
                'updated_at'    => $now->toDateTimeString(),
            ];

            // Job-specific fields
            if ($item['content_type'] === 'job') {
                $base['company_name']          = $item['company_name'] ?? null;
                $base['job_type']              = $item['job_type'] ?? 'full_time';
                $base['work_arrangement']      = $item['work_arrangement'] ?? 'onsite';
                $base['location']              = $item['location'] ?? null;
                $base['salary_min']            = $item['salary_min'] ?? null;
                $base['salary_max']            = $item['salary_max'] ?? null;
                $base['salary_currency']       = $item['salary_currency'] ?? 'PHP';
                $base['salary_period']         = $item['salary_period'] ?? 'monthly';
                $base['contact_email']         = $item['contact_email'] ?? null;
                $base['application_deadline']  = $item['application_deadline'] ?? null;
            }

            // Event-specific fields
            if ($item['content_type'] === 'event') {
                $base['location']   = $item['location'] ?? null;
                $base['start_date'] = $item['start_date'] ?? null;
            }

            // Scholarship / general expiry
            if (!empty($item['expires_at'])) {
                $base['expires_at'] = $item['expires_at'];
            }

            DB::table('contents')->insert($base);
        }

        if ($this->command) {
            $this->command->info('Diverse content seeded: ' . count($items) . ' items across 7 types.');
        }
    }
}
