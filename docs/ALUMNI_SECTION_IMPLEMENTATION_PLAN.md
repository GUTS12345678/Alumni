# Alumni Section - Implementation Plan

**Date:** October 8, 2025  
**Project:** Alumni Tracer System  
**Section:** Alumni Portal (Frontend Pages)

## 📋 Current Page Status

### ✅ Fully Functional (3 pages)
1. **Dashboard** (`Dashboard.tsx`) - ✅ Working
2. **Settings** (`Settings.tsx`) - ✅ Working  
3. **Help** (`Help.tsx`) - ✅ Working (FAQ system)

### 🚧 Placeholder/Coming Soon (12 pages)
1. **Profile View** (`Profile/View.tsx`) - 📊 Coming Soon
2. **Profile Edit** (`Profile/Edit.tsx`) - ✏️ Coming Soon
3. **Career Timeline** (`Career/Timeline.tsx`) - 📈 Coming Soon
4. **Education History** (`Education/History.tsx`) - 🎓 Coming Soon
5. **My Surveys** (`Surveys/MySurveys.tsx`) - 📋 Coming Soon
6. **Survey History** (`Surveys/SurveyHistory.tsx`) - 📜 Coming Soon
7. **Alumni Directory** (`Network/AlumniDirectory.tsx`) - 👥 Coming Soon
8. **My Connections** (`Network/MyConnections.tsx`) - 🤝 Coming Soon
9. **Messages** (`Network/Messages.tsx`) - 💬 Coming Soon
10. **Jobs Board** (`Jobs.tsx`) - 💼 Partial (search UI only)
11. **Mentorship** (`Mentorship.tsx`) - 🎯 Placeholder
12. **Documents** (`Documents.tsx`) - 📄 Placeholder
13. **Certificates** (`Certificates.tsx`) - 🏆 Placeholder
14. **Survey Registration** (`SurveyRegistration.tsx`) - 📝 Placeholder

---

## 📂 Complete Page Inventory

### 1. **Dashboard** ✅
**File:** `resources/js/pages/Alumni/Dashboard.tsx`  
**Status:** Fully functional  
**Features:**
- Profile summary card
- Quick stats (graduation year, employment status)
- Profile completion indicator
- Survey completion status
- Quick action buttons

**Current Implementation:**
- Fetches alumni profile from `/api/v1/alumni/profile`
- Displays personal info (name, email, phone, address)
- Shows employment status with color coding
- Profile completion percentage
- Quick links to profile edit, surveys, settings

**API Endpoints Used:**
- `GET /api/v1/alumni/profile` ✅

---

### 2. **Profile View** 🚧
**File:** `resources/js/pages/Alumni/Profile/View.tsx`  
**Status:** Placeholder ("Coming Soon")  
**Proposed Features:**
- Complete profile overview (read-only)
- Personal information section
- Academic information section
- Employment history
- Skills and certifications
- Career goals
- Contact information
- Profile visibility settings

**Required API Endpoints:**
- `GET /api/v1/alumni/profile` (already exists)
- Needs enhancement to return full profile data

**Database Fields (from `alumni_profiles` table):**
- Personal: first_name, last_name, birth_date, gender, phone
- Address: current_address, city, state_province, postal_code, country
- Academic: degree_program, major, minor, gpa, graduation_year
- Employment: current_job_title, current_employer, company_industry
- Additional: skills (JSON), certifications (JSON), career_goals

---

### 3. **Profile Edit** 🚧
**File:** `resources/js/pages/Alumni/Profile/Edit.tsx`  
**Status:** Placeholder ("Coming Soon")  
**Proposed Features:**
- Editable form for all profile fields
- Multi-step form (Personal → Academic → Employment → Additional)
- Image upload for profile picture
- Validation and error handling
- Save progress functionality
- Profile completion tracking

**Required API Endpoints:**
- `GET /api/v1/alumni/profile` ✅ (to load current data)
- `PUT /api/v1/alumni/profile` ❌ (needs creation)
- `POST /api/v1/alumni/profile/upload-photo` ❌ (optional)

