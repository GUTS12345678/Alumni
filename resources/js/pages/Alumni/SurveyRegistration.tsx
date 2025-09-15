import React, { useState, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, ArrowLeft, ArrowRight, User, BookOpen, Briefcase, MapPin, Heart, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
    degreeProgram: string;
    major: string;
    graduationYear: string;
    gpa: string;

    // Employment Status
    employmentStatus: string;
    jobTitle: string;
    employer: string;
    salary: string;

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
            { key: 'degreeProgram', label: 'Degree Program', type: 'text', required: true },
            { key: 'major', label: 'Major', type: 'text', required: true },
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
            { key: 'salary', label: 'Annual Salary (Optional)', type: 'number', required: false }
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
        degreeProgram: '',
        major: '',
        graduationYear: '',
        gpa: '',
        employmentStatus: '',
        jobTitle: '',
        employer: '',
        salary: '',
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

    const currentSectionData = sections[currentSection];
    const totalSections = sections.length;
    const progress = ((currentSection + 1) / totalSections) * 100;

    const handleInputChange = useCallback((key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        // Clear error when user starts typing
        if (errors[key]) {
            setErrors(prev => ({ ...prev, [key]: '' }));
        }
    }, [errors]); const validateSection = useCallback(() => {
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
                { key: 'degreeProgram', label: 'Degree Program' },
                { key: 'major', label: 'Major' },
                { key: 'graduationYear', label: 'Graduation Year' },
                { key: 'gpa', label: 'GPA' },
                { key: 'employmentStatus', label: 'Current Employment Status' },
                { key: 'jobTitle', label: 'Current Job Title' },
                { key: 'employer', label: 'Current Employer' },
                { key: 'salary', label: 'Annual Salary (Optional)' },
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
                const axiosError = error as { response?: { data?: { message?: string } } };
                if (axiosError.response?.data?.message) {
                    setSubmissionMessage(axiosError.response.data.message);
                } else {
                    setSubmissionMessage('Registration failed. Please try again.');
                }
            } else {
                setSubmissionMessage('Registration failed. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, validateSection, surveyId, responseToken]); const renderQuestion = (question: { key: string; label: string; type: string; required: boolean; options?: string[]; step?: string; min?: string; max?: string }) => {
        const value = formData[question.key as keyof SurveyData];
        const error = errors[question.key];

        switch (question.type) {
            case 'radio':
                return (
                    <div className="space-y-3">
                        <Label className="text-base font-medium text-maroon-800">{question.label}</Label>
                        <RadioGroup
                            value={value}
                            onValueChange={(val) => handleInputChange(question.key, val)}
                            className="grid grid-cols-1 gap-2"
                        >
                            {question.options?.map((option: string) => (
                                <div key={option} className="flex items-center space-x-2">
                                    <RadioGroupItem value={option} id={`${question.key}-${option}`} />
                                    <Label
                                        htmlFor={`${question.key}-${option}`}
                                        className="text-sm text-gray-700 cursor-pointer"
                                    >
                                        {option}
                                    </Label>
                                </div>
                            ))}
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
                            className="border-beige-300 focus:border-maroon-500 focus:ring-maroon-500"
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

            <div className="min-h-screen bg-gradient-to-br from-beige-50 to-beige-100">
                {/* Header */}
                <div className="bg-maroon-800 text-white py-8">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center justify-center flex-1 mb-4">
                                <GraduationCap className="h-12 w-12 mr-4" />
                                <div>
                                    <h1 className="text-3xl font-bold">Alumni Tracer System</h1>
                                    <p className="text-maroon-200">Registration & Career Survey</p>
                                </div>
                            </div>
                            <div className="absolute top-4 right-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-maroon-200 hover:text-white hover:bg-maroon-700 border border-maroon-600"
                                    onClick={() => window.location.href = '/login'}
                                >
                                    Skip Survey - Go to Login
                                </Button>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="max-w-2xl mx-auto">
                            <div className="flex justify-between text-sm text-maroon-200 mb-2">
                                <span>Step {currentSection + 1} of {totalSections}</span>
                                <span>{Math.round(progress)}% Complete</span>
                            </div>
                            <Progress value={progress} className="h-2 bg-maroon-700" />
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto">
                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader className="bg-beige-50 border-b border-beige-200">
                                <div className="flex items-center mb-4">
                                    {React.createElement(currentSectionData.icon, {
                                        className: "h-8 w-8 text-maroon-600 mr-3"
                                    })}
                                    <div>
                                        <CardTitle className="text-2xl text-maroon-800">
                                            {currentSectionData.title}
                                        </CardTitle>
                                        <CardDescription className="text-maroon-600">
                                            {currentSectionData.description}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-8">
                                <div className="space-y-6">
                                    {currentSectionData.questions.map((question) => (
                                        <div key={question.key}>
                                            {renderQuestion(question)}
                                        </div>
                                    ))}
                                </div>

                                {/* Submission Status */}
                                {submissionStatus !== 'idle' && (
                                    <div className={`mt-6 p-4 rounded-lg flex items-center space-x-3 ${submissionStatus === 'success'
                                        ? 'bg-green-50 border border-green-200'
                                        : submissionStatus === 'error'
                                            ? 'bg-red-50 border border-red-200'
                                            : 'bg-blue-50 border border-blue-200'
                                        }`}>
                                        {submissionStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                                        {submissionStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
                                        {submissionStatus === 'submitting' && (
                                            <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                        )}
                                        <div>
                                            <p className={`text-sm font-medium ${submissionStatus === 'success'
                                                ? 'text-green-800'
                                                : submissionStatus === 'error'
                                                    ? 'text-red-800'
                                                    : 'text-blue-800'
                                                }`}>
                                                {submissionStatus === 'submitting' && 'Processing your registration...'}
                                                {submissionStatus === 'success' && 'Registration Successful!'}
                                                {submissionStatus === 'error' && 'Registration Failed'}
                                            </p>
                                            {submissionMessage && (
                                                <p className={`text-xs mt-1 ${submissionStatus === 'success'
                                                    ? 'text-green-700'
                                                    : submissionStatus === 'error'
                                                        ? 'text-red-700'
                                                        : 'text-blue-700'
                                                    }`}>
                                                    {submissionMessage}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Buttons */}
                                <div className="flex justify-between mt-8 pt-6 border-t border-beige-200">
                                    <Button
                                        onClick={handlePrevious}
                                        disabled={currentSection === 0 || isSubmitting}
                                        variant="outline"
                                        className="border-maroon-300 text-maroon-700 hover:bg-maroon-50 disabled:opacity-50"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Previous
                                    </Button>

                                    {currentSection < totalSections - 1 ? (
                                        <Button
                                            onClick={handleNext}
                                            disabled={isSubmitting}
                                            className="bg-maroon-700 hover:bg-maroon-800 text-white disabled:opacity-50"
                                        >
                                            Next
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    ) : (
                                        <div className="flex flex-col items-end space-y-2">
                                            {submissionStatus === 'success' && (
                                                <p className="text-sm text-green-600 text-right">
                                                    Redirecting to login page in a few seconds...
                                                </p>
                                            )}
                                            <Button
                                                onClick={handleSubmit}
                                                disabled={isSubmitting || submissionStatus === 'success'}
                                                className="bg-maroon-700 hover:bg-maroon-800 text-white disabled:opacity-50 min-w-[200px]"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        Creating Account...
                                                    </>
                                                ) : submissionStatus === 'success' ? (
                                                    <>
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                        Registration Complete
                                                    </>
                                                ) : (
                                                    'Complete Registration'
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Section Navigation */}
                        <div className="mt-6 flex justify-center">
                            <div className="flex space-x-2">
                                {sections.map((section, index) => (
                                    <button
                                        key={section.id}
                                        onClick={() => setCurrentSection(index)}
                                        className={`w-3 h-3 rounded-full transition-colors ${index === currentSection
                                            ? 'bg-maroon-600'
                                            : index < currentSection
                                                ? 'bg-maroon-400'
                                                : 'bg-beige-300'
                                            }`}
                                        title={section.title}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}