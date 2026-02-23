import React, { useEffect, useState, useCallback, useRef } from 'react';
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
    Cell,
} from '@/lib/recharts';
import {
    TrendingUp,
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
    Target,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Award,
    Globe,
    MapPin,
    ChevronDown,
    FileText,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import { useCampus } from '@/contexts/CampusContext';
import { useAdminChannel } from '@/hooks/useAdminChannel';

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
        total_users?: number;
        total_departments?: number;
        total_courses?: number;
        active_surveys?: number;
    };
    employment_stats: Record<string, number>;
    batch_distribution: { batch_name: string; alumni_count: number }[];
    monthly_trend: { month: string; registrations: number }[];
    recent_activity: {
        recent_registrations: number;
        recent_responses: number;
    };
}

// Time-to-Job Interfaces
interface ProgramData {
    program: string;
    avg_days: number;
    alumni_count: number;
    color?: string;
}

interface TimeToJobData {
    graduation_year: number;
    avg_days_to_job: number;
    median_days: number;
    alumni_count: number;
    employment_rate: number;
    program_breakdown: ProgramData[];
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
}

// Comprehensive Analytics Interfaces
interface EnrollmentMetrics {
    yearly_breakdown: {
        year: number;
        batch_name: string;
        enrolled: number;
        graduated: number;
        dropout: number;
        transferred: number;
        graduation_rate: number;
    }[];
    summary: {
        total_enrolled: number;
        total_graduated: number;
        total_dropout: number;
        total_transferred: number;
        overall_graduation_rate: number;
    };
}

interface PerformanceIndicator {
    employed_within_2_years: number;
    total_employed_with_data: number;
    total_graduates: number;
    performance_rate: number;
    yearly_breakdown: {
        year: number;
        total_graduates: number;
        employed_within_2_years: number;
        performance_rate: number;
    }[];
}

interface JobAlignment {
    total_employed: number;
    aligned: { count: number; percentage: number };
    overqualified: { count: number; percentage: number };
    underqualified: { count: number; percentage: number };
    unfit: { count: number; percentage: number };
    alignment_rate: number;
}

interface AttritionRate {
    yearly_breakdown: {
        year: number;
        batch_name: string;
        enrolled: number;
        dropout: number;
        transferred: number;
        attrition_rate: number;
    }[];
    summary: {
        total_enrolled: number;
        total_dropout: number;
        total_transferred: number;
        overall_attrition_rate: number;
    };
}

interface ProgramPerformance {
    program: string;
    total_alumni: number;
    employed: number;
    employment_rate: number;
    aligned: number;
    alignment_rate: number;
    avg_days_to_job: number;
}

interface CollegeBreakdown {
    college: string;
    college_code: string;
    total_alumni: number;
    employed: number;
    aligned: number;
    employment_rate: number;
    alignment_rate: number;
}

interface CourseBreakdown {
    course: string;
    course_code: string;
    college: string;
    college_code: string;
    total_alumni: number;
    employed: number;
    aligned: number;
    employment_rate: number;
    alignment_rate: number;
}

interface ComprehensiveAnalytics {
    enrollment_metrics: EnrollmentMetrics;
    performance_indicator: PerformanceIndicator;
    job_alignment: JobAlignment;
    attrition_rate: AttritionRate;
    program_performance: ProgramPerformance[];
    college_breakdown: CollegeBreakdown[];
    course_breakdown: CourseBreakdown[];
    employment_location?: {
        summary: {
            total_employed: number;
            local: number;
            foreign: number;
            remote: number;
            local_rate: number;
            foreign_rate: number;
            remote_rate: number;
        };
        yearly_trend: {
            year: number;
            local: number;
            foreign: number;
            remote: number;
            total: number;
            foreign_rate: number;
        }[];
        department_breakdown: {
            department: string;
            local: number;
            foreign: number;
            remote: number;
            total: number;
        }[];
    };
}

const COLORS = {
    primary: '#800000',
    secondary: '#D4AF37',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
    purple: '#8B5CF6',
    gradient: ['#800000', '#B22222', '#D4AF37', '#DAA520'],
};