**Form Sections:**
1. Personal Information (name, birth_date, gender, phone)
2. Address (current_address, city, state, postal_code, country)
3. Academic Information (degree_program, major, gpa, graduation_year)
4. Employment Information (job_title, employer, industry, salary)
5. Additional Information (skills, certifications, career_goals)

---

### 4. **Career Timeline** 🚧
**File:** `resources/js/pages/Alumni/Career/Timeline.tsx`  
**Status:** Placeholder  
**Proposed Features:**
- Visual timeline of career progression
- Add/edit/delete employment records
- Current position highlighted
- Date ranges for each position
- Company logos (optional)
- Export career timeline as PDF
- Employment gap detection

**Database Table:** `employments` (already exists)
**Fields:**
- alumni_profile_id, job_title, company_name, company_industry
- start_date, end_date, is_current
- job_description, location, employment_type

**Required API Endpoints:**
- `GET /api/v1/alumni/employments` ❌
- `POST /api/v1/alumni/employments` ❌
- `PUT /api/v1/alumni/employments/{id}` ❌
- `DELETE /api/v1/alumni/employments/{id}` ❌

**UI Components:**
- Vertical timeline with cards
- Add new position button
- Edit/Delete actions per position
- Modal for add/edit forms
- Date picker for start/end dates

---

### 5. **Education History** 🚧
**File:** `resources/js/pages/Alumni/Education/History.tsx`  
**Status:** Placeholder  
**Proposed Features:**
- List of all educational qualifications
- Primary degree (from alumni_profiles)
- Additional degrees/certifications
- Add/edit/delete education records
- Document uploads (transcripts, certificates)
- GPA and honors display

