import React, { useState } from 'react';
import { Head, router, usePage, useForm } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Briefcase, Search, MapPin, DollarSign, Clock, Plus, Building2, Eye, Bookmark, BookmarkCheck, Send, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    const { flash } = usePage().props as any;
    const [search, setSearch] = useState(filters.search || '');
    const [showPostModal, setShowPostModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        company_name: '',
        location: '',
        job_type: 'full_time',
        experience_level: 'entry',
        description: '',
        requirements: '',
        salary_min: '',
        salary_max: '',
        application_email: '',
        application_deadline: '',
    });

    const { data: applyData, setData: setApplyData, post: applyPost, processing: applyProcessing, errors: applyErrors } = useForm({
        cover_letter: '',
        resume: null as File | null,
    });

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

    const handlePostJob = (e: React.FormEvent) => {
        e.preventDefault();
        post('/alumni/jobs', {
            onSuccess: () => {
                reset();
                setShowPostModal(false);
            },
        });
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

    const handleApply = (job: JobPosting) => {
        setSelectedJob(job);
        setShowApplyModal(true);
    };

    const submitApplication = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedJob) return;

        applyPost(`/alumni/jobs/${selectedJob.id}/apply`, {
            onSuccess: () => {
                setApplyData({ cover_letter: '', resume: null });
                setShowApplyModal(false);
                setShowDetailsModal(false);
            },
        });
    };

    return (
        <AlumniBaseLayout title="Job Board">
            <Head title="Job Board" />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Briefcase className="h-8 w-8 text-maroon-600" />
                        <div>
                            <h1 className="text-3xl font-bold text-maroon-800">Job Board</h1>
                            <p className="text-gray-600">Find opportunities shared by alumni</p>
                        </div>
                    </div>
                    <Button 
                        onClick={() => setShowPostModal(true)}
                        className="bg-maroon-700 hover:bg-maroon-800 text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Post Job
                    </Button>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
                        {flash.success}
                    </div>
                )}

                {/* Search Bar */}
                <Card className="border-beige-200">
                    <CardContent className="pt-6">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Input 
                                    placeholder="Search job titles, companies..." 
                                    className="border-beige-300"
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
                    <Card className="border-beige-200 shadow-lg">
                        <CardContent className="pt-6">
                            <div className="text-center py-12">
                                <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                    No Job Postings Available
                                </h3>
                                <p className="text-gray-500 mb-6">
                                    {filters.search ? 'Try adjusting your search terms' : 'Check back later for new opportunities'}
                                </p>
                                {filters.search && (
                                    <Button 
                                        variant="outline"
                                        onClick={() => router.get('/alumni/jobs')}
                                        className="border-maroon-300 text-maroon-700"
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
                                className="border-beige-200 hover:shadow-lg transition-shadow cursor-pointer"
                                onClick={() => viewJob(job)}
                            >
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 bg-maroon-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <Building2 className="h-6 w-6 text-maroon-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-xl font-semibold text-maroon-800 mb-1">
                                                        {job.title}
                                                    </h3>
                                                    <p className="text-lg text-gray-700 font-medium mb-2">
                                                        {job.company_name}
                                                    </p>
                                                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
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
                                                        <Badge variant="outline" className="border-maroon-300 text-maroon-700">
                                                            {jobTypes[job.job_type as keyof typeof jobTypes]}
                                                        </Badge>
                                                        <Badge variant="outline" className="border-blue-300 text-blue-700">
                                                            {experienceLevels[job.experience_level as keyof typeof experienceLevels]}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-gray-600 line-clamp-2">
                                                        {job.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 ml-4">
                                            {job.has_user_saved ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => handleUnsaveJob(job.id, e)}
                                                    className="border-maroon-300 text-maroon-700"
                                                >
                                                    <BookmarkCheck className="h-4 w-4" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => handleSaveJob(job.id, e)}
                                                    className="border-gray-300"
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

            {/* Post Job Modal */}
            <Dialog open={showPostModal} onOpenChange={setShowPostModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-maroon-800">Post a Job</DialogTitle>
                        <DialogDescription>Share a job opportunity with fellow alumni</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePostJob} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Label htmlFor="title">Job Title *</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    className="border-beige-300"
                                    required
                                />
                                {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
                            </div>

                            <div className="col-span-2">
                                <Label htmlFor="company_name">Company Name *</Label>
                                <Input
                                    id="company_name"
                                    value={data.company_name}
                                    onChange={(e) => setData('company_name', e.target.value)}
                                    className="border-beige-300"
                                    required
                                />
                                {errors.company_name && <p className="text-sm text-red-600">{errors.company_name}</p>}
                            </div>

                            <div>
                                <Label htmlFor="job_type">Job Type *</Label>
                                <Select value={data.job_type} onValueChange={(value) => setData('job_type', value)}>
                                    <SelectTrigger className="border-beige-300">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="full_time">Full Time</SelectItem>
                                        <SelectItem value="part_time">Part Time</SelectItem>
                                        <SelectItem value="contract">Contract</SelectItem>
                                        <SelectItem value="remote">Remote</SelectItem>
                                        <SelectItem value="internship">Internship</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="experience_level">Experience Level *</Label>
                                <Select value={data.experience_level} onValueChange={(value) => setData('experience_level', value)}>
                                    <SelectTrigger className="border-beige-300">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="entry">Entry Level</SelectItem>
                                        <SelectItem value="mid">Mid Level</SelectItem>
                                        <SelectItem value="senior">Senior Level</SelectItem>
                                        <SelectItem value="executive">Executive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="col-span-2">
                                <Label htmlFor="location">Location *</Label>
                                <Input
                                    id="location"
                                    value={data.location}
                                    onChange={(e) => setData('location', e.target.value)}
                                    className="border-beige-300"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="salary_min">Min Salary</Label>
                                <Input
                                    id="salary_min"
                                    type="number"
                                    value={data.salary_min}
                                    onChange={(e) => setData('salary_min', e.target.value)}
                                    className="border-beige-300"
                                />
                            </div>

                            <div>
                                <Label htmlFor="salary_max">Max Salary</Label>
                                <Input
                                    id="salary_max"
                                    type="number"
                                    value={data.salary_max}
                                    onChange={(e) => setData('salary_max', e.target.value)}
                                    className="border-beige-300"
                                />
                            </div>

                            <div className="col-span-2">
                                <Label htmlFor="application_email">Application Email</Label>
                                <Input
                                    id="application_email"
                                    type="email"
                                    value={data.application_email}
                                    onChange={(e) => setData('application_email', e.target.value)}
                                    className="border-beige-300"
                                />
                            </div>

                            <div className="col-span-2">
                                <Label htmlFor="application_deadline">Application Deadline</Label>
                                <Input
                                    id="application_deadline"
                                    type="date"
                                    value={data.application_deadline}
                                    onChange={(e) => setData('application_deadline', e.target.value)}
                                    className="border-beige-300"
                                />
                            </div>

                            <div className="col-span-2">
                                <Label htmlFor="description">Job Description *</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="border-beige-300 min-h-32"
                                    required
                                />
                            </div>

                            <div className="col-span-2">
                                <Label htmlFor="requirements">Requirements</Label>
                                <Textarea
                                    id="requirements"
                                    value={data.requirements}
                                    onChange={(e) => setData('requirements', e.target.value)}
                                    className="border-beige-300 min-h-24"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowPostModal(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-maroon-700 hover:bg-maroon-800">
                                {processing ? 'Posting...' : 'Post Job'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

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
                                        <span>Apply by {new Date(selectedJob.application_deadline || selectedJob.deadline || '').toLocaleDateString()}</span>
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
                                {selectedJob.has_user_saved ? (
                                    <Button 
                                        variant="outline" 
                                        onClick={(e) => handleUnsaveJob(selectedJob.id, e)}
                                        className="border-maroon-300 text-maroon-700"
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

            {/* Apply Modal */}
            {selectedJob && (
                <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl text-maroon-800">Apply for {selectedJob.title}</DialogTitle>
                            <DialogDescription>Complete your application below</DialogDescription>
                        </DialogHeader>
                        
                        <form onSubmit={submitApplication} className="space-y-4">
                            <div>
                                <Label htmlFor="cover_letter">Cover Letter *</Label>
                                <Textarea
                                    id="cover_letter"
                                    value={applyData.cover_letter}
                                    onChange={(e) => setApplyData('cover_letter', e.target.value)}
                                    className="border-beige-300 min-h-40"
                                    placeholder="Explain why you're a great fit for this role..."
                                    required
                                />
                                {applyErrors.cover_letter && (
                                    <p className="text-sm text-red-600">{applyErrors.cover_letter}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="resume">Resume (Optional)</Label>
                                <Input
                                    id="resume"
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => setApplyData('resume', e.target.files?.[0] || null)}
                                    className="border-beige-300"
                                />
                                <p className="text-xs text-gray-500 mt-1">PDF, DOC, or DOCX (Max 5MB)</p>
                                {applyErrors.resume && (
                                    <p className="text-sm text-red-600">{applyErrors.resume}</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setShowApplyModal(false)}>
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={applyProcessing} 
                                    className="bg-maroon-700 hover:bg-maroon-800"
                                >
                                    {applyProcessing ? 'Submitting...' : 'Submit Application'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </AlumniBaseLayout>
    );
}
