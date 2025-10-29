# Browser Cache Clearing Guide - Alumni Portal

## Issue: Seeing 404 or Old Version After Code Updates

When you see errors like "404 NOT FOUND" or old code behavior after running `npm run build`, it means your **browser is serving cached (old) JavaScript files** instead of the new ones.

---

## Quick Solutions

### ✅ Solution 1: Hard Refresh (Fastest)
**Windows/Linux:**
- Press: `Ctrl + Shift + R`
- Or: `Ctrl + F5`

**Mac:**
- Press: `Cmd + Shift + R`

This forces the browser to bypass cache and download fresh files.

---

### ✅ Solution 2: DevTools Clear Cache (Most Reliable)

1. **Open Developer Tools**
   - Press `F12`
   - Or right-click → "Inspect"

2. **Open Network Tab**
   - Click "Network" tab

3. **Disable Cache**
   - Check the "Disable cache" checkbox
   - Keep DevTools open while browsing

4. **Empty Cache and Hard Reload**
   - Right-click the refresh button (⟳)
   - Select "Empty Cache and Hard Reload"

---

### ✅ Solution 3: Clear Browser Data

**Chrome/Edge:**
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Time range: "All time"
4. Click "Clear data"

**Firefox:**
1. Press `Ctrl + Shift + Delete`
2. Select "Cache"
3. Click "Clear Now"

---

### ✅ Solution 4: Incognito/Private Mode (Testing)

**Chrome/Edge:** `Ctrl + Shift + N`  
**Firefox:** `Ctrl + Shift + P`

Navigate to `localhost:8000` in the private window. This ensures zero caching.

---

## Why This Happens

### Browser Caching Explained

1. **First Visit:**
   - Browser downloads `Edit-ABC123.js`
   - Stores it in cache for faster loading

2. **You Run `npm run build`:**
   - Vite generates NEW file: `Edit-YQ1SUmtO.js`
   - Old file `Edit-ABC123.js` is deleted

3. **You Refresh Page:**
   - Browser still has old `Edit-ABC123.js` in cache
   - Doesn't realize new file exists
   - Serves old broken code → 404 or errors

### Vite Content Hashing

Vite generates files with **content hashes** (random strings):
```
Edit-YQ1SUmtO.js    ← New version
Edit-ABC123.js      ← Old version (deleted)
```

The hash changes every time code changes, so browsers know to fetch new files. **But only if cache is cleared!**

---

## Best Practices for Development

### 1. Keep DevTools Open with Cache Disabled
- Press `F12` → Network tab → Check "Disable cache"
- Cache will be disabled while DevTools is open

### 2. Use Incognito for Testing Major Changes
- No cache, no cookies, no extensions
- Fresh environment every time

### 3. After Every Build, Hard Refresh
```bash
npm run build
```
Then: `Ctrl + Shift + R` in browser

### 4. Check Build Output
After `npm run build`, verify the new hash:
```
✓ built in 4.35s
public/build/assets/Edit-YQ1SUmtO.js    ← Note the new hash!
```

---

## Verifying Cache is Cleared

### Check Network Tab:
1. Open DevTools (`F12`)
2. Go to "Network" tab
3. Refresh page
4. Look for `Edit-*.js` requests
5. Should show **"200"** (not "304 Not Modified")
6. "Size" column should show actual file size (not "disk cache")

### Check Console:
If you see errors like:
```
Failed to load resource: net::ERR_FILE_NOT_FOUND
Edit-ABC123.js:1 404 Not Found
```
This means browser is trying to load old cached filename!

---

## Server-Side Cache Clearing

Sometimes Laravel also caches files. After making PHP changes, run:

```bash
php artisan optimize:clear
```

This clears:
- Config cache
- Route cache  
- View cache
- Compiled cache

---

## Common Scenarios

| Symptom | Cause | Solution |
|---------|-------|----------|
| 404 NOT FOUND on page | Browser loading old JS file | Hard refresh (`Ctrl+Shift+R`) |
| Old button text/layout | CSS cache | Clear cache + hard refresh |
| JavaScript errors in console | Mixed old/new files | Clear all cache |
| "Cancel" button missing | Old Edit.tsx cached | DevTools → Empty cache |
| API works but UI broken | Frontend cache only | Just clear browser cache |

---

## Production Deployment

For production environments:

### 1. Version URLs (Already Done!)
Vite's content hashing ensures users get new files:
```html
<!-- Old -->
<script src="/assets/Edit-ABC123.js"></script>

<!-- New (after build) -->
<script src="/assets/Edit-YQ1SUmtO.js"></script>
```

### 2. Set Cache Headers (Optional)
In `public/.htaccess`:
```apache
# Cache static assets for 1 year
<FilesMatch "\.(js|css|png|jpg|gif|svg|woff2)$">
    Header set Cache-Control "max-age=31536000, public"
</FilesMatch>

# Don't cache HTML
<FilesMatch "\.(html|htm|php)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
</FilesMatch>
```

### 3. Service Worker (Advanced)
Consider adding service worker to manage cache updates automatically.

---

## Troubleshooting Checklist

When you see unexpected behavior after `npm run build`:

- [ ] Did you run `npm run build` successfully? (Check for errors)
- [ ] Did you hard refresh browser? (`Ctrl+Shift+R`)
- [ ] Did you clear browser cache completely?
- [ ] Did you try in Incognito mode?
- [ ] Did you run `php artisan optimize:clear`?
- [ ] Did you check Network tab for 404s on JS files?
- [ ] Did you verify new file hash in `public/build/manifest.json`?
- [ ] Did you close all browser tabs and reopen?

---

## Quick Reference Commands

```bash
# Build frontend
npm run build

# Clear Laravel cache
php artisan optimize:clear

# Check routes
php artisan route:list --path=alumni

# View build manifest
cat public/build/manifest.json

# Check last build time
ls -la public/build/assets/Edit-*.js
```

---

## For Your Specific Issue

**You're seeing "404 NOT FOUND" on Edit Profile page because:**

1. You have the old cached version of `Edit.tsx` in your browser
2. That old version has the broken Cancel button (missing `</Button>`)
3. The broken JSX causes the page to fail rendering

**The fix is ready, you just need to load it:**

```bash
✅ Code fixed in: resources/js/pages/Alumni/Profile/Edit.tsx
✅ Built successfully: public/build/assets/Edit-YQ1SUmtO.js
❌ Your browser: Still loading old Edit-ABC123.js (cached)
```

**Solution:**
1. Press `Ctrl + Shift + R` (hard refresh)
2. Or open DevTools (`F12`) → Right-click refresh → "Empty Cache and Hard Reload"

---

**Last Updated:** October 16, 2025  
**Related:** ALUMNI_SURVEYS_BUG_FIXES.md
