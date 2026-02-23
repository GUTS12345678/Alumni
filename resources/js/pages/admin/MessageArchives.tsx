import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Head } from '@inertiajs/react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Search, MessageCircle, Users, User, ArrowLeft, ChevronLeft, ChevronRight,
    Download, Calendar, Loader2, Eye, X, Clock, Hash,
    MessageSquare, Shield
} from 'lucide-react';
import axios from 'axios';

// ─── Types ──────────────────────────────────────────────────────────

interface ParticipantInfo {
    id: number;
    name: string;
    email: string;
    role: string;
    profile_picture_path?: string;
}

interface ArchiveMessage {
    id: number;
    conversation_id: number;
    sender_id: number;
    content: string;
    type: string;
    is_edited: boolean;
    created_at: string;
    sender?: {
        id: number;
        name: string;
        email: string;
        profile_picture_path?: string;
        role: string;
        alumniProfile?: { first_name?: string; last_name?: string };
    };
}

interface ArchiveConversation {
    id: number;
    type: string;
    name?: string;
    created_at: string;
    updated_at: string;
    messages_count: number;
    active_participants_count: number;
    participant_list: ParticipantInfo[];
    latest_message?: {
        content: string;
        created_at: string;
        sender?: { name: string };
    };
    creator?: { id: number; name: string; email: string };
}

interface Stats {
    total_conversations: number;
    total_messages: number;
    direct_conversations: number;
    group_conversations: number;
    today_messages: number;
}

// ─── Helpers ────────────────────────────────────────────────────────

const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

const getProfilePicUrl = (path?: string | null): string | undefined => {
    if (!path) return undefined;
    // Full URL (http/https) or legacy /storage path — use as-is
    if (path.startsWith('http') || path.startsWith('/storage')) return path;
    // Relative path → serve via private file route
    return `/api/v1/files/${path}`;
};

const getSenderName = (sender?: ArchiveMessage['sender']): string => {
    if (!sender) return 'Unknown';
    if (sender.alumniProfile) {
        const full = `${sender.alumniProfile.first_name ?? ''} ${sender.alumniProfile.last_name ?? ''}`.trim();
        if (full) return full;
    }
    return sender.name || sender.email?.split('@')[0] || 'Unknown';
};

const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

const roleColor = (role: string) => {
    switch (role) {
        case 'super_admin': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        case 'admin': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        default: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    }
};

// ─── Component ──────────────────────────────────────────────────────

interface Props {
    user: { id: number; email: string; role: string; status: string;[key: string]: unknown };
}

