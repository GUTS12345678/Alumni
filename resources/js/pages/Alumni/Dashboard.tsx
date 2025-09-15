import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    GraduationCap,
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Building,
    LogOut,
    FileText,
    Settings,
    CheckCircle,
    Clock
} from 'lucide-react';

interface AlumniProfile {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    address?: string;
    graduation_year?: number;
    course?: string;
    current_position?: string;
    current_company?: string;
    employment_status?: string;
    created_at: string;
    survey_completed: boolean;
}

interface User {
    id: number;
    email: string;
    role: string;
    status: string;
}

export default function AlumniDashboard() {
    const [profile, setProfile] = useState<AlumniProfile | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Get user info from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        // Check if user is alumni
        const userData = storedUser ? JSON.parse(storedUser) : null;
        if (!userData || userData.role !== 'alumni') {
            window.location.href = '/login';
            return;
        }

        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const response = await fetch('/api/v1/alumni/profile', {
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
                throw new Error('Failed to fetch profile data');
            }

            const data = await response.json();
            if (data.success) {
                setProfile(data.data);
            }
        } catch (err) {
            console.error('Profile fetch error:', err);
            setError('Failed to load profile data');
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

    const getEmploymentStatusColor = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'employed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'unemployed':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'self-employed':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'student':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-beige-50 to-beige-100 flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 border-4 border-maroon-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-maroon-800 font-medium">Loading your profile...</span>
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
            <Head title="Alumni Dashboard - Alumni Tracer System" />

            <div className="min-h-screen bg-gradient-to-br from-beige-50 to-beige-100">
                {/* Header */}
                <header className="bg-maroon-800 text-white shadow-lg">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <GraduationCap className="h-8 w-8" />
                                <div>
                                    <h1 className="text-2xl font-bold">Alumni Tracer System</h1>
                                    <p className="text-maroon-200">Welcome back, {profile?.first_name}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="text-right">
                                    <p className="text-sm text-maroon-200">Logged in as</p>
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
                    {/* Welcome Banner */}
                    <div className="mb-8">
                        <Card className="border-beige-200 shadow-lg bg-gradient-to-r from-maroon-50 to-beige-50">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-maroon-800 mb-2">
                                            Welcome, {profile?.first_name} {profile?.last_name}!
                                        </h2>
                                        <p className="text-maroon-600">
                                            Thank you for being part of our alumni community. Keep your profile updated to help us maintain connections.
                                        </p>
                                    </div>
                                    <div className="flex items-center">
                                        {profile?.survey_completed ? (
                                            <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                Survey Complete
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-orange-100 text-orange-800 border-orange-200 px-3 py-1">
                                                <Clock className="h-4 w-4 mr-1" />
                                                Survey Pending
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Profile Information */}
                        <div className="lg:col-span-2">
                            <Card className="border-beige-200 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-xl text-maroon-800 flex items-center">
                                        <User className="h-6 w-6 mr-3 text-maroon-600" />
                                        Your Profile
                                    </CardTitle>
                                    <CardDescription className="text-maroon-600">
                                        Your personal information and career details
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Personal Information */}
                                    <div>
                                        <h3 className="font-semibold text-maroon-800 mb-3">Personal Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center space-x-3">
                                                <User className="h-5 w-5 text-maroon-600" />
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                                                    <p className="text-maroon-800">{profile?.first_name} {profile?.last_name}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <Mail className="h-5 w-5 text-maroon-600" />
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600">Email</label>
                                                    <p className="text-maroon-800">{profile?.email}</p>
                                                </div>
                                            </div>

                                            {profile?.phone && (
                                                <div className="flex items-center space-x-3">
                                                    <Phone className="h-5 w-5 text-maroon-600" />
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Phone</label>
                                                        <p className="text-maroon-800">{profile.phone}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {profile?.address && (
                                                <div className="flex items-center space-x-3">
                                                    <MapPin className="h-5 w-5 text-maroon-600" />
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Address</label>
                                                        <p className="text-maroon-800">{profile.address}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Academic Information */}
                                    <div>
                                        <h3 className="font-semibold text-maroon-800 mb-3">Academic Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {profile?.course && (
                                                <div className="flex items-center space-x-3">
                                                    <GraduationCap className="h-5 w-5 text-maroon-600" />
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Course</label>
                                                        <p className="text-maroon-800">{profile.course}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {profile?.graduation_year && (
                                                <div className="flex items-center space-x-3">
                                                    <Calendar className="h-5 w-5 text-maroon-600" />
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Graduation Year</label>
                                                        <p className="text-maroon-800">{profile.graduation_year}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Career Information */}
                                    <div>
                                        <h3 className="font-semibold text-maroon-800 mb-3">Career Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {profile?.employment_status && (
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-5 w-5 flex items-center justify-center">
                                                        <Badge className={getEmploymentStatusColor(profile.employment_status)}>
                                                            {profile.employment_status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            )}

                                            {profile?.current_position && (
                                                <div className="flex items-center space-x-3">
                                                    <FileText className="h-5 w-5 text-maroon-600" />
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Current Position</label>
                                                        <p className="text-maroon-800">{profile.current_position}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {profile?.current_company && (
                                                <div className="flex items-center space-x-3">
                                                    <Building className="h-5 w-5 text-maroon-600" />
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Current Company</label>
                                                        <p className="text-maroon-800">{profile.current_company}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-beige-200">
                                        <Button
                                            className="bg-maroon-700 hover:bg-maroon-800 text-white"
                                            onClick={() => window.location.href = '/alumni/profile/edit'}
                                        >
                                            <Settings className="h-4 w-4 mr-2" />
                                            Update Profile
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-6">
                            <Card className="border-beige-200 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-xl text-maroon-800">Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Button
                                        className="w-full bg-maroon-700 hover:bg-maroon-800 text-white justify-start"
                                        onClick={() => window.location.href = '/alumni/surveys'}
                                    >
                                        <FileText className="h-4 w-4 mr-2" />
                                        View Available Surveys
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="w-full border-maroon-300 text-maroon-700 hover:bg-maroon-50 justify-start"
                                        onClick={() => window.location.href = '/alumni/profile/edit'}
                                    >
                                        <Settings className="h-4 w-4 mr-2" />
                                        Edit Profile
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="w-full border-maroon-300 text-maroon-700 hover:bg-maroon-50 justify-start"
                                        onClick={() => window.location.href = '/alumni/help'}
                                    >
                                        <User className="h-4 w-4 mr-2" />
                                        Help & Support
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Account Status */}
                            <Card className="border-beige-200 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-xl text-maroon-800">Account Status</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Profile Completion</span>
                                            <Badge className="bg-green-100 text-green-800 border-green-200">
                                                Complete
                                            </Badge>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Survey Status</span>
                                            {profile?.survey_completed ? (
                                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                                    Completed
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                                                    Pending
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Member Since</span>
                                            <span className="text-sm text-maroon-800">
                                                {profile?.created_at ? new Date(profile.created_at).getFullYear() : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}