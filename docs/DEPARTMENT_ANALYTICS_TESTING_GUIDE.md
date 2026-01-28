# Department Analytics - Testing Guide

**Date:** December 12, 2025  
**Feature:** Expandable Department Analytics  
**Status:** Ready for Testing

---

## 🧪 TESTING STEPS

### Prerequisites
- ✅ Backend server running (XAMPP Apache & MySQL)
- ✅ Frontend built successfully (npm run build)
- ✅ Logged in as Super Admin
- ✅ At least one active department exists

---

## 📋 Test Scenario 1: Basic Functionality

### Step 1: Navigate to Department Management
```
URL: http://localhost/super-admin/departments
```

**Expected Result:**
- Page loads successfully
- Department cards displayed in grid
- Each card shows basic info (logo, name, courses, alumni count)

---

### Step 2: Locate Analytics Button
**Look for:**
- Button with text "View Analytics"
- Bar chart icon (📊)
- Located between stats and action buttons
- Maroon/red text color
- Chevron down icon (▼)

**Expected Result:**
- Button visible on all active departments
- Button NOT visible on deleted departments
- Hover effect changes background to light maroon

---

### Step 3: Click Analytics Button
**Action:** Click "View Analytics" button

**Expected Result:**
- Smooth expansion animation (300ms)
- Section expands to reveal analytics
- Loading spinner appears briefly
- Chevron rotates 180° (now pointing up ▲)
- Light gray background (bg-gray-50)

---

### Step 4: Verify Analytics Data

**Expected Sections (in order):**

#### 1. Employment Stats (Green Icon 💼)
```
┌──────────────────────────┐
│ 💼 Employment            │
│ • Employment Rate: 85%   │
│ • Avg Time: 120 days     │
└──────────────────────────┘
```
- Green briefcase icon
- White background with border
- Two rows of data
- Percentage displayed in green

#### 2. Survey Engagement (Blue Icon 📋)
```
┌──────────────────────────┐
│ 📋 Survey Engagement     │
│ • Response Rate: 68%     │
│ • Completed: 312/456     │
└──────────────────────────┘
```
- Blue activity icon
- White background with border
- Two rows of data
- Percentage displayed in blue

#### 3. Alumni Activity (Purple Icon 👥)
```
┌──────────────────────────┐
│ 👥 Alumni Activity       │
│ • Active: 51.3%          │
│ • Recent Logins: 156     │
│ • Profile Avg: 78.5%     │
└──────────────────────────┘
```
- Purple user-check icon
- White background with border
- Three rows of data
- Percentage displayed in purple

#### 4. Growth Trends (Orange Icon 📈)
```
┌──────────────────────────┐
│ 📈 Growth Trends         │
│ • New (6m): 45           │
│ • Batches: 15            │
└──────────────────────────┘
```
- Orange clock icon
- White background with border
- Two rows of data
- Count displayed in orange

---

### Step 5: Collapse Analytics
**Action:** Click "View Analytics" button again

**Expected Result:**
- Smooth collapse animation (300ms)
- Section shrinks to zero height
- Chevron rotates back down (▼)
- Returns to original card height

---

### Step 6: Expand Again (Cache Test)
**Action:** Click "View Analytics" button once more

**Expected Result:**
- Instant expansion (no loading spinner)
- Data appears immediately
- Same data as before (cached)
- Animation still smooth

---

## 📋 Test Scenario 2: Multiple Departments

### Step 1: Expand First Department
**Action:** Click analytics on Department A

**Expected Result:**
- Department A analytics expand
- Other departments remain collapsed

---

### Step 2: Expand Second Department
**Action:** Click analytics on Department B (without closing A)

**Expected Result:**
- Department A collapses automatically
- Department B expands
- Only one analytics section open at a time

---

### Step 3: Verify Data Differences
**Action:** Compare analytics between departments

**Expected Result:**
- Each department shows its own data
- Numbers are different per department
- No data mixing between departments

---

## 📋 Test Scenario 3: Error Handling

### Step 1: Disconnect Internet (Optional)
**Action:** Turn off network connection

**Expected Result:**
- Error alert appears
- Analytics section shows "No analytics data available"
- Page doesn't crash

---

### Step 2: Department with No Alumni
**Action:** Find/create department with 0 alumni

**Expected Result:**
- Analytics still loads
- Shows 0% or 0 counts
- No division-by-zero errors

---

## 📋 Test Scenario 4: Performance

### Step 1: Rapid Toggle Test
**Action:** Click analytics button 10 times rapidly

**Expected Result:**
- Animations complete smoothly
- No lag or freezing
- No duplicate API calls
- Final state matches last click

---

### Step 2: Check Network Tab
**Action:** Open browser DevTools → Network tab

**Expected Result:**
- First expansion: 1 API call to `/api/v1/admin/departments/{id}/analytics`
- Subsequent expansions: 0 API calls (cached)
- Response time < 1 second
- Status code: 200 OK

---

## 📋 Test Scenario 5: Responsive Design

