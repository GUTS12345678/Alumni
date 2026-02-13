import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { GraduationCap, ArrowLeft, Eye, EyeOff, RefreshCw, AlertCircle, CheckCircle2, KeyRound, Lock, ShieldCheck } from 'lucide-react';

interface ResetPasswordProps {
    email: string;
    token: string;
}

export default function ResetPassword({ email, token }: ResetPasswordProps) {
    const [formData, setFormData] = useState({
        email: email || '',
        password: '',
        password_confirmation: '',
        token: token || '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string; password_confirmation?: string; general?: string }>({});
    const [passwordStrength, setPasswordStrength] = useState<{ score: number; label: string; color: string }>({ score: 0, label: '', color: '' });

    // Add public-page class to html for proper scrolling
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

        // Length check
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;

        // Character variety
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

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
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

        router.post('/reset-password', formData, {
            preserveState: true,
            preserveScroll: true,
            onError: (errors) => {
                console.error('Reset password error:', errors);
                setErrors(errors as { email?: string; password?: string; password_confirmation?: string; general?: string });
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
            <Head title="Reset Password - Alumni Tracer System" />

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
                            Create New Password
                        </h1>
                        <p className="text-xl text-maroon-700 mb-12 leading-relaxed">
                            Choose a strong password to secure your account. Make sure it's something you can remember but hard for others to guess.
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
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-maroon-700 to-maroon-900 bg-clip-text text-transparent mb-2">Reset Password</h1>
                            <p className="text-maroon-700 font-medium">Create your new password</p>
                        </div>

                        <Card className="border-maroon-200 shadow-2xl bg-white/95 backdrop-blur-sm">
                            <CardHeader className="bg-gradient-to-r from-maroon-50 to-beige-50 border-b border-maroon-200 pb-6">
                                <div className="flex items-center justify-center mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-maroon-600 to-maroon-700 rounded-xl flex items-center justify-center shadow-lg">
                                        <KeyRound className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                <CardTitle className="text-2xl text-maroon-900 font-bold text-center">
                                    Set New Password
                                </CardTitle>
                                <CardDescription className="text-maroon-700 text-base mt-2 text-center">
                                    Enter your new password below
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="p-8">
                                {errors.general && (
                                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm">
                                        <div className="flex items-start">
                                            <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm font-medium text-red-800">{errors.general}</p>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Hidden email field (auto-filled from URL) */}
                                    <input type="hidden" name="token" value={formData.token} />

                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-base font-semibold text-maroon-900">
                                            Email Address
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className="h-12 border-maroon-200 focus:border-maroon-600 focus:ring-maroon-600 bg-gray-50 text-maroon-900"
                                            readOnly={!!email}
                                        />
                                        {errors.email && (
                                            <p className="text-sm text-red-600 flex items-center mt-1">
                                                <AlertCircle className="h-4 w-4 mr-1" />
                                                {errors.email}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-base font-semibold text-maroon-900">
                                            New Password <span className="text-maroon-600">*</span>
                                        </Label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-maroon-600" />
                                            </div>
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
                                                onChange={(e) => handleInputChange('password', e.target.value)}
                                                className="pl-12 pr-12 h-12 border-maroon-200 focus:border-maroon-600 focus:ring-maroon-600 bg-white text-maroon-900 placeholder:text-maroon-400 text-base"
                                                placeholder="Enter new password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-maroon-600 hover:text-maroon-700 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>

                                        {/* Password strength indicator */}
                                        {formData.password && (
                                            <div className="mt-2">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs text-maroon-600">Password strength:</span>
                                                    <span className={`text-xs font-medium ${passwordStrength.label === 'Weak' ? 'text-red-600' :
                                                        passwordStrength.label === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                                                        }`}>
                                                        {passwordStrength.label}
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${passwordStrength.color} transition-all duration-300`}
                                                        style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}

                                        {errors.password && (
                                            <p className="text-sm text-red-600 flex items-center mt-1">
                                                <AlertCircle className="h-4 w-4 mr-1" />
                                                {errors.password}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password_confirmation" className="text-base font-semibold text-maroon-900">
                                            Confirm New Password <span className="text-maroon-600">*</span>
                                        </Label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-maroon-600" />
                                            </div>
                                            <Input
                                                id="password_confirmation"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={formData.password_confirmation}
                                                onChange={(e) => handleInputChange('password_confirmation', e.target.value)}
                                                className={`pl-12 pr-12 h-12 border-maroon-200 focus:border-maroon-600 focus:ring-maroon-600 bg-white text-maroon-900 placeholder:text-maroon-400 text-base ${formData.password_confirmation && formData.password === formData.password_confirmation
                                                    ? 'border-green-400'
                                                    : formData.password_confirmation && formData.password !== formData.password_confirmation
                                                        ? 'border-red-400'
                                                        : ''
                                                    }`}
                                                placeholder="Confirm new password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-maroon-600 hover:text-maroon-700 transition-colors"
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>

                                        {/* Password match indicator */}
                                        {formData.password_confirmation && (
                                            <p className={`text-sm flex items-center mt-1 ${formData.password === formData.password_confirmation
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                                }`}>
                                                {formData.password === formData.password_confirmation ? (
                                                    <>
                                                        <CheckCircle2 className="h-4 w-4 mr-1" />
                                                        Passwords match
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertCircle className="h-4 w-4 mr-1" />
                                                        Passwords do not match
                                                    </>
                                                )}
                                            </p>
                                        )}

                                        {errors.password_confirmation && (
                                            <p className="text-sm text-red-600 flex items-center mt-1">
                                                <AlertCircle className="h-4 w-4 mr-1" />
                                                {errors.password_confirmation}
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
                                                Resetting Password...
                                            </>
                                        ) : (
                                            <>
                                                <KeyRound className="h-5 w-5 mr-2" />
                                                Reset Password
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
        </>
    );
}
