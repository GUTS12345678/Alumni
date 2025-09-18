import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { GraduationCap, User, Shield, ArrowLeft, Eye, EyeOff } from 'lucide-react';

type UserType = 'alumni' | 'admin' | null;

export default function Login() {
    const [selectedUserType, setSelectedUserType] = useState<UserType>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleUserTypeSelect = (type: UserType) => {
        setSelectedUserType(type);
        setErrors({});
    };

    const handleInputChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        if (errors[key]) {
            setErrors(prev => ({ ...prev, [key]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);

        router.post('/login', {
            email: formData.email,
            password: formData.password,
            remember: false,
        }, {
            onError: (errors) => {
                setErrors(errors);
                setIsSubmitting(false);
            },
            onSuccess: () => {
                // Login successful, Inertia will handle the redirect
                setIsSubmitting(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    const handleBackToSurvey = () => {
        window.location.href = '/';
    };

    if (!selectedUserType) {
        return (
            <>
                <Head title="Login - Alumni Tracer System" />

                <div className="min-h-screen bg-gradient-to-br from-beige-50 to-beige-100 flex items-center justify-center px-4">
                    <div className="w-full max-w-md">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="flex items-center justify-center mb-4">
                                <GraduationCap className="h-12 w-12 text-maroon-600 mr-3" />
                                <div>
                                    <h1 className="text-3xl font-bold text-maroon-800">Alumni Tracer System</h1>
                                    <p className="text-maroon-600">Choose your login type</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Alumni Login Card */}
                            <Card
                                className="cursor-pointer transition-all hover:shadow-lg hover:border-maroon-300 border-2"
                                onClick={() => handleUserTypeSelect('alumni')}
                            >
                                <CardHeader className="text-center pb-4">
                                    <div className="mx-auto w-16 h-16 bg-maroon-100 rounded-full flex items-center justify-center mb-4">
                                        <User className="h-8 w-8 text-maroon-600" />
                                    </div>
                                    <CardTitle className="text-xl text-maroon-800">Alumni Login</CardTitle>
                                    <CardDescription className="text-maroon-600">
                                        Access your alumni profile and career information
                                    </CardDescription>
                                </CardHeader>
                            </Card>

                            {/* Admin Login Card */}
                            <Card
                                className="cursor-pointer transition-all hover:shadow-lg hover:border-maroon-300 border-2"
                                onClick={() => handleUserTypeSelect('admin')}
                            >
                                <CardHeader className="text-center pb-4">
                                    <div className="mx-auto w-16 h-16 bg-maroon-100 rounded-full flex items-center justify-center mb-4">
                                        <Shield className="h-8 w-8 text-maroon-600" />
                                    </div>
                                    <CardTitle className="text-xl text-maroon-800">Administrator Login</CardTitle>
                                    <CardDescription className="text-maroon-600">
                                        Access administrative features and system management
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </div>

                        {/* Back to Survey Button */}
                        <div className="mt-8 text-center">
                            <Button
                                variant="ghost"
                                onClick={handleBackToSurvey}
                                className="text-maroon-600 hover:text-maroon-800 hover:bg-maroon-50"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Alumni Registration Survey
                            </Button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={`${selectedUserType === 'admin' ? 'Administrator' : 'Alumni'} Login - Alumni Tracer System`} />

            <div className="min-h-screen bg-gradient-to-br from-beige-50 to-beige-100 flex items-center justify-center px-4">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center mb-4">
                            <GraduationCap className="h-12 w-12 text-maroon-600 mr-3" />
                            <div>
                                <h1 className="text-2xl font-bold text-maroon-800">Alumni Tracer System</h1>
                                <p className="text-maroon-600">
                                    {selectedUserType === 'admin' ? 'Administrator' : 'Alumni'} Login
                                </p>
                            </div>
                        </div>
                    </div>

                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="bg-beige-50 border-b border-beige-200 text-center">
                            <div className="mx-auto w-16 h-16 bg-maroon-100 rounded-full flex items-center justify-center mb-4">
                                {selectedUserType === 'admin' ? (
                                    <Shield className="h-8 w-8 text-maroon-600" />
                                ) : (
                                    <User className="h-8 w-8 text-maroon-600" />
                                )}
                            </div>
                            <CardTitle className="text-xl text-maroon-800">
                                {selectedUserType === 'admin' ? 'Administrator Login' : 'Alumni Login'}
                            </CardTitle>
                            <CardDescription className="text-maroon-600">
                                Enter your credentials to access the system
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-6">
                            {errors.general && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                    <p className="text-sm text-red-600">{errors.general}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-base font-medium text-maroon-800">
                                        Email Address <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className="border-beige-300 focus:border-maroon-500 focus:ring-maroon-500"
                                        placeholder="Enter your email address"
                                    />
                                    {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-base font-medium text-maroon-800">
                                        Password <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={(e) => handleInputChange('password', e.target.value)}
                                            className="border-beige-300 focus:border-maroon-500 focus:ring-maroon-500 pr-10"
                                            placeholder="Enter your password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-maroon-700 hover:bg-maroon-800 text-white"
                                >
                                    {isSubmitting ? 'Signing In...' : 'Sign In'}
                                </Button>
                            </form>

                            <div className="mt-6 pt-4 border-t border-beige-200 space-y-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => setSelectedUserType(null)}
                                    className="w-full text-maroon-600 hover:text-maroon-800 hover:bg-maroon-50"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Choose Different Login Type
                                </Button>

                                <div className="text-center">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleBackToSurvey}
                                        className="text-sm text-maroon-600 hover:text-maroon-800 hover:bg-maroon-50"
                                    >
                                        Back to Alumni Registration Survey
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
