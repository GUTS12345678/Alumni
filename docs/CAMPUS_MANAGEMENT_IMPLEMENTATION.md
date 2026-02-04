# Campus Management Implementation Plan

## EARIST Alumni Tracer System - Multi-Campus Support

**Document Version:** 1.0  
**Date:** February 3, 2026  
**Status:** Planning Phase  
**Priority:** HIGH

---

## Executive Summary

This document outlines the implementation plan for adding **Cavite Campus** support to the Alumni Tracer System. Currently, the system only supports the **Main Campus**. This implementation will enable:

- Multi-campus data segregation
- Campus-specific analytics and reporting
- Campus-specific content filtering
- Campus-based user assignments

---

## Table of Contents

1. [System Architecture Changes](#1-system-architecture-changes)
2. [Database Schema Updates](#2-database-schema-updates)
3. [Backend Implementation](#3-backend-implementation)
4. [Frontend Implementation](#4-frontend-implementation)
5. [Module-Specific Changes](#5-module-specific-changes)
6. [Migration Strategy](#6-migration-strategy)
7. [Testing Plan](#7-testing-plan)
8. [Deployment Strategy](#8-deployment-strategy)

---

## 1. System Architecture Changes

### 1.1 Campus Data Model

```typescript
interface Campus {
  id: number;
  name: string;
  code: 'MAIN' | 'CAV';
  display_name: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### 1.2 Global State Management

**Campus Context Provider:**
```typescript
// CampusContext.tsx
interface CampusContextType {
  selectedCampus: Campus | null;
  campuses: Campus[];
  setSelectedCampus: (campus: Campus) => void;
  isLoading: boolean;
}
```

### 1.3 Filtering Strategy

**Two Levels of Campus Filtering:**

1. **User-Level Campus Assignment** - Each user belongs to a campus
2. **View-Level Campus Selection** - Admin/Staff can switch between campuses to view data

---

## 2. Database Schema Updates

### 2.1 Campus Master Table

```sql
CREATE TABLE `campuses` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(10) UNIQUE NOT NULL,
    `display_name` VARCHAR(150) NOT NULL,
    `address` TEXT NULLABLE,
    `contact_email` VARCHAR(255) NULLABLE,
    `contact_phone` VARCHAR(20) NULLABLE,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (`code`),
    INDEX idx_active (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data
INSERT INTO `campuses` (`name`, `code`, `display_name`, `address`, `is_active`) VALUES
('EARIST Main Campus', 'MAIN', 'Main Campus - Manila', 'Nagtahan, Sampaloc, Manila', TRUE),
('EARIST Cavite Campus', 'CAV', 'Cavite Campus', 'Cavite Province', TRUE);
```

### 2.2 Tables Requiring Campus Field

#### Core Tables

```sql
-- Users table
ALTER TABLE `users` 
ADD COLUMN `campus_id` BIGINT UNSIGNED NOT NULL DEFAULT 1 AFTER `id`,
ADD CONSTRAINT `fk_users_campus` FOREIGN KEY (`campus_id`) REFERENCES `campuses`(`id`),
ADD INDEX `idx_campus_id` (`campus_id`);

-- Alumni Profiles table
ALTER TABLE `alumni_profiles` 
ADD COLUMN `campus_id` BIGINT UNSIGNED NOT NULL DEFAULT 1 AFTER `user_id`,
ADD CONSTRAINT `fk_alumni_profiles_campus` FOREIGN KEY (`campus_id`) REFERENCES `campuses`(`id`),
ADD INDEX `idx_campus_id` (`campus_id`);

-- Batches table
ALTER TABLE `batches` 
ADD COLUMN `campus_id` BIGINT UNSIGNED NOT NULL DEFAULT 1 AFTER `id`,
ADD CONSTRAINT `fk_batches_campus` FOREIGN KEY (`campus_id`) REFERENCES `campuses`(`id`),
ADD INDEX `idx_campus_id` (`campus_id`);
```

#### Academic Tables

```sql
-- Courses table
ALTER TABLE `courses` 
ADD COLUMN `campus_id` BIGINT UNSIGNED NOT NULL DEFAULT 1 AFTER `id`,
ADD CONSTRAINT `fk_courses_campus` FOREIGN KEY (`campus_id`) REFERENCES `campuses`(`id`),
ADD INDEX `idx_campus_id` (`campus_id`);

-- Departments table
ALTER TABLE `departments` 
ADD COLUMN `campus_id` BIGINT UNSIGNED NOT NULL DEFAULT 1 AFTER `id`,
ADD CONSTRAINT `fk_departments_campus` FOREIGN KEY (`campus_id`) REFERENCES `campuses`(`id`),
ADD INDEX `idx_campus_id` (`campus_id`);
```

#### Survey Tables

```sql
-- Surveys table
ALTER TABLE `surveys` 
ADD COLUMN `campus_id` BIGINT UNSIGNED NULLABLE AFTER `id`,
ADD COLUMN `is_multi_campus` BOOLEAN DEFAULT FALSE AFTER `campus_id`,
ADD CONSTRAINT `fk_surveys_campus` FOREIGN KEY (`campus_id`) REFERENCES `campuses`(`id`),
ADD INDEX `idx_campus_id` (`campus_id`);

-- Survey Responses table
ALTER TABLE `survey_responses` 
ADD COLUMN `campus_id` BIGINT UNSIGNED NOT NULL AFTER `user_id`,
ADD CONSTRAINT `fk_survey_responses_campus` FOREIGN KEY (`campus_id`) REFERENCES `campuses`(`id`),
ADD INDEX `idx_campus_id` (`campus_id`);
```

#### Job Board Tables

```sql
-- Job Postings table
ALTER TABLE `job_postings` 
ADD COLUMN `campus_id` BIGINT UNSIGNED NULLABLE AFTER `id`,
ADD COLUMN `is_multi_campus` BOOLEAN DEFAULT FALSE AFTER `campus_id`,
ADD CONSTRAINT `fk_job_postings_campus` FOREIGN KEY (`campus_id`) REFERENCES `campuses`(`id`),
ADD INDEX `idx_campus_id` (`campus_id`);

-- Job Applications table
ALTER TABLE `job_applications` 
ADD COLUMN `applicant_campus_id` BIGINT UNSIGNED NOT NULL AFTER `user_id`,
ADD CONSTRAINT `fk_job_applications_campus` FOREIGN KEY (`applicant_campus_id`) REFERENCES `campuses`(`id`),
ADD INDEX `idx_campus_id` (`applicant_campus_id`);
```

#### Announcement Tables

```sql
-- Announcements table
ALTER TABLE `announcements` 
ADD COLUMN `campus_id` BIGINT UNSIGNED NULLABLE AFTER `id`,
ADD COLUMN `is_multi_campus` BOOLEAN DEFAULT FALSE AFTER `campus_id`,
ADD CONSTRAINT `fk_announcements_campus` FOREIGN KEY (`campus_id`) REFERENCES `campuses`(`id`),
ADD INDEX `idx_campus_id` (`campus_id`);
```

### 2.3 Multi-Campus vs Campus-Specific Content

**Logic:**
- If `campus_id` is NULL and `is_multi_campus` = TRUE → Show to all campuses
- If `campus_id` is set → Show only to that specific campus

---

## 3. Backend Implementation

### 3.1 Campus Model

```php
<?php
// app/Models/Campus.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Campus extends Model
{
    protected $fillable = [
        'name',
        'code',
        'display_name',
        'address',
        'contact_email',
        'contact_phone',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Relationships
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function alumniProfiles(): HasMany
    {
        return $this->hasMany(AlumniProfile::class);
    }

    public function batches(): HasMany
    {
        return $this->hasMany(Batch::class);
    }

    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByCode($query, string $code)
    {
        return $query->where('code', $code);
    }
}
```

### 3.2 Campus Trait for Models

```php
<?php
// app/Traits/BelongsToCampus.php

namespace App\Traits;

use App\Models\Campus;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

trait BelongsToCampus
{
    /**
     * Get the campus that owns the model.
     */
    public function campus(): BelongsTo
    {
        return $this->belongsTo(Campus::class);
    }

    /**
     * Scope a query to only include models from a specific campus.
     */
    public function scopeForCampus(Builder $query, int|Campus $campus): Builder
    {
        $campusId = $campus instanceof Campus ? $campus->id : $campus;
        return $query->where('campus_id', $campusId);
    }

    /**
     * Scope a query to include multi-campus content.
     */
    public function scopeIncludeMultiCampus(Builder $query): Builder
    {
        if (isset($this->is_multi_campus)) {
            return $query->where(function ($q) {
                $q->whereNull('campus_id')
                  ->orWhere('is_multi_campus', true);
            });
        }
        return $query;
    }

    /**
     * Scope for campus-specific or multi-campus content.
     */
    public function scopeVisibleToCampus(Builder $query, int|Campus $campus): Builder
    {
        $campusId = $campus instanceof Campus ? $campus->id : $campus;
        
        if (isset($this->is_multi_campus)) {
            return $query->where(function ($q) use ($campusId) {
                $q->where('campus_id', $campusId)
                  ->orWhere('is_multi_campus', true)
                  ->orWhereNull('campus_id');
            });
        }
        
        return $query->where('campus_id', $campusId);
    }
}
```

### 3.3 Campus Middleware

```php
<?php
// app/Http/Middleware/EnsureCampusAccess.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureCampusAccess
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        
        // Allow admins and super admins to access all campuses
        if ($user && in_array($user->role, ['admin', 'super_admin'])) {
            return $next($request);
        }
        
        // For other users, ensure they can only access their campus data
        $requestedCampusId = $request->input('campus_id') ?? $request->route('campus_id');
        
        if ($requestedCampusId && $user->campus_id != $requestedCampusId) {
            return response()->json([
                'message' => 'You do not have access to this campus data.'
            ], 403);
        }
        
        return $next($request);
    }
}
```

### 3.4 Campus Service

```php
<?php
// app/Services/CampusService.php

namespace App\Services;

use App\Models\Campus;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class CampusService
{
    /**
     * Get all active campuses (cached).
     */
    public function getAllCampuses(): Collection
    {
        return Cache::remember('campuses.active', 3600, function () {
            return Campus::active()->get();
        });
    }

    /**
     * Get campus by code.
     */
    public function getCampusByCode(string $code): ?Campus
    {
        return Campus::byCode($code)->active()->first();
    }

    /**
     * Get statistics for a campus.
     */
    public function getCampusStatistics(Campus $campus): array
    {
        return [
            'total_alumni' => $campus->alumniProfiles()->count(),
            'total_batches' => $campus->batches()->count(),
            'total_courses' => $campus->courses()->count(),
            'total_departments' => $campus->departments()->count(),
            'active_surveys' => $campus->surveys()->where('status', 'active')->count(),
            'job_postings' => $campus->jobPostings()->where('status', 'active')->count(),
        ];
    }

    /**
     * Clear campus cache.
     */
    public function clearCache(): void
    {
        Cache::forget('campuses.active');
    }
}
```

---

## 4. Frontend Implementation

### 4.1 Campus Context Provider

```tsx
// resources/js/contexts/CampusContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface Campus {
  id: number;
  name: string;
  code: 'MAIN' | 'CAV';
  display_name: string;
  address: string;
  is_active: boolean;
}

interface CampusContextType {
  selectedCampus: Campus | null;
  campuses: Campus[];
  setSelectedCampus: (campus: Campus) => void;
  isLoading: boolean;
  canSwitchCampus: boolean;
}

const CampusContext = createContext<CampusContextType | undefined>(undefined);

export const CampusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canSwitchCampus, setCanSwitchCampus] = useState(false);

  useEffect(() => {
    fetchCampuses();
  }, []);

  const fetchCampuses = async () => {
    try {
      const response = await axios.get('/api/v1/campuses');
      const campusData = response.data.data;
      
      setCampuses(campusData);
      
      // Get user's campus or default to main
      const userCampusId = response.data.user_campus_id;
      const userRole = response.data.user_role;
      
      // Admins can switch campuses
      setCanSwitchCampus(['admin', 'super_admin'].includes(userRole));
      
      // Get saved campus preference or use user's campus
      const savedCampusId = localStorage.getItem('selected_campus_id');
      
      if (canSwitchCampus && savedCampusId) {
        const saved = campusData.find((c: Campus) => c.id === parseInt(savedCampusId));
        setSelectedCampus(saved || campusData.find((c: Campus) => c.id === userCampusId));
      } else {
        setSelectedCampus(campusData.find((c: Campus) => c.id === userCampusId));
      }
    } catch (error) {
      console.error('Failed to fetch campuses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetSelectedCampus = (campus: Campus) => {
    setSelectedCampus(campus);
    if (canSwitchCampus) {
      localStorage.setItem('selected_campus_id', campus.id.toString());
    }
  };

  return (
    <CampusContext.Provider
      value={{
        selectedCampus,
        campuses,
        setSelectedCampus: handleSetSelectedCampus,
        isLoading,
        canSwitchCampus,
      }}
    >
      {children}
    </CampusContext.Provider>
  );
};

export const useCampus = () => {
  const context = useContext(CampusContext);
  if (context === undefined) {
    throw new Error('useCampus must be used within a CampusProvider');
  }
  return context;
};
```

### 4.2 Campus Selector Component

```tsx
// resources/js/components/CampusSelector.tsx
import React from 'react';
import { useCampus } from '@/contexts/CampusContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const CampusSelector: React.FC<{ showLabel?: boolean }> = ({ 
  showLabel = true 
}) => {
  const { selectedCampus, campuses, setSelectedCampus, canSwitchCampus, isLoading } = useCampus();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4 animate-pulse" />
        <span>Loading campuses...</span>
      </div>
    );
  }

  if (!canSwitchCampus) {
    return (
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-maroon-600" />
        <Badge variant="secondary" className="font-medium">
          {selectedCampus?.display_name || 'Main Campus'}
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          <Building2 className="h-4 w-4" />
          Campus:
        </label>
      )}
      <Select
        value={selectedCampus?.id.toString()}
        onValueChange={(value) => {
          const campus = campuses.find((c) => c.id === parseInt(value));
          if (campus) setSelectedCampus(campus);
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select campus" />
        </SelectTrigger>
        <SelectContent>
          {campuses.map((campus) => (
            <SelectItem key={campus.id} value={campus.id.toString()}>
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                {campus.display_name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
```

### 4.3 Campus Filter Hook

```typescript
// resources/js/hooks/useCampusFilter.ts
import { useMemo } from 'react';
import { useCampus } from '@/contexts/CampusContext';

export const useCampusFilter = <T extends { campus_id?: number }>(
  data: T[] | undefined
): T[] => {
  const { selectedCampus } = useCampus();

  return useMemo(() => {
    if (!data || !selectedCampus) return data || [];
    
    return data.filter((item) => {
      // If no campus_id, it's multi-campus content
      if (!item.campus_id) return true;
      
      // Filter by selected campus
      return item.campus_id === selectedCampus.id;
    });
  }, [data, selectedCampus]);
};
```

---

## 5. Module-Specific Changes

### 5.1 Registration/Survey

#### Registration Form Update

```tsx
// resources/js/pages/Auth/Register.tsx - Add campus selection
<FormField
  label="Campus"
  name="campus_id"
  required
>
  <Select
    value={formData.campus_id}
    onValueChange={(value) => setFormData({ ...formData, campus_id: value })}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select your campus" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="1">EARIST Main Campus - Manila</SelectItem>
      <SelectItem value="2">EARIST Cavite Campus</SelectItem>
    </SelectContent>
  </Select>
</FormField>
```

#### Survey Registration Update

```php
// app/Http/Controllers/Api/SurveyController.php
public function register(Request $request)
{
    $validated = $request->validate([
        // ... existing validations
        'campus_id' => 'required|exists:campuses,id',
    ]);

    // Include campus_id in user creation
    $user = User::create([
        // ... existing fields
        'campus_id' => $validated['campus_id'],
    ]);

    // ...
}
```

### 5.2 Dashboard

#### Dashboard with Campus Stats

```tsx
// resources/js/pages/Dashboard/Index.tsx
import { CampusSelector } from '@/components/CampusSelector';
import { useCampus } from '@/contexts/CampusContext';

export default function Dashboard() {
  const { selectedCampus } = useCampus();
  const { data: stats } = useQuery(
    ['dashboard-stats', selectedCampus?.id],
    () => fetchDashboardStats(selectedCampus?.id)
  );

  return (
    <div className="space-y-6">
      {/* Campus Selector in Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <CampusSelector />
      </div>

      {/* Campus-specific stats */}
      <StatsCards stats={stats} campus={selectedCampus} />
      
      {/* Rest of dashboard */}
    </div>
  );
}
```

#### Backend Dashboard API

```php
// app/Http/Controllers/Api/DashboardController.php
public function getStats(Request $request)
{
    $campusId = $request->input('campus_id', auth()->user()->campus_id);
    
    // Ensure user has access to this campus
    $this->authorize('viewCampus', Campus::findOrFail($campusId));

    return response()->json([
        'total_alumni' => AlumniProfile::forCampus($campusId)->count(),
        'active_batches' => Batch::forCampus($campusId)->active()->count(),
        'active_surveys' => Survey::visibleToCampus($campusId)->active()->count(),
        'job_postings' => JobPosting::visibleToCampus($campusId)->active()->count(),
        // ... more stats
    ]);
}
```

### 5.3 Analytics

```tsx
// resources/js/pages/Analytics/Index.tsx
export default function Analytics() {
  const { selectedCampus } = useCampus();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <CampusSelector />
      </div>

      {/* Campus-specific analytics */}
      <CampusAnalytics campusId={selectedCampus?.id} />
    </div>
  );
}
```

### 5.4 Alumni Bank

```tsx
// resources/js/pages/Alumni/AlumniBank.tsx
export default function AlumniBank() {
  const { selectedCampus } = useCampus();
  const [filters, setFilters] = useState({
    campus_id: selectedCampus?.id,
    // ... other filters
  });

  // Update filters when campus changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, campus_id: selectedCampus?.id }));
  }, [selectedCampus]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Alumni Bank</h1>
        <CampusSelector />
      </div>

      <AlumniList filters={filters} />
    </div>
  );
}
```

### 5.5 Batch Management

```tsx
// resources/js/pages/Admin/Batches/Index.tsx
export default function BatchManagement() {
  const { selectedCampus } = useCampus();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1>Batch Management</h1>
        <CampusSelector />
      </div>

      {/* Create batch with campus */}
      <BatchForm campusId={selectedCampus?.id} />
      
      {/* List campus-specific batches */}
      <BatchList campusId={selectedCampus?.id} />
    </div>
  );
}
```

### 5.6 Survey Bank

```tsx
// resources/js/pages/Admin/Surveys/SurveyBank.tsx
export default function SurveyBank() {
  const { selectedCampus } = useCampus();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1>Survey Bank</h1>
        <div className="flex items-center gap-4">
          <CampusSelector />
          <Button onClick={handleCreateSurvey}>Create Survey</Button>
        </div>
      </div>

      {/* Survey creation form with campus options */}
      <SurveyForm>
        <CampusTargeting />  {/* Choose specific campus or multi-campus */}
      </SurveyForm>

      {/* Campus-filtered survey list */}
      <SurveyList campusId={selectedCampus?.id} />
    </div>
  );
}
```

### 5.7 Job Board

```tsx
// resources/js/pages/Jobs/JobBoard.tsx
export default function JobBoard() {
  const { selectedCampus } = useCampus();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1>Job Board</h1>
        <CampusSelector />
      </div>

      {/* Job posting form with campus targeting */}
      <JobPostingForm>
        <div className="space-y-2">
          <Label>Target Campus</Label>
          <RadioGroup>
            <RadioGroupItem value="all">All Campuses</RadioGroupItem>
            <RadioGroupItem value="main">Main Campus Only</RadioGroupItem>
            <RadioGroupItem value="cavite">Cavite Campus Only</RadioGroupItem>
          </RadioGroup>
        </div>
      </JobPostingForm>

      {/* Campus-filtered jobs */}
      <JobList campusId={selectedCampus?.id} />
    </div>
  );
}
```

### 5.8 Announcements

```tsx
// resources/js/pages/Announcements/Index.tsx
export default function Announcements() {
  const { selectedCampus } = useCampus();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1>Announcements</h1>
        <CampusSelector />
      </div>

      {/* Announcement form with campus targeting */}
      <AnnouncementForm>
        <CampusTargetingOptions />
      </AnnouncementForm>

      {/* Campus-filtered announcements */}
      <AnnouncementList campusId={selectedCampus?.id} />
    </div>
  );
}
```

### 5.9 Department Management

```tsx
// resources/js/pages/Admin/Departments/Index.tsx
export default function DepartmentManagement() {
  const { selectedCampus } = useCampus();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1>Department Management</h1>
        <CampusSelector />
      </div>

      {/* Departments are campus-specific */}
      <DepartmentList campusId={selectedCampus?.id} />
      <CreateDepartment campusId={selectedCampus?.id} />
    </div>
  );
}
```

### 5.10 Course Management

```tsx
// resources/js/pages/Admin/Courses/CourseManagement.tsx
export default function CourseManagement() {
  const { selectedCampus } = useCampus();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1>Course Management</h1>
        <CampusSelector />
      </div>

      {/* Courses are campus-specific */}
      <CourseList campusId={selectedCampus?.id} />
      <CreateCourse campusId={selectedCampus?.id} />
    </div>
  );
}
```

---

## 6. Migration Strategy

### 6.1 Data Migration Plan

```php
<?php
// database/migrations/2026_02_03_000001_add_campus_support.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Step 1: Create campuses table
        Schema::create('campuses', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('code', 10)->unique();
            $table->string('display_name', 150);
            $table->text('address')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone', 20)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index('code');
            $table->index('is_active');
        });

        // Step 2: Seed initial campuses
        DB::table('campuses')->insert([
            [
                'name' => 'EARIST Main Campus',
                'code' => 'MAIN',
                'display_name' => 'Main Campus - Manila',
                'address' => 'Nagtahan, Sampaloc, Manila',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'EARIST Cavite Campus',
                'code' => 'CAV',
                'display_name' => 'Cavite Campus',
                'address' => 'Cavite Province',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Step 3: Add campus_id to tables
        $tables = [
            'users',
            'alumni_profiles',
            'batches',
            'courses',
            'departments',
        ];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->foreignId('campus_id')
                    ->default(1) // Default to Main Campus
                    ->after('id')
                    ->constrained('campuses');
                $table->index('campus_id');
            });
        }

        // Step 4: Add campus support to content tables
        $contentTables = ['surveys', 'job_postings', 'announcements'];
        
        foreach ($contentTables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->foreignId('campus_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('campuses');
                $table->boolean('is_multi_campus')->default(false)->after('campus_id');
                $table->index('campus_id');
            });
        }
    }

    public function down(): void
    {
        // Reverse the migration
        $allTables = [
            'users', 'alumni_profiles', 'batches', 'courses', 'departments',
            'surveys', 'job_postings', 'announcements'
        ];

        foreach ($allTables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropForeign(['campus_id']);
                $table->dropColumn(['campus_id']);
            });
        }

        $contentTables = ['surveys', 'job_postings', 'announcements'];
        foreach ($contentTables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropColumn('is_multi_campus');
            });
        }

        Schema::dropIfExists('campuses');
    }
};
```

### 6.2 Data Seeding for Existing Records

```php
<?php
// database/seeders/CampusDataSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Campus;

