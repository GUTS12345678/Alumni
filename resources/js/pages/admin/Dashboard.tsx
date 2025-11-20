import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Users,
    ClipboardList,
    TrendingUp,
    UserCheck,
    GraduationCap,
    Activity,
    Shield,
    Building,
    BarChart3,
    Mail,
    AlertCircle,
    CheckCircle,
    Clock,
    ArrowRight,
    ArrowUpRight
} from 'lucide-react';
import { router } from '@inertiajs/react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';

interface DashboardStats {
    overview: {
        total_alumni: number;
        total_surveys: number;
        total_batches: number;
        total_responses: number;
        response_rate: number;
    };
    recent_activity: {
        recent_registrations: number;
        recent_responses: number;
    };
    batch_distribution: Array<{
        batch_name: string;
        batch_year: number;
        alumni_count: number;
    }>;
    employment_stats: Record<string, number>;
    recent_surveys: Array<{
        id: number;
        title: string;
        status: string;
        created_by: string;
        created_at: string;
        responses_count: number;
    }>;
    monthly_trend: Array<{
        month: string;
        registrations: number;
    }>;
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

export default function AdminDashboard({ user }: Props) {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);

                const token = localStorage.getItem('auth_token');
                const response = await fetch('/api/v1/admin/dashboard', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        window.location.href = '/login';
                        return;
                    }
                    throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
                }

                const data = await response.json();

                if (data.success) {
                    setStats(data.data);
                } else {
                    throw new Error(data.message || 'Failed to load dashboard data');
                }
            } catch (err) {
                console.error('Dashboard fetch error:', err);
                setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-beige-50 to-beige-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 border-4 border-maroon-600 dark:border-maroon-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-maroon-800 dark:text-maroon-300 font-medium">Loading dashboard...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-beige-50 to-beige-100 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <Button onClick={() => window.location.reload()} className="w-full">
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <AdminBaseLayout title="Admin Dashboard" user={user}>
            <div className="space-y-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all hover:border-maroon-300 dark:hover:border-maroon-600">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800 dark:text-maroon-300">Total Alumni</CardTitle>
                            <div className="p-2 bg-maroon-100 dark:bg-maroon-900/30 rounded-lg">
                                <Users className="h-5 w-5 text-maroon-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-maroon-800 dark:text-maroon-200">{stats?.overview.total_alumni || 0}</div>
                            <p className="text-xs text-maroon-600 dark:text-maroon-400 mt-1">Registered in system</p>
                            <div className="mt-3 flex items-center text-xs">
                                <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400 mr-1" />
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                    {stats?.recent_activity.recent_registrations || 0} new (30 days)
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all hover:border-blue-300 dark:hover:border-blue-600">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800 dark:text-maroon-300">Total Surveys</CardTitle>
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats?.overview.total_surveys || 0}</div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Created surveys</p>
                            <button
                                onClick={() => router.visit('/admin/surveys/create')}
                                className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center"
                            >
                                Create New <ArrowRight className="h-3 w-3 ml-1" />
                            </button>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all hover:border-purple-300 dark:hover:border-purple-600">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800 dark:text-maroon-300">Total Responses</CardTitle>
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats?.overview.total_responses || 0}</div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Survey submissions</p>
                            <div className="mt-3 flex items-center text-xs">
                                <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400 mr-1" />
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                    {stats?.recent_activity.recent_responses || 0} recent
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all hover:border-green-300 dark:hover:border-green-600">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800 dark:text-maroon-300">Response Rate</CardTitle>
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                {stats?.overview.response_rate ? stats.overview.response_rate.toFixed(2) : '0.00'}%
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Survey completion rate</p>
                            <div className="mt-3">
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                    <div
                                        className="bg-green-600 dark:bg-green-500 h-1.5 rounded-full transition-all"
                                        style={{ width: `${Math.min(stats?.overview.response_rate || 0, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
                        onClick={() => router.visit('/admin/alumni')}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="p-3 bg-maroon-100 dark:bg-maroon-900/30 rounded-lg group-hover:bg-maroon-200 dark:group-hover:bg-maroon-800/50 transition-colors">
                                    <Users className="h-6 w-6 text-maroon-600 dark:text-maroon-400" />
                                </div>
                                <ArrowUpRight className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-maroon-600 dark:group-hover:text-maroon-400 transition-colors" />
                            </div>
                            <CardTitle className="text-xl text-maroon-800 dark:text-maroon-200 mt-4">Alumni Bank</CardTitle>
                            <CardDescription className="text-maroon-600 dark:text-maroon-400">
                                Manage and view all registered alumni profiles
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 mb-4">
                                View, search, and manage alumni records. Export data and track career progress.
                            </p>
                            <Button className="bg-maroon-700 hover:bg-maroon-800 text-white w-full group-hover:shadow-lg transition-all">
                                View Alumni Bank
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
                        onClick={() => router.visit('/admin/surveys')}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                                    <ClipboardList className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <ArrowUpRight className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                            </div>
                            <CardTitle className="text-xl text-maroon-800 dark:text-maroon-200 mt-4">Survey Bank</CardTitle>
                            <CardDescription className="text-maroon-600 dark:text-maroon-400">
                                Create and manage surveys for alumni
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                Design surveys, track responses, and analyze alumni feedback and career data.
                            </p>
                            <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white w-full group-hover:shadow-lg transition-all">
                                Manage Surveys
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
                        onClick={() => router.visit('/admin/analytics')}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors">
                                    <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <ArrowUpRight className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                            </div>
                            <CardTitle className="text-xl text-maroon-800 dark:text-maroon-200 mt-4">Analytics</CardTitle>
                            <CardDescription className="text-maroon-600 dark:text-maroon-400">
                                View detailed reports and insights
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 mb-4">
                                Generate reports, view trends, and analyze alumni career progression data.
                            </p>
                            <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full group-hover:shadow-lg transition-all">
                                View Analytics
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Two Column Layout for Activity and System Info */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Activity */}
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl text-maroon-800 dark:text-maroon-200 flex items-center">
                                <Activity className="h-5 w-5 mr-2 text-maroon-600 dark:text-maroon-400" />
                                Recent Activity
                            </CardTitle>
                            <CardDescription className="text-maroon-600 dark:text-maroon-400">
                                Latest system activity and alumni registrations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg mr-3">
                                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">Recent Survey Responses</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">{stats?.recent_activity.recent_responses || 0} responses (last 30 days)</p>
                                        </div>
                                    </div>
                                    <span className="text-lg text-green-600 dark:text-green-400 font-bold">+{stats?.recent_activity.recent_responses || 0}</span>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg mr-3">
                                            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">Recent Registrations</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">{stats?.recent_activity.recent_registrations || 0} new alumni (last 30 days)</p>
                                        </div>
                                    </div>
                                    <span className="text-lg text-blue-600 dark:text-blue-400 font-bold">+{stats?.recent_activity.recent_registrations || 0}</span>
                                </div>

                                <div className="pt-2 text-center">
                                    <Button
                                        variant="outline"
                                        className="border-maroon-300 dark:border-maroon-700 text-maroon-700 dark:text-maroon-300 hover:bg-maroon-50 dark:hover:bg-maroon-900/30 w-full"
                                        onClick={() => router.visit('/admin/activity')}
                                    >
                                        View Full Activity Log
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* System Quick Links */}
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl text-maroon-800 dark:text-maroon-200 flex items-center">
                                <Shield className="h-5 w-5 mr-2 text-maroon-600 dark:text-maroon-400" />
                                System Management
                            </CardTitle>
                            <CardDescription className="text-maroon-600 dark:text-maroon-400">
                                Quick access to system management tools
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <button
                                    onClick={() => router.visit('/admin/batches')}
                                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-beige-50 dark:hover:bg-gray-800 transition-colors group"
                                >
                                    <div className="flex items-center">
                                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg mr-3">
                                            <GraduationCap className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-gray-900 dark:text-gray-100">Batch Management</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Manage graduation batches</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-maroon-600 dark:group-hover:text-maroon-400" />
                                </button>

                                <button
                                    onClick={() => router.visit('/admin/profiles')}
                                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-beige-50 dark:hover:bg-gray-800 transition-colors group"
                                >
                                    <div className="flex items-center">
                                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg mr-3">
                                            <UserCheck className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-gray-900 dark:text-gray-100">Profile Reviews</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Review pending alumni profiles</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-maroon-600 dark:group-hover:text-maroon-400" />
                                </button>

                                <button
                                    onClick={() => router.visit('/admin/users')}
                                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-beige-50 dark:hover:bg-gray-800 transition-colors group"
                                >
                                    <div className="flex items-center">
                                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-3">
                                            <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-gray-900 dark:text-gray-100">Admin Users</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Manage system administrators</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-maroon-600 dark:group-hover:text-maroon-400" />
                                </button>

                                <button
                                    onClick={() => router.visit('/admin/email-templates')}
                                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-beige-50 dark:hover:bg-gray-800 transition-colors group"
                                >
                                    <div className="flex items-center">
                                        <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg mr-3">
                                            <Mail className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-gray-900 dark:text-gray-100">Email Templates</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Customize email notifications</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-maroon-600 dark:group-hover:text-maroon-400" />
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Super Admin Section - Only visible to super admins */}
                {user.role === 'super_admin' && (
                    <Card className="border-red-200 dark:border-red-800 shadow-lg bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
                        <CardHeader>
                            <CardTitle className="text-xl text-red-800 dark:text-red-300 flex items-center">
                                <Shield className="h-5 w-5 mr-2 text-red-600 dark:text-red-400" />
                                Super Admin Tools
                            </CardTitle>
                            <CardDescription className="text-red-600 dark:text-red-400">
                                Advanced system administration and configuration
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <button
                                    onClick={() => router.visit('/super-admin/departments')}
                                    className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-gray-900 hover:shadow-md transition-all group border border-red-200 dark:border-red-800"
                                >
                                    <div className="flex items-center">
                                        <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg mr-3">
                                            <Building className="h-4 w-4 text-red-600 dark:text-red-400" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-gray-900 dark:text-gray-100">Departments</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Manage departments & courses</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-red-600 dark:group-hover:text-red-400" />
                                </button>

                                <button
                                    onClick={() => router.visit('/super-admin/permissions')}
                                    className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-gray-900 hover:shadow-md transition-all group border border-red-200 dark:border-red-800"
                                >
                                    <div className="flex items-center">
                                        <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg mr-3">
                                            <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-gray-900 dark:text-gray-100">Permission Matrix</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Configure role permissions</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-red-600 dark:group-hover:text-red-400" />
                                </button>

                                <button
                                    onClick={() => router.visit('/super-admin/analytics')}
                                    className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-gray-900 hover:shadow-md transition-all group border border-red-200 dark:border-red-800"
                                >
                                    <div className="flex items-center">
                                        <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg mr-3">
                                            <BarChart3 className="h-4 w-4 text-red-600 dark:text-red-400" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-gray-900 dark:text-gray-100">System Analytics</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Advanced system metrics</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-red-600 dark:group-hover:text-red-400" />
                                </button>

                                <button
                                    onClick={() => router.visit('/super-admin/settings')}
                                    className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-gray-900 hover:shadow-md transition-all group border border-red-200 dark:border-red-800"
                                >
                                    <div className="flex items-center">
                                        <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg mr-3">
                                            <Activity className="h-4 w-4 text-red-600 dark:text-red-400" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-gray-900 dark:text-gray-100">System Settings</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Configure system parameters</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-red-600 dark:group-hover:text-red-400" />
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminBaseLayout>
    );
}