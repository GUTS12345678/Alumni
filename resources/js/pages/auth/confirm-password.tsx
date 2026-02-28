import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { GraduationCap, Lock, Eye, EyeOff, RefreshCw, AlertCircle, Shield } from 'lucide-react';

export default function ConfirmPassword() {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ password?: string }>({});

    useEffect(() => {
        document.documentElement.classList.add('public-page');
        return () => { document.documentElement.classList.remove('public-page'); };
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) {
            setErrors({ password: 'Password is required' });
            return;
        }
        setIsSubmitting(true);
        setErrors({});

        router.post('/confirm-password', { password }, {
            onError: (errs) => {
                setErrors(errs as { password?: string });
                setIsSubmitting(false);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <>
            <Head title="Confirm Password - Alumni Tracer System" />
            <div className="min-h-screen bg-gradient-to-br from-maroon-50 via-beige-50 to-maroon-100 flex items-center justify-center px-4 py-12 relative overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-maroon-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-beige-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
                </div>

                <div className="w-full max-w-md relative z-10">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center mb-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-maroon-400 rounded-full blur-xl opacity-40 animate-pulse" />
                                <GraduationCap className="h-14 w-14 text-maroon-700 relative z-10" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-maroon-700 to-maroon-900 bg-clip-text text-transparent mb-2">
                            Confirm Password
                        </h1>
                    </div>

                    <Card className="border-maroon-200 shadow-2xl bg-white/95 backdrop-blur-sm">
                        <CardHeader className="bg-gradient-to-r from-maroon-50 to-beige-50 border-b border-maroon-200 pb-6">
                            <div className="flex items-center justify-center mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-maroon-600 to-maroon-700 rounded-xl flex items-center justify-center shadow-lg">
                                    <Shield className="h-6 w-6 text-white" />
                                </div>
                            </div>
                            <CardTitle className="text-center text-xl text-maroon-900">Security Check</CardTitle>
                            <CardDescription className="text-center text-maroon-600">
                                This is a secure area. Please confirm your password before continuing.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-maroon-800 font-medium">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-maroon-400" />
                                        <Input id="password" name="password" type={showPassword ? 'text' : 'password'}
                                            value={password} onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10 pr-10 border-maroon-200 focus:border-maroon-500 focus:ring-maroon-200"
                                            placeholder="Enter your password" autoFocus />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-maroon-400 hover:text-maroon-600">
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-red-500 text-sm flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />{errors.password}
                                        </p>
                                    )}
                                </div>

                                <Button type="submit" disabled={isSubmitting}
                                    className="w-full bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-700 hover:to-maroon-800 text-white h-12 text-base font-semibold shadow-lg">
                                    {isSubmitting ? (
                                        <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Confirming...</>
                                    ) : (
                                        <><Lock className="h-4 w-4 mr-2" />Confirm Password</>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
