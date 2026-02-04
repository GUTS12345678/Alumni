import React, { useState, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import { useCampus } from '@/contexts/CampusContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
    Briefcase,
    Search,
    Plus,
    Edit,
    Trash2,
    Eye,
    MoreVertical,
    Loader2,
    Star,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { JobPosting, JobCategory, JobFormData } from '@/types/jobs';
import { useToast } from '@/hooks/use-toast';

// Helper function to get CSRF token
const getCsrfToken = (): string => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
};

export default function JobBoard() {
    const { toast } = useToast();
    // Campus context for filtering
    const { selectedCampus } = useCampus();

    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [categories, setCategories] = useState<JobCategory[]>([]);
    const [statistics, setStatistics] = useState<{
        total_jobs: number;
        active_jobs: number;
        published_jobs: number;
        draft_jobs: number;
        total_views: number;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [showJobForm, setShowJobForm] = useState(false);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
    const [editingCategory, setEditingCategory] = useState<JobCategory | null>(null);
    const [saving, setSaving] = useState(false);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    // Form state
    const [formData, setFormData] = useState<JobFormData>({
        title: '',
        company_name: '',
        company_logo: '',
        company_website: '',
        category_id: 0,
        description: '',
        requirements: '',
        benefits: '',
        employment_type: 'full_time',
        work_arrangement: 'onsite',
        location: '',
        salary_min: undefined,
        salary_max: undefined,
        salary_currency: 'PHP',
        salary_period: 'monthly',
        is_salary_visible: true,
        contact_email: '',
        contact_phone: '',
        external_url: '',
        is_featured: false,
        status: 'draft',
    });

    const [categoryFormData, setCategoryFormData] = useState({
        name: '',
        description: '',
        icon: '',
        color: '#000000',
        is_active: true,
    });

    const fetchJobs = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);
            if (categoryFilter) params.append('category_id', categoryFilter);
            if (selectedCampus?.id) params.append('campus_id', selectedCampus.id.toString());

            const response = await fetch(`/api/v1/admin/jobs?${params.toString()}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setJobs(data.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
        }
    }, [search, statusFilter, categoryFilter, selectedCampus?.id]);

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

    const fetchStatistics = async () => {
        try {
            const response = await fetch('/api/v1/admin/jobs/statistics', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setStatistics(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch statistics:', error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await Promise.all([
                fetchJobs(),
                fetchCategories(),
                fetchStatistics(),
            ]);
            setLoading(false);
        };
        fetchData();
    }, [statusFilter, categoryFilter, fetchJobs]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchJobs();
    };

    const openJobForm = (job?: JobPosting) => {
        if (job) {
            setEditingJob(job);
            setFormData({
                title: job.title,
                company_name: job.company_name,
                company_logo: job.company_logo || '',
                company_website: job.company_website || '',
                category_id: job.category_id,
                description: job.description,
                requirements: job.requirements || '',
                benefits: job.benefits || '',
                employment_type: job.employment_type,
                work_arrangement: job.work_arrangement,
                location: job.location || '',
                salary_min: job.salary_min,
                salary_max: job.salary_max,
                salary_currency: job.salary_currency || 'PHP',
                salary_period: job.salary_period || 'monthly',
                is_salary_visible: job.is_salary_visible !== false,
                contact_email: job.contact_email || '',
                contact_phone: job.contact_phone || '',
                external_url: job.external_url || '',
                is_featured: job.is_featured || false,
                status: job.status,
                expires_at: job.expires_at,
            });
        } else {
            setEditingJob(null);
            setFormData({
                title: '',
                company_name: '',
                company_logo: '',
                company_website: '',
                category_id: categories[0]?.id || 0,
                description: '',
                requirements: '',
                benefits: '',
                employment_type: 'full_time',
                work_arrangement: 'onsite',
                location: '',
                salary_min: undefined,
                salary_max: undefined,
                salary_currency: 'PHP',
                salary_period: 'monthly',
                is_salary_visible: true,
                contact_email: '',
                contact_phone: '',
                external_url: '',
                is_featured: false,
                status: 'draft',
            });
        }
        setShowJobForm(true);
    };

    const saveJob = async () => {
        setSaving(true);
        try {
            const url = editingJob
                ? `/api/v1/admin/jobs/${editingJob.id}`
                : '/api/v1/admin/jobs';
            const method = editingJob ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast({
                    title: editingJob ? 'Job Updated' : 'Job Created',
                    description: `Job posting has been ${editingJob ? 'updated' : 'created'} successfully.`,
                });
                setShowJobForm(false);
                fetchJobs();
                fetchStatistics();
            } else {
                const error = await response.json();
                toast({
                    title: 'Error',
                    description: error.message || 'Failed to save job posting.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to save job:', error);
            toast({
                title: 'Error',
                description: 'An unexpected error occurred.',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const deleteJob = async (job: JobPosting) => {
        if (!confirm(`Are you sure you want to delete "${job.title}"?`)) return;

        try {
            const response = await fetch(`/api/v1/admin/jobs/${job.id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'include',
            });

            if (response.ok) {
                toast({
                    title: 'Job Deleted',
                    description: 'Job posting has been deleted.',
                });
                fetchJobs();
                fetchStatistics();
            }
        } catch (error) {
            console.error('Failed to delete job:', error);
        }
    };

    const updateJobStatus = async (job: JobPosting, status: string) => {
        try {
            const response = await fetch(`/api/v1/admin/jobs/${job.id}`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'include',
                body: JSON.stringify({ status }),
            });

            if (response.ok) {
                toast({
                    title: 'Status Updated',
                    description: `Job status changed to ${status}.`,
                });
                fetchJobs();
                fetchStatistics();
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const openCategoryForm = (category?: JobCategory) => {
        if (category) {
            setEditingCategory(category);
            setCategoryFormData({
                name: category.name,
                description: category.description || '',
                icon: category.icon || '',
                color: category.color || '#000000',
                is_active: category.is_active !== false,
            });
        } else {
            setEditingCategory(null);
            setCategoryFormData({
                name: '',
                description: '',
                icon: '',
                color: '#000000',
                is_active: true,
            });
        }
        setShowCategoryForm(true);
    };

    const saveCategory = async () => {
        setSaving(true);
        try {
            const url = editingCategory
                ? `/api/v1/admin/jobs/categories/${editingCategory.id}`
                : '/api/v1/admin/jobs/categories';
            const method = editingCategory ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'include',
                body: JSON.stringify(categoryFormData),
            });

            if (response.ok) {
                toast({
                    title: editingCategory ? 'Category Updated' : 'Category Created',
                    description: `Category has been ${editingCategory ? 'updated' : 'created'} successfully.`,
                });
                setShowCategoryForm(false);
                fetchCategories();
            } else {
                const error = await response.json();
                toast({
                    title: 'Error',
                    description: error.message || 'Failed to save category.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to save category:', error);
        } finally {
            setSaving(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: { [key: string]: string } = {
            published: 'bg-green-100 text-green-800',
            draft: 'bg-gray-100 text-gray-800',
            closed: 'bg-red-100 text-red-800',
            expired: 'bg-orange-100 text-orange-800',
        };
        return (
            <Badge className={cn('capitalize', variants[status] || variants.draft)}>
                {status}
            </Badge>
        );
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <AdminBaseLayout title="Job Board Management">
            <Head title="Job Board Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Briefcase className="h-6 w-6" />
                            Job Board Management
                        </h1>
                        <p className="text-muted-foreground">
                            Manage job postings and categories
                        </p>
                    </div>
                    <Button onClick={() => openJobForm()}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Job Posting
                    </Button>
                </div>

                {/* Statistics */}
                {statistics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Jobs</p>
                                        <p className="text-2xl font-bold">{statistics.total_jobs}</p>
                                    </div>
                                    <Briefcase className="h-8 w-8 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Published</p>
                                        <p className="text-2xl font-bold text-green-600">{statistics.published_jobs}</p>
                                    </div>
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Draft</p>
                                        <p className="text-2xl font-bold text-gray-600">{statistics.draft_jobs}</p>
                                    </div>
                                    <Clock className="h-8 w-8 text-gray-600" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Views</p>
                                        <p className="text-2xl font-bold text-blue-600">{statistics.total_views}</p>
                                    </div>
                                    <Eye className="h-8 w-8 text-blue-600" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Tabs */}
                <Tabs defaultValue="jobs">
                    <TabsList>
                        <TabsTrigger value="jobs">Job Postings</TabsTrigger>
                        <TabsTrigger value="categories">Categories</TabsTrigger>
                    </TabsList>

                    <TabsContent value="jobs" className="space-y-4">
                        {/* Filters */}
                        <Card>
                            <CardContent className="pt-6">
                                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search job titles or companies..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                    <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
                                        <SelectTrigger className="w-40">
                                            <SelectValue placeholder="All Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="published">Published</SelectItem>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                            <SelectItem value="expired">Expired</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={categoryFilter || 'all'} onValueChange={(v) => setCategoryFilter(v === 'all' ? '' : v)}>
                                        <SelectTrigger className="w-40">
                                            <SelectValue placeholder="All Categories" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id.toString()}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button type="submit">Search</Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Jobs Table */}
                        <Card>
                            <CardContent className="p-0">
                                {loading ? (
                                    <div className="flex items-center justify-center h-64">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : jobs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                        <Briefcase className="h-12 w-12 mb-4" />
                                        <p>No job postings found</p>
                                        <Button variant="link" onClick={() => openJobForm()}>
                                            Create your first job posting
                                        </Button>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Job Title</TableHead>
                                                <TableHead>Company</TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Views</TableHead>
                                                <TableHead>Created</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {jobs.map((job) => (
                                                <TableRow key={job.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {job.is_featured && (
                                                                <Star className="h-4 w-4 text-yellow-500" />
                                                            )}
                                                            <span className="font-medium">{job.title}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{job.company_name}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {job.category?.name || 'Uncategorized'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                                                    <TableCell>{job.views_count || 0}</TableCell>
                                                    <TableCell>{formatDate(job.created_at)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => openJobForm(job)}>
                                                                    <Edit className="h-4 w-4 mr-2" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                {job.status === 'draft' && (
                                                                    <DropdownMenuItem onClick={() => updateJobStatus(job, 'published')}>
                                                                        <CheckCircle className="h-4 w-4 mr-2" />
                                                                        Publish
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {job.status === 'published' && (
                                                                    <DropdownMenuItem onClick={() => updateJobStatus(job, 'closed')}>
                                                                        <XCircle className="h-4 w-4 mr-2" />
                                                                        Close
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive"
                                                                    onClick={() => deleteJob(job)}
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="categories" className="space-y-4">
                        <div className="flex justify-end">
                            <Button onClick={() => openCategoryForm()}>
                                <Plus className="h-4 w-4 mr-2" />
                                New Category
                            </Button>
                        </div>
                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Jobs</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {categories.map((category) => (
                                            <TableRow key={category.id}>
                                                <TableCell className="font-medium">{category.name}</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {category.description || '-'}
                                                </TableCell>
                                                <TableCell>{category.job_postings_count || 0}</TableCell>
                                                <TableCell>
                                                    <Badge variant={category.is_active ? 'default' : 'secondary'}>
                                                        {category.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openCategoryForm(category)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Job Form Dialog */}
            <Dialog open={showJobForm} onOpenChange={setShowJobForm}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingJob ? 'Edit Job Posting' : 'Create Job Posting'}
                        </DialogTitle>
                        <DialogDescription>
                            Fill in the details for the job posting
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Label>Job Title *</Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Senior Software Engineer"
                                />
                            </div>
                            <div>
                                <Label>Company Name *</Label>
                                <Input
                                    value={formData.company_name}
                                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                    placeholder="e.g., Tech Company Inc."
                                />
                            </div>
                            <div>
                                <Label>Category *</Label>
                                <Select
                                    value={formData.category_id?.toString()}
                                    onValueChange={(v) => setFormData({ ...formData, category_id: parseInt(v) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Separator />

                        {/* Description */}
                        <div className="space-y-4">
                            <div>
                                <Label>Description *</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe the role and responsibilities..."
                                    rows={4}
                                />
                            </div>
                            <div>
                                <Label>Requirements</Label>
                                <Textarea
                                    value={formData.requirements}
                                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                    placeholder="List the job requirements..."
                                    rows={3}
                                />
                            </div>
                            <div>
                                <Label>Benefits</Label>
                                <Textarea
                                    value={formData.benefits}
                                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                                    placeholder="List benefits and perks..."
                                    rows={3}
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Employment Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Employment Type *</Label>
                                <Select
                                    value={formData.employment_type}
                                    onValueChange={(v) => setFormData({ ...formData, employment_type: v as 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance' })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="full_time">Full Time</SelectItem>
                                        <SelectItem value="part_time">Part Time</SelectItem>
                                        <SelectItem value="contract">Contract</SelectItem>
                                        <SelectItem value="internship">Internship</SelectItem>
                                        <SelectItem value="freelance">Freelance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Work Arrangement *</Label>
                                <Select
                                    value={formData.work_arrangement}
                                    onValueChange={(v) => setFormData({ ...formData, work_arrangement: v as 'onsite' | 'remote' | 'hybrid' })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="onsite">On-site</SelectItem>
                                        <SelectItem value="remote">Remote</SelectItem>
                                        <SelectItem value="hybrid">Hybrid</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2">
                                <Label>Location</Label>
                                <Input
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="e.g., Manila, Philippines"
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Salary */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Salary Information</Label>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={formData.is_salary_visible}
                                        onCheckedChange={(v) => setFormData({ ...formData, is_salary_visible: v })}
                                    />
                                    <span className="text-sm">Show salary</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <Label>Min Salary</Label>
                                    <Input
                                        type="number"
                                        value={formData.salary_min || ''}
                                        onChange={(e) => setFormData({ ...formData, salary_min: e.target.value ? parseInt(e.target.value) : undefined })}
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <Label>Max Salary</Label>
                                    <Input
                                        type="number"
                                        value={formData.salary_max || ''}
                                        onChange={(e) => setFormData({ ...formData, salary_max: e.target.value ? parseInt(e.target.value) : undefined })}
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <Label>Currency</Label>
                                    <Select
                                        value={formData.salary_currency}
                                        onValueChange={(v) => setFormData({ ...formData, salary_currency: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PHP">PHP</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Period</Label>
                                    <Select
                                        value={formData.salary_period}
                                        onValueChange={(v) => setFormData({ ...formData, salary_period: v as 'hourly' | 'monthly' | 'yearly' })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="hourly">Hourly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="yearly">Yearly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Contact & Application */}
                        <div className="space-y-4">
                            <h4 className="font-medium">How to Apply</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Contact Email</Label>
                                    <Input
                                        type="email"
                                        value={formData.contact_email}
                                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                        placeholder="hr@company.com"
                                    />
                                </div>
                                <div>
                                    <Label>Contact Phone</Label>
                                    <Input
                                        value={formData.contact_phone}
                                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                        placeholder="+63 912 345 6789"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label>External Application URL</Label>
                                    <Input
                                        type="url"
                                        value={formData.external_url}
                                        onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                                        placeholder="https://company.com/careers/apply"
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Settings */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(v) => setFormData({ ...formData, status: v as 'draft' | 'published' | 'closed' })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="published">Published</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end gap-4">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={formData.is_featured}
                                        onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })}
                                    />
                                    <Label>Featured Job</Label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowJobForm(false)}>
                            Cancel
                        </Button>
                        <Button onClick={saveJob} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {editingJob ? 'Update Job' : 'Create Job'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Category Form Dialog */}
            <Dialog open={showCategoryForm} onOpenChange={setShowCategoryForm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategory ? 'Edit Category' : 'Create Category'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label>Name *</Label>
                            <Input
                                value={categoryFormData.name}
                                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                                placeholder="e.g., Information Technology"
                            />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea
                                value={categoryFormData.description}
                                onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                                placeholder="Brief description of this category"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={categoryFormData.is_active}
                                onCheckedChange={(v) => setCategoryFormData({ ...categoryFormData, is_active: v })}
                            />
                            <Label>Active</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCategoryForm(false)}>
                            Cancel
                        </Button>
                        <Button onClick={saveCategory} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {editingCategory ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminBaseLayout>
    );
}