### Desktop View (1920x1080)
**Expected:**
- 3 cards per row
- Analytics sections fit well
- All text readable
- No horizontal scroll

### Tablet View (768x1024)
**Expected:**
- 2 cards per row
- Analytics sections stack properly
- Icons and text scaled appropriately

### Mobile View (375x667)
**Expected:**
- 1 card per row
- Analytics sections stack vertically
- Text doesn't overflow
- Touch targets large enough

---

## 🔍 INSPECTION CHECKLIST

### Visual Elements
- [ ] Bar chart icon displays correctly
- [ ] Chevron rotates on toggle
- [ ] Four colored stat sections present
- [ ] Icons match colors (green, blue, purple, orange)
- [ ] Text is readable on all backgrounds
- [ ] Border and spacing consistent

### Functionality
- [ ] Button clickable across entire surface
- [ ] Expansion animation smooth
- [ ] Collapse animation smooth
- [ ] Loading spinner shows during fetch
- [ ] Data displays after loading
- [ ] Cache prevents re-fetching

### Data Accuracy
- [ ] Employment rate is realistic (0-100%)
- [ ] Survey counts make sense
- [ ] Active alumni count ≤ total alumni
- [ ] Profile completion percentage valid
- [ ] All numbers are properly formatted

---

## 🐛 COMMON ISSUES & FIXES

### Issue: Button not clickable
**Possible Cause:** z-index or pointer-events problem  
**Fix:** Check z-index is set to z-20, pointer-events-auto on button

### Issue: No data showing
**Possible Cause:** API endpoint not returning data  
**Fix:** Check browser console for errors, verify API route exists

### Issue: Animation choppy
**Possible Cause:** Too many re-renders  
**Fix:** Verify state updates are optimized, check React DevTools

### Issue: Data not caching
**Possible Cause:** State not persisting  
**Fix:** Check `analyticsData` state structure, verify condition in fetch function

### Issue: Spinner doesn't stop
**Possible Cause:** Loading state not clearing  
**Fix:** Check finally block in fetch function, verify error handling

---

## ✅ SUCCESS CRITERIA

- [x] Build completes without errors
- [ ] Analytics button appears on all active departments
- [ ] Clicking expands analytics smoothly
- [ ] All 4 stat sections display with correct data
- [ ] Clicking again collapses smoothly
- [ ] Second expansion uses cached data (instant)
- [ ] Only one department analytics open at a time
- [ ] No console errors
- [ ] Responsive on all screen sizes
- [ ] Performance is smooth (no lag)

---

## 📸 VISUAL REFERENCE

### Collapsed State
```
┌─────────────────────────────────────┐
│ [Department Background Image]       │
│ BSIT                                │
│ Information Technology              │
│                                     │
│ Description text here...            │
│                                     │
│ ┌──────┐  ┌──────┐                 │
│ │  12  │  │ 456  │                 │
│ │Courses│ │Alumni│                 │
│ └──────┘  └──────┘                 │
│                                     │
│ [📊 View Analytics ▼]              │
│                                     │
│ [View][Settings][Edit][Delete]      │
└─────────────────────────────────────┘
```

### Expanded State
```
┌─────────────────────────────────────┐
│ [Department Background Image]       │
│ BSIT                                │
│ Information Technology              │
│                                     │
│ ┌──────┐  ┌──────┐                 │
│ │  12  │  │ 456  │                 │
│ └──────┘  └──────┘                 │
│                                     │
│ [📊 View Analytics ▲]              │
│ ┌───────────────────────────────┐  │
│ │ 💼 Employment                 │  │
│ │ • Rate: 85%                   │  │
│ │ • Time: 120 days              │  │
│ ├───────────────────────────────┤  │
│ │ 📋 Survey Engagement          │  │
│ │ • Response: 68%               │  │
│ │ • Completed: 312/456          │  │
│ ├───────────────────────────────┤  │
│ │ 👥 Alumni Activity            │  │
│ │ • Active: 51.3%               │  │
│ │ • Logins: 156                 │  │
│ │ • Profile: 78.5%              │  │
│ ├───────────────────────────────┤  │
│ │ 📈 Growth Trends              │  │
│ │ • New: 45                     │  │
│ │ • Batches: 15                 │  │
│ └───────────────────────────────┘  │
│                                     │
│ [View][Settings][Edit][Delete]      │
└─────────────────────────────────────┘
```

---

## 📝 TEST RESULTS LOG

**Date:** __________  
**Tester:** __________  
**Browser:** __________

| Test | Status | Notes |
|------|--------|-------|
| Page loads | ⬜ | |
| Button visible | ⬜ | |
| Expansion works | ⬜ | |
| Data displays | ⬜ | |
| Collapse works | ⬜ | |
| Cache works | ⬜ | |
| Performance good | ⬜ | |
| No errors | ⬜ | |

**Overall Result:** ⬜ PASS / ⬜ FAIL

**Additional Comments:**
_________________________________
_________________________________
_________________________________

---

**Ready to Test!** 🚀
