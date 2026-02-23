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
import {
    Layout,
    Search,
    Plus,
    Edit,
    Trash2,
    Eye,
    Loader2,
    ImageIcon,
    Video,
    FileText,
    Grid3x3,
    BarChart3,
    Star,
    Box,
    ChevronUp,
    ChevronDown,
    Globe,
    RefreshCw,
    Upload,
    X,
    Images,
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
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ContentPage } from '@/components/ui/page-carousel';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';

// Helper function to get CSRF token
const getCsrfToken = (): string => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
};

interface LandingContent {
    id: number;
    title: string;
    description?: string;
    content_type: 'hero' | 'video' | 'image' | 'text' | 'carousel' | 'stats' | 'testimonial' | 'feature' | 'custom';
    media_url?: string;
    media_file?: string;
    media_file_url?: string;
    thumbnail?: string;
    thumbnail_url?: string;
    gallery_images?: string[];
    content?: string;
    pages?: ContentPage[];
    use_pages?: boolean;
    metadata?: Record<string, unknown>;
    display_order: number;
    is_active: boolean;
    layout: 'full_width' | 'contained' | 'two_column' | 'three_column' | 'grid';
    background_color?: string;
    text_color?: string;
    section_id?: string;
    campus_id?: number;
    is_multi_campus: boolean;
    is_published: boolean;
    published_at?: string;
    expires_at?: string;
    created_by?: number;
    updated_by?: number;
    created_at: string;
    updated_at: string;
    campus?: {
        id: number;
        name: string;
    };
    created_by_user?: {
        id: number;
        name: string;
    };
}

interface Statistics {
    total_contents: number;
    published_contents: number;
    active_contents: number;
    by_type: Record<string, number>;
}

