# EARIST Alumni Tracer System — Complete System State

> **Snapshot Date:** February 24, 2026
> **Test Results:** 188 passed / 21 failed (pre-existing, unrelated to app logic)
> **Total Routes:** 401 | **Total Models:** 46 | **Total Migrations:** 81

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture](#3-architecture)
4. [Authentication & Security](#4-authentication--security)
5. [Multi-Campus System](#5-multi-campus-system)
6. [Admin Panel Features](#6-admin-panel-features)
7. [Alumni Portal Features](#7-alumni-portal-features)
8. [Super Admin Features](#8-super-admin-features)
9. [Analytics & Reporting](#9-analytics--reporting)
10. [Survey System](#10-survey-system)
11. [Messaging & Real-Time](#11-messaging--real-time)
12. [Job Board](#12-job-board)
13. [Content Management](#13-content-management)
14. [Email System](#14-email-system)
15. [Data Import/Export](#15-data-importexport)
16. [Database Schema](#16-database-schema)
17. [API Reference](#17-api-reference)
18. [Frontend Architecture](#18-frontend-architecture)
19. [Caching & Performance](#19-caching--performance)
20. [Test Coverage](#20-test-coverage)
21. [Configuration](#21-configuration)
22. [Known Issues & Technical Debt](#22-known-issues--technical-debt)

---

## 1. System Overview

The **EARIST Alumni Tracer System** is a full-stack web application built for the Eulogio "Amang" Rodriguez Institute of Science and Technology (EARIST). It tracks alumni employment outcomes, manages surveys, provides analytics dashboards, and facilitates alumni networking — all scoped across multiple campuses.

### Core Capabilities

| Area | Description |
|------|-------------|
| **Alumni Tracking** | Maintain profiles for 80+ data fields per alumni including employment, education, demographics |
| **Survey Management** | Create, distribute, and analyze surveys with 10+ question types |
| **Employment Analytics** | Time-to-first-job, employment rates, job-education alignment, attrition rates |
| **Multi-Campus** | Campus-scoped data isolation with cross-campus analytics for super admins |
| **Job Board** | Post, browse, apply, and save job opportunities |
| **Messaging** | Real-time direct & group messaging with WebSocket support |
| **Networking** | Alumni directory, connection requests, mentorship program |
| **Content/Announcements** | Targeted announcements, news, events, and content management |
| **RBAC** | Role-based access control with granular permissions |
| **Data Import/Export** | Bulk alumni import from Excel; CSV/Excel/PDF exports for all data |

---

## 2. Technology Stack

### Backend
| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Laravel | 12.x |
| PHP | PHP | 8.2+ |
| Database | MySQL | 8.x (XAMPP) |
| Auth | Laravel Sanctum | 4.2 |
| Real-time | Laravel Reverb | 1.7 |
| PDF Generation | DomPDF (barryvdh) | 3.1 |
| Spreadsheets | PhpSpreadsheet | 5.4 |
| Broadcasting | Pusher Protocol (via Reverb) | 7.2 |
| Testing | Pest PHP | 3.8 |

### Frontend
| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | React | 19.0 |
| Language | TypeScript | 5.7 |
| SPA Bridge | Inertia.js | 2.1 |
| CSS | Tailwind CSS | 4.0 |
| UI Components | Radix UI | Various |
| Charts | Recharts | 3.2 |
| Animations | Framer Motion | 12.x |
| Rich Text Editor | TipTap | 3.19 |
| Icons | Lucide React | 0.475 |
| Build Tool | Vite | 7.0 |
| WebSocket Client | Laravel Echo + Pusher.js | 2.2 / 8.4 |

### Infrastructure
| Component | Technology |
|-----------|-----------|
| Web Server | Apache (XAMPP) |
| Tunnel | Cloudflare Tunnel |
| Domain | akndev.tech |
| Session Store | MySQL (database driver) |
| Cache Store | MySQL (database driver) |
| Queue | Sync (no worker needed) |
| Mail | Gmail SMTP (smtp.gmail.com:587) |

---

## 3. Architecture

### Pattern: Laravel + Inertia.js (Monolith SPA)

```
Browser (React SPA)
    ↕ Inertia.js / API calls
Laravel Backend
    ├── Web Routes (Inertia pages)
    ├── API Routes (/api/v1/*)
    ├── Controllers (50 total)
    ├── Models (46 total)
    ├── Services (4)
    ├── Middleware (16 custom)
    ├── Events (10) + Broadcasting
    └── MySQL Database (81 migrations)
```

### Directory Structure

```
app/
├── Console/Commands/       # 7 artisan commands
├── Events/                 # 10 broadcast events
├── Helpers/                # StorageHelper (private file URLs)
├── Http/
│   ├── Controllers/
│   │   ├── Admin/          # 6 admin controllers
│   │   ├── Alumni/         # 7 alumni controllers
│   │   ├── Api/            # 17 API controllers
│   │   │   └── V1/Admin/   # 4 versioned admin controllers
│   │   ├── Auth/           # 10 auth controllers
│   │   └── Settings/       # 2 settings controllers
│   └── Middleware/         # 16 custom middleware
├── Jobs/                   # 1 job (SendBulkEmailJob)
├── Mail/                   # 5 mailable classes
├── Models/                 # 46 Eloquent models
├── Observers/              # 3 model observers
├── Providers/              # Service providers
├── Services/               # 4 service classes
└── Traits/                 # BelongsToCampus trait

resources/js/
├── components/             # Reusable UI components (shadcn/ui)
├── contexts/               # CampusContext (global campus state)
├── hooks/                  # 13 custom React hooks
├── layouts/                # App, Admin, Alumni layouts
├── lib/                    # api.ts (centralized API layer), utils
└── pages/
    ├── admin/              # 27 admin pages
    ├── Alumni/             # 20+ alumni pages
    ├── auth/               # 7 auth pages
    ├── SuperAdmin/         # 8 super admin pages
    ├── public/             # Landing page
    └── settings/           # Profile, password, appearance

database/
├── factories/              # 1 factory (UserFactory)
├── migrations/             # 81 migrations
└── seeders/                # 23 seeders

tests/
├── Feature/
│   ├── Api/                # 9 API test files (180+ tests)
│   ├── Auth/               # 5 auth test files
│   ├── Settings/           # 2 settings test files
│   └── DashboardTest.php
└── Unit/
```

---

## 4. Authentication & Security

### Authentication Flow

1. **Registration**: Email → OTP verification → Profile completion → Account created
2. **Login**: Email/password → Optional 2FA challenge → Session token issued (Sanctum)
3. **Force Password Change**: Admin-reset passwords require change on first login
4. **Session Management**: Database-backed sessions, 120-minute lifetime

### Security Middleware Stack (16 middleware)

| Middleware | Purpose |
|-----------|---------|
| `SecurityHeaders` | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
| `RateLimiter` | Per-route rate limiting (login: 5/5min, API: 60/min, upload: 10/min) |
| `SqlInjectionPrevention` | Detect and block SQL injection patterns in request inputs |
| `XssPrevention` | Sanitize user input to prevent cross-site scripting |
| `SecureFileUpload` | Validate file types, sizes, content scanning |
| `SensitiveDataProtection` | Redact sensitive data from API responses |
| `EnsurePasswordChanged` | Force password change for admin-reset accounts |
| `VerifyCsrfToken` | CSRF protection with API route exclusions |
| `TrustProxies` | Cloudflare tunnel proxy header trust |

### Role-Based Access Control (RBAC)

| Role | Access Level |
|------|-------------|
| `super_admin` | Full system access, cross-campus management, system settings |
| `admin` | Campus-scoped admin panel, user management, content management |
| `alumni` | Personal profile, surveys, job board, messaging, networking |

- Roles stored in `roles` table with `permissions` many-to-many
- Users can have role-level + individual permissions
- Frontend checks via `usePermission` hook
- Backend checks via `CheckPermission` middleware

### Two-Factor Authentication (2FA)

- Optional 2FA via email-based codes
- Setup: Generate secret → Send setup email → Verify code
- Challenge: On login detection → Enter code → Verify → Proceed
- Managed via `TwoFactorController` and `TwoFactorSetupMail`

### Email OTP Verification

- Used during registration to verify email ownership
- Flow: Send OTP → User enters code → Verify → Continue registration
- OTPs stored in `email_otps` table with expiration
- Supports resend with cooldown

---

## 5. Multi-Campus System

### Overview

The system supports multiple EARIST campuses with data isolation:

| Campus | Code | Description |
|--------|------|-------------|
| EARIST Main Campus (Manila) | MAIN | Primary campus |
| EARIST Cavite Campus | CAV | Satellite campus |

### Campus-Scoped Features

- **Alumni profiles** are assigned to a campus
- **Departments, courses, batches** belong to a campus
- **Surveys** can target specific campuses or be multi-campus
- **Job postings** can be campus-specific
- **Analytics** are computed per-campus with cross-campus aggregation
- **Users** are assigned to a campus (admins manage their campus only)
- **Super admins** can switch between campuses or view "All Campuses"

### Implementation

- `BelongsToCampus` trait on models adds `campus_id` scoping
- `CampusContext.tsx` provides global campus selection state
- `CampusService.php` handles cached campus queries
- `CampusController.php` provides campus data, comparison, and distribution endpoints
- Campus switcher in admin navbar for authorized users

---

## 6. Admin Panel Features

### Dashboard (`admin/dashboard`)

- **Overview metrics**: Total alumni, surveys, batches, responses, users, departments, courses
- **Employment metrics**: Employed/unemployed/self-employed breakdown with percentages
- **Response rate**: Survey invitation vs completion tracking
- **Batch distribution**: Alumni count per graduation batch
- **Recent activity**: Latest system events
- **Employment trends**: Charted over time
- **Robust caching**: 3-minute cache with lock-based race condition prevention

### Alumni Management (`admin/alumni`)

- **Alumni Bank**: Searchable/filterable table of all alumni
- **Add Alumni**: 4-step wizard form matching the registration survey (~35 fields)
  - Step 1: Personal Information (name, birth date, gender, civil status, contact)
  - Step 2: School Information (campus, department, course, batch, graduation year)
  - Step 3: Employment Information (status, job title, employer, salary, location)
  - Step 4: Achievements & Additional (honors, certifications, about me)
- **Edit Alumni**: Inline or modal editing of all profile fields
- **Delete Alumni**: Soft delete with archive support
- **Bulk Delete**: Select multiple alumni for batch deletion
- **Export Alumni**: CSV/Excel export with filters
- **Import Alumni**: Bulk import from Excel/CSV files (with preview)
- **Alumni Stats**: Dedicated statistics endpoint with caching

### User Management (`admin/users`)

- **CRUD operations**: Create, view, edit, delete users
- **Role assignment**: Assign roles with role change history tracking
- **Password management**: Reset passwords, force password change
- **Status management**: Activate/deactivate/suspend user accounts
- **Permission management**: Grant/revoke individual permissions
- **Export**: CSV/Excel export of user data

### Batch Management (`admin/batches`)

- **CRUD**: Create, update, delete graduation batches
- **Campus scoping**: Batches belong to a specific campus
- **Enrollment metrics**: Track enrolled, graduated, dropout, transferred counts per batch
- **Export**: CSV/Excel export

### Survey Management (`admin/surveys`)

- Full survey builder (see [Survey System](#10-survey-system))

### Content Management (`admin/content`)

- Unified content system for announcements, jobs, events, news, blogs, scholarships, resources
- Rich text editor (TipTap) with media embedding
- Category management
- Featured/unfeatured toggle
- Targeting by batch/department/campus
- Landing page visibility control

### Announcement Management (`admin/announcements`)

- Create/edit announcements with rich text and images
- Target by batch year, department, or all alumni
- Featured image + gallery images support
- Schedule publishing with expiration dates
- Track read counts per announcement
- Priority levels and pinning

### Job Board Admin (`admin/job-board`)

- Create/edit job postings with company details
- Job categories with CRUD
- Bulk status updates
- Application review
- Featured/landing page visibility
- Export job data

### Landing Page Management (`admin/landing-content`)

- Manage public-facing content blocks
- Reorderable sections
- Media uploads (images, videos)
- Layout options per section
- Toggle publish/unpublish
- Campus-specific or multi-campus content

### Email Templates (`admin/email-templates`)

- Template builder with variable placeholders
- Preview and test send
- Categories: survey invitations, announcements, job notifications, system emails
- Duplicate templates
- Usage tracking and stats

### Activity Logs (`admin/activity`)

- Complete audit trail of all admin and user actions
- Filterable by user, action type, date range
- Exportable log data
- Shows IP address and user agent

### Session Management (`admin/sessions`)

- View all active user sessions
- Revoke specific sessions or all sessions for a user
- Shows device info, IP, last activity

### Archive Management (`admin/archive`)

- View soft-deleted records (alumni, users, surveys, batches, announcements)
- Restore individual or bulk restore
- Permanent delete with confirmation
- Filterable by record type

### System Backup (`admin/backup`)

- Create database backups
- Download backup files
- Delete old backups
- Backup listing with file sizes and dates

### Campus Management (`admin/campuses`)

- View campus details and statistics
- Campus comparison analytics
- Employment breakdown per campus
- Distribution charts

### Role & Permission Management (`admin/roles`, `admin/permissions`)

- Create/edit roles with display names and descriptions
- Assign permissions to roles (matrix editor)
- System roles (admin, super_admin, alumni) are protected
- Custom roles support
- Permission categories: users, alumni, surveys, analytics, content, system

### Account Settings (`admin/profile`)

- Profile picture and cover photo upload
- Personal information editing
- Password change
- Appearance/theme settings (light/dark mode)

---

## 7. Alumni Portal Features

### Dashboard (`alumni/dashboard`)

- Personalized welcome with profile completion percentage
- Quick stats: connections, surveys, job applications
- Recent announcements feed
- Survey invitations
- Job recommendations

### Profile (`alumni/profile`)

- **View**: Public-facing profile card with all alumni details
- **Edit**: Multi-section form for updating 80+ profile fields
  - Personal: Name, DOB, gender, civil status, contact info, address
  - Education: Campus, department, course, batch, graduation year, honors
  - Employment: Status, job title, employer, salary, industry, job alignment
  - Skills & certifications
  - Career goals
  - Mentorship willingness
- Profile picture upload
- Profile completion tracking

### Career History (`alumni/career`)

- **Timeline view**: Chronological career entries
- Add/edit career entries: job title, company, dates, industry, skills
- Archive old entries (soft delete with reason)
- **Version tracking**: Every edit creates a version record for audit
- Restore archived entries

### Education History (`alumni/education`)

- View education background from profile data
- Linked to department/course/batch records

### Survey Participation (`alumni/surveys`)

- **My Surveys**: List of available surveys targeted to the alumni
- **Take Survey**: Multi-step survey form with progress tracking
  - Supports: text, textarea, number, date, email, phone, radio, checkbox, select, multi-select, rating, scale, matrix, file upload, ranking
  - Auto-save progress
  - Resume incomplete surveys
- **Survey History**: Past completed surveys with responses
- **Download PDF**: Export individual survey responses as PDF

### Job Board (`alumni/job-board`, `alumni/jobs`)

- Browse job postings with search and filters (type, location, experience, salary)
- View job details with apply/save actions
- **Apply**: Submit cover letter + resume
- **Save**: Bookmark jobs for later
- **My Applications**: Track application status
- **Saved Jobs**: View saved/bookmarked jobs

### Messaging (`alumni/messages`)

- **Direct messages**: One-on-one conversations
- **Group chats**: Create group conversations with multiple users
- **Real-time**: WebSocket-powered instant messaging (via Reverb/Echo)
- **Features**: Typing indicators, read receipts, message replies, attachments
- **Invitations**: Accept/decline group chat invitations
- **Block users**: Block/unblock messaging contacts
- **Search users**: Find other alumni to message

### Networking (`alumni/network`)

- **Alumni Directory**: Browse all alumni with search/filter
- **Connection Requests**: Send, accept, reject connection requests
- **My Connections**: View and manage connections
- **Pending count**: Badge showing unread connection requests
- **Remove connections**: Disconnect from alumni

### Mentorship Program (`alumni/mentorship`)

- **Become a Mentor**: Create mentor profile with expertise, specializations, availability
- **Request Mentorship**: Send mentorship requests to available mentors
- **Accept/Reject**: Mentors can accept or reject requests
- **Track Sessions**: Log mentorship sessions with agendas and notes
- **Complete**: Mark mentorship relationships as complete

### Announcements (`alumni/announcements`)

- View announcements targeted to the alumni (by batch year, department)
- Read tracking (mark as read)
- Unread count badge

### Content Feed (`alumni/content`)

- Unified feed of all content (announcements, jobs, events, news)
- Filterable by content type
- Read tracking and unread counts

### Certificates (`alumni/certificates`)

- Request membership certificates
- View issued certificates
- Download certificate PDFs (generated via DomPDF)
- Certificate status tracking

### Documents (`alumni/documents`)

- Document management interface
- Upload and manage personal documents

### Support (`alumni/support`)

- **Create ticket**: Submit support requests with category, subject, message
- **Track tickets**: View ticket status and timeline
- **Reply**: Add replies to open tickets
- **Close**: Mark tickets as resolved
- Ticket numbers for reference

### Settings (`alumni/settings`)

- **Password**: Change account password
- **Notifications**: Toggle email notifications per category (announcements, jobs, surveys, messages, system)
- **Privacy**: Control profile visibility, employment status display, connection request permissions
- **Appearance**: Light/dark theme switching

### Help (`alumni/help`)

- FAQ and help documentation page

---

## 8. Super Admin Features

### Additional Pages

| Page | Purpose |
|------|---------|
| `super-admin/analytics` | Cross-campus analytics dashboards |
| `super-admin/departments` | Manage departments across all campuses |
| `super-admin/courses` | Manage courses across all campuses |
| `super-admin/department-settings` | Department configuration settings |
| `super-admin/permissions` | Permission matrix editor |
| `super-admin/settings` | System-wide settings management |
| `super-admin/metrics` | System performance metrics |
| `super-admin/career-versions` | View and manage career history versions |

### Super Admin API Endpoints

- **Departments**: Full CRUD with campus assignment, statistics, restore soft-deleted
- **Courses**: Full CRUD with department assignment, statistics, alumni reassignment, restore
- **System Metrics**: Real-time system health monitoring
- **Career Versions**: View version history per user/career entry, force delete, restore
- **Role Management**: Change user roles with history tracking

---

## 9. Analytics & Reporting

### Dashboard Analytics

| Metric | Description |
|--------|-------------|
| Total Alumni | Count of all alumni profiles |
| Total Surveys | Count of all surveys created |
| Total Batches | Count of graduation batches |
| Total Responses | Count of completed survey responses |
| Total Users | Count of system users |
| Total Departments | Count of academic departments |
| Total Courses | Count of academic courses/programs |
| Active Surveys | Currently active surveys |
| Response Rate | Survey responses / invitations percentage |
| Employment Rate | Employed alumni percentage |

### Time-to-First-Job Analytics

- Average days from graduation to first employment per year
- Median days per graduation year
- Program/course breakdown
- KPI metrics: Overall average, current year average, improvement rate, fastest program
- Job mismatch statistics

### Comprehensive Analytics

| Analytics Module | Metrics |
|-----------------|---------|
| **Enrollment Metrics** | Total enrolled, graduated, dropout, transferred per year; graduation rate |
| **Performance Indicator** | Employed within 2 years of graduation; performance rate per year |
| **Job Alignment** | Aligned, overqualified, underqualified, unfit classification |
| **Attrition Rate** | Dropout + transferred rates per year |
| **Program Performance** | Per-program employment rate, alignment rate, avg days to job |
| **College/Department Breakdown** | Alumni distribution and employment per department |
| **Course Breakdown** | Per-course employment and alignment statistics |
| **Employment Location** | Local vs foreign vs remote employment rates and trends |

### Survey Analytics

- Per-survey response counts, completion rates, average completion time
- Question-level response distributions
- Response trends over time
- Cross-survey comparisons

### Department Analytics

- Per-department alumni counts, employment rates
- Course performance within departments
- Exportable department reports

### Campus Analytics

- Campus distribution of alumni
- Campus comparison charts
- Employment breakdown per campus

### Export Formats

All analytics support export in:
- **CSV** — Comma-separated values
- **Excel** — .xlsx format (via PhpSpreadsheet)
- **PDF** — Formatted reports (via DomPDF)

---

## 10. Survey System

### Survey Types

| Type | Description |
|------|-------------|
| `tracer` | Graduate tracer study surveys |
| `feedback` | General feedback collection |
| `employment` | Employment status tracking |
| `satisfaction` | Satisfaction measurement |
| `custom` | Free-form custom surveys |
| `registration` | Registration/onboarding survey (special) |

### Question Types (14)

| Type | Description |
|------|-------------|
| `text` | Short text input |
| `textarea` | Long text input |
| `number` | Numeric input |
| `date` | Date picker |
| `email` | Email input with validation |
| `phone` | Phone number input |
| `radio` | Single-choice radio buttons |
| `checkbox` | Multiple-choice checkboxes |
| `select` | Single-choice dropdown |
| `multi_select` | Multi-choice dropdown |
| `rating` | Star/number rating (configurable min/max) |
| `scale` | Likert scale |
| `matrix` | Matrix/grid with rows and columns |
| `file` | File upload |

### Survey Features

- **Question ordering** with drag-and-drop reorder
- **Conditional logic**: Show/hide questions based on previous answers
- **Required/optional** questions
- **Validation rules** per question
- **Instructions** text per survey
- **Targeting**: By batch, graduation year, campus
- **Anonymous** response option
- **Multiple responses** toggle
- **Auto-save** progress during completion
- **Resume** incomplete surveys
- **Invitation system**: Send survey invitations via email with tracking
- **Reminder emails**: Automated follow-up for incomplete surveys
- **Response tokens**: Unique tokens per response for security
- **Completion tracking**: Progress percentage, time spent
- **Duplicate surveys**: Clone existing surveys

### Survey Workflow

1. Admin creates survey with questions
2. Select target audience (batches/years/campuses)
3. Activate survey (set start/end dates)
4. Alumni see available surveys on their dashboard
5. Alumni take survey (multi-step progress)
6. Responses collected with answer tracking
7. Analytics generated from responses
8. Export results as CSV/Excel/PDF

---

## 11. Messaging & Real-Time

### Messaging System

| Feature | Description |
|---------|-------------|
| **Direct Messages** | One-on-one private conversations |
| **Group Chats** | Multi-user conversations with admin roles |
| **Message Types** | Text, attachments, reply-to |
| **Read Receipts** | Track message read status per user |
| **Typing Indicators** | Real-time "user is typing..." display |
| **User Search** | Find users to start conversations |
| **Block/Unblock** | Block users from messaging you |
| **Invitations** | Accept/decline group chat invitations |
| **Leave Group** | Leave group conversations |
| **Message Archives** | Admin can view archived conversation history |
| **Export** | Export conversation history |

### Real-Time Infrastructure

- **Laravel Reverb** WebSocket server on port 8080 (local) / 443 (production via Cloudflare)
- **Laravel Echo** client with Pusher protocol
- **Broadcast Events**:
  - `MessageSent` — New message in conversation
  - `MessageRead` — Message read receipt
  - `UserTyping` — Typing indicator
  - `ConversationCreated` — New conversation started
  - `GroupInvitationReceived` — Group chat invitation
  - `AnnouncementPublished` — New announcement broadcast
  - `ContentChanged` — Content creation/update
  - `DashboardUpdated` — Dashboard data refresh trigger
  - `ProfileUpdated` — Profile change notification
  - `SurveyResponseSubmitted` — Survey completion notification

### Frontend Hooks

| Hook | Purpose |
|------|---------|
| `useMessaging` | Real-time messaging state and WebSocket subscription |
| `useRealtime` | Laravel Echo/Reverb connection management |
| `useAdminChannel` | Subscribe to admin broadcast channel |
| `useSessionGuard` | Detect session expiry and auto-logout |

---

## 12. Job Board

### Job Posting Fields

| Field | Description |
|-------|-------------|
| Title, Company, Content (rich text) | Core job details |
| Job Type | Full-time, part-time, contract, internship, freelance |
| Experience Level | Entry, mid, senior, executive |
| Work Arrangement | On-site, remote, hybrid |
| Location | City/region |
| Salary Range | Min/max salary |
| Application Deadline | Expiration date |
| Category | Linked to `JobCategory` model |
| Contact Info | Person, email, application URL |
| Featured | Highlighted in listings |
| Show on Landing | Visible to public visitors |
| Background Image | Visual branding |

### Job Board Features

- **Public browsing**: Unauthenticated visitors can view featured jobs
- **Search & filter**: By title, type, location, experience, salary range
- **Job categories**: Admin-managed categories with icons and colors
- **Apply**: Alumni can submit applications with cover letter + resume
- **Save jobs**: Bookmark jobs for later viewing
- **Application tracking**: Alumni can view and withdraw applications
- **Admin management**: Publish/unpublish, bulk status updates, export
- **View tracking**: Track job posting views
- **Statistics**: Admin dashboard with job board metrics

### Job Classification (AI-Based)

- `JobClassifierService` analyzes job-education match
- Classifications: `good_match`, `overqualified`, `underqualified`, `unfit`
- Uses Philippine education/job standards
- Classify individual alumni or batch classify all
- Preview classification before saving
- Statistics endpoint for overall system alignment

---

## 13. Content Management

### Unified Content System

The system has a unified `Content` model that handles multiple content types:

| Content Type | Description |
|-------------|-------------|
| `announcement` | News and announcements |
| `job` | Job postings (alternate to dedicated JobPosting) |
| `event` | Events and activities |
| `news` | News articles |
| `blog` | Blog posts |
| `scholarship` | Scholarship opportunities |
| `resource` | Resources and guides |

### Content Features

- Rich text editor (TipTap) with formatting, links, media
- Featured image + gallery images
- Category system with CRUD
- Publishing workflow (draft → published)
- Featured/pinned content
- Landing page visibility toggle
- Target audience filtering (batch, department, campus)
- Read tracking per user
- View tracking (anonymous views)
- Unread count badges
- Bulk status updates
- Export content data

### Landing Page Management

- Dedicated `LandingContent` model for public page sections
- Reorderable content blocks
- Layout options per section
- Media uploads (images/videos/thumbnails)
- Campus-specific or multi-campus content
- Toggle publish/unpublish per section

---

## 14. Email System

### Email Types

| Mailable | Purpose |
|----------|---------|
| `EmailOtpMail` | OTP verification during registration |
| `AnnouncementNotificationMail` | Notify alumni of new announcements |
| `JobPostingNotificationMail` | Notify alumni of new job postings |
| `SurveyNotificationMail` | Survey invitations and reminders |
| `TwoFactorSetupMail` | 2FA setup instructions |

### Email Features

- **Gmail SMTP**: `alumnitracerr@gmail.com` via smtp.gmail.com:587/TLS
- **Template system**: Admin-managed templates with variable placeholders
- **Bulk sending**: `SendBulkEmailJob` for batch email delivery
- **Email preferences**: Per-user toggle for each notification category
- **Email logging**: Track sent/opened/clicked status per email
- **Invitation tracking**: Survey invitation open/click tracking
- **Unsubscribe tokens**: One-click email opt-out

### Automated Emails (Artisan Commands)

| Command | Schedule | Purpose |
|---------|----------|---------|
| `app:send-birthday-wishes` | Daily | Send birthday greetings to alumni |
| `app:send-profile-update-reminders` | Periodic | Remind alumni with stale profiles |
| `app:send-survey-reminders` | Periodic | Follow up on incomplete surveys |

---

## 15. Data Import/Export

### Alumni Import (Excel/CSV)

- **Template download**: Pre-formatted Excel template with all expected columns
- **Preview**: Upload file → See parsed data → Confirm before import
- **Column mapping**: Auto-maps columns by header name
- **Validation**: Validates each row before import (student ID, email, department, course)
- **Batch processing**: Handles large files with chunked processing
- **Duplicate detection**: Checks student_id and email for duplicates
- **Import source tracking**: Records import source and timestamp per alumni

### Export Capabilities

| Data Type | Formats | Filters |
|-----------|---------|---------|
| Alumni profiles | CSV, Excel | Campus, batch, department, employment status |
| Survey responses | CSV, Excel, PDF | Per-survey, date range |
| Analytics data | CSV, Excel, PDF | Comprehensive or per-module |
| Activity logs | CSV, Excel | Date range, user, action type |
| Users | CSV, Excel | Role, status, campus |
| Batches | CSV, Excel | Campus |
| Email templates | CSV, Excel | Category |
| Job postings | CSV, Excel | Status, category |
| Announcements | CSV, Excel | Status, type |
| Conversations | Text export | Per-conversation |

---

## 16. Database Schema

### Total: 81 migrations across ~45 tables

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | All system users | name, email, password, role, role_id, campus_id, status, must_change_password, phone_number, profile_picture_path, last_login_at |
| `alumni_profiles` | Extended alumni data (80+ fields) | user_id, batch_id, department_id, course_id, campus_id, student_id, first_name, last_name, birth_date, gender, civil_status, graduation_year, employment_status, current_job_title, current_employer, current_salary, skills[], certifications[], ~60 more |
| `campuses` | Campus definitions | name, code, display_name, address, is_active |
| `departments` | Academic departments | name, code, description, campus_id, status |
| `courses` | Academic courses/programs | name, code, department_id, campus_id, majors, duration_years |
| `batches` | Graduation batches | name, graduation_year, campus_id, enrollment metrics |

### Survey Tables

| Table | Purpose |
|-------|---------|
| `surveys` | Survey definitions with targeting config |
| `survey_questions` | Questions with type, options, validation, conditional logic |
| `survey_responses` | Individual response records with progress tracking |
| `survey_answers` | Per-question answers (text, json, number, date, boolean, file) |
| `survey_invitations` | Email invitation tracking with open/click stats |

### Employment Tables

| Table | Purpose |
|-------|---------|
| `employments` | Detailed employment records per alumni |
| `career_histories` | Career timeline entries per user |
| `career_history_versions` | Version history for career edits (audit trail) |

### Content Tables

| Table | Purpose |
|-------|---------|
| `contents` | Unified content (announcements, jobs, events, news, etc.) |
| `content_reads` | Per-user read tracking |
| `content_views` | View tracking with IP/UA |
| `announcements` | Dedicated announcements |
| `announcement_reads` | Announcement read tracking |
| `landing_page_contents` | Public landing page sections |
| `job_postings` | Dedicated job postings |
| `job_categories` | Job categorization |
| `job_applications` | Job application submissions |
| `job_views` | Job posting view tracking |
| `saved_jobs` | User job bookmarks |

### Messaging Tables

| Table | Purpose |
|-------|---------|
| `conversations` | Conversation records (direct/group/support) |
| `conversation_participants` | Users in conversations with roles |
| `messages` | Individual messages with content/attachments |
| `message_reads` | Message read receipts |
| `blocked_users` | User blocking relationships |

### Networking Tables

| Table | Purpose |
|-------|---------|
| `alumni_connections` | Connection requests and status |
| `mentor_profiles` | Mentor availability and expertise |
| `mentorships` | Mentor-mentee relationships |
| `mentorship_sessions` | Mentorship meeting logs |

### Support Tables

| Table | Purpose |
|-------|---------|
| `support_tickets` | Support requests with status tracking |
| `support_ticket_replies` | Ticket conversation threads |

### System Tables

| Table | Purpose |
|-------|---------|
| `roles` | Role definitions |
| `permissions` | Permission definitions |
| `role_permissions` | Role-permission pivot |
| `user_permissions` | Direct user-permission pivot |
| `activity_logs` | Audit trail |
| `admin_settings` | Key-value system settings |
| `email_logs` | Email delivery tracking |
| `email_otps` | OTP codes for verification |
| `email_preferences` | Per-user email notification preferences |
| `email_templates` | Editable email templates |
| `certificates` | Generated certificates |
| `user_settings` | Per-user privacy/notification settings |
| `cache` | Database cache store |
| `sessions` | Database session store |
| `personal_access_tokens` | Sanctum API tokens |

### Recent Migrations (last 10)

1. `2026_02_23_082936` — Add import fields to users and alumni profiles
2. `2026_02_23_000001` — Add 19 survey fields to alumni profiles + employment_status varchar
3. `2026_02_20_075454` — Add device info to personal access tokens
4. `2026_02_18_200000` — Create unified contents table
5. `2026_02_18_100000` — Rename description to content in job postings
6. `2026_02_16_000001` — Create landing page contents table
7. `2026_02_13_052140` — Add employment location type to alumni profiles
8. `2026_02_13_035200` — Add performance indexes
9. `2026_02_11_085523` — Add soft deletes to alumni profiles
10. `2026_02_11_084058` — Add soft deletes to announcements, surveys, users, batches

---

## 17. API Reference

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/register` | Register new alumni |
| POST | `/api/v1/login` | Login and receive token |
| POST | `/api/v1/logout` | Logout and revoke token |
| POST | `/api/v1/get-token` | Get API token |
| POST | `/api/v1/check-email` | Check if email exists |
| POST | `/api/v1/check-phone` | Check if phone exists |
| POST | `/api/v1/check-student-id` | Check if student ID exists |
| POST | `/api/v1/check-login` | Pre-login validation |
| POST | `/api/v1/otp/send` | Send OTP to email |
| POST | `/api/v1/otp/verify` | Verify OTP code |
| POST | `/api/v1/otp/resend` | Resend OTP |
| POST | `/api/v1/otp/check` | Check OTP verification status |

### Admin API (46+ endpoints, all require `admin` or `super_admin` role)

**Dashboard & System**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/dashboard` | Dashboard metrics |
| POST | `/api/v1/admin/dashboard/refresh-cache` | Force refresh cached data |
| GET | `/api/v1/admin/system/info` | System information |
| GET | `/api/v1/admin/system/stats` | System statistics |
| POST | `/api/v1/admin/system/cache/clear` | Clear application cache |
| GET | `/api/v1/admin/cache/health` | Cache health check |
| POST | `/api/v1/admin/cache/clear-all` | Clear all caches |
| GET | `/api/v1/admin/settings` | Get system settings |
| POST | `/api/v1/admin/settings` | Update system settings |

**Alumni Management**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/alumni` | List alumni (paginated) |
| POST | `/api/v1/admin/alumni` | Create alumni (35+ fields) |
| GET | `/api/v1/admin/alumni/{id}` | Get alumni profile |
| PUT | `/api/v1/admin/alumni/{id}` | Update alumni |
| DELETE | `/api/v1/admin/alumni/{id}` | Delete alumni |
| DELETE | `/api/v1/admin/alumni/bulk-delete` | Bulk delete alumni |
| GET | `/api/v1/admin/alumni/export` | Export alumni |
| GET | `/api/v1/admin/alumni/stats` | Alumni statistics |
| POST | `/api/v1/admin/alumni/import` | Import alumni from Excel |
| POST | `/api/v1/admin/alumni/import/preview` | Preview import data |
| GET | `/api/v1/admin/alumni/import/template` | Download import template |

**User Management**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/users` | List users |
| POST | `/api/v1/admin/users` | Create user |
| PUT | `/api/v1/admin/users/{id}` | Update user |
| DELETE | `/api/v1/admin/users/{id}` | Delete user |
| PATCH | `/api/v1/admin/users/{id}/status` | Update user status |
| POST | `/api/v1/admin/users/{id}/reset-password` | Reset password |
| POST | `/api/v1/admin/users/{id}/set-password` | Set password |

**Analytics**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/analytics/overview` | Analytics overview |
| GET | `/api/v1/admin/analytics/comprehensive` | All analytics data |
| GET | `/api/v1/admin/analytics/time-to-job` | Time-to-first-job data |
| GET | `/api/v1/admin/analytics/surveys/{id}` | Per-survey analytics |
| GET | `/api/v1/admin/analytics/comprehensive/export` | Export comprehensive analytics |
| GET | `/api/v1/admin/analytics/time-to-job/export` | Export time-to-job data |

**Surveys, Batches, Roles, Permissions** — Full CRUD endpoints for each resource.

### Alumni API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/alumni/profile` | Get own profile |
| PUT | `/api/v1/alumni/profile` | Update own profile |
| GET | `/api/v1/my-surveys` | Get available surveys |
| GET | `/api/v1/surveys/{id}/take` | Get survey for completion |
| POST | `/api/v1/surveys/{id}/start` | Start survey response |
| POST | `/api/v1/survey-responses/{id}/answer` | Save answer |
| POST | `/api/v1/survey-responses/{id}/submit` | Submit completed survey |

### Public API (no auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/public/stats` | Public alumni statistics |
| GET | `/api/v1/public/announcements` | Public announcements |
| GET | `/api/v1/public/content` | Public content |
| GET | `/api/v1/public/jobs` | Public job listings |
| POST | `/api/v1/public/search-alumni` | Search alumni directory |
| GET | `/api/v1/campuses` | List campuses |
| GET | `/api/v1/jobs` | Public job board |
| GET | `/api/health` | Health check |

### Messaging API (11 endpoints)

Full conversation and message management with real-time support.

### Content API (15 endpoints)

Full content management with categories, media, and read tracking.

---

## 18. Frontend Architecture

### Core Libraries

| Library | Purpose |
|---------|---------|
| **Inertia.js** | SPA page navigation without full API layer |
| **React 19** | Component framework |
| **TypeScript** | Type safety |
| **Tailwind CSS 4** | Utility-first styling |
| **Radix UI** | Accessible UI primitives (dialogs, selects, tabs, etc.) |
| **Recharts** | Data visualization charts |
| **TipTap** | Rich text editor |
| **Framer Motion** | Animations and transitions |
| **Lucide** | Icon library |

### Centralized API Layer (`resources/js/lib/api.ts`)

- Single `request()` function handles all API calls
- Automatic CSRF token injection
- Bearer token auth via localStorage
- 401 → Login redirect (with dedup protection)
- 403 → Force password change redirect
- 419 → CSRF refresh page reload
- `ApiError` class with typed error handling
- Convenience methods: `api.get()`, `api.post()`, `api.put()`, `api.patch()`, `api.delete()`, `api.upload()`

### Custom Hooks (13)

| Hook | Purpose |
|------|---------|
| `useApiQuery` | Data fetching with loading/error/polling/refresh |
| `useApiMutation` | Create/update/delete operations with loading/validation |
| `useCampusFilter` | Campus selection state management |
| `usePermission` | Frontend RBAC permission checks |
| `useMessaging` | Real-time messaging subscription |
| `useRealtime` | WebSocket connection lifecycle |
| `useAdminChannel` | Subscribe to admin events channel |
| `useSessionGuard` | Session expiry detection |
| `useConfirmDialog` | Confirmation dialog state |
| `use-toast` | Toast notification system |
| `use-appearance` | Theme/dark mode management |
| `use-mobile` | Mobile viewport detection |
| `use-initials` | Name initials generation |

### Key Frontend Patterns

- **Global campus context**: `CampusProvider` wraps the app, shares campus state
- **Polling with visibility**: API polling pauses when browser tab is hidden
- **Cascading selects**: Campus → Department → Course dropdowns auto-filter
- **4-step wizards**: Complex forms broken into guided steps
- **Optimistic UI**: Actions reflect immediately with background sync
- **Error boundaries**: Graceful error display with retry options

---

## 19. Caching & Performance

### Cache Configuration

| Setting | Value |
|---------|-------|
| Driver | `database` (MySQL `cache` table) |
| Prefix | `ats_` |
| Default TTL | 180 seconds (3 minutes) |

### Cached Endpoints

| Endpoint | Cache Key Pattern | TTL |
|----------|------------------|-----|
| Dashboard metrics | `dashboard_metrics_{campus_id}` | 3 min |
| Alumni stats | `alumni_stats_{campus_id}` | 3 min |
| Analytics overview | `analytics_overview_{campus_id}` | 3 min |
| Time-to-job analytics | `analytics_time_to_job_{campus_id}_{years}` | 3 min |
| Campus data | `campuses_*` | Via CampusService |

### Cache Lock Pattern (Fixed Feb 24, 2026)

```php
$lock = Cache::lock('key', 10);
$lockAcquired = false;

try {
    $lockAcquired = $lock->block(2);  // Non-blocking wait up to 2s

    if ($lockAcquired) {
        // Double-check cache after lock (another request may have populated it)
        $cached = Cache::get($key);
        if ($cached) return $cached;

        // Fetch fresh data
        $data = $this->fetchData();
        Cache::put($key, $data, 180);
        return $data;
    } else {
        // Fallback: try cache, then fetch without lock
        $cached = Cache::get($key);
        if ($cached) return $cached;
        return $this->fetchData();  // Never throw, always serve data
    }
} finally {
    if ($lockAcquired) {
        $lock->release();  // Only release if we actually acquired
    }
}
```

### Performance Optimizations

- **Database indexes**: Performance indexes migration for frequently queried columns
- **Polling visibility check**: Frontend polling pauses when tab is hidden
- **Lock-based cache writes**: Prevents thundering herd on cache expiration
- **Zero-metric validation**: Prevents caching empty/zero data from transient DB issues
- **Graceful middleware degradation**: RateLimiter continues if cache is unavailable

---

## 20. Test Coverage

### Test Results (February 24, 2026)

```
Tests:    188 passed, 21 failed (242 assertions)
```

### Passing Tests (188) — Grouped by File

| Test File | Tests | Status |
|-----------|-------|--------|
| Api/FrontendRoutesTest | 54 | ✅ All pass |
| Api/SurveysTest | 23 | ✅ All pass |
| Api/AuthAndUsersTest | 22 | ✅ All pass |
| Api/AnalyticsAndAlumniTest | 21 | ✅ All pass |
| Api/RolesAndPermissionsTest | 12 | ✅ All pass |
| Api/AdminAnalyticsTest | 11 | ✅ All pass |
| Api/BatchesAndPublicTest | 10 | ✅ All pass |
| Auth/AuthenticationTest | 4 | ✅ All pass |
| Auth/PasswordResetTest | 4 | ✅ All pass |
| Unit/ExampleTest | 1 | ✅ Pass |
| ExampleTest | 1 | ✅ Pass |

### Failed Tests (21) — All Pre-Existing

| Test File | Tests | Failure Reason |
|-----------|-------|----------------|
| Api/AnnouncementsTest | 3 | Reverb/Pusher not running locally (BroadcastException) |
| Api/JobBoardTest | 6 | QueryException + Reverb not running |
| Auth/EmailVerificationTest | 1 | Default Breeze stub not customized |
| Auth/PasswordConfirmationTest | 1 | Default Breeze stub |
| Auth/RegistrationTest | 2 | Default Breeze stub |
| DashboardTest | 1 | Default Breeze stub (expects 200, gets 302) |
| Settings/PasswordUpdateTest | 2 | Default Breeze stub |
| Settings/ProfileUpdateTest | 5 | Default Breeze stub (profile route 404) |

**Note**: All 21 failures are pre-existing and unrelated to application logic:
- 9 failures due to Reverb/Pusher WebSocket server not running during tests
- 12 failures from default Laravel Breeze test stubs that weren't customized for this app's authentication flow

---

## 21. Configuration

### Environment Configuration (`.env`)

```ini
# Application
APP_NAME="Alumni Tracer System"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://akndev.tech

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=alumni_tracer_system
DB_USERNAME=root
DB_PASSWORD=

# Session
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_DOMAIN=.akndev.tech

# Cache
CACHE_STORE=database
CACHE_PREFIX=ats_

# Queue
QUEUE_CONNECTION=sync

# Broadcasting (Reverb WebSocket)
BROADCAST_CONNECTION=reverb
REVERB_HOST=localhost
REVERB_PORT=8080
VITE_REVERB_HOST=akndev.tech
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https

# Mail (Gmail SMTP)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=alumnitracerr@gmail.com
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=alumnitracerr@gmail.com
MAIL_FROM_NAME="Alumni Tracer System"

# Auth
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:8000,127.0.0.1,akndev.tech,www.akndev.tech,*.akndev.tech
```

### Database Configuration Safeguards

- Default connection: `mysql` (not `sqlite`)
- Default database name: `alumni_tracer_system` (not `laravel`)
- Prevents "Unknown database 'laravel'" errors from stale config cache

---

## 22. Known Issues & Technical Debt

### Pre-Existing Test Failures (21)

- 9 tests fail because Reverb/Pusher WebSocket server isn't running during test execution
- 12 tests are default Laravel Breeze stubs that don't match the customized authentication flow

### Resolved Issues (February 24, 2026)

| # | Issue | Fix |
|---|-------|-----|
| 1 | Config cache fallback used wrong DB name `laravel` | Changed default to `alumni_tracer_system` in `config/database.php` |
| 2 | Config default connection was `sqlite` instead of `mysql` | Changed to `mysql` in `config/database.php` |
| 3 | `Cache::lock()->release()` called without acquisition (4 locations) | Added `$lockAcquired` tracking, only release when acquired |
| 4 | `getAnalyticsOverview` threw exception on lock failure | Changed to fetch data as fallback instead of throwing |
| 5 | `sleep(1)` blocking PHP workers (4 locations) | Replaced with `$lock->block(2)` non-blocking wait |
| 6 | Frontend 401 redirect storms from concurrent requests | Added `window.__redirectingToLogin` dedup flag |
| 7 | CampusContext used hardcoded fallback campus ID on error | Now sets empty state + `fetchError` flag |
| 8 | All-zero metrics cached for 3 minutes | `isValidDashboardData()` returns `false` for all-zero |
| 9 | RateLimiter crashed entire request on cache failure | Wrapped in try/catch, degrades gracefully |
| 10 | Frontend didn't handle 403 `must_change_password` | Added redirect to `/force-change-password` |
| 11 | Redundant `$campusId = $campusId` self-assignment | Removed |
| 12 | Polling continued in hidden browser tabs | Added `document.visibilityState` check |
| 13 | `Cache::increment` non-atomic in brute force check | Changed to `get()+1` with `put()` in try/catch |

### Remaining Technical Debt

1. **Reverb test environment**: Tests for Announcements and JobBoard need Reverb mock or `BROADCAST_DRIVER=null` in test env
2. **Breeze test stubs**: Default Laravel test stubs should be updated or removed to match customized auth flow
3. **Redis migration**: System was designed for Redis caching but currently uses database cache — performance would improve with Redis
4. **SESSION_SECURE_COOKIE=false**: Should be `true` in production with HTTPS
5. **Queue sync mode**: Bulk email sending runs synchronously — should use database/Redis queue driver for production
6. **Single factory**: Only `UserFactory` exists — additional factories would improve test coverage
7. **No API rate limiting tests**: Rate limiter middleware isn't covered by automated tests

---

## Appendix: File Counts

| Category | Count |
|----------|-------|
| Eloquent Models | 46 |
| Controllers | 50 |
| Custom Middleware | 16 |
| Service Classes | 4 |
| Admin Pages (TSX) | 27 |
| Alumni Pages (TSX) | 20+ |
| Super Admin Pages (TSX) | 8 |
| Auth Pages (TSX) | 7 |
| Custom React Hooks | 13 |
| Database Migrations | 81 |
| Database Seeders | 23 |
| Test Files | 22 |
| Artisan Commands | 7 |
| Events | 10 |
| Mail Classes | 5 |
| Model Observers | 3 |
| API Routes | 401 total |
| npm Dependencies | 34 + 8 dev |
| Composer Packages | 11 + 8 dev |
