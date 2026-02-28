import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import axios from 'axios';
import {
    GraduationCap, ArrowLeft, ArrowRight, User, Briefcase, Heart, Lock,
    CheckCircle, AlertCircle, Eye, EyeOff, Shield, Sparkles, Building,
    Mail, RefreshCw, X, Award, School, ChevronDown, Loader2, Check,
    Phone, MapPin, Calendar, Hash, FileText
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SurveyData {
    dataPrivacyConsent: boolean;
    dataPrivacyConsentDate: string;
    firstName: string;
    lastName: string;
    maidenName: string;
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
    examinations: Array<{ name: string; place: string; dateTaken: string; rating: string }>;
    presentlyEmployed: string;
    employmentLocation: string;
    notEmployedReason: string;
    companyName: string;
    companyAddress: string;
    presentPosition: string;
    dateHired: string;
    yearsOfService: string;
    jobAlignedToCourse: string;
    averageMonthlyIncome: string;
    employmentStatus: string;
    jobLevelPosition: string;
    majorLineOfBusiness: string;
    businessOther: string;
    achievements: string;
    aboutMe: string;
    studentId: string;
    password: string;
    confirmPassword: string;
}

interface Campus { id: number; name: string; code: string; display_name: string; }
interface Department { id: number; name: string; code: string; campus_id?: number; }
interface Course { id: number; name: string; code: string; department_id: number; }

// ─── Step definitions ────────────────────────────────────────────────────────

const steps = [
    { id: 'privacy',      title: 'Data Privacy',      icon: Shield },
    { id: 'personal',     title: 'Personal Info',      icon: User },
    { id: 'school',       title: 'School Info',        icon: School },
    { id: 'eligibility',  title: 'Eligibility',        icon: Award },
    { id: 'employment',   title: 'Employment',         icon: Briefcase },
    { id: 'extras',       title: 'Achievements & Bio', icon: Heart },
    { id: 'account',      title: 'Account Setup',      icon: Lock },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function SurveyRegistration({ surveyId = 1 }: { surveyId?: number }) {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState<SurveyData>({
        dataPrivacyConsent: false, dataPrivacyConsentDate: '',
        firstName: '', lastName: '', maidenName: '', age: '', gender: '',
        placeOfBirth: '', civilStatus: '', spouseName: '', numberOfChildren: '',
        residenceAddress: '', telNo: '', mobileNo: '', email: '',
        campusId: '', campus: '', campusOther: '', departmentId: '',
        courseId: '', course: '', major: '', yearGraduated: '', enrollmentYear: '',
        honorsAwards: '', examinations: [],
        presentlyEmployed: '', employmentLocation: '', notEmployedReason: '',
        companyName: '', companyAddress: '', presentPosition: '', dateHired: '',
        yearsOfService: '', jobAlignedToCourse: '', averageMonthlyIncome: '',
        employmentStatus: '', jobLevelPosition: '', majorLineOfBusiness: '',
        businessOther: '', achievements: '', aboutMe: '',
        studentId: '', password: '', confirmPassword: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [responseToken, setResponseToken] = useState<string | null>(null);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [submissionMessage, setSubmissionMessage] = useState('');
    const contentRef = useRef<HTMLDivElement>(null);

    // Validation states
    const [emailValidation, setEmailValidation] = useState<{ checking: boolean; exists: boolean; message: string }>({ checking: false, exists: false, message: '' });
    const [studentIdValidation, setStudentIdValidation] = useState<{ checking: boolean; exists: boolean; message: string }>({ checking: false, exists: false, message: '' });
    const [phoneValidation, setPhoneValidation] = useState<{ checking: boolean; exists: boolean; field: string; message: string }>({ checking: false, exists: false, field: '', message: '' });

    // OTP
    const [otpState, setOtpState] = useState<{
        sent: boolean; verified: boolean; sending: boolean; verifying: boolean;
        code: string; message: string; error: boolean; countdown: number;
    }>({ sent: false, verified: false, sending: false, verifying: false, code: '', message: '', error: false, countdown: 0 });

    // Academic data
    const [campuses, setCampuses] = useState<Campus[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loadingCampuses, setLoadingCampuses] = useState(false);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [loadingCourses, setLoadingCourses] = useState(false);

    // ─── Effects ─────────────────────────────────────────────────────────────

    useEffect(() => {
        document.documentElement.classList.add('public-page');
        return () => { document.documentElement.classList.remove('public-page'); };
    }, []);

    useEffect(() => {
        if (otpState.countdown > 0) {
            const t = setTimeout(() => setOtpState(p => ({ ...p, countdown: p.countdown - 1 })), 1000);
            return () => clearTimeout(t);
        }
    }, [otpState.countdown]);

    // Fetch campuses
    useEffect(() => {
        (async () => {
            try {
                setLoadingCampuses(true);
                const r = await axios.get('/api/v1/campuses');
                if (r.data.success) setCampuses(r.data.data || []);
            } catch { /* ignore */ } finally { setLoadingCampuses(false); }
        })();
    }, []);

    // Fetch departments when campus changes
    useEffect(() => {
        if (!formData.campusId) { setDepartments([]); return; }
        (async () => {
            try {
                setLoadingDepartments(true);
                const r = await axios.get('/api/v1/admin/departments/active', { params: { campus_id: formData.campusId } });
                if (r.data.success) setDepartments(r.data.data || []);
            } catch { /* ignore */ } finally { setLoadingDepartments(false); }
        })();
    }, [formData.campusId]);

    // Fetch courses when department changes
    useEffect(() => {
        if (!formData.departmentId) { setCourses([]); return; }
        (async () => {
            try {
                setLoadingCourses(true);
                const r = await axios.get(`/api/v1/admin/departments/${formData.departmentId}/courses`);
                if (r.data.success) setCourses(r.data.data || []);
            } catch { setCourses([]); } finally { setLoadingCourses(false); }
        })();
    }, [formData.departmentId]);

    // Debounced email check
    useEffect(() => {
        if (!formData.email || !formData.email.includes('@')) {
            setEmailValidation({ checking: false, exists: false, message: '' });
            return;
        }
        setEmailValidation({ checking: true, exists: false, message: 'Checking...' });
        const t = setTimeout(async () => {
            try {
                const r = await axios.post('/api/v1/check-email', { email: formData.email });
                setEmailValidation(r.data.exists
                    ? { checking: false, exists: true, message: 'Email already registered' }
                    : { checking: false, exists: false, message: 'Available' });
            } catch { setEmailValidation({ checking: false, exists: false, message: '' }); }
        }, 800);
        return () => clearTimeout(t);
    }, [formData.email]);

    // Debounced student ID check
    useEffect(() => {
        if (!formData.studentId || formData.studentId.length < 3) {
            setStudentIdValidation({ checking: false, exists: false, message: '' });
            return;
        }
        setStudentIdValidation({ checking: true, exists: false, message: 'Checking...' });
        const t = setTimeout(async () => {
            try {
                const r = await axios.post('/api/v1/check-student-id', { student_id: formData.studentId });
                setStudentIdValidation(r.data.exists
                    ? { checking: false, exists: true, message: 'Student ID already registered' }
                    : { checking: false, exists: false, message: 'Available' });
            } catch { setStudentIdValidation({ checking: false, exists: false, message: '' }); }
        }, 800);
        return () => clearTimeout(t);
    }, [formData.studentId]);

    // Debounced phone check
    useEffect(() => {
        const phone = formData.mobileNo || formData.telNo;
        if (!phone || phone.length < 7) {
            setPhoneValidation({ checking: false, exists: false, field: '', message: '' });
            return;
        }
        setPhoneValidation({ checking: true, exists: false, field: '', message: 'Checking...' });
        const t = setTimeout(async () => {
            try {
                const r = await axios.post('/api/v1/check-phone', { phone });
                setPhoneValidation(r.data.exists
                    ? { checking: false, exists: true, field: formData.mobileNo ? 'mobileNo' : 'telNo', message: 'Phone already registered' }
                    : { checking: false, exists: false, field: '', message: '' });
            } catch { setPhoneValidation({ checking: false, exists: false, field: '', message: '' }); }
        }, 800);
        return () => clearTimeout(t);
    }, [formData.telNo, formData.mobileNo]);

    // ─── Handlers ────────────────────────────────────────────────────────────

    const set = useCallback((key: string, value: string | boolean | SurveyData['examinations']) => {
        setFormData(prev => {
            if (key === 'campusId') {
                const c = campuses.find(c => c.id.toString() === value);
                return { ...prev, campusId: value as string, campus: c?.name || '', departmentId: '', courseId: '' };
            }
            if (key === 'departmentId') return { ...prev, departmentId: value as string, courseId: '' };
            if (key === 'courseId') {
                const c = courses.find(c => c.id.toString() === value);
                return { ...prev, courseId: value as string, course: c?.name || '', major: c?.name || '' };
            }
            return { ...prev, [key]: value } as SurveyData;
        });
        if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
        if (key === 'email') setOtpState({ sent: false, verified: false, sending: false, verifying: false, code: '', message: '', error: false, countdown: 0 });
    }, [errors, campuses, courses]);

    const handleSendOtp = useCallback(async () => {
        if (!formData.email || !formData.email.includes('@') || emailValidation.exists || emailValidation.checking) return;
        setOtpState(p => ({ ...p, sending: true, message: '', error: false }));
        try {
            const r = await axios.post('/api/v1/otp/send', { email: formData.email, purpose: 'registration' });
            if (r.data.success) setOtpState(p => ({ ...p, sent: true, sending: false, message: 'Code sent! Check your inbox.', error: false, countdown: 60 }));
        } catch (e: unknown) {
            let msg = 'Failed to send code.';
            if (e && typeof e === 'object' && 'response' in e) {
                const ax = e as { response?: { status?: number; data?: { message?: string } } };
                msg = ax.response?.data?.message || msg;
            }
            setOtpState(p => ({ ...p, sending: false, message: msg, error: true }));
        }
    }, [formData.email, emailValidation.exists, emailValidation.checking]);

    const handleVerifyOtp = useCallback(async () => {
        if (!otpState.code || otpState.code.length !== 6) { setOtpState(p => ({ ...p, message: 'Enter 6-digit code', error: true })); return; }
        setOtpState(p => ({ ...p, verifying: true, message: '', error: false }));
        try {
            const r = await axios.post('/api/v1/otp/verify', { email: formData.email, otp: otpState.code, purpose: 'registration' });
            if (r.data.success && r.data.verified) setOtpState(p => ({ ...p, verified: true, verifying: false, message: 'Email verified!', error: false }));
        } catch (e: unknown) {
            let msg = 'Invalid or expired code.';
            if (e && typeof e === 'object' && 'response' in e) {
                const ax = e as { response?: { status?: number; data?: { message?: string } } };
                msg = ax.response?.data?.message || msg;
            }
            setOtpState(p => ({ ...p, verifying: false, message: msg, error: true }));
        }
    }, [formData.email, otpState.code]);

    // ─── Validation ──────────────────────────────────────────────────────────

    const validateStep = useCallback((s: number): boolean => {
        const errs: Record<string, string> = {};

        if (s === 0) {
            if (!formData.dataPrivacyConsent) errs.dataPrivacyConsent = 'You must agree to proceed';
        }
        if (s === 1) {
            if (!formData.firstName.trim()) errs.firstName = 'First name is required';
            if (!formData.lastName.trim()) errs.lastName = 'Last name is required';
            if (!formData.email.trim()) errs.email = 'Email is required';
            else if (emailValidation.exists) errs.email = 'Email already registered';
            else if (!otpState.verified) errs.email = 'Please verify your email';
            if (phoneValidation.exists) {
                if (formData.mobileNo && phoneValidation.field === 'mobileNo') errs.mobileNo = 'Phone already registered';
                if (formData.telNo && phoneValidation.field === 'telNo') errs.telNo = 'Phone already registered';
            }
        }
        if (s === 2) {
            if (!formData.campusId) errs.campusId = 'Campus is required';
            if (!formData.departmentId) errs.departmentId = 'Department is required';
            if (!formData.courseId) errs.courseId = 'Course is required';
            if (!formData.yearGraduated) errs.yearGraduated = 'Year graduated is required';
        }
        if (s === 4) {
            if (!formData.presentlyEmployed) errs.presentlyEmployed = 'Please select';
        }
        if (s === 6) {
            if (!formData.studentId.trim()) errs.studentId = 'Student ID is required';
            else if (studentIdValidation.exists) errs.studentId = 'Student ID already registered';
            if (!formData.password) errs.password = 'Password is required';
            else if (formData.password.length < 8) errs.password = 'Min 8 characters';
            else {
                if (!/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) || !/[0-9]/.test(formData.password))
                    errs.password = 'Must have uppercase, lowercase, and number';
            }
            if (!formData.confirmPassword) errs.confirmPassword = 'Confirm your password';
            else if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    }, [formData, emailValidation.exists, otpState.verified, phoneValidation, studentIdValidation.exists]);

    const goNext = useCallback(() => {
        if (validateStep(step) && step < steps.length - 1) {
            setStep(s => s + 1);
            contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [step, validateStep]);

    const goPrev = useCallback(() => {
        if (step > 0) {
            setStep(s => s - 1);
            contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [step]);

    const goToStep = useCallback((target: number) => {
        if (target <= step) { setStep(target); return; }
        for (let i = step; i < target; i++) {
            if (!validateStep(i)) { setStep(i); return; }
        }
        setStep(target);
    }, [step, validateStep]);

    // ─── Submit ──────────────────────────────────────────────────────────────

    const handleSubmit = useCallback(async () => {
        if (!validateStep(step)) return;
        setIsSubmitting(true);
        setSubmissionStatus('submitting');

        try {
            // Start survey
            let token = responseToken;
            if (!token) {
                const r = await axios.post(`/api/v1/surveys/${surveyId}/start`);
                token = r.data.data.response_token;
                setResponseToken(token);
            }

            // Fetch questions & submit answers
            const surveyRes = await axios.get(`/api/v1/surveys/${surveyId}`);
            const surveyQuestions = surveyRes.data?.data?.survey?.questions || [];

            const answerMap: Record<string, string> = {
                'first name': 'firstName', 'last name': 'lastName',
                'student id': 'studentId', 'student number': 'studentId',
                'email': 'email', 'email address': 'email',
                'phone': 'mobileNo', 'phone number': 'mobileNo',
                'mobile': 'mobileNo', 'mobile no': 'mobileNo',
                'tel': 'telNo', 'telephone': 'telNo',
                'gender': 'gender', 'age': 'age',
                'place of birth': 'placeOfBirth',
                'civil status': 'civilStatus', 'civil_status': 'civilStatus',
                'maiden name': 'maidenName',
                'spouse': 'spouseName', 'spouse name': 'spouseName',
                'children': 'numberOfChildren', 'number of children': 'numberOfChildren',
                'address': 'residenceAddress', 'residence': 'residenceAddress', 'mailing address': 'residenceAddress',
                'campus': 'campus', 'department': 'departmentId',
                'course': 'course', 'program': 'course', 'major': 'major',
                'year graduated': 'yearGraduated', 'graduation year': 'yearGraduated',
                'enrollment year': 'enrollmentYear',
                'honors': 'honorsAwards', 'awards': 'honorsAwards',
                'presently employed': 'presentlyEmployed', 'employed': 'presentlyEmployed',
                'employment location': 'employmentLocation', 'local or abroad': 'employmentLocation', 'where are you employed': 'employmentLocation',
                'company': 'companyName', 'company name': 'companyName', 'company address': 'companyAddress',
                'position': 'presentPosition', 'present position': 'presentPosition', 'job title': 'presentPosition',
                'date hired': 'dateHired', 'years of service': 'yearsOfService',
                'job aligned': 'jobAlignedToCourse',
                'monthly income': 'averageMonthlyIncome', 'income': 'averageMonthlyIncome',
                'employment status': 'employmentStatus',
                'job level': 'jobLevelPosition',
                'line of business': 'majorLineOfBusiness',
                'achievements': 'achievements', 'about me': 'aboutMe',
            };

            for (const q of surveyQuestions) {
                const qt = (q.question_text || '').toLowerCase().trim();
                let fk: string | undefined;
                for (const [pat, key] of Object.entries(answerMap)) {
                    if (qt.includes(pat)) { fk = key; break; }
                }
                if (fk) {
                    const ans = formData[fk as keyof SurveyData];
                    if (ans) {
                        try {
                            await axios.post(`/api/v1/surveys/${surveyId}/answer`, {
                                response_token: token,
                                question_id: q.id,
                                answer: typeof ans === 'object' ? JSON.stringify(ans) : ans
                            });
                        } catch { /* non-critical */ }
                    }
                }
            }

            // Complete survey & create account
            await axios.post(`/api/v1/surveys/${surveyId}/complete`, {
                response_token: token,
                email: formData.email,
                password: formData.password,
                profile_data: {
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    maiden_name: formData.maidenName,
                    student_id: formData.studentId,
                    phone: formData.mobileNo,
                    tel_no: formData.telNo,
                    gender: formData.gender,
                    age: formData.age,
                    place_of_birth: formData.placeOfBirth,
                    civil_status: formData.civilStatus,
                    spouse_name: formData.spouseName,
                    number_of_children: formData.numberOfChildren,
                    current_address: formData.residenceAddress,
                    campus_id: formData.campusId || null,
                    department_id: formData.departmentId || null,
                    course_id: formData.courseId || null,
                    degree_program: formData.course,
                    major: formData.major,
                    graduation_year: formData.yearGraduated,
                    enrollment_year: formData.enrollmentYear,
                    honors_awards: formData.honorsAwards,
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
            setSubmissionMessage('Registration completed! Redirecting to login...');
            setTimeout(() => { window.location.href = '/login'; }, 3000);
        } catch (error: unknown) {
            console.error('Registration failed:', error);
            setSubmissionStatus('error');
            if (error && typeof error === 'object' && 'response' in error) {
                const ax = error as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } };
                if (ax.response?.status === 409) {
                    setSubmissionMessage(ax.response?.data?.message || 'Email already registered.');
                } else if (ax.response?.status === 422 && ax.response?.data?.errors) {
                    setSubmissionMessage(Object.entries(ax.response.data.errors).map(([f, m]) => `${f}: ${m.join(', ')}`).join('\n'));
                } else {
                    setSubmissionMessage(ax.response?.data?.message || 'Registration failed. Please try again.');
                }
            } else {
                setSubmissionMessage('Registration failed. Check your connection.');
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, validateStep, step, surveyId, responseToken]);

    // ─── Reusable UI pieces ──────────────────────────────────────────────────

    const fieldClass = "w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500 dark:text-gray-100 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500";
    const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
    const errorClass = "text-xs text-red-500 mt-1 flex items-center gap-1";

    const FieldError = ({ msg }: { msg?: string }) => msg ? <p className={errorClass}><AlertCircle className="h-3 w-3 shrink-0" />{msg}</p> : null;

    const ValidationBadge = ({ checking, exists, message }: { checking: boolean; exists: boolean; message: string }) => {
        if (!message) return null;
        if (checking) return <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Loader2 className="h-3 w-3 animate-spin" />{message}</span>;
        if (exists) return <span className="text-xs text-red-500 flex items-center gap-1 mt-0.5"><AlertCircle className="h-3 w-3" />{message}</span>;
        return <span className="text-xs text-green-600 flex items-center gap-1 mt-0.5"><CheckCircle className="h-3 w-3" />{message}</span>;
    };

    // Inline radio pill selector
    const InlineRadio = ({ name, options, value, onChange }: { name: string; options: string[]; value: string; onChange: (v: string) => void }) => (
        <RadioGroup value={value} onValueChange={onChange} className="flex flex-wrap gap-2">
            {options.map(opt => (
                <label key={opt} className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-all select-none",
                    value === opt
                        ? "bg-maroon-600 text-white border-maroon-600 shadow-sm"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-maroon-400 hover:bg-maroon-50 dark:hover:bg-gray-700"
                )}>
                    <RadioGroupItem value={opt} id={`${name}-${opt}`} className="sr-only" />
                    {opt}
                </label>
            ))}
        </RadioGroup>
    );

    // Select with chevron
    const SelectField = ({ value, onChange, disabled, children, className: cls }: { value: string; onChange: (v: string) => void; disabled?: boolean; children: React.ReactNode; className?: string }) => (
        <div className="relative">
            <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} className={cn(fieldClass, "appearance-none cursor-pointer pr-8 disabled:opacity-50 disabled:cursor-not-allowed", cls)}>
                {children}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
    );

    // ─── Step Content ────────────────────────────────────────────────────────

    const renderStep = () => {
        switch (step) {
            // ── Privacy ──────────────────────────────────────────────────
            case 0:
                return (
                    <div className="space-y-4">
                        <div className="bg-gradient-to-r from-maroon-600 to-maroon-700 text-white p-4 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-full"><Shield className="h-5 w-5" /></div>
                                <div>
                                    <h3 className="font-bold">Data Privacy Consent Form</h3>
                                    <p className="text-maroon-100 text-xs mt-0.5">RA 10173 — Data Privacy Act of 2012</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300 space-y-2 leading-relaxed">
                            <p className="italic font-medium text-gray-600 dark:text-gray-400">In accordance with RA 10173, I consent to the following:</p>
                            {[
                                'I am aware that EARISTAA has collected and stored my personal data during Graduation Process including demographic profile and contact details.',
                                'I consent for EARISTAA to collect, use, record, disclose, transfer, store, organize, update, monitor and/or process my personal information.',
                                'I agree to personally update these data thru email request as needed.',
                                'I authorize EARISTAA to manage my data for sharing with accredited partners and government agencies.',
                                'I understand that EARISTAA shall warrant to me the right to receive notices on changes in data processing or personal data breaches.',
                                'I affirm my right to be informed, to access, rectify, suspend and withdraw my personal data pursuant to RA 10173.'
                            ].map((text, i) => (
                                <div key={i} className="flex gap-2">
                                    <span className="font-bold text-maroon-600 dark:text-maroon-400 shrink-0 w-5 text-right">{i + 1}.</span>
                                    <p>{text}</p>
                                </div>
                            ))}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-2">
                                <p className="italic text-center text-xs text-gray-500 dark:text-gray-400">
                                    By clicking "I Agree" below, I warrant that I have read, understood and agreed to all provisions above.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                onClick={() => { window.location.href = '/'; }}
                                variant="outline"
                                className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-11 font-semibold"
                            >
                                <X className="w-4 h-4 mr-2" />I Disagree
                            </Button>
                            <Button
                                type="button"
                                onClick={() => { set('dataPrivacyConsent', true); set('dataPrivacyConsentDate', new Date().toISOString()); }}
                                className={cn(
                                    "flex-1 h-11 font-semibold transition-all",
                                    formData.dataPrivacyConsent
                                        ? "bg-green-600 hover:bg-green-700 text-white"
                                        : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                                )}
                            >
                                {formData.dataPrivacyConsent
                                    ? <><Check className="w-4 h-4 mr-2" />Consent Granted</>
                                    : <><CheckCircle className="w-4 h-4 mr-2" />I Agree</>
                                }
                            </Button>
                        </div>
                        <FieldError msg={errors.dataPrivacyConsent} />
                    </div>
                );

            // ── Personal Info ────────────────────────────────────────────
            case 1:
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>First Name <span className="text-red-500">*</span></label>
                                <Input value={formData.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Juan" className={fieldClass} />
                                <FieldError msg={errors.firstName} />
                            </div>
                            <div>
                                <label className={labelClass}>Last Name <span className="text-red-500">*</span></label>
                                <Input value={formData.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Dela Cruz" className={fieldClass} />
                                <FieldError msg={errors.lastName} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Gender</label>
                                <InlineRadio name="gender" options={['Male', 'Female']} value={formData.gender} onChange={v => set('gender', v)} />
                            </div>
                            <div>
                                <label className={labelClass}>Civil Status</label>
                                <InlineRadio name="civilStatus" options={['Single', 'Married', 'Separated', 'Widowed']} value={formData.civilStatus} onChange={v => set('civilStatus', v)} />
                            </div>
                        </div>

                        {formData.gender === 'Female' && formData.civilStatus === 'Married' && (
                            <div>
                                <label className={labelClass}>Maiden Name</label>
                                <Input value={formData.maidenName} onChange={e => set('maidenName', e.target.value)} placeholder="Pre-marital last name" className={fieldClass} />
                            </div>
                        )}
                        {formData.civilStatus === 'Married' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Spouse Name</label>
                                    <Input value={formData.spouseName} onChange={e => set('spouseName', e.target.value)} className={fieldClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>No. of Children</label>
                                    <Input type="number" value={formData.numberOfChildren} onChange={e => set('numberOfChildren', e.target.value)} className={fieldClass} />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Age</label>
                                <Input type="number" value={formData.age} onChange={e => set('age', e.target.value)} placeholder="25" className={fieldClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Place of Birth</label>
                                <Input value={formData.placeOfBirth} onChange={e => set('placeOfBirth', e.target.value)} placeholder="Manila, Philippines" className={fieldClass} />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}><MapPin className="inline h-3.5 w-3.5 mr-1" />Residence / Mailing Address</label>
                            <Textarea value={formData.residenceAddress} onChange={e => set('residenceAddress', e.target.value)} placeholder="Complete address" className={cn(fieldClass, "min-h-[60px]")} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}><Phone className="inline h-3.5 w-3.5 mr-1" />Tel. No.</label>
                                <Input value={formData.telNo} onChange={e => set('telNo', e.target.value)} type="tel" className={fieldClass} />
                                <FieldError msg={errors.telNo} />
                            </div>
                            <div>
                                <label className={labelClass}><Phone className="inline h-3.5 w-3.5 mr-1" />Mobile No.</label>
                                <Input value={formData.mobileNo} onChange={e => set('mobileNo', e.target.value)} type="tel" placeholder="09XX XXX XXXX" className={fieldClass} />
                                <FieldError msg={errors.mobileNo} />
                                {phoneValidation.message && <ValidationBadge {...phoneValidation} />}
                            </div>
                        </div>

                        {/* Email + OTP */}
                        <div>
                            <label className={labelClass}><Mail className="inline h-3.5 w-3.5 mr-1" />Email <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Input
                                    value={formData.email}
                                    onChange={e => set('email', e.target.value)}
                                    type="email"
                                    placeholder="alumni@email.com"
                                    className={cn(fieldClass, "pr-9", emailValidation.exists && "border-red-400", !emailValidation.exists && emailValidation.message && !emailValidation.checking && "border-green-400")}
                                />
                                {formData.email && (
                                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                        {emailValidation.checking && <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />}
                                        {!emailValidation.checking && emailValidation.exists && <AlertCircle className="h-4 w-4 text-red-500" />}
                                        {!emailValidation.checking && !emailValidation.exists && emailValidation.message && <CheckCircle className="h-4 w-4 text-green-500" />}
                                    </div>
                                )}
                            </div>
                            <ValidationBadge {...emailValidation} />
                            <FieldError msg={errors.email} />

                            {emailValidation.exists && (
                                <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-sm">
                                    <p className="text-red-700 dark:text-red-300 mb-2">This email is already registered.</p>
                                    <div className="flex gap-2">
                                        <a href="/login" className="px-3 py-1.5 text-xs font-medium rounded-lg bg-maroon-600 text-white hover:bg-maroon-700 transition-colors"><Lock className="inline h-3 w-3 mr-1" />Login</a>
                                        <a href="/forgot-password" className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"><RefreshCw className="inline h-3 w-3 mr-1" />Forgot Password</a>
                                    </div>
                                </div>
                            )}

                            {formData.email && !emailValidation.exists && !emailValidation.checking && emailValidation.message && (
                                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                                    {otpState.verified ? (
                                        <div className="flex items-center gap-2 text-green-600">
                                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"><Check className="h-3.5 w-3.5 text-white" /></div>
                                            <span className="text-sm font-medium">Email verified!</span>
                                        </div>
                                    ) : !otpState.sent ? (
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Verify your email to continue</p>
                                            <Button type="button" onClick={handleSendOtp} disabled={otpState.sending} size="sm" className="bg-maroon-600 hover:bg-maroon-700 text-white h-8 px-3 text-xs shrink-0">
                                                {otpState.sending ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Sending...</> : <><Mail className="h-3 w-3 mr-1" />Send Code</>}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Enter the 6-digit code sent to <strong>{formData.email}</strong></p>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={otpState.code}
                                                    onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setOtpState(p => ({ ...p, code: v, message: '', error: false })); }}
                                                    placeholder="000000"
                                                    maxLength={6}
                                                    className={cn("flex-1 text-center text-lg tracking-[0.3em] font-mono h-9", fieldClass, otpState.error && "border-red-400")}
                                                />
                                                <Button type="button" onClick={handleVerifyOtp} disabled={otpState.verifying || otpState.code.length !== 6} size="sm" className="bg-green-600 hover:bg-green-700 text-white h-9 px-3 text-xs shrink-0">
                                                    {otpState.verifying ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Verify'}
                                                </Button>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                {otpState.message && <span className={cn("text-xs", otpState.error ? "text-red-500" : "text-green-600")}>{otpState.message}</span>}
                                                <span className="ml-auto text-xs text-gray-400">
                                                    {otpState.countdown > 0 ? `Resend in ${otpState.countdown}s` : (
                                                        <button type="button" onClick={handleSendOtp} disabled={otpState.sending} className="text-maroon-600 hover:text-maroon-800 dark:text-maroon-400 font-medium">Resend</button>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );

            // ── School Info ──────────────────────────────────────────────
            case 2:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className={labelClass}><Building className="inline h-3.5 w-3.5 mr-1" />Campus <span className="text-red-500">*</span></label>
                            <SelectField value={formData.campusId} onChange={v => set('campusId', v)} disabled={loadingCampuses}>
                                <option value="">{loadingCampuses ? 'Loading...' : 'Select campus'}</option>
                                {campuses.map(c => <option key={c.id} value={c.id}>{c.display_name || c.name}</option>)}
                            </SelectField>
                            <FieldError msg={errors.campusId} />
                        </div>

                        {(() => { const sc = campuses.find(c => c.id.toString() === formData.campusId); return sc?.name.toLowerCase().includes('other'); })() && (
                            <div>
                                <label className={labelClass}>Specify other campus</label>
                                <Input value={formData.campusOther} onChange={e => set('campusOther', e.target.value)} className={fieldClass} />
                            </div>
                        )}

                        <div>
                            <label className={labelClass}><Building className="inline h-3.5 w-3.5 mr-1" />Department <span className="text-red-500">*</span></label>
                            <SelectField value={formData.departmentId} onChange={v => set('departmentId', v)} disabled={!formData.campusId || loadingDepartments}>
                                <option value="">{!formData.campusId ? 'Select campus first' : loadingDepartments ? 'Loading...' : 'Select department'}</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                            </SelectField>
                            <FieldError msg={errors.departmentId} />
                        </div>

                        <div>
                            <label className={labelClass}><GraduationCap className="inline h-3.5 w-3.5 mr-1" />Course / Program <span className="text-red-500">*</span></label>
                            <SelectField value={formData.courseId} onChange={v => set('courseId', v)} disabled={!formData.departmentId || loadingCourses}>
                                <option value="">{!formData.departmentId ? 'Select department first' : loadingCourses ? 'Loading...' : 'Select course'}</option>
                                {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                            </SelectField>
                            <FieldError msg={errors.courseId} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}><Calendar className="inline h-3.5 w-3.5 mr-1" />Year Graduated <span className="text-red-500">*</span></label>
                                <Input type="number" min="1978" max="2026" value={formData.yearGraduated} onChange={e => set('yearGraduated', e.target.value)} placeholder="2024" className={fieldClass} />
                                <FieldError msg={errors.yearGraduated} />
                            </div>
                            <div>
                                <label className={labelClass}><Calendar className="inline h-3.5 w-3.5 mr-1" />Year Enrolled</label>
                                <Input type="number" min="1970" max="2026" value={formData.enrollmentYear} onChange={e => set('enrollmentYear', e.target.value)} placeholder="2020" className={fieldClass} />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}><Award className="inline h-3.5 w-3.5 mr-1" />Honor / Awards Received</label>
                            <Textarea value={formData.honorsAwards} onChange={e => set('honorsAwards', e.target.value)} placeholder="Cum Laude, Magna Cum Laude, etc." className={cn(fieldClass, "min-h-[60px]")} />
                        </div>
                    </div>
                );

            // ── Eligibility ──────────────────────────────────────────────
            case 3:
                return (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Add your professional licenses and government examinations passed. This section is optional.</p>

                        {formData.examinations.map((exam, i) => (
                            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-3 bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Examination {i + 1}</span>
                                    <button type="button" onClick={() => set('examinations', formData.examinations.filter((_, idx) => idx !== i))} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors">
                                        <X className="h-3 w-3" />Remove
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Name of Examination</label>
                                        <Input value={exam.name} onChange={e => { const n = [...formData.examinations]; n[i] = { ...n[i], name: e.target.value }; set('examinations', n); }} placeholder="e.g., Civil Engineering" className={fieldClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Place</label>
                                        <Input value={exam.place} onChange={e => { const n = [...formData.examinations]; n[i] = { ...n[i], place: e.target.value }; set('examinations', n); }} placeholder="e.g., Manila" className={fieldClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Date Taken</label>
                                        <Input type="date" value={exam.dateTaken} onChange={e => { const n = [...formData.examinations]; n[i] = { ...n[i], dateTaken: e.target.value }; set('examinations', n); }} className={fieldClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Rating</label>
                                        <Input value={exam.rating} onChange={e => { const n = [...formData.examinations]; n[i] = { ...n[i], rating: e.target.value }; set('examinations', n); }} placeholder="e.g., 85.5%" className={fieldClass} />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <Button type="button" variant="outline" onClick={() => set('examinations', [...formData.examinations, { name: '', place: '', dateTaken: '', rating: '' }])} className="w-full border-dashed border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-maroon-400 hover:text-maroon-600 dark:hover:text-maroon-400 transition-colors">
                            <Award className="h-4 w-4 mr-2" />Add Examination
                        </Button>

                        {formData.examinations.length === 0 && (
                            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                                <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">No examinations added yet</p>
                                <p className="text-xs mt-1">Click the button above to add one, or skip this step</p>
                            </div>
                        )}
                    </div>
                );

            // ── Employment ───────────────────────────────────────────────
            case 4:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className={labelClass}>Are you presently employed? <span className="text-red-500">*</span></label>
                            <InlineRadio name="presentlyEmployed" options={['Yes', 'No']} value={formData.presentlyEmployed} onChange={v => set('presentlyEmployed', v)} />
                            <FieldError msg={errors.presentlyEmployed} />
                        </div>

                        {formData.presentlyEmployed === 'No' && (
                            <div>
                                <label className={labelClass}>Reason not employed</label>
                                <Textarea value={formData.notEmployedReason} onChange={e => set('notEmployedReason', e.target.value)} placeholder="State the reasons..." className={cn(fieldClass, "min-h-[60px]")} />
                            </div>
                        )}

                        {formData.presentlyEmployed === 'Yes' && (
                            <>
                                <div>
                                    <label className={labelClass}>Where are you employed?</label>
                                    <InlineRadio name="employmentLocation" options={['Local', 'Abroad/Foreign']} value={formData.employmentLocation} onChange={v => set('employmentLocation', v)} />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Company / Agency Name</label>
                                        <Input value={formData.companyName} onChange={e => set('companyName', e.target.value)} className={fieldClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Company Address</label>
                                        <Input value={formData.companyAddress} onChange={e => set('companyAddress', e.target.value)} className={fieldClass} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Present Position</label>
                                        <Input value={formData.presentPosition} onChange={e => set('presentPosition', e.target.value)} className={fieldClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}><Calendar className="inline h-3.5 w-3.5 mr-1" />Date Hired</label>
                                        <Input type="date" value={formData.dateHired} onChange={e => set('dateHired', e.target.value)} className={fieldClass} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>Years of Service</label>
                                        <Input type="number" step="0.5" value={formData.yearsOfService} onChange={e => set('yearsOfService', e.target.value)} className={fieldClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Job aligned to course?</label>
                                        <InlineRadio name="jobAligned" options={['Yes', 'No']} value={formData.jobAlignedToCourse} onChange={v => set('jobAlignedToCourse', v)} />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>Average Monthly Income</label>
                                    <InlineRadio name="income" options={['Below 5,000.00', '5,001.00 to 10,000.00', '10,001.00 to 15,000.00', '15,001.00 to 20,000.00', '20,001.00 to 25,000.00', '25,001.00 & up']} value={formData.averageMonthlyIncome} onChange={v => set('averageMonthlyIncome', v)} />
                                </div>

                                <div>
                                    <label className={labelClass}>Employment Status</label>
                                    <InlineRadio name="empStatus" options={['Permanent', 'Temporary/Provisional', 'Contractual', 'Casual', 'Job Order', 'Self-Employed']} value={formData.employmentStatus} onChange={v => set('employmentStatus', v)} />
                                </div>

                                <div>
                                    <label className={labelClass}>Job Level Position</label>
                                    <InlineRadio name="jobLevel" options={['Clerical', 'Supervisory', 'Technical', 'Managerial', 'Professional', 'Self-Employed']} value={formData.jobLevelPosition} onChange={v => set('jobLevelPosition', v)} />
                                </div>

                                <div>
                                    <label className={labelClass}>Major Line of Business</label>
                                    <InlineRadio name="lineOfBiz" options={['Education', 'Business', 'Manufacturing', 'Hotel/Restaurant', 'Government', 'Information Tech./Arts', 'Construction/Builder', 'Others']} value={formData.majorLineOfBusiness} onChange={v => set('majorLineOfBusiness', v)} />
                                </div>

                                {formData.majorLineOfBusiness?.toLowerCase().includes('other') && (
                                    <div>
                                        <label className={labelClass}>Specify other line of business</label>
                                        <Input value={formData.businessOther} onChange={e => set('businessOther', e.target.value)} className={fieldClass} />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                );

            // ── Achievements & About Me (combined) ──────────────────────
            case 5:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className={labelClass}><Award className="inline h-3.5 w-3.5 mr-1" />Achievements / Awards Received</label>
                            <Textarea value={formData.achievements} onChange={e => set('achievements', e.target.value)} placeholder="List your achievements and awards..." className={cn(fieldClass, "min-h-[100px]")} />
                        </div>
                        <div>
                            <label className={labelClass}><Heart className="inline h-3.5 w-3.5 mr-1" />What I Want My EARIST Family to Know About Me</label>
                            <Textarea value={formData.aboutMe} onChange={e => set('aboutMe', e.target.value)} placeholder="Share your story with the EARIST community..." className={cn(fieldClass, "min-h-[100px]")} />
                        </div>
                        <div className="text-center py-4 text-gray-400 dark:text-gray-500">
                            <p className="text-xs">Both fields are optional. Feel free to skip if you prefer.</p>
                        </div>
                    </div>
                );

            // ── Account Setup ────────────────────────────────────────────
            case 6:
                return (
                    <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                            <Lock className="h-4 w-4 shrink-0" />
                            Set up your login credentials to access the alumni portal.
                        </div>

                        <div>
                            <label className={labelClass}><Hash className="inline h-3.5 w-3.5 mr-1" />Student ID <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Input value={formData.studentId} onChange={e => set('studentId', e.target.value)} placeholder="Enter your student ID" className={cn(fieldClass, "pr-9", studentIdValidation.exists && "border-red-400")} />
                                {formData.studentId && (
                                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                        {studentIdValidation.checking && <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />}
                                        {!studentIdValidation.checking && studentIdValidation.exists && <AlertCircle className="h-4 w-4 text-red-500" />}
                                        {!studentIdValidation.checking && !studentIdValidation.exists && studentIdValidation.message && <CheckCircle className="h-4 w-4 text-green-500" />}
                                    </div>
                                )}
                            </div>
                            <ValidationBadge {...studentIdValidation} />
                            <FieldError msg={errors.studentId} />
                        </div>

                        <div>
                            <label className={labelClass}><Lock className="inline h-3.5 w-3.5 mr-1" />Password <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={e => set('password', e.target.value)}
                                    placeholder="Min 8 chars, uppercase, lowercase, number"
                                    className={cn(fieldClass, "pr-10")}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <FieldError msg={errors.password} />
                            {formData.password && !errors.password && (
                                <div className="mt-1.5 flex gap-1">
                                    {[
                                        { test: formData.password.length >= 8, label: '8+' },
                                        { test: /[A-Z]/.test(formData.password), label: 'A-Z' },
                                        { test: /[a-z]/.test(formData.password), label: 'a-z' },
                                        { test: /[0-9]/.test(formData.password), label: '0-9' },
                                        { test: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password), label: '!@#' },
                                    ].map(r => (
                                        <span key={r.label} className={cn(
                                            "text-[10px] px-1.5 py-0.5 rounded-full font-medium transition-colors",
                                            r.test ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                                        )}>
                                            {r.label}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className={labelClass}><Lock className="inline h-3.5 w-3.5 mr-1" />Confirm Password <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={e => set('confirmPassword', e.target.value)}
                                    placeholder="Re-enter password"
                                    className={cn(fieldClass, "pr-10")}
                                />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <FieldError msg={errors.confirmPassword} />
                            {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                <p className="text-xs text-green-600 flex items-center gap-1 mt-1"><CheckCircle className="h-3 w-3" />Passwords match</p>
                            )}
                        </div>

                        {/* Submission Status */}
                        {submissionStatus !== 'idle' && (
                            <div className={cn(
                                "p-4 rounded-xl border flex items-start gap-3",
                                submissionStatus === 'success' && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700",
                                submissionStatus === 'error' && "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700",
                                submissionStatus === 'submitting' && "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700",
                            )}>
                                {submissionStatus === 'submitting' && <Loader2 className="h-5 w-5 text-blue-500 animate-spin shrink-0 mt-0.5" />}
                                {submissionStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />}
                                {submissionStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
                                <div>
                                    <p className="text-sm font-semibold">
                                        {submissionStatus === 'submitting' && 'Creating your account...'}
                                        {submissionStatus === 'success' && 'Registration Successful!'}
                                        {submissionStatus === 'error' && 'Registration Failed'}
                                    </p>
                                    {submissionMessage && <p className="text-xs mt-1 opacity-80 whitespace-pre-line">{submissionMessage}</p>}
                                </div>
                            </div>
                        )}
                    </div>
                );

            default: return null;
        }
    };

    // ─── Layout ──────────────────────────────────────────────────────────────

    const isLastStep = step === steps.length - 1;
    const canGoNext = (() => {
        if (step === 0 && !formData.dataPrivacyConsent) return false;
        if (step === 1 && formData.email && !otpState.verified) return false;
        if (step === 1 && emailValidation.exists) return false;
        return true;
    })();

    return (
        <>
            <Head title="Alumni Registration" />
            <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
                {/* ── Top bar ─────────────────────────────────────────── */}
                <header className="bg-gradient-to-r from-maroon-800 to-maroon-900 text-white px-4 py-2.5 flex items-center justify-between shrink-0 shadow-lg z-20">
                    <div className="flex items-center gap-3">
                        <GraduationCap className="h-6 w-6" />
                        <div>
                            <h1 className="text-sm font-bold leading-tight">EARIST Alumni Tracer</h1>
                            <p className="text-[10px] text-maroon-200">Registration Survey</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/login" className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors">
                            <Lock className="h-3 w-3" />Login
                        </Link>
                        <Link href="/" className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md border border-maroon-500 hover:bg-maroon-700 text-maroon-100 transition-colors">
                            <ArrowLeft className="h-3 w-3" />Home
                        </Link>
                    </div>
                </header>

                {/* ── Main area ────────────────────────────────────────── */}
                <div className="flex flex-1 overflow-hidden">
                    {/* ── Sidebar (desktop) ──────────────────────── */}
                    <nav className="hidden md:flex flex-col w-56 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shrink-0">
                        <div className="flex-1 py-3 overflow-y-auto">
                            {steps.map((s, i) => {
                                const isActive = i === step;
                                const isDone = i < step;
                                const Icon = s.icon;
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => goToStep(i)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all text-sm",
                                            isActive && "bg-maroon-50 dark:bg-maroon-900/30 text-maroon-700 dark:text-maroon-300 border-r-2 border-maroon-600",
                                            isDone && !isActive && "text-green-700 dark:text-green-400 hover:bg-gray-50 dark:hover:bg-gray-700/50",
                                            !isActive && !isDone && "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all",
                                            isActive && "bg-maroon-600 text-white shadow-sm",
                                            isDone && !isActive && "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400",
                                            !isActive && !isDone && "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                                        )}>
                                            {isDone && !isActive ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn("text-xs leading-tight truncate", isActive ? "font-semibold" : "font-medium")}>{s.title}</p>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500">Step {i + 1}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-1.5">
                                <span>Progress</span>
                                <span>{Math.round(((step + 1) / steps.length) * 100)}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-maroon-500 to-maroon-600 rounded-full transition-all duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
                            </div>
                        </div>
                    </nav>

                    {/* ── Content area ────────────────────────────── */}
                    <main className="flex-1 flex flex-col overflow-hidden">
                        {/* Step header + desktop nav */}
                        <div className="px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
                            <div className="max-w-3xl mx-auto flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-maroon-600 to-maroon-700 text-white shadow-sm">
                                    {React.createElement(steps[step].icon, { className: "h-4 w-4" })}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">{steps[step].title}</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Step {step + 1} of {steps.length}</p>
                                </div>
                                <div className="hidden md:flex items-center gap-2">
                                    <Button onClick={goPrev} disabled={step === 0 || isSubmitting} variant="outline" size="sm" className="h-8 px-3 text-xs">
                                        <ArrowLeft className="h-3.5 w-3.5 mr-1" />Back
                                    </Button>
                                    {isLastStep ? (
                                        <Button onClick={handleSubmit} disabled={isSubmitting || submissionStatus === 'success' || studentIdValidation.exists} size="sm" className="h-8 px-4 text-xs bg-green-600 hover:bg-green-700 text-white">
                                            {isSubmitting ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />Creating...</> : <><Sparkles className="h-3.5 w-3.5 mr-1" />Complete Registration</>}
                                        </Button>
                                    ) : (
                                        <Button onClick={goNext} disabled={!canGoNext || isSubmitting} size="sm" className="h-8 px-4 text-xs bg-maroon-600 hover:bg-maroon-700 text-white disabled:opacity-50">
                                            Next<ArrowRight className="h-3.5 w-3.5 ml-1" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Scrollable step content */}
                        <div ref={contentRef} className="flex-1 overflow-y-auto pb-20 md:pb-6">
                            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
                                {renderStep()}
                            </div>
                        </div>
                    </main>
                </div>

                {/* ── Mobile bottom bar ────────────────────────────── */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30 px-4 py-2 flex items-center gap-2 shadow-lg">
                    <Button onClick={goPrev} disabled={step === 0 || isSubmitting} variant="outline" size="sm" className="h-9 px-3 shrink-0">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 flex items-center gap-1 justify-center">
                        {steps.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => goToStep(i)}
                                className={cn(
                                    "h-1.5 rounded-full transition-all",
                                    i === step ? "w-6 bg-maroon-600" : i < step ? "w-3 bg-green-400" : "w-3 bg-gray-200 dark:bg-gray-600"
                                )}
                            />
                        ))}
                    </div>
                    {isLastStep ? (
                        <Button onClick={handleSubmit} disabled={isSubmitting || submissionStatus === 'success' || studentIdValidation.exists} size="sm" className="h-9 px-4 bg-green-600 hover:bg-green-700 text-white shrink-0">
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-1" />Submit</>}
                        </Button>
                    ) : (
                        <Button onClick={goNext} disabled={!canGoNext || isSubmitting} size="sm" className="h-9 px-3 bg-maroon-600 hover:bg-maroon-700 text-white shrink-0 disabled:opacity-50">
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </>
    );
}
