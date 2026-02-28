import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { GraduationCap, Eye, EyeOff, RefreshCw, Mail, Lock as LockIcon, User, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        document.documentElement.classList.add('public-page');
        return () => { document.documentElement.classList.remove('public-page'); };
    }, []);

    useEffect(() => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (token) {
            import('axios').then(({ default: axios }) => {
                axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
            });
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (errors[e.target.name]) {
            setErrors(prev => { const n = { ...prev }; delete n[e.target.name]; return n; });
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Enter a valid email';
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        if (formData.password !== formData.password_confirmation) newErrors.password_confirmation = 'Passwords do not match';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsSubmitting(true);
        setErrors({});

        router.post('/register', formData, {
            onError: (errs) => {
                setErrors(errs as Record<string, string>);
                setIsSubmitting(false);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const passwordChecks = [
        { label: 'At least 8 characters', met: formData.password.length >= 8 },
        { label: 'Contains uppercase', met: /[A-Z]/.test(formData.password) },
        { label: 'Contains number', met: /\d/.test(formData.password) },
        { label: 'Passwords match', met: formData.password.length > 0 && formData.password === formData.password_confirmation },
    ];

    return (
        <>
            <Head title="Register - Alumni Tracer System" />
            <div className="min-h-screen bg-gradient-to-br from-maroon-50 via-beige-50 to-maroon-100 flex relative overflow-x-hidden">
                {/* Decorative Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-maroon-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-beige-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
                </div>

                {/* Left Side - Branding */}
                <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-20 relative z-10">
                    <div className="max-w-xl">
                        <div className="flex items-center mb-8">
                            <div className="relative">
                                <div className="absolute inset-0 bg-maroon-400 rounded-full blur-xl opacity-40 animate-pulse" />
                                <GraduationCap className="h-16 w-16 text-maroon-700 relative z-10" />
                            </div>
                        </div>
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-maroon-700 to-maroon-900 bg-clip-text text-transparent mb-4 tracking-tight">
                            Join Our Network
                        </h1>
                        <p className="text-xl text-maroon-700 mb-12 leading-relaxed">
                            Create your alumni account to connect with fellow graduates, access career resources, and stay engaged with your alma mater.
                        </p>

                        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-maroon-200 shadow-lg">
                            <h3 className="font-semibold text-maroon-900 mb-4 flex items-center">
                                <User className="h-5 w-5 mr-2 text-maroon-600" />
                                Why Register?
                            </h3>
                            <ul className="space-y-3 text-maroon-700">
                                {['Connect with fellow alumni', 'Access job board and career tools', 'Participate in surveys and events', 'Build your professional profile'].map((item, i) => (
                                    <li key={i} className="flex items-start">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12 relative z-10">
                    <div className="w-full max-w-md">
                        {/* Mobile Logo */}
                        <div className="lg:hidden text-center mb-8">
                            <div className="flex items-center justify-center mb-6">
                                <GraduationCap className="h-14 w-14 text-maroon-700" />
                            </div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-maroon-700 to-maroon-900 bg-clip-text text-transparent mb-2">Create Account</h1>
                            <p className="text-maroon-700">Join the alumni network</p>
                        </div>

                        <Card className="border-maroon-200 shadow-2xl bg-white/95 backdrop-blur-sm">
                            <CardHeader className="bg-gradient-to-r from-maroon-50 to-beige-50 border-b border-maroon-200 pb-6">
                                <div className="flex items-center justify-center mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-maroon-600 to-maroon-700 rounded-xl flex items-center justify-center shadow-lg">
                                        <User className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                <CardTitle className="text-center text-xl text-maroon-900">Create Account</CardTitle>
                                <CardDescription className="text-center text-maroon-600">Fill in your details to get started</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-maroon-800 font-medium">Full Name</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-maroon-400" />
                                            <Input id="name" name="name" value={formData.name} onChange={handleChange}
                                                className="pl-10 border-maroon-200 focus:border-maroon-500 focus:ring-maroon-200"
                                                placeholder="Enter your full name" />
                                        </div>
                                        {errors.name && <p className="text-red-500 text-sm flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-maroon-800 font-medium">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-maroon-400" />
                                            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange}
                                                className="pl-10 border-maroon-200 focus:border-maroon-500 focus:ring-maroon-200"
                                                placeholder="your@email.com" />
                                        </div>
                                        {errors.email && <p className="text-red-500 text-sm flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.email}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-maroon-800 font-medium">Password</Label>
                                        <div className="relative">
                                            <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-maroon-400" />
                                            <Input id="password" name="password" type={showPassword ? 'text' : 'password'}
                                                value={formData.password} onChange={handleChange}
                                                className="pl-10 pr-10 border-maroon-200 focus:border-maroon-500 focus:ring-maroon-200"
                                                placeholder="Create a password" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-maroon-400 hover:text-maroon-600">
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {errors.password && <p className="text-red-500 text-sm flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.password}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password_confirmation" className="text-maroon-800 font-medium">Confirm Password</Label>
                                        <div className="relative">
                                            <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-maroon-400" />
                                            <Input id="password_confirmation" name="password_confirmation"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={formData.password_confirmation} onChange={handleChange}
                                                className="pl-10 pr-10 border-maroon-200 focus:border-maroon-500 focus:ring-maroon-200"
                                                placeholder="Confirm your password" />
                                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-maroon-400 hover:text-maroon-600">
                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {errors.password_confirmation && <p className="text-red-500 text-sm flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.password_confirmation}</p>}
                                    </div>

                                    {/* Password Strength */}
                                    {formData.password && (
                                        <div className="space-y-1.5 p-3 bg-maroon-50 rounded-lg border border-maroon-100">
                                            {passwordChecks.map((check, i) => (
                                                <div key={i} className="flex items-center gap-2 text-xs">
                                                    <CheckCircle2 className={`h-3.5 w-3.5 ${check.met ? 'text-green-600' : 'text-gray-300'}`} />
                                                    <span className={check.met ? 'text-green-700' : 'text-gray-500'}>{check.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <Button type="submit" disabled={isSubmitting}
                                        className="w-full bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-700 hover:to-maroon-800 text-white h-12 text-base font-semibold shadow-lg">
                                        {isSubmitting ? (
                                            <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Creating Account...</>
                                        ) : (
                                            'Create Account'
                                        )}
                                    </Button>

                                    <div className="text-center pt-2">
                                        <button type="button" onClick={() => window.location.href = '/login'}
                                            className="text-maroon-600 hover:text-maroon-800 text-sm font-medium inline-flex items-center gap-1">
                                            <ArrowLeft className="h-3 w-3" />
                                            Already have an account? Sign in
                                        </button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
