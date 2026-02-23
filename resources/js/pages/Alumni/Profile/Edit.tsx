import React, { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
    User,
    GraduationCap,
    Briefcase,
    Award,
    Target,
    Save,
    ArrowLeft,
    AlertCircle,
    CheckCircle,
    Loader2
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FormData {
    first_name: string;
    last_name: string;
    middle_name: string;
    student_id: string;
    birth_date: string;
    gender: string;
    phone: string;
    alternate_email: string;
    current_address: string;
    city: string;
    state_province: string;
    postal_code: string;
    country: string;
    degree_program: string;
    major: string;
    minor: string;
    gpa: string;
    graduation_year: string;
    graduation_date: string;
    employment_status: string;
    employment_location_type: string;
    current_job_title: string;
    current_employer: string;
    company_industry: string;
    company_size: string;
    job_start_date: string;
    job_description: string;
    job_related_to_degree: boolean;
    job_satisfaction: string;
    unemployment_reason: string;
    skills: string;
    certifications: string;
    career_goals: string;
    feedback_to_institution: string;
    willing_to_mentor: boolean;
    willing_to_hire_alumni: boolean;
}

const initialFormData: FormData = {
    first_name: '',
    last_name: '',
    middle_name: '',
    student_id: '',
    birth_date: '',
    gender: '',
    phone: '',
    alternate_email: '',
    current_address: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: '',
    degree_program: '',
    major: '',
    minor: '',
    gpa: '',
    graduation_year: '',
    graduation_date: '',
    employment_status: '',
    employment_location_type: '',
    current_job_title: '',
    current_employer: '',
    company_industry: '',
    company_size: '',
    job_start_date: '',
    job_description: '',
    job_related_to_degree: false,
    job_satisfaction: '',
    unemployment_reason: '',
    skills: '',
    certifications: '',
    career_goals: '',
    feedback_to_institution: '',
    willing_to_mentor: false,
    willing_to_hire_alumni: false,
};

export default function ProfileEdit() {
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await fetch('/api/v1/alumni/profile', {
                headers: { 'Accept': 'application/json' },
                credentials: 'include',
            });

            if (!response.ok) throw new Error('Failed to fetch profile');

            const data = await response.json();
            if (data.success) {
                const p = data.data;
                setFormData({
                    first_name: p.first_name || '',
                    last_name: p.last_name || '',
                    middle_name: p.middle_name || '',
                    student_id: p.student_id || '',
                    birth_date: p.birth_date ? p.birth_date.substring(0, 10) : '',
                    gender: p.gender || '',
                    phone: p.phone || '',
                    alternate_email: p.alternate_email || '',
                    current_address: p.current_address || '',
                    city: p.city || '',
                    state_province: p.state_province || '',
                    postal_code: p.postal_code || '',
                    country: p.country || '',
                    degree_program: p.degree_program || '',
                    major: p.major || '',
                    minor: p.minor || '',
                    gpa: p.gpa?.toString() || '',
                    graduation_year: p.graduation_year?.toString() || '',
                    graduation_date: p.graduation_date ? p.graduation_date.substring(0, 10) : '',
                    employment_status: p.employment_status || '',
                    employment_location_type: p.employment_location_type || '',
                    current_job_title: p.current_job_title || '',
                    current_employer: p.current_employer || '',
                    company_industry: p.company_industry || '',
                    company_size: p.company_size || '',
                    job_start_date: p.job_start_date ? p.job_start_date.substring(0, 10) : '',
                    job_description: p.job_description || '',
                    job_related_to_degree: p.job_related_to_degree || false,
                    job_satisfaction: p.job_satisfaction?.toString() || '',
                    unemployment_reason: p.unemployment_reason || '',
                    skills: p.skills ? p.skills.join(', ') : '',
                    certifications: p.certifications ? p.certifications.join(', ') : '',
                    career_goals: p.career_goals || '',
                    feedback_to_institution: p.feedback_to_institution || '',
                    willing_to_mentor: p.willing_to_mentor || false,
                    willing_to_hire_alumni: p.willing_to_hire_alumni || false,
                });
            }
        } catch (err) {
            console.error('Profile fetch error:', err);
            setError('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);
        setErrors({});

        const submitData = {
            ...formData,
            skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
            certifications: formData.certifications ? formData.certifications.split(',').map(s => s.trim()).filter(Boolean) : [],
            gpa: formData.gpa ? parseFloat(formData.gpa) : null,
            graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
            job_satisfaction: formData.job_satisfaction ? parseInt(formData.job_satisfaction) : null,
        };

        router.put('/alumni/profile', submitData, {
            preserveScroll: true,
            onSuccess: () => {
                setSuccess('Profile updated successfully!');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => router.visit('/alumni/profile'), 1500);
            },
            onError: (errors) => {
                setErrors(errors);
                setError('Please fix the validation errors');
                setSaving(false);
            },
            onFinish: () => setSaving(false)
        });
    };

    const handleChange = (field: keyof FormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    if (loading) {
        return (
            <AlumniBaseLayout title="Edit Profile">
                <Head title="Edit Profile" />
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-maroon-600 dark:text-gray-400" />
                    <span className="ml-3 text-maroon-800 dark:text-gray-200 font-medium">Loading profile...</span>
                </div>
            </AlumniBaseLayout>
        );
    }

    return (
        <AlumniBaseLayout title="Edit Profile">
            <Head title="Edit Profile" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.visit('/alumni/profile')}
                        className="text-maroon-600 dark:text-gray-400 hover:text-maroon-800 dark:hover:text-gray-200"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-maroon-800 dark:text-maroon-200">Edit Profile</h1>
                        <p className="text-sm text-maroon-600 dark:text-maroon-400">Update your information</p>
                    </div>
                </div>
                <Button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="bg-maroon-700 hover:bg-maroon-800 text-white"
                >
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            {/* Messages */}
            {success && (
                <Alert className="mb-4 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
                </Alert>
            )}
            {error && (
                <Alert className="mb-4 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Personal Information */}
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="flex items-center text-lg text-maroon-800 dark:text-maroon-200">
                            <User className="h-5 w-5 mr-2" />
                            Personal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Field label="First Name" required error={errors.first_name}>
                                <Input value={formData.first_name} onChange={(e) => handleChange('first_name', e.target.value)} placeholder="First name" />
                            </Field>
                            <Field label="Last Name" required error={errors.last_name}>
                                <Input value={formData.last_name} onChange={(e) => handleChange('last_name', e.target.value)} placeholder="Last name" />
                            </Field>
                            <Field label="Middle Name" error={errors.middle_name}>
                                <Input value={formData.middle_name} onChange={(e) => handleChange('middle_name', e.target.value)} placeholder="Middle name" />
                            </Field>
                            <Field label="Student ID" error={errors.student_id}>
                                <Input value={formData.student_id} onChange={(e) => handleChange('student_id', e.target.value)} placeholder="Student ID" />
                            </Field>
                            <Field label="Birth Date" error={errors.birth_date}>
                                <Input type="date" value={formData.birth_date} onChange={(e) => handleChange('birth_date', e.target.value)} />
                            </Field>
                            <Field label="Gender" error={errors.gender}>
                                <Select value={formData.gender || undefined} onValueChange={(v) => handleChange('gender', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label="Phone" error={errors.phone}>
                                <Input type="tel" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="Phone number" />
                            </Field>
                            <Field label="Alternate Email" error={errors.alternate_email}>
                                <Input type="email" value={formData.alternate_email} onChange={(e) => handleChange('alternate_email', e.target.value)} placeholder="Alternate email" />
                            </Field>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                            <Field label="Address" error={errors.current_address} className="sm:col-span-2">
                                <Input value={formData.current_address} onChange={(e) => handleChange('current_address', e.target.value)} placeholder="Street address" />
                            </Field>
                            <Field label="City" error={errors.city}>
                                <Input value={formData.city} onChange={(e) => handleChange('city', e.target.value)} placeholder="City" />
                            </Field>
                            <Field label="State/Province" error={errors.state_province}>
                                <Input value={formData.state_province} onChange={(e) => handleChange('state_province', e.target.value)} placeholder="State/Province" />
                            </Field>
                            <Field label="Postal Code" error={errors.postal_code}>
                                <Input value={formData.postal_code} onChange={(e) => handleChange('postal_code', e.target.value)} placeholder="Postal code" />
                            </Field>
                            <Field label="Country" error={errors.country}>
                                <Input value={formData.country} onChange={(e) => handleChange('country', e.target.value)} placeholder="Country" />
                            </Field>
                        </div>
                    </CardContent>
                </Card>

                {/* Academic Information */}
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="flex items-center text-lg text-maroon-800 dark:text-maroon-200">
                            <GraduationCap className="h-5 w-5 mr-2" />
                            Academic Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Field label="Degree Program" error={errors.degree_program}>
                                <Input value={formData.degree_program} onChange={(e) => handleChange('degree_program', e.target.value)} placeholder="e.g., Bachelor of Science" />
                            </Field>
                            <Field label="Major" error={errors.major}>
                                <Input value={formData.major} onChange={(e) => handleChange('major', e.target.value)} placeholder="e.g., Computer Science" />
                            </Field>
                            <Field label="Minor" error={errors.minor}>
                                <Input value={formData.minor} onChange={(e) => handleChange('minor', e.target.value)} placeholder="Minor (if any)" />
                            </Field>
                            <Field label="GPA" error={errors.gpa}>
                                <Input type="number" step="0.01" value={formData.gpa} onChange={(e) => handleChange('gpa', e.target.value)} placeholder="e.g., 3.50" />
                            </Field>
                            <Field label="Graduation Year" error={errors.graduation_year}>
                                <Input type="number" value={formData.graduation_year} onChange={(e) => handleChange('graduation_year', e.target.value)} placeholder="e.g., 2024" />
                            </Field>
                            <Field label="Graduation Date" error={errors.graduation_date}>
                                <Input type="date" value={formData.graduation_date} onChange={(e) => handleChange('graduation_date', e.target.value)} />
                            </Field>
                        </div>
                    </CardContent>
                </Card>

                {/* Employment Information */}
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="flex items-center text-lg text-maroon-800 dark:text-maroon-200">
                            <Briefcase className="h-5 w-5 mr-2" />
                            Employment Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Field label="Employment Status" error={errors.employment_status}>
                                <Select value={formData.employment_status || undefined} onValueChange={(v) => handleChange('employment_status', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="employed_full_time">Employed Full-Time</SelectItem>
                                        <SelectItem value="employed_part_time">Employed Part-Time</SelectItem>
                                        <SelectItem value="self_employed">Self-Employed</SelectItem>
                                        <SelectItem value="unemployed_looking">Unemployed (Looking)</SelectItem>
                                        <SelectItem value="unemployed_not_looking">Unemployed (Not Looking)</SelectItem>
                                        <SelectItem value="further_education">Further Education</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label="Job Title" error={errors.current_job_title}>
                                <Input value={formData.current_job_title} onChange={(e) => handleChange('current_job_title', e.target.value)} placeholder="e.g., Software Engineer" />
                            </Field>
                            <Field label="Employer" error={errors.current_employer}>
                                <Input value={formData.current_employer} onChange={(e) => handleChange('current_employer', e.target.value)} placeholder="Company name" />
                            </Field>
                            <Field label="Industry" error={errors.company_industry}>
                                <Input value={formData.company_industry} onChange={(e) => handleChange('company_industry', e.target.value)} placeholder="e.g., Information Technology" />
                            </Field>
                            <Field label="Company Size" error={errors.company_size}>
                                <Select value={formData.company_size || undefined} onValueChange={(v) => handleChange('company_size', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1-10">1-10 employees</SelectItem>
                                        <SelectItem value="11-50">11-50 employees</SelectItem>
                                        <SelectItem value="51-200">51-200 employees</SelectItem>
                                        <SelectItem value="201-500">201-500 employees</SelectItem>
                                        <SelectItem value="501-1000">501-1000 employees</SelectItem>
                                        <SelectItem value="1000+">1000+ employees</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label="Job Start Date" error={errors.job_start_date}>
                                <Input type="date" value={formData.job_start_date} onChange={(e) => handleChange('job_start_date', e.target.value)} />
                            </Field>
                            <Field label="Work Location" error={errors.employment_location_type}>
                                <Select value={formData.employment_location_type || undefined} onValueChange={(v) => handleChange('employment_location_type', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select location type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="local">Local (Philippines)</SelectItem>
                                        <SelectItem value="foreign">Foreign / OFW</SelectItem>
                                        <SelectItem value="remote">Remote (Foreign Company)</SelectItem>
                                        <SelectItem value="not_applicable">Not Applicable</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label="Job Satisfaction" error={errors.job_satisfaction}>
                                <Select value={formData.job_satisfaction || undefined} onValueChange={(v) => handleChange('job_satisfaction', v)}>
                                    <SelectTrigger><SelectValue placeholder="Rate satisfaction" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 - Very Dissatisfied</SelectItem>
                                        <SelectItem value="2">2 - Dissatisfied</SelectItem>
                                        <SelectItem value="3">3 - Neutral</SelectItem>
                                        <SelectItem value="4">4 - Satisfied</SelectItem>
                                        <SelectItem value="5">5 - Very Satisfied</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                            <div className="flex items-center gap-2 pt-6">
                                <Checkbox checked={formData.job_related_to_degree} onCheckedChange={(c) => handleChange('job_related_to_degree', c)} />
                                <label className="text-sm text-gray-700 dark:text-gray-300">Job related to degree</label>
                            </div>
                        </div>
                        <div className="mt-4">
                            <Field label="Job Description" error={errors.job_description}>
                                <Textarea value={formData.job_description} onChange={(e) => handleChange('job_description', e.target.value)} placeholder="Describe your responsibilities..." rows={2} />
                            </Field>
                        </div>
                        {formData.employment_status?.includes('unemployed') && (
                            <div className="mt-4">
                                <Field label="Unemployment Reason" error={errors.unemployment_reason}>
                                    <Textarea value={formData.unemployment_reason} onChange={(e) => handleChange('unemployment_reason', e.target.value)} placeholder="Please describe your situation..." rows={2} />
                                </Field>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Skills & Career */}
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="flex items-center text-lg text-maroon-800 dark:text-maroon-200">
                            <Award className="h-5 w-5 mr-2" />
                            Skills & Career Goals
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-4">
                        <Field label="Skills" error={errors.skills} hint="Separate with commas">
                            <Input value={formData.skills} onChange={(e) => handleChange('skills', e.target.value)} placeholder="JavaScript, Python, Project Management..." />
                        </Field>
                        <Field label="Certifications" error={errors.certifications} hint="Separate with commas">
                            <Input value={formData.certifications} onChange={(e) => handleChange('certifications', e.target.value)} placeholder="PMP, AWS Certified, Scrum Master..." />
                        </Field>
                        <Field label="Career Goals" error={errors.career_goals}>
                            <Textarea value={formData.career_goals} onChange={(e) => handleChange('career_goals', e.target.value)} placeholder="Your career aspirations..." rows={2} />
                        </Field>
                        <Field label="Feedback to Institution" error={errors.feedback_to_institution}>
                            <Textarea value={formData.feedback_to_institution} onChange={(e) => handleChange('feedback_to_institution', e.target.value)} placeholder="Suggestions or feedback..." rows={2} />
                        </Field>
                    </CardContent>
                </Card>

                {/* Networking */}
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="flex items-center text-lg text-maroon-800 dark:text-maroon-200">
                            <Target className="h-5 w-5 mr-2" />
                            Networking Preferences
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                        <div className="flex items-center gap-2">
                            <Checkbox checked={formData.willing_to_mentor} onCheckedChange={(c) => handleChange('willing_to_mentor', c)} />
                            <label className="text-sm text-gray-700 dark:text-gray-300">Willing to mentor students or younger alumni</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox checked={formData.willing_to_hire_alumni} onCheckedChange={(c) => handleChange('willing_to_hire_alumni', c)} />
                            <label className="text-sm text-gray-700 dark:text-gray-300">Willing to hire or refer alumni for opportunities</label>
                        </div>
                    </CardContent>
                </Card>

                {/* Bottom Save Button */}
                <div className="flex justify-end pt-2 pb-4">
                    <Button type="submit" disabled={saving} className="bg-maroon-700 hover:bg-maroon-800 text-white px-8">
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </AlumniBaseLayout>
    );
}

function Field({ label, required, error, hint, className = '', children }: {
    label: string;
    required?: boolean;
    error?: string;
    hint?: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={className}>
            <Label className="text-sm text-gray-700 dark:text-gray-300">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
                {hint && <span className="text-xs text-gray-400 ml-1">({hint})</span>}
            </Label>
            <div className="mt-1">{children}</div>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
    );
}
