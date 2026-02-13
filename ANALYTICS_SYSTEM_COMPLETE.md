# Alumni Tracer System - Complete Analytics Overview

**Generated:** February 13, 2026

---

## 📊 ANALYTICS SYSTEM ARCHITECTURE

### 1. MAIN ANALYTICS ENDPOINTS

#### **GET /api/v1/admin/analytics/comprehensive**
**Purpose:** Master analytics endpoint - returns all comprehensive metrics in one call

**Includes:**
- ✓ Enrollment Metrics (yearly enrollment, graduation, dropout, transferred rates)
- ✓ Performance Indicator (% employed within 2 years, yearly breakdown)
- ✓ Job Alignment Stats (aligned, overqualified, underqualified, unfit breakdowns)
- ✓ Attrition Rate (dropout and transfer rates by year)
- ✓ Program-wise Performance (employment rate, alignment rate, avg days to job by degree program)
- ✓ College Enrollment Breakdown (enrollment and employment by college)
- ✓ Course Enrollment Breakdown (detailed course-level metrics)
- ✓ Employment Location Stats (local, foreign, remote with yearly trends and department breakdown)

**Response Structure:**
```json
{
  "enrollment_metrics": {
    "yearly_breakdown": [...],
    "summary": { "total_enrolled", "total_graduated", "overall_graduation_rate" }
  },
  "performance_indicator": {
    "employed_within_2_years": 486,
    "total_graduates": 548,
    "performance_rate": 88.7,
    "yearly_breakdown": [...]
  },
  "job_alignment": {
    "total_employed": 486,
    "aligned": { "count": 41, "percentage": 8.44 },
    "overqualified": { "count": 82, "percentage": 16.87 },
    "underqualified": { "count": 34, "percentage": 7.0 },
    "unfit": { "count": 329, "percentage": 67.69 }
  },
  "attrition_rate": { ... },
  "program_performance": [...],
  "college_enrollment": [...],
  "course_enrollment": [...],
  "employment_location": {
    "summary": {
      "local": 390, "foreign": 61, "remote": 35,
      "local_rate": 80.2, "foreign_rate": 12.6, "remote_rate": 7.2
    },
    "yearly_trend": [...],
    "department_breakdown": [...]
  }
}
```

---

#### **GET /api/v1/admin/analytics/time-to-job**
**Purpose:** Time-to-employment analytics with filtering

**Features:**
- Yearly time-to-job breakdown
- KPI metrics (overall avg days, fastest program, slowest program, median days)
- Job mismatch statistics
- Filter by graduation years and campus

**Query Parameters:**
- `years` - Comma-separated graduation years (e.g., "2023,2024,2025")
- `campus_id` - Filter by specific campus

**Response Structure:**
```json
{
  "yearly_data": [
    {
      "year": 2025,
      "total_alumni": 120,
      "employed_alumni": 105,
      "avg_days_to_job": 224,
      "median_days": 180,
      "program_breakdown": [...]
    }
  ],
  "kpi_metrics": {
    "overall_avg_days": 224,
    "fastest_program": "Bachelor of Computer Science",
    "fastest_avg_days": 45,
    "slowest_program": "Bachelor of Architecture",
    "slowest_avg_days": 365
  },
  "job_mismatch_stats": {
    "good_match": 41,
    "overqualified": 82,
    "underqualified": 34,
    "unfit": 329
  }
}
```

**Export Formats:**
- CSV: `/api/v1/admin/analytics/time-to-job/export?format=csv`
- Excel: `/api/v1/admin/analytics/time-to-job/export?format=excel`
- PDF: `/api/v1/admin/analytics/time-to-job/export?format=pdf`

---

#### **GET /api/v1/admin/analytics/overview**
**Purpose:** Quick overview snapshot for dashboard summary

**Returns:**
- Total alumni count
- Total active surveys
- Response rates
- Employment statistics summary
- Recent activity metrics

