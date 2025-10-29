# Alumni Surveys Section - Testing Guide

## Overview
Comprehensive testing guide for the Alumni Surveys section implementation, including backend API tests, frontend component tests, and integration testing scenarios.

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Related Documentation:** ALUMNI_SURVEYS_IMPLEMENTATION.md

---

## Table of Contents
1. [Backend API Testing](#backend-api-testing)
2. [Frontend Component Testing](#frontend-component-testing)
3. [Integration Testing](#integration-testing)
4. [User Acceptance Testing](#user-acceptance-testing)
5. [Performance Testing](#performance-testing)
6. [Security Testing](#security-testing)

---

## Backend API Testing

### 1. Test GET `/api/v1/my-surveys`

#### Test Case 1.1: Successful Survey Retrieval (Authenticated User)
**Purpose:** Verify that authenticated alumni can fetch their available surveys

**Prerequisites:**
- User must be logged in with alumni role
- At least one active survey exists in database
- User has valid session token

**Test Steps:**
1. Login as alumni user
2. Send GET request to `/api/v1/my-surveys`
3. Include credentials and authentication headers

**Expected Response:**
```json
{
  "success": true,
  "message": "Surveys retrieved successfully",
  "data": {
    "surveys": [
      {
        "id": number,
        "title": string,
        "description": string,
        "type": string,
        "is_anonymous": boolean,
        "is_registration_survey": boolean,
        "start_date": "YYYY-MM-DD",
        "end_date": "YYYY-MM-DD",
        "estimated_time": number,
        "total_questions": number,
        "status": "not_started" | "in_progress" | "completed",
        "response_token": string | null,
        "completed_at": string | null,
        "progress": number,
        "can_retake": boolean
      }
    ],
    "stats": {
      "total": number,
      "not_started": number,
      "in_progress": number,
      "completed": number
    }
  }
}
```

**Status Code:** 200 OK

**Validation Points:**
- ✅ Response has `success: true`
- ✅ Surveys array exists and is array type
- ✅ Each survey has required fields
- ✅ Stats object has all four counters
- ✅ Stats counts match survey array counts
- ✅ Survey status is one of: not_started, in_progress, completed
- ✅ Progress is between 0-100 for in_progress surveys

---

#### Test Case 1.2: Batch Filtering
**Purpose:** Verify surveys are filtered by user's batch

**Prerequisites:**
- User is alumni with assigned batch_id
- Surveys exist with target_batch_id matching user's batch
- Surveys exist without target_batch_id (general surveys)
- Surveys exist with different target_batch_id

**Test Steps:**
1. Login as alumni with batch_id = 5
2. Send GET request to `/api/v1/my-surveys`

**Expected Result:**
- Response includes surveys with `target_batch_id = 5`
- Response includes surveys with `target_batch_id = NULL`
- Response DOES NOT include surveys with other `target_batch_id` values

**Validation Points:**
- ✅ All returned surveys match batch criteria
- ✅ No surveys from other batches are returned

---

#### Test Case 1.3: Survey Status Calculation
**Purpose:** Verify correct status determination based on responses

**Test Scenario A - Not Started:**
- User has NO survey_response record for survey
- Expected status: `not_started`
- Expected response_token: `null`
- Expected progress: `0`

**Test Scenario B - In Progress:**
- User has survey_response record with `status = 'draft'`
- Expected status: `in_progress`
- Expected response_token: valid token string
- Expected progress: calculated percentage (e.g., 40 if 10/25 questions answered)

**Test Scenario C - Completed:**
- User has survey_response record with `status = 'completed'`
- Expected status: `completed`
- Expected response_token: valid token string
- Expected progress: `100`
- Expected completed_at: timestamp

**Validation Points:**
- ✅ Status reflects actual database state
- ✅ Progress calculation is accurate
- ✅ Response token is provided for started surveys

---

#### Test Case 1.4: Unauthenticated Request
**Purpose:** Verify authentication is enforced

**Test Steps:**
1. Send GET request to `/api/v1/my-surveys` WITHOUT authentication

**Expected Response:**
```json
{
  "message": "Unauthenticated."
}
```

**Status Code:** 401 Unauthorized

**Validation Points:**
- ✅ Request is rejected with 401
- ✅ No survey data is returned

---

### 2. Test GET `/api/v1/my-responses`

#### Test Case 2.1: Successful Response Retrieval
**Purpose:** Verify authenticated alumni can fetch their survey history

**Prerequisites:**
- User must be logged in with alumni role
- User has at least one survey response (completed or draft)

**Test Steps:**
1. Login as alumni user
2. Send GET request to `/api/v1/my-responses`

**Expected Response:**
```json
{
  "success": true,
  "message": "Survey responses retrieved successfully",
  "data": {
    "responses": [
      {
        "id": number,
        "response_token": string,
        "respondent_email": string,
        "status": "draft" | "completed",
        "started_at": "YYYY-MM-DD HH:mm:ss",
        "completed_at": "YYYY-MM-DD HH:mm:ss" | null,
        "time_taken_minutes": number | null,
        "survey": {
          "id": number,
          "title": string,
          "description": string,
          "type": string,
          "is_anonymous": boolean
        },
        "answers": [
          {
            "id": number,
            "survey_question_id": number,
            "question": {
              "id": number,
              "question_text": string,
              "question_type": string,
              "is_required": boolean,
              "order": number
            },
            "answer_text": string | null,
            "answer_value": number | null
          }
        ],
        "total_questions": number,
        "answered_questions": number,
        "completion_percentage": number
      }
    ],
    "stats": {
      "total": number,
      "completed": number,
      "draft": number
    }
  }
}
```

**Status Code:** 200 OK

**Validation Points:**
- ✅ Response has `success: true`
- ✅ Responses array exists
- ✅ Each response has survey details
- ✅ Each response has answers array
- ✅ Stats counts match response array
- ✅ Responses ordered by `completed_at DESC`

---

#### Test Case 2.2: Completion Percentage Calculation
**Purpose:** Verify correct completion percentage

**Test Scenario A - Fully Completed:**
- Survey has 25 questions
- User answered 25 questions
- Expected completion_percentage: `100`

**Test Scenario B - Partially Completed:**
- Survey has 25 questions
- User answered 10 questions
- Expected completion_percentage: `40`

**Test Scenario C - No Answers:**
- Survey has 25 questions
- User answered 0 questions
- Expected completion_percentage: `0`

**Validation Points:**
- ✅ Calculation: `(answered_questions / total_questions) * 100`
- ✅ Percentage is rounded correctly

---

#### Test Case 2.3: Time Taken Calculation
**Purpose:** Verify correct time duration calculation

**Test Data:**
- started_at: `2024-01-15 10:00:00`
- completed_at: `2024-01-15 10:25:00`
- Expected time_taken_minutes: `25`

**Validation Points:**
- ✅ Time is calculated in minutes
- ✅ Null if not completed

---

#### Test Case 2.4: Empty History
**Purpose:** Verify response when user has no survey history

**Test Steps:**
1. Login as new alumni user with no responses
2. Send GET request to `/api/v1/my-responses`

**Expected Response:**
```json
{
  "success": true,
  "message": "Survey responses retrieved successfully",
  "data": {
    "responses": [],
    "stats": {
      "total": 0,
      "completed": 0,
      "draft": 0
    }
  }
}
```

**Validation Points:**
- ✅ Empty responses array returned
- ✅ All stats are zero
- ✅ No errors thrown

---

## Frontend Component Testing

### 1. MySurveys.tsx Component Tests

#### Test Case 3.1: Component Rendering
**Test:** Component mounts without errors

**Test Steps:**
1. Navigate to `/alumni/surveys`
2. Verify page loads

**Expected Behavior:**
- ✅ Page renders without console errors
- ✅ Loading spinner appears initially
- ✅ Stats cards display after data loads
- ✅ Filter tabs render correctly
- ✅ Survey cards render with data

---

#### Test Case 3.2: Loading State
**Test:** Loading indicator displays during API fetch

**Expected Behavior:**
- ✅ Spinner animation visible
- ✅ "Loading surveys..." text displayed
- ✅ Content hidden during loading

---

#### Test Case 3.3: Empty State
**Test:** Empty state displays when no surveys available

**Mock Response:**
```json
{
  "success": true,
  "data": {
    "surveys": [],
    "stats": { "total": 0, "not_started": 0, "in_progress": 0, "completed": 0 }
  }
}
```

**Expected Behavior:**
- ✅ FileText icon (h-16 w-16) displayed
- ✅ "No surveys found" heading
- ✅ Descriptive text shown
- ✅ No survey cards rendered

---

#### Test Case 3.4: Stats Cards Display
**Test:** Stats cards show correct counts

**Mock Data:**
- Total: 5
- Not Started: 2
- In Progress: 1
- Completed: 2

**Expected Behavior:**
- ✅ Total Surveys card shows "5"
- ✅ Not Started card shows "2"
- ✅ In Progress card shows "1"
- ✅ Completed card shows "2"
- ✅ Icons match card type (BarChart3, AlertCircle, Clock, CheckCircle)

---

#### Test Case 3.5: Filter Tabs Functionality
**Test:** Clicking filter tabs filters surveys correctly

**Test Steps:**
1. Click "Available" tab
2. Verify only not_started surveys shown
3. Click "In Progress" tab
4. Verify only in_progress surveys shown
5. Click "Completed" tab
6. Verify only completed surveys shown
7. Click "All" tab
8. Verify all surveys shown

**Expected Behavior:**
- ✅ Active tab has maroon background
- ✅ Inactive tabs have outline style
- ✅ Survey list updates correctly
- ✅ Counts in tab labels are accurate

---

#### Test Case 3.6: Survey Card Display
**Test:** Survey cards show all required information

**Expected Elements:**
- ✅ Survey title
- ✅ Survey description
- ✅ Status badge (Not Started/In Progress/Completed)
- ✅ Type badge (Registration/Feedback/Employment/Follow-up)
- ✅ Anonymous badge (if applicable)
- ✅ Question count icon and text
- ✅ Estimated time icon and text
- ✅ Due date (if applicable)
- ✅ Completed date (if applicable)
- ✅ Progress bar (for in-progress surveys)
- ✅ Action button (Start/Continue/View Responses)

---

#### Test Case 3.7: Progress Bar Display
**Test:** Progress bar shows correct percentage

**Mock Survey:**
```json
{
  "status": "in_progress",
  "progress": 60
}
```

**Expected Behavior:**
- ✅ Progress component rendered
- ✅ "Progress" label displayed
- ✅ "60%" text displayed
- ✅ Progress bar filled to 60%

---

#### Test Case 3.8: Action Buttons
**Test:** Correct button displayed based on survey status

**Status: not_started**
- ✅ "Start Survey" button displayed
- ✅ Button has PlayCircle icon
- ✅ Button has maroon background
- ✅ Clicking navigates to `/surveys/{id}`

**Status: in_progress**
- ✅ "Continue Survey" button displayed
- ✅ Button has PlayCircle icon
- ✅ Button has blue background
- ✅ Clicking navigates to `/surveys/{id}?response_token={token}`

**Status: completed**
- ✅ "View Responses" button displayed
- ✅ Button has FileText icon
- ✅ Clicking navigates to `/alumni/surveys/history`
- ✅ If can_retake: "Retake" button also displayed

---

#### Test Case 3.9: Error State
**Test:** Error displays when API fails

**Mock Error:** Network failure or 500 error

**Expected Behavior:**
- ✅ Red border card displayed
- ✅ XCircle icon shown
- ✅ Error message: "Failed to load surveys"
- ✅ No survey cards rendered

---

#### Test Case 3.10: Responsive Layout
**Test:** Layout adapts to different screen sizes

**Mobile (< 768px):**
- ✅ Stats cards: 1 column
- ✅ Survey info: 2 columns
- ✅ Buttons stack vertically

**Tablet (768px - 1024px):**
- ✅ Stats cards: 4 columns
- ✅ Survey info: 4 columns

**Desktop (> 1024px):**
- ✅ Full layout with spacing
- ✅ Hover effects on cards

---

### 2. SurveyHistory.tsx Component Tests

#### Test Case 4.1: Component Rendering
**Test:** Component mounts without errors

**Expected Behavior:**
- ✅ Page renders without errors
- ✅ Loading state displays initially
- ✅ Stats cards render after load
- ✅ Filter buttons render
- ✅ Response cards render with data

---

#### Test Case 4.2: Empty History State
**Test:** Empty state when no responses exist

**Expected Behavior:**
- ✅ History icon (h-16 w-16) displayed
- ✅ "No Survey History Yet" heading
- ✅ Descriptive text shown
- ✅ No response cards rendered

---

#### Test Case 4.3: Stats Cards Display
**Test:** Stats show correct counts

**Mock Data:**
- Total: 3
- Completed: 2
- Draft: 1

**Expected Behavior:**
- ✅ Total Responses card shows "3"
- ✅ Completed card shows "2"
- ✅ Drafts card shows "1"

---

#### Test Case 4.4: Filter Functionality
**Test:** Filter buttons work correctly

**Test Steps:**
1. Click "Completed" filter
2. Verify only completed responses shown
3. Click "Drafts" filter
4. Verify only draft responses shown
5. Click "All" filter
6. Verify all responses shown

**Expected Behavior:**
- ✅ Filters apply correctly
- ✅ Active filter has maroon background
- ✅ Response list updates

---

#### Test Case 4.5: Response Card Display
**Test:** Response cards show complete information

**Expected Elements:**
- ✅ Survey title
- ✅ Survey type badge
- ✅ Status badge (Completed/Draft)
- ✅ Answered questions count (e.g., "25/25 answered")
- ✅ Time taken (formatted as "25 min" or "1h 15m")
- ✅ Started date
- ✅ Completed date (if completed)
- ✅ Completion percentage bar (for drafts)
- ✅ Action buttons

---

#### Test Case 4.6: Time Duration Formatting
**Test:** Duration formats correctly

**Test Cases:**
- 25 minutes → "25 min"
- 90 minutes → "1h 30m"
- 120 minutes → "2h 0m"
- null → "N/A"

**Expected Behavior:**
- ✅ All formats display correctly

---

#### Test Case 4.7: View Details Modal
**Test:** Modal opens and displays response details

**Test Steps:**
1. Click "View Details" button
2. Verify modal opens
3. Check modal content

**Expected Modal Content:**
- ✅ Survey title
- ✅ Response token
- ✅ All questions with answers
- ✅ Required field indicators (*)
- ✅ Answer text or rating values
- ✅ "No answer provided" for unanswered questions
- ✅ Close button (XCircle icon)

**Modal Behavior:**
- ✅ Modal opens with animation
- ✅ Background overlay darkens
- ✅ Clicking close button closes modal
- ✅ Modal is scrollable for long responses

---

#### Test Case 4.8: Download PDF Button
**Test:** PDF download button shows placeholder

**Test Steps:**
1. Click "Download PDF" button on completed survey

**Expected Behavior:**
- ✅ Alert displays: "PDF download for response {token} - Coming soon!"
- ✅ No errors thrown

---

#### Test Case 4.9: Continue Draft Button
**Test:** Continue button navigates to survey

**Test Steps:**
1. Click "Continue" button on draft response

**Expected Behavior:**
- ✅ Navigates to `/surveys/{id}?response_token={token}`
- ✅ Survey page loads with existing answers

---

#### Test Case 4.10: Completion Progress Bar (Drafts)
**Test:** Progress bar displays for draft responses

**Mock Draft:**
```json
{
  "status": "draft",
  "completion_percentage": 40
}
```

**Expected Behavior:**
- ✅ "Completion" label shown
- ✅ "40%" text displayed
- ✅ Orange progress bar filled to 40%

---

## Integration Testing

### Test Case 5.1: Dashboard to My Surveys Navigation
**Test:** Navigation from dashboard works correctly

**Test Steps:**
1. Login as alumni
2. Navigate to dashboard
3. Click "View Available Surveys" button (if exists)
4. Verify redirection to `/alumni/surveys`

**Expected Behavior:**
- ✅ Redirects to My Surveys page
- ✅ Surveys load correctly

---

### Test Case 5.2: My Surveys to Survey Taking Flow
**Test:** Starting a survey navigates correctly

**Test Steps:**
1. Go to My Surveys page
2. Click "Start Survey" on a not-started survey
3. Verify navigation to survey page

**Expected Behavior:**
- ✅ Navigates to `/surveys/{id}`
- ✅ Survey page loads (when implemented)

---

### Test Case 5.3: Survey Completion to History Flow
**Test:** Completed survey appears in history

**Test Steps:**
1. Complete a survey
2. Navigate to Survey History page
3. Verify completed survey appears

**Expected Behavior:**
- ✅ Survey appears in history
- ✅ Status shows "Completed"
- ✅ Completion date displayed
- ✅ Time taken calculated

---

### Test Case 5.4: Continue Survey from History
**Test:** Continuing draft from history works

**Test Steps:**
1. Start a survey but don't complete
2. Go to Survey History
3. Click "Continue" on draft response
4. Verify navigation with response token

**Expected Behavior:**
- ✅ Navigates to `/surveys/{id}?response_token={token}`
- ✅ Existing answers are preserved

---

### Test Case 5.5: Retake Survey Flow
**Test:** Retaking a completed survey creates new response

**Test Steps:**
1. Complete a survey (with can_retake = true)
2. Go to My Surveys
3. Click "Retake" button
4. Complete survey again
5. Check Survey History

**Expected Behavior:**
- ✅ New response created
- ✅ Both responses appear in history
- ✅ Survey still shows as completed in My Surveys

---

## User Acceptance Testing

### UAT Scenario 1: First-time Survey Experience
**User Story:** As a new alumni, I want to see and complete available surveys

**Test Steps:**
1. Login as new alumni (no previous responses)
2. Navigate to Surveys section
3. View available surveys
4. Start a survey
5. Complete survey
6. View survey in history

**Acceptance Criteria:**
- ✅ All available surveys displayed
- ✅ Surveys are easy to understand
- ✅ Starting a survey is intuitive
- ✅ Completed survey appears in history immediately

---

### UAT Scenario 2: Continuing Incomplete Survey
**User Story:** As an alumni, I want to continue a survey I started earlier

**Test Steps:**
1. Start a survey but don't complete
2. Log out
3. Log back in later
4. Go to My Surveys
5. See survey marked "In Progress"
6. Click "Continue Survey"
7. Complete remaining questions

**Acceptance Criteria:**
- ✅ In-progress survey clearly marked
- ✅ Progress percentage displayed
- ✅ Can easily continue from where left off
- ✅ Previous answers are preserved

---

### UAT Scenario 3: Viewing Survey History
**User Story:** As an alumni, I want to view my past survey responses

**Test Steps:**
1. Complete multiple surveys
2. Navigate to Survey History
3. View list of completed surveys
4. Click "View Details" on a response
5. Review all answers

**Acceptance Criteria:**
- ✅ All completed surveys listed
- ✅ Can see when each was completed
- ✅ Can view full details of any response
- ✅ Details are readable and well-formatted

---

### UAT Scenario 4: Survey Filtering
**User Story:** As an alumni, I want to filter surveys by status

**Test Steps:**
1. Go to My Surveys with mixed survey statuses
2. Click "Available" tab
3. Verify only not-started surveys shown
4. Click "In Progress" tab
5. Verify only in-progress surveys shown
6. Click "Completed" tab
7. Verify only completed surveys shown

**Acceptance Criteria:**
- ✅ Filtering is fast and responsive
- ✅ Filter labels are clear
- ✅ Counts in tabs are accurate
- ✅ Easy to switch between filters

---

## Performance Testing

### Test Case 6.1: Load Time with Many Surveys
**Test:** Page loads quickly with large dataset

**Test Data:**
- 50 active surveys
- User has responses to 30 surveys

**Expected Performance:**
- ✅ API response < 500ms
- ✅ Page renders < 1 second
- ✅ No UI lag when filtering

---

### Test Case 6.2: Response Details Modal with Long Surveys
**Test:** Modal loads quickly with many questions

**Test Data:**
- Survey with 100 questions
- All questions answered

**Expected Performance:**
- ✅ Modal opens < 500ms
- ✅ Scrolling is smooth
- ✅ No memory leaks

---

## Security Testing

### Test Case 7.1: Authentication Enforcement
**Test:** Unauthenticated users cannot access surveys

**Test Steps:**
1. Logout (clear session)
2. Try to access `/api/v1/my-surveys`
3. Try to access `/api/v1/my-responses`

**Expected Behavior:**
- ✅ Both return 401 Unauthorized
- ✅ No survey data leaked

---

### Test Case 7.2: Authorization (Alumni Only)
**Test:** Non-alumni roles cannot access alumni surveys

**Test Steps:**
1. Login as admin or employer
2. Try to access `/alumni/surveys`

**Expected Behavior:**
- ✅ Redirected or access denied
- ✅ Alumni-specific surveys not accessible

---

### Test Case 7.3: Data Isolation
**Test:** Users can only see their own responses

**Test Steps:**
1. Login as User A
2. Note response tokens
3. Login as User B
4. Try to access User A's response via token

**Expected Behavior:**
- ✅ User B cannot see User A's responses
- ✅ API returns only User B's data

---

### Test Case 7.4: SQL Injection Prevention
**Test:** Malicious input doesn't break queries

**Test Data:**
- Survey ID: `1' OR '1'='1`
- Email: `test@example.com'; DROP TABLE surveys;--`

**Expected Behavior:**
- ✅ Invalid input rejected
- ✅ No database errors
- ✅ Database unchanged

---

### Test Case 7.5: XSS Prevention
**Test:** Script tags in survey responses don't execute

**Test Data:**
- Answer text: `<script>alert('XSS')</script>`
- Survey title: `<img src=x onerror=alert('XSS')>`

**Expected Behavior:**
- ✅ Scripts don't execute
- ✅ HTML is escaped/sanitized
- ✅ Display shows safe text

---

## Testing Tools & Commands

### Backend Testing (PHPUnit):
```bash
# Run all survey controller tests
php artisan test --filter=SurveyControllerTest

# Run specific test method
php artisan test --filter=testMySurveysReturnsAvailableSurveys

# Run with coverage
php artisan test --coverage --filter=SurveyControllerTest
```

### Frontend Testing (React Testing Library):
```bash
# Run all component tests
npm run test

# Run MySurveys tests
npm test MySurveys.test.tsx

# Run with coverage
npm test -- --coverage

# Watch mode for development
npm test -- --watch
```

### API Testing (Postman/Insomnia):
```
Collection: Alumni Surveys API Tests
- GET /api/v1/my-surveys (Authenticated)
- GET /api/v1/my-surveys (Unauthenticated - Should fail)
- GET /api/v1/my-responses (Authenticated)
- GET /api/v1/my-responses (Empty history)
```

### Browser Testing:
- Chrome DevTools
- React Developer Tools
- Network tab for API monitoring
- Console for error checking

### Manual Testing Checklist:
```
[ ] Login as alumni user
[ ] Navigate to /alumni/surveys
[ ] Verify page loads without errors
[ ] Test all filter tabs
[ ] Click "Start Survey" button
[ ] Navigate to /alumni/surveys/history
[ ] Test filter buttons
[ ] Click "View Details" button
[ ] Verify modal opens and closes
[ ] Test responsive design (resize browser)
[ ] Test on mobile device/emulator
[ ] Logout and verify redirect
[ ] Login as different user
[ ] Verify data isolation
```

---

## Bug Reporting Template

When reporting bugs, use this format:

### Bug Report
**Bug ID:** SURVEYS-XXX  
**Severity:** Critical / High / Medium / Low  
**Component:** MySurveys / SurveyHistory / API / Database  

**Description:**  
Brief description of the issue

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Behavior:**  
What should happen

**Actual Behavior:**  
What actually happens

**Screenshots:**  
[Attach if applicable]

**Environment:**
- Browser: Chrome 120
- OS: Windows 11
- Backend: Laravel 12
- Frontend: React 19

**Console Errors:**
```
Error messages here
```

**Additional Notes:**  
Any other relevant information

---

## Test Coverage Goals

### Backend:
- [ ] Unit Tests: 90% coverage
- [ ] Integration Tests: 80% coverage
- [ ] API Tests: 100% endpoint coverage

### Frontend:
- [ ] Component Tests: 80% coverage
- [ ] Integration Tests: 70% coverage
- [ ] E2E Tests: Critical paths covered

### Overall:
- [ ] All happy paths tested
- [ ] All error scenarios tested
- [ ] All edge cases identified and tested
- [ ] Security vulnerabilities addressed
- [ ] Performance benchmarks met
- [ ] Accessibility standards met (WCAG AA)

---

## Conclusion

This testing guide provides comprehensive test cases for the Alumni Surveys section. Regular testing ensures reliability, security, and excellent user experience. All tests should be run before deployment to production.

**Next Steps:**
1. Implement automated test suites
2. Set up continuous integration (CI)
3. Schedule regular regression testing
4. Monitor production errors and user feedback
