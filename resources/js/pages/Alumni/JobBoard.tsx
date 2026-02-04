import React, { useState, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Briefcase,
    Search,
    MapPin,
    DollarSign,
    Clock,
    Building2,
    Eye,
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

    const viewJob = async (job: JobPosting) => {
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
            full_time: 'bg-green-100 text-green-800',
            part_time: 'bg-blue-100 text-blue-800',
            contract: 'bg-purple-100 text-purple-800',
            internship: 'bg-orange-100 text-orange-800',
            freelance: 'bg-pink-100 text-pink-800',
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
            <Badge className={cn('capitalize', colors[typeKey] || 'bg-gray-100 text-gray-800')}>
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
                        <Briefcase className="h-8 w-8 text-primary" />
                        <div>
                            <h1 className="text-2xl font-bold">Job Board</h1>
                            <p className="text-muted-foreground">
                                Discover career opportunities from trusted employers
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search & Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search job titles, companies, or keywords..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Select value={categoryId || 'all'} onValueChange={(v) => setCategoryId(v === 'all' ? '' : v)}>
                                    <SelectTrigger className="w-40">
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
                                        <Button variant="outline" className="relative">
                                            <Filter className="h-4 w-4 mr-2" />
                                            Filters
                                            {hasActiveFilters && (
                                                <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
                                            )}
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent>
                                        <SheetHeader>
                                            <SheetTitle>Filter Jobs</SheetTitle>
                                            <SheetDescription>
                                                Refine your job search
                                            </SheetDescription>
                                        </SheetHeader>
                                        <div className="space-y-6 mt-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Employment Type</label>
                                                <Select value={employmentType || 'all'} onValueChange={(v) => setEmploymentType(v === 'all' ? '' : v)}>
                                                    <SelectTrigger>
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
                                                <label className="text-sm font-medium">Work Arrangement</label>
                                                <Select value={workArrangement || 'all'} onValueChange={(v) => setWorkArrangement(v === 'all' ? '' : v)}>
                                                    <SelectTrigger>
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
                                                <label className="text-sm font-medium">Sort By</label>
                                                <Select value={sortBy} onValueChange={setSortBy}>
                                                    <SelectTrigger>
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
                                                    className="w-full"
                                                    onClick={clearFilters}
                                                >
                                                    <X className="h-4 w-4 mr-2" />
                                                    Clear All Filters
                                                </Button>
                                            )}
                                        </div>
                                    </SheetContent>
                                </Sheet>
                                <Button type="submit">
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
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500" />
                            Featured Opportunities
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {featuredJobs.map((job) => (
                                <Card
                                    key={job.id}
                                    className="cursor-pointer hover:shadow-lg transition-shadow border-yellow-200 bg-yellow-50/50"
                                    onClick={() => viewJob(job)}
                                >
                                    <CardContent className="pt-6">
                                        <div className="flex items-start gap-3">
                                            {job.company_logo ? (
                                                <img
                                                    src={job.company_logo}
                                                    alt={job.company_name}
                                                    className="w-12 h-12 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                                    <Building2 className="h-6 w-6 text-primary" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold truncate">{job.title}</h3>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {job.company_name}
                                                </p>
                                            </div>
                                            <Badge variant="secondary" className="bg-yellow-100">
                                                <Star className="h-3 w-3 mr-1" />
                                                Featured
                                            </Badge>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
                                            {job.location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {job.location}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                {getWorkArrangementIcon(job.work_arrangement)}
                                                {job.work_arrangement}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Job Listings */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">
                            {loading ? 'Loading jobs...' : `${jobs.length} Jobs Found`}
                        </h2>
                    </div>

                    {loading ? (
                        <Card>
                            <CardContent className="flex items-center justify-center h-64">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </CardContent>
                        </Card>
                    ) : jobs.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                <Briefcase className="h-12 w-12 mb-4" />
                                <h3 className="text-lg font-medium">No jobs found</h3>
                                <p className="text-sm">Try adjusting your search or filters</p>
                                {hasActiveFilters && (
                                    <Button variant="link" onClick={clearFilters} className="mt-2">
                                        Clear all filters
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {jobs.map((job) => (
                                <Card
                                    key={job.id}
                                    className="cursor-pointer hover:shadow-lg transition-shadow"
                                    onClick={() => viewJob(job)}
                                >
                                    <CardContent className="pt-6">
                                        <div className="flex items-start gap-4">
                                            {job.company_logo ? (
                                                <img
                                                    src={job.company_logo}
                                                    alt={job.company_name}
                                                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <Building2 className="h-7 w-7 text-primary" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h3 className="text-lg font-semibold">{job.title}</h3>
                                                        <p className="text-muted-foreground">{job.company_name}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {getEmploymentTypeBadge(job.employment_type)}
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                    {job.location && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-4 w-4" />
                                                            {job.location}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        {getWorkArrangementIcon(job.work_arrangement)}
                                                        <span className="capitalize">{job.work_arrangement}</span>
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <DollarSign className="h-4 w-4" />
                                                        {formatSalary(job)}
                                                    </span>
                                                    {(job.views_count ?? 0) > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <Eye className="h-4 w-4" />
                                                            {job.views_count} views
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                                    {job.description}
                                                </p>
                                                <div className="mt-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            Posted {formatDate(job.created_at)}
                                                        </span>
                                                        {job.expires_at && (
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                Expires {formatDate(job.expires_at)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">
                                                        {job.category?.name || 'General'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Job Detail Dialog */}
            <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    {selectedJob && (
                        <>
                            <DialogHeader>
                                <div className="flex items-start gap-4">
                                    {selectedJob.company_logo ? (
                                        <img
                                            src={selectedJob.company_logo}
                                            alt={selectedJob.company_name}
                                            className="w-16 h-16 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <Building2 className="h-8 w-8 text-primary" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <DialogTitle className="text-xl">{selectedJob.title}</DialogTitle>
                                        <DialogDescription className="flex items-center gap-2 mt-1">
                                            <span className="font-medium text-foreground">{selectedJob.company_name}</span>
                                            {selectedJob.company_website && (
                                                <a
                                                    href={selectedJob.company_website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            )}
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="space-y-6 mt-4">
                                {/* Quick Info */}
                                <div className="flex flex-wrap gap-2">
                                    {getEmploymentTypeBadge(selectedJob.employment_type)}
                                    <Badge variant="outline" className="capitalize">
                                        {getWorkArrangementIcon(selectedJob.work_arrangement)}
                                        <span className="ml-1">{selectedJob.work_arrangement}</span>
                                    </Badge>
                                    {selectedJob.category && (
                                        <Badge variant="secondary">{selectedJob.category.name}</Badge>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    {selectedJob.location && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                            <span>{selectedJob.location}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                        <span>{formatSalary(selectedJob)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>Posted {formatDate(selectedJob.created_at)}</span>
                                    </div>
                                    {selectedJob.expires_at && (
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span>Expires {formatDate(selectedJob.expires_at)}</span>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* Description */}
                                <div>
                                    <h4 className="font-semibold mb-2">Job Description</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {selectedJob.description}
                                    </p>
                                </div>

                                {/* Requirements */}
                                {selectedJob.requirements && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Requirements</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {selectedJob.requirements}
                                        </p>
                                    </div>
                                )}

                                {/* Benefits */}
                                {selectedJob.benefits && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Benefits</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {selectedJob.benefits}
                                        </p>
                                    </div>
                                )}

                                <Separator />

                                {/* How to Apply */}
                                <div>
                                    <h4 className="font-semibold mb-3">How to Apply</h4>
                                    <div className="space-y-2">
                                        {selectedJob.external_url && (
                                            <Button asChild className="w-full">
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
                                            <Button variant="outline" asChild className="w-full">
                                                <a href={`mailto:${selectedJob.contact_email}`}>
                                                    <Mail className="h-4 w-4 mr-2" />
                                                    Email: {selectedJob.contact_email}
                                                </a>
                                            </Button>
                                        )}
                                        {selectedJob.contact_phone && (
                                            <Button variant="outline" asChild className="w-full">
                                                <a href={`tel:${selectedJob.contact_phone}`}>
                                                    <Phone className="h-4 w-4 mr-2" />
                                                    Call: {selectedJob.contact_phone}
                                                </a>
                                            </Button>
                                        )}
                                        {!selectedJob.external_url && !selectedJob.contact_email && !selectedJob.contact_phone && (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                Contact information not available. Please check the company website.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </AlumniBaseLayout>
    );
}
