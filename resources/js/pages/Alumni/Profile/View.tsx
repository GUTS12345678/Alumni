import React, { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    GraduationCap,
    Briefcase,
    Building,
    Award,
    Target,
    Edit,
    CheckCircle,
    AlertCircle,
    Heart,
    Users,
    TrendingUp
} from 'lucide-react';

interface AlumniProfile {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    student_id?: string;
    birth_date?: string;
    gender?: string;
    phone?: string;
    alternate_email?: string;
    current_address?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    country?: string;
    batch_id?: number;
    batch?: { id: number; name: string; year: number };
    degree_program?: string;
    major?: string;
    minor?: string;
    gpa?: number;
    graduation_year?: number;
    graduation_date?: string;
    employment_status?: string;
    current_job_title?: string;
    current_employer?: string;
    company_industry?: string;
    company_size?: string;
    current_salary?: number;
    salary_currency?: string;
    job_start_date?: string;
    job_description?: string;
    job_related_to_degree?: boolean;
    job_mismatch_reason?: string;
    job_satisfaction?: number;
    unemployment_reason?: string;
    skills?: string[];
    certifications?: string[];
    career_goals?: string;
    feedback_to_institution?: string;
    willing_to_mentor?: boolean;
    willing_to_hire_alumni?: boolean;
    profile_completed?: boolean;
    profile_completed_at?: string;
    completion_percentage?: number;
    created_at?: string;
    survey_completed?: boolean;
}

