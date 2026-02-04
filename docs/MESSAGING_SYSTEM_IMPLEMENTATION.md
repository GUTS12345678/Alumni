# Messaging System Implementation Guide

**Created:** February 2, 2026  
**Status:** In Progress  
**Technology:** Laravel Reverb (WebSocket) + Laravel Echo (Frontend)

---

## 📋 Overview

A real-time messaging system enabling:
- Alumni-to-Alumni direct messages
- Alumni-to-Admin support requests (general inbox)
- Admin-to-Alumni/Admin messaging
- Group chats with invite system
- Admin broadcast announcements to batches/departments

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     MESSAGING ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    WebSocket (wss://)   ┌────────────────┐   │
│  │   Browser    │◄───────────────────────►│ Laravel Reverb │   │
│  │   (React +   │                         │  (Port 8080)   │   │
│  │  Laravel Echo)│                         │                │   │
│  └──────┬───────┘                         └───────┬────────┘   │
│         │                                         │             │
│         │ HTTP/API                                │ Events      │
│         ▼                                         ▼             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    XAMPP Apache                          │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │              Laravel Application                 │    │   │
│  │  │  ┌───────────┐  ┌────────┐  ┌────────────────┐ │    │   │
│  │  │  │Controllers│  │ Events │  │ Broadcasting   │ │    │   │
│  │  │  └───────────┘  └────────┘  └────────────────┘ │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│                             ▼                                   │
│                    ┌─────────────────┐                         │
│                    │  MySQL Database │                         │
│                    └─────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Tables Overview

```sql
-- 1. conversations
-- Stores chat threads (DM or Group)
CREATE TABLE conversations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('direct', 'group', 'support') DEFAULT 'direct',
    name VARCHAR(255) NULL,              -- For group chats
    description TEXT NULL,               -- Group description
    avatar_path VARCHAR(255) NULL,       -- Group avatar
    created_by BIGINT UNSIGNED,          -- User who created
    is_support_ticket BOOLEAN DEFAULT FALSE,
    support_status ENUM('open', 'in_progress', 'resolved', 'closed') NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 2. conversation_participants
-- Links users to conversations
CREATE TABLE conversation_participants (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    conversation_id BIGINT UNSIGNED,
    user_id BIGINT UNSIGNED,
    role ENUM('member', 'admin', 'owner') DEFAULT 'member',
    nickname VARCHAR(255) NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP NULL,
    last_read_at TIMESTAMP NULL,
    is_muted BOOLEAN DEFAULT FALSE,
    invitation_status ENUM('pending', 'accepted', 'declined') DEFAULT 'accepted',
    invited_by BIGINT UNSIGNED NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_participant (conversation_id, user_id)
);

-- 3. messages
-- Individual messages
CREATE TABLE messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    conversation_id BIGINT UNSIGNED,
    sender_id BIGINT UNSIGNED,
    content TEXT,
    type ENUM('text', 'image', 'file', 'system') DEFAULT 'text',
    attachments JSON NULL,               -- [{name, path, size, mime_type}]
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP NULL,
    reply_to_id BIGINT UNSIGNED NULL,    -- For reply threads
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP NULL,           -- Soft delete
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_id) REFERENCES messages(id) ON DELETE SET NULL
);

-- 4. message_reads
-- Track who read each message
CREATE TABLE message_reads (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    message_id BIGINT UNSIGNED,
    user_id BIGINT UNSIGNED,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_read (message_id, user_id)
);

-- 5. blocked_users
-- User blocking
CREATE TABLE blocked_users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED,             -- User who blocked
    blocked_user_id BIGINT UNSIGNED,     -- User who is blocked
    reason VARCHAR(255) NULL,
    created_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_block (user_id, blocked_user_id)
);

-- 6. announcements
-- Admin broadcast messages
CREATE TABLE announcements (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255),
    content TEXT,
    type ENUM('general', 'batch', 'department', 'course') DEFAULT 'general',
    target_filters JSON NULL,            -- {batch_ids: [], department_ids: [], course_ids: []}
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    created_by BIGINT UNSIGNED,
    scheduled_at TIMESTAMP NULL,
    published_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    status ENUM('draft', 'scheduled', 'published', 'expired') DEFAULT 'draft',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 7. announcement_reads
-- Track who read announcements
CREATE TABLE announcement_reads (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    announcement_id BIGINT UNSIGNED,
    user_id BIGINT UNSIGNED,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_announcement_read (announcement_id, user_id)
);
```

---

## 📁 File Structure

### Backend (Laravel)

```
app/
├── Events/
│   ├── MessageSent.php
│   ├── MessageRead.php
│   ├── ConversationCreated.php
│   ├── ParticipantJoined.php
│   ├── ParticipantLeft.php
│   ├── UserTyping.php
│   └── AnnouncementPublished.php
├── Http/
│   └── Controllers/
│       ├── Api/
│       │   └── V1/
│       │       ├── ConversationController.php
│       │       ├── MessageController.php
│       │       ├── BlockedUserController.php
│       │       └── AnnouncementController.php
│       └── Alumni/
│           └── MessageController.php
├── Models/
│   ├── Conversation.php
│   ├── ConversationParticipant.php
│   ├── Message.php
│   ├── MessageRead.php
│   ├── BlockedUser.php
│   ├── Announcement.php
│   └── AnnouncementRead.php
└── Policies/
    ├── ConversationPolicy.php
    └── MessagePolicy.php

database/
└── migrations/
    ├── 2026_02_02_000001_create_conversations_table.php
    ├── 2026_02_02_000002_create_conversation_participants_table.php
    ├── 2026_02_02_000003_create_messages_table.php
    ├── 2026_02_02_000004_create_message_reads_table.php
    ├── 2026_02_02_000005_create_blocked_users_table.php
    ├── 2026_02_02_000006_create_announcements_table.php
    └── 2026_02_02_000007_create_announcement_reads_table.php

routes/
├── channels.php          # WebSocket channel authorization
└── api.php               # API routes (add message routes)
```

### Frontend (React + TypeScript)

```
resources/js/
├── components/
│   └── messaging/
│       ├── ChatBubble.tsx
│       ├── ConversationList.tsx
│       ├── ConversationItem.tsx
│       ├── MessageInput.tsx
│       ├── TypingIndicator.tsx
│       ├── OnlineStatus.tsx
│       ├── GroupAvatar.tsx
│       ├── AttachmentPreview.tsx
│       └── AnnouncementCard.tsx
├── hooks/
│   ├── useEcho.ts
│   ├── useConversations.ts
│   └── useMessages.ts
├── pages/
│   ├── Alumni/
│   │   └── Messages/
│   │       ├── Index.tsx           # Inbox
│   │       ├── Conversation.tsx    # Chat view
│   │       └── components/
│   │           ├── NewConversationModal.tsx
│   │           ├── GroupSettingsModal.tsx
│   │           └── InvitationsModal.tsx
│   └── admin/
│       └── Messages/
│           ├── Index.tsx           # Admin inbox
│           ├── SupportInbox.tsx    # Support tickets
│           └── Announcements/
│               ├── Index.tsx
│               └── Create.tsx
└── types/
    └── messaging.ts
```

---

## 🔌 API Endpoints

### Conversations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/conversations` | List user's conversations | All |
| POST | `/api/v1/conversations` | Create new conversation | All |
| GET | `/api/v1/conversations/{id}` | Get conversation details | Participant |
| PUT | `/api/v1/conversations/{id}` | Update conversation (group) | Owner/Admin |
| DELETE | `/api/v1/conversations/{id}` | Delete/Leave conversation | Participant |
| POST | `/api/v1/conversations/{id}/participants` | Add participants | Owner/Admin |
| DELETE | `/api/v1/conversations/{id}/participants/{userId}` | Remove participant | Owner/Admin |
| PUT | `/api/v1/conversations/{id}/participants/{userId}` | Update participant role | Owner |

### Messages

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/conversations/{id}/messages` | Get messages (paginated) | Participant |
| POST | `/api/v1/conversations/{id}/messages` | Send message | Participant |
| PUT | `/api/v1/messages/{id}` | Edit message | Sender |
| DELETE | `/api/v1/messages/{id}` | Delete message | Sender |
| POST | `/api/v1/messages/{id}/read` | Mark as read | Participant |
| POST | `/api/v1/conversations/{id}/read-all` | Mark all as read | Participant |

### Group Invitations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/invitations` | Get pending invitations | All |
| POST | `/api/v1/invitations/{id}/accept` | Accept invitation | Invitee |
| POST | `/api/v1/invitations/{id}/decline` | Decline invitation | Invitee |

### Blocked Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/blocked-users` | List blocked users | All |
| POST | `/api/v1/blocked-users` | Block user | All |
| DELETE | `/api/v1/blocked-users/{userId}` | Unblock user | All |

### Support (Alumni → Admin)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/support/request` | Create support request | Alumni |
| GET | `/api/v1/admin/support` | List support tickets | Admin |
| PUT | `/api/v1/admin/support/{id}/status` | Update ticket status | Admin |
| POST | `/api/v1/admin/support/{id}/assign` | Assign to admin | Admin |

### Announcements (Admin)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/announcements` | List announcements (for user) | All |
| GET | `/api/v1/admin/announcements` | List all announcements | Admin |
| POST | `/api/v1/admin/announcements` | Create announcement | Admin |
| PUT | `/api/v1/admin/announcements/{id}` | Update announcement | Admin |
| DELETE | `/api/v1/admin/announcements/{id}` | Delete announcement | Admin |
| POST | `/api/v1/admin/announcements/{id}/publish` | Publish announcement | Admin |
| POST | `/api/v1/announcements/{id}/read` | Mark as read | All |

---

## 🔐 WebSocket Channels

### Private Channels

```php
// User's personal channel (for notifications, online status)
Broadcast::channel('user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Conversation channel (for messages in a specific conversation)
Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    return $user->conversations()->where('conversations.id', $conversationId)->exists();
});
```

### Presence Channels

```php
// Online users in a conversation (shows who's online)
Broadcast::channel('presence.conversation.{conversationId}', function ($user, $conversationId) {
    if ($user->conversations()->where('conversations.id', $conversationId)->exists()) {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'avatar' => $user->profile_picture_path,
        ];
    }
});
```

---

## 📡 Broadcasting Events

### MessageSent Event

```php
class MessageSent implements ShouldBroadcast
{
    public function __construct(
        public Message $message,
        public Conversation $conversation
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('conversation.' . $this->conversation->id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'message' => [
                'id' => $this->message->id,
                'content' => $this->message->content,
                'sender' => [
                    'id' => $this->message->sender->id,
                    'name' => $this->message->sender->name,
                    'avatar' => $this->message->sender->profile_picture_path,
                ],
                'created_at' => $this->message->created_at->toISOString(),
                'type' => $this->message->type,
                'attachments' => $this->message->attachments,
            ],
        ];
    }
}
```

---

## 🎨 Frontend Integration

### Laravel Echo Setup

```typescript
// resources/js/echo.ts
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT,
    wssPort: import.meta.env.VITE_REVERB_PORT,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
});
```

### Listening for Messages

```typescript
// In React component
useEffect(() => {
    const channel = window.Echo.private(`conversation.${conversationId}`);
    
    channel.listen('MessageSent', (e: { message: Message }) => {
        setMessages(prev => [...prev, e.message]);
    });
    
    channel.listen('UserTyping', (e: { user: User }) => {
        setTypingUsers(prev => [...prev, e.user]);
    });
    
    return () => {
        channel.stopListening('MessageSent');
        channel.stopListening('UserTyping');
    };
}, [conversationId]);
```

---

## 🚀 Running the System

### Development (XAMPP)

```bash
# Terminal 1: Reverb WebSocket Server (REQUIRED for real-time)
php artisan reverb:start

# Frontend changes only need:
npm run build
# or for hot reload:
npm run dev
```

### With Cloudflare Tunnel

Your tunnel config should include WebSocket support:

```yaml
# config.yml
tunnel: your-tunnel-id
credentials-file: /path/to/credentials.json

ingress:
  # Main application
  - hostname: yourdomain.com
    service: http://localhost:80
  
  # WebSocket (Reverb) - Option 1: Same domain different path
  # Configure in Laravel to use /app path for WebSocket
  
  # Option 2: Subdomain for WebSocket
  - hostname: ws.yourdomain.com
    service: http://localhost:8080
    
  - service: http_status:404
```

### Production (Future Dedicated Server)

```bash
# Use Supervisor to keep Reverb running
sudo nano /etc/supervisor/conf.d/reverb.conf
```

```ini
[program:reverb]
process_name=%(program_name)s
command=php /var/www/html/artisan reverb:start --host=0.0.0.0 --port=8080
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/log/reverb.log
stopwaitsecs=3600
```

---

## ✅ Implementation Checklist

### Phase 1: Setup
- [ ] Install Laravel Reverb
- [ ] Configure broadcasting
- [ ] Set up Laravel Echo frontend
- [ ] Test WebSocket connection

### Phase 2: Database
- [ ] Create migrations
- [ ] Create models
- [ ] Define relationships
- [ ] Run migrations

### Phase 3: Backend
- [ ] Create events
- [ ] Create controllers
- [ ] Define channel authorization
- [ ] Create policies

### Phase 4: API Routes
- [ ] Conversation routes
- [ ] Message routes
- [ ] Block routes
- [ ] Announcement routes

### Phase 5: Frontend - Alumni
- [ ] Inbox page
- [ ] Conversation view
- [ ] New message modal
- [ ] Group management

### Phase 6: Frontend - Admin
- [ ] Admin inbox
- [ ] Support tickets
- [ ] Announcements

### Phase 7: Testing
- [ ] Unit tests
- [ ] Real-time tests
- [ ] Multi-user tests

---

## 📚 Related Documentation

- [Laravel Reverb Docs](https://laravel.com/docs/11.x/reverb)
- [Laravel Broadcasting](https://laravel.com/docs/11.x/broadcasting)
- [Laravel Echo](https://laravel.com/docs/11.x/broadcasting#client-side-installation)
