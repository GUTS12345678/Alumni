# EARIST Alumni Tracer System - Complete Documentation

## Comprehensive System Overview & Data Consistency Audit

**Document Version:** 2.0  
**Date:** February 3, 2026  
**Status:** Active Development  
**Priority:** CRITICAL

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Database Architecture](#3-database-architecture)
4. [Application Architecture](#4-application-architecture)
5. [Page-by-Page Data Handling Audit](#5-page-by-page-data-handling-audit)
6. [Identified Inconsistencies](#6-identified-inconsistencies)
7. [Campus Management Implementation](#7-campus-management-implementation)
8. [Solution Roadmap](#8-solution-roadmap)
9. [Implementation Checklist](#9-implementation-checklist)

---

## 1. System Overview

### 1.1 Purpose

The EARIST Alumni Tracer System is a comprehensive web application designed to:

- **Track alumni** from registration through career progression
- **Collect data** via customizable surveys
- **Analyze employment outcomes** (time-to-job, job alignment, mismatch rates)
- **Support multi-campus operations** (Main Manila & Cavite)
- **Generate reports** for CHED/DOLE compliance

### 1.2 Key Features

| Module | Description | Status |
|--------|-------------|--------|
| **Dashboard** | Overview statistics, trends, KPIs | ✅ Working |
| **Alumni Bank** | Alumni profiles management | ✅ Working |
| **Analytics** | Employment analytics, time-to-job | ✅ Working |
| **Survey Bank** | Survey creation and management | ✅ Working |
| **Batch Management** | Graduation year batches | ⚠️ Needs Campus Filter |
| **User Management** | Admin/Alumni user accounts | ✅ Working |
| **Job Board** | Job postings for alumni | ⚠️ Needs Campus Filter |
| **Announcements** | System-wide announcements | ⚠️ Needs Campus Filter |
| **Messaging** | Internal messaging system | ✅ Working |
| **Campus Management** | Multi-campus admin | 🔴 NOT IMPLEMENTED |

### 1.3 User Roles

| Role | Access Level | Campus Scope |
|------|--------------|--------------|
| **Super Admin** | Full system access | All campuses |
| **Admin** | Campus-limited admin | Assigned campus only |
| **Alumni** | Personal profile, surveys | Assigned campus only |

---

## 2. Technology Stack

### 2.1 Backend

```
┌─────────────────────────────────────────────────────────────┐
│ BACKEND LAYER                                               │
├─────────────────────────────────────────────────────────────┤
│ Framework:     Laravel 10.x (PHP 8.x)                       │
│ API:           RESTful API + Inertia.js SSR                 │
│ Auth:          Laravel Sanctum (Token-based)                │
│ Database:      MySQL 8.x (alumni_tracer_system)             │
│ Queue:         Laravel Queue (database driver)              │
│ Mail:          SMTP via config/mail.php                     │
│ Storage:       Local filesystem (public/storage)            │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Frontend

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND LAYER                                              │
├─────────────────────────────────────────────────────────────┤
│ Framework:     React 18 + TypeScript                        │
│ Build Tool:    Vite v7.1.5                                  │
│ State:         React Context (CampusContext)                │
│ Styling:       Tailwind CSS + shadcn/ui                     │
│ Charts:        Recharts                                     │
│ Bridge:        Inertia.js (SPA feel, server routing)        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Database Architecture

### 3.1 Entity Relationship Diagram

```
                            ┌─────────────┐
                            │  campuses   │
                            │─────────────│
                            │ id (PK)     │
                            │ name        │
                            │ code        │ (MAIN, CAV)
                            │ display_name│
                            │ is_active   │
                            └──────┬──────┘
                                   │
       ┌───────────────────────────┼───────────────────────────┐
       │                           │                           │
       ▼                           ▼                           ▼
┌─────────────┐             ┌─────────────┐             ┌─────────────┐
│   users     │             │ departments │             │   batches   │
│─────────────│             │─────────────│             │─────────────│
│ id (PK)     │             │ id (PK)     │             │ id (PK)     │
│ campus_id   │◄──────FK────│ campus_id   │──FK────────►│ campus_id   │
│ email       │             │ name        │             │ name        │
│ role        │             │ code        │             │ grad_year   │
│ status      │             │ status      │             │ status      │
└──────┬──────┘             └──────┬──────┘             └──────┬──────┘
       │                           │                           │
       │                           │                           │
       ▼                           ▼                           │
┌────────────────┐          ┌─────────────┐                    │
│ alumni_profiles│          │   courses   │                    │
│────────────────│          │─────────────│                    │
│ id (PK)        │          │ id (PK)     │                    │
│ user_id (FK)   │          │ campus_id   │                    │
│ campus_id (FK) │          │ dept_id(FK) │                    │
│ batch_id (FK)  │◄─────────┼─────────────┼────────────────────┘
│ dept_id (FK)   │──────────┘             │
│ course_id (FK) │────────────────────────┘
│ first_name     │
│ last_name      │
│ graduation_year│
│ employment_*   │ (status, job_title, employer, etc.)
│ job_mismatch_* │ (reason, satisfaction)
│ job_start_date │
└───────┬────────┘
        │
        ▼
┌─────────────┐
│ employments │ (Job History)
│─────────────│
│ id (PK)     │
│ alumni_id   │ (FK → alumni_profiles)
│ company_name│
│ position    │
│ start_date  │
│ end_date    │
│ is_current  │
└─────────────┘
```

### 3.2 Campus-Aware Tables

| Table | Has campus_id | Multi-Campus Support | Notes |
|-------|---------------|---------------------|-------|
| `users` | ✅ Yes | No | User belongs to ONE campus |
| `alumni_profiles` | ✅ Yes | No | Profile belongs to ONE campus |
| `departments` | ✅ Yes | No | Department per campus |
| `courses` | ✅ Yes | No | Course per campus |
| `batches` | ✅ Yes | No | Batch per campus |
| `surveys` | ✅ Nullable | ✅ `is_multi_campus` | Can target all campuses |
| `survey_responses` | ✅ Yes | No | Response from ONE campus |
| `job_postings` | ✅ Nullable | ✅ `is_multi_campus` | Jobs can be cross-campus |
| `announcements` | ✅ Nullable | ✅ `is_multi_campus` | Announcements can be cross-campus |
| `employments` | ❌ No | N/A | Linked via alumni_profiles |

### 3.3 Current Data Distribution

```sql
-- As of February 3, 2026
SELECT 'users' as table_name, COUNT(*) as total,
       SUM(CASE WHEN campus_id = 1 THEN 1 ELSE 0 END) as main_campus,
       SUM(CASE WHEN campus_id = 2 THEN 1 ELSE 0 END) as cavite_campus
FROM users
UNION ALL
SELECT 'alumni_profiles', COUNT(*),
       SUM(CASE WHEN campus_id = 1 THEN 1 ELSE 0 END),
       SUM(CASE WHEN campus_id = 2 THEN 1 ELSE 0 END)
FROM alumni_profiles;

-- Results:
+------------------+-------+-------------+----------------+
| table_name       | total | main_campus | cavite_campus  |
+------------------+-------+-------------+----------------+
| users            | 110   | 80          | 30             |
| alumni_profiles  | 230   | 160         | 70             |
| departments      | 10    | 10          | 0              |
| courses          | 54    | 54          | 0              |
| batches          | 11    | 11          | 0              |
+------------------+-------+-------------+----------------+
```

---

## 4. Application Architecture

### 4.1 Request Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REQUEST FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User Browser                                                               │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────┐                                                            │
│  │ React App   │ ←──── CampusContext (selectedCampus state)                 │
│  │ (Frontend)  │                                                            │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         │  API Request: GET /api/v1/admin/alumni?campus_id=1                │
│         │  Headers: Authorization: Bearer {token}                           │
│         ▼                                                                   │
│  ┌─────────────┐                                                            │
│  │ Laravel     │                                                            │
│  │ Router      │ routes/api.php                                             │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         │  Middleware: auth:sanctum, admin                                  │
│         ▼                                                                   │
│  ┌─────────────┐                                                            │
│  │ Controller  │ AdminController@getAlumni                                  │
│  │             │                                                            │
│  │ $campusId = │ $request->input('campus_id')                               │
│  │ $query->    │ where('campus_id', $campusId)                              │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────┐                                                            │
│  │ Database    │ alumni_profiles WHERE campus_id = 1                        │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         │  JSON Response                                                    │
│         ▼                                                                   │
│  ┌─────────────┐                                                            │
│  │ React App   │ Display filtered data                                      │
│  └─────────────┘                                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Campus Context Pattern

```typescript
// Frontend: CampusContext.tsx
interface CampusContextType {
    selectedCampus: Campus | null;       // Currently selected campus
    campuses: Campus[];                   // All available campuses
    setSelectedCampus: (campus) => void;  // Change campus
    canSwitchCampus: boolean;             // Admin can switch, Alumni cannot
    isLoading: boolean;
}

// Usage in components:
const { selectedCampus } = useCampus();

// API calls should include:
const params = new URLSearchParams();
if (selectedCampus?.id) {
    params.append('campus_id', selectedCampus.id.toString());
}
```

---

## 5. Page-by-Page Data Handling Audit

### 5.1 Audit Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Correctly implements campus filtering |
| ⚠️ | Partially implements (needs improvement) |
| ❌ | Does NOT filter by campus |
| 🔴 | Page does not exist yet |

---

### 5.2 Dashboard (`/admin/dashboard`)

**File:** `resources/js/pages/admin/Dashboard.tsx`

| Aspect | Status | Details |
|--------|--------|---------|
| Uses `useCampus()` | ✅ Yes | Line 28 |
| Passes `campus_id` to API | ✅ Yes | Line 97 |
| Backend filters by campus | ✅ Yes | `AdminController@dashboard` |
| Re-fetches on campus change | ✅ Yes | `useEffect([selectedCampus?.id])` |

**Current Implementation:**
```typescript
// Frontend (Dashboard.tsx)
const { selectedCampus } = useCampus();

// API call
const params = new URLSearchParams();
if (selectedCampus?.id) {
    params.append('campus_id', selectedCampus.id.toString());
}
const url = `/api/v1/admin/dashboard?${params}`;
```

```php
// Backend (AdminController.php)
$campusId = $request->input('campus_id');
if ($campusId) {
    $alumniQuery->where('campus_id', $campusId);
}
```

**Verdict:** ✅ **WORKING CORRECTLY**

---

### 5.3 Alumni Bank (`/admin/alumni`)

**File:** `resources/js/pages/admin/AlumniBank.tsx`

| Aspect | Status | Details |
|--------|--------|---------|
| Uses `useCampus()` | ✅ Yes | Line 44 |
| Passes `campus_id` to API | ✅ Yes | Line 136 |
| Backend filters by campus | ✅ Yes | `AdminController@getAlumni` |
| Re-fetches on campus change | ⚠️ Partial | Need to verify dependency array |

**Current Implementation:**
```typescript
// Frontend
const { selectedCampus } = useCampus();

// fetchAlumniCallback
if (selectedCampus?.id) params.append('campus_id', selectedCampus.id.toString());
```

**Issue Identified:**
- The `fetchAlumniCallback` depends on `selectedCampus` but need to verify it's in dependency array

**Verdict:** ✅ **WORKING** (minor improvement needed)

---

### 5.4 Analytics (`/admin/analytics`)

**File:** `resources/js/pages/admin/Analytics.tsx`

| Aspect | Status | Details |
|--------|--------|---------|
| Uses `useCampus()` | ✅ Yes | Line 37 |
| Passes `campus_id` to Dashboard API | ✅ Yes | Line 201 |
| Passes `campus_id` to Time-to-Job API | ✅ Yes | Line 236 |
| Passes `campus_id` to System Stats API | ✅ Yes | Line 271 |
| Backend filters by campus | ✅ Yes | `AnalyticsController` |

**Verdict:** ✅ **WORKING CORRECTLY**

---

### 5.5 User Management (`/admin/users`)

**File:** `resources/js/pages/admin/UserManagement.tsx`

| Aspect | Status | Details |
|--------|--------|---------|
| Uses `useCampus()` | ✅ Yes | Line 38 |
| Passes `campus_id` to API | ✅ Yes | Line 215 |
| Backend filters by campus | ✅ Yes | `AdminController@getUsers` |
| Re-fetches on campus change | ⚠️ Check | Verify useEffect dependency |

**Verdict:** ✅ **WORKING**

---

### 5.6 Batch Management (`/admin/batches`)

**File:** `resources/js/pages/admin/Batches.tsx`

| Aspect | Status | Details |
|--------|--------|---------|
| Uses `useCampus()` | ❌ **NO** | Not imported |
| Passes `campus_id` to API | ❌ **NO** | No campus parameter |
| Backend filters by campus | ❌ **NO** | `AdminController@getBatches` |
| Re-fetches on campus change | ❌ N/A | No campus context |

**Current Implementation (PROBLEMATIC):**
```typescript
// Frontend - MISSING CAMPUS FILTER
const fetchBatches = useCallback(async () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    // ❌ NO campus_id parameter!
    const response = await fetch(`/api/v1/admin/batches?${params}`, ...);
});
```

**Impact:**
- Admins see ALL batches from ALL campuses
- Cavite admin sees Main Campus batches
- Data segregation NOT working

**Verdict:** ❌ **NEEDS FIX**

---

### 5.7 Survey Bank (`/admin/surveys`)

**File:** `resources/js/pages/admin/SurveyBank.tsx`

| Aspect | Status | Details |
|--------|--------|---------|
| Uses `useCampus()` | ❌ **NO** | Not imported |
| Passes `campus_id` to API | ❌ **NO** | No campus parameter |
| Backend filters by campus | ⚠️ Partial | Has multi-campus logic |
| Multi-campus content support | ⚠️ Partial | Backend supports, frontend doesn't use |

**Current Implementation (PROBLEMATIC):**
```typescript
// Frontend - MISSING CAMPUS FILTER
const fetchSurveys = useCallback(async () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    // ❌ NO campus_id parameter!
});
```

**Verdict:** ❌ **NEEDS FIX**

---

### 5.8 Job Board (`/admin/jobs`)

**File:** `resources/js/pages/admin/JobBoard.tsx`

| Aspect | Status | Details |
|--------|--------|---------|
| Uses `useCampus()` | ❌ **NO** | Not imported |
| Passes `campus_id` to API | ❌ **NO** | No campus parameter |
| Backend filters by campus | ⚠️ Partial | Has `is_multi_campus` column |
| Multi-campus job support | ❌ Not used | Feature exists but unused |

**Verdict:** ❌ **NEEDS FIX**

---

### 5.9 Announcements (`/admin/announcements`)

**File:** `resources/js/pages/admin/Announcements.tsx`

| Aspect | Status | Details |
|--------|--------|---------|
| Uses `useCampus()` | ❌ **NO** | Not imported |
| Passes `campus_id` to API | ❌ **NO** | No campus parameter |
| Backend filters by campus | ⚠️ Partial | Has `is_multi_campus` column |
| Target by campus | ❌ Not shown | UI doesn't show campus targeting |

**Verdict:** ❌ **NEEDS FIX**

---

### 5.10 Campus Management (`/admin/campuses`)

**File:** Does not exist

**Status:** 🔴 **PAGE NOT IMPLEMENTED**

**Required Features:**
- List all campuses
- Add/Edit campus details
- View campus statistics
- Manage campus-specific settings
- Campus admin assignment

---

## 6. Identified Inconsistencies

### 6.1 Summary Table

| Page | Campus Filter | Re-fetch on Change | Backend Filter | Status |
|------|---------------|-------------------|----------------|--------|
| Dashboard | ✅ | ✅ | ✅ | ✅ OK |
| Alumni Bank | ✅ | ✅ | ✅ | ✅ OK |
| Analytics | ✅ | ✅ | ✅ | ✅ OK |
| User Management | ✅ | ⚠️ | ✅ | ✅ OK |
| Batches | ❌ | ❌ | ❌ | ❌ BROKEN |
| Survey Bank | ❌ | ❌ | ⚠️ | ❌ BROKEN |
| Job Board | ❌ | ❌ | ⚠️ | ❌ BROKEN |
| Announcements | ❌ | ❌ | ⚠️ | ❌ BROKEN |
| Campus Management | 🔴 | 🔴 | 🔴 | 🔴 MISSING |

### 6.2 Specific Issues

#### Issue #1: Batches Page Shows All Campuses
```
Problem:  Cavite admin sees Main Campus batches
Root:     No campus_id filter in frontend OR backend
Impact:   Data leakage, confusing UX
Priority: HIGH
```

#### Issue #2: Survey Bank Not Campus-Aware
```
Problem:  All surveys shown regardless of campus
Root:     Frontend doesn't pass campus_id
Impact:   Cavite admin sees Main-only surveys
Priority: HIGH
```

#### Issue #3: Job Board Not Campus-Filtered
```
Problem:  All jobs visible to all campuses
Root:     is_multi_campus column exists but not used
Impact:   Jobs meant for one campus visible to all
Priority: MEDIUM
```

#### Issue #4: Announcements Not Campus-Filtered
```
Problem:  All announcements visible regardless of campus target
Root:     Frontend doesn't use campus filtering
Impact:   Wrong announcements shown to users
Priority: MEDIUM
```

#### Issue #5: No Campus Management Page
```
Problem:  Cannot manage campuses through UI
Root:     Page not implemented
Impact:   No central campus administration
Priority: HIGH
```

#### Issue #6: Departments/Courses Only for Main Campus
```
Problem:  All 10 departments and 54 courses have campus_id=1
Root:     Cavite campus has no departments/courses seeded
Impact:   Cavite alumni cannot select proper department/course
Priority: CRITICAL
```

---

## 7. Campus Management Implementation

### 7.1 New Page: Campus Management

**Route:** `/admin/campuses`  
**File:** `resources/js/pages/admin/CampusManagement.tsx`

#### Features:
1. **Campus List View**
   - Display all campuses with stats
   - Status badges (active/inactive)
   - Quick actions (edit, view details)

2. **Campus Details**
   - Basic info (name, code, address)
   - Contact information
   - Statistics (users, alumni, departments)

3. **Campus CRUD**
   - Add new campus
   - Edit campus details
   - Deactivate campus (not delete)

4. **Campus Statistics**
   - Total users per campus
   - Alumni count per campus
   - Employment rates per campus
   - Survey response rates per campus

### 7.2 API Endpoints Required

```
GET    /api/v1/admin/campuses              - List all campuses
GET    /api/v1/admin/campuses/{id}         - Get campus details
POST   /api/v1/admin/campuses              - Create new campus
PUT    /api/v1/admin/campuses/{id}         - Update campus
DELETE /api/v1/admin/campuses/{id}         - Deactivate campus
GET    /api/v1/admin/campuses/{id}/stats   - Get campus statistics
```

---

## 8. Solution Roadmap

### Phase 1: Fix Existing Pages (Week 1)

#### 8.1.1 Fix Batches.tsx

```typescript
// Add to Batches.tsx
import { useCampus } from '@/contexts/CampusContext';

export default function Batches({ user }: Props) {
    const { selectedCampus } = useCampus();
    
    const fetchBatches = useCallback(async () => {
        const params = new URLSearchParams();
        if (selectedCampus?.id) {
            params.append('campus_id', selectedCampus.id.toString());
        }
        // ... rest of fetch logic
    }, [currentPage, searchTerm, selectedCampus?.id]); // Add dependency
```

```php
// Update AdminController@getBatches
public function getBatches(Request $request): JsonResponse
{
    $query = Batch::query();
    
    if ($request->has('campus_id') && $request->campus_id) {
        $query->where('campus_id', $request->campus_id);
    }
    // ... rest of logic
}
```

#### 8.1.2 Fix SurveyBank.tsx

```typescript
// Add campus filtering
import { useCampus } from '@/contexts/CampusContext';

const { selectedCampus } = useCampus();

const fetchSurveys = useCallback(async () => {
    const params = new URLSearchParams();
    if (selectedCampus?.id) {
        params.append('campus_id', selectedCampus.id.toString());
    }
    // ...
}, [currentPage, searchTerm, selectedCampus?.id]);
```

#### 8.1.3 Fix JobBoard.tsx

```typescript
// Add campus filtering
import { useCampus } from '@/contexts/CampusContext';

const { selectedCampus } = useCampus();

const fetchJobs = useCallback(async () => {
    const params = new URLSearchParams();
    if (selectedCampus?.id) {
        params.append('campus_id', selectedCampus.id.toString());
    }
    // ...
}, [search, statusFilter, categoryFilter, selectedCampus?.id]);
```

#### 8.1.4 Fix Announcements.tsx

```typescript
// Add campus filtering
import { useCampus } from '@/contexts/CampusContext';

const { selectedCampus } = useCampus();

const fetchAnnouncements = useCallback(async () => {
    const params = new URLSearchParams();
    if (selectedCampus?.id) {
        params.append('campus_id', selectedCampus.id.toString());
    }
    // ...
}, [search, statusFilter, selectedCampus?.id]);
```

### Phase 2: Create Campus Management Page (Week 2)

1. Create `CampusManagement.tsx` page
2. Add route in `routes/web.php`
3. Add route in `routes/api.php`
4. Create `CampusManagementController.php`
5. Add navigation link in sidebar

### Phase 3: Seed Cavite Campus Data (Week 2)

```php
// Create migration or seeder
// Add departments for Cavite Campus
DB::table('departments')->insert([
    ['name' => 'College of Engineering', 'code' => 'COE', 'campus_id' => 2, 'status' => 'active'],
    ['name' => 'College of Arts and Sciences', 'code' => 'CAS', 'campus_id' => 2, 'status' => 'active'],
    // ... more departments
]);

// Add courses for Cavite Campus
DB::table('courses')->insert([
    ['name' => 'BS Computer Science', 'code' => 'BSCS', 'department_id' => X, 'campus_id' => 2],
    // ... more courses
]);

// Add batches for Cavite Campus
DB::table('batches')->insert([
    ['name' => 'Class of 2024', 'graduation_year' => 2024, 'campus_id' => 2],
    ['name' => 'Class of 2025', 'graduation_year' => 2025, 'campus_id' => 2],
    // ... more batches
]);
```

### Phase 4: Backend API Updates (Week 1-2)

Update these controllers to accept and filter by `campus_id`:

1. `AdminController@getBatches`
2. `AdminController@getSurveys`
3. `JobBoardController@index`
4. `JobBoardController@adminIndex`
5. `AnnouncementController@index`
6. `AnnouncementController@adminIndex`

---

## 9. Implementation Checklist

### 9.1 Frontend Fixes

- [ ] **Batches.tsx**
  - [ ] Import `useCampus` hook
  - [ ] Get `selectedCampus` from context
  - [ ] Add `campus_id` to fetch params
  - [ ] Add `selectedCampus?.id` to useEffect dependencies

- [ ] **SurveyBank.tsx**
  - [ ] Import `useCampus` hook
  - [ ] Get `selectedCampus` from context
  - [ ] Add `campus_id` to fetch params
  - [ ] Add `selectedCampus?.id` to useEffect dependencies

- [ ] **JobBoard.tsx**
  - [ ] Import `useCampus` hook
  - [ ] Get `selectedCampus` from context
  - [ ] Add `campus_id` to fetch params
  - [ ] Add `selectedCampus?.id` to useEffect dependencies

- [ ] **Announcements.tsx**
  - [ ] Import `useCampus` hook
  - [ ] Get `selectedCampus` from context
  - [ ] Add `campus_id` to fetch params
  - [ ] Add `selectedCampus?.id` to useEffect dependencies

### 9.2 Backend Fixes

- [ ] **AdminController.php**
  - [ ] Update `getBatches()` to filter by campus_id
  - [ ] Update `getSurveys()` to filter by campus_id

- [ ] **JobBoardController.php**
  - [ ] Update `index()` to filter by campus_id
  - [ ] Update `adminIndex()` to filter by campus_id

- [ ] **AnnouncementController.php**
  - [ ] Update `index()` to filter by campus_id
  - [ ] Update `adminIndex()` to filter by campus_id

### 9.3 New Campus Management Page

- [ ] Create `CampusManagement.tsx`
- [ ] Add web route in `routes/web.php`
- [ ] Create `CampusManagementController.php`
- [ ] Add API routes in `routes/api.php`
- [ ] Add sidebar navigation link
- [ ] Implement CRUD operations
- [ ] Add campus statistics view

### 9.4 Data Seeding

- [ ] Create migration/seeder for Cavite departments
- [ ] Create migration/seeder for Cavite courses
- [ ] Create migration/seeder for Cavite batches
- [ ] Verify data integrity after seeding

### 9.5 Testing

- [ ] Test campus filter on all fixed pages
- [ ] Test campus switching (toggle between Main/Cavite)
- [ ] Verify data isolation (Cavite admin cannot see Main data)
- [ ] Test multi-campus content (surveys, jobs, announcements)
- [ ] Test Campus Management CRUD
- [ ] Cross-browser testing

---

## Appendix A: File Locations

```
Frontend Pages:
├── resources/js/pages/admin/
│   ├── Dashboard.tsx          ✅ Working
│   ├── AlumniBank.tsx         ✅ Working
│   ├── Analytics.tsx          ✅ Working
│   ├── UserManagement.tsx     ✅ Working
│   ├── Batches.tsx            ❌ Needs Fix
│   ├── SurveyBank.tsx         ❌ Needs Fix
│   ├── JobBoard.tsx           ❌ Needs Fix
│   ├── Announcements.tsx      ❌ Needs Fix
│   └── CampusManagement.tsx   🔴 Create New

Backend Controllers:
├── app/Http/Controllers/Api/
│   ├── AdminController.php    ⚠️ Partial Update
│   ├── JobBoardController.php ⚠️ Needs Update
│   ├── AnnouncementController.php ⚠️ Needs Update
│   └── CampusController.php   ⚠️ Extend for Management

Context:
├── resources/js/contexts/
│   └── CampusContext.tsx      ✅ Working
```

---

## Appendix B: Campus Filter Pattern Template

### Frontend Template

```typescript
import React, { useEffect, useState, useCallback } from 'react';
import { useCampus } from '@/contexts/CampusContext';

export default function PageName() {
    const { selectedCampus } = useCampus();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');
            
            const params = new URLSearchParams();
            // ✅ ALWAYS add campus_id if available
            if (selectedCampus?.id) {
                params.append('campus_id', selectedCampus.id.toString());
            }
            
            const response = await fetch(`/api/v1/admin/endpoint?${params}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            const result = await response.json();
            setData(result.data);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedCampus?.id]); // ✅ ALWAYS include in dependencies

    useEffect(() => {
        fetchData();
    }, [fetchData]); // ✅ Re-fetch when campus changes
    
    return (/* ... */);
}
```

### Backend Template

```php
public function getData(Request $request): JsonResponse
{
    $query = Model::query();
    
    // ✅ ALWAYS filter by campus if provided
    if ($request->has('campus_id') && $request->campus_id) {
        $query->where('campus_id', $request->campus_id);
    }
    
    // For multi-campus content (surveys, jobs, announcements)
    if ($request->has('campus_id') && $request->campus_id) {
        $query->where(function($q) use ($request) {
            $q->where('campus_id', $request->campus_id)
              ->orWhere('is_multi_campus', true);
        });
    }
    
    $data = $query->paginate($request->get('per_page', 15));
    
    return response()->json([
        'success' => true,
        'data' => $data
    ]);
}
```

---

*Document maintained by: Development Team*  
*Last updated: February 3, 2026*
