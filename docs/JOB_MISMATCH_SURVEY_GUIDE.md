# Job Mismatch Survey Implementation Guide

## Overview
The **Employment Quality & Job Satisfaction Survey** is designed to collect comprehensive data about alumni employment outcomes, job satisfaction, and how well their education prepared them for their careers.

## Purpose
This survey collects data for the **Job Mismatch Analytics** dashboard, including:
- Job qualification match (overqualified, underqualified, unfit, good match)
- Job satisfaction ratings
- Degree relevance to current employment
- Unemployment reasons
- Salary ranges and career progression

## Survey Details

### Survey Information
- **Title:** Employment Quality & Job Satisfaction Survey
- **Type:** Follow-up Survey
- **Status:** Active
- **Duration:** 6 months
- **Total Questions:** 13
- **Estimated Time:** 5-7 minutes

### Survey Questions

#### 1. Current Employment Status *(Required)*
- **Type:** Single Choice
- **Purpose:** Determine employment category
- **Options:**
  - Employed (Full-Time)
  - Employed (Part-Time)
  - Self-Employed
  - Unemployed (Seeking Employment)
  - Unemployed (Not Seeking)
  - Continuing Education
  - Military Service
  - Other

#### 2. Current Job Title *(Conditional)*
- **Type:** Text
- **Shows If:** Selected employed status
- **Maps To:** `alumni_profiles.current_job_title`

#### 3. Current Employer *(Conditional)*
- **Type:** Text
- **Shows If:** Selected employed status
- **Maps To:** `alumni_profiles.current_employer`

#### 4. Job Related to Degree *(Required, Conditional)*
- **Type:** Single Choice (Yes/No)
- **Shows If:** Selected employed status
- **Maps To:** `alumni_profiles.job_related_to_degree`
- **Analytics:** Used for degree relevance percentage

#### 5. Job Qualification Match *(Required, Conditional)*
- **Type:** Single Choice
- **Shows If:** Selected employed status
- **Maps To:** `alumni_profiles.job_mismatch_reason`
- **Options:**
  - Perfect match → `none`
  - Overqualified → `overqualified`
  - Underqualified → `underqualified`
  - Unfit → `unfit`
  - Career change by choice → `career_change`
  - Location constraints → `location`
  - Salary was primary factor → `salary`
  - Other reasons → `other`
- **Analytics:** Powers the 4 KPI cards (Overqualified, Unfit, Underqualified, Good Match)

#### 6. Job Satisfaction Rating *(Required, Conditional)*
- **Type:** Rating (1-5)
- **Shows If:** Selected employed status
- **Maps To:** `alumni_profiles.job_satisfaction`
- **Scale:**
  - 1 = Very Dissatisfied
  - 5 = Very Satisfied
- **Analytics:** Average job satisfaction score

#### 7. Satisfaction Aspects *(Optional Matrix)*
- **Type:** Matrix
- **Shows If:** Selected employed status
- **Purpose:** Detailed satisfaction breakdown
- **Rows:**
  - Salary and benefits
  - Work-life balance
  - Career growth opportunities
  - Work environment
  - Job security
  - Use of skills from degree
  - Relationship with colleagues
  - Management and leadership
- **Columns:** 1-5 rating scale

#### 8. Current Salary Range *(Optional)*
- **Type:** Dropdown
- **Shows If:** Selected employed status
- **Options:**
  - Below ₱200,000
  - ₱200,000 - ₱300,000
  - ₱300,000 - ₱400,000
  - ₱400,000 - ₱500,000
  - ₱500,000 - ₱750,000
  - ₱750,000 - ₱1,000,000
  - Above ₱1,000,000
  - Prefer not to say

#### 9. Skills Used *(Optional Multiple Choice)*
- **Type:** Multiple Choice
- **Shows If:** Selected employed status
- **Purpose:** Track which degree skills are utilized
- **Options:**
  - Technical/specialized knowledge
  - Research and analysis
  - Critical thinking
  - Communication skills
  - Teamwork and collaboration
  - Problem-solving
  - Leadership
  - Project management
  - Computer/technology skills
  - None - my job doesn't use skills from my degree

