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
import { useCampus } from '@/contexts/CampusContext';
import { useCampusParams } from '@/hooks/useCampusFilter';

interface DashboardStats {
    overview: {
        total_alumni: number;
        total_surveys: number;
        total_batches: number;
        total_responses: number;
        response_rate: number;
    };
    employment_metrics: {
        employment_rate: number;
        total_employed: number;
        avg_days_to_job: number;
        job_alignment_rate: number;
        aligned_jobs_count: number;
    };
    mismatch_stats: {
        overqualified: number;
        underqualified: number;
        unfit: number;
        good_match: number;
    };
    unemployment_stats: {
        seeking: number;
        not_seeking: number;
        continuing_education: number;
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

    // Campus context for filtering
    const { selectedCampus } = useCampus();
    const { campusParams } = useCampusParams();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);

                const token = localStorage.getItem('auth_token');

                // Build URL with campus parameter
                const params = new URLSearchParams();
                if (selectedCampus?.id) {
                    params.append('campus_id', selectedCampus.id.toString());
                }
                const url = `/api/v1/admin/dashboard${params.toString() ? '?' + params.toString() : ''}`;

                const response = await fetch(url, {
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
    }, [selectedCampus?.id]); // Re-fetch when campus changes

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

                {/* Key Metrics - Employment Focused */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Employment Rate - Primary Metric */}
                    <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-green-50 to-emerald-50">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-bold text-green-900">Employment Rate</CardTitle>
                            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md group-hover:shadow-lg transition-all">
                                <UserCheck className="h-5 w-5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-4xl font-extrabold text-green-800 mb-1">
                                {stats?.employment_metrics?.employment_rate ? stats.employment_metrics.employment_rate.toFixed(1) : '0.0'}%
                            </div>
                            <p className="text-xs text-green-600 font-medium mb-3">
                                {stats?.employment_metrics?.total_employed || 0} of {stats?.overview.total_alumni || 0} alumni employed
                            </p>
                            <div className="pt-2 border-t border-green-100">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-600">Target: 75%</span>
                                    <span className="text-xs font-bold text-green-700">
                                        {stats?.employment_metrics?.employment_rate >= 75 ? '✓ Achieved' : 'In Progress'}
                                    </span>
                                </div>
                                <div className="w-full bg-green-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(stats?.employment_metrics?.employment_rate || 0, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Avg Days to Job */}
                    <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-sky-50">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-bold text-blue-900">Avg Time to Employment</CardTitle>
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md group-hover:shadow-lg transition-all">
                                <Clock className="h-5 w-5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-4xl font-extrabold text-blue-800 mb-1">
                                {stats?.employment_metrics?.avg_days_to_job || 0}
                            </div>
                            <p className="text-xs text-blue-600 font-medium mb-3">days after graduation</p>
                            <div className="flex items-center gap-2 pt-2 border-t border-blue-100">
                                {(stats?.employment_metrics?.avg_days_to_job || 0) <= 90 ? (
                                    <div className="flex items-center text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                        <span className="font-bold">Excellent</span>
                                    </div>
                                ) : (stats?.employment_metrics?.avg_days_to_job || 0) <= 180 ? (
                                    <div className="flex items-center text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full">
                                        <Activity className="h-3 w-3 mr-1" />
                                        <span className="font-bold">Good</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        <span className="font-bold">Needs Attention</span>
                                    </div>
                                )}
                                <span className="text-xs text-gray-500">≈ {Math.round((stats?.employment_metrics?.avg_days_to_job || 0) / 30)} months</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Job Alignment */}
                    <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-purple-50 to-violet-50">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-bold text-purple-900">Job Alignment</CardTitle>
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md group-hover:shadow-lg transition-all">
                                <Target className="h-5 w-5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-4xl font-extrabold text-purple-800 mb-1">
                                {stats?.employment_metrics?.job_alignment_rate ? stats.employment_metrics.job_alignment_rate.toFixed(1) : '0.0'}%
                            </div>
                            <p className="text-xs text-purple-600 font-medium mb-3">
                                {stats?.employment_metrics?.aligned_jobs_count || 0} working in their field
                            </p>
                            <button
                                onClick={() => router.visit('/admin/analytics')}
                                className="flex items-center text-xs font-semibold text-purple-600 hover:text-purple-700 pt-2 border-t border-purple-100 transition-colors"
                            >
                                <BarChart3 className="h-3 w-3 mr-1" />
                                View Detailed Analysis
                                <ArrowRight className="h-3 w-3 ml-1" />
                            </button>
                        </CardContent>
                    </Card>

                    {/* Total Alumni */}
                    <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-maroon-50 to-beige-50">
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
                </div>

                {/* Employment Breakdown - New Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-maroon-900">Employment Breakdown</h2>
                        <Button variant="outline" size="sm" onClick={() => router.visit('/admin/alumni')} className="text-maroon-700 border-maroon-300 hover:bg-maroon-50">
                            <Users className="h-4 w-4 mr-2" />
                            View Alumni Bank
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Good Match */}
                        <Card className="border-none shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-green-50 to-emerald-50">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                                        <CheckCircle className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                        Good Match
                                    </span>
                                </div>
                                <div className="text-3xl font-extrabold text-green-800">
                                    {stats?.mismatch_stats?.good_match || 0}
                                </div>
                                <p className="text-xs text-green-600 font-medium">
                                    {stats?.employment_metrics?.total_employed > 0
                                        ? ((stats?.mismatch_stats?.good_match || 0) / stats.employment_metrics.total_employed * 100).toFixed(1)
                                        : '0.0'
                                    }% of employed alumni
                                </p>
                            </CardHeader>
                        </Card>

                        {/* Overqualified */}
                        <Card className="border-none shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-yellow-50 to-amber-50">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="p-2 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg">
                                        <AlertCircle className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                                        Overqualified
                                    </span>
                                </div>
                                <div className="text-3xl font-extrabold text-yellow-800">
                                    {stats?.mismatch_stats?.overqualified || 0}
                                </div>
                                <p className="text-xs text-yellow-600 font-medium">
                                    {stats?.employment_metrics?.total_employed > 0
                                        ? ((stats?.mismatch_stats?.overqualified || 0) / stats.employment_metrics.total_employed * 100).toFixed(1)
                                        : '0.0'
                                    }% of employed alumni
                                </p>
                            </CardHeader>
                        </Card>

                        {/* Unfit */}
                        <Card className="border-none shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-orange-50 to-red-50">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                                        <TrendingDown className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-1 rounded-full">
                                        Unfit
                                    </span>
                                </div>
                                <div className="text-3xl font-extrabold text-orange-800">
                                    {stats?.mismatch_stats?.unfit || 0}
                                </div>
                                <p className="text-xs text-orange-600 font-medium">
                                    {stats?.employment_metrics?.total_employed > 0
                                        ? ((stats?.mismatch_stats?.unfit || 0) / stats.employment_metrics.total_employed * 100).toFixed(1)
                                        : '0.0'
                                    }% working in different field
                                </p>
                            </CardHeader>
                        </Card>

                        {/* Underqualified */}
                        <Card className="border-none shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-blue-50 to-indigo-50">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                                        <GraduationCap className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                                        Underqualified
                                    </span>
                                </div>
                                <div className="text-3xl font-extrabold text-blue-800">
                                    {stats?.mismatch_stats?.underqualified || 0}
                                </div>
                                <p className="text-xs text-blue-600 font-medium">
                                    {stats?.employment_metrics?.total_employed > 0
                                        ? ((stats?.mismatch_stats?.underqualified || 0) / stats.employment_metrics.total_employed * 100).toFixed(1)
                                        : '0.0'
                                    }% need more education
                                </p>
                            </CardHeader>
                        </Card>
                    </div>
                </div>

                {/* Two Column Layout for Survey Stats and Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Survey & Response Stats */}
                    <Card className="border-none shadow-lg bg-gradient-to-br from-white to-blue-50">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                                        <ClipboardList className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl text-maroon-900 font-bold">Survey Engagement</CardTitle>
                                        <CardDescription className="text-xs text-gray-500">Current statistics</CardDescription>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.visit('/admin/surveys')}
                                    className="text-maroon-600 hover:text-maroon-700 hover:bg-maroon-50"
                                >
                                    View All
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-sky-50 p-4 border-2 border-blue-200/50">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-blue-600 font-medium mb-1">Active Surveys</span>
                                        <span className="text-3xl font-black text-blue-800">{stats?.overview.total_surveys || 0}</span>
                                        <span className="text-xs text-gray-500 mt-1">Created</span>
                                    </div>
                                </div>
                                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 p-4 border-2 border-purple-200/50">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-purple-600 font-medium mb-1">Responses</span>
                                        <span className="text-3xl font-black text-purple-800">{stats?.overview.total_responses || 0}</span>
                                        <span className="text-xs text-gray-500 mt-1">Submitted</span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 border-2 border-green-200/50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-bold text-green-900">Response Rate</span>
                                    <span className="text-2xl font-black text-green-700">
                                        {stats?.overview.response_rate ? stats.overview.response_rate.toFixed(1) : '0.0'}%
                                    </span>
                                </div>
                                <div className="w-full bg-green-100 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(stats?.overview.response_rate || 0, 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-green-600 font-medium mt-2">
                                    +{stats?.recent_activity.recent_responses || 0} new responses this month
                                </p>
                            </div>

                            <div className="pt-3">
                                <Button
                                    onClick={() => router.visit('/admin/surveys/create')}
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all"
                                >
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Create New Survey
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activity & Unemployment Stats */}
                    <Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                                        <Activity className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl text-maroon-900 font-bold">Alumni Status</CardTitle>
                                        <CardDescription className="text-xs text-gray-500">Current overview</CardDescription>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 border-2 border-green-200/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2.5 bg-white rounded-lg shadow-sm">
                                            <Users className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 mb-0.5">New Registrations</p>
                                            <p className="text-sm text-gray-600">{stats?.recent_activity.recent_registrations || 0} alumni joined</p>
                                            <p className="text-xs text-green-700 font-medium mt-1 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                Last 30 days
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-green-600">+{stats?.recent_activity.recent_registrations || 0}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="rounded-lg bg-gradient-to-br from-orange-50 to-red-50 p-3 border border-orange-200/50">
                                    <div className="text-xs text-orange-600 font-medium mb-1">Seeking Work</div>
                                    <div className="text-2xl font-black text-orange-700">{stats?.unemployment_stats?.seeking || 0}</div>
                                </div>
                                <div className="rounded-lg bg-gradient-to-br from-gray-50 to-slate-50 p-3 border border-gray-200/50">
                                    <div className="text-xs text-gray-600 font-medium mb-1">Not Seeking</div>
                                    <div className="text-2xl font-black text-gray-700">{stats?.unemployment_stats?.not_seeking || 0}</div>
                                </div>
                                <div className="rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 p-3 border border-indigo-200/50">
                                    <div className="text-xs text-indigo-600 font-medium mb-1">Studying</div>
                                    <div className="text-2xl font-black text-indigo-700">{stats?.unemployment_stats?.continuing_education || 0}</div>
                                </div>
                            </div>

                            <div className="pt-3">
                                <Button
                                    onClick={() => router.visit('/admin/alumni')}
                                    className="w-full bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-700 hover:to-maroon-800 text-white shadow-md hover:shadow-lg transition-all"
                                >
                                    <Users className="h-4 w-4 mr-2" />
                                    View All Alumni
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

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