export default function LandingContentManagement() {
    const { toast } = useToast();
    const { selectedCampus } = useCampus();
    const { confirm, confirmState, handleConfirm, handleCancel } = useConfirmDialog();

    const [contents, setContents] = useState<LandingContent[]>([]);
    const [statistics, setStatistics] = useState<Statistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingContent, setEditingContent] = useState<LandingContent | null>(null);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        content_type: 'custom' as LandingContent['content_type'],
        media_url: '',
        media_file: '',
        thumbnail: '',
        gallery_images: [] as string[],
        content: '',
        pages: [] as ContentPage[],
        use_pages: false,
        metadata: {},
        display_order: 0,
        is_active: true,
        layout: 'contained' as LandingContent['layout'],
        background_color: '',
        text_color: '',
        section_id: '',
        is_multi_campus: true,
        is_published: false,
    });
    const [uploadingField, setUploadingField] = useState<string | null>(null);

    const handleFileUpload = async (file: File, field: 'media_file' | 'thumbnail') => {
        setUploadingField(field);
        try {
            const uploadData = new FormData();
            uploadData.append('file', file);
            uploadData.append('type', field === 'thumbnail' ? 'image' : 'image');
            const response = await fetch('/api/v1/content/admin/upload-media', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
                body: uploadData,
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setFormData((prev) => ({ ...prev, [field]: data.path }));
                }
            } else {
                alert('Failed to upload file. Please try again.');
            }
        } catch (error) {
            console.error(`Error uploading ${field}:`, error);
            alert('Failed to upload file.');
        } finally {
            setUploadingField(null);
        }
    };

    const handleGalleryUpload = async (files: FileList) => {
        setUploadingField('gallery');
        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                const uploadData = new FormData();
                uploadData.append('file', file);
                uploadData.append('type', 'image');
                const res = await fetch('/api/v1/content/admin/upload-media', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': getCsrfToken(),
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'include',
                    body: uploadData,
                });
                if (res.ok) {
                    const data = await res.json();
                    return data.success ? data.path : null;
                }
                return null;
            });
            const paths = (await Promise.all(uploadPromises)).filter(Boolean) as string[];
            setFormData((prev) => ({ ...prev, gallery_images: [...prev.gallery_images, ...paths] }));
        } catch (error) {
            console.error('Error uploading gallery images:', error);
            alert('Failed to upload some images.');
        } finally {
            setUploadingField(null);
        }
    };

    const getStorageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('/')) return path;
        // Content media via private file route (auth required)
        return `/api/v1/files/${path}`;
    };

    const fetchContents = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (debouncedSearch) params.append('search', debouncedSearch);
            if (typeFilter) params.append('content_type', typeFilter);
            if (statusFilter) params.append('is_published', statusFilter);
            if (selectedCampus?.id) params.append('campus_id', selectedCampus.id.toString());

            const response = await fetch(`/api/v1/admin/landing-content?${params.toString()}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setContents(data.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch landing content:', error);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, typeFilter, statusFilter, selectedCampus?.id]);

    const fetchStatistics = async () => {
        try {
            const response = await fetch('/api/v1/admin/landing-content/statistics', {
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

    useEffect(() => {
        fetchContents();
        fetchStatistics();
    }, [fetchContents]);

    const openForm = (content?: LandingContent) => {
        if (content) {
            setEditingContent(content);
            setFormData({
                title: content.title,
                description: content.description || '',
                content_type: content.content_type,
                media_url: content.media_url || '',
                media_file: content.media_file || '',
                thumbnail: content.thumbnail || '',
                gallery_images: content.gallery_images || [],
                content: content.content || '',
                pages: content.pages || [],
                use_pages: content.use_pages || false,
                metadata: content.metadata || {},
                display_order: content.display_order,
                is_active: content.is_active,
                layout: content.layout,
                background_color: content.background_color || '',
                text_color: content.text_color || '',
                section_id: content.section_id || '',
                is_multi_campus: content.is_multi_campus,
                is_published: content.is_published,
            });
        } else {
            setEditingContent(null);
            setFormData({
                title: '',
                description: '',
                content_type: 'custom',
                media_url: '',
                media_file: '',
                thumbnail: '',
                gallery_images: [],
                content: '',
                pages: [],
                use_pages: false,
                metadata: {},
                display_order: 0,
                is_active: true,
                layout: 'contained',
                background_color: '',
                text_color: '',
                section_id: '',
                is_multi_campus: true,
                is_published: false,
            });
        }
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingContent(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = editingContent
                ? `/api/v1/admin/landing-content/${editingContent.id}`
                : '/api/v1/admin/landing-content';

            const response = await fetch(url, {
                method: editingContent ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast({
                    title: editingContent ? 'Content Updated' : 'Content Created',
                    description: `Landing page content has been ${editingContent ? 'updated' : 'created'} successfully.`,
                });
                closeForm();
                fetchContents();
                fetchStatistics();
            } else {
                const data = await response.json();
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to save content.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to save content:', error);
            toast({
                title: 'Error',
                description: 'Failed to save content. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (content: LandingContent) => {
        const ok = await confirm({ title: 'Delete Content', message: `Are you sure you want to delete "${content.title}"?`, variant: 'destructive', confirmLabel: 'Delete' });
        if (!ok) {
            return;
        }

        try {
            const response = await fetch(`/api/v1/admin/landing-content/${content.id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });

            if (response.ok) {
                toast({
                    title: 'Content Deleted',
                    description: 'Landing page content has been deleted successfully.',
                });
                fetchContents();
                fetchStatistics();
            }
        } catch (error) {
            console.error('Failed to delete content:', error);
        }
    };

    const togglePublish = async (content: LandingContent) => {
        try {
            const response = await fetch(`/api/v1/admin/landing-content/${content.id}/toggle-publish`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });

            if (response.ok) {
                toast({
                    title: content.is_published ? 'Unpublished' : 'Published',
                    description: content.is_published
                        ? 'The content is now hidden from landing page.'
                        : 'The content is now visible on landing page.',
                });
                fetchContents();
                fetchStatistics();
            }
        } catch (error) {
            console.error('Failed to toggle publish:', error);
        }
    };

    const moveContent = async (content: LandingContent, direction: 'up' | 'down') => {
        const currentIndex = contents.findIndex(c => c.id === content.id);
        if ((direction === 'up' && currentIndex === 0) || (direction === 'down' && currentIndex === contents.length - 1)) {
            return;
        }

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        const newContents = [...contents];
        [newContents[currentIndex], newContents[newIndex]] = [newContents[newIndex], newContents[currentIndex]];

        const items = newContents.map((c, idx) => ({
            id: c.id,
            display_order: idx,
        }));

        try {
            const response = await fetch('/api/v1/admin/landing-content/reorder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
                body: JSON.stringify({ items }),
            });

            if (response.ok) {
                setContents(newContents);
                toast({
                    title: 'Order Updated',
                    description: 'Content order has been updated successfully.',
                });
            }
        } catch (error) {
            console.error('Failed to reorder content:', error);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
    };

    const getContentTypeIcon = (type: string) => {
        switch (type) {
            case 'hero':
                return <Star className="h-4 w-4" />;
            case 'video':
                return <Video className="h-4 w-4" />;
            case 'image':
                return <ImageIcon className="h-4 w-4" />;
            case 'text':
                return <FileText className="h-4 w-4" />;
            case 'carousel':
                return <Grid3x3 className="h-4 w-4" />;
            case 'stats':
                return <BarChart3 className="h-4 w-4" />;
            case 'feature':
                return <Layout className="h-4 w-4" />;
            default:
                return <Box className="h-4 w-4" />;
        }
    };

    const getContentTypeBadge = (type: string) => {
        const variants: { [key: string]: string } = {
            hero: 'bg-purple-100 text-purple-800',
            video: 'bg-red-100 text-red-800',
            image: 'bg-blue-100 text-blue-800',
            text: 'bg-gray-100 text-gray-800',
            carousel: 'bg-green-100 text-green-800',
            stats: 'bg-yellow-100 text-yellow-800',
            testimonial: 'bg-pink-100 text-pink-800',
            feature: 'bg-indigo-100 text-indigo-800',
            custom: 'bg-neutral-100 text-neutral-800',
        };

        return (
            <Badge className={cn('flex items-center gap-1', variants[type] || variants.custom)}>
                {getContentTypeIcon(type)}
                {type.charAt(0).toUpperCase() + type.slice(1)}
            </Badge>
        );
    };

    return (
        <AdminBaseLayout title="Landing Content">
            <Head title="Landing Page Content Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Layout className="h-6 w-6" />
                            Landing Page Content
                        </h1>
                        <p className="text-muted-foreground">
                            Manage multimedia content sections for the landing page
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={fetchContents}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                        <Button onClick={() => openForm()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Content
                        </Button>
                    </div>
                </div>

                {/* Statistics */}
                {statistics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-sm text-muted-foreground">Total Content</div>
                                <div className="text-2xl font-bold">{statistics.total_contents}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-sm text-muted-foreground">Published</div>
                                <div className="text-2xl font-bold text-green-600">{statistics.published_contents}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-sm text-muted-foreground">Active</div>
                                <div className="text-2xl font-bold text-blue-600">{statistics.active_contents}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-sm text-muted-foreground">Types</div>
                                <div className="text-2xl font-bold">{Object.keys(statistics.by_type).length}</div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search content..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={typeFilter || 'all'} onValueChange={(v) => setTypeFilter(v === 'all' ? '' : v)}>
                                <SelectTrigger className="w-full md:w-48">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="hero">Hero</SelectItem>
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="image">Image</SelectItem>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="carousel">Carousel</SelectItem>
                                    <SelectItem value="stats">Stats</SelectItem>
                                    <SelectItem value="testimonial">Testimonial</SelectItem>
                                    <SelectItem value="feature">Feature</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
                                <SelectTrigger className="w-full md:w-48">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="true">Published</SelectItem>
                                    <SelectItem value="false">Draft</SelectItem>
                                </SelectContent>
                            </Select>
                        </form>
                    </CardContent>
                </Card>

                {/* Content List */}
                <Card>
                    <CardContent className="pt-6">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : contents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                <Layout className="h-16 w-16 mb-4 text-gray-300" />
                                <h3 className="text-lg font-medium">No content found</h3>
                                <p className="text-sm">Create your first landing page content section to get started</p>
                                <Button variant="link" onClick={() => openForm()} className="mt-2 text-maroon-600">
                                    Add Content
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {contents.map((content, index) => (
                                    <div
                                        key={content.id}
                                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        {/* Reorder buttons */}
                                        <div className="flex flex-col gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => moveContent(content, 'up')}
                                                disabled={index === 0}
                                                className="h-6 w-6 p-0"
                                            >
                                                <ChevronUp className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => moveContent(content, 'down')}
                                                disabled={index === contents.length - 1}
                                                className="h-6 w-6 p-0"
                                            >
                                                <ChevronDown className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {/* Content info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold">{content.title}</h3>
                                                {getContentTypeBadge(content.content_type)}
                                                {content.is_multi_campus && (
                                                    <Badge variant="outline" className="flex items-center gap-1">
                                                        <Globe className="h-3 w-3" />
                                                        Multi-Campus
                                                    </Badge>
                                                )}
                                            </div>
                                            {content.description && (
                                                <p className="text-sm text-muted-foreground">{content.description}</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                                <span>Order: {content.display_order}</span>
                                                <span>•</span>
                                                <span>Layout: {content.layout}</span>
                                                {content.section_id && (
                                                    <>
                                                        <span>•</span>
                                                        <span>ID: #{content.section_id}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Badges */}
                                        <div className="flex items-center gap-2">
                                            {content.is_published ? (
                                                <Badge className="bg-green-100 text-green-800">Published</Badge>
                                            ) : (
                                                <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
                                            )}
                                            {content.is_active ? (
                                                <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                                            ) : (
                                                <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => togglePublish(content)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openForm(content)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(content)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Form Dialog */}
            <Dialog open={showForm} onOpenChange={closeForm}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingContent ? 'Edit Content' : 'Add New Content'}</DialogTitle>
                        <DialogDescription>
                            Create or update landing page content section with multimedia support
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="content_type">Content Type *</Label>
                                    <Select
                                        value={formData.content_type}
                                        onValueChange={(value) => setFormData({ ...formData, content_type: value as LandingContent['content_type'] })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="custom">Custom</SelectItem>
                                            <SelectItem value="hero">Hero Section</SelectItem>
                                            <SelectItem value="video">Video</SelectItem>
                                            <SelectItem value="image">Image</SelectItem>
                                            <SelectItem value="text">Text</SelectItem>
                                            <SelectItem value="carousel">Carousel</SelectItem>
                                            <SelectItem value="stats">Statistics</SelectItem>
                                            <SelectItem value="testimonial">Testimonial</SelectItem>
                                            <SelectItem value="feature">Feature</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="layout">Layout *</Label>
                                    <Select
                                        value={formData.layout}
                                        onValueChange={(value) => setFormData({ ...formData, layout: value as LandingContent['layout'] })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="contained">Contained</SelectItem>
                                            <SelectItem value="full_width">Full Width</SelectItem>
                                            <SelectItem value="two_column">Two Column</SelectItem>
                                            <SelectItem value="three_column">Three Column</SelectItem>
                                            <SelectItem value="grid">Grid</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Media Fields */}
                            <div className="space-y-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4" /> Media
                                </h3>

                                <div>
                                    <Label htmlFor="media_url">Media URL (YouTube, Vimeo, etc.)</Label>
                                    <Input
                                        id="media_url"
                                        type="url"
                                        value={formData.media_url}
                                        onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>

                                {/* Media File Upload */}
                                <div>
                                    <Label>Media File (Image/Video)</Label>
                                    <div className="mt-1">
                                        {formData.media_file ? (
                                            <div className="relative inline-block">
                                                <img
                                                    src={getStorageUrl(formData.media_file)}
                                                    alt="Media"
                                                    className="h-32 w-auto rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                                <div className="hidden h-32 px-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                                                    <span className="text-sm text-gray-500 truncate max-w-[200px]">{formData.media_file}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, media_file: '' })}
                                                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-maroon-400 transition-colors">
                                                {uploadingField === 'media_file' ? (
                                                    <Loader2 className="h-5 w-5 animate-spin text-maroon-600" />
                                                ) : (
                                                    <Upload className="h-5 w-5 text-gray-400" />
                                                )}
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    {uploadingField === 'media_file' ? 'Uploading...' : 'Click to upload media file'}
                                                </span>
                                                <input
                                                    type="file"
                                                    accept="image/*,video/*"
                                                    className="hidden"
                                                    disabled={uploadingField !== null}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleFileUpload(file, 'media_file');
                                                        e.target.value = '';
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* Thumbnail Upload */}
                                <div>
                                    <Label>Thumbnail</Label>
                                    <div className="mt-1">
                                        {formData.thumbnail ? (
                                            <div className="relative inline-block">
                                                <img
                                                    src={getStorageUrl(formData.thumbnail)}
                                                    alt="Thumbnail"
                                                    className="h-24 w-auto rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, thumbnail: '' })}
                                                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-maroon-400 transition-colors">
                                                {uploadingField === 'thumbnail' ? (
                                                    <Loader2 className="h-5 w-5 animate-spin text-maroon-600" />
                                                ) : (
                                                    <Upload className="h-5 w-5 text-gray-400" />
                                                )}
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    {uploadingField === 'thumbnail' ? 'Uploading...' : 'Click to upload thumbnail'}
                                                </span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    disabled={uploadingField !== null}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleFileUpload(file, 'thumbnail');
                                                        e.target.value = '';
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* Gallery Images */}
                                <div>
                                    <Label>Gallery Images</Label>
                                    <div className="mt-1 space-y-2">
                                        {formData.gallery_images.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {formData.gallery_images.map((img, idx) => (
                                                    <div key={idx} className="relative inline-block">
                                                        <img
                                                            src={getStorageUrl(img)}
                                                            alt={`Gallery ${idx + 1}`}
                                                            className="h-20 w-20 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData((prev) => ({
                                                                ...prev,
                                                                gallery_images: prev.gallery_images.filter((_, i) => i !== idx),
                                                            }))}
                                                            className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-maroon-400 transition-colors">
                                            {uploadingField === 'gallery' ? (
                                                <Loader2 className="h-5 w-5 animate-spin text-maroon-600" />
                                            ) : (
                                                <Images className="h-5 w-5 text-gray-400" />
                                            )}
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {uploadingField === 'gallery' ? 'Uploading...' : 'Add gallery images (multiple)'}
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                disabled={uploadingField !== null}
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files.length > 0) handleGalleryUpload(e.target.files);
                                                    e.target.value = '';
                                                }}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div>
                                <Label htmlFor="content">Content (HTML/Rich Text)</Label>
                                <Textarea
                                    id="content"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    rows={6}
                                    placeholder="Enter HTML content..."
                                />
                            </div>

                            {/* Display Settings */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="display_order">Display Order</Label>
                                    <Input
                                        id="display_order"
                                        type="number"
                                        value={formData.display_order}
                                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="section_id">Section ID (for anchors)</Label>
                                    <Input
                                        id="section_id"
                                        value={formData.section_id}
                                        onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                                        placeholder="custom-section"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="background_color">Background Color</Label>
                                    <Input
                                        id="background_color"
                                        value={formData.background_color}
                                        onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                                        placeholder="#ffffff"
                                    />
                                </div>
                            </div>

                            {/* Switches */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="is_published">Published</Label>
                                    <Switch
                                        id="is_published"
                                        checked={formData.is_published}
                                        onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label htmlFor="is_active">Active</Label>
                                    <Switch
                                        id="is_active"
                                        checked={formData.is_active}
                                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label htmlFor="is_multi_campus">Multi-Campus</Label>
                                    <Switch
                                        id="is_multi_campus"
                                        checked={formData.is_multi_campus}
                                        onCheckedChange={(checked) => setFormData({ ...formData, is_multi_campus: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label htmlFor="use_pages">Use Multi-Page Layout</Label>
                                    <Switch
                                        id="use_pages"
                                        checked={formData.use_pages}
                                        onCheckedChange={(checked) => setFormData({ ...formData, use_pages: checked })}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeForm} disabled={saving}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    editingContent ? 'Update Content' : 'Create Content'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <ConfirmDialog open={confirmState.open} title={confirmState.title} message={confirmState.message} confirmLabel={confirmState.confirmLabel} cancelLabel={confirmState.cancelLabel} variant={confirmState.variant} onConfirm={handleConfirm} onCancel={handleCancel} />
        </AdminBaseLayout>
    );
}
