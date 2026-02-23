# Landing Page CMS - Quick Reference

## Access

**Admin Page:** `/admin/landing-content`  
**API Endpoint (Public):** `/api/v1/public/content`  
**API Endpoints (Admin):** `/api/v1/admin/landing-content/*`

---

## Content Types

| Type | Icon | Use Case |
|------|------|----------|
| **hero** | ⭐ | Full-width hero sections with media and text |
| **video** | 🎥 | Embedded video players (YouTube/Vimeo or uploaded) |
| **image** | 🖼️ | Image display with optional gallery |
| **text** | 📄 | Rich text content sections |
| **carousel** | 🎠 | Image carousel with navigation |
| **stats** | 📊 | Statistics grid with numbers and icons |
| **testimonial** | 💬 | Quote cards with attribution |
| **feature** | ✨ | Feature lists with icons |
| **custom** | 📦 | Generic content blocks |

---

## Layout Options

- **contained**: Boxed content (max-width constrained)
- **full_width**: Edge-to-edge display
- **two_column**: 2-column grid
- **three_column**: 3-column grid
- **grid**: Flexible grid layout

---

## Quick Actions

### Create Content
1. Click "Add Content" button
2. Fill in title and description
3. Select content type
4. Add media (URL or file path)
5. Enter content (HTML supported)
6. Set display order
7. Toggle Published/Active
8. Save

### Reorder Content
- Use up/down arrows next to each item
- Changes saved immediately

### Toggle Publish
- Click eye icon
- Automatically sets/unsets `published_at`

### Edit Content
- Click edit icon
- Modify fields
- Save changes

### Delete Content
- Click delete icon
- Confirm deletion
- Soft delete (recoverable)

---

## API Examples

### Get All Content (Public)
```bash
GET /api/v1/public/content
```

### Filter by Campus
```bash
GET /api/v1/public/content?campus_id=1
```

### Filter by Type
```bash
GET /api/v1/public/content?content_type=hero
```

### Create Content (Admin)
```bash
POST /api/v1/admin/landing-content
Content-Type: application/json
X-CSRF-TOKEN: {token}

{
  "title": "Welcome Section",
  "content_type": "hero",
  "layout": "full_width",
  "is_published": true
}
```

### Update Content (Admin)
```bash
PUT /api/v1/admin/landing-content/1
Content-Type: application/json
X-CSRF-TOKEN: {token}

{
  "title": "Updated Title"
}
```

### Reorder Content (Admin)
```bash
POST /api/v1/admin/landing-content/reorder
Content-Type: application/json
X-CSRF-TOKEN: {token}

{
  "items": [
    { "id": 1, "display_order": 0 },
    { "id": 2, "display_order": 1 }
  ]
}
```

---

## Database Quick Reference

### Table: `landing_page_contents`

**Required Fields:**
- `title` (string)
- `content_type` (enum)
- `layout` (enum, default: 'contained')
- `display_order` (int, default: 0)

**Common Optional Fields:**
- `description` (text)
- `media_url` (text) - External video/media URL
- `media_file` (string) - Uploaded file path
- `content` (longText) - HTML content
- `section_id` (string) - For scroll anchoring
- `campus_id` (int) - Campus targeting
- `is_multi_campus` (bool) - Show across all campuses
- `is_published` (bool) - Publishing status
- `published_at` (timestamp)
- `expires_at` (timestamp)

**Computed Fields:**
- `media_file_url` - Prepends `/storage/` to `media_file`
- `thumbnail_url` - Prepends `/storage/` to `thumbnail`

---

## Model Scopes

```php
// Get active content
LandingContent::active()->get();

// Get published content
LandingContent::published()->get();

// Get ordered content
LandingContent::ordered()->get();

// Get campus-specific content
LandingContent::forCampus($campusId)->get();

// Combine scopes
LandingContent::active()
    ->published()
    ->forCampus(1)
    ->ordered()
    ->get();
```

