# Employment Record Versioning & Support System Implementation

## Overview
This document describes the new features implemented for the Alumni Tracer System:
1. Employment Record Versioning/Archiving System
2. Alumni Association Contact Feature
3. Customer Support Ticket System

---

## 1. Employment Record Versioning System

### Database Changes
- **Migration**: `2025_01_15_000001_add_soft_deletes_to_career_history_and_create_versions_table.php`
  - Added soft deletes (`deleted_at`, `archived_reason`) to `career_history` table
  - Created `career_history_versions` table to track all changes

### New Model
- **CareerHistoryVersion** (`app/Models/CareerHistoryVersion.php`)
  - Stores snapshots of career records at each version
  - Tracks action type: created, updated, archived, restored
  - Records who made the modification and when
  - Stores changes made (diff from previous version)

### Updated Model
- **CareerHistory** (`app/Models/CareerHistory.php`)
  - Added `SoftDeletes` trait
  - Added `versions()` relationship
  - Added `archive()` and `restoreRecord()` methods
  - Added `getChanges()` method for tracking modifications

### Controller Updates
- **CareerController** (`app/Http/Controllers/Alumni/CareerController.php`)
  - `store()`: Creates initial version snapshot
  - `update()`: Creates version snapshot before updating (if changes detected)
  - `destroy()`: Archives instead of deleting, creates archived version
  - `restore()`: New method to restore archived records
  - `archived()`: New method to view archived positions

### Frontend Changes
- **Timeline.tsx**: 
  - Changed delete button to archive button
  - Added archive confirmation modal with reason field
  - Added "View Archived" link

- **Archived.tsx** (new file):
  - Lists archived career positions
  - Allows restoring archived positions

### Routes
```php
GET  /alumni/career/archived           - View archived positions
POST /alumni/career/{id}/restore       - Restore archived position
```

### Admin Features
- **CareerVersionController** (`app/Http/Controllers/Admin/CareerVersionController.php`)
  - Lists all users with career history
  - View user's complete career history (active + archived)
  - View version history for any career record
  - Admin can restore or permanently delete records

- **Admin Pages** (`resources/js/pages/Admin/CareerVersions/`):
  - `Index.tsx`: List all alumni with career data
  - `Show.tsx`: View specific user's career history
  - `Versions.tsx`: View complete version history timeline

### Admin Routes
```php
GET  /super-admin/career-versions                      - List users
GET  /super-admin/career-versions/user/{userId}        - View user's careers
GET  /super-admin/career-versions/career/{careerId}    - View version history
POST /api/v1/admin/super-admin/career-versions/career/{careerId}/restore
DELETE /api/v1/admin/super-admin/career-versions/career/{careerId}/force
```

---

## 2. Alumni Association Contact Feature

### Location
- **Help.tsx** (`resources/js/pages/Alumni/Help.tsx`)

### Features
- Prominent Alumni Association contact card with:
  - Email: alumni@earist.edu.ph
  - Phone: (02) 8735-6161 local 215
  - Office location and hours
  - Social media links
  - Direct button to create support ticket for alumni association

### Contact Information
- Office: Alumni Relations Office, 2nd Floor, Admin Building, EARIST Main Campus
- Hours: Mon-Fri 8AM-5PM, Sat 8AM-12PM

---

## 3. Customer Support Ticket System

### Database Changes
- **Migration**: `2025_01_15_000002_create_support_tickets_table.php`
  - Created `support_tickets` table
  - Created `support_ticket_replies` table

### New Models
- **SupportTicket** (`app/Models/SupportTicket.php`)
  - Auto-generates ticket numbers (TKT-YYYY-XXXXXX)
  - Categories: general, technical, account, employment, alumni_association, other
  - Status: open, in_progress, resolved, closed
  - Priority: low, medium, high, urgent

- **SupportTicketReply** (`app/Models/SupportTicketReply.php`)
  - Tracks replies from users and admins
  - `is_admin_reply` flag distinguishes staff responses

### Controller
- **SupportController** (`app/Http/Controllers/Alumni/SupportController.php`)
  - `index()`: List user's tickets
  - `show()`: View ticket details and conversation
  - `store()`: Create new ticket
  - `reply()`: Add reply to ticket
  - `close()`: Close ticket

### Frontend Pages
- **Index.tsx** (`resources/js/pages/Alumni/Support/Index.tsx`):
  - Lists all user's support tickets
  - Shows ticket status and counts

- **Show.tsx** (`resources/js/pages/Alumni/Support/Show.tsx`):
  - View ticket details
  - Conversation thread
  - Add replies
  - Close ticket

### Routes
```php
GET  /alumni/support                     - List tickets
GET  /alumni/support/{ticketNumber}      - View ticket
POST /alumni/support/ticket              - Create ticket
POST /alumni/support/{ticketNumber}/reply - Reply to ticket
POST /alumni/support/{ticketNumber}/close - Close ticket
```

---

## Usage Notes

### For Alumni Users
1. **Archiving Career Records**: When you click the archive button, the record is soft-deleted and a version is saved. You can restore it anytime from the "View Archived" link.

2. **Contacting Alumni Association**: Visit Help & Support page and use the prominent contact card or submit a support ticket.

3. **Support Tickets**: Create tickets from the Help page, then track them at `/alumni/support`.

### For Administrators
1. **Career Version History**: Navigate to Super Admin → Career Versions to:
   - See all alumni with career data
   - View complete history of any career record
   - Restore archived records
   - Permanently delete if necessary

2. **Support Ticket Management**: (Future enhancement - admin interface for managing tickets)

---

## Migration Commands

To apply these changes, run:
```bash
php artisan migrate
```

The migrations will:
1. Add soft delete columns to career_history table
2. Create career_history_versions table
3. Create support_tickets table
4. Create support_ticket_replies table
