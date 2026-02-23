# Alumni Import System — Implementation Plan

> **Date:** February 23, 2026  
> **Purpose:** Import old alumni from hardcopy registration forms (Excel) into the system with auto-created accounts

---

## 1. Context & Problem Statement

The school has hardcopy alumni registration forms (paper-based) that have been digitized into Excel files following the **"2025 Alumni Directory Template.xlsx"** format. These need to be imported into the system.

### Excel Template Columns
| Col | Header | Example |
|-----|--------|---------|
| A | Last Name | `Dela Cruz` |
| B | First Name | `Juan` |
| C | Middle Name | `Santos` |
| D | Suffix | `Jr.` |
| E | Student No. | `2020-CCS-1234` |
| F | Degree / Program Earned | `Bachelor of Science in Computer Science` |
| G | Date of Birth | `05/19/2000` |
| H | Home Address | `123 Main St, Manila` |
| I | Email | `juan@gmail.com` (may be blank) |
| J | Contact Number | `09171234567` |
| K | Gender | `Male` |

### System Registration Fields (from SurveyRegistration / normal flow)
The full system collects **70+ fields** including employment data, career info, skills, certifications, etc.

### The Gap
| Data Point | Excel Has? | System Needs? |
|-----------|-----------|--------------|
| Name (first, last, middle) | ✅ | ✅ |
| Suffix | ✅ | ❌ (not in schema yet) |
| Student ID | ✅ | ✅ |
| Degree/Program (text) | ✅ | ✅ (needs course_id mapping) |
| Date of Birth | ✅ | ✅ |
| Address (combined) | ✅ | ✅ (goes to current_address) |
| Email | ⚠️ sometimes blank | ✅ (for user account) |
| Phone | ✅ | ✅ |
| Gender | ✅ | ✅ |
| Campus | ❌ (in header text) | ✅ (campus_id) |
| Department | ❌ (in header text) | ✅ (department_id) |
| Course | ❌ (from degree text) | ✅ (course_id) |
| Batch/Year | ❌ (in filename/header) | ✅ (batch_id) |
| Employment data | ❌ | ✅ (all null — that's fine) |
| User account | ❌ | ✅ Must create |

---

## 2. Approach: Auto-Create Accounts (Recommended)

### Decision: Single Alumni Bank, No Separate Page

**Why NOT a separate "Imported Alumni" page:**
- Duplicates UI, filtering, export logic — double maintenance burden
- Imported alumni can never interact with system (surveys, profile updates)
- Analytics must merge two sources — complex and error-prone
- If they later register normally → duplicate records

**Why auto-create accounts:**
- Old alumni can immediately log in, complete their profiles, take surveys
- Single Alumni Bank — no fragmentation
- Login already supports Student ID + password — the infrastructure exists!
- Analytics stays unified
- Distinguished by `must_change_password` flag + `import_source` field

### Account Credentials
- **Login:** Student ID (already supported by existing login system)
- **Password:** Lowercase last name (e.g., `dela cruz` → `delacruz`)
  - Stripped of spaces, lowercased
  - Hashed via bcrypt before storage
- **Email:** If provided in Excel → use it. If blank → generate placeholder: `{student_id}@alumni.earist.edu.ph`
- **Status:** `active` (so they can log in immediately)
- **must_change_password:** `true` → force password change on first login

---

## 3. Database Changes

### 3.1 Migration: Add `must_change_password` to `users` table
```php
Schema::table('users', function (Blueprint $table) {
    $table->boolean('must_change_password')->default(false)->after('password');
});
```

### 3.2 Migration: Add `suffix` to `alumni_profiles` table
```php
Schema::table('alumni_profiles', function (Blueprint $table) {
    $table->string('suffix', 10)->nullable()->after('middle_name');
});
```

### 3.3 Migration: Add `import_source` to `alumni_profiles` table
```php
Schema::table('alumni_profiles', function (Blueprint $table) {
    $table->string('import_source')->nullable()->after('last_profile_update');
    $table->timestamp('imported_at')->nullable()->after('import_source');
});
```

> These can be combined into a single migration file.

---

## 4. Backend Implementation

### 4.1 Install PhpSpreadsheet
```bash
composer require phpoffice/phpspreadsheet
```

### 4.2 Create `AlumniImportController`

**Route:** `POST /api/v1/admin/alumni/import`

**Request Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| file | .xlsx file | ✅ | The Excel file |
| campus_id | integer | ✅ | Target campus |
| batch_id | integer | ✅ | Target batch (graduation year) |
| department_id | integer | ⚠️ | Auto-detected from header or manual |
| duplicate_action | string | ✅ | `skip` or `update` |
| header_row | integer | ❌ | Row number where column headers are (default: 3) |
| data_start_row | integer | ❌ | Row number where data starts (default: 4) |

**Processing Logic:**

```
1. Parse Excel file
2. Read header rows to auto-detect department (from "COLLEGE OF ..." text)
3. For each data row:
   a. Validate required fields (last_name, first_name required; student_id recommended)
   b. Check for duplicates via student_id → alumni_profiles.student_id
      - If duplicate found and action = "skip" → skip row
      - If duplicate found and action = "update" → update existing profile
   c. Match "Degree / Program Earned" → courses.name (fuzzy match within department)
   d. Map gender text → enum value (Male → male, Female → female)
   e. Parse date of birth (handle multiple formats: MM/DD/YYYY, YYYY-MM-DD, etc.)
   f. Create User record:
      - email: provided or generated placeholder
      - password: bcrypt(lowercase(no_spaces(last_name)))
      - role: 'alumni'
      - status: 'active'
      - campus_id: from form
      - must_change_password: true
   g. Create AlumniProfile record:
      - Link to user_id
      - Map all available fields
      - degree_program: from Excel column F
      - course_id: from fuzzy match
      - department_id: from form/auto-detect
      - batch_id: from form
      - campus_id: from form
      - profile_completed: false
      - import_source: filename
      - imported_at: now()
4. Return results summary
```

**Response:**
```json
{
    "success": true,
    "summary": {
        "total_rows": 150,
        "imported": 142,
        "skipped_duplicates": 5,
        "updated": 0,
        "errors": 3
    },
    "errors": [
        { "row": 45, "student_id": "2020-CCS-XXXX", "reason": "Missing last name" },
        { "row": 78, "student_id": null, "reason": "Missing both name fields" },
        { "row": 112, "student_id": "2020-CCS-5555", "reason": "Invalid date format" }
    ],
    "warnings": [
        { "row": 23, "message": "Course 'BS Info Tech' not found — degree_program saved as text, course_id left null" },
        { "row": 67, "message": "No email provided — generated placeholder email" }
    ]
}
```

### 4.3 Course Fuzzy Matching Logic

```php
// Given: "Bachelor of Science in Computer Science"
// Match against courses in the selected department:
// 1. Exact match on courses.name
// 2. Partial match (str_contains or similar_text > 80%)
// 3. Match on courses.code abbreviation
// 4. If no match → course_id = null, store raw text in degree_program field
```

### 4.4 Force Password Change Middleware

**New middleware:** `EnsurePasswordChanged`

```php
// On every authenticated request for alumni:
// If user->must_change_password === true
//   AND current route is NOT the change-password page
//   → redirect to change-password page
```

**Login flow update:**
- After successful login, check `must_change_password`
- If true → redirect to `/change-password` instead of dashboard
- The change-password page saves new password + sets `must_change_password = false`

---

## 5. Frontend Implementation

### 5.1 Import Button in Alumni Bank

Add an **"Import Alumni"** button next to the existing "Export" button in the AlumniBank page toolbar.

### 5.2 Import Dialog / Modal

**Step 1 — Upload & Configure:**
- File picker (accepts `.xlsx` only)
- Campus dropdown (required)
- Batch/Year dropdown (required)  
- Department dropdown (auto-populated if detected from file header, otherwise manual)
- Duplicate handling: Radio — "Skip duplicates" / "Update existing"
- "Preview" button

**Step 2 — Preview & Confirm:**
- Show parsed rows count
- Show auto-detected info: "Detected department: College of Computing Studies"
- Show first 10 rows in a table preview
- Show any warnings (missing emails, unmatched courses)
- "Import" button to confirm

**Step 3 — Results:**
- Progress bar during import
- Summary: X imported, X skipped, X errors
- Error details expandable list
- "Download Error Report" button (CSV of failed rows with reasons)

### 5.3 Force Password Change Page

Simple page shown to imported alumni on first login:
- Message: "Your account was created with a temporary password. Please set a new password to continue."
- Current password field (pre-knowledge: their last name)
- New password + confirm fields
- On success → redirect to alumni dashboard

### 5.4 Visual Indicator for Imported Alumni

In Alumni Bank table, add a subtle badge/icon for imported alumni:
- Small "Imported" tag or upload icon
- Filter option: "Source: All / Registered / Imported"
- Shows `imported_at` date on hover/detail view

---

## 6. Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Weak default passwords (last name) | `must_change_password` forces change on first login |
| Common last names | Password is per-user; student ID is unique login |
| Placeholder emails can't receive password resets | Admin can manually update email; alumni can set email on first login |
| Bulk account creation = potential abuse | Only admin can trigger import; rate-limited; logged in activity logs |
| Imported data quality | Validation + error reporting; admin reviews results |

---

## 7. Implementation Order

### Phase 1: Database & Backend (Priority)
1. ✅ Install `phpoffice/phpspreadsheet`
2. ✅ Run migration (must_change_password, suffix, import_source, imported_at)
3. ✅ Add `must_change_password`, `suffix`, `import_source`, `imported_at` to model fillables
4. ✅ Create `AlumniImportController` with full parsing logic
5. ✅ Add API route: `POST /api/v1/admin/alumni/import`
6. ✅ Create `EnsurePasswordChanged` middleware
7. ✅ Update login flow to check `must_change_password`

### Phase 2: Frontend — Import UI
8. ✅ Add Import button to AlumniBank
9. ✅ Build Import dialog (upload, configure, preview, confirm)
10. ✅ Build results summary view
11. ✅ Add "Source" filter + imported badge to Alumni Bank table

### Phase 3: Password Change Flow
12. ✅ Create force-change-password page/component  
13. ✅ Wire middleware to redirect imported alumni on login
14. ✅ Allow setting email during password change (for alumni with placeholder emails)

### Phase 4: Testing & Polish
15. Test with real Excel file
16. Edge cases: empty rows, merged cells, special characters in names
17. Verify login works with Student ID + last name password
18. Verify force password change flow

---

## 8. File Changes Summary

| File | Action |
|------|--------|
| `composer.json` | Add phpoffice/phpspreadsheet |
| `database/migrations/xxxx_add_import_fields.php` | New migration |
| `app/Models/User.php` | Add `must_change_password` to fillable + casts |
| `app/Models/AlumniProfile.php` | Add `suffix`, `import_source`, `imported_at` to fillable |
| `app/Http/Controllers/Api/AlumniImportController.php` | New controller |
| `app/Http/Middleware/EnsurePasswordChanged.php` | New middleware |
| `routes/api.php` | Add import route |
| `routes/web.php` | Add force-change-password route |
| `resources/js/pages/admin/AlumniBank.tsx` | Add import button + dialog |
| `resources/js/pages/auth/ForcePasswordChange.tsx` | New page |
| `resources/js/pages/auth/login.tsx` | Handle must_change_password redirect |

---

## 9. Data Flow Diagram

```
Excel File (.xlsx)
       │
       ▼
[Admin uploads in Alumni Bank]
       │
       ▼
[AlumniImportController]
       │
       ├─→ Parse Excel (PhpSpreadsheet)
       │
       ├─→ Auto-detect department from header
       │
       ├─→ For each row:
       │      ├─→ Validate fields
       │      ├─→ Check duplicate (student_id)
       │      ├─→ Fuzzy-match course
       │      ├─→ Create User (student_id login, last_name password)
       │      ├─→ Create AlumniProfile (linked to user)
       │      └─→ Track result (success/skip/error)
       │
       └─→ Return summary to frontend
              │
              ▼
[Alumni Bank shows imported records with badge]

       ═══════════════════════════════

[Imported alumni logs in with Student ID + last name]
       │
       ▼
[Login succeeds → must_change_password = true]
       │
       ▼
[Redirect to Force Password Change page]
       │
       ├─→ Set new password
       ├─→ Optionally set real email
       └─→ must_change_password = false
              │
              ▼
[Alumni Dashboard — can now complete profile, take surveys, etc.]
```
