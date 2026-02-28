import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import { ScrollFadeIn } from '@/components/scroll-animations';
import {
    TrendingUp,
    Users,
    GraduationCap,
    Building,
    ClipboardList,
    Activity,
    BarChart3,
    Calendar,
    ArrowUp,
    ArrowDown,
    Minus
} from 'lucide-react';

interface PageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            role: 'super_admin' | 'admin' | 'alumni';
            status: string;
        };
    };
}

interface SystemStats {
    totalUsers: number;
    totalDepartments: number;
    totalCourses: number;
    totalAlumni: number;
    totalSurveys: number;
    activeSurveys: number;
    recentRegistrations: number;
    userGrowth: number;
}

export default function Analytics({ auth }: PageProps) {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSystemStats();
    }, []);

    const fetchSystemStats = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/v1/admin/dashboard', {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) throw new Error('Failed to fetch system stats');

            const data = await response.json();
            if (data.success) {
                setStats({
                    totalUsers: data.data.overview.total_users || 0,
                    totalDepartments: data.data.overview.total_departments || 12,
                    totalCourses: data.data.overview.total_courses || 48,
                    totalAlumni: data.data.overview.total_alumni || 0,
                    totalSurveys: data.data.overview.total_surveys || 0,
                    activeSurveys: data.data.overview.active_surveys || 0,
                    recentRegistrations: data.data.recent_activity.recent_registrations || 0,
                    userGrowth: 12.5
                });
            }
        } catch (err) {
            console.error('Error fetching system stats:', err);
            setError('Failed to load system statistics');
        } finally {
            setLoading(false);
        }
    };

    const getTrendIcon = (value: number) => {
        if (value > 0) return <ArrowUp className="h-4 w-4 text-green-600" />;
        if (value < 0) return <ArrowDown className="h-4 w-4 text-red-600" />;
        return <Minus className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
    };

    const getTrendColor = (value: number) => {
        if (value > 0) return 'text-green-600';
        if (value < 0) return 'text-red-600';
        return 'text-gray-600 dark:text-gray-400';
    };

    const activityData = [
        { date: '2025-11-01', users: 45, surveys: 12, registrations: 8 },
        { date: '2025-11-02', users: 52, surveys: 15, registrations: 11 },
        { date: '2025-11-03', users: 48, surveys: 10, registrations: 6 },
        { date: '2025-11-04', users: 61, surveys: 18, registrations: 14 },
        { date: '2025-11-05', users: 58, surveys: 16, registrations: 9 },
    ];

    const departmentStats = [
        { name: 'College of Engineering', code: 'COE', students: 342, courses: 12, growth: 8.5 },
        { name: 'College of Business', code: 'COB', students: 278, courses: 10, growth: 5.2 },
        { name: 'College of Arts & Sciences', code: 'CAS', students: 256, courses: 15, growth: -2.1 },
        { name: 'College of Education', code: 'COEd', students: 189, courses: 8, growth: 12.3 },
        { name: 'College of Nursing', code: 'CON', students: 91, courses: 3, growth: 15.7 },
    ];

    if (loading) {
        return (
            <AdminBaseLayout title="System Analytics" user={auth.user}>
                <Head title="System Analytics" />
                <div className="flex items-center justify-center min-h-96">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maroon-600"></div>
                </div>
            </AdminBaseLayout>
        );
    }

    if (error || !stats) {
        return (
            <AdminBaseLayout title="System Analytics" user={auth.user}>
                <Head title="System Analytics" />
                <div className="text-center py-12">
                    <p className="text-red-600 mb-4">{error || 'No data available'}</p>
                    <button
                        onClick={fetchSystemStats}
                        className="px-4 py-2 bg-maroon-600 text-white rounded-lg hover:bg-maroon-700"
                    >
                        Retry
                    </button>
                </div>
            </AdminBaseLayout>
        );
    }

    return (
        <AdminBaseLayout title="System Analytics" user={auth.user}>
            <Head title="System Analytics" />

            <div className="space-y-6">
                <ScrollFadeIn>
                    {/* Header */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-beige-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">System Analytics</h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Comprehensive overview of system-wide metrics and trends
                                </p>
                            </div>
                        </div>
                    </div>
                </ScrollFadeIn>

                <ScrollFadeIn delay={100}>
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-beige-200 dark:border-gray-700 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className={`flex items-center space-x-1 ${getTrendColor(stats.userGrowth)}`}>
                                    {getTrendIcon(stats.userGrowth)}
                                    <span className="text-sm font-semibold">{Math.abs(stats.userGrowth)}%</span>
                                </div>
                            </div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.totalUsers.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">+{stats.recentRegistrations} this month</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-beige-200 dark:border-gray-700 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <GraduationCap className="h-6 w-6 text-green-600" />
                                </div>
                                <div className={`flex items-center space-x-1 ${getTrendColor(8.2)}`}>
                                    {getTrendIcon(8.2)}
                                    <span className="text-sm font-semibold">8.2%</span>
                                </div>
                            </div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Alumni</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.totalAlumni.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Registered alumni</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-beige-200 dark:border-gray-700 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <Building className="h-6 w-6 text-purple-600" />
                                </div>
                                <div className={`flex items-center space-x-1 ${getTrendColor(0)}`}>
                                    {getTrendIcon(0)}
                                    <span className="text-sm font-semibold">0%</span>
                                </div>
                            </div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Departments</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.totalDepartments}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{stats.totalCourses} total courses</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-beige-200 dark:border-gray-700 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-orange-100 rounded-lg">
                                    <ClipboardList className="h-6 w-6 text-orange-600" />
                                </div>
                                <div className={`flex items-center space-x-1 ${getTrendColor(5.4)}`}>
                                    {getTrendIcon(5.4)}
                                    <span className="text-sm font-semibold">5.4%</span>
                                </div>
                            </div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Surveys</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.totalSurveys}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{stats.activeSurveys} active</p>
                        </div>
                    </div>
                </ScrollFadeIn>

                <ScrollFadeIn delay={100}>
                    {/* Activity Overview */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-beige-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Recent Activity</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-4 gap-4 pb-2 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400">
                                <div>Date</div>
                                <div className="text-center">Active Users</div>
                                <div className="text-center">Survey Responses</div>
                                <div className="text-center">New Registrations</div>
                            </div>
                            {activityData.map((day, index) => (
                                <div key={index} className="grid grid-cols-4 gap-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm text-gray-900 dark:text-gray-100">{new Date(day.date).toLocaleDateString()}</span>
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
                    </div>
                </ScrollFadeIn>

                <ScrollFadeIn delay={100}>
                    {/* Department Performance */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-beige-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Department Performance</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Department
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Students
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Courses
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Growth
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Trend
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {departmentStats.map((dept, index) => (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="p-2 bg-maroon-100 dark:bg-maroon-800/30 rounded-lg">
                                                        <Building className="h-5 w-5 text-maroon-600 dark:text-gray-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{dept.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{dept.code}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{dept.students}</span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{dept.courses}</span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`text-sm font-semibold ${getTrendColor(dept.growth)}`}>
                                                    {dept.growth > 0 ? '+' : ''}{dept.growth}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex items-center justify-end">
                                                    {getTrendIcon(dept.growth)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </ScrollFadeIn>

                <ScrollFadeIn delay={100}>
                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                            <Activity className="h-8 w-8 mb-4 opacity-80" />
                            <p className="text-sm opacity-90">Total Activity</p>
                            <p className="text-3xl font-bold mt-2">2,847</p>
                            <p className="text-xs opacity-80 mt-2">System actions this month</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                            <TrendingUp className="h-8 w-8 mb-4 opacity-80" />
                            <p className="text-sm opacity-90">Engagement Rate</p>
                            <p className="text-3xl font-bold mt-2">68.3%</p>
                            <p className="text-xs opacity-80 mt-2">Alumni engagement</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                            <BarChart3 className="h-8 w-8 mb-4 opacity-80" />
                            <p className="text-sm opacity-90">Completion Rate</p>
                            <p className="text-3xl font-bold mt-2">84.7%</p>
                            <p className="text-xs opacity-80 mt-2">Survey completion</p>
                        </div>
                    </div>
                </ScrollFadeIn>
            </div>
        </AdminBaseLayout>
    );
}
