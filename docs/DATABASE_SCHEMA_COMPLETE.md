# Alumni Tracer System - Complete Database Schema Documentation

> Generated: February 11, 2026  
> Database: MySQL  
> Framework: Laravel 11 (Eloquent ORM)

---

## Table of Contents

1. [Laravel Infrastructure Tables](#1-laravel-infrastructure-tables)
2. [User & Authentication Tables](#2-user--authentication-tables)
3. [Campus & Academic Structure Tables](#3-campus--academic-structure-tables)
4. [Alumni Profile & Employment Tables](#4-alumni-profile--employment-tables)
5. [Survey System Tables](#5-survey-system-tables)
6. [Job Posting System Tables](#6-job-posting-system-tables)
7. [Messaging System Tables](#7-messaging-system-tables)
8. [Announcements Tables](#8-announcements-tables)
9. [Mentorship System Tables](#9-mentorship-system-tables)
10. [Networking Tables](#10-networking-tables)
11. [Role & Permission Tables](#11-role--permission-tables)
12. [Email & Notification Tables](#12-email--notification-tables)
13. [Security & Audit Tables](#13-security--audit-tables)
14. [Settings & Appearance Tables](#14-settings--appearance-tables)
15. [Support Ticket Tables](#15-support-ticket-tables)
16. [Certificate Tables](#16-certificate-tables)
17. [Relationships Diagram](#17-relationships-diagram)
18. [Seeders](#18-seeders)

---

## 1. Laravel Infrastructure Tables

### `cache`
| Column | Type | Attributes |
|--------|------|------------|
| key | string | **PRIMARY KEY** |
| value | mediumText | |
| expiration | integer | |

### `cache_locks`
| Column | Type | Attributes |
|--------|------|------------|
| key | string | **PRIMARY KEY** |
| owner | string | |
| expiration | integer | |

### `jobs` (Queue)
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| queue | string | indexed |
| payload | longText | |
| attempts | unsignedTinyInteger | |
| reserved_at | unsignedInteger | nullable |
| available_at | unsignedInteger | |
| created_at | unsignedInteger | |

### `job_batches`
| Column | Type | Attributes |
|--------|------|------------|
| id | string | **PRIMARY KEY** |
| name | string | |
| total_jobs | integer | |
| pending_jobs | integer | |
| failed_jobs | integer | |
| failed_job_ids | longText | |
| options | mediumText | nullable |
| cancelled_at | integer | nullable |
| created_at | integer | |
| finished_at | integer | nullable |

### `failed_jobs`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| uuid | string | unique |
| connection | text | |
| queue | text | |
| payload | longText | |
| exception | longText | |
| failed_at | timestamp | default: CURRENT_TIMESTAMP |

### `sessions`
| Column | Type | Attributes |
|--------|------|------------|
| id | string | **PRIMARY KEY** |
| user_id | foreignId | nullable, indexed, → users.id |
| ip_address | string(45) | nullable |
| user_agent | text | nullable |
| payload | longText | |
| last_activity | integer | indexed |

### `personal_access_tokens`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| tokenable_type | string | morphs (indexed) |
| tokenable_id | unsignedBigInteger | morphs (indexed) |
| name | text | |
| token | string(64) | unique |
| abilities | text | nullable |
| last_used_at | timestamp | nullable |
| expires_at | timestamp | nullable, indexed |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## 2. User & Authentication Tables

### `users`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| campus_id | unsignedBigInteger | default: 1, indexed, **FK** → campuses.id |
| email | string | unique |
| email_verified_at | timestamp | nullable |
| password | string | |
| google2fa_secret | string | nullable |
| role | enum('super_admin','admin','alumni') | default: 'alumni' |
| role_id | foreignId | nullable, **FK** → roles.id ON DELETE SET NULL |
| status | enum('active','inactive','pending') | default: 'pending' |
| remember_token | string | |
| last_login_at | timestamp | nullable |
| profile_picture_path | string | nullable |
| cover_photo_path | string | nullable |
| phone_number | string(20) | nullable |
| bio | text | nullable |
| location | string(100) | nullable |
| website | string(255) | nullable |
| social_links | json | nullable |
| preferred_theme | string(20) | default: 'system' |
| preferred_language | string(10) | default: 'en' |
| created_at | timestamp | |
| updated_at | timestamp | |

**Model: `User`**  
- **Fillable:** name, email, password, role, role_id, status, last_login_at, phone_number, bio, location, website, social_links, profile_picture_path, cover_photo_path, preferred_theme, preferred_language, campus_id
- **Hidden:** password, remember_token
- **Casts:** email_verified_at → datetime, password → hashed, last_login_at → datetime
- **Appends:** display_name

**Relationships:**
| Relationship | Type | Related Model | FK |
|-------------|------|---------------|-----|
| assignedRole | belongsTo | Role | role_id |
| customPermissions | belongsToMany | Permission | via `user_permissions` |
| alumniProfile | hasOne | AlumniProfile | user_id |
| emailPreference | hasOne | EmailPreference | user_id |
| surveyResponses | hasMany | SurveyResponse | user_id |
| activityLogs | hasMany | ActivityLog | user_id |
| settings | hasOne | UserSettings | user_id |
| careerHistory | hasMany | CareerHistory | user_id |
| jobPostings | hasMany | JobPosting | user_id |
| sentConnections | hasMany | AlumniConnection | sender_id |
| receivedConnections | hasMany | AlumniConnection | receiver_id |
| mentorProfile | hasOne | MentorProfile | user_id |
| asMentor | hasMany | Mentorship | mentor_id |
| asMentee | hasMany | Mentorship | mentee_id |
| conversations | belongsToMany | Conversation | via `conversation_participants` |
| conversationParticipations | hasMany | ConversationParticipant | user_id |
| sentMessages | hasMany | Message | sender_id |
| blockedUsers | hasMany | BlockedUser | user_id |
| blockedByUsers | hasMany | BlockedUser | blocked_user_id |

### `password_reset_tokens`
| Column | Type | Attributes |
|--------|------|------------|
| email | string | **PRIMARY KEY** |
| token | string | |
| created_at | timestamp | nullable |

### `email_otps`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| email | string | indexed |
| otp | string(6) | |
| purpose | string | default: 'registration' |
| verified | boolean | default: false |
| expires_at | timestamp | |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `(email, otp, purpose)`

**Model: `EmailOtp`**  
- **Fillable:** email, otp, purpose, verified, expires_at
- **Casts:** verified → boolean, expires_at → datetime

---

## 3. Campus & Academic Structure Tables

### `campuses`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| name | string(100) | |
| code | string(10) | unique |
| display_name | string(150) | |
| address | text | nullable |
| contact_email | string(255) | nullable |
| contact_phone | string(20) | nullable |
| is_active | boolean | default: true |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `code`, `is_active`

**Model: `Campus`**  
- **Fillable:** name, code, display_name, address, contact_email, contact_phone, is_active
- **Casts:** is_active → boolean

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| users | hasMany | User |
| alumniProfiles | hasMany | AlumniProfile |
| batches | hasMany | Batch |
| courses | hasMany | Course |
| departments | hasMany | Department |

### `departments`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| campus_id | unsignedBigInteger | default: 1, **FK** → campuses.id |
| name | string | unique |
| code | string(50) | unique |
| description | text | nullable |
| logo_path | string | nullable |
| background_image_path | string | nullable |
| primary_color | string(7) | default: '#7C2529' |
| secondary_color | string(7) | default: '#B89968' |
| custom_css | text | nullable |
| status | enum('active','inactive') | default: 'active' |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | nullable (soft deletes) |

**Indexes:** `status`, `code`, `campus_id`

**Model: `Department`** (uses SoftDeletes, BelongsToCampus)  
- **Fillable:** name, code, description, status, campus_id
- **Casts:** status → string

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| courses | hasMany | Course |
| alumniProfiles | hasMany | AlumniProfile |

### `courses`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| campus_id | unsignedBigInteger | default: 1, **FK** → campuses.id |
| department_id | foreignId | **FK** → departments.id ON DELETE CASCADE |
| name | string | |
| code | string(50) | |
| description | text | nullable |
| majors | text | nullable |
| duration_years | tinyInteger | default: 4 |
| status | enum('active','inactive') | default: 'active' |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | nullable (soft deletes) |

**Indexes:** `unique(department_id, code)`, `status`, `campus_id`

**Model: `Course`** (uses SoftDeletes, BelongsToCampus)  
- **Fillable:** department_id, name, code, description, majors, duration_years, status, campus_id
- **Casts:** department_id → integer, duration_years → integer, status → string

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| department | belongsTo | Department |
| alumniProfiles | hasMany | AlumniProfile |

### `batches`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| campus_id | unsignedBigInteger | default: 1, **FK** → campuses.id |
| name | string | |
| graduation_year | year | |
| description | string | nullable |
| status | enum('active','inactive') | default: 'active' |
| initial_enrollment | unsignedInteger | nullable |
| graduated_count | unsignedInteger | nullable |
| dropout_count | unsignedInteger | nullable |
| transferred_count | unsignedInteger | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `campus_id`

**Model: `Batch`** (uses BelongsToCampus)  
- **Fillable:** name, graduation_year, description, status, campus_id
- **Casts:** graduation_year → integer

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| alumniProfiles | hasMany | AlumniProfile |
| surveyInvitations | hasMany | SurveyInvitation |

---

## 4. Alumni Profile & Employment Tables

### `alumni_profiles`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| user_id | foreignId | nullable, **FK** → users.id ON DELETE CASCADE |
| campus_id | unsignedBigInteger | default: 1, **FK** → campuses.id |
| department_id | foreignId | nullable, **FK** → departments.id ON DELETE SET NULL |
| course_id | foreignId | nullable, **FK** → courses.id ON DELETE SET NULL |
| profile_complete | boolean | default: false |
| batch_id | foreignId | nullable, **FK** → batches.id ON DELETE SET NULL |
| first_name | string | |
| last_name | string | |
| middle_name | string | nullable |
| student_id | string | unique, nullable |
| birth_date | date | nullable |
| gender | enum('male','female','other','prefer_not_to_say') | nullable |
| phone | string | nullable |
| alternate_email | string | nullable |
| current_address | text | nullable |
| city | string | nullable |
| state_province | string | nullable |
| postal_code | string | nullable |
| country | string | nullable |
| degree_program | string | nullable |
| major | string | nullable |
| minor | string | nullable |
| gpa | decimal(3,2) | nullable |
| graduation_year | year | nullable |
| graduation_date | date | nullable |
| employment_status | enum('employed_full_time','employed_part_time','self_employed','unemployed_seeking','unemployed_not_seeking','continuing_education','military_service','other') | nullable |
| current_job_title | string | nullable |
| current_employer | string | nullable |
| company_industry | string | nullable |
| career_field | enum('information_technology','education','business_management','healthcare','engineering','government','finance','marketing','hospitality','manufacturing','agriculture','other') | nullable |
| company_size | string | nullable |
| current_salary | decimal(10,2) | nullable |
| salary_range | enum('below_15k','15k_25k','25k_35k','35k_50k','50k_75k','75k_100k','above_100k','prefer_not_say') | nullable |
| salary_currency | string(3) | default: 'USD' |
| job_start_date | date | nullable |
| job_description | text | nullable |
| job_related_to_degree | boolean | nullable |
| job_mismatch_reason | enum('overqualified','underqualified','unfit','career_change','location','salary','other','none') | nullable |
| job_satisfaction | tinyInteger | nullable |
| unemployment_reason | enum('lack_of_opportunities','overqualified','underqualified','location_constraints','health_reasons','family_obligations','continuing_education','other') | nullable |
| skills | json | nullable |
| certifications | json | nullable |
| career_goals | text | nullable |
| feedback_to_institution | text | nullable |
| willing_to_mentor | boolean | default: false |
| willing_to_hire_alumni | boolean | default: false |
| profile_completed | boolean | default: false |
| profile_completed_at | timestamp | nullable |
| survey_participation_count | integer | default: 0 |
| last_profile_update | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `(graduation_year, employment_status)`, `(batch_id, employment_status)`, `job_mismatch_reason`, `campus_id`

**Model: `AlumniProfile`** (uses BelongsToCampus)  
- **Fillable:** user_id, batch_id, department_id, course_id, campus_id, profile_complete, first_name, last_name, middle_name, student_id, birth_date, gender, phone, alternate_email, current_address, city, state_province, postal_code, country, degree_program, major, minor, gpa, graduation_year, graduation_date, employment_status, current_job_title, current_employer, company_industry, company_size, current_salary, salary_currency, job_start_date, job_description, job_related_to_degree, job_mismatch_reason, job_satisfaction, unemployment_reason, skills, certifications, career_goals, feedback_to_institution, willing_to_mentor, willing_to_hire_alumni, profile_completed, profile_completed_at, salary_range, career_field, survey_participation_count, last_profile_update
- **Casts:** department_id → integer, course_id → integer, profile_complete → boolean, birth_date → date, graduation_date → date, job_start_date → date, gpa → decimal:2, current_salary → decimal:2, job_related_to_degree → boolean, job_satisfaction → integer, willing_to_mentor → boolean, willing_to_hire_alumni → boolean, profile_completed → boolean, profile_completed_at → datetime, skills → array, certifications → array, survey_participation_count → integer, last_profile_update → datetime

**Relationships:**
| Relationship | Type | Related Model | FK |
|-------------|------|---------------|-----|
| user | belongsTo | User | user_id |
| batch | belongsTo | Batch | batch_id |
| department | belongsTo | Department | department_id |
| course | belongsTo | Course | course_id |
| employments | hasMany | Employment | alumni_id |

### `employments`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| campus_id | unsignedBigInteger | default: 1, **FK** → campuses.id |
| alumni_id | foreignId | **FK** → alumni_profiles.id ON DELETE CASCADE |
| company_name | string | |
| position | string | |
| start_date | date | |
| end_date | date | nullable |
| is_current | boolean | default: false |
| salary | decimal(10,2) | nullable |
| industry | string | nullable |
| location | string | nullable |
| employment_type | enum('full-time','part-time','contract','freelance','internship') | default: 'full-time' |
| created_at | timestamp | |
| updated_at | timestamp | |

**Model: `Employment`**  
- **Fillable:** alumni_id, company_name, position, start_date, end_date, is_current, salary, industry, location, employment_type
- **Casts:** start_date → date, end_date → date, is_current → boolean, salary → decimal:2

**Relationships:**
| Relationship | Type | Related Model | FK |
|-------------|------|---------------|-----|
| alumni | belongsTo | AlumniProfile | alumni_id |

### `career_history`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| user_id | foreignId | **FK** → users.id ON DELETE CASCADE |
| job_title | string | |
| company_name | string | |
| company_location | string | nullable |
| employment_type | string | nullable |
| job_description | text | nullable |
| start_date | date | |
| end_date | date | nullable |
| is_current | boolean | default: false |
| industry | string | nullable |
| skills_used | json | nullable |
| achievements | json | nullable |
| salary | decimal(10,2) | nullable |
| salary_currency | string(3) | default: 'PHP' |
| order | integer | default: 0 |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | nullable (soft deletes) |
| archived_reason | string | nullable |

**Indexes:** `(user_id, start_date)`, `(user_id, is_current)`

**Model: `CareerHistory`** (uses SoftDeletes)  
- **Table:** `career_history`
- **Fillable:** user_id, job_title, company_name, company_location, employment_type, job_description, start_date, end_date, is_current, industry, skills_used, achievements, salary, salary_currency, order, archived_reason
- **Casts:** start_date → date, end_date → date, is_current → boolean, skills_used → array, achievements → array, salary → decimal:2

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| user | belongsTo | User |

### `career_history_versions`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| career_history_id | foreignId | **FK** → career_history.id ON DELETE CASCADE |
| user_id | foreignId | **FK** → users.id ON DELETE CASCADE |
| modified_by | foreignId | nullable, **FK** → users.id ON DELETE SET NULL |
| version_number | integer | default: 1 |
| action_type | enum('created','updated','archived','restored') | default: 'created' |
| job_title | string | |
| company_name | string | |
| company_location | string | nullable |
| employment_type | string | nullable |
| job_description | text | nullable |
| start_date | date | |
| end_date | date | nullable |
| is_current | boolean | default: false |
| industry | string | nullable |
| skills_used | json | nullable |
| achievements | json | nullable |
| salary | decimal(10,2) | nullable |
| salary_currency | string(3) | default: 'PHP' |
| changes | json | nullable |
| change_notes | text | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `(career_history_id, version_number)`, `(user_id, created_at)`, `action_type`

**Model: `CareerHistoryVersion`**  
- **Fillable:** career_history_id, user_id, modified_by, version_number, action_type, job_title, company_name, company_location, employment_type, job_description, start_date, end_date, is_current, industry, skills_used, achievements, salary, salary_currency, changes, change_notes
- **Casts:** start_date → date, end_date → date, is_current → boolean, skills_used → array, achievements → array, changes → array, salary → decimal:2

**Relationships:**
| Relationship | Type | Related Model | FK |
|-------------|------|---------------|-----|
| careerHistory | belongsTo | CareerHistory | career_history_id (withTrashed) |
| user | belongsTo | User | user_id |
| modifiedBy | belongsTo | User | modified_by |

---

## 5. Survey System Tables

### `surveys`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| campus_id | foreignId | nullable, **FK** → campuses.id ON DELETE CASCADE |
| is_multi_campus | boolean | default: false |
| title | string | |
| description | text | nullable |
| instructions | text | nullable |
| status | enum('draft','active','inactive','archived') | default: 'draft' |
| type | enum('registration','follow_up','annual','custom') | default: 'registration' |
| start_date | datetime | nullable |
| end_date | datetime | nullable |
| target_batches | json | nullable |
| target_graduation_years | json | nullable |
| is_anonymous | boolean | default: false |
| allow_multiple_responses | boolean | default: false |
| require_authentication | boolean | default: true |
| is_registration_survey | boolean | default: false |
| email_subject | string | nullable |
| email_body | text | nullable |
| send_reminder_emails | boolean | default: false |
| reminder_interval_days | integer | default: 7 |
| total_sent | integer | default: 0 |
| total_responses | integer | default: 0 |
| response_rate | decimal(5,2) | default: 0.00 |
| created_by | foreignId | **FK** → users.id ON DELETE CASCADE |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `(status, type)`, `(start_date, end_date)`, `campus_id`, `is_multi_campus`

**Model: `Survey`**  
- **Fillable:** title, description, instructions, status, type, start_date, end_date, target_batches, target_graduation_years, is_anonymous, allow_multiple_responses, require_authentication, is_registration_survey, email_subject, email_body, send_reminder_emails, reminder_interval_days, total_sent, total_responses, response_rate, created_by
- **Casts:** start_date → datetime, end_date → datetime, target_batches → array, target_graduation_years → array, is_anonymous → boolean, allow_multiple_responses → boolean, require_authentication → boolean, is_registration_survey → boolean, send_reminder_emails → boolean, reminder_interval_days → integer, total_sent → integer, total_responses → integer, response_rate → decimal:2

**Relationships:**
| Relationship | Type | Related Model | FK |
|-------------|------|---------------|-----|
| creator | belongsTo | User | created_by |
| questions | hasMany | SurveyQuestion | survey_id |
| responses | hasMany | SurveyResponse | survey_id |
| invitations | hasMany | SurveyInvitation | survey_id |

### `survey_questions`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| survey_id | foreignId | **FK** → surveys.id ON DELETE CASCADE |
| question_text | string | |
| description | text | nullable |
| question_type | enum('text','textarea','email','phone','number','date','single_choice','multiple_choice','dropdown','checkbox','rating','file_upload','matrix') | |
| options | json | nullable |
| validation_rules | json | nullable |
| is_required | boolean | default: false |
| order | integer | default: 0 |
| is_active | boolean | default: true |
| conditional_logic | json | nullable |
| matrix_rows | json | nullable |
| matrix_columns | json | nullable |
| rating_min | integer | nullable |
| rating_max | integer | nullable |
| rating_min_label | string | nullable |
| rating_max_label | string | nullable |
| placeholder | string | nullable |
| help_text | text | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `(survey_id, order)`, `(survey_id, is_active)`

**Model: `SurveyQuestion`**  
- **Fillable:** survey_id, question_text, description, question_type, options, validation_rules, is_required, order, is_active, conditional_logic, matrix_rows, matrix_columns, rating_min, rating_max, rating_min_label, rating_max_label, placeholder, help_text

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| survey | belongsTo | Survey |
| answers | hasMany | SurveyAnswer |

### `survey_responses`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| campus_id | unsignedBigInteger | default: 1, **FK** → campuses.id |
| survey_id | foreignId | **FK** → surveys.id ON DELETE CASCADE |
| user_id | foreignId | nullable, **FK** → users.id ON DELETE CASCADE |
| response_token | string | unique |
| status | enum('in_progress','completed','abandoned') | default: 'in_progress' |
| started_at | timestamp | default: CURRENT_TIMESTAMP |
| completed_at | timestamp | nullable |
| last_updated_at | timestamp | auto-updated |
| respondent_email | string | nullable |
| respondent_name | string | nullable |
| respondent_student_id | string | nullable |
| ip_address | string | nullable |
| user_agent | text | nullable |
| browser_info | json | nullable |
| total_questions | integer | default: 0 |
| answered_questions | integer | default: 0 |
| completion_percentage | decimal(5,2) | default: 0.00 |
| time_spent_seconds | integer | nullable |
| is_valid_response | boolean | default: true |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `(survey_id, status)`, `(user_id, survey_id)`, `respondent_email`, `response_token`, `campus_id`

**Model: `SurveyResponse`**  
- **Fillable:** survey_id, user_id, response_token, status, started_at, completed_at, last_updated_at, respondent_email, respondent_name, respondent_student_id, ip_address, user_agent, browser_info, total_questions, answered_questions, completion_percentage, time_spent_seconds, is_valid_response

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| survey | belongsTo | Survey |
| user | belongsTo | User |
| answers | hasMany | SurveyAnswer |

### `survey_answers`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| survey_response_id | foreignId | **FK** → survey_responses.id ON DELETE CASCADE |
| survey_question_id | foreignId | **FK** → survey_questions.id ON DELETE CASCADE |
| answer_text | text | nullable |
| answer_json | json | nullable |
| answer_number | decimal(15,4) | nullable |
| answer_date | date | nullable |
| answer_boolean | boolean | nullable |
| file_path | string | nullable |
| file_name | string | nullable |
| file_type | string | nullable |
| file_size | integer | nullable |
| answered_at | timestamp | default: CURRENT_TIMESTAMP |
| time_spent_seconds | integer | nullable |
| is_skipped | boolean | default: false |
| notes | text | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `(survey_response_id, survey_question_id)`, `survey_question_id`, `answered_at`  
**Unique:** `(survey_response_id, survey_question_id)`

**Model: `SurveyAnswer`**  
- **Fillable:** survey_response_id, survey_question_id, answer_text, answer_json, answer_number, answer_date, answer_boolean, file_path, file_name, file_type, file_size, answered_at, time_spent_seconds, is_skipped, notes

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| surveyResponse | belongsTo | SurveyResponse |
| surveyQuestion | belongsTo | SurveyQuestion |

### `survey_invitations`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| survey_id | foreignId | **FK** → surveys.id ON DELETE CASCADE |
| email | string | |
| name | string | nullable |
| student_id | string | nullable |
| batch_id | foreignId | nullable, **FK** → batches.id ON DELETE SET NULL |
| invitation_token | string | unique |
| status | enum('pending','sent','opened','clicked','responded','bounced','unsubscribed') | default: 'pending' |
| sent_at | timestamp | nullable |
| opened_at | timestamp | nullable |
| clicked_at | timestamp | nullable |
| responded_at | timestamp | nullable |
| reminder_count | integer | default: 0 |
| last_reminder_sent | timestamp | nullable |
| email_message_id | string | nullable |
| email_metadata | json | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `(survey_id, status)`, `(email, survey_id)`, `invitation_token`

**Model: `SurveyInvitation`**  
- **Fillable:** survey_id, email, name, student_id, batch_id, invitation_token, status, sent_at, opened_at, clicked_at, responded_at, reminder_count, last_reminder_sent, email_message_id, email_metadata

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| survey | belongsTo | Survey |
| batch | belongsTo | Batch |

---

## 6. Job Posting System Tables

### `job_categories`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| name | string | |
| slug | string | unique |
| description | text | nullable |
| icon | string(50) | nullable |
| color | string(20) | nullable |
| is_active | boolean | default: true |
| sort_order | integer | default: 0 |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `is_active`, `sort_order`

**Model: `JobCategory`**  
- **Fillable:** name, slug, description, icon, color, is_active, sort_order

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| jobs / jobPostings | hasMany | JobPosting (category_id) |

### `job_postings` (Recreated)
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| campus_id | foreignId | nullable, **FK** → campuses.id ON DELETE SET NULL |
| is_multi_campus | boolean | default: true |
| title | string | |
| slug | string | unique |
| company_name | string | |
| company_logo | string | nullable |
| poster_image | string | nullable |
| background_image | string | nullable |
| description | text | |
| pages | json | nullable |
| use_pages | boolean | default: false |
| category_id | foreignId | nullable, **FK** → job_categories.id ON DELETE SET NULL |
| job_type | enum('full_time','part_time','contract','internship','temporary') | |
| experience_level | enum('entry','mid','senior','executive','any') | default: 'any' |
| location | string | |
| is_remote | boolean | default: false |
| contact_person | string | nullable |
| contact_email | string | nullable |
| contact_phone | string(50) | nullable |
| application_url | string(500) | nullable |
| application_instructions | text | nullable |
| salary_range | string(100) | nullable |
| benefits | text | nullable |
| requirements | text | nullable |
| qualifications | text | nullable |
| application_deadline | date | nullable |
| start_date | date | nullable |
| status | enum('draft','published','closed','expired') | default: 'draft' |
| is_featured | boolean | default: false |
| featured_until | date | nullable |
| show_on_landing | boolean | default: false |
| views | unsignedInteger | default: 0 |
| created_by | foreignId | **FK** → users.id ON DELETE CASCADE |
| published_at | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | nullable (soft deletes) |

**Indexes:** `status`, `job_type`, `experience_level`, `is_featured`, `is_remote`, `application_deadline`, `published_at`, `(status, published_at)`, `campus_id`, `is_multi_campus`

**Model: `JobPosting`** (uses SoftDeletes)  
- **Fillable:** title, slug, company_name, company_logo, poster_image, background_image, company_website, description, pages, use_pages, category_id, job_type, employment_type, experience_level, work_arrangement, location, is_remote, contact_person, contact_email, contact_phone, application_url, external_url, application_instructions, salary_range, salary_min, salary_max, salary_currency, salary_period, is_salary_visible, benefits, requirements, qualifications, application_deadline, expires_at, start_date, status, is_featured, featured_until, views, views_count, show_on_landing, created_by, published_at

**Relationships:**
| Relationship | Type | Related Model | FK |
|-------------|------|---------------|-----|
| category | belongsTo | JobCategory | category_id |
| creator | belongsTo | User | created_by |
| jobViews | hasMany | JobView | job_posting_id |

### `job_views`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| job_posting_id | foreignId | **FK** → job_postings.id ON DELETE CASCADE |
| user_id | foreignId | nullable, **FK** → users.id ON DELETE SET NULL |
| ip_address | string(45) | nullable |
| user_agent | string(500) | nullable |
| viewed_at | timestamp | default: CURRENT_TIMESTAMP |

**Indexes:** `job_posting_id`, `user_id`, `viewed_at`

**Model: `JobView`** (no timestamps)  
- **Fillable:** job_posting_id, user_id, ip_address, user_agent, viewed_at

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| jobPosting | belongsTo | JobPosting |
| user | belongsTo | User |

> **Note:** The tables `job_applications` and `saved_jobs` were dropped in migration `2026_02_02_100004`. Models `JobApplication` and `SavedJob` still exist but tables are removed.

---

## 7. Messaging System Tables

### `conversations`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| type | enum('direct','group','support') | default: 'direct' |
| name | string | nullable |
| description | text | nullable |
| avatar_path | string | nullable |
| created_by | foreignId | **FK** → users.id ON DELETE CASCADE |
| is_support_ticket | boolean | default: false |
| support_status | enum('open','in_progress','resolved','closed') | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `type`, `is_support_ticket`, `support_status`, `created_at`

**Model: `Conversation`**  
- **Fillable:** type, name, description, avatar_path, created_by, is_support_ticket, support_status

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| creator | belongsTo | User (created_by) |
| participants | hasMany | ConversationParticipant |
| activeParticipants | hasMany | ConversationParticipant (filtered) |
| users | belongsToMany | User via `conversation_participants` |
| messages | hasMany | Message |
| latestMessage | hasOne | Message (latest) |

### `conversation_participants`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| conversation_id | foreignId | **FK** → conversations.id ON DELETE CASCADE |
| user_id | foreignId | **FK** → users.id ON DELETE CASCADE |
| role | enum('member','admin','owner') | default: 'member' |
| nickname | string | nullable |
| joined_at | timestamp | default: CURRENT_TIMESTAMP |
| left_at | timestamp | nullable |
| last_read_at | timestamp | nullable |
| is_muted | boolean | default: false |
| invitation_status | enum('pending','accepted','declined') | default: 'accepted' |
| invited_by | foreignId | nullable, **FK** → users.id ON DELETE SET NULL |
| created_at | timestamp | |
| updated_at | timestamp | |

**Unique:** `(conversation_id, user_id)`  
**Indexes:** `user_id`, `invitation_status`, `left_at`

**Model: `ConversationParticipant`**  
- **Fillable:** conversation_id, user_id, role, nickname, joined_at, left_at, last_read_at, is_muted, invitation_status, invited_by

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| conversation | belongsTo | Conversation |
| user | belongsTo | User |
| inviter | belongsTo | User (invited_by) |

### `messages`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| conversation_id | foreignId | **FK** → conversations.id ON DELETE CASCADE |
| sender_id | foreignId | **FK** → users.id ON DELETE CASCADE |
| content | text | |
| type | enum('text','image','file','system') | default: 'text' |
| attachments | json | nullable |
| is_edited | boolean | default: false |
| edited_at | timestamp | nullable |
| reply_to_id | foreignId | nullable, **FK** → messages.id ON DELETE SET NULL |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | nullable (soft deletes) |

**Indexes:** `conversation_id`, `sender_id`, `created_at`, `(conversation_id, created_at)`

**Model: `Message`** (uses SoftDeletes)  
- **Fillable:** conversation_id, sender_id, content, type, attachments, is_edited, edited_at, reply_to_id

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| conversation | belongsTo | Conversation |
| sender | belongsTo | User (sender_id) |
| replyTo | belongsTo | Message (reply_to_id) |
| replies | hasMany | Message (reply_to_id) |
| reads | hasMany | MessageRead |

### `message_reads`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| message_id | foreignId | **FK** → messages.id ON DELETE CASCADE |
| user_id | foreignId | **FK** → users.id ON DELETE CASCADE |
| read_at | timestamp | default: CURRENT_TIMESTAMP |

**Unique:** `(message_id, user_id)`  
**Indexes:** `user_id`, `read_at`

**Model: `MessageRead`** (no timestamps)  
- **Fillable:** message_id, user_id, read_at

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| message | belongsTo | Message |
| user | belongsTo | User |

---

## 8. Announcements Tables

### `announcements`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| campus_id | unsignedBigInteger | nullable, **FK** → campuses.id ON DELETE SET NULL |
| is_multi_campus | boolean | default: true |
| title | string | |
| content | text | |
| featured_image | string | nullable |
| gallery_images | json | nullable |
| pages | json | nullable |
| use_pages | boolean | default: false |
| type | enum('general','batch','department','course') | default: 'general' |
| target_type | enum('all','batch','department') | default: 'all' |
| target_batch_years | json | nullable |
| target_department_ids | json | nullable |
| target_filters | json | nullable |
| priority | enum('low','normal','high','urgent') | default: 'normal' |
| is_published | boolean | default: false |
| created_by | foreignId | **FK** → users.id ON DELETE CASCADE |
| scheduled_at | timestamp | nullable |
| published_at | timestamp | nullable |
| expires_at | timestamp | nullable |
| status | enum('draft','scheduled','published','expired') | default: 'draft' |
| show_on_landing | boolean | default: false |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `status`, `type`, `priority`, `published_at`, `expires_at`, `campus_id`

**Model: `Announcement`**  
- **Fillable:** title, content, pages, use_pages, featured_image, gallery_images, type, target_type, target_batch_years, target_department_ids, target_filters, priority, is_published, created_by, scheduled_at, published_at, expires_at, status, show_on_landing

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| creator / createdBy | belongsTo | User (created_by) |
| reads | hasMany | AnnouncementRead |

### `announcement_reads`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| announcement_id | foreignId | **FK** → announcements.id ON DELETE CASCADE |
| user_id | foreignId | **FK** → users.id ON DELETE CASCADE |
| read_at | timestamp | default: CURRENT_TIMESTAMP |

**Unique:** `(announcement_id, user_id)`  
**Indexes:** `user_id`

**Model: `AnnouncementRead`** (no timestamps)  
- **Fillable:** announcement_id, user_id, read_at

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| announcement | belongsTo | Announcement |
| user | belongsTo | User |

---

## 9. Mentorship System Tables

### `mentor_profiles`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| user_id | foreignId | **FK** → users.id ON DELETE CASCADE |
| expertise_area | string | |
| bio | text | |
| specializations | json | nullable |
| years_of_experience | integer | |
| max_mentees | integer | default: 5 |
| is_available | boolean | default: true |
| availability | json | nullable |
| status | enum('active','inactive','pending') | default: 'pending' |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `(user_id, status)`, `is_available`

**Model: `MentorProfile`**  
- **Fillable:** user_id, expertise_area, bio, specializations, years_of_experience, max_mentees, is_available, availability, status

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| user | belongsTo | User |
| mentorships | hasMany | Mentorship (mentor_id = user_id) |

### `mentorships`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| mentor_id | foreignId | **FK** → users.id ON DELETE CASCADE |
| mentee_id | foreignId | **FK** → users.id ON DELETE CASCADE |
| status | enum('pending','active','completed','cancelled') | default: 'pending' |
| mentee_message | text | nullable |
| mentor_response | text | nullable |
| goals | json | nullable |
| start_date | date | nullable |
| end_date | date | nullable |
| sessions_completed | integer | default: 0 |
| notes | text | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `(mentor_id, status)`, `(mentee_id, status)`

**Model: `Mentorship`**  
- **Fillable:** mentor_id, mentee_id, status, mentee_message, mentor_response, goals, start_date, end_date, sessions_completed, notes

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| mentor | belongsTo | User (mentor_id) |
| mentee | belongsTo | User (mentee_id) |
| sessions | hasMany | MentorshipSession |

### `mentorship_sessions`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| mentorship_id | foreignId | **FK** → mentorships.id ON DELETE CASCADE |
| scheduled_at | dateTime | |
| duration_minutes | integer | default: 60 |
| status | enum('scheduled','completed','cancelled') | default: 'scheduled' |
| agenda | text | nullable |
| notes | text | nullable |
| action_items | text | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `(mentorship_id, scheduled_at)`

**Model: `MentorshipSession`**  
- **Fillable:** mentorship_id, scheduled_at, duration_minutes, status, agenda, notes, action_items

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| mentorship | belongsTo | Mentorship |

---

## 10. Networking Tables

### `alumni_connections`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| sender_id | foreignId | **FK** → users.id ON DELETE CASCADE |
| receiver_id | foreignId | **FK** → users.id ON DELETE CASCADE |
| status | enum('pending','accepted','rejected','blocked') | default: 'pending' |
| message | text | nullable |
| responded_at | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Unique:** `(sender_id, receiver_id)`  
**Indexes:** `(receiver_id, status)`, `(sender_id, status)`

**Model: `AlumniConnection`**  
- **Fillable:** sender_id, receiver_id, status, message, responded_at

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| sender | belongsTo | User (sender_id) |
| receiver | belongsTo | User (receiver_id) |

### `blocked_users`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| user_id | foreignId | **FK** → users.id ON DELETE CASCADE |
| blocked_user_id | foreignId | **FK** → users.id ON DELETE CASCADE |
| reason | string | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Unique:** `(user_id, blocked_user_id)`  
**Indexes:** `user_id`, `blocked_user_id`

**Model: `BlockedUser`**  
- **Fillable:** user_id, blocked_user_id, reason

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| user | belongsTo | User (user_id) |
| blockedUser | belongsTo | User (blocked_user_id) |

---

## 11. Role & Permission Tables

### `permissions`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| name | string | unique |
| display_name | string | |
| description | string | nullable |
| category | string | |
| module | string | |
| is_active | boolean | default: true |
| created_at | timestamp | |
| updated_at | timestamp | |

**Model: `Permission`**  
- **Fillable:** name, display_name, description, category, module, is_active

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| roles | belongsToMany | Role via `permission_role` |
| users | belongsToMany | User via `user_permissions` |

### `roles`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| name | string | unique |
| display_name | string | |
| description | string | nullable |
| is_system_role | boolean | default: false |
| is_active | boolean | default: true |
| created_at | timestamp | |
| updated_at | timestamp | |

**Model: `Role`**  
- **Fillable:** name, display_name, description, is_system_role, is_active

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| permissions | belongsToMany | Permission via `permission_role` |
| users | hasMany | User (role_id) |

### `permission_role` (Pivot)
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| permission_id | foreignId | **FK** → permissions.id ON DELETE CASCADE |
| role_id | foreignId | **FK** → roles.id ON DELETE CASCADE |
| created_at | timestamp | |
| updated_at | timestamp | |

**Unique:** `(permission_id, role_id)`

### `user_permissions` (Pivot)
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| user_id | foreignId | **FK** → users.id ON DELETE CASCADE |
| permission_id | foreignId | **FK** → permissions.id ON DELETE CASCADE |
| is_granted | boolean | default: true |
| created_at | timestamp | |
| updated_at | timestamp | |

**Unique:** `(user_id, permission_id)`

---

## 12. Email & Notification Tables

### `email_templates`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| name | string | unique |
| subject | string | |
| body | text | |
| category | string(100) | |
| type | enum('notification','reminder','announcement','survey','system') | default: 'notification' |
| status | enum('active','inactive','draft') | default: 'draft' |
| variables | json | nullable |
| usage_count | integer | default: 0 |
| last_sent_at | timestamp | nullable |
| created_by | foreignId | nullable, **FK** → users.id ON DELETE SET NULL |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `category`, `type`, `status`

**Model: `EmailTemplate`**  
- **Fillable:** name, subject, body, category, type, status, variables, usage_count, last_sent_at, created_by

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| creator | belongsTo | User (created_by) |

### `email_preferences`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| user_id | foreignId | **FK** → users.id ON DELETE CASCADE |
| announcements_enabled | boolean | default: true |
| job_postings_enabled | boolean | default: true |
| surveys_enabled | boolean | default: true |
| messages_enabled | boolean | default: true |
| system_updates_enabled | boolean | default: true |
| frequency | enum('instant','daily','weekly','never') | default: 'instant' |
| last_digest_sent_at | timestamp | nullable |
| unsubscribe_token | string(64) | unique, nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `(user_id, frequency)`

**Model: `EmailPreference`**  
- **Fillable:** user_id, announcements_enabled, job_postings_enabled, surveys_enabled, messages_enabled, system_updates_enabled, frequency, last_digest_sent_at, unsubscribe_token

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| user | belongsTo | User |

### `email_logs`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| user_id | foreignId | nullable, **FK** → users.id ON DELETE SET NULL |
| email_address | string | |
| email_type | string(50) | indexed |
| reference_id | unsignedBigInteger | nullable |
| reference_type | string(100) | nullable |
| subject | string | |
| status | enum('queued','sent','failed','bounced','opened','clicked') | default: 'queued' |
| error_message | text | nullable |
| sent_at | timestamp | nullable |
| opened_at | timestamp | nullable |
| clicked_at | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `(email_type, reference_id)`, `(user_id, status)`, `created_at`

**Model: `EmailLog`**  
- **Fillable:** user_id, email_address, email_type, reference_id, reference_type, subject, status, error_message, sent_at, opened_at, clicked_at

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| user | belongsTo | User |
| reference | morphTo | (polymorphic) |

### `email_batches`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| batch_id | string(36) | unique (UUID) |
| email_type | string(50) | |
| reference_id | unsignedBigInteger | nullable |
| reference_type | string(100) | nullable |
| total_recipients | integer | default: 0 |
| sent_count | integer | default: 0 |
| failed_count | integer | default: 0 |
| status | enum('pending','processing','completed','failed','cancelled') | default: 'pending' |
| created_by | foreignId | nullable, **FK** → users.id ON DELETE SET NULL |
| started_at | timestamp | nullable |
| completed_at | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `(status, created_at)`

---

## 13. Security & Audit Tables

### `security_logs`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| event_type | string(100) | indexed |
| level | enum('emergency','alert','critical','error','warning','notice','info','debug') | default: 'info' |
| user_id | foreignId | nullable, **FK** → users.id ON DELETE SET NULL |
| ip_address | string(45) | nullable, indexed |
| user_agent | text | nullable |
| details | json | nullable |
| created_at | timestamp | default: CURRENT_TIMESTAMP, indexed |

### `blocked_ips`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| ip_address | string(45) | unique |
| reason | string | nullable |
| blocked_at | timestamp | default: CURRENT_TIMESTAMP |
| expires_at | timestamp | nullable, indexed |
| blocked_by | string | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

### `audit_logs`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| user_id | foreignId | nullable, **FK** → users.id ON DELETE SET NULL |
| action | string(100) | indexed |
| entity_type | string(100) | nullable, indexed |
| entity_id | unsignedBigInteger | nullable |
| old_values | json | nullable |
| new_values | json | nullable |
| ip_address | string(45) | nullable |
| user_agent | text | nullable |
| details | json | nullable |
| created_at | timestamp | default: CURRENT_TIMESTAMP, indexed |

### `login_attempts`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| email | string | indexed |
| ip_address | string(45) | indexed |
| successful | boolean | default: false |
| user_agent | text | nullable |
| failure_reason | string | nullable |
| created_at | timestamp | default: CURRENT_TIMESTAMP, indexed |

### `password_history`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| user_id | foreignId | **FK** → users.id ON DELETE CASCADE |
| password_hash | string | |
| created_at | timestamp | default: CURRENT_TIMESTAMP, indexed |

### `session_logs`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| user_id | foreignId | **FK** → users.id ON DELETE CASCADE |
| session_id | string(128) | indexed |
| ip_address | string(45) | |
| user_agent | text | nullable |
| device_type | string(50) | nullable |
| browser | string(50) | nullable |
| os | string(50) | nullable |
| location | string(100) | nullable |
| started_at | timestamp | default: CURRENT_TIMESTAMP |
| last_activity_at | timestamp | default: CURRENT_TIMESTAMP |
| ended_at | timestamp | nullable |
| end_reason | enum('logout','timeout','revoked','security') | nullable |

### `data_access_logs`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| user_id | foreignId | nullable, **FK** → users.id ON DELETE SET NULL |
| data_type | string(100) | indexed |
| data_id | unsignedBigInteger | nullable |
| access_type | enum('view','create','update','delete','export','bulk_access') | indexed |
| ip_address | string(45) | nullable |
| accessed_fields | json | nullable |
| created_at | timestamp | default: CURRENT_TIMESTAMP, indexed |

### `security_configurations`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| key | string(100) | unique |
| value | text | |
| description | string | nullable |
| is_active | boolean | default: true |
| updated_by | foreignId | nullable, **FK** → users.id ON DELETE SET NULL |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## 14. Settings & Appearance Tables

### `admin_settings`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| key | string | unique |
| value | text | nullable |
| type | string | default: 'string' |
| description | text | nullable |
| category | string | default: 'general' |
| is_public | boolean | default: false |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `(category, key)`

**Model: `AdminSetting`**  
- **Fillable:** key, value, type, description, category, is_public
- **Casts:** is_public → boolean

### `user_settings`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| user_id | foreignId | unique, **FK** → users.id ON DELETE CASCADE |
| email_notifications | boolean | default: true |
| survey_reminders | boolean | default: true |
| network_updates | boolean | default: true |
| profile_visibility | boolean | default: true |
| show_employment_status | boolean | default: true |
| allow_connection_requests | boolean | default: true |
| created_at | timestamp | |
| updated_at | timestamp | |

**Model: `UserSettings`**  
- **Fillable:** user_id, email_notifications, survey_reminders, network_updates, profile_visibility, show_employment_status, allow_connection_requests

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| user | belongsTo | User |

### `system_appearance_settings`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| logo_light_path | string | nullable |
| logo_dark_path | string | nullable |
| favicon_path | string | nullable |
| background_image_path | string | nullable |
| primary_color | string(7) | default: '#7C2529' |
| secondary_color | string(7) | default: '#B89968' |
| accent_color | string(7) | default: '#D4AF37' |
| enable_dark_mode | boolean | default: true |
| default_theme | string(20) | default: 'light' |
| font_family | string(100) | default: 'Inter' |
| custom_css | text | nullable |
| custom_js | text | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

### `activity_logs`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| user_id | foreignId | nullable, **FK** → users.id ON DELETE SET NULL |
| action | string | |
| entity_type | string | nullable |
| entity_id | unsignedBigInteger | nullable |
| description | text | |
| metadata | json | nullable |
| ip_address | string | nullable |
| user_agent | text | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `(user_id, action)`, `(entity_type, entity_id)`, `created_at`

**Model: `ActivityLog`**  
- **Fillable:** user_id, action, entity_type, entity_id, description, metadata, ip_address, user_agent

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| user | belongsTo | User |

---

## 15. Support Ticket Tables

### `support_tickets`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| user_id | foreignId | **FK** → users.id ON DELETE CASCADE |
| ticket_number | string | unique |
| category | enum('general','technical','account','employment','alumni_association','other') | default: 'general' |
| subject | string | |
| message | text | |
| status | enum('open','in_progress','resolved','closed') | default: 'open' |
| priority | enum('low','medium','high','urgent') | default: 'medium' |
| assigned_to | foreignId | nullable, **FK** → users.id ON DELETE SET NULL |
| admin_notes | text | nullable |
| resolved_at | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `(user_id, status)`, `ticket_number`, `category`, `status`

**Model: `SupportTicket`**  
- **Fillable:** user_id, ticket_number, category, subject, message, status, priority, assigned_to, admin_notes, resolved_at

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| user | belongsTo | User |
| assignedAdmin | belongsTo | User (assigned_to) |
| replies | hasMany | SupportTicketReply (ticket_id) |

### `support_ticket_replies`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| ticket_id | foreignId | **FK** → support_tickets.id ON DELETE CASCADE |
| user_id | foreignId | **FK** → users.id ON DELETE CASCADE |
| message | text | |
| is_admin_reply | boolean | default: false |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `(ticket_id, created_at)`

**Model: `SupportTicketReply`**  
- **Fillable:** ticket_id, user_id, message, is_admin_reply

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| ticket | belongsTo | SupportTicket (ticket_id) |
| user | belongsTo | User |

---

## 16. Certificate Tables

### `certificates`
| Column | Type | Attributes |
|--------|------|------------|
| id | bigint | **PK**, auto-increment |
| user_id | foreignId | **FK** → users.id ON DELETE CASCADE |
| type | string | |
| title | string | |
| description | text | nullable |
| issued_date | date | |
| reference_type | string | nullable (polymorphic) |
| reference_id | unsignedBigInteger | nullable (polymorphic) |
| certificate_number | string | unique |
| status | string | default: 'available' |
| metadata | json | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `(user_id, type)`, `(user_id, status)`

**Model: `Certificate`**  
- **Fillable:** user_id, type, title, description, issued_date, reference_id, reference_type, certificate_number, status, metadata
- **Types:** survey_completion, membership, participation, achievement
- **Statuses:** available, pending, expired

**Relationships:**
| Relationship | Type | Related Model |
|-------------|------|---------------|
| user | belongsTo | User |
| reference | morphTo | (polymorphic) |

---

## 17. Relationships Diagram

### Core Entity Relationships

```
Campus (1) ──────┬──── (N) Users
                  ├──── (N) Departments
                  ├──── (N) Courses
                  ├──── (N) Batches
                  ├──── (N) AlumniProfiles
                  ├──── (N) Surveys
                  ├──── (N) Announcements
                  └──── (N) JobPostings

User (1) ────────┬──── (1) AlumniProfile
                  ├──── (1) UserSettings
                  ├──── (1) EmailPreference
                  ├──── (1) MentorProfile
                  ├──── (N) SurveyResponses
                  ├──── (N) ActivityLogs
                  ├──── (N) CareerHistory
                  ├──── (N) Certificates
                  ├──── (N) SupportTickets
                  ├──── (N) Messages (sender)
                  ├──── (N) AlumniConnections (sender/receiver)
                  ├──── (N) Mentorships (mentor/mentee)
                  ├──── (N) BlockedUsers (blocker/blocked)
                  └──── (N↔N) Conversations (via participants)

Department (1) ──┬──── (N) Courses
                  └──── (N) AlumniProfiles

Course (1) ──────└──── (N) AlumniProfiles

Batch (1) ───────┬──── (N) AlumniProfiles
                  └──── (N) SurveyInvitations

AlumniProfile (1)└──── (N) Employments

Survey (1) ──────┬──── (N) SurveyQuestions
                  ├──── (N) SurveyResponses
                  └──── (N) SurveyInvitations

SurveyResponse (1)──── (N) SurveyAnswers

SurveyQuestion (1)──── (N) SurveyAnswers

JobCategory (1) ─└──── (N) JobPostings

JobPosting (1) ──└──── (N) JobViews

Conversation (1)─┬──── (N) ConversationParticipants
                  └──── (N) Messages

Message (1) ─────┬──── (N) MessageReads
                  └──── (N) Replies (self-referential)

Announcement (1) └──── (N) AnnouncementReads

Mentorship (1) ──└──── (N) MentorshipSessions

SupportTicket (1)└──── (N) SupportTicketReplies

Role (1) ────────┬──── (N) Users
                  └──── (N↔N) Permissions (via permission_role)

Permission ──────└──── (N↔N) Users (via user_permissions)
```

---

## 18. Seeders

| Seeder | Purpose |
|--------|---------|
| **DatabaseSeeder** | Main seeder; calls `AlumniTracerSeeder` |
| **AlumniTracerSeeder** | Creates default admin user (`admin@alumnitracer.edu`), graduation batches (2020-2024), sample alumni users with profiles, and a registration survey with questions |
| **SuperAdminSeeder** | Creates/updates super admin user (`nacuadrian873@gmail.com`) with `super_admin` role |
| **PermissionsSeeder** | Seeds all system permissions across all modules (Dashboard, Users, Alumni, Batches, Surveys, Email Templates, Departments, System Settings, etc.) and creates default roles (Super Admin, Admin, Alumni) with appropriate permission assignments |
| **AdminSettingsSeeder** | Seeds default admin settings: app_name, tagline, timezone, email templates, survey defaults, system configuration. 270 lines of key-value settings across categories |
| **EmailTemplateSeeder** | Seeds default email templates: Welcome Email, Survey Invitation, Password Reset, Profile Completion Reminder, etc. |
| **JobCategorySeeder** | Seeds job categories: IT, Engineering, Education, Healthcare, Business, Government, Finance, Manufacturing, etc. |
| **EmploymentSeeder** | Creates employment records for existing alumni profiles (85% employment rate simulation) |
| **ComprehensiveAlumniSeeder** | Seeds large batch of Filipino alumni with realistic names, employment data, salaries, career fields |
| **ComprehensiveTestDataSeeder** | Full test data using Faker: users, departments, courses, batches, alumni, surveys, survey questions, survey responses, employments |
| **AnalyticsDataSeeder** | Updates existing alumni profiles with graduation dates and job start dates for analytics testing |
| **TestAlumniSeeder** | Creates test alumni with realistic employment data for analytics validation |
| **TestContentSeeder** | Seeds example announcements and job postings for testing |
| **JobMismatchDataSeeder** | Seeds job mismatch data (overqualified/underqualified/unfit) and satisfaction scores for employed alumni |
| **IntelligentJobMismatchSeeder** | Intelligent classification using education level + job title pattern matching for job mismatch analysis |
| **JobMismatchSurveySeeder** | Creates a detailed "Employment Quality & Job Satisfaction Survey" with questions about job satisfaction, career alignment, and qualification matching |
| **SurveyResponseSeeder** | Seeds realistic survey responses with time-distributed completion (60-80% response rate for active surveys) |
| **CaviteCampusInfrastructureSeeder** | Creates departments, courses, and batches specifically for Cavite Campus (campus_id = 2) |
| **CaviteCampusDataSeeder** | Seeds Cavite campus academic structure: departments (COE-CAV, CCS-CAV, CBA-CAV, CIE-CAV, CS-CAV), courses, and batches |
| **DeleteNonPreservedAlumniSeeder** | Utility seeder to delete all alumni except 2 preserved accounts, handles cascading deletions |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **Total Tables** | ~45 |
| **Model Files** | 42 |
| **Migration Files** | 71 |
| **Seeder Files** | 20 |
| **Foreign Key Relationships** | 50+ |
| **Pivot Tables** | 2 (permission_role, user_permissions) |
| **Tables with Soft Deletes** | 5 (departments, courses, career_history, messages, job_postings) |
| **Tables with Campus Scoping** | 10 (users, alumni_profiles, batches, courses, departments, surveys, survey_responses, job_postings, announcements, employments) |