export default function MessageArchives({ user }: Props) {
    // Conversation list state
    const [conversations, setConversations] = useState<ArchiveConversation[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Filters
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Selected conversation & messages
    const [selectedConversation, setSelectedConversation] = useState<ArchiveConversation | null>(null);
    const [messages, setMessages] = useState<ArchiveMessage[]>([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [msgPage, setMsgPage] = useState(1);
    const [msgTotalPages, setMsgTotalPages] = useState(1);
    const [msgSearch, setMsgSearch] = useState('');
    const [exporting, setExporting] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ─── Fetch Conversations ─────────────────────────────────────

    const fetchConversations = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page, per_page: 20 };
            if (search) params.search = search;
            if (typeFilter) params.type = typeFilter;
            if (dateFrom) params.from = dateFrom;
            if (dateTo) params.to = dateTo;

            const res = await axios.get('/api/v1/messaging/archive/conversations', { params });
            setConversations(res.data.data.data || []);
            setTotalPages(res.data.data.last_page || 1);
            setTotalItems(res.data.data.total || 0);
            setCurrentPage(page);
            if (res.data.stats) setStats(res.data.stats);
        } catch (error) {
            console.error('Failed to fetch archive:', error);
        } finally {
            setLoading(false);
        }
    }, [search, typeFilter, dateFrom, dateTo]);

    useEffect(() => {
        const timer = setTimeout(() => fetchConversations(1), 300);
        return () => clearTimeout(timer);
    }, [fetchConversations]);

    // ─── Fetch Messages ──────────────────────────────────────────

    const fetchMessages = useCallback(async (conversationId: number, page = 1, searchQ = '') => {
        setMessagesLoading(true);
        try {
            const params: Record<string, string | number> = { page, per_page: 100 };
            if (searchQ) params.search = searchQ;

            const res = await axios.get(`/api/v1/messaging/archive/conversations/${conversationId}`, { params });
            setMessages(res.data.data.messages.data || []);
            setMsgPage(page);
            setMsgTotalPages(res.data.data.messages.last_page || 1);

            // Scroll to bottom on first load
            if (page === 1 && !searchQ) {
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setMessagesLoading(false);
        }
    }, []);

    const openConversation = (conv: ArchiveConversation) => {
        setSelectedConversation(conv);
        setMsgSearch('');
        setMsgPage(1);
        fetchMessages(conv.id, 1, '');
    };

    const closeConversation = () => {
        setSelectedConversation(null);
        setMessages([]);
        setMsgSearch('');
    };

    // ─── Export ──────────────────────────────────────────────────

    const handleExport = async (conversationId: number) => {
        setExporting(true);
        try {
            const res = await axios.get(`/api/v1/messaging/archive/conversations/${conversationId}/export`);
            const jsonStr = JSON.stringify(res.data.data, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `conversation-${conversationId}-export.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export conversation');
        } finally {
            setExporting(false);
        }
    };

    // ─── Conversation List View ─────────────────────────────────

    const getParticipantNames = (conv: ArchiveConversation) => {
        if (conv.type === 'direct' && conv.participant_list.length === 2) {
            return conv.participant_list.map(p => p.name).join(' ↔ ');
        }
        return conv.name || conv.participant_list.map(p => p.name).join(', ');
    };

    const conversationListView = (
        <div className="space-y-4">
            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <MessageSquare className="h-5 w-5 mx-auto mb-1 text-maroon-600" />
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total_conversations}</p>
                            <p className="text-xs text-gray-500">Total Conversations</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Hash className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total_messages}</p>
                            <p className="text-xs text-gray-500">Total Messages</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <User className="h-5 w-5 mx-auto mb-1 text-green-600" />
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.direct_conversations}</p>
                            <p className="text-xs text-gray-500">Direct Chats</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Users className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.group_conversations}</p>
                            <p className="text-xs text-gray-500">Group Chats</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Clock className="h-5 w-5 mx-auto mb-1 text-amber-600" />
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.today_messages}</p>
                            <p className="text-xs text-gray-500">Today&apos;s Messages</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by participant name or email..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <select
                                value={typeFilter}
                                onChange={e => setTypeFilter(e.target.value)}
                                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-200"
                            >
                                <option value="">All Types</option>
                                <option value="direct">Direct</option>
                                <option value="group">Group</option>
                                <option value="support">Support</option>
                            </select>
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={e => setDateFrom(e.target.value)}
                                    className="h-9 w-36 text-sm"
                                    placeholder="From"
                                />
                                <span className="text-gray-400 text-sm">to</span>
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={e => setDateTo(e.target.value)}
                                    className="h-9 w-36 text-sm"
                                    placeholder="To"
                                />
                            </div>
                            {(search || typeFilter || dateFrom || dateTo) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setSearch(''); setTypeFilter(''); setDateFrom(''); setDateTo(''); }}
                                    className="text-gray-500"
                                >
                                    <X className="h-4 w-4 mr-1" /> Clear
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Conversation List */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                        <span>Conversations ({totalItems})</span>
                        <Button variant="outline" size="sm" onClick={() => fetchConversations(currentPage)}>
                            Refresh
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            <span className="ml-2 text-gray-500">Loading conversations...</span>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="text-center py-16">
                            <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                            <p className="text-gray-500">No conversations found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {conversations.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => openConversation(conv)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        {conv.type === 'direct' ? (
                                            <div className="relative">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={getProfilePicUrl(conv.participant_list[0]?.profile_picture_path)} />
                                                    <AvatarFallback className="bg-maroon-100 text-maroon-700 text-sm">
                                                        {getInitials(conv.participant_list[0]?.name || 'U')}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>
                                        ) : (
                                            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                                                {getParticipantNames(conv)}
                                            </span>
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${conv.type === 'direct'
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                : conv.type === 'group'
                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                }`}>
                                                {conv.type}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                            {conv.latest_message
                                                ? `${conv.latest_message.sender?.name ?? 'Unknown'}: ${conv.latest_message.content}`
                                                : 'No messages yet'}
                                        </p>
                                    </div>

                                    {/* Meta */}
                                    <div className="flex-shrink-0 text-right">
                                        <p className="text-xs text-gray-400">{formatDate(conv.updated_at)}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {conv.messages_count} msg{conv.messages_count !== 1 ? 's' : ''}
                                        </p>
                                    </div>

                                    <Eye className="h-4 w-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                                </button>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                        Page {currentPage} of {totalPages} ({totalItems} conversations)
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline" size="sm"
                            onClick={() => fetchConversations(currentPage - 1)}
                            disabled={currentPage <= 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                        </Button>
                        <Button
                            variant="outline" size="sm"
                            onClick={() => fetchConversations(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                        >
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );

    // ─── Message Thread View ─────────────────────────────────────

    const messageThreadView = selectedConversation && (
        <div className="space-y-4">
            {/* Thread Header */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={closeConversation} className="flex-shrink-0">
                            <ArrowLeft className="h-4 w-4 mr-1" /> Back
                        </Button>
                        <div className="flex-1 min-w-0">
                            <h2 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {getParticipantNames(selectedConversation)}
                            </h2>
                            <p className="text-xs text-gray-500">
                                {selectedConversation.type === 'direct' ? 'Direct Message' : 'Group Chat'}
                                {' · '}Started {formatDateTime(selectedConversation.created_at)}
                                {' · '}{selectedConversation.messages_count} messages
                            </p>
                        </div>
                        <Button
                            variant="outline" size="sm"
                            onClick={() => handleExport(selectedConversation.id)}
                            disabled={exporting}
                        >
                            {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
                            Export JSON
                        </Button>
                    </div>

                    {/* Participants */}
                    <div className="mt-3 flex flex-wrap gap-2">
                        {selectedConversation.participant_list.map(p => (
                            <div
                                key={p.id}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs"
                            >
                                <Avatar className="h-5 w-5">
                                    <AvatarImage src={getProfilePicUrl(p.profile_picture_path)} />
                                    <AvatarFallback className="text-[8px] bg-gray-200 dark:bg-gray-600">
                                        {getInitials(p.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-gray-700 dark:text-gray-300">{p.name}</span>
                                <span className={`px-1 py-0 rounded text-[10px] font-medium ${roleColor(p.role)}`}>
                                    {p.role === 'super_admin' ? 'SA' : p.role === 'admin' ? 'Admin' : 'Alumni'}
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Message Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Search within conversation..."
                    value={msgSearch}
                    onChange={e => {
                        setMsgSearch(e.target.value);
                        // Debounced search
                        const timer = setTimeout(() => {
                            if (selectedConversation) fetchMessages(selectedConversation.id, 1, e.target.value);
                        }, 400);
                        return () => clearTimeout(timer);
                    }}
                    className="pl-9"
                />
            </div>

            {/* Messages */}
            <Card>
                <CardContent className="p-0">
                    {messagesLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            <span className="ml-2 text-gray-500">Loading messages...</span>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-16">
                            <MessageCircle className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500">
                                {msgSearch ? 'No messages match your search' : 'No messages in this conversation'}
                            </p>
                        </div>
                    ) : (
                        <div className="max-h-[60vh] overflow-y-auto">
                            {/* Date dividers + messages */}
                            {messages.map((msg, idx) => {
                                const senderName = getSenderName(msg.sender);
                                const showDate = idx === 0 ||
                                    formatDate(messages[idx - 1].created_at) !== formatDate(msg.created_at);
                                const showSender = idx === 0 || messages[idx - 1].sender_id !== msg.sender_id;
                                const isAdmin = msg.sender?.role === 'admin' || msg.sender?.role === 'super_admin';

                                return (
                                    <React.Fragment key={msg.id}>
                                        {showDate && (
                                            <div className="sticky top-0 z-10 flex items-center justify-center py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-gray-100 dark:border-gray-700/50">
                                                <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                    {formatDate(msg.created_at)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="px-4 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                            <div className="flex items-start gap-2.5">
                                                {/* Avatar (shown only when sender changes) */}
                                                <div className="flex-shrink-0 w-8 pt-0.5">
                                                    {showSender && (
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={getProfilePicUrl(msg.sender?.profile_picture_path)} />
                                                            <AvatarFallback className="text-xs bg-gray-200 dark:bg-gray-700">
                                                                {getInitials(senderName)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    {showSender && (
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                                {senderName}
                                                            </span>
                                                            {isAdmin && (
                                                                <Shield className="h-3 w-3 text-blue-500" />
                                                            )}
                                                            <span className={`px-1 py-0 rounded text-[10px] font-medium ${roleColor(msg.sender?.role || 'alumni')}`}>
                                                                {msg.sender?.role === 'super_admin' ? 'Super Admin'
                                                                    : msg.sender?.role === 'admin' ? 'Admin' : 'Alumni'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 break-words whitespace-pre-wrap">
                                                        {msg.content}
                                                    </p>
                                                </div>

                                                {/* Timestamp */}
                                                <span className="flex-shrink-0 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                                                    {formatTime(msg.created_at)}
                                                    {msg.is_edited && ' (edited)'}
                                                </span>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                            <div ref={messagesEndRef} className="h-2" />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Message Pagination */}
            {msgTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline" size="sm"
                        onClick={() => selectedConversation && fetchMessages(selectedConversation.id, msgPage - 1, msgSearch)}
                        disabled={msgPage <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-500">Page {msgPage} / {msgTotalPages}</span>
                    <Button
                        variant="outline" size="sm"
                        onClick={() => selectedConversation && fetchMessages(selectedConversation.id, msgPage + 1, msgSearch)}
                        disabled={msgPage >= msgTotalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );

    // ─── Render ──────────────────────────────────────────────────

    return (
        <AdminBaseLayout title="Message Archives" user={user}>
            <Head title="Message Archives" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <MessageCircle className="h-7 w-7 text-maroon-600" />
                            Message Archives
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Browse and export all conversation history for record-keeping
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                {selectedConversation ? messageThreadView : conversationListView}
            </div>
        </AdminBaseLayout>
    );
}
