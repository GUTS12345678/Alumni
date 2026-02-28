import React from 'react';
import { Head } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { sanitizeHtml } from '@/lib/sanitize';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Briefcase,
    MapPin,
    DollarSign,
    Clock,
    Building2,
    ExternalLink,
    Calendar,
    ArrowLeft,
    Mail,
    Globe,
    User,
    Eye,
    Star,
    Share2,
} from 'lucide-react';

interface JobData {
    id: number;
    title: string;
    company_name: string;
    location: string;
    job_type: string;
    experience_level: string;
    content: string;
    requirements?: string;
    salary_min?: number;
    salary_max?: number;
    salary_currency?: string;
    formatted_salary?: string;
    salary_range?: string;
    application_email?: string;
    application_url?: string;
    external_url?: string;
    contact_person?: string;
    contact_email?: string;
    contact_phone?: string;
    deadline?: string;
    application_deadline?: string;
    skills_required?: string | string[];
    status: string;
    is_featured?: boolean;
    views?: number;
    views_count?: number;
    created_at: string;
    updated_at: string;
    benefits?: string;
    qualifications?: string;
    company_website?: string;
    company_logo_url?: string;
    work_arrangement?: string;
    employment_type?: string;
    salary_period?: string;
    start_date?: string;
    user?: {
        id: number;
        name: string;
        email: string;
        alumni_profile?: {
            first_name?: string;
            last_name?: string;
            current_job_title?: string;
            current_employer?: string;
            profile_picture_url?: string;
        };
    };
}

interface Props {
    auth: { user: { id: number; email: string; role: string } };
    job: JobData;
}

const jobTypeLabels: Record<string, string> = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    contract: 'Contract',
    remote: 'Remote',
    freelance: 'Freelance',
    internship: 'Internship',
    temporary: 'Temporary',
};

const experienceLevelLabels: Record<string, string> = {
    entry: 'Entry Level',
    mid: 'Mid Level',
    senior: 'Senior Level',
    executive: 'Executive',
    internship: 'Internship',
};

const workArrangementLabels: Record<string, string> = {
    on_site: 'On-site',
    remote: 'Remote',
    hybrid: 'Hybrid',
};

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function formatSalary(job: JobData): string | null {
    if (job.formatted_salary) return job.formatted_salary;
    if (job.salary_range) return job.salary_range;
    if (job.salary_min && job.salary_max) {
        const currency = job.salary_currency || 'PHP';
        return `${currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`;
    }
    if (job.salary_min) {
        const currency = job.salary_currency || 'PHP';
        return `${currency} ${job.salary_min.toLocaleString()}+`;
    }
    return null;
}

function getSkills(job: JobData): string[] {
    if (!job.skills_required) return [];
    if (Array.isArray(job.skills_required)) return job.skills_required;
    try { return JSON.parse(job.skills_required); } catch { return []; }
}

