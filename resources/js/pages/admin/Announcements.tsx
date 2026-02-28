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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MultiPageEditor } from '@/components/ui/multi-page-editor';
import { PageCarousel, ContentPage } from '@/components/ui/page-carousel';
import {
    Bell,
    Search,
    Plus,
    Edit,
    Trash2,
    Eye,
    Loader2,
    Send,
    AlertCircle,
    AlertTriangle,
    Info,
    Clock,
    Calendar,
    Globe,
    Layers,
    Upload,
    ImageIcon,
    XCircle,
    ChevronRight,
    Users,
    Download,
    ChevronDown,
    FileText,
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAdminChannel } from '@/hooks/useAdminChannel';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useExport } from '@/hooks/useExport';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ExportProgressDialog } from '@/components/ExportProgressDialog';
import { ScrollFadeIn } from '@/components/scroll-animations';

// Helper function to get CSRF token
const getCsrfToken = (): string => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
};

interface Announcement {
    id: number;
    title: string;
    content: string;
    pages?: ContentPage[];
    use_pages?: boolean;
    featured_image?: string;
    featured_image_url?: string; // Accessor via /api/v1/files/ route
    priority: 'low' | 'normal' | 'high' | 'urgent';
    target_type: 'all' | 'batch' | 'department';
    target_batch_years?: string[];
    target_department_ids?: number[];
    is_published: boolean;
    show_on_landing: boolean;
    published_at?: string;
    created_at: string;
    created_by: {
        id: number;
        name: string;
    };
    reads_count?: number;
}

interface Department {
    id: number;
    name: string;
}

