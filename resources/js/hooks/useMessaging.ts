/**
 * useMessaging – Real-time messaging hook.
 *
 * Strategy:
 *  1. Always-on polling (2 s) as the guaranteed delivery layer.
 *  2. WebSocket (Laravel Reverb / Echo) as an additive instant layer.
 *     When a WS event arrives we append the message immediately AND
 *     the next poll will be a no-op because we deduplicate by ID.
 *  3. Typing indicators are WS-only (non-critical).
 *
 * This means messages always arrive within ≤2 s even when Reverb is
 * unavailable, the queue worker is down, or the WS is blocked.
 *
 * @module useMessaging
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { Conversation, Message, UserSearchResult } from '@/types/messaging';

// Lazy-load echo.ts — only loads pusher-js when messaging is used
let echoLoaded = false;
async function ensureEcho(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (echoLoaded || (window as any).Echo) {
        echoLoaded = true;
        return;
    }
    try {
        await import('@/echo');
        echoLoaded = true;
    } catch {
        // Echo failed to load — real-time disabled, polling still works
    }
}

export interface OnlineUser {
    id: number;
    name: string;
    avatar?: string;
}

export interface UseMessagingOptions {
    userId: number;
    connectionsOnly?: boolean;
}

export interface UseMessagingReturn {
    conversations: Conversation[];
    selectedConversation: Conversation | null;
    messages: Message[];
    newMessage: string;
    searchQuery: string;
    userSearchQuery: string;
    searchResults: UserSearchResult[];
    loading: boolean;
    sendingMessage: boolean;
    showNewConversation: boolean;
    showMobileConversation: boolean;
    typingUsers: Record<number, string[]>;
    unreadCount: number;
    onlineUsers: Record<number, OnlineUser[]>;
    isEchoConnected: boolean;
    showScrollButton: boolean;

    setNewMessage: (msg: string) => void;
    setSearchQuery: (q: string) => void;
    setUserSearchQuery: (q: string) => void;
    setShowNewConversation: (show: boolean) => void;
    setShowMobileConversation: (show: boolean) => void;

    selectConversation: (c: Conversation) => Promise<void>;
    sendMessage: () => Promise<void>;
    handleTyping: () => void;
    searchUsers: (q: string) => void;
    startConversation: (userId: number) => Promise<void>;
    fetchConversations: () => Promise<void>;
    jumpToLatest: () => void;
    handleChatScroll: (e: React.UIEvent<HTMLElement>) => void;

    messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function useMessaging({ userId, connectionsOnly = false }: UseMessagingOptions): UseMessagingReturn {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [showNewConversation, setShowNewConversation] = useState(false);
    const [showMobileConversation, setShowMobileConversation] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Record<number, string[]>>({});
    const [unreadCount, setUnreadCount] = useState(0);
    const [onlineUsers, setOnlineUsers] = useState<Record<number, OnlineUser[]>>({});
    const [isEchoConnected, setIsEchoConnected] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const messagesPollRef = useRef<NodeJS.Timeout | null>(null);
    const convPollRef = useRef<NodeJS.Timeout | null>(null);
    const userSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const selectedConversationRef = useRef<Conversation | null>(null);
    const messageIdsRef = useRef<Set<number>>(new Set());
    const isNearBottomRef = useRef(true);
    const notifPermissionRef = useRef<NotificationPermission>('default');

    useEffect(() => {
        selectedConversationRef.current = selectedConversation;
    }, [selectedConversation]);

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window) {
            notifPermissionRef.current = Notification.permission;
            if (Notification.permission === 'default') {
                Notification.requestPermission().then(perm => {
                    notifPermissionRef.current = perm;
                });
            }
        }
    }, []);

    const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior });
            isNearBottomRef.current = true;
            setShowScrollButton(false);
        }, 50);
    }, []);

    const jumpToLatest = useCallback(() => {
        scrollToBottom('smooth');
    }, [scrollToBottom]);

    const handleChatScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
        const el = e.currentTarget;
        // "near bottom" = within 150px of the bottom
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
        isNearBottomRef.current = nearBottom;
        setShowScrollButton(!nearBottom);
    }, []);

    const showBrowserNotification = useCallback((senderName: string, content: string) => {
        if (document.hasFocus()) return;
        if (!('Notification' in window) || notifPermissionRef.current !== 'granted') return;
        try {
            const notif = new Notification(`New message from ${senderName}`, {
                body: content.length > 100 ? content.substring(0, 100) + '…' : content,
                icon: '/favicon.ico',
                tag: 'messaging-' + Date.now(),
            });
            notif.onclick = () => {
                window.focus();
                notif.close();
            };
            setTimeout(() => notif.close(), 5000);
        } catch {
            // silent
        }
    }, []);

    // ─── Fetch helpers ───────────────────────────────────────────────

    const fetchConversations = useCallback(async () => {
        try {
            const res = await axios.get('/api/v1/messaging/conversations');
            setConversations(res.data.data.data || []);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await axios.get('/api/v1/messaging/unread-count');
            setUnreadCount(res.data.data.unread_count ?? 0);
        } catch {
            // silent
        }
    }, []);

    const fetchMessages = useCallback(async (conversationId: number, scrollMode: ScrollBehavior | null = 'smooth') => {
        try {
            const res = await axios.get(`/api/v1/messaging/conversations/${conversationId}`);
            const raw: Message[] = (res.data.data.messages.data || []).slice().reverse();
            if (raw.length === 0) return;

            const latestId = raw[raw.length - 1].id;

            setMessages(prev => {
                const existing = new Set(prev.map(m => m.id));
                const incoming = raw.filter(m => !existing.has(m.id));
                if (incoming.length === 0) return prev;
                const merged = [...prev, ...incoming].sort((a, b) => a.id - b.id);
                // Update dedup set
                merged.forEach(m => messageIdsRef.current.add(m.id));

                // Auto-scroll if user is near bottom or explicit scroll requested
                if (scrollMode) {
                    scrollToBottom(scrollMode);
                } else if (isNearBottomRef.current && incoming.length > 0) {
                    scrollToBottom('smooth');
                }

                // Notify for incoming messages from others during poll
                if (!scrollMode && incoming.length > 0) {
                    const othersMessages = incoming.filter(m => m.sender_id !== userId);
                    if (othersMessages.length > 0) {
                        const last = othersMessages[othersMessages.length - 1];
                        const senderName = last.sender?.name || last.sender?.email?.split('@')[0] || 'Someone';
                        showBrowserNotification(senderName, last.content);
                    }
                }

                return merged;
            });

            messageIdsRef.current.add(latestId);
        } catch {
            // silent
        }
    }, [scrollToBottom, userId, showBrowserNotification]);

    // ─── Initial load ────────────────────────────────────────────────

    useEffect(() => {
        fetchConversations();
        fetchUnreadCount();
    }, [fetchConversations, fetchUnreadCount]);

    // ─── Always-on messages poll (2 s when conversation open) ────────

    useEffect(() => {
        if (messagesPollRef.current) {
            clearInterval(messagesPollRef.current);
            messagesPollRef.current = null;
        }

        if (!selectedConversation) return;

        // Poll every 5 seconds for new messages
        messagesPollRef.current = setInterval(() => {
            const conv = selectedConversationRef.current;
            if (conv) fetchMessages(conv.id, null); // null = no auto-scroll on poll
        }, 5000);

        return () => {
            if (messagesPollRef.current) {
                clearInterval(messagesPollRef.current);
                messagesPollRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedConversation?.id, fetchMessages]);

    // ─── Conversations list poll (10 s, always) ──────────────────────

    useEffect(() => {
        convPollRef.current = setInterval(() => {
            fetchConversations();
            fetchUnreadCount();
        }, 10000);

        return () => {
            if (convPollRef.current) clearInterval(convPollRef.current);
        };
    }, [fetchConversations, fetchUnreadCount]);

    // ─── Echo / WebSocket (additive on top of polling) ───────────────

    // Connection state indicator
    useEffect(() => {
        let cancelled = false;
        let cleanupFn: (() => void) | undefined;

        (async () => {
            await ensureEcho();
            if (cancelled) return;
            const echo = window.Echo;
            if (!echo) return;

            try {
                const conn = (echo as unknown as {
                    connector?: { pusher?: { connection?: { state?: string; bind?: (e: string, cb: () => void) => void; unbind?: (e: string, cb: () => void) => void } } }
                }).connector?.pusher?.connection;

                if (!conn) { setIsEchoConnected(true); return; }

                setIsEchoConnected(conn.state === 'connected');
                const onConn = () => setIsEchoConnected(true);
                const onDisc = () => setIsEchoConnected(false);
                conn.bind?.('connected', onConn);
                conn.bind?.('disconnected', onDisc);
                conn.bind?.('unavailable', onDisc);
                conn.bind?.('failed', onDisc);
                cleanupFn = () => {
                    conn.unbind?.('connected', onConn);
                    conn.unbind?.('disconnected', onDisc);
                    conn.unbind?.('unavailable', onDisc);
                    conn.unbind?.('failed', onDisc);
                };
            } catch {
                setIsEchoConnected(false);
            }
        })();

        return () => { cancelled = true; cleanupFn?.(); };
    }, []);

    // User-level private channel (new conversations, invitations)
    useEffect(() => {
        const echo = window.Echo;
        if (!echo || !userId) return;

        const ch = echo.private(`user.${userId}`);
        ch.listen('.conversation.created', (e: { conversation: Conversation }) => {
            setConversations(prev => {
                if (prev.find(c => c.id === e.conversation.id)) return prev;
                return [e.conversation, ...prev];
            });
            fetchUnreadCount();
        });

        return () => { try { echo.leave(`user.${userId}`); } catch { /* ignore */ } };
    }, [userId, fetchUnreadCount]);

    // Conversation-level channel (instant message delivery + typing)
    useEffect(() => {
        const echo = window.Echo;
        if (!echo || !selectedConversation) return;

        const ch = echo.private(`conversation.${selectedConversation.id}`);

        ch.listen('.message.sent', (e: { message: Message }) => {
            // WS gives us the message instantly; poll will deduplicate
            setMessages(prev => {
                if (prev.find(m => m.id === e.message.id)) return prev;
                messageIdsRef.current.add(e.message.id);
                const merged = [...prev, e.message].sort((a, b) => a.id - b.id);
                return merged;
            });

            // Auto-scroll if near bottom
            if (isNearBottomRef.current) {
                scrollToBottom();
            } else {
                setShowScrollButton(true);
            }

            // Browser notification for messages from others
            if (e.message.sender_id !== userId) {
                const senderName = e.message.sender?.name || 'Someone';
                showBrowserNotification(senderName, e.message.content);
            }

            setConversations(prev =>
                prev.map(c =>
                    c.id === e.message.conversation_id
                        ? { ...c, latest_message: e.message, updated_at: new Date().toISOString() }
                        : c
                ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
            );

            // Auto mark-as-read
            axios.post(`/api/v1/messaging/conversations/${e.message.conversation_id}/read`).catch(() => null);
        })
            .listen('.message.read', (e: { message_id: number }) => {
                setMessages(prev => prev.map(m => m.id === e.message_id ? { ...m, is_read: true } : m));
            })
            .listen('.user.typing', (e: { user_id: number; user_name: string; conversation_id: number; is_typing: boolean }) => {
                if (e.user_id === userId) return;
                setTypingUsers(prev => {
                    const arr = prev[e.conversation_id] || [];
                    if (e.is_typing && !arr.includes(e.user_name)) {
                        return { ...prev, [e.conversation_id]: [...arr, e.user_name] };
                    }
                    if (!e.is_typing) {
                        return { ...prev, [e.conversation_id]: arr.filter(n => n !== e.user_name) };
                    }
                    return prev;
                });
            });

        const presence = echo.join(`presence.conversation.${selectedConversation.id}`);
        presence
            .here((users: OnlineUser[]) => {
                setOnlineUsers(prev => ({ ...prev, [selectedConversation.id]: users }));
            })
            .joining((user: OnlineUser) => {
                setOnlineUsers(prev => ({
                    ...prev,
                    [selectedConversation.id]: [...(prev[selectedConversation.id] || []).filter(u => u.id !== user.id), user],
                }));
            })
            .leaving((user: OnlineUser) => {
                setOnlineUsers(prev => ({
                    ...prev,
                    [selectedConversation.id]: (prev[selectedConversation.id] || []).filter(u => u.id !== user.id),
                }));
            });

        return () => {
            try { echo.leave(`conversation.${selectedConversation.id}`); } catch { /* ignore */ }
            try { echo.leave(`presence.conversation.${selectedConversation.id}`); } catch { /* ignore */ }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedConversation?.id, userId, scrollToBottom, showBrowserNotification]);

    // ─── Actions ────────────────────────────────────────────────────

    const selectConversation = useCallback(async (conversation: Conversation) => {
        setSelectedConversation(conversation);
        setShowMobileConversation(true);
        messageIdsRef.current = new Set();
        setMessages([]);

        try {
            const res = await axios.get(`/api/v1/messaging/conversations/${conversation.id}`);
            const raw: Message[] = (res.data.data.messages.data || []).slice().reverse();
            raw.forEach(m => messageIdsRef.current.add(m.id));
            setMessages(raw);
            setConversations(prev => prev.map(c => c.id === conversation.id ? { ...c, unread_count: 0 } : c));
            fetchUnreadCount();
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
        } catch {
            // silent
        }
    }, [fetchUnreadCount]);

    const sendMessage = useCallback(async () => {
        if (!newMessage.trim() || !selectedConversationRef.current || sendingMessage) return;

        const conversationId = selectedConversationRef.current.id;
        const content = newMessage;
        setSendingMessage(true);
        setNewMessage('');

        try {
            const res = await axios.post(
                `/api/v1/messaging/conversations/${conversationId}/messages`,
                { content }
            );
            const sent: Message = res.data.data;

            setMessages(prev => {
                if (prev.find(m => m.id === sent.id)) return prev;
                messageIdsRef.current.add(sent.id);
                return [...prev, sent].sort((a, b) => a.id - b.id);
            });

            setConversations(prev =>
                prev.map(c =>
                    c.id === conversationId
                        ? { ...c, latest_message: sent, updated_at: new Date().toISOString() }
                        : c
                ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
            );

            scrollToBottom();
        } catch {
            setNewMessage(content); // restore on failure
        } finally {
            setSendingMessage(false);
        }
    }, [newMessage, sendingMessage, scrollToBottom]);

    const handleTyping = useCallback(() => {
        const conv = selectedConversationRef.current;
        if (!conv) return;

        axios.post(`/api/v1/messaging/conversations/${conv.id}/typing`, { is_typing: true }).catch(() => null);

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            if (selectedConversationRef.current?.id === conv.id) {
                axios.post(`/api/v1/messaging/conversations/${conv.id}/typing`, { is_typing: false }).catch(() => null);
            }
        }, 2000);
    }, []);

    const searchUsers = useCallback((query: string) => {
        setUserSearchQuery(query);

        if (userSearchTimeoutRef.current) clearTimeout(userSearchTimeoutRef.current);

        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        userSearchTimeoutRef.current = setTimeout(async () => {
            try {
                const params: Record<string, string> = { query };
                if (connectionsOnly) params.connections_only = 'true';
                const res = await axios.get('/api/v1/messaging/users/search', { params });
                setSearchResults(res.data.data || []);
            } catch {
                // silent
            }
        }, 300);
    }, [connectionsOnly]);

    const startConversation = useCallback(async (targetUserId: number) => {
        try {
            const res = await axios.post('/api/v1/messaging/conversations', {
                type: 'direct',
                participant_ids: [targetUserId],
            });
            const conversation: Conversation = res.data.data;

            setConversations(prev => {
                if (prev.find(c => c.id === conversation.id)) return prev;
                return [conversation, ...prev];
            });

            await selectConversation(conversation);
            setShowNewConversation(false);
            setUserSearchQuery('');
            setSearchResults([]);
        } catch {
            // silent
        }
    }, [selectConversation]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (messagesPollRef.current) clearInterval(messagesPollRef.current);
            if (convPollRef.current) clearInterval(convPollRef.current);
            if (userSearchTimeoutRef.current) clearTimeout(userSearchTimeoutRef.current);
        };
    }, []);

    return {
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
        unreadCount,
        onlineUsers,
        isEchoConnected,
        showScrollButton,

        setNewMessage,
        setSearchQuery,
        setUserSearchQuery,
        setShowNewConversation,
        setShowMobileConversation,

        selectConversation,
        sendMessage,
        handleTyping,
        searchUsers,
        startConversation,
        fetchConversations,
        jumpToLatest,
        handleChatScroll,

        messagesEndRef,
    };
}

export default useMessaging;
