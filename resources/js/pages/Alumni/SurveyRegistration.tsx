import React, { useState, useCallback, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, ArrowLeft, ArrowRight, User, BookOpen, Briefcase, MapPin, Heart, Lock, CheckCircle, AlertCircle, Eye, EyeOff, Shield, Sparkles, Building } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import axios from 'axios';

interface SurveyData {
    // Personal Information
    firstName: string;
    lastName: string;
    studentId: string;
    email: string;
    phone: string;
    birthDate: string;
    gender: string;

    // Academic Background
    departmentId: string;
    courseId: string;
    graduationYear: string;
    gpa: string;

    // Employment Status
    employmentStatus: string;
    jobTitle: string;
    employer: string;
    salary: string;
    salaryRange: string;
    careerField: string;

    // Contact Information
    address: string;
    city: string;
    country: string;

    // Engagement
    willingToMentor: string;
    comments: string;

    // Account Setup
    password: string;
    confirmPassword: string;
}

interface Department {
    id: number;
    name: string;
    code: string;
}

interface Course {
    id: number;
    name: string;
    code: string;
    department_id: number;
}

interface Question {
    key: string;
    label: string;
    type: string;
    required: boolean;
    options?: string[] | { value: string; label: string }[];
    step?: string;
    min?: string;
    max?: string;
}

const sections = [
    {
        id: 'personal',
        title: 'Personal Information',
        description: 'Tell us about yourself',
        icon: User,
        questions: [
            { key: 'firstName', label: 'First Name', type: 'text', required: true },
            { key: 'lastName', label: 'Last Name', type: 'text', required: true },
            { key: 'studentId', label: 'Student ID', type: 'text', required: true },
            { key: 'email', label: 'Email Address', type: 'email', required: true },
            { key: 'phone', label: 'Phone Number', type: 'tel', required: false },
            { key: 'birthDate', label: 'Date of Birth', type: 'date', required: false },
            {
                key: 'gender',
                label: 'Gender',
                type: 'radio',
                required: false,
                options: ['Male', 'Female', 'Other', 'Prefer not to say']
            }
        ]
    },
    {
        id: 'academic',
        title: 'Academic Background',
        description: 'Your educational journey',
        icon: BookOpen,
        questions: [
            { key: 'departmentId', label: 'Department/College', type: 'department-select', required: true },
            { key: 'courseId', label: 'Course/Program', type: 'course-select', required: true },
            { key: 'graduationYear', label: 'Graduation Year', type: 'number', required: true },
            { key: 'gpa', label: 'GPA', type: 'number', required: false, step: '0.01', min: '0', max: '4' }
        ]
    },
    {
        id: 'employment',
        title: 'Employment Status',
        description: 'Your current career status',
        icon: Briefcase,
        questions: [
            {
                key: 'employmentStatus',
                label: 'Current Employment Status',
                type: 'radio',
                required: true,
                options: [
                    'Employed Full-time',
                    'Employed Part-time',
                    'Self-employed',
                    'Unemployed (seeking work)',
                    'Unemployed (not seeking work)',
                    'Continuing Education',
                    'Military Service',
                    'Other'
                ]
            },
            { key: 'jobTitle', label: 'Current Job Title', type: 'text', required: false },
            { key: 'employer', label: 'Current Employer', type: 'text', required: false },
            { key: 'salary', label: 'Annual Salary (Optional)', type: 'number', required: false },
            {
                key: 'salaryRange',
                label: 'Salary Range (Monthly)',
                type: 'select',
                required: false,
                options: [
                    { value: 'below_15k', label: 'Below ₱15,000' },
                    { value: '15k_25k', label: '₱15,000 - ₱25,000' },
                    { value: '25k_35k', label: '₱25,000 - ₱35,000' },
                    { value: '35k_50k', label: '₱35,000 - ₱50,000' },
                    { value: '50k_75k', label: '₱50,000 - ₱75,000' },
                    { value: '75k_100k', label: '₱75,000 - ₱100,000' },
                    { value: 'above_100k', label: 'Above ₱100,000' },
                    { value: 'prefer_not_say', label: 'Prefer not to say' }
                ]
            },
            {
                key: 'careerField',
                label: 'Career Field/Industry',
                type: 'select',
                required: false,
                options: [
                    { value: 'information_technology', label: 'Information Technology' },
                    { value: 'education', label: 'Education' },
                    { value: 'business_management', label: 'Business & Management' },
                    { value: 'healthcare', label: 'Healthcare' },
                    { value: 'engineering', label: 'Engineering' },
                    { value: 'government', label: 'Government' },
                    { value: 'finance', label: 'Finance' },
                    { value: 'marketing', label: 'Marketing' },
                    { value: 'hospitality', label: 'Hospitality & Tourism' },
                    { value: 'manufacturing', label: 'Manufacturing' },
                    { value: 'agriculture', label: 'Agriculture' },
                    { value: 'other', label: 'Other' }
                ]
            }
        ]
    },
    {
        id: 'contact',
        title: 'Contact Information',
        description: 'How to reach you',
        icon: MapPin,
        questions: [
            { key: 'address', label: 'Current Address', type: 'textarea', required: false },
            { key: 'city', label: 'City', type: 'text', required: false },
            { key: 'country', label: 'Country', type: 'text', required: false }
        ]
    },
    {
        id: 'engagement',
        title: 'Alumni Engagement',
        description: 'Ways to stay connected',
        icon: Heart,
        questions: [
            {
                key: 'willingToMentor',
                label: 'Are you willing to mentor current students?',
                type: 'radio',
                required: false,
                options: ['Yes', 'No', 'Maybe']
            },
            { key: 'comments', label: 'Additional Comments or Feedback', type: 'textarea', required: false }
        ]
    },
    {
        id: 'account',
        title: 'Account Setup',
        description: 'Secure your alumni portal access',
        icon: Lock,
        questions: [
            { key: 'password', label: 'Create Password', type: 'password', required: true },
            { key: 'confirmPassword', label: 'Confirm Password', type: 'password', required: true }
        ]
    }
];

