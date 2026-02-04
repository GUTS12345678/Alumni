# Data Reset & Campus Locking Implementation Plan

## EARIST Alumni Tracer System - Data Management Overhaul

**Document Version:** 1.0  
**Date:** February 4, 2026  
**Status:** Planning Phase  
**Priority:** CRITICAL

---

## Executive Summary

This document outlines the comprehensive plan to:
1. **Reset alumni data** while preserving 2 specific accounts
2. **Repopulate with realistic test data** for both Main and Cavite campuses
3. **Lock campus field** to prevent alumni from changing their campus assignment
4. **Ensure complete data population** for accurate analytics

---

## Table of Contents

1. [Identified Concerns](#1-identified-concerns)
2. [Problem Breakdown](#2-problem-breakdown)
3. [Database State Analysis](#3-database-state-analysis)
4. [Solution Architecture](#4-solution-architecture)
5. [Implementation Scripts](#5-implementation-scripts)
6. [Campus Locking Implementation](#6-campus-locking-implementation)
7. [Testing Plan](#7-testing-plan)
8. [Rollback Strategy](#8-rollback-strategy)

---

## 1. Identified Concerns

### 1.1 Data Loss Risk ⚠️

**Concern:** Deleting all alumni except 2 accounts is irreversible

**Risks:**
- Loss of existing survey responses
- Loss of employment history records
- Loss of job applications
- Loss of user activity logs
- Loss of messaging history

**Mitigation:**
- Create full database backup before deletion
- Export data to CSV for reference
- Store backup in secure location
- Test restore procedure before proceeding

---

### 1.2 Referential Integrity 🔗

**Concern:** Foreign key constraints will prevent deletion

**Affected Tables:**
```
users (parent)
    ├─> alumni_profiles (child)
    │       ├─> employments (grandchild)
    │       └─> survey_responses (grandchild)
    ├─> job_applications (child)
    ├─> messages (child)
    └─> activity_logs (child)
```

**Required Deletion Order:**
1. Delete `employments` records
2. Delete `survey_responses` records
3. Delete `job_applications` records
4. Delete `messages` records
5. Delete `activity_logs` records
6. Delete `alumni_profiles` records
7. Delete `users` records

---

### 1.3 Incomplete Data Population 📊

**Concern:** Current alumni data has many NULL fields affecting analytics

**Missing Data Issues:**
- `job_start_date` → Can't calculate time-to-job
- `job_mismatch_reason` → Can't analyze job alignment
- `employment_status` → Can't calculate employment rate
- `graduation_date` → Only has graduation_year
- `skills`, `certifications` → Empty text fields
- `job_satisfaction` → NULL ratings

**Impact on Analytics:**
- Time-to-job shows 0 or NULL
- Employment breakdown incomplete
- Job mismatch stats inaccurate
- Department comparisons unreliable

---

### 1.4 Campus Data Imbalance ⚖️

**Concern:** Current data heavily favors Main Campus

**Current Distribution:**
```
Main Campus:  160 alumni profiles (70%)
Cavite Campus: 70 alumni profiles (30%)

Departments:
Main Campus:   10 departments
Cavite Campus:  0 departments ← PROBLEM!

Courses:
Main Campus:   54 courses
Cavite Campus:  0 courses ← PROBLEM!

Batches:
Main Campus:   11 batches
Cavite Campus:  0 batches ← PROBLEM!
```

**Impact:**
- Cavite analytics show zeros
- Can't compare campus performance
- No department/course data for Cavite
- Batch management broken for Cavite

---

### 1.5 Campus Toggle Issue 🔒

**Concern:** Alumni can change their campus, breaking data integrity

**Current Behavior:**
- Alumni can switch between Main and Cavite
- Causes confusion in analytics
- Data segregation fails
- Admins lose track of actual campus assignment

**Desired Behavior:**
- Campus field locked for alumni users
- Only visible, not editable
- Admins can change if needed (special cases)
- Campus selector only for viewing (admins)

---

## 2. Problem Breakdown

### Problem 1: Cascading Deletions

**Description:** Can't delete users without orphaning related records

**Affected Tables:**
| Table | Foreign Key | Cascade? | Records to Delete |
|-------|-------------|----------|-------------------|
| `employments` | `alumni_id` | ❌ No | ~500 records |
| `survey_responses` | `user_id` | ❌ No | ~1,200 records |
| `job_applications` | `user_id` | ❌ No | ~300 records |
| `messages` | `sender_id`, `recipient_id` | ❌ No | ~800 records |
| `activity_logs` | `user_id` | ❌ No | ~5,000 records |
| `alumni_profiles` | `user_id` | ❌ No | ~228 records |

**Solution:**
```sql
-- Step 1: Get IDs of users to KEEP
SET @keep_ids = (
    SELECT GROUP_CONCAT(id)
    FROM users
    WHERE email IN ('nacu.a.bscs@gmail.com', 'adriankurtnacu@gmail.com')
);

-- Step 2: Delete child records (bottom-up)
DELETE FROM employments 
WHERE alumni_id IN (
    SELECT id FROM alumni_profiles 
    WHERE user_id NOT IN (@keep_ids)
);

DELETE FROM survey_responses WHERE user_id NOT IN (@keep_ids);
DELETE FROM job_applications WHERE user_id NOT IN (@keep_ids);
DELETE FROM messages WHERE sender_id NOT IN (@keep_ids) OR recipient_id NOT IN (@keep_ids);
DELETE FROM activity_logs WHERE user_id NOT IN (@keep_ids);
DELETE FROM alumni_profiles WHERE user_id NOT IN (@keep_ids);
DELETE FROM users WHERE id NOT IN (@keep_ids) AND role = 'alumni';
```

---

### Problem 2: Missing Campus Infrastructure

**Description:** Cavite Campus has no departments, courses, or batches

**Current State:**
```sql
SELECT campus_id, COUNT(*) FROM departments GROUP BY campus_id;
-- Result: Only campus_id = 1 (Main)

SELECT campus_id, COUNT(*) FROM courses GROUP BY campus_id;
-- Result: Only campus_id = 1 (Main)

SELECT campus_id, COUNT(*) FROM batches GROUP BY campus_id;
-- Result: Only campus_id = 1 (Main)
```

**Solution:** Create Cavite-specific data:

**Departments for Cavite:**
1. College of Engineering (Cavite)
2. College of Computer Studies (Cavite)
3. College of Business Administration (Cavite)
4. College of Industrial Education (Cavite)
5. College of Science (Cavite)

**Courses for Cavite:**
- BS Computer Science (Cavite)
- BS Information Technology (Cavite)
- BS Computer Engineering (Cavite)
- BS Civil Engineering (Cavite)
- BS Mechanical Engineering (Cavite)
- BS Business Administration (Cavite)
- BS Accountancy (Cavite)
- BS Industrial Technology (Cavite)

**Batches for Cavite:**
- Class of 2018 (Cavite)
- Class of 2019 (Cavite)
- Class of 2020 (Cavite)
- Class of 2021 (Cavite)
- Class of 2022 (Cavite)
- Class of 2023 (Cavite)
- Class of 2024 (Cavite)

---

### Problem 3: Realistic Data Generation

**Description:** Need diverse, realistic alumni data for analytics

**Requirements:**

#### Employment Status Distribution (Target):
```
Main Campus (100 alumni):
- employed_full_time:          60 alumni (60%)
- employed_part_time:          15 alumni (15%)
- self_employed:               10 alumni (10%)
- unemployed_seeking:           8 alumni (8%)
- unemployed_not_seeking:       4 alumni (4%)
- pursuing_higher_education:    3 alumni (3%)

Cavite Campus (100 alumni):
- employed_full_time:          55 alumni (55%)
- employed_part_time:          18 alumni (18%)
- self_employed:               12 alumni (12%)
- unemployed_seeking:          10 alumni (10%)
- unemployed_not_seeking:       3 alumni (3%)
- pursuing_higher_education:    2 alumni (2%)
```

#### Job Mismatch Distribution (Target):
```
Main Campus Employed (85 alumni):
- Good Match:       60 alumni (70%)
- Overqualified:    15 alumni (18%)
- Unfit:            7 alumni (8%)
- Underqualified:   3 alumni (4%)

Cavite Campus Employed (85 alumni):
- Good Match:       55 alumni (65%)
- Overqualified:    20 alumni (24%)
- Unfit:            7 alumni (8%)
- Underqualified:   3 alumni (3%)
```

#### Time-to-Job Distribution (Target):
```
Days to get first job after graduation:
- 0-30 days:        20% (got job immediately)
- 31-60 days:       25% (within 2 months)
- 61-90 days:       20% (within 3 months)
- 91-120 days:      15% (within 4 months)
- 121-180 days:     12% (within 6 months)
- 181-365 days:     8% (within 1 year)
```

#### Graduation Year Distribution:
```
Each campus should have alumni from:
- 2018: 10 alumni
- 2019: 15 alumni
- 2020: 20 alumni
- 2021: 20 alumni
- 2022: 15 alumni
- 2023: 12 alumni
- 2024: 8 alumni
Total: 100 alumni per campus
```

---

### Problem 4: Campus Field Toggle

**Description:** Alumni users can change their campus assignment

**Current Implementation:**
```tsx
// CampusSelector.tsx - PROBLEM: No role check
<Select
  value={selectedCampus?.id.toString()}
  onValueChange={handleCampusChange} // ← Alumni can change!
>
```

**Issues:**
- Alumni registered for Main can switch to Cavite
- Breaks analytics segregation
- Causes confusion in data reporting
- No audit trail of campus changes

**Solution Components:**

1. **Frontend Disable:**
```tsx
// CampusSelector.tsx
const { user } = useAuth();
const canChangeCampus = user?.role === 'admin' || user?.role === 'super_admin';

<Select
  value={selectedCampus?.id.toString()}
  onValueChange={handleCampusChange}
  disabled={!canChangeCampus} // ← Lock for alumni
>
```

2. **Backend Validation:**
```php
// UpdateProfileRequest.php
public function rules(): array
{
    $rules = [
        'first_name' => 'required|string|max:255',
        'last_name' => 'required|string|max:255',
        // ...
    ];

    // Prevent campus changes for non-admin users
    if (!auth()->user()->isAdmin()) {
        $rules['campus_id'] = 'prohibited'; // ← Block campus updates
    }

    return $rules;
}
```

3. **UI Indication:**
```tsx
// ProfileEdit.tsx
{user.role === 'alumni' && (
  <div className="bg-muted p-3 rounded-md">
    <p className="text-sm text-muted-foreground">
      <Info className="inline-block mr-1 h-4 w-4" />
      Your campus assignment is permanent and cannot be changed.
      Contact admin if you believe this is incorrect.
    </p>
  </div>
)}
```

---

## 3. Database State Analysis

### 3.1 Current Alumni Distribution

```sql
-- Query to check current state
SELECT 
    campus_id,
    COUNT(*) as total_profiles,
    SUM(CASE WHEN employment_status LIKE 'employed%' OR employment_status = 'self_employed' THEN 1 ELSE 0 END) as employed,
    SUM(CASE WHEN job_start_date IS NULL THEN 1 ELSE 0 END) as missing_job_date,
    SUM(CASE WHEN job_mismatch_reason IS NULL THEN 1 ELSE 0 END) as missing_mismatch,
    AVG(CASE WHEN job_start_date IS NOT NULL 
        THEN DATEDIFF(job_start_date, CONCAT(graduation_year, '-06-01')) 
        ELSE NULL END) as avg_days_to_job
FROM alumni_profiles
GROUP BY campus_id;
```

**Expected Current Results:**
```
+------------+----------------+----------+------------------+------------------+------------------+
| campus_id  | total_profiles | employed | missing_job_date | missing_mismatch | avg_days_to_job |
+------------+----------------+----------+------------------+------------------+------------------+
| 1 (Main)   | 160            | ~100     | ~80              | ~120             | ~90 days         |
| 2 (Cavite) | 70             | ~40      | ~45              | ~60              | ~75 days         |
+------------+----------------+----------+------------------+------------------+------------------+
```

### 3.2 Accounts to Preserve

```sql
-- Verify the 2 accounts exist
SELECT id, email, role, campus_id FROM users 
WHERE email IN ('nacu.a.bscs@gmail.com', 'adriankurtnacu@gmail.com');

-- Check their alumni profiles
SELECT ap.id, ap.user_id, ap.campus_id, ap.first_name, ap.last_name, ap.employment_status
FROM alumni_profiles ap
JOIN users u ON ap.user_id = u.id
WHERE u.email IN ('nacu.a.bscs@gmail.com', 'adriankurtnacu@gmail.com');
```

---

## 4. Solution Architecture

### 4.1 Implementation Phases

```
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 1: BACKUP & PREPARATION                                       │
│ - Full database backup                                              │
│ - Export existing data to CSV                                       │
│ - Verify 2 accounts to keep exist                                   │
│ Duration: 30 minutes                                                │
└─────────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 2: CAMPUS INFRASTRUCTURE SETUP                                │
│ - Create Cavite departments                                         │
│ - Create Cavite courses                                             │
│ - Create Cavite batches (2018-2024)                                 │
│ Duration: 15 minutes                                                │
└─────────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 3: DATA DELETION (CASCADING)                                  │
│ - Delete employments (except for 2 accounts)                        │
│ - Delete survey_responses (except for 2 accounts)                   │
│ - Delete job_applications (except for 2 accounts)                   │
│ - Delete messages (except for 2 accounts)                           │
│ - Delete activity_logs (except for 2 accounts)                      │
│ - Delete alumni_profiles (except for 2 accounts)                    │
│ - Delete users (except for 2 accounts + admins)                     │
│ Duration: 10 minutes                                                │
└─────────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 4: ALUMNI DATA SEEDING                                        │
│ - Generate 100 Main Campus alumni (realistic data)                  │
│ - Generate 100 Cavite Campus alumni (realistic data)                │
│ - Create employment records with varied start dates                 │
│ - Populate ALL profile fields                                       │
│ Duration: 20 minutes                                                │
└─────────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 5: CAMPUS LOCKING IMPLEMENTATION                              │
│ - Update frontend: Disable campus selector for alumni               │
│ - Update backend: Add validation rules                              │
│ - Add UI indicators                                                 │
│ - Test with alumni account                                          │
│ Duration: 30 minutes                                                │
└─────────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 6: VERIFICATION & TESTING                                     │
│ - Verify 202 total alumni (2 preserved + 200 new)                   │
│ - Check analytics show realistic numbers                            │
│ - Test campus switching (admin only)                                │
│ - Verify alumni cannot change campus                                │
│ Duration: 20 minutes                                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation Scripts

### 5.1 Backup Script

**File:** `scripts/backup_database.php`

```php
<?php
// Run this FIRST before any deletion
// Command: php scripts/backup_database.php

$backupDir = storage_path('backups');
if (!file_exists($backupDir)) {
    mkdir($backupDir, 0755, true);
}

$timestamp = date('Y-m-d_H-i-s');
$backupFile = "{$backupDir}/alumni_tracer_backup_{$timestamp}.sql";

// Database credentials from .env
$host = env('DB_HOST', 'localhost');
$database = env('DB_DATABASE', 'alumni_tracer_system');
$username = env('DB_USERNAME', 'root');
$password = env('DB_PASSWORD', '');

// Create backup using mysqldump
$command = "mysqldump -h{$host} -u{$username} ";
if ($password) {
    $command .= "-p{$password} ";
}
$command .= "{$database} > {$backupFile}";

echo "Creating database backup...\n";
exec($command, $output, $returnCode);

if ($returnCode === 0) {
    echo "✅ Backup created successfully: {$backupFile}\n";
    echo "File size: " . number_format(filesize($backupFile) / 1024 / 1024, 2) . " MB\n";
} else {
    echo "❌ Backup failed with error code: {$returnCode}\n";
    exit(1);
}

// Also export alumni data to CSV for reference
$csvFile = "{$backupDir}/alumni_export_{$timestamp}.csv";
// ... CSV export logic ...
```

---

### 5.2 Campus Infrastructure Seeder

**File:** `database/seeders/CaviteCampusInfrastructureSeeder.php`

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CaviteCampusInfrastructureSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Departments for Cavite Campus
        $departments = [
            ['name' => 'College of Engineering', 'code' => 'COE-CAV', 'campus_id' => 2],
            ['name' => 'College of Computer Studies', 'code' => 'CCS-CAV', 'campus_id' => 2],
            ['name' => 'College of Business Administration', 'code' => 'CBA-CAV', 'campus_id' => 2],
            ['name' => 'College of Industrial Education', 'code' => 'CIE-CAV', 'campus_id' => 2],
            ['name' => 'College of Science', 'code' => 'CS-CAV', 'campus_id' => 2],
        ];

        foreach ($departments as $dept) {
            DB::table('departments')->insert([
                'name' => $dept['name'],
                'code' => $dept['code'],
                'campus_id' => $dept['campus_id'],
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 2. Get department IDs
        $coeDeptId = DB::table('departments')->where('code', 'COE-CAV')->value('id');
        $ccsDeptId = DB::table('departments')->where('code', 'CCS-CAV')->value('id');
        $cbaDeptId = DB::table('departments')->where('code', 'CBA-CAV')->value('id');
        $cieDeptId = DB::table('departments')->where('code', 'CIE-CAV')->value('id');
        $csDeptId = DB::table('departments')->where('code', 'CS-CAV')->value('id');

        // 3. Create Courses for Cavite Campus
        $courses = [
            // CCS Courses
            ['name' => 'Bachelor of Science in Computer Science', 'code' => 'BSCS', 'department_id' => $ccsDeptId, 'campus_id' => 2],
            ['name' => 'Bachelor of Science in Information Technology', 'code' => 'BSIT', 'department_id' => $ccsDeptId, 'campus_id' => 2],
            ['name' => 'Bachelor of Science in Computer Engineering', 'code' => 'BSCpE', 'department_id' => $ccsDeptId, 'campus_id' => 2],
            
            // COE Courses
            ['name' => 'Bachelor of Science in Civil Engineering', 'code' => 'BSCE', 'department_id' => $coeDeptId, 'campus_id' => 2],
            ['name' => 'Bachelor of Science in Mechanical Engineering', 'code' => 'BSME', 'department_id' => $coeDeptId, 'campus_id' => 2],
            ['name' => 'Bachelor of Science in Electrical Engineering', 'code' => 'BSEE', 'department_id' => $coeDeptId, 'campus_id' => 2],
            
            // CBA Courses
            ['name' => 'Bachelor of Science in Business Administration', 'code' => 'BSBA', 'department_id' => $cbaDeptId, 'campus_id' => 2],
            ['name' => 'Bachelor of Science in Accountancy', 'code' => 'BSA', 'department_id' => $cbaDeptId, 'campus_id' => 2],
            
            // CIE Courses
            ['name' => 'Bachelor of Science in Industrial Technology', 'code' => 'BSIT-Ind', 'department_id' => $cieDeptId, 'campus_id' => 2],
            
            // CS Courses
            ['name' => 'Bachelor of Science in Applied Mathematics', 'code' => 'BSAM', 'department_id' => $csDeptId, 'campus_id' => 2],
        ];

        foreach ($courses as $course) {
            DB::table('courses')->insert([
                'name' => $course['name'],
                'code' => $course['code'],
                'department_id' => $course['department_id'],
                'campus_id' => $course['campus_id'],
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 4. Create Batches for Cavite Campus
        $batches = [
            ['name' => 'Class of 2018', 'graduation_year' => 2018, 'campus_id' => 2],
            ['name' => 'Class of 2019', 'graduation_year' => 2019, 'campus_id' => 2],
            ['name' => 'Class of 2020', 'graduation_year' => 2020, 'campus_id' => 2],
            ['name' => 'Class of 2021', 'graduation_year' => 2021, 'campus_id' => 2],
            ['name' => 'Class of 2022', 'graduation_year' => 2022, 'campus_id' => 2],
            ['name' => 'Class of 2023', 'graduation_year' => 2023, 'campus_id' => 2],
            ['name' => 'Class of 2024', 'graduation_year' => 2024, 'campus_id' => 2],
        ];

        foreach ($batches as $batch) {
            DB::table('batches')->insert([
                'name' => $batch['name'],
                'graduation_year' => $batch['graduation_year'],
                'campus_id' => $batch['campus_id'],
                'status' => 'active',
                'description' => 'Cavite Campus - ' . $batch['name'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        echo "✅ Cavite Campus infrastructure created successfully\n";
    }
}
```

---

### 5.3 Alumni Deletion Script

**File:** `database/seeders/DeleteNonPreservedAlumniSeeder.php`

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class DeleteNonPreservedAlumniSeeder extends Seeder
{
    private array $preserveEmails = [
        'nacu.a.bscs@gmail.com',
        'adriankurtnacu@gmail.com',
    ];

    public function run(): void
    {
        // Get IDs of users to PRESERVE
        $preserveUserIds = User::whereIn('email', $this->preserveEmails)->pluck('id')->toArray();

        if (count($preserveUserIds) !== 2) {
            throw new \Exception("ERROR: Could not find both accounts to preserve!");
        }

        echo "✅ Found accounts to preserve: " . implode(', ', $preserveUserIds) . "\n";

        // Get alumni profile IDs to preserve
        $preserveAlumniIds = DB::table('alumni_profiles')
            ->whereIn('user_id', $preserveUserIds)
            ->pluck('id')
            ->toArray();

        echo "✅ Found alumni profiles to preserve: " . implode(', ', $preserveAlumniIds) . "\n";

        // Step 1: Delete employment records
        $deletedEmployments = DB::table('employments')
            ->whereNotIn('alumni_id', $preserveAlumniIds)
            ->delete();
        echo "🗑️ Deleted {$deletedEmployments} employment records\n";

        // Step 2: Delete survey responses
        $deletedResponses = DB::table('survey_responses')
            ->whereNotIn('user_id', $preserveUserIds)
            ->delete();
        echo "🗑️ Deleted {$deletedResponses} survey responses\n";

        // Step 3: Delete job applications
        $deletedApplications = DB::table('job_applications')
            ->whereNotIn('user_id', $preserveUserIds)
            ->delete();
        echo "🗑️ Deleted {$deletedApplications} job applications\n";

        // Step 4: Delete messages
        $deletedMessages = DB::table('messages')
            ->where(function($query) use ($preserveUserIds) {
                $query->whereNotIn('sender_id', $preserveUserIds)
                      ->orWhereNotIn('recipient_id', $preserveUserIds);
            })
            ->delete();
        echo "🗑️ Deleted {$deletedMessages} messages\n";

        // Step 5: Delete activity logs
        $deletedLogs = DB::table('activity_logs')
            ->whereNotIn('user_id', $preserveUserIds)
            ->delete();
        echo "🗑️ Deleted {$deletedLogs} activity logs\n";

        // Step 6: Delete alumni profiles
        $deletedProfiles = DB::table('alumni_profiles')
            ->whereNotIn('user_id', $preserveUserIds)
            ->delete();
        echo "🗑️ Deleted {$deletedProfiles} alumni profiles\n";

        // Step 7: Delete user accounts (only alumni role)
        $deletedUsers = DB::table('users')
            ->whereNotIn('id', $preserveUserIds)
            ->where('role', 'alumni')
            ->delete();
        echo "🗑️ Deleted {$deletedUsers} user accounts\n";

        // Verify remaining data
        $remainingUsers = DB::table('users')->where('role', 'alumni')->count();
        $remainingProfiles = DB::table('alumni_profiles')->count();

        echo "\n✅ DELETION COMPLETE\n";
        echo "Remaining alumni users: {$remainingUsers}\n";
        echo "Remaining alumni profiles: {$remainingProfiles}\n";

        if ($remainingUsers !== 2 || $remainingProfiles !== 2) {
            throw new \Exception("ERROR: Incorrect number of remaining records!");
        }
    }
}
```

---

### 5.4 Comprehensive Alumni Seeder

**File:** `database/seeders/ComprehensiveAlumniSeeder.php`

(This will be a large file - I'll create it separately)

---

## 6. Campus Locking Implementation

### 6.1 Frontend Changes

#### File 1: `resources/js/components/CampusSelector.tsx`

**Change:** Add role check to disable selector for alumni

```typescript
// Add prop for disabling
interface CampusSelectorProps {
    variant?: 'default' | 'compact' | 'minimal';
    showLabel?: boolean;
    disabled?: boolean; // ← NEW PROP
}

export const CampusSelector: React.FC<CampusSelectorProps> = ({ 
    variant = 'default',
    showLabel = true,
    disabled = false, // ← NEW PROP
}) => {
    const { selectedCampus, campuses, setSelectedCampus, canSwitchCampus, isLoading } = useCampus();
    const { user } = useAuth(); // ← NEW: Get current user

    // Determine if selector should be disabled
    const isDisabled = disabled || !canSwitchCampus || user?.role === 'alumni';

    return (
        <Select
            value={selectedCampus?.id?.toString() || 'all'}
            onValueChange={handleCampusChange}
            disabled={isDisabled} // ← Apply disabled state
        >
            {/* ... rest of component */}
        </Select>
    );
};
```

#### File 2: `resources/js/pages/Alumni/Profile/Edit.tsx`

**Change:** Show campus as read-only field with explanation

```typescript
// Add campus display (read-only)
<div className="space-y-2">
    <Label>Campus Assignment</Label>
    <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
        <Building2 className="h-5 w-5 text-primary" />
        <div>
            <p className="font-medium">{alumniProfile.campus?.display_name}</p>
            <p className="text-sm text-muted-foreground">
                {alumniProfile.campus?.address}
            </p>
        </div>
    </div>
    <p className="text-xs text-muted-foreground">
        <Info className="inline-block mr-1 h-3 w-3" />
        Campus assignment is permanent and cannot be changed. 
        Contact the alumni office if correction is needed.
    </p>
</div>
```

---

### 6.2 Backend Changes

#### File 1: `app/Http/Requests/UpdateAlumniProfileRequest.php`

**Change:** Add validation to prevent campus changes

```php
public function rules(): array
{
    $rules = [
        'first_name' => 'required|string|max:255',
        'last_name' => 'required|string|max:255',
        'middle_name' => 'nullable|string|max:255',
        'birth_date' => 'nullable|date|before:today',
        'gender' => 'nullable|in:male,female,other,prefer_not_to_say',
        'phone' => 'nullable|string|max:20',
        // ... other fields
    ];

    // Prevent campus_id changes for non-admin users
    $user = $this->user();
    if ($user && !in_array($user->role, ['admin', 'super_admin'])) {
        $rules['campus_id'] = 'prohibited'; // Block campus_id in request
    }

    return $rules;
}

public function messages(): array
{
    return [
        'campus_id.prohibited' => 'You are not authorized to change your campus assignment.',
    ];
}
```

#### File 2: `app/Http/Controllers/Api/AlumniController.php`

**Change:** Add additional check in update method

```php
public function updateProfile(UpdateAlumniProfileRequest $request)
{
    $user = auth()->user();
    $alumniProfile = $user->alumniProfile;

    // Additional security check
    if ($request->has('campus_id') && !in_array($user->role, ['admin', 'super_admin'])) {
        return response()->json([
            'message' => 'Unauthorized: Campus assignment cannot be changed.',
        ], 403);
    }

    // Update profile (campus_id excluded for alumni)
    $data = $request->validated();
    if (!in_array($user->role, ['admin', 'super_admin'])) {
        unset($data['campus_id']); // Remove campus_id from update data
    }

    $alumniProfile->update($data);

    return response()->json([
        'message' => 'Profile updated successfully',
        'profile' => $alumniProfile->load('campus', 'department', 'course', 'batch'),
    ]);
}
```

---

## 7. Testing Plan

### 7.1 Pre-Implementation Tests

```bash
# Test 1: Verify backup script works
php scripts/backup_database.php

# Test 2: Verify preserved accounts exist
php artisan tinker
>>> User::whereIn('email', ['nacu.a.bscs@gmail.com', 'adriankurtnacu@gmail.com'])->count()
// Should return: 2

# Test 3: Count current records
>>> DB::table('alumni_profiles')->count()
>>> DB::table('employments')->count()
>>> DB::table('survey_responses')->count()
```

### 7.2 Post-Deletion Tests

```bash
# Test 1: Verify only 2 alumni remain
php artisan tinker
>>> User::where('role', 'alumni')->count()
// Should return: 2

# Test 2: Verify cascade deletion worked
>>> DB::table('alumni_profiles')->count()
// Should return: 2

>>> DB::table('employments')->count()
// Should return: ~2 (only for preserved accounts)
```

### 7.3 Post-Seeding Tests

```bash
# Test 1: Count new alumni
php artisan tinker
>>> User::where('role', 'alumni')->count()
// Should return: 202 (2 preserved + 200 new)

# Test 2: Verify campus distribution
>>> DB::table('alumni_profiles')->where('campus_id', 1)->count()
// Should return: ~100 + 1 preserved (Main Campus)

>>> DB::table('alumni_profiles')->where('campus_id', 2)->count()
// Should return: ~100 + 1 preserved (Cavite Campus)

# Test 3: Check employment data completeness
>>> DB::table('alumni_profiles')->whereNull('job_start_date')->count()
// Should return: ~30 (only unemployed/students should have NULL)

>>> DB::table('alumni_profiles')->whereNull('job_mismatch_reason')->count()
// Should return: ~30 (only unemployed/students should have NULL)
```

### 7.4 Campus Locking Tests

```bash
# Test 1: Login as alumni and try to change campus
1. Login with alumni account
2. Go to Profile Edit page
3. Verify campus selector is DISABLED or shows read-only
4. Try to manually POST campus_id change via browser devtools
5. Should return 403 Forbidden error

# Test 2: Login as admin and verify campus change works
1. Login with admin account
2. Go to User Management
3. Select an alumni user
4. Should be able to change campus_id
5. Verify change persists in database
```

---

## 8. Rollback Strategy

### 8.1 Emergency Rollback

If something goes wrong during implementation:

```bash
# Step 1: Stop the seeding process
Ctrl+C

# Step 2: Restore from backup
mysql -u root -p alumni_tracer_system < storage/backups/alumni_tracer_backup_YYYY-MM-DD_HH-mm-ss.sql

# Step 3: Clear Laravel cache
php artisan cache:clear
php artisan config:clear
php artisan view:clear

# Step 4: Verify restoration
php artisan tinker
>>> User::count()
>>> AlumniProfile::count()
```

### 8.2 Partial Rollback

If only frontend changes need reverting:

```bash
# Revert frontend files
git checkout HEAD -- resources/js/components/CampusSelector.tsx
git checkout HEAD -- resources/js/pages/Alumni/Profile/Edit.tsx

# Rebuild frontend
npm run build
```

---

## 9. Implementation Checklist

### Pre-Implementation
- [ ] Review this plan with stakeholders
- [ ] Confirm 2 emails to preserve are correct
- [ ] Verify database connection works
- [ ] Create backup directory: `storage/backups/`
- [ ] Test backup script on development database first

### Phase 1: Backup
- [ ] Run backup script: `php scripts/backup_database.php`
- [ ] Verify backup file created successfully
- [ ] Note backup file path for rollback
- [ ] Export alumni data to CSV for reference

### Phase 2: Campus Infrastructure
- [ ] Create `CaviteCampusInfrastructureSeeder.php`
- [ ] Run seeder: `php artisan db:seed --class=CaviteCampusInfrastructureSeeder`
- [ ] Verify Cavite departments created (5 departments)
- [ ] Verify Cavite courses created (~10 courses)
- [ ] Verify Cavite batches created (7 batches: 2018-2024)

### Phase 3: Data Deletion
- [ ] Create `DeleteNonPreservedAlumniSeeder.php`
- [ ] DOUBLE-CHECK preserved emails in code
- [ ] Run seeder: `php artisan db:seed --class=DeleteNonPreservedAlumniSeeder`
- [ ] Verify only 2 alumni remain
- [ ] Verify cascade deletions completed

### Phase 4: Alumni Seeding
- [ ] Create `ComprehensiveAlumniSeeder.php`
- [ ] Run seeder: `php artisan db:seed --class=ComprehensiveAlumniSeeder`
- [ ] Verify 202 total alumni (2 + 200)
- [ ] Check campus distribution (100 per campus)
- [ ] Verify employment data populated
- [ ] Check job mismatch data populated

### Phase 5: Campus Locking
- [ ] Update `CampusSelector.tsx` with disabled prop
- [ ] Update `Edit.tsx` with read-only campus display
- [ ] Update `UpdateAlumniProfileRequest.php` validation
- [ ] Update `AlumniController.php` update method
- [ ] Build frontend: `npm run build`
- [ ] Test with alumni account (should be locked)
- [ ] Test with admin account (should work)

### Phase 6: Verification
- [ ] Run all post-seeding tests
- [ ] Check dashboard analytics show realistic numbers
- [ ] Verify campus selector works for admins
- [ ] Verify alumni cannot change campus
- [ ] Check employment rate calculations
- [ ] Verify time-to-job analytics
- [ ] Check job mismatch breakdown

### Phase 7: Documentation
- [ ] Document new alumni count
- [ ] Update system documentation
- [ ] Create user guide for campus locking
- [ ] Note any issues encountered

---

## Summary of Concerns & Solutions

| # | Concern | Impact | Solution | Status |
|---|---------|--------|----------|--------|
| 1 | Data Loss Risk | High | Full backup + CSV export | ✅ Planned |
| 2 | Referential Integrity | High | Cascading deletion script | ✅ Planned |
| 3 | Incomplete Data | High | Comprehensive seeder | ✅ Planned |
| 4 | Campus Imbalance | Medium | Cavite infrastructure seeder | ✅ Planned |
| 5 | Campus Toggle | Medium | Frontend disable + Backend validation | ✅ Planned |
| 6 | Analytics Accuracy | High | Realistic data distribution | ✅ Planned |
| 7 | Department Missing | Critical | Create Cavite departments | ✅ Planned |
| 8 | Course Missing | Critical | Create Cavite courses | ✅ Planned |
| 9 | Batch Missing | Critical | Create Cavite batches | ✅ Planned |
| 10 | Rollback Plan | Critical | Backup restore procedure | ✅ Planned |

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Planning & Review | 1 hour | This document |
| Script Creation | 2 hours | PHP/Laravel knowledge |
| Backup & Preparation | 30 minutes | Database access |
| Infrastructure Setup | 15 minutes | Seeder created |
| Data Deletion | 10 minutes | Backup completed |
| Alumni Seeding | 20 minutes | Infrastructure ready |
| Campus Locking | 1 hour | Frontend/Backend changes |
| Testing & Verification | 1 hour | All phases complete |
| **TOTAL** | **~6 hours** | Full day of work |

---

## Next Steps

1. **Review this plan** - Ensure all concerns addressed
2. **Create scripts** - Implement all seeder files
3. **Test on development** - Never run on production first!
4. **Backup production** - Full database export
5. **Execute phases** - Follow checklist step-by-step
6. **Verify results** - Run all test queries
7. **Monitor analytics** - Check dashboard updates

---

**END OF DOCUMENT**
