import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ClipboardList, TrendingUp } from 'lucide-react';
import { router } from '@inertiajs/react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';

interface DashboardStats {
    total_alumni: number;
    total_surveys: number;
    total_responses: number;
    active_surveys: number;
    recent_registrations: number;
    employment_rate: number;
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
    const [error] = useState<string | null>(null);

    useEffect(() => {
        // For now, let's set some mock data to get the dashboard working
        // Later we can implement the API endpoint
        setTimeout(() => {
            setStats({
                total_alumni: 156,
                total_surveys: 8,
                total_responses: 142,
                active_surveys: 3,
                recent_registrations: 12,
                employment_rate: 78
            });
            setLoading(false);
        }, 1000);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-beige-50 to-beige-100 flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 border-4 border-maroon-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-maroon-800 font-medium">Loading dashboard...</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">Total Alumni</CardTitle>
                            <Users className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-maroon-800">{stats?.total_alumni || 0}</div>
                            <p className="text-xs text-maroon-600 mt-1">Registered in system</p>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">Active Surveys</CardTitle>
                            <ClipboardList className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-maroon-800">{stats?.active_surveys || 0}</div>
                            <p className="text-xs text-maroon-600 mt-1">Currently running</p>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">Total Responses</CardTitle>
                            <TrendingUp className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-maroon-800">{stats?.total_responses || 0}</div>
                            <p className="text-xs text-maroon-600 mt-1">Survey submissions</p>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">Employment Rate</CardTitle>
                            <TrendingUp className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-maroon-800">{stats?.employment_rate || 0}%</div>
                            <p className="text-xs text-maroon-600 mt-1">Alumni employed</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="border-beige-200 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                        onClick={() => router.visit('/admin/alumni')}>
                        <CardHeader>
                            <CardTitle className="text-xl text-maroon-800 flex items-center">
                                <Users className="h-6 w-6 mr-3 text-maroon-600" />
                                Alumni Bank
                            </CardTitle>
                            <CardDescription className="text-maroon-600">
                                Manage and view all registered alumni profiles
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 mb-4">
                                View, search, and manage alumni records. Export data and track career progress.
                            </p>
                            <Button className="bg-maroon-700 hover:bg-maroon-800 text-white">
                                View Alumni Bank
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                        onClick={() => router.visit('/admin/surveys')}>
                        <CardHeader>
                            <CardTitle className="text-xl text-maroon-800 flex items-center">
                                <ClipboardList className="h-6 w-6 mr-3 text-maroon-600" />
                                Survey Bank
                            </CardTitle>
                            <CardDescription className="text-maroon-600">
                                Create and manage surveys for alumni
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 mb-4">
                                Design surveys, track responses, and analyze alumni feedback and career data.
                            </p>
                            <Button className="bg-maroon-700 hover:bg-maroon-800 text-white">
                                Manage Surveys
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                        onClick={() => router.visit('/admin/analytics')}>
                        <CardHeader>
                            <CardTitle className="text-xl text-maroon-800 flex items-center">
                                <TrendingUp className="h-6 w-6 mr-3 text-maroon-600" />
                                Analytics
                            </CardTitle>
                            <CardDescription className="text-maroon-600">
                                View detailed reports and insights
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 mb-4">
                                Generate reports, view trends, and analyze alumni career progression data.
                            </p>
                            <Button className="bg-maroon-700 hover:bg-maroon-800 text-white">
                                View Analytics
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800">Recent Activity</CardTitle>
                        <CardDescription className="text-maroon-600">
                            Latest system activity and alumni registrations
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-beige-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-maroon-800">Alumni Registration Survey</p>
                                    <p className="text-sm text-maroon-600">Active and receiving responses</p>
                                </div>
                                <span className="text-sm text-green-600 font-medium">Active</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-beige-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-maroon-800">Recent Registrations</p>
                                    <p className="text-sm text-maroon-600">{stats?.recent_registrations || 0} new alumni this week</p>
                                </div>
                                <span className="text-sm text-blue-600 font-medium">+{stats?.recent_registrations || 0}</span>
                            </div>

                            <div className="text-center pt-4">
                                <Button
                                    variant="outline"
                                    className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                                    onClick={() => router.visit('/admin/activity')}
                                >
                                    View Full Activity Log
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminBaseLayout>
    );
}