# QUICK EXECUTION GUIDE

## ⚠️ STOP! Read This First

**Time Required:** 30 minutes  
**Point of No Return:** Step 3 (Data Deletion)  
**Accounts Preserved:** nacu.a.bscs@gmail.com, adriankurtnacu@gmail.com

---

## PRE-FLIGHT CHECK

Before starting, verify:
- [x] All files created (backup script, seeders)
- [ ] MySQL is running (check XAMPP Control Panel)
- [ ] No users are currently using the system
- [ ] You have 30 minutes uninterrupted time

---

## EXECUTION SEQUENCE

### ✅ STEP 1: BACKUP DATABASE (CRITICAL!)

```powershell
cd C:\xampp\htdocs
php scripts/backup_database.php
```

**Expected:** Creates SQL backup + CSV export in `storage/backups/`

**✅ Checkpoint:** Verify backup files exist before continuing!

---

### ✅ STEP 2: CREATE CAVITE INFRASTRUCTURE

```powershell
php artisan db:seed --class=CaviteCampusInfrastructureSeeder
```

**Expected:** 
- 5 Cavite departments created
- 14 Cavite courses created
- 7 Cavite batches created

**✅ Checkpoint:** Should see "✅ Ready for alumni data seeding!"

---

### ⚠️ STEP 3: DELETE ALUMNI DATA (POINT OF NO RETURN!)

**WARNING:** This deletes all alumni except 2 preserved accounts!

```powershell
php artisan db:seed --class=DeleteNonPreservedAlumniSeeder
```

**Expected:**
- Deletes ~200+ alumni profiles
- Keeps nacu.a.bscs@gmail.com & adriankurtnacu@gmail.com
- Shows "✅ Verification passed: 2 preserved accounts remain"

**✅ Checkpoint:** Should show exactly 2 remaining users

**❌ IF FAILED:** Restore immediately:
```powershell
# Find your backup file in storage/backups/
mysql -u root -p alumni_tracer_system < storage/backups/alumni_tracer_backup_YYYY-MM-DD_HH-MM-SS.sql
```

---

### ✅ STEP 4: SEED NEW ALUMNI DATA

```powershell
php artisan db:seed --class=ComprehensiveAlumniSeeder
```

**Expected:**
- Creates 100 Main Campus alumni
- Creates 100 Cavite Campus alumni
- Total: 202 alumni (2 preserved + 200 new)
- Takes ~5 minutes

**✅ Checkpoint:** Should show "✅ All alumni data seeded successfully!"

---

### ✅ STEP 5: VERIFY DATA

```powershell
php artisan tinker
```

Then run these commands:

```php
// Check total alumni count
User::where('role', 'alumni')->count()
// Expected: 202

// Check Main Campus
DB::table('alumni_profiles')->where('campus_id', 1)->count()
// Expected: ~101

// Check Cavite Campus
DB::table('alumni_profiles')->where('campus_id', 2)->count()
// Expected: ~101

// Check employment records
DB::table('employments')->count()
// Expected: ~170

// Check job start dates populated
DB::table('alumni_profiles')->whereNotNull('job_start_date')->count()
// Expected: ~170

// Verify preserved accounts exist
User::whereIn('email', ['nacu.a.bscs@gmail.com', 'adriankurtnacu@gmail.com'])->count()
// Expected: 2

exit
```

**✅ Checkpoint:** All counts should match expected values

---

## POST-EXECUTION TESTING

### Test 1: Dashboard Analytics

1. Login as admin
2. Check dashboard shows realistic numbers (not zeros)
3. Switch campus selector: Main → Cavite → All
4. Verify employment metrics change with campus selection

### Test 2: Campus Locking (Alumni)

1. Login as alumni: nacu.a.bscs@gmail.com
2. Go to Profile → Edit
3. Verify NO campus field is visible
4. Alumni cannot change their campus ✅

### Test 3: Campus Locking (Security Test)

Open browser console and try:
```javascript
fetch('/api/v1/alumni/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ campus_id: 2 })
})
```

**Expected:** 403 Forbidden error ✅

---

## ROLLBACK IF NEEDED

If something goes wrong:

```powershell
# Find your backup file
cd C:\xampp\htdocs\storage\backups
dir

# Restore (replace filename with your actual backup)
mysql -u root -p alumni_tracer_system < alumni_tracer_backup_YYYY-MM-DD_HH-MM-SS.sql

# Clear Laravel cache
php artisan cache:clear
php artisan config:clear
```

---

## EXPECTED RESULTS

After successful execution:

✅ **202 Total Alumni** (2 preserved + 200 new)
✅ **100 per campus** (balanced distribution)
✅ **~85% Employment Rate** (170 employed / 200)
✅ **Complete Data** (all job_start_date, mismatch_reason, satisfaction filled)
✅ **Campus Locked** (alumni cannot change campus)
✅ **Analytics Working** (dashboard shows non-zero values)

---

## NEW ALUMNI ACCOUNTS

All new alumni accounts have:
- **Password:** `password123`
- **Format:** firstname.lastname###@alumni.earist.edu.ph

Example: juan.cruz0@alumni.earist.edu.ph / password123

---

## SUPPORT

If you encounter errors:

1. **Check Laravel logs:**
   ```powershell
   tail -f storage/logs/laravel.log
   ```

2. **Check MySQL errors:**
   ```
   C:\xampp\mysql\data\mysql_error.log
   ```

3. **Rollback using backup file**

---

## STATUS TRACKING

- [ ] Step 1: Backup completed
- [ ] Step 2: Cavite infrastructure created
- [ ] Step 3: Alumni data deleted
- [ ] Step 4: New alumni seeded
- [ ] Step 5: Data verified
- [ ] Testing: Dashboard analytics working
- [ ] Testing: Campus locking verified

---

**Ready to execute? Start with Step 1 (Backup)!**