---

## Permissions

**Roles with Access:**
- admin
- super_admin
- counselor

**Required Middleware:**
- `auth` (authenticated users only)
- `admin` (admin role check)

---

## Common Use Cases

### 1. Hero Banner
```php
Content Type: hero
Layout: full_width
Media URL: https://youtube.com/...
Content: <h1>Welcome!</h1><p>Description</p>
Background Color: #800000
```

### 2. Statistics Section
```php
Content Type: stats
Layout: grid
Metadata: {"alumni": 5000, "employed": 4500}
```

### 3. Video Section
```php
Content Type: video
Media URL: https://youtube.com/watch?v=...
Thumbnail: landing/video-thumb.jpg
```

### 4. Image Gallery
```php
Content Type: carousel
Gallery Images: ["img1.jpg", "img2.jpg", "img3.jpg"]
```

### 5. Text Section
```php
Content Type: text
Layout: contained
Content: <p>Rich text content here...</p>
```

---

## Troubleshooting

### Content Not Showing
- Check `is_published` = true
- Check `is_active` = true
- Check `published_at` <= now
- Check `expires_at` > now (or null)
- Verify campus filtering

### Reorder Not Working
- Ensure at least 2 items exist
- Check for JavaScript console errors
- Verify API endpoint is accessible

### Form Validation Errors
- Title is required
- Content type must be valid enum
- Layout must be valid enum
- Display order must be integer

### Permission Denied
- Verify user has admin/counselor/super_admin role
- Check authentication status
- Ensure CSRF token is valid

---

## Performance Tips

1. **Use Caching:**
   ```php
   $content = Cache::remember('landing_content', 3600, function () {
       return LandingContent::active()->published()->ordered()->get();
   });
   ```

2. **Limit Queries:**
   - Use pagination
   - Apply filters early
   - Use eager loading for relationships

3. **Optimize Images:**
   - Compress before upload
   - Use appropriate sizes
   - Consider lazy loading

4. **Index Usage:**
   - Queries automatically use indexes on (is_active, is_published, display_order)
   - Campus filtering uses index on campus_id

---

## Migration Commands

```bash
# Run migration
php artisan migrate

# Check status
php artisan migrate:status

# Rollback (if needed)
php artisan migrate:rollback --step=1

# Fresh migration (DANGER: drops all tables)
php artisan migrate:fresh
```

---

## Maintenance Tasks

### Weekly Review
```sql
-- Check draft content
SELECT id, title, created_at 
FROM landing_page_contents 
WHERE is_published = 0 
ORDER BY created_at DESC;

-- Check expired content
SELECT id, title, expires_at 
FROM landing_page_contents 
WHERE expires_at < NOW() 
  AND is_published = 1;
```

### Cleanup Soft Deleted
```bash
php artisan tinker

# Delete content older than 30 days
App\Models\LandingContent::onlyTrashed()
    ->where('deleted_at', '<', now()->subDays(30))
    ->forceDelete();
```

---

## File Structure

```
app/
├── Http/Controllers/Api/
│   ├── LandingContentController.php (Admin API)
│   └── PublicLandingController.php (Public API)
└── Models/
    └── LandingContent.php

database/migrations/
└── 2026_02_16_000001_create_landing_page_contents_table.php

resources/js/
└── pages/admin/
    └── LandingContentManagement.tsx

routes/
├── api.php (API routes)
└── web.php (Web routes)

docs/
├── LANDING_PAGE_CMS_IMPLEMENTATION.md (Full guide)
└── LANDING_PAGE_CMS_QUICK_REFERENCE.md (This file)
```

---

## Support

**Documentation:** See `docs/LANDING_PAGE_CMS_IMPLEMENTATION.md`  
**Issues:** Check error logs in `storage/logs/laravel.log`  
**Database:** Check `landing_page_contents` table

---

**Last Updated:** February 16, 2026  
**Version:** 1.0
