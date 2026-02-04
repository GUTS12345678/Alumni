# Data Reset Execution Guide

## EARIST Alumni Tracer System - Step-by-Step Execution

**Document Version:** 1.0  
**Date:** February 4, 2026  
**Status:** Ready for Execution  
**⚠️ CRITICAL: Read entirely before executing!**

---

## Quick Reference

**Execution Time:** ~30 minutes  
**Accounts Preserved:** 2 (nacu.a.bscs@gmail.com, adriankurtnacu@gmail.com)  
**New Alumni:** 200 (100 Main Campus + 100 Cavite Campus)  
**Rollback:** Available via backup file

---

## ⚠️ PRE-EXECUTION CHECKLIST

Before you begin, ensure:

- [ ] You have database access (MySQL root credentials)
- [ ] Laravel application is accessible
- [ ] PHP artisan commands work
- [ ] You have at least 30 minutes uninterrupted time
- [ ] No users are currently accessing the system
- [ ] You understand this is **IRREVERSIBLE** without backup

---

## 📋 EXECUTION STEPS

### PHASE 1: BACKUP (5 minutes)

**Command:**
```bash
cd C:\xampp\htdocs
php scripts/backup_database.php
```

**Expected Output:**
```
╔══════════════════════════════════════════════════════════════╗
║          ALUMNI TRACER SYSTEM - DATABASE BACKUP             ║
╚══════════════════════════════════════════════════════════════╝

Database: alumni_tracer_system
Host: localhost:3306
Backup file: C:\xampp\htdocs\storage\backups\alumni_tracer_backup_2026-02-04_XX-XX-XX.sql

⏳ Creating SQL backup...
✅ SQL backup created successfully!
   Size: XX.XX MB
   Location: C:\xampp\htdocs\storage\backups\alumni_tracer_backup_...

⏳ Exporting alumni data to CSV...
✅ CSV export created successfully!
   Records: XXX
   Size: XX.XX KB
   Location: C:\xampp\htdocs\storage\backups\alumni_export_...

╔══════════════════════════════════════════════════════════════╗
║                     BACKUP COMPLETE                          ║
╚══════════════════════════════════════════════════════════════╝
```

**✅ Checkpoint:** Backup files created in `storage/backups/`

**❌ If Failed:** Fix database connection issues before proceeding

---

### PHASE 2: CAMPUS INFRASTRUCTURE (3 minutes)

**Command:**
```bash
php artisan db:seed --class=CaviteCampusInfrastructureSeeder
```

**Expected Output:**
```
╔══════════════════════════════════════════════════════════════╗
║      CAVITE CAMPUS INFRASTRUCTURE SETUP                     ║
╚══════════════════════════════════════════════════════════════╝

⏳ Creating departments for Cavite Campus...
✅ Created 5 departments

⏳ Creating courses for Cavite Campus...
✅ Created 14 courses

⏳ Creating batches for Cavite Campus...
✅ Created 7 batches

⏳ Ensuring Main Campus has batches...
✅ Main Campus batches verified

╔══════════════════════════════════════════════════════════════╗
║            INFRASTRUCTURE SETUP COMPLETE                     ║
╚══════════════════════════════════════════════════════════════╝

System Summary:
- Total Departments: XX
- Total Courses: XX
- Total Batches: XX

Cavite Campus:
- Departments: 5
- Courses: 14
- Batches: 7

✅ Ready for alumni data seeding!
```

**✅ Checkpoint:** Cavite infrastructure created

**❌ If Failed:** Rollback and check department/course setup

---

### PHASE 3: DATA DELETION (2 minutes) ⚠️ DESTRUCTIVE

**⚠️ WARNING:** This step deletes all alumni except 2 preserved accounts!

**Command:**
```bash
php artisan db:seed --class=DeleteNonPreservedAlumniSeeder
```

