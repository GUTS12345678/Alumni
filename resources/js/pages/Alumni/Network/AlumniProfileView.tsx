import React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Calendar,
    GraduationCap,
    Briefcase,
    Building,
    Award,
    Users,
    Globe,
    Star,
    DollarSign,
    Clock,
    Sparkles,
    MessageCircle,
    UserPlus,
    UserCheck,
    UserX,
    Heart,
    Target,
} from 'lucide-react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';

interface AlumniProfile {
    id: number;
    first_name: string;
    last_name: string;
    middle_name?: string;
    maiden_name?: string;
    suffix?: string;
    student_id?: string;
    birth_date?: string;
    age?: number;
    gender?: string;
    place_of_birth?: string;
    civil_status?: string;
    phone?: string;
    mobile_no?: string;
    alternate_email?: string;
    current_address?: string;
    city?: string;
    state_province?: string;
    country?: string;
    batch_id?: number;
    batch?: { id: number; name: string; year: number };
    degree_program?: string;
    major?: string;
    minor?: string;
    graduation_year?: number;
    graduation_date?: string;
    enrollment_year?: number;
    honors_awards?: string;
    employment_status?: string;
    presently_employed?: string;
    employment_location_type?: string;
    current_job_title?: string;
    current_employer?: string;
    company_address?: string;
    company_industry?: string;
    major_line_of_business?: string;
    salary_range?: string;
    average_monthly_income?: string;
    career_field?: string;
    job_level_position?: string;
    date_hired?: string;
    years_of_service?: number;
    job_aligned_to_course?: string;
    job_satisfaction?: number;
    skills?: string[];
    certifications?: string[];
    achievements?: string;
    about_me?: string;
    career_goals?: string;
    willing_to_mentor?: boolean;
    willing_to_hire_alumni?: boolean;
    profile_picture_path?: string;
}

interface AlumniUser {
    id: number;
    name: string;
    email: string;
    profile_picture_path?: string;
    alumni_profile?: AlumniProfile;
}

interface Props {
    alumniUser: AlumniUser;
    profile: AlumniProfile | null;
    connectionStatus: string | null;
    connectionId: number | null;
    mutualConnections: number;
    totalConnections: number;
}

interface PageProps extends InertiaPageProps {
    flash?: { success?: string; error?: string };
    [key: string]: unknown;
}

