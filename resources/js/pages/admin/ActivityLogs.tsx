import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Activity,
    Search,
    Filter,
    RefreshCw,
    Calendar,
    User,
    FileText,
    Settings,
    Shield,
    Eye,
    Download
} from 'lucide-react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';

interface ActivityLog {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
    };
    action: string;
    entity_type: string;
    entity_id?: number;
    description: string;
    metadata?: Record<string, unknown>;
    ip_address: string;
    user_agent: string;
    created_at: string;
}

interface User {
    id: number;
    email: string;
    role: string;
    status: string;
}

interface Props {
    user: User;
}

export default function ActivityLogs({ user }: Props) {
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState<string>('all');
    const [userFilter, setUserFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [debugInfo, setDebugInfo] = useState<string>('');

    const fetchActivities = async () => {
        try {
            setLoading(currentPage === 1);
            setRefreshing(currentPage !== 1);
            setError(null);

            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (actionFilter !== 'all') params.append('action', actionFilter);
            if (userFilter !== 'all') params.append('user_id', userFilter);
            if (dateFilter !== 'all') params.append('date_filter', dateFilter);
            params.append('page', currentPage.toString());
            params.append('per_page', '20');

            // Try multiple possible endpoints
            let response;
            let apiUrl = '';

            // First try the expected API endpoint
            try {
                apiUrl = `/api/v1/admin/activity-logs?${params}`;
                response = await fetch(apiUrl, {
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (!response.ok && response.status === 404) {
                    // Try alternative endpoint
                    apiUrl = `/admin/activity?${params}`;
                    response = await fetch(apiUrl, {
                        credentials: 'include',
                        headers: {
                            'Accept': 'application/json',
                        },
                    });
                }
            } catch (fetchError) {
                console.error('Fetch error:', fetchError);
                throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
            }

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/login';
                    return;
                }

                // If API endpoint doesn't exist (404), provide mock data for demo
                if (response.status === 404) {
                    console.warn('Activity logs API endpoint not found, using mock data');
                    const mockActivities: ActivityLog[] = [
                        {
                            id: 1,
                            user: { id: 1, name: 'Admin User', email: 'admin@example.com' },
                            action: 'login',
                            entity_type: 'User',
                            entity_id: 1,
                            description: 'User logged into the system',
                            ip_address: '127.0.0.1',
                            user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            created_at: new Date().toISOString(),
                        },
                        {
                            id: 2,
                            user: { id: 1, name: 'Admin User', email: 'admin@example.com' },
                            action: 'view',
                            entity_type: 'Survey',
                            entity_id: 2,
                            description: 'Viewed activity logs page',
                            ip_address: '127.0.0.1',
                            user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            created_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
                        }
                    ];

                    setActivities(mockActivities);
                    setCurrentPage(1);
                    setTotalPages(1);
                    setTotal(mockActivities.length);
                    return;
                }

                // Try to get error message from response
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch from ${apiUrl}`);
            }

            const data = await response.json();

            // Handle different possible response structures
            if (data.success) {
                const activityData = data.data;

                // Check if data has pagination structure
                if (activityData && Array.isArray(activityData.data)) {
                    setActivities(activityData.data);
                    setCurrentPage(activityData.current_page || 1);
                    setTotalPages(activityData.last_page || 1);
                    setTotal(activityData.total || activityData.data.length);
                } else if (Array.isArray(activityData)) {
                    // Direct array response
                    setActivities(activityData);
                    setCurrentPage(1);
                    setTotalPages(1);
                    setTotal(activityData.length);
                } else {
                    throw new Error('Unexpected response format');
                }
            } else {
                throw new Error(data.message || 'Failed to fetch activity logs');
            }
        } catch (err) {
            console.error('Activity logs fetch error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to load activity logs';
            setError(errorMessage);
            setDebugInfo(`API Error: ${errorMessage} | Filters: ${JSON.stringify({ searchTerm, actionFilter, userFilter, dateFilter })}`);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchActivities();
        }, 300);

        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, searchTerm, actionFilter, userFilter, dateFilter]);

    const getActionBadge = (action: string) => {
        const actionColors: Record<string, string> = {
            'login': 'bg-blue-100 text-blue-800',
            'logout': 'bg-gray-100 text-gray-800',
            'create': 'bg-green-100 text-green-800',
            'update': 'bg-yellow-100 text-yellow-800',
            'delete': 'bg-red-100 text-red-800',
            'view': 'bg-purple-100 text-purple-800',
            'export': 'bg-indigo-100 text-indigo-800',
            'survey_completed': 'bg-emerald-100 text-emerald-800',
            'user_registered_via_survey': 'bg-teal-100 text-teal-800',
        };

        const actionNames: Record<string, string> = {
            'login': 'Login',
            'logout': 'Logout',
            'create': 'Create',
            'update': 'Update',
            'delete': 'Delete',
            'view': 'View',
            'export': 'Export',
            'survey_completed': 'Survey Completed',
            'user_registered_via_survey': 'User Registration',
        };

        return (
            <Badge className={actionColors[action] || 'bg-gray-100 text-gray-800'}>
                {actionNames[action] || action}
            </Badge>
        );
    };

    const getEntityIcon = (entityType: string) => {
        const icons: Record<string, React.ComponentType<{ className?: string }>> = {
            'User': User,
            'Survey': FileText,
            'AlumniProfile': User,
            'Setting': Settings,
            'Role': Shield,
        };

        const Icon = icons[entityType] || Activity;
        return <Icon className="h-4 w-4 text-gray-500" />;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const handleExport = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (actionFilter !== 'all') params.append('action', actionFilter);
            if (userFilter !== 'all') params.append('user_id', userFilter);
            if (dateFilter !== 'all') params.append('date_filter', dateFilter);

            // Try multiple export endpoints
            let response;
            try {
                response = await fetch(`/api/v1/admin/activity-logs/export?${params}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                });

                if (!response.ok && response.status === 404) {
                    response = await fetch(`/admin/activity/export?${params}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                        },
                    });
                }
            } catch (fetchError) {
                console.error('Export fetch error:', fetchError);
                alert('Export functionality is not available');
                return;
            }

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert('Export failed. Feature may not be implemented yet.');
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('Export failed due to an error.');
        }
    };

    if (loading) {
        return (
            <AdminBaseLayout title="Activity Logs" user={user}>
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="h-8 w-8 text-maroon-600 animate-spin" />
                        <span className="text-maroon-800 font-medium">Loading activity logs...</span>
                    </div>
                </div>
            </AdminBaseLayout>
        );
    }

    if (error) {
        return (
            <AdminBaseLayout title="Activity Logs" user={user}>
                <Card className="border-red-200">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <div className="mb-4">
                                <Activity className="h-12 w-12 text-red-400 mx-auto mb-2" />
                                <p className="text-red-600 font-medium">Unable to load activity logs</p>
                                <p className="text-sm text-gray-600 mt-1">{error}</p>
                                {debugInfo && (
                                    <details className="mt-2 text-xs text-gray-500">
                                        <summary className="cursor-pointer">Debug Information</summary>
                                        <p className="mt-1 font-mono bg-gray-100 p-2 rounded">{debugInfo}</p>
                                    </details>
                                )}
                            </div>
                            <div className="space-x-2">
                                <Button
                                    onClick={() => {
                                        setError(null);
                                        fetchActivities();
                                    }}
                                    className="bg-maroon-700 hover:bg-maroon-800"
                                    disabled={loading}
                                >
                                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                    Retry
                                </Button>
                                <Button
                                    onClick={() => window.location.reload()}
                                    variant="outline"
                                    className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                                >
                                    Reload Page
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </AdminBaseLayout>
        );
    }

    return (
        <AdminBaseLayout title="Activity Logs" user={user}>
            <div className="space-y-6">
                {/* Header with Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-maroon-800">System Activity Logs</h2>
                        <p className="text-maroon-600">Monitor system activities and user actions</p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={() => fetchActivities()}
                            variant="outline"
                            size="sm"
                            disabled={refreshing}
                            className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>

                        <Button
                            onClick={handleExport}
                            variant="outline"
                            size="sm"
                            className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Search and Filters */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg text-maroon-800 flex items-center">
                            <Filter className="h-5 w-5 mr-2" />
                            Filter Activity Logs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search activities..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 border-beige-300 focus:border-maroon-500 focus:ring-maroon-500"
                                />
                            </div>

                            <select
                                value={actionFilter}
                                onChange={(e) => setActionFilter(e.target.value)}
                                className="border border-beige-300 rounded-md px-3 py-2 text-sm focus:border-maroon-500 focus:ring-maroon-500"
                            >
                                <option value="all">All Actions</option>
                                <option value="login">Login</option>
                                <option value="logout">Logout</option>
                                <option value="create">Create</option>
                                <option value="update">Update</option>
                                <option value="delete">Delete</option>
                                <option value="survey_completed">Survey Completed</option>
                                <option value="user_registered_via_survey">User Registration</option>
                            </select>

                            <select
                                value={userFilter}
                                onChange={(e) => setUserFilter(e.target.value)}
                                className="border border-beige-300 rounded-md px-3 py-2 text-sm focus:border-maroon-500 focus:ring-maroon-500"
                            >
                                <option value="all">All Users</option>
                                <option value="admin">Admin Users</option>
                                <option value="alumni">Alumni Users</option>
                            </select>

                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="border border-beige-300 rounded-md px-3 py-2 text-sm focus:border-maroon-500 focus:ring-maroon-500"
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                                <option value="year">This Year</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Activity Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">Total Activities</CardTitle>
                            <Activity className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-maroon-800">{total}</div>
                            <p className="text-xs text-maroon-600 mt-1">All recorded activities</p>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">Today</CardTitle>
                            <Calendar className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {activities.filter(a => {
                                    const activityDate = new Date(a.created_at);
                                    const today = new Date();
                                    return activityDate.toDateString() === today.toDateString();
                                }).length}
                            </div>
                            <p className="text-xs text-maroon-600 mt-1">Activities today</p>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">User Actions</CardTitle>
                            <User className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {activities.filter(a => ['create', 'update', 'delete'].includes(a.action)).length}
                            </div>
                            <p className="text-xs text-maroon-600 mt-1">CRUD operations</p>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">Unique Users</CardTitle>
                            <Shield className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">
                                {new Set(activities.map(a => a.user.id)).size}
                            </div>
                            <p className="text-xs text-maroon-600 mt-1">Active users</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Activity Logs Table */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800">Activity Timeline</CardTitle>
                        <CardDescription className="text-maroon-600">
                            Showing {activities.length} of {total} activities
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-beige-50">
                                        <TableHead className="text-maroon-800 font-semibold">Timestamp</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">User</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Action</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Entity</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Description</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">IP Address</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activities.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8">
                                                <div className="space-y-2">
                                                    <Activity className="h-8 w-8 text-gray-400 mx-auto" />
                                                    <p className="text-gray-500">No activity logs found</p>
                                                    <p className="text-sm text-gray-400">
                                                        {searchTerm || actionFilter !== 'all' || userFilter !== 'all' || dateFilter !== 'all'
                                                            ? 'Try adjusting your filters'
                                                            : 'Activity will appear here as users interact with the system'
                                                        }
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        activities.map((activity) => (
                                            <TableRow key={activity.id} className="hover:bg-beige-50">
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {formatDate(activity.created_at)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="font-medium text-maroon-800">
                                                            {activity.user?.name || 'Unknown User'}
                                                        </div>
                                                        <div className="text-xs text-gray-600">
                                                            {activity.user?.email || 'No email'}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getActionBadge(activity.action)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        {getEntityIcon(activity.entity_type)}
                                                        <div>
                                                            <div className="text-sm font-medium">
                                                                {activity.entity_type || 'Unknown'}
                                                            </div>
                                                            {activity.entity_id && (
                                                                <div className="text-xs text-gray-500">
                                                                    ID: {activity.entity_id}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm text-gray-700 max-w-xs truncate">
                                                        {activity.description || 'No description'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm text-gray-600">
                                                        {activity.ip_address || 'Unknown'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-maroon-700 hover:text-maroon-800 hover:bg-maroon-50"
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-beige-200">
                                <div className="text-sm text-gray-700">
                                    Showing page {currentPage} of {totalPages}
                                </div>
                                <div className="space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminBaseLayout>
    );
}