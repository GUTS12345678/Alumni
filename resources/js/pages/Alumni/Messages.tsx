import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    MessageCircle,
    Send,
    Search,
    Plus,
    Users,
    User,
    MoreVertical,
    Check,
    CheckCheck,
    Info,
    ArrowLeft,
    Loader2,
    Ban
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { cn } from '@/lib/utils';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Conversation, Message, UserSearchResult } from '@/types/messaging';

// Helper function to get CSRF token
const getCsrfToken = (): string => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
};

interface PageProps extends InertiaPageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            profile_picture?: string;
        };
    };
}

export default function Messages() {
    const { auth } = usePage<PageProps>().props;
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
    const [typingUsers, setTypingUsers] = useState<{ [key: number]: string[] }>({});
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastMessageIdRef = useRef<number | null>(null);

    // Fetch conversations on mount
    useEffect(() => {
        fetchConversations();
        fetchUnreadCount();

        // Set up Echo listeners for real-time updates
        if (window.Echo && auth.user) {
            // Listen for new messages on user channel
            window.Echo.private(`user.${auth.user.id}`)
                .listen('.conversation.created', (e: { conversation: Conversation }) => {
                    setConversations(prev => [e.conversation, ...prev]);
                })
                .listen('.group.invitation', (e: { conversation: Conversation; invited_by: { id: number; name: string } }) => {
                    // Show notification for group invitation
                    console.log('Group invitation received:', e);
                });
        }

        return () => {
            if (window.Echo && auth.user) {
                window.Echo.leave(`user.${auth.user.id}`);
            }
        };
    }, [auth.user]);

    // Listen for messages in selected conversation (WebSocket)
    useEffect(() => {
        if (selectedConversation && window.Echo) {
            const channel = window.Echo.private(`conversation.${selectedConversation.id}`);

            channel
                .listen('.message.sent', (e: { message: Message }) => {
                    setMessages(prev => [...prev, e.message]);
                    scrollToBottom();
                })
                .listen('.message.read', (e: { message_id: number; user_id: number; read_at: string }) => {
                    // Update read receipts
                    setMessages(prev => prev.map(msg => {
                        if (msg.id === e.message_id) {
                            return { ...msg, is_read: true };
                        }
                        return msg;
                    }));
                })
                .listen('.user.typing', (e: { user_id: number; user_name: string; conversation_id: number; is_typing: boolean }) => {
                    if (e.user_id !== auth.user.id) {
                        setTypingUsers(prev => {
                            const convTyping = prev[e.conversation_id] || [];
                            if (e.is_typing && !convTyping.includes(e.user_name)) {
                                return { ...prev, [e.conversation_id]: [...convTyping, e.user_name] };
                            } else if (!e.is_typing) {
                                return { ...prev, [e.conversation_id]: convTyping.filter(n => n !== e.user_name) };
                            }
                            return prev;
                        });
                    }
                });

            return () => {
                window.Echo.leave(`conversation.${selectedConversation.id}`);
            };
        }
    }, [selectedConversation, auth.user]);

    // Polling fallback for real-time updates when WebSocket is not available
    useEffect(() => {
        if (!selectedConversation) {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
            return;
        }

        // Update last message ID when messages change
        if (messages.length > 0) {
            lastMessageIdRef.current = messages[messages.length - 1].id;
        }

        // Poll for new messages every 3 seconds
        const pollMessages = async () => {
            try {
                const response = await fetch(`/api/v1/messaging/conversations/${selectedConversation.id}`, {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'include',
                });

                if (response.ok) {
                    const data = await response.json();
                    const messagesData = data.data.messages.data || [];
                    const reversedMessages = [...messagesData].reverse();

                    // Only update if there are new messages
                    if (reversedMessages.length > 0) {
                        const latestId = reversedMessages[reversedMessages.length - 1].id;
                        if (latestId !== lastMessageIdRef.current) {
                            setMessages(reversedMessages);
                            lastMessageIdRef.current = latestId;
                            scrollToBottom();
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to poll messages:', error);
            }
        };

        pollingIntervalRef.current = setInterval(pollMessages, 3000);

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [selectedConversation?.id]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const response = await fetch('/api/v1/messaging/conversations', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setConversations(data.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await fetch('/api/v1/messaging/unread-count', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.data.unread_count);
            }
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    const selectConversation = async (conversation: Conversation) => {
        setSelectedConversation(conversation);
        setShowMobileConversation(true);

        try {
            const response = await fetch(`/api/v1/messaging/conversations/${conversation.id}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                // Use slice().reverse() to create a new array (oldest first for display)
                const messagesData = data.data.messages.data || [];
                setMessages([...messagesData].reverse());

                // Update conversation to mark as read
                setConversations(prev => prev.map(c =>
                    c.id === conversation.id ? { ...c, unread_count: 0 } : c
                ));

                // Scroll to bottom after messages load
                setTimeout(() => scrollToBottom(), 100);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

        setSendingMessage(true);
        try {
            const response = await fetch(`/api/v1/messaging/conversations/${selectedConversation.id}/messages`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'include',
                body: JSON.stringify({ content: newMessage }),
            });

            if (response.ok) {
                const data = await response.json();
                setMessages(prev => [...prev, data.data]);
                setNewMessage('');
                scrollToBottom();

                // Update last message in conversations list
                setConversations(prev => prev.map(c =>
                    c.id === selectedConversation.id
                        ? { ...c, last_message: data.data, updated_at: new Date().toISOString() }
                        : c
                ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSendingMessage(false);
        }
    };

    const handleTyping = useCallback(() => {
        if (selectedConversation) {
            // Send typing indicator
            fetch(`/api/v1/messaging/conversations/${selectedConversation.id}/typing`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'include',
                body: JSON.stringify({ is_typing: true }),
            });

            // Clear previous timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Set timeout to stop typing indicator
            typingTimeoutRef.current = setTimeout(() => {
                fetch(`/api/v1/messaging/conversations/${selectedConversation.id}/typing`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': getCsrfToken(),
                    },
                    credentials: 'include',
                    body: JSON.stringify({ is_typing: false }),
                });
            }, 2000);
        }
    }, [selectedConversation]);

    const searchUsers = async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            const response = await fetch(`/api/v1/messaging/users/search?query=${encodeURIComponent(query)}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.data || []);
            }
        } catch (error) {
            console.error('Failed to search users:', error);
        }
    };

    const startConversation = async (userId: number) => {
        try {
            const response = await fetch('/api/v1/messaging/conversations', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'include',
                body: JSON.stringify({
                    type: 'direct',
                    participant_ids: [userId],
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const conversation = data.data;

                // Check if conversation already exists in list
                const exists = conversations.find(c => c.id === conversation.id);
                if (!exists) {
                    setConversations(prev => [conversation, ...prev]);
                }

                selectConversation(conversation);
                setShowNewConversation(false);
                setUserSearchQuery('');
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Failed to start conversation:', error);
        }
    };

    const getConversationName = (conversation: Conversation): string => {
        if (!conversation) return 'Unknown';

        if (conversation.type === 'group') {
            return conversation.name || 'Group Chat';
        }

        const otherParticipant = conversation.participants?.find(
            p => p.user_id !== auth.user.id
        );
        return otherParticipant?.user?.name || 'Unknown';
    };

    const getConversationAvatar = (conversation: Conversation): string | undefined => {
        if (conversation.type === 'group') {
            return undefined;
        }

        const otherParticipant = conversation.participants?.find(
            p => p.user_id !== auth.user.id
        );
        return otherParticipant?.user?.profile_picture_path;
    };

    const formatTime = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    const filteredConversations = conversations.filter(conversation => {
        const name = getConversationName(conversation).toLowerCase();
        return name.includes(searchQuery.toLowerCase());
    });

    return (
        <AlumniBaseLayout title="Messages">
            <Head title="Messages" />

            <div className="flex h-[calc(100vh-8rem)] bg-background rounded-lg overflow-hidden border">
                {/* Conversations List */}
                <div className={cn(
                    "w-full md:w-80 lg:w-96 border-r flex flex-col bg-card",
                    showMobileConversation && "hidden md:flex"
                )}>
                    {/* Header */}
                    <div className="p-4 border-b">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <MessageCircle className="h-5 w-5" />
                                Messages
                                {unreadCount > 0 && (
                                    <Badge variant="destructive" className="ml-2">
                                        {unreadCount}
                                    </Badge>
                                )}
                            </h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowNewConversation(true)}
                            >
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {/* Conversations */}
                    <ScrollArea className="flex-1">
                        {loading ? (
                            <div className="flex items-center justify-center h-32">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                                <MessageCircle className="h-8 w-8 mb-2" />
                                <p>No conversations yet</p>
                                <Button
                                    variant="link"
                                    onClick={() => setShowNewConversation(true)}
                                    className="mt-2"
                                >
                                    Start a new conversation
                                </Button>
                            </div>
                        ) : (
                            filteredConversations.map((conversation) => (
                                <div
                                    key={conversation.id}
                                    onClick={() => selectConversation(conversation)}
                                    className={cn(
                                        "flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                                        selectedConversation?.id === conversation.id && "bg-muted"
                                    )}
                                >
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={getConversationAvatar(conversation)} />
                                        <AvatarFallback>
                                            {conversation.type === 'group' ? (
                                                <Users className="h-5 w-5" />
                                            ) : (
                                                (getConversationName(conversation) || 'U').charAt(0).toUpperCase()
                                            )}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium truncate">
                                                {getConversationName(conversation)}
                                            </span>
                                            {conversation.latest_message && (
                                                <span className="text-xs text-muted-foreground">
                                                    {formatTime(conversation.latest_message.created_at)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-muted-foreground truncate">
                                                {conversation.latest_message?.content || 'No messages yet'}
                                            </p>
                                            {(conversation.unread_count ?? 0) > 0 && (
                                                <Badge variant="default" className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                                                    {conversation.unread_count}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </ScrollArea>
                </div>

                {/* Chat Area */}
                <div className={cn(
                    "flex-1 flex flex-col",
                    !showMobileConversation && "hidden md:flex"
                )}>
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b flex items-center justify-between bg-card">
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="md:hidden"
                                        onClick={() => setShowMobileConversation(false)}
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={getConversationAvatar(selectedConversation)} />
                                        <AvatarFallback>
                                            {selectedConversation.type === 'group' ? (
                                                <Users className="h-4 w-4" />
                                            ) : (
                                                (getConversationName(selectedConversation) || 'U').charAt(0).toUpperCase()
                                            )}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold">
                                            {getConversationName(selectedConversation)}
                                        </h3>
                                        {typingUsers[selectedConversation.id]?.length > 0 && (
                                            <p className="text-xs text-muted-foreground animate-pulse">
                                                {typingUsers[selectedConversation.id].join(', ')} typing...
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                            <Info className="h-4 w-4 mr-2" />
                                            View Info
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive">
                                            <Ban className="h-4 w-4 mr-2" />
                                            Block User
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Messages */}
                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-4">
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={cn(
                                                "flex",
                                                message.sender_id === auth.user.id ? "justify-end" : "justify-start"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "max-w-[70%] rounded-lg px-4 py-2",
                                                    message.sender_id === auth.user.id
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted"
                                                )}
                                            >
                                                {message.sender_id !== auth.user.id && selectedConversation.type === 'group' && (
                                                    <p className="text-xs font-medium mb-1 opacity-70">
                                                        {message.sender?.name}
                                                    </p>
                                                )}
                                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                                <div className="flex items-center justify-end gap-1 mt-1">
                                                    <span className="text-xs opacity-70">
                                                        {formatTime(message.created_at)}
                                                    </span>
                                                    {message.sender_id === auth.user.id && (
                                                        message.is_read ? (
                                                            <CheckCheck className="h-3 w-3 opacity-70" />
                                                        ) : (
                                                            <Check className="h-3 w-3 opacity-70" />
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            </ScrollArea>

                            {/* Message Input */}
                            <div className="p-4 border-t bg-card">
                                <div className="flex items-center gap-2">
                                    <Input
                                        placeholder="Type a message..."
                                        value={newMessage}
                                        onChange={(e) => {
                                            setNewMessage(e.target.value);
                                            handleTyping();
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                sendMessage();
                                            }
                                        }}
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={sendMessage}
                                        disabled={!newMessage.trim() || sendingMessage}
                                    >
                                        {sendingMessage ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                            <MessageCircle className="h-16 w-16 mb-4" />
                            <h3 className="text-lg font-medium">Select a conversation</h3>
                            <p className="text-sm">Choose a conversation from the list or start a new one</p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => setShowNewConversation(true)}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                New Conversation
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* New Conversation Dialog */}
            <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>New Conversation</DialogTitle>
                        <DialogDescription>
                            Search for a user to start a conversation
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                value={userSearchQuery}
                                onChange={(e) => {
                                    setUserSearchQuery(e.target.value);
                                    searchUsers(e.target.value);
                                }}
                                className="pl-9"
                            />
                        </div>
                        <ScrollArea className="h-64">
                            {searchResults.length === 0 && userSearchQuery.length >= 2 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <User className="h-8 w-8 mb-2" />
                                    <p>No users found</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {searchResults.map((user) => (
                                        <div
                                            key={user.id}
                                            onClick={() => startConversation(user.id)}
                                            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                                        >
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={user.profile_picture_path} />
                                                <AvatarFallback>
                                                    {(user.name || 'U').charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                            {user.role && <Badge variant="secondary">{user.role}</Badge>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>
        </AlumniBaseLayout>
    );
}
