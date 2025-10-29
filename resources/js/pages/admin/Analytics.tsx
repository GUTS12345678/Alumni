import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    BarChart3
} from 'lucide-react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';

interface User {
    id: number;
    email: string;
    role: string;
    status: string;
}

interface Props {
    user: User;
}

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

const COLORS = {
    primary: '#800000',    // Maroon
    secondary: '#D4AF37',  // Gold/Beige
    success: '#22C55E',    // Green
    warning: '#F59E0B',    // Amber
    danger: '#EF4444',     // Red
    info: '#3B82F6',       // Blue
    gradient: ['#800000', '#B22222', '#D4AF37', '#DAA520']
};

export default function TimeToJobAnalytics({ user }: Props) {
    const [data, setData] = useState<TimeToJobData[]>([]);
    const [kpiMetrics, setKpiMetrics] = useState<KPIMetrics | null>(null);
    const [jobMismatchStats, setJobMismatchStats] = useState<JobMismatchStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [selectedYears] = useState<number[]>([]);

    const fetchAnalyticsData = useCallback(async () => {
        try {
            setLoading(true);

            const queryParams = new URLSearchParams();
            if (selectedYears.length > 0) {
                queryParams.append('years', selectedYears.join(','));
            }

            const response = await fetch(`/api/v1/admin/analytics/time-to-job?${queryParams}`, {
                credentials: 'include', // Include session cookies
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch analytics data');
            }

            const result = await response.json();
            if (result.success) {
                setData(result.data.yearly_data);
                setKpiMetrics(result.data.kpi_metrics);
                setJobMismatchStats(result.data.job_mismatch_stats);
                setLastRefresh(new Date());
            }
        } catch (err) {
            console.error('Analytics fetch error:', err);
            setError('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    }, [selectedYears]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        fetchAnalyticsData();

        const interval = setInterval(() => {
            fetchAnalyticsData();
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchAnalyticsData]);

    const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
        try {
            const response = await fetch(`/api/v1/admin/analytics/time-to-job/export?format=${format}`, {
                credentials: 'include', // Include session cookies
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `time-to-job-analytics.${format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Export error:', error);
        }
    };

    const CustomTooltip = ({ active, payload, label }: {
        active?: boolean;
        payload?: Array<{
            color: string;
            name: string;
            value: number;
        }>;
        label?: string;
    }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 border border-beige-200 shadow-lg rounded-lg">
                    <p className="text-maroon-800 font-semibold">{`Year: ${label}`}</p>
                    {payload.map((entry, index: number) => (
                        <p key={index} style={{ color: entry.color }}>
                            {`${entry.name}: ${entry.value} ${entry.name.includes('Days') ? 'days' : entry.name.includes('Rate') ? '%' : ''}`}
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

    if (loading) {
        return (
            <AdminBaseLayout title="Time-to-Job Analytics" user={user}>
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
            <AdminBaseLayout title="Time-to-Job Analytics" user={user}>
                <Card className="border-red-200">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-red-600 mb-4">{error}</p>
                            <Button onClick={() => fetchAnalyticsData()} className="bg-maroon-700 hover:bg-maroon-800">
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
        <AdminBaseLayout title="Time-to-Job Analytics" user={user}>
            <div className="space-y-6">
                {/* Header with Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-maroon-800">Time-to-First-Job Analytics</h2>
                        <p className="text-maroon-600">Track how quickly alumni secure employment after graduation</p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Last updated: {lastRefresh.toLocaleTimeString()}
                        </Badge>

                        <Button
                            onClick={() => fetchAnalyticsData()}
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

                {/* KPI Cards */}
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

                {/* Main Charts */}
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
                                <AreaChart data={data}>
                                    <defs>
                                        <linearGradient id="timeGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                                            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="graduation_year"
                                        stroke={COLORS.primary}
                                        fontSize={12}
                                    />
                                    <YAxis
                                        stroke={COLORS.primary}
                                        fontSize={12}
                                        tickFormatter={(value) => `${value}d`}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="avg_days_to_job"
                                        stroke={COLORS.primary}
                                        fillOpacity={1}
                                        fill="url(#timeGradient)"
                                        strokeWidth={2}
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
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="graduation_year"
                                        stroke={COLORS.primary}
                                        fontSize={12}
                                    />
                                    <YAxis
                                        yAxisId="days"
                                        stroke={COLORS.primary}
                                        fontSize={12}
                                        tickFormatter={(value) => `${value}d`}
                                    />
                                    <YAxis
                                        yAxisId="rate"
                                        orientation="right"
                                        stroke={COLORS.secondary}
                                        fontSize={12}
                                        tickFormatter={(value) => `${value}%`}
                                    />
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

                {/* Job Mismatch & Qualification Statistics */}
                {jobMismatchStats && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Overqualified Card */}
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

                            {/* Unfit/Mismatch Card */}
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

                            {/* Underqualified Card */}
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

                            {/* Good Match Card */}
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

                        {/* Job Mismatch Distribution Chart */}
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
                                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
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
                                    <CardTitle className="text-xl text-maroon-800">Job Satisfaction & Relevance</CardTitle>
                                    <CardDescription className="text-maroon-600">
                                        How well jobs align with alumni degrees
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Job Satisfaction Score */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-maroon-800">Average Job Satisfaction</span>
                                            <span className="text-2xl font-bold text-maroon-800">
                                                {jobMismatchStats.avg_job_satisfaction}/5.0
                                            </span>
                                        </div>
                                        <div className="w-full bg-beige-200 rounded-full h-3">
                                            <div
                                                className="bg-maroon-600 h-3 rounded-full transition-all duration-300"
                                                style={{ width: `${(jobMismatchStats.avg_job_satisfaction / 5) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Job Related to Degree */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-maroon-800 mb-3">Job Related to Degree</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Related to Degree</span>
                                                <span className="font-semibold text-green-600">
                                                    {jobMismatchStats.job_related_to_degree.related_count} ({jobMismatchStats.job_related_to_degree.related_percentage}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-beige-200 rounded-full h-2">
                                                <div
                                                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${jobMismatchStats.job_related_to_degree.related_percentage}%` }}
                                                ></div>
                                            </div>

                                            <div className="flex justify-between items-center mt-3">
                                                <span className="text-sm text-gray-600">Not Related to Degree</span>
                                                <span className="font-semibold text-red-600">
                                                    {jobMismatchStats.job_related_to_degree.unrelated_count} ({jobMismatchStats.job_related_to_degree.unrelated_percentage}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-beige-200 rounded-full h-2">
                                                <div
                                                    className="bg-red-600 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${jobMismatchStats.job_related_to_degree.unrelated_percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Total Employed */}
                                    <div className="pt-4 border-t border-beige-200">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-600">Total Employed Alumni Analyzed</span>
                                            <span className="text-lg font-bold text-maroon-800">
                                                {jobMismatchStats.total_employed.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </>
                )}

                {/* Program Comparison */}
                {data.length > 0 && data[0].program_breakdown && (
                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl text-maroon-800">Program Performance Comparison</CardTitle>
                            <CardDescription className="text-maroon-600">
                                Average time-to-job by degree program (most recent year)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart
                                    data={data[data.length - 1]?.program_breakdown || []}
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
                                    <YAxis
                                        stroke={COLORS.primary}
                                        fontSize={12}
                                        tickFormatter={(value) => `${value}d`}
                                    />
                                    <Tooltip
                                        content={<CustomTooltip />}
                                        labelFormatter={(label) => `Program: ${label}`}
                                    />
                                    <Bar
                                        dataKey="avg_days"
                                        name="Avg Days to Job"
                                        radius={[4, 4, 0, 0]}
                                    >
                                        {data[data.length - 1]?.program_breakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS.gradient[index % COLORS.gradient.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminBaseLayout>
    );
}