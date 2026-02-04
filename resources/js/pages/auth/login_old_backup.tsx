import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { GraduationCap, ArrowLeft, Eye, EyeOff, RefreshCw, Mail, Lock as LockIcon, Sparkles, AlertCircle, Smartphone, Users, TrendingUp, Globe, Award, Heart } from 'lucide-react';
import axios from 'axios';

interface LoginErrors {
    email?: string;
    password?: string;
    otp_code?: string;
    general?: string;
    message?: string;
    [key: string]: string | undefined;
}

export default function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        otp_code: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<LoginErrors>({});
    const [csrfError, setCsrfError] = useState(false);
    const [show2FAInput, setShow2FAInput] = useState(false);
    const [emailValidation, setEmailValidation] = useState<{
        checking: boolean;
        exists: boolean;
        message: string;
    }>({ checking: false, exists: false, message: '' });

    // Setup axios to include CSRF token from meta tag
    useEffect(() => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (token) {
            axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
        }
    }, []);

    // Debounced email validation - check if email exists in database
    useEffect(() => {
        const checkEmailExists = async () => {
            if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
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
                        message: 'Email found'
                    });
                } else {
                    setEmailValidation({
                        checking: false,
                        exists: false,
                        message: 'Email not registered. Please register first or check your email.'
                    });
                }
            } catch {
                setEmailValidation({ checking: false, exists: false, message: '' });
            }
        };

        const timer = setTimeout(checkEmailExists, 800);
        return () => clearTimeout(timer);
    }, [formData.email]);

    const handleInputChange = (key: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [key]: value }));

        if (errors[key]) {
            setErrors(prev => ({ ...prev, [key]: '' }));
        }

        // Auto-submit when 6 digits are entered for OTP
        if (key === 'otp_code' && typeof value === 'string' && value.length === 6 && show2FAInput) {
            setTimeout(() => {
                const submitEvent = { preventDefault: () => { } } as React.FormEvent;
                handleSubmit(submitEvent);
            }, 100);
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        } else if (!emailValidation.exists && !emailValidation.checking) {
            newErrors.email = 'This email is not registered. Please register first.';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        // Only validate OTP if 2FA is enabled and input is shown
        if (show2FAInput && formData.otp_code.length !== 6) {
            newErrors.otp_code = 'OTP code must be 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRefreshPage = () => {
        window.location.reload();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        setCsrfError(false);
        setErrors({}); // Clear previous errors

        // Use Inertia router with proper error handling
        router.post('/login', {
            email: formData.email,
            password: formData.password,
            otp_code: formData.otp_code,
            remember: false,
        }, {
            preserveState: false,  // Changed to false to allow redirect
            preserveScroll: false,
            onError: (errors: LoginErrors) => {
                console.error('Login error:', errors);

                // Handle CSRF errors
                if (errors.message && (errors.message.includes('419') || errors.message.includes('expired'))) {
                    setCsrfError(true);
                    setErrors({ general: 'Session expired. Refresh page.' });
                }
                // Handle 2FA required (status 202 from backend)
                else if (errors.otp_code && errors.otp_code.includes('Please enter')) {
                    setShow2FAInput(true);  // Show the Google Authenticator input field
                    setErrors({ otp_code: errors.otp_code }); // Show message
                    setFormData(prev => ({ ...prev, otp_code: '' })); // Clear OTP field
                }
                // Handle other validation errors
                else {
                    setErrors(errors);
                    if (!errors.email && !errors.password && !errors.otp_code && !errors.general) {
                        setErrors({ ...errors, general: errors.message || 'Login failed.' });
                    }
                }

                setIsSubmitting(false);
            },
            onSuccess: () => {
                console.log('Login successful - redirecting...');
                // Inertia will handle the redirect automatically
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

    return (
        <>
            <Head title="Login - Alumni Tracer System" />

            <div className="min-h-screen bg-gradient-to-br from-maroon-50 via-beige-50 to-maroon-100 flex relative overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-maroon-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-beige-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-maroon-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
                </div>

                {/* Left Side - Branding & Info */}
                <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-20 relative z-10">
                    <div className="max-w-xl">
                        <div className="flex items-center mb-8">
                            <div className="relative">
                                <div className="absolute inset-0 bg-maroon-400 rounded-full blur-xl opacity-40 animate-pulse"></div>
                                <GraduationCap className="h-16 w-16 text-maroon-700 relative z-10" />
                            </div>
                        </div>

                        <h1 className="text-5xl font-bold bg-gradient-to-r from-maroon-700 to-maroon-900 bg-clip-text text-transparent mb-4 tracking-tight">
                            Alumni Tracer System
                        </h1>
                        <p className="text-xl text-maroon-700 mb-12 leading-relaxed">
                            Stay connected, track your career journey, and contribute to the growth of our alumni community.
                        </p>

                        {/* Features Grid */}
                        <div className="grid grid-cols-2 gap-6 mb-12">
                            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 border border-maroon-200 shadow-lg hover:shadow-xl hover:bg-white transition-all">
                                <Users className="h-8 w-8 text-maroon-600 mb-3" />
                                <h3 className="font-semibold text-maroon-900 mb-1">Connect</h3>
                                <p className="text-sm text-maroon-600">Build your professional network</p>
                            </div>
                            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 border border-maroon-200 shadow-lg hover:shadow-xl hover:bg-white transition-all">
                                <TrendingUp className="h-8 w-8 text-maroon-600 mb-3" />
                                <h3 className="font-semibold text-maroon-900 mb-1">Track Progress</h3>
                                <p className="text-sm text-maroon-600">Monitor your career growth</p>
                            </div>
                            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 border border-maroon-200 shadow-lg hover:shadow-xl hover:bg-white transition-all">
                                <Globe className="h-8 w-8 text-maroon-600 mb-3" />
                                <h3 className="font-semibold text-maroon-900 mb-1">Global Reach</h3>
                                <p className="text-sm text-maroon-600">Connect worldwide</p>
                            </div>
                            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 border border-maroon-200 shadow-lg hover:shadow-xl hover:bg-white transition-all">
                                <Award className="h-8 w-8 text-maroon-600 mb-3" />
                                <h3 className="font-semibold text-maroon-900 mb-1">Opportunities</h3>
                                <p className="text-sm text-maroon-600">Discover career paths</p>
                            </div>
                        </div>

                        {/* Statistics */}
                        <div className="flex items-center gap-8 text-sm">
                            <div>
                                <div className="text-3xl font-bold text-maroon-900">10K+</div>
                                <div className="text-maroon-600">Alumni Members</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-maroon-900">95%</div>
                                <div className="text-maroon-600">Employment Rate</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-maroon-900">50+</div>
                                <div className="text-maroon-600">Countries</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12 relative z-10">
                    <div className="w-full max-w-md">
                        {/* Mobile Logo */}
                        <div className="lg:hidden text-center mb-8 animate-fade-in">
                            <div className="flex items-center justify-center mb-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-maroon-400 rounded-full blur-xl opacity-40 animate-pulse"></div>
                                    <GraduationCap className="h-14 w-14 text-maroon-700 relative z-10" />
                                </div>
                            </div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-maroon-700 to-maroon-900 bg-clip-text text-transparent mb-2">Alumni Tracer System</h1>
                            <p className="text-maroon-700 font-medium">Welcome back! Please sign in</p>
                        </div>

                        <Card className="border-maroon-200 shadow-2xl bg-white/95 backdrop-blur-sm">
                            <CardHeader className="bg-gradient-to-r from-maroon-50 to-beige-50 border-b border-maroon-200 pb-6">
                                <div className="flex items-center justify-center mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-maroon-600 to-maroon-700 rounded-xl flex items-center justify-center shadow-lg">
                                        <Heart className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                <CardTitle className="text-2xl text-maroon-900 font-bold text-center">
                                    Sign In to Your Account
                                </CardTitle>
                                <CardDescription className="text-maroon-700 text-base mt-2 text-center">
                                    Enter your credentials to access your portal
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="p-8">
                                {errors.general && (
                                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm">
                                        <div className="flex items-start">
                                            <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-red-800">{errors.general}</p>
                                                {csrfError && (
                                                    <Button
                                                        type="button"
                                                        onClick={handleRefreshPage}
                                                        className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white shadow-sm"
                                                    >
                                                        <RefreshCw className="h-4 w-4 mr-2" />
                                                        Refresh Page
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-base font-semibold text-maroon-900">
                                            Email Address <span className="text-maroon-600">*</span>
                                        </Label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Mail className="h-5 w-5 text-maroon-600" />
                                            </div>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                className={`pl-12 pr-10 h-12 border-maroon-200 focus:border-maroon-600 focus:ring-maroon-600 bg-white text-maroon-900 placeholder:text-maroon-400 text-base ${formData.email && !emailValidation.checking && !emailValidation.exists && /\S+@\S+\.\S+/.test(formData.email)
                                                    ? 'border-red-400'
                                                    : emailValidation.exists
                                                        ? 'border-green-400'
                                                        : ''
                                                    }`}
                                                placeholder="you@example.com"
                                            />
                                            {/* Email validation indicator */}
                                            {formData.email && /\S+@\S+\.\S+/.test(formData.email) && (
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                    {emailValidation.checking ? (
                                                        <RefreshCw className="h-5 w-5 text-maroon-500 animate-spin" />
                                                    ) : emailValidation.exists ? (
                                                        <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                                                            <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                    ) : (
                                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {/* Show email validation message */}
                                        {formData.email && /\S+@\S+\.\S+/.test(formData.email) && !emailValidation.checking && !emailValidation.exists && (
                                            <p className="text-sm text-amber-600 flex items-center mt-1">
                                                <AlertCircle className="h-4 w-4 mr-1" />
                                                This email is not registered. Did you mean to register?
                                            </p>
                                        )}
                                        {errors.email && (
                                            <p className="text-sm text-red-600 flex items-center mt-1">
                                                <AlertCircle className="h-4 w-4 mr-1" />
                                                {errors.email}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-base font-semibold text-maroon-900">
                                            Password <span className="text-maroon-600">*</span>
                                        </Label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <LockIcon className="h-5 w-5 text-maroon-600" />
                                            </div>
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
                                                onChange={(e) => handleInputChange('password', e.target.value)}
                                                className="pl-12 pr-12 h-12 border-maroon-200 focus:border-maroon-600 focus:ring-maroon-600 bg-white text-maroon-900 placeholder:text-maroon-400 text-base"
                                                placeholder="Enter your password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-maroon-600 hover:text-maroon-700 transition-colors"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-5 w-5" />
                                                ) : (
                                                    <Eye className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className="text-sm text-red-600 flex items-center mt-1">
                                                <AlertCircle className="h-4 w-4 mr-1" />
                                                {errors.password}
                                            </p>
                                        )}

                                        {/* Forgot Password Link */}
                                        <div className="text-right">
                                            <a
                                                href="/forgot-password"
                                                className="text-sm text-maroon-600 hover:text-maroon-800 hover:underline font-medium transition-colors"
                                            >
                                                Forgot your password?
                                            </a>
                                        </div>
                                    </div>

                                    {/* Google Authenticator Input - Shows when 2FA is required */}
                                    {show2FAInput && (
                                        <div className="space-y-2 p-4 bg-maroon-50 rounded-lg border border-maroon-200">
                                            <div className="flex items-center mb-2">
                                                <Smartphone className="h-5 w-5 text-maroon-600 mr-2" />
                                                <Label htmlFor="otp-code" className="text-sm font-semibold text-maroon-900 mb-0">
                                                    Google Authenticator Code <span className="text-maroon-600">*</span>
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
                                                className="h-12 border-maroon-200 focus:border-maroon-600 focus:ring-maroon-600 bg-white text-maroon-900 placeholder:text-maroon-400 text-base text-center tracking-widest font-mono"
                                                placeholder="000000"
                                                maxLength={6}
                                                autoComplete="off"
                                                autoFocus
                                            />
                                            {errors.otp_code && (
                                                <p className="text-sm text-red-600 flex items-center mt-1">
                                                    <AlertCircle className="h-4 w-4 mr-1" />
                                                    {errors.otp_code}
                                                </p>
                                            )}
                                            <p className="text-xs text-maroon-600">
                                                Enter the 6-digit code from your Google Authenticator app
                                            </p>
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full h-12 bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-700 hover:to-maroon-800 text-white text-base font-semibold shadow-lg hover:shadow-xl hover:shadow-maroon-500/50 transition-all duration-300"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                                                Signing In...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-5 w-5 mr-2" />
                                                Sign In
                                            </>
                                        )}
                                    </Button>
                                </form>

                                <div className="mt-6 pt-6 border-t border-maroon-200">
                                    <div className="text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleBackToSurvey}
                                            className="text-sm text-maroon-600 hover:text-maroon-900 hover:bg-maroon-50"
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            Back to Alumni Registration
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Security Notice */}
                        <div className="mt-6 text-center">
                            <p className="text-xs text-maroon-600 flex items-center justify-center gap-2">
                                <span>🔒</span>
                                <span>Your connection is secure and encrypted</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}