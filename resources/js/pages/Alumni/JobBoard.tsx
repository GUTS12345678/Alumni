import React, { useState, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageCarousel } from '@/components/ui/page-carousel';
import {
    Briefcase,
    Search,
    MapPin,
    DollarSign,
    Clock,
    Building2,
    ExternalLink,
    Filter,
    Calendar,
    Star,
    Loader2,
    Globe,
    Laptop,
    Mail,
    Phone,
    ChevronRight,
    ChevronLeft,
    X
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { JobPosting, JobCategory } from '@/types/jobs';

export default function JobBoard() {
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [featuredJobs, setFeaturedJobs] = useState<JobPosting[]>([]);
    const [categories, setCategories] = useState<JobCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
    const [currentJobIndex, setCurrentJobIndex] = useState<number>(0);
    const [showFilters, setShowFilters] = useState(false);

    // Filters
    const [search, setSearch] = useState('');
    const [categoryId, setCategoryId] = useState<string>('');
    const [employmentType, setEmploymentType] = useState<string>('');
    const [workArrangement, setWorkArrangement] = useState<string>('');
    const [sortBy, setSortBy] = useState('created_at');

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (categoryId) params.append('category_id', categoryId);
            if (employmentType) params.append('employment_type', employmentType);
            if (workArrangement) params.append('work_arrangement', workArrangement);
            params.append('sort_by', sortBy);

            const response = await fetch(`/api/v1/jobs?${params.toString()}`, {
                headers: { 'Accept': 'application/json' },
            });
            if (response.ok) {
                const data = await response.json();
                setJobs(data.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
        } finally {
            setLoading(false);
        }
    }, [search, categoryId, employmentType, workArrangement, sortBy]);

    useEffect(() => {
        fetchCategories();
        fetchFeaturedJobs();
        fetchJobs();
    }, [fetchJobs]);

    useEffect(() => {
        fetchJobs();
    }, [categoryId, employmentType, workArrangement, sortBy, fetchJobs]);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/v1/jobs/categories', {
                headers: { 'Accept': 'application/json' },
            });
            if (response.ok) {
                const data = await response.json();
                setCategories(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchFeaturedJobs = async () => {
        try {
            const response = await fetch('/api/v1/jobs/featured', {
                headers: { 'Accept': 'application/json' },
            });
            if (response.ok) {
                const data = await response.json();
                setFeaturedJobs(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch featured jobs:', error);
        }
    };

    const viewJob = async (job: JobPosting, index?: number) => {
        if (index !== undefined) {
            setCurrentJobIndex(index);
        } else {
            const idx = jobs.findIndex(j => j.id === job.id);
            setCurrentJobIndex(idx >= 0 ? idx : 0);
        }

        try {
            const response = await fetch(`/api/v1/jobs/${job.id}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setSelectedJob(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch job details:', error);
            setSelectedJob(job);
        }
    };

    const navigatePreviousJob = () => {
        if (currentJobIndex > 0) {
            const prevJob = jobs[currentJobIndex - 1];
            viewJob(prevJob, currentJobIndex - 1);
        }
    };

    const navigateNextJob = () => {
        if (currentJobIndex < jobs.length - 1) {
            const nextJob = jobs[currentJobIndex + 1];
            viewJob(nextJob, currentJobIndex + 1);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchJobs();
    };

    const clearFilters = () => {
        setSearch('');
        setCategoryId('');
        setEmploymentType('');
        setWorkArrangement('');
        setSortBy('created_at');
    };

    const hasActiveFilters = categoryId || employmentType || workArrangement;

    const formatSalary = (job: JobPosting): string => {
        return job.salary_range || 'Competitive';
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getWorkArrangementIcon = (arrangement?: string) => {
        switch (arrangement) {
            case 'remote':
                return <Laptop className="h-4 w-4" />;
            case 'hybrid':
                return <Globe className="h-4 w-4" />;
            default:
                return <Building2 className="h-4 w-4" />;
        }
    };

    const getEmploymentTypeBadge = (type?: string) => {
        const colors: { [key: string]: string } = {
            full_time: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
            part_time: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
            contract: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
            internship: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
            freelance: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300',
        };
        const labels: { [key: string]: string } = {
            full_time: 'Full Time',
            part_time: 'Part Time',
            contract: 'Contract',
            internship: 'Internship',
            freelance: 'Freelance',
        };
        const typeKey = type || 'full_time';
        return (
            <Badge className={cn('capitalize', colors[typeKey] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300')}>
                {labels[typeKey] || typeKey}
            </Badge>
        );
    };

    return (
        <AlumniBaseLayout title="Job Board">
            <Head title="Job Board" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Briefcase className="h-8 w-8 text-maroon-600 dark:text-maroon-400" />
                        <div>
                            <h1 className="text-2xl font-bold text-maroon-800 dark:text-maroon-200">Job Board</h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Discover career opportunities from trusted employers
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search & Filters */}
                <Card className="border-beige-200 dark:border-gray-700 dark:bg-gray-800">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search job titles, companies, or keywords..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Select value={categoryId || 'all'} onValueChange={(v) => setCategoryId(v === 'all' ? '' : v)}>
                                    <SelectTrigger className="w-40 dark:bg-gray-700 dark:border-gray-600">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                                {cat.name} ({cat.job_postings_count || 0})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Sheet open={showFilters} onOpenChange={setShowFilters}>
                                    <SheetTrigger asChild>
                                        <Button variant="outline" className="relative dark:border-gray-600 dark:text-gray-300">
                                            <Filter className="h-4 w-4 mr-2" />
                                            Filters
                                            {hasActiveFilters && (
                                                <span className="absolute -top-1 -right-1 h-3 w-3 bg-maroon-600 rounded-full" />
                                            )}
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent className="dark:bg-gray-800 dark:border-gray-700">
                                        <SheetHeader>
                                            <SheetTitle className="dark:text-white">Filter Jobs</SheetTitle>
                                            <SheetDescription className="dark:text-gray-400">
                                                Refine your job search
                                            </SheetDescription>
                                        </SheetHeader>
                                        <div className="space-y-6 mt-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium dark:text-gray-300">Employment Type</label>
                                                <Select value={employmentType || 'all'} onValueChange={(v) => setEmploymentType(v === 'all' ? '' : v)}>
                                                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                                                        <SelectValue placeholder="Any type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">Any type</SelectItem>
                                                        <SelectItem value="full_time">Full Time</SelectItem>
                                                        <SelectItem value="part_time">Part Time</SelectItem>
                                                        <SelectItem value="contract">Contract</SelectItem>
                                                        <SelectItem value="internship">Internship</SelectItem>
                                                        <SelectItem value="freelance">Freelance</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium dark:text-gray-300">Work Arrangement</label>
                                                <Select value={workArrangement || 'all'} onValueChange={(v) => setWorkArrangement(v === 'all' ? '' : v)}>
                                                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                                                        <SelectValue placeholder="Any arrangement" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">Any arrangement</SelectItem>
                                                        <SelectItem value="onsite">On-site</SelectItem>
                                                        <SelectItem value="remote">Remote</SelectItem>
                                                        <SelectItem value="hybrid">Hybrid</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium dark:text-gray-300">Sort By</label>
                                                <Select value={sortBy} onValueChange={setSortBy}>
                                                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="created_at">Newest First</SelectItem>
                                                        <SelectItem value="title">Title A-Z</SelectItem>
                                                        <SelectItem value="company_name">Company A-Z</SelectItem>
                                                        <SelectItem value="salary_min">Salary</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {hasActiveFilters && (
                                                <Button
                                                    variant="outline"
                                                    className="w-full dark:border-gray-600"
                                                    onClick={clearFilters}
                                                >
                                                    <X className="h-4 w-4 mr-2" />
                                                    Clear All Filters
                                                </Button>
                                            )}
                                        </div>
                                    </SheetContent>
                                </Sheet>
                                <Button type="submit" className="bg-maroon-600 hover:bg-maroon-700 text-white">
                                    <Search className="h-4 w-4 mr-2" />
                                    Search
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Featured Jobs */}
                {featuredJobs.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-maroon-800 dark:text-maroon-200">
                            <Star className="h-5 w-5 text-yellow-500" />
                            Featured Opportunities
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {featuredJobs.map((job) => (
                                <div
                                    key={job.id}
                                    onClick={() => viewJob(job)}
                                    className="group bg-white dark:bg-gray-800 rounded-2xl border border-yellow-200 dark:border-yellow-700/50 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:-translate-y-1"
                                >
                                    {job.poster_image ? (
                                        <div className="h-48 overflow-hidden relative">
                                            <img
                                                src={job.poster_image}
                                                alt={job.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                            <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center">
                                                <Star className="w-3 h-3 mr-1 fill-current" />
                                                Featured
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-48 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/20 flex items-center justify-center relative">
                                            {job.company_logo ? (
                                                <img
                                                    src={job.company_logo}
                                                    alt={job.company_name}
                                                    className="max-w-[120px] max-h-[80px] object-contain"
                                                />
                                            ) : (
                                                <Building2 className="w-16 h-16 text-yellow-400 dark:text-yellow-500" />
                                            )}
                                            <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center">
                                                <Star className="w-3 h-3 mr-1 fill-current" />
                                                Featured
                                            </div>
                                        </div>
                                    )}
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-3">
                                            {getEmploymentTypeBadge(job.employment_type)}
                                            {job.work_arrangement === 'remote' && (
                                                <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 px-2 py-1 rounded-full flex items-center">
                                                    <Globe className="w-3 h-3 mr-1" />
                                                    Remote
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold text-maroon-900 dark:text-maroon-100 mb-1 group-hover:text-maroon-700 dark:group-hover:text-maroon-300 transition-colors line-clamp-1">
                                            {job.title}
                                        </h3>
                                        <p className="text-maroon-600 dark:text-maroon-400 font-medium mb-2">
                                            {job.company_name}
                                        </p>
                                        {job.location && (
                                            <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-3">
                                                <MapPin className="w-4 h-4 mr-1" />
                                                <span className="line-clamp-1">{job.location}</span>
                                            </div>
                                        )}
                                        {job.salary_range && (
                                            <p className="text-maroon-700 dark:text-maroon-300 font-semibold text-sm mb-3">
                                                {job.salary_range}
                                            </p>
                                        )}
                                        <div className="mt-4 flex items-center text-maroon-600 dark:text-maroon-400 text-sm font-medium group-hover:text-maroon-800 dark:group-hover:text-maroon-300">
                                            <span>View Details</span>
                                            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Job Listings */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-maroon-800 dark:text-maroon-200">
                            {loading ? 'Loading jobs...' : `${jobs.length} Jobs Found`}
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-maroon-600 dark:text-maroon-400" />
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-beige-200 dark:border-gray-700">
                            <Briefcase className="h-16 w-16 mb-4 text-gray-300 dark:text-gray-600" />
                            <h3 className="text-lg font-medium">No jobs found</h3>
                            <p className="text-sm">Try adjusting your search or filters</p>
                            {hasActiveFilters && (
                                <Button variant="link" onClick={clearFilters} className="mt-2 text-maroon-600 dark:text-maroon-400">
                                    Clear all filters
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {jobs.map((job, index) => (
                                <div
                                    key={job.id}
                                    onClick={() => viewJob(job, index)}
                                    className="group bg-white dark:bg-gray-800 rounded-2xl border border-beige-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:-translate-y-1 hover:border-maroon-300 dark:hover:border-maroon-600"
                                >
                                    {job.poster_image ? (
                                        <div className="h-48 overflow-hidden relative">
                                            <img
                                                src={job.poster_image}
                                                alt={job.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                            {job.is_featured && (
                                                <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center">
                                                    <Star className="w-3 h-3 mr-1 fill-current" />
                                                    Featured
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="h-48 bg-gradient-to-br from-maroon-50 to-maroon-100 dark:from-maroon-900/30 dark:to-maroon-800/20 flex items-center justify-center relative">
                                            {job.company_logo ? (
                                                <img
                                                    src={job.company_logo}
                                                    alt={job.company_name}
                                                    className="max-w-[120px] max-h-[80px] object-contain"
                                                />
                                            ) : (
                                                <Building2 className="w-16 h-16 text-maroon-400 dark:text-maroon-500" />
                                            )}
                                            {job.is_featured && (
                                                <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center">
                                                    <Star className="w-3 h-3 mr-1 fill-current" />
                                                    Featured
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-3">
                                            {getEmploymentTypeBadge(job.employment_type)}
                                            {job.work_arrangement === 'remote' && (
                                                <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 px-2 py-1 rounded-full flex items-center">
                                                    <Globe className="w-3 h-3 mr-1" />
                                                    Remote
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold text-maroon-900 dark:text-maroon-100 mb-1 group-hover:text-maroon-700 dark:group-hover:text-maroon-300 transition-colors line-clamp-1">
                                            {job.title}
                                        </h3>
                                        <p className="text-maroon-600 dark:text-maroon-400 font-medium mb-2">
                                            {job.company_name}
                                        </p>
                                        {job.location && (
                                            <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-3">
                                                <MapPin className="w-4 h-4 mr-1" />
                                                <span className="line-clamp-1">{job.location}</span>
                                            </div>
                                        )}
                                        {job.salary_range && (
                                            <p className="text-maroon-700 dark:text-maroon-300 font-semibold text-sm mb-3">
                                                {job.salary_range}
                                            </p>
                                        )}
                                        <div
                                            className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4 prose prose-sm max-w-none"
                                            dangerouslySetInnerHTML={{ __html: job.content }}
                                        />
                                        {job.expires_at && (
                                            <div className="flex items-center text-amber-600 dark:text-amber-400 text-xs mb-3">
                                                <Clock className="w-3 h-3 mr-1" />
                                                <span>Deadline: {formatDate(job.expires_at)}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {formatDate(job.created_at)}
                                            </span>
                                            <span className="flex items-center text-maroon-600 dark:text-maroon-400 text-sm font-medium group-hover:text-maroon-800 dark:group-hover:text-maroon-300">
                                                View Details
                                                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Job Detail Dialog */}
            <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border-beige-200 dark:border-gray-700">
                    {selectedJob && (
                        <>
                            <DialogHeader>
                                <div className="flex items-start gap-4">
                                    {selectedJob.poster_image ? (
                                        <div className="w-full h-48 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-lg">
                                            <img
                                                src={selectedJob.poster_image}
                                                alt={selectedJob.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : selectedJob.company_logo ? (
                                        <img
                                            src={selectedJob.company_logo}
                                            alt={selectedJob.company_name}
                                            className="w-16 h-16 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 bg-maroon-100 dark:bg-maroon-900/50 rounded-lg flex items-center justify-center">
                                            <Building2 className="h-8 w-8 text-maroon-600 dark:text-maroon-400" />
                                        </div>
                                    )}
                                    {!selectedJob.poster_image && (
                                        <div className="flex-1">
                                            <DialogTitle className="text-xl text-maroon-900 dark:text-maroon-100">{selectedJob.title}</DialogTitle>
                                            <DialogDescription className="flex items-center gap-2 mt-1">
                                                <span className="font-medium text-maroon-700 dark:text-maroon-300">{selectedJob.company_name}</span>
                                                {selectedJob.company_website && (
                                                    <a
                                                        href={selectedJob.company_website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-maroon-600 dark:text-maroon-400 hover:underline"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                )}
                                            </DialogDescription>
                                        </div>
                                    )}
                                </div>
                                {selectedJob.poster_image && (
                                    <div className="mt-2">
                                        <DialogTitle className="text-xl text-maroon-900 dark:text-maroon-100">{selectedJob.title}</DialogTitle>
                                        <DialogDescription className="flex items-center gap-2 mt-1">
                                            <span className="font-medium text-maroon-700 dark:text-maroon-300">{selectedJob.company_name}</span>
                                            {selectedJob.company_website && (
                                                <a
                                                    href={selectedJob.company_website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-maroon-600 dark:text-maroon-400 hover:underline"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            )}
                                        </DialogDescription>
                                    </div>
                                )}
                            </DialogHeader>

                            <div className="space-y-6 mt-4">
                                {/* Quick Info */}
                                <div className="flex flex-wrap gap-2">
                                    {getEmploymentTypeBadge(selectedJob.employment_type)}
                                    <Badge variant="outline" className="capitalize border-maroon-200 dark:border-maroon-700 text-maroon-700 dark:text-maroon-300">
                                        {getWorkArrangementIcon(selectedJob.work_arrangement)}
                                        <span className="ml-1">{selectedJob.work_arrangement}</span>
                                    </Badge>
                                    {selectedJob.category && (
                                        <Badge variant="secondary" className="bg-beige-100 dark:bg-gray-700 text-maroon-700 dark:text-maroon-300">{selectedJob.category.name}</Badge>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    {selectedJob.location && (
                                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                            <MapPin className="h-4 w-4 text-maroon-500 dark:text-maroon-400" />
                                            <span>{selectedJob.location}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                        <DollarSign className="h-4 w-4 text-maroon-500 dark:text-maroon-400" />
                                        <span>{formatSalary(selectedJob)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                        <Calendar className="h-4 w-4 text-maroon-500 dark:text-maroon-400" />
                                        <span>Posted {formatDate(selectedJob.created_at)}</span>
                                    </div>
                                    {selectedJob.expires_at && (
                                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                            <Clock className="h-4 w-4" />
                                            <span>Expires {formatDate(selectedJob.expires_at)}</span>
                                        </div>
                                    )}
                                </div>

                                <Separator className="bg-beige-200 dark:bg-gray-700" />

                                {/* Description */}
                                <div>
                                    <h4 className="font-semibold mb-2 text-maroon-900 dark:text-maroon-100">Job Description</h4>
                                    {selectedJob.use_pages && selectedJob.pages && selectedJob.pages.length > 0 ? (
                                        <PageCarousel
                                            pages={selectedJob.pages}
                                            className="min-h-[200px]"
                                            onPreviousItem={navigatePreviousJob}
                                            onNextItem={navigateNextJob}
                                            hasPreviousItem={currentJobIndex > 0}
                                            hasNextItem={currentJobIndex < jobs.length - 1}
                                            itemLabel="Job"
                                        />
                                    ) : (
                                        <div
                                            className="text-sm text-gray-600 dark:text-gray-400 prose prose-sm max-w-none dark:prose-invert"
                                            dangerouslySetInnerHTML={{ __html: selectedJob.content }}
                                        />
                                    )}
                                </div>

                                {/* Requirements */}
                                {selectedJob.requirements && (
                                    <div>
                                        <h4 className="font-semibold mb-2 text-maroon-900 dark:text-maroon-100">Requirements</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                            {selectedJob.requirements}
                                        </p>
                                    </div>
                                )}

                                {/* Benefits */}
                                {selectedJob.benefits && (
                                    <div>
                                        <h4 className="font-semibold mb-2 text-maroon-900 dark:text-maroon-100">Benefits</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                            {selectedJob.benefits}
                                        </p>
                                    </div>
                                )}

                                <Separator className="bg-beige-200 dark:bg-gray-700" />

                                {/* How to Apply */}
                                <div>
                                    <h4 className="font-semibold mb-3 text-maroon-900 dark:text-maroon-100">How to Apply</h4>
                                    <div className="space-y-2">
                                        {selectedJob.external_url && (
                                            <Button asChild className="w-full bg-maroon-600 hover:bg-maroon-700 dark:bg-maroon-700 dark:hover:bg-maroon-600">
                                                <a
                                                    href={selectedJob.external_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Apply on Company Website
                                                </a>
                                            </Button>
                                        )}
                                        {selectedJob.contact_email && (
                                            <Button variant="outline" asChild className="w-full border-maroon-300 dark:border-maroon-600 text-maroon-700 dark:text-maroon-300 hover:bg-maroon-50 dark:hover:bg-maroon-900/30">
                                                <a href={`mailto:${selectedJob.contact_email}`}>
                                                    <Mail className="h-4 w-4 mr-2" />
                                                    Email: {selectedJob.contact_email}
                                                </a>
                                            </Button>
                                        )}
                                        {selectedJob.contact_phone && (
                                            <Button variant="outline" asChild className="w-full border-maroon-300 dark:border-maroon-600 text-maroon-700 dark:text-maroon-300 hover:bg-maroon-50 dark:hover:bg-maroon-900/30">
                                                <a href={`tel:${selectedJob.contact_phone}`}>
                                                    <Phone className="h-4 w-4 mr-2" />
                                                    Call: {selectedJob.contact_phone}
                                                </a>
                                            </Button>
                                        )}
                                        {!selectedJob.external_url && !selectedJob.contact_email && !selectedJob.contact_phone && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                                Contact information not available. Please check the company website.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <Separator className="bg-beige-200 dark:bg-gray-700" />

                                {/* Navigation */}
                                <div className="flex items-center justify-between">
                                    <Button
                                        variant="outline"
                                        onClick={navigatePreviousJob}
                                        disabled={currentJobIndex <= 0}
                                        className="border-maroon-300 dark:border-maroon-600 text-maroon-700 dark:text-maroon-300 hover:bg-maroon-50 dark:hover:bg-maroon-900/30"
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Previous
                                    </Button>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {currentJobIndex + 1} of {jobs.length}
                                    </span>
                                    <Button
                                        variant="outline"
                                        onClick={navigateNextJob}
                                        disabled={currentJobIndex >= jobs.length - 1}
                                        className="border-maroon-300 dark:border-maroon-600 text-maroon-700 dark:text-maroon-300 hover:bg-maroon-50 dark:hover:bg-maroon-900/30"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </AlumniBaseLayout>
    );
}
