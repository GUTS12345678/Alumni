<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Merge announcements + job_postings into a unified "contents" table.
     */
    public function up(): void
    {
        // ── 1. Create the unified contents table ────────────────────────
        Schema::create('contents', function (Blueprint $table) {
            $table->id();

            // ─── Shared fields ──────────────────────────────────
            $table->string('content_type', 20)->index();           // announcement | job | event
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('content')->nullable();
            $table->json('pages')->nullable();
            $table->boolean('use_pages')->default(false);

            // Images
            $table->string('featured_image')->nullable();         // was featured_image (ann) / poster_image (job)
            $table->json('gallery_images')->nullable();

            // Campus
            $table->foreignId('campus_id')->nullable()->constrained('campuses')->nullOnDelete();
            $table->boolean('is_multi_campus')->default(false);

            // Status & visibility
            $table->enum('status', ['draft', 'published', 'closed', 'expired'])->default('draft');
            $table->boolean('is_featured')->default(false);
            $table->date('featured_until')->nullable();
            $table->boolean('show_on_landing')->default(false);
            $table->string('priority', 20)->default('normal');     // low | normal | high | urgent

            // Tracking
            $table->unsignedInteger('views_count')->default(0);
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('expires_at')->nullable();

            // ─── Announcement-specific (nullable) ───────────────
            $table->string('target_type', 50)->nullable();         // general | targeted
            $table->json('target_filters')->nullable();
            $table->json('target_batch_years')->nullable();
            $table->json('target_department_ids')->nullable();
            $table->boolean('is_published')->default(false);

            // ─── Job-specific (nullable) ────────────────────────
            $table->string('company_name')->nullable();
            $table->string('company_logo')->nullable();
            $table->string('company_website')->nullable();
            $table->foreignId('category_id')->nullable()->constrained('job_categories')->nullOnDelete();
            $table->string('job_type', 30)->nullable();            // full_time | part_time | contract | internship
            $table->string('experience_level', 30)->nullable();    // entry | mid | senior | executive | any
            $table->string('work_arrangement', 30)->nullable();    // onsite | remote | hybrid
            $table->string('location')->nullable();
            $table->boolean('is_remote')->default(false);
            $table->string('contact_person')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone', 50)->nullable();
            $table->string('application_url', 500)->nullable();
            $table->string('external_url', 500)->nullable();
            $table->text('application_instructions')->nullable();
            $table->decimal('salary_min', 12, 2)->nullable();
            $table->decimal('salary_max', 12, 2)->nullable();
            $table->string('salary_currency', 3)->default('PHP');
            $table->string('salary_range', 100)->nullable();
            $table->string('salary_period', 20)->nullable();       // hourly | monthly | yearly
            $table->boolean('is_salary_visible')->default(true);
            $table->text('benefits')->nullable();
            $table->text('requirements')->nullable();
            $table->text('qualifications')->nullable();
            $table->json('skills_required')->nullable();
            $table->date('application_deadline')->nullable();
            $table->date('start_date')->nullable();
            $table->string('background_image')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['content_type', 'status']);
            $table->index(['content_type', 'status', 'campus_id']);
            $table->index(['status', 'published_at']);
            $table->index(['show_on_landing', 'status']);
        });

        // ── 2. Create content_reads (replaces announcement_reads) ───────
        Schema::create('content_reads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('content_id')->constrained('contents')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('read_at')->nullable();

            $table->unique(['content_id', 'user_id']);
        });

        // ── 3. Create content_views (replaces job_views) ────────────────
        Schema::create('content_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('content_id')->constrained('contents')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamp('viewed_at')->nullable();

            $table->index(['content_id', 'user_id']);
        });

        // ── 4. Migrate announcement data ────────────────────────────────
        $announcements = DB::table('announcements')->whereNull('deleted_at')->get();
        foreach ($announcements as $ann) {
            $slug = Str::slug($ann->title);
            // Ensure slug uniqueness
            $existing = DB::table('contents')->where('slug', $slug)->exists();
            if ($existing) {
                $slug .= '-' . Str::random(6);
            }

            $contentId = DB::table('contents')->insertGetId([
                'content_type'         => 'announcement',
                'title'                => $ann->title,
                'slug'                 => $slug,
                'content'              => $ann->content,
                'pages'                => $ann->pages,
                'use_pages'            => $ann->use_pages ?? false,
                'featured_image'       => $ann->featured_image,
                'gallery_images'       => $ann->gallery_images,
                'campus_id'            => $ann->campus_id,
                'is_multi_campus'      => $ann->is_multi_campus ?? false,
                'status'               => $ann->status ?? 'draft',
                'show_on_landing'      => $ann->show_on_landing ?? false,
                'priority'             => $ann->priority ?? 'normal',
                'created_by'           => $ann->created_by,
                'scheduled_at'         => $ann->scheduled_at,
                'published_at'         => $ann->published_at,
                'expires_at'           => $ann->expires_at,
                'target_type'          => $ann->target_type,
                'target_filters'       => $ann->target_filters,
                'target_batch_years'   => $ann->target_batch_years,
                'target_department_ids' => $ann->target_department_ids,
                'is_published'         => $ann->is_published ?? false,
                'created_at'           => $ann->created_at,
                'updated_at'           => $ann->updated_at,
            ]);

            // Migrate announcement reads
            $reads = DB::table('announcement_reads')->where('announcement_id', $ann->id)->get();
            foreach ($reads as $read) {
                DB::table('content_reads')->insert([
                    'content_id' => $contentId,
                    'user_id'    => $read->user_id,
                    'read_at'    => $read->read_at ?? $read->created_at ?? now(),
                ]);
            }
        }

        // ── 5. Migrate job_postings data ────────────────────────────────
        $jobs = DB::table('job_postings')->whereNull('deleted_at')->get();
        foreach ($jobs as $job) {
            $slug = $job->slug ?? Str::slug($job->title) . '-' . Str::random(6);
            $existing = DB::table('contents')->where('slug', $slug)->exists();
            if ($existing) {
                $slug .= '-' . Str::random(6);
            }

            $contentId = DB::table('contents')->insertGetId([
                'content_type'           => 'job',
                'title'                  => $job->title,
                'slug'                   => $slug,
                'content'                => $job->content,
                'pages'                  => $job->pages,
                'use_pages'              => $job->use_pages ?? false,
                'featured_image'         => $job->poster_image,
                'campus_id'              => $job->campus_id,
                'is_multi_campus'        => $job->is_multi_campus ?? false,
                'status'                 => $job->status ?? 'draft',
                'is_featured'            => $job->is_featured ?? false,
                'featured_until'         => $job->featured_until,
                'show_on_landing'        => $job->show_on_landing ?? false,
                'views_count'            => ($job->views ?? 0) + ($job->views_count ?? 0),
                'created_by'             => $job->created_by,
                'published_at'           => $job->published_at,
                'expires_at'             => null,
                'company_name'           => $job->company_name,
                'company_logo'           => $job->company_logo,
                'category_id'            => $job->category_id,
                'job_type'               => $job->job_type,
                'experience_level'       => $job->experience_level,
                'work_arrangement'       => $job->work_arrangement,
                'location'               => $job->location,
                'is_remote'              => $job->is_remote ?? false,
                'contact_person'         => $job->contact_person,
                'contact_email'          => $job->contact_email,
                'contact_phone'          => $job->contact_phone,
                'application_url'        => $job->application_url,
                'external_url'           => $job->external_url,
                'application_instructions' => $job->application_instructions,
                'salary_min'             => $job->salary_min,
                'salary_max'             => $job->salary_max,
                'salary_currency'        => $job->salary_currency ?? 'PHP',
                'salary_range'           => $job->salary_range,
                'salary_period'          => $job->salary_period,
                'is_salary_visible'      => $job->is_salary_visible ?? true,
                'benefits'               => $job->benefits,
                'requirements'           => $job->requirements,
                'qualifications'         => $job->qualifications,
                'skills_required'        => $job->skills_required,
                'application_deadline'   => $job->application_deadline,
                'start_date'             => $job->start_date,
                'background_image'       => $job->background_image,
                'created_at'             => $job->created_at,
                'updated_at'             => $job->updated_at,
            ]);

            // Migrate job views
            $views = DB::table('job_views')->where('job_posting_id', $job->id)->get();
            foreach ($views as $view) {
                DB::table('content_views')->insert([
                    'content_id' => $contentId,
                    'user_id'    => $view->user_id,
                    'ip_address' => $view->ip_address,
                    'user_agent' => $view->user_agent,
                    'viewed_at'  => $view->viewed_at,
                ]);
            }
        }
    }

    /**
     * Reverse the migration — drop new tables (old tables are still intact).
     */
    public function down(): void
    {
        Schema::dropIfExists('content_views');
        Schema::dropIfExists('content_reads');
        Schema::dropIfExists('contents');
    }
};
