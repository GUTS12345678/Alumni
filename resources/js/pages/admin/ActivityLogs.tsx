import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
    Download,
    ChevronDown,
    Globe,
    Monitor,
    Clock,
    X,
} from 'lucide-react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';

interface ActivityLog {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
    } | null;
    action: string;
    entity_type: string;
    entity_id?: number;
    description: string;
    metadata?: Record<string, unknown>;
    ip_address: string;
    user_agent: string;
    created_at: string;
}

interface ActivityStats {
    total: number;
    today: number;
    crud_operations: number;
    unique_users: number;
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
    const [stats, setStats] = useState<ActivityStats | null>(null);
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

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
            const token = localStorage.getItem('auth_token');

            // First try the expected API endpoint
            try {
                apiUrl = `/api/v1/admin/activity-logs?${params}`;
                response = await fetch(apiUrl, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                });

                if (!response.ok && response.status === 404) {
                    // Try alternative endpoint
                    apiUrl = `/admin/activity?${params}`;
                    response = await fetch(apiUrl, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
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

                // Set server-side stats if provided
                if (data.stats) {
                    setStats(data.stats);
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
            'page_visit': 'bg-cyan-100 text-cyan-800',
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
            'page_visit': 'Page Visit',
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
            'Page': Globe,
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

    const handleExport = async (format: 'csv' | 'excel' | 'pdf' = 'csv') => {
        try {
            const token = localStorage.getItem('auth_token');
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (actionFilter !== 'all') params.append('action', actionFilter);
            if (userFilter !== 'all') params.append('user_id', userFilter);
            if (dateFilter !== 'all') params.append('date_filter', dateFilter);
            params.append('format', format);

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
                const extension = format === 'excel' ? 'xlsx' : format;
                a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.${extension}`;
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
                        <RefreshCw className="h-8 w-8 text-maroon-600 dark:text-gray-400 animate-spin" />
                        <span className="text-maroon-800 dark:text-gray-200 font-medium">Loading activity logs...</span>
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
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{error}</p>
                                {debugInfo && (
                                    <details className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        <summary className="cursor-pointer">Debug Information</summary>
                                        <p className="mt-1 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">{debugInfo}</p>
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
                                    className="border-maroon-300 dark:border-gray-600 text-maroon-700 dark:text-gray-300 hover:bg-maroon-50 dark:hover:bg-maroon-800/30"
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
                        <h2 className="text-2xl font-bold text-maroon-800 dark:text-gray-200">System Activity Logs</h2>
                        <p className="text-maroon-600 dark:text-gray-400">Monitor system activities and user actions</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            onClick={() => fetchActivities()}
                            variant="outline"
                            size="sm"
                            disabled={refreshing}
                            className="border-maroon-300 dark:border-gray-600 text-maroon-700 dark:text-gray-300 hover:bg-maroon-50 dark:hover:bg-maroon-800/30"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-maroon-300 dark:border-gray-600 text-maroon-700 dark:text-gray-300 hover:bg-maroon-50 dark:hover:bg-maroon-800/30"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                    <ChevronDown className="h-4 w-4 ml-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleExport('csv')}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Export as CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('excel')}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Export as Excel
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Export as PDF
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Search and Filters */}
                <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg text-maroon-800 dark:text-gray-200 flex items-center">
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
                                    className="pl-10 border-beige-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-maroon-500 focus:ring-maroon-500"
                                />
                            </div>

                            <select
                                value={actionFilter}
                                onChange={(e) => setActionFilter(e.target.value)}
                                className="border border-beige-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:border-maroon-500 focus:ring-maroon-500"
                            >
                                <option value="all">All Actions</option>
                                <option value="login">Login</option>
                                <option value="logout">Logout</option>
                                <option value="page_visit">Page Visit</option>
                                <option value="create">Create</option>
                                <option value="update">Update</option>
                                <option value="delete">Delete</option>
                                <option value="survey_completed">Survey Completed</option>
                                <option value="user_registered_via_survey">User Registration</option>
                            </select>

                            <select
                                value={userFilter}
                                onChange={(e) => setUserFilter(e.target.value)}
                                className="border border-beige-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:border-maroon-500 focus:ring-maroon-500"
                            >
                                <option value="all">All Users</option>
                                <option value="admin">Admin Users</option>
                                <option value="alumni">Alumni Users</option>
                            </select>

                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="border border-beige-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:border-maroon-500 focus:ring-maroon-500"
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
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800 dark:text-gray-200">Total Activities</CardTitle>
                            <Activity className="h-4 w-4 text-maroon-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-maroon-800 dark:text-gray-200">{stats?.total ?? total}</div>
                            <p className="text-xs text-maroon-600 dark:text-gray-400 mt-1">All recorded activities</p>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800 dark:text-gray-200">Today</CardTitle>
                            <Calendar className="h-4 w-4 text-maroon-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{stats?.today ?? 0}</div>
                            <p className="text-xs text-maroon-600 dark:text-gray-400 mt-1">Activities today</p>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800 dark:text-gray-200">User Actions</CardTitle>
                            <User className="h-4 w-4 text-maroon-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats?.crud_operations ?? 0}</div>
                            <p className="text-xs text-maroon-600 dark:text-gray-400 mt-1">CRUD operations</p>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800 dark:text-gray-200">Unique Users</CardTitle>
                            <Shield className="h-4 w-4 text-maroon-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">{stats?.unique_users ?? 0}</div>
                            <p className="text-xs text-maroon-600 dark:text-gray-400 mt-1">Active users</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Activity Logs Table */}
                <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800 dark:text-gray-200">Activity Timeline</CardTitle>
                        <CardDescription className="text-maroon-600 dark:text-gray-400">
                            Showing {activities.length} of {total} activities
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-beige-200 dark:divide-gray-700">
                            {activities.length === 0 ? (
                                <div className="text-center py-8">
                                    <Activity className="h-8 w-8 text-gray-400 mx-auto" />
                                    <p className="text-gray-500 dark:text-gray-400 mt-2">No activity logs found</p>
                                </div>
                            ) : (
                                activities.map((activity) => (
                                    <div key={activity.id} className="p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {getActionBadge(activity.action)}
                                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                    {getEntityIcon(activity.entity_type)}
                                                    <span>{activity.entity_type || 'Unknown'}</span>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Details" onClick={() => { setSelectedLog(activity); setDetailOpen(true); }}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="text-sm font-medium text-maroon-800 dark:text-gray-200">
                                            {activity.user?.name || 'Deleted User'}
                                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({activity.user?.email || 'N/A'})</span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{activity.description || 'No description'}</p>
                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                            <span>{formatDate(activity.created_at)}</span>
                                            <span>{activity.ip_address || 'Unknown IP'}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-beige-50 dark:bg-gray-800/50">
                                        <TableHead className="text-maroon-800 dark:text-gray-200 font-semibold">Timestamp</TableHead>
                                        <TableHead className="text-maroon-800 dark:text-gray-200 font-semibold">User</TableHead>
                                        <TableHead className="text-maroon-800 dark:text-gray-200 font-semibold">Action</TableHead>
                                        <TableHead className="text-maroon-800 dark:text-gray-200 font-semibold">Entity</TableHead>
                                        <TableHead className="text-maroon-800 dark:text-gray-200 font-semibold">Description</TableHead>
                                        <TableHead className="text-maroon-800 dark:text-gray-200 font-semibold">IP Address</TableHead>
                                        <TableHead className="text-maroon-800 dark:text-gray-200 font-semibold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activities.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8">
                                                <div className="space-y-2">
                                                    <Activity className="h-8 w-8 text-gray-400 mx-auto" />
                                                    <p className="text-gray-500 dark:text-gray-400">No activity logs found</p>
                                                    <p className="text-sm text-gray-400 dark:text-gray-500">
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
                                            <TableRow key={activity.id} className="hover:bg-beige-50 dark:hover:bg-gray-800">
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {formatDate(activity.created_at)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="font-medium text-maroon-800 dark:text-gray-200">
                                                            {activity.user?.name || 'Deleted User'}
                                                        </div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                                            {activity.user?.email || 'N/A'}
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
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                    ID: {activity.entity_id}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                                                        {activity.description || 'No description'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        {activity.ip_address || 'Unknown'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-maroon-700 dark:text-gray-300 hover:text-maroon-800 dark:hover:text-gray-200 hover:bg-maroon-50 dark:hover:bg-maroon-800/30"
                                                        title="View Details"
                                                        onClick={() => { setSelectedLog(activity); setDetailOpen(true); }}
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
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-6 py-4 border-t border-beige-200 dark:border-gray-700">
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                    Showing page {currentPage} of {totalPages}
                                </div>
                                <div className="space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="border-maroon-300 dark:border-gray-600 text-maroon-700 dark:text-gray-300 hover:bg-maroon-50 dark:hover:bg-maroon-800/30"
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="border-maroon-300 dark:border-gray-600 text-maroon-700 dark:text-gray-300 hover:bg-maroon-50 dark:hover:bg-maroon-800/30"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Activity Detail Modal */}
                <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-maroon-800 dark:text-gray-200">
                                <Eye className="h-5 w-5" />
                                Activity Log Details
                            </DialogTitle>
                        </DialogHeader>
                        {selectedLog && (
                            <div className="space-y-4">
                                {/* User Info */}
                                <div className="flex items-start gap-3 p-3 bg-beige-50 dark:bg-gray-800 rounded-lg">
                                    <User className="h-5 w-5 text-maroon-600 dark:text-gray-400 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-gray-200">
                                            {selectedLog.user?.name || 'Deleted User'}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {selectedLog.user?.email || 'N/A'}
                                        </p>
                                    </div>
                                    <div>{getActionBadge(selectedLog.action)}</div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 border border-beige-200 dark:border-gray-700 rounded-lg">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-200 mt-1">{selectedLog.action}</p>
                                    </div>
                                    <div className="p-3 border border-beige-200 dark:border-gray-700 rounded-lg">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Entity</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-200 mt-1">
                                            {selectedLog.entity_type || 'N/A'}
                                            {selectedLog.entity_id ? ` #${selectedLog.entity_id}` : ''}
                                        </p>
                                    </div>
                                    <div className="p-3 border border-beige-200 dark:border-gray-700 rounded-lg">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
                                            <Globe className="h-3 w-3" /> IP Address
                                        </p>
                                        <p className="text-sm font-mono text-gray-900 dark:text-gray-200 mt-1">{selectedLog.ip_address || 'Unknown'}</p>
                                    </div>
                                    <div className="p-3 border border-beige-200 dark:border-gray-700 rounded-lg">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> Timestamp
                                        </p>
                                        <p className="text-sm text-gray-900 dark:text-gray-200 mt-1">{formatDate(selectedLog.created_at)}</p>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="p-3 border border-beige-200 dark:border-gray-700 rounded-lg">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</p>
                                    <p className="text-sm text-gray-900 dark:text-gray-200 mt-1">{selectedLog.description || 'No description'}</p>
                                </div>

                                {/* User Agent */}
                                {selectedLog.user_agent && (
                                    <div className="p-3 border border-beige-200 dark:border-gray-700 rounded-lg">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
                                            <Monitor className="h-3 w-3" /> User Agent
                                        </p>
                                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 break-all font-mono">{selectedLog.user_agent}</p>
                                    </div>
                                )}

                                {/* Metadata */}
                                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                                    <div className="p-3 border border-beige-200 dark:border-gray-700 rounded-lg">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Metadata</p>
                                        <pre className="text-xs text-gray-700 dark:text-gray-300 mt-1 overflow-x-auto whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded">
                                            {JSON.stringify(selectedLog.metadata, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AdminBaseLayout>
    );
}