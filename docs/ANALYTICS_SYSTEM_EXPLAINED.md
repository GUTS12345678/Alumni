# Analytics System Explained

## EARIST Alumni Tracer System - Analytics Documentation

**Document Version:** 1.0  
**Date:** February 3, 2026  
**For:** Easy Understanding of Analytics Processes

---

## Table of Contents

1. [Overview](#overview)
2. [Data Sources](#data-sources)
3. [Time-to-Job Analytics](#time-to-job-analytics)
4. [Job Mismatch Analytics](#job-mismatch-analytics)
5. [Employment Status Tracking](#employment-status-tracking)
6. [Department Analytics](#department-analytics)
7. [Survey Analytics](#survey-analytics)
8. [How Inconsistencies Happen](#how-inconsistencies-happen)
9. [Data Flow Diagrams](#data-flow-diagrams)

---

## Overview

The Analytics System tracks **3 main things**:

1. **How fast alumni get jobs** after graduation (Time-to-Job)
2. **Are alumni working in jobs that match their degree?** (Job Alignment)
3. **Are alumni overqualified, underqualified, or unfit for their jobs?** (Job Mismatch)

---

## Data Sources

### Where Analytics Get Data From:

The system pulls data from **two tables**:

#### 1. `alumni_profiles` Table
**Primary source** - Stores basic alumni information:
- `graduation_year` - When they graduated
- `enrollment_year` - When they started studying
- `employment_status` - Current employment status (employed_full_time, unemployed, etc.)
- `job_start_date` - When they started their current job
- `job_mismatch_reason` - Why their job doesn't match their degree (overqualified, unfit, etc.)
- `job_related_to_degree` - Boolean: Is job related to their degree?
- `job_satisfaction` - Rating 1-10

#### 2. `employments` Table
**Detailed job history** - Stores complete employment records:
- `start_date` - When they started this job
- `end_date` - When they left (null if current job)
- `is_current` - Boolean: Still working here?
- `company_name` - Employer name
- `job_title` - Position title
- `alumni_id` - Links to alumni_profiles

### Data Priority Logic:

```
IF employment record exists in `employments` table:
    ✅ USE data from `employments` (more accurate, detailed)
ELSE:
    ⚠️ FALLBACK to `alumni_profiles` data (basic info only)
```

**Why two sources?**
- Old data: Only has `alumni_profiles` (before employment tracking was added)
- New data: Has both tables
- System combines both for complete picture

---

## Time-to-Job Analytics

### 📊 What It Measures:
**How many days** between graduation and getting first job.

### 🔍 Simple Process:

```
Step 1: Get graduation date
   - From: alumni_profiles.graduation_year
   - Assumes: June 1st of that year (e.g., 2020-06-01)

Step 2: Get first job start date
   - Priority 1: employments.start_date (from employments table)
   - Priority 2: alumni_profiles.job_start_date (fallback)

Step 3: Calculate days between
   - Formula: job_start_date - graduation_date = X days
   - Example: 2020-09-15 - 2020-06-01 = 106 days

Step 4: Group by graduation year
   - Average all alumni from same year
   - Example: 2020 graduates → average 120 days to get job
```

### 📈 Metrics Calculated:

| Metric | Description | How It's Calculated |
|--------|-------------|-------------------|
| **Average Days** | Mean time to employment | Sum of all days ÷ number of employed alumni |
| **Median Days** | Middle value (reduces outlier effect) | Sort all values, pick middle one |
| **Employment Rate** | % who got jobs | (Employed alumni ÷ Total alumni) × 100 |
| **Program Breakdown** | Per-degree performance | Group by degree_program, calculate average |

### Example Output:

```json
{
  "graduation_year": 2020,
  "avg_days_to_job": 120.5,
  "median_days": 95,
  "total_alumni": 450,
  "employed_alumni": 385,
  "employment_rate": 85.6,
  "program_breakdown": [
    {
      "program": "BS Computer Science",
      "avg_days": 60,
      "alumni_count": 80
    },
    {
      "program": "BS Civil Engineering",
      "avg_days": 150,
      "alumni_count": 95
    }
  ]
}
```

---

## Job Mismatch Analytics

### 📊 What It Measures:
**Is the alumni working in a job that matches their education level and field?**

### 🎯 Four Categories:

#### 1. **Overqualified** 🎓➡️💼
**Definition:** Alumni has higher education than job requires

**Example:**
```
Alumni:
  - Degree: Master's in Computer Science
  - Job: Data Entry Clerk (requires High School diploma)
  
Result: OVERQUALIFIED ⚠️
```

**How System Detects:**
```php
alumni_profiles.job_mismatch_reason = 'overqualified'
```

#### 2. **Underqualified** 📚➡️💼
**Definition:** Alumni has lower education than job requires

**Example:**
```
Alumni:
  - Degree: Bachelor's in Business
  - Job: Senior Executive (requires Master's + 10 years exp)
  
Result: UNDERQUALIFIED ⚠️
```

**How System Detects:**
```php
alumni_profiles.job_mismatch_reason = 'underqualified'
```

#### 3. **Unfit** ❌➡️💼
**Definition:** Alumni's degree field does NOT match job field

**Example:**
```
Alumni:
  - Degree: BS Nursing
  - Job: Software Developer
  
Result: UNFIT (completely different field) ⚠️
```

**How System Detects:**
```php
alumni_profiles.job_mismatch_reason = 'unfit'
AND
alumni_profiles.job_related_to_degree = 0
```

#### 4. **Good Match** ✅➡️💼
**Definition:** Education level and field align with job

**Example:**
```
Alumni:
  - Degree: BS Computer Science
  - Job: Software Engineer
  
Result: GOOD MATCH ✅
```

**How System Detects:**
```php
alumni_profiles.job_mismatch_reason = 'none' OR NULL
AND
alumni_profiles.job_related_to_degree = 1
```

### 🔍 Detection Process:

```
Step 1: Get all employed alumni
   - From: employments table (where is_current = true)
   - Fallback: alumni_profiles (where employment_status = employed)

Step 2: Check job_mismatch_reason field
   - Values: 'overqualified', 'underqualified', 'unfit', 'none', NULL
   
Step 3: Check job_related_to_degree field
   - 1 = Job is related to their degree
   - 0 = Job is NOT related to their degree

Step 4: Count each category
   - Overqualified: COUNT(*) where job_mismatch_reason = 'overqualified'
   - Unfit: COUNT(*) where job_mismatch_reason = 'unfit'
   - Good Match: COUNT(*) where job_mismatch_reason = 'none' OR NULL

Step 5: Calculate percentages
   - Formula: (Count in category ÷ Total employed) × 100
```

### Example Output:

```json
{
  "total_employed": 1250,
  "job_mismatch_breakdown": {
    "overqualified": {
      "count": 180,
      "percentage": 14.4
    },
    "underqualified": {
      "count": 45,
      "percentage": 3.6
    },
    "unfit": {
      "count": 125,
      "percentage": 10.0
    },
    "none": {
      "count": 900,
      "percentage": 72.0
    }
  },
  "job_related_to_degree": {
    "related_count": 975,
    "unrelated_count": 275,
    "related_percentage": 78.0,
    "unrelated_percentage": 22.0
  }
}
```

### Visual Breakdown:

```
Total Employed Alumni: 1,250
│
├─ 72% (900) → Good Match ✅
│   └─ Job matches degree level and field
│
├─ 14.4% (180) → Overqualified 🎓
│   └─ Too much education for the job
│
├─ 10% (125) → Unfit ❌
│   └─ Working in completely different field
│
└─ 3.6% (45) → Underqualified 📚
    └─ Not enough education for the job
```

---

## Employment Status Tracking

### 📊 Employment Status Values:

| Status | Meaning | Counted As |
|--------|---------|-----------|
| `employed_full_time` | Working 40+ hours/week | ✅ Employed |
| `employed_part_time` | Working <40 hours/week | ✅ Employed |
| `self_employed` | Running own business | ✅ Employed |
| `unemployed_seeking` | Looking for work | ❌ Unemployed |
| `unemployed_not_seeking` | Not looking for work | ❌ Unemployed |
| `pursuing_higher_education` | Studying | 📚 Not in workforce |

### Employment Rate Calculation:

```
Employment Rate = (Employed Alumni ÷ Total Graduated Alumni) × 100

Example:
- Total Alumni: 500
- Employed Full-time: 300
- Employed Part-time: 50
- Self-employed: 30
- Unemployed: 120

Employed = 300 + 50 + 30 = 380
Employment Rate = (380 ÷ 500) × 100 = 76%
```

---

## Department Analytics

### 📊 What It Tracks Per Department:

```json
{
  "department": "College of Engineering",
  "employment": {
    "employment_rate": 87.5,
    "avg_time_to_employment": 95.3,
    "total_alumni": 450,
    "employed": 394
  },
  "surveys": {
    "response_rate": 68.2,
    "total_sent": 450,
    "total_completed": 307
  },
  "activity": {
    "active_percentage": 75.6,
    "recent_logins_30d": 340,
    "profile_completion_avg": 82.1
  },
  "growth": {
    "new_alumni_6m": 45,
    "total_batches": 12
  }
}
```

### Key Metrics Explained:

| Metric | Formula | Purpose |
|--------|---------|---------|
| **Employment Rate** | (Employed ÷ Total) × 100 | How many got jobs |
| **Avg Time to Employment** | Average days to first job | How fast they get hired |
| **Response Rate** | (Completed surveys ÷ Sent) × 100 | Alumni engagement |
| **Active Percentage** | (Active users ÷ Total) × 100 | System usage |
| **Profile Completion** | Average % of filled fields | Data quality |

---

## Survey Analytics

### 📊 Response Tracking:

```
Total Surveys Sent: 500
├─ Completed: 350 (70% response rate)
├─ Incomplete: 80 (16% started but didn't finish)
└─ Not Started: 70 (14% never opened)
```

### Completion Rate:

```
Completion Rate = (Completed ÷ Sent) × 100
Response Rate = Same as Completion Rate

Example:
- Sent: 500
- Completed: 350
- Rate: 70%
```

---

## How Inconsistencies Happen

### 🐛 Common Issues:

#### 1. **Missing Employment Dates**
```
Problem: Alumni profile says "employed" but no job_start_date
Result: Can't calculate time-to-job
Impact: Analytics show 0 days or skip this alumni

Fix: Run cleanup script to populate missing dates
```

#### 2. **Invalid Date Logic**
```
Problem: end_date is BEFORE start_date
Example:
  - start_date: 2021-01-01
  - end_date: 2020-12-31 (1 year BEFORE start!)

Result: Negative days worked
Impact: Crashes analytics calculations

Fix: Swap dates or set end_date to NULL
```

#### 3. **Orphaned Records**
```
Problem: Employment record exists but alumni profile deleted
Result: Employment data with no owner
Impact: Analytics count jobs but not people

Fix: Delete orphaned employment records
```

#### 4. **Duplicate Student IDs**
```
Problem: Two alumni profiles with same student_id
Example:
  - Record 1: John Doe (2020-12345)
  - Record 2: Jane Smith (2020-12345) ← Same ID!

Result: Analytics double-count one person
Impact: Inflated numbers

Fix: Identify and merge duplicates
```

#### 5. **Enrollment After Graduation**
```
Problem: enrollment_year >= graduation_year
Example:
  - Enrolled: 2022
  - Graduated: 2020 (2 years EARLIER!)

Result: Impossible timeline
Impact: Analytics show negative study duration

Fix: Recalculate enrollment_year = graduation_year - 4
```

#### 6. **Future Dates**
```
Problem: Job starts in the future
Example:
  - Today: 2026-02-03
  - job_start_date: 2027-05-01

Result: Can't calculate accurate time-to-job
Impact: Analytics show negative days

Fix: Set to current date or graduation date
```

---

## Data Flow Diagrams

### Time-to-Job Analytics Flow:

```
┌─────────────────┐
│ User Graduates  │
│  (June 2020)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Stored in       │
│ alumni_profiles │
│ graduation_year │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Alumni Gets Job │
│ (Sept 2020)     │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌────────────────┐  ┌──────────────────┐
│ employments    │  │ alumni_profiles  │
│ table          │  │ job_start_date   │
│ start_date     │  │ (fallback)       │
└────────┬───────┘  └────────┬─────────┘
         │                   │
         └─────────┬─────────┘
                   │
                   ▼
┌──────────────────────────────────┐
│ Analytics Controller             │
│ Calculate:                       │
│ Sept 1 - June 1 = 92 days       │
└────────────────┬─────────────────┘
                 │
                 ▼
┌────────────────────────────────┐
│ Display in Dashboard           │
│ "Average: 92 days to job"      │
└────────────────────────────────┘
```

### Job Mismatch Detection Flow:

```
┌─────────────────┐
│ Alumni Profile  │
│ Created         │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ User Fills Survey:              │
│ "Is your job related to degree?"│
│ "How satisfied are you?"        │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ System Stores:                  │
│ - job_related_to_degree: 0/1    │
│ - job_mismatch_reason: string   │
│ - job_satisfaction: 1-10        │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Analytics Controller Reads:     │
│                                 │
│ IF job_mismatch_reason =        │
│    'overqualified' → Count it   │
│ IF job_mismatch_reason =        │
│    'unfit' → Count it           │
│ IF job_related_to_degree = 0    │
│    → Count as Unrelated         │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Display Dashboard:              │
│ "14% Overqualified"             │
│ "10% Unfit"                     │
│ "78% Job Related to Degree"     │
└─────────────────────────────────┘
```

---

## Analytics Queries Explained

### Example 1: Employment Rate

```sql
-- Get total alumni for a year
SELECT COUNT(*) as total_alumni
FROM alumni_profiles
WHERE graduation_year = 2020;

-- Get employed alumni
SELECT COUNT(*) as employed
FROM alumni_profiles
WHERE graduation_year = 2020
AND employment_status IN ('employed_full_time', 'employed_part_time', 'self_employed');

-- Calculate rate
SELECT 
    (employed / total_alumni) * 100 as employment_rate
```

### Example 2: Time to Job

```sql
-- Get average days from graduation to first job
SELECT 
    graduation_year,
    AVG(DATEDIFF(job_start_date, CONCAT(graduation_year, '-06-01'))) as avg_days
FROM alumni_profiles
WHERE job_start_date IS NOT NULL
AND employment_status IN ('employed_full_time', 'employed_part_time', 'self_employed')
GROUP BY graduation_year
ORDER BY graduation_year;
```

### Example 3: Job Mismatch Breakdown

```sql
-- Count each mismatch category
SELECT 
    job_mismatch_reason,
    COUNT(*) as count,
    (COUNT(*) / total_employed * 100) as percentage
FROM alumni_profiles
WHERE employment_status IN ('employed_full_time', 'employed_part_time', 'self_employed')
GROUP BY job_mismatch_reason;
```

---

## Summary of Analytics

### 🎯 What Gets Measured:

1. **Speed to Employment**
   - How many days after graduation?
   - Which programs are fastest?
   - Is it improving over time?

2. **Job Alignment**
   - Is job related to degree? (Yes/No)
   - Overqualified? (Education too high for job)
   - Underqualified? (Education too low for job)
   - Unfit? (Completely different field)

3. **Employment Quality**
   - Job satisfaction rating
   - Full-time vs part-time
   - Unemployment reasons

4. **Institutional Performance**
   - Employment rate per department
   - Response rate to surveys
   - Profile completion rates

### 🔧 Why Data Cleanup Is Important:

**Before Cleanup:**
- 180 alumni with invalid dates → Analytics show wrong averages
- 45 orphaned records → Counts don't match
- 25 duplicate IDs → Double counting

**After Cleanup:**
- ✅ Accurate employment rates
- ✅ Correct time-to-job calculations
- ✅ Reliable mismatch statistics
- ✅ Clean department comparisons

### 📊 How to Read Analytics:

**Good Indicators:**
- ✅ High employment rate (>75%)
- ✅ Low avg days to job (<120 days)
- ✅ High % of job-related work (>70%)
- ✅ Low % overqualified (<15%)
- ✅ High survey response rate (>60%)

**Red Flags:**
- ⚠️ Low employment rate (<60%)
- ⚠️ High avg days to job (>180 days)
- ⚠️ High % unfit (>20%)
- ⚠️ Many overqualified (>25%)
- ⚠️ Low response rate (<40%)

---

## Next Steps

1. **Run Data Audit:**
   ```bash
   php scripts/audit_alumni_data.php
   ```

2. **Review Issues Found**

3. **Run Data Cleanup:**
   ```bash
   # Dry run first (see what would change)
   php scripts/cleanup_alumni_data.php --dry-run
   
   # Actually fix issues
   php scripts/cleanup_alumni_data.php
   ```

4. **Re-run Audit:**
   ```bash
   php scripts/audit_alumni_data.php
   ```

5. **Check Analytics:**
   - Visit Dashboard
   - View Department Analytics
   - Export Reports

---

*This document explains the analytics system in simple terms for easy understanding.*  
*For technical implementation details, see: AnalyticsController.php*
