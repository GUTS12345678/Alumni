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
    ArrowUpRight,
    Sparkles,
    FileText,
    Settings,
    Zap,
    Target,
    TrendingDown,
    Calendar,
    Bell
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
            <div className="space-y-8">
                {/* Welcome Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-maroon-600 via-maroon-700 to-maroon-900 p-8 shadow-2xl">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
                                <span className="text-beige-100 text-sm font-medium">Welcome back!</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                                Admin Dashboard
                            </h1>
                            <p className="text-beige-200 text-lg max-w-2xl">
                                Monitor alumni engagement, manage surveys, and track key metrics at a glance.
                            </p>
                        </div>
                        <div className="hidden lg:flex items-center space-x-4">
                            <Button
                                onClick={() => router.visit('/admin/surveys/create')}
                                className="bg-white text-maroon-700 hover:bg-beige-50 shadow-lg hover:shadow-xl transition-all"
                            >
                                <Zap className="h-4 w-4 mr-2" />
                                Quick Create Survey
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Key Metrics - Enhanced Design */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-maroon-50 to-white">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-maroon-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-bold text-maroon-900">Total Alumni</CardTitle>
                            <div className="p-3 bg-gradient-to-br from-maroon-500 to-maroon-600 rounded-xl shadow-md group-hover:shadow-lg transition-all">
                                <Users className="h-5 w-5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-4xl font-extrabold text-maroon-800 mb-1">{stats?.overview.total_alumni || 0}</div>
                            <p className="text-xs text-maroon-600 font-medium mb-3">Registered in system</p>
                            <div className="flex items-center gap-2 pt-2 border-t border-maroon-100">
                                <div className="flex items-center text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    <span className="font-bold">+{stats?.recent_activity.recent_registrations || 0}</span>
                                </div>
                                <span className="text-xs text-gray-500">this month</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-white">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-bold text-blue-900">Active Surveys</CardTitle>
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md group-hover:shadow-lg transition-all">
                                <ClipboardList className="h-5 w-5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-4xl font-extrabold text-blue-800 mb-1">{stats?.overview.total_surveys || 0}</div>
                            <p className="text-xs text-blue-600 font-medium mb-3">Created surveys</p>
                            <button
                                onClick={() => router.visit('/admin/surveys/create')}
                                className="flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700 pt-2 border-t border-blue-100 transition-colors"
                            >
                                <Sparkles className="h-3 w-3 mr-1" />
                                Create New Survey
                                <ArrowRight className="h-3 w-3 ml-1" />
                            </button>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-purple-50 to-white">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-bold text-purple-900">Survey Responses</CardTitle>
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md group-hover:shadow-lg transition-all">
                                <FileText className="h-5 w-5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-4xl font-extrabold text-purple-800 mb-1">{stats?.overview.total_responses || 0}</div>
                            <p className="text-xs text-purple-600 font-medium mb-3">Survey submissions</p>
                            <div className="flex items-center gap-2 pt-2 border-t border-purple-100">
                                <div className="flex items-center text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                                    <Activity className="h-3 w-3 mr-1" />
                                    <span className="font-bold">+{stats?.recent_activity.recent_responses || 0}</span>
                                </div>
                                <span className="text-xs text-gray-500">recent</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-green-50 to-white">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-bold text-green-900">Response Rate</CardTitle>
                            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md group-hover:shadow-lg transition-all">
                                <Target className="h-5 w-5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-4xl font-extrabold text-green-800 mb-1">
                                {stats?.overview.response_rate ? stats.overview.response_rate.toFixed(1) : '0.0'}%
                            </div>
                            <p className="text-xs text-green-600 font-medium mb-3">Completion rate</p>
                            <div className="pt-2 border-t border-green-100">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-600">Progress</span>
                                    <span className="text-xs font-bold text-green-700">{stats?.overview.response_rate ? Math.round(stats.overview.response_rate) : 0}%</span>
                                </div>
                                <div className="w-full bg-green-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500 shadow-sm"
                                        style={{ width: `${Math.min(stats?.overview.response_rate || 0, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions - Enhanced Grid */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-maroon-900">Quick Actions</h2>
                        <Button variant="outline" size="sm" onClick={() => router.visit('/admin/analytics')} className="text-maroon-700 border-maroon-300 hover:bg-maroon-50">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View All Analytics
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card className="border-none shadow-lg hover:shadow-2xl transition-all cursor-pointer group bg-white hover:-translate-y-1 duration-300"
                            onClick={() => router.visit('/admin/alumni')}>
                            <CardHeader>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-4 bg-gradient-to-br from-maroon-500 to-maroon-600 rounded-2xl shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                                        <Users className="h-7 w-7 text-white" />
                                    </div>
                                    <div className="bg-maroon-50 text-maroon-700 px-3 py-1 rounded-full text-xs font-bold">
                                        {stats?.overview.total_alumni || 0} Alumni
                                    </div>
                                </div>
                                <CardTitle className="text-xl text-maroon-900 font-bold group-hover:text-maroon-700 transition-colors">Alumni Bank</CardTitle>
                                <CardDescription className="text-gray-600">
                                    Manage and view all registered alumni profiles
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                                    View, search, and manage alumni records. Export data and track career progress.
                                </p>
                                <div className="flex items-center text-maroon-600 font-semibold text-sm group-hover:text-maroon-700 transition-colors">
                                    <span>Access Alumni Bank</span>
                                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg hover:shadow-2xl transition-all cursor-pointer group bg-white hover:-translate-y-1 duration-300"
                            onClick={() => router.visit('/admin/surveys')}>
                            <CardHeader>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                                        <ClipboardList className="h-7 w-7 text-white" />
                                    </div>
                                    <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                                        {stats?.overview.total_surveys || 0} Active
                                    </div>
                                </div>
                                <CardTitle className="text-xl text-maroon-900 font-bold group-hover:text-blue-700 transition-colors">Survey Bank</CardTitle>
                                <CardDescription className="text-gray-600">
                                    Create and manage surveys for alumni
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                                    Design surveys, track responses, and analyze alumni feedback and career data.
                                </p>
                                <div className="flex items-center text-blue-600 font-semibold text-sm group-hover:text-blue-700 transition-colors">
                                    <span>Manage Surveys</span>
                                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg hover:shadow-2xl transition-all cursor-pointer group bg-white hover:-translate-y-1 duration-300"
                            onClick={() => router.visit('/admin/analytics')}>
                            <CardHeader>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                                        <BarChart3 className="h-7 w-7 text-white" />
                                    </div>
                                    <div className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        Live
                                    </div>
                                </div>
                                <CardTitle className="text-xl text-maroon-900 font-bold group-hover:text-purple-700 transition-colors">Analytics</CardTitle>
                                <CardDescription className="text-gray-600">
                                    View detailed reports and insights
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                                    Generate reports, view trends, and analyze alumni career progression data.
                                </p>
                                <div className="flex items-center text-purple-600 font-semibold text-sm group-hover:text-purple-700 transition-colors">
                                    <span>View Analytics</span>
                                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Two Column Layout for Activity and System Info */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Activity - Redesigned */}
                    <Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                                        <Activity className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl text-maroon-900 font-bold">Recent Activity</CardTitle>
                                        <CardDescription className="text-xs text-gray-500">Last 30 days</CardDescription>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.visit('/admin/activity')}
                                    className="text-maroon-600 hover:text-maroon-700 hover:bg-maroon-50"
                                >
                                    View All
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 border-2 border-green-200/50 shadow-sm hover:shadow-md transition-all group">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-green-300 rounded-full -mr-10 -mt-10 opacity-20"></div>
                                <div className="relative flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2.5 bg-white rounded-lg shadow-sm">
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 mb-0.5">Survey Responses</p>
                                            <p className="text-sm text-gray-600">{stats?.recent_activity.recent_responses || 0} new responses received</p>
                                            <p className="text-xs text-green-700 font-medium mt-1 flex items-center gap-1">
                                                <TrendingUp className="h-3 w-3" />
                                                Active engagement
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-green-600">+{stats?.recent_activity.recent_responses || 0}</div>
                                        <p className="text-xs text-gray-500">responses</p>
                                    </div>
                                </div>
                            </div>

                            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 border-2 border-blue-200/50 shadow-sm hover:shadow-md transition-all group">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-300 rounded-full -mr-10 -mt-10 opacity-20"></div>
                                <div className="relative flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2.5 bg-white rounded-lg shadow-sm">
                                            <Users className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 mb-0.5">New Registrations</p>
                                            <p className="text-sm text-gray-600">{stats?.recent_activity.recent_registrations || 0} alumni joined the system</p>
                                            <p className="text-xs text-blue-700 font-medium mt-1 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                This month
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-blue-600">+{stats?.recent_activity.recent_registrations || 0}</div>
                                        <p className="text-xs text-gray-500">alumni</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3">
                                <Button
                                    onClick={() => router.visit('/admin/activity')}
                                    className="w-full bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-700 hover:to-maroon-800 text-white shadow-md hover:shadow-lg transition-all"
                                >
                                    <Bell className="h-4 w-4 mr-2" />
                                    View Full Activity Log
                                </Button>
                            </div>
                        </CardContent>
                    </Card >

                    {/* System Management - Redesigned */}
                    < Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50" >
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-gradient-to-br from-maroon-500 to-maroon-600 rounded-lg">
                                    <Settings className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl text-maroon-900 font-bold">System Management</CardTitle>
                                    <CardDescription className="text-xs text-gray-500">Quick access tools</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <button
                                onClick={() => router.visit('/admin/batches')}
                                className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border border-orange-200/50 transition-all group shadow-sm hover:shadow-md"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-white rounded-lg shadow-sm">
                                        <GraduationCap className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-900">Batch Management</p>
                                        <p className="text-xs text-gray-600">Manage graduation batches</p>
                                    </div>
                                </div>
                                <ArrowRight className="h-5 w-5 text-orange-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                            </button>

                            <button
                                onClick={() => router.visit('/admin/users')}
                                className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 border border-indigo-200/50 transition-all group shadow-sm hover:shadow-md"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-white rounded-lg shadow-sm">
                                        <Shield className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-900">Admin Users</p>
                                        <p className="text-xs text-gray-600">Manage system administrators</p>
                                    </div>
                                </div>
                                <ArrowRight className="h-5 w-5 text-indigo-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                            </button>

                            <button
                                onClick={() => router.visit('/admin/email-templates')}
                                className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 border border-pink-200/50 transition-all group shadow-sm hover:shadow-md"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-white rounded-lg shadow-sm">
                                        <Mail className="h-5 w-5 text-pink-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-900">Email Templates</p>
                                        <p className="text-xs text-gray-600">Customize email notifications</p>
                                    </div>
                                </div>
                                <ArrowRight className="h-5 w-5 text-pink-400 group-hover:text-pink-600 group-hover:translate-x-1 transition-all" />
                            </button>

                            <button
                                onClick={() => router.visit('/admin/survey-analytics')}
                                className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 border border-purple-200/50 transition-all group shadow-sm hover:shadow-md"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-white rounded-lg shadow-sm">
                                        <BarChart3 className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-900">Survey Analytics</p>
                                        <p className="text-xs text-gray-600">View survey insights & trends</p>
                                    </div>
                                </div>
                                <ArrowRight className="h-5 w-5 text-purple-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                            </button>
                        </CardContent>
                    </Card >
                </div >

                {/* Super Admin Section - Enhanced */}
                {
                    user.role === 'super_admin' && (
                        <Card className="relative overflow-hidden border-none shadow-2xl bg-gradient-to-br from-red-600 via-rose-700 to-pink-800">
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
                            <CardHeader className="relative z-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                            <Shield className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <CardTitle className="text-2xl text-white font-black">Super Admin Tools</CardTitle>
                                                <span className="px-2 py-0.5 bg-yellow-400 text-red-900 text-xs font-bold rounded-full">ADVANCED</span>
                                            </div>
                                            <CardDescription className="text-red-100">
                                                Advanced system administration and configuration
                                            </CardDescription>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <button
                                        onClick={() => router.visit('/super-admin/departments')}
                                        className="group relative overflow-hidden flex flex-col items-start p-5 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 hover:border-white/40 transition-all shadow-lg hover:shadow-2xl hover:-translate-y-1 duration-300"
                                    >
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full -mr-10 -mt-10 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                                        <div className="p-3 bg-white rounded-xl shadow-md mb-3 group-hover:scale-110 transition-transform">
                                            <Building className="h-6 w-6 text-red-600" />
                                        </div>
                                        <div className="relative z-10">
                                            <p className="font-bold text-white text-lg mb-1">Departments</p>
                                            <p className="text-xs text-red-100">Manage departments & courses</p>
                                        </div>
                                        <ArrowUpRight className="absolute bottom-4 right-4 h-5 w-5 text-white/60 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                    </button>

                                    <button
                                        onClick={() => router.visit('/super-admin/permissions')}
                                        className="group relative overflow-hidden flex flex-col items-start p-5 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 hover:border-white/40 transition-all shadow-lg hover:shadow-2xl hover:-translate-y-1 duration-300"
                                    >
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full -mr-10 -mt-10 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                                        <div className="p-3 bg-white rounded-xl shadow-md mb-3 group-hover:scale-110 transition-transform">
                                            <Shield className="h-6 w-6 text-red-600" />
                                        </div>
                                        <div className="relative z-10">
                                            <p className="font-bold text-white text-lg mb-1">Permissions</p>
                                            <p className="text-xs text-red-100">Configure role permissions</p>
                                        </div>
                                        <ArrowUpRight className="absolute bottom-4 right-4 h-5 w-5 text-white/60 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                    </button>

                                    <button
                                        onClick={() => router.visit('/super-admin/analytics')}
                                        className="group relative overflow-hidden flex flex-col items-start p-5 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 hover:border-white/40 transition-all shadow-lg hover:shadow-2xl hover:-translate-y-1 duration-300"
                                    >
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full -mr-10 -mt-10 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                                        <div className="p-3 bg-white rounded-xl shadow-md mb-3 group-hover:scale-110 transition-transform">
                                            <BarChart3 className="h-6 w-6 text-red-600" />
                                        </div>
                                        <div className="relative z-10">
                                            <p className="font-bold text-white text-lg mb-1">Analytics</p>
                                            <p className="text-xs text-red-100">Advanced system metrics</p>
                                        </div>
                                        <ArrowUpRight className="absolute bottom-4 right-4 h-5 w-5 text-white/60 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                    </button>

                                    <button
                                        onClick={() => router.visit('/super-admin/settings')}
                                        className="group relative overflow-hidden flex flex-col items-start p-5 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 hover:border-white/40 transition-all shadow-lg hover:shadow-2xl hover:-translate-y-1 duration-300"
                                    >
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full -mr-10 -mt-10 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                                        <div className="p-3 bg-white rounded-xl shadow-md mb-3 group-hover:scale-110 transition-transform">
                                            <Settings className="h-6 w-6 text-red-600" />
                                        </div>
                                        <div className="relative z-10">
                                            <p className="font-bold text-white text-lg mb-1">Settings</p>
                                            <p className="text-xs text-red-100">Configure system parameters</p>
                                        </div>
                                        <ArrowUpRight className="absolute bottom-4 right-4 h-5 w-5 text-white/60 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    )
                }
            </div >
        </AdminBaseLayout >
    );
}