---

### 2. SURVEY ANALYTICS

#### **GET /api/v1/admin/analytics/surveys/{surveyId}**
**Purpose:** Detailed analytics for a specific survey

**Includes:**
- Total responses
- Response rate breakdown
- Question-by-question analysis:
  - Multiple choice: frequency distribution, percentages
  - Text responses: sentiment analysis (optional)
  - Rating scales: average ratings, distribution
  - Checkbox: selected options frequency
- Demographic breakdowns (by graduation year, program, campus)
- Time-series response data

**Response Structure:**
```json
{
  "survey_info": {
    "id": 5,
    "title": "2025 Alumni Employment Survey",
    "total_responses": 245,
    "response_rate": 44.7,
    "created_at": "2025-01-15"
  },
  "questions": [
    {
      "id": 12,
      "question_text": "What is your current employment status?",
      "question_type": "multiple_choice",
      "responses": [
        { "answer": "Employed Full-time", "count": 180, "percentage": 73.5 },
        { "answer": "Self-employed", "count": 30, "percentage": 12.2 },
        { "answer": "Seeking Employment", "count": 35, "percentage": 14.3 }
      ]
    }
  ],
  "demographics": {
    "by_year": [...],
    "by_program": [...],
    "by_campus": [...]
  }
}
```

**Export:** `/api/v1/admin/analytics/surveys/{surveyId}/export?format=excel`

---

#### **GET /api/v1/admin/analytics/surveys/{surveyId}/responses**
**Purpose:** Detailed individual response data with pagination

**Query Parameters:**
- `page` - Page number (default: 1)
- `per_page` - Results per page (default: 50, max: 100)
- `search` - Search responses by alumni name/email
- `graduation_year` - Filter by graduation year
- `program` - Filter by degree program

**Response Structure:**
```json
{
  "data": [
    {
      "response_id": 123,
      "respondent": {
        "id": 456,
        "name": "Juan Dela Cruz",
        "email": "juan@example.com",
        "graduation_year": 2024,
        "program": "BS Computer Science"
      },
      "submitted_at": "2025-02-10 14:30:00",
      "answers": [
        {
          "question_id": 12,
          "question_text": "What is your current employment status?",
          "answer_text": "Employed Full-time"
        }
      ]
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 50,
    "total": 245,
    "last_page": 5
  }
}
```

---

#### **GET /api/v1/admin/analytics/surveys/export-all**
**Purpose:** Export all surveys summary

**Query Parameters:**
- `days` - Last N days (default: 30)
- `format` - Export format (excel, csv, pdf)

**Returns:** Excel file with:
- Survey list with response count
- Response rate comparison
- Recent activity trends
- Top performing surveys

---

### 3. DASHBOARD ANALYTICS

#### **GET /api/admin/dashboard**
**Purpose:** Admin dashboard KPI metrics

**Includes:**
| Metric | Description | Calculation |
|--------|-------------|-------------|
| **Total Alumni** | All registered alumni | Count of alumni_profiles |
| **Total Surveys** | Active surveys | Count of surveys |
| **Total Responses** | Survey submissions | Count of survey_responses |
| **Response Rate** | Survey engagement | (responses / (alumni × surveys)) × 100 |
| **Employment Rate** | % employed | (employed / total_alumni) × 100 |
| **Avg Days to Job** | Time to employment | AVG(DATEDIFF(job_start_date, graduation_date)) |
| **Job Alignment** | % working in field | (good_match / employed) × 100 |
| **Performance Rate** | % employed within 2 years | (employed_within_2_years / total_alumni) × 100 |

**Mismatch Statistics:**
- Good Match (aligned with degree)
- Overqualified
- Underqualified
- Unfit/Mismatched

**Unemployment Breakdown:**
- Seeking Employment
- Not Seeking Employment
- Continuing Education

**Employment Location:**
- Local (Philippines)
- Foreign (OFW)
- Remote (Foreign Company)

