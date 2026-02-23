/**
 * MessagingUI – Shared presentational messaging component.
 * All logic is provided by the useMessaging hook.
 */

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    MessageCircle,
    Send,
    Search,
    Plus,
    Users,
    ArrowLeft,
    ArrowDown,
    Loader2,
    Check,
    CheckCheck,
    Wifi,
    WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Conversation, UserSearchResult } from '@/types/messaging';
import { UseMessagingReturn } from '@/hooks/useMessaging';

// ─── Helpers ────────────────────────────────────────────────────────

const getProfilePicUrl = (path?: string | null): string | undefined => {
    if (!path) return undefined;
    if (path.startsWith('http') || path.startsWith('/')) return path;
    return `/api/v1/files/${path}`;
};

const getDisplayName = (
    user: {
        name?: string;
        display_name?: string;
        email?: string;
        alumniProfile?: { first_name?: string; last_name?: string };
    } | null | undefined
): string => {
    if (!user) return 'Unknown';
    if (user.display_name) return user.display_name;
    if (user.alumniProfile) {
        const full = `${user.alumniProfile.first_name ?? ''} ${user.alumniProfile.last_name ?? ''}`.trim();
        if (full) return full;
    }
    if (user.name) return user.name;
    if (user.email) return user.email.split('@')[0];
    return 'Unknown';
};

const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60_000) return 'just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604_800_000) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getInitials = (name: string): string =>
    name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

// ─── Props ───────────────────────────────────────────────────────────

interface MessagingUIProps {
    messaging: UseMessagingReturn;
    userId: number;
    searchPlaceholder?: string;
    searchHint?: React.ReactNode;
    renderUserBadge?: (user: UserSearchResult) => React.ReactNode;
}

// ─── ConversationItem ────────────────────────────────────────────────

interface ConversationItemProps {
    conversation: Conversation;
    currentUserId: number;
    isSelected: boolean;
    onClick: () => void;
}

