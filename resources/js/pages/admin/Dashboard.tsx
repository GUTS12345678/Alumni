import React, { useEffect, useState, useRef } from 'react';
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
    AlertCircle,
    Clock,
    ArrowRight,
    ArrowUpRight,
    Sparkles,
    Settings,
    Zap,
    Target,
    Bell,
    Briefcase,
    Megaphone,
    MapPin,
    Eye,
    Globe,
    RefreshCw,
} from 'lucide-react';
import { router } from '@inertiajs/react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import { useCampus } from '@/contexts/CampusContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useAdminChannel } from '@/hooks/useAdminChannel';
import { useToast } from '@/hooks/use-toast';
import { dashboardApi, contentApi } from '@/lib/api';

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
    employment_location_stats: {
        local: number;
        foreign: number;
        remote: number;
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

interface RecentJob {
    id: number;
    title: string;
    company_name: string;
    location: string;
    status: string;
    is_featured: boolean;
    views_count: number;
    created_at: string;
}

interface RecentAnnouncement {
    id: number;
    title: string;
    priority: string;
    is_published: boolean;
    reads_count: number;
    created_at: string;
}

interface Props {
    user: User;
}

// Animated counter component
const CountUp = ({ end, decimals = 0, duration = 1500, prefix = '', suffix = '', animate = true }: {
    end: number; decimals?: number; duration?: number; prefix?: string; suffix?: string; animate?: boolean;
}) => {
    const [value, setValue] = useState(0);
    const frameRef = useRef<number>(0);
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (!animate) { setValue(0); return; }
        if (hasAnimated.current) { setValue(end); return; }
        hasAnimated.current = true;
        const startTime = performance.now();
        const step = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(eased * end);
            if (progress < 1) frameRef.current = requestAnimationFrame(step);
        };
        frameRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frameRef.current);
    }, [end, animate, duration]);

    return <>{prefix}{decimals > 0 ? value.toFixed(decimals) : Math.round(value)}{suffix}</>;
};

