import React, { useState, useEffect } from 'react';
import { BackToTop } from '@/components/ui/back-to-top';
import { Head, router } from '@inertiajs/react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { GraduationCap, Eye, EyeOff, RefreshCw, AlertCircle, CheckCircle2, KeyRound, Lock, ShieldCheck, Mail } from 'lucide-react';

interface ForcePasswordChangeProps {
    user: {
        name: string;
        email: string;
        has_placeholder_email: boolean;
    };
}

export default function ForcePasswordChange({ user }: ForcePasswordChangeProps) {
    const [formData, setFormData] = useState({
        email: user.has_placeholder_email ? '' : user.email,
        password: '',
        password_confirmation: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string; password_confirmation?: string; general?: string }>({});
    const [passwordStrength, setPasswordStrength] = useState<{ score: number; label: string; color: string }>({ score: 0, label: '', color: '' });

    useEffect(() => {
        document.documentElement.classList.add('public-page');
        return () => {
            document.documentElement.classList.remove('public-page');
        };
    }, []);

    // Evaluate password strength
    useEffect(() => {
        if (!formData.password) {
            setPasswordStrength({ score: 0, label: '', color: '' });
            return;
        }

        let score = 0;
        const password = formData.password;

        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^a-zA-Z0-9]/.test(password)) score += 1;

        let label = '';
        let color = '';

        if (score <= 2) {
            label = 'Weak';
            color = 'bg-red-500';
        } else if (score <= 4) {
            label = 'Medium';
            color = 'bg-yellow-500';
        } else {
            label = 'Strong';
            color = 'bg-green-500';
        }

        setPasswordStrength({ score: Math.min(score, 6), label, color });
    }, [formData.password]);

    const handleInputChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        if (errors[key as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [key]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: { email?: string; password?: string; password_confirmation?: string } = {};

        if (user.has_placeholder_email) {
            if (!formData.email) {
                newErrors.email = 'Please provide your real email address';
            } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = 'Please enter a valid email address';
            }
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (!formData.password_confirmation) {
            newErrors.password_confirmation = 'Please confirm your password';
        } else if (formData.password !== formData.password_confirmation) {
            newErrors.password_confirmation = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        setErrors({});

        router.post('/force-change-password', formData, {
            preserveState: true,
            preserveScroll: true,
            onError: (errors) => {
                setErrors(errors as { email?: string; password?: string; password_confirmation?: string; general?: string });
                setIsSubmitting(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <>
            <Head title="Change Your Password - Alumni Tracer System" />

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
                            Welcome, {user.name}!
                        </h1>
                        <p className="text-xl text-maroon-700 mb-12 leading-relaxed">
                            Your account was created from school records. For security, please set a new personal password before continuing.
                        </p>

                        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-maroon-200 shadow-lg">
                            <h3 className="font-semibold text-maroon-900 mb-4 flex items-center">
                                <ShieldCheck className="h-5 w-5 mr-2 text-maroon-600" />
                                Password Requirements
                            </h3>
                            <ul className="space-y-3 text-maroon-700">
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                    <span>At least 8 characters long</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                    <span>Include uppercase and lowercase letters</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                    <span>Include at least one number</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                    <span>Include at least one special character</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
                    <div className="w-full max-w-md">
                        {/* Mobile Logo */}
                        <div className="lg:hidden flex items-center justify-center mb-8">
                            <GraduationCap className="h-12 w-12 text-maroon-700" />
                            <span className="ml-3 text-2xl font-bold text-maroon-900">Alumni Tracer</span>
                        </div>

                        <Card className="border border-maroon-200 shadow-2xl bg-white/95 backdrop-blur-sm">
                            <CardHeader className="space-y-3 text-center pb-6">
                                <div className="mx-auto w-14 h-14 bg-gradient-to-br from-maroon-500 to-maroon-700 rounded-2xl flex items-center justify-center shadow-lg">
                                    <KeyRound className="h-7 w-7 text-white" />
                                </div>
                                <CardTitle className="text-2xl font-bold text-maroon-900">
                                    Set Your Password
                                </CardTitle>
                                <CardDescription className="text-maroon-600">
                                    {user.has_placeholder_email
                                        ? 'Please set a new password and provide your email address'
                                        : 'Please set a new secure password for your account'}
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                {/* Info Banner */}
                                <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-amber-800">
                                        <p className="font-medium">Account imported from school records</p>
                                        <p className="mt-1">Your initial password was set from your last name. Please change it to something more secure.</p>
                                    </div>
                                </div>

                                {errors.general && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                                        <p className="text-sm text-red-600">{errors.general}</p>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Email Field - shown if placeholder email */}
                                    {user.has_placeholder_email && (
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-maroon-800 font-medium flex items-center">
                                                <Mail className="h-4 w-4 mr-2 text-maroon-500" />
                                                Email Address <span className="text-red-500 ml-1">*</span>
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                placeholder="your.email@example.com"
                                                className={`h-12 border-maroon-200 focus:border-maroon-500 focus:ring-maroon-500 ${errors.email ? 'border-red-500' : ''}`}
                                                disabled={isSubmitting}
                                            />
                                            {errors.email && (
                                                <p className="text-sm text-red-500 flex items-center">
                                                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                                                    {errors.email}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* New Password */}
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-maroon-800 font-medium flex items-center">
                                            <Lock className="h-4 w-4 mr-2 text-maroon-500" />
                                            New Password
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
                                                onChange={(e) => handleInputChange('password', e.target.value)}
                                                placeholder="Enter your new password"
                                                className={`h-12 pr-12 border-maroon-200 focus:border-maroon-500 focus:ring-maroon-500 ${errors.password ? 'border-red-500' : ''}`}
                                                disabled={isSubmitting}
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-maroon-400 hover:text-maroon-700 transition-colors"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>

                                        {/* Password Strength Indicator */}
                                        {formData.password && (
                                            <div className="space-y-1.5">
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5, 6].map((level) => (
                                                        <div
                                                            key={level}
                                                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${level <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                                <p className={`text-xs font-medium ${passwordStrength.score <= 2 ? 'text-red-500' :
                                                    passwordStrength.score <= 4 ? 'text-yellow-600' : 'text-green-600'
                                                    }`}>
                                                    Password strength: {passwordStrength.label}
                                                </p>
                                            </div>
                                        )}

                                        {errors.password && (
                                            <p className="text-sm text-red-500 flex items-center">
                                                <AlertCircle className="h-3.5 w-3.5 mr-1" />
                                                {errors.password}
                                            </p>
                                        )}
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="space-y-2">
                                        <Label htmlFor="password_confirmation" className="text-maroon-800 font-medium flex items-center">
                                            <Lock className="h-4 w-4 mr-2 text-maroon-500" />
                                            Confirm New Password
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="password_confirmation"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={formData.password_confirmation}
                                                onChange={(e) => handleInputChange('password_confirmation', e.target.value)}
                                                placeholder="Confirm your new password"
                                                className={`h-12 pr-12 border-maroon-200 focus:border-maroon-500 focus:ring-maroon-500 ${errors.password_confirmation ? 'border-red-500' : ''}`}
                                                disabled={isSubmitting}
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-maroon-400 hover:text-maroon-700 transition-colors"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>

                                        {/* Match indicator */}
                                        {formData.password_confirmation && (
                                            <p className={`text-xs flex items-center ${formData.password === formData.password_confirmation ? 'text-green-600' : 'text-red-500'
                                                }`}>
                                                {formData.password === formData.password_confirmation ? (
                                                    <>
                                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                                        Passwords match
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertCircle className="h-3.5 w-3.5 mr-1" />
                                                        Passwords do not match
                                                    </>
                                                )}
                                            </p>
                                        )}

                                        {errors.password_confirmation && (
                                            <p className="text-sm text-red-500 flex items-center">
                                                <AlertCircle className="h-3.5 w-3.5 mr-1" />
                                                {errors.password_confirmation}
                                            </p>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full h-12 bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-700 hover:to-maroon-800 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                                                Updating Password...
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck className="h-5 w-5 mr-2" />
                                                Set New Password & Continue
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            <BackToTop />
        </>
    );
}