export default function JobDetails({ auth, job }: Props) {
    const salary = formatSalary(job);
    const skills = getSkills(job);
    const deadline = job.application_deadline || job.deadline;
    const isExpired = deadline ? new Date(deadline) < new Date() : false;
    const poster = job.user?.alumni_profile;

    return (
        <AlumniBaseLayout title="Job Details" user={auth.user}>
            <Head title={`${job.title} - Job Board`} />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Back Button */}
                <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center gap-2 text-sm text-maroon-600 hover:text-maroon-800 dark:text-maroon-400 dark:hover:text-maroon-300 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Job Board
                </button>

                {/* Main Header Card */}
                <Card className="border-beige-200 dark:border-gray-700 shadow-lg overflow-hidden">
                    {/* Featured banner */}
                    {job.is_featured && (
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center text-xs font-semibold py-1.5 flex items-center justify-center gap-1">
                            <Star className="h-3 w-3 fill-current" /> Featured Job
                        </div>
                    )}

                    <CardContent className="p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row gap-6">
                            {/* Company Logo */}
                            <div className="flex-shrink-0">
                                {job.company_logo_url ? (
                                    <img src={job.company_logo_url} alt={job.company_name}
                                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-gray-200 dark:border-gray-600" />
                                ) : (
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-maroon-100 to-maroon-200 dark:from-maroon-800 dark:to-maroon-900 flex items-center justify-center">
                                        <Building2 className="h-8 w-8 text-maroon-600 dark:text-maroon-400" />
                                    </div>
                                )}
                            </div>

                            {/* Job Info */}
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl sm:text-3xl font-bold text-maroon-900 dark:text-gray-100 mb-2">
                                    {job.title}
                                </h1>
                                <p className="text-lg text-maroon-700 dark:text-gray-300 font-medium mb-3">
                                    {job.company_name}
                                </p>

                                {/* Meta badges */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <Badge className="bg-maroon-100 text-maroon-700 dark:bg-maroon-900/30 dark:text-maroon-300 border-0">
                                        <Briefcase className="h-3 w-3 mr-1" />
                                        {jobTypeLabels[job.job_type] || job.job_type}
                                    </Badge>
                                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0">
                                        <User className="h-3 w-3 mr-1" />
                                        {experienceLevelLabels[job.experience_level] || job.experience_level}
                                    </Badge>
                                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-0">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        {job.location}
                                    </Badge>
                                    {job.work_arrangement && (
                                        <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-0">
                                            {workArrangementLabels[job.work_arrangement] || job.work_arrangement}
                                        </Badge>
                                    )}
                                    {isExpired && (
                                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-0">
                                            Expired
                                        </Badge>
                                    )}
                                </div>

                                {/* Key details row */}
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                    {salary && (
                                        <span className="flex items-center gap-1">
                                            <DollarSign className="h-4 w-4 text-green-600" />
                                            <span className="font-semibold text-green-700 dark:text-green-400">{salary}</span>
                                            {job.salary_period && <span className="text-gray-400">/{job.salary_period}</span>}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        Posted {formatDate(job.created_at)}
                                    </span>
                                    {(job.views !== undefined || job.views_count !== undefined) && (
                                        <span className="flex items-center gap-1">
                                            <Eye className="h-4 w-4" />
                                            {(job.views_count || job.views || 0).toLocaleString()} views
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                            {job.application_url || job.external_url ? (
                                <a href={job.application_url || job.external_url} target="_blank" rel="noopener noreferrer">
                                    <Button className="bg-maroon-700 hover:bg-maroon-800 text-white" disabled={isExpired}>
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Apply Externally
                                    </Button>
                                </a>
                            ) : job.application_email || job.contact_email ? (
                                <a href={`mailto:${job.application_email || job.contact_email}?subject=Application for ${encodeURIComponent(job.title)}`}>
                                    <Button className="bg-maroon-700 hover:bg-maroon-800 text-white" disabled={isExpired}>
                                        <Mail className="h-4 w-4 mr-2" />
                                        Apply via Email
                                    </Button>
                                </a>
                            ) : null}
                            {job.company_website && (
                                <a href={job.company_website} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" className="border-maroon-300 text-maroon-700 dark:border-gray-600 dark:text-gray-300">
                                        <Globe className="h-4 w-4 mr-2" />
                                        Company Website
                                    </Button>
                                </a>
                            )}
                            <Button variant="outline" onClick={() => navigator.clipboard?.writeText(window.location.href)}
                                className="border-maroon-300 text-maroon-700 dark:border-gray-600 dark:text-gray-300">
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Description */}
                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-lg text-maroon-900 dark:text-gray-100">Job Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-maroon dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.content) }} />
                            </CardContent>
                        </Card>

                        {/* Requirements */}
                        {job.requirements && (
                            <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-lg text-maroon-900 dark:text-gray-100">Requirements</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="prose prose-maroon dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.requirements) }} />
                                </CardContent>
                            </Card>
                        )}

                        {/* Qualifications */}
                        {job.qualifications && (
                            <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-lg text-maroon-900 dark:text-gray-100">Qualifications</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="prose prose-maroon dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.qualifications) }} />
                                </CardContent>
                            </Card>
                        )}

                        {/* Benefits */}
                        {job.benefits && (
                            <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-lg text-maroon-900 dark:text-gray-100">Benefits</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="prose prose-maroon dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.benefits) }} />
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-6">
                        {/* Key Details */}
                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-base text-maroon-900 dark:text-gray-100">Job Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Briefcase className="h-5 w-5 text-maroon-600 dark:text-maroon-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Employment Type</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                            {jobTypeLabels[job.employment_type || job.job_type] || job.job_type}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <User className="h-5 w-5 text-maroon-600 dark:text-maroon-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Experience Level</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                            {experienceLevelLabels[job.experience_level] || job.experience_level}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-maroon-600 dark:text-maroon-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{job.location}</p>
                                    </div>
                                </div>
                                {salary && (
                                    <div className="flex items-start gap-3">
                                        <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Salary</p>
                                            <p className="text-sm font-medium text-green-700 dark:text-green-400">{salary}</p>
                                        </div>
                                    </div>
                                )}
                                {deadline && (
                                    <div className="flex items-start gap-3">
                                        <Clock className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isExpired ? 'text-red-500' : 'text-orange-500'}`} />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Application Deadline</p>
                                            <p className={`text-sm font-medium ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-200'}`}>
                                                {formatDate(deadline)}
                                                {isExpired && ' (Expired)'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {job.start_date && (
                                    <div className="flex items-start gap-3">
                                        <Calendar className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Start Date</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{formatDate(job.start_date)}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Skills */}
                        {skills.length > 0 && (
                            <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-base text-maroon-900 dark:text-gray-100">Required Skills</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {skills.map((skill, i) => (
                                            <Badge key={i} variant="secondary"
                                                className="bg-maroon-50 text-maroon-700 dark:bg-maroon-900/30 dark:text-maroon-300 border border-maroon-200 dark:border-maroon-700">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Posted By */}
                        {job.user && (
                            <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-base text-maroon-900 dark:text-gray-100">Posted By</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-3">
                                        {poster?.profile_picture_url ? (
                                            <img src={poster.profile_picture_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-maroon-100 dark:bg-maroon-800 flex items-center justify-center">
                                                <User className="h-5 w-5 text-maroon-600 dark:text-maroon-400" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                                {poster ? `${poster.first_name || ''} ${poster.last_name || ''}`.trim() : job.user.name}
                                            </p>
                                            {poster?.current_job_title && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {poster.current_job_title}
                                                    {poster.current_employer && ` at ${poster.current_employer}`}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Contact Info */}
                                    {(job.contact_person || job.contact_email || job.contact_phone) && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
                                            {job.contact_person && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    <span className="font-medium">Contact:</span> {job.contact_person}
                                                </p>
                                            )}
                                            {job.contact_email && (
                                                <a href={`mailto:${job.contact_email}`}
                                                    className="text-sm text-maroon-600 dark:text-maroon-400 hover:underline flex items-center gap-1">
                                                    <Mail className="h-3 w-3" /> {job.contact_email}
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AlumniBaseLayout>
    );
}