export default function ProfileView() {
    const [profile, setProfile] = useState<AlumniProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await fetch('/api/v1/alumni/profile', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch profile');
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

    const getEmploymentStatusBadge = (status?: string) => {
        const statusMap: Record<string, { label: string; className: string }> = {
            employed_full_time: { label: 'Employed Full-Time', className: 'bg-green-100 text-green-800 border-green-200' },
            employed_part_time: { label: 'Employed Part-Time', className: 'bg-blue-100 text-blue-800 border-blue-200' },
            self_employed: { label: 'Self-Employed', className: 'bg-purple-100 text-purple-800 border-purple-200' },
            unemployed_looking: { label: 'Unemployed (Looking)', className: 'bg-orange-100 text-orange-800 border-orange-200' },
            unemployed_not_looking: { label: 'Unemployed (Not Looking)', className: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700' },
            further_education: { label: 'Further Education', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
            other: { label: 'Other', className: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700' },
        };

        const statusInfo = statusMap[status || ''] || { label: 'Not Specified', className: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700' };
        return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
    };

    if (loading) {
        return (
            <AlumniBaseLayout title="My Profile">
                <div className="flex items-center justify-center py-12">
                    <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 border-4 border-maroon-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-maroon-800 dark:text-gray-200 font-medium">Loading profile...</span>
                    </div>
                </div>
            </AlumniBaseLayout>
        );
    }

    if (error || !profile) {
        return (
            <AlumniBaseLayout title="My Profile">
                <Card className="border-red-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-2 text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            <p>{error || 'Profile not found'}</p>
                        </div>
                    </CardContent>
                </Card>
            </AlumniBaseLayout>
        );
    }

    return (
        <AlumniBaseLayout title="My Profile">
            <Head title="My Profile" />

            {/* Header with Edit Button */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-maroon-800 dark:text-gray-200">My Profile</h1>
                    <p className="text-maroon-600 dark:text-gray-400 mt-2">View and manage your personal information</p>
                </div>
                <Button
                    onClick={() => router.visit('/alumni/profile/edit')}
                    className="bg-maroon-700 hover:bg-maroon-800 text-white"
                >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                </Button>
            </div>

            {/* Profile Completion Card */}
            <Card className="mb-6 border-beige-200 dark:border-gray-700 shadow-lg">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-maroon-800 dark:text-gray-200">Profile Completion</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Complete your profile to get the most out of the alumni network</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-maroon-700 dark:text-gray-300">{profile.completion_percentage || 0}%</div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Complete</p>
                        </div>
                    </div>
                    <Progress value={profile.completion_percentage || 0} className="h-3" />
                    {(profile.completion_percentage || 0) < 100 && (
                        <div className="mt-4 flex items-start space-x-2 text-sm text-orange-600">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <p>Complete all sections to increase your visibility in the alumni network</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Left Column (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Personal Information */}
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center text-maroon-800 dark:text-gray-200">
                                <User className="h-5 w-5 mr-2" />
                                Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InfoField icon={User} label="Full Name" value={`${profile.first_name} ${profile.middle_name || ''} ${profile.last_name}`.trim()} />
                            <InfoField icon={User} label="Student ID" value={profile.student_id} />
                            <InfoField icon={Calendar} label="Birth Date" value={profile.birth_date ? new Date(profile.birth_date).toLocaleDateString() : undefined} />
                            <InfoField icon={User} label="Gender" value={profile.gender} />
                            <InfoField icon={Mail} label="Email" value={profile.email} />
                            <InfoField icon={Mail} label="Alternate Email" value={profile.alternate_email} />
                            <InfoField icon={Phone} label="Phone" value={profile.phone} />
                            <InfoField icon={MapPin} label="Address" value={profile.current_address} className="md:col-span-2" />
                            <InfoField icon={MapPin} label="City" value={profile.city} />
                            <InfoField icon={MapPin} label="State/Province" value={profile.state_province} />
                            <InfoField icon={MapPin} label="Postal Code" value={profile.postal_code} />
                            <InfoField icon={MapPin} label="Country" value={profile.country} />
                        </CardContent>
                    </Card>

                    {/* Academic Information */}
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center text-maroon-800 dark:text-gray-200">
                                <GraduationCap className="h-5 w-5 mr-2" />
                                Academic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InfoField icon={GraduationCap} label="Degree Program" value={profile.degree_program} />
                            <InfoField icon={GraduationCap} label="Major" value={profile.major} />
                            <InfoField icon={GraduationCap} label="Minor" value={profile.minor} />
                            <InfoField icon={Award} label="GPA" value={profile.gpa?.toString()} />
                            <InfoField icon={Calendar} label="Graduation Year" value={profile.graduation_year?.toString()} />
                            <InfoField icon={Calendar} label="Graduation Date" value={profile.graduation_date ? new Date(profile.graduation_date).toLocaleDateString() : undefined} />
                            {profile.batch && (
                                <InfoField icon={Users} label="Batch" value={profile.batch.name} className="md:col-span-2" />
                            )}
                        </CardContent>
                    </Card>

                    {/* Employment Information */}
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center text-maroon-800 dark:text-gray-200">
                                <Briefcase className="h-5 w-5 mr-2" />
                                Employment Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Employment Status</label>
                                    <div className="mt-1">{getEmploymentStatusBadge(profile.employment_status)}</div>
                                </div>
                                <InfoField icon={Briefcase} label="Job Title" value={profile.current_job_title} />
                                <InfoField icon={Building} label="Employer" value={profile.current_employer} />
                                <InfoField icon={Building} label="Industry" value={profile.company_industry} />
                                <InfoField icon={Building} label="Company Size" value={profile.company_size} />
                                <InfoField icon={Calendar} label="Job Start Date" value={profile.job_start_date ? new Date(profile.job_start_date).toLocaleDateString() : undefined} />
                                {profile.job_related_to_degree !== undefined && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Job Related to Degree</label>
                                        <div className="mt-1">
                                            <Badge className={profile.job_related_to_degree ? 'bg-green-100 text-green-800' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'}>
                                                {profile.job_related_to_degree ? 'Yes' : 'No'}
                                            </Badge>
                                        </div>
                                    </div>
                                )}
                                {profile.job_satisfaction && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Job Satisfaction</label>
                                        <div className="mt-1 flex items-center">
                                            {[...Array(5)].map((_, i) => (
                                                <Heart
                                                    key={i}
                                                    className={`h-5 w-5 ${i < profile.job_satisfaction! ? 'fill-red-500 text-red-500' : 'text-gray-300'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {profile.job_description && (
                                <div className="pt-4 border-t dark:border-gray-700">
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Job Description</label>
                                    <p className="mt-1 text-maroon-800 dark:text-gray-200">{profile.job_description}</p>
                                </div>
                            )}
                            {profile.unemployment_reason && (
                                <div className="pt-4 border-t dark:border-gray-700">
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Unemployment Reason</label>
                                    <p className="mt-1 text-maroon-800 dark:text-gray-200">{profile.unemployment_reason}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Skills & Certifications */}
                    {(profile.skills?.length || profile.certifications?.length) && (
                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center text-maroon-800 dark:text-gray-200">
                                    <Award className="h-5 w-5 mr-2" />
                                    Skills & Certifications
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {profile.skills && profile.skills.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">Skills</label>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.skills.map((skill, index) => (
                                                <Badge key={index} className="bg-maroon-100 dark:bg-maroon-800/30 text-maroon-800 dark:text-gray-200">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {profile.certifications && profile.certifications.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">Certifications</label>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.certifications.map((cert, index) => (
                                                <Badge key={index} className="bg-blue-100 text-blue-800">
                                                    <Award className="h-3 w-3 mr-1" />
                                                    {cert}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Career Goals & Feedback */}
                    {(profile.career_goals || profile.feedback_to_institution) && (
                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center text-maroon-800 dark:text-gray-200">
                                    <Target className="h-5 w-5 mr-2" />
                                    Career Goals & Feedback
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {profile.career_goals && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Career Goals</label>
                                        <p className="mt-1 text-maroon-800 dark:text-gray-200">{profile.career_goals}</p>
                                    </div>
                                )}
                                {profile.feedback_to_institution && (
                                    <div className="pt-4 border-t dark:border-gray-700">
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Feedback to Institution</label>
                                        <p className="mt-1 text-maroon-800 dark:text-gray-200">{profile.feedback_to_institution}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar - Right Column (1/3) */}
                <div className="space-y-6">
                    {/* Networking Preferences */}
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-maroon-800 dark:text-gray-200 text-lg">Networking</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Willing to Mentor</span>
                                {profile.willing_to_mentor ? (
                                    <Badge className="bg-green-100 text-green-800">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Yes
                                    </Badge>
                                ) : (
                                    <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">No</Badge>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Willing to Hire Alumni</span>
                                {profile.willing_to_hire_alumni ? (
                                    <Badge className="bg-green-100 text-green-800">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Yes
                                    </Badge>
                                ) : (
                                    <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">No</Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Profile Status */}
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-maroon-800 dark:text-gray-200 text-lg">Profile Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Profile Status</span>
                                {profile.profile_completed ? (
                                    <Badge className="bg-green-100 text-green-800">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Complete
                                    </Badge>
                                ) : (
                                    <Badge className="bg-orange-100 text-orange-800">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Incomplete
                                    </Badge>
                                )}
                            </div>
                            {profile.profile_completed_at && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Completed On</span>
                                    <span className="text-sm text-maroon-800 dark:text-gray-200">
                                        {new Date(profile.profile_completed_at).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Member Since</span>
                                <span className="text-sm text-maroon-800 dark:text-gray-200">
                                    {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-maroon-800 dark:text-gray-200 text-lg">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                onClick={() => router.visit('/alumni/profile/edit')}
                                className="w-full bg-maroon-700 hover:bg-maroon-800"
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Profile
                            </Button>
                            <Button
                                onClick={() => router.visit('/alumni/dashboard')}
                                variant="outline"
                                className="w-full border-maroon-300 dark:border-gray-600 text-maroon-700 dark:text-gray-300 hover:bg-maroon-50 dark:hover:bg-maroon-800/30"
                            >
                                <TrendingUp className="h-4 w-4 mr-2" />
                                View Dashboard
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AlumniBaseLayout>
    );
}

// Helper component for info fields
function InfoField({ icon: Icon, label, value, className = '' }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value?: string;
    className?: string;
}) {
    if (!value) return null;

    return (
        <div className={`flex items-start space-x-3 ${className}`}>
            <Icon className="h-5 w-5 text-maroon-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</label>
                <p className="text-maroon-800 dark:text-gray-200 break-words">{value}</p>
            </div>
        </div>
    );
}
