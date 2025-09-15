import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, Users, ClipboardList, TrendingUp, LogOut } from 'lucide-react';

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

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Get user info from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        // Check if user is admin
        const userData = storedUser ? JSON.parse(storedUser) : null;
        if (!userData || userData.role !== 'admin') {
            window.location.href = '/login';
            return;
        }

        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const response = await fetch('/api/v1/admin/dashboard', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    return;
                }
                throw new Error('Failed to fetch dashboard data');
            }

            const data = await response.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (err) {
            console.error('Dashboard fetch error:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (token) {
                await fetch('/api/v1/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    };

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
        <>
            <Head title="Admin Dashboard - Alumni Tracer System" />

            <div className="min-h-screen bg-gradient-to-br from-beige-50 to-beige-100">
                {/* Header */}
                <header className="bg-maroon-800 text-white shadow-lg">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <GraduationCap className="h-8 w-8" />
                                <div>
                                    <h1 className="text-2xl font-bold">Alumni Tracer System</h1>
                                    <p className="text-maroon-200">Administrator Dashboard</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="text-right">
                                    <p className="text-sm text-maroon-200">Welcome back,</p>
                                    <p className="font-medium">{user?.email}</p>
                                </div>
                                <Button
                                    onClick={handleLogout}
                                    variant="ghost"
                                    size="sm"
                                    className="text-maroon-200 hover:text-white hover:bg-maroon-700"
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="container mx-auto px-4 py-8">
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <Card className="border-beige-200 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                            onClick={() => window.location.href = '/admin/alumni'}>
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
                            onClick={() => window.location.href = '/admin/surveys'}>
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
                            onClick={() => window.location.href = '/admin/analytics'}>
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
                                        onClick={() => window.location.href = '/admin/activity-log'}
                                    >
                                        View Full Activity Log
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </>
    );
}