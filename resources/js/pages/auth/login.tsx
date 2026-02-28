import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { GraduationCap, Eye, EyeOff, RefreshCw, Mail, Lock as LockIcon, AlertCircle, Smartphone, Users, TrendingUp, Home, IdCard, ArrowRight, CheckCircle2, XCircle, Sparkles, Globe, Shield, Briefcase, Award } from 'lucide-react';
import axios from 'axios';

interface LoginErrors {
    login?: string;
    password?: string;
    otp_code?: string;
    general?: string;
    message?: string;
    [key: string]: string | undefined;
}

interface LoginStats {
    totalAlumni: number;
    employmentRate: number;
    industries: number;
}

export default function Login() {
    const { stats } = usePage<{ stats?: LoginStats }>().props;
    const [formData, setFormData] = useState({
        login: '',
        password: '',
        otp_code: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<LoginErrors>({});
    const [show2FAInput, setShow2FAInput] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorModalMessage, setErrorModalMessage] = useState('');
    const [loginValidation, setLoginValidation] = useState<{
        checking: boolean;
        exists: boolean;
        message: string;
        isEmail: boolean;
    }>({ checking: false, exists: false, message: '', isEmail: false });

    // Add public-page class to html for proper scrolling
    useEffect(() => {
        document.documentElement.classList.add('public-page');
        return () => {
            document.documentElement.classList.remove('public-page');
        };
    }, []);

    useEffect(() => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (token) {
            axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
        }
    }, []);

    // Track whether login is in progress to cancel pending requests
    const [loginInProgress, setLoginInProgress] = useState(false);

    useEffect(() => {
        const checkLoginExists = async () => {
            if (!formData.login || loginInProgress) {
                if (!formData.login) {
                    setLoginValidation({ checking: false, exists: false, message: '', isEmail: false });
                }
                return;
            }

            const isEmail = /\S+@\S+\.\S+/.test(formData.login);

            if (!isEmail && formData.login.length < 3) {
                setLoginValidation({ checking: false, exists: false, message: '', isEmail: false });
                return;
            }

            setLoginValidation({ checking: true, exists: false, message: 'Checking...', isEmail });

            try {
                const response = await axios.post('/api/v1/check-login', {
                    login: formData.login,
                    type: isEmail ? 'email' : 'student_id'
                });

                if (response.data.exists) {
                    setLoginValidation({
                        checking: false,
                        exists: true,
                        message: isEmail ? 'Email verified' : 'Student ID verified',
                        isEmail
                    });
                } else {
                    setLoginValidation({
                        checking: false,
                        exists: false,
                        message: isEmail
                            ? 'Email not registered'
                            : 'Student ID not found',
                        isEmail
                    });
                }
            } catch {
                setLoginValidation({ checking: false, exists: false, message: '', isEmail });
            }
        };

        const timer = setTimeout(checkLoginExists, 800);
        return () => clearTimeout(timer);
    }, [formData.login, loginInProgress]);

    const handleInputChange = (key: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [key]: value }));

        if (errors[key]) {
            setErrors(prev => ({ ...prev, [key]: '' }));
        }

        if (key === 'otp_code' && typeof value === 'string' && value.length === 6 && show2FAInput) {
            setTimeout(() => {
                const submitEvent = { preventDefault: () => { } } as React.FormEvent;
                handleSubmit(submitEvent);
            }, 100);
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.login) {
            newErrors.login = 'Email or Student ID is required';
        } else {
            const isEmail = /\S+@\S+\.\S+/.test(formData.login);
            if (!isEmail && formData.login.length < 3) {
                newErrors.login = 'Please enter a valid email or student ID';
            }
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        if (show2FAInput && formData.otp_code.length !== 6) {
            newErrors.otp_code = 'OTP code must be 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        setLoginInProgress(true);
        setErrors({});

        const isEmail = /\S+@\S+\.\S+/.test(formData.login);

        router.post('/login', {
            [isEmail ? 'email' : 'student_id']: formData.login,
            password: formData.password,
            otp_code: formData.otp_code,
            remember: false,
        }, {
            onError: (errors: LoginErrors) => {
                console.error('Login error:', errors);

                if (errors.message && (errors.message.includes('419') || errors.message.includes('expired'))) {
                    setErrorModalMessage('Your session has expired. Please refresh the page and try again.');
                    setShowErrorModal(true);
                }
                else if (errors.otp_code && errors.otp_code.includes('Please enter')) {
                    setShow2FAInput(true);
                    setErrors({ otp_code: errors.otp_code });
                    setFormData(prev => ({ ...prev, otp_code: '' }));
                }
                else if (errors.password && (
                    errors.password.includes('weak') ||
                    errors.password.includes('requirements') ||
                    errors.password.includes('must contain')
                )) {
                    setErrorModalMessage(errors.password);
                    setShowErrorModal(true);
                    setErrors(errors);
                }
                else {
                    if (errors.general || errors.message) {
                        setErrorModalMessage(errors.general || errors.message || 'An error occurred during login.');
                        setShowErrorModal(true);
                    }

                    const errorMessages = { ...errors };
                    if (!errorMessages.general && errors.message) {
                        errorMessages.general = errors.message;
                    }
                    setErrors(errorMessages);
                }

                setIsSubmitting(false);
            },
            onSuccess: () => {
                // Server uses Inertia::location() for a full-page redirect
                // which handles the session cookie properly.
            },
            onFinish: () => {
                setIsSubmitting(false);
                setLoginInProgress(false);
            },
        });
    };

    const handleBackToSurvey = () => {
        window.location.href = '/survey/register';
    };

    const handleGoToLanding = () => {
        window.location.href = '/';
    };

    return (
        <>
            <Head title="Login - Alumni Tracer System" />

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-6px); }
                }
                @keyframes count-up {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
                .stat-number {
                    animation: count-up 0.6s ease-out forwards;
                }
            `}</style>

            <div className="h-screen bg-gradient-to-br from-maroon-50 via-beige-50 to-maroon-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex relative overflow-hidden">

                {/* Left Side - Professional Branding */}
                <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                    {/* Full maroon background with gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-maroon-800 via-maroon-900 to-maroon-950"></div>
                    {/* Decorative pattern overlay */}
                    <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                    {/* Decorative circles */}
                    <div className="absolute -top-20 -right-20 w-80 h-80 bg-maroon-700/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-maroon-600/15 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/3 right-10 w-40 h-40 bg-yellow-500/5 rounded-full blur-2xl"></div>

                    <div className="relative z-10 flex flex-col justify-center px-10 xl:px-14 w-full h-full">
                        <div className="max-w-lg space-y-5">
                            {/* Logo + Title */}
                            <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                    <div className="relative animate-float">
                                        <div className="w-13 h-13 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 shadow-2xl">
                                            <GraduationCap className="h-7 w-7 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-white tracking-tight">Alumni Tracer</h1>
                                        <p className="text-maroon-200 font-light tracking-wider text-xs uppercase">System</p>
                                    </div>
                                </div>
                                <p className="text-sm text-maroon-100/80 leading-relaxed max-w-sm">
                                    Stay connected, track your career journey, and contribute to the growth of our alumni community.
                                </p>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/10 text-center group hover:bg-white/15 transition-all duration-300">
                                    <div className="text-2xl font-bold text-white stat-number">{stats?.totalAlumni?.toLocaleString() || '0'}<span className="text-yellow-400">+</span></div>
                                    <div className="text-[10px] text-maroon-200 uppercase tracking-wider font-medium mt-0.5">Alumni</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/10 text-center group hover:bg-white/15 transition-all duration-300">
                                    <div className="text-2xl font-bold text-white stat-number">{stats?.employmentRate ?? 0}<span className="text-green-400">%</span></div>
                                    <div className="text-[10px] text-maroon-200 uppercase tracking-wider font-medium mt-0.5">Employed</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/10 text-center group hover:bg-white/15 transition-all duration-300">
                                    <div className="text-2xl font-bold text-white stat-number">{stats?.industries ?? 0}<span className="text-blue-400">+</span></div>
                                    <div className="text-[10px] text-maroon-200 uppercase tracking-wider font-medium mt-0.5">Industries</div>
                                </div>
                            </div>

                            {/* Feature List */}
                            <div className="space-y-2">
                                <div className="flex items-center space-x-3 px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/[0.07] hover:bg-white/10 transition-all duration-300 group">
                                    <div className="w-9 h-9 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/30 transition-colors">
                                        <Users className="h-4 w-4 text-blue-300" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-white font-medium text-sm leading-tight">Professional Network</h3>
                                        <p className="text-maroon-200/60 text-xs leading-tight">Connect with alumni across industries</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/[0.07] hover:bg-white/10 transition-all duration-300 group">
                                    <div className="w-9 h-9 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/30 transition-colors">
                                        <TrendingUp className="h-4 w-4 text-green-300" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-white font-medium text-sm leading-tight">Career Tracking</h3>
                                        <p className="text-maroon-200/60 text-xs leading-tight">Monitor employment trends and growth</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/[0.07] hover:bg-white/10 transition-all duration-300 group">
                                    <div className="w-9 h-9 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-500/30 transition-colors">
                                        <Briefcase className="h-4 w-4 text-yellow-300" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-white font-medium text-sm leading-tight">Job Opportunities</h3>
                                        <p className="text-maroon-200/60 text-xs leading-tight">Discover career paths and postings</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/[0.07] hover:bg-white/10 transition-all duration-300 group">
                                    <div className="w-9 h-9 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/30 transition-colors">
                                        <Award className="h-4 w-4 text-purple-300" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-white font-medium text-sm leading-tight">Achievements & Surveys</h3>
                                        <p className="text-maroon-200/60 text-xs leading-tight">Contribute data that shapes the future</p>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom trust badges */}
                            <div className="flex items-center gap-5 pt-1">
                                <div className="flex items-center gap-1.5 text-maroon-200/50 text-[11px]">
                                    <Shield className="h-3.5 w-3.5" />
                                    <span>Encrypted</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-maroon-200/50 text-[11px]">
                                    <Globe className="h-3.5 w-3.5" />
                                    <span>Accessible Anywhere</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-maroon-200/50 text-[11px]">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    <span>Real-time Analytics</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-8 relative z-10 overflow-y-auto">
                    <div className="w-full max-w-md">
                        {/* Mobile Logo */}
                        <div className="lg:hidden text-center mb-10">
                            <div className="flex items-center justify-center mb-6">
                                <div className="relative">
                                    <div className="w-14 h-14 bg-gradient-to-br from-maroon-600 to-maroon-800 rounded-xl flex items-center justify-center shadow-2xl">
                                        <GraduationCap className="h-8 w-8 text-white" />
                                    </div>
                                    <div className="absolute -inset-1 bg-gradient-to-br from-maroon-600 to-maroon-800 rounded-xl blur-lg opacity-50"></div>
                                </div>
                            </div>
                            <h1 className="text-3xl font-bold text-maroon-900 dark:text-white mb-2">Alumni Tracer System</h1>
                            <p className="text-maroon-700 dark:text-gray-300">Welcome back! Please sign in</p>
                        </div>

                        <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-maroon-100 dark:border-gray-700 shadow-2xl">
                            <CardHeader className="pb-4 pt-6 px-7 border-b border-gray-100 dark:border-gray-700">
                                <CardTitle className="text-2xl text-gray-900 dark:text-white font-bold text-center">Welcome Back</CardTitle>
                                <CardDescription className="text-gray-600 dark:text-gray-400 text-center">Sign in to access your portal</CardDescription>
                            </CardHeader>

                            <CardContent className="p-7">
                                <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <div className="flex items-center justify-center mb-4">
                                                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                                                    <AlertCircle className="h-7 w-7 text-red-600" />
                                                </div>
                                            </div>
                                            <DialogTitle className="text-center text-xl text-gray-900">Login Error</DialogTitle>
                                            <DialogDescription className="text-center text-gray-600 mt-2">
                                                {errorModalMessage}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="mt-4">
                                            <Button
                                                onClick={() => setShowErrorModal(false)}
                                                className="w-full bg-maroon-600 hover:bg-maroon-700 text-white"
                                            >
                                                Got it
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="login" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Email or Student ID <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                {loginValidation.isEmail ? (
                                                    <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                                ) : (
                                                    <IdCard className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                                )}
                                            </div>
                                            <Input
                                                id="login"
                                                type="text"
                                                value={formData.login}
                                                onChange={(e) => handleInputChange('login', e.target.value)}
                                                className={`pl-11 pr-11 h-12 border-gray-300 dark:border-gray-600 focus:border-maroon-500 focus:ring-maroon-500 input-glow bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 ${formData.login && !loginValidation.checking && !loginValidation.exists && formData.login.length >= 3
                                                    ? 'border-red-300 bg-red-50/30 dark:bg-red-900/20'
                                                    : loginValidation.exists
                                                        ? 'border-green-300 bg-green-50/30 dark:bg-green-900/20'
                                                        : ''
                                                    }`}
                                                placeholder="student@earist.edu or 2020-12345"
                                            />
                                            {formData.login && formData.login.length >= 3 && (
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                    {loginValidation.checking ? (
                                                        <RefreshCw className="h-5 w-5 text-gray-400 animate-spin" />
                                                    ) : loginValidation.exists ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                    ) : (
                                                        <XCircle className="h-5 w-5 text-red-500" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {formData.login && formData.login.length >= 3 && !loginValidation.checking && (
                                            <p className={`text-xs flex items-center mt-1 ${loginValidation.exists ? 'text-green-600' : 'text-red-600'}`}>
                                                {loginValidation.message}
                                            </p>
                                        )}
                                        {errors.login && (
                                            <p className="text-xs text-red-600 flex items-center mt-1">
                                                <AlertCircle className="h-3 w-3 mr-1" />
                                                {errors.login}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">You can login using your email address or student ID number</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Password <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <LockIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                            </div>
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
                                                onChange={(e) => handleInputChange('password', e.target.value)}
                                                className="pl-11 pr-11 h-12 border-gray-300 dark:border-gray-600 focus:border-maroon-500 focus:ring-maroon-500 input-glow bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                                                placeholder="Enter your password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className="text-xs text-red-600 flex items-center mt-1">
                                                <AlertCircle className="h-3 w-3 mr-1" />
                                                {errors.password}
                                            </p>
                                        )}
                                        <div className="flex justify-end">
                                            <a href="/forgot-password" className="text-xs text-maroon-600 dark:text-maroon-400 hover:text-maroon-700 dark:hover:text-maroon-300 font-medium hover:underline">
                                                Forgot password?
                                            </a>
                                        </div>
                                    </div>

                                    {show2FAInput && (
                                        <div className="space-y-2 p-5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                            <div className="flex items-center mb-2">
                                                <div className="w-8 h-8 bg-maroon-600 rounded-lg flex items-center justify-center mr-2">
                                                    <Smartphone className="h-4 w-4 text-white" />
                                                </div>
                                                <Label htmlFor="otp-code" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-0">
                                                    Two-Factor Authentication <span className="text-red-500">*</span>
                                                </Label>
                                            </div>
                                            <Input
                                                id="otp-code"
                                                type="text"
                                                value={formData.otp_code}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                                                    handleInputChange('otp_code', value);
                                                }}
                                                className="h-14 border-gray-300 dark:border-gray-600 focus:border-maroon-500 focus:ring-maroon-500 bg-white dark:bg-gray-700 dark:text-white text-lg text-center tracking-widest font-mono"
                                                placeholder="000000"
                                                maxLength={6}
                                                autoComplete="off"
                                                autoFocus
                                            />
                                            {errors.otp_code && (
                                                <p className="text-xs text-red-600 flex items-center">
                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                    {errors.otp_code}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Enter the 6-digit code from your authenticator app</p>
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full h-12 bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-700 hover:to-maroon-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                                                Signing In...
                                            </>
                                        ) : (
                                            <>
                                                Sign In
                                                <ArrowRight className="h-5 w-5 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </form>

                                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={handleGoToLanding}
                                            className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600"
                                        >
                                            <Home className="w-4 h-4 mr-2" />
                                            Home
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleBackToSurvey}
                                            className="text-sm font-medium text-maroon-600 dark:text-maroon-400 hover:text-maroon-700 dark:hover:text-maroon-300 hover:bg-maroon-50 dark:hover:bg-maroon-900/30 border-maroon-300 dark:border-maroon-700"
                                        >
                                            Register
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                                        Don't have an account? <span className="font-semibold text-maroon-600 dark:text-maroon-400">Register as an alumni first</span>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="mt-4 text-center">
                            <div className="inline-flex items-center px-3 py-1.5 bg-maroon-50/80 dark:bg-gray-800 backdrop-blur-sm rounded-full border border-maroon-200/50 dark:border-gray-700">
                                <Shield className="w-3.5 h-3.5 text-maroon-500 dark:text-gray-400 mr-1.5" />
                                <span className="text-[11px] text-maroon-700 dark:text-gray-300 font-medium">Secure & Encrypted Connection</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
