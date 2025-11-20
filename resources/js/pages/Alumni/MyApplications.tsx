import React, { useState } from 'react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { router } from '@inertiajs/react';
import { MapPin, DollarSign, Clock, FileText, Send, Trash2, AlertCircle, CheckCircle, XCircle, Eye } from 'lucide-react';

interface JobApplication {
    id: number;
    job_posting_id: number;
    cover_letter: string;
    resume_path?: string;
    status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'accepted';
    notes?: string;
    applied_at: string;
    job_posting: {
        id: number;
        title: string;
        company_name: string;
        location: string;
        job_type: string;
        experience_level: string;
        description: string;
        formatted_salary: string;
        deadline?: string;
        application_deadline?: string;
    };
}

interface MyApplicationsProps {
    applications: {
        data: JobApplication[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats: {
        total: number;
        pending: number;
        reviewed: number;
        shortlisted: number;
        rejected: number;
        accepted: number;
    };
}

const MyApplications: React.FC<MyApplicationsProps> = ({ applications, stats }) => {
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
    const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
    const [applicationToWithdraw, setApplicationToWithdraw] = useState<number | null>(null);

    const jobTypes: Record<string, string> = {
        full_time: 'Full Time',
        part_time: 'Part Time',
        contract: 'Contract',
        remote: 'Remote',
        internship: 'Internship',
    };

    const experienceLevels: Record<string, string> = {
        entry: 'Entry Level',
        mid: 'Mid Level',
        senior: 'Senior Level',
        executive: 'Executive',
    };

    const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
        pending: {
            label: 'Pending Review',
            color: 'bg-yellow-100 text-yellow-800',
            icon: <Clock className="h-4 w-4" />,
        },
        reviewed: {
            label: 'Reviewed',
            color: 'bg-blue-100 text-blue-800',
            icon: <Eye className="h-4 w-4" />,
        },
        shortlisted: {
            label: 'Shortlisted',
            color: 'bg-purple-100 text-purple-800',
            icon: <CheckCircle className="h-4 w-4" />,
        },
        rejected: {
            label: 'Not Selected',
            color: 'bg-red-100 text-red-800',
            icon: <XCircle className="h-4 w-4" />,
        },
        accepted: {
            label: 'Accepted',
            color: 'bg-green-100 text-green-800',
            icon: <CheckCircle className="h-4 w-4" />,
        },
    };

    const viewApplication = (application: JobApplication) => {
        setSelectedApplication(application);
        setShowDetailsModal(true);
    };

    const confirmWithdraw = (applicationId: number) => {
        setApplicationToWithdraw(applicationId);
        setShowWithdrawConfirm(true);
    };

    const handleWithdraw = () => {
        if (applicationToWithdraw) {
            router.delete(`/alumni/jobs/applications/${applicationToWithdraw}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setShowWithdrawConfirm(false);
                    setApplicationToWithdraw(null);
                },
            });
        }
    };

    const downloadResume = (resumePath: string) => {
        window.open(`/storage/${resumePath}`, '_blank');
    };

    return (
        <AlumniBaseLayout title="My Applications">
            <div className="space-y-6">
                {/* Page Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-maroon-800">My Job Applications</h2>
                    <p className="text-gray-600 mt-1">Track your job application status</p>
                </div>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <Card className="border-beige-300">
                        <CardContent className="pt-6">
                            <p className="text-sm text-gray-600 mb-1">Total</p>
                            <p className="text-2xl font-bold text-maroon-800">{stats.total}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-yellow-200">
                        <CardContent className="pt-6">
                            <p className="text-sm text-gray-600 mb-1">Pending</p>
                            <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-blue-200">
                        <CardContent className="pt-6">
                            <p className="text-sm text-gray-600 mb-1">Reviewed</p>
                            <p className="text-2xl font-bold text-blue-700">{stats.reviewed}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-purple-200">
                        <CardContent className="pt-6">
                            <p className="text-sm text-gray-600 mb-1">Shortlisted</p>
                            <p className="text-2xl font-bold text-purple-700">{stats.shortlisted}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-green-200">
                        <CardContent className="pt-6">
                            <p className="text-sm text-gray-600 mb-1">Accepted</p>
                            <p className="text-2xl font-bold text-green-700">{stats.accepted}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-red-200">
                        <CardContent className="pt-6">
                            <p className="text-sm text-gray-600 mb-1">Rejected</p>
                            <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Applications List */}
                {applications.data.length === 0 ? (
                    <Card className="border-beige-300">
                        <CardContent className="py-12 text-center">
                            <Send className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Applications Yet</h3>
                            <p className="text-gray-500 mb-4">You haven't applied to any jobs yet.</p>
                            <Button
                                onClick={() => router.get('/alumni/jobs')}
                                className="bg-maroon-700 hover:bg-maroon-800"
                            >
                                Browse Jobs
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {applications.data.map((application) => (
                            <Card key={application.id} className="border-beige-300 hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <CardTitle className="text-xl text-maroon-800 mb-2">
                                                {application.job_posting.title}
                                            </CardTitle>
                                            <p className="text-lg font-medium text-gray-700">
                                                {application.job_posting.company_name}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => viewApplication(application)}
                                            >
                                                <Eye className="h-4 w-4 mr-1" />
                                                View
                                            </Button>
                                            {application.status === 'pending' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => confirmWithdraw(application.id)}
                                                    className="border-red-300 text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <Badge className={statusConfig[application.status].color}>
                                            {statusConfig[application.status].icon}
                                            <span className="ml-1">{statusConfig[application.status].label}</span>
                                        </Badge>
                                        <Badge className="bg-maroon-100 text-maroon-800">
                                            {jobTypes[application.job_posting.job_type]}
                                        </Badge>
                                        <Badge className="bg-blue-100 text-blue-800">
                                            {experienceLevels[application.job_posting.experience_level]}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-600 mb-4">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            <span>{application.job_posting.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4" />
                                            <span>{application.job_posting.formatted_salary}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            <span>Applied {new Date(application.applied_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {application.notes && (
                                        <Alert className="mt-3">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                <strong>Feedback:</strong> {application.notes}
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                                        <FileText className="h-4 w-4" />
                                        <span>Cover letter submitted</span>
                                        {application.resume_path && (
                                            <>
                                                <span>•</span>
                                                <button
                                                    onClick={() => downloadResume(application.resume_path!)}
                                                    className="text-maroon-700 hover:underline"
                                                >
                                                    Download Resume
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {applications.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {Array.from({ length: applications.last_page }, (_, i) => i + 1).map((page) => (
                            <Button
                                key={page}
                                variant={page === applications.current_page ? 'default' : 'outline'}
                                onClick={() => router.get('/alumni/jobs/applications', { page })}
                                className={page === applications.current_page ? 'bg-maroon-700' : ''}
                            >
                                {page}
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            {/* Application Details Modal */}
            {selectedApplication && (
                <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-2xl text-maroon-800">
                                Application for {selectedApplication.job_posting.title}
                            </DialogTitle>
                            <DialogDescription className="text-lg">
                                {selectedApplication.job_posting.company_name}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <Badge className={statusConfig[selectedApplication.status].color}>
                                    {statusConfig[selectedApplication.status].icon}
                                    <span className="ml-1">{statusConfig[selectedApplication.status].label}</span>
                                </Badge>
                                <span className="text-sm text-gray-600">
                                    Applied on {new Date(selectedApplication.applied_at).toLocaleDateString()}
                                </span>
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg mb-2 text-maroon-800">Job Details</h3>
                                <p className="text-gray-700 whitespace-pre-wrap">
                                    {selectedApplication.job_posting.description}
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg mb-2 text-maroon-800">Your Cover Letter</h3>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-gray-700 whitespace-pre-wrap">
                                        {selectedApplication.cover_letter}
                                    </p>
                                </div>
                            </div>

                            {selectedApplication.resume_path && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2 text-maroon-800">Resume</h3>
                                    <Button
                                        variant="outline"
                                        onClick={() => downloadResume(selectedApplication.resume_path!)}
                                    >
                                        <FileText className="h-4 w-4 mr-2" />
                                        Download Resume
                                    </Button>
                                </div>
                            )}

                            {selectedApplication.notes && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2 text-maroon-800">Employer Feedback</h3>
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{selectedApplication.notes}</AlertDescription>
                                    </Alert>
                                </div>
                            )}

                            {selectedApplication.status === 'pending' && (
                                <div className="pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={() => confirmWithdraw(selectedApplication.id)}
                                        className="border-red-300 text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Withdraw Application
                                    </Button>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Withdraw Confirmation Dialog */}
            <Dialog open={showWithdrawConfirm} onOpenChange={setShowWithdrawConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-xl text-maroon-800">Withdraw Application?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to withdraw this application? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setShowWithdrawConfirm(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleWithdraw}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Withdraw
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AlumniBaseLayout>
    );
};

export default MyApplications;