const formatEmploymentStatus = (status?: string): { label: string; className: string } => {
    const map: Record<string, { label: string; className: string }> = {
        employed_full_time: { label: 'Employed (Full-Time)', className: 'bg-green-100 text-green-800 border-green-200' },
        employed_part_time: { label: 'Employed (Part-Time)', className: 'bg-blue-100 text-blue-800 border-blue-200' },
        self_employed: { label: 'Self-Employed', className: 'bg-purple-100 text-purple-800 border-purple-200' },
        unemployed_seeking: { label: 'Unemployed (Seeking)', className: 'bg-orange-100 text-orange-800 border-orange-200' },
        unemployed_not_seeking: { label: 'Unemployed (Not Seeking)', className: 'bg-gray-100 text-gray-800 border-gray-200' },
        continuing_education: { label: 'Continuing Education', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    };
    return map[status || ''] || { label: status ? status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Not Specified', className: 'bg-gray-100 text-gray-800 border-gray-200' };
};

const formatCivilStatus = (s?: string) => {
    const map: Record<string, string> = { single: 'Single', married: 'Married', widowed: 'Widowed', separated: 'Separated', divorced: 'Divorced' };
    return map[s || ''] || s || '';
};

const formatLocationType = (s?: string) => {
    const map: Record<string, string> = { local: 'Local', abroad: 'Abroad/Overseas' };
    return map[s || ''] || s || '';
};

const formatSalaryRange = (s?: string) => {
    const map: Record<string, string> = {
        below_5000: 'Below ₱5,000', '5000_10000': '₱5,000 – ₱10,000', '10001_15000': '₱10,001 – ₱15,000',
        '15001_20000': '₱15,001 – ₱20,000', '20001_25000': '₱20,001 – ₱25,000', '25001_30000': '₱25,001 – ₱30,000',
        '30001_40000': '₱30,001 – ₱40,000', '40001_50000': '₱40,001 – ₱50,000', above_50000: 'Above ₱50,000',
    };
    return map[s || ''] || s || '';
};

const formatCareerField = (s?: string) => {
    const map: Record<string, string> = {
        it_technology: 'IT / Technology', engineering: 'Engineering', healthcare: 'Healthcare / Medical',
        education: 'Education / Training', business: 'Business / Management', finance: 'Finance / Accounting',
        government: 'Government / Public Service', agriculture: 'Agriculture / Forestry',
        arts_media: 'Arts / Media / Entertainment', manufacturing: 'Manufacturing / Production',
        hospitality: 'Hospitality / Tourism', other: 'Other',
    };
    return map[s || ''] || s || '';
};

export default function AlumniProfileView({ alumniUser, profile, connectionStatus, connectionId, mutualConnections, totalConnections }: Props) {
    const { flash } = usePage<PageProps>().props;
    const p = profile;
    const fullName = p ? `${p.first_name}${p.middle_name ? ' ' + p.middle_name : ''}${p.maiden_name ? ' (' + p.maiden_name + ')' : ''} ${p.last_name}${p.suffix ? ' ' + p.suffix : ''}` : alumniUser.name;
    const initials = p ? `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}` : alumniUser.name.slice(0, 2).toUpperCase();
    const empStatus = formatEmploymentStatus(p?.employment_status);

    const handleConnect = () => {
        router.post('/alumni/network/connect', { receiver_id: alumniUser.id }, { preserveScroll: true });
    };

    const handleAccept = () => {
        if (connectionId) {
            router.put(`/alumni/network/${connectionId}/accept`, {}, { preserveScroll: true });
        }
    };

    const handleReject = () => {
        if (connectionId) {
            router.put(`/alumni/network/${connectionId}/reject`, {}, { preserveScroll: true });
        }
    };

    const handleRemove = () => {
        if (connectionId && confirm('Are you sure you want to remove this connection?')) {
            router.delete(`/alumni/network/${connectionId}`, { preserveScroll: true });
        }
    };

    const handleMessage = async () => {
        try {
            const response = await fetch('/api/v1/messaging/conversations', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ type: 'direct', participant_ids: [alumniUser.id] }),
            });
            if (response.ok) {
                router.visit('/alumni/messages');
            } else {
                router.visit('/alumni/messages', { preserveState: false });
            }
        } catch {
            router.visit('/alumni/messages');
        }
    };

    const renderConnectionActions = () => {
        switch (connectionStatus) {
            case 'accepted':
                return (
                    <div className="flex gap-3">
                        <Button onClick={handleMessage} className="bg-maroon-700 hover:bg-maroon-800 text-white">
                            <MessageCircle className="h-4 w-4 mr-2" /> Message
                        </Button>
                        <Button variant="outline" onClick={handleRemove} className="border-red-300 text-red-700 hover:bg-red-50">
                            <UserX className="h-4 w-4 mr-2" /> Remove
                        </Button>
                    </div>
                );
            case 'pending':
                return (
                    <Button disabled variant="outline" className="border-yellow-400 text-yellow-700">
                        <Clock className="h-4 w-4 mr-2" /> Request Sent
                    </Button>
                );
            case 'received':
                return (
                    <div className="flex gap-3">
                        <Button onClick={handleAccept} className="bg-green-600 hover:bg-green-700 text-white">
                            <UserCheck className="h-4 w-4 mr-2" /> Accept Request
                        </Button>
                        <Button variant="outline" onClick={handleReject} className="border-red-300 text-red-700 hover:bg-red-50">
                            <UserX className="h-4 w-4 mr-2" /> Decline
                        </Button>
                    </div>
                );
            default:
                return (
                    <Button onClick={handleConnect} className="bg-maroon-700 hover:bg-maroon-800 text-white">
                        <UserPlus className="h-4 w-4 mr-2" /> Connect
                    </Button>
                );
        }
    };

    const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | number | null }) => {
        if (!value && value !== 0) return null;
        return (
            <div className="flex items-start gap-3 py-2">
                <Icon className="h-4 w-4 text-maroon-500 mt-0.5 flex-shrink-0" />
                <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block">{label}</span>
                    <span className="text-sm text-gray-900 dark:text-gray-100">{value}</span>
                </div>
            </div>
        );
    };

    return (
        <AlumniBaseLayout title={`${p?.first_name || ''} ${p?.last_name || ''}`}>
            <Head title={`${p?.first_name || ''} ${p?.last_name || ''} - Profile`} />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Back Button */}
                <Button variant="ghost" onClick={() => window.history.back()} className="text-maroon-700 hover:text-maroon-800 -ml-2">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">{flash.success}</div>
                )}

                {/* Profile Header Card */}
                <Card className="border-beige-200 dark:border-gray-700 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-maroon-700 to-maroon-900 h-32 relative" />
                    <CardContent className="relative px-6 pb-6">
                        <div className="flex flex-col sm:flex-row items-start gap-6 -mt-16">
                            <Avatar className="h-28 w-28 border-4 border-white dark:border-gray-900 shadow-lg">
                                <AvatarImage src={alumniUser.profile_picture_path ? `/api/v1/files/${alumniUser.profile_picture_path}` : undefined} />
                                <AvatarFallback className="bg-maroon-100 text-maroon-700 text-3xl font-bold">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 pt-2 sm:pt-12">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{fullName}</h1>
                                {p?.current_job_title && (
                                    <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                                        <Briefcase className="h-4 w-4" />
                                        {p.current_job_title}{p.current_employer ? ` at ${p.current_employer}` : ''}
                                    </p>
                                )}
                                {(p?.city || p?.country) && (
                                    <p className="text-gray-500 dark:text-gray-500 flex items-center gap-1 mt-1 text-sm">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {[p.city, p.state_province, p.country].filter(Boolean).join(', ')}
                                    </p>
                                )}
                                <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        <strong>{totalConnections}</strong> connection{totalConnections !== 1 ? 's' : ''}
                                    </span>
                                    {mutualConnections > 0 && (
                                        <span className="text-maroon-600 dark:text-maroon-400">
                                            {mutualConnections} mutual
                                        </span>
                                    )}
                                </div>
                                <div className="mt-4">
                                    {renderConnectionActions()}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* About Me */}
                {p?.about_me && (
                    <Card className="border-beige-200 dark:border-gray-700 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg text-maroon-800 dark:text-maroon-200 flex items-center gap-2">
                                <Sparkles className="h-5 w-5" /> About
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{p.about_me}</p>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <Card className="border-beige-200 dark:border-gray-700 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg text-maroon-800 dark:text-maroon-200 flex items-center gap-2">
                                <Heart className="h-5 w-5" /> Personal Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-0 divide-y divide-beige-100 dark:divide-gray-700">
                            <InfoRow icon={Calendar} label="Age" value={p?.age} />
                            <InfoRow icon={MapPin} label="Place of Birth" value={p?.place_of_birth} />
                            <InfoRow icon={Heart} label="Civil Status" value={formatCivilStatus(p?.civil_status)} />
                            <InfoRow icon={Phone} label="Mobile" value={p?.mobile_no} />
                            <InfoRow icon={Mail} label="Email" value={alumniUser.email} />
                            {p?.current_address && <InfoRow icon={MapPin} label="Address" value={p.current_address} />}
                        </CardContent>
                    </Card>

                    {/* Academic Background */}
                    <Card className="border-beige-200 dark:border-gray-700 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg text-maroon-800 dark:text-maroon-200 flex items-center gap-2">
                                <GraduationCap className="h-5 w-5" /> Academic Background
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-0 divide-y divide-beige-100 dark:divide-gray-700">
                            <InfoRow icon={GraduationCap} label="Degree Program" value={p?.degree_program} />
                            <InfoRow icon={GraduationCap} label="Major" value={p?.major} />
                            {p?.minor && <InfoRow icon={GraduationCap} label="Minor" value={p.minor} />}
                            <InfoRow icon={Calendar} label="Class of" value={p?.graduation_year} />
                            {p?.enrollment_year && <InfoRow icon={Calendar} label="Enrolled" value={p.enrollment_year} />}
                            {p?.batch && <InfoRow icon={Users} label="Batch" value={p.batch.name} />}
                            {p?.honors_awards && <InfoRow icon={Award} label="Honors & Awards" value={p.honors_awards} />}
                        </CardContent>
                    </Card>
                </div>

                {/* Employment Section */}
                <Card className="border-beige-200 dark:border-gray-700 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-maroon-800 dark:text-maroon-200 flex items-center gap-2">
                            <Briefcase className="h-5 w-5" /> Employment
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3 mb-4">
                            <Badge variant="outline" className={empStatus.className}>{empStatus.label}</Badge>
                            {p?.presently_employed && (
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Presently Employed: <strong>{p.presently_employed === 'yes' ? 'Yes' : 'No'}</strong>
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 divide-y md:divide-y-0 divide-beige-100 dark:divide-gray-700">
                            <div className="space-y-0 divide-y divide-beige-100 dark:divide-gray-700">
                                <InfoRow icon={Briefcase} label="Position" value={p?.current_job_title} />
                                <InfoRow icon={Building} label="Employer" value={p?.current_employer} />
                                <InfoRow icon={MapPin} label="Company Address" value={p?.company_address} />
                                <InfoRow icon={Target} label="Career Field" value={formatCareerField(p?.career_field)} />
                                <InfoRow icon={Building} label="Line of Business" value={p?.major_line_of_business} />
                            </div>
                            <div className="space-y-0 divide-y divide-beige-100 dark:divide-gray-700">
                                <InfoRow icon={Star} label="Job Level" value={p?.job_level_position} />
                                <InfoRow icon={Globe} label="Work Location" value={formatLocationType(p?.employment_location_type)} />
                                <InfoRow icon={Calendar} label="Date Hired" value={p?.date_hired} />
                                <InfoRow icon={Clock} label="Years of Service" value={p?.years_of_service ? `${p.years_of_service} year(s)` : undefined} />
                                <InfoRow icon={DollarSign} label="Salary Range" value={formatSalaryRange(p?.salary_range)} />
                                <InfoRow icon={GraduationCap} label="Job Aligned to Course" value={p?.job_aligned_to_course === 'yes' ? 'Yes' : p?.job_aligned_to_course === 'no' ? 'No' : undefined} />
                            </div>
                        </div>
                        {p?.job_satisfaction && p.job_satisfaction > 0 && (
                            <div className="mt-4 pt-4 border-t border-beige-100 dark:border-gray-700">
                                <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Job Satisfaction:</span>
                                <span className="inline-flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Star key={i} className={`h-4 w-4 ${i <= p.job_satisfaction! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                    ))}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Achievements & Skills */}
                {(p?.achievements || (p?.skills && p.skills.length > 0) || (p?.certifications && p.certifications.length > 0) || p?.career_goals) && (
                    <Card className="border-beige-200 dark:border-gray-700 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg text-maroon-800 dark:text-maroon-200 flex items-center gap-2">
                                <Award className="h-5 w-5" /> Achievements & More
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {p?.achievements && (
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Achievements</p>
                                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">{p.achievements}</p>
                                </div>
                            )}
                            {p?.skills && p.skills.length > 0 && (
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Skills</p>
                                    <div className="flex flex-wrap gap-2">
                                        {p.skills.map((skill, i) => (
                                            <Badge key={i} variant="outline" className="text-xs">{skill}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {p?.certifications && p.certifications.length > 0 && (
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Certifications</p>
                                    <div className="flex flex-wrap gap-2">
                                        {p.certifications.map((cert, i) => (
                                            <Badge key={i} variant="secondary" className="text-xs">{cert}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {p?.career_goals && (
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Career Goals</p>
                                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">{p.career_goals}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Mentoring */}
                {(p?.willing_to_mentor || p?.willing_to_hire_alumni) && (
                    <Card className="border-beige-200 dark:border-gray-700 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg text-maroon-800 dark:text-maroon-200 flex items-center gap-2">
                                <Users className="h-5 w-5" /> Community
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-3">
                            {p?.willing_to_mentor && (
                                <Badge className="bg-green-100 text-green-800 border-green-200">Open to Mentoring</Badge>
                            )}
                            {p?.willing_to_hire_alumni && (
                                <Badge className="bg-blue-100 text-blue-800 border-blue-200">Willing to Hire Alumni</Badge>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AlumniBaseLayout>
    );
}
