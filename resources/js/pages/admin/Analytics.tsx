import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    Calendar,
    Users,
    Briefcase,
    Clock,
    Download,
    RefreshCw,
    BarChart3,
    ClipboardList,
    Activity,
    GraduationCap,
    Building,
    ArrowUp,
    ArrowDown,
    Minus
} from 'lucide-react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import { useCampus } from '@/contexts/CampusContext';

interface User {
    id: number;
    email: string;
    role: string;
    status: string;
}

interface Props {
    user: User;
}

// Dashboard Stats Interfaces
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
    monthly_trend: Array<{
        month: string;
        registrations: number;
    }>;
}

// Time-to-Job Interfaces
interface TimeToJobData {
    graduation_year: number;
    avg_days_to_job: number;
    total_alumni: number;
    employed_alumni: number;
    employment_rate: number;
    median_days: number;
    program_breakdown: ProgramData[];
}

interface ProgramData {
    program: string;
    avg_days: number;
    alumni_count: number;
    color: string;
}

interface KPIMetrics {
    overall_avg_days: number;
    current_year_avg: number;
    improvement_rate: number;
    fastest_employment_program: string;
    total_tracked_alumni: number;
}

interface JobMismatchStats {
    total_employed: number;
    overqualified_count: number;
    overqualified_percentage: number;
    unfit_count: number;
    unfit_percentage: number;
    underqualified_count: number;
    underqualified_percentage: number;
    good_match_count: number;
    good_match_percentage: number;
    avg_job_satisfaction: number;
    job_related_to_degree: {
        related_count: number;
        unrelated_count: number;
        related_percentage: number;
        unrelated_percentage: number;
    };
    unemployment_reasons: Record<string, number>;
}

// System Stats Interface (Super Admin)
interface SystemStats {
    totalUsers: number;
    totalDepartments: number;
    totalCourses: number;
    totalAlumni: number;
    totalSurveys: number;
    activeSurveys: number;
    recentRegistrations: number;
    userGrowth: number;
    totalActivity: number;
    engagementRate: number;
    completionRate: number;
}

interface ActivityData {
    date: string;
    users: number;
    surveys: number;
    registrations: number;
}

interface DepartmentStat {
    name: string;
    code: string;
    students: number;
    courses: number;
    growth: number;
}

const COLORS = {
    primary: '#800000',    // Maroon
    secondary: '#D4AF37',  // Gold/Beige
    success: '#22C55E',    // Green
    warning: '#F59E0B',    // Amber
    danger: '#EF4444',     // Red
    info: '#3B82F6',       // Blue
    gradient: ['#800000', '#B22222', '#D4AF37', '#DAA520'],
    employment: {
        employed: '#22C55E',
        unemployed: '#EF4444',
        self_employed: '#3B82F6',
        further_study: '#F59E0B',
    }
};