#### 10. Unemployment Reason *(Optional, Conditional)*
- **Type:** Single Choice
- **Shows If:** Selected unemployed status
- **Maps To:** `alumni_profiles.unemployment_reason`
- **Options:**
  - Lack of job opportunities in my field
  - Overqualified for available positions
  - Underqualified - need additional training/certifications
  - Location constraints
  - Health reasons
  - Family obligations
  - Continuing education/further studies
  - Recently graduated - still searching
  - Other

#### 11. Education Preparation Rating *(Required)*
- **Type:** Rating (1-5)
- **Purpose:** Assess institutional effectiveness
- **Scale:**
  - 1 = Not Prepared
  - 5 = Very Well Prepared

#### 12. Recommendations for Improvement *(Optional)*
- **Type:** Textarea
- **Purpose:** Collect qualitative feedback

#### 13. Additional Comments *(Optional)*
- **Type:** Textarea
- **Purpose:** Open-ended feedback

## Data Flow

### Survey Response → Alumni Profile Mapping

```php
// After survey completion, map responses to alumni_profiles table:

// Employment Status
$response->answer['question_1'] → alumni_profiles.employment_status

// Job Details
$response->answer['question_2'] → alumni_profiles.current_job_title
$response->answer['question_3'] → alumni_profiles.current_employer

// Job Mismatch Data
$response->answer['question_4'] → alumni_profiles.job_related_to_degree
$response->answer['question_5'] → alumni_profiles.job_mismatch_reason
$response->answer['question_6'] → alumni_profiles.job_satisfaction

// Unemployment Data
$response->answer['question_10'] → alumni_profiles.unemployment_reason
```

### Response Processing Logic

```php
// Map question 5 answers to database enum values:
$mismatchMapping = [
    'Perfect match - My job requires exactly my level of education' => 'none',
    'Overqualified - My job requires less education than I have' => 'overqualified',
    'Underqualified - My job requires more education/training than I have' => 'underqualified',
    'Unfit - My job is not in my field of study at all' => 'unfit',
    'Career change by choice' => 'career_change',
    'Location constraints affected my job choice' => 'location',
    'Salary was the primary factor' => 'salary',
    'Other reasons' => 'other',
];
```

## Usage Instructions

### For Admins

1. **Access Survey:**
   - Navigate to **Admin → Survey Bank**
   - Find "Employment Quality & Job Satisfaction Survey"
   - Survey ID: 7

2. **Send to Alumni:**
   - Click "Send Invitations" 
   - Select target batches or graduation years
   - System will email survey links to selected alumni

3. **Monitor Responses:**
   - View response rate in Survey Analytics
   - Track completion progress
   - Download response data

4. **View Analytics:**
   - Navigate to **Admin → Analytics**
   - Scroll to "Job Mismatch Statistics" section
   - Charts update automatically as responses come in

### For Alumni

1. **Receive Email:**
   - Alumni receive email invitation with survey link
   - Or access via **Alumni Portal → My Surveys**

2. **Complete Survey:**
   - Answer all required questions
   - Conditional questions show based on employment status
   - Save progress and complete later if needed

3. **Submit:**
   - Click "Submit Survey"
   - Confirmation message displayed
   - Data automatically updates analytics

## Analytics Dashboard Integration

### KPI Cards Updated:
- **Overqualified:** Count of alumni with `job_mismatch_reason = 'overqualified'`
- **Unfit:** Count of alumni with `job_mismatch_reason = 'unfit'`
- **Underqualified:** Count of alumni with `job_mismatch_reason = 'underqualified'`
- **Good Match:** Count of alumni with `job_mismatch_reason = 'none'`

