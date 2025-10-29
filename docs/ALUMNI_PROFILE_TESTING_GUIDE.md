# Alumni Profile - Quick Testing Guide

**Date:** October 16, 2025  
**Feature:** Alumni Profile View & Edit

---

## 🧪 Quick Test Steps

### Prerequisites
1. Have an alumni account ready
2. Make sure database is seeded with test data
3. Clear browser cache if needed

---

## Test 1: Profile View Page

### Step 1: Login as Alumni
```
1. Go to /login
2. Enter alumni credentials
3. Verify redirect to /alumni/dashboard
```

### Step 2: Navigate to Profile
```
1. Click "My Profile" in sidebar
2. Should navigate to /alumni/profile/view
3. Page should load without errors
```

### Step 3: Verify Profile Display
```
✓ Check Personal Information card displays
✓ Check Academic Information card displays
✓ Check Employment Information card displays
✓ Check Skills & Certifications card (if data exists)
✓ Check Career Goals card (if data exists)
✓ Check Networking Preferences sidebar
✓ Check Profile Status sidebar
✓ Check Profile Completion bar at top
```

### Step 4: Check Data Accuracy
```
✓ Name displayed correctly
✓ Email matches your account
✓ Employment status badge shows correct color
✓ Graduation year displays
✓ All fields with data are visible
✓ Fields without data are hidden (not showing "undefined")
```

### Step 5: Test Edit Button
```
1. Click "Edit Profile" button (top right)
2. Should navigate to /alumni/profile/edit
3. Form should pre-populate with current data
```

---

## Test 2: Profile Edit Page

### Step 1: Access Edit Form
```
From Profile View, click "Edit Profile" button
OR
Navigate directly to /alumni/profile/edit
```

### Step 2: Verify Form Pre-population
```
✓ All text fields show current values
✓ Dropdowns show selected values
✓ Checkboxes show correct checked state
✓ Date fields show dates in correct format
✓ Textareas show full text
```

### Step 3: Test Field Updates

**Test Text Fields:**
```
1. Change First Name to "TestUpdated"
2. Add/update Phone number
3. Update Job Title
```

**Test Dropdowns:**
```
1. Change Employment Status
2. Change Gender
3. Change Company Size
4. Change Job Satisfaction
```

**Test Checkboxes:**
```
1. Toggle "Willing to Mentor"
2. Toggle "Job Related to Degree"
```

**Test Textareas:**
```
1. Update Career Goals
2. Update Job Description
3. Add Skills (comma-separated)
4. Add Certifications (comma-separated)
```

**Test Date Fields:**
```
1. Update Birth Date
2. Update Graduation Date
3. Update Job Start Date
```

### Step 4: Test Validation

**Test Required Fields (if applicable):**
```
1. Clear First Name field
2. Click Save
3. Should show error: "First name is required"
```

**Test Format Validation:**
```
1. Enter invalid email in Alternate Email
2. Should show error on save
```

**Test Range Validation:**
```
1. Enter GPA = 6.0 (should fail, max is 5.0)
2. Enter negative graduation year
3. Should show validation errors
```

### Step 5: Test Save Functionality

**Successful Save:**
```
1. Fill/update at least 3 fields
2. Click "Save Profile" button
3. Button should show "Saving..." with spinner
4. Should see success message: "Profile updated successfully!"
5. Should auto-redirect to Profile View page after 2 seconds
6. Verify changes appear on Profile View
```

**Cancel Action:**
```
1. Make some changes
2. Click "Cancel" button
3. Should navigate back to Profile View
4. Changes should NOT be saved
```

---

## Test 3: Responsive Design

### Desktop (≥1024px)
```
✓ Two-column layout on View page
✓ Two-column grid in Edit form
✓ All content visible without horizontal scroll
✓ Sidebar displays on right side
```

### Tablet (768px - 1023px)
```
✓ Layout adjusts appropriately
✓ Touch targets are adequate size
✓ Forms still usable
```

### Mobile (<768px)
```
✓ Single column layout
✓ All content stacked vertically
✓ Edit form fields stack (single column)
✓ Buttons are full-width or properly sized
✓ No horizontal overflow
```

**How to Test:**
```
1. Open Chrome DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Test these viewport sizes:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1920px)
```

---

## Test 4: Navigation & Integration

### From Dashboard to Profile
```
1. Go to /alumni/dashboard
2. Click "Update Profile" button
3. Should navigate to /alumni/profile/edit
```

### From Profile View to Edit
```
1. Go to /alumni/profile/view
2. Click "Edit Profile" (header or sidebar)
3. Should navigate to /alumni/profile/edit
```

