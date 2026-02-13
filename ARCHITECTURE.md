# Alumni Tracer System — Architecture Documentation

> **Last Updated:** February 11, 2026  
> **Stack:** Laravel 11 + React 18 + TypeScript + Inertia.js + MySQL  
> **Deployment:** XAMPP (local), Cloudflare Tunnel (production)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Directory Structure](#3-directory-structure)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [Database Schema](#5-database-schema)
6. [API Endpoints](#6-api-endpoints)
7. [Frontend Pages](#7-frontend-pages)
8. [Controllers](#8-controllers)
9. [Middleware](#9-middleware)
10. [Services](#10-services)
11. [Security Architecture](#11-security-architecture)
12. [Data Flow](#12-data-flow)

---

## 1. System Overview

The Alumni Tracer System is a comprehensive platform for tracking graduate employment outcomes, managing surveys, facilitating alumni networking, and administering institutional data across multiple campuses.

### Key Features

| Module | Description |
|--------|-------------|
| **Alumni Management** | Profile CRUD, employment tracking, career history versioning |
| **Survey System** | Survey builder, question types (13 types), response tracking, analytics |
| **Job Board** | Job posting CRUD, categories, featured/public listings |
| **Announcements** | Targeted announcements (by batch/department), featured images |
| **Messaging** | Direct & group conversations, typing indicators, read receipts |
| **Analytics** | Employment analytics, time-to-job, survey analytics, department-level |
| **Role Management** | RBAC with 95 permissions, 3 system roles, custom roles |
| **Mentorship** | Mentor profiles, mentorship requests, session tracking |
| **Networking** | Alumni directory, connection requests, blocking |
| **Support** | Ticketing system with priority, assignment, replies |
| **Certificates** | Auto-generated certificates (survey completion, membership) |
| **Multi-Campus** | Campus scoping, cross-campus comparison, campus-specific data |
| **Email Templates** | Template management, bulk sending, preview, usage tracking |
| **Backups** | Database backup creation, download, deletion |

### User Roles

| Role | Access Level |
|------|-------------|
| `super_admin` | Full system access — departments, courses, system settings, metrics, career versions |
| `admin` | Alumni management, surveys, analytics, users, job board, announcements, backups |
| `alumni` | Personal profile, surveys, job board, networking, mentorship, support tickets |

---

## 2. Technology Stack

### Backend
| Component | Technology |
|-----------|-----------|
| Framework | Laravel 11.x (PHP 8.2+) |
| Database | MySQL 8.0 (`alumni_tracer_system`) |
| Auth | Laravel Sanctum (API tokens) + Session (web routes) |
| ORM | Eloquent with relationships, scopes, observers |
| Queue | Sync (configurable to Redis/database) |
| Mail | SMTP via Laravel Mail (array driver in testing) |
| Cache | File-based (array in testing) |
| File Storage | Local disk (`storage/app/public/uploads/`) |

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | React 18 with TypeScript |
| SSR Bridge | Inertia.js (server-side routing, client-side rendering) |
| Build Tool | Vite |
| UI Library | Shadcn/UI (Radix primitives + Tailwind CSS) |
| Charts | Recharts |
| Icons | Lucide React |
| State | React hooks + Inertia shared data |
| Forms | Inertia `useForm` hook |

### Infrastructure
| Component | Technology |
|-----------|-----------|
| Web Server | Apache (XAMPP) |
| Tunnel | Cloudflare Tunnel (HTTP/2 protocol) |
| PHP Version | 8.2+ |
| Node.js | 18+ (for Vite build) |
| Package Managers | Composer (PHP), npm (JS) |

---

## 3. Directory Structure

```
├── app/
│   ├── Console/                    # Artisan commands
│   ├── Events/                     # Event classes (MessageSent, etc.)
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/              # Admin web controllers (Department, Course, Career, Metrics, Role)
│   │   │   ├── Alumni/             # Alumni web controllers (Career, Profile, Settings, Network, Job, Mentorship, Support)
│   │   │   ├── Api/                # API controllers (Admin, Auth, Survey, Messaging, Announcement, JobBoard, Campus, Certificate, EmailOtp, Upload, JobClassifier, PublicLanding)
│   │   │   │   └── V1/             # Versioned API (Profile, Analytics, Appearance, BulkOperations, DepartmentAppearance)
│   │   │   ├── Auth/               # Auth controllers (Login, Register, Password Reset, Email Verify, 2FA)
│   │   │   └── Settings/           # Settings controllers (Profile, Password)
│   │   └── Middleware/             # 14 middleware classes (auth guards, security, CSRF, Inertia)
│   ├── Jobs/                       # Queue jobs
│   ├── Mail/                       # Mailable classes
│   ├── Models/                     # 42 Eloquent models
│   ├── Observers/                  # Model observers (CareerHistoryObserver)
│   ├── Providers/                  # Service providers
│   ├── Services/                   # Business logic (Campus, Security, JobClassifier, EmailNotification)
│   └── Traits/                     # Shared traits (BelongsToCampus)
├── bootstrap/
│   └── app.php                     # Middleware registration, exception handling
├── config/                         # Laravel configuration files + security.php
├── database/
│   ├── factories/                  # Model factories
│   ├── migrations/                 # 71 migration files
│   └── seeders/                    # 20 seeder classes
├── docs/                           # Feature documentation (50+ files)
├── public/                         # Web root (built assets in build/)
├── resources/
│   └── js/
│       ├── components/             # React components
│       │   ├── base/               # Layout components (AdminBaseLayout, AlumniBaseLayout)
│       │   └── ui/                 # Shadcn/UI components
│       ├── hooks/                  # Custom React hooks
│       ├── layouts/                # Layout wrappers
│       ├── lib/                    # Utilities (utils.ts)
│       ├── pages/                  # 56 page components
│       │   ├── admin/              # Admin pages (Dashboard, Analytics, Alumni, Surveys, Jobs, etc.)
│       │   ├── Alumni/             # Alumni pages (Dashboard, Profile, Surveys, Career, Jobs, etc.)
│       │   ├── auth/               # Auth pages (Login, Register, Password Reset, 2FA)
│       │   ├── public/             # Public pages (LandingPage)
│       │   ├── settings/           # Settings pages (Profile, Password, Appearance)
│       │   ├── shared/             # Shared pages (ProfileSettings)
│       │   └── SuperAdmin/         # Super admin pages (Departments, Courses, Permissions, Settings, Metrics)
│       └── types/                  # TypeScript type definitions
├── routes/
│   ├── api.php                     # API routes (~150+ endpoints)
│   ├── web.php                     # Web routes (Inertia page routes)
│   ├── auth.php                    # Authentication routes
│   └── settings.php                # Settings routes
├── tests/
│   ├── Feature/                    # Feature tests (Auth, Settings, Dashboard)
│   └── Unit/                       # Unit tests
├── phpunit.xml                     # PHPUnit config (SQLite in-memory)
├── vite.config.ts                  # Vite build configuration
└── composer.json / package.json    # Dependencies
```

---

## 4. Authentication & Authorization

### Auth Flow

1. **Web Login:** `POST /login` → Session-based auth → CSRF token → Inertia pages
2. **API Login:** `POST /api/v1/login` → Sanctum token → Bearer token for API calls
3. **Registration:** Email OTP verification → Account creation → Alumni profile auto-created
4. **2FA:** Google Authenticator support (currently disabled/optional)

### Authorization Layers

| Layer | Mechanism | Description |
|-------|-----------|-------------|
| **Role Guard** | `admin`, `alumni`, `super_admin` middleware | Checks `user.role` enum column |
| **Permission Check** | `permission` middleware / `$user->hasPermission()` | Checks `user_permissions` + role's `permission_role` |
| **Route Groups** | Middleware stacks on route groups | Combines auth + role + optional permission |
| **CSRF** | `VerifyCsrfToken` middleware | Exempts API auth endpoints, OTP, public routes |

### Permission System

- **95 permissions** across 11 categories: Dashboard, Users, Alumni, Batches, Surveys, Analytics, System, Roles, Departments, Courses, Email Templates
- **3 system roles** (non-deletable): Super Admin (all 95), Admin (subset), Alumni (minimal)
- **Custom roles** can be created with any permission combination
- **Dual storage:** `users.role` (enum) for middleware checks + `users.role_id` (FK) for permission resolution

---

## 5. Database Schema

**~45 tables** organized into 16 domains. Full schema details in [docs/DATABASE_SCHEMA_COMPLETE.md](docs/DATABASE_SCHEMA_COMPLETE.md).

### Domain Summary

| Domain | Tables | Key Tables |
|--------|--------|------------|
| **Infrastructure** | 5 | `cache`, `jobs`, `sessions`, `personal_access_tokens`, `failed_jobs` |
| **Auth & Users** | 3 | `users`, `password_reset_tokens`, `email_otps` |
| **Campus & Academic** | 4 | `campuses`, `departments`, `courses`, `batches` |
| **Alumni & Employment** | 4 | `alumni_profiles`, `employments`, `career_history`, `career_history_versions` |
| **Surveys** | 4 | `surveys`, `survey_questions`, `survey_responses`, `survey_answers`, `survey_invitations` |
| **Job Board** | 3 | `job_categories`, `job_postings`, `job_views` |
| **Messaging** | 4 | `conversations`, `conversation_participants`, `messages`, `message_reads` |
| **Announcements** | 2 | `announcements`, `announcement_reads` |
| **Mentorship** | 3 | `mentor_profiles`, `mentorships`, `mentorship_sessions` |
| **Networking** | 2 | `alumni_connections`, `blocked_users` |
| **RBAC** | 4 | `roles`, `permissions`, `permission_role`, `user_permissions` |
| **Email** | 4 | `email_templates`, `email_preferences`, `email_logs`, `email_batches` |
| **Security & Audit** | 7 | `security_logs`, `blocked_ips`, `audit_logs`, `login_attempts`, `password_history`, `session_logs`, `data_access_logs`, `security_configurations` |
| **Settings** | 3 | `admin_settings`, `user_settings`, `system_appearance_settings` |
| **Support** | 2 | `support_tickets`, `support_ticket_replies` |
| **Certificates** | 1 | `certificates` |

### Key Relationships

```
Campus ──┬── Users ──┬── AlumniProfile ── Employments
         │           ├── CareerHistory ── CareerHistoryVersions
         │           ├── SurveyResponses ── SurveyAnswers
         │           ├── Conversations (M:N) ── Messages ── MessageReads
         │           ├── Connections (self M:N)
         │           ├── MentorProfile
         │           ├── Mentorships (as mentor/mentee)
         │           ├── SupportTickets ── Replies
         │           └── Certificates
         ├── Departments ── Courses
         ├── Batches ── SurveyInvitations
         ├── Surveys ── Questions ── Answers
         ├── JobPostings ── JobViews
         └── Announcements ── AnnouncementReads

Roles (M:N) ── Permissions
Users ──── Roles (FK)
Users (M:N) ── Permissions (user_permissions)
```

---

## 6. API Endpoints

**~230 routes total** across 4 route files. Base URL: `/api/v1/`

### Public Endpoints (no auth required)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/public/announcements` | Landing page announcements |
| GET | `/api/v1/public/jobs` | Landing page job listings |
| GET | `/api/v1/public/stats` | Public statistics (alumni count, employment rate) |
| POST | `/api/v1/public/search-alumni` | Public alumni search |
| GET | `/api/v1/public/appearance` | System appearance settings |
| POST | `/api/v1/register` | User registration |
| POST | `/api/v1/login` | User login (returns Sanctum token) |
| POST | `/api/v1/otp/send` | Send email OTP |
| POST | `/api/v1/otp/verify` | Verify OTP code |
| POST | `/api/v1/otp/resend` | Resend OTP |
| POST | `/api/v1/otp/check` | Check verification status |
| POST | `/api/v1/check-email` | Check email availability |
| POST | `/api/v1/check-student-id` | Check student ID availability |
| POST | `/api/v1/check-login` | Validate login credentials |
| GET | `/api/v1/jobs` | Public job listings with filters |
| GET | `/api/v1/jobs/categories` | Job categories |
| GET | `/api/v1/jobs/featured` | Featured jobs |
| GET | `/api/v1/jobs/recent` | Recent jobs |
| GET | `/api/v1/jobs/{id}` | Job details |
| GET | `/api/v1/campuses` | Campus list |
| GET | `/api/v1/campuses/options` | Campus dropdown options |
| GET | `/api/v1/admin/departments/active` | Active departments |
| GET | `/api/v1/surveys/{survey}` | Survey details (public) |
| POST | `/api/v1/surveys/{survey}/start` | Start survey response |
| POST | `/api/v1/surveys/{survey}/answer` | Submit answer |
| POST | `/api/v1/surveys/{survey}/complete` | Complete survey |
| GET | `/api/v1/surveys/{survey}/progress` | Survey progress |
| GET | `/api/health` | Health check |

### Authenticated Endpoints (`auth:sanctum`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/logout` | Logout (revoke tokens) |
| GET | `/api/v1/profile` | Current user profile |
| POST | `/api/v1/get-token` | Get/refresh API token |
| GET | `/api/v1/my-surveys` | User's available surveys |
| GET | `/api/v1/my-responses` | User's survey responses |
| GET | `/api/v1/survey-response/{token}/download` | Download response PDF |
| GET/POST | `/api/v1/surveys/{id}/take`, `/start` | Take/start survey |
| POST | `/api/v1/survey-responses/{id}/answer`, `/submit` | Answer/submit survey |
| GET | `/api/v1/campuses/{id}` | Campus details |
| GET | `/api/v1/campuses/{id}/statistics` | Campus statistics |
| GET | `/api/v1/campuses/{id}/comparison` | Campus comparison |
| GET | `/api/v1/campuses/{id}/employment-breakdown` | Campus employment |
| GET | `/api/v1/campuses/{id}/distribution` | Alumni distribution |
| POST | `/api/v1/campuses/{id}/switch` | Switch campus |
| GET/POST/DELETE | `/api/v1/certificates/*` | Certificate CRUD |
| GET/POST | `/api/v1/messaging/*` | Full messaging API (15 endpoints) |
| GET/POST | `/api/v1/announcements/*` | Announcement viewing + admin CRUD (9 endpoints) |
| GET/POST | `/api/v1/profile/*` | Profile management (5 endpoints) |
| POST | `/api/v1/upload/image` | General image upload |
| DELETE | `/api/v1/upload/image` | Delete uploaded image |

### Alumni Endpoints (`auth:sanctum` + `alumni`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/alumni/profile` | Alumni profile data |
| PUT | `/api/v1/alumni/profile` | Update alumni profile |
| PUT | `/api/v1/alumni/profile/department-course` | Update department/course |

### Admin Endpoints (`auth` + `admin`)

| Category | Endpoints | Count |
|----------|-----------|-------|
| **Dashboard** | `GET /admin/dashboard` | 1 |
| **Upload** | `POST /admin/upload/image` | 1 |
| **Appearance** | `GET/POST /admin/appearance/*` | 4 |
| **Alumni** | `GET/PUT/DELETE /admin/alumni/*` | 7 |
| **Surveys** | `GET/POST/PUT/DELETE /admin/surveys/*` | 10 |
| **Survey Questions** | `POST/PUT/DELETE /admin/surveys/{id}/questions/*` | 4 |
| **Analytics** | `GET /admin/analytics/*` | 8 |
| **Job Classifier** | `POST /admin/jobs/classify/*` | 4 |
| **Batches** | `GET/POST/PUT/DELETE /admin/batches/*` | 4 |
| **Activity Logs** | `GET /admin/activity-logs/*` | 2 |
| **System Metrics** | `GET /admin/system-metrics` | 1 |
| **Users** | `GET/POST/PUT/PATCH/DELETE /admin/users/*` | 7 |
| **Roles** | `GET/POST/PUT/DELETE /admin/roles/*` | 5 |
| **Permissions** | `GET/PUT /admin/permissions/*` | 5 |
| **Email Templates** | `GET/POST/PUT/DELETE /admin/email-templates/*` | 8 |
| **Settings** | `GET/POST /admin/settings/*` | 4 |
| **Backups** | `GET/POST/DELETE /admin/backups/*` | 4 |
| **Bulk Operations** | `POST /admin/bulk/*` | 4 |
| **Job Board Admin** | `GET/POST/PUT/DELETE /admin/jobs/*` | 10 |
| **Campuses** | `POST/PUT/DELETE /admin/campuses/*` | 3 |
| **Department Appearance** | `GET/POST /admin/department-appearance/*` | 4 |

### Super Admin Endpoints (`auth` + `super_admin`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST/PUT/DELETE | `/admin/super-admin/departments/*` | Department CRUD (7 endpoints) |
| GET/POST/PUT/DELETE | `/admin/super-admin/courses/*` | Course CRUD (7 endpoints) |
| GET/POST/DELETE | `/admin/super-admin/career-versions/*` | Career version management (5 endpoints) |

### Alumni Web Routes (Inertia)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST/PUT/DELETE | `/alumni/career/*` | Career timeline CRUD |
| GET/POST | `/alumni/support/*` | Support tickets |
| GET/POST/PUT/DELETE | `/alumni/jobs/*` | Job browsing, applications |
| GET/POST | `/alumni/network/*` | Alumni directory, connections |
| GET/POST | `/alumni/mentorship/*` | Mentorship program |

---

## 7. Frontend Pages

### Page Inventory (56 files)

#### Public (2 pages)
| Page | Route | Description |
|------|-------|-------------|
| `public/LandingPage.tsx` | `/` | Public landing with stats, announcements, jobs |
| `auth/login.tsx` | `/login` | Login form |

#### Auth (6 pages)
| Page | Route | Description |
|------|-------|-------------|
| `auth/login.tsx` | `/login` | Login with email/password |
| `auth/forgot-password.tsx` | `/forgot-password` | Password reset request |
| `auth/reset-password.tsx` | `/reset-password/{token}` | Password reset form |
| `auth/TwoFactorChallenge.tsx` | `/two-factor-challenge` | 2FA verification |
| `auth/TwoFactorSetup.tsx` | `/two-factor/setup` | 2FA setup (disabled) |

#### Admin (22 pages)
| Page | Route | Description |
|------|-------|-------------|
| `admin/Dashboard.tsx` | `/admin/dashboard` | Stats overview, recent activity |
| `admin/Analytics.tsx` | `/admin/analytics` | Employment & time-to-job charts |
| `admin/AlumniBank.tsx` | `/admin/alumni` | Alumni CRUD, export, stats |
| `admin/Batches.tsx` | `/admin/batches` | Batch year management |
| `admin/SurveyBank.tsx` | `/admin/surveys` | Survey listing & management |
| `admin/CreateSurvey.tsx` | `/admin/surveys/create` | Survey builder |
| `admin/SurveyAnalytics.tsx` | `/admin/survey-analytics` | Survey response analytics |
| `admin/UserManagement.tsx` | `/admin/users` | User CRUD, status, password |
| `admin/RoleManagement.tsx` | `/admin/roles` | Role listing, create/edit/delete |
| `admin/RoleForm.tsx` | `/admin/roles/create`, `/{id}/edit` | Role form with permissions |
| `admin/RoleView.tsx` | `/admin/roles/{id}` | Role detail view |
| `admin/ActivityLogs.tsx` | `/admin/activity` | Audit log viewer |
| `admin/EmailTemplates.tsx` | `/admin/email-templates` | Email template listing |
| `admin/TemplateForm.tsx` | `/admin/email-templates/create`, `/{id}/edit` | Template editor |
| `admin/TemplateView.tsx` | `/admin/email-templates/{id}` | Template preview |
| `admin/Backup.tsx` | `/admin/backup` | Backup management |
| `admin/JobBoard.tsx` | `/admin/job-board` | Job posting management (card grid) |
| `admin/Announcements.tsx` | `/admin/announcements` | Announcement CRUD (card grid) |
| `admin/Messages.tsx` | `/admin/messages` | Admin messaging |
| `admin/CampusManagement.tsx` | `/admin/campuses` | Multi-campus management |

#### Super Admin (8 pages)
| Page | Route | Description |
|------|-------|-------------|
| `SuperAdmin/DepartmentManagement.tsx` | `/super-admin/departments` | Department CRUD |
| `SuperAdmin/DepartmentDashboard.tsx` | `/super-admin/departments/{id}` | Department analytics |
| `SuperAdmin/DepartmentSettings.tsx` | `/super-admin/department-settings` | Department appearance |
| `SuperAdmin/CourseManagement.tsx` | `/super-admin/courses` | Course/program CRUD |
| `SuperAdmin/PermissionMatrix.tsx` | `/super-admin/permissions` | Permission matrix |
| `SuperAdmin/Analytics.tsx` | `/super-admin/analytics` | System-wide analytics |
| `SuperAdmin/SystemMetrics.tsx` | `/super-admin/metrics` | Performance metrics |
| `SuperAdmin/ImprovedSystemSettings.tsx` | `/super-admin/settings` | System settings |

#### Alumni (22 pages)
| Page | Route | Description |
|------|-------|-------------|
| `Alumni/Dashboard.tsx` | `/alumni/dashboard` | Personal dashboard |
| `Alumni/Profile/View.tsx` | `/alumni/profile` | Profile view |
| `Alumni/Profile/Edit.tsx` | `/alumni/profile/edit` | Profile editor |
| `Alumni/Surveys/MySurveys.tsx` | `/alumni/surveys` | Available surveys |
| `Alumni/Surveys/SurveyHistory.tsx` | `/alumni/surveys/history` | Past responses |
| `Alumni/Surveys/TakeSurvey.tsx` | `/alumni/surveys/{id}/take` | Survey interface |
| `Alumni/SurveyRegistration.tsx` | `/survey/register` | Public survey registration |
| `Alumni/Certificates.tsx` | `/alumni/certificates` | View/download certificates |
| `Alumni/Career/Timeline.tsx` | `/alumni/career` | Career timeline |
| `Alumni/Career/Archived.tsx` | `/alumni/career/archived` | Archived careers |
| `Alumni/Jobs.tsx` | `/alumni/jobs` | Job listings (Inertia) |
| `Alumni/JobBoard.tsx` | `/alumni/job-board` | Job board (API-based) |
| `Alumni/SavedJobs.tsx` | `/alumni/jobs/saved` | Saved jobs |
| `Alumni/MyApplications.tsx` | `/alumni/jobs/applications` | Job applications |
| `Alumni/Network/AlumniDirectory.tsx` | `/alumni/network` | Alumni directory |
| `Alumni/Network/MyConnections.tsx` | `/alumni/connections` | Connections |
| `Alumni/Messages.tsx` | `/alumni/messages` | Messaging |
| `Alumni/Announcements.tsx` | `/alumni/announcements` | Announcements |
| `Alumni/Mentorship.tsx` | `/alumni/mentorship` | Mentorship program |
| `Alumni/Support/Index.tsx` | `/alumni/support` | Support tickets |
| `Alumni/Support/Show.tsx` | `/alumni/support/{ticketNumber}` | Ticket detail |
| `Alumni/Help.tsx` | `/alumni/help` | Help & FAQ |

---

## 8. Controllers

### Controller Summary (30 files, ~280 methods)

| Controller | Methods | Domain |
|-----------|---------|--------|
| `Api\AdminController` | 65 | Core admin (alumni, surveys, batches, users, roles, permissions, templates, settings, backups) |
| `Api\AuthController` | 11 | Registration, login, logout, profile, validation checks |
| `Api\SurveyController` | 12 | Survey taking, responses, progress |
| `Api\MessagingController` | 15 | Conversations, messages, blocking, invitations |
| `Api\AnnouncementController` | 9 | Announcement CRUD, read tracking |
| `Api\JobBoardController` | 14 | Job posting CRUD, categories, statistics |
| `Api\CampusController` | 14 | Campus CRUD, statistics, comparison |
| `Api\CertificateController` | 5 | Certificate listing, download, request |
| `Api\EmailOtpController` | 4 | OTP send, verify, resend, check |
| `Api\JobClassifierController` | 5 | Job classification (rule-based AI) |
| `Api\UploadController` | 2 | Image upload/delete |
| `Api\PublicLandingController` | 4 | Public data (stats, search) |
| `Api\V1\ProfileController` | 5 | Profile management |
| `Api\V1\Admin\AnalyticsController` | 8 | Employment & survey analytics |
| `Api\V1\Admin\AppearanceController` | 4 | System appearance |
| `Api\V1\Admin\DepartmentAppearanceController` | 4 | Department appearance |
| `Api\V1\Admin\BulkOperationsController` | 4 | Bulk delete/restore/export/status |
| `Admin\DepartmentController` | 13 | Department CRUD, analytics |
| `Admin\CourseController` | 8 | Course CRUD, reassignment |
| `Admin\RoleManagementController` | 3 | User role changes, history |
| `Admin\CareerVersionController` | 5 | Career version audit trail |
| `Admin\SystemMetricsController` | 1 | Server performance |
| `Alumni\CareerController` | 6 | Career timeline CRUD |
| `Alumni\ProfileController` | 1 | Alumni profile update |
| `Alumni\SettingsController` | 4 | Password, notifications, privacy |
| `Alumni\NetworkController` | 9 | Connections, directory |
| `Alumni\JobController` | 11 | Job browsing, applications, saves |
| `Alumni\MentorshipController` | 9 | Mentor profiles, mentorships |
| `Alumni\SupportController` | 5 | Support tickets |
| Auth controllers (7 files) | ~15 | Login, register, password, email, 2FA |

---

## 9. Middleware

### Custom Middleware (14 files)

| Middleware | Alias | Purpose |
|-----------|-------|---------|
| `AdminMiddleware` | `admin` | Allows `super_admin` or `admin` roles |
| `AlumniMiddleware` | `alumni` | Allows `alumni` role only |
| `SuperAdminMiddleware` | `super_admin` | Allows `super_admin` role only |
| `CheckPermission` | `permission` | Checks specific permission by name |
| `SecurityHeaders` | `security.headers` | CSP, HSTS, X-Frame-Options, no-cache |
| `RateLimiter` | `security.rate_limit` | Per-route rate limiting (login: 5/5min, API: 60/min) |
| `SqlInjectionPrevention` | `security.sql_injection` | SQL injection pattern detection |
| `XssPrevention` | `security.xss` | XSS pattern detection & sanitization |
| `SecureFileUpload` | `security.file_upload` | MIME validation, extension blocking, size limits |
| `SensitiveDataProtection` | `security.sensitive_data` | PII masking in logs |
| `HandleAppearance` | — | Shares theme/branding with all views |
| `HandleInertiaRequests` | — | Shares auth, flash, sidebar, quotes with Inertia |
| `TrustProxies` | — | Proxy header forwarding |
| `VerifyCsrfToken` | — | CSRF with exemptions for API/OTP routes |

### Middleware Stack (bootstrap/app.php)

```
Web: SecurityHeaders → SensitiveDataProtection → HandleAppearance → HandleInertiaRequests → AddLinkHeaders
API: SecurityHeaders → EnsureFrontendRequestsAreStateful (Sanctum)
```

---

## 10. Services

### Business Logic Services (4 classes, 44 methods)

| Service | Methods | Purpose |
|---------|---------|---------|
| `CampusService` | 16 | Campus CRUD, statistics, comparison, caching, scoping |
| `SecurityService` | 12 | Security logging, IP blocking, password validation, encryption, audit trail |
| `JobClassifierService` | 4 | Rule-based job classification from title/industry |
| `EmailNotificationService` | 12 | Template-based email sending, bulk operations, previews |

---

## 11. Security Architecture

### Defense Layers

1. **Rate Limiting:** Per-route with brute force detection (5 login attempts/5min, 60 API calls/min)
2. **SQL Injection Prevention:** Input scanning for injection patterns (UNION, DROP, etc.)
3. **XSS Prevention:** Pattern detection, HTML sanitization, event handler blocking
4. **File Upload Security:** MIME type validation, dangerous extension blocking, 10MB limit, content scanning
5. **CSRF Protection:** Token validation with strategic exemptions
6. **Security Headers:** CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy
7. **Sensitive Data Protection:** PII masking in logs, credential stripping
8. **Audit Logging:** 7 security/audit tables tracking logins, data access, sessions, password changes

### Security Tables

| Table | Purpose |
|-------|---------|
| `security_logs` | Security events with severity levels |
| `blocked_ips` | IP blocklist with expiration |
| `audit_logs` | Entity change tracking (old/new values) |
| `login_attempts` | Login success/failure tracking |
| `password_history` | Password reuse prevention |
| `session_logs` | Active session tracking with device info |
| `data_access_logs` | Data access audit trail |
| `security_configurations` | Runtime security settings |

---

## 12. Data Flow

### Request Lifecycle

```
Browser → Apache → public/index.php → Laravel Bootstrap
  → Global Middleware (Security Headers, Sensitive Data)
  → Route Middleware (auth, admin/alumni/super_admin, permission)
  → Controller Method
  → Service Layer (if applicable)
  → Eloquent Model → MySQL
  → Response (JSON for API, Inertia for Web)
```

### Inertia.js Flow

```
1. Browser requests GET /admin/dashboard
2. Laravel route matches → middleware runs (web, auth, admin)
3. Controller returns Inertia::render('admin/Dashboard', $props)
4. HandleInertiaRequests middleware adds shared data (auth, flash, etc.)
5. First visit: full HTML page with embedded props
6. Subsequent: XHR returns JSON props only (SPA-like navigation)
7. React renders the page component with received props
```

### API Flow

```
1. Frontend makes axios/fetch call to /api/v1/admin/alumni
2. Sanctum validates auth:sanctum token
3. Admin middleware checks user role
4. AdminController@getAlumni() runs
5. Eloquent query with filters/pagination
6. JSON response returned
7. React component updates state with response data
```

### File Upload Flow

```
1. Frontend: File selected → POST /api/v1/upload/image (FormData)
2. SecureFileUpload middleware validates MIME type & size
3. UploadController@uploadImage() stores to storage/app/public/uploads/
4. Returns URL: /storage/uploads/{filename}
5. Frontend saves URL in form data
6. On form submit, URL stored in DB column (e.g., poster_image, featured_image)
```

---

## Statistics Summary

| Metric | Count |
|--------|-------|
| Database Tables | ~45 |
| Eloquent Models | 42 |
| Migration Files | 71 |
| Seeders | 20 |
| API Endpoints | ~150+ |
| Total Routes | ~230 |
| Frontend Pages | 56 |
| Controller Files | 30 |
| Controller Methods | ~280 |
| Middleware Files | 14 |
| Service Classes | 4 |
| Permissions | 95 |
| User Roles | 3 (system) + custom |
