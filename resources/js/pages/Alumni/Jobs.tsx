import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, Search, MapPin, DollarSign, Clock, Building2, Eye, Bookmark, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
    application_deadline?: string;
    deadline?: string;
    views: number;
    created_at: string;
    is_featured: boolean;
    remote_work_allowed: boolean;
    skills_required?: string[];
    application_email?: string;
    application_url?: string;
    has_user_saved?: boolean;
    has_user_applied?: boolean;
}

interface Props {
    jobs: {
        data: JobPosting[];
        current_page: number;
        last_page: number;
    };
    filters: {
        search?: string;
        job_type?: string;
        experience_level?: string;
    };
}

export default function Jobs({ jobs, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

    const jobTypes = {
        full_time: 'Full Time',
        part_time: 'Part Time',
        contract: 'Contract',
        remote: 'Remote',
        internship: 'Internship',
    };

    const experienceLevels = {
        entry: 'Entry Level',
        mid: 'Mid Level',
        senior: 'Senior Level',
        executive: 'Executive',
    };

    const handleSearch = () => {
        router.get('/alumni/jobs', { search }, { preserveState: true });
    };

    const viewJob = (job: JobPosting) => {
        setSelectedJob(job);
        setShowDetailsModal(true);
    };

    const handleSaveJob = (jobId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        router.post(`/alumni/jobs/${jobId}/save`, {}, {
            preserveScroll: true,
        });
    };

    const handleUnsaveJob = (jobId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        router.delete(`/alumni/jobs/${jobId}/unsave`, {
            preserveScroll: true,
        });
    };

    return (
        <AlumniBaseLayout title="Job Board">
            <Head title="Job Board" />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Briefcase className="h-8 w-8 text-maroon-600 dark:text-gray-400" />
                        <div>
                            <h1 className="text-3xl font-bold text-maroon-800 dark:text-gray-200">Job Board</h1>
                            <p className="text-gray-600 dark:text-gray-400">Find job opportunities from EARIST</p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <Card className="border-beige-200 dark:border-gray-700">
                        <CardContent className="pt-6">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Search job titles, companies..."
                                        className="border-beige-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                                <Button
                                    onClick={handleSearch}
                                    className="bg-maroon-700 hover:bg-maroon-800 text-white"
                                >
                                    <Search className="h-4 w-4 mr-2" />
                                    Search
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Job Listings */}
                    {jobs.data.length === 0 ? (
                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                            <CardContent className="pt-6">
                                <div className="text-center py-12">
                                    <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        No Job Postings Available
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                                        {filters.search ? 'Try adjusting your search terms' : 'Check back later for new opportunities'}
                                    </p>
                                    {filters.search && (
                                        <Button
                                            variant="outline"
                                            onClick={() => router.get('/alumni/jobs')}
                                            className="border-maroon-300 dark:border-gray-600 text-maroon-700 dark:text-gray-300"
                                        >
                                            Clear Search
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {jobs.data.map((job) => (
                                <Card
                                    key={job.id}
                                    className="border-beige-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
                                    onClick={() => viewJob(job)}
                                >
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 bg-maroon-100 dark:bg-maroon-800/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <Building2 className="h-6 w-6 text-maroon-600 dark:text-gray-400" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-xl font-semibold text-maroon-800 dark:text-gray-200 mb-1">
                                                            {job.title}
                                                        </h3>
                                                        <p className="text-lg text-gray-700 dark:text-gray-300 font-medium mb-2">
                                                            {job.company_name}
                                                        </p>
                                                        <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="h-4 w-4" />
                                                                {job.location}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <DollarSign className="h-4 w-4" />
                                                                {job.formatted_salary}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Eye className="h-4 w-4" />
                                                                {job.views} views
                                                            </span>
                                                            {job.deadline && (
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="h-4 w-4" />
                                                                    Apply by {new Date(job.deadline).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2 mb-3">
                                                            <Badge variant="outline" className="border-maroon-300 dark:border-gray-600 text-maroon-700 dark:text-gray-300">
                                                                {jobTypes[job.job_type as keyof typeof jobTypes]}
                                                            </Badge>
                                                            <Badge variant="outline" className="border-blue-300 text-blue-700">
                                                                {experienceLevels[job.experience_level as keyof typeof experienceLevels]}
                                                            </Badge>
                                                        </div>
                                                        <div
                                                            className="text-gray-600 dark:text-gray-400 line-clamp-2 prose prose-sm max-w-none dark:prose-invert"
                                                            dangerouslySetInnerHTML={{ __html: job.description }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 ml-4">
                                                {job.has_user_saved ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => handleUnsaveJob(job.id, e)}
                                                        className="border-maroon-300 dark:border-gray-600 text-maroon-700 dark:text-gray-300"
                                                    >
                                                        <BookmarkCheck className="h-4 w-4" />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => handleSaveJob(job.id, e)}
                                                        className="border-gray-300 dark:border-gray-600"
                                                    >
                                                        <Bookmark className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {jobs.last_page > 1 && (
                        <div className="flex justify-center gap-2">
                            {Array.from({ length: jobs.last_page }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={page === jobs.current_page ? 'default' : 'outline'}
                                    onClick={() => router.get('/alumni/jobs', { ...filters, page })}
                                    className={page === jobs.current_page ? 'bg-maroon-700' : ''}
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
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto dark:bg-gray-800">
                            <DialogHeader>
                                <DialogTitle className="text-2xl text-maroon-800 dark:text-gray-200">{selectedJob.title}</DialogTitle>
                                <DialogDescription className="text-lg">{selectedJob.company_name}</DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6">
                                <div className="flex flex-wrap gap-2">
                                    <Badge className="bg-maroon-100 dark:bg-maroon-800/30 text-maroon-800 dark:text-gray-200">
                                        {jobTypes[selectedJob.job_type as keyof typeof jobTypes]}
                                    </Badge>
                                    <Badge className="bg-blue-100 text-blue-800">
                                        {experienceLevels[selectedJob.experience_level as keyof typeof experienceLevels]}
                                    </Badge>
                                    {selectedJob.remote_work_allowed && (
                                        <Badge className="bg-green-100 text-green-800">Remote Allowed</Badge>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                        <span>{selectedJob.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                        <span>{selectedJob.formatted_salary}</span>
                                    </div>
                                    {(selectedJob.application_deadline || selectedJob.deadline) && (
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                            <span>Apply by {new Date(selectedJob.application_deadline || selectedJob.deadline || '').toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className="font-semibold text-lg mb-2 text-maroon-800 dark:text-gray-200">Job Description</h3>
                                    <div
                                        className="text-gray-700 dark:text-gray-300 prose prose-sm max-w-none dark:prose-invert"
                                        dangerouslySetInnerHTML={{ __html: selectedJob.description }}
                                    />
                                </div>

                                {selectedJob.requirements && (
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2 text-maroon-800 dark:text-gray-200">Requirements</h3>
                                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedJob.requirements}</p>
                                    </div>
                                )}

                                {selectedJob.skills_required && selectedJob.skills_required.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-lg mb-2 text-maroon-800 dark:text-gray-200">Required Skills</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedJob.skills_required.map((skill, index) => (
                                                <Badge key={index} variant="outline">{skill}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4 border-t dark:border-gray-700 justify-end">
                                    {selectedJob.has_user_saved ? (
                                        <Button
                                            variant="outline"
                                            onClick={(e) => handleUnsaveJob(selectedJob.id, e)}
                                            className="border-maroon-300 dark:border-gray-600 text-maroon-700 dark:text-gray-300"
                                        >
                                            <BookmarkCheck className="h-4 w-4 mr-2" />
                                            Saved
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            onClick={(e) => handleSaveJob(selectedJob.id, e)}
                                        >
                                            <Bookmark className="h-4 w-4 mr-2" />
                                            Save
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </AlumniBaseLayout>
    );
}