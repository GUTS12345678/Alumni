import React, { useEffect, useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Building,
    FileText,
    Settings,
    CheckCircle,
    Clock,
    Briefcase,
    Megaphone,
    Bell,
    ArrowRight,
    ExternalLink
} from 'lucide-react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { PageProps as InertiaPageProps } from '@inertiajs/core';

interface PageProps extends InertiaPageProps {
    auth: {
        user: User;
    };
}

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

interface JobPosting {
    id: number;
    title: string;
    company_name: string;
    company_logo?: string;
    location?: string;
    employment_type?: string;
    salary_range?: string;
    created_at: string;
}

interface Announcement {
    id: number;
    title: string;
    content: string;
    priority?: string;
    image_path?: string;
    created_at: string;
}

export default function AlumniDashboard() {
    const { auth } = usePage<PageProps>().props;
    const [profile, setProfile] = useState<AlumniProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [recentJobs, setRecentJobs] = useState<JobPosting[]>([]);
    const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);

    useEffect(() => {
        console.log('Alumni Dashboard - Auth state:', auth);
        fetchProfile();
    }, []);

    // Fetch recent jobs for alumni
    useEffect(() => {
        const fetchRecentJobs = async () => {
            try {
                const response = await fetch('/api/v1/public/jobs?limit=5', {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setRecentJobs(data.data || []);
                }
            } catch (err) {
                console.error('Failed to fetch jobs:', err);
            }
        };
        fetchRecentJobs();
    }, []);

    // Fetch recent announcements for alumni
    useEffect(() => {
        const fetchRecentAnnouncements = async () => {
            try {
                const response = await fetch('/api/v1/public/announcements?limit=5', {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setRecentAnnouncements(data.data || []);
                }
            } catch (err) {
                console.error('Failed to fetch announcements:', err);
            }
        };
        fetchRecentAnnouncements();
    }, []);

    const fetchProfile = async () => {
        try {
            // First, get CSRF cookie for SPA authentication
            await fetch('/sanctum/csrf-cookie', {
                credentials: 'include',
            });

            // Now make the authenticated request
            const response = await fetch('/api/v1/alumni/profile', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });

            if (!response.ok) {
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
            <div className="min-h-screen bg-gradient-to-br from-beige-50 to-beige-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 border-4 border-maroon-600 dark:border-maroon-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-maroon-800 dark:text-maroon-200 font-medium">Loading your profile...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-beige-50 to-beige-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600 dark:text-red-400">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                        <Button onClick={() => window.location.reload()} className="w-full">
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <AlumniBaseLayout title="Alumni Dashboard">
            {/* Welcome Banner */}
            <div className="mb-6 md:mb-8">
                <Card className="border-beige-200 dark:border-gray-700 shadow-lg bg-gradient-to-r from-maroon-50 to-beige-50 dark:from-maroon-950/30 dark:to-gray-800">
                    <CardContent className="p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-maroon-800 dark:text-maroon-200 mb-2">
                                    Welcome, {profile?.first_name} {profile?.last_name}!
                                </h2>
                                <p className="text-sm md:text-base text-maroon-600 dark:text-maroon-400">
                                    Thank you for being part of our alumni community. Keep your profile updated to help us maintain connections.
                                </p>
                            </div>
                            <div className="flex items-center flex-shrink-0">
                                {profile?.survey_completed ? (
                                    <Badge className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700 px-3 py-1 text-xs md:text-sm">
                                        <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                        Survey Complete
                                    </Badge>
                                ) : (
                                    <Badge className="bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700 px-3 py-1 text-xs md:text-sm">
                                        <Clock className="h-3 w-3 md:h-4 md:w-4 mr-1" />
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
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl text-maroon-800 dark:text-maroon-200 flex items-center">
                                <User className="h-6 w-6 mr-3 text-maroon-600 dark:text-maroon-400" />
                                Your Profile
                            </CardTitle>
                            <CardDescription className="text-maroon-600 dark:text-maroon-400">
                                Your personal information and career details
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Personal Information */}
                            <div>
                                <h3 className="font-semibold text-maroon-800 dark:text-maroon-200 mb-3">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-3">
                                        <User className="h-5 w-5 text-maroon-600 dark:text-maroon-400" />
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Full Name</label>
                                            <p className="text-maroon-800 dark:text-maroon-200">{profile?.first_name} {profile?.last_name}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <Mail className="h-5 w-5 text-maroon-600 dark:text-maroon-400" />
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                                            <p className="text-maroon-800 dark:text-maroon-200">{profile?.email}</p>
                                        </div>
                                    </div>

                                    {profile?.phone && (
                                        <div className="flex items-center space-x-3">
                                            <Phone className="h-5 w-5 text-maroon-600 dark:text-maroon-400" />
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
                                                <p className="text-maroon-800 dark:text-maroon-200">{profile.phone}</p>
                                            </div>
                                        </div>
                                    )}

                                    {profile?.address && (
                                        <div className="flex items-center space-x-3">
                                            <MapPin className="h-5 w-5 text-maroon-600 dark:text-maroon-400" />
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Address</label>
                                                <p className="text-maroon-800 dark:text-maroon-200">{profile.address}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Academic Information */}
                            <div>
                                <h3 className="font-semibold text-maroon-800 dark:text-maroon-200 mb-3">Academic Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {profile?.course && (
                                        <div className="flex items-center space-x-3">
                                            <User className="h-5 w-5 text-maroon-600 dark:text-maroon-400" />
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Course</label>
                                                <p className="text-maroon-800 dark:text-maroon-200">{profile.course}</p>
                                            </div>
                                        </div>
                                    )}

                                    {profile?.graduation_year && (
                                        <div className="flex items-center space-x-3">
                                            <Calendar className="h-5 w-5 text-maroon-600 dark:text-maroon-400" />
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Graduation Year</label>
                                                <p className="text-maroon-800 dark:text-maroon-200">{profile.graduation_year}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Career Information */}
                            <div>
                                <h3 className="font-semibold text-maroon-800 dark:text-maroon-200 mb-3">Career Information</h3>
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
                                            <FileText className="h-5 w-5 text-maroon-600 dark:text-maroon-400" />
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Position</label>
                                                <p className="text-maroon-800 dark:text-maroon-200">{profile.current_position}</p>
                                            </div>
                                        </div>
                                    )}

                                    {profile?.current_company && (
                                        <div className="flex items-center space-x-3">
                                            <Building className="h-5 w-5 text-maroon-600 dark:text-maroon-400" />
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Company</label>
                                                <p className="text-maroon-800 dark:text-maroon-200">{profile.current_company}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-beige-200 dark:border-gray-700">
                                <Button
                                    className="bg-maroon-700 hover:bg-maroon-800 dark:bg-maroon-600 dark:hover:bg-maroon-700 text-white"
                                    onClick={() => router.visit('/alumni/profile/edit')}
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
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl text-maroon-800 dark:text-maroon-200">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button
                                className="w-full bg-maroon-700 hover:bg-maroon-800 dark:bg-maroon-600 dark:hover:bg-maroon-700 text-white justify-start"
                                onClick={() => router.visit('/alumni/surveys')}
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                View Available Surveys
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full border-maroon-300 dark:border-maroon-600 text-maroon-700 dark:text-maroon-300 hover:bg-maroon-50 dark:hover:bg-maroon-900/30 justify-start"
                                onClick={() => router.visit('/alumni/profile/edit')}
                            >
                                <Settings className="h-4 w-4 mr-2" />
                                Edit Profile
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full border-maroon-300 dark:border-maroon-600 text-maroon-700 dark:text-maroon-300 hover:bg-maroon-50 dark:hover:bg-maroon-900/30 justify-start"
                                onClick={() => router.visit('/alumni/help')}
                            >
                                <User className="h-4 w-4 mr-2" />
                                Help & Support
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Account Status */}
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl text-maroon-800 dark:text-maroon-200">Account Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Profile Completion</span>
                                    <Badge className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700">
                                        Complete
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Survey Status</span>
                                    {profile?.survey_completed ? (
                                        <Badge className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700">
                                            Completed
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700">
                                            Pending
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Member Since</span>
                                    <span className="text-sm text-maroon-800 dark:text-maroon-200">
                                        {profile?.created_at ? new Date(profile.created_at).getFullYear() : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Jobs & Announcements Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                {/* Recent Job Postings */}
                <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                                    <Briefcase className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl text-maroon-800 dark:text-maroon-200">Job Opportunities</CardTitle>
                                    <CardDescription className="text-xs text-gray-500 dark:text-gray-400">Latest openings for alumni</CardDescription>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                onClick={() => router.visit('/alumni/job-board')}
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
                                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer border border-gray-100 dark:border-gray-700"
                                    onClick={() => router.visit('/alumni/job-board')}
                                >
                                    <div className="flex items-start gap-3">
                                        {job.company_logo ? (
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white dark:bg-gray-700 shadow-sm flex-shrink-0">
                                                <img
                                                    src={job.company_logo.startsWith('/') ? job.company_logo : `/storage/${job.company_logo}`}
                                                    alt={job.company_name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                                <div className="hidden w-full h-full flex items-center justify-center">
                                                    <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
                                                <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-1">{job.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{job.company_name}</p>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                {job.location && (
                                                    <span className="flex items-center text-xs text-gray-400 dark:text-gray-500">
                                                        <MapPin className="h-3 w-3 mr-1" />
                                                        {job.location}
                                                    </span>
                                                )}
                                                {job.employment_type && (
                                                    <Badge variant="outline" className="text-xs py-0 dark:border-gray-600">
                                                        {job.employment_type}
                                                    </Badge>
                                                )}
                                                {job.salary_range && (
                                                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                                        {job.salary_range}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <Briefcase className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                <p className="text-sm">No job postings available</p>
                            </div>
                        )}
                        <Button
                            onClick={() => router.visit('/alumni/job-board')}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                        >
                            <Briefcase className="h-4 w-4 mr-2" />
                            Browse All Jobs
                        </Button>
                    </CardContent>
                </Card>

                {/* Recent Announcements */}
                <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                                    <Megaphone className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl text-maroon-800 dark:text-maroon-200">Announcements</CardTitle>
                                    <CardDescription className="text-xs text-gray-500 dark:text-gray-400">News & updates</CardDescription>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                                onClick={() => router.visit('/alumni/announcements')}
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
                                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-amber-50/50 dark:hover:bg-amber-900/20 transition-colors cursor-pointer border border-gray-100 dark:border-gray-700"
                                    onClick={() => router.visit('/alumni/announcements')}
                                >
                                    <div className="flex items-start gap-3">
                                        {announcement.image_path ? (
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white dark:bg-gray-700 shadow-sm flex-shrink-0">
                                                <img
                                                    src={announcement.image_path.startsWith('/') ? announcement.image_path : `/storage/${announcement.image_path}`}
                                                    alt={announcement.title}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                                <div className="hidden w-full h-full flex items-center justify-center">
                                                    <Megaphone className="h-5 w-5 text-amber-600" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`w-12 h-12 rounded-lg shadow-sm flex items-center justify-center flex-shrink-0 ${announcement.priority === 'urgent'
                                                    ? 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/50'
                                                    : announcement.priority === 'high'
                                                        ? 'bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/50 dark:to-orange-800/50'
                                                        : 'bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50'
                                                }`}>
                                                <Bell className={`h-5 w-5 ${announcement.priority === 'urgent' ? 'text-red-500' :
                                                    announcement.priority === 'high' ? 'text-orange-500' :
                                                        'text-amber-600 dark:text-amber-400'
                                                    }`} />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-1">{announcement.title}</p>
                                                {announcement.priority === 'urgent' && (
                                                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 text-xs py-0">Urgent</Badge>
                                                )}
                                                {announcement.priority === 'high' && (
                                                    <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 text-xs py-0">Important</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                                                {announcement.content?.replace(/<[^>]*>/g, '').substring(0, 80)}...
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                {new Date(announcement.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <Megaphone className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                <p className="text-sm">No announcements yet</p>
                            </div>
                        )}
                        <Button
                            onClick={() => router.visit('/alumni/announcements')}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                        >
                            <Megaphone className="h-4 w-4 mr-2" />
                            View All Announcements
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </AlumniBaseLayout>
    );
}