import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Users,
    MessageCircle,
    Search,
    UserX,
    UserCheck,
    Clock,
    Briefcase,
    GraduationCap,
    CheckCircle,
    XCircle,
    Loader2,
    Eye,
    UserPlus,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { PageProps as InertiaPageProps } from '@inertiajs/core';

interface AlumniProfile {
    id: number;
    first_name: string;
    last_name: string;
    current_job_title?: string;
    current_employer?: string;
    graduation_year?: number;
    degree_program?: string;
    city?: string;
    country?: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    profile_picture_path?: string;
    profile_picture_url?: string;
    alumni_profile?: AlumniProfile;
}

interface Connection {
    connection_id: number;
    user: User;
    connected_since: string;
}

interface PendingRequest {
    id: number;
    sender_id: number;
    receiver_id: number;
    status: string;
    message?: string;
    created_at: string;
    sender?: User;
    receiver?: User;
}

interface Props {
    connections: Connection[];
}

interface PageProps extends InertiaPageProps {
    flash?: { success?: string; error?: string };
    [key: string]: unknown;
}

export default function MyConnections({ connections: initialConnections }: Props) {
    const { flash } = usePage<PageProps>().props;
    const [connections, setConnections] = useState<Connection[]>(initialConnections || []);
    const [sentRequests, setSentRequests] = useState<PendingRequest[]>([]);
    const [receivedRequests, setReceivedRequests] = useState<PendingRequest[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [removingConnection, setRemovingConnection] = useState<number | null>(null);
    const [connectionToRemove, setConnectionToRemove] = useState<Connection | null>(null);
    const [cancellingRequest, setCancellingRequest] = useState<number | null>(null);

    // Sync local state when Inertia prop updates (e.g. after router.reload)
    useEffect(() => {
        setConnections(initialConnections || []);
    }, [initialConnections]);

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const fetchPendingRequests = async () => {
        try {
            const response = await fetch('/alumni/network/requests', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setSentRequests(data.sent || []);
            setReceivedRequests(data.received || []);
        } catch (error) {
            console.error('Failed to fetch pending requests:', error);
        }
    };

    const handleAcceptRequest = (requestId: number) => {
        router.put(`/alumni/network/${requestId}/accept`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                fetchPendingRequests();
                router.reload({ only: ['connections'] });
            }
        });
    };

    const handleRejectRequest = (requestId: number) => {
        router.put(`/alumni/network/${requestId}/reject`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                fetchPendingRequests();
            }
        });
    };

    const handleCancelRequest = async (requestId: number) => {
        setCancellingRequest(requestId);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const response = await fetch(`/alumni/network/${requestId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken,
                },
            });
            if (response.ok) {
                setSentRequests(prev => prev.filter(r => r.id !== requestId));
            }
        } catch {
            // silent
        } finally {
            setCancellingRequest(null);
        }
    };

    const handleRemoveConnection = () => {
        if (!connectionToRemove) return;
        setRemovingConnection(connectionToRemove.connection_id);
        router.delete(`/alumni/network/${connectionToRemove.connection_id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setConnections(prev => prev.filter(c => c.connection_id !== connectionToRemove.connection_id));
                setConnectionToRemove(null);
            },
            onFinish: () => {
                setRemovingConnection(null);
            }
        });
    };

    const handleStartConversation = async (userId: number) => {
        try {
            const response = await fetch('/api/v1/messaging/conversations', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ type: 'direct', participant_ids: [userId] }),
            });
            if (response.ok) {
                router.visit('/alumni/messages');
            } else {
                router.visit('/alumni/messages', { preserveState: false });
            }
        } catch {
            router.visit('/alumni/messages');
        }
    };

    const handleViewProfile = (userId: number) => {
        router.visit(`/alumni/network/profile/${userId}`);
    };

    const getDisplayName = (user: User) => {
        if (user.alumni_profile) {
            return `${user.alumni_profile.first_name} ${user.alumni_profile.last_name}`.trim() || user.name;
        }
        return user.name || user.email.split('@')[0];
    };

    const getInitials = (user: User) => {
        const name = getDisplayName(user);
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const filteredConnections = connections.filter(conn => {
        const name = getDisplayName(conn.user).toLowerCase();
        const query = searchQuery.toLowerCase();
        return name.includes(query) ||
            conn.user.email.toLowerCase().includes(query) ||
            conn.user.alumni_profile?.current_employer?.toLowerCase().includes(query) ||
            conn.user.alumni_profile?.current_job_title?.toLowerCase().includes(query);
    });

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <AlumniBaseLayout title="My Connections">
            <Head title="My Connections" />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 bg-maroon-100 dark:bg-maroon-900/40 rounded-xl flex items-center justify-center">
                            <Users className="h-6 w-6 text-maroon-600 dark:text-maroon-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-maroon-800 dark:text-maroon-200">My Connections</h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your alumni connections and requests</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => router.visit('/alumni/messages')}
                            variant="outline"
                            className="border-maroon-300 text-maroon-700 hover:bg-maroon-50 dark:border-maroon-700 dark:text-maroon-300"
                        >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Messages
                        </Button>
                        <Button
                            onClick={() => router.visit('/alumni/network')}
                            className="bg-maroon-700 hover:bg-maroon-800 text-white"
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Find Alumni
                        </Button>
                    </div>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg dark:bg-green-900/20 dark:border-green-800 dark:text-green-300">
                        {flash.success}
                    </div>
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                    <Card className="border-beige-200 dark:border-gray-700 shadow-sm">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-maroon-700 dark:text-maroon-300">{connections.length}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Connections</div>
                        </CardContent>
                    </Card>
                    <Card className="border-beige-200 dark:border-gray-700 shadow-sm">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{receivedRequests.length}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Received</div>
                        </CardContent>
                    </Card>
                    <Card className="border-beige-200 dark:border-gray-700 shadow-sm">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{sentRequests.length}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Sent</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="connections" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="connections" className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4" />
                            <span className="hidden sm:inline">Connections</span>
                            {connections.length > 0 && (
                                <Badge variant="secondary" className="ml-1">{connections.length}</Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="received" className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span className="hidden sm:inline">Received</span>
                            {receivedRequests.length > 0 && (
                                <Badge className="ml-1 bg-maroon-600 text-white">{receivedRequests.length}</Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="sent" className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span className="hidden sm:inline">Sent</span>
                            {sentRequests.length > 0 && (
                                <Badge variant="secondary" className="ml-1">{sentRequests.length}</Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* Connected Alumni Tab */}
                    <TabsContent value="connections">
                        <Card className="border-beige-200 dark:border-gray-700 shadow-sm">
                            <CardHeader className="pb-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <CardTitle className="text-lg text-maroon-800 dark:text-maroon-200 flex items-center">
                                        <UserCheck className="h-5 w-5 mr-2" />
                                        Your Connections
                                    </CardTitle>
                                    <div className="relative w-full sm:w-72">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Search connections..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 border-beige-300 dark:border-gray-600"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {filteredConnections.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {filteredConnections.map((conn) => (
                                            <div
                                                key={conn.connection_id}
                                                className="flex items-start p-4 border border-beige-200 dark:border-gray-700 rounded-xl hover:bg-beige-50/50 dark:hover:bg-gray-800/50 transition-colors group"
                                            >
                                                <Avatar
                                                    className="h-12 w-12 flex-shrink-0 cursor-pointer ring-2 ring-beige-200 dark:ring-gray-700 group-hover:ring-maroon-300 transition-all"
                                                    onClick={() => handleViewProfile(conn.user.id)}
                                                >
                                                    <AvatarImage src={conn.user.profile_picture_url || (conn.user.profile_picture_path ? `/api/v1/files/${conn.user.profile_picture_path}` : undefined)} />
                                                    <AvatarFallback className="bg-maroon-100 text-maroon-700 dark:bg-maroon-900 dark:text-maroon-300 font-semibold">
                                                        {getInitials(conn.user)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="ml-3 flex-1 min-w-0">
                                                    <h3
                                                        className="font-semibold text-gray-900 dark:text-gray-100 truncate cursor-pointer hover:text-maroon-700 dark:hover:text-maroon-300 transition-colors"
                                                        onClick={() => handleViewProfile(conn.user.id)}
                                                    >
                                                        {getDisplayName(conn.user)}
                                                    </h3>
                                                    {conn.user.alumni_profile?.current_job_title && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center truncate mt-0.5">
                                                            <Briefcase className="h-3 w-3 mr-1 flex-shrink-0" />
                                                            {conn.user.alumni_profile.current_job_title}
                                                            {conn.user.alumni_profile.current_employer && (
                                                                <span className="ml-1">@ {conn.user.alumni_profile.current_employer}</span>
                                                            )}
                                                        </p>
                                                    )}
                                                    {conn.user.alumni_profile?.graduation_year && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center mt-0.5">
                                                            <GraduationCap className="h-3 w-3 mr-1" />
                                                            Class of {conn.user.alumni_profile.graduation_year}
                                                        </p>
                                                    )}
                                                    <p className="text-[10px] text-gray-400 mt-1">
                                                        Connected since {formatDate(conn.connected_since)}
                                                    </p>
                                                    {/* Action buttons */}
                                                    <div className="flex items-center gap-2 mt-2.5">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleViewProfile(conn.user.id)}
                                                            className="h-7 text-xs text-maroon-700 border-maroon-200 hover:bg-maroon-50 dark:text-maroon-300 dark:border-maroon-800"
                                                        >
                                                            <Eye className="h-3 w-3 mr-1" /> Profile
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleStartConversation(conn.user.id)}
                                                            className="h-7 text-xs bg-maroon-700 hover:bg-maroon-800 text-white"
                                                        >
                                                            <MessageCircle className="h-3 w-3 mr-1" /> Message
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setConnectionToRemove(conn)}
                                                            disabled={removingConnection === conn.connection_id}
                                                            className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 ml-auto"
                                                        >
                                                            {removingConnection === conn.connection_id ? (
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : (
                                                                <UserX className="h-3 w-3" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            {searchQuery ? 'No Matching Connections' : 'No Connections Yet'}
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                                            {searchQuery
                                                ? 'Try a different search term'
                                                : 'Start connecting with other alumni from the directory'}
                                        </p>
                                        {!searchQuery && (
                                            <Button
                                                onClick={() => router.visit('/alumni/network')}
                                                className="bg-maroon-700 hover:bg-maroon-800 text-white"
                                            >
                                                <Users className="h-4 w-4 mr-2" />
                                                Browse Alumni Directory
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Received Requests Tab */}
                    <TabsContent value="received">
                        <Card className="border-beige-200 dark:border-gray-700 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg text-maroon-800 dark:text-maroon-200 flex items-center">
                                    <Clock className="h-5 w-5 mr-2" />
                                    Pending Requests
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {receivedRequests.length > 0 ? (
                                    <div className="space-y-3">
                                        {receivedRequests.map((request) => {
                                            const sender = request.sender;
                                            const displayName = sender?.alumni_profile
                                                ? `${sender.alumni_profile.first_name} ${sender.alumni_profile.last_name}`
                                                : sender?.name || 'Unknown';
                                            const initials = sender?.alumni_profile
                                                ? `${sender.alumni_profile.first_name?.[0] || ''}${sender.alumni_profile.last_name?.[0] || ''}`
                                                : sender?.name?.slice(0, 2).toUpperCase() || '??';
                                            return (
                                                <div
                                                    key={request.id}
                                                    className="flex items-start p-4 border border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10 rounded-xl"
                                                >
                                                    <Avatar
                                                        className="h-12 w-12 flex-shrink-0 cursor-pointer"
                                                        onClick={() => sender && handleViewProfile(sender.id)}
                                                    >
                                                        <AvatarImage src={sender?.profile_picture_url || (sender?.profile_picture_path ? `/api/v1/files/${sender.profile_picture_path}` : undefined)} />
                                                        <AvatarFallback className="bg-maroon-100 text-maroon-700 dark:bg-maroon-900 dark:text-maroon-300 font-semibold">
                                                            {initials}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="ml-3 flex-1 min-w-0">
                                                        <h3
                                                            className="font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-maroon-700 transition-colors"
                                                            onClick={() => sender && handleViewProfile(sender.id)}
                                                        >
                                                            {displayName}
                                                        </h3>
                                                        {sender?.alumni_profile?.current_job_title && (
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                                                <Briefcase className="h-3 w-3 mr-1 inline" />
                                                                {sender.alumni_profile.current_job_title}
                                                            </p>
                                                        )}
                                                        {request.message && (
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 italic mt-1">
                                                                &ldquo;{request.message}&rdquo;
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {formatDate(request.created_at)}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2.5">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleAcceptRequest(request.id)}
                                                                className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                                                            >
                                                                <CheckCircle className="h-3 w-3 mr-1" /> Accept
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleRejectRequest(request.id)}
                                                                className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-50"
                                                            >
                                                                <XCircle className="h-3 w-3 mr-1" /> Decline
                                                            </Button>
                                                            {sender && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleViewProfile(sender.id)}
                                                                    className="h-7 text-xs text-maroon-700 dark:text-maroon-300 ml-auto"
                                                                >
                                                                    <Eye className="h-3 w-3 mr-1" /> Profile
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Clock className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Pending Requests</h3>
                                        <p className="text-gray-500 dark:text-gray-400">You don&apos;t have any pending connection requests</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Sent Requests Tab */}
                    <TabsContent value="sent">
                        <Card className="border-beige-200 dark:border-gray-700 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg text-maroon-800 dark:text-maroon-200 flex items-center">
                                    <Clock className="h-5 w-5 mr-2" />
                                    Sent Requests
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {sentRequests.length > 0 ? (
                                    <div className="space-y-3">
                                        {sentRequests.map((request) => {
                                            const receiver = request.receiver;
                                            const displayName = receiver?.alumni_profile
                                                ? `${receiver.alumni_profile.first_name} ${receiver.alumni_profile.last_name}`
                                                : receiver?.name || 'Unknown';
                                            const initials = receiver?.alumni_profile
                                                ? `${receiver.alumni_profile.first_name?.[0] || ''}${receiver.alumni_profile.last_name?.[0] || ''}`
                                                : receiver?.name?.slice(0, 2).toUpperCase() || '??';
                                            return (
                                                <div
                                                    key={request.id}
                                                    className="flex items-start p-4 border border-yellow-100 dark:border-yellow-900/30 bg-yellow-50/30 dark:bg-yellow-900/10 rounded-xl"
                                                >
                                                    <Avatar
                                                        className="h-12 w-12 flex-shrink-0 cursor-pointer"
                                                        onClick={() => receiver && handleViewProfile(receiver.id)}
                                                    >
                                                        <AvatarImage src={receiver?.profile_picture_url || (receiver?.profile_picture_path ? `/api/v1/files/${receiver.profile_picture_path}` : undefined)} />
                                                        <AvatarFallback className="bg-maroon-100 text-maroon-700 dark:bg-maroon-900 dark:text-maroon-300 font-semibold">
                                                            {initials}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="ml-3 flex-1 min-w-0">
                                                        <h3
                                                            className="font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-maroon-700 transition-colors"
                                                            onClick={() => receiver && handleViewProfile(receiver.id)}
                                                        >
                                                            {displayName}
                                                        </h3>
                                                        {receiver?.alumni_profile?.current_job_title && (
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                                                <Briefcase className="h-3 w-3 mr-1 inline" />
                                                                {receiver.alumni_profile.current_job_title}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            Sent on {formatDate(request.created_at)}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2.5">
                                                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs">
                                                                <Clock className="h-3 w-3 mr-1" /> Pending
                                                            </Badge>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleCancelRequest(request.id)}
                                                                disabled={cancellingRequest === request.id}
                                                                className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-50 ml-auto"
                                                            >
                                                                {cancellingRequest === request.id ? (
                                                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                                ) : (
                                                                    <XCircle className="h-3 w-3 mr-1" />
                                                                )}
                                                                Cancel
                                                            </Button>
                                                            {receiver && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleViewProfile(receiver.id)}
                                                                    className="h-7 text-xs text-maroon-700 dark:text-maroon-300"
                                                                >
                                                                    <Eye className="h-3 w-3 mr-1" /> Profile
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Clock className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Sent Requests</h3>
                                        <p className="text-gray-500 dark:text-gray-400 mb-4">You haven&apos;t sent any connection requests yet</p>
                                        <Button
                                            onClick={() => router.visit('/alumni/network')}
                                            className="bg-maroon-700 hover:bg-maroon-800 text-white"
                                        >
                                            <Users className="h-4 w-4 mr-2" />
                                            Browse Alumni Directory
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Remove Connection Confirmation Dialog */}
            <Dialog open={!!connectionToRemove} onOpenChange={() => setConnectionToRemove(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove Connection</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove <strong>{connectionToRemove && getDisplayName(connectionToRemove.user)}</strong> from your connections?
                            You will no longer be able to message them until you reconnect.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConnectionToRemove(null)}>Cancel</Button>
                        <Button onClick={handleRemoveConnection} className="bg-red-600 hover:bg-red-700 text-white">
                            Remove Connection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AlumniBaseLayout>
    );
}
