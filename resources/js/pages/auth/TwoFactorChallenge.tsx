import React from 'react';
import { BackToTop } from '@/components/ui/back-to-top';
import { Head, useForm } from '@inertiajs/react';
import { Shield, ArrowLeft, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TwoFactorChallenge() {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('two-factor.verify'));
    };

    const handleCancel = () => {
        window.location.href = '/login';
    };

    return (
        <>
            <Head title="Two-Factor Authentication" />

            <div className="min-h-screen bg-gradient-to-br from-maroon-50 to-beige-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-maroon-100 rounded-full mb-4">
                            <Shield className="h-8 w-8 text-maroon-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Two-Factor Authentication
                        </h1>
                        <p className="text-gray-600">
                            Enter the code from your authenticator app
                        </p>
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start">
                            <Smartphone className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-blue-800">
                                Open your authenticator app and enter the 6-digit verification code to complete your login.
                            </p>
                        </div>
                    </div>

                    {/* Verification Form */}
                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <Label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                                Verification Code
                            </Label>
                            <Input
                                id="code"
                                type="text"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                maxLength={6}
                                className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest"
                                required
                                autoFocus
                                autoComplete="one-time-code"
                            />
                            {errors.code && (
                                <p className="text-red-500 text-sm mt-2 flex items-center">
                                    <span className="mr-2">⚠️</span>
                                    {errors.code}
                                </p>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Button
                                type="submit"
                                disabled={processing || data.code.length !== 6}
                                className="w-full bg-maroon-600 hover:bg-maroon-700"
                            >
                                {processing ? 'Verifying...' : 'Verify and Login'}
                            </Button>

                            <button
                                type="button"
                                onClick={handleCancel}
                                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Login
                            </button>
                        </div>
                    </form>

                    {/* Help Text */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-500">
                            Lost access to your authenticator app?{' '}
                            <a href="/contact-support" className="text-maroon-600 hover:text-maroon-700 font-medium">
                                Contact Support
                            </a>
                        </p>
                    </div>
                </div>
            </div>
            <BackToTop />
        </>
    );
}