class CampusDataSeeder extends Seeder
{
    public function run(): void
    {
        // All existing data defaults to Main Campus (id = 1)
        // This is handled by the migration with DEFAULT 1
        
        // Optionally, update specific records to Cavite campus
        // if you have identifiable data
        
        $this->command->info('All existing records assigned to Main Campus by default.');
        $this->command->info('Update specific records manually to assign them to Cavite Campus.');
    }
}
```

---

## 7. Testing Plan

### 7.1 Unit Tests

```php
<?php
// tests/Unit/CampusTest.php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Campus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CampusTest extends TestCase
{
    use RefreshDatabase;

    public function test_campus_can_be_created()
    {
        $campus = Campus::factory()->create([
            'code' => 'TEST',
            'name' => 'Test Campus',
        ]);

        $this->assertDatabaseHas('campuses', [
            'code' => 'TEST',
            'name' => 'Test Campus',
        ]);
    }

    public function test_user_belongs_to_campus()
    {
        $campus = Campus::factory()->create();
        $user = User::factory()->create(['campus_id' => $campus->id]);

        $this->assertEquals($campus->id, $user->campus->id);
    }

    public function test_campus_filtering_scope()
    {
        $mainCampus = Campus::factory()->create(['code' => 'MAIN']);
        $caviteCampus = Campus::factory()->create(['code' => 'CAV']);

        User::factory()->count(5)->create(['campus_id' => $mainCampus->id]);
        User::factory()->count(3)->create(['campus_id' => $caviteCampus->id]);

        $mainUsers = User::forCampus($mainCampus->id)->count();
        $caviteUsers = User::forCampus($caviteCampus->id)->count();

        $this->assertEquals(5, $mainUsers);
        $this->assertEquals(3, $caviteUsers);
    }
}
```

### 7.2 Feature Tests

```php
<?php
// tests/Feature/CampusAccessTest.php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Campus;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CampusAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_access_all_campuses()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $campus = Campus::factory()->create();

        $response = $this->actingAs($admin)
            ->get('/api/v1/campuses/' . $campus->id . '/stats');

        $response->assertOk();
    }

    public function test_user_cannot_access_other_campus_data()
    {
        $mainCampus = Campus::factory()->create(['code' => 'MAIN']);
        $caviteCampus = Campus::factory()->create(['code' => 'CAV']);

        $user = User::factory()->create([
            'role' => 'alumni',
            'campus_id' => $mainCampus->id,
        ]);

        $response = $this->actingAs($user)
            ->get('/api/v1/campuses/' . $caviteCampus->id . '/alumni');

        $response->assertForbidden();
    }
}
```

### 7.3 Frontend Tests

```typescript
// resources/js/__tests__/CampusSelector.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { CampusSelector } from '@/components/CampusSelector';
import { CampusProvider } from '@/contexts/CampusContext';

