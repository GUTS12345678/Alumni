import React, { useState, useCallback, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, ArrowLeft, ArrowRight, User, Briefcase, Heart, Lock, CheckCircle, AlertCircle, Eye, EyeOff, Shield, Sparkles, Building, Mail, RefreshCw, X, Award, School } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import axios from 'axios';

interface SurveyData {
    // Data Privacy Consent
    dataPrivacyConsent: boolean;
    dataPrivacyConsentDate: string;

    // Personal Information
    firstName: string;
    lastName: string;
    maidenName: string; // Pre-marital name for married females
    age: string;
    gender: string;
    placeOfBirth: string;
    civilStatus: string;
    spouseName: string;
    numberOfChildren: string;
    residenceAddress: string;
    telNo: string;
    mobileNo: string;
    email: string;

    // School Information
    campusId: string;
    campus: string;
    campusOther: string;
    departmentId: string;
    courseId: string;
    course: string;
    major: string;
    yearGraduated: string;
    enrollmentYear: string;
    honorsAwards: string;

    // Eligibility / Government Examinations
    examinations: Array<{
        name: string;
        place: string;
        dateTaken: string;
        rating: string;
    }>;

    // Employment
    presentlyEmployed: string; // Yes or No
    employmentLocation: string; // Local or Abroad/Foreign
    notEmployedReason: string;
    companyName: string;
    companyAddress: string;
    presentPosition: string;
    dateHired: string;
    yearsOfService: string;
    jobAlignedToCourse: string; // Yes or No
    averageMonthlyIncome: string;
    employmentStatus: string; // Permanent, Temporary, etc.
    jobLevelPosition: string; // Clerical, Supervisory, etc.
    majorLineOfBusiness: string; // Education, Business, etc.
    businessOther: string;

    // Achievement / Award Received
    achievements: string;

    // What I Want My EARIST Family to Know About Me
    aboutMe: string;

    // Account Setup
    studentId: string;
    password: string;
    confirmPassword: string;
}

interface Campus {
    id: number;
    name: string;
    code: string;
    display_name: string;
}

interface Department {
    id: number;
    name: string;
    code: string;
    campus_id?: number;
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
        id: 'privacy',
        title: 'Data Privacy Consent',
        description: 'Your privacy rights and data protection',
        icon: Shield,
        questions: [
            { key: 'dataPrivacyConsent', label: 'Data Privacy Consent', type: 'privacy-consent', required: true }
        ]
    },
    {
        id: 'personal',
        title: 'Personal Information',
        description: 'Tell us about yourself',
        icon: User,
        questions: [
            { key: 'firstName', label: 'Name (First Name)', type: 'text', required: true },
            { key: 'lastName', label: 'Last Name', type: 'text', required: true },
            { key: 'maidenName', label: 'Maiden Name / Pre-Marital Name (for married females)', type: 'text', required: false },
            { key: 'age', label: 'Age', type: 'number', required: false },
            {
                key: 'gender',
                label: 'Gender',
                type: 'radio',
                required: false,
                options: ['Male', 'Female']
            },
            { key: 'placeOfBirth', label: 'Place of Birth', type: 'text', required: false },
            {
                key: 'civilStatus',
                label: 'Civil Status',
                type: 'radio',
                required: false,
                options: ['Single', 'Married', 'Separated', 'Widowed']
            },
            { key: 'spouseName', label: 'Spouse Name', type: 'text', required: false },
            { key: 'numberOfChildren', label: 'No. of Children', type: 'number', required: false },
            { key: 'residenceAddress', label: 'Residence/Mailing Address', type: 'textarea', required: false },
            { key: 'telNo', label: 'Tel. No.', type: 'tel', required: false },
            { key: 'mobileNo', label: 'Mobile No.', type: 'tel', required: false },
            { key: 'email', label: 'Email', type: 'email', required: true }
        ]
    },
    {
        id: 'school',
        title: 'School Information',
        description: 'Your academic credentials',
        icon: School,
        questions: [
            { key: 'campusId', label: 'Campus/College', type: 'campus-select', required: true },
            { key: 'campusOther', label: 'If Others, please specify', type: 'text', required: false },
            { key: 'departmentId', label: 'Department', type: 'department-select', required: true },
            { key: 'courseId', label: 'Course (includes Major)', type: 'course-select', required: true },
            { key: 'yearGraduated', label: 'Year Graduated', type: 'number', required: true, min: '1978', max: '2026' },
            { key: 'enrollmentYear', label: 'Year Enrolled in EARIST', type: 'number', required: false, min: '1970', max: '2026' },
            { key: 'honorsAwards', label: 'Honor/Awards Received (Cum Laude, Magna Cum Laude, etc.)', type: 'textarea', required: false }
        ]
    },
    {
        id: 'eligibility',
        title: 'Eligibility / Government Examination(s) Passed',
        description: 'Professional licenses and certifications',
        icon: Award,
        questions: [
            { key: 'examinations', label: 'Government Examinations', type: 'examination-list', required: false }
        ]
    },
    {
        id: 'employment',
        title: 'Employment',
        description: 'Your current career status',
        icon: Briefcase,
        questions: [
            {
                key: 'presentlyEmployed',
                label: 'Are you presently employed?',
                type: 'radio',
                required: true,
                options: ['Yes', 'No']
            },
            {
                key: 'employmentLocation',
                label: 'If Yes, where are you employed?',
                type: 'radio',
                required: false,
                options: ['Local', 'Abroad/Foreign']
            },
            { key: 'notEmployedReason', label: 'If No, please state the reason(s) why you are not employed', type: 'textarea', required: false },
            { key: 'companyName', label: 'Name of the Agency/Company/Business', type: 'text', required: false },
            { key: 'companyAddress', label: 'Address of the Agency/Company/Business', type: 'text', required: false },
            { key: 'presentPosition', label: 'Present Position', type: 'text', required: false },
            { key: 'dateHired', label: 'Date Hired in Present Job', type: 'date', required: false },
            { key: 'yearsOfService', label: 'Years of Service in the current position', type: 'number', required: false, step: '0.5' },
            {
                key: 'jobAlignedToCourse',
                label: 'Your Present job is aligned to your course graduated?',
                type: 'radio',
                required: false,
                options: ['Yes', 'No']
            },
            {
                key: 'averageMonthlyIncome',
                label: 'Average Monthly Income',
                type: 'radio',
                required: false,
                options: [
                    'Below 5,000.00',
                    '5,001.00 to 10,000.00',
                    '15,001.00 to 20,000.00',
                    '20,001.00 to 25,000.00',
                    '25,001.00 & up',
                    'Others (pls. Specify)'
                ]
            },
            {
                key: 'employmentStatus',
                label: 'Employment Status',
                type: 'radio',
                required: false,
                options: [
                    'Permanent',
                    'Temporary/Provisional',
                    'Contractual',
                    'Casual',
                    'Job Order',
                    'Self-Employed',
                    'Others (pls. Specify)'
                ]
            },
            {
                key: 'jobLevelPosition',
                label: 'Job Level Position',
                type: 'radio',
                required: false,
                options: [
                    'Clerical',
                    'Supervisory',
                    'Technical',
                    'Managerial',
                    'Professional',
                    'Self-Employed',
                    'Others (pls. Specify)'
                ]
            },
            {
                key: 'majorLineOfBusiness',
                label: 'Major Line of Business of the Agency/company you are presently employed',
                type: 'radio',
                required: false,
                options: [
                    'Education',
                    'Business',
                    'Manufacturing',
                    'Hotel/Restaurant',
                    'Government',
                    'Information Tech./Arts',
                    'Construction/Builder',
                    'Others (pls. Specify)'
                ]
            },
            { key: 'businessOther', label: 'If Others, please specify', type: 'text', required: false }
        ]
    },
    {
        id: 'achievements',
        title: 'Achievement / Award Received',
        description: 'Your accomplishments and recognitions',
        icon: Award,
        questions: [
            { key: 'achievements', label: 'List your achievements and awards', type: 'textarea', required: false }
        ]
    },
    {
        id: 'aboutme',
        title: 'What I Want My EARIST Family to Know About Me',
        description: 'Share your story with the EARIST community',
        icon: Heart,
        questions: [
            { key: 'aboutMe', label: 'Tell us about yourself', type: 'textarea', required: false }
        ]
    },
    {
        id: 'account',
        title: 'Account Setup',
        description: 'Secure your alumni portal access',
        icon: Lock,
        questions: [
            { key: 'studentId', label: 'Student ID', type: 'text', required: true },
            { key: 'password', label: 'Create Password', type: 'password', required: true },
            { key: 'confirmPassword', label: 'Confirm Password', type: 'password', required: true }
        ]
    }
];