export default function AdminDashboard({ user }: Props) {
    // Campus context for filtering
    const { selectedCampus } = useCampus();

    // Dashboard stats with auto-polling every 60 seconds
    const {
        data: stats,
        loading,
        error,
        errorMessage,
        refresh: refreshStats,
        refreshing,
        lastUpdated,
    } = useApiQuery<DashboardStats>(
        () => dashboardApi.getStats({ campus_id: selectedCampus?.id }),
        [selectedCampus?.id],
        { pollingInterval: 60000 }
    );

    // Recent content (jobs + announcements) with auto-polling
    const {
        data: recentContentData,
        refresh: refreshContent,
    } = useApiQuery<any>(
        () => contentApi.adminList({ per_page: 5, campus_id: selectedCampus?.id }),
        [selectedCampus?.id],
        { pollingInterval: 60000 }
    );

    const recentJobs = (recentContentData?.data || []).filter((c: any) => c.content_type === 'job').slice(0, 5) as RecentJob[];
    const recentAnnouncements = (recentContentData?.data || []).filter((c: any) => c.content_type === 'announcement').slice(0, 5) as RecentAnnouncement[];

    // Real-time updates via WebSocket — instant refresh when data changes
    const { toast } = useToast();
    useAdminChannel({
        onDashboardUpdate: () => {
            refreshStats();
            refreshContent();
        },
        onContentChange: (data) => {
            refreshContent();
            if (data.action === 'created' && data.title) {
                toast({
                    title: `New ${data.content_type}`,
                    description: data.title,
                });
            }
        },
        onSurveyResponse: (data) => {
            refreshStats();
            toast({
                title: 'New Survey Response',
                description: `${data.respondent_name} completed "${data.survey_title}"`,
            });
        },
    });

    // Animation triggers after data loads
    const [animated, setAnimated] = useState(false);
    useEffect(() => {
        if (!loading && stats) {
            const timer = setTimeout(() => setAnimated(true), 150);
            return () => clearTimeout(timer);
        }
    }, [loading, stats]);

    // Staggered entrance animation helper
    const sectionStyle = (delay: number): React.CSSProperties => ({
        opacity: animated ? 1 : 0,
        transform: animated ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    });

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
            <div className="min-h-screen bg-gradient-to-br from-beige-50 to-beige-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600 dark:text-red-400">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">{errorMessage}</p>
                        <Button onClick={() => refreshStats()} className="w-full">
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
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-maroon-600 via-maroon-700 to-maroon-900 p-8 shadow-2xl" style={sectionStyle(0)}>
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
                            <div className="text-right mr-2">
                                {lastUpdated && (
                                    <span className="text-xs text-beige-200">
                                        Updated {lastUpdated.toLocaleTimeString()}
                                    </span>
                                )}
                            </div>
                            <Button
                                onClick={() => { refreshStats(); refreshContent(); }}
                                variant="outline"
                                className="bg-white/10 border-white/30 text-white hover:bg-white/20 transition-all"
                                disabled={refreshing}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                {refreshing ? 'Refreshing...' : 'Refresh'}
                            </Button>
                            <Button
                                onClick={() => router.visit('/admin/surveys/create')}
                                className="bg-white dark:bg-gray-800 text-maroon-700 dark:text-maroon-300 hover:bg-beige-50 dark:hover:bg-gray-700 shadow-lg hover:shadow-xl dark:shadow-gray-900/50 transition-all"
                            >
                                <Zap className="h-4 w-4 mr-2" />
                                Quick Create Survey
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Key Metrics - Employment Focused */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" style={sectionStyle(100)}>
                    {/* Employment Rate - Primary Metric */}
                    <Card className="relative overflow-hidden border-none shadow-lg dark:shadow-gray-900/50 hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 dark:bg-green-800 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-bold text-green-900 dark:text-green-100">Employment Rate</CardTitle>
                            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md group-hover:shadow-lg transition-all">
                                <UserCheck className="h-5 w-5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-4xl font-extrabold text-green-800 dark:text-green-200 mb-1">
                                <CountUp end={stats?.employment_metrics?.employment_rate || 0} decimals={1} animate={animated} suffix="%" />
                            </div>
                            <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-3">
                                {stats?.employment_metrics?.total_employed || 0} of {stats?.overview?.total_alumni || 0} alumni employed
                            </p>
                            <div className="pt-2 border-t border-green-100 dark:border-green-800">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Target: 75%</span>
                                    <span className="text-xs font-bold text-green-700 dark:text-green-300">
                                        {(stats?.employment_metrics?.employment_rate ?? 0) >= 75 ? '✓ Achieved' : 'In Progress'}
                                    </span>
                                </div>
                                <div className="w-full bg-green-100 dark:bg-green-900 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: animated ? `${Math.min(stats?.employment_metrics?.employment_rate || 0, 100)}%` : '0%', transitionDelay: '300ms' }}
                                    ></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Avg Days to Job */}
                    <Card className="relative overflow-hidden border-none shadow-lg dark:shadow-gray-900/50 hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/40 dark:to-sky-950/40">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 dark:bg-blue-800 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-bold text-blue-900 dark:text-blue-100">Avg Time to Employment</CardTitle>
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md group-hover:shadow-lg transition-all">
                                <Clock className="h-5 w-5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-4xl font-extrabold text-blue-800 dark:text-blue-200 mb-1">
                                <CountUp end={stats?.employment_metrics?.avg_days_to_job || 0} animate={animated} />
                            </div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-3">days after graduation</p>
                            <div className="flex items-center gap-2 pt-2 border-t border-blue-100 dark:border-blue-800">
                                {(stats?.employment_metrics?.avg_days_to_job || 0) <= 90 ? (
                                    <div className="flex items-center text-xs bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                        <span className="font-bold">Excellent</span>
                                    </div>
                                ) : (stats?.employment_metrics?.avg_days_to_job || 0) <= 180 ? (
                                    <div className="flex items-center text-xs bg-yellow-50 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-full">
                                        <Activity className="h-3 w-3 mr-1" />
                                        <span className="font-bold">Good</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center text-xs bg-orange-50 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        <span className="font-bold">Needs Attention</span>
                                    </div>
                                )}
                                <span className="text-xs text-gray-500 dark:text-gray-400">≈ {Math.round((stats?.employment_metrics?.avg_days_to_job || 0) / 30)} months</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Job Alignment */}
                    <Card className="relative overflow-hidden border-none shadow-lg dark:shadow-gray-900/50 hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/40 dark:to-violet-950/40">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 dark:bg-purple-800 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-bold text-purple-900 dark:text-purple-100">Job Alignment</CardTitle>
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md group-hover:shadow-lg transition-all">
                                <Target className="h-5 w-5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-4xl font-extrabold text-purple-800 dark:text-purple-200 mb-1">
                                <CountUp end={stats?.employment_metrics?.job_alignment_rate || 0} decimals={1} animate={animated} suffix="%" />
                            </div>
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-3">
                                {stats?.employment_metrics?.aligned_jobs_count || 0} working in their field
                            </p>
                            <button
                                onClick={() => router.visit('/admin/analytics')}
                                className="flex items-center text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 pt-2 border-t border-purple-100 dark:border-purple-800 transition-colors"
                            >
                                <BarChart3 className="h-3 w-3 mr-1" />
                                View Detailed Analysis
                                <ArrowRight className="h-3 w-3 ml-1" />
                            </button>
                        </CardContent>
                    </Card>

                    {/* Total Alumni */}
                    <Card className="relative overflow-hidden border-none shadow-lg dark:shadow-gray-900/50 hover:shadow-2xl transition-all duration-300 group bg-gradient-to-br from-maroon-50 to-beige-50 dark:from-maroon-950/40 dark:to-gray-900">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-maroon-200 dark:bg-maroon-800 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                            <CardTitle className="text-sm font-bold text-maroon-900 dark:text-gray-100">Total Alumni</CardTitle>
                            <div className="p-3 bg-gradient-to-br from-maroon-500 to-maroon-600 rounded-xl shadow-md group-hover:shadow-lg transition-all">
                                <Users className="h-5 w-5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-4xl font-extrabold text-maroon-800 dark:text-gray-200 mb-1"><CountUp end={stats?.overview?.total_alumni || 0} animate={animated} /></div>
                            <p className="text-xs text-maroon-600 dark:text-gray-400 font-medium mb-3">Registered in system</p>
                            <div className="flex items-center gap-2 pt-2 border-t border-maroon-100 dark:border-gray-700">
                                <div className="flex items-center text-xs bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    <span className="font-bold">+{stats?.recent_activity?.recent_registrations || 0}</span>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">this month</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Employment Insights - Consolidated */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={sectionStyle(200)}>
                    {/* Job Match Quality */}
                    <Card className="border-none shadow-lg dark:shadow-gray-900/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                                        <Target className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg text-maroon-900 dark:text-gray-100 font-bold">Job Match Quality</CardTitle>
                                        <CardDescription className="text-xs">How well alumni jobs align with their degrees</CardDescription>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => router.visit('/admin/alumni')} className="text-maroon-600 dark:text-gray-400 hover:text-maroon-700 dark:hover:text-gray-200 hover:bg-maroon-50 dark:hover:bg-maroon-800/30">
                                    <Users className="h-4 w-4 mr-1" /> Alumni
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-2">
                            {(() => {
                                const totalEmployed = stats?.employment_metrics?.total_employed ?? 0;
                                const items = [
                                    { label: 'Good Match', count: stats?.mismatch_stats?.good_match || 0, color: 'bg-green-500', bg: 'bg-green-50 dark:bg-green-950/40', text: 'text-green-700 dark:text-green-300' },
                                    { label: 'Overqualified', count: stats?.mismatch_stats?.overqualified || 0, color: 'bg-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/40', text: 'text-yellow-700 dark:text-yellow-300' },
                                    { label: 'Underqualified', count: stats?.mismatch_stats?.underqualified || 0, color: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300' },
                                    { label: 'Unfit', count: stats?.mismatch_stats?.unfit || 0, color: 'bg-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-300' },
                                ];
                                return items.map((item, idx) => {
                                    const pct = totalEmployed > 0 ? (item.count / totalEmployed) * 100 : 0;
                                    return (
                                        <div key={item.label} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${item.bg}`}>
                                            <span className={`text-sm font-semibold w-28 ${item.text}`}>{item.label}</span>
                                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                                <div className={`${item.color} h-2.5 rounded-full transition-all duration-1000 ease-out`} style={{ width: animated ? `${Math.min(pct, 100)}%` : '0%', transitionDelay: `${400 + idx * 150}ms` }} />
                                            </div>
                                            <span className={`text-sm font-bold w-10 text-right ${item.text}`}>{item.count}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 w-14 text-right">{pct.toFixed(1)}%</span>
                                        </div>
                                    );
                                });
                            })()}
                            <p className="text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-700">
                                Based on {stats?.employment_metrics?.total_employed || 0} employed alumni
                            </p>
                        </CardContent>
                    </Card>

                    {/* Employment Location */}
                    <Card className="border-none shadow-lg dark:shadow-gray-900/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg">
                                    <Globe className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-maroon-900 dark:text-gray-100 font-bold">Employment Location</CardTitle>
                                    <CardDescription className="text-xs">Where alumni are currently working</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-2">
                            {(() => {
                                const totalEmployed = stats?.employment_metrics?.total_employed ?? 0;
                                const locations = [
                                    { label: 'Local (PH)', count: stats?.employment_location_stats?.local || 0, color: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', icon: <MapPin className="h-4 w-4" /> },
                                    { label: 'Foreign / OFW', count: stats?.employment_location_stats?.foreign || 0, color: 'bg-sky-500', bg: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-700 dark:text-sky-300', icon: <Globe className="h-4 w-4" /> },
                                    { label: 'Remote', count: stats?.employment_location_stats?.remote || 0, color: 'bg-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-700 dark:text-violet-300', icon: <Briefcase className="h-4 w-4" /> },
                                ];
                                return locations.map((loc, idx) => {
                                    const pct = totalEmployed > 0 ? (loc.count / totalEmployed) * 100 : 0;
                                    return (
                                        <div key={loc.label} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${loc.bg}`}>
                                            <span className={`${loc.text}`}>{loc.icon}</span>
                                            <span className={`text-sm font-semibold w-28 ${loc.text}`}>{loc.label}</span>
                                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                                <div className={`${loc.color} h-2.5 rounded-full transition-all duration-1000 ease-out`} style={{ width: animated ? `${Math.min(pct, 100)}%` : '0%', transitionDelay: `${400 + idx * 150}ms` }} />
                                            </div>
                                            <span className={`text-sm font-bold w-10 text-right ${loc.text}`}>{loc.count}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 w-14 text-right">{pct.toFixed(1)}%</span>
                                        </div>
                                    );
                                });
                            })()}
                            <p className="text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-700">
                                Based on {stats?.employment_metrics?.total_employed || 0} employed alumni
                            </p>

                            {/* Unemployment Summary */}
                            <div className="mt-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Unemployed Alumni</p>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="rounded-lg bg-orange-50 dark:bg-orange-950/40 p-2 text-center">
                                        <div className="text-lg font-black text-orange-700 dark:text-orange-300"><CountUp end={stats?.unemployment_stats?.seeking || 0} animate={animated} duration={1000} /></div>
                                        <div className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">Seeking</div>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-2 text-center">
                                        <div className="text-lg font-black text-gray-700 dark:text-gray-300"><CountUp end={stats?.unemployment_stats?.not_seeking || 0} animate={animated} duration={1000} /></div>
                                        <div className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">Not Seeking</div>
                                    </div>
                                    <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/40 p-2 text-center">
                                        <div className="text-lg font-black text-indigo-700 dark:text-indigo-300"><CountUp end={stats?.unemployment_stats?.continuing_education || 0} animate={animated} duration={1000} /></div>
                                        <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Studying</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Monthly Trend & Batch Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={sectionStyle(350)}>
                    {/* Monthly Registration Trend */}
                    <Card className="border-none shadow-lg dark:shadow-gray-900/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-gradient-to-br from-maroon-500 to-maroon-600 rounded-lg">
                                    <TrendingUp className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-maroon-900 dark:text-gray-100 font-bold">Registration Trend</CardTitle>
                                    <CardDescription className="text-xs">Monthly alumni registrations (last 12 months)</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {stats?.monthly_trend && stats.monthly_trend.length > 0 ? (
                                <div className="space-y-2">
                                    {/* Mini bar chart */}
                                    <div className="flex items-end gap-1" style={{ height: 140 }}>
                                        {(() => {
                                            const trend = stats.monthly_trend;
                                            const maxVal = Math.max(...trend.map(t => t.registrations), 1);
                                            return trend.map((t, idx) => {
                                                const barPct = Math.max((t.registrations / maxVal) * 100, 3);
                                                return (
                                                    <div key={idx} className="flex-1 flex flex-col items-center h-full group" title={`${t.month}: ${t.registrations}`}>
                                                        <span className="text-[9px] text-gray-500 dark:text-gray-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity h-4 flex items-center">
                                                            {t.registrations}
                                                        </span>
                                                        <div className="flex-1 w-full relative">
                                                            <div
                                                                className="absolute bottom-0 left-[10%] right-[10%] bg-gradient-to-t from-maroon-600 to-maroon-400 rounded-t-sm transition-all duration-700 ease-out group-hover:from-maroon-700 group-hover:to-maroon-500"
                                                                style={{ height: animated ? `${barPct}%` : '0%', transitionDelay: `${500 + idx * 80}ms` }}
                                                            />
                                                        </div>
                                                        <span className="text-[8px] text-gray-400 dark:text-gray-500 font-medium truncate w-full text-center h-4 flex items-center justify-center">
                                                            {new Date(t.month + '-01').toLocaleString('en-US', { month: 'short' })}
                                                        </span>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                                        <span>Total: {stats.monthly_trend.reduce((sum, t) => sum + t.registrations, 0)} registrations</span>
                                        <span>Avg: {Math.round(stats.monthly_trend.reduce((sum, t) => sum + t.registrations, 0) / stats.monthly_trend.length)}/month</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                                    <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No registration data yet</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Batch Distribution */}
                    <Card className="border-none shadow-lg dark:shadow-gray-900/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg">
                                    <GraduationCap className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-maroon-900 dark:text-gray-100 font-bold">Batch Distribution</CardTitle>
                                    <CardDescription className="text-xs">Alumni count by graduation batch</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {stats?.batch_distribution && stats.batch_distribution.length > 0 ? (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {(() => {
                                        const sorted = [...stats.batch_distribution].sort((a, b) => b.batch_year - a.batch_year);
                                        const maxCount = Math.max(...sorted.map(b => b.alumni_count), 1);
                                        return sorted.map((batch, idx) => (
                                            <div key={idx} className="flex items-center gap-3 group">
                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-20 shrink-0">{batch.batch_name || batch.batch_year}</span>
                                                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-2 rounded-full transition-all duration-1000 ease-out"
                                                        style={{ width: animated ? `${(batch.alumni_count / maxCount) * 100}%` : '0%', transitionDelay: `${500 + idx * 100}ms` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 w-8 text-right">{batch.alumni_count}</span>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                                    <GraduationCap className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No batch data yet</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Two Column Layout for Survey Stats and Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={sectionStyle(450)}>
                    {/* Survey & Response Stats */}
                    <Card className="border-none shadow-lg dark:shadow-gray-900/50 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-950/30">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                                        <ClipboardList className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl text-maroon-900 dark:text-gray-100 font-bold">Survey Engagement</CardTitle>
                                        <CardDescription className="text-xs text-gray-500 dark:text-gray-400">Current statistics</CardDescription>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.visit('/admin/surveys')}
                                    className="text-maroon-600 dark:text-gray-400 hover:text-maroon-700 dark:hover:text-gray-200 hover:bg-maroon-50 dark:hover:bg-maroon-800/30"
                                >
                                    View All
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/40 dark:to-sky-950/40 p-4 border-2 border-blue-200/50 dark:border-blue-700/50">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Active Surveys</span>
                                        <span className="text-3xl font-black text-blue-800 dark:text-blue-200"><CountUp end={stats?.overview?.total_surveys || 0} animate={animated} duration={1000} /></span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Created</span>
                                    </div>
                                </div>
                                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/40 dark:to-violet-950/40 p-4 border-2 border-purple-200/50 dark:border-purple-700/50">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">Responses</span>
                                        <span className="text-3xl font-black text-purple-800 dark:text-purple-200"><CountUp end={stats?.overview?.total_responses || 0} animate={animated} duration={1000} /></span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Submitted</span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/40 dark:via-emerald-950/40 dark:to-teal-950/40 p-4 border-2 border-green-200/50 dark:border-green-700/50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-bold text-green-900 dark:text-green-100">Response Rate</span>
                                    <span className="text-2xl font-black text-green-700 dark:text-green-300">
                                        <CountUp end={stats?.overview?.response_rate || 0} decimals={1} animate={animated} suffix="%" />
                                    </span>
                                </div>
                                <div className="w-full bg-green-100 dark:bg-green-900 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: animated ? `${Math.min(stats?.overview?.response_rate || 0, 100)}%` : '0%', transitionDelay: '600ms' }}
                                    ></div>
                                </div>
                                <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-2">
                                    +{stats?.recent_activity?.recent_responses || 0} new responses this month
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

                    {/* Recent Activity Summary */}
                    <Card className="border-none shadow-lg dark:shadow-gray-900/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                                        <Activity className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl text-maroon-900 dark:text-gray-100 font-bold">Recent Activity</CardTitle>
                                        <CardDescription className="text-xs text-gray-500 dark:text-gray-400">Last 30 days</CardDescription>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 p-4 border-2 border-green-200/50 dark:border-green-700/50">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">New Alumni</span>
                                        <span className="text-3xl font-black text-green-800 dark:text-green-200">+<CountUp end={stats?.recent_activity?.recent_registrations || 0} animate={animated} duration={1000} /></span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Registered</span>
                                    </div>
                                </div>
                                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 p-4 border-2 border-amber-200/50 dark:border-amber-700/50">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">New Responses</span>
                                        <span className="text-3xl font-black text-amber-800 dark:text-amber-200">+<CountUp end={stats?.recent_activity?.recent_responses || 0} animate={animated} duration={1000} /></span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Survey answers</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Links */}
                            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={() => router.visit('/admin/alumni')}
                                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 hover:bg-maroon-50 dark:hover:bg-maroon-800/20 transition-colors group"
                                >
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-gray-400 group-hover:text-maroon-600" />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Alumni Bank</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-maroon-600" />
                                </button>
                                <button
                                    onClick={() => router.visit('/admin/analytics')}
                                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 hover:bg-maroon-50 dark:hover:bg-maroon-800/20 transition-colors group"
                                >
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4 text-gray-400 group-hover:text-maroon-600" />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Analytics</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-maroon-600" />
                                </button>
                                <button
                                    onClick={() => router.visit('/admin/content')}
                                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 hover:bg-maroon-50 dark:hover:bg-maroon-800/20 transition-colors group"
                                >
                                    <div className="flex items-center gap-2">
                                        <Megaphone className="h-4 w-4 text-gray-400 group-hover:text-maroon-600" />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Content Management</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-maroon-600" />
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Jobs & Announcements Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={sectionStyle(550)}>
                    {/* Recent Job Postings */}
                    <Card className="border-none shadow-lg dark:shadow-gray-900/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                                        <Briefcase className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl text-maroon-900 dark:text-gray-100 font-bold">Recent Jobs</CardTitle>
                                        <CardDescription className="text-xs text-gray-500 dark:text-gray-400">Latest job postings</CardDescription>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                    onClick={() => router.visit('/admin/content?type=job')}
                                >
                                    View All
                                    <ArrowRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recentJobs.length > 0 ? (
                                recentJobs.map((job) => (
                                    <div
                                        key={job.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900 hover:bg-blue-50/50 dark:hover:bg-gray-800 transition-colors cursor-pointer border border-gray-100 dark:border-gray-700"
                                        onClick={() => router.visit('/admin/content?type=job')}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50">
                                                <Briefcase className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-1">{job.title}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{job.company_name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {job.location && (
                                                        <span className="flex items-center text-xs text-gray-400 dark:text-gray-500">
                                                            <MapPin className="h-3 w-3 mr-1" />
                                                            {job.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${job.status === 'published'
                                                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                                }`}>
                                                {job.status}
                                            </span>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                <Eye className="h-3 w-3 inline mr-1" />
                                                {job.views_count || 0}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <Briefcase className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                    <p className="text-sm">No job postings yet</p>
                                </div>
                            )}
                            <Button
                                onClick={() => router.visit('/admin/content?type=job')}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
                            >
                                <Briefcase className="h-4 w-4 mr-2" />
                                Manage Content
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Recent Announcements */}
                    <Card className="border-none shadow-lg dark:shadow-gray-900/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                                        <Megaphone className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl text-maroon-900 dark:text-gray-100 font-bold">Announcements</CardTitle>
                                        <CardDescription className="text-xs text-gray-500 dark:text-gray-400">Recent broadcasts</CardDescription>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                                    onClick={() => router.visit('/admin/content?type=announcement')}
                                >
                                    View All
                                    <ArrowRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recentAnnouncements.length > 0 ? (
                                recentAnnouncements.map((announcement) => (
                                    <div
                                        key={announcement.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900 hover:bg-amber-50/50 dark:hover:bg-gray-800 transition-colors cursor-pointer border border-gray-100 dark:border-gray-700"
                                        onClick={() => router.visit('/admin/content?type=announcement')}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50">
                                                <Bell className={`h-4 w-4 ${announcement.priority === 'urgent' ? 'text-red-500' :
                                                    announcement.priority === 'high' ? 'text-orange-500' :
                                                        'text-amber-600'
                                                    }`} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-1">{announcement.title}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(announcement.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${announcement.is_published
                                                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                                }`}>
                                                {announcement.is_published ? 'Published' : 'Draft'}
                                            </span>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                <Eye className="h-3 w-3 inline mr-1" />
                                                {announcement.reads_count || 0}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <Megaphone className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                    <p className="text-sm">No announcements yet</p>
                                </div>
                            )}
                            <Button
                                onClick={() => router.visit('/admin/content?type=announcement')}
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all"
                            >
                                <Megaphone className="h-4 w-4 mr-2" />
                                Manage Content
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Super Admin Section - Enhanced */}
                {
                    user.role === 'super_admin' && (
                        <Card className="relative overflow-hidden border-none shadow-2xl bg-gradient-to-br from-red-600 via-rose-700 to-pink-800" style={sectionStyle(650)}>
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