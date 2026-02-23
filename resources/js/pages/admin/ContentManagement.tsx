import React, { useState, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import { useCampus } from '@/contexts/CampusContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import RichEditor from '@/components/ui/RichEditor';
import {
    Plus, Layers, Briefcase, Megaphone, Calendar, Search, Trash2, Eye, Edit,
    Loader2, AlertCircle, XCircle, RefreshCw, Globe,
    MapPin, Building2, ExternalLink, FileText, Newspaper, BookOpen, GraduationCap,
    Upload, ImageIcon, X, Images, ChevronUp, ChevronDown
} from 'lucide-react';
import axios from 'axios';

interface AttachedFile {
    name: string;
    url: string;
    type: string;
    size: number;
}

interface User {
    id: number;
    email: string;
    role: string;
    name: string;
    status: string;
    profile_picture_path?: string | null;
}

interface ContentItem {
    id: number;
    content_type: 'announcement' | 'job' | 'event' | 'news' | 'blog' | 'scholarship' | 'resource';
    title: string;
    slug: string;
    content: string;
    status: 'draft' | 'published' | 'closed' | 'expired';
    is_published: boolean;
    is_featured: boolean;
    priority?: string;
    company_name?: string;
    company_logo?: string;
    job_type?: string;
    work_arrangement?: string;
    location?: string;
    salary_min?: number;
    salary_max?: number;
    salary_currency?: string;
    salary_period?: string;
    category_id?: number;
    category?: { id: number; name: string };
    target_type?: string;
    target_batch_years?: number[];
    target_department_ids?: number[];
    contact_email?: string;
    contact_phone?: string;
    external_url?: string;
    application_deadline?: string;
    requirements?: string;
    benefits?: string;
    start_date?: string;
    featured_image?: string;
    featured_image_url?: string;
    company_logo_url?: string;
    background_image_url?: string;
    gallery_images?: string[];
    show_on_landing?: boolean;
    expires_at?: string;
    published_at?: string;
    created_at: string;
    created_by?: { id: number; name: string };
    reads_count?: number;
    content_views_count?: number;
}

interface Category {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
}

interface Stats {
    total: number;
    published: number;
    draft: number;
    total_announcements: number;
    total_jobs: number;
    total_events: number;
    published_announcements: number;
    published_jobs: number;
    total_views: number;
    total_reads: number;
}

interface Props {
    user: User;
}

const typeIcons: Record<string, React.ReactNode> = {
    announcement: <Megaphone className="h-4 w-4" />,
    job: <Briefcase className="h-4 w-4" />,
    event: <Calendar className="h-4 w-4" />,
    news: <Newspaper className="h-4 w-4" />,
    blog: <BookOpen className="h-4 w-4" />,
    scholarship: <GraduationCap className="h-4 w-4" />,
    resource: <FileText className="h-4 w-4" />,
};

const typeColors: Record<string, string> = {
    announcement: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    job: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    event: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    news: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    blog: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    scholarship: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    resource: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

const statusColors: Record<string, string> = {
    published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function ContentManagement({ user }: Props) {
    const { selectedCampus } = useCampus();

    const [contents, setContents] = useState<ContentItem[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>(() => {
        // Pre-select the type filter when navigated from the dashboard with ?type=...
        if (typeof window !== 'undefined') {
            return new URLSearchParams(window.location.search).get('type') || '';
        }
        return '';
    });
    const [statusFilter, setStatusFilter] = useState<string>('');

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

    const [formData, setFormData] = useState({
        content_type: 'announcement' as 'announcement' | 'job' | 'event' | 'news' | 'blog' | 'scholarship' | 'resource',
        title: '',
        content: '',
        status: 'published',
        is_featured: false,
        show_on_landing: false,
        target_type: 'all',
        priority: 'normal',
        company_name: '',
        category_id: '',
        job_type: 'full_time',
        work_arrangement: 'onsite',
        location: '',
        salary_min: '',
        salary_max: '',
        contact_email: '',
        external_url: '',
        application_deadline: '',
        requirements: '',
        benefits: '',
        start_date: '',
        featured_image: '',
        company_logo: '',
        gallery_images: [] as string[],
    });
    const [uploadingImage, setUploadingImage] = useState<string | null>(null);

    const resetForm = () => {
        setFormData({
            content_type: 'announcement' as 'announcement' | 'job' | 'event' | 'news' | 'blog' | 'scholarship' | 'resource',
            title: '',
            content: '',
            status: 'published',
            is_featured: false,
            show_on_landing: false,
            target_type: 'all',
            priority: 'normal',
            company_name: '',
            category_id: '',
            job_type: 'full_time',
            work_arrangement: 'onsite',
            location: '',
            salary_min: '',
            salary_max: '',
            contact_email: '',
            external_url: '',
            application_deadline: '',
            requirements: '',
            benefits: '',
            start_date: '',
            featured_image: '',
            company_logo: '',
            gallery_images: [],
        });
        setFormErrors({});
        setAttachedFiles([]);
        setUploadingImage(null);
    };

    const handleImageUpload = async (file: File, field: 'featured_image' | 'company_logo') => {
        setUploadingImage(field);
        try {
            const uploadData = new FormData();
            uploadData.append('file', file);
            uploadData.append('type', 'image');
            const response = await axios.post('/api/v1/content/admin/upload-media', uploadData);
            if (response.data.success) {
                setFormData((prev) => ({ ...prev, [field]: response.data.path }));
            }
        } catch (error) {
            console.error(`Error uploading ${field}:`, error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setUploadingImage(null);
        }
    };

    const handleGalleryUpload = async (files: FileList) => {
        setUploadingImage('gallery');
        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                const uploadData = new FormData();
                uploadData.append('file', file);
                uploadData.append('type', 'image');
                const res = await axios.post('/api/v1/content/admin/upload-media', uploadData);
                return res.data.success ? res.data.path : null;
            });
            const paths = (await Promise.all(uploadPromises)).filter(Boolean) as string[];
            setFormData((prev) => ({ ...prev, gallery_images: [...prev.gallery_images, ...paths] }));
        } catch (error) {
            console.error('Error uploading gallery images:', error);
            alert('Failed to upload some images.');
        } finally {
            setUploadingImage(null);
        }
    };

    const getStorageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('/')) return path;
        // Department/appearance images via public asset route; everything else via private file route
        if (path.startsWith('departments/') || path.startsWith('appearance/')) {
            return `/api/v1/assets/${path}`;
        }
        return `/api/v1/files/${path}`;
    };

    const moveGalleryImage = (index: number, direction: 'up' | 'down') => {
        setFormData((prev) => {
            const newImages = [...prev.gallery_images];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= newImages.length) return prev;
            [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
            return { ...prev, gallery_images: newImages };
        });
    };

    const getMediaCount = (item: ContentItem) => {
        let count = 0;
        if (item.featured_image || item.featured_image_url) count++;
        if (item.company_logo || item.company_logo_url) count++;
        if (item.gallery_images && item.gallery_images.length > 0) count += item.gallery_images.length;
        return count;
    };

    const getFirstMediaUrl = (item: ContentItem): string | null => {
        if (item.featured_image_url) return item.featured_image_url;
        if (item.featured_image) return getStorageUrl(item.featured_image);
        if (item.company_logo_url) return item.company_logo_url;
        if (item.gallery_images && item.gallery_images.length > 0) return getStorageUrl(item.gallery_images[0]);
        return null;
    };

    const fetchContents = useCallback(async () => {
        try {
            setLoading(true);
            const params: Record<string, string | number> = {
                page: currentPage,
                per_page: 15,
            };
            if (searchQuery) params.search = searchQuery;
            if (typeFilter) params.type = typeFilter;
            if (statusFilter) params.status = statusFilter;
            if (selectedCampus) params.campus_id = selectedCampus.id;

            const response = await axios.get('/api/v1/content/admin/list', { params });
            if (response.data.success) {
                setContents(response.data.data.data || []);
                setTotalPages(response.data.data.last_page || 1);
                setTotalItems(response.data.data.total || 0);
            }
        } catch (error) {
            console.error('Error fetching content:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchQuery, typeFilter, statusFilter, selectedCampus]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await axios.get('/api/v1/content/admin/statistics');
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            const response = await axios.get('/api/v1/content/categories');
            if (response.data.success) {
                setCategories(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    }, []);

    useEffect(() => {
        fetchContents();
    }, [fetchContents]);

    useEffect(() => {
        fetchStats();
        fetchCategories();
    }, [fetchStats, fetchCategories]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFormErrors({});

        try {
            const payload: Record<string, unknown> = {
                content_type: formData.content_type,
                title: formData.title,
                content: formData.content,
                status: formData.status,
                is_featured: formData.is_featured,
                show_on_landing: formData.show_on_landing,
            };

            if (formData.featured_image) payload.featured_image = formData.featured_image;
            if (formData.gallery_images.length > 0) payload.gallery_images = formData.gallery_images;

            if (formData.content_type === 'announcement') {
                payload.target_type = formData.target_type;
                payload.priority = formData.priority;
                payload.publish_now = formData.status === 'published';
            } else if (formData.content_type === 'job') {
                payload.company_name = formData.company_name;
                payload.category_id = formData.category_id ? Number(formData.category_id) : undefined;
                payload.job_type = formData.job_type;
                payload.work_arrangement = formData.work_arrangement;
                if (formData.company_logo) payload.company_logo = formData.company_logo;
                if (formData.location) payload.location = formData.location;
                if (formData.salary_min) payload.salary_min = Number(formData.salary_min);
                if (formData.salary_max) payload.salary_max = Number(formData.salary_max);
                if (formData.contact_email) payload.contact_email = formData.contact_email;
                if (formData.external_url) payload.external_url = formData.external_url;
                if (formData.application_deadline) payload.application_deadline = formData.application_deadline;
                if (formData.requirements) payload.requirements = formData.requirements;
                if (formData.benefits) payload.benefits = formData.benefits;
            } else if (formData.content_type === 'event') {
                if (formData.location) payload.location = formData.location;
                if (formData.start_date) payload.start_date = formData.start_date;
                payload.priority = formData.priority;
            }

            await axios.post('/api/v1/content/admin/create', payload);
            setShowCreateModal(false);
            resetForm();
            fetchContents();
            fetchStats();
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.data?.errors) {
                const errs: Record<string, string> = {};
                Object.entries(error.response.data.errors as Record<string, string[]>).forEach(([key, val]) => {
                    errs[key] = Array.isArray(val) ? val[0] : String(val);
                });
                setFormErrors(errs);
            } else {
                alert(axios.isAxiosError(error) ? error.response?.data?.message || 'Failed to create content' : 'Failed to create content');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedContent) return;
        setSubmitting(true);
        try {
            await axios.delete(`/api/v1/content/admin/${selectedContent.id}`);
            setShowDeleteModal(false);
            setSelectedContent(null);
            fetchContents();
            fetchStats();
        } catch (error: unknown) {
            alert(axios.isAxiosError(error) ? error.response?.data?.message || 'Failed to delete content' : 'Failed to delete content');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (item: ContentItem) => {
        const newStatus = item.status === 'published' ? 'draft' : 'published';
        try {
            await axios.put(`/api/v1/content/admin/${item.id}`, { status: newStatus });
            fetchContents();
            fetchStats();
        } catch (error: unknown) {
            alert(axios.isAxiosError(error) ? error.response?.data?.message || 'Failed to update status' : 'Failed to update status');
        }
    };

    const openEditModal = (item: ContentItem) => {
        setSelectedContent(item);
        setFormData({
            content_type: item.content_type,
            title: item.title,
            content: item.content || '',
            status: item.status,
            is_featured: item.is_featured,
            show_on_landing: item.show_on_landing || false,
            target_type: item.target_type || 'all',
            priority: item.priority || 'normal',
            company_name: item.company_name || '',
            category_id: item.category_id ? String(item.category_id) : '',
            job_type: item.job_type || 'full_time',
            work_arrangement: item.work_arrangement || 'onsite',
            location: item.location || '',
            salary_min: item.salary_min ? String(item.salary_min) : '',
            salary_max: item.salary_max ? String(item.salary_max) : '',
            contact_email: item.contact_email || '',
            external_url: item.external_url || '',
            application_deadline: item.application_deadline ? item.application_deadline.split('T')[0] : '',
            requirements: item.requirements || '',
            benefits: item.benefits || '',
            start_date: item.start_date ? item.start_date.substring(0, 16) : '',
            featured_image: item.featured_image || '',
            company_logo: item.company_logo || '',
            gallery_images: (item as unknown as Record<string, unknown>).gallery_images as string[] || [],
        });
        setFormErrors({});
        setAttachedFiles([]);
        setUploadingImage(null);
        setShowEditModal(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedContent) return;
        setSubmitting(true);
        setFormErrors({});

        try {
            const payload: Record<string, unknown> = {
                title: formData.title,
                content: formData.content,
                status: formData.status,
                is_featured: formData.is_featured,
                show_on_landing: formData.show_on_landing,
                featured_image: formData.featured_image || null,
                gallery_images: formData.gallery_images.length > 0 ? formData.gallery_images : null,
            };

            if (formData.content_type === 'announcement') {
                payload.target_type = formData.target_type;
                payload.priority = formData.priority;
            } else if (formData.content_type === 'job') {
                payload.company_name = formData.company_name;
                payload.category_id = formData.category_id ? Number(formData.category_id) : undefined;
                payload.job_type = formData.job_type;
                payload.work_arrangement = formData.work_arrangement;
                payload.company_logo = formData.company_logo || null;
                if (formData.location) payload.location = formData.location;
                if (formData.salary_min) payload.salary_min = Number(formData.salary_min);
                if (formData.salary_max) payload.salary_max = Number(formData.salary_max);
                if (formData.contact_email) payload.contact_email = formData.contact_email;
                if (formData.external_url) payload.external_url = formData.external_url;
                if (formData.application_deadline) payload.application_deadline = formData.application_deadline;
                if (formData.requirements) payload.requirements = formData.requirements;
                if (formData.benefits) payload.benefits = formData.benefits;
            } else if (formData.content_type === 'event') {
                if (formData.location) payload.location = formData.location;
                if (formData.start_date) payload.start_date = formData.start_date;
                payload.priority = formData.priority;
            }

            await axios.put(`/api/v1/content/admin/${selectedContent.id}`, payload);
            setShowEditModal(false);
            setSelectedContent(null);
            resetForm();
            fetchContents();
            fetchStats();
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.data?.errors) {
                const errs: Record<string, string> = {};
                Object.entries(error.response.data.errors as Record<string, string[]>).forEach(([key, val]) => {
                    errs[key] = Array.isArray(val) ? val[0] : String(val);
                });
                setFormErrors(errs);
            } else {
                alert(axios.isAxiosError(error) ? error.response?.data?.message || 'Failed to update content' : 'Failed to update content');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
    };

    return (
        <AdminBaseLayout title="Content Management" user={user}>
            <Head title="Content Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                            Content Management
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Manage announcements, job postings, and events
                        </p>
                    </div>
                    <Button
                        onClick={() => { resetForm(); setShowCreateModal(true); }}
                        className="bg-maroon-600 hover:bg-maroon-700 text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Content
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setTypeFilter(''); setCurrentPage(1); }}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
                            <Layers className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
                            <p className="text-xs text-muted-foreground">{stats?.published ?? 0} published, {stats?.draft ?? 0} draft</p>
                        </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setTypeFilter('announcement'); setCurrentPage(1); }}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Announcements</CardTitle>
                            <Megaphone className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total_announcements ?? 0}</div>
                            <p className="text-xs text-muted-foreground">{stats?.published_announcements ?? 0} published</p>
                        </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setTypeFilter('job'); setCurrentPage(1); }}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Job Postings</CardTitle>
                            <Briefcase className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total_jobs ?? 0}</div>
                            <p className="text-xs text-muted-foreground">{stats?.published_jobs ?? 0} published</p>
                        </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setTypeFilter('event'); setCurrentPage(1); }}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Events</CardTitle>
                            <Calendar className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total_events ?? 0}</div>
                            <p className="text-xs text-muted-foreground">{stats?.total_views ?? 0} total views</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters & Search */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="text"
                                        placeholder="Search content..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Button type="submit" variant="outline" size="sm">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </form>
                            <div className="flex gap-2">
                                <select
                                    value={typeFilter}
                                    onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
                                >
                                    <option value="">All Types</option>
                                    <option value="announcement">Announcements</option>
                                    <option value="job">Job Postings</option>
                                    <option value="event">Events</option>
                                </select>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="published">Published</option>
                                    <option value="draft">Draft</option>
                                    <option value="closed">Closed</option>
                                    <option value="expired">Expired</option>
                                </select>
                                <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setTypeFilter(''); setStatusFilter(''); setCurrentPage(1); }}>
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Content List */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Content ({totalItems})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-maroon-600" />
                            </div>
                        ) : contents.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="font-medium">No content found</p>
                                <p className="text-sm mt-2">
                                    Create your first content item using the button above
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {contents.map((item) => {
                                    const mediaUrl = getFirstMediaUrl(item);
                                    const mediaCount = getMediaCount(item);
                                    return (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                        >
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                {/* Media Thumbnail */}
                                                {mediaUrl ? (
                                                    <div className="relative flex-shrink-0">
                                                        <img
                                                            src={mediaUrl}
                                                            alt=""
                                                            className="w-14 h-14 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                        />
                                                        {mediaCount > 1 && (
                                                            <span className="absolute -top-1.5 -right-1.5 bg-maroon-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                                                {mediaCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className={`p-2 rounded-lg ${typeColors[item.content_type]} flex-shrink-0`}>
                                                        {typeIcons[item.content_type]}
                                                    </div>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                            {item.title}
                                                        </h3>
                                                        {item.is_featured && (
                                                            <Badge variant="outline" className="text-yellow-600 border-yellow-300 text-xs">
                                                                Featured
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                                                            {item.status}
                                                        </span>
                                                        <span className="capitalize">{item.content_type}</span>
                                                        {item.company_name && (
                                                            <span className="flex items-center gap-1">
                                                                <Building2 className="h-3 w-3" />
                                                                {item.company_name}
                                                            </span>
                                                        )}
                                                        {item.location && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="h-3 w-3" />
                                                                {item.location}
                                                            </span>
                                                        )}
                                                        {item.created_by && (
                                                            <span>by {item.created_by.name}</span>
                                                        )}
                                                        <span>{formatDate(item.created_at)}</span>
                                                        {item.content_views_count !== undefined && (
                                                            <span className="flex items-center gap-1">
                                                                <Eye className="h-3 w-3" />
                                                                {item.content_views_count}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                                <button
                                                    onClick={() => { setSelectedContent(item); setShowViewModal(true); }}
                                                    className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                    title="View"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="p-2 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(item)}
                                                    className={`p-2 rounded-lg ${item.status === 'published' ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'}`}
                                                    title={item.status === 'published' ? 'Unpublish' : 'Publish'}
                                                >
                                                    <Globe className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedContent(item); setShowDeleteModal(true); }}
                                                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between pt-4">
                                        <p className="text-sm text-gray-500">
                                            Page {currentPage} of {totalPages} ({totalItems} items)
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={currentPage <= 1}
                                                onClick={() => setCurrentPage((p) => p - 1)}
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={currentPage >= totalPages}
                                                onClick={() => setCurrentPage((p) => p + 1)}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Create Content Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create Content</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            {/* Content Type Selector */}
                            <div>
                                <Label>Content Type *</Label>
                                <div className="grid grid-cols-4 gap-2 mt-1">
                                    {(['announcement', 'job', 'event', 'news', 'blog', 'scholarship', 'resource'] as const).map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, content_type: type })}
                                            className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${formData.content_type === type
                                                ? 'border-maroon-600 bg-maroon-50 dark:bg-maroon-900/20 text-maroon-700 dark:text-maroon-300'
                                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            {typeIcons[type]}
                                            <span className="capitalize text-sm font-medium">{type}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <Label>Title *</Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Enter title"
                                    className="mt-1"
                                    required
                                />
                                {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
                            </div>

                            {/* Media Upload Section */}
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
                                <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4" /> Media Uploads
                                </h3>

                                {/* Featured Image */}
                                <div>
                                    <Label>Featured Image / Poster</Label>
                                    <div className="mt-1">
                                        {formData.featured_image ? (
                                            <div className="relative inline-block">
                                                <img
                                                    src={getStorageUrl(formData.featured_image)}
                                                    alt="Featured"
                                                    className="h-32 w-auto rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, featured_image: '' })}
                                                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-maroon-400 dark:hover:border-maroon-500 transition-colors">
                                                {uploadingImage === 'featured_image' ? (
                                                    <Loader2 className="h-5 w-5 animate-spin text-maroon-600" />
                                                ) : (
                                                    <Upload className="h-5 w-5 text-gray-400" />
                                                )}
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    {uploadingImage === 'featured_image' ? 'Uploading...' : 'Click to upload featured image'}
                                                </span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    disabled={uploadingImage !== null}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleImageUpload(file, 'featured_image');
                                                        e.target.value = '';
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* Company Logo (Jobs only) */}
                                {formData.content_type === 'job' && (
                                    <div>
                                        <Label>Company Logo</Label>
                                        <div className="mt-1">
                                            {formData.company_logo ? (
                                                <div className="relative inline-block">
                                                    <img
                                                        src={getStorageUrl(formData.company_logo)}
                                                        alt="Company Logo"
                                                        className="h-20 w-auto rounded-lg object-contain border border-gray-200 dark:border-gray-600 bg-white p-2"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, company_logo: '' })}
                                                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-maroon-400 dark:hover:border-maroon-500 transition-colors">
                                                    {uploadingImage === 'company_logo' ? (
                                                        <Loader2 className="h-5 w-5 animate-spin text-maroon-600" />
                                                    ) : (
                                                        <Upload className="h-5 w-5 text-gray-400" />
                                                    )}
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        {uploadingImage === 'company_logo' ? 'Uploading...' : 'Click to upload company logo'}
                                                    </span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        disabled={uploadingImage !== null}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleImageUpload(file, 'company_logo');
                                                            e.target.value = '';
                                                        }}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Gallery Images */}
                                <div>
                                    <Label>Gallery Images</Label>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Drag or use arrows to reorder. First image is the primary display image.</p>
                                    <div className="mt-1 space-y-2">
                                        {formData.gallery_images.length > 0 && (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                {formData.gallery_images.map((img, idx) => (
                                                    <div key={idx} className="group relative rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden bg-gray-50 dark:bg-gray-800">
                                                        <img
                                                            src={getStorageUrl(img)}
                                                            alt={`Gallery ${idx + 1}`}
                                                            className="h-24 w-full object-cover"
                                                        />
                                                        {/* Order badge */}
                                                        <span className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                                            {idx + 1}
                                                        </span>
                                                        {/* Action buttons overlay */}
                                                        <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                type="button"
                                                                disabled={idx === 0}
                                                                onClick={() => moveGalleryImage(idx, 'up')}
                                                                className="p-0.5 bg-black/60 text-white rounded hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed"
                                                                title="Move left"
                                                            >
                                                                <ChevronUp className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={idx === formData.gallery_images.length - 1}
                                                                onClick={() => moveGalleryImage(idx, 'down')}
                                                                className="p-0.5 bg-black/60 text-white rounded hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed"
                                                                title="Move right"
                                                            >
                                                                <ChevronDown className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData((prev) => ({
                                                                    ...prev,
                                                                    gallery_images: prev.gallery_images.filter((_, i) => i !== idx),
                                                                }))}
                                                                className="p-0.5 bg-red-500 text-white rounded hover:bg-red-600"
                                                                title="Remove"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-maroon-400 dark:hover:border-maroon-500 transition-colors">
                                            {uploadingImage === 'gallery' ? (
                                                <Loader2 className="h-5 w-5 animate-spin text-maroon-600" />
                                            ) : (
                                                <Images className="h-5 w-5 text-gray-400" />
                                            )}
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {uploadingImage === 'gallery' ? 'Uploading...' : 'Add gallery images (multiple)'}
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                disabled={uploadingImage !== null}
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files.length > 0) handleGalleryUpload(e.target.files);
                                                    e.target.value = '';
                                                }}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Content Body – Create modal */}
                            <div>
                                <Label>Content</Label>
                                <div className="mt-1">
                                    <RichEditor
                                        value={formData.content}
                                        onChange={(html) => setFormData({ ...formData, content: html })}
                                        placeholder="Write your content here…"
                                        minHeight={220}
                                        attachedFiles={attachedFiles}
                                        onFileUploaded={(f) => setAttachedFiles((prev) => [...prev, f])}
                                        onRemoveFile={(url) => setAttachedFiles((prev) => prev.filter((f) => f.url !== url))}
                                    />
                                </div>
                            </div>

                            {/* Status & Options */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label>Status</Label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
                                    >
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                    </select>
                                </div>
                                <div className="flex items-end gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_featured}
                                            onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                            className="rounded border-gray-300"
                                        />
                                        <span className="text-sm">Featured</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.show_on_landing}
                                            onChange={(e) => setFormData({ ...formData, show_on_landing: e.target.checked })}
                                            className="rounded border-gray-300"
                                        />
                                        <span className="text-sm">Landing Page</span>
                                    </label>
                                </div>
                            </div>

                            {/* Announcement-specific fields */}
                            {formData.content_type === 'announcement' && (
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                                    <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <Megaphone className="h-4 w-4" /> Announcement Settings
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Target Audience</Label>
                                            <select
                                                value={formData.target_type}
                                                onChange={(e) => setFormData({ ...formData, target_type: e.target.value })}
                                                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
                                            >
                                                <option value="all">All Alumni</option>
                                                <option value="batch">Specific Batch</option>
                                                <option value="department">Specific Department</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label>Priority</Label>
                                            <select
                                                value={formData.priority}
                                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
                                            >
                                                <option value="low">Low</option>
                                                <option value="normal">Normal</option>
                                                <option value="high">High</option>
                                                <option value="urgent">Urgent</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Job-specific fields */}
                            {formData.content_type === 'job' && (
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                                    <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <Briefcase className="h-4 w-4" /> Job Details
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Company Name *</Label>
                                            <Input
                                                value={formData.company_name}
                                                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                                placeholder="Company name"
                                                className="mt-1"
                                                required
                                            />
                                            {formErrors.company_name && <p className="text-red-500 text-xs mt-1">{formErrors.company_name}</p>}
                                        </div>
                                        <div>
                                            <Label>Category *</Label>
                                            <select
                                                value={formData.category_id}
                                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
                                                required
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                            {formErrors.category_id && <p className="text-red-500 text-xs mt-1">{formErrors.category_id}</p>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Job Type *</Label>
                                            <select
                                                value={formData.job_type}
                                                onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
                                                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
                                                required
                                            >
                                                <option value="full_time">Full Time</option>
                                                <option value="part_time">Part Time</option>
                                                <option value="contract">Contract</option>
                                                <option value="internship">Internship</option>
                                                <option value="freelance">Freelance</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label>Work Arrangement *</Label>
                                            <select
                                                value={formData.work_arrangement}
                                                onChange={(e) => setFormData({ ...formData, work_arrangement: e.target.value })}
                                                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
                                                required
                                            >
                                                <option value="onsite">On-site</option>
                                                <option value="remote">Remote</option>
                                                <option value="hybrid">Hybrid</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Location</Label>
                                            <Input
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                placeholder="e.g., Manila, Philippines"
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label>Application Deadline</Label>
                                            <Input
                                                type="date"
                                                value={formData.application_deadline}
                                                onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Min Salary</Label>
                                            <Input
                                                type="number"
                                                value={formData.salary_min}
                                                onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                                                placeholder="0"
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label>Max Salary</Label>
                                            <Input
                                                type="number"
                                                value={formData.salary_max}
                                                onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                                                placeholder="0"
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Contact Email</Label>
                                            <Input
                                                type="email"
                                                value={formData.contact_email}
                                                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                                placeholder="hr@company.com"
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label>External URL</Label>
                                            <Input
                                                type="url"
                                                value={formData.external_url}
                                                onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                                                placeholder="https://..."
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Requirements</Label>
                                        <Textarea
                                            value={formData.requirements}
                                            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                            placeholder="Job requirements..."
                                            className="mt-1"
                                            rows={3}
                                        />
                                    </div>
                                    <div>
                                        <Label>Benefits</Label>
                                        <Textarea
                                            value={formData.benefits}
                                            onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                                            placeholder="Job benefits..."
                                            className="mt-1"
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Event-specific fields */}
                            {formData.content_type === 'event' && (
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                                    <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <Calendar className="h-4 w-4" /> Event Details
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Event Date</Label>
                                            <Input
                                                type="datetime-local"
                                                value={formData.start_date}
                                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label>Location</Label>
                                            <Input
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                placeholder="Event venue"
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Priority</Label>
                                        <select
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                            className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
                                        >
                                            <option value="low">Low</option>
                                            <option value="normal">Normal</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} disabled={submitting}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-maroon-600 hover:bg-maroon-700 text-white" disabled={submitting}>
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create {formData.content_type.charAt(0).toUpperCase() + formData.content_type.slice(1)}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Content Modal */}
            {showEditModal && selectedContent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                Edit {formData.content_type.charAt(0).toUpperCase() + formData.content_type.slice(1)}
                            </h2>
                            <button onClick={() => { setShowEditModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="p-6 space-y-4">
                            {/* Title */}
                            <div>
                                <Label>Title *</Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Enter title"
                                    className="mt-1"
                                    required
                                />
                                {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
                            </div>

                            {/* Media Upload Section */}
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
                                <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4" /> Media Uploads
                                </h3>

                                {/* Featured Image */}
                                <div>
                                    <Label>Featured Image / Poster</Label>
                                    <div className="mt-1">
                                        {formData.featured_image ? (
                                            <div className="relative inline-block">
                                                <img
                                                    src={getStorageUrl(formData.featured_image)}
                                                    alt="Featured"
                                                    className="h-32 w-auto rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, featured_image: '' })}
                                                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-maroon-400 dark:hover:border-maroon-500 transition-colors">
                                                {uploadingImage === 'featured_image' ? (
                                                    <Loader2 className="h-5 w-5 animate-spin text-maroon-600" />
                                                ) : (
                                                    <Upload className="h-5 w-5 text-gray-400" />
                                                )}
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    {uploadingImage === 'featured_image' ? 'Uploading...' : 'Click to upload featured image'}
                                                </span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    disabled={uploadingImage !== null}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleImageUpload(file, 'featured_image');
                                                        e.target.value = '';
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* Company Logo (Jobs only) */}
                                {formData.content_type === 'job' && (
                                    <div>
                                        <Label>Company Logo</Label>
                                        <div className="mt-1">
                                            {formData.company_logo ? (
                                                <div className="relative inline-block">
                                                    <img
                                                        src={getStorageUrl(formData.company_logo)}
                                                        alt="Company Logo"
                                                        className="h-20 w-auto rounded-lg object-contain border border-gray-200 dark:border-gray-600 bg-white p-2"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, company_logo: '' })}
                                                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-maroon-400 dark:hover:border-maroon-500 transition-colors">
                                                    {uploadingImage === 'company_logo' ? (
                                                        <Loader2 className="h-5 w-5 animate-spin text-maroon-600" />
                                                    ) : (
                                                        <Upload className="h-5 w-5 text-gray-400" />
                                                    )}
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        {uploadingImage === 'company_logo' ? 'Uploading...' : 'Click to upload company logo'}
                                                    </span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        disabled={uploadingImage !== null}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleImageUpload(file, 'company_logo');
                                                            e.target.value = '';
                                                        }}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Gallery Images */}
                                <div>
                                    <Label>Gallery Images</Label>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Drag or use arrows to reorder. First image is the primary display image.</p>
                                    <div className="mt-1 space-y-2">
                                        {formData.gallery_images.length > 0 && (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                {formData.gallery_images.map((img, idx) => (
                                                    <div key={idx} className="group relative rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden bg-gray-50 dark:bg-gray-800">
                                                        <img
                                                            src={getStorageUrl(img)}
                                                            alt={`Gallery ${idx + 1}`}
                                                            className="h-24 w-full object-cover"
                                                        />
                                                        {/* Order badge */}
                                                        <span className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                                            {idx + 1}
                                                        </span>
                                                        {/* Action buttons overlay */}
                                                        <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                type="button"
                                                                disabled={idx === 0}
                                                                onClick={() => moveGalleryImage(idx, 'up')}
                                                                className="p-0.5 bg-black/60 text-white rounded hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed"
                                                                title="Move left"
                                                            >
                                                                <ChevronUp className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={idx === formData.gallery_images.length - 1}
                                                                onClick={() => moveGalleryImage(idx, 'down')}
                                                                className="p-0.5 bg-black/60 text-white rounded hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed"
                                                                title="Move right"
                                                            >
                                                                <ChevronDown className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData((prev) => ({
                                                                    ...prev,
                                                                    gallery_images: prev.gallery_images.filter((_, i) => i !== idx),
                                                                }))}
                                                                className="p-0.5 bg-red-500 text-white rounded hover:bg-red-600"
                                                                title="Remove"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-maroon-400 dark:hover:border-maroon-500 transition-colors">
                                            {uploadingImage === 'gallery' ? (
                                                <Loader2 className="h-5 w-5 animate-spin text-maroon-600" />
                                            ) : (
                                                <Images className="h-5 w-5 text-gray-400" />
                                            )}
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {uploadingImage === 'gallery' ? 'Uploading...' : 'Add gallery images (multiple)'}
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                disabled={uploadingImage !== null}
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files.length > 0) handleGalleryUpload(e.target.files);
                                                    e.target.value = '';
                                                }}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Content Body – Edit modal */}
                            <div>
                                <Label>Content</Label>
                                <div className="mt-1">
                                    <RichEditor
                                        value={formData.content}
                                        onChange={(html) => setFormData({ ...formData, content: html })}
                                        placeholder="Write your content here…"
                                        minHeight={260}
                                        attachedFiles={attachedFiles}
                                        onFileUploaded={(f) => setAttachedFiles((prev) => [...prev, f])}
                                        onRemoveFile={(url) => setAttachedFiles((prev) => prev.filter((f) => f.url !== url))}
                                    />
                                </div>
                            </div>

                            {/* Status & Options */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label>Status</Label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
                                    >
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                        <option value="closed">Closed</option>
                                        <option value="expired">Expired</option>
                                    </select>
                                </div>
                                <div className="flex items-end gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_featured}
                                            onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                            className="rounded border-gray-300"
                                        />
                                        <span className="text-sm">Featured</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.show_on_landing}
                                            onChange={(e) => setFormData({ ...formData, show_on_landing: e.target.checked })}
                                            className="rounded border-gray-300"
                                        />
                                        <span className="text-sm">Landing Page</span>
                                    </label>
                                </div>
                            </div>

                            {/* Announcement-specific fields */}
                            {formData.content_type === 'announcement' && (
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                                    <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <Megaphone className="h-4 w-4" /> Announcement Settings
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Target Audience</Label>
                                            <select
                                                value={formData.target_type}
                                                onChange={(e) => setFormData({ ...formData, target_type: e.target.value })}
                                                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
                                            >
                                                <option value="all">All Alumni</option>
                                                <option value="batch">Specific Batch</option>
                                                <option value="department">Specific Department</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label>Priority</Label>
                                            <select
                                                value={formData.priority}
                                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
                                            >
                                                <option value="low">Low</option>
                                                <option value="normal">Normal</option>
                                                <option value="high">High</option>
                                                <option value="urgent">Urgent</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Job-specific fields */}
                            {formData.content_type === 'job' && (
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                                    <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <Briefcase className="h-4 w-4" /> Job Details
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Company Name *</Label>
                                            <Input
                                                value={formData.company_name}
                                                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                                placeholder="Company name"
                                                className="mt-1"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label>Category</Label>
                                            <select
                                                value={formData.category_id}
                                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Job Type</Label>
                                            <select
                                                value={formData.job_type}
                                                onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
                                                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
                                            >
                                                <option value="full_time">Full Time</option>
                                                <option value="part_time">Part Time</option>
                                                <option value="contract">Contract</option>
                                                <option value="internship">Internship</option>
                                                <option value="freelance">Freelance</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label>Work Arrangement</Label>
                                            <select
                                                value={formData.work_arrangement}
                                                onChange={(e) => setFormData({ ...formData, work_arrangement: e.target.value })}
                                                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
                                            >
                                                <option value="onsite">On-site</option>
                                                <option value="remote">Remote</option>
                                                <option value="hybrid">Hybrid</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Location</Label>
                                            <Input
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                placeholder="e.g., Manila, Philippines"
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label>Application Deadline</Label>
                                            <Input
                                                type="date"
                                                value={formData.application_deadline}
                                                onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Min Salary</Label>
                                            <Input
                                                type="number"
                                                value={formData.salary_min}
                                                onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                                                placeholder="0"
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label>Max Salary</Label>
                                            <Input
                                                type="number"
                                                value={formData.salary_max}
                                                onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                                                placeholder="0"
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Contact Email</Label>
                                            <Input
                                                type="email"
                                                value={formData.contact_email}
                                                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                                placeholder="hr@company.com"
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label>External URL</Label>
                                            <Input
                                                type="url"
                                                value={formData.external_url}
                                                onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                                                placeholder="https://..."
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Requirements</Label>
                                        <Textarea
                                            value={formData.requirements}
                                            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                            placeholder="Job requirements..."
                                            className="mt-1"
                                            rows={3}
                                        />
                                    </div>
                                    <div>
                                        <Label>Benefits</Label>
                                        <Textarea
                                            value={formData.benefits}
                                            onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                                            placeholder="Job benefits..."
                                            className="mt-1"
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Event-specific fields */}
                            {formData.content_type === 'event' && (
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                                    <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <Calendar className="h-4 w-4" /> Event Details
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Event Date</Label>
                                            <Input
                                                type="datetime-local"
                                                value={formData.start_date}
                                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label>Location</Label>
                                            <Input
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                placeholder="Event venue"
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Priority</Label>
                                        <select
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                            className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
                                        >
                                            <option value="low">Low</option>
                                            <option value="normal">Normal</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Button type="button" variant="outline" onClick={() => { setShowEditModal(false); resetForm(); }} disabled={submitting}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-maroon-600 hover:bg-maroon-700 text-white" disabled={submitting}>
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Content Modal */}
            {showViewModal && selectedContent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${typeColors[selectedContent.content_type]}`}>
                                    {typeIcons[selectedContent.content_type]}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{selectedContent.title}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedContent.status]}`}>
                                            {selectedContent.status}
                                        </span>
                                        <span className="text-xs text-gray-500">{formatDate(selectedContent.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Media Gallery */}
                            {(() => {
                                const allMedia: { url: string; label: string }[] = [];
                                if (selectedContent.featured_image_url) {
                                    allMedia.push({ url: selectedContent.featured_image_url, label: 'Featured Image' });
                                } else if (selectedContent.featured_image) {
                                    allMedia.push({ url: getStorageUrl(selectedContent.featured_image), label: 'Featured Image' });
                                }
                                if (selectedContent.company_logo_url) {
                                    allMedia.push({ url: selectedContent.company_logo_url, label: 'Company Logo' });
                                }
                                if (selectedContent.gallery_images && selectedContent.gallery_images.length > 0) {
                                    selectedContent.gallery_images.forEach((img, i) => {
                                        allMedia.push({ url: getStorageUrl(img), label: `Gallery ${i + 1}` });
                                    });
                                }
                                if (allMedia.length === 0) return null;
                                return (
                                    <div>
                                        <Label className="text-xs text-gray-500 flex items-center gap-1">
                                            <ImageIcon className="h-3 w-3" />
                                            Media ({allMedia.length})
                                        </Label>
                                        <div className="mt-2">
                                            {/* Hero image - first media large */}
                                            {allMedia.length > 0 && (
                                                <div className="mb-2">
                                                    <img
                                                        src={allMedia[0].url}
                                                        alt={allMedia[0].label}
                                                        className="w-full max-h-64 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                    />
                                                </div>
                                            )}
                                            {/* Additional media as grid */}
                                            {allMedia.length > 1 && (
                                                <div className="grid grid-cols-4 gap-2">
                                                    {allMedia.slice(1).map((media, idx) => (
                                                        <div key={idx} className="relative group">
                                                            <img
                                                                src={media.url}
                                                                alt={media.label}
                                                                className="w-full h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                            />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition-colors flex items-end justify-center">
                                                                <span className="text-[10px] text-white font-medium pb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    {media.label}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            {selectedContent.content && (
                                <div>
                                    <Label className="text-xs text-gray-500">Content</Label>
                                    <div
                                        className="mt-1 prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                                        dangerouslySetInnerHTML={{ __html: selectedContent.content }}
                                    />
                                </div>
                            )}

                            {selectedContent.content_type === 'job' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {selectedContent.company_name && (
                                        <div>
                                            <Label className="text-xs text-gray-500">Company</Label>
                                            <p className="mt-1 font-medium">{selectedContent.company_name}</p>
                                        </div>
                                    )}
                                    {selectedContent.category && (
                                        <div>
                                            <Label className="text-xs text-gray-500">Category</Label>
                                            <p className="mt-1">{selectedContent.category.name}</p>
                                        </div>
                                    )}
                                    {selectedContent.job_type && (
                                        <div>
                                            <Label className="text-xs text-gray-500">Job Type</Label>
                                            <p className="mt-1 capitalize">{selectedContent.job_type.replace('_', ' ')}</p>
                                        </div>
                                    )}
                                    {selectedContent.work_arrangement && (
                                        <div>
                                            <Label className="text-xs text-gray-500">Arrangement</Label>
                                            <p className="mt-1 capitalize">{selectedContent.work_arrangement}</p>
                                        </div>
                                    )}
                                    {selectedContent.location && (
                                        <div>
                                            <Label className="text-xs text-gray-500">Location</Label>
                                            <p className="mt-1">{selectedContent.location}</p>
                                        </div>
                                    )}
                                    {(selectedContent.salary_min || selectedContent.salary_max) && (
                                        <div>
                                            <Label className="text-xs text-gray-500">Salary Range</Label>
                                            <p className="mt-1">
                                                {selectedContent.salary_min && `₱${Number(selectedContent.salary_min).toLocaleString()}`}
                                                {selectedContent.salary_min && selectedContent.salary_max && ' - '}
                                                {selectedContent.salary_max && `₱${Number(selectedContent.salary_max).toLocaleString()}`}
                                            </p>
                                        </div>
                                    )}
                                    {selectedContent.application_deadline && (
                                        <div>
                                            <Label className="text-xs text-gray-500">Deadline</Label>
                                            <p className="mt-1">{formatDate(selectedContent.application_deadline)}</p>
                                        </div>
                                    )}
                                    {selectedContent.external_url && (
                                        <div>
                                            <Label className="text-xs text-gray-500">External URL</Label>
                                            <a href={selectedContent.external_url} target="_blank" rel="noopener noreferrer" className="mt-1 text-maroon-600 hover:underline flex items-center gap-1">
                                                <ExternalLink className="h-3 w-3" /> Link
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedContent.content_type === 'event' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {selectedContent.start_date && (
                                        <div>
                                            <Label className="text-xs text-gray-500">Event Date</Label>
                                            <p className="mt-1">{formatDate(selectedContent.start_date)}</p>
                                        </div>
                                    )}
                                    {selectedContent.location && (
                                        <div>
                                            <Label className="text-xs text-gray-500">Location</Label>
                                            <p className="mt-1">{selectedContent.location}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedContent.content_type === 'announcement' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {selectedContent.target_type && (
                                        <div>
                                            <Label className="text-xs text-gray-500">Target</Label>
                                            <p className="mt-1 capitalize">{selectedContent.target_type}</p>
                                        </div>
                                    )}
                                    {selectedContent.priority && (
                                        <div>
                                            <Label className="text-xs text-gray-500">Priority</Label>
                                            <p className="mt-1 capitalize">{selectedContent.priority}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-4 text-sm text-gray-500 pt-4 border-t border-gray-200 dark:border-gray-700">
                                {selectedContent.reads_count !== undefined && (
                                    <span>{selectedContent.reads_count} reads</span>
                                )}
                                {selectedContent.content_views_count !== undefined && (
                                    <span>{selectedContent.content_views_count} views</span>
                                )}
                                {selectedContent.is_featured && <Badge variant="outline">Featured</Badge>}
                                {selectedContent.show_on_landing && <Badge variant="outline">On Landing</Badge>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedContent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <AlertCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Delete Content</h2>
                                <p className="text-sm text-gray-500">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Are you sure you want to delete <strong>&quot;{selectedContent.title}&quot;</strong>?
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-700 text-white"
                                disabled={submitting}
                            >
                                {submitting ? 'Deleting...' : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AdminBaseLayout>
    );
}