**Expected Output:**
```
╔══════════════════════════════════════════════════════════════╗
║              ALUMNI DATA DELETION                            ║
║        ⚠️  THIS ACTION CANNOT BE UNDONE! ⚠️                   ║
╚══════════════════════════════════════════════════════════════╝

⏳ Verifying preserved accounts...
✅ Found accounts to preserve:
   - nacu.a.bscs@gmail.com (ID: X)
   - adriankurtnacu@gmail.com (ID: X)

✅ Found alumni profiles to preserve: X, X

⚠️ DELETION PREVIEW:
   - employments: XXX records
   - survey_responses: XXX records
   - job_applications: XXX records
   - messages: XXX records
   - activity_logs: XXX records
   - alumni_profiles: XXX records
   - users: XXX records

🗑️ Starting cascading deletion...

⏳ [1/7] Deleting employment records...
✅ Deleted XXX employment records

⏳ [2/7] Deleting survey responses...
✅ Deleted XXX survey responses

⏳ [3/7] Deleting job applications...
✅ Deleted XXX job applications

⏳ [4/7] Deleting messages...
✅ Deleted XXX messages

⏳ [5/7] Deleting activity logs...
✅ Deleted XXX activity logs

⏳ [6/7] Deleting alumni profiles...
✅ Deleted XXX alumni profiles

⏳ [7/7] Deleting user accounts (alumni only)...
✅ Deleted XXX user accounts

╔══════════════════════════════════════════════════════════════╗
║                  DELETION COMPLETE                           ║
╚══════════════════════════════════════════════════════════════╝

Remaining Records:
   - users: 2
   - alumni_profiles: 2
   - employments: X
   - survey_responses: 0
   - job_applications: 0

✅ Verification passed: 2 preserved accounts remain
✅ Ready for new alumni data seeding

Preserved Accounts:
   - nacu.a.bscs@gmail.com
     Profile: [Name]
     Campus: [Main/Cavite]
   - adriankurtnacu@gmail.com
     Profile: [Name]
     Campus: [Main/Cavite]
```

**✅ Checkpoint:** Only 2 alumni users remain

**❌ If Failed:** DO NOT PROCEED! Restore from backup immediately

---

### PHASE 4: ALUMNI SEEDING (10 minutes) 🚀

**Command:**
```bash
php artisan db:seed --class=ComprehensiveAlumniSeeder
```

**Expected Output:**
```
╔══════════════════════════════════════════════════════════════╗
║         COMPREHENSIVE ALUMNI DATA SEEDING                    ║
╚══════════════════════════════════════════════════════════════╝

✅ Found 10 Main Campus departments
✅ Found 5 Cavite Campus departments
✅ Found 54 Main Campus courses
✅ Found 14 Cavite Campus courses

⏳ Seeding Main Campus Alumni (100 alumni)...
✅ Main Campus seeding complete

⏳ Seeding Cavite Campus Alumni (100 alumni)...
✅ Cavite Campus seeding complete

╔══════════════════════════════════════════════════════════════╗
║                SEEDING COMPLETE                              ║
╚══════════════════════════════════════════════════════════════╝

Final Statistics:
- Total Alumni Users: 202
- Total Alumni Profiles: 202
- Total Employment Records: ~170

Campus Distribution:
- Main Campus: 101 alumni (1 preserved + 100 new)
- Cavite Campus: 101 alumni (1 preserved + 100 new)

✅ All alumni data seeded successfully!
```

**✅ Checkpoint:** 202 total alumni (2 preserved + 200 new)

**❌ If Failed:** Check seeder errors, may need to re-run

---

### PHASE 5: VERIFICATION (5 minutes) ✓

**Manual Verification Steps:**

1. **Check User Count:**
```bash
php artisan tinker
>>> User::where('role', 'alumni')->count()
// Expected: 202
>>> exit
```

2. **Check Campus Distribution:**
```bash
php artisan tinker
>>> DB::table('alumni_profiles')->where('campus_id', 1)->count()
// Expected: ~101

>>> DB::table('alumni_profiles')->where('campus_id', 2)->count()
// Expected: ~101

>>> exit
```

3. **Check Employment Data:**
```bash
php artisan tinker
>>> DB::table('alumni_profiles')->whereNotNull('job_start_date')->count()
// Expected: ~170 (employed alumni only)

>>> DB::table('employments')->count()
// Expected: ~170

>>> exit
```