### From Profile Edit to View
```
1. Go to /alumni/profile/edit
2. Make changes and save
3. Should redirect to /alumni/profile/view
4. Changes should be visible
```

### Sidebar Navigation
```
1. From any profile page, click sidebar links
2. Dashboard link should work
3. Settings link should work
4. All navigation should be smooth (no full page reload)
```

---

## Test 5: API Endpoint Testing (Optional)

### Using Browser DevTools

**Open Network Tab (F12 → Network)**

**Test GET /api/v1/alumni/profile:**
```
1. Go to Profile View page
2. Check Network tab
3. Find request to /api/v1/alumni/profile
4. Status should be 200 OK
5. Response should contain full profile data
6. Check completion_percentage is calculated
```

**Test PUT /api/v1/alumni/profile:**
```
1. Edit profile and save
2. Check Network tab
3. Find PUT request to /api/v1/alumni/profile
4. Status should be 200 OK
5. Request payload should contain updated fields
6. Response should show success message
```

### Using cURL (Advanced)

**Get Profile:**
```bash
curl -X GET http://localhost:8000/api/v1/alumni/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

**Update Profile:**
```bash
curl -X PUT http://localhost:8000/api/v1/alumni/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "first_name": "Updated",
    "last_name": "Name",
    "phone": "+1234567890",
    "career_goals": "Test goals"
  }'
```

---

## Test 6: Profile Completion Tracking

### Test Completion Percentage
```
1. Go to Profile View
2. Note current completion percentage
3. Go to Edit Profile
4. Fill in empty fields
5. Save profile
6. Return to Profile View
7. Completion percentage should increase
```

### Test Progress Bar
```
✓ Progress bar shows visual percentage
✓ Color changes based on completion:
  - Red/Orange for <50%
  - Yellow for 50-80%
  - Green for >80%
✓ Alert shows if profile incomplete
```

---

## ✅ Expected Results Summary

| Test | Expected Result |
|------|----------------|
| Profile View loads | All cards display with correct data |
| Edit form pre-populates | All fields show current values |
| Save updates profile | Success message, redirects, data persists |
| Validation works | Errors show for invalid inputs |
| Cancel discards changes | Navigates back without saving |
| Responsive on mobile | Single column, no overflow |
| Responsive on tablet | Proper layout, touch-friendly |
| Responsive on desktop | Two-column layout, optimal use of space |
| Navigation works | All links navigate correctly |
| Completion tracks | Percentage updates when fields filled |

---

## 🐛 Common Issues & Solutions

### Issue: "Profile not found"
```
Solution: Make sure user has an alumni_profile record
Check: SELECT * FROM alumni_profiles WHERE user_id = YOUR_USER_ID
```

### Issue: Fields not pre-populating
```
Solution: Check console for API errors
Verify: GET /api/v1/alumni/profile returns data
```

### Issue: Save not working
```
Solution: Check Network tab for API response
Look for: Validation errors in response body
Verify: PUT request is being sent with correct data
```

### Issue: Completion percentage is 0%
```
Solution: Profile might be completely empty
Try: Fill in first name, last name, and degree program
Expected: Should jump to ~15-20%
```

### Issue: Skills/certifications not displaying
```
Solution: Check if data is array in database
Format: Should be stored as JSON array
Example: ["JavaScript", "Python", "React"]
```

---

## 📝 Test Results Template

Copy and fill this out:

```
Date: ___________
Tester: ___________

[ ] Profile View loads correctly
[ ] All sections display data properly
[ ] Edit form pre-populates
[ ] Can update personal information
[ ] Can update academic information
[ ] Can update employment information
[ ] Can update skills and career goals
[ ] Form validation works
[ ] Save functionality works
[ ] Cancel button works
[ ] Navigation works correctly
[ ] Responsive on mobile
[ ] Responsive on tablet
[ ] Responsive on desktop
[ ] Profile completion updates
[ ] No console errors
[ ] No visual bugs

Issues Found:
1. _______________________________
2. _______________________________
3. _______________________________

Overall Status: [ ] Pass  [ ] Fail  [ ] Needs Fixes
```

---

## 🎯 Next Steps After Testing

If all tests pass:
1. ✅ Mark Profile section as complete
2. ✅ Update documentation with any findings
3. ✅ Move to next feature (Career Timeline or Education History)
4. ✅ Consider user acceptance testing with real alumni

If issues found:
1. 🔧 Document issues in detail
2. 🔧 Prioritize by severity
3. 🔧 Fix critical issues first
4. 🔧 Re-test after fixes

---

**Happy Testing! 🚀**