export default function SurveyRegistration({ surveyId = 1 }: { surveyId?: number }) {
    const [currentSection, setCurrentSection] = useState(0);
    const [formData, setFormData] = useState<SurveyData>({
        dataPrivacyConsent: false,
        dataPrivacyConsentDate: '',
        firstName: '',
        lastName: '',
        maidenName: '',
        age: '',
        gender: '',
        placeOfBirth: '',
        civilStatus: '',
        spouseName: '',
        numberOfChildren: '',
        residenceAddress: '',
        telNo: '',
        mobileNo: '',
        email: '',
        campusId: '',
        campus: '',
        campusOther: '',
        departmentId: '',
        courseId: '',
        course: '',
        major: '',
        yearGraduated: '',
        enrollmentYear: '',
        honorsAwards: '',
        examinations: [],
        presentlyEmployed: '',
        employmentLocation: '',
        notEmployedReason: '',
        companyName: '',
        companyAddress: '',
        presentPosition: '',
        dateHired: '',
        yearsOfService: '',
        jobAlignedToCourse: '',
        averageMonthlyIncome: '',
        employmentStatus: '',
        jobLevelPosition: '',
        majorLineOfBusiness: '',
        businessOther: '',
        achievements: '',
        aboutMe: '',
        studentId: '',
        password: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [error, setError] = useState<string>(''); // General form-level error message
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Validation states
    const [emailValidation, setEmailValidation] = useState<{
        checking: boolean;
        exists: boolean;
        message: string;
    }>({ checking: false, exists: false, message: '' });

    const [studentIdValidation, setStudentIdValidation] = useState<{
        checking: boolean;
        exists: boolean;
        message: string;
    }>({ checking: false, exists: false, message: '' });

    // Phone number validation state
    const [phoneValidation, setPhoneValidation] = useState<{
        checking: boolean;
        exists: boolean;
        field: string;
        message: string;
    }>({ checking: false, exists: false, field: '', message: '' });

    // OTP verification state
    const [otpState, setOtpState] = useState<{
        sent: boolean;
        verified: boolean;
        sending: boolean;
        verifying: boolean;
        code: string;
        message: string;
        error: boolean;
        countdown: number;
    }>({ sent: false, verified: false, sending: false, verifying: false, code: '', message: '', error: false, countdown: 0 });

    // Add public-page class to html for proper scrolling (same as LandingPage)
    useEffect(() => {
        document.documentElement.classList.add('public-page');
        return () => {
            document.documentElement.classList.remove('public-page');
        };
    }, []);

    // Countdown timer for OTP resend
    useEffect(() => {
        if (otpState.countdown > 0) {
            const timer = setTimeout(() => {
                setOtpState(prev => ({ ...prev, countdown: prev.countdown - 1 }));
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [otpState.countdown]);

    // Department and Course state
    const [campuses, setCampuses] = useState<Campus[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loadingCampuses, setLoadingCampuses] = useState(false);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [loadingCourses, setLoadingCourses] = useState(false);

    // Fetch campuses on component mount
    useEffect(() => {
        const fetchCampuses = async () => {
            try {
                setLoadingCampuses(true);
                const response = await axios.get('/api/v1/campuses');
                if (response.data.success) {
                    setCampuses(response.data.data || []);
                }
            } catch (error) {
                console.error('Error fetching campuses:', error);
            } finally {
                setLoadingCampuses(false);
            }
        };

        fetchCampuses();
    }, []);

    // Fetch departments when campus changes
    useEffect(() => {
        const fetchDepartments = async () => {
            if (!formData.campusId) {
                setDepartments([]);
                return;
            }

            try {
                setLoadingDepartments(true);
                const response = await axios.get('/api/v1/admin/departments/active', {
                    params: { campus_id: formData.campusId }
                });
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
    }, [formData.campusId]);

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

    // Debounced validation for email
    useEffect(() => {
        const checkEmail = async () => {
            if (!formData.email || !formData.email.includes('@')) {
                setEmailValidation({ checking: false, exists: false, message: '' });
                return;
            }

            setEmailValidation({ checking: true, exists: false, message: 'Checking email...' });

            try {
                const response = await axios.post('/api/v1/check-email', {
                    email: formData.email
                });

                if (response.data.exists) {
                    setEmailValidation({
                        checking: false,
                        exists: true,
                        message: 'This email is already registered. Please use a different email or login.'
                    });
                } else {
                    setEmailValidation({
                        checking: false,
                        exists: false,
                        message: 'Email is available'
                    });
                }
            } catch {
                setEmailValidation({ checking: false, exists: false, message: '' });
            }
        };

        const timer = setTimeout(checkEmail, 800);
        return () => clearTimeout(timer);
    }, [formData.email]);

    // Debounced validation for student ID
    useEffect(() => {
        const checkStudentId = async () => {
            if (!formData.studentId || formData.studentId.length < 3) {
                setStudentIdValidation({ checking: false, exists: false, message: '' });
                return;
            }

            setStudentIdValidation({ checking: true, exists: false, message: 'Checking student ID...' });

            try {
                const response = await axios.post('/api/v1/check-student-id', {
                    student_id: formData.studentId
                });

                if (response.data.exists) {
                    setStudentIdValidation({
                        checking: false,
                        exists: true,
                        message: 'This student ID is already registered. Please verify your ID or contact support.'
                    });
                } else {
                    setStudentIdValidation({
                        checking: false,
                        exists: false,
                        message: 'Student ID is available'
                    });
                }
            } catch {
                setStudentIdValidation({ checking: false, exists: false, message: '' });
            }
        };

        const timer = setTimeout(checkStudentId, 800);
        return () => clearTimeout(timer);
    }, [formData.studentId]);

    // Debounced validation for phone numbers (tel & mobile)
    useEffect(() => {
        const checkPhone = async () => {
            const phone = formData.mobileNo || formData.telNo;
            if (!phone || phone.length < 7) {
                setPhoneValidation({ checking: false, exists: false, field: '', message: '' });
                return;
            }

            setPhoneValidation({ checking: true, exists: false, field: '', message: 'Checking phone...' });

            try {
                const response = await axios.post('/api/v1/check-phone', { phone });

                if (response.data.exists) {
                    setPhoneValidation({
                        checking: false,
                        exists: true,
                        field: formData.mobileNo ? 'mobileNo' : 'telNo',
                        message: 'This phone number is already registered.'
                    });
                } else {
                    setPhoneValidation({
                        checking: false,
                        exists: false,
                        field: '',
                        message: ''
                    });
                }
            } catch {
                setPhoneValidation({ checking: false, exists: false, field: '', message: '' });
            }
        };

        const timer = setTimeout(checkPhone, 800);
        return () => clearTimeout(timer);
    }, [formData.telNo, formData.mobileNo]);

    const handleInputChange = useCallback((key: string, value: string | boolean | Array<{ name: string; place: string; dateTaken: string; rating: string }>) => {
        setFormData(prev => {
            // If campus changes, reset department and course selection and populate campus name
            if (key === 'campusId') {
                const selectedCampus = campuses.find(c => c.id.toString() === value);
                return {
                    ...prev,
                    campusId: value as string,
                    campus: selectedCampus?.name || '',
                    departmentId: '',
                    courseId: ''
                };
            }
            // If department changes, reset course selection and populate department name
            if (key === 'departmentId') {
                return {
                    ...prev,
                    departmentId: value as string,
                    courseId: ''
                };
            }
            // If course changes, populate course and major names
            if (key === 'courseId') {
                const selectedCourse = courses.find(c => c.id.toString() === value);
                return {
                    ...prev,
                    courseId: value as string,
                    course: selectedCourse?.name || '',
                    major: selectedCourse?.name || '' // Course includes major
                };
            }
            return { ...prev, [key]: value } as SurveyData;
        });
        // Clear error when user starts typing
        if (errors[key]) {
            setErrors(prev => ({ ...prev, [key]: '' }));
        }
        // Reset OTP state when email changes
        if (key === 'email') {
            setOtpState({ sent: false, verified: false, sending: false, verifying: false, code: '', message: '', error: false, countdown: 0 });
        }
    }, [errors, campuses, courses]);

    // Send OTP to email
    const handleSendOtp = useCallback(async () => {
        if (!formData.email || !formData.email.includes('@') || emailValidation.exists || emailValidation.checking) {
            return;
        }

        setOtpState(prev => ({ ...prev, sending: true, message: '', error: false }));

        try {
            const response = await axios.post('/api/v1/otp/send', {
                email: formData.email,
                purpose: 'registration'
            });

            if (response.data.success) {
                setOtpState(prev => ({
                    ...prev,
                    sent: true,
                    sending: false,
                    message: 'Verification code sent! Check your email inbox.',
                    error: false,
                    countdown: 60 // 60 seconds countdown before resend
                }));
            }
        } catch (error: unknown) {
            let errorMessage = 'Failed to send verification code. Please try again.';
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
                if (axiosError.response?.status === 429) {
                    errorMessage = axiosError.response?.data?.message || 'Too many requests. Please wait before trying again.';
                } else if (axiosError.response?.data?.message) {
                    errorMessage = axiosError.response.data.message;
                }
            }
            setOtpState(prev => ({
                ...prev,
                sending: false,
                message: errorMessage,
                error: true
            }));
        }
    }, [formData.email, emailValidation.exists, emailValidation.checking]);

    // Verify OTP code
    const handleVerifyOtp = useCallback(async () => {
        if (!otpState.code || otpState.code.length !== 6) {
            setOtpState(prev => ({ ...prev, message: 'Please enter a 6-digit code', error: true }));
            return;
        }

        setOtpState(prev => ({ ...prev, verifying: true, message: '', error: false }));

        try {
            const response = await axios.post('/api/v1/otp/verify', {
                email: formData.email,
                otp: otpState.code,
                purpose: 'registration'
            });

            if (response.data.success && response.data.verified) {
                setOtpState(prev => ({
                    ...prev,
                    verified: true,
                    verifying: false,
                    message: 'Email verified successfully!',
                    error: false
                }));
            }
        } catch (error: unknown) {
            let errorMessage = 'Invalid or expired verification code. Please try again.';
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
                if (axiosError.response?.status === 429) {
                    errorMessage = axiosError.response?.data?.message || 'Too many attempts. Please wait before trying again.';
                } else if (axiosError.response?.data?.message) {
                    errorMessage = axiosError.response.data.message;
                }
            }
            setOtpState(prev => ({
                ...prev,
                verifying: false,
                message: errorMessage,
                error: true
            }));
        }
    }, [formData.email, otpState.code]);

    // Handle OTP code input
    const handleOtpChange = useCallback((value: string) => {
        // Only allow digits and max 6 characters
        const cleanValue = value.replace(/\D/g, '').slice(0, 6);
        setOtpState(prev => ({ ...prev, code: cleanValue, message: '', error: false }));
    }, []);

    const validateSection = useCallback(() => {
        const newErrors: Record<string, string> = {};
        const section = sections[currentSection];

        section.questions.forEach(question => {
            if (question.required && !formData[question.key as keyof SurveyData]) {
                newErrors[question.key] = `${question.label} is required`;
            }
        });

        // Check for duplicate email in personal section (section index 1)
        if (currentSection === 1 && emailValidation.exists) {
            newErrors.email = 'This email is already registered';
        }

        // Check for duplicate student ID in account section (section index 7)
        if (currentSection === 7 && studentIdValidation.exists) {
            newErrors.studentId = 'This student ID is already registered';
        }

        // Require OTP verification in personal section (section index 1)
        if (currentSection === 1 && formData.email && !otpState.verified) {
            newErrors.email = 'Please verify your email with the OTP code sent to your inbox';
        }

        // Check for duplicate phone number in personal section (section index 1)
        if (currentSection === 1 && phoneValidation.exists) {
            if (formData.telNo && phoneValidation.field === 'telNo') {
                newErrors.telNo = 'This telephone number is already registered';
            }
            if (formData.mobileNo && phoneValidation.field === 'mobileNo') {
                newErrors.mobileNo = 'This mobile number is already registered';
            }
        }

        // Special validation for password confirmation
        if (currentSection === 7) { // Account setup section (index 7)
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }
            if (formData.password && formData.password.length < 8) {
                newErrors.password = 'Password must be at least 8 characters long';
            }
            // Check for password strength
            if (formData.password && formData.password.length >= 8) {
                const hasUpperCase = /[A-Z]/.test(formData.password);
                const hasLowerCase = /[a-z]/.test(formData.password);
                const hasNumber = /[0-9]/.test(formData.password);
                const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);

                if (!hasUpperCase || !hasLowerCase || !hasNumber) {
                    newErrors.password = 'Password must contain uppercase, lowercase, and numbers';
                }

                if (!hasSpecialChar) {
                    newErrors.password = 'Password is weak. Consider adding special characters (!@#$%^&*)';
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [currentSection, formData, emailValidation.exists, studentIdValidation.exists, otpState.verified, phoneValidation.exists, phoneValidation.field]);

    const handleNext = useCallback(() => {
        // Special validation for privacy section - require consent
        if (currentSection === 0 && !formData.dataPrivacyConsent) {
            setError('You must agree to the Data Privacy Consent to proceed with registration.');
            // Smooth scroll to error message
            setTimeout(() => {
                const errorElement = document.querySelector('.text-red-600');
                errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            return;
        }

        if (validateSection()) {
            if (currentSection < totalSections - 1) {
                setCurrentSection(prev => prev + 1);
                // Clear error when moving to next section
                setError('');
                // Scroll to top of page smoothly
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    }, [currentSection, totalSections, validateSection, formData.dataPrivacyConsent]);

    const handlePrevious = useCallback(() => {
        if (currentSection > 0) {
            setCurrentSection(prev => prev - 1);
            // Scroll to top of page smoothly
            window.scrollTo({ top: 0, behavior: 'smooth' });
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

            // Step 2: Fetch the survey's actual questions so we can use real question IDs
            const surveyResponse = await axios.get(`/api/v1/surveys/${surveyId}`);
            const surveyQuestions = surveyResponse.data?.data?.survey?.questions || [];

            // Map form data to survey questions by matching labels (case-insensitive)
            const answerMapping: Record<string, string> = {
                'first name': 'firstName',
                'last name': 'lastName',
                'student id': 'studentId',
                'student number': 'studentId',
                'email': 'email',
                'email address': 'email',
                'phone': 'mobileNo',
                'phone number': 'mobileNo',
                'mobile': 'mobileNo',
                'mobile no': 'mobileNo',
                'tel': 'telNo',
                'telephone': 'telNo',
                'gender': 'gender',
                'age': 'age',
                'place of birth': 'placeOfBirth',
                'civil status': 'civilStatus',
                'civil_status': 'civilStatus',
                'maiden name': 'maidenName',
                'spouse': 'spouseName',
                'spouse name': 'spouseName',
                'children': 'numberOfChildren',
                'number of children': 'numberOfChildren',
                'address': 'residenceAddress',
                'residence': 'residenceAddress',
                'mailing address': 'residenceAddress',
                'campus': 'campus',
                'department': 'departmentId',
                'course': 'course',
                'program': 'course',
                'major': 'major',
                'year graduated': 'yearGraduated',
                'graduation year': 'yearGraduated',
                'enrollment year': 'enrollmentYear',
                'honors': 'honorsAwards',
                'awards': 'honorsAwards',
                'presently employed': 'presentlyEmployed',
                'employed': 'presentlyEmployed',
                'employment location': 'employmentLocation',
                'local or abroad': 'employmentLocation',
                'where are you employed': 'employmentLocation',
                'company': 'companyName',
                'company name': 'companyName',
                'company address': 'companyAddress',
                'position': 'presentPosition',
                'present position': 'presentPosition',
                'job title': 'presentPosition',
                'date hired': 'dateHired',
                'years of service': 'yearsOfService',
                'job aligned': 'jobAlignedToCourse',
                'monthly income': 'averageMonthlyIncome',
                'income': 'averageMonthlyIncome',
                'employment status': 'employmentStatus',
                'job level': 'jobLevelPosition',
                'line of business': 'majorLineOfBusiness',
                'achievements': 'achievements',
                'about me': 'aboutMe',
            };

            // Submit answers using real question IDs
            for (const question of surveyQuestions) {
                const questionText = (question.question_text || '').toLowerCase().trim();
                // Try to find a matching form field
                let formKey: string | undefined;
                for (const [pattern, key] of Object.entries(answerMapping)) {
                    if (questionText.includes(pattern)) {
                        formKey = key;
                        break;
                    }
                }

                if (formKey) {
                    const answer = formData[formKey as keyof SurveyData];
                    if (answer) {
                        try {
                            await axios.post(`/api/v1/surveys/${surveyId}/answer`, {
                                response_token: currentResponseToken,
                                question_id: question.id,
                                answer: typeof answer === 'object' ? JSON.stringify(answer) : answer
                            });
                        } catch (answerError) {
                            // Log but don't fail the entire submission for individual answer errors
                            console.warn(`Could not submit answer for question ${question.id}:`, answerError);
                        }
                    }
                }
            }

            // Step 3: Complete the survey and create account
            // Send all profile-relevant data directly so the backend can
            // populate alumni_profiles accurately (not relying on keyword matching)
            await axios.post(`/api/v1/surveys/${surveyId}/complete`, {
                response_token: currentResponseToken,
                email: formData.email,
                password: formData.password,
                profile_data: {
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    maiden_name: formData.maidenName,
                    student_id: formData.studentId,
                    phone: formData.mobileNo,
                    gender: formData.gender,
                    current_address: formData.residenceAddress,
                    campus_id: formData.campusId || null,
                    department_id: formData.departmentId || null,
                    course_id: formData.courseId || null,
                    degree_program: formData.course,
                    major: formData.major,
                    graduation_year: formData.yearGraduated,
                    presently_employed: formData.presentlyEmployed,
                    employment_location: formData.employmentLocation,
                    not_employed_reason: formData.notEmployedReason,
                    company_name: formData.companyName,
                    company_address: formData.companyAddress,
                    present_position: formData.presentPosition,
                    date_hired: formData.dateHired,
                    years_of_service: formData.yearsOfService,
                    job_aligned_to_course: formData.jobAlignedToCourse,
                    average_monthly_income: formData.averageMonthlyIncome,
                    employment_status: formData.employmentStatus,
                    job_level_position: formData.jobLevelPosition,
                    major_line_of_business: formData.majorLineOfBusiness,
                    achievements: formData.achievements,
                    about_me: formData.aboutMe,
                },
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
                const axiosError = error as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } };

                // Log detailed validation errors
                if (axiosError.response?.data?.errors) {
                    console.error('Validation errors:', axiosError.response.data.errors);
                }

                // Handle 409 Conflict - Email already exists
                if (axiosError.response?.status === 409) {
                    setSubmissionMessage(
                        axiosError.response?.data?.message ||
                        'This email address is already registered. Please use a different email or try logging in.'
                    );
                } else if (axiosError.response?.status === 422) {
                    // Validation error
                    const errors = axiosError.response?.data?.errors;
                    if (errors) {
                        const errorMessages = Object.entries(errors)
                            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                            .join('\n');
                        setSubmissionMessage(`Validation failed:\n${errorMessages}`);
                    } else {
                        setSubmissionMessage(axiosError.response?.data?.message || 'Validation failed. Please check your inputs.');
                    }
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
        const rawValue = formData[question.key as keyof SurveyData];
        const value = typeof rawValue === 'string' ? rawValue : '';
        const error = errors[question.key];

        switch (question.type) {
            case 'campus-select':
                return (
                    <div className="space-y-2">
                        <Label htmlFor={question.key} className="text-base font-medium text-maroon-800 dark:text-maroon-200">
                            {question.label}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <div className="relative">
                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                            <select
                                id={question.key}
                                value={value as string}
                                onChange={(e) => handleInputChange(question.key, e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-beige-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer"
                                disabled={loadingCampuses}
                            >
                                <option value="">
                                    {loadingCampuses ? 'Loading campuses...' : 'Select your campus'}
                                </option>
                                {campuses.map((campus) => (
                                    <option key={campus.id} value={campus.id}>
                                        {campus.display_name || campus.name}
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
                        {!error && campuses.length === 0 && !loadingCampuses && (
                            <p className="text-sm text-amber-600">No campuses available. Please contact the administrator.</p>
                        )}
                    </div>
                );

            case 'department-select':
                return (
                    <div className="space-y-2">
                        <Label htmlFor={question.key} className="text-base font-medium text-maroon-800 dark:text-maroon-200">
                            {question.label}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <div className="relative">
                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                            <select
                                id={question.key}
                                value={value as string}
                                onChange={(e) => handleInputChange(question.key, e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-beige-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                                disabled={!formData.campusId || loadingDepartments}
                            >
                                <option value="">
                                    {!formData.campusId
                                        ? 'Please select a campus first'
                                        : loadingDepartments
                                            ? 'Loading departments...'
                                            : 'Select your department/college'}
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
                        {!error && formData.campusId && departments.length === 0 && !loadingDepartments && (
                            <p className="text-sm text-amber-600">No departments available for this campus.</p>
                        )}
                    </div>
                );

            case 'course-select':
                return (
                    <div className="space-y-2">
                        <Label htmlFor={question.key} className="text-base font-medium text-maroon-800 dark:text-maroon-200">
                            {question.label}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <div className="relative">
                            <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                            <select
                                id={question.key}
                                value={value as string}
                                onChange={(e) => handleInputChange(question.key, e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-beige-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
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
                        <Label htmlFor={question.key} className="text-base font-medium text-maroon-800 dark:text-maroon-200">
                            {question.label}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <select
                            id={question.key}
                            value={value}
                            onChange={(e) => handleInputChange(question.key, e.target.value)}
                            className="w-full px-4 py-2.5 border border-beige-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer"
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
                        <Label className="text-base font-medium text-maroon-800 dark:text-maroon-200">{question.label}</Label>
                        <RadioGroup
                            value={value}
                            onValueChange={(val) => handleInputChange(question.key, val)}
                            className="grid grid-cols-1 gap-3"
                        >
                            {Array.isArray(question.options) && question.options.map((option) => {
                                const optionValue = typeof option === 'string' ? option : option.value;
                                const optionLabel = typeof option === 'string' ? option : option.label;
                                return (
                                    <div key={optionValue} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <RadioGroupItem value={optionValue} id={`${question.key}-${optionValue}`} className="h-5 w-5" />
                                        <Label
                                            htmlFor={`${question.key}-${optionValue}`}
                                            className="text-base text-gray-900 dark:text-gray-100 cursor-pointer flex-1 font-medium"
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
                        <Label htmlFor={question.key} className="text-base font-medium text-maroon-800 dark:text-maroon-200">
                            {question.label}
                        </Label>
                        <Textarea
                            id={question.key}
                            value={value}
                            onChange={(e) => handleInputChange(question.key, e.target.value)}
                            className="min-h-[100px] border-beige-300 dark:border-gray-600 focus:border-maroon-500 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                            placeholder={`Enter your ${question.label.toLowerCase()}`}
                        />
                        {error && <p className="text-sm text-red-600">{error}</p>}
                    </div>
                );

            case 'password':
                return (
                    <div className="space-y-2">
                        <Label htmlFor={question.key} className="text-base font-medium text-maroon-800 dark:text-maroon-200">
                            {question.label}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <div className="relative">
                            <Input
                                id={question.key}
                                type={question.key === 'password' ? (showPassword ? 'text' : 'password') : (showConfirmPassword ? 'text' : 'password')}
                                value={value}
                                onChange={(e) => handleInputChange(question.key, e.target.value)}
                                className="border-beige-300 dark:border-gray-600 focus:border-maroon-500 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 pr-10"
                                placeholder={`Enter your ${question.label.toLowerCase()}`}
                            />
                            <button
                                type="button"
                                onClick={() => question.key === 'password' ? setShowPassword(!showPassword) : setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                Password strength: {value.length >= 8 ? 'Strong' : value.length >= 6 ? 'Medium' : 'Weak'}
                            </div>
                        )}
                    </div>
                );

            case 'checkbox-group':
                return (
                    <div className="space-y-3">
                        <Label className="text-base font-medium text-maroon-800 dark:text-maroon-200">
                            {question.label}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {Array.isArray(question.options) && question.options.map((option) => {
                                const optionValue = typeof option === 'string' ? option : option.value;
                                const optionLabel = typeof option === 'string' ? option : option.label;
                                const currentValues = value ? value.split(',').filter(Boolean) : [];
                                const isChecked = currentValues.includes(optionValue);

                                return (
                                    <button
                                        key={optionValue}
                                        type="button"
                                        onClick={() => {
                                            if (isChecked) {
                                                handleInputChange(question.key, currentValues.filter(v => v !== optionValue).join(','));
                                            } else {
                                                handleInputChange(question.key, [...currentValues, optionValue].join(','));
                                            }
                                        }}
                                        className={cn(
                                            "w-full p-3 text-left text-sm font-medium rounded-lg border-2 transition-all duration-200",
                                            isChecked
                                                ? "bg-maroon-600 text-white border-maroon-600 shadow-md"
                                                : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-maroon-400 hover:bg-maroon-50 dark:hover:bg-gray-600"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>{optionLabel}</span>
                                            {isChecked && (
                                                <CheckCircle className="h-4 w-4 ml-2 flex-shrink-0" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                    </div>
                );

            case 'examination-list':
                return (
                    <div className="space-y-4">
                        <Label className="text-base font-medium text-maroon-800 dark:text-maroon-200">
                            {question.label}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Add your professional licenses and government examinations passed</p>

                        {formData.examinations.map((exam, index) => (
                            <div key={index} className="border-2 border-maroon-200 dark:border-gray-600 rounded-lg p-4 space-y-3 bg-maroon-50 dark:bg-gray-700/50">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold text-maroon-800 dark:text-maroon-200">Examination {index + 1}</h4>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            const newExams = formData.examinations.filter((_, i) => i !== index);
                                            handleInputChange('examinations', newExams);
                                        }}
                                        variant="outline"
                                        size="sm"
                                        className="border-red-300 text-red-600 hover:bg-red-50"
                                    >
                                        <X className="h-4 w-4 mr-1" />
                                        Remove
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor={`exam-name-${index}`} className="text-sm">Name of Examination</Label>
                                        <Input
                                            id={`exam-name-${index}`}
                                            value={exam.name}
                                            onChange={(e) => {
                                                const newExams = [...formData.examinations];
                                                newExams[index].name = e.target.value;
                                                handleInputChange('examinations', newExams);
                                            }}
                                            placeholder="e.g., Civil Engineering Board Exam"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`exam-place-${index}`} className="text-sm">Place of Examination</Label>
                                        <Input
                                            id={`exam-place-${index}`}
                                            value={exam.place}
                                            onChange={(e) => {
                                                const newExams = [...formData.examinations];
                                                newExams[index].place = e.target.value;
                                                handleInputChange('examinations', newExams);
                                            }}
                                            placeholder="e.g., Manila"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`exam-date-${index}`} className="text-sm">Date Taken</Label>
                                        <Input
                                            id={`exam-date-${index}`}
                                            type="date"
                                            value={exam.dateTaken}
                                            onChange={(e) => {
                                                const newExams = [...formData.examinations];
                                                newExams[index].dateTaken = e.target.value;
                                                handleInputChange('examinations', newExams);
                                            }}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`exam-rating-${index}`} className="text-sm">Rating</Label>
                                        <Input
                                            id={`exam-rating-${index}`}
                                            value={exam.rating}
                                            onChange={(e) => {
                                                const newExams = [...formData.examinations];
                                                newExams[index].rating = e.target.value;
                                                handleInputChange('examinations', newExams);
                                            }}
                                            placeholder="e.g., 85.5%"
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <Button
                            type="button"
                            onClick={() => {
                                const newExams = [...formData.examinations, { name: '', place: '', dateTaken: '', rating: '' }];
                                handleInputChange('examinations', newExams);
                            }}
                            variant="outline"
                            className="w-full border-2 border-maroon-300 dark:border-gray-600 text-maroon-700 dark:text-maroon-300 hover:bg-maroon-50 dark:hover:bg-gray-700"
                        >
                            <Award className="h-4 w-4 mr-2" />
                            Add Examination
                        </Button>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                    </div>
                );

            case 'privacy-consent':
                return (
                    <div className="space-y-6">
                        {/* Data Privacy Header */}
                        <div className="bg-gradient-to-r from-maroon-600 to-maroon-700 text-white p-4 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="bg-white/20 p-2 rounded-full">
                                    <Shield className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Data Privacy Consent Form</h3>
                                    <p className="text-maroon-100 text-xs mt-0.5">
                                        Republic of the Philippines - RA 10173 or Data Privacy Act of 2012
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Consent Content */}
                        <div className="bg-white dark:bg-gray-800 border-2 border-maroon-200 dark:border-gray-600 rounded-lg p-4 space-y-3">
                            <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                                <em>In accordance with RA 10173 or Data Privacy Act of 2012, I consent to the following terms and condition on the collection, use, processing and disclosure of my personal data:</em>
                            </p>

                            <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                                <div className="flex items-start space-x-3">
                                    <span className="font-bold text-maroon-700 dark:text-maroon-400 min-w-[24px]">1.</span>
                                    <p>I am aware that EARISTAA has collected and stored my personal data during Graduation Process. These data include my demographic profile, contact details like address/email, landline/mobile numbers.</p>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <span className="font-bold text-maroon-700 dark:text-maroon-400 min-w-[24px]">2.</span>
                                    <p>I express my consent for EARISTAA to collect, use, record, disclose, transfer, store, organize update, monitor and/or process my personal information.</p>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <span className="font-bold text-maroon-700 dark:text-maroon-400 min-w-[24px]">3.</span>
                                    <p>I agree to personally update these data thru email request as needed.</p>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <span className="font-bold text-maroon-700 dark:text-maroon-400 min-w-[24px]">4.</span>
                                    <p>For the efficient management of the school records, I authorize EARISTAA to manage my data for sharing with accredited company/industry partners government agencies.</p>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <span className="font-bold text-maroon-700 dark:text-maroon-400 min-w-[24px]">5.</span>
                                    <p>To ensure the protection of my rights as a data subject, I understand that EARISTAA shall warrant to me the following Rights/:</p>
                                    <div className="ml-6 italic text-sm text-gray-600 dark:text-gray-400">
                                        Received notices on changes in the above-cited purposes for my data processing, or personal data breaches provided for in Section 39 of the Data Privacy Act's Implementing Guidelines;
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <span className="font-bold text-maroon-700 dark:text-maroon-400 min-w-[24px]">6.</span>
                                    <p>I hereby affirm my right to be informed, to access, and rectify and suspend and withdraw my personal data pursuant to the provision of the RA 10173 and its implementing rules and regulations.</p>
                                </div>
                            </div>

                            <div className="border-t-2 border-maroon-200 dark:border-gray-600 pt-3 mt-3">
                                <p className="text-gray-700 dark:text-gray-300 italic font-medium text-center text-sm">
                                    By clicking "I Agree" below, I warrant that I have read, understood all of the above provision, and agreed with its full implementation.
                                </p>
                            </div>
                        </div>

                        {/* Agree/Disagree Buttons */}
                        <div className="bg-gradient-to-r from-maroon-50 to-beige-50 dark:from-gray-800 dark:to-gray-800 border-2 border-maroon-300 dark:border-gray-600 rounded-lg p-3">
                            <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
                                <Button
                                    type="button"
                                    onClick={() => {
                                        // Redirect to landing page
                                        window.location.href = '/';
                                    }}
                                    variant="outline"
                                    className="flex-1 sm:flex-none border-2 border-red-500 text-red-700 hover:bg-red-50 hover:border-red-600 h-10 px-6 text-sm font-bold transition-all duration-300 min-w-[160px]"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    I Disagree
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        handleInputChange('dataPrivacyConsent', true);
                                        handleInputChange('dataPrivacyConsentDate', new Date().toISOString());
                                    }}
                                    className="flex-1 sm:flex-none bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-10 px-6 text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 min-w-[160px]"
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    I Agree
                                </Button>
                            </div>

                            {/* Consent Status Indicator */}
                            {formData.dataPrivacyConsent && (
                                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700 rounded-lg">
                                    <div className="flex items-center justify-center space-x-3">
                                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                            <CheckCircle className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-green-900 dark:text-green-200">Consent Granted</p>
                                            <p className="text-sm text-green-700 dark:text-green-400">You may now proceed to the next step.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && !formData.dataPrivacyConsent && (
                                <p className="text-sm text-red-600 flex items-center justify-center mt-4">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    {error}
                                </p>
                            )}
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="space-y-2">
                        <Label htmlFor={question.key} className="text-base font-medium text-maroon-800 dark:text-maroon-200">
                            {question.label}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <div className="relative">
                            <Input
                                id={question.key}
                                type={question.type}
                                value={value}
                                onChange={(e) => handleInputChange(question.key, e.target.value)}
                                className={cn(
                                    "border-beige-300 dark:border-gray-600 focus:border-maroon-500 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400",
                                    question.type === 'date' && "max-w-xs",
                                    question.key === 'email' && emailValidation.exists && "border-red-500 pr-10",
                                    question.key === 'email' && !emailValidation.exists && emailValidation.message && "border-green-500 pr-10",
                                    question.key === 'studentId' && studentIdValidation.exists && "border-red-500 pr-10",
                                    question.key === 'studentId' && !studentIdValidation.exists && studentIdValidation.message && "border-green-500 pr-10"
                                )}
                                placeholder={`Enter your ${question.label.toLowerCase()}`}
                                step={question.step}
                                min={question.min}
                                max={question.max}
                            />
                            {/* Email validation indicator */}
                            {question.key === 'email' && value && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    {emailValidation.checking && (
                                        <div className="h-4 w-4 border-2 border-maroon-600 border-t-transparent rounded-full animate-spin" />
                                    )}
                                    {!emailValidation.checking && emailValidation.exists && (
                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                    )}
                                    {!emailValidation.checking && !emailValidation.exists && emailValidation.message && (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    )}
                                </div>
                            )}
                            {/* Student ID validation indicator */}
                            {question.key === 'studentId' && value && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    {studentIdValidation.checking && (
                                        <div className="h-4 w-4 border-2 border-maroon-600 border-t-transparent rounded-full animate-spin" />
                                    )}
                                    {!studentIdValidation.checking && studentIdValidation.exists && (
                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                    )}
                                    {!studentIdValidation.checking && !studentIdValidation.exists && studentIdValidation.message && (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    )}
                                </div>
                            )}
                        </div>
                        {error && !question.key.includes('email') && <p className="text-sm text-red-600 flex items-center mt-1"><AlertCircle className="h-4 w-4 mr-1" />{error}</p>}
                        {/* Email validation message */}
                        {question.key === 'email' && !emailValidation.exists && emailValidation.message && !otpState.verified && (
                            <p className="text-sm mt-1 flex items-center text-green-600">
                                <CheckCircle className="h-4 w-4 mr-1" />{emailValidation.message}
                            </p>
                        )}
                        {question.key === 'email' && emailValidation.exists && (
                            <div className="mt-3 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl">
                                <div className="flex items-center mb-2">
                                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
                                    <span className="text-sm font-semibold text-red-800 dark:text-red-200">Email Already Registered</span>
                                </div>
                                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                                    This email is already associated with an existing account. You can log in or reset your password instead.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <a
                                        href="/login"
                                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-maroon-600 hover:bg-maroon-700 text-white transition-colors duration-200 shadow-sm"
                                    >
                                        <Lock className="w-4 h-4 mr-1.5" />
                                        Go to Login
                                    </a>
                                    <a
                                        href="/forgot-password"
                                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg border-2 border-maroon-300 dark:border-maroon-600 text-maroon-700 dark:text-maroon-300 hover:bg-maroon-50 dark:hover:bg-maroon-900/30 transition-colors duration-200"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-1.5" />
                                        Forgot Password?
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* OTP Verification Section */}
                        {question.key === 'email' && value && !emailValidation.exists && !emailValidation.checking && emailValidation.message && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-maroon-50 to-beige-50 dark:from-gray-700 dark:to-gray-700 rounded-xl border-2 border-maroon-200 dark:border-gray-600">
                                {!otpState.verified ? (
                                    <>
                                        <div className="flex items-center mb-3">
                                            <Mail className="h-5 w-5 text-maroon-600 dark:text-maroon-400 mr-2" />
                                            <span className="text-sm font-semibold text-maroon-800 dark:text-maroon-200">Email Verification Required</span>
                                        </div>

                                        {!otpState.sent ? (
                                            <div className="space-y-3">
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    We'll send a 6-digit verification code to <strong>{value}</strong>
                                                </p>
                                                <Button
                                                    type="button"
                                                    onClick={handleSendOtp}
                                                    disabled={otpState.sending}
                                                    className="bg-maroon-600 hover:bg-maroon-700 text-white h-10 px-4"
                                                >
                                                    {otpState.sending ? (
                                                        <>
                                                            <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                            Sending...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Mail className="h-4 w-4 mr-2" />
                                                            Send Verification Code
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Enter the 6-digit code sent to <strong>{value}</strong>
                                                </p>
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <div className="flex-1">
                                                        <Input
                                                            type="text"
                                                            value={otpState.code}
                                                            onChange={(e) => handleOtpChange(e.target.value)}
                                                            placeholder="Enter 6-digit code"
                                                            maxLength={6}
                                                            className={cn(
                                                                "text-center text-lg tracking-widest font-mono",
                                                                otpState.error && "border-red-500"
                                                            )}
                                                        />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        onClick={handleVerifyOtp}
                                                        disabled={otpState.verifying || otpState.code.length !== 6}
                                                        className="bg-green-600 hover:bg-green-700 text-white h-10 px-4"
                                                    >
                                                        {otpState.verifying ? (
                                                            <>
                                                                <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                Verifying...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                                Verify
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>

                                                {/* Resend OTP */}
                                                <div className="flex items-center justify-between pt-2">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        Didn't receive the code?
                                                    </span>
                                                    {otpState.countdown > 0 ? (
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            Resend in {otpState.countdown}s
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={handleSendOtp}
                                                            disabled={otpState.sending}
                                                            className="text-xs text-maroon-600 dark:text-maroon-400 hover:text-maroon-800 dark:hover:text-maroon-300 font-medium flex items-center"
                                                        >
                                                            <RefreshCw className="h-3 w-3 mr-1" />
                                                            Resend Code
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* OTP Status Message */}
                                        {otpState.message && (
                                            <p className={cn(
                                                "text-sm mt-3 flex items-center",
                                                otpState.error ? "text-red-600" : "text-green-600"
                                            )}>
                                                {otpState.error ? (
                                                    <AlertCircle className="h-4 w-4 mr-1" />
                                                ) : (
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                )}
                                                {otpState.message}
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex items-center text-green-600">
                                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                                            <CheckCircle className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">Email Verified!</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Your email has been successfully verified.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Student ID validation message */}
                        {question.key === 'studentId' && !error && studentIdValidation.message && (
                            <p className={cn(
                                "text-sm mt-1 flex items-center",
                                studentIdValidation.exists ? "text-red-600" : "text-green-600"
                            )}>
                                {studentIdValidation.exists ? (
                                    <><AlertCircle className="h-4 w-4 mr-1" />{studentIdValidation.message}</>
                                ) : (
                                    <><CheckCircle className="h-4 w-4 mr-1" />{studentIdValidation.message}</>
                                )}
                            </p>
                        )}
                    </div>
                );
        }
    };

    return (
        <>
            <Head title="Alumni Registration Survey" />

            <div className="min-h-screen bg-gradient-to-br from-maroon-50 via-beige-50 to-maroon-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-x-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-maroon-200 dark:bg-maroon-800 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-10 dark:opacity-20 animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-beige-200 dark:bg-gray-700 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-10 dark:opacity-20 animate-pulse" style={{ animationDelay: '3s' }}></div>
                </div>

                {/* Header */}
                <div className="bg-gradient-to-r from-maroon-800 to-maroon-900 text-white py-3 shadow-lg relative z-10">
                    <div className="container mx-auto px-4 max-w-7xl">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center flex-1 min-w-[200px]">
                                <div className="relative">
                                    <GraduationCap className="h-8 w-8 mr-3 relative z-10" />
                                </div>
                                <div>
                                    <h1 className="text-xl md:text-2xl font-bold tracking-tight">Alumni Tracer System</h1>
                                    <p className="text-maroon-200 text-xs md:text-sm">Registration & Career Survey</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/login"
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white border border-green-500 bg-green-600 text-white shadow-sm hover:bg-green-700 hover:border-green-400 h-8 px-3 py-1 cursor-pointer"
                                >
                                    <Lock className="w-3 h-3 mr-1" />
                                    Skip & Login
                                </Link>
                                <Link
                                    href="/"
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white border border-maroon-600 bg-transparent text-maroon-100 shadow-sm hover:bg-maroon-700 hover:text-white hover:border-white h-8 px-3 py-1 cursor-pointer"
                                >
                                    <ArrowLeft className="w-3 h-3 mr-1" />
                                    Back to Home
                                </Link>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="max-w-full mx-auto mt-3">
                            <div className="flex justify-between text-xs text-maroon-200 mb-2 font-medium">
                                <span className="flex items-center">
                                    <span className="w-5 h-5 bg-maroon-700 rounded-full flex items-center justify-center text-xs font-bold mr-2">
                                        {currentSection + 1}
                                    </span>
                                    Step {currentSection + 1} of {totalSections}
                                </span>
                                <span className="bg-maroon-700/50 px-2 py-0.5 rounded-full text-xs">{Math.round(progress)}% Complete</span>
                            </div>
                            <div className="relative">
                                <div className="h-2 bg-maroon-700/30 rounded-full overflow-hidden">
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
                <div className="container mx-auto px-4 py-4 relative z-10">
                    <div className="max-w-6xl mx-auto">
                        <Card className="border-maroon-200 dark:border-gray-700 shadow-lg bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-maroon-50 to-beige-50 dark:from-gray-800 dark:to-gray-800 border-b border-maroon-200 dark:border-gray-700 py-3 px-4">
                                <div className="flex items-start">
                                    <div className="w-12 h-12 bg-gradient-to-br from-maroon-600 to-maroon-700 rounded-xl flex items-center justify-center mr-3 shadow-lg flex-shrink-0">
                                        {React.createElement(currentSectionData.icon, {
                                            className: "h-6 w-6 text-white"
                                        })}
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-xl md:text-2xl text-maroon-900 dark:text-white font-bold mb-1">
                                            {currentSectionData.title}
                                        </CardTitle>
                                        <CardDescription className="text-maroon-600 dark:text-gray-400 text-sm">
                                            {currentSectionData.description}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-4 md:p-6">
                                <div className="space-y-8">
                                    {currentSectionData.questions.map((question) => {
                                        // For employment section, conditionally show fields based on employment status
                                        if (currentSectionData.id === 'employment') {
                                            // Always show "Are you presently employed?"
                                            if (question.key === 'presentlyEmployed') {
                                                // always visible
                                            }
                                            // Only show employment location when employed (Yes)
                                            else if (question.key === 'employmentLocation') {
                                                if (formData.presentlyEmployed !== 'Yes') return null;
                                            }
                                            // Only show "reason not employed" when not employed (No)
                                            else if (question.key === 'notEmployedReason') {
                                                if (formData.presentlyEmployed !== 'No') return null;
                                            }
                                            // Hide all other employment fields unless presently employed
                                            else {
                                                if (formData.presentlyEmployed !== 'Yes') return null;
                                            }
                                        }

                                        // For school information, conditionally show campusOther only if campus name contains "Others"
                                        if (currentSectionData.id === 'school' && question.key === 'campusOther') {
                                            const selectedCampus = campuses.find(c => c.id.toString() === formData.campusId);
                                            if (!selectedCampus || !selectedCampus.name.toLowerCase().includes('other')) {
                                                return null;
                                            }
                                        }

                                        // For personal information, conditionally show maiden name only for females
                                        if (currentSectionData.id === 'personal' && question.key === 'maidenName') {
                                            if (formData.gender !== 'Female') {
                                                return null;
                                            }
                                        }

                                        // For personal information, conditionally show spouse name only for married
                                        if (currentSectionData.id === 'personal' && question.key === 'spouseName') {
                                            if (formData.civilStatus !== 'Married') {
                                                return null;
                                            }
                                        }

                                        // For employment, conditionally show businessOther only if "Others" is selected in majorLineOfBusiness
                                        if (currentSectionData.id === 'employment' && question.key === 'businessOther') {
                                            if (!formData.majorLineOfBusiness || !formData.majorLineOfBusiness.toLowerCase().includes('other')) {
                                                return null;
                                            }
                                        }

                                        return (
                                            <div key={question.key} className="animate-fade-in">
                                                {renderQuestion(question)}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Submission Status */}
                                {submissionStatus !== 'idle' && (
                                    <div className={`mt-8 p-5 rounded-xl flex items-start space-x-4 animate-fade-in shadow-lg ${submissionStatus === 'success'
                                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-300 dark:border-green-700'
                                        : submissionStatus === 'error'
                                            ? 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border-2 border-red-300 dark:border-red-700'
                                            : 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-2 border-blue-300 dark:border-blue-700'
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
                                                ? 'text-green-900 dark:text-green-200'
                                                : submissionStatus === 'error'
                                                    ? 'text-red-900 dark:text-red-200'
                                                    : 'text-blue-900 dark:text-blue-200'
                                                }`}>
                                                {submissionStatus === 'submitting' && 'Processing your registration...'}
                                                {submissionStatus === 'success' && 'Registration Successful!'}
                                                {submissionStatus === 'error' && 'Registration Failed'}
                                            </p>
                                            {submissionMessage && (
                                                <p className={`text-sm mt-2 leading-relaxed ${submissionStatus === 'success'
                                                    ? 'text-green-800 dark:text-green-300'
                                                    : submissionStatus === 'error'
                                                        ? 'text-red-800 dark:text-red-300'
                                                        : 'text-blue-800 dark:text-blue-300'
                                                    }`}>
                                                    {submissionMessage}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Buttons */}
                                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-10 pt-8 border-t-2 border-maroon-100 dark:border-gray-700">
                                    <Button
                                        onClick={handlePrevious}
                                        disabled={currentSection === 0 || isSubmitting}
                                        variant="outline"
                                        className="border-2 border-maroon-300 dark:border-gray-600 text-maroon-700 dark:text-gray-300 hover:bg-maroon-50 dark:hover:bg-gray-700 hover:border-maroon-500 disabled:opacity-50 h-12 px-6 text-base font-semibold transition-all duration-300 order-2 sm:order-1"
                                    >
                                        <ArrowLeft className="w-5 h-5 mr-2" />
                                        Previous
                                    </Button>

                                    {currentSection < totalSections - 1 ? (
                                        (() => {
                                            // Determine if the "Next" button should be disabled
                                            const privacyBlocked = currentSection === 0 && !formData.dataPrivacyConsent;
                                            const emailBlocked = currentSection === 1 && formData.email && !otpState.verified;
                                            const emailDuplicate = currentSection === 1 && emailValidation.exists;
                                            const phoneDuplicate = currentSection === 1 && phoneValidation.exists;
                                            const studentIdDuplicate = currentSection === 7 && studentIdValidation.exists;
                                            const duplicateBlocked = emailDuplicate || phoneDuplicate || studentIdDuplicate;
                                            const nextDisabled = isSubmitting || privacyBlocked || !!emailBlocked || duplicateBlocked;

                                            return (
                                                <div className="flex flex-col items-end space-y-1 order-1 sm:order-2">
                                                    <Button
                                                        onClick={handleNext}
                                                        disabled={nextDisabled}
                                                        className={`h-12 px-8 text-base font-semibold shadow-lg transition-all duration-300 ${nextDisabled
                                                            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed shadow-none'
                                                            : 'bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-700 hover:to-maroon-800 text-white hover:shadow-xl'
                                                            }`}
                                                    >
                                                        Next Step
                                                        <ArrowRight className="w-5 h-5 ml-2" />
                                                    </Button>
                                                    {privacyBlocked && (
                                                        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center">
                                                            <AlertCircle className="w-3 h-3 mr-1" />
                                                            Please agree to the Data Privacy Consent first
                                                        </p>
                                                    )}
                                                    {emailBlocked && !emailDuplicate && (
                                                        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center">
                                                            <AlertCircle className="w-3 h-3 mr-1" />
                                                            Please verify your email before proceeding
                                                        </p>
                                                    )}
                                                    {emailDuplicate && (
                                                        <p className="text-xs text-red-600 dark:text-red-400 flex items-center">
                                                            <AlertCircle className="w-3 h-3 mr-1" />
                                                            Email is already registered — use a different email
                                                        </p>
                                                    )}
                                                    {phoneDuplicate && (
                                                        <p className="text-xs text-red-600 dark:text-red-400 flex items-center">
                                                            <AlertCircle className="w-3 h-3 mr-1" />
                                                            Phone number is already registered
                                                        </p>
                                                    )}
                                                    {studentIdDuplicate && (
                                                        <p className="text-xs text-red-600 dark:text-red-400 flex items-center">
                                                            <AlertCircle className="w-3 h-3 mr-1" />
                                                            Student ID is already registered
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <div className="flex flex-col items-stretch sm:items-end space-y-3 order-1 sm:order-2">
                                            {submissionStatus === 'success' && (
                                                <p className="text-sm text-green-600 text-center sm:text-right font-medium flex items-center justify-center sm:justify-end">
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    Redirecting to login page...
                                                </p>
                                            )}
                                            {studentIdValidation.exists && (
                                                <p className="text-xs text-red-600 dark:text-red-400 flex items-center justify-center sm:justify-end">
                                                    <AlertCircle className="w-3 h-3 mr-1" />
                                                    Student ID is already registered — please use a different one
                                                </p>
                                            )}
                                            <Button
                                                onClick={handleSubmit}
                                                disabled={isSubmitting || submissionStatus === 'success' || studentIdValidation.exists}
                                                className={`h-12 px-8 text-base font-bold shadow-lg transition-all duration-300 min-w-[220px] ${studentIdValidation.exists
                                                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed shadow-none'
                                                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:opacity-50 hover:shadow-xl'
                                                    }`}
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
                            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-6 py-4 rounded-full shadow-lg border-2 border-maroon-200 dark:border-gray-700">
                                <div className="flex space-x-3">
                                    {sections.map((section, index) => {
                                        // Prevent jumping ahead if privacy not agreed, email not verified, or duplicates found
                                        const canNavigate = (() => {
                                            if (index <= currentSection) return true; // Can always go back
                                            if (!formData.dataPrivacyConsent) return false; // Privacy not agreed
                                            if (index > 1 && formData.email && !otpState.verified) return false; // Email not verified
                                            if (index > 1 && emailValidation.exists) return false; // Duplicate email
                                            if (index > 1 && phoneValidation.exists) return false; // Duplicate phone
                                            if (index > 7 && studentIdValidation.exists) return false; // Duplicate student ID
                                            return true;
                                        })();

                                        return (
                                            <button
                                                key={section.id}
                                                onClick={() => canNavigate && setCurrentSection(index)}
                                                disabled={!canNavigate}
                                                className={`transition-all duration-300 rounded-full ${!canNavigate
                                                    ? 'w-4 h-4 bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-50'
                                                    : index === currentSection
                                                        ? 'w-10 h-4 bg-gradient-to-r from-maroon-600 to-maroon-700 shadow-md'
                                                        : index < currentSection
                                                            ? 'w-4 h-4 bg-maroon-400 hover:bg-maroon-500'
                                                            : 'w-4 h-4 bg-beige-300 dark:bg-gray-600 hover:bg-beige-400 dark:hover:bg-gray-500'
                                                    }`}
                                                title={section.title}
                                                aria-label={`Go to ${section.title}`}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Help Text */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-maroon-600 dark:text-gray-400">
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