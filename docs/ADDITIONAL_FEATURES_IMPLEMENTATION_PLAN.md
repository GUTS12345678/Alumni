# Additional Features Implementation Plan

## Alumni Tracer System - EARIST

**Document Version:** 1.0  
**Last Updated:** February 2, 2026  
**Status:** Planning Phase

---

## Table of Contents

1. [Campus Management](#1-campus-management)
2. [Email Template Updates](#2-email-template-updates)
3. [Profile Enhancements](#3-profile-enhancements)
4. [Data Migration](#4-data-migration)
5. [Reporting System](#5-reporting-system)
6. [Data Import Features](#6-data-import-features)
7. [Academic Timeline Tracking](#7-academic-timeline-tracking)
8. [Employment Status Enhancements](#8-employment-status-enhancements)
9. [Data Privacy Compliance](#9-data-privacy-compliance)
10. [Registration System Updates](#10-registration-system-updates)
11. [Employment Documentation](#11-employment-documentation)
12. [Analytics & Metrics](#12-analytics--metrics)
13. [Job Board Enhancements](#13-job-board-enhancements)
14. [Customer Support System](#14-customer-support-system)
15. [Announcement System](#15-announcement-system)
16. [Dashboard Improvements](#16-dashboard-improvements)
17. [QR Scanner Integration](#17-qr-scanner-integration)
18. [Employment Record Versioning](#18-employment-record-versioning)
19. [DOLE & CHED Compliance](#19-dole--ched-compliance)

---

## 1. Campus Management

### Add Cavite Campus

**Priority:** High  
**Complexity:** Low

#### Database Changes

```sql
-- Add Cavite to campus enum or campus table
ALTER TABLE `campuses` ADD COLUMN IF NOT EXISTS;

-- Insert Cavite campus
INSERT INTO `campuses` (`name`, `code`, `address`, `is_active`) VALUES
('EARIST Cavite Campus', 'CAV', 'Cavite Campus Address', 1);
```

#### Implementation Steps

1. Update `CampusSeeder.php` to include Cavite campus
2. Update campus dropdown options in:
   - Registration forms
   - Profile settings
   - Admin management panels
3. Update validation rules to accept Cavite campus

#### Files to Modify

- `database/seeders/CampusSeeder.php`
- `resources/js/pages/Auth/Register.tsx`
- `resources/js/pages/Alumni/Profile/Edit.tsx`
- `app/Models/Campus.php`

---

## 2. Email Template Updates

### Remove "Alumni Association" References

**Priority:** High  
**Complexity:** Low

#### Changes Required

Replace all instances of "Alumni Association" with "EARIST" in email templates.

#### Files to Update

```
resources/views/emails/
├── welcome.blade.php
├── verification.blade.php
├── password-reset.blade.php
├── survey-invitation.blade.php
├── job-notification.blade.php
└── announcement.blade.php
```

#### Example Change

```php
// Before
'EARIST Alumni Association'

// After
'EARIST'
```

#### Implementation Steps

1. Search and replace in all email templates
2. Update email configuration in `config/mail.php`
3. Update `Mail` classes in `app/Mail/`
4. Test all email notifications

---

## 3. Profile Enhancements

### 3.1 Maiden Name Field (Pre-Marital Name)

**Priority:** High  
**Complexity:** Medium

#### Database Migration

```php
// Migration: add_maiden_name_to_users_table.php
Schema::table('users', function (Blueprint $table) {
    $table->string('maiden_name')->nullable()->after('last_name');
    $table->string('marital_surname')->nullable()->after('maiden_name');
});
```

#### Logic Implementation

```php
// app/Models/User.php
public function getDisplayNameAttribute()
{
    if ($this->marital_status === 'married' && $this->marital_surname) {
        return $this->first_name . ' ' . $this->marital_surname . ' (née ' . $this->maiden_name . ')';
    }
    return $this->first_name . ' ' . $this->last_name;
}
```

#### UI Implementation

- Show maiden name field only when marital status is "Married"
- Auto-populate maiden name with current last name when status changes to married
- Add marital surname input field

### 3.2 Marital Status with Marital Surname

#### Form Fields Structure

```typescript
// MaritalStatusFields.tsx
interface MaritalStatusFields {
  marital_status: 'single' | 'married' | 'divorced' | 'widowed' | 'separated';
  maiden_name?: string;      // Required if married
  marital_surname?: string;  // Optional, for married individuals
}
```

#### Conditional Display Logic

```tsx
{formData.marital_status === 'married' && (
  <>
    <FormField
      label="Maiden Name (Pre-Marital Last Name)"
      name="maiden_name"
      required
    />
    <FormField
      label="Marital Surname (Current Last Name)"
      name="marital_surname"
    />
  </>
)}
```

---

## 4. Data Migration

### Import from Existing Tracer System (Pinnacle)

**Priority:** Critical  
**Complexity:** High

#### Purpose

- Migrate existing alumni data from Pinnacle tracer system
- Validate if alumni already have information
- Identify graduating students who need to complete registration

#### CSV Import Format

> **Note:** Awaiting CSV format specification from user

```php
// Expected CSV columns (placeholder)
$expectedColumns = [
    'student_id',
    'first_name',
    'last_name',
    'middle_name',
    'email',
    'graduation_year',
    'course',
    'campus',
    'employment_status',
    // Additional fields TBD
];
```

#### Migration Service

```php
// app/Services/DataMigrationService.php
class DataMigrationService
{
    public function importFromCSV(string $filePath): ImportResult
    {
        // 1. Parse CSV file
        // 2. Validate data format
        // 3. Check for existing records (by student_id)
        // 4. Create/update alumni records
        // 5. Flag records needing verification
        // 6. Generate import report
    }
    
    public function validateExistingAlumni(string $studentId): bool
    {
        // Check if alumni has complete profile
        // Return true if profile exists and is complete
    }
    
    public function identifyGraduatingStudents(): Collection
    {
        // Find records with incomplete profiles
        // These are likely graduating students needing registration
    }
}
```

#### Admin Interface

- CSV upload interface
- Field mapping preview
- Validation error display
- Import progress tracking
- Import history/logs

---

## 5. Reporting System

### Purpose

- Profiling of alumni
- Needs assessment for review

### Report Types

#### 5.1 Tracer Report (Year-based)

```php
// Reports for 2026 and onwards
class TracerReport
{
    public function generate(int $year): ReportData
    {
        return [
            'total_graduates' => $this->getTotalGraduates($year),
            'employment_rate' => $this->getEmploymentRate($year),
            'email_response_rate' => $this->getEmailResponseRate($year),
            'employment_status_breakdown' => $this->getEmploymentBreakdown($year),
            'course_alignment_rate' => $this->getCourseAlignmentRate($year),
        ];
    }
}
```

#### 5.2 Performance Indicators

**Key Metric:** Percentage of graduates employed within 2 years

```php
class PerformanceIndicator
{
    public function calculateEmploymentRate(int $graduationYear): float
    {
        $twoYearsLater = $graduationYear + 2;
        
        $totalGraduates = Alumni::whereYear('graduation_date', $graduationYear)->count();
        $employedWithin2Years = Alumni::whereYear('graduation_date', $graduationYear)
            ->whereHas('employmentHistory', function ($q) use ($twoYearsLater) {
                $q->whereYear('start_date', '<=', $twoYearsLater);
            })
            ->count();
            
        return ($employedWithin2Years / $totalGraduates) * 100;
    }
}
```

#### 5.3 Email Tracking

- Track sent emails
- Monitor response rates
- Identify non-responsive alumni

---

## 6. Data Import Features

### 6.1 Import Takers and Passers

**Purpose:** Track board exam/licensure exam results

#### Database Schema

```sql
CREATE TABLE `board_exam_results` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `alumni_id` BIGINT UNSIGNED NOT NULL,
    `exam_type` VARCHAR(100) NOT NULL,
    `exam_name` VARCHAR(255) NOT NULL,
    `exam_date` DATE NOT NULL,
    `status` ENUM('taker', 'passer', 'failed') NOT NULL,
    `rating` DECIMAL(5,2) NULLABLE,
    `license_number` VARCHAR(100) NULLABLE,
    `imported_at` TIMESTAMP NULLABLE,
    `created_at` TIMESTAMP,
    `updated_at` TIMESTAMP,
    FOREIGN KEY (`alumni_id`) REFERENCES `users`(`id`)
);
```

#### CSV Import Format for Exam Results

```csv
student_id,exam_type,exam_name,exam_date,status,rating,license_number
2020-00001,PRC,Civil Engineering Board Exam,2024-05-15,passer,85.50,CE-12345
```

### 6.2 Profile Update Import

Allow bulk profile updates via CSV import for administrative updates.

---

## 7. Academic Timeline Tracking

### 7.1 Graduation Timeline

**Track:** On-time graduation vs. Extended stay

#### Database Changes

```sql
ALTER TABLE `alumni_profiles` ADD COLUMN `enrollment_year` YEAR NOT NULL;
ALTER TABLE `alumni_profiles` ADD COLUMN `graduation_year` YEAR NOT NULL;
ALTER TABLE `alumni_profiles` ADD COLUMN `expected_graduation_year` YEAR NULLABLE;
ALTER TABLE `alumni_profiles` ADD COLUMN `program_duration_years` INT DEFAULT 4;
```

#### Calculation Logic

```php
// app/Models/AlumniProfile.php
public function getGraduationStatusAttribute(): string
{
    $expectedYears = $this->program_duration_years;
    $actualYears = $this->graduation_year - $this->enrollment_year;
    
    if ($actualYears <= $expectedYears) {
        return 'on_time';
    }
    return 'extended';
}

public function getYearsInEaristAttribute(): int
{
    return $this->graduation_year - $this->enrollment_year;
}

public function getExtensionYearsAttribute(): int
{
    $actualYears = $this->graduation_year - $this->enrollment_year;
    $expectedYears = $this->program_duration_years;
    
    return max(0, $actualYears - $expectedYears);
}
```

#### UI Display

```tsx
// GraduationTimeline.tsx
<div className="graduation-timeline">
  <p>Enrolled: {enrollmentYear}</p>
  <p>Graduated: {graduationYear}</p>
  <p>Years at EARIST: {yearsInEarist}</p>
  <Badge variant={graduationStatus === 'on_time' ? 'success' : 'warning'}>
    {graduationStatus === 'on_time' ? 'Graduated On Time' : `Extended (${extensionYears} year/s)`}
  </Badge>
</div>
```

### 7.2 Historical Batch Support

**Support batches from 1978 onwards**

- Ensure year fields support 1978-present
- Add batch year dropdown with full range
- Historical data validation

---

## 8. Employment Status Enhancements

### 8.1 Sector Classification

#### Database Changes

```sql
ALTER TABLE `employment_records` ADD COLUMN `sector_type` ENUM('public', 'private') NOT NULL;
ALTER TABLE `employment_records` ADD COLUMN `location_type` ENUM('local', 'foreign') NOT NULL;
```

#### Employment Categories

```php
// Employment Sector Types
const SECTOR_TYPES = [
    'public' => 'Public/Government',
    'private' => 'Private',
];

// Location Types
const LOCATION_TYPES = [
    'local' => 'Local (Philippines)',
    'foreign' => 'Foreign/Overseas',
];
```

#### Form Implementation

```tsx
// EmploymentForm.tsx
<Select
  label="Employment Sector"
  name="sector_type"
  options={[
    { value: 'public', label: 'Public/Government' },
    { value: 'private', label: 'Private' },
  ]}
/>

<Select
  label="Work Location"
  name="location_type"
  options={[
    { value: 'local', label: 'Local (Philippines)' },
    { value: 'foreign', label: 'Foreign/Overseas' },
  ]}
/>
```

### 8.2 Overqualified Status Indicator

**Definition:** Alumni with higher educational attainment than job requirements

```php
// app/Services/QualificationMatchService.php
class QualificationMatchService
{
    const EDUCATION_LEVELS = [
        'high_school' => 1,
        'vocational' => 2,
        'bachelors' => 3,
        'masters' => 4,
        'doctorate' => 5,
    ];
    
    public function checkOverqualified(User $alumni, Job $job): bool
    {
        $alumniLevel = self::EDUCATION_LEVELS[$alumni->highest_education] ?? 0;
        $jobRequiredLevel = self::EDUCATION_LEVELS[$job->required_education] ?? 0;
        
        return $alumniLevel > $jobRequiredLevel;
    }
    
    public function getQualificationStatus(User $alumni, Job $job): string
    {
        $alumniLevel = self::EDUCATION_LEVELS[$alumni->highest_education] ?? 0;
        $jobRequiredLevel = self::EDUCATION_LEVELS[$job->required_education] ?? 0;
        
        if ($alumniLevel > $jobRequiredLevel) {
            return 'overqualified';
        } elseif ($alumniLevel < $jobRequiredLevel) {
            return 'underqualified';
        }
        return 'matched';
    }
}
```

### 8.3 Rename "Possibilities" to "Good Match"

Update UI labels for job-course alignment indicators.

```tsx
// Before
<Badge>Possibilities: High</Badge>

// After
<Badge>Good Match</Badge> // When work aligns with course
```

---

## 9. Data Privacy Compliance

### Data Privacy Act Agreement

**Priority:** Critical  
**Compliance:** Republic Act No. 10173 (Data Privacy Act of 2012)

#### Implementation

```tsx
// DataPrivacyConsent.tsx
const DataPrivacyConsent = ({ onAccept, onDecline }) => {
  return (
    <Dialog open={true}>
      <DialogHeader>
        <DialogTitle>Data Privacy Agreement</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <ScrollArea className="h-96">
          <div className="prose">
            <h3>EARIST Alumni Tracer System</h3>
            <h4>Data Privacy Notice and Consent</h4>
            
            <p>In compliance with Republic Act No. 10173 or the Data Privacy Act of 2012...</p>
            
            <h5>Information We Collect:</h5>
            <ul>
              <li>Personal Information (Name, Address, Contact Details)</li>
              <li>Educational Background</li>
              <li>Employment History</li>
              <li>Professional Development Information</li>
            </ul>
            
            <h5>Purpose of Collection:</h5>
            <ul>
              <li>Alumni profiling and tracking</li>
              <li>Employment status monitoring</li>
              <li>Institutional research and reporting</li>
              <li>Career assistance services</li>
            </ul>
            
            <h5>Your Rights:</h5>
            <ul>
              <li>Right to be informed</li>
              <li>Right to access</li>
              <li>Right to object</li>
              <li>Right to erasure or blocking</li>
              <li>Right to rectification</li>
              <li>Right to data portability</li>
            </ul>
          </div>
        </ScrollArea>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={onDecline}>
          I Do Not Agree
        </Button>
        <Button onClick={onAccept}>
          I Agree
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
```

#### Database Changes

```sql
ALTER TABLE `users` ADD COLUMN `data_privacy_consent` BOOLEAN DEFAULT FALSE;
ALTER TABLE `users` ADD COLUMN `data_privacy_consent_date` TIMESTAMP NULLABLE;
ALTER TABLE `users` ADD COLUMN `data_privacy_consent_version` VARCHAR(10) NULLABLE;
```

#### Workflow

1. Show Data Privacy Agreement at first login/registration
2. Block access until consent is given
3. Store consent timestamp and version
4. Allow users to revoke consent (with consequences explained)

---

## 10. Registration System Updates

### Registration Flow

**Required Fields:**
- Student ID/Number
- Password
- Last Name

#### Simplified Registration Form

```tsx
// Register.tsx
const registrationFields = {
  student_id: {
    required: true,
    label: 'Student ID/Number',
    placeholder: 'e.g., 2020-00001',
    validation: /^\d{4}-\d{5}$/,
  },
  last_name: {
    required: true,
    label: 'Last Name',
  },
  password: {
    required: true,
    label: 'Password',
    minLength: 8,
  },
  password_confirmation: {
    required: true,
    label: 'Confirm Password',
  },
};
```

#### Validation Against Existing Data

```php
// Validate student_id exists in imported data
public function validateStudentId(string $studentId): ValidationResult
{
    $existingRecord = ImportedAlumni::where('student_id', $studentId)->first();
    
    if (!$existingRecord) {
        // Check if they're a graduating student
        $graduatingStudent = GraduatingStudent::where('student_id', $studentId)->first();
        
        if (!$graduatingStudent) {
            return ValidationResult::error('Student ID not found in records');
        }
    }
    
    return ValidationResult::success();
}
```

---

## 11. Employment Documentation

### 11.1 Employment ID for Career Timeline

**Purpose:** Track employment records with documentation

#### Database Changes

```sql
ALTER TABLE `employment_records` ADD COLUMN `employment_id` VARCHAR(100) NULLABLE;
ALTER TABLE `employment_records` ADD COLUMN `employment_certificate_path` VARCHAR(255) NULLABLE;
ALTER TABLE `employment_records` ADD COLUMN `coe_upload_date` TIMESTAMP NULLABLE;

CREATE TABLE `employment_documents` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `employment_record_id` BIGINT UNSIGNED NOT NULL,
    `document_type` ENUM('employment_certificate', 'payslip', 'contract', 'id_card', 'other') NOT NULL,
    `file_path` VARCHAR(255) NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`employment_record_id`) REFERENCES `employment_records`(`id`)
);
```

#### UI Implementation

```tsx
// EmploymentDocuments.tsx
<FormField
  label="Employment ID (if applicable)"
  name="employment_id"
  placeholder="e.g., EMP-2024-001"
/>

<FileUpload
  label="Certificate of Employment"
  name="employment_certificate"
  accept=".pdf,.jpg,.png"
  maxSize={5 * 1024 * 1024} // 5MB
/>

<FileUpload
  label="Supporting Documents"
  name="supporting_documents"
  multiple
  accept=".pdf,.jpg,.png"
/>
```

---

## 12. Analytics & Metrics

### 12.1 Enrollment vs. Graduation Comparison

**Metric:** Attrition Rate

```php
// app/Services/AnalyticsService.php
class AnalyticsService
{
    public function getAttritionRate(int $enrollmentYear, string $course): AttritionData
    {
        $enrolled = Student::where('enrollment_year', $enrollmentYear)
            ->where('course', $course)
            ->count();
            
        $graduated = Alumni::where('enrollment_year', $enrollmentYear)
            ->where('course', $course)
            ->whereNotNull('graduation_date')
            ->count();
            
        $attritionRate = (($enrolled - $graduated) / $enrolled) * 100;
        
        return new AttritionData([
            'enrollment_year' => $enrollmentYear,
            'course' => $course,
            'enrolled_count' => $enrolled,
            'graduated_count' => $graduated,
            'attrition_count' => $enrolled - $graduated,
            'attrition_rate' => round($attritionRate, 2),
            'completion_rate' => round(100 - $attritionRate, 2),
        ]);
    }
}
```

#### Dashboard Widget

```tsx
// AttritionRateWidget.tsx
<Card>
  <CardHeader>
    <CardTitle>Enrollment vs. Graduation</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="stats-grid">
      <Stat label="Enrolled" value={enrolled} />
      <Stat label="Graduated" value={graduated} />
      <Stat label="Attrition Rate" value={`${attritionRate}%`} variant="warning" />
    </div>
    <BarChart data={comparisonData} />
  </CardContent>
</Card>
```

### 12.2 Course-to-Work Alignment

**Track:** How many graduates work in their field of study

```php
public function getCourseAlignmentRate(int $graduationYear): AlignmentData
{
    $totalEmployed = Alumni::whereYear('graduation_year', $graduationYear)
        ->whereHas('currentEmployment')
        ->count();
        
    $alignedEmployment = Alumni::whereYear('graduation_year', $graduationYear)
        ->whereHas('currentEmployment', function ($q) {
            $q->where('is_course_aligned', true);
        })
        ->count();
        
    return new AlignmentData([
        'total_employed' => $totalEmployed,
        'aligned_count' => $alignedEmployment,
        'alignment_rate' => ($alignedEmployment / $totalEmployed) * 100,
    ]);
}
```

---

## 13. Job Board Enhancements

### 13.1 Number of Hires/Openings

#### Database Changes

```sql
ALTER TABLE `job_postings` ADD COLUMN `number_of_hires` INT DEFAULT 1;
ALTER TABLE `job_postings` ADD COLUMN `hired_count` INT DEFAULT 0;
```

#### UI Implementation

```tsx
// JobPostingForm.tsx
<FormField
  label="Number of Positions Available"
  name="number_of_hires"
  type="number"
  min={1}
  required
/>

// JobCard.tsx
<Badge variant="info">
  {job.number_of_hires - job.hired_count} positions available
</Badge>
```

### 13.2 Company Poster/Background Image

#### Database Changes

```sql
ALTER TABLE `job_postings` ADD COLUMN `poster_image_path` VARCHAR(255) NULLABLE;
ALTER TABLE `job_postings` ADD COLUMN `background_image_path` VARCHAR(255) NULLABLE;
```

#### UI Implementation

```tsx
// JobPostingForm.tsx
<ImageUpload
  label="Job Poster Image"
  name="poster_image"
  accept="image/*"
  maxSize={10 * 1024 * 1024} // 10MB
  aspectRatio={16/9}
  description="Recommended size: 1200x675 pixels"
/>

<ImageUpload
  label="Background Image"
  name="background_image"
  accept="image/*"
  maxSize={5 * 1024 * 1024}
/>

// JobCard.tsx
<Card 
  style={{ 
    backgroundImage: job.background_image_path 
      ? `url(${job.background_image_path})` 
      : undefined 
  }}
>
  {job.poster_image_path && (
    <img src={job.poster_image_path} alt="Job Poster" className="job-poster" />
  )}
  {/* Job details */}
</Card>
```

### 13.3 Job Requirements (Minimum 1 Poster per Page)

Enforce visual content requirement for job postings.

```php
// JobPostingRequest.php
public function rules(): array
{
    return [
        'poster_image' => 'required|image|max:10240', // Required, max 10MB
        'title' => 'required|string|max:255',
        'description' => 'required|string',
        // ... other rules
    ];
}
```

---

## 14. Customer Support System

### Support Ticket System

#### Database Schema

```sql
CREATE TABLE `support_tickets` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `ticket_number` VARCHAR(20) UNIQUE NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `category` ENUM('technical', 'account', 'employment', 'alumni_association', 'other') NOT NULL,
    `priority` ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    `status` ENUM('open', 'in_progress', 'waiting_response', 'resolved', 'closed') DEFAULT 'open',
    `description` TEXT NOT NULL,
    `assigned_to` BIGINT UNSIGNED NULLABLE,
    `created_at` TIMESTAMP,
    `updated_at` TIMESTAMP,
    `resolved_at` TIMESTAMP NULLABLE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
    FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`)
);

CREATE TABLE `support_ticket_messages` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `ticket_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `message` TEXT NOT NULL,
    `is_internal` BOOLEAN DEFAULT FALSE,
    `attachments` JSON NULLABLE,
    `created_at` TIMESTAMP,
    FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets`(`id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);
```

### Alumni Association Concern Button

```tsx
// ContactAlumniAssociation.tsx
<Button
  variant="outline"
  onClick={() => openSupportTicket('alumni_association')}
>
  <MessageSquare className="mr-2 h-4 w-4" />
  Contact Alumni Association
</Button>
```

---

## 15. Announcement System

### Image Upload for Announcements

#### Database Changes

```sql
ALTER TABLE `announcements` ADD COLUMN `featured_image_path` VARCHAR(255) NULLABLE;
ALTER TABLE `announcements` ADD COLUMN `gallery_images` JSON NULLABLE;
```

#### UI Implementation

```tsx
// AnnouncementForm.tsx
<ImageUpload
  label="Featured Image"
  name="featured_image"
  accept="image/*"
  maxSize={5 * 1024 * 1024}
  preview
/>

<MultiImageUpload
  label="Gallery Images (Optional)"
  name="gallery_images"
  maxFiles={5}
  accept="image/*"
/>

// AnnouncementCard.tsx
<Card>
  {announcement.featured_image_path && (
    <CardImage src={announcement.featured_image_path} alt={announcement.title} />
  )}
  <CardContent>
    <h3>{announcement.title}</h3>
    <p>{announcement.excerpt}</p>
    {announcement.gallery_images?.length > 0 && (
      <ImageGallery images={announcement.gallery_images} />
    )}
  </CardContent>
</Card>
```

---

## 16. Dashboard Improvements

### Move Job Postings and Announcements to Dashboard

#### Dashboard Layout

```tsx
// Dashboard.tsx
<div className="dashboard-grid">
  {/* Main Content */}
  <div className="main-content">
    {/* Statistics Cards */}
    <StatsSection />
    
    {/* Job Postings Preview */}
    <Card>
      <CardHeader>
        <CardTitle>Latest Job Postings</CardTitle>
        <Link href="/jobs">View All</Link>
      </CardHeader>
      <CardContent>
        <JobPostingsPreview limit={3} />
      </CardContent>
    </Card>
    
    {/* Announcements Preview */}
    <Card>
      <CardHeader>
        <CardTitle>Announcements</CardTitle>
        <Link href="/announcements">View All</Link>
      </CardHeader>
      <CardContent>
        <AnnouncementsPreview limit={3} />
      </CardContent>
    </Card>
  </div>
  
  {/* Sidebar */}
  <div className="sidebar">
    <QuickActions />
    <UpcomingEvents />
  </div>
</div>
```

---

## 17. QR Scanner Integration

### Clearance Validation System

**Purpose:** Validate if graduating students have completed survey/registration

#### Database Schema

```sql
CREATE TABLE `clearance_records` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `student_id` VARCHAR(20) NOT NULL,
    `clearance_type` ENUM('placement_office', 'alumni_registration', 'exit_survey') NOT NULL,
    `status` ENUM('pending', 'cleared', 'incomplete') DEFAULT 'pending',
    `qr_code` VARCHAR(255) UNIQUE NOT NULL,
    `scanned_by` BIGINT UNSIGNED NULLABLE,
    `scanned_at` TIMESTAMP NULLABLE,
    `academic_year` VARCHAR(10) NOT NULL,
    `created_at` TIMESTAMP,
    `updated_at` TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
    FOREIGN KEY (`scanned_by`) REFERENCES `users`(`id`)
);
```

#### QR Code Generation

```php
// app/Services/QRCodeService.php
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class QRCodeService
{
    public function generateClearanceQR(User $user): string
    {
        $clearanceData = [
            'student_id' => $user->student_id,
            'type' => 'alumni_clearance',
            'hash' => hash('sha256', $user->id . $user->student_id . config('app.key')),
        ];
        
        $qrContent = json_encode($clearanceData);
        
        return QrCode::size(300)
            ->format('png')
            ->generate($qrContent);
    }
}
```

#### Scanner Interface

```tsx
// QRScanner.tsx
import { Html5Qrcode } from 'html5-qrcode';

const QRScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [clearanceStatus, setClearanceStatus] = useState(null);
  
  const onScanSuccess = async (decodedText) => {
    const data = JSON.parse(decodedText);
    
    // Verify and check clearance status
    const response = await axios.post('/api/clearance/verify', {
      student_id: data.student_id,
      hash: data.hash,
    });
    
    setClearanceStatus(response.data);
  };
  
  return (
    <div>
      <div id="qr-reader" />
      {clearanceStatus && (
        <ClearanceStatusCard status={clearanceStatus} />
      )}
    </div>
  );
};
```

#### Clearance Requirements

```php
class ClearanceService
{
    public function checkClearanceStatus(User $user): ClearanceStatus
    {
        $requirements = [
            'profile_complete' => $user->isProfileComplete(),
            'survey_answered' => $user->hasAnsweredExitSurvey(),
            'employment_updated' => $user->hasEmploymentRecord(),
        ];
        
        $isCleared = !in_array(false, $requirements);
        
        return new ClearanceStatus([
            'student_id' => $user->student_id,
            'name' => $user->full_name,
            'is_cleared' => $isCleared,
            'requirements' => $requirements,
            'missing' => array_keys(array_filter($requirements, fn($v) => !$v)),
        ]);
    }
}
```

---

## 18. Employment Record Versioning

### Remove Delete, Implement Archive System

**Principle:** No permanent deletion, all changes tracked with version history

#### Database Schema

```sql
CREATE TABLE `employment_record_versions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `employment_record_id` BIGINT UNSIGNED NOT NULL,
    `version_number` INT NOT NULL,
    `data` JSON NOT NULL, -- Snapshot of record at this version
    `changed_fields` JSON NULLABLE,
    `change_reason` TEXT NULLABLE,
    `changed_by` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP,
    FOREIGN KEY (`employment_record_id`) REFERENCES `employment_records`(`id`),
    FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`)
);

ALTER TABLE `employment_records` ADD COLUMN `is_archived` BOOLEAN DEFAULT FALSE;
ALTER TABLE `employment_records` ADD COLUMN `archived_at` TIMESTAMP NULLABLE;
ALTER TABLE `employment_records` ADD COLUMN `archived_reason` TEXT NULLABLE;
ALTER TABLE `employment_records` ADD COLUMN `current_version` INT DEFAULT 1;
```

#### Version Service

```php
// app/Services/EmploymentVersioningService.php
class EmploymentVersioningService
{
    public function createVersion(EmploymentRecord $record, array $changes, string $reason = null): void
    {
        // Get changed fields
        $changedFields = array_keys($changes);
        
        // Create version snapshot
        EmploymentRecordVersion::create([
            'employment_record_id' => $record->id,
            'version_number' => $record->current_version,
            'data' => $record->toArray(),
            'changed_fields' => $changedFields,
            'change_reason' => $reason,
            'changed_by' => auth()->id(),
        ]);
        
        // Update record with new data
        $record->update(array_merge($changes, [
            'current_version' => $record->current_version + 1,
        ]));
    }
    
    public function archive(EmploymentRecord $record, string $reason): void
    {
        $this->createVersion($record, ['is_archived' => true], $reason);
        
        $record->update([
            'is_archived' => true,
            'archived_at' => now(),
            'archived_reason' => $reason,
        ]);
    }
    
    public function getVersionHistory(EmploymentRecord $record): Collection
    {
        return $record->versions()->orderBy('version_number', 'desc')->get();
    }
    
    public function restoreVersion(EmploymentRecord $record, int $versionNumber): void
    {
        $version = $record->versions()->where('version_number', $versionNumber)->firstOrFail();
        
        $this->createVersion($record, $version->data, "Restored to version {$versionNumber}");
    }
}
```

#### UI Implementation

```tsx
// EmploymentHistory.tsx
const EmploymentRecordCard = ({ record }) => {
  const [showVersions, setShowVersions] = useState(false);
  
  return (
    <Card>
      <CardContent>
        <JobDetails record={record} />
        
        <div className="actions">
          {/* No delete button - only edit and archive */}
          <Button onClick={() => openEditModal(record)}>
            <Edit className="h-4 w-4" /> Edit
          </Button>
          <Button variant="outline" onClick={() => setShowVersions(true)}>
            <History className="h-4 w-4" /> Version History
          </Button>
          <Button variant="destructive" onClick={() => openArchiveDialog(record)}>
            <Archive className="h-4 w-4" /> Archive
          </Button>
        </div>
      </CardContent>
      
      {showVersions && (
        <VersionHistoryModal 
          record={record} 
          onClose={() => setShowVersions(false)}
        />
      )}
    </Card>
  );
};

// VersionHistoryModal.tsx
const VersionHistoryModal = ({ record, onClose }) => {
  const { data: versions } = useQuery(['versions', record.id], 
    () => fetchVersions(record.id)
  );
  
  return (
    <Modal open onClose={onClose}>
      <ModalHeader>Version History</ModalHeader>
      <ModalContent>
        <Timeline>
          {versions?.map((version) => (
            <TimelineItem key={version.id}>
              <TimelineHeader>
                Version {version.version_number} - {formatDate(version.created_at)}
              </TimelineHeader>
              <TimelineContent>
                <p>Changed: {version.changed_fields.join(', ')}</p>
                {version.change_reason && (
                  <p>Reason: {version.change_reason}</p>
                )}
                <Button size="sm" onClick={() => viewVersion(version)}>
                  View Details
                </Button>
                <Button size="sm" variant="outline" onClick={() => restoreVersion(version)}>
                  Restore This Version
                </Button>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </ModalContent>
    </Modal>
  );
};
```

---

## 19. DOLE & CHED Compliance

### Different Tracking Requirements

#### DOLE Requirements

**Focus:** First job tracking

```php
class DOLEReportService
{
    public function generateFirstJobReport(int $graduationYear): DOLEReport
    {
        $alumni = Alumni::whereYear('graduation_year', $graduationYear)->get();
        
        $reportData = $alumni->map(function ($alumnus) {
            $firstJob = $alumnus->employmentHistory()
                ->orderBy('start_date', 'asc')
                ->first();
            
            return [
                'student_id' => $alumnus->student_id,
                'name' => $alumnus->full_name,
                'course' => $alumnus->course,
                'graduation_date' => $alumnus->graduation_date,
                'first_job_title' => $firstJob?->job_title,
                'first_job_company' => $firstJob?->company_name,
                'first_job_start_date' => $firstJob?->start_date,
                'time_to_first_job' => $this->calculateTimeToFirstJob($alumnus, $firstJob),
                'is_course_related' => $firstJob?->is_course_aligned,
            ];
        });
        
        return new DOLEReport($reportData);
    }
}
```

#### CHED Requirements

**Focus:** Comprehensive tracking

```php
class CHEDReportService
{
    public function generateTracerStudyReport(int $graduationYear): CHEDReport
    {
        return new CHEDReport([
            // Employment Status
            'employment_status' => $this->getEmploymentStatusBreakdown($graduationYear),
            
            // Course Relevance
            'course_relevance' => $this->getCourseRelevanceData($graduationYear),
            
            // Employer Feedback (if available)
            'employer_feedback' => $this->getEmployerFeedback($graduationYear),
            
            // Skills Utilization
            'skills_utilization' => $this->getSkillsUtilization($graduationYear),
            
            // Salary Range
            'salary_distribution' => $this->getSalaryDistribution($graduationYear),
            
            // Time to Employment
            'time_to_employment' => $this->getTimeToEmployment($graduationYear),
            
            // Further Studies
            'further_studies' => $this->getFurtherStudiesData($graduationYear),
            
            // Reasons for Unemployment
            'unemployment_reasons' => $this->getUnemploymentReasons($graduationYear),
        ]);
    }
}
```

---

## Implementation Priority Matrix

| Feature | Priority | Complexity | Dependencies |
|---------|----------|------------|--------------|
| Data Privacy Agreement | Critical | Low | None |
| Campus Management (Cavite) | High | Low | None |
| Email Template Updates | High | Low | None |
| Maiden Name/Marital Fields | High | Medium | Profile System |
| Data Migration | Critical | High | CSV Format Spec |
| Employment Status Enhancements | High | Medium | Employment Records |
| Academic Timeline Tracking | Medium | Medium | Profile System |
| Employment Versioning | High | High | Employment Records |
| QR Scanner | Medium | High | Clearance System |
| Job Board Enhancements | Medium | Medium | Job System |
| Reporting System | High | High | All Data Sources |
| Customer Support | Medium | Medium | User System |
| Analytics Dashboard | Medium | High | All Data Sources |

---

## CSV Import Format Specification

> **IMPORTANT: Awaiting CSV format from user**  
> **Status: Pending** - Please provide the CSV file format from the existing Pinnacle tracer system for data migration.

### Placeholder Structure

The following is a proposed structure. **Please provide the actual CSV format:**

```csv
# Expected CSV headers (to be confirmed)
student_id,last_name,first_name,middle_name,suffix,email,contact_number,address,course_code,course_name,campus,enrollment_year,graduation_year,employment_status,employer_name,job_title,job_start_date
```

### Required Information

Please provide:
1. **Sample CSV file** from Pinnacle system (with dummy/anonymized data)
2. **Column headers** and their meanings
3. **Data formats** (date formats, encoding, etc.)
4. **Expected data volume** (number of records)
5. **Special considerations** (null values, data inconsistencies, etc.)

### Import Validation Rules

1. **Required Fields:** student_id, last_name, first_name, graduation_year
2. **Unique Constraints:** student_id must be unique
3. **Date Formats:** YYYY-MM-DD or YYYY
4. **Email Validation:** Valid email format if provided
5. **Campus Codes:** Must match existing campus codes

---

## Next Steps

1. **Confirm CSV format** for data migration
2. **Prioritize features** based on immediate needs
3. **Create detailed technical specifications** for each feature
4. **Develop database migrations** in sequence
5. **Implement and test** feature by feature
6. **Document API endpoints** for each new feature
7. **Update user guides** and admin manuals

---

## Notes

- All features should maintain backward compatibility
- Implement proper audit logging for sensitive operations
- Ensure GDPR/Data Privacy compliance throughout
- Mobile responsiveness required for all new UI components
- Performance optimization for large data imports

---

*Document maintained by: Development Team*  
*For questions or clarifications, contact the project lead.*
