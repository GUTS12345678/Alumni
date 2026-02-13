import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, FileText, Download, Calendar, CheckCircle, Clock, Loader2, Sparkles, Shield, Plus, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Helper to get CSRF token
const getCsrfToken = (): string => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
};

interface Certificate {
    id: number;
    type: 'survey_completion' | 'membership' | 'participation' | 'achievement';
    title: string;
    description: string;
    issued_date: string;
    certificate_number: string;
    download_url?: string;
    status: 'available' | 'pending' | 'expired';
}

export default function Certificates() {
    const { toast } = useToast();
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);
    const [downloading, setDownloading] = useState<number | null>(null);
    const [hasMembershipCertificate, setHasMembershipCertificate] = useState(false);

    useEffect(() => {
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        try {
            const response = await fetch('/api/v1/certificates', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setCertificates(data.data || []);
                // Check if user already has a membership certificate
                setHasMembershipCertificate(
                    (data.data || []).some((c: Certificate) => c.type === 'membership')
                );
            }
        } catch (error) {
            console.error('Failed to fetch certificates:', error);
        } finally {
            setLoading(false);
        }
    };

    const requestMembershipCertificate = async () => {
        setRequesting(true);
        try {
            const response = await fetch('/api/v1/certificates/request-membership', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'include',
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast({
                    title: 'Success',
                    description: 'Membership certificate created successfully!',
                });
                setCertificates(prev => [data.data, ...prev]);
                setHasMembershipCertificate(true);
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to create certificate',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to request certificate:', error);
            toast({
                title: 'Error',
                description: 'Failed to request certificate. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setRequesting(false);
        }
    };

    const downloadCertificate = async (cert: Certificate) => {
        if (cert.status !== 'available') return;

        setDownloading(cert.id);
        try {
            const response = await fetch(`/api/v1/certificates/${cert.id}/download`, {
                headers: {
                    'Accept': 'application/pdf',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `certificate-${cert.certificate_number}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast({
                    title: 'Success',
                    description: 'Certificate downloaded successfully!',
                });
            } else {
                toast({
                    title: 'Error',
                    description: 'Failed to download certificate',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to download certificate:', error);
            toast({
                title: 'Error',
                description: 'Failed to download certificate. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setDownloading(null);
        }
    };

    const getCertificateIcon = (type: Certificate['type']) => {
        switch (type) {
            case 'survey_completion':
                return <FileText className="h-8 w-8 text-blue-500" />;
            case 'membership':
                return <Shield className="h-8 w-8 text-purple-500" />;
            case 'participation':
                return <Sparkles className="h-8 w-8 text-yellow-500" />;
            case 'achievement':
                return <Award className="h-8 w-8 text-green-500" />;
            default:
                return <Award className="h-8 w-8 text-maroon-500" />;
        }
    };

    const getStatusBadge = (status: Certificate['status']) => {
        switch (status) {
            case 'available':
                return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">Available</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300">Processing</Badge>;
            case 'expired':
                return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">Expired</Badge>;
            default:
                return null;
        }
    };

    return (
        <AlumniBaseLayout title="Certificates">
            <Head title="Certificates" />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Award className="h-8 w-8 text-maroon-600 dark:text-maroon-400" />
                        <div>
                            <h1 className="text-3xl font-bold text-maroon-800 dark:text-maroon-100">My Certificates</h1>
                            <p className="text-gray-600 dark:text-gray-400">Download and manage your certificates</p>
                        </div>
                    </div>
                    {!hasMembershipCertificate && (
                        <Button
                            onClick={requestMembershipCertificate}
                            disabled={requesting}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {requesting ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4 mr-2" />
                            )}
                            Get Membership Certificate
                        </Button>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-beige-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <CardContent className="p-4 flex items-center space-x-4">
                            <div className="p-3 bg-maroon-100 dark:bg-maroon-900/50 rounded-full">
                                <Award className="h-6 w-6 text-maroon-600 dark:text-maroon-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Certificates</p>
                                <p className="text-2xl font-bold text-maroon-800 dark:text-maroon-100">{certificates.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-beige-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <CardContent className="p-4 flex items-center space-x-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full">
                                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Available</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {certificates.filter(c => c.status === 'available').length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-beige-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <CardContent className="p-4 flex items-center space-x-4">
                            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-full">
                                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                    {certificates.filter(c => c.status === 'pending').length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Certificates List */}
                <Card className="border-beige-200 dark:border-gray-700 shadow-lg bg-white dark:bg-gray-800">
                    <CardHeader className="border-b border-beige-200 dark:border-gray-700">
                        <CardTitle className="text-xl text-maroon-800 dark:text-maroon-100 flex items-center">
                            <FileText className="h-5 w-5 mr-2" />
                            Available Certificates
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-maroon-600 dark:text-maroon-400" />
                            </div>
                        ) : certificates.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {certificates.map((cert) => (
                                    <div
                                        key={cert.id}
                                        className="flex items-start gap-4 p-4 border border-beige-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-shadow bg-beige-50/50 dark:bg-gray-700/50"
                                    >
                                        <div className="flex-shrink-0">
                                            {getCertificateIcon(cert.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-semibold text-maroon-800 dark:text-maroon-100 truncate">
                                                    {cert.title}
                                                </h3>
                                                {getStatusBadge(cert.status)}
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {cert.description}
                                            </p>
                                            <div className="flex items-center justify-between mt-3">
                                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    Issued: {new Date(cert.issued_date).toLocaleDateString()}
                                                </span>
                                                {cert.status === 'available' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => downloadCertificate(cert)}
                                                        disabled={downloading === cert.id}
                                                        className="bg-maroon-600 hover:bg-maroon-700 text-white"
                                                    >
                                                        {downloading === cert.id ? (
                                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                        ) : (
                                                            <Download className="h-4 w-4 mr-1" />
                                                        )}
                                                        Download
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-maroon-100 to-beige-100 dark:from-maroon-900/50 dark:to-gray-700 rounded-full mb-4">
                                    <Award className="h-10 w-10 text-maroon-500 dark:text-maroon-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                    No Certificates Yet
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                                    Certificates will appear here once you complete surveys, participate in events, or achieve milestones in the alumni community.
                                </p>

                                {!hasMembershipCertificate && (
                                    <Button
                                        onClick={requestMembershipCertificate}
                                        disabled={requesting}
                                        className="bg-purple-600 hover:bg-purple-700 text-white mb-6"
                                    >
                                        {requesting ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Shield className="h-4 w-4 mr-2" />
                                        )}
                                        Get Your Membership Certificate
                                    </Button>
                                )}

                                <div className="flex flex-wrap gap-4 justify-center text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-beige-100 dark:bg-gray-700 rounded-full">
                                        <FileText className="h-4 w-4 text-blue-500" />
                                        <span>Complete Surveys</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-beige-100 dark:bg-gray-700 rounded-full">
                                        <Sparkles className="h-4 w-4 text-yellow-500" />
                                        <span>Attend Events</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-beige-100 dark:bg-gray-700 rounded-full">
                                        <Shield className="h-4 w-4 text-purple-500" />
                                        <span>Join Programs</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Info Section */}
                <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-medium text-blue-800 dark:text-blue-200">How to Earn Certificates</h4>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                    Certificates are awarded for completing tracer surveys, participating in alumni events,
                                    and achieving milestones. Keep your profile updated and participate actively to earn your certificates!
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AlumniBaseLayout>
    );
}
