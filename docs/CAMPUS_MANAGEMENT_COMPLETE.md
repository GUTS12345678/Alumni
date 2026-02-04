# Campus Management Implementation Summary

## EARIST Alumni Tracer System - Multi-Campus Support

**Implementation Date:** February 3, 2026  
**Status:** ✅ Complete (Phase 1 Backend + Phase 2 Frontend)

---

## Overview

This document summarizes the implementation of multi-campus support for the Alumni Tracer System, enabling data segregation and filtering between EARIST Main Campus and Cavite Campus.

---

## Phase 1: Backend Implementation ✅

### Database Changes

1. **Created `campuses` table:**
   - `id`, `name`, `code`, `display_name`, `address`, `contact_email`, `contact_phone`, `is_active`
   - Seeded with 2 campuses:
     - **MAIN** (ID: 1) - EARIST Main Campus, Manila
     - **CAV** (ID: 2) - EARIST Cavite Campus, Rosario Cavite

2. **Added `campus_id` to existing tables:**
   - `users` - User's assigned campus
   - `alumni_profiles` - Alumni's campus
   - `batches` - Batch belongs to campus
   - `courses` - Course offered at campus
   - `departments` - Department at campus
   - `surveys` - Survey created for campus (+ `is_multi_campus`)
   - `survey_responses` - Response from which campus
   - `job_postings` - Job posted for campus (+ `is_multi_campus`)
   - `announcements` - Announcement for campus (+ `is_multi_campus`)
   - `employments` - Employment record campus

### Backend Files Created

| File | Purpose |
|------|---------|
| `database/migrations/2026_02_03_000001_create_campuses_table.php` | Create campuses master table |
| `database/migrations/2026_02_03_000002_add_campus_id_to_tables.php` | Add campus_id to related tables |
| `app/Models/Campus.php` | Campus Eloquent model |
| `app/Traits/BelongsToCampus.php` | Reusable trait for campus-aware models |
| `app/Services/CampusService.php` | Business logic for campus operations |
| `app/Http/Controllers/Api/CampusController.php` | REST API endpoints |

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/campuses` | GET | List all active campuses |
| `/api/v1/campuses/options` | GET | Dropdown options for forms |
| `/api/v1/campuses/{id}` | GET | Get single campus details |
| `/api/v1/campuses/{id}/statistics` | GET | Campus-specific stats |
| `/api/v1/campuses/comparison` | GET | Compare stats between campuses |
| `/api/v1/campuses/can-switch` | GET | Check if user can switch |
| `/api/v1/campuses/effective` | GET | Get user's effective campus |

---

## Phase 2: Frontend Implementation ✅

### Frontend Files Created

| File | Purpose |
|------|---------|
| `resources/js/contexts/CampusContext.tsx` | React context for campus state management |
| `resources/js/components/CampusSelector.tsx` | Campus selection dropdown component |
| `resources/js/hooks/useCampusFilter.ts` | Hooks for filtering data by campus |

### Files Modified

| File | Changes |
|------|---------|
| `resources/js/app.tsx` | Wrapped app with CampusProvider |
| `resources/js/components/app-sidebar-header.tsx` | Added CampusSelector to header |
| `resources/js/pages/admin/Dashboard.tsx` | Added campus-aware data fetching |
| `resources/js/pages/Alumni/SurveyRegistration.tsx` | Added campus selection to registration |
| `resources/js/types/index.d.ts` | Added campus_id and role to User type |

---

## Components Reference

### CampusContext

```tsx
import { useCampus } from '@/contexts/CampusContext';

// Usage
const { selectedCampus, campuses, setSelectedCampus, canSwitchCampus } = useCampus();
```

**Provides:**
- `selectedCampus` - Currently selected campus object
- `campuses` - Array of all available campuses
- `setSelectedCampus(campus)` - Change selected campus
- `isLoading` - Loading state
- `canSwitchCampus` - Boolean if user can switch (admin/superadmin)
- `refreshCampuses()` - Refresh campus list
- `getCampusById(id)` - Get campus by ID
- `getCampusByCode(code)` - Get campus by code

### CampusSelector

```tsx
import { CampusSelector } from '@/components/CampusSelector';

// Variants
<CampusSelector variant="default" />   // Full display with label
<CampusSelector variant="compact" />   // Smaller for header
<CampusSelector variant="minimal" />   // Code-only badge
```

### useCampusFilter Hook

```tsx
import { useCampusFilter, useCampusParams, useCampusForm } from '@/hooks/useCampusFilter';

// Filter array by campus
const filteredData = useCampusFilter(data);

// Include multi-campus items
const filteredSurveys = useCampusFilter(surveys, { includeMultiCampus: true });

// Get params for API calls
const { campusParams, campusId, appendCampusToUrl } = useCampusParams();

// Form helpers
const { defaultCampusId, shouldShowCampusSelector, campusOptions } = useCampusForm();
```

---

## Registration Flow

The alumni registration form now includes campus selection in the Academic Background section:

1. **Step 1: Personal Information** - Name, email, student ID
2. **Step 2: Academic Background** - **Campus** (new), Department, Course, Graduation Year
3. **Step 3-6:** Employment, Contact, Engagement, Account Setup

When campus is selected:
- Department dropdown filters to show only that campus's departments
- Course dropdown filters based on selected department
- Campus ID is saved with the alumni profile

---

## Admin Campus Switching

Admins and Super Admins can:
- See the campus selector in the sidebar header
- Switch between campuses to view campus-specific data
- Selection persists in localStorage
- Dashboard automatically refetches data when campus changes

Alumni users:
- Cannot switch campuses
- See their assigned campus as a badge
- Data is always filtered to their campus

---

## Data Filtering Logic

### Campus-Specific Content
- Data with `campus_id` matching selected campus is shown
- If `is_multi_campus = true`, content shows to all campuses

### Backend Query Example
```php
// Using BelongsToCampus trait
$alumni = AlumniProfile::forCampus($campusId)->get();

// Including multi-campus content
$surveys = Survey::visibleToCampus($campusId)->get();
```

### Frontend Query Example
```tsx
// Fetch with campus filter
const params = new URLSearchParams();
params.append('campus_id', selectedCampus.id.toString());
const response = await fetch(`/api/endpoint?${params}`);
```

---

## Testing Checklist

- [x] Campus selector appears in admin header
- [x] Alumni see their campus badge (non-switchable)
- [x] Registration form has campus dropdown
- [x] Departments filter by selected campus
- [x] Dashboard refetches on campus change
- [x] Build compiles without errors

---

## Next Steps

1. **Update more pages to use campus filtering:**
   - Alumni Bank
   - Survey Bank
   - Job Board
   - Announcements
   - Batch Management
   - Department Management
   - Course Management

2. **Backend API updates:**
   - Add campus filtering to all list endpoints
   - Update analytics to be campus-aware
   - Add campus comparison reports

3. **Department/Course API:**
   - Ensure `/api/v1/admin/departments/active?campus_id=X` filters by campus

---

## Summary

| Item | Status |
|------|--------|
| Database migrations | ✅ Complete |
| Campus model & relationships | ✅ Complete |
| Campus API endpoints | ✅ Complete |
| React Context provider | ✅ Complete |
| Campus selector component | ✅ Complete |
| Campus filter hooks | ✅ Complete |
| Registration campus selection | ✅ Complete |
| Admin campus switching | ✅ Complete |
| Dashboard campus filtering | ✅ Complete |
| Build verification | ✅ Passes |

---

*Implementation completed: February 3, 2026*