**Additional:**
- Recent registrations (last 30 days)
- Recent survey responses
- Monthly registration trend (last 12 months)
- Batch distribution
- Recent surveys list

---

## 📈 ANALYTICS FRONTEND PAGES

### 1. **Main Analytics Dashboard** (`/admin/analytics`)

**Sections:**

#### **1. Key Performance Indicators**
5 Cards showing:
- Total Alumni (548)
- Performance Rate (88.7% - employed within 2 years)
- Job Alignment (8.44%)
- Employment Rate (88.7%)
- Non-Employment (11.2%)

---

#### **2. Employment Analytics**
KPI Metrics:
- Avg Time to Job: 224 days (7.5 months)
- Performance Rate: 88.7%
- Job Alignment: 8.44%
- Employment Rate: 88.7%
- Attrition Rate: % unemployed + continuing ed

Charts:
- **Job Qualification Match Distribution** (Bar Chart)
  - Good Match, Overqualified, Underqualified, Unfit
- **Graduates vs Employed by Year** (Bar Chart)
  - Comparison of total grads vs employed per year
- **Program Performance Comparison** (Horizontal Bar Chart)
  - Avg time-to-job by degree program

---

#### **3. Enrollment & Graduation Metrics**

Charts:
- **Enrollment vs Graduation Trend** (Line Chart)
  - Yearly enrolled vs graduated comparison
- **Graduation Rate by Year** (Area Chart)
  - Percentage graduation rate trend
- **Attrition Analysis** (Stacked Bar Chart)
  - Dropout and transfer rates by year

---

#### **4. Performance Trends**

Charts:
- **Employment Performance by Year** (Line Chart)
  - % of graduates employed within 2 years
- **Time-to-Job Trend** (Area Chart)
  - Average days to employment by graduation year

---

#### **5. Program-wise Performance**

**Detailed Program Metrics Table:**
- Course name
- College
- Total alumni
- Employed count
- Employment rate
- Aligned count
- Alignment rate
- Avg days to job

Mobile Card View + Desktop Table View

---

#### **5.5 Employment Location (Local vs Foreign)** ⭐ NEW

**Summary Cards:**
- Local (Philippines): 390 (80.2%)
- Foreign (OFW): 61 (12.6%)
- Remote (Foreign Co.): 35 (7.2%)

**Charts:**
- **Yearly Trends** (Stacked Bar Chart)
  - Local, Foreign, Remote breakdown per graduation year
- **Department Breakdown** (Horizontal Bar Chart)
  - Employment location by department

---

#### **6. System Overview**

**Cards:**
- Total Enrolled
- Total Graduated
- Total Dropout
- Overall Graduation Rate

**College Breakdown Table:**
- College name
- Enrolled count
- Graduated count
- Employed count
- Employment rate

**Course Breakdown Table:**
- Course name
- College
- Enrolled count
- Graduated count
- Employed count
- Employment rate

---

### 2. **Admin Dashboard** (`/admin/dashboard`)

**Sections:**
- Welcome Banner with campus selector
- KPI Cards (5 main metrics)
- Employment Breakdown Cards (4 job match types)
- Employment Location Cards (3 types: Local, Foreign, Remote) ⭐ NEW
- Survey & Response Stats
- Recent Activity Feed
- Monthly Registration Trend Chart
- Recent Surveys List
- Recent Job Postings
- Recent Announcements
- Batch Distribution

---

### 3. **Survey Analytics** (`/admin/surveys/{id}/analytics`)

Currently accessible via survey list, shows:
- Response summary
- Question-by-question charts
- Demographic breakdowns
- Export options

---

## 🎯 DATA QUALITY METRICS

**Current System Status:**