describe('CampusSelector', () => {
  it('renders campus options', () => {
    render(
      <CampusProvider>
        <CampusSelector />
      </CampusProvider>
    );

    expect(screen.getByText(/Main Campus/i)).toBeInTheDocument();
    expect(screen.getByText(/Cavite Campus/i)).toBeInTheDocument();
  });

  it('changes campus on selection', () => {
    render(
      <CampusProvider>
        <CampusSelector />
      </CampusProvider>
    );

    const selector = screen.getByRole('combobox');
    fireEvent.change(selector, { target: { value: '2' } });

    expect(screen.getByText(/Cavite Campus/i)).toBeInTheDocument();
  });
});
```

---

## 8. Deployment Strategy

### 8.1 Pre-Deployment Checklist

- [ ] Database backup completed
- [ ] All migrations tested in staging
- [ ] Frontend build tested
- [ ] All API endpoints tested
- [ ] Cache cleared
- [ ] Documentation updated

### 8.2 Deployment Steps

```bash
# Step 1: Backup database
php artisan db:backup

# Step 2: Enable maintenance mode
php artisan down

# Step 3: Pull latest code
git pull origin main

# Step 4: Install dependencies
composer install --optimize-autoloader --no-dev
npm install
npm run build

# Step 5: Run migrations
php artisan migrate --force

