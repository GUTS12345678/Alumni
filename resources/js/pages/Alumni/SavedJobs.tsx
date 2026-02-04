import React, { useState } from 'react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { router } from '@inertiajs/react';
import { MapPin, DollarSign, Clock, BookmarkCheck, Send, Eye } from 'lucide-react';

interface JobPosting {
    id: number;
    title: string;
    company_name: string;
    location: string;
    job_type: string;
    experience_level: string;
    description: string;
    requirements?: string;
    formatted_salary: string;
    deadline?: string;
    application_deadline?: string;
    skills_required?: string[];
    is_featured?: boolean;
    remote_work_allowed?: boolean;
    has_user_applied?: boolean;
    saved_at?: string;
}

interface SavedJobsProps {
    savedJobs: {
        data: JobPosting[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

const SavedJobs: React.FC<SavedJobsProps> = ({ savedJobs }) => {
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

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

    const handleUnsave = (jobId: number) => {
        router.delete(`/alumni/jobs/${jobId}/unsave`, {
            preserveScroll: true,
            onSuccess: () => {
                // Optional: Show success notification
            },
        });
    };

    const viewJobDetails = (job: JobPosting) => {
        setSelectedJob(job);
        setShowDetailsModal(true);
    };

    const handleApply = (job: JobPosting) => {
        router.get(`/alumni/jobs`, { applyTo: job.id });
    };

    return (
        <AlumniBaseLayout title="Saved Jobs">
            <div className="space-y-6">
                {/* Page Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-maroon-800">Saved Jobs</h2>
                    <p className="text-gray-600 mt-1">View all your bookmarked job opportunities</p>
                </div>
                {/* Stats Card */}
                <Card className="border-maroon-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Saved Jobs</p>
                                <p className="text-3xl font-bold text-maroon-800">{savedJobs.total}</p>
                            </div>
                            <BookmarkCheck className="h-12 w-12 text-maroon-600" />
                        </div>
                    </CardContent>
                </Card>

                {/* Saved Jobs List */}
                {savedJobs.data.length === 0 ? (
                    <Card className="border-beige-300">
                        <CardContent className="py-12 text-center">
                            <BookmarkCheck className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Saved Jobs</h3>
                            <p className="text-gray-500 mb-4">You haven't bookmarked any jobs yet.</p>
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
                        {savedJobs.data.map((job) => (
                            <Card key={job.id} className="border-beige-300 hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <CardTitle className="text-xl text-maroon-800 mb-2">
                                                {job.title}
                                                {job.is_featured && (
                                                    <Badge className="ml-2 bg-yellow-500">Featured</Badge>
                                                )}
                                            </CardTitle>
                                            <p className="text-lg font-medium text-gray-700">{job.company_name}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => viewJobDetails(job)}
                                            >
                                                <Eye className="h-4 w-4 mr-1" />
                                                View
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleUnsave(job.id)}
                                                className="border-red-300 text-red-700 hover:bg-red-50"
                                            >
                                                <BookmarkCheck className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <Badge className="bg-maroon-100 text-maroon-800">
                                            {jobTypes[job.job_type]}
                                        </Badge>
                                        <Badge className="bg-blue-100 text-blue-800">
                                            {experienceLevels[job.experience_level]}
                                        </Badge>
                                        {job.remote_work_allowed && (
                                            <Badge className="bg-green-100 text-green-800">Remote Allowed</Badge>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            <span>{job.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4" />
                                            <span>{job.formatted_salary}</span>
                                        </div>
                                        {(job.application_deadline || job.deadline) && (
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4" />
                                                <span>
                                                    Deadline: {new Date(job.application_deadline || job.deadline || '').toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <p className="mt-4 text-gray-700 line-clamp-2">{job.description}</p>

                                    {job.saved_at && (
                                        <p className="mt-3 text-xs text-gray-500">
                                            Saved on {new Date(job.saved_at).toLocaleDateString()}
                                        </p>
                                    )}

                                    <div className="mt-4 flex gap-2">
                                        {job.has_user_applied ? (
                                            <Button disabled className="bg-gray-400">
                                                <Send className="h-4 w-4 mr-2" />
                                                Already Applied
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => handleApply(job)}
                                                className="bg-maroon-700 hover:bg-maroon-800"
                                            >
                                                <Send className="h-4 w-4 mr-2" />
                                                Apply Now
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {savedJobs.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {Array.from({ length: savedJobs.last_page }, (_, i) => i + 1).map((page) => (
                            <Button
                                key={page}
                                variant={page === savedJobs.current_page ? 'default' : 'outline'}
                                onClick={() => router.get('/alumni/jobs/saved', { page })}
                                className={page === savedJobs.current_page ? 'bg-maroon-700' : ''}
                            >
                                {page}
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            {/* Job Details Modal */}
            {selectedJob && (
                <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-2xl text-maroon-800">{selectedJob.title}</DialogTitle>
                            <DialogDescription className="text-lg">{selectedJob.company_name}</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            <div className="flex flex-wrap gap-2">
                                <Badge className="bg-maroon-100 text-maroon-800">
                                    {jobTypes[selectedJob.job_type]}
                                </Badge>
                                <Badge className="bg-blue-100 text-blue-800">
                                    {experienceLevels[selectedJob.experience_level]}
                                </Badge>
                                {selectedJob.remote_work_allowed && (
                                    <Badge className="bg-green-100 text-green-800">Remote Allowed</Badge>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-gray-500" />
                                    <span>{selectedJob.location}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-gray-500" />
                                    <span>{selectedJob.formatted_salary}</span>
                                </div>
                                {(selectedJob.application_deadline || selectedJob.deadline) && (
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-gray-500" />
                                        <span>
                                            Apply by {new Date(selectedJob.application_deadline || selectedJob.deadline || '').toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg mb-2 text-maroon-800">Job Description</h3>
                                <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.description}</p>
                            </div>

                            {selectedJob.requirements && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2 text-maroon-800">Requirements</h3>
                                    <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.requirements}</p>
                                </div>
                            )}

                            {selectedJob.skills_required && selectedJob.skills_required.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-lg mb-2 text-maroon-800">Required Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedJob.skills_required.map((skill, index) => (
                                            <Badge key={index} variant="outline">{skill}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t">
                                {selectedJob.has_user_applied ? (
                                    <Button disabled className="flex-1 bg-gray-400">
                                        <Send className="h-4 w-4 mr-2" />
                                        Already Applied
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => handleApply(selectedJob)}
                                        className="flex-1 bg-maroon-700 hover:bg-maroon-800"
                                    >
                                        <Send className="h-4 w-4 mr-2" />
                                        Apply Now
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={() => handleUnsave(selectedJob.id)}
                                    className="border-red-300 text-red-700"
                                >
                                    <BookmarkCheck className="h-4 w-4 mr-2" />
                                    Remove
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </AlumniBaseLayout>
    );
};

export default SavedJobs;