export default function SurveyRegistration({ surveyId = 1 }: { surveyId?: number }) {
    const [currentSection, setCurrentSection] = useState(0);
    const [formData, setFormData] = useState<SurveyData>({
        firstName: '',
        lastName: '',
        studentId: '',
        email: '',
        phone: '',
        birthDate: '',
        gender: '',
        departmentId: '',
        courseId: '',
        graduationYear: '',
        gpa: '',
        employmentStatus: '',
        jobTitle: '',
        employer: '',
        salary: '',
        salaryRange: '',
        careerField: '',
        address: '',
        city: '',
        country: '',
        willingToMentor: '',
        comments: '',
        password: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Department and Course state
    const [departments, setDepartments] = useState<Department[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [loadingCourses, setLoadingCourses] = useState(false);

    // Fetch departments on component mount
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                setLoadingDepartments(true);
                const response = await axios.get('/api/v1/admin/departments/active');
                if (response.data.success) {
                    setDepartments(response.data.data || []);
                }
            } catch (error) {
                console.error('Error fetching departments:', error);
            } finally {
                setLoadingDepartments(false);
            }
        };

        fetchDepartments();
    }, []);

    // Fetch courses when department changes
    useEffect(() => {
        const fetchCourses = async () => {
            if (!formData.departmentId) {
                setCourses([]);
                return;
            }

            try {
                setLoadingCourses(true);
                const response = await axios.get(`/api/v1/admin/departments/${formData.departmentId}/courses`);
                if (response.data.success) {
                    setCourses(response.data.data || []);
                }
            } catch (error) {
                console.error('Error fetching courses:', error);
                setCourses([]);
            } finally {
                setLoadingCourses(false);
            }
        };

        fetchCourses();
    }, [formData.departmentId]);

    const currentSectionData = sections[currentSection];
    const totalSections = sections.length;
    const progress = ((currentSection + 1) / totalSections) * 100;

    const handleInputChange = useCallback((key: string, value: string) => {
        setFormData(prev => {
            // If department changes, reset course selection
            if (key === 'departmentId') {
                return { ...prev, [key]: value, courseId: '' };
            }
            return { ...prev, [key]: value };
        });
        // Clear error when user starts typing
        if (errors[key]) {
            setErrors(prev => ({ ...prev, [key]: '' }));
        }
    }, [errors]);

    const validateSection = useCallback(() => {
        const newErrors: Record<string, string> = {};
        const section = sections[currentSection];

        section.questions.forEach(question => {
            if (question.required && !formData[question.key as keyof SurveyData]) {
                newErrors[question.key] = `${question.label} is required`;
            }
        });

        // Special validation for password confirmation
        if (currentSection === 5) { // Account setup section
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }
            if (formData.password && formData.password.length < 6) {
                newErrors.password = 'Password must be at least 6 characters';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [currentSection, formData]);

    const handleNext = useCallback(() => {
        if (validateSection()) {
            if (currentSection < totalSections - 1) {
                setCurrentSection(prev => prev + 1);
            }
        }
    }, [currentSection, totalSections, validateSection]);

    const handlePrevious = useCallback(() => {
        if (currentSection > 0) {
            setCurrentSection(prev => prev - 1);
        }
    }, [currentSection]);

    const [responseToken, setResponseToken] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [submissionMessage, setSubmissionMessage] = useState('');

    const handleSubmit = useCallback(async () => {
        if (!validateSection()) return;

        setIsSubmitting(true);
        setSubmissionStatus('submitting');

        try {
            // Step 1: Start survey response if not already started
            let currentResponseToken = responseToken;
            if (!currentResponseToken) {
                const startResponse = await axios.post(`/api/v1/surveys/${surveyId}/start`);
                currentResponseToken = startResponse.data.data.response_token;
                setResponseToken(currentResponseToken);
            }

            // Step 2: Submit all answers to the survey
            const questionMapping = [
                { key: 'firstName', label: 'First Name' },
                { key: 'lastName', label: 'Last Name' },
                { key: 'studentId', label: 'Student ID' },
                { key: 'email', label: 'Email Address' },
                { key: 'phone', label: 'Phone Number' },
                { key: 'birthDate', label: 'Date of Birth' },
                { key: 'gender', label: 'Gender' },
                { key: 'departmentId', label: 'Department' },
                { key: 'courseId', label: 'Course/Program' },
                { key: 'graduationYear', label: 'Graduation Year' },
                { key: 'gpa', label: 'GPA' },
                { key: 'employmentStatus', label: 'Current Employment Status' },
                { key: 'jobTitle', label: 'Current Job Title' },
                { key: 'employer', label: 'Current Employer' },
                { key: 'salary', label: 'Annual Salary (Optional)' },
                { key: 'salaryRange', label: 'Salary Range (Monthly)' },
                { key: 'careerField', label: 'Career Field/Industry' },
                { key: 'address', label: 'Current Address' },
                { key: 'city', label: 'City' },
                { key: 'country', label: 'Country' },
                { key: 'willingToMentor', label: 'Are you willing to mentor current students?' },
                { key: 'comments', label: 'Additional Comments or Feedback' },
            ];

            // For now, we'll simulate question IDs (1-20) since we don't have the actual survey structure
            for (let i = 0; i < questionMapping.length; i++) {
                const mapping = questionMapping[i];
                const answer = formData[mapping.key as keyof SurveyData];

                if (answer) {
                    await axios.post(`/api/v1/surveys/${surveyId}/answer`, {
                        response_token: currentResponseToken,
                        question_id: i + 1, // This should be the actual question ID from the database
                        answer: answer
                    });
                }
            }

            // Step 3: Complete the survey and create account
            await axios.post(`/api/v1/surveys/${surveyId}/complete`, {
                response_token: currentResponseToken,
                email: formData.email,
                password: formData.password
            });

            setSubmissionStatus('success');
            setSubmissionMessage('Registration completed successfully! You can now log in with your credentials.');

            // Redirect to login page after 3 seconds
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);

        } catch (error: unknown) {
            console.error('Survey submission failed:', error);
            setSubmissionStatus('error');

            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { status?: number; data?: { message?: string } } };

                // Handle 409 Conflict - Email already exists
                if (axiosError.response?.status === 409) {
                    setSubmissionMessage(
                        axiosError.response?.data?.message ||
                        'This email address is already registered. Please use a different email or try logging in.'
                    );
                } else if (axiosError.response?.data?.message) {
                    setSubmissionMessage(axiosError.response.data.message);
                } else {
                    setSubmissionMessage('Registration failed. Please try again.');
                }
            } else {
                setSubmissionMessage('Registration failed. Please check your connection and try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, validateSection, surveyId, responseToken]); const renderQuestion = (question: Question) => {
        const value = formData[question.key as keyof SurveyData];
        const error = errors[question.key];

        switch (question.type) {
            case 'department-select':
                return (
                    <div className="space-y-2">
                        <Label htmlFor={question.key} className="text-base font-medium text-maroon-800">
                            {question.label}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <div className="relative">
                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                            <select
                                id={question.key}
                                value={value}
                                onChange={(e) => handleInputChange(question.key, e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-beige-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500 bg-white text-gray-900 appearance-none cursor-pointer"
                                disabled={loadingDepartments}
                            >
                                <option value="">
                                    {loadingDepartments ? 'Loading departments...' : 'Select your department/college'}
                                </option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name} ({dept.code})
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        {!error && departments.length === 0 && !loadingDepartments && (
                            <p className="text-sm text-amber-600">No departments available. Please contact the administrator.</p>
                        )}
                    </div>
                );

            case 'course-select':
                return (
                    <div className="space-y-2">
                        <Label htmlFor={question.key} className="text-base font-medium text-maroon-800">
                            {question.label}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <div className="relative">
                            <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                            <select
                                id={question.key}
                                value={value}
                                onChange={(e) => handleInputChange(question.key, e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-beige-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500 bg-white text-gray-900 appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                                disabled={!formData.departmentId || loadingCourses}
                            >
                                <option value="">
                                    {!formData.departmentId
                                        ? 'Please select a department first'
                                        : loadingCourses
                                            ? 'Loading courses...'
                                            : 'Select your course/program'}
                                </option>
                                {courses.map((course) => (
                                    <option key={course.id} value={course.id}>
                                        {course.name} ({course.code})
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        {!error && formData.departmentId && courses.length === 0 && !loadingCourses && (
                            <p className="text-sm text-amber-600">No courses available for this department.</p>
                        )}
                    </div>
                );

            case 'select':
                return (
                    <div className="space-y-2">
                        <Label htmlFor={question.key} className="text-base font-medium text-maroon-800">
                            {question.label}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <select
                            id={question.key}
                            value={value}
                            onChange={(e) => handleInputChange(question.key, e.target.value)}
                            className="w-full px-4 py-2.5 border border-beige-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500 bg-white text-gray-900 appearance-none cursor-pointer"
                        >
                            <option value="">Select {question.label.toLowerCase()}</option>
                            {question.options?.map((option) => {
                                const opt = option as { value: string; label: string };
                                return (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                );
                            })}
                        </select>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                    </div>
                );

            case 'radio':
                return (
                    <div className="space-y-3">
                        <Label className="text-base font-medium text-maroon-800">{question.label}</Label>
                        <RadioGroup
                            value={value}
                            onValueChange={(val) => handleInputChange(question.key, val)}
                            className="grid grid-cols-1 gap-3"
                        >
                            {Array.isArray(question.options) && question.options.map((option) => {
                                const optionValue = typeof option === 'string' ? option : option.value;
                                const optionLabel = typeof option === 'string' ? option : option.label;
                                return (
                                    <div key={optionValue} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                        <RadioGroupItem value={optionValue} id={`${question.key}-${optionValue}`} className="h-5 w-5" />
                                        <Label
                                            htmlFor={`${question.key}-${optionValue}`}
                                            className="text-base text-gray-900 cursor-pointer flex-1 font-medium"
                                        >
                                            {optionLabel}
                                        </Label>
                                    </div>
                                );
                            })}
                        </RadioGroup>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                    </div>
                );

            case 'textarea':
                return (
                    <div className="space-y-2">
                        <Label htmlFor={question.key} className="text-base font-medium text-maroon-800">
                            {question.label}
                        </Label>
                        <Textarea
                            id={question.key}
                            value={value}
                            onChange={(e) => handleInputChange(question.key, e.target.value)}
                            className="min-h-[100px] border-beige-300 focus:border-maroon-500 focus:ring-maroon-500"
                            placeholder={`Enter your ${question.label.toLowerCase()}`}
                        />
                        {error && <p className="text-sm text-red-600">{error}</p>}
                    </div>
                );

            case 'password':
                return (
                    <div className="space-y-2">
                        <Label htmlFor={question.key} className="text-base font-medium text-maroon-800">
                            {question.label}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <div className="relative">
                            <Input
                                id={question.key}
                                type={question.key === 'password' ? (showPassword ? 'text' : 'password') : (showConfirmPassword ? 'text' : 'password')}
                                value={value}
                                onChange={(e) => handleInputChange(question.key, e.target.value)}
                                className="border-beige-300 focus:border-maroon-500 focus:ring-maroon-500 pr-10"
                                placeholder={`Enter your ${question.label.toLowerCase()}`}
                            />
                            <button
                                type="button"
                                onClick={() => question.key === 'password' ? setShowPassword(!showPassword) : setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {(question.key === 'password' ? showPassword : showConfirmPassword) ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        {question.key === 'password' && !error && value && (
                            <div className="text-xs text-gray-600">
                                Password strength: {value.length >= 8 ? 'Strong' : value.length >= 6 ? 'Medium' : 'Weak'}
                            </div>
                        )}
                    </div>
                );

            default:
                return (
                    <div className="space-y-2">
                        <Label htmlFor={question.key} className="text-base font-medium text-maroon-800">
                            {question.label}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Input
                            id={question.key}
                            type={question.type}
                            value={value}
                            onChange={(e) => handleInputChange(question.key, e.target.value)}
                            className={cn(
                                "border-beige-300 focus:border-maroon-500 focus:ring-maroon-500",
                                question.type === 'date' && "max-w-xs"
                            )}
                            placeholder={`Enter your ${question.label.toLowerCase()}`}
                            step={question.step}
                            min={question.min}
                            max={question.max}
                        />
                        {error && <p className="text-sm text-red-600">{error}</p>}
                    </div>
                );
        }
    };

    return (
        <>
            <Head title="Alumni Registration Survey" />

            <div className="min-h-screen bg-gradient-to-br from-maroon-50 via-beige-50 to-maroon-100 relative overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-maroon-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-beige-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '3s' }}></div>
                </div>

                {/* Header */}
                <div className="bg-gradient-to-r from-maroon-800 to-maroon-900 text-white py-8 shadow-xl relative z-10">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center flex-1 min-w-[250px]">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-white rounded-full blur-lg opacity-20 animate-pulse"></div>
                                    <GraduationCap className="h-12 w-12 mr-4 relative z-10" />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Alumni Tracer System</h1>
                                    <p className="text-maroon-200 text-sm md:text-base">Registration & Career Survey</p>
                                </div>
                            </div>
                            <form method="GET" action="/login" style={{ display: 'inline' }}>
                                <button
                                    type="submit"
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white border-2 border-maroon-600 bg-transparent text-maroon-100 shadow-sm hover:bg-maroon-700 hover:text-white hover:border-white h-10 px-5 py-2 cursor-pointer"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Skip Survey - Go to Login
                                </button>
                            </form>
                        </div>

                        {/* Progress Bar */}
                        <div className="max-w-2xl mx-auto mt-8">
                            <div className="flex justify-between text-sm text-maroon-200 mb-3 font-medium">
                                <span className="flex items-center">
                                    <span className="w-6 h-6 bg-maroon-700 rounded-full flex items-center justify-center text-xs font-bold mr-2">
                                        {currentSection + 1}
                                    </span>
                                    Step {currentSection + 1} of {totalSections}
                                </span>
                                <span className="bg-maroon-700/50 px-3 py-1 rounded-full">{Math.round(progress)}% Complete</span>
                            </div>
                            <div className="relative">
                                <div className="h-3 bg-maroon-700/30 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-300 rounded-full transition-all duration-500 ease-out shadow-lg"
                                        style={{ width: `${progress}%` }}
                                    >
                                        <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="container mx-auto px-4 py-8 md:py-12 relative z-10">
                    <div className="max-w-4xl mx-auto">
                        <Card className="border-maroon-200 shadow-2xl bg-white/95 backdrop-blur-sm overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-maroon-50 to-beige-50 border-b border-maroon-200 pb-6">
                                <div className="flex items-start">
                                    <div className="w-16 h-16 bg-gradient-to-br from-maroon-600 to-maroon-700 rounded-2xl flex items-center justify-center mr-4 shadow-lg flex-shrink-0">
                                        {React.createElement(currentSectionData.icon, {
                                            className: "h-8 w-8 text-white"
                                        })}
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-2xl md:text-3xl text-maroon-900 font-bold mb-2">
                                            {currentSectionData.title}
                                        </CardTitle>
                                        <CardDescription className="text-maroon-600 text-base">
                                            {currentSectionData.description}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-6 md:p-10">
                                <div className="space-y-8">
                                    {currentSectionData.questions.map((question) => (
                                        <div key={question.key} className="animate-fade-in">
                                            {renderQuestion(question)}
                                        </div>
                                    ))}
                                </div>

                                {/* Submission Status */}
                                {submissionStatus !== 'idle' && (
                                    <div className={`mt-8 p-5 rounded-xl flex items-start space-x-4 animate-fade-in shadow-lg ${submissionStatus === 'success'
                                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300'
                                        : submissionStatus === 'error'
                                            ? 'bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300'
                                            : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300'
                                        }`}>
                                        <div className="flex-shrink-0">
                                            {submissionStatus === 'success' && (
                                                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                                    <CheckCircle className="h-6 w-6 text-white" />
                                                </div>
                                            )}
                                            {submissionStatus === 'error' && (
                                                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                                                    <AlertCircle className="h-6 w-6 text-white" />
                                                </div>
                                            )}
                                            {submissionStatus === 'submitting' && (
                                                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-base font-bold ${submissionStatus === 'success'
                                                ? 'text-green-900'
                                                : submissionStatus === 'error'
                                                    ? 'text-red-900'
                                                    : 'text-blue-900'
                                                }`}>
                                                {submissionStatus === 'submitting' && 'Processing your registration...'}
                                                {submissionStatus === 'success' && 'Registration Successful!'}
                                                {submissionStatus === 'error' && 'Registration Failed'}
                                            </p>
                                            {submissionMessage && (
                                                <p className={`text-sm mt-2 leading-relaxed ${submissionStatus === 'success'
                                                    ? 'text-green-800'
                                                    : submissionStatus === 'error'
                                                        ? 'text-red-800'
                                                        : 'text-blue-800'
                                                    }`}>
                                                    {submissionMessage}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Buttons */}
                                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-10 pt-8 border-t-2 border-maroon-100">
                                    <Button
                                        onClick={handlePrevious}
                                        disabled={currentSection === 0 || isSubmitting}
                                        variant="outline"
                                        className="border-2 border-maroon-300 text-maroon-700 hover:bg-maroon-50 hover:border-maroon-500 disabled:opacity-50 h-12 px-6 text-base font-semibold transition-all duration-300 order-2 sm:order-1"
                                    >
                                        <ArrowLeft className="w-5 h-5 mr-2" />
                                        Previous
                                    </Button>

                                    {currentSection < totalSections - 1 ? (
                                        <Button
                                            onClick={handleNext}
                                            disabled={isSubmitting}
                                            className="bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-700 hover:to-maroon-800 text-white disabled:opacity-50 h-12 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 order-1 sm:order-2"
                                        >
                                            Next Step
                                            <ArrowRight className="w-5 h-5 ml-2" />
                                        </Button>
                                    ) : (
                                        <div className="flex flex-col items-stretch sm:items-end space-y-3 order-1 sm:order-2">
                                            {submissionStatus === 'success' && (
                                                <p className="text-sm text-green-600 text-center sm:text-right font-medium flex items-center justify-center sm:justify-end">
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    Redirecting to login page...
                                                </p>
                                            )}
                                            <Button
                                                onClick={handleSubmit}
                                                disabled={isSubmitting || submissionStatus === 'success'}
                                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:opacity-50 h-12 px-8 text-base font-bold shadow-lg hover:shadow-xl transition-all duration-300 min-w-[220px]"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <div className="h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        Creating Account...
                                                    </>
                                                ) : submissionStatus === 'success' ? (
                                                    <>
                                                        <CheckCircle className="w-5 h-5 mr-2" />
                                                        Registration Complete
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-5 h-5 mr-2" />
                                                        Complete Registration
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Section Navigation Dots */}
                        <div className="mt-8 flex justify-center">
                            <div className="bg-white/90 backdrop-blur-sm px-6 py-4 rounded-full shadow-lg border-2 border-maroon-200">
                                <div className="flex space-x-3">
                                    {sections.map((section, index) => (
                                        <button
                                            key={section.id}
                                            onClick={() => setCurrentSection(index)}
                                            className={`transition-all duration-300 rounded-full ${index === currentSection
                                                ? 'w-10 h-4 bg-gradient-to-r from-maroon-600 to-maroon-700 shadow-md'
                                                : index < currentSection
                                                    ? 'w-4 h-4 bg-maroon-400 hover:bg-maroon-500'
                                                    : 'w-4 h-4 bg-beige-300 hover:bg-beige-400'
                                                }`}
                                            title={section.title}
                                            aria-label={`Go to ${section.title}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Help Text */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-maroon-600">
                                <span className="inline-flex items-center">
                                    <Shield className="w-4 h-4 mr-1" />
                                    Your information is secure and encrypted
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}