function ConversationItem({ conversation, currentUserId, isSelected, onClick }: ConversationItemProps) {
    const otherUser = conversation.other_participant;
    const displayName =
        conversation.type === 'direct'
            ? getDisplayName(otherUser)
            : (conversation.name ?? 'Group');

    const avatarSrc =
        conversation.type === 'direct'
            ? getProfilePicUrl(otherUser?.profile_picture_path)
            : getProfilePicUrl(conversation.avatar_path);

    const lastMsg = conversation.latest_message;
    const isOwn = lastMsg?.sender_id === currentUserId;
    const unread = (conversation.unread_count ?? 0) > 0;

    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                isSelected
                    ? 'bg-maroon-50 dark:bg-maroon-900/20 border-r-2 border-maroon-600'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
            )}
        >
            <div className="relative flex-shrink-0">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={avatarSrc} />
                    <AvatarFallback className="bg-maroon-100 text-maroon-700 dark:bg-maroon-800 dark:text-maroon-200 text-sm">
                        {conversation.type === 'direct'
                            ? getInitials(displayName)
                            : <Users className="h-4 w-4" />
                        }
                    </AvatarFallback>
                </Avatar>
                {unread && (
                    <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-maroon-600 border-2 border-white dark:border-gray-900" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                    <span className={cn('text-sm truncate', unread ? 'font-semibold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-700 dark:text-gray-300')}>
                        {displayName}
                    </span>
                    {lastMsg && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                            {formatTime(lastMsg.created_at)}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                    {isOwn && lastMsg && (
                        lastMsg.is_read
                            ? <CheckCheck className="h-3 w-3 text-blue-500 flex-shrink-0" />
                            : <Check className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    )}
                    <p className={cn(
                        'text-xs truncate',
                        unread ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'
                    )}>
                        {lastMsg?.content ?? 'No messages yet'}
                    </p>
                </div>
            </div>

            {unread && conversation.unread_count && conversation.unread_count > 0 && (
                <span className="flex-shrink-0 h-5 min-w-5 px-1 rounded-full bg-maroon-600 text-white text-xs flex items-center justify-center font-medium">
                    {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                </span>
            )}
        </button>
    );
}

// ─── Main component ──────────────────────────────────────────────────

export default function MessagingUI({
    messaging,
    userId,
    searchPlaceholder = 'Search by name or email...',
    searchHint,
    renderUserBadge,
}: MessagingUIProps) {
    const {
        conversations,
        selectedConversation,
        messages,
        newMessage,
        searchQuery,
        userSearchQuery,
        searchResults,
        loading,
        sendingMessage,
        showNewConversation,
        showMobileConversation,
        typingUsers,
        isEchoConnected,
        showScrollButton,

        setNewMessage,
        setSearchQuery,
        setShowNewConversation,
        setShowMobileConversation,

        selectConversation,
        sendMessage,
        handleTyping,
        searchUsers,
        startConversation,
        jumpToLatest,
        handleChatScroll,

        messagesEndRef,
    } = messaging;

    // Filter conversations by search query
    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        const q = searchQuery.toLowerCase();
        return conversations.filter(c => {
            if (c.name?.toLowerCase().includes(q)) return true;
            if (c.other_participant) {
                const name = getDisplayName(c.other_participant).toLowerCase();
                if (name.includes(q)) return true;
            }
            return false;
        });
    }, [conversations, searchQuery]);

    // Get conversation display info
    const convDisplayName = selectedConversation
        ? selectedConversation.type === 'direct'
            ? getDisplayName(selectedConversation.other_participant)
            : (selectedConversation.name ?? 'Group')
        : '';

    const convAvatarSrc = selectedConversation
        ? selectedConversation.type === 'direct'
            ? getProfilePicUrl(selectedConversation.other_participant?.profile_picture_path)
            : getProfilePicUrl(selectedConversation.avatar_path)
        : undefined;

    const currentTyping = selectedConversation
        ? (typingUsers[selectedConversation.id] ?? []).filter(n => n !== 'You')
        : [];

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // ── Sidebar ──────────────────────────────────────────────────────

    const sidebar = (
        <div className={cn(
            'flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700',
            'w-full md:w-80 lg:w-96 flex-shrink-0',
            showMobileConversation && selectedConversation ? 'hidden md:flex' : 'flex',
        )}>
            {/* Sidebar header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Messages</h2>
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            'flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
                            isEchoConnected
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                        )}>
                            {isEchoConnected
                                ? <><Wifi className="h-3 w-3" /> Live</>
                                : <><WifiOff className="h-3 w-3" /> Sync</>
                            }
                        </span>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => setShowNewConversation(true)}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>
            </div>

            {/* Conversation list */}
            <ScrollArea className="flex-1">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <MessageCircle className="h-10 w-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
                        </p>
                        {!searchQuery && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-3"
                                onClick={() => setShowNewConversation(true)}
                            >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                New Conversation
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filteredConversations.map(c => (
                            <ConversationItem
                                key={c.id}
                                conversation={c}
                                currentUserId={userId}
                                isSelected={selectedConversation?.id === c.id}
                                onClick={() => selectConversation(c)}
                            />
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );

    // ── Chat area ────────────────────────────────────────────────────

    const chatArea = (
        <div className={cn(
            'flex flex-col flex-1 bg-gray-50 dark:bg-gray-950 min-w-0',
            !showMobileConversation || !selectedConversation ? 'hidden md:flex' : 'flex',
        )}>
            {selectedConversation ? (
                <>
                    {/* Chat header */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="md:hidden h-8 w-8 p-0"
                            onClick={() => setShowMobileConversation(false)}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>

                        <Avatar className="h-8 w-8">
                            <AvatarImage src={convAvatarSrc} />
                            <AvatarFallback className="bg-maroon-100 text-maroon-700 text-xs">
                                {selectedConversation.type === 'direct'
                                    ? getInitials(convDisplayName)
                                    : <Users className="h-3.5 w-3.5" />
                                }
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                                {convDisplayName}
                            </p>
                            {currentTyping.length > 0 ? (
                                <p className="text-xs text-maroon-600 dark:text-maroon-400 animate-pulse">
                                    {currentTyping.join(', ')} {currentTyping.length === 1 ? 'is' : 'are'} typing…
                                </p>
                            ) : (
                                <p className="text-xs text-gray-400 capitalize">
                                    {selectedConversation.type === 'group' ? 'Group chat' : 'Direct message'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="relative flex-1 overflow-hidden">
                        <div
                            className="absolute inset-0 overflow-y-auto px-4 py-4"
                            onScroll={handleChatScroll}
                        >
                            <div className="space-y-3 max-w-3xl mx-auto">
                                {messages.map((msg, idx) => {
                                    const isOwn = msg.sender_id === userId;
                                    const sender = msg.sender;
                                    const showAvatar = !isOwn && (idx === 0 || messages[idx - 1]?.sender_id !== msg.sender_id);
                                    const senderName = getDisplayName(sender);
                                    const avatarSrc = getProfilePicUrl(sender?.profile_picture_path);

                                    return (
                                        <div key={msg.id} className={cn('flex gap-2', isOwn ? 'justify-end' : 'justify-start')}>
                                            {!isOwn && (
                                                <div className="flex-shrink-0 w-8">
                                                    {showAvatar && (
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={avatarSrc} />
                                                            <AvatarFallback className="text-xs bg-gray-200 dark:bg-gray-700">
                                                                {getInitials(senderName)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                </div>
                                            )}

                                            <div className={cn('flex flex-col max-w-xs lg:max-w-md xl:max-w-lg', isOwn ? 'items-end' : 'items-start')}>
                                                {showAvatar && !isOwn && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-1">{senderName}</p>
                                                )}
                                                <div className={cn(
                                                    'px-3 py-2 rounded-2xl text-sm break-words',
                                                    isOwn
                                                        ? 'bg-maroon-600 text-white rounded-br-sm'
                                                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-sm'
                                                )}>
                                                    {msg.content}
                                                </div>
                                                <div className={cn('flex items-center gap-1 mt-1', isOwn ? 'flex-row-reverse' : 'flex-row')}>
                                                    <span className="text-xs text-gray-400 dark:text-gray-500">{formatTime(msg.created_at)}</span>
                                                    {isOwn && (
                                                        msg.is_read
                                                            ? <CheckCheck className="h-3 w-3 text-blue-400" />
                                                            : <Check className="h-3 w-3 text-gray-400" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Jump to latest button */}
                        {showScrollButton && (
                            <button
                                onClick={jumpToLatest}
                                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-maroon-600 text-white text-xs font-medium shadow-lg hover:bg-maroon-700 transition-all animate-in fade-in slide-in-from-bottom-2 z-10"
                            >
                                <ArrowDown className="h-3.5 w-3.5" />
                                Jump to latest
                            </button>
                        )}
                    </div>

                    {/* Input */}
                    <div className="px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex gap-2 items-end max-w-3xl mx-auto">
                            <Input
                                placeholder="Type a message…"
                                value={newMessage}
                                onChange={e => { setNewMessage(e.target.value); handleTyping(); }}
                                onKeyDown={handleKeyDown}
                                className="flex-1 resize-none"
                                disabled={sendingMessage}
                            />
                            <Button
                                onClick={sendMessage}
                                disabled={!newMessage.trim() || sendingMessage}
                                size="icon"
                                className="bg-maroon-600 hover:bg-maroon-700 text-white flex-shrink-0 h-9 w-9"
                            >
                                {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <MessageCircle className="h-16 w-16 text-gray-200 dark:text-gray-700 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Your Messages</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
                        Select a conversation to start messaging, or start a new one.
                    </p>
                    <Button onClick={() => setShowNewConversation(true)} className="bg-maroon-600 hover:bg-maroon-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        New Conversation
                    </Button>
                </div>
            )}
        </div>
    );

    // ── New Conversation Modal ────────────────────────────────────────

    const newConversationModal = showNewConversation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md shadow-2xl">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">New Conversation</h3>
                    <Button variant="ghost" size="sm" onClick={() => {
                        setShowNewConversation(false);
                        searchUsers('');
                    }}>✕</Button>
                </div>

                <div className="p-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            autoFocus
                            placeholder={searchPlaceholder}
                            value={userSearchQuery}
                            onChange={e => searchUsers(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {searchHint}

                    {searchResults.length > 0 ? (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden max-h-64 overflow-y-auto">
                            {searchResults.map(user => (
                                <button
                                    key={user.id}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left transition-colors"
                                    onClick={() => startConversation(user.id)}
                                >
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={getProfilePicUrl(user.profile_picture_path)} />
                                        <AvatarFallback className="text-xs bg-gray-200 dark:bg-gray-600">
                                            {getInitials(getDisplayName(user))}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                            {getDisplayName(user)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                    </div>
                                    {renderUserBadge?.(user)}
                                </button>
                            ))}
                        </div>
                    ) : userSearchQuery.length >= 2 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No users found</p>
                    ) : userSearchQuery.length > 0 ? (
                        <p className="text-xs text-gray-400 text-center py-2">Type at least 2 characters to search</p>
                    ) : null}
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-[calc(100vh-8rem)] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
            {sidebar}
            {chatArea}
            {newConversationModal}
        </div>
    );
}