**Database Table:** `educations` (needs creation)
**Proposed Fields:**
```sql
CREATE TABLE educations (
    id BIGINT PRIMARY KEY,
    alumni_profile_id BIGINT,
    institution_name VARCHAR(255),
    degree_level ENUM('high_school', 'associate', 'bachelor', 'master', 'phd', 'certificate'),
    field_of_study VARCHAR(255),
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN,
    gpa DECIMAL(3,2),
    honors VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Required API Endpoints:**
- `GET /api/v1/alumni/educations` ❌
- `POST /api/v1/alumni/educations` ❌
- `PUT /api/v1/alumni/educations/{id}` ❌
- `DELETE /api/v1/alumni/educations/{id}` ❌

---

### 6. **My Surveys** 🚧
**File:** `resources/js/pages/Alumni/Surveys/MySurveys.tsx`  
**Status:** Placeholder ("Coming Soon")  
**Proposed Features:**
- List of surveys assigned to this alumni
- Survey status (not_started, in_progress, completed)
- Due dates and reminders
- Start/Resume survey button
- Survey descriptions and estimated time
- Filter by status (active, completed, expired)

**Database Tables:**
- `surveys` ✅ (already exists)
- `survey_responses` ✅ (already exists)
- `survey_batches` ✅ (already exists)

**Required API Endpoints:**
- `GET /api/v1/alumni/surveys` ❌ (list surveys assigned to me)
- `GET /api/v1/alumni/surveys/{id}` ❌ (get survey details)
- `POST /api/v1/alumni/surveys/{id}/start` ❌ (start survey)

**UI Components:**
- Survey card with title, description, due date
- Status badges (Active, In Progress, Completed)
- Progress indicator for started surveys
- "Take Survey" / "Resume Survey" buttons

---

### 7. **Survey History** 🚧
**File:** `resources/js/pages/Alumni/Surveys/SurveyHistory.tsx`  
**Status:** Placeholder  
**Proposed Features:**
- List of all completed surveys
- Submission dates and timestamps
- View past responses (read-only)
- Download responses as PDF
- Statistics (total surveys completed, completion rate)

**Required API Endpoints:**
- `GET /api/v1/alumni/surveys/history` ❌
- `GET /api/v1/alumni/surveys/{id}/responses` ❌ (view my responses)
- `GET /api/v1/alumni/surveys/{id}/download` ❌ (download PDF)

---

### 8. **Alumni Directory** 🚧
**File:** `resources/js/pages/Alumni/Network/AlumniDirectory.tsx`  
**Status:** Placeholder ("Coming Soon")  
**Proposed Features:**
- Searchable directory of all alumni
- Filter by graduation year, program, location, company
- Alumni cards with photo, name, position, company
- Connect button (send connection request)
- Privacy settings (who can see my profile)
- Export directory as CSV (for admins)

**Required API Endpoints:**
- `GET /api/v1/alumni/directory` ❌ (public alumni profiles)
- `POST /api/v1/alumni/connections/request` ❌ (send connection request)

**Privacy Considerations:**
- Alumni can set profile visibility (public, alumni_only, connections_only, private)
- Email/phone hidden by default
- Option to opt-out of directory

---

### 9. **My Connections** 🚧
**File:** `resources/js/pages/Alumni/Network/MyConnections.tsx`  
**Status:** Placeholder  
**Proposed Features:**
- List of connected alumni
- Connection requests (sent and received)
- Accept/Decline connection requests
- Remove connection option
- Search within connections
- Message connection button

**Database Table:** `alumni_connections` (needs creation)
**Proposed Fields:**
```sql
CREATE TABLE alumni_connections (
    id BIGINT PRIMARY KEY,
    requester_id BIGINT, -- alumni_profile_id who sent request
    receiver_id BIGINT,  -- alumni_profile_id who received request
    status ENUM('pending', 'accepted', 'declined', 'blocked'),
    connected_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Required API Endpoints:**
- `GET /api/v1/alumni/connections` ❌ (my connections)
- `GET /api/v1/alumni/connections/requests` ❌ (pending requests)
- `POST /api/v1/alumni/connections/{id}/accept` ❌
- `POST /api/v1/alumni/connections/{id}/decline` ❌
- `DELETE /api/v1/alumni/connections/{id}` ❌ (remove connection)

---

### 10. **Messages** 🚧
**File:** `resources/js/pages/Alumni/Network/Messages.tsx`  
**Status:** Placeholder  
**Proposed Features:**
- Inbox/Outbox messaging system
- Send messages to connections
- Message threads with conversation history
- Mark as read/unread
- Delete messages
- Real-time notifications (optional)

**Database Table:** `alumni_messages` (needs creation)
**Proposed Fields:**
```sql
CREATE TABLE alumni_messages (
    id BIGINT PRIMARY KEY,
    sender_id BIGINT,
    receiver_id BIGINT,
    subject VARCHAR(255),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    parent_message_id BIGINT, -- for threading
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Required API Endpoints:**
- `GET /api/v1/alumni/messages` ❌ (inbox)
- `GET /api/v1/alumni/messages/sent` ❌ (outbox)
- `POST /api/v1/alumni/messages` ❌ (send message)
- `PUT /api/v1/alumni/messages/{id}/read` ❌ (mark as read)
- `DELETE /api/v1/alumni/messages/{id}` ❌

---

### 11. **Jobs Board** 🚧
**File:** `resources/js/pages/Alumni/Jobs.tsx`  
**Status:** Partial (UI only, no data)  
**Proposed Features:**
- Job postings from companies or alumni
- Search and filter (location, industry, job_type)
- Job details page
- Apply button (external link)
- Save/Bookmark jobs
- Post a job (for employed alumni)

**Database Table:** `job_postings` (needs creation)
**Proposed Fields:**
```sql
CREATE TABLE job_postings (
    id BIGINT PRIMARY KEY,
    posted_by BIGINT, -- alumni_profile_id or null (external)
    company_name VARCHAR(255),
    job_title VARCHAR(255),
    job_description TEXT,
    requirements TEXT,
    location VARCHAR(255),
    job_type ENUM('full_time', 'part_time', 'contract', 'internship'),
    salary_range VARCHAR(100),
    application_url VARCHAR(500),
    application_deadline DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Required API Endpoints:**
- `GET /api/v1/alumni/jobs` ❌ (list active jobs)
- `POST /api/v1/alumni/jobs` ❌ (post a job)
- `GET /api/v1/alumni/jobs/{id}` ❌ (job details)
- `POST /api/v1/alumni/jobs/{id}/save` ❌ (bookmark job)

---

### 12. **Mentorship** 🚧
**File:** `resources/js/pages/Alumni/Mentorship.tsx`  
**Status:** Placeholder  
**Proposed Features:**
- Find mentors (experienced alumni)
- Become a mentor (offer to mentor)
- Mentorship requests and matching
- Active mentorship relationships
- Schedule mentorship sessions
- Rate and review mentors

**Database Table:** `mentorships` (needs creation)
**Proposed Fields:**
```sql
CREATE TABLE mentorships (
    id BIGINT PRIMARY KEY,
    mentor_id BIGINT, -- alumni_profile_id
    mentee_id BIGINT, -- alumni_profile_id
    status ENUM('pending', 'active', 'completed', 'cancelled'),
    expertise_area VARCHAR(255),
    start_date DATE,
    end_date DATE,
    notes TEXT,
    rating INT, -- 1-5 stars
    review TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Required API Endpoints:**
- `GET /api/v1/alumni/mentors` ❌ (find mentors)
- `POST /api/v1/alumni/mentorship/request` ❌ (request mentorship)
- `GET /api/v1/alumni/mentorship/my-mentees` ❌ (my mentees)
- `GET /api/v1/alumni/mentorship/my-mentors` ❌ (my mentors)

---

### 13. **Documents** 🚧
**File:** `resources/js/pages/Alumni/Documents.tsx`  
**Status:** Placeholder  
**Proposed Features:**
- Upload and manage documents (resume, transcripts, certificates)
- Document categories (Academic, Professional, Personal)
- Download documents
- Share documents with admin (for verification)
- Document expiration dates (for certifications)

**Database Table:** `alumni_documents` (needs creation)
**Proposed Fields:**
```sql
CREATE TABLE alumni_documents (
    id BIGINT PRIMARY KEY,
    alumni_profile_id BIGINT,
    document_name VARCHAR(255),
    document_type ENUM('resume', 'transcript', 'certificate', 'other'),
    file_path VARCHAR(500),
    file_size INT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP,
    expires_at DATE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Required API Endpoints:**
- `GET /api/v1/alumni/documents` ❌
- `POST /api/v1/alumni/documents/upload` ❌
- `GET /api/v1/alumni/documents/{id}/download` ❌
- `DELETE /api/v1/alumni/documents/{id}` ❌

---

### 14. **Certificates** 🚧
**File:** `resources/js/pages/Alumni/Certificates.tsx`  
**Status:** Placeholder  
**Proposed Features:**
- Generate and download alumni certificates
- Certificate of good standing
- Employment verification letter
- Request custom certificates from admin
- View past generated certificates

**Database Table:** `generated_certificates` (needs creation)
**Proposed Fields:**
```sql
CREATE TABLE generated_certificates (
    id BIGINT PRIMARY KEY,
    alumni_profile_id BIGINT,
    certificate_type VARCHAR(100),
    purpose TEXT,
    generated_at TIMESTAMP,
    file_path VARCHAR(500),
    verification_code VARCHAR(50) UNIQUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Required API Endpoints:**
- `GET /api/v1/alumni/certificates` ❌ (list my certificates)
- `POST /api/v1/alumni/certificates/request` ❌ (request new)
- `GET /api/v1/alumni/certificates/{id}/download` ❌

---

### 15. **Settings** ✅
**File:** `resources/js/pages/Alumni/Settings.tsx`  
**Status:** Fully functional  
**Features:**
- Account settings
- Password change
- Email preferences
- Privacy settings
- Notification preferences

---

### 16. **Help** ✅
**File:** `resources/js/pages/Alumni/Help.tsx`  
**Status:** Fully functional  
**Features:**
- FAQ section
- Contact support form
- Help topics
- System status

---

### 17. **Survey Registration** 🚧
**File:** `resources/js/pages/Alumni/SurveyRegistration.tsx`  
**Status:** Placeholder  
**Purpose:** Likely handles initial survey registration/invitation flow

---

## 🎯 Implementation Priority

### Phase 1: Core Profile Features (Week 1-2)
**Priority: HIGH**
1. **Profile View** - Essential for alumni to see their info
2. **Profile Edit** - Allow alumni to update their information
3. **Career Timeline** - Track employment history

**Estimated Time:** 10-12 days  
**Dependencies:** Profile API endpoints

---

### Phase 2: Survey System (Week 3)
**Priority: HIGH**
4. **My Surveys** - View and take assigned surveys
5. **Survey History** - View past survey responses

**Estimated Time:** 5-7 days  
**Dependencies:** Survey API endpoints, Survey taking flow

---

### Phase 3: Networking Features (Week 4-5)
**Priority: MEDIUM**
6. **Alumni Directory** - Search and connect with alumni
7. **My Connections** - Manage connections
8. **Messages** - Simple messaging system

**Estimated Time:** 10-14 days  
**Dependencies:** Connections database table, Messages database table

---

### Phase 4: Career & Job Features (Week 6)
**Priority: MEDIUM**
9. **Jobs Board** - Job postings functionality
10. **Education History** - Academic records

**Estimated Time:** 7-10 days  
**Dependencies:** Job postings table, Educations table

---

### Phase 5: Advanced Features (Week 7-8)
**Priority: LOW**
11. **Mentorship** - Mentorship program
12. **Documents** - Document management
13. **Certificates** - Certificate generation

**Estimated Time:** 10-14 days  
**Dependencies:** Multiple new database tables

---

## 📊 Technical Requirements Summary

### Database Tables to Create:
1. ✅ `alumni_profiles` - Already exists
2. ✅ `employments` - Already exists
3. ❌ `educations` - Needs creation
4. ❌ `alumni_connections` - Needs creation
5. ❌ `alumni_messages` - Needs creation
6. ❌ `job_postings` - Needs creation
7. ❌ `mentorships` - Needs creation
8. ❌ `alumni_documents` - Needs creation
9. ❌ `generated_certificates` - Needs creation
10. ❌ `job_applications` - Optional (track applications)
11. ❌ `mentorship_sessions` - Optional (track sessions)

### API Endpoints Needed: 40+
- Profile: 3 endpoints
- Career Timeline: 4 endpoints
- Education: 4 endpoints
- Surveys: 5 endpoints
- Directory/Connections: 6 endpoints
- Messages: 5 endpoints
- Jobs: 5 endpoints
- Mentorship: 5 endpoints
- Documents: 4 endpoints
- Certificates: 3 endpoints

---

## 🚀 Next Steps

**Choose one of these paths:**

### Option A: Start with Profile (Recommended)
"Let's implement Profile View and Profile Edit first"
- Most fundamental feature
- Alumni can view and update their info
- Foundation for other features

### Option B: Start with Surveys
"Let's implement My Surveys and Survey History"
- High priority for data collection
- Uses existing survey system
- Less complex than profile

### Option C: Start with Networking
"Let's implement Alumni Directory and Connections"
- High engagement feature
- Builds community
- Requires new database tables

---

## 📝 Which Page Should We Start With?

Please choose:
1. **Profile View + Edit** (Core functionality)
2. **My Surveys + History** (Data collection)
3. **Career Timeline + Education** (Career tracking)
4. **Alumni Directory + Connections** (Networking)
5. **Jobs Board** (Job opportunities)
6. **Other** (Specify which page)

---

**Ready to implement! Just tell me which page/feature you'd like to tackle first, and I'll create the complete implementation with:**
- Database migrations (if needed)
- API endpoints (backend)
- React components (frontend)
- Full CRUD functionality
- Testing guide
