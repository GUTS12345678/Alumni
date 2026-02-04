// Message System Types

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'super_admin' | 'admin' | 'alumni';
    profile_picture_path?: string;
    alumniProfile?: AlumniProfile;
}

export interface AlumniProfile {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
}

// Alias for backward compatibility
export type Participant = ConversationParticipant;

// User search result for new conversation modal
export interface UserSearchResult {
    id: number;
    name: string;
    email: string;
    role?: 'super_admin' | 'admin' | 'alumni';
    profile_picture_path?: string;
    alumniProfile?: AlumniProfile;
}

// Conversation Types
export type ConversationType = 'direct' | 'group' | 'support';
export type SupportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type ParticipantRole = 'member' | 'admin' | 'owner';
export type InvitationStatus = 'pending' | 'accepted' | 'declined';

export interface Conversation {
    id: number;
    type: ConversationType;
    name?: string;
    description?: string;
    avatar_path?: string;
    created_by: number;
    is_support_ticket: boolean;
    support_status?: SupportStatus;
    created_at: string;
    updated_at: string;

    // Relationships
    participants?: ConversationParticipant[];
    messages?: Message[];
    latest_message?: Message;
    creator?: User;

    // Computed
    unread_count?: number;
    other_participant?: User; // For direct messages
}

export interface ConversationParticipant {
    id: number;
    conversation_id: number;
    user_id: number;
    role: ParticipantRole;
    nickname?: string;
    joined_at: string;
    left_at?: string;
    last_read_at?: string;
    is_muted: boolean;
    invitation_status: InvitationStatus;
    invited_by?: number;

    // Relationships
    user?: User;
}

// Message Types
export type MessageType = 'text' | 'image' | 'file' | 'system';

export interface MessageAttachment {
    name: string;
    path: string;
    size: number;
    mime_type: string;
    url?: string;
}

export interface Message {
    id: number;
    conversation_id: number;
    sender_id: number;
    content: string;
    type: MessageType;
    attachments?: MessageAttachment[];
    is_edited: boolean;
    edited_at?: string;
    reply_to_id?: number;
    created_at: string;
    updated_at: string;
    deleted_at?: string;

    // Relationships
    sender?: User;
    reply_to?: Message;
    reads?: MessageRead[];

    // Computed
    is_read?: boolean;
    read_by_count?: number;
}

export interface MessageRead {
    id: number;
    message_id: number;
    user_id: number;
    read_at: string;
    user?: User;
}

// Blocked Users
export interface BlockedUser {
    id: number;
    user_id: number;
    blocked_user_id: number;
    reason?: string;
    created_at: string;
    blocked_user?: User;
}

// Announcements
export type AnnouncementType = 'general' | 'batch' | 'department' | 'course';
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';
export type AnnouncementStatus = 'draft' | 'scheduled' | 'published' | 'expired';

export interface AnnouncementFilters {
    batch_ids?: number[];
    department_ids?: number[];
    course_ids?: number[];
}

export interface Announcement {
    id: number;
    title: string;
    content: string;
    type: AnnouncementType;
    target_filters?: AnnouncementFilters;
    priority: AnnouncementPriority;
    created_by: number;
    scheduled_at?: string;
    published_at?: string;
    expires_at?: string;
    status: AnnouncementStatus;
    created_at: string;
    updated_at: string;

    // Relationships
    creator?: User;

    // Computed
    is_read?: boolean;
}

// WebSocket Events
export interface MessageSentEvent {
    message: Message;
    conversation_id: number;
}

export interface MessageReadEvent {
    message_id: number;
    user_id: number;
    read_at: string;
}

export interface UserTypingEvent {
    user: {
        id: number;
        name: string;
    };
    conversation_id: number;
}

export interface ConversationCreatedEvent {
    conversation: Conversation;
}

export interface ParticipantJoinedEvent {
    participant: ConversationParticipant;
    conversation_id: number;
}

export interface ParticipantLeftEvent {
    user_id: number;
    conversation_id: number;
}

// API Response Types
export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

export interface ConversationListResponse {
    conversations: PaginatedResponse<Conversation>;
    unread_total: number;
}

export interface MessageListResponse {
    messages: PaginatedResponse<Message>;
    conversation: Conversation;
}

// Form Types
export interface CreateConversationForm {
    type: ConversationType;
    name?: string;
    description?: string;
    participant_ids: number[];
    initial_message?: string;
}

export interface SendMessageForm {
    content: string;
    type?: MessageType;
    attachments?: File[];
    reply_to_id?: number;
}

export interface CreateAnnouncementForm {
    title: string;
    content: string;
    type: AnnouncementType;
    target_filters?: AnnouncementFilters;
    priority: AnnouncementPriority;
    scheduled_at?: string;
    expires_at?: string;
}

// Group Chat Specific
export interface GroupInvitation {
    id: number;
    conversation: Conversation;
    invited_by: User;
    invited_at: string;
    status: InvitationStatus;
}

export interface UpdateGroupForm {
    name?: string;
    description?: string;
    avatar?: File;
}

export interface AddParticipantsForm {
    user_ids: number[];
}
