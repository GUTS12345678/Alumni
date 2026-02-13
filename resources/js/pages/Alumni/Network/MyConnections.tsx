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
    Loader2
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface AlumniProfile {
    id: number;
    first_name: string;
    last_name: string;
    current_job_title?: string;
    current_employer?: string;
    graduation_year?: number;
}

interface User {
    id: number;
    name: string;
    email: string;
    profile_picture_path?: string;
    alumniProfile?: AlumniProfile;
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

export default function MyConnections({ connections: initialConnections }: Props) {
    const { flash } = usePage().props as any;
    const [connections, setConnections] = useState<Connection[]>(initialConnections || []);
    const [sentRequests, setSentRequests] = useState<PendingRequest[]>([]);
    const [receivedRequests, setReceivedRequests] = useState<PendingRequest[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [removingConnection, setRemovingConnection] = useState<number | null>(null);
    const [connectionToRemove, setConnectionToRemove] = useState<Connection | null>(null);

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const fetchPendingRequests = async () => {
        try {
            const response = await fetch('/alumni/network/requests');
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
            const response = await fetch('/api/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    type: 'direct',
                    participant_ids: [userId],
                }),
            });

            const data = await response.json();
            if (data.success) {
                router.visit('/alumni/messages');
            }
        } catch (error) {
            console.error('Failed to start conversation:', error);
        }
    };

    const getDisplayName = (user: User) => {
        if (user.alumniProfile) {
            return `${user.alumniProfile.first_name} ${user.alumniProfile.last_name}`.trim() || user.name;
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
            conn.user.alumniProfile?.current_employer?.toLowerCase().includes(query);
    });

    return (
        <AlumniBaseLayout title="My Connections">
            <Head title="My Connections" />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <Users className="h-8 w-8 text-maroon-600" />
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-maroon-800 dark:text-maroon-200">My Connections</h1>
                            <p className="text-gray-600 dark:text-gray-400">Manage your alumni connections and messages</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => router.visit('/alumni/network')}
                        className="bg-maroon-700 hover:bg-maroon-800 text-white"
                    >
                        <Users className="h-4 w-4 mr-2" />
                        Find Alumni
                    </Button>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded dark:bg-green-900/20 dark:border-green-800 dark:text-green-300">
                        {flash.success}
                    </div>
                )}

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
                                <Badge className="ml-1 bg-maroon-600">{receivedRequests.length}</Badge>
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
                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                            <CardHeader className="pb-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <CardTitle className="text-xl text-maroon-800 dark:text-maroon-200 flex items-center">
                                        <UserCheck className="h-5 w-5 mr-2" />
                                        Your Connections
                                    </CardTitle>
                                    <div className="relative w-full sm:w-64">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                                                className="flex items-center justify-between p-4 border border-beige-200 dark:border-gray-700 rounded-lg hover:bg-beige-50 dark:hover:bg-gray-800 transition-colors"
                                            >
                                                <div className="flex items-center space-x-3 min-w-0 flex-1">
                                                    <Avatar className="h-12 w-12 flex-shrink-0">
                                                        <AvatarImage src={conn.user.profile_picture_path ? `/storage/${conn.user.profile_picture_path}` : undefined} />
                                                        <AvatarFallback className="bg-maroon-100 text-maroon-700 dark:bg-maroon-900 dark:text-maroon-300">
                                                            {getInitials(conn.user)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                            {getDisplayName(conn.user)}
                                                        </h3>
                                                        {conn.user.alumniProfile?.current_job_title && (
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center truncate">
                                                                <Briefcase className="h-3 w-3 mr-1 flex-shrink-0" />
                                                                {conn.user.alumniProfile.current_job_title}
                                                                {conn.user.alumniProfile.current_employer && (
                                                                    <span className="ml-1">@ {conn.user.alumniProfile.current_employer}</span>
                                                                )}
                                                            </p>
                                                        )}
                                                        {conn.user.alumniProfile?.graduation_year && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center">
                                                                <GraduationCap className="h-3 w-3 mr-1" />
                                                                Class of {conn.user.alumniProfile.graduation_year}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleStartConversation(conn.user.id)}
                                                        className="bg-maroon-700 hover:bg-maroon-800 text-white"
                                                    >
                                                        <MessageCircle className="h-4 w-4" />
                                                        <span className="hidden sm:inline ml-1">Message</span>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setConnectionToRemove(conn)}
                                                        disabled={removingConnection === conn.connection_id}
                                                        className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                                                    >
                                                        {removingConnection === conn.connection_id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <UserX className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
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
                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-xl text-maroon-800 dark:text-maroon-200 flex items-center">
                                    <Clock className="h-5 w-5 mr-2" />
                                    Pending Requests
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {receivedRequests.length > 0 ? (
                                    <div className="space-y-4">
                                        {receivedRequests.map((request) => (
                                            <div
                                                key={request.id}
                                                className="flex items-center justify-between p-4 border border-beige-200 dark:border-gray-700 rounded-lg"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <Avatar className="h-12 w-12">
                                                        <AvatarFallback className="bg-maroon-100 text-maroon-700 dark:bg-maroon-900 dark:text-maroon-300">
                                                            {request.sender?.alumniProfile
                                                                ? `${request.sender.alumniProfile.first_name?.[0] || ''}${request.sender.alumniProfile.last_name?.[0] || ''}`
                                                                : request.sender?.name?.slice(0, 2).toUpperCase() || '??'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                                            {request.sender?.alumniProfile
                                                                ? `${request.sender.alumniProfile.first_name} ${request.sender.alumniProfile.last_name}`
                                                                : request.sender?.name || 'Unknown'}
                                                        </h3>
                                                        {request.message && (
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                                                                "{request.message}"
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(request.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleAcceptRequest(request.id)}
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        Accept
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleRejectRequest(request.id)}
                                                        className="border-red-300 text-red-700 hover:bg-red-50"
                                                    >
                                                        <XCircle className="h-4 w-4 mr-1" />
                                                        Decline
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            No Pending Requests
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            You don't have any pending connection requests
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Sent Requests Tab */}
                    <TabsContent value="sent">
                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-xl text-maroon-800 dark:text-maroon-200 flex items-center">
                                    <Clock className="h-5 w-5 mr-2" />
                                    Sent Requests
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {sentRequests.length > 0 ? (
                                    <div className="space-y-4">
                                        {sentRequests.map((request) => (
                                            <div
                                                key={request.id}
                                                className="flex items-center justify-between p-4 border border-beige-200 dark:border-gray-700 rounded-lg"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <Avatar className="h-12 w-12">
                                                        <AvatarFallback className="bg-maroon-100 text-maroon-700 dark:bg-maroon-900 dark:text-maroon-300">
                                                            {request.receiver?.alumniProfile
                                                                ? `${request.receiver.alumniProfile.first_name?.[0] || ''}${request.receiver.alumniProfile.last_name?.[0] || ''}`
                                                                : request.receiver?.name?.slice(0, 2).toUpperCase() || '??'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                                            {request.receiver?.alumniProfile
                                                                ? `${request.receiver.alumniProfile.first_name} ${request.receiver.alumniProfile.last_name}`
                                                                : request.receiver?.name || 'Unknown'}
                                                        </h3>
                                                        <p className="text-xs text-gray-500">
                                                            Sent on {new Date(request.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    Pending
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            No Sent Requests
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            You haven't sent any connection requests yet
                                        </p>
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
                            Are you sure you want to remove {connectionToRemove && getDisplayName(connectionToRemove.user)} from your connections?
                            You will no longer be able to message them until you reconnect.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConnectionToRemove(null)}>Cancel</Button>
                        <Button
                            onClick={handleRemoveConnection}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Remove Connection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AlumniBaseLayout>
    );
}
