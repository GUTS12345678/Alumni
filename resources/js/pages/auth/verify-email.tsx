import React from 'react';
import { Head, router } from '@inertiajs/react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { GraduationCap, Mail, RefreshCw, CheckCircle2, ArrowLeft } from 'lucide-react';

interface Props {
    status?: string;
}

export default function VerifyEmail({ status }: Props) {
    const [isResending, setIsResending] = React.useState(false);
    const [sent, setSent] = React.useState(false);

    React.useEffect(() => {
        document.documentElement.classList.add('public-page');
        return () => { document.documentElement.classList.remove('public-page'); };
    }, []);

    const handleResend = () => {
        setIsResending(true);
        router.post('/email/verification-notification', {}, {
            onSuccess: () => { setSent(true); },
            onFinish: () => setIsResending(false),
        });
    };

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <>
            <Head title="Verify Email - Alumni Tracer System" />
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
                            Verify Your Email
                        </h1>
                    </div>

                    <Card className="border-maroon-200 shadow-2xl bg-white/95 backdrop-blur-sm">
                        <CardHeader className="bg-gradient-to-r from-maroon-50 to-beige-50 border-b border-maroon-200 pb-6">
                            <div className="flex items-center justify-center mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-maroon-600 to-maroon-700 rounded-xl flex items-center justify-center shadow-lg">
                                    <Mail className="h-6 w-6 text-white" />
                                </div>
                            </div>
                            <CardTitle className="text-center text-xl text-maroon-900">Check Your Inbox</CardTitle>
                            <CardDescription className="text-center text-maroon-600">
                                We&apos;ve sent a verification link to your email address. Please click the link to verify your account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {(status === 'verification-link-sent' || sent) && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                                    <p className="text-sm text-green-700">
                                        A new verification link has been sent to your email address.
                                    </p>
                                </div>
                            )}

                            <p className="text-sm text-gray-600 text-center">
                                If you didn&apos;t receive the email, click the button below to request a new one.
                            </p>

                            <Button onClick={handleResend} disabled={isResending}
                                className="w-full bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-700 hover:to-maroon-800 text-white h-12 font-semibold shadow-lg">
                                {isResending ? (
                                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Sending...</>
                                ) : (
                                    <><Mail className="h-4 w-4 mr-2" />Resend Verification Email</>
                                )}
                            </Button>

                            <div className="text-center pt-2">
                                <button type="button" onClick={handleLogout}
                                    className="text-maroon-600 hover:text-maroon-800 text-sm font-medium inline-flex items-center gap-1">
                                    <ArrowLeft className="h-3 w-3" />
                                    Log Out
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