| Metric | Status | Count |
|--------|--------|-------|
| Total Alumni | ✓ Complete | 548 |
| Employed Alumni | ✓ Complete | 486 (88.7%) |
| Job Start Dates | ✓ Valid | 486 (0 invalid) |
| Career Field | ✓ Complete | 486 (100%) |
| Job Mismatch Classification | ✓ Complete | 486 (100%) |
| Employment Location | ✓ Complete | 486 (100%) |
| Salary Range | ✓ Populated | 398 (81.9%) |
| Invalid Date Records | ✓ Clean | 0 |
| Avg Days to Job | ✓ Accurate | 224 days (7.5 months) |
| Performance Rate | ✓ Fixed | 88.7% (486 of 548) |

---

## 🔧 ANALYTICS FEATURES

### **Filtering Options:**
- ✓ Campus-based filtering (all endpoints support `campus_id`)
- ✓ Graduation year filtering (time-to-job analytics)
- ✓ Date range filtering (surveys)
- ✓ Program/College filtering (responses)

### **Export Capabilities:**
- ✓ CSV Export (time-to-job data)
- ✓ Excel Export (surveys, comprehensive data)
- ✓ PDF Export (reports)
- ✓ Bulk export (all surveys summary)

### **Data Visualizations:**
- ✓ Line Charts (trends over time)
- ✓ Bar Charts (comparisons)
- ✓ Stacked Bar Charts (multi-category data)
- ✓ Area Charts (cumulative trends)
- ✓ Pie Charts (distribution)
- ✓ Horizontal Bar Charts (rankings)
- ✓ Progress Bars (percentages)
- ✓ Custom Tooltips (detailed hover info)

### **Real-time Updates:**
- ✓ Dashboard refresh button
- ✓ Last updated timestamp
- ✓ Auto-refresh on campus change

### **Responsive Design:**
- ✓ Mobile card views for tables
- ✓ Collapsible sections
- ✓ Touch-friendly charts
- ✓ Adaptive layouts

---

## 📊 KEY PERFORMANCE INDICATORS (CURRENT VALUES)

```
Total Alumni:              548
Performance Rate:          88.7% (486 of 548 alumni employed within 2 years)
Employment Rate:           88.69% (486 of 548 alumni currently employed)
Job Alignment:             8.44% (41 of 486 working in aligned field)
Avg Time to Job:           224 days (7.5 months after graduation)

Job Match Distribution:
  ✓ Good Match:            41 (8.4%)
  ⬆ Overqualified:         82 (16.9%)
  ⬇ Underqualified:        34 (7.0%)
  ✗ Unfit/Mismatched:      329 (67.7%)

Employment Location:
  🇵🇭 Local:               390 (80.2%)
  ✈️ Foreign (OFW):        61 (12.6%)
  💻 Remote:               35 (7.2%)

Unemployment:
  Seeking:                 46
  Not Seeking:             0
  Continuing Education:    16
  Total Unemployed:        62 (11.3%)
```

---

## 🚀 ANALYTICS CAPABILITIES SUMMARY

**✅ Implemented:**
1. Comprehensive multi-dimensional analytics
2. Time-to-employment tracking with program breakdowns
3. Job alignment and mismatch classification
4. Survey response analytics with demographic filtering
5. Employment location tracking (local/foreign/remote)
6. Performance indicators (2-year employment success rate)
7. Enrollment and attrition metrics
8. Program-wise and college-wise performance comparison
9. Export functionality (CSV, Excel, PDF)
10. Real-time dashboard with KPI cards
11. Responsive charts and visualizations
12. Campus-based filtering across all endpoints

**📊 Analytics Categories:**
- Employment Analytics (7 metrics)
- Academic Performance (5 metrics)
- Survey Engagement (4 metrics)
- Program Performance (6 metrics per program)
- Location Analytics (3 categories)
- Time-to-Job Analysis (yearly + program breakdown)

**🎯 Data Quality:**
- 100% data completeness for employed alumni
- 0 invalid records
- Consistent calculations across all endpoints
- Verified accuracy through comprehensive testing

---

