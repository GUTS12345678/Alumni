import React, { useState, useEffect } from 'react';
import { BackToTop } from '@/components/ui/back-to-top';
import { Head, router } from '@inertiajs/react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { GraduationCap, ArrowLeft, Mail, RefreshCw, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import axios from 'axios';

interface ForgotPasswordProps {
    status?: string;
}

export default function ForgotPassword({ status }: ForgotPasswordProps) {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; general?: string }>({});
    const [successMessage, setSuccessMessage] = useState(status || '');
    const [emailValidation, setEmailValidation] = useState<{
        checking: boolean;
        exists: boolean;
        message: string;
    }>({ checking: false, exists: false, message: '' });

    // Add public-page class to html for proper scrolling
    useEffect(() => {
        document.documentElement.classList.add('public-page');
        return () => {
            document.documentElement.classList.remove('public-page');
        };
    }, []);

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
            if (!email || !/\S+@\S+\.\S+/.test(email)) {
                setEmailValidation({ checking: false, exists: false, message: '' });
                return;
            }

            setEmailValidation({ checking: true, exists: false, message: 'Checking email...' });

            try {
                const response = await axios.post('/api/v1/check-email', { email });

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
                        message: 'Email not registered.'
                    });
                }
            } catch {
                setEmailValidation({ checking: false, exists: false, message: '' });
            }
        };

        const timer = setTimeout(checkEmailExists, 800);
        return () => clearTimeout(timer);
    }, [email]);

    const validateForm = () => {
        const newErrors: { email?: string } = {};

        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        setErrors({});
        setSuccessMessage('');

        router.post('/forgot-password', { email }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: (page) => {
                // Check for status in flash messages
                const pageProps = page.props as { status?: string };
                if (pageProps.status) {
                    setSuccessMessage(pageProps.status);
                } else {
                    setSuccessMessage('A reset link will be sent if the account exists.');
                }
                setEmail('');
                setIsSubmitting(false);
            },
            onError: (errors) => {
                console.error('Forgot password error:', errors);
                setErrors(errors as { email?: string; general?: string });
                setIsSubmitting(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleBackToLogin = () => {
        window.location.href = '/login';
    };

    return (
        <>
            <Head title="Forgot Password - Alumni Tracer System" />

            <div className="min-h-screen bg-gradient-to-br from-maroon-50 via-beige-50 to-maroon-100 flex relative overflow-x-hidden">
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
                            Forgot Password?
                        </h1>
                        <p className="text-xl text-maroon-700 mb-12 leading-relaxed">
                            Don't worry! It happens to the best of us. Enter your email address and we'll send you a link to reset your password.
                        </p>

                        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-maroon-200 shadow-lg">
                            <h3 className="font-semibold text-maroon-900 mb-4 flex items-center">
                                <KeyRound className="h-5 w-5 mr-2 text-maroon-600" />
                                Password Reset Process
                            </h3>
                            <ol className="space-y-3 text-maroon-700">
                                <li className="flex items-start">
                                    <span className="bg-maroon-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 flex-shrink-0 mt-0.5">1</span>
                                    <span>Enter your registered email address</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="bg-maroon-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 flex-shrink-0 mt-0.5">2</span>
                                    <span>Check your inbox for the reset link</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="bg-maroon-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 flex-shrink-0 mt-0.5">3</span>
                                    <span>Click the link and create a new password</span>
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
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
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-maroon-700 to-maroon-900 bg-clip-text text-transparent mb-2">Forgot Password</h1>
                            <p className="text-maroon-700 font-medium">We'll help you reset it</p>
                        </div>

                        <Card className="border-maroon-200 shadow-2xl bg-white/95 backdrop-blur-sm">
                            <CardHeader className="bg-gradient-to-r from-maroon-50 to-beige-50 border-b border-maroon-200 pb-6">
                                <div className="flex items-center justify-center mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-maroon-600 to-maroon-700 rounded-xl flex items-center justify-center shadow-lg">
                                        <KeyRound className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                <CardTitle className="text-2xl text-maroon-900 font-bold text-center">
                                    Reset Your Password
                                </CardTitle>
                                <CardDescription className="text-maroon-700 text-base mt-2 text-center">
                                    Enter your email to receive a password reset link
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="p-8">
                                {successMessage && (
                                    <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg shadow-sm">
                                        <div className="flex items-start">
                                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-green-800">{successMessage}</p>
                                                <p className="text-xs text-green-600 mt-1">Please check your email inbox and spam folder.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {errors.general && (
                                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm">
                                        <div className="flex items-start">
                                            <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm font-medium text-red-800">{errors.general}</p>
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
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className={`pl-12 pr-10 h-12 border-maroon-200 focus:border-maroon-600 focus:ring-maroon-600 bg-white text-maroon-900 placeholder:text-maroon-400 text-base ${email && !emailValidation.checking && !emailValidation.exists && /\S+@\S+\.\S+/.test(email)
                                                    ? 'border-amber-400'
                                                    : emailValidation.exists
                                                        ? 'border-green-400'
                                                        : ''
                                                    }`}
                                                placeholder="you@example.com"
                                            />
                                            {/* Email validation indicator */}
                                            {email && /\S+@\S+\.\S+/.test(email) && (
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
                                                        <AlertCircle className="h-5 w-5 text-amber-500" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {/* Show email validation message */}
                                        {email && /\S+@\S+\.\S+/.test(email) && !emailValidation.checking && !emailValidation.exists && (
                                            <p className="text-sm text-amber-600 flex items-center mt-1">
                                                <AlertCircle className="h-4 w-4 mr-1" />
                                                This email may not be registered. We'll still send a reset link if it exists.
                                            </p>
                                        )}
                                        {errors.email && (
                                            <p className="text-sm text-red-600 flex items-center mt-1">
                                                <AlertCircle className="h-4 w-4 mr-1" />
                                                {errors.email}
                                            </p>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full h-12 bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-700 hover:to-maroon-800 text-white text-base font-semibold shadow-lg hover:shadow-xl hover:shadow-maroon-500/50 transition-all duration-300"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                                                Sending Reset Link...
                                            </>
                                        ) : (
                                            <>
                                                <Mail className="h-5 w-5 mr-2" />
                                                Send Reset Link
                                            </>
                                        )}
                                    </Button>
                                </form>

                                <div className="mt-6 pt-6 border-t border-maroon-200">
                                    <div className="text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleBackToLogin}
                                            className="text-sm text-maroon-600 hover:text-maroon-900 hover:bg-maroon-50"
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            Back to Login
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
            <BackToTop />
        </>
    );
}
