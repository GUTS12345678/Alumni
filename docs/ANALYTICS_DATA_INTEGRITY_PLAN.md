# Analytics & Data Integrity — Comprehensive Audit & Fix Plan

> **Date:** June 2025  
> **System:** Alumni Tracer System (EARIST)  
> **Stack:** Laravel 11 + React 18 + MySQL  
> **Status:** ACTIVE — Issues found and being resolved

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Database Schema Analysis](#2-database-schema-analysis)
3. [Data Quality Issues Found](#3-data-quality-issues-found)
4. [Code Logic Bugs Found](#4-code-logic-bugs-found)
5. [Metric-by-Metric Audit](#5-metric-by-metric-audit)
6. [Root Cause Analysis](#6-root-cause-analysis)
7. [Fix Implementation Plan](#7-fix-implementation-plan)
8. [Verification Checklist](#8-verification-checklist)
9. [Preventive Measures](#9-preventive-measures)

---

## 1. Executive Summary

A deep audit of the Alumni Tracer System's analytics pipeline identified **7 data quality issues** and **9 code logic bugs** that cause incorrect or misleading analytics output. The problems fall into three categories:

| Category | Count | Severity |
|----------|-------|----------|
| **Contradictory data in alumni records** | 4 issues | HIGH — produces wrong numbers |
| **Missing data that skews calculations** | 3 issues | MEDIUM — understates metrics |
| **Code logic bugs in analytics queries** | 9 bugs | HIGH — inconsistent/wrong output |

**Key findings:**
- **Two competing definitions of "job alignment"** across dashboard vs. analytics page — one uses `job_related_to_degree=1`, the other uses `job_mismatch_reason IS NULL`
- **71 alumni have contradictory data**: `job_mismatch_reason` says overqualified/underqualified/unfit, but `job_related_to_degree=1` (should be 0)
- **199 non-employed alumni have `job_start_date`** — pollutes program performance calculations  
- **"Attrition Rate"** maps `unemployed→dropout` and `continuing_ed→transferred` because batch enrollment data is all NULL — produces semantically wrong results
- **Program-wise "aligned" count includes non-employed alumni** — can produce alignment rates >100%
- **Time-to-job averages are extreme** (2015 batch: 8.3 years average) — no upper-bound cap on outliers, and `job_start_date` likely refers to *current* job, not *first* job after graduation

---

## 2. Database Schema Analysis

### 2.1 Core Tables & Relationships

```
┌─────────────────┐     ┌──────────┐     ┌────────────┐
│ alumni_profiles  │────>│ courses  │────>│ departments │
│  (548 rows)      │     │ (69)     │     │ (15)        │
│                  │     └──────────┘     └────────────┘
│  campus_id ──────│──────────────────────>┌──────────┐
│  batch_id ───────│──────────────────────>│ campuses │
│  user_id ────────│──┐                    │ (2)      │
└─────────────────┘  │                    └──────────┘
       │              │   ┌──────────┐
       │              └──>│ users    │
       v                  └──────────┘
┌─────────────────┐
│ employments     │  (270 rows, 179 distinct alumni)
│  alumni_id ─────│──> alumni_profiles.id
└─────────────────┘

┌──────────┐
│ batches  │  (11 rows, enrollment columns ALL NULL)
│  campus_id──> campuses.id
└──────────┘
```

### 2.2 Key Fields for Analytics

| Field | Table | Type | Completeness | Used For |
|-------|-------|------|-------------|----------|
| `employment_status` | alumni_profiles | enum(8 values) | 100% (548/548) | Employment rate, all employment metrics |
| `graduation_year` | alumni_profiles | year | 100% (548/548) | Time-to-job, enrollment metrics, all year-based |
| `graduation_date` | alumni_profiles | date | 100% (548/548) | KPI metrics only (inconsistently used) |
| `job_start_date` | alumni_profiles | date | 72.6% (398/548) | Time-to-job, performance rate |
| `job_mismatch_reason` | alumni_profiles | enum | 18.4% (101/548) | Job alignment (comprehensive analytics) |
| `job_related_to_degree` | alumni_profiles | boolean | 64.8% (355/548) | Job alignment (dashboard only) |
| `batch_id` | alumni_profiles | FK | 72.6% (398/548) | Batch distribution |
| `course_id` | alumni_profiles | FK | 100% (548/548) | Program-wise, college/course breakdowns |
| `initial_enrollment` | batches | int | 0% (all NULL) | Enrollment/graduation/attrition rates |
| `graduated_count` | batches | int | 0% (all NULL) | Graduation rate |
| `dropout_count` | batches | int | 0% (all NULL) | Attrition rate |
| `transferred_count` | batches | int | 0% (all NULL) | Attrition rate |

### 2.3 Employment Status Distribution

| Status | Count | % |
|--------|-------|---|
| employed_full_time | 166 | 30.3% |
| employed_part_time | 13 | 2.4% |
| self_employed | 108 | 19.7% |
| **Total Employed** | **287** | **52.4%** |
| unemployed_seeking | 151 | 27.6% |
| continuing_education | 110 | 20.1% |
| **Total Non-Employed** | **261** | **47.6%** |

---

## 3. Data Quality Issues Found

### DQ-1: Non-Employed Alumni Have `job_start_date` (HIGH)

**Finding:** 199 alumni who are NOT employed (unemployed_seeking or continuing_education) have a `job_start_date` set.

**Impact:** 
- Pollutes `getProgramWisePerformance()` `avg_days_to_job` — this method does NOT filter by employment status for time-to-job
- These values are technically valid (previous employment before current status change) but misleading when computing time-to-CURRENT-job

**Numbers:**
- 199/287 employed alumni have `job_start_date` ✓
- 199/261 non-employed alumni ALSO have `job_start_date` ✗

### DQ-2: Job Started Before Graduation (HIGH)

**Finding:** 83 alumni have `job_start_date` earlier than `graduation_date`.

**Examples (top offenders):**
| Alumni ID | Graduated | Job Start | Days Before |
|-----------|-----------|-----------|-------------|
| 1437 | 2025-06-04 | 2021-05-12 | 1,484 |
| 1388 | 2025-03-28 | 2021-03-23 | 1,466 |
| 1346 | 2025-03-10 | 2021-10-06 | 1,251 |

**Impact:** Filtered out by `DATEDIFF >= 0` in most queries (correctly), but 69+ employed alumni are invisible to time-to-job metrics, and their performance rate contribution is lost.

**Root cause:** Self-reported data with no validation. Alumni may have entered their current job start date (which predates graduation if they were working while studying).

### DQ-3: Contradictory `job_mismatch_reason` vs `job_related_to_degree` (HIGH)

**Finding:** 71 alumni say `job_related_to_degree = 1` (yes, related) while ALSO having a mismatch reason like overqualified/underqualified/unfit.

| Mismatch Reason | job_related=0 | job_related=1 | Anomalous? |
|-----------------|---------------|---------------|------------|
| NULL | 52 | 134 | No (NULL = no mismatch) |
| overqualified | 12 | **23** | YES — if overqualified, job is a poor fit |
| underqualified | 11 | **23** | YES — if underqualified, job is a poor fit |
| unfit | 7 | **25** | YES — if unfit, job is clearly NOT related |

**Impact:** 
- Dashboard alignment (using `job_related_to_degree=1`) counts these 71 as aligned
- Comprehensive analytics alignment (using `job_mismatch_reason IS NULL`) does NOT count them
- **Result: Dashboard shows ~62% alignment, Analytics page shows ~64.8%** — different numbers for "the same metric"

### DQ-4: 150 Alumni Missing `batch_id` (MEDIUM)

**Finding:** 150 of 548 alumni have NULL `batch_id`, despite having valid `graduation_year` matching existing batches.

**Impact:** These alumni are excluded from batch-specific queries but included in graduation-year queries, causing discrepancies between batch and year views.

### DQ-5: 88 Employed Alumni Missing `job_start_date` (MEDIUM)

**Finding:** 88 out of 287 employed alumni (30.7%) have no `job_start_date`.

**Impact:**
- Performance Rate: These 88 are excluded from the numerator even though they ARE employed — deflates the rate from potentially ~22% to 6.9%
- Time-to-job: Only 199/287 employed alumni contribute — biased sample
- KPI `total_tracked_alumni`: Understated

### DQ-6: All Batch Enrollment Columns Are NULL (MEDIUM)

**Finding:** All 11 batches have `initial_enrollment = NULL`, `graduated_count = NULL`, `dropout_count = NULL`, `transferred_count = NULL`.

**Impact:**
- **Enrollment Metrics:** Fallback logic sets `enrolled = graduated`, so graduation rate = 100% always
- **Attrition Rate:** Fallback logic maps `unemployed → dropout`, `continuing_ed → transferred` — **semantically completely wrong**
- No way to calculate actual dropout/transfer/graduation rates without this data

### DQ-7: Extreme Time-to-Job Values (MEDIUM)

**Finding:** Average time-to-job by graduation year:

| Year | Avg Days | Avg Years | Valid Records | Issue |
|------|----------|-----------|---------------|-------|
| 2015 | 3,029 | 8.3 | 17 | Extreme — implies recent job update |
| 2016 | 2,658 | 7.3 | 22 | Same problem |
| 2017 | 2,161 | 5.9 | 22 | Same problem |
| 2020 | 956 | 2.6 | 24 | More reasonable |
| 2024 | 305 | 0.8 | 8 | Reasonable |

**Root cause:** `job_start_date` represents the start of the alumni's CURRENT job, not their FIRST job after graduation. A 2015 grad who is now in their 3rd career move might have `job_start_date = 2023`.

---

## 4. Code Logic Bugs Found

### BUG-1: Program-wise `aligned` Count Includes Non-Employed (HIGH)

**File:** `AnalyticsController.php` → `getProgramWisePerformance()`  
**Line:** ~1830

```php
// Current (WRONG): counts ALL alumni with NULL mismatch reason
SUM(CASE WHEN ap.job_mismatch_reason IS NULL OR ap.job_mismatch_reason = "none" THEN 1 ELSE 0 END) as aligned
```

**Bug:** Non-employed alumni (unemployed, continuing_ed) have NULL `job_mismatch_reason` and get counted as "aligned". Since `alignment_rate = aligned / employed`, this produces rates >100%.

**Fix:** Add employment status filter to the aligned count.

### BUG-2: Program-wise `avg_days_to_job` Ignores Employment Status (HIGH)

**File:** `AnalyticsController.php` → `getProgramWisePerformance()`  
**Line:** ~1832

```php
// Current (WRONG): averages ALL alumni with job_start_date, even non-employed
AVG(CASE WHEN ap.job_start_date IS NOT NULL AND DATEDIFF(...) >= 0 THEN ... END)
```

**Bug:** 199 non-employed alumni with `job_start_date` contribute to the average, inflating/skewing it.

**Fix:** Add employment status check inside the CASE.

### BUG-3: Employments-Table Median Missing `>= 0` Filter (MEDIUM)

**File:** `AnalyticsController.php` → `getMedianDaysForYear()`  
**Line:** ~310

```php
// Profiles query: has >= 0 filter ✓
// Employments query: NO >= 0 filter ✗
$daysFromJobs = DB::table('alumni_profiles as ap')
    ->join('employments as e', ...)
    // Missing: ->whereRaw('DATEDIFF(e.start_date, ...) >= 0')
```

**Bug:** Negative DATEDIFF values (employment started before graduation) are included in the median from employments table.

**Fix:** Add the `>= 0` filter condition.

### BUG-4: Two Definitions of "Job Alignment" (HIGH)

**Dashboard** (`AdminController.php`, line ~206):
```php
$alignedJobs = (clone $alignmentQuery)->where('job_related_to_degree', 1)->count();
```

**Comprehensive Analytics** (`AnalyticsController.php`, line ~1700):
```php
// aligned = job_mismatch_reason IS NULL OR = 'none'
```

**Bug:** These use different fields (`job_related_to_degree` vs `job_mismatch_reason`) and produce different alignment rates. The Analytics page shows one number, the Dashboard API returns another.

**Fix:** Standardize on one definition. Use `job_mismatch_reason IS NULL OR = 'none'` as the canonical definition (it's more granular), and update the Dashboard to match.

### BUG-5: Two Different Graduation Date Calculations (MEDIUM)

| Method | Date Used |
|--------|-----------|
| KPI Metrics (`getKPIMetrics`) | `ap.graduation_date` (actual date field) |
| All other time-to-job | `CONCAT(graduation_year, "-06-01")` (synthetic) |

**Bug:** These produce different DATEDIFF results. An alumni with `graduation_date = 2020-03-15` but `graduation_year = 2020` gets two different time-to-job numbers depending on which endpoint calculates it.

**Fix:** Use `graduation_date` everywhere since it's 100% populated. Fall back to `CONCAT(graduation_year, '-06-01')` only if `graduation_date IS NULL`.

### BUG-6: Attrition Rate Semantic Mapping Error (HIGH)

**File:** `AnalyticsController.php` → `getAttritionRate()`  
**Line:** ~1775

```php
// When batch data is NULL (current state):
$dropout = (batch NULL) ? $unemployed;       // WRONG: unemployed ≠ dropout
$transferred = (batch NULL) ? $continuing;   // WRONG: continuing_ed ≠ transferred
```

**Bug:** When no batch enrollment data exists, the code treats unemployed alumni as "dropouts" and continuing education as "transferred." These are completely different concepts. An alumnus who graduated but is unemployed is NOT a dropout.

**Fix:** When batch data is NULL, show honest labels: "Unemployed" instead of "Dropout", "Continuing Education" instead of "Transferred". Or better: clearly mark the metric as unavailable.

### BUG-7: Dashboard `good_match` Has Extra Filter (LOW)

**Dashboard** (`AdminController.php`, line ~226):
```php
'good_match' => (clone $alignmentQuery)
    ->where(function($q) {
        $q->whereNull('job_mismatch_reason')->orWhere('job_mismatch_reason', 'none');
    })
    ->where('job_related_to_degree', 1)  // Extra filter!
    ->count()
```

**Bug:** Dashboard `good_match` requires BOTH `job_mismatch_reason IS NULL` AND `job_related_to_degree = 1`. The comprehensive analytics only requires `job_mismatch_reason IS NULL`. Dashboard shows a lower good_match count.

**Fix:** Remove the extra `job_related_to_degree = 1` filter to match comprehensive analytics.

### BUG-8: Export Doesn't Pass `campus_id` (LOW)

**File:** `AnalyticsController.php` → `exportTimeToJobAnalytics()`  
**Line:** ~64

```php
$data = $this->getYearlyTimeToJobData($yearFilter); // Missing: campus_id
```

**Fix:** Pass campus_id from request.

### BUG-9: College/Course Breakdowns Use `LIKE` Instead of `IN` (LOW)

```php
// Fragile pattern:
"ap.employment_status LIKE 'employed%' OR ap.employment_status = 'self_employed'"
```

**Bug:** Functionally equivalent today but would break if a future status starts with "employed" that shouldn't be counted (e.g., "employed_internship").

**Fix:** Use explicit `IN ('employed_full_time', 'employed_part_time', 'self_employed')`.

---

## 5. Metric-by-Metric Audit

### 5.1 Employment Rate

| Source | Calculation | Result | Correct? |
|--------|------------|--------|----------|
| Dashboard Backend | employed / total_alumni | 287/548 = 52.4% | ✅ Yes |
| Analytics Frontend | job_alignment.total_employed / overview.total_alumni | 287/548 = 52.4% | ✅ Yes (same value, two paths) |

**Status:** ✅ **Correct** — both produce the same number. However, employment rate is calculated twice (backend + frontend), which is unnecessary complexity.

### 5.2 Performance Rate (Employed Within 2 Years)

| Current | Issue |
|---------|-------|
| 38/548 = 6.9% | Denominator is ALL graduates, not just those with data |

**Problems:**
1. Denominator should be employed alumni with valid `job_start_date` (199), not all alumni (548)
2. 88 employed alumni without `job_start_date` are excluded — missing 30.7% of data
3. Uses synthetic date `CONCAT(graduation_year, '-06-01')` instead of actual `graduation_date`
4. Negative DATEDIFF not explicitly filtered (incidentally excluded by `<= 730` check, but for wrong reason)

**After fix:** Should use `totalEmployedWithGradData` as denominator for a meaningful rate (what % of employed alumni found jobs within 2 years).

### 5.3 Job Alignment Rate

| Source | Definition | Result |
|--------|-----------|--------|
| Dashboard | `job_related_to_degree = 1` / employed | ~62% |
| Comprehensive | `job_mismatch_reason IS NULL OR 'none'` / employed | 186/287 = 64.8% |

**Problem:** Two different definitions → two different numbers.

**After fix:** Standardize on `job_mismatch_reason` approach (more granular, already used on Analytics page).

### 5.4 Time-to-Job Average

| Year | Current Avg Days | Issue |
|------|-----------------|-------|
| 2015 | 3,029 (8.3 yr) | Uses current-job start, not first-job. No outlier cap. |
| 2020 | 956 (2.6 yr) | Still high — same root cause |
| 2024 | 305 (0.8 yr) | Reasonable |

**Problem:** `job_start_date` is the alumni's current job, not first job post-graduation. This is a fundamental data model issue — we only have ONE job date per profile.

**Mitigation:**
1. Use `employments` table (which has history) when available — use EARLIEST employment `start_date` after graduation
2. Cap outliers at a reasonable maximum (e.g., 5 years = 1825 days)
3. Show median alongside average (more robust to outliers)

### 5.5 Attrition Rate

| Current | Actual Meaning | Displayed As |
|---------|---------------|-------------|
| ~47.6% | (unemployed + continuing_ed) / total | "Non-Employment" |

**Problem:** When batch data is NULL, `dropout = unemployed` and `transferred = continuing_ed`. The label was already fixed to "Non-Employment" but the underlying data keys are still `dropout` and `transferred`.

**After fix:** Rename keys to honest labels or mark as "No batch enrollment data available."

### 5.6 Program-Wise Performance

| Current Issue | Example |
|--------------|---------|
| Aligned count includes non-employed | A program with 20 total, 10 employed, 15 NULL mismatch → aligned=15, rate=150% |
| Avg time-to-job includes non-employed | Inflated by unemployed alumni with old job_start_date |

**After fix:** Both metrics properly filter to employed-only alumni.

### 5.7 Enrollment Metrics (Graduates vs Employed)

| Current State | Issue |
|--------------|-------|
| Graduated = Total Alumni per year | No actual graduation rate possible without enrollment data |
| Employed = Count from employment_status | ✅ Correct |

**Status:** The chart itself is honest (shows graduates vs employed), but the "graduation rate" KPI is meaningless (always 100%) because `enrolled === graduated`.

---

## 6. Root Cause Analysis

### Why Is the Data Inconsistent?

1. **Self-reported data with no validation rules:**
   - Alumni enter `job_start_date` as their current job's start, not first job after graduation
   - No validation prevents `job_start_date < graduation_date`
   - No validation ensures `job_mismatch_reason` and `job_related_to_degree` are consistent

2. **Multiple data sources for same concept:**
   - Job info exists in both `alumni_profiles` (single snapshot) and `employments` (history table)
   - Alignment info exists in both `job_related_to_degree` (boolean) and `job_mismatch_reason` (enum)
   - Graduation date exists in both `graduation_year` and `graduation_date`

3. **Missing batch enrollment data:**
   - Batch table has columns for enrollment metrics but they've never been populated
   - Fallback logic in code silently substitutes wrong values instead of showing "no data"

4. **Seeded/test data mixed with assumptions:**
   - Auto-generated alumni profiles may have random but valid-format dates
   - 199 non-employed alumni with `job_start_date` suggests bulk data generation

### Data Model Limitation

The `alumni_profiles` table stores only ONE job snapshot (current state). Key limitation: **We cannot distinguish "first job after graduation" from "current job."** The `employments` table can help but only 179 of 287 employed alumni have records there.

---

## 7. Fix Implementation Plan

### Phase 1: Critical Code Fixes (Immediate)

| # | Fix | File | Priority |
|---|-----|------|----------|
| F1 | Program-wise `aligned` — add employment status filter | AnalyticsController.php | HIGH |
| F2 | Program-wise `avg_days_to_job` — add employment status filter | AnalyticsController.php | HIGH |
| F3 | Employments median — add `>= 0` filter | AnalyticsController.php | HIGH |
| F4 | Standardize alignment definition — update Dashboard | AdminController.php | HIGH |
| F5 | Standardize graduation date — use `graduation_date` everywhere | AnalyticsController.php | MEDIUM |
| F6 | Attrition rate — honest labels when no batch data | AnalyticsController.php | HIGH |
| F7 | Dashboard `good_match` — remove extra filter | AdminController.php | MEDIUM |
| F8 | Export — pass campus_id | AnalyticsController.php | LOW |
| F9 | College/Course — use `IN` instead of `LIKE` | AnalyticsController.php | LOW |

### Phase 2: Data Quality Fixes (Immediate)

| # | Fix | Action |
|---|-----|--------|
| D1 | Fix contradictory `job_related_to_degree` vs `job_mismatch_reason` | SQL UPDATE: if mismatch reason is overqualified/underqualified/unfit, set `job_related_to_degree = 0` |
| D2 | Populate `batch_id` for 150 alumni | SQL UPDATE: match `graduation_year` to `batches.graduation_year` per campus |
| D3 | Time-to-job outlier cap | Code: cap at 1825 days (5 years) in all DATEDIFF calculations |
| D4 | Use earliest employment date for time-to-job when available | Code: join employments, prefer MIN(start_date) over profile's job_start_date |

### Phase 3: Preventive Validation (Next Sprint)

| # | Action | Where |
|---|--------|-------|
| P1 | Add validation: `job_start_date >= graduation_date` | AlumniProfile form / API validation |
| P2 | Add validation: `job_related_to_degree` must be 0 if mismatch reason is negative | AlumniProfile form / model observer |
| P3 | Add validation: `job_start_date` required when employment_status is employed_* | AlumniProfile form / API validation |
| P4 | Populate batch enrollment data or remove enrollment/attrition metrics | Admin UI or seeder |

---

## 8. Verification Checklist

After implementing fixes, verify each metric:

| Metric | Expected After Fix | Verify With |
|--------|-------------------|-------------|
| Employment Rate | 287/548 = 52.4% | `SELECT COUNT(*) FROM alumni_profiles WHERE employment_status IN ('employed_full_time','employed_part_time','self_employed')` → 287 |
| Job Alignment | ~64.8% (all employed, NULL mismatch = aligned) | Same across Dashboard AND Analytics page |
| Performance Rate | ~19% (38/199 employed with valid dates) | Denominator changes to employed-with-data, not all alumni |
| Time-to-Job 2015 | Capped values, lower average | Average should drop to <1825 days |
| Program Aligned | All rates ≤ 100% | No program shows alignment > employment |
| Attrition/Non-Employment | Honest labels, no "dropout" when no batch data | Frontend shows "Unemployed" not "Dropout" |
| Dashboard vs Analytics | Same alignment rate, same definition | Compare both API responses |

---

## 9. Preventive Measures

### 9.1 Data Validation Rules (Backend)

```php
// In AlumniProfile validation rules:
'job_start_date' => 'nullable|date|after_or_equal:graduation_date',
'job_related_to_degree' => 'required_if:employment_status,employed_full_time,employed_part_time,self_employed',
'job_mismatch_reason' => [
    'nullable',
    Rule::prohibitedIf(fn() => request('job_related_to_degree') == 1 
        && !in_array(request('job_mismatch_reason'), [null, 'none']))
],
```

### 9.2 Analytics Consistency Tests

Add automated tests that verify:
1. Dashboard alignment rate === Analytics alignment rate (same definition)
2. Sum of employment status categories === total alumni
3. No program has alignment_rate > 100%
4. Time-to-job average per year < 1825 days (5-year cap)

### 9.3 Data Quality Dashboard

Add an admin-visible data quality section showing:
- % of employed alumni with `job_start_date`
- Count of `job_start_date < graduation_date` records
- Count of contradictory `job_related + mismatch_reason` records
- Batch enrollment data completeness

---

## Appendix: Current Data Snapshot

```
Total Alumni: 548 (398 Main Campus, 150 Cavite)
Total Employed: 287 (52.4%)
  - Full Time: 166, Part Time: 13, Self-Employed: 108
Total Unemployed: 151 (27.6%)
Total Continuing Education: 110 (20.1%)

Graduation Years: 2015-2025 (11 batches)
Employments Table: 270 records, 179 distinct alumni
Surveys: 6 total (5 active), 227 responses

Data Quality:
  - job_start_date populated: 398/548 (72.6%)
  - job_mismatch_reason populated: 101/548 (18.4%)
  - job_related_to_degree populated: 355/548 (64.8%)
  - batch_id populated: 398/548 (72.6%)
  - Contradictory mismatch+related: 71 records
  - Job before graduation: 83 records
  - Non-employed with job_start_date: 199 records
```