export default function Announcements() {
    const { toast } = useToast();
    const { confirm, confirmState, handleConfirm, handleCancel } = useConfirmDialog();
    const { exportData, cancelExport, ...exportState } = useExport();
    // Campus context for filtering
    const { selectedCampus } = useCampus();

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [batchYears, setBatchYears] = useState<number[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        pages: [] as ContentPage[],
        use_pages: false,
        featured_image: undefined as string | File | undefined,
        priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
        target_type: 'all' as 'all' | 'batch' | 'department',
        target_batch_years: [] as string[],
        target_department_ids: [] as number[],
        publish_now: true,
        show_on_landing: false,
    });

    const fetchAnnouncements = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (debouncedSearch) params.append('search', debouncedSearch);
            if (statusFilter) params.append('is_published', statusFilter);
            if (selectedCampus?.id) params.append('campus_id', selectedCampus.id.toString());

            const response = await fetch(`/api/v1/announcements/admin/list?${params.toString()}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setAnnouncements(data.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch announcements:', error);
        }
    }, [debouncedSearch, statusFilter, selectedCampus?.id]);

    const fetchBatchYears = async () => {
        try {
            const response = await fetch('/api/v1/announcements/admin/batch-years', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setBatchYears(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch batch years:', error);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await fetch('/api/v1/admin/departments/active', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setDepartments(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch departments:', error);
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
        const params: Record<string, string> = {};
        if (debouncedSearch) params.search = debouncedSearch;
        if (statusFilter) params.is_published = statusFilter;
        if (selectedCampus?.id) params.campus_id = selectedCampus.id.toString();

        exportData({
            url: '/api/v1/announcements/admin/export',
            params,
            filename: 'announcements',
            format,
            onSuccess: (f) => toast({ title: 'Export Successful', description: `Announcements exported as ${f.toUpperCase()}.` }),
            onError: () => toast({ title: 'Export Failed', description: 'Failed to export announcements.', variant: 'destructive' }),
        });
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await Promise.all([
                fetchAnnouncements(),
                fetchBatchYears(),
                fetchDepartments(),
            ]);
            setLoading(false);
        };
        fetchData();
    }, [statusFilter, fetchAnnouncements]);

    // Real-time: refresh when announcements change
    useAdminChannel({
        onContentChange: (data) => {
            if (data.content_type === 'announcement') {
                fetchAnnouncements();
            }
        },
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchAnnouncements();
    };

    const openForm = (announcement?: Announcement) => {
        if (announcement) {
            setEditingAnnouncement(announcement);
            setFormData({
                title: announcement.title,
                content: announcement.content,
                pages: announcement.pages || [],
                use_pages: announcement.use_pages || false,
                featured_image: announcement.featured_image || undefined,
                priority: announcement.priority,
                target_type: announcement.target_type,
                target_batch_years: announcement.target_batch_years || [],
                target_department_ids: announcement.target_department_ids || [],
                publish_now: announcement.is_published,
                show_on_landing: announcement.show_on_landing || false,
            });
        } else {
            setEditingAnnouncement(null);
            setFormData({
                title: '',
                content: '',
                pages: [],
                use_pages: false,
                featured_image: undefined,
                priority: 'normal',
                target_type: 'all',
                target_batch_years: [],
                target_department_ids: [],
                publish_now: true,
                show_on_landing: false,
            });
        }
        setShowForm(true);
    };

    const uploadImage = async (file: File): Promise<string | null> => {
        const uploadData = new FormData();
        uploadData.append('image', file);
        uploadData.append('type', 'announcement');
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

    const saveAnnouncement = async () => {
        setSaving(true);
        try {
            const url = editingAnnouncement
                ? `/api/v1/announcements/admin/${editingAnnouncement.id}`
                : '/api/v1/announcements/admin/create';
            const method = editingAnnouncement ? 'PUT' : 'POST';

            // Build payload, uploading image file if needed
            const payload: Record<string, unknown> = { ...formData };
            if (formData.featured_image instanceof File) {
                const imageUrl = await uploadImage(formData.featured_image);
                payload.featured_image = imageUrl;
            } else if (typeof formData.featured_image === 'string') {
                payload.featured_image = formData.featured_image;
            } else {
                delete payload.featured_image;
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
                    title: editingAnnouncement ? 'Announcement Updated' : 'Announcement Created',
                    description: formData.publish_now
                        ? 'The announcement has been published and sent to recipients.'
                        : 'The announcement has been saved as draft.',
                });
                setShowForm(false);
                fetchAnnouncements();
            } else {
                const error = await response.json();
                toast({
                    title: 'Error',
                    description: error.message || 'Failed to save announcement.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to save announcement:', error);
            toast({
                title: 'Error',
                description: 'An unexpected error occurred.',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const deleteAnnouncement = async (announcement: Announcement) => {
        const ok = await confirm({ title: 'Delete Announcement', message: `Are you sure you want to delete "${announcement.title}"?`, variant: 'destructive', confirmLabel: 'Delete' });
        if (!ok) return;

        try {
            const response = await fetch(`/api/v1/announcements/admin/${announcement.id}`, {
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
                    title: 'Announcement Deleted',
                    description: 'The announcement has been deleted.',
                });
                fetchAnnouncements();
            }
        } catch (error) {
            console.error('Failed to delete announcement:', error);
        }
    };

    const togglePublish = async (announcement: Announcement) => {
        try {
            const response = await fetch(`/api/v1/announcements/admin/${announcement.id}`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'include',
                body: JSON.stringify({ is_published: !announcement.is_published }),
            });

            if (response.ok) {
                toast({
                    title: announcement.is_published ? 'Unpublished' : 'Published',
                    description: announcement.is_published
                        ? 'The announcement is now a draft.'
                        : 'The announcement has been published.',
                });
                fetchAnnouncements();
            }
        } catch (error) {
            console.error('Failed to toggle publish:', error);
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'high':
                return <AlertTriangle className="h-4 w-4 text-orange-500" />;
            case 'normal':
                return <Info className="h-4 w-4 text-blue-500" />;
            default:
                return <Bell className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
        }
    };

    const getPriorityBadge = (priority: string) => {
        const variants: { [key: string]: string } = {
            urgent: 'bg-red-100 text-red-800',
            high: 'bg-orange-100 text-orange-800',
            normal: 'bg-blue-100 text-blue-800',
            low: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
        };
        return (
            <Badge className={cn('capitalize', variants[priority] || variants.low)}>
                {priority}
            </Badge>
        );
    };

    const getTargetLabel = (announcement: Announcement): string => {
        if (announcement.target_type === 'all') return 'All Alumni';
        if (announcement.target_type === 'batch') {
            return `Batch: ${announcement.target_batch_years?.join(', ') || 'N/A'}`;
        }
        if (announcement.target_type === 'department') {
            const deptNames = announcement.target_department_ids?.map(id =>
                departments.find(d => d.id === id)?.name || `Dept ${id}`
            );
            return `Dept: ${deptNames?.join(', ') || 'N/A'}`;
        }
        return 'Unknown';
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleBatchYearToggle = (year: string) => {
        setFormData(prev => ({
            ...prev,
            target_batch_years: prev.target_batch_years.includes(year)
                ? prev.target_batch_years.filter(y => y !== year)
                : [...prev.target_batch_years, year]
        }));
    };

    const handleDepartmentToggle = (deptId: number) => {
        setFormData(prev => ({
            ...prev,
            target_department_ids: prev.target_department_ids.includes(deptId)
                ? prev.target_department_ids.filter(id => id !== deptId)
                : [...prev.target_department_ids, deptId]
        }));
    };

    return (
        <AdminBaseLayout title="Announcements">
            <Head title="Announcements Management" />

            <div className="space-y-6">
                <ScrollFadeIn>
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Bell className="h-6 w-6" />
                                Announcements
                            </h1>
                            <p className="text-muted-foreground">
                                Manage announcements and broadcasts to alumni
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
                            <Button onClick={() => openForm()}>
                                <Plus className="h-4 w-4 mr-2" />
                                New Announcement
                            </Button>
                        </div>
                    </div>
                </ScrollFadeIn>

                <ScrollFadeIn delay={100}>
                    {/* Filters */}
                    <Card>
                        <CardContent className="pt-6">
                            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search announcements..."
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
                                        <SelectItem value="true">Published</SelectItem>
                                        <SelectItem value="false">Draft</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button type="submit">Search</Button>
                            </form>
                        </CardContent>
                    </Card>
                </ScrollFadeIn>

                <ScrollFadeIn delay={100}>
                    {/* Announcements Count */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-maroon-800 dark:text-gray-200">
                            {loading ? 'Loading...' : `${announcements.length} Announcements`}
                        </h2>
                    </div>

                    {/* Announcements Grid */}
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground bg-white dark:bg-gray-800 rounded-2xl border border-beige-200 dark:border-gray-700">
                            <Bell className="h-16 w-16 mb-4 text-gray-300" />
                            <h3 className="text-lg font-medium">No announcements found</h3>
                            <p className="text-sm">Create your first announcement to get started</p>
                            <Button variant="link" onClick={() => openForm()} className="mt-2 text-maroon-600 dark:text-maroon-400">
                                Create announcement
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {announcements.map((announcement) => (
                                <div
                                    key={announcement.id}
                                    onClick={() => setViewingAnnouncement(announcement)}
                                    className="group bg-white dark:bg-gray-800 rounded-2xl border border-beige-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:-translate-y-1 hover:border-maroon-300"
                                >
                                    {/* Image Section */}
                                    {announcement.featured_image_url ? (
                                        <div className="h-48 overflow-hidden relative">
                                            <img
                                                src={announcement.featured_image_url}
                                                alt={announcement.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                            <div className="absolute top-3 left-3">
                                                {getPriorityBadge(announcement.priority)}
                                            </div>
                                            <div className="absolute top-3 right-3">
                                                <Badge variant={announcement.is_published ? 'default' : 'secondary'} className="text-xs">
                                                    {announcement.is_published ? 'Published' : 'Draft'}
                                                </Badge>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-48 bg-gradient-to-br from-maroon-50 to-maroon-100 dark:from-maroon-900/30 dark:to-maroon-800/30 flex items-center justify-center relative">
                                            <Bell className="w-16 h-16 text-maroon-300" />
                                            <div className="absolute top-3 left-3">
                                                {getPriorityBadge(announcement.priority)}
                                            </div>
                                            <div className="absolute top-3 right-3">
                                                <Badge variant={announcement.is_published ? 'default' : 'secondary'} className="text-xs">
                                                    {announcement.is_published ? 'Published' : 'Draft'}
                                                </Badge>
                                            </div>
                                        </div>
                                    )}

                                    {/* Content Section */}
                                    <div className="p-5">
                                        <h3 className="text-lg font-bold text-maroon-900 dark:text-gray-100 mb-1 group-hover:text-maroon-700 dark:group-hover:text-gray-300 transition-colors line-clamp-1">
                                            {announcement.title}
                                        </h3>
                                        <p className="text-maroon-600 dark:text-gray-400 text-sm font-medium mb-2">
                                            By {announcement.created_by?.name || 'Admin'}
                                        </p>

                                        {/* Target & Info */}
                                        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-3">
                                            <Users className="w-4 h-4 mr-1" />
                                            <span className="line-clamp-1">{getTargetLabel(announcement)}</span>
                                        </div>

                                        {/* Content Preview */}
                                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                                            {announcement.content || (announcement.pages?.[0]?.content ? announcement.pages[0].content.replace(/<[^>]*>/g, '') : 'No content')}
                                        </p>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                                <span className="flex items-center">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {formatDate(announcement.created_at).split(',')[0]}
                                                </span>
                                                <span className="flex items-center">
                                                    <Eye className="w-3 h-3 mr-1" />
                                                    {announcement.reads_count || 0}
                                                </span>
                                                {announcement.show_on_landing && (
                                                    <span className="flex items-center">
                                                        <Globe className="w-3 h-3 mr-1" />
                                                        Landing
                                                    </span>
                                                )}
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
                                            onClick={(e) => { e.stopPropagation(); openForm(announcement); }}
                                            className="h-7 text-xs"
                                        >
                                            <Edit className="h-3 w-3 mr-1" /> Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => { e.stopPropagation(); togglePublish(announcement); }}
                                            className="h-7 text-xs"
                                        >
                                            {announcement.is_published ? (
                                                <><Clock className="h-3 w-3 mr-1" /> Unpublish</>
                                            ) : (
                                                <><Send className="h-3 w-3 mr-1" /> Publish</>
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => { e.stopPropagation(); deleteAnnouncement(announcement); }}
                                            className="h-7 text-xs text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-3 w-3 mr-1" /> Delete
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollFadeIn>
            </div>

            {/* Announcement Form Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
                        </DialogTitle>
                        <DialogDescription>
                            Create an announcement to broadcast to alumni
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div>
                            <Label>Title *</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Announcement title"
                            />
                        </div>

                        {/* Featured Image */}
                        <div>
                            <Label>Featured Image</Label>
                            <div className="mt-2">
                                {typeof formData.featured_image === 'string' && formData.featured_image ? (
                                    <div className="relative w-full h-40 border-2 border-beige-300 dark:border-gray-600 rounded-lg overflow-hidden">
                                        <img src={formData.featured_image} alt="Featured" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, featured_image: undefined })}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                        >
                                            <XCircle className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-beige-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-maroon-400 hover:bg-maroon-50 dark:hover:bg-maroon-800/30 transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) setFormData({ ...formData, featured_image: file });
                                            }}
                                        />
                                        {formData.featured_image instanceof File ? (
                                            <div className="flex items-center space-x-2">
                                                <ImageIcon className="h-5 w-5 text-maroon-600 dark:text-gray-400" />
                                                <span className="text-sm text-maroon-700 dark:text-gray-300">{formData.featured_image.name}</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                                <span className="text-sm text-gray-500 dark:text-gray-400">Upload featured image</span>
                                                <span className="text-xs text-gray-400 mt-1">Recommended: 800x400px</span>
                                            </div>
                                        )}
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Content Type Toggle */}
                        <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={formData.use_pages}
                                    onCheckedChange={(v) => setFormData({ ...formData, use_pages: v })}
                                />
                                <Label className="flex items-center gap-2 cursor-pointer">
                                    <Layers className="h-4 w-4" />
                                    Multi-Page Content
                                </Label>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formData.use_pages
                                    ? 'Create multiple pages with images and layouts'
                                    : 'Simple text content'
                                }
                            </span>
                        </div>

                        {/* Content - Single or Multi-Page */}
                        {formData.use_pages ? (
                            <MultiPageEditor
                                pages={formData.pages}
                                onChange={(pages) => setFormData({ ...formData, pages })}
                                onImageUpload={async (file) => {
                                    const formDataUpload = new FormData();
                                    formDataUpload.append('image', file);
                                    formDataUpload.append('type', 'announcement');

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
                                    placeholder="Write your announcement content..."
                                    rows={6}
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label>Priority</Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(v) => setFormData({ ...formData, priority: v as 'low' | 'normal' | 'high' | 'urgent' })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Target Audience</Label>
                                <Select
                                    value={formData.target_type}
                                    onValueChange={(v) => setFormData({
                                        ...formData,
                                        target_type: v as 'all' | 'batch' | 'department',
                                        target_batch_years: [],
                                        target_department_ids: [],
                                    })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Alumni</SelectItem>
                                        <SelectItem value="batch">Specific Batch Years</SelectItem>
                                        <SelectItem value="department">Specific Departments</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {formData.target_type === 'batch' && (
                            <div>
                                <Label className="mb-2 block">Select Batch Years</Label>
                                <ScrollArea className="h-32 border rounded-md p-3">
                                    <div className="flex flex-wrap gap-2">
                                        {batchYears.map((year) => (
                                            <div
                                                key={year}
                                                onClick={() => handleBatchYearToggle(year.toString())}
                                                className={cn(
                                                    "px-3 py-1 rounded-full text-sm cursor-pointer border transition-colors",
                                                    formData.target_batch_years.includes(year.toString())
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "bg-muted hover:bg-muted/80"
                                                )}
                                            >
                                                {year}
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}

                        {formData.target_type === 'department' && (
                            <div>
                                <Label className="mb-2 block">Select Departments</Label>
                                <ScrollArea className="h-32 border rounded-md p-3">
                                    <div className="space-y-2">
                                        {departments.map((dept) => (
                                            <div
                                                key={dept.id}
                                                className="flex items-center gap-2"
                                            >
                                                <Checkbox
                                                    checked={formData.target_department_ids.includes(dept.id)}
                                                    onCheckedChange={() => handleDepartmentToggle(dept.id)}
                                                />
                                                <span className="text-sm">{dept.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}

                        <Separator />

                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={formData.publish_now}
                                    onCheckedChange={(v) => setFormData({ ...formData, publish_now: v })}
                                />
                                <Label>Publish immediately</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={formData.show_on_landing}
                                    onCheckedChange={(v) => setFormData({ ...formData, show_on_landing: v })}
                                />
                                <Label className="flex items-center gap-1">
                                    <Globe className="h-4 w-4" />
                                    Show on Landing Page
                                </Label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowForm(false)}>
                            Cancel
                        </Button>
                        <Button onClick={saveAnnouncement} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {formData.publish_now ? (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Publish
                                </>
                            ) : (
                                'Save as Draft'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Announcement Dialog */}
            <Dialog open={!!viewingAnnouncement} onOpenChange={() => setViewingAnnouncement(null)}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    {viewingAnnouncement && (
                        <>
                            {/* Featured Image Banner */}
                            {viewingAnnouncement.featured_image_url && (
                                <div className="w-full h-48 -mt-6 -mx-6 mb-4 overflow-hidden rounded-t-lg" style={{ width: 'calc(100% + 3rem)' }}>
                                    <img
                                        src={viewingAnnouncement.featured_image_url}
                                        alt={viewingAnnouncement.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <DialogHeader>
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-primary/10 rounded-lg">
                                        {getPriorityIcon(viewingAnnouncement.priority)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <DialogTitle className="text-xl">{viewingAnnouncement.title}</DialogTitle>
                                            {viewingAnnouncement.show_on_landing && (
                                                <Badge variant="outline" className="text-xs">
                                                    <Globe className="h-3 w-3 mr-1" />
                                                    Landing Page
                                                </Badge>
                                            )}
                                        </div>
                                        <DialogDescription className="flex items-center gap-2">
                                            <span>By {viewingAnnouncement.created_by?.name || 'Admin'}</span>
                                        </DialogDescription>
                                    </div>
                                    <div className="flex-shrink-0 flex gap-2">
                                        {getPriorityBadge(viewingAnnouncement.priority)}
                                        <Badge variant={viewingAnnouncement.is_published ? 'default' : 'secondary'}>
                                            {viewingAnnouncement.is_published ? 'Published' : 'Draft'}
                                        </Badge>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="space-y-6 mt-4">
                                {/* Meta Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>Created: {formatDate(viewingAnnouncement.created_at)}</span>
                                    </div>
                                    {viewingAnnouncement.published_at && (
                                        <div className="flex items-center gap-2">
                                            <Send className="h-4 w-4 text-muted-foreground" />
                                            <span>Published: {formatDate(viewingAnnouncement.published_at)}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                        <span>{viewingAnnouncement.reads_count || 0} reads</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">
                                            {getTargetLabel(viewingAnnouncement)}
                                        </Badge>
                                    </div>
                                </div>

                                <Separator />

                                {/* Content */}
                                <div>
                                    <h4 className="font-semibold mb-2">Content</h4>
                                    {viewingAnnouncement.use_pages && viewingAnnouncement.pages && viewingAnnouncement.pages.length > 0 ? (
                                        <div className="bg-muted/50 rounded-lg overflow-hidden">
                                            <PageCarousel
                                                pages={viewingAnnouncement.pages}
                                                className="min-h-[200px]"
                                                showArrows={true}
                                                showIndicators={true}
                                            />
                                        </div>
                                    ) : (
                                        <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                                            <div
                                                className="prose prose-sm max-w-none dark:prose-invert"
                                                dangerouslySetInnerHTML={{ __html: viewingAnnouncement.content }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <DialogFooter className="mt-6">
                                <Button variant="outline" onClick={() => setViewingAnnouncement(null)}>
                                    Close
                                </Button>
                                <Button onClick={() => {
                                    setViewingAnnouncement(null);
                                    openForm(viewingAnnouncement);
                                }}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Announcement
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
            <ConfirmDialog open={confirmState.open} title={confirmState.title} message={confirmState.message} confirmLabel={confirmState.confirmLabel} cancelLabel={confirmState.cancelLabel} variant={confirmState.variant} onConfirm={handleConfirm} onCancel={handleCancel} />
            <ExportProgressDialog {...exportState} onCancel={cancelExport} />
        </AdminBaseLayout>
    );
}