# Step 6: Clear and optimize
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan route:clear
php artisan optimize

# Step 7: Bring application back online
php artisan up
```

### 8.3 Post-Deployment Verification

```bash
# Test API endpoints
curl https://akndev.tech/api/v1/campuses

# Verify database
php artisan tinker
>>> Campus::count()
>>> User::first()->campus

# Check logs
tail -f storage/logs/laravel.log
```

### 8.4 Rollback Plan

```bash
# If issues arise, rollback
php artisan down
php artisan migrate:rollback --step=1
git checkout <previous-commit>
composer install
npm install
npm run build
php artisan optimize
php artisan up
```

---

## Implementation Timeline

### Phase 1: Database & Backend (Week 1)
- [ ] Create campus table and migrations
- [ ] Add campus relationships to models
- [ ] Implement campus trait and middleware
- [ ] Create campus service
- [ ] Update API endpoints
- [ ] Write backend tests

### Phase 2: Frontend Foundation (Week 1-2)
- [ ] Create campus context provider
- [ ] Build campus selector component
- [ ] Implement campus filter hook
- [ ] Update app layout with campus selector

### Phase 3: Module Updates (Week 2-3)
- [ ] Update registration/survey forms
- [ ] Update dashboard with campus filtering
- [ ] Update analytics
- [ ] Update alumni bank
- [ ] Update batch management
- [ ] Update survey bank
- [ ] Update job board
- [ ] Update announcements
- [ ] Update departments
- [ ] Update course management

### Phase 4: Testing & QA (Week 3-4)
- [ ] Unit testing
- [ ] Feature testing
- [ ] Frontend testing
- [ ] User acceptance testing
- [ ] Performance testing

### Phase 5: Deployment (Week 4)
- [ ] Staging deployment
- [ ] Production deployment
- [ ] Monitoring and bug fixes

---

## Notes

- All existing data will default to **Main Campus (ID: 1)**
- Admins can switch between campuses
- Alumni/Users are locked to their assigned campus
- Content can be campus-specific or multi-campus
- Campus selection persists in localStorage for admins
- All API requests include campus context
- Analytics are campus-specific by default

---

## Success Criteria

✅ Users can register with campus selection  
✅ Campus selector appears in all major pages  
✅ Data is properly filtered by campus  
✅ Admin can switch between campuses  
✅ Analytics show campus-specific data  
✅ Multi-campus content works correctly  
✅ No breaking changes for existing functionality  
✅ All tests pass  
✅ Performance remains optimal  

---

*Document maintained by: Development Team*  
*Last updated: February 3, 2026*
