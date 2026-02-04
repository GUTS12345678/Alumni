# Job Board Implementation Guide

**Created:** February 2, 2026  
**Status:** In Progress  
**Purpose:** Admin-managed job postings for alumni to view school job openings

---

## 📋 Overview

A simplified job board system where:
- **Admins** create and manage job postings (official school job openings)
- **Alumni** browse and view job listings
- **No application system** - only redirect links to external applications
- Job information includes HR contact details and external application links

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     JOB BOARD FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐                      ┌─────────────────┐      │
│  │    Admin    │                      │     Alumni      │      │
│  └──────┬──────┘                      └────────┬────────┘      │
│         │                                      │                │
│         │ Create/Edit/Delete                   │ Browse/View    │
│         ▼                                      ▼                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Job Postings                          │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │  • Title, Company, Description                   │    │   │
│  │  │  • Location, Job Type                            │    │   │
│  │  │  • HR Contact (Name, Email, Phone)               │    │   │
│  │  │  • External Application Link                     │    │   │
│  │  │  • Deadline                                      │    │   │
│  │  │  • Category                                      │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│                             ▼                                   │
│                  ┌─────────────────┐                           │
│                  │  External Link  │                           │
│                  │  (Company Site) │                           │
│                  └─────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Tables

```sql
-- 1. job_categories
-- Organize jobs by industry/field
CREATE TABLE job_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NULL,
    icon VARCHAR(50) NULL,           -- Lucide icon name
    color VARCHAR(20) NULL,          -- Hex color for UI
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 2. job_postings (Updated)
-- Main job listing table
CREATE TABLE job_postings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Basic Info
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_logo VARCHAR(255) NULL,
    description TEXT NOT NULL,
    
    -- Category & Type
    category_id BIGINT UNSIGNED NULL,
    job_type ENUM('full_time', 'part_time', 'contract', 'internship', 'temporary') NOT NULL,
    experience_level ENUM('entry', 'mid', 'senior', 'executive', 'any') DEFAULT 'any',
    
    -- Location
    location VARCHAR(255) NOT NULL,
    is_remote BOOLEAN DEFAULT FALSE,
    
    -- Contact Information
    contact_person VARCHAR(255) NULL,
    contact_email VARCHAR(255) NULL,
    contact_phone VARCHAR(50) NULL,
    
    -- External Application
    application_url VARCHAR(500) NULL,
    application_instructions TEXT NULL,
    
    -- Additional Info
    salary_range VARCHAR(100) NULL,      -- e.g., "₱25,000 - ₱35,000"
    benefits TEXT NULL,
    requirements TEXT NULL,
    qualifications TEXT NULL,
    
    -- Dates
    application_deadline DATE NULL,
    start_date DATE NULL,
    
    -- Status & Tracking
    status ENUM('draft', 'published', 'closed', 'expired') DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    featured_until DATE NULL,
    views INT DEFAULT 0,
    
    -- Admin tracking
    created_by BIGINT UNSIGNED NOT NULL,
    published_at TIMESTAMP NULL,
    
    -- Timestamps
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (category_id) REFERENCES job_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 3. job_views (Optional - for analytics)
-- Track individual views
CREATE TABLE job_views (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    job_posting_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NULL,        -- NULL for anonymous views
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_posting_id) REFERENCES job_postings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

### Tables to Remove

```sql
-- These tables are no longer needed
DROP TABLE IF EXISTS job_applications;
DROP TABLE IF EXISTS saved_jobs;
```

---

## 📁 File Structure

### Backend (Laravel)

```
app/
├── Http/
│   └── Controllers/
│       ├── Admin/
│       │   ├── JobController.php        # Admin job management
│       │   └── JobCategoryController.php
│       └── Alumni/
│           └── JobController.php        # Alumni job viewing
├── Models/
│   ├── JobPosting.php                   # Updated model
│   ├── JobCategory.php                  # New model
│   └── JobView.php                      # New model (optional)
└── Policies/
    └── JobPostingPolicy.php

