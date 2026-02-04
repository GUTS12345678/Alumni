import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { GraduationCap, Eye, EyeOff, RefreshCw, Mail, Lock as LockIcon, AlertCircle, Smartphone, Users, TrendingUp, Building2, Home, IdCard, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import axios from 'axios';

interface LoginErrors {
    login?: string;
    password?: string;
    otp_code?: string;
    general?: string;
    message?: string;
    [key: string]: string | undefined;
}

export default function Login() {
    const [formData, setFormData] = useState({
        login: '',
        password: '',
        otp_code: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<LoginErrors>({});
    const [csrfError, setCsrfError] = useState(false);
    const [show2FAInput, setShow2FAInput] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorModalMessage, setErrorModalMessage] = useState('');
    const [loginValidation, setLoginValidation] = useState<{
        checking: boolean;
        exists: boolean;
        message: string;
        isEmail: boolean;
    }>({ checking: false, exists: false, message: '', isEmail: false });

    useEffect(() => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (token) {
            axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
        }
    }, []);

    useEffect(() => {
        const checkLoginExists = async () => {
            if (!formData.login) {
                setLoginValidation({ checking: false, exists: false, message: '', isEmail: false });
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
    }, [formData.login]);

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
        setCsrfError(false);
        setErrors({});

        const isEmail = /\S+@\S+\.\S+/.test(formData.login);

        router.post('/login', {
            [isEmail ? 'email' : 'student_id']: formData.login,
            password: formData.password,
            otp_code: formData.otp_code,
            remember: false,
        }, {
            preserveState: true,
            preserveScroll: true,
            onError: (errors: LoginErrors) => {
                console.error('Login error:', errors);

                if (errors.message && (errors.message.includes('419') || errors.message.includes('expired'))) {
                    setCsrfError(true);
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
                console.log('Login successful - redirecting...');
            },
            onFinish: () => {
                console.log('Login finished');
                setIsSubmitting(false);
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
                @keyframes blob {
                    0%, 100% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                .stat-card {
                    backdrop-filter: blur(10px);
                    background: rgba(255, 255, 255, 0.6);
                    border: 1px solid rgba(139, 0, 0, 0.1);
                    transition: all 0.3s ease;
                }
                .stat-card:hover {
                    background: rgba(255, 255, 255, 0.8);
                    border-color: rgba(139, 0, 0, 0.2);
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px rgba(139, 0, 0, 0.1);
                }
                .feature-item {
                    position: relative;
                    overflow: hidden;
                }
                .feature-item::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(139, 0, 0, 0.05), transparent);
                    transition: left 0.5s;
                }
                .feature-item:hover::before {
                    left: 100%;
                }
            `}</style>

            <div className="min-h-screen bg-gradient-to-br from-maroon-50 via-beige-50 to-maroon-100 flex relative overflow-hidden">
                {/* Animated Background Blobs */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 -left-4 w-72 h-72 bg-maroon-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                    <div className="absolute top-0 -right-4 w-72 h-72 bg-beige-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-8 left-20 w-72 h-72 bg-maroon-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>

                {/* Left Side - Professional Branding */}
                <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-20 relative z-10">
                    <div className="max-w-xl space-y-10">
                        {/* Logo Section */}
                        <div className="space-y-6">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <div className="w-16 h-16 bg-gradient-to-br from-maroon-600 to-maroon-800 rounded-2xl flex items-center justify-center shadow-2xl border border-maroon-500/50">
                                        <GraduationCap className="h-9 w-9 text-white" />
                                    </div>
                                    <div className="absolute -inset-1 bg-gradient-to-br from-maroon-600 to-maroon-800 rounded-2xl blur-lg opacity-50"></div>
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold text-maroon-900 tracking-tight">Alumni Tracer</h1>
                                    <p className="text-lg text-maroon-700 font-light tracking-wide">System</p>
                                </div>
                            </div>
                            <p className="text-lg text-maroon-700 leading-relaxed">
                                Stay connected, track your career journey, and contribute to the growth of our alumni community.
                            </p>
                        </div>

                        {/* Feature Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="feature-item stat-card rounded-xl p-5 group cursor-pointer">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="w-10 h-10 bg-maroon-600/20 rounded-lg flex items-center justify-center group-hover:bg-maroon-600/30 transition-colors">
                                        <Users className="h-5 w-5 text-maroon-400" />
                                    </div>
                                    <h3 className="font-semibold text-maroon-900 text-sm">Connect</h3>
                                </div>
                                <p className="text-xs text-maroon-600">Build your professional network</p>
                            </div>

                            <div className="feature-item stat-card rounded-xl p-5 group cursor-pointer">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="w-10 h-10 bg-yellow-600/20 rounded-lg flex items-center justify-center group-hover:bg-yellow-600/30 transition-colors">
                                        <TrendingUp className="h-5 w-5 text-yellow-400" />
                                    </div>
                                    <h3 className="font-semibold text-maroon-900 text-sm">Track Progress</h3>
                                </div>
                                <p className="text-xs text-maroon-600">Monitor your career growth</p>
                            </div>

                            <div className="feature-item stat-card rounded-xl p-5 group cursor-pointer">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
                                        <Building2 className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <h3 className="font-semibold text-maroon-900 text-sm">Global Reach</h3>
                                </div>
                                <p className="text-xs text-maroon-600">Connect worldwide</p>
                            </div>

                            <div className="feature-item stat-card rounded-xl p-5 group cursor-pointer">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center group-hover:bg-green-600/30 transition-colors">
                                        <TrendingUp className="h-5 w-5 text-green-400" />
                                    </div>
                                    <h3 className="font-semibold text-maroon-900 text-sm">Opportunities</h3>
                                </div>
                                <p className="text-xs text-maroon-600">Discover career paths</p>
                            </div>
                        </div>

                        {/* Statistics */}
                        <div className="stat-card rounded-xl p-6">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-maroon-900 mb-1">10,000+</div>
                                    <div className="text-xs text-maroon-600 uppercase tracking-wide">Alumni Members</div>
                                </div>
                                <div className="text-center border-x border-maroon-200">
                                    <div className="text-3xl font-bold text-maroon-900 mb-1">95%</div>
                                    <div className="text-xs text-maroon-600 uppercase tracking-wide">Employment Rate</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-maroon-900 mb-1">50+</div>
                                    <div className="text-xs text-maroon-600 uppercase tracking-wide">Countries</div>
                                </div>
                            </div>
                        </div>

                        {/* Security Badge */}
                        <div className="flex items-center space-x-3 text-maroon-600 text-sm">
                            <div className="w-8 h-8 bg-maroon-100 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-maroon-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <span>Enterprise-grade security & data protection</span>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative z-10">
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
                            <h1 className="text-3xl font-bold text-maroon-900 mb-2">Alumni Tracer System</h1>
                            <p className="text-maroon-700">Welcome back! Please sign in</p>
                        </div>

                        <Card className="bg-white/95 backdrop-blur-xl border-maroon-100 shadow-2xl">
                            <CardHeader className="pb-6 pt-8 px-8 border-b border-gray-100">
                                <CardTitle className="text-2xl text-gray-900 font-bold text-center">Welcome Back</CardTitle>
                                <CardDescription className="text-gray-600 text-center">Sign in to access your portal</CardDescription>
                            </CardHeader>

                            <CardContent className="p-8">
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
                                        <Label htmlFor="login" className="text-sm font-semibold text-gray-700">
                                            Email or Student ID <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                {loginValidation.isEmail ? (
                                                    <Mail className="h-5 w-5 text-gray-400" />
                                                ) : (
                                                    <IdCard className="h-5 w-5 text-gray-400" />
                                                )}
                                            </div>
                                            <Input
                                                id="login"
                                                type="text"
                                                value={formData.login}
                                                onChange={(e) => handleInputChange('login', e.target.value)}
                                                className={`pl-11 pr-11 h-12 border-gray-300 focus:border-maroon-500 focus:ring-maroon-500 input-glow bg-white ${formData.login && !loginValidation.checking && !loginValidation.exists && formData.login.length >= 3
                                                    ? 'border-red-300 bg-red-50/30'
                                                    : loginValidation.exists
                                                        ? 'border-green-300 bg-green-50/30'
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
                                        <p className="text-xs text-gray-500 mt-1">You can login using your email address or student ID number</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                                            Password <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <LockIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
                                                onChange={(e) => handleInputChange('password', e.target.value)}
                                                className="pl-11 pr-11 h-12 border-gray-300 focus:border-maroon-500 focus:ring-maroon-500 input-glow bg-white"
                                                placeholder="Enter your password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                                            <a href="/forgot-password" className="text-xs text-maroon-600 hover:text-maroon-700 font-medium hover:underline">
                                                Forgot password?
                                            </a>
                                        </div>
                                    </div>

                                    {show2FAInput && (
                                        <div className="space-y-2 p-5 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="flex items-center mb-2">
                                                <div className="w-8 h-8 bg-maroon-600 rounded-lg flex items-center justify-center mr-2">
                                                    <Smartphone className="h-4 w-4 text-white" />
                                                </div>
                                                <Label htmlFor="otp-code" className="text-sm font-semibold text-gray-700 mb-0">
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
                                                className="h-14 border-gray-300 focus:border-maroon-500 focus:ring-maroon-500 bg-white text-lg text-center tracking-widest font-mono"
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
                                            <p className="text-xs text-gray-600">Enter the 6-digit code from your authenticator app</p>
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

                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={handleGoToLanding}
                                            className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 border-gray-300"
                                        >
                                            <Home className="w-4 h-4 mr-2" />
                                            Home
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleBackToSurvey}
                                            className="text-sm font-medium text-maroon-600 hover:text-maroon-700 hover:bg-maroon-50 border-maroon-300"
                                        >
                                            Register
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-center text-gray-500 mt-4">
                                        Don't have an account? <span className="font-semibold text-maroon-600">Register as an alumni first</span>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="mt-6 text-center">
                            <div className="inline-flex items-center px-4 py-2 bg-maroon-50 backdrop-blur-sm rounded-full border border-maroon-200">
                                <svg className="w-4 h-4 text-maroon-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs text-maroon-900 font-medium">Secure & Encrypted Connection</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
