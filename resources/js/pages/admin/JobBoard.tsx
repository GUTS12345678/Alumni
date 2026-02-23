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
import { MultiPageEditor } from '@/components/ui/multi-page-editor';
import { PageCarousel, ContentPage } from '@/components/ui/page-carousel';
import {
    Briefcase,
    Search,
    Plus,
    Edit,
    Trash2,
    Eye,
    Loader2,
    Star,
    CheckCircle,
    XCircle,
    Clock,
    Upload,
    ImageIcon,
    MapPin,
    DollarSign,
    Building2,
    Calendar,
    ExternalLink,
    Mail,
    Phone,
    Globe,
    Laptop,
    Layers,
    ChevronRight,
    Send,
    Download,
    ChevronDown,
    FileText
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { JobPosting, JobCategory, JobFormData } from '@/types/jobs';
import { useToast } from '@/hooks/use-toast';
import { useAdminChannel } from '@/hooks/useAdminChannel';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';

// Helper function to get CSRF token
const getCsrfToken = (): string => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
};

export default function JobBoard() {
    const { toast } = useToast();
    const { confirm, confirmState, handleConfirm, handleCancel } = useConfirmDialog();
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
    const [viewingJob, setViewingJob] = useState<JobPosting | null>(null);
    const [saving, setSaving] = useState(false);

    // Filters
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    // Form state
    const [formData, setFormData] = useState<JobFormData>({
        title: '',
        company_name: '',
        company_logo: '',
        company_website: '',
        category_id: 0,
        content: '',
        pages: [],
        use_pages: false,
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
        campus_id: null,
        is_multi_campus: true,
        poster_image: undefined,
        background_image: undefined,
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
            if (debouncedSearch) params.append('search', debouncedSearch);
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
    }, [debouncedSearch, statusFilter, categoryFilter, selectedCampus?.id]);

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

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const handleExport = async (format: 'csv' | 'excel' | 'pdf' = 'csv') => {
        try {
            const params = new URLSearchParams();
            params.append('format', format);
            if (debouncedSearch) params.append('search', debouncedSearch);
            if (statusFilter) params.append('status', statusFilter);
            if (categoryFilter) params.append('category_id', categoryFilter);
            if (selectedCampus?.id) params.append('campus_id', selectedCampus.id.toString());

            const response = await fetch(`/api/v1/admin/jobs/export?${params.toString()}`, {
                headers: {
                    'Accept': 'application/octet-stream',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const extension = format === 'excel' ? 'xlsx' : format;
                a.download = `job_postings_${new Date().toISOString().split('T')[0]}.${extension}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                toast({
                    title: 'Export Successful',
                    description: `Job postings exported as ${format.toUpperCase()}.`,
                });
            } else {
                console.error('Export failed:', response.statusText);
                alert('Export failed. Please try again.');
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('Export failed. Please try again.');
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

    // Real-time: refresh when jobs change
    useAdminChannel({
        onContentChange: (data) => {
            if (data.content_type === 'job') {
                fetchJobs();
                fetchStatistics();
            }
        },
    });

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
                content: job.content,
                pages: job.pages || [],
                use_pages: job.use_pages || false,
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
                poster_image: job.poster_image || undefined,
                background_image: job.background_image || undefined,
            });
        } else {
            setEditingJob(null);
            setFormData({
                title: '',
                company_name: '',
                company_logo: '',
                company_website: '',
                category_id: categories[0]?.id || 0,
                content: '',
                pages: [],
                use_pages: false,
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

    const uploadImage = async (file: File, type: string = 'job'): Promise<string | null> => {
        const uploadData = new FormData();
        uploadData.append('image', file);
        uploadData.append('type', type);
        const res = await fetch('/api/v1/upload/image', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': getCsrfToken(),
            },
            credentials: 'include',
            body: uploadData,
        });
        if (res.ok) {
            const data = await res.json();
            return data.url || null;
        }
        return null;
    };

    const saveJob = async () => {
        setSaving(true);
        try {
            const url = editingJob
                ? `/api/v1/admin/jobs/${editingJob.id}`
                : '/api/v1/admin/jobs';
            const method = editingJob ? 'PUT' : 'POST';

            // Upload image files first, then include URLs
            const payload: Record<string, unknown> = { ...formData };

            if (formData.poster_image instanceof File) {
                const posterUrl = await uploadImage(formData.poster_image);
                payload.poster_image = posterUrl;
            } else if (typeof formData.poster_image === 'string') {
                payload.poster_image = formData.poster_image;
            } else {
                delete payload.poster_image;
            }

            if (formData.background_image instanceof File) {
                const bgUrl = await uploadImage(formData.background_image);
                payload.background_image = bgUrl;
            } else if (typeof formData.background_image === 'string') {
                payload.background_image = formData.background_image;
            } else {
                delete payload.background_image;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'include',
                body: JSON.stringify(payload),
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
        const ok = await confirm({ title: 'Delete Job', message: `Are you sure you want to delete "${job.title}"?`, variant: 'destructive', confirmLabel: 'Delete' });
        if (!ok) return;

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

    const viewJob = async (job: JobPosting) => {
        try {
            const response = await fetch(`/api/v1/admin/jobs/${job.id}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setViewingJob(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch job details:', error);
            setViewingJob(job);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: { [key: string]: string } = {
            published: 'bg-green-100 text-green-800',
            draft: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
            closed: 'bg-red-100 text-red-800',
            expired: 'bg-orange-100 text-orange-800',
        };
        return (
            <Badge className={cn('capitalize', variants[status] || variants.draft)}>
                {status}
            </Badge>
        );
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
            <Badge className={cn('capitalize', colors[typeKey] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200')}>
                {labels[typeKey] || typeKey}
            </Badge>
        );
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

    const formatSalary = (job: JobPosting): string => {
        if (job.is_salary_visible === false) return 'Competitive';
        if (job.salary_range) return job.salary_range;
        if (job.salary_min || job.salary_max) {
            const currency = job.salary_currency || 'PHP';
            const period = job.salary_period || 'monthly';
            if (job.salary_min && job.salary_max) {
                return `${currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} / ${period}`;
            } else if (job.salary_min) {
                return `From ${currency} ${job.salary_min.toLocaleString()} / ${period}`;
            } else if (job.salary_max) {
                return `Up to ${currency} ${job.salary_max.toLocaleString()} / ${period}`;
            }
        }
        return 'Competitive';
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
                    <div className="flex flex-wrap gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                    <ChevronDown className="h-4 w-4 ml-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleExport('csv')}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Export as CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('excel')}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Export as Excel
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Export as PDF
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button onClick={() => openJobForm()}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Job Posting
                        </Button>
                    </div>
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
                                        <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{statistics.draft_jobs}</p>
                                    </div>
                                    <Clock className="h-8 w-8 text-gray-600 dark:text-gray-400" />
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

                        {/* Jobs Count */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-maroon-800 dark:text-gray-200">
                                {loading ? 'Loading...' : `${jobs.length} Job Postings`}
                            </h2>
                        </div>

                        {/* Jobs Grid */}
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground bg-white dark:bg-gray-800 rounded-2xl border border-beige-200 dark:border-gray-700">
                                <Briefcase className="h-16 w-16 mb-4 text-gray-300" />
                                <h3 className="text-lg font-medium">No job postings found</h3>
                                <p className="text-sm">Create your first job posting to get started</p>
                                <Button variant="link" onClick={() => openJobForm()} className="mt-2 text-maroon-600 dark:text-maroon-400">
                                    Create job posting
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {jobs.map((job) => (
                                    <div
                                        key={job.id}
                                        onClick={() => viewJob(job)}
                                        className="group bg-white dark:bg-gray-800 rounded-2xl border border-beige-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:-translate-y-1 hover:border-maroon-300"
                                    >
                                        {/* Image Section */}
                                        {job.poster_image_url ? (
                                            <div className="h-48 overflow-hidden relative">
                                                <img
                                                    src={job.poster_image_url}
                                                    alt={job.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                                <div className="absolute top-3 left-3 flex gap-2">
                                                    {getEmploymentTypeBadge(job.employment_type)}
                                                    {job.is_featured && (
                                                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                                            <Star className="h-3 w-3 mr-1 fill-yellow-500" /> Featured
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="absolute top-3 right-3">
                                                    {getStatusBadge(job.status)}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-48 bg-gradient-to-br from-maroon-50 to-maroon-100 dark:from-maroon-900/30 dark:to-maroon-800/30 flex items-center justify-center relative">
                                                <Briefcase className="w-16 h-16 text-maroon-300" />
                                                <div className="absolute top-3 left-3 flex gap-2">
                                                    {getEmploymentTypeBadge(job.employment_type)}
                                                    {job.is_featured && (
                                                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                                            <Star className="h-3 w-3 mr-1 fill-yellow-500" /> Featured
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="absolute top-3 right-3">
                                                    {getStatusBadge(job.status)}
                                                </div>
                                            </div>
                                        )}

                                        {/* Content Section */}
                                        <div className="p-5">
                                            <h3 className="text-lg font-bold text-maroon-900 dark:text-gray-100 mb-1 group-hover:text-maroon-700 dark:group-hover:text-gray-300 transition-colors line-clamp-1">
                                                {job.title}
                                            </h3>
                                            <p className="text-maroon-600 dark:text-gray-400 text-sm font-medium mb-2 flex items-center">
                                                <Building2 className="w-4 h-4 mr-1" />
                                                {job.company_name}
                                            </p>

                                            {/* Location & Arrangement */}
                                            <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-2">
                                                <MapPin className="w-4 h-4 mr-1" />
                                                <span className="line-clamp-1">{job.location || 'Not specified'}</span>
                                                {job.work_arrangement && (
                                                    <span className="ml-2 flex items-center">
                                                        {getWorkArrangementIcon(job.work_arrangement)}
                                                        <span className="ml-1 capitalize">{job.work_arrangement}</span>
                                                    </span>
                                                )}
                                            </div>

                                            {/* Salary */}
                                            <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-3">
                                                <DollarSign className="w-4 h-4 mr-1" />
                                                <span>{formatSalary(job)}</span>
                                            </div>

                                            {/* Category */}
                                            {job.category && (
                                                <Badge variant="outline" className="text-xs mb-3">
                                                    {job.category.name}
                                                </Badge>
                                            )}

                                            {/* Footer */}
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {formatDate(job.created_at)}
                                                    </span>
                                                    <span className="flex items-center">
                                                        <Eye className="w-3 h-3 mr-1" />
                                                        {job.views_count || 0}
                                                    </span>
                                                </div>
                                                <span className="flex items-center text-maroon-600 dark:text-gray-400 text-sm font-medium group-hover:text-maroon-800 dark:group-hover:text-gray-200">
                                                    View
                                                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                                </span>
                                            </div>
                                        </div>

                                        {/* Quick Actions Bar */}
                                        <div className="border-t border-beige-200 dark:border-gray-700 px-5 py-2 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); openJobForm(job); }}
                                                className="h-7 text-xs"
                                            >
                                                <Edit className="h-3 w-3 mr-1" /> Edit
                                            </Button>
                                            {job.status === 'draft' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => { e.stopPropagation(); updateJobStatus(job, 'published'); }}
                                                    className="h-7 text-xs"
                                                >
                                                    <Send className="h-3 w-3 mr-1" /> Publish
                                                </Button>
                                            )}
                                            {job.status === 'published' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => { e.stopPropagation(); updateJobStatus(job, 'closed'); }}
                                                    className="h-7 text-xs"
                                                >
                                                    <XCircle className="h-3 w-3 mr-1" /> Close
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); deleteJob(job); }}
                                                className="h-7 text-xs text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-3 w-3 mr-1" /> Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="categories" className="space-y-4">
                        <div className="flex justify-end">
                            <Button onClick={() => openCategoryForm()}>
                                <Plus className="h-4 w-4 mr-2" />
                                New Category
                            </Button>
                        </div>
                        <Card>
                            <CardContent className="p-0 overflow-x-auto">
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
                            {/* Content Type Toggle */}
                            <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={formData.use_pages || false}
                                        onCheckedChange={(v) => setFormData({ ...formData, use_pages: v })}
                                    />
                                    <Label className="flex items-center gap-2 cursor-pointer">
                                        <Layers className="h-4 w-4" />
                                        Multi-Page Description
                                    </Label>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formData.use_pages
                                        ? 'Create multiple pages with images and layouts'
                                        : 'Simple text description'
                                    }
                                </span>
                            </div>

                            {formData.use_pages ? (
                                <MultiPageEditor
                                    pages={formData.pages || []}
                                    onChange={(pages) => setFormData({ ...formData, pages: pages as ContentPage[] })}
                                    onImageUpload={async (file) => {
                                        const formDataUpload = new FormData();
                                        formDataUpload.append('image', file);
                                        formDataUpload.append('type', 'job');

                                        const response = await fetch('/api/v1/admin/upload/image', {
                                            method: 'POST',
                                            headers: {
                                                'X-CSRF-TOKEN': getCsrfToken(),
                                            },
                                            credentials: 'include',
                                            body: formDataUpload,
                                        });

                                        if (!response.ok) throw new Error('Upload failed');
                                        const data = await response.json();
                                        return data.path;
                                    }}
                                />
                            ) : (
                                <div>
                                    <Label>Content *</Label>
                                    <Textarea
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        placeholder="Describe the role and responsibilities..."
                                        rows={4}
                                    />
                                </div>
                            )}
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

                        {/* Campus Selection */}
                        <div className="space-y-4">
                            <h4 className="font-medium text-maroon-800 dark:text-gray-200">Target Campus</h4>
                            <div className="space-y-3">
                                <label
                                    htmlFor="job-all-campuses"
                                    className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.is_multi_campus
                                        ? 'border-maroon-600 bg-maroon-50 dark:bg-maroon-900/30'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-maroon-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        id="job-all-campuses"
                                        name="job-campus-selection"
                                        checked={formData.is_multi_campus}
                                        onChange={() => setFormData({ ...formData, is_multi_campus: true, campus_id: null })}
                                        className="w-4 h-4 text-maroon-600 focus:ring-maroon-500 focus:ring-2 cursor-pointer"
                                    />
                                    <span className={`text-sm font-medium ${formData.is_multi_campus ? 'text-maroon-800 dark:text-gray-200' : 'text-gray-700 dark:text-gray-300'
                                        }`}>
                                        All Campuses (Job visible to all alumni)
                                    </span>
                                </label>
                                <label
                                    htmlFor="job-specific-campus"
                                    className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${!formData.is_multi_campus
                                        ? 'border-maroon-600 bg-maroon-50 dark:bg-maroon-900/30'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-maroon-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        id="job-specific-campus"
                                        name="job-campus-selection"
                                        checked={!formData.is_multi_campus}
                                        onChange={() => setFormData({ ...formData, is_multi_campus: false })}
                                        className="w-4 h-4 mt-0.5 text-maroon-600 focus:ring-maroon-500 focus:ring-2 cursor-pointer flex-shrink-0"
                                    />
                                    <div className="flex-1">
                                        <span className={`text-sm font-medium block mb-2 ${!formData.is_multi_campus ? 'text-maroon-800 dark:text-gray-200' : 'text-gray-700 dark:text-gray-300'
                                            }`}>
                                            Specific Campus Only
                                        </span>
                                        {!formData.is_multi_campus && (
                                            <Select
                                                value={formData.campus_id?.toString() || ''}
                                                onValueChange={(value) => setFormData({ ...formData, campus_id: parseInt(value) })}
                                            >
                                                <SelectTrigger className="w-full border-beige-300 dark:border-gray-600">
                                                    <SelectValue placeholder="Select campus" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1">Main Campus - Manila</SelectItem>
                                                    <SelectItem value="2">Cavite Campus</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                </label>
                            </div>
                            <p className="text-xs text-maroon-600 dark:text-gray-400">
                                Choose whether this job posting should be available to all campuses or restricted to a specific campus.
                            </p>
                        </div>

                        <Separator />

                        {/* Images */}
                        <div className="space-y-4">
                            <h4 className="font-medium text-maroon-800 dark:text-gray-200">Job Posting Images</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Poster Image</Label>
                                    <div className="mt-2">
                                        {typeof formData.poster_image === 'string' && formData.poster_image ? (
                                            <div className="relative w-full h-32 border-2 border-beige-300 dark:border-gray-600 rounded-lg overflow-hidden">
                                                <img src={formData.poster_image} alt="Poster" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, poster_image: undefined })}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-beige-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-maroon-400 hover:bg-maroon-50 dark:hover:bg-maroon-800/30 transition-colors">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) setFormData({ ...formData, poster_image: file });
                                                    }}
                                                />
                                                {formData.poster_image instanceof File ? (
                                                    <div className="flex items-center space-x-2">
                                                        <ImageIcon className="h-5 w-5 text-maroon-600 dark:text-gray-400" />
                                                        <span className="text-sm text-maroon-700 dark:text-gray-300">{formData.poster_image.name}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center">
                                                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">Upload poster image</span>
                                                    </div>
                                                )}
                                            </label>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Recommended: 800x600px</p>
                                </div>
                                <div>
                                    <Label>Background Image</Label>
                                    <div className="mt-2">
                                        {typeof formData.background_image === 'string' && formData.background_image ? (
                                            <div className="relative w-full h-32 border-2 border-beige-300 dark:border-gray-600 rounded-lg overflow-hidden">
                                                <img src={formData.background_image} alt="Background" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, background_image: undefined })}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-beige-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-maroon-400 hover:bg-maroon-50 dark:hover:bg-maroon-800/30 transition-colors">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) setFormData({ ...formData, background_image: file });
                                                    }}
                                                />
                                                {formData.background_image instanceof File ? (
                                                    <div className="flex items-center space-x-2">
                                                        <ImageIcon className="h-5 w-5 text-maroon-600 dark:text-gray-400" />
                                                        <span className="text-sm text-maroon-700 dark:text-gray-300">{formData.background_image.name}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center">
                                                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">Upload background</span>
                                                    </div>
                                                )}
                                            </label>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Recommended: 1920x1080px</p>
                                </div>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

            {/* Job View Dialog */}
            <Dialog open={!!viewingJob} onOpenChange={() => setViewingJob(null)}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    {viewingJob && (
                        <>
                            {/* Poster Image Banner */}
                            {viewingJob.poster_image_url && (
                                <div className="w-full h-48 -mt-6 -mx-6 mb-4 overflow-hidden rounded-t-lg" style={{ width: 'calc(100% + 3rem)' }}>
                                    <img
                                        src={viewingJob.poster_image_url}
                                        alt={viewingJob.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <DialogHeader>
                                <div className="flex items-start gap-4">
                                    {viewingJob.company_logo_url ? (
                                        <img
                                            src={viewingJob.company_logo_url}
                                            alt={viewingJob.company_name}
                                            className="w-16 h-16 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <Building2 className="h-8 w-8 text-primary" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <DialogTitle className="text-xl">{viewingJob.title}</DialogTitle>
                                            {viewingJob.is_featured && (
                                                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                            )}
                                        </div>
                                        <DialogDescription className="flex items-center gap-2 mt-1">
                                            <span className="font-medium text-foreground">{viewingJob.company_name}</span>
                                            {viewingJob.company_website && (
                                                <a
                                                    href={viewingJob.company_website}
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
                                    <div className="flex-shrink-0">
                                        {getStatusBadge(viewingJob.status)}
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="space-y-6 mt-4">
                                {/* Quick Info */}
                                <div className="flex flex-wrap gap-2">
                                    {getEmploymentTypeBadge(viewingJob.employment_type)}
                                    <Badge variant="outline" className="capitalize">
                                        {getWorkArrangementIcon(viewingJob.work_arrangement)}
                                        <span className="ml-1">{viewingJob.work_arrangement}</span>
                                    </Badge>
                                    {viewingJob.category && (
                                        <Badge variant="secondary">{viewingJob.category.name}</Badge>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    {viewingJob.location && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                            <span>{viewingJob.location}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                        <span>{formatSalary(viewingJob)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>Posted {formatDate(viewingJob.created_at)}</span>
                                    </div>
                                    {viewingJob.expires_at && (
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span>Expires {formatDate(viewingJob.expires_at)}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                        <span>{viewingJob.views_count || 0} views</span>
                                    </div>
                                </div>

                                <Separator />

                                {/* Description */}
                                <div>
                                    <h4 className="font-semibold mb-2">Job Description</h4>
                                    {viewingJob.use_pages && viewingJob.pages && viewingJob.pages.length > 0 ? (
                                        <PageCarousel
                                            pages={viewingJob.pages}
                                            className="min-h-[200px]"
                                        />
                                    ) : (
                                        <div
                                            className="text-sm text-muted-foreground prose prose-sm max-w-none dark:prose-invert"
                                            dangerouslySetInnerHTML={{ __html: viewingJob.content }}
                                        />
                                    )}
                                </div>

                                {/* Requirements */}
                                {viewingJob.requirements && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Requirements</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {viewingJob.requirements}
                                        </p>
                                    </div>
                                )}

                                {/* Benefits */}
                                {viewingJob.benefits && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Benefits</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {viewingJob.benefits}
                                        </p>
                                    </div>
                                )}

                                <Separator />

                                {/* Contact Information */}
                                <div>
                                    <h4 className="font-semibold mb-3">Contact Information</h4>
                                    <div className="space-y-2">
                                        {viewingJob.external_url && (
                                            <Button variant="outline" asChild className="w-full justify-start">
                                                <a
                                                    href={viewingJob.external_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    External Application URL
                                                </a>
                                            </Button>
                                        )}
                                        {viewingJob.contact_email && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <span>{viewingJob.contact_email}</span>
                                            </div>
                                        )}
                                        {viewingJob.contact_phone && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span>{viewingJob.contact_phone}</span>
                                            </div>
                                        )}
                                        {!viewingJob.external_url && !viewingJob.contact_email && !viewingJob.contact_phone && (
                                            <p className="text-sm text-muted-foreground">
                                                No contact information provided.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="mt-6">
                                <Button variant="outline" onClick={() => setViewingJob(null)}>
                                    Close
                                </Button>
                                <Button onClick={() => {
                                    setViewingJob(null);
                                    openJobForm(viewingJob);
                                }}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Job
                                </Button>
                            </DialogFooter>
                        </>
                    )}
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
            <ConfirmDialog open={confirmState.open} title={confirmState.title} message={confirmState.message} confirmLabel={confirmState.confirmLabel} cancelLabel={confirmState.cancelLabel} variant={confirmState.variant} onConfirm={handleConfirm} onCancel={handleCancel} />
        </AdminBaseLayout>
    );
}
