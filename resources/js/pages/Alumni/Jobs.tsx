import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Search, MapPin, DollarSign, Clock, Plus, Building2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface JobPosting {
    id: number;
    title: string;
    company_name: string;
    location: string;
    job_type: string;
    experience_level: string;
    description: string;
    formatted_salary: string;
    deadline?: string;
    views: number;
    created_at: string;
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

    const jobTypes = {
        full_time: 'Full Time',
        part_time: 'Part Time',
        contract: 'Contract',
        remote: 'Remote',
    };

    const experienceLevels = {
        entry: 'Entry Level',
        mid: 'Mid Level',
        senior: 'Senior Level',
    };

    const handleSearch = () => {
        router.get('/alumni/jobs', { search }, { preserveState: true });
    };

    const viewJob = (id: number) => {
        router.get(`/alumni/jobs/${id}`);
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
                                onClick={() => viewJob(job.id)}
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
        </AlumniBaseLayout>
    );
}
