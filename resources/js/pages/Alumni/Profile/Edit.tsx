import React, { useEffect, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
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
    X,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FormData {
    // Personal
    first_name: string;
    last_name: string;
    middle_name: string;
    student_id: string;
    birth_date: string;
    gender: string;
    phone: string;
    alternate_email: string;
    
    // Address
    current_address: string;
    city: string;
    state_province: string;
    postal_code: string;
    country: string;
    
    // Academic
    degree_program: string;
    major: string;
    minor: string;
    gpa: string;
    graduation_year: string;
    graduation_date: string;
    
    // Employment
    employment_status: string;
    current_job_title: string;
    current_employer: string;
    company_industry: string;
    company_size: string;
    job_start_date: string;
    job_description: string;
    job_related_to_degree: boolean;
    job_satisfaction: string;
    unemployment_reason: string;
    
    // Skills & Career
    skills: string;
    certifications: string;
    career_goals: string;
    feedback_to_institution: string;
    
    // Networking
    willing_to_mentor: boolean;
    willing_to_hire_alumni: boolean;
}

export default function ProfileEdit() {
    const [formData, setFormData] = useState<FormData>({
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
    });

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
                const profile = data.data;
                setFormData({
                    first_name: profile.first_name || '',
                    last_name: profile.last_name || '',
                    middle_name: profile.middle_name || '',
                    student_id: profile.student_id || '',
                    birth_date: profile.birth_date || '',
                    gender: profile.gender || '',
                    phone: profile.phone || '',
                    alternate_email: profile.alternate_email || '',
                    current_address: profile.current_address || '',
                    city: profile.city || '',
                    state_province: profile.state_province || '',
                    postal_code: profile.postal_code || '',
                    country: profile.country || '',
                    degree_program: profile.degree_program || '',
                    major: profile.major || '',
                    minor: profile.minor || '',
                    gpa: profile.gpa?.toString() || '',
                    graduation_year: profile.graduation_year?.toString() || '',
                    graduation_date: profile.graduation_date || '',
                    employment_status: profile.employment_status || '',
                    current_job_title: profile.current_job_title || '',
                    current_employer: profile.current_employer || '',
                    company_industry: profile.company_industry || '',
                    company_size: profile.company_size || '',
                    job_start_date: profile.job_start_date || '',
                    job_description: profile.job_description || '',
                    job_related_to_degree: profile.job_related_to_degree || false,
                    job_satisfaction: profile.job_satisfaction?.toString() || '',
                    unemployment_reason: profile.unemployment_reason || '',
                    skills: profile.skills ? profile.skills.join(', ') : '',
                    certifications: profile.certifications ? profile.certifications.join(', ') : '',
                    career_goals: profile.career_goals || '',
                    feedback_to_institution: profile.feedback_to_institution || '',
                    willing_to_mentor: profile.willing_to_mentor || false,
                    willing_to_hire_alumni: profile.willing_to_hire_alumni || false,
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

        try {
            // Prepare data - convert strings to arrays where needed
            const submitData = {
                ...formData,
                skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
                certifications: formData.certifications ? formData.certifications.split(',').map(s => s.trim()).filter(Boolean) : [],
                gpa: formData.gpa ? parseFloat(formData.gpa) : null,
                graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
                job_satisfaction: formData.job_satisfaction ? parseInt(formData.job_satisfaction) : null,
            };

            // Use Inertia's router with web route
            router.put('/alumni/profile', submitData, {
                preserveScroll: true,
                onSuccess: (page) => {
                    setSuccess('Profile updated successfully!');
                    
                    // Scroll to top to show success message
                    window.scrollTo({ top: 0, behavior: 'smooth' });

                    // Redirect to view page after 2 seconds
                    setTimeout(() => {
                        router.visit('/alumni/profile');
                    }, 2000);
                },
                onError: (errors) => {
                    setErrors(errors);
                    setError('Please fix the validation errors');
                    setSaving(false);
                },
                onFinish: () => {
                    setSaving(false);
                }
            });

        } catch (err) {
            setError('Failed to update profile. Please try again.');
            setSaving(false);
        }
    };

    const handleChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
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
                <div className="flex items-center justify-center py-12">
                    <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 border-4 border-maroon-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-maroon-800 font-medium">Loading profile...</span>
                    </div>
                </div>
            </AlumniBaseLayout>
        );
    }

    return (
        <AlumniBaseLayout title="Edit Profile">
            <Head title="Edit Profile" />
            
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-maroon-800">Edit Profile</h1>
                    <p className="text-maroon-600 mt-2">Update your personal and professional information</p>
                </div>
                <Button
                    onClick={() => router.visit('/alumni/profile')}
                    variant="outline"
                    className="border-maroon-300 text-maroon-700"
                >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                </Button>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <Alert className="mb-6 bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
            )}

            {error && (
                <Alert className="mb-6 bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center text-maroon-800">
                            <User className="h-5 w-5 mr-2" />
                            Personal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            label="First Name"
                            required
                            error={errors.first_name}
                        >
                            <Input
                                value={formData.first_name}
                                onChange={(e) => handleChange('first_name', e.target.value)}
                                placeholder="Enter first name"
                            />
                        </FormField>

                        <FormField
                            label="Last Name"
                            required
                            error={errors.last_name}
                        >
                            <Input
                                value={formData.last_name}
                                onChange={(e) => handleChange('last_name', e.target.value)}
                                placeholder="Enter last name"
                            />
                        </FormField>

                        <FormField label="Middle Name" error={errors.middle_name}>
                            <Input
                                value={formData.middle_name}
                                onChange={(e) => handleChange('middle_name', e.target.value)}
                                placeholder="Enter middle name"
                            />
                        </FormField>

                        <FormField label="Student ID" error={errors.student_id}>
                            <Input
                                value={formData.student_id}
                                onChange={(e) => handleChange('student_id', e.target.value)}
                                placeholder="Enter student ID"
                            />
                        </FormField>

                        <FormField label="Birth Date" error={errors.birth_date}>
                            <Input
                                type="date"
                                value={formData.birth_date}
                                onChange={(e) => handleChange('birth_date', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Gender" error={errors.gender}>
                            <Select
                                value={formData.gender}
                                onValueChange={(value) => handleChange('gender', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormField>

                        <FormField label="Phone" error={errors.phone}>
                            <Input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                placeholder="Enter phone number"
                            />
                        </FormField>

                        <FormField label="Alternate Email" error={errors.alternate_email}>
                            <Input
                                type="email"
                                value={formData.alternate_email}
                                onChange={(e) => handleChange('alternate_email', e.target.value)}
                                placeholder="Enter alternate email"
                            />
                        </FormField>

                        <FormField label="Address" error={errors.current_address} className="md:col-span-2">
                            <Textarea
                                value={formData.current_address}
                                onChange={(e) => handleChange('current_address', e.target.value)}
                                placeholder="Enter current address"
                                rows={2}
                            />
                        </FormField>

                        <FormField label="City" error={errors.city}>
                            <Input
                                value={formData.city}
                                onChange={(e) => handleChange('city', e.target.value)}
                                placeholder="Enter city"
                            />
                        </FormField>

                        <FormField label="State/Province" error={errors.state_province}>
                            <Input
                                value={formData.state_province}
                                onChange={(e) => handleChange('state_province', e.target.value)}
                                placeholder="Enter state or province"
                            />
                        </FormField>

                        <FormField label="Postal Code" error={errors.postal_code}>
                            <Input
                                value={formData.postal_code}
                                onChange={(e) => handleChange('postal_code', e.target.value)}
                                placeholder="Enter postal code"
                            />
                        </FormField>

                        <FormField label="Country" error={errors.country}>
                            <Input
                                value={formData.country}
                                onChange={(e) => handleChange('country', e.target.value)}
                                placeholder="Enter country"
                            />
                        </FormField>
                    </CardContent>
                </Card>

                {/* Academic Information */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center text-maroon-800">
                            <GraduationCap className="h-5 w-5 mr-2" />
                            Academic Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Degree Program" error={errors.degree_program}>
                            <Input
                                value={formData.degree_program}
                                onChange={(e) => handleChange('degree_program', e.target.value)}
                                placeholder="e.g., Bachelor of Science"
                            />
                        </FormField>

                        <FormField label="Major" error={errors.major}>
                            <Input
                                value={formData.major}
                                onChange={(e) => handleChange('major', e.target.value)}
                                placeholder="e.g., Computer Science"
                            />
                        </FormField>

                        <FormField label="Minor" error={errors.minor}>
                            <Input
                                value={formData.minor}
                                onChange={(e) => handleChange('minor', e.target.value)}
                                placeholder="Enter minor (if any)"
                            />
                        </FormField>

                        <FormField label="GPA" error={errors.gpa}>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.gpa}
                                onChange={(e) => handleChange('gpa', e.target.value)}
                                placeholder="e.g., 3.50"
                            />
                        </FormField>

                        <FormField label="Graduation Year" error={errors.graduation_year}>
                            <Input
                                type="number"
                                value={formData.graduation_year}
                                onChange={(e) => handleChange('graduation_year', e.target.value)}
                                placeholder="e.g., 2024"
                            />
                        </FormField>

                        <FormField label="Graduation Date" error={errors.graduation_date}>
                            <Input
                                type="date"
                                value={formData.graduation_date}
                                onChange={(e) => handleChange('graduation_date', e.target.value)}
                            />
                        </FormField>
                    </CardContent>
                </Card>

                {/* Employment Information */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center text-maroon-800">
                            <Briefcase className="h-5 w-5 mr-2" />
                            Employment Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Employment Status" error={errors.employment_status} className="md:col-span-2">
                            <Select
                                value={formData.employment_status}
                                onValueChange={(value) => handleChange('employment_status', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select employment status" />
                                </SelectTrigger>
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
                        </FormField>

                        <FormField label="Job Title" error={errors.current_job_title}>
                            <Input
                                value={formData.current_job_title}
                                onChange={(e) => handleChange('current_job_title', e.target.value)}
                                placeholder="e.g., Software Engineer"
                            />
                        </FormField>

                        <FormField label="Employer" error={errors.current_employer}>
                            <Input
                                value={formData.current_employer}
                                onChange={(e) => handleChange('current_employer', e.target.value)}
                                placeholder="Company name"
                            />
                        </FormField>

                        <FormField label="Industry" error={errors.company_industry}>
                            <Input
                                value={formData.company_industry}
                                onChange={(e) => handleChange('company_industry', e.target.value)}
                                placeholder="e.g., Information Technology"
                            />
                        </FormField>

                        <FormField label="Company Size" error={errors.company_size}>
                            <Select
                                value={formData.company_size}
                                onValueChange={(value) => handleChange('company_size', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select company size" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1-10">1-10 employees</SelectItem>
                                    <SelectItem value="11-50">11-50 employees</SelectItem>
                                    <SelectItem value="51-200">51-200 employees</SelectItem>
                                    <SelectItem value="201-500">201-500 employees</SelectItem>
                                    <SelectItem value="501-1000">501-1000 employees</SelectItem>
                                    <SelectItem value="1000+">1000+ employees</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormField>

                        <FormField label="Job Start Date" error={errors.job_start_date}>
                            <Input
                                type="date"
                                value={formData.job_start_date}
                                onChange={(e) => handleChange('job_start_date', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Job Description" error={errors.job_description} className="md:col-span-2">
                            <Textarea
                                value={formData.job_description}
                                onChange={(e) => handleChange('job_description', e.target.value)}
                                placeholder="Describe your job responsibilities..."
                                rows={3}
                            />
                        </FormField>

                        <FormField label="Job Related to Degree?" className="md:col-span-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    checked={formData.job_related_to_degree}
                                    onCheckedChange={(checked) => handleChange('job_related_to_degree', checked)}
                                />
                                <label className="text-sm text-gray-700">
                                    My current job is related to my degree program
                                </label>
                            </div>
                        </FormField>

                        <FormField label="Job Satisfaction (1-5)" error={errors.job_satisfaction}>
                            <Select
                                value={formData.job_satisfaction}
                                onValueChange={(value) => handleChange('job_satisfaction', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Rate your satisfaction" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1 - Very Dissatisfied</SelectItem>
                                    <SelectItem value="2">2 - Dissatisfied</SelectItem>
                                    <SelectItem value="3">3 - Neutral</SelectItem>
                                    <SelectItem value="4">4 - Satisfied</SelectItem>
                                    <SelectItem value="5">5 - Very Satisfied</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormField>

                        {formData.employment_status?.includes('unemployed') && (
                            <FormField label="Unemployment Reason" error={errors.unemployment_reason} className="md:col-span-2">
                                <Textarea
                                    value={formData.unemployment_reason}
                                    onChange={(e) => handleChange('unemployment_reason', e.target.value)}
                                    placeholder="Please describe your situation..."
                                    rows={2}
                                />
                            </FormField>
                        )}
                    </CardContent>
                </Card>

                {/* Skills & Career Goals */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center text-maroon-800">
                            <Award className="h-5 w-5 mr-2" />
                            Skills & Career Goals
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField 
                            label="Skills" 
                            error={errors.skills}
                            hint="Enter skills separated by commas (e.g., JavaScript, Python, Project Management)"
                        >
                            <Textarea
                                value={formData.skills}
                                onChange={(e) => handleChange('skills', e.target.value)}
                                placeholder="Enter your skills, separated by commas"
                                rows={2}
                            />
                        </FormField>

                        <FormField 
                            label="Certifications" 
                            error={errors.certifications}
                            hint="Enter certifications separated by commas (e.g., PMP, AWS Certified, Scrum Master)"
                        >
                            <Textarea
                                value={formData.certifications}
                                onChange={(e) => handleChange('certifications', e.target.value)}
                                placeholder="Enter your certifications, separated by commas"
                                rows={2}
                            />
                        </FormField>

                        <FormField label="Career Goals" error={errors.career_goals}>
                            <Textarea
                                value={formData.career_goals}
                                onChange={(e) => handleChange('career_goals', e.target.value)}
                                placeholder="Describe your career aspirations and goals..."
                                rows={3}
                            />
                        </FormField>

                        <FormField label="Feedback to Institution" error={errors.feedback_to_institution}>
                            <Textarea
                                value={formData.feedback_to_institution}
                                onChange={(e) => handleChange('feedback_to_institution', e.target.value)}
                                placeholder="Share your feedback or suggestions for the institution..."
                                rows={3}
                            />
                        </FormField>
                    </CardContent>
                </Card>

                {/* Networking Preferences */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center text-maroon-800">
                            <Target className="h-5 w-5 mr-2" />
                            Networking Preferences
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                checked={formData.willing_to_mentor}
                                onCheckedChange={(checked) => handleChange('willing_to_mentor', checked)}
                            />
                            <label className="text-sm text-gray-700">
                                I am willing to mentor current students or younger alumni
                            </label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                checked={formData.willing_to_hire_alumni}
                                onCheckedChange={(checked) => handleChange('willing_to_hire_alumni', checked)}
                            />
                            <label className="text-sm text-gray-700">
                                I am willing to hire or refer alumni for job opportunities
                            </label>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.visit('/alumni/profile')}
                        disabled={saving}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={saving}
                        className="bg-maroon-700 hover:bg-maroon-800 text-white"
                    >
                        {saving ? (
                            <>
                                <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Profile
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </AlumniBaseLayout>
    );
}

// Helper component for form fields
function FormField({ 
    label, 
    required, 
    error, 
    hint,
    className = '', 
    children 
}: { 
    label: string; 
    required?: boolean; 
    error?: string; 
    hint?: string;
    className?: string; 
    children: React.ReactNode;
}) {
    return (
        <div className={className}>
            <Label className="text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
            <div className="mt-1">
                {children}
            </div>
            {error && (
                <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
        </div>
    );
}