export default function Analytics({ user }: Props) {
    const { selectedCampus } = useCampus();

    // Animation state
    const [animated, setAnimated] = useState(false);

    const sectionStyle = (delay: number): React.CSSProperties => ({
        opacity: animated ? 1 : 0,
        transform: animated ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    });

    // Animated counter component
    const CountUp = ({ end, decimals = 0, duration = 1500, prefix = '', suffix = '' }: {
        end: number; decimals?: number; duration?: number; prefix?: string; suffix?: string;
    }) => {
        const [value, setValue] = useState(0);
        const ref = useRef<number>(0);
        const started = useRef(false);

        useEffect(() => {
            if (!animated) { setValue(0); return; }
            if (started.current) { setValue(end); return; }
            started.current = true;
            const t0 = performance.now();
            const step = (now: number) => {
                const p = Math.min((now - t0) / duration, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                setValue(eased * end);
                if (p < 1) ref.current = requestAnimationFrame(step);
            };
            ref.current = requestAnimationFrame(step);
            return () => cancelAnimationFrame(ref.current);
        }, [end, animated, duration]);

        return <>{prefix}{decimals > 0 ? value.toFixed(decimals) : Math.round(value)}{suffix}</>;
    };

    // Dashboard Stats State
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
    const [dashboardLoading, setDashboardLoading] = useState(true);

    // Time-to-Job Stats State
    const [timeToJobData, setTimeToJobData] = useState<TimeToJobData[]>([]);
    const [kpiMetrics, setKpiMetrics] = useState<KPIMetrics | null>(null);
    const [jobMismatchStats, setJobMismatchStats] = useState<JobMismatchStats | null>(null);
    const [timeToJobLoading, setTimeToJobLoading] = useState(true);

    // Comprehensive Analytics State
    const [comprehensiveData, setComprehensiveData] = useState<ComprehensiveAnalytics | null>(null);
    const [comprehensiveLoading, setComprehensiveLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    // Helper to build headers for API calls — uses cookie auth (credentials: include)
    // and adds Bearer token only if one exists in localStorage
    const getApiHeaders = (): Record<string, string> => {
        const headers: Record<string, string> = {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        };
        const token = localStorage.getItem('auth_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    };

    // Fetch Dashboard Stats
    const fetchDashboardStats = useCallback(async () => {
        try {
            setDashboardLoading(true);
            const params = new URLSearchParams();
            if (selectedCampus?.id) {
                params.append('campus_id', selectedCampus.id.toString());
            }
            const response = await fetch(`/api/v1/admin/dashboard?${params}`, {
                credentials: 'include',
                headers: getApiHeaders(),
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
            if (selectedCampus?.id) {
                queryParams.append('campus_id', selectedCampus.id.toString());
            }

            const response = await fetch(`/api/v1/admin/analytics/time-to-job?${queryParams}`, {
                credentials: 'include',
                headers: getApiHeaders(),
            });

            if (!response.ok) throw new Error('Failed to fetch time-to-job analytics');

            const result = await response.json();
            if (result.success) {
                setTimeToJobData(result.data.yearly_data);
                setKpiMetrics(result.data.kpi_metrics);
                setJobMismatchStats(result.data.job_mismatch_stats);
            }
        } catch (err) {
            console.error('Analytics fetch error:', err);
            setError('Failed to load time-to-job analytics');
        } finally {
            setTimeToJobLoading(false);
        }
    }, [selectedCampus]);

    // Fetch Comprehensive Analytics
    const fetchComprehensiveAnalytics = useCallback(async () => {
        try {
            setComprehensiveLoading(true);
            const queryParams = new URLSearchParams();
            if (selectedCampus?.id) {
                queryParams.append('campus_id', selectedCampus.id.toString());
            }

            const response = await fetch(`/api/v1/admin/analytics/comprehensive?${queryParams}`, {
                credentials: 'include',
                headers: getApiHeaders(),
            });

            if (!response.ok) throw new Error('Failed to fetch comprehensive analytics');

            const result = await response.json();
            if (result.success) {
                setComprehensiveData(result.data);
            }
        } catch (err) {
            console.error('Comprehensive analytics fetch error:', err);
        } finally {
            setComprehensiveLoading(false);
        }
    }, [selectedCampus]);

    // Fetch all data on mount
    useEffect(() => {
        fetchDashboardStats();
        fetchTimeToJobAnalytics();
        fetchComprehensiveAnalytics();
        setLastRefresh(new Date());

        const interval = setInterval(() => {
            fetchDashboardStats();
            fetchTimeToJobAnalytics();
            fetchComprehensiveAnalytics();
            setLastRefresh(new Date());
        }, 60000);

        return () => clearInterval(interval);
    }, [fetchDashboardStats, fetchTimeToJobAnalytics, fetchComprehensiveAnalytics]);

    // Real-time: instant refresh on any data change
    useAdminChannel({
        onDashboardUpdate: () => handleRefresh(),
        onContentChange: () => handleRefresh(),
        onSurveyResponse: () => handleRefresh(),
    });

    const handleRefresh = () => {
        fetchDashboardStats();
        fetchTimeToJobAnalytics();
        fetchComprehensiveAnalytics();
        setLastRefresh(new Date());
    };

    const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
        try {
            const params = new URLSearchParams();
            params.append('format', format);
            if (selectedCampus?.id) params.append('campus_id', selectedCampus.id.toString());

            const exportHeaders = getApiHeaders();
            exportHeaders['Accept'] = 'application/octet-stream';

            const response = await fetch(`/api/v1/admin/analytics/comprehensive/export?${params.toString()}`, {
                credentials: 'include',
                headers: exportHeaders,
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                const extension = format === 'excel' ? 'xlsx' : format;
                a.download = `comprehensive-analytics-${new Date().toISOString().split('T')[0]}.${extension}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                console.error('Export failed:', response.status);
                alert('Failed to export analytics. Please try again.');
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('An error occurred while exporting. Please try again.');
        }
    };

    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-4 border border-beige-200 dark:border-gray-700 shadow-lg rounded-lg">
                    <p className="text-maroon-800 dark:text-gray-200 font-semibold">{`${label}`}</p>
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

    const loading = dashboardLoading || timeToJobLoading || comprehensiveLoading;

    // Trigger animations after data loads
    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => setAnimated(true), 150);
            return () => clearTimeout(timer);
        }
    }, [loading]);

    if (loading) {
        return (
            <AdminBaseLayout title="Analytics Dashboard" user={user}>
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="h-8 w-8 text-maroon-600 dark:text-gray-400 animate-spin" />
                        <span className="text-maroon-800 dark:text-gray-200 font-medium">Loading analytics...</span>
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
                        <h2 className="text-3xl font-bold text-maroon-800 dark:text-gray-200">Analytics Dashboard</h2>
                        <p className="text-maroon-600 dark:text-gray-400">Comprehensive alumni tracking and performance metrics</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Last updated: {lastRefresh.toLocaleTimeString()}
                        </Badge>

                        <Button
                            onClick={handleRefresh}
                            variant="outline"
                            size="sm"
                            className="border-maroon-300 dark:border-gray-600 text-maroon-700 dark:text-gray-300 hover:bg-maroon-50 dark:hover:bg-maroon-800/30"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>

                        <div className="flex flex-wrap gap-1">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-maroon-300 dark:border-gray-600 text-maroon-700 dark:text-gray-300 hover:bg-maroon-50 dark:hover:bg-maroon-800/30"
                                    >
                                        <Download className="h-4 w-4 mr-1" />
                                        Export All Analytics
                                        <ChevronDown className="h-4 w-4 ml-1" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
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
                </div>

                {/* Section 1: Key Performance Indicators */}
                <div className="space-y-4" style={sectionStyle(0)}>
                    <h3 className="text-xl font-bold text-maroon-800 dark:text-gray-200 flex items-center">
                        <Target className="h-5 w-5 mr-2" />
                        Key Performance Indicators
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Total Alumni */}
                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800 dark:text-gray-200">Total Alumni</CardTitle>
                                <div className="p-2 bg-maroon-100 dark:bg-maroon-800/30 rounded-lg">
                                    <Users className="h-5 w-5 text-maroon-600 dark:text-gray-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-maroon-800 dark:text-gray-200">
                                    <CountUp end={dashboardStats?.overview.total_alumni || 0} />
                                </div>
                                <p className="text-xs text-maroon-600 dark:text-gray-400 mt-1">Registered in system</p>
                            </CardContent>
                        </Card>

                        {/* Performance Rate (Employed within 2 years) */}
                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-green-800">Performance Rate</CardTitle>
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Award className="h-5 w-5 text-green-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-700">
                                    <CountUp end={comprehensiveData?.performance_indicator.performance_rate || 0} suffix="%" />
                                </div>
                                <p className="text-xs text-green-600 mt-1">Employed within 2 years</p>
                                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                    {comprehensiveData?.performance_indicator.employed_within_2_years || 0} of {comprehensiveData?.performance_indicator.total_graduates || dashboardStats?.overview.total_alumni || 0} alumni
                                </div>
                            </CardContent>
                        </Card>

                        {/* Job Alignment Rate */}
                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-blue-800">Job Alignment</CardTitle>
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <CheckCircle className="h-5 w-5 text-blue-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-blue-700">
                                    <CountUp end={comprehensiveData?.job_alignment.alignment_rate || 0} suffix="%" />
                                </div>
                                <p className="text-xs text-blue-600 mt-1">Working in related field</p>
                                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                    {comprehensiveData?.job_alignment.aligned.count || 0} of {comprehensiveData?.job_alignment.total_employed || 0} employed
                                </div>
                            </CardContent>
                        </Card>

                        {/* Employment Rate */}
                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-purple-800">Employment Rate</CardTitle>
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <GraduationCap className="h-5 w-5 text-purple-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-purple-700">
                                    <CountUp end={dashboardStats?.overview.total_alumni && dashboardStats.overview.total_alumni > 0
                                        ? Math.round(((comprehensiveData?.job_alignment.total_employed || 0) / dashboardStats.overview.total_alumni) * 100)
                                        : 0} suffix="%" />
                                </div>
                                <p className="text-xs text-purple-600 mt-1">Of all alumni</p>
                                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                    {comprehensiveData?.job_alignment.total_employed || 0} of {dashboardStats?.overview.total_alumni || 0} alumni
                                </div>
                            </CardContent>
                        </Card>

                        {/* Non-Employment Rate */}
                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-gray-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-red-800">Non-Employment</CardTitle>
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-red-700">
                                    <CountUp end={comprehensiveData?.attrition_rate.summary.overall_attrition_rate || 0} suffix="%" />
                                </div>
                                <p className="text-xs text-red-600 mt-1">Unemployed + Continuing Ed.</p>
                                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                    {(comprehensiveData?.attrition_rate.summary.total_dropout || 0) + (comprehensiveData?.attrition_rate.summary.total_transferred || 0)} alumni
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Section 2: Employment Analytics */}
                <div className="space-y-4" style={sectionStyle(150)}>
                    <h3 className="text-xl font-bold text-maroon-800 dark:text-gray-200 flex items-center">
                        <Briefcase className="h-5 w-5 mr-2" />
                        Employment Analytics
                    </h3>

                    {/* Employment KPI Cards */}
                    {kpiMetrics && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-maroon-800 dark:text-gray-200">Avg Time to Job</CardTitle>
                                    <Calendar className="h-4 w-4 text-maroon-600 dark:text-gray-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-maroon-800 dark:text-gray-200">
                                        {formatDays(kpiMetrics.overall_avg_days)}
                                    </div>
                                    <p className="text-xs text-maroon-600 dark:text-gray-400 mt-1">After graduation</p>
                                </CardContent>
                            </Card>

                            <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-maroon-800 dark:text-gray-200">Good Match</CardTitle>
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">
                                        {jobMismatchStats?.good_match_count || 0}
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        {jobMismatchStats?.good_match_percentage || 0}% of employed
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-maroon-800 dark:text-gray-200">Overqualified</CardTitle>
                                    <ArrowUp className="h-4 w-4 text-orange-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-orange-600">
                                        {jobMismatchStats?.overqualified_count || 0}
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        {jobMismatchStats?.overqualified_percentage || 0}% of employed
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-maroon-800 dark:text-gray-200">Unfit/Mismatch</CardTitle>
                                    <XCircle className="h-4 w-4 text-red-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-red-600">
                                        {jobMismatchStats?.unfit_count || 0}
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        {jobMismatchStats?.unfit_percentage || 0}% of employed
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-maroon-800 dark:text-gray-200">Underqualified</CardTitle>
                                    <ArrowDown className="h-4 w-4 text-blue-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-blue-600">
                                        {jobMismatchStats?.underqualified_count || 0}
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        {jobMismatchStats?.underqualified_percentage || 0}% of employed
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Employment Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Job Qualification Match Distribution */}
                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-xl text-maroon-800 dark:text-gray-200">Job Qualification Match</CardTitle>
                                <CardDescription className="text-maroon-600 dark:text-gray-400">
                                    Distribution of job matches among employed alumni
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={[
                                            { name: 'Good Match', value: jobMismatchStats?.good_match_count || 0, color: COLORS.success },
                                            { name: 'Overqualified', value: jobMismatchStats?.overqualified_count || 0, color: COLORS.warning },
                                            { name: 'Unfit', value: jobMismatchStats?.unfit_count || 0, color: COLORS.danger },
                                            { name: 'Underqualified', value: jobMismatchStats?.underqualified_count || 0, color: COLORS.info },
                                        ]}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="name" stroke={COLORS.primary} fontSize={12} />
                                        <YAxis stroke={COLORS.primary} fontSize={12} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Alumni Count">
                                            {[
                                                { name: 'Good Match', color: COLORS.success },
                                                { name: 'Overqualified', color: COLORS.warning },
                                                { name: 'Unfit', color: COLORS.danger },
                                                { name: 'Underqualified', color: COLORS.info },
                                            ].map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Program Performance Comparison */}
                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-xl text-maroon-800 dark:text-gray-200">Program Performance</CardTitle>
                                <CardDescription className="text-maroon-600 dark:text-gray-400">
                                    Average time-to-job by degree program
                                    {(() => {
                                        const yearWithData = [...timeToJobData].reverse().find(y => y.program_breakdown && y.program_breakdown.length > 0);
                                        return yearWithData ? ` (${yearWithData.graduation_year})` : '';
                                    })()}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart
                                        data={(() => {
                                            // Find the most recent year with program breakdown data
                                            const yearWithData = [...timeToJobData].reverse().find(y => y.program_breakdown && y.program_breakdown.length > 0);
                                            return yearWithData?.program_breakdown || [];
                                        })()}
                                        margin={{ top: 20, right: 10, left: 10, bottom: 60 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="program"
                                            stroke={COLORS.primary}
                                            fontSize={9}
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                            interval={0}
                                            tick={({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => {
                                                const label = payload.value.length > 20 ? payload.value.substring(0, 18) + '…' : payload.value;
                                                return (
                                                    <g transform={`translate(${x},${y})`}>
                                                        <text x={0} y={0} dy={8} textAnchor="end" fill={COLORS.primary} fontSize={9} transform="rotate(-45)">
                                                            {label}
                                                        </text>
                                                    </g>
                                                );
                                            }}
                                        />
                                        <YAxis stroke={COLORS.primary} fontSize={12} tickFormatter={(value) => `${value}d`} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="avg_days" name="Avg Days to Job" radius={[4, 4, 0, 0]}>
                                            {(() => {
                                                const yearWithData = [...timeToJobData].reverse().find(y => y.program_breakdown && y.program_breakdown.length > 0);
                                                return (yearWithData?.program_breakdown || []).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color || COLORS.primary} />
                                                ));
                                            })()}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Section 3: Enrollment & Attrition Analytics */}
                <div className="space-y-4" style={sectionStyle(300)}>
                    <h3 className="text-xl font-bold text-maroon-800 dark:text-gray-200 flex items-center">
                        <GraduationCap className="h-5 w-5 mr-2" />
                        Enrollment & Attrition Analytics
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Enrollment vs Graduation Chart */}
                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-xl text-maroon-800 dark:text-gray-200">Graduates vs Employed</CardTitle>
                                <CardDescription className="text-maroon-600 dark:text-gray-400">
                                    Graduated alumni and employment count by year
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={comprehensiveData?.enrollment_metrics.yearly_breakdown.slice(0, 10) || []}
                                        margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="year" stroke={COLORS.primary} fontSize={11} />
                                        <YAxis stroke={COLORS.primary} fontSize={11} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 11 }} />
                                        <Bar dataKey="graduated" name="Graduated" fill={COLORS.info} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="employed" name="Employed" fill={COLORS.success} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Attrition Breakdown */}
                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-xl text-maroon-800 dark:text-gray-200">Unemployment Breakdown</CardTitle>
                                <CardDescription className="text-maroon-600 dark:text-gray-400">
                                    Unemployed and continuing education by graduation year
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={comprehensiveData?.attrition_rate.yearly_breakdown.slice(0, 10) || []}
                                        margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="year" stroke={COLORS.primary} fontSize={11} />
                                        <YAxis stroke={COLORS.primary} fontSize={11} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 11 }} />
                                        <Bar dataKey="dropout" name="Unemployed" fill={COLORS.danger} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="transferred" name="Continuing Ed." fill={COLORS.warning} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* College-level Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                        {/* Alumni by College */}
                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-xl text-maroon-800 dark:text-gray-200">Alumni by College</CardTitle>
                                <CardDescription className="text-maroon-600 dark:text-gray-400">
                                    Total alumni and employment by college/department
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart
                                        data={comprehensiveData?.college_breakdown || []}
                                        layout="vertical"
                                        margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis type="number" stroke={COLORS.primary} fontSize={11} />
                                        <YAxis
                                            dataKey="college_code"
                                            type="category"
                                            stroke={COLORS.primary}
                                            fontSize={10}
                                            width={65}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 11 }} />
                                        <Bar dataKey="total_alumni" name="Total Alumni" fill={COLORS.info} radius={[0, 4, 4, 0]} />
                                        <Bar dataKey="employed" name="Employed" fill={COLORS.success} radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Job Alignment by College */}
                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-xl text-maroon-800 dark:text-gray-200">Job Alignment by College</CardTitle>
                                <CardDescription className="text-maroon-600 dark:text-gray-400">
                                    Employed vs job-aligned alumni by college/department
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart
                                        data={comprehensiveData?.college_breakdown || []}
                                        layout="vertical"
                                        margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis type="number" stroke={COLORS.primary} fontSize={11} />
                                        <YAxis
                                            dataKey="college_code"
                                            type="category"
                                            stroke={COLORS.primary}
                                            fontSize={10}
                                            width={65}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 11 }} />
                                        <Bar dataKey="employed" name="Employed" fill={COLORS.success} radius={[0, 4, 4, 0]} />
                                        <Bar dataKey="aligned" name="Job Aligned" fill={COLORS.warning} radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Course-level Table */}
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg mt-6">
                        <CardHeader>
                            <CardTitle className="text-xl text-maroon-800 dark:text-gray-200">Course Alumni & Employment Breakdown</CardTitle>
                            <CardDescription className="text-maroon-600 dark:text-gray-400">
                                Alumni employment and job alignment by course/program (Top 15)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-3">
                                {comprehensiveData?.course_breakdown?.map((course, index) => (
                                    <div key={index} className="border border-beige-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
                                        <div className="font-medium text-maroon-700 dark:text-gray-300 text-sm">{course.course}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{course.college}</div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="bg-beige-50 dark:bg-gray-800 rounded p-2">
                                                <span className="text-gray-500 dark:text-gray-400 text-xs">Alumni</span>
                                                <p className="font-semibold">{course.total_alumni}</p>
                                            </div>
                                            <div className="bg-beige-50 dark:bg-gray-800 rounded p-2">
                                                <span className="text-gray-500 dark:text-gray-400 text-xs">Employed</span>
                                                <p className="font-semibold">{course.employed}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${course.employment_rate >= 80 ? 'bg-green-100 text-green-700' : course.employment_rate >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                Emp: {course.employment_rate}%
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${course.alignment_rate >= 50 ? 'bg-green-100 text-green-700' : course.alignment_rate >= 25 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                Align: {course.alignment_rate}%
                                            </span>
                                            <span className="text-xs text-blue-600">Aligned: {course.aligned}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-beige-200 dark:border-gray-700 bg-beige-50 dark:bg-gray-800">
                                            <th className="text-left py-3 px-4 font-semibold text-maroon-800 dark:text-gray-200">Course</th>
                                            <th className="text-left py-3 px-4 font-semibold text-maroon-800 dark:text-gray-200">College</th>
                                            <th className="text-center py-3 px-4 font-semibold text-maroon-800 dark:text-gray-200">Alumni</th>
                                            <th className="text-center py-3 px-4 font-semibold text-maroon-800 dark:text-gray-200">Employed</th>
                                            <th className="text-center py-3 px-4 font-semibold text-maroon-800 dark:text-gray-200">Emp. Rate</th>
                                            <th className="text-center py-3 px-4 font-semibold text-maroon-800 dark:text-gray-200">Aligned</th>
                                            <th className="text-center py-3 px-4 font-semibold text-maroon-800 dark:text-gray-200">Align Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {comprehensiveData?.course_breakdown?.map((course, index) => (
                                            <tr key={index} className="border-b border-beige-100 dark:border-gray-700 hover:bg-beige-50/50 dark:hover:bg-gray-800 transition-colors">
                                                <td className="py-3 px-4">
                                                    <span className="font-medium text-maroon-700 dark:text-gray-300">{course.course}</span>
                                                </td>
                                                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{course.college}</td>
                                                <td className="text-center py-3 px-4 font-medium">{course.total_alumni}</td>
                                                <td className="text-center py-3 px-4">{course.employed}</td>
                                                <td className="text-center py-3 px-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${course.employment_rate >= 80 ? 'bg-green-100 text-green-700' :
                                                        course.employment_rate >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                        {course.employment_rate}%
                                                    </span>
                                                </td>
                                                <td className="text-center py-3 px-4 text-blue-600">{course.aligned}</td>
                                                <td className="text-center py-3 px-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${course.alignment_rate >= 50 ? 'bg-green-100 text-green-700' :
                                                        course.alignment_rate >= 25 ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                        {course.alignment_rate}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Section 4: Performance Trends */}
                <div className="space-y-4" style={sectionStyle(450)}>
                    <h3 className="text-xl font-bold text-maroon-800 dark:text-gray-200 flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2" />
                        Performance Trends
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Performance Indicator by Year */}
                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-xl text-maroon-800 dark:text-gray-200">Employment Performance by Year</CardTitle>
                                <CardDescription className="text-maroon-600 dark:text-gray-400">
                                    Percentage of graduates employed within 2 years
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart
                                        data={comprehensiveData?.performance_indicator.yearly_breakdown || []}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="year" stroke={COLORS.primary} fontSize={12} />
                                        <YAxis
                                            stroke={COLORS.primary}
                                            fontSize={12}
                                            tickFormatter={(value) => `${value}%`}
                                            domain={[0, 100]}
                                        />
                                        <Tooltip
                                            formatter={(value: number) => [`${value}%`, 'Performance Rate']}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="performance_rate"
                                            stroke={COLORS.success}
                                            strokeWidth={3}
                                            dot={{ fill: COLORS.success, strokeWidth: 2, r: 4 }}
                                            name="Performance Rate"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Time-to-Job Trend */}
                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-xl text-maroon-800 dark:text-gray-200">Time-to-Job Trend</CardTitle>
                                <CardDescription className="text-maroon-600 dark:text-gray-400">
                                    Average days to secure employment by graduation year
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
                    </div>
                </div>

                {/* Section 5: Program-wise Performance Table */}
                <div className="space-y-4" style={sectionStyle(550)}>
                    <h3 className="text-xl font-bold text-maroon-800 dark:text-gray-200 flex items-center">
                        <Building className="h-5 w-5 mr-2" />
                        Program-wise Performance
                    </h3>

                    {/* Summary row */}
                    {comprehensiveData?.program_performance && comprehensiveData.program_performance.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="rounded-xl bg-gradient-to-br from-maroon-50 to-beige-50 dark:from-maroon-950/30 dark:to-gray-800 p-4 border border-maroon-100 dark:border-gray-700">
                                <p className="text-xs font-medium text-maroon-600 dark:text-gray-400 mb-1">Total Programs</p>
                                <p className="text-2xl font-bold text-maroon-800 dark:text-gray-200"><CountUp end={comprehensiveData.program_performance.length} duration={800} /></p>
                            </div>
                            <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-gray-800 p-4 border border-green-100 dark:border-gray-700">
                                <p className="text-xs font-medium text-green-600 dark:text-gray-400 mb-1">Best Employment</p>
                                <p className="text-2xl font-bold text-green-700 dark:text-green-300"><CountUp end={Math.max(...comprehensiveData.program_performance.map(p => p.employment_rate))} suffix="%" duration={800} /></p>
                            </div>
                            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-gray-800 p-4 border border-blue-100 dark:border-gray-700">
                                <p className="text-xs font-medium text-blue-600 dark:text-gray-400 mb-1">Best Alignment</p>
                                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300"><CountUp end={Math.max(...comprehensiveData.program_performance.map(p => p.alignment_rate))} suffix="%" duration={800} /></p>
                            </div>
                            <div className="rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-gray-800 p-4 border border-purple-100 dark:border-gray-700">
                                <p className="text-xs font-medium text-purple-600 dark:text-gray-400 mb-1">Total Alumni</p>
                                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300"><CountUp end={comprehensiveData.program_performance.reduce((s, p) => s + p.total_alumni, 0)} duration={800} /></p>
                            </div>
                        </div>
                    )}

                    {/* Program Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {comprehensiveData?.program_performance
                            .sort((a, b) => b.employment_rate - a.employment_rate)
                            .map((program, index) => {
                                const empColor = program.employment_rate >= 75 ? 'green' : program.employment_rate >= 50 ? 'yellow' : 'red';
                                const alignColor = program.alignment_rate >= 50 ? 'blue' : 'gray';
                                const empColorMap: Record<string, string> = { green: 'bg-green-500', yellow: 'bg-yellow-500', red: 'bg-red-500' };
                                const alignColorMap: Record<string, string> = { blue: 'bg-blue-500', gray: 'bg-gray-400' };
                                const maxAlumni = Math.max(...(comprehensiveData?.program_performance.map(p => p.total_alumni) || [1]));
                                return (
                                    <Card
                                        key={index}
                                        className="border-none shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 overflow-hidden group"
                                        style={{
                                            opacity: animated ? 1 : 0,
                                            transform: animated ? 'translateY(0)' : 'translateY(16px)',
                                            transition: `opacity 0.5s ease ${600 + index * 60}ms, transform 0.5s ease ${600 + index * 60}ms`,
                                        }}
                                    >
                                        {/* Top accent bar showing relative size */}
                                        <div className="h-1 bg-gray-100 dark:bg-gray-700">
                                            <div
                                                className="h-1 bg-gradient-to-r from-maroon-500 to-maroon-400 transition-all duration-1000 ease-out"
                                                style={{ width: animated ? `${(program.total_alumni / maxAlumni) * 100}%` : '0%', transitionDelay: `${700 + index * 60}ms` }}
                                            />
                                        </div>
                                        <CardContent className="p-4 space-y-3">
                                            {/* Program name + alumni count */}
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="p-1.5 bg-maroon-100 dark:bg-maroon-900/40 rounded-lg shrink-0">
                                                        <GraduationCap className="h-4 w-4 text-maroon-600 dark:text-maroon-400" />
                                                    </div>
                                                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate" title={program.program}>
                                                        {program.program}
                                                    </h4>
                                                </div>
                                                <span className="text-xs font-bold text-maroon-600 dark:text-maroon-400 bg-maroon-50 dark:bg-maroon-950/40 px-2 py-0.5 rounded-full shrink-0">
                                                    {program.total_alumni} alumni
                                                </span>
                                            </div>

                                            {/* Employment Rate bar */}
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Employment</span>
                                                    <span className={`text-xs font-bold ${empColor === 'green' ? 'text-green-600' : empColor === 'yellow' ? 'text-yellow-600' : 'text-red-600'}`}>
                                                        {program.employment_rate}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={`${empColorMap[empColor]} h-2 rounded-full transition-all duration-1000 ease-out`}
                                                        style={{ width: animated ? `${program.employment_rate}%` : '0%', transitionDelay: `${700 + index * 60}ms` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Alignment Rate bar */}
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Job Alignment</span>
                                                    <span className={`text-xs font-bold ${alignColor === 'blue' ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}>
                                                        {program.alignment_rate}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={`${alignColorMap[alignColor]} h-2 rounded-full transition-all duration-1000 ease-out`}
                                                        style={{ width: animated ? `${program.alignment_rate}%` : '0%', transitionDelay: `${750 + index * 60}ms` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Bottom stats */}
                                            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        <span className="font-semibold text-gray-700 dark:text-gray-300">{program.employed}</span> employed
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        <span className="font-semibold text-gray-700 dark:text-gray-300">{program.aligned}</span> aligned
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                                                    {program.avg_days_to_job > 0 ? `⏱ ${formatDays(program.avg_days_to_job)}` : ''}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                    </div>
                </div>

                {/* Section 5.5: Employment Location Analytics */}
                {comprehensiveData?.employment_location && (
                    <div className="space-y-4" style={sectionStyle(650)}>
                        <h3 className="text-xl font-bold text-maroon-800 dark:text-gray-200 flex items-center">
                            <Globe className="h-5 w-5 mr-2" />
                            Employment Location (Local vs Foreign)
                        </h3>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="border-beige-200 dark:border-gray-700 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-emerald-500 rounded-lg"><MapPin className="h-5 w-5 text-white" /></div>
                                        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Local (Philippines)</span>
                                    </div>
                                    <p className="text-3xl font-bold text-emerald-800 dark:text-emerald-200"><CountUp end={comprehensiveData.employment_location.summary.local} /></p>
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400"><CountUp end={comprehensiveData.employment_location.summary.local_rate} suffix="% of employed" /></p>
                                </CardContent>
                            </Card>
                            <Card className="border-beige-200 dark:border-gray-700 shadow-lg bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-sky-500 rounded-lg"><Globe className="h-5 w-5 text-white" /></div>
                                        <span className="text-sm font-semibold text-sky-700 dark:text-sky-300">Foreign / OFW</span>
                                    </div>
                                    <p className="text-3xl font-bold text-sky-800 dark:text-sky-200"><CountUp end={comprehensiveData.employment_location.summary.foreign} /></p>
                                    <p className="text-sm text-sky-600 dark:text-sky-400"><CountUp end={comprehensiveData.employment_location.summary.foreign_rate} suffix="% working abroad" /></p>
                                </CardContent>
                            </Card>
                            <Card className="border-beige-200 dark:border-gray-700 shadow-lg bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-violet-500 rounded-lg"><Briefcase className="h-5 w-5 text-white" /></div>
                                        <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">Remote (Foreign Co.)</span>
                                    </div>
                                    <p className="text-3xl font-bold text-violet-800 dark:text-violet-200"><CountUp end={comprehensiveData.employment_location.summary.remote} /></p>
                                    <p className="text-sm text-violet-600 dark:text-violet-400"><CountUp end={comprehensiveData.employment_location.summary.remote_rate} suffix="% remote work" /></p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Yearly Trend Chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-xl text-maroon-800 dark:text-gray-200">Location Trend by Year</CardTitle>
                                    <CardDescription className="text-maroon-600 dark:text-gray-400">Employment location distribution per graduation year</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={comprehensiveData.employment_location.yearly_trend} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="year" stroke={COLORS.primary} fontSize={12} />
                                            <YAxis stroke={COLORS.primary} fontSize={12} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Bar dataKey="local" stackId="location" fill="#10B981" name="Local" radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="foreign" stackId="location" fill="#0EA5E9" name="Foreign/OFW" radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="remote" stackId="location" fill="#8B5CF6" name="Remote" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Department Breakdown */}
                            <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-xl text-maroon-800 dark:text-gray-200">Location by Department</CardTitle>
                                    <CardDescription className="text-maroon-600 dark:text-gray-400">Where each department's alumni work</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart
                                            data={comprehensiveData.employment_location.department_breakdown}
                                            layout="vertical"
                                            margin={{ top: 10, right: 10, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis type="number" stroke={COLORS.primary} fontSize={12} />
                                            <YAxis dataKey="department" type="category" stroke={COLORS.primary} fontSize={10} width={120} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Bar dataKey="local" stackId="loc" fill="#10B981" name="Local" />
                                            <Bar dataKey="foreign" stackId="loc" fill="#0EA5E9" name="Foreign" />
                                            <Bar dataKey="remote" stackId="loc" fill="#8B5CF6" name="Remote" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Section 6: System Overview (only for super_admin) */}
                {user.role === 'super_admin' && dashboardStats && (
                    <div className="space-y-4" style={sectionStyle(750)}>
                        <h3 className="text-xl font-bold text-maroon-800 dark:text-gray-200 flex items-center">
                            <Activity className="h-5 w-5 mr-2" />
                            System Overview
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-blue-100 rounded-lg">
                                            <Users className="h-6 w-6 text-blue-600" />
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                                        {dashboardStats.overview.total_users || 0}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-purple-100 rounded-lg">
                                            <Building className="h-6 w-6 text-purple-600" />
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Departments</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                                        {dashboardStats.overview.total_departments || 0}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        {dashboardStats.overview.total_courses || 0} total courses
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-orange-100 rounded-lg">
                                            <ClipboardList className="h-6 w-6 text-orange-600" />
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Surveys</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                                        {dashboardStats.overview.total_surveys || 0}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        {dashboardStats.overview.active_surveys || 0} active
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-green-100 rounded-lg">
                                            <BarChart3 className="h-6 w-6 text-green-600" />
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Response Rate</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                                        {dashboardStats.overview.response_rate?.toFixed(1) || 0}%
                                    </p>
                                    <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-green-600 h-2 rounded-full transition-all"
                                            style={{ width: `${Math.min(dashboardStats.overview.response_rate || 0, 100)}%` }}
                                        ></div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Section 7: Additional Charts */}
                {dashboardStats && (
                    <div className="space-y-4" style={sectionStyle(850)}>
                        <h3 className="text-xl font-bold text-maroon-800 dark:text-gray-200 flex items-center">
                            <BarChart3 className="h-5 w-5 mr-2" />
                            Additional Insights
                        </h3>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Employment Status Distribution */}
                            <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-xl text-maroon-800 dark:text-gray-200">Employment Status Distribution</CardTitle>
                                    <CardDescription className="text-maroon-600 dark:text-gray-400">
                                        Current employment breakdown
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart
                                            data={Object.entries(dashboardStats.employment_stats).map(([key, value]) => {
                                                const statusLabels: Record<string, string> = {
                                                    'employed_full_time': 'Full Time',
                                                    'employed_part_time': 'Part Time',
                                                    'self_employed': 'Self Emp.',
                                                    'unemployed_seeking': 'Seeking',
                                                    'unemployed_not_seeking': 'Not Seeking',
                                                    'continuing_education': 'Education',
                                                    'other': 'Other'
                                                };
                                                return {
                                                    status: statusLabels[key] || key,
                                                    count: value,
                                                };
                                            })}
                                            margin={{ top: 10, right: 10, left: 0, bottom: 50 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="status"
                                                stroke={COLORS.primary}
                                                fontSize={10}
                                                angle={-45}
                                                textAnchor="end"
                                                height={55}
                                            />
                                            <YAxis stroke={COLORS.primary} fontSize={11} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="Alumni Count" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Batch Distribution */}
                            <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-xl text-maroon-800 dark:text-gray-200">Batch Distribution</CardTitle>
                                    <CardDescription className="text-maroon-600 dark:text-gray-400">
                                        Alumni count by graduation batch
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart
                                            data={dashboardStats.batch_distribution}
                                            margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
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
                    </div>
                )}
            </div>
        </AdminBaseLayout>
    );
}