database/
└── migrations/
    ├── 2026_02_02_100001_create_job_categories_table.php
    ├── 2026_02_02_100002_update_job_postings_table.php
    ├── 2026_02_02_100003_create_job_views_table.php
    └── 2026_02_02_100004_drop_job_applications_saved_jobs_tables.php

routes/
└── web.php                              # Add new routes
```

### Frontend (React + TypeScript)

```
resources/js/
├── components/
│   └── jobs/
│       ├── JobCard.tsx
│       ├── JobFilters.tsx
│       ├── JobCategoryBadge.tsx
│       └── JobDetailModal.tsx
├── pages/
│   ├── Alumni/
│   │   └── Jobs/
│   │       ├── Index.tsx               # Job listings
│   │       └── Show.tsx                # Job details
│   └── admin/
│       └── Jobs/
│           ├── Index.tsx               # Job management
│           ├── Create.tsx              # Create job
│           ├── Edit.tsx                # Edit job
│           └── Categories.tsx          # Category management
└── types/
    └── jobs.ts
```

---

## 🔌 API Endpoints

### Admin Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/jobs` | List all jobs (with filters) |
| POST | `/api/v1/admin/jobs` | Create job posting |
| GET | `/api/v1/admin/jobs/{id}` | Get job details |
| PUT | `/api/v1/admin/jobs/{id}` | Update job posting |
| DELETE | `/api/v1/admin/jobs/{id}` | Delete job posting |
| POST | `/api/v1/admin/jobs/{id}/publish` | Publish job |
| POST | `/api/v1/admin/jobs/{id}/close` | Close job |
| POST | `/api/v1/admin/jobs/{id}/feature` | Toggle featured |
| GET | `/api/v1/admin/jobs/analytics` | Job analytics |

### Admin Category Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/job-categories` | List categories |
| POST | `/api/v1/admin/job-categories` | Create category |
| PUT | `/api/v1/admin/job-categories/{id}` | Update category |
| DELETE | `/api/v1/admin/job-categories/{id}` | Delete category |
| POST | `/api/v1/admin/job-categories/reorder` | Reorder categories |

### Alumni Routes (Public/Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/jobs` | List published jobs |
| GET | `/api/v1/jobs/{slug}` | Get job details |
| GET | `/api/v1/jobs/categories` | List active categories |
| POST | `/api/v1/jobs/{id}/track-view` | Track job view |
| GET | `/api/v1/jobs/featured` | Get featured jobs |

---

## 📊 Job Posting Fields

### Required Fields
| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Job title |
| `company_name` | string | Company/Organization name |
| `description` | text | Full job description |
| `job_type` | enum | full_time, part_time, contract, internship, temporary |
| `location` | string | Job location |

### Optional Fields
| Field | Type | Description |
|-------|------|-------------|
| `category_id` | foreign key | Job category |
| `company_logo` | string | Path to logo image |
| `experience_level` | enum | entry, mid, senior, executive, any |
| `is_remote` | boolean | Remote work available |
| `contact_person` | string | HR/Contact name |
| `contact_email` | string | Contact email |
| `contact_phone` | string | Contact phone |
| `application_url` | string | External application link |
| `application_instructions` | text | How to apply |
| `salary_range` | string | Salary information |
| `benefits` | text | Job benefits |
| `requirements` | text | Job requirements |
| `qualifications` | text | Required qualifications |
| `application_deadline` | date | Deadline to apply |
| `start_date` | date | Job start date |

---

## 🎨 UI Pages

### Admin Pages

#### 1. Job Management (`/admin/jobs`)
- Table view of all jobs
- Filters: status, category, date range
- Quick actions: publish, close, feature, edit, delete
- Search by title/company
- Bulk actions

#### 2. Create/Edit Job (`/admin/jobs/create`, `/admin/jobs/{id}/edit`)
- Form with all job fields
- Rich text editor for description
- Image upload for company logo
- Preview before publish
- Draft save option

