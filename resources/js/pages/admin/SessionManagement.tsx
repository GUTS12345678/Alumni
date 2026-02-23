import React, { useState, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
    Monitor,
    Smartphone,
    Tablet,
    Search,
    RefreshCw,
    Trash2,
    MoreVertical,
    Users,
    Shield,
    Activity,
    Wifi,
    Globe,
    Clock,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
} from 'lucide-react';

interface User {
    id: number;
    email: string;
    role: string;
    status: string;
}

interface SessionUser {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface Session {
    id: string;
    user: SessionUser | null;
    device_name: string;
    browser: string;
    platform: string;
    device_type: string;
    ip_address: string;
    last_active: string;
    last_active_at: string | null;
    created_at: string;
    created_at_date: string;
}

interface Stats {
    total_sessions: number;
    unique_users: number;
    recently_active: number;
    admin_sessions: number;
    alumni_sessions: number;
}

interface Props {
    user: User;
}

export default function SessionManagement({ user }: Props) {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const { confirm, confirmState, handleConfirm, handleCancel } = useConfirmDialog();

    const fetchSessions = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('per_page', '20');
            if (searchTerm) params.set('search', searchTerm);
            if (roleFilter && roleFilter !== 'all') params.set('role', roleFilter);

            const response = await fetch(`/api/v1/admin/sessions?${params}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
            });

            const data = await response.json();
            if (data.success) {
                setSessions(data.data.sessions);
                setStats(data.data.stats);
                setCurrentPage(data.data.pagination.current_page);
                setTotalPages(data.data.pagination.last_page);
                setTotal(data.data.pagination.total);
            }
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [searchTerm, roleFilter]);

    useEffect(() => {
        fetchSessions(currentPage);
    }, [currentPage, fetchSessions]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1);
            fetchSessions(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, roleFilter]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchSessions(currentPage);
        }, 30000);
        return () => clearInterval(interval);
    }, [currentPage, fetchSessions]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchSessions(currentPage);
    };

    const handleRevokeSession = async (session: Session) => {
        const ok = await confirm({
            title: 'Revoke Session',
            message: `Revoke session for ${session.user?.email || 'Unknown'} on ${session.device_name}? They will be logged out of this device.`,
            variant: 'destructive',
            confirmLabel: 'Revoke',
        });
        if (!ok) return;

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch(`/api/v1/admin/sessions/${session.id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
            });

            const data = await response.json();
            if (data.success) {
                fetchSessions(currentPage);
            } else {
                alert(data.message || 'Failed to revoke session');
            }
        } catch {
            alert('Failed to revoke session. Please try again.');
        }
    };

    const handleRevokeUserSessions = async (session: Session) => {
        if (!session.user) return;
        const ok = await confirm({
            title: 'Revoke All Sessions',
            message: `Revoke ALL sessions for ${session.user.email}? They will be logged out of all devices.`,
            variant: 'destructive',
            confirmLabel: 'Revoke All',
        });
        if (!ok) return;

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch(`/api/v1/admin/sessions/user/${session.user.id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
            });

            const data = await response.json();
            if (data.success) {
                fetchSessions(currentPage);
            } else {
                alert(data.message || 'Failed to revoke sessions');
            }
        } catch {
            alert('Failed to revoke sessions. Please try again.');
        }
    };

    const getDeviceIcon = (type: string) => {
        switch (type) {
            case 'mobile': return <Smartphone className="h-4 w-4" />;
            case 'tablet': return <Tablet className="h-4 w-4" />;
            default: return <Monitor className="h-4 w-4" />;
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'super_admin':
                return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">Super Admin</Badge>;
            case 'admin':
                return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Admin</Badge>;
            case 'alumni':
                return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Alumni</Badge>;
            default:
                return <Badge variant="outline">{role}</Badge>;
        }
    };

    return (
        <AdminBaseLayout title="Session Management" user={user}>
            <Head title="Session Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-maroon-800 dark:text-gray-200">Session Management</h2>
                        <p className="text-maroon-600 dark:text-gray-400">Monitor and manage active user sessions across devices</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            onClick={handleRefresh}
                            variant="outline"
                            size="sm"
                            disabled={refreshing}
                            className="border-maroon-300 dark:border-gray-600 text-maroon-700 dark:text-gray-300 hover:bg-maroon-50 dark:hover:bg-maroon-800/30"
                        >
                            <RefreshCw className={`h-4 w-4 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </Button>
                    </div>
                </div>

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800 dark:text-gray-200">Total Sessions</CardTitle>
                                <Wifi className="h-4 w-4 text-maroon-600 dark:text-maroon-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-maroon-700 dark:text-maroon-300">{stats.total_sessions}</div>
                                <p className="text-xs text-maroon-600 dark:text-gray-400">Active sessions</p>
                            </CardContent>
                        </Card>
                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800 dark:text-gray-200">Unique Users</CardTitle>
                                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.unique_users}</div>
                                <p className="text-xs text-maroon-600 dark:text-gray-400">Logged in users</p>
                            </CardContent>
                        </Card>
                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800 dark:text-gray-200">Recently Active</CardTitle>
                                <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.recently_active}</div>
                                <p className="text-xs text-maroon-600 dark:text-gray-400">Last 5 minutes</p>
                            </CardContent>
                        </Card>
                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800 dark:text-gray-200">Admin Sessions</CardTitle>
                                <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.admin_sessions}</div>
                                <p className="text-xs text-maroon-600 dark:text-gray-400">Admin/Super Admin</p>
                            </CardContent>
                        </Card>
                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800 dark:text-gray-200">Alumni Sessions</CardTitle>
                                <Users className="h-4 w-4 text-maroon-600 dark:text-maroon-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-maroon-600 dark:text-maroon-400">{stats.alumni_sessions}</div>
                                <p className="text-xs text-maroon-600 dark:text-gray-400">Alumni users</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Search and Filters */}
                <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg text-maroon-800 dark:text-maroon-200 flex items-center">
                            <Search className="h-5 w-5 mr-2" />
                            Search & Filter
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        placeholder="Search by user, device, or IP..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="All Roles" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="super_admin">Super Admin</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="alumni">Alumni</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Sessions Table */}
                <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg text-maroon-800 dark:text-maroon-200 flex items-center justify-between">
                            <span className="flex items-center">
                                <Monitor className="h-5 w-5 mr-2" />
                                Active Sessions
                            </span>
                            <span className="text-sm font-normal text-maroon-600 dark:text-gray-400">
                                Showing {sessions.length} of {total} sessions
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading && sessions.length === 0 ? (
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className="h-8 w-8 text-maroon-600 dark:text-gray-400 animate-spin" />
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-12">
                                <AlertTriangle className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200">No sessions found</h3>
                                <p className="text-gray-500 dark:text-gray-400">No active sessions match your search criteria.</p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-maroon-800 dark:text-maroon-200 font-semibold">User</TableHead>
                                                <TableHead className="text-maroon-800 dark:text-maroon-200 font-semibold">Device</TableHead>
                                                <TableHead className="text-maroon-800 dark:text-maroon-200 font-semibold">IP Address</TableHead>
                                                <TableHead className="text-maroon-800 dark:text-maroon-200 font-semibold">Last Active</TableHead>
                                                <TableHead className="text-maroon-800 dark:text-maroon-200 font-semibold">Logged In</TableHead>
                                                <TableHead className="text-maroon-800 dark:text-maroon-200 font-semibold text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {sessions.map((session) => (
                                                <TableRow key={session.id}>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-gray-900 dark:text-gray-200 truncate max-w-[200px]">
                                                                {session.user?.name || 'Unknown'}
                                                            </span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                                                                {session.user?.email || ''}
                                                            </span>
                                                            <div className="mt-1">
                                                                {session.user && getRoleBadge(session.user.role)}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {getDeviceIcon(session.device_type)}
                                                            <div className="flex flex-col">
                                                                <span className="text-sm text-gray-900 dark:text-gray-200">{session.browser}</span>
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">{session.platform}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            <Globe className="h-3 w-3 text-gray-400" />
                                                            <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{session.ip_address}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3 text-gray-400" />
                                                            <span className="text-sm text-gray-700 dark:text-gray-300">{session.last_active}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">{session.created_at}</span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => handleRevokeSession(session)} className="text-red-600">
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Revoke Session
                                                                </DropdownMenuItem>
                                                                {session.user && (
                                                                    <DropdownMenuItem onClick={() => handleRevokeUserSessions(session)} className="text-red-600">
                                                                        <AlertTriangle className="h-4 w-4 mr-2" />
                                                                        Revoke All User Sessions
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile Cards */}
                                <div className="md:hidden space-y-3">
                                    {sessions.map((session) => (
                                        <Card key={session.id} className="border-beige-200 dark:border-gray-700">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {getDeviceIcon(session.device_type)}
                                                            <span className="font-medium text-gray-900 dark:text-gray-200 truncate">
                                                                {session.user?.name || 'Unknown'}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{session.user?.email || ''}</p>
                                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                                            {session.user && getRoleBadge(session.user.role)}
                                                            <Badge variant="outline" className="text-xs">
                                                                {session.browser} • {session.platform}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                            <span className="flex items-center gap-1">
                                                                <Globe className="h-3 w-3" /> {session.ip_address}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" /> {session.last_active}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleRevokeSession(session)} className="text-red-600">
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Revoke Session
                                                            </DropdownMenuItem>
                                                            {session.user && (
                                                                <DropdownMenuItem onClick={() => handleRevokeUserSessions(session)} className="text-red-600">
                                                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                                                    Revoke All User Sessions
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-beige-200 dark:border-gray-700">
                                        <p className="text-sm text-maroon-600 dark:text-gray-400">
                                            Page {currentPage} of {totalPages} ({total} total)
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <ConfirmDialog
                open={confirmState.open}
                title={confirmState.title}
                message={confirmState.message}
                confirmLabel={confirmState.confirmLabel}
                cancelLabel={confirmState.cancelLabel}
                variant={confirmState.variant}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </AdminBaseLayout>
    );
}