4. **Check Job Mismatch Distribution:**
```bash
php artisan tinker
>>> DB::table('alumni_profiles')->where('job_mismatch_reason', 'none')->count()
// Expected: ~115 (68% of employed)

>>> DB::table('alumni_profiles')->where('job_mismatch_reason', 'overqualified')->count()
// Expected: ~30 (18% of employed)

>>> DB::table('alumni_profiles')->where('job_mismatch_reason', 'unfit')->count()
// Expected: ~13 (8% of employed)

>>> exit
```

5. **Verify Preserved Accounts Still Exist:**
```bash
php artisan tinker
>>> User::whereIn('email', ['nacu.a.bscs@gmail.com', 'adriankurtnacu@gmail.com'])->count()
// Expected: 2

>>> exit
```

**✅ All Checks Passed:** Data reset successful!

**❌ If Issues Found:** Review logs, may need partial rollback

---

## 📊 EXPECTED ANALYTICS RESULTS

After successful execution, your dashboard should show:

### Main Campus Analytics:
- **Total Alumni:** ~101
- **Employment Rate:** ~85% (85 employed / 101 total)
- **Avg Time to Job:** ~90-120 days
- **Job Mismatch Breakdown:**
  - Good Match: ~58 alumni (68%)
  - Overqualified: ~15 alumni (18%)
  - Unfit: ~7 alumni (8%)
  - Underqualified: ~5 alumni (6%)

### Cavite Campus Analytics:
- **Total Alumni:** ~101
- **Employment Rate:** ~85%
- **Avg Time to Job:** ~90-120 days
- **Job Mismatch Breakdown:**
  - Good Match: ~58 alumni (68%)
  - Overqualified: ~15 alumni (18%)
  - Unfit: ~7 alumni (8%)
  - Underqualified: ~5 alumni (6%)

### Combined (All Campuses):
- **Total Alumni:** 202
- **Employment Rate:** ~85%
- **Total Employed:** ~170
- **Total Unemployed:** ~25
- **Pursuing Higher Ed:** ~7

---

## 🔒 CAMPUS LOCKING VERIFICATION

**Test Campus Field Protection:**

1. **Login as Alumni:**
   - Email: nacu.a.bscs@gmail.com (or any new alumni account)
   - Password: password123 (for new accounts)

2. **Try to Update Profile:**
   - Go to Profile → Edit
   - Verify NO campus selector is visible
   - Profile Edit page should not have campus field at all

3. **Attempt API Bypass (Security Test):**
   - Open Browser DevTools → Console
   - Try to send campus_id in update request:
   ```javascript
   fetch('/api/v1/alumni/profile', {
       method: 'PUT',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ campus_id: 2 })
   })
   ```
   - **Expected Response:** 403 Forbidden
   - **Message:** "Unauthorized: Campus assignment cannot be changed by alumni users."

4. **Login as Admin:**
   - Verify Admin can see campus selector in header
   - Verify Admin can switch between Main and Cavite
   - Verify Dashboard updates with campus-specific data

**✅ Checkpoint:** Campus locking working correctly

---

## 🔧 TESTING DASHBOARD ANALYTICS

1. **Login as Admin**
2. **Switch to Main Campus:**
   - Dashboard should show ~101 alumni
   - Employment metrics calculated for Main only
3. **Switch to Cavite Campus:**
   - Dashboard should show ~101 alumni
   - Employment metrics calculated for Cavite only
4. **Switch to All Campuses:**
   - Dashboard should show 202 alumni
   - Employment metrics combined from both campuses

---

## 🚨 ROLLBACK PROCEDURE (IF NEEDED)

If something went wrong:

### Option 1: Full Rollback
```bash
# Stop execution immediately
Ctrl+C

# Restore from backup
mysql -u root -p alumni_tracer_system < storage/backups/alumni_tracer_backup_YYYY-MM-DD_HH-MM-SS.sql

# Clear Laravel cache
php artisan cache:clear
php artisan config:clear
php artisan view:clear
```