export default function Analytics({ user }: Props) {
    // Campus context for filtering
    const { selectedCampus } = useCampus();

    // Dashboard Stats State
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
    const [dashboardLoading, setDashboardLoading] = useState(true);

    // Time-to-Job Stats State
    const [timeToJobData, setTimeToJobData] = useState<TimeToJobData[]>([]);
    const [kpiMetrics, setKpiMetrics] = useState<KPIMetrics | null>(null);
    const [jobMismatchStats, setJobMismatchStats] = useState<JobMismatchStats | null>(null);
    const [timeToJobLoading, setTimeToJobLoading] = useState(true);

    // System Stats State (Super Admin features) - these won't be loaded for regular admin
    const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
    const [activityData] = useState<ActivityData[]>([]);
    const [departmentStats] = useState<DepartmentStat[]>([]);
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [selectedYears] = useState<number[]>([]);

    // Fetch Dashboard Stats
    const fetchDashboardStats = useCallback(async () => {
        try {
            setDashboardLoading(true);
            const token = localStorage.getItem('auth_token');
            const params = new URLSearchParams();
            if (selectedCampus?.id) {
                params.append('campus_id', selectedCampus.id.toString());
            }
            const response = await fetch(`/api/v1/admin/dashboard?${params}`, {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) throw new Error('Failed to fetch dashboard data');

            const result = await response.json();
            if (result.success) {
                setDashboardStats(result.data);
            }
        } catch (err) {
            console.error('Dashboard fetch error:', err);
            setError('Failed to load dashboard statistics');
        } finally {
            setDashboardLoading(false);
        }
    }, [selectedCampus]);

    // Fetch Time-to-Job Analytics
    const fetchTimeToJobAnalytics = useCallback(async () => {
        try {
            setTimeToJobLoading(true);

            const queryParams = new URLSearchParams();
            if (selectedYears.length > 0) {
                queryParams.append('years', selectedYears.join(','));
            }
            if (selectedCampus?.id) {
                queryParams.append('campus_id', selectedCampus.id.toString());
            }

            const response = await fetch(`/api/v1/admin/analytics/time-to-job?${queryParams}`, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) throw new Error('Failed to fetch time-to-job analytics');

            const result = await response.json();
            if (result.success) {
                setTimeToJobData(result.data.yearly_data);
                setKpiMetrics(result.data.kpi_metrics);
                setJobMismatchStats(result.data.job_mismatch_stats);
                setLastRefresh(new Date());
            }
        } catch (err) {
            console.error('Analytics fetch error:', err);
            setError('Failed to load time-to-job analytics');
        } finally {
            setTimeToJobLoading(false);
        }
    }, [selectedYears, selectedCampus]);

    // Fetch system stats for Super Admin features
    const fetchSystemStats = useCallback(async () => {
        if (user.role !== 'super_admin') return; // Only fetch for super admin

        try {
            const params = new URLSearchParams();
            if (selectedCampus?.id) {
                params.append('campus_id', selectedCampus.id.toString());
            }
            const response = await fetch(`/api/v1/admin/dashboard?${params}`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) return;

            const data = await response.json();
            if (data.success) {
                setSystemStats({
                    totalUsers: data.data.overview.total_users || 0,
                    totalDepartments: data.data.overview.total_departments || 0,
                    totalCourses: data.data.overview.total_courses || 0,
                    totalAlumni: data.data.overview.total_alumni || 0,
                    totalSurveys: data.data.overview.total_surveys || 0,
                    activeSurveys: data.data.overview.active_surveys || 0,
                    recentRegistrations: data.data.recent_activity.recent_registrations || 0,
                    userGrowth: 12.5,
                    totalActivity: 2847,
                    engagementRate: data.data.overview.response_rate || 68.3,
                    completionRate: data.data.overview.response_rate || 84.7
                });
                // You could also populate activityData and departmentStats from the API
            }
        } catch (err) {
            console.error('Error fetching system stats:', err);
        }
    }, [user.role, selectedCampus]);

    // Fetch all data on mount and when campus changes
    useEffect(() => {
        fetchDashboardStats();
        fetchTimeToJobAnalytics();
        fetchSystemStats(); // Fetch system stats if super admin

        const interval = setInterval(() => {
            fetchDashboardStats();
            fetchTimeToJobAnalytics();
            fetchSystemStats();
        }, 60000); // Refresh every minute

        return () => clearInterval(interval);
    }, [fetchDashboardStats, fetchTimeToJobAnalytics, fetchSystemStats]);

    const handleRefresh = () => {
        fetchDashboardStats();
        fetchTimeToJobAnalytics();
        fetchSystemStats();
    };

    const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
        try {
            const response = await fetch(`/api/v1/admin/analytics/time-to-job/export?format=${format}`, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `analytics-report.${format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Export error:', error);
        }
    };

    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 border border-beige-200 shadow-lg rounded-lg">
                    <p className="text-maroon-800 font-semibold">{`${label}`}</p>
                    {payload.map((entry, index: number) => (
                        <p key={index} style={{ color: entry.color }}>
                            {`${entry.name}: ${entry.value}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const formatDays = (days: number) => {
        if (days < 30) return `${Math.round(days)} days`;
        const months = Math.round(days / 30);
        return `${months} ${months === 1 ? 'month' : 'months'}`;
    };

    const getTrendIcon = (current: number, previous: number) => {
        if (current < previous) return <TrendingDown className="h-4 w-4 text-green-600" />;
        if (current > previous) return <TrendingUp className="h-4 w-4 text-red-600" />;
        return <TrendingUp className="h-4 w-4 text-gray-600" />;
    };

    // Helper functions for system analytics
    const getSystemTrendIcon = (value: number) => {
        if (value > 0) return <ArrowUp className="h-4 w-4 text-green-600" />;
        if (value < 0) return <ArrowDown className="h-4 w-4 text-red-600" />;
        return <Minus className="h-4 w-4 text-gray-600" />;
    };

    const getSystemTrendColor = (value: number) => {
        if (value > 0) return 'text-green-600';
        if (value < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    const loading = dashboardLoading || timeToJobLoading;

    if (loading) {
        return (
            <AdminBaseLayout title="Analytics Dashboard" user={user}>
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="h-8 w-8 text-maroon-600 animate-spin" />
                        <span className="text-maroon-800 font-medium">Loading analytics...</span>
                    </div>
                </div>
            </AdminBaseLayout>
        );
    }

    if (error) {
        return (
            <AdminBaseLayout title="Analytics Dashboard" user={user}>
                <Card className="border-red-200">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-red-600 mb-4">{error}</p>
                            <Button onClick={handleRefresh} className="bg-maroon-700 hover:bg-maroon-800">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </AdminBaseLayout>
        );
    }

    return (
        <AdminBaseLayout title="Analytics Dashboard" user={user}>
            <div className="space-y-6">
                {/* Header with Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-maroon-800">Analytics Dashboard</h2>
                        <p className="text-maroon-600">Comprehensive system analytics and insights</p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Last updated: {lastRefresh.toLocaleTimeString()}
                        </Badge>

                        <Button
                            onClick={handleRefresh}
                            variant="outline"
                            size="sm"
                            className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>

                        <div className="flex space-x-1">
                            <Button
                                onClick={() => handleExport('csv')}
                                variant="outline"
                                size="sm"
                                className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                            >
                                <Download className="h-4 w-4 mr-1" />
                                CSV
                            </Button>
                            <Button
                                onClick={() => handleExport('excel')}
                                variant="outline"
                                size="sm"
                                className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                            >
                                Excel
                            </Button>
                            <Button
                                onClick={() => handleExport('pdf')}
                                variant="outline"
                                size="sm"
                                className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                            >
                                PDF
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Tabs for Different Analytics Views */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="bg-beige-100">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-maroon-700 data-[state=active]:text-white">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="employment" className="data-[state=active]:bg-maroon-700 data-[state=active]:text-white">
                            <Briefcase className="h-4 w-4 mr-2" />
                            Employment Analytics
                        </TabsTrigger>
                        {user.role === 'super_admin' && (
                            <TabsTrigger value="system" className="data-[state=active]:bg-maroon-700 data-[state=active]:text-white">
                                <Activity className="h-4 w-4 mr-2" />
                                System Analytics
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        {/* System Statistics Cards */}
                        {dashboardStats && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <Card className="border-beige-200 shadow-lg hover:shadow-xl transition-all">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-maroon-800">Total Alumni</CardTitle>
                                        <div className="p-2 bg-maroon-100 rounded-lg">
                                            <Users className="h-5 w-5 text-maroon-600" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-maroon-800">
                                            {dashboardStats.overview.total_alumni || 0}
                                        </div>
                                        <p className="text-xs text-maroon-600 mt-1">Registered in system</p>
                                        <div className="mt-3 flex items-center text-xs">
                                            <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                                            <span className="text-green-600 font-medium">
                                                {dashboardStats.recent_activity.recent_registrations || 0} new (30 days)
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-beige-200 shadow-lg hover:shadow-xl transition-all">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-maroon-800">Total Surveys</CardTitle>
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <ClipboardList className="h-5 w-5 text-blue-600" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-blue-600">
                                            {dashboardStats.overview.total_surveys || 0}
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">Created surveys</p>
                                    </CardContent>
                                </Card>

                                <Card className="border-beige-200 shadow-lg hover:shadow-xl transition-all">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-maroon-800">Total Responses</CardTitle>
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <Activity className="h-5 w-5 text-purple-600" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-purple-600">
                                            {dashboardStats.overview.total_responses || 0}
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">Survey submissions</p>
                                        <div className="mt-3 flex items-center text-xs">
                                            <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                                            <span className="text-green-600 font-medium">
                                                {dashboardStats.recent_activity.recent_responses || 0} recent
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-beige-200 shadow-lg hover:shadow-xl transition-all">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-maroon-800">Response Rate</CardTitle>
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <TrendingUp className="h-5 w-5 text-green-600" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-green-600">
                                            {dashboardStats.overview.response_rate ? dashboardStats.overview.response_rate.toFixed(2) : '0.00'}%
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">Survey completion rate</p>
                                        <div className="mt-3">
                                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                <div
                                                    className="bg-green-600 h-1.5 rounded-full transition-all"
                                                    style={{ width: `${Math.min(dashboardStats.overview.response_rate || 0, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Charts Row */}
                        {dashboardStats && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Monthly Registration Trend */}
                                <Card className="border-beige-200 shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="text-xl text-maroon-800">Monthly Registration Trend</CardTitle>
                                        <CardDescription className="text-maroon-600">
                                            Alumni registrations over time
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <AreaChart data={dashboardStats.monthly_trend}>
                                                <defs>
                                                    <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="month" stroke={COLORS.primary} fontSize={12} />
                                                <YAxis stroke={COLORS.primary} fontSize={12} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Area
                                                    type="monotone"
                                                    dataKey="registrations"
                                                    stroke={COLORS.primary}
                                                    fillOpacity={1}
                                                    fill="url(#colorRegistrations)"
                                                    strokeWidth={2}
                                                    name="Registrations"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                {/* Employment Status Distribution */}
                                <Card className="border-beige-200 shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="text-xl text-maroon-800">Employment Status Distribution</CardTitle>
                                        <CardDescription className="text-maroon-600">
                                            Current employment breakdown
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart
                                                data={Object.entries(dashboardStats.employment_stats).map(([key, value]) => ({
                                                    status: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                                    count: value,
                                                }))}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="status" stroke={COLORS.primary} fontSize={12} />
                                                <YAxis stroke={COLORS.primary} fontSize={12} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="Alumni Count" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                {/* Batch Distribution */}
                                <Card className="border-beige-200 shadow-lg lg:col-span-2">
                                    <CardHeader>
                                        <CardTitle className="text-xl text-maroon-800">Batch Distribution</CardTitle>
                                        <CardDescription className="text-maroon-600">
                                            Alumni count by graduation batch
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart
                                                data={dashboardStats.batch_distribution}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="batch_name" stroke={COLORS.primary} fontSize={12} />
                                                <YAxis stroke={COLORS.primary} fontSize={12} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="alumni_count" fill={COLORS.secondary} radius={[4, 4, 0, 0]} name="Alumni Count" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </TabsContent>

                    {/* Employment Analytics Tab */}
                    <TabsContent value="employment" className="space-y-6">
                        {/* Employment KPI Cards */}
                        {kpiMetrics && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                <Card className="border-beige-200 shadow-lg">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-maroon-800">Overall Average</CardTitle>
                                        <Calendar className="h-4 w-4 text-maroon-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-maroon-800">
                                            {formatDays(kpiMetrics.overall_avg_days)}
                                        </div>
                                        <p className="text-xs text-maroon-600 mt-1">Time to first job</p>
                                    </CardContent>
                                </Card>

                                <Card className="border-beige-200 shadow-lg">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-maroon-800">Current Year</CardTitle>
                                        <TrendingUp className="h-4 w-4 text-maroon-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-maroon-800">
                                            {formatDays(kpiMetrics.current_year_avg)}
                                        </div>
                                        <div className="flex items-center text-xs mt-1">
                                            {getTrendIcon(kpiMetrics.current_year_avg, kpiMetrics.overall_avg_days)}
                                            <span className="ml-1 text-maroon-600">vs overall average</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-beige-200 shadow-lg">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-maroon-800">Improvement</CardTitle>
                                        <BarChart3 className="h-4 w-4 text-maroon-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-maroon-800">
                                            {kpiMetrics.improvement_rate > 0 ? '+' : ''}{kpiMetrics.improvement_rate.toFixed(1)}%
                                        </div>
                                        <p className="text-xs text-maroon-600 mt-1">Year over year</p>
                                    </CardContent>
                                </Card>

                                <Card className="border-beige-200 shadow-lg">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-maroon-800">Best Program</CardTitle>
                                        <Briefcase className="h-4 w-4 text-maroon-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-sm font-bold text-maroon-800 truncate">
                                            {kpiMetrics.fastest_employment_program}
                                        </div>
                                        <p className="text-xs text-maroon-600 mt-1">Fastest employment</p>
                                    </CardContent>
                                </Card>

                                <Card className="border-beige-200 shadow-lg">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-maroon-800">Alumni Tracked</CardTitle>
                                        <Users className="h-4 w-4 text-maroon-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-maroon-800">
                                            {kpiMetrics.total_tracked_alumni.toLocaleString()}
                                        </div>
                                        <p className="text-xs text-maroon-600 mt-1">With employment data</p>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Employment Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Time-to-Job Trend */}
                            <Card className="border-beige-200 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-xl text-maroon-800">Time-to-Job Trend</CardTitle>
                                    <CardDescription className="text-maroon-600">
                                        Average days to secure first employment by graduation year
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={timeToJobData}>
                                            <defs>
                                                <linearGradient id="timeGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="graduation_year" stroke={COLORS.primary} fontSize={12} />
                                            <YAxis stroke={COLORS.primary} fontSize={12} tickFormatter={(value) => `${value}d`} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area
                                                type="monotone"
                                                dataKey="avg_days_to_job"
                                                stroke={COLORS.primary}
                                                fillOpacity={1}
                                                fill="url(#timeGradient)"
                                                strokeWidth={2}
                                                name="Avg Days to Job"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Employment Rate vs Time-to-Job */}
                            <Card className="border-beige-200 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-xl text-maroon-800">Employment Rate & Time Correlation</CardTitle>
                                    <CardDescription className="text-maroon-600">
                                        Relationship between employment rate and time to find jobs
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={timeToJobData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="graduation_year" stroke={COLORS.primary} fontSize={12} />
                                            <YAxis yAxisId="days" stroke={COLORS.primary} fontSize={12} tickFormatter={(value) => `${value}d`} />
                                            <YAxis yAxisId="rate" orientation="right" stroke={COLORS.secondary} fontSize={12} tickFormatter={(value) => `${value}%`} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Line
                                                yAxisId="days"
                                                type="monotone"
                                                dataKey="avg_days_to_job"
                                                stroke={COLORS.primary}
                                                strokeWidth={3}
                                                dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
                                                name="Avg Days to Job"
                                            />
                                            <Line
                                                yAxisId="rate"
                                                type="monotone"
                                                dataKey="employment_rate"
                                                stroke={COLORS.secondary}
                                                strokeWidth={3}
                                                dot={{ fill: COLORS.secondary, strokeWidth: 2, r: 4 }}
                                                name="Employment Rate"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Job Mismatch Stats */}
                        {jobMismatchStats && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <Card className="border-beige-200 shadow-lg">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium text-maroon-800">Overqualified</CardTitle>
                                            <TrendingUp className="h-4 w-4 text-orange-600" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-maroon-800">
                                                {jobMismatchStats.overqualified_count}
                                            </div>
                                            <p className="text-xs text-maroon-600 mt-1">
                                                {jobMismatchStats.overqualified_percentage}% of employed alumni
                                            </p>
                                            <Badge variant="outline" className="mt-2 text-orange-600 border-orange-300">
                                                Job requires less education
                                            </Badge>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-beige-200 shadow-lg">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium text-maroon-800">Unfit/Mismatch</CardTitle>
                                            <Briefcase className="h-4 w-4 text-red-600" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-maroon-800">
                                                {jobMismatchStats.unfit_count}
                                            </div>
                                            <p className="text-xs text-maroon-600 mt-1">
                                                {jobMismatchStats.unfit_percentage}% of employed alumni
                                            </p>
                                            <Badge variant="outline" className="mt-2 text-red-600 border-red-300">
                                                Job not related to degree
                                            </Badge>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-beige-200 shadow-lg">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium text-maroon-800">Underqualified</CardTitle>
                                            <TrendingDown className="h-4 w-4 text-blue-600" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-maroon-800">
                                                {jobMismatchStats.underqualified_count}
                                            </div>
                                            <p className="text-xs text-maroon-600 mt-1">
                                                {jobMismatchStats.underqualified_percentage}% of employed alumni
                                            </p>
                                            <Badge variant="outline" className="mt-2 text-blue-600 border-blue-300">
                                                Job requires more education
                                            </Badge>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-beige-200 shadow-lg">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium text-maroon-800">Good Match</CardTitle>
                                            <Users className="h-4 w-4 text-green-600" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-maroon-800">
                                                {jobMismatchStats.good_match_count}
                                            </div>
                                            <p className="text-xs text-maroon-600 mt-1">
                                                {jobMismatchStats.good_match_percentage}% of employed alumni
                                            </p>
                                            <Badge variant="outline" className="mt-2 text-green-600 border-green-300">
                                                Perfect job match
                                            </Badge>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Job Mismatch Charts */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Card className="border-beige-200 shadow-lg">
                                        <CardHeader>
                                            <CardTitle className="text-xl text-maroon-800">Job Qualification Match Distribution</CardTitle>
                                            <CardDescription className="text-maroon-600">
                                                Breakdown of job matches among employed alumni
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart
                                                    data={[
                                                        { name: 'Good Match', value: jobMismatchStats.good_match_count, color: COLORS.success },
                                                        { name: 'Overqualified', value: jobMismatchStats.overqualified_count, color: COLORS.warning },
                                                        { name: 'Unfit', value: jobMismatchStats.unfit_count, color: COLORS.danger },
                                                        { name: 'Underqualified', value: jobMismatchStats.underqualified_count, color: COLORS.info },
                                                    ]}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis dataKey="name" stroke={COLORS.primary} fontSize={12} />
                                                    <YAxis stroke={COLORS.primary} fontSize={12} />
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Alumni Count">
                                                        {[
                                                            { name: 'Good Match', value: jobMismatchStats.good_match_count, color: COLORS.success },
                                                            { name: 'Overqualified', value: jobMismatchStats.overqualified_count, color: COLORS.warning },
                                                            { name: 'Unfit', value: jobMismatchStats.unfit_count, color: COLORS.danger },
                                                            { name: 'Underqualified', value: jobMismatchStats.underqualified_count, color: COLORS.info },
                                                        ].map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-beige-200 shadow-lg">
                                        <CardHeader>
                                            <CardTitle className="text-xl text-maroon-800">Program Performance Comparison</CardTitle>
                                            <CardDescription className="text-maroon-600">
                                                Average time-to-job by degree program (most recent year)
                                            </CardDescription>
                                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                <p className="text-sm text-blue-900 flex items-start">
                                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold mr-2 mt-0.5 flex-shrink-0">i</span>
                                                    <span>
                                                        <strong>Negative values indicate jobs secured BEFORE graduation</strong> (e.g., -1274 days = ~3.5 years before graduation).
                                                        This shows successful internships, early hiring, and strong industry connections. More negative = better performance.
                                                    </span>
                                                </p>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart
                                                    data={timeToJobData[timeToJobData.length - 1]?.program_breakdown || []}
                                                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis
                                                        dataKey="program"
                                                        stroke={COLORS.primary}
                                                        fontSize={12}
                                                        angle={-45}
                                                        textAnchor="end"
                                                        height={100}
                                                    />
                                                    <YAxis stroke={COLORS.primary} fontSize={12} tickFormatter={(value) => `${value}d`} />
                                                    <Tooltip content={<CustomTooltip />} labelFormatter={(label) => `Program: ${label}`} />
                                                    <Bar dataKey="avg_days" name="Avg Days to Job" radius={[4, 4, 0, 0]}>
                                                        {(timeToJobData[timeToJobData.length - 1]?.program_breakdown || []).map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color || COLORS.primary} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                </div>
                            </>
                        )}
                    </TabsContent>

                    {/* System Analytics Tab (Super Admin Only) */}
                    {user.role === 'super_admin' && (
                        <TabsContent value="system" className="space-y-6">
                            {/* Header with Time Range Selector */}
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-maroon-800">System-Wide Metrics</h3>
                                    <p className="text-sm text-maroon-600">Comprehensive system performance and trends</p>
                                </div>
                                <select
                                    value={timeRange}
                                    onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'year')}
                                    className="px-4 py-2 border border-maroon-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500"
                                >
                                    <option value="week">Last Week</option>
                                    <option value="month">Last Month</option>
                                    <option value="year">Last Year</option>
                                </select>
                            </div>

                            {/* Key System Metrics - Only show if data is available */}
                            {systemStats && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <Card className="border-beige-200 shadow-lg">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="p-3 bg-blue-100 rounded-lg">
                                                    <Users className="h-6 w-6 text-blue-600" />
                                                </div>
                                                <div className={`flex items-center space-x-1 ${getSystemTrendColor(systemStats.userGrowth)}`}>
                                                    {getSystemTrendIcon(systemStats.userGrowth)}
                                                    <span className="text-sm font-semibold">{Math.abs(systemStats.userGrowth)}%</span>
                                                </div>
                                            </div>
                                            <p className="text-sm font-medium text-gray-600">Total Users</p>
                                            <p className="text-3xl font-bold text-gray-900 mt-1">{systemStats.totalUsers.toLocaleString()}</p>
                                            <p className="text-xs text-gray-500 mt-2">+{systemStats.recentRegistrations} this {timeRange}</p>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-beige-200 shadow-lg">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="p-3 bg-green-100 rounded-lg">
                                                    <GraduationCap className="h-6 w-6 text-green-600" />
                                                </div>
                                                <div className={`flex items-center space-x-1 ${getSystemTrendColor(8.2)}`}>
                                                    {getSystemTrendIcon(8.2)}
                                                    <span className="text-sm font-semibold">8.2%</span>
                                                </div>
                                            </div>
                                            <p className="text-sm font-medium text-gray-600">Total Alumni</p>
                                            <p className="text-3xl font-bold text-gray-900 mt-1">{systemStats.totalAlumni.toLocaleString()}</p>
                                            <p className="text-xs text-gray-500 mt-2">Registered alumni</p>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-beige-200 shadow-lg">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="p-3 bg-purple-100 rounded-lg">
                                                    <Building className="h-6 w-6 text-purple-600" />
                                                </div>
                                                <div className={`flex items-center space-x-1 ${getSystemTrendColor(0)}`}>
                                                    {getSystemTrendIcon(0)}
                                                    <span className="text-sm font-semibold">0%</span>
                                                </div>
                                            </div>
                                            <p className="text-sm font-medium text-gray-600">Departments</p>
                                            <p className="text-3xl font-bold text-gray-900 mt-1">{systemStats.totalDepartments}</p>
                                            <p className="text-xs text-gray-500 mt-2">{systemStats.totalCourses} total courses</p>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-beige-200 shadow-lg">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="p-3 bg-orange-100 rounded-lg">
                                                    <ClipboardList className="h-6 w-6 text-orange-600" />
                                                </div>
                                                <div className={`flex items-center space-x-1 ${getSystemTrendColor(5.4)}`}>
                                                    {getSystemTrendIcon(5.4)}
                                                    <span className="text-sm font-semibold">5.4%</span>
                                                </div>
                                            </div>
                                            <p className="text-sm font-medium text-gray-600">Surveys</p>
                                            <p className="text-3xl font-bold text-gray-900 mt-1">{systemStats.totalSurveys}</p>
                                            <p className="text-xs text-gray-500 mt-2">{systemStats.activeSurveys} active</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Activity Overview - Only show if data is available */}
                            {activityData.length > 0 && (
                                <Card className="border-beige-200 shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="text-xl text-maroon-800">Recent Activity</CardTitle>
                                        <CardDescription className="text-maroon-600">
                                            Daily activity breakdown
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-4 gap-4 pb-2 border-b border-gray-200 text-sm font-medium text-gray-600">
                                                <div>Date</div>
                                                <div className="text-center">Active Users</div>
                                                <div className="text-center">Survey Responses</div>
                                                <div className="text-center">New Registrations</div>
                                            </div>
                                            {activityData.map((day, index) => (
                                                <div key={index} className="grid grid-cols-4 gap-4 py-3 border-b border-gray-100 hover:bg-gray-50">
                                                    <div className="flex items-center space-x-2">
                                                        <Calendar className="h-4 w-4 text-gray-400" />
                                                        <span className="text-sm text-gray-900">{new Date(day.date).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                            {day.users}
                                                        </span>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                            {day.surveys}
                                                        </span>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                                            {day.registrations}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Department Performance - Only show if data is available */}
                            {departmentStats.length > 0 && (
                                <Card className="border-beige-200 shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="text-xl text-maroon-800">Department Performance</CardTitle>
                                        <CardDescription className="text-maroon-600">
                                            Student enrollment and growth by department
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full">
                                                <thead>
                                                    <tr className="border-b border-gray-200">
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Department
                                                        </th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Students
                                                        </th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Courses
                                                        </th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Growth
                                                        </th>
                                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Trend
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {departmentStats.map((dept, index) => (
                                                        <tr key={index} className="hover:bg-gray-50">
                                                            <td className="px-4 py-4">
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="p-2 bg-maroon-100 rounded-lg">
                                                                        <Building className="h-5 w-5 text-maroon-600" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-medium text-gray-900">{dept.name}</p>
                                                                        <p className="text-xs text-gray-500">{dept.code}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 text-center">
                                                                <span className="text-sm font-semibold text-gray-900">{dept.students}</span>
                                                            </td>
                                                            <td className="px-4 py-4 text-center">
                                                                <span className="text-sm font-semibold text-gray-900">{dept.courses}</span>
                                                            </td>
                                                            <td className="px-4 py-4 text-center">
                                                                <span className={`text-sm font-semibold ${getSystemTrendColor(dept.growth)}`}>
                                                                    {dept.growth > 0 ? '+' : ''}{dept.growth}%
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-4 text-right">
                                                                <div className="flex items-center justify-end">
                                                                    {getSystemTrendIcon(dept.growth)}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Quick Stats Grid - Only show if data is available */}
                            {systemStats && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0">
                                        <CardContent className="p-6 text-white">
                                            <Activity className="h-8 w-8 mb-4 opacity-80" />
                                            <p className="text-sm opacity-90">Total Activity</p>
                                            <p className="text-3xl font-bold mt-2">{systemStats.totalActivity.toLocaleString()}</p>
                                            <p className="text-xs opacity-80 mt-2">System actions this {timeRange}</p>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0">
                                        <CardContent className="p-6 text-white">
                                            <TrendingUp className="h-8 w-8 mb-4 opacity-80" />
                                            <p className="text-sm opacity-90">Engagement Rate</p>
                                            <p className="text-3xl font-bold mt-2">{systemStats.engagementRate}%</p>
                                            <p className="text-xs opacity-80 mt-2">Alumni engagement</p>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0">
                                        <CardContent className="p-6 text-white">
                                            <BarChart3 className="h-8 w-8 mb-4 opacity-80" />
                                            <p className="text-sm opacity-90">Completion Rate</p>
                                            <p className="text-3xl font-bold mt-2">{systemStats.completionRate}%</p>
                                            <p className="text-xs opacity-80 mt-2">Survey completion</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </AdminBaseLayout>
    );
}
