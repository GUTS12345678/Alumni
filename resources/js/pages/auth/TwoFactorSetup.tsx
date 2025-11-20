import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Shield, CheckCircle, Copy, Key, Smartphone } from 'lucide-react';

interface TwoFactorSetupProps {
    secret: string;
    qrCodeUrl: string;
    email: string;
}

export default function TwoFactorSetup({ secret, qrCodeUrl, email }: TwoFactorSetupProps) {
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopySecret = () => {
        navigator.clipboard.writeText(secret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/v1/alumni/two-factor/verify-setup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    code: verificationCode
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Invalid verification code');
                setLoading(false);
                return;
            }

            // Success - redirect to dashboard
            router.visit('/alumni/dashboard');
        } catch (error) {
            console.error('Verification error:', error);
            setError('An error occurred. Please try again.');
            setLoading(false);
        }
    };

    return (
        <>
            <Head title="Set Up Two-Factor Authentication" />

            <div className="min-h-screen bg-gradient-to-br from-maroon-50 to-beige-50 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-maroon-100 rounded-full mb-4">
                            <Shield className="h-8 w-8 text-maroon-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Secure Your Account
                        </h1>
                        <p className="text-gray-600">
                            Set up two-factor authentication to protect your account
                        </p>
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                            <Smartphone className="h-5 w-5 mr-2" />
                            Setup Instructions
                        </h2>
                        <ol className="space-y-3 text-blue-800">
                            <li className="flex">
                                <span className="font-semibold mr-2">1.</span>
                                <span>Download an authenticator app (Google Authenticator, Microsoft Authenticator, or Authy)</span>
                            </li>
                            <li className="flex">
                                <span className="font-semibold mr-2">2.</span>
                                <span>Scan the QR code below or manually enter the setup key</span>
                            </li>
                            <li className="flex">
                                <span className="font-semibold mr-2">3.</span>
                                <span>Enter the 6-digit code from your authenticator app to verify</span>
                            </li>
                        </ol>
                    </div>

                    {/* QR Code Section */}
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <div className="text-center mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-4">
                                Scan this QR code with your authenticator app
                            </p>
                            <div className="inline-block bg-white p-4 rounded-lg shadow-sm">
                                <img 
                                    src={qrCodeUrl} 
                                    alt="2FA QR Code" 
                                    className="w-64 h-64"
                                />
                            </div>
                        </div>

                        {/* Manual Setup Key */}
                        <div className="border-t border-gray-200 pt-4 mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                <Key className="h-4 w-4 mr-2" />
                                Or enter this setup key manually:
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 font-mono text-sm break-all">
                                    {secret}
                                </code>
                                <button
                                    type="button"
                                    onClick={handleCopySecret}
                                    className="flex items-center gap-2 px-4 py-3 bg-maroon-600 text-white rounded-lg hover:bg-maroon-700 transition-colors"
                                >
                                    {copied ? (
                                        <>
                                            <CheckCircle className="h-4 w-4" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-4 w-4" />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Account: {email}
                            </p>
                        </div>
                    </div>

                    {/* Verification Form */}
                    <form onSubmit={handleVerify} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Enter Verification Code
                            </label>
                            <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                maxLength={6}
                                className={`w-full px-4 py-3 border rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-maroon-500 ${
                                    error ? 'border-red-500' : 'border-gray-300'
                                }`}
                                required
                                autoFocus
                            />
                            {error && (
                                <p className="text-red-500 text-sm mt-2 flex items-center">
                                    <span className="mr-2">⚠️</span>
                                    {error}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || verificationCode.length !== 6}
                            className="w-full bg-maroon-600 text-white py-3 rounded-lg font-semibold hover:bg-maroon-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-5 w-5" />
                                    Verify and Continue
                                </>
                            )}
                        </button>
                    </form>

                    {/* Security Notice */}
                    <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                            <strong>Important:</strong> Save your setup key in a secure location. You'll need it if you lose access to your authenticator app.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