#### 3. Categories (`/admin/job-categories`)
- List of categories
- Drag-and-drop reorder
- Add/Edit/Delete categories
- Icon and color picker

#### 4. Analytics (`/admin/jobs/analytics`)
- Total jobs posted
- Views per job
- Popular categories
- Jobs by status

### Alumni Pages

#### 1. Job Listings (`/alumni/jobs`)
- Grid/List view toggle
- Filters: category, job type, location, remote
- Search bar
- Featured jobs section
- Pagination

#### 2. Job Details (`/alumni/jobs/{slug}`)
- Full job information
- Company details
- Apply button (redirects to external URL)
- Contact information
- Related jobs

---

## 🔧 Default Categories

```php
// Seed data for job categories
$categories = [
    ['name' => 'Information Technology', 'slug' => 'it', 'icon' => 'Monitor', 'color' => '#3B82F6'],
    ['name' => 'Engineering', 'slug' => 'engineering', 'icon' => 'Wrench', 'color' => '#10B981'],
    ['name' => 'Business & Finance', 'slug' => 'business-finance', 'icon' => 'Briefcase', 'color' => '#6366F1'],
    ['name' => 'Education', 'slug' => 'education', 'icon' => 'GraduationCap', 'color' => '#F59E0B'],
    ['name' => 'Healthcare', 'slug' => 'healthcare', 'icon' => 'Heart', 'color' => '#EF4444'],
    ['name' => 'Marketing & Sales', 'slug' => 'marketing-sales', 'icon' => 'TrendingUp', 'color' => '#EC4899'],
    ['name' => 'Arts & Design', 'slug' => 'arts-design', 'icon' => 'Palette', 'color' => '#8B5CF6'],
    ['name' => 'Government', 'slug' => 'government', 'icon' => 'Building', 'color' => '#14B8A6'],
    ['name' => 'Others', 'slug' => 'others', 'icon' => 'MoreHorizontal', 'color' => '#6B7280'],
];
```

---

## ✅ Implementation Checklist

### Phase 1: Database
- [ ] Create job_categories migration
- [ ] Update job_postings migration
- [ ] Create job_views migration
- [ ] Drop old tables migration
- [ ] Run migrations

### Phase 2: Models
- [ ] Update JobPosting model
- [ ] Create JobCategory model
- [ ] Create JobView model
- [ ] Remove JobApplication model
- [ ] Remove SavedJob model

### Phase 3: Backend
- [ ] Admin JobController
- [ ] Admin JobCategoryController
- [ ] Alumni JobController (view only)
- [ ] Job policies

### Phase 4: Routes
- [ ] Admin routes
- [ ] Alumni routes
- [ ] Remove old job routes

### Phase 5: Frontend - Admin
- [ ] Job management page
- [ ] Create job form
- [ ] Edit job form
- [ ] Category management
- [ ] Analytics dashboard

### Phase 6: Frontend - Alumni
- [ ] Job listings page
- [ ] Job detail page
- [ ] Remove old job components

### Phase 7: Seeder
- [ ] Create category seeder
- [ ] Sample jobs (optional)

---

## 📱 Mobile Responsiveness

All pages should be mobile-friendly:
- Job cards stack on mobile
- Filters collapse to dropdown
- Touch-friendly buttons
- Easy-to-read job details

---

## 🔐 Permissions

### Admin Permissions
- `jobs.view` - View job listings
- `jobs.create` - Create job postings
- `jobs.edit` - Edit job postings
- `jobs.delete` - Delete job postings
- `jobs.publish` - Publish/close jobs
- `jobs.categories` - Manage categories

### Alumni Access
- All published jobs visible to authenticated alumni
- No special permissions needed

---

## 📚 Related Documentation

- [Alumni Tracer Master Plan](./ALUMNI_TRACER_MASTER_PLAN.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Messaging System](./MESSAGING_SYSTEM_IMPLEMENTATION.md)