### Charts Updated:
- **Job Qualification Match Distribution:** Bar chart showing all mismatch categories
- **Job Satisfaction & Relevance:** Progress bars for satisfaction score and degree relation

## Testing

### Test the Survey

1. **Preview Survey:**
```bash
# Navigate to:
http://localhost:8000/admin/surveys/7
```

2. **Test Response Flow:**
   - Create test alumni account
   - Send survey invitation
   - Complete survey with various responses
   - Verify data appears in analytics

3. **Test Conditional Logic:**
   - Answer "Employed (Full-Time)" → Should show Q2-Q9
   - Answer "Unemployed (Seeking)" → Should show Q10
   - Verify questions hide/show correctly

### Verify Data Mapping

```bash
# Check if survey responses update alumni profiles:
php artisan tinker --execute="
\$response = \App\Models\SurveyResponse::where('survey_id', 7)->latest()->first();
\$alumni = \$response->user->alumniProfile;
echo 'Job Mismatch: ' . \$alumni->job_mismatch_reason . PHP_EOL;
echo 'Satisfaction: ' . \$alumni->job_satisfaction . PHP_EOL;
echo 'Job Related: ' . (\$alumni->job_related_to_degree ? 'Yes' : 'No') . PHP_EOL;
"
```

## Automation

### Auto-send Survey

You can set up automated survey distribution:

```php
// In app/Console/Commands/SendJobMismatchSurvey.php

// Send to alumni who graduated 6 months ago
$alumni = AlumniProfile::whereRaw('DATEDIFF(NOW(), graduation_date) = 180')
    ->get();

foreach ($alumni as $alumnus) {
    // Send survey invitation email
    Mail::to($alumnus->user->email)->send(new SurveyInvitation($survey));
}
```

### Reminder Emails

- Enabled by default (7-day intervals)
- Max 3 reminders per alumnus
- Stop sending after survey completion

## Best Practices

1. **Timing:**
   - Send 6-12 months after graduation
   - Annual follow-ups for career progression tracking
   - Immediately after job changes (if reported)

2. **Incentives:**
   - Consider offering certificates for completion
   - Highlight how data helps improve programs
   - Share anonymized results with respondents

3. **Data Quality:**
   - Keep required fields minimal
   - Use conditional logic to reduce survey fatigue
   - Provide clear instructions and examples

4. **Privacy:**
   - Survey is not anonymous (tracks to alumni profile)
   - Assure alumni data is confidential
   - Only show aggregated data publicly

## Troubleshooting

### Survey Not Showing Up
```bash
# Check survey status:
php artisan tinker --execute="echo \App\Models\Survey::find(7)->status;"

# Should return: active
```

### Responses Not Updating Analytics
```bash
# Verify data in database:
php artisan tinker --execute="
echo 'Alumni with mismatch data: ';
echo \App\Models\AlumniProfile::whereNotNull('job_mismatch_reason')->count();
"

# Check if survey response processing is working:
php artisan queue:work
```

### Conditional Logic Not Working
- Check question order numbers match logic references
- Verify answer text matches exactly (case-sensitive)
- Test in browser console for JavaScript errors

## Future Enhancements

1. **Auto-mapping:** Automatically update alumni_profiles when survey is submitted
2. **Trend Analysis:** Track changes over time for the same alumni
3. **Predictive Analytics:** Use satisfaction data to predict career outcomes
4. **Benchmarking:** Compare satisfaction across degree programs
5. **Export Reports:** Generate PDF reports for institutional review

## Related Documentation

- [Analytics Data Source Update](./ANALYTICS_DATA_SOURCE_UPDATE.md)
- [Survey Bank Testing Guide](./SURVEY_BANK_TESTING_GUIDE.md)
- [Alumni Implementation Checklist](./ALUMNI_IMPLEMENTATION_CHECKLIST.md)

---

**Last Updated:** October 8, 2025  
**Survey ID:** 7  
**Questions:** 13  
**Status:** Active