### Option 2: Partial Rollback (Only Delete New Data)
```bash
php artisan tinker

# Delete newly seeded alumni (keep preserved 2)
>>> $preserveEmails = ['nacu.a.bscs@gmail.com', 'adriankurtnacu@gmail.com'];
>>> $preserveIds = User::whereIn('email', $preserveEmails)->pluck('id');
>>> User::where('role', 'alumni')->whereNotIn('id', $preserveIds)->delete();

>>> exit
```

---

## 📝 POST-EXECUTION CHECKLIST

After successful execution:

- [ ] Verify 202 total alumni users
- [ ] Check Main Campus has ~101 alumni
- [ ] Check Cavite Campus has ~101 alumni
- [ ] Verify employment data populated (job_start_date not null for employed)
- [ ] Check job mismatch reasons populated
- [ ] Verify preserved accounts still accessible
- [ ] Test dashboard analytics show realistic numbers
- [ ] Test campus selector (admin only can switch)
- [ ] Verify alumni CANNOT change their campus
- [ ] Test login with new alumni accounts (password: password123)
- [ ] Clear browser cache and test frontend

---

## 🎯 SUMMARY OF CHANGES

### Data Changes:
| Item | Before | After | Change |
|------|--------|-------|--------|
| Alumni Users | ~230 | 202 | -28 (deleted all except 2, added 200) |
| Main Campus Alumni | ~160 | 101 | Balanced distribution |
| Cavite Campus Alumni | ~70 | 101 | Balanced distribution |
| Cavite Departments | 0 | 5 | Infrastructure added |
| Cavite Courses | 0 | 14 | Infrastructure added |
| Cavite Batches | 0 | 7 | Infrastructure added |
| Employment Records | ~X | ~170 | Complete employment data |

### Code Changes:
1. **AuthController.php:**
   - Added campus_id protection in `updateAlumniProfile()`
   - Added validation rule: `'campus_id' => 'prohibited'`
   - Added security check: Blocks campus_id changes for non-admin users
   - Added extra security: `$request->except(['campus_id', ...])`

2. **New Seeders:**
   - `CaviteCampusInfrastructureSeeder` - Creates Cavite departments/courses/batches
   - `DeleteNonPreservedAlumniSeeder` - Deletes all alumni except 2 preserved
   - `ComprehensiveAlumniSeeder` - Creates 200 realistic alumni profiles

3. **New Scripts:**
   - `scripts/backup_database.php` - Full database backup utility

---

## 🔐 DEFAULT CREDENTIALS

**Preserved Accounts:**
- Email: nacu.a.bscs@gmail.com
- Email: adriankurtnacu@gmail.com
- (Keep original passwords)

**New Alumni Accounts:**
- Any email from seeder (e.g., juan.cruz0@alumni.earist.edu.ph)
- Default Password: `password123`

**Admin Accounts:**
- (No changes to admin accounts)

---

## 📞 SUPPORT

If you encounter issues:

1. **Check Laravel logs:**
   ```bash
   tail -f storage/logs/laravel.log
   ```

2. **Check MySQL error log:**
   ```bash
   # Location: C:\xampp\mysql\data\mysql_error.log
   ```

3. **Rollback if needed:** Use backup file created in Phase 1

---

## ✅ EXECUTION COMPLETE

After following all steps, your system should have:

- ✅ 202 total alumni (2 preserved + 200 new)
- ✅ 100 Main Campus alumni with complete data
- ✅ 100 Cavite Campus alumni with complete data
- ✅ Realistic employment metrics for analytics
- ✅ Complete job mismatch data distribution
- ✅ Campus field locked for alumni users
- ✅ Admin can still switch campuses for viewing

**Next Steps:**
1. Test dashboard analytics with different campus selections
2. Verify employment reports show realistic data
3. Test job mismatch analytics across campuses
4. Monitor system for any issues

---

**END OF EXECUTION GUIDE**

*All scripts and seeders are ready in your codebase. Follow this guide step-by-step for successful execution.*
