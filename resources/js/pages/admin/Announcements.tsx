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
import {
    Bell,
    Search,
    Plus,
    Edit,
    Trash2,
    Eye,
    MoreVertical,
    Loader2,
    Send,
    AlertCircle,
    AlertTriangle,
    Info,
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
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Helper function to get CSRF token
const getCsrfToken = (): string => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
};

interface Announcement {
    id: number;
    title: string;
    content: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    target_type: 'all' | 'batch' | 'department';
    target_batch_years?: string[];
    target_department_ids?: number[];
    is_published: boolean;
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
    // Campus context for filtering
    const { selectedCampus } = useCampus();

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [batchYears, setBatchYears] = useState<number[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
        target_type: 'all' as 'all' | 'batch' | 'department',
        target_batch_years: [] as string[],
        target_department_ids: [] as number[],
        publish_now: true,
    });

    const fetchAnnouncements = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
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
    }, [search, statusFilter, selectedCampus?.id]);

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
                priority: announcement.priority,
                target_type: announcement.target_type,
                target_batch_years: announcement.target_batch_years || [],
                target_department_ids: announcement.target_department_ids || [],
                publish_now: announcement.is_published,
            });
        } else {
            setEditingAnnouncement(null);
            setFormData({
                title: '',
                content: '',
                priority: 'normal',
                target_type: 'all',
                target_batch_years: [],
                target_department_ids: [],
                publish_now: true,
            });
        }
        setShowForm(true);
    };

    const saveAnnouncement = async () => {
        setSaving(true);
        try {
            const url = editingAnnouncement
                ? `/api/v1/announcements/admin/${editingAnnouncement.id}`
                : '/api/v1/announcements/admin/create';
            const method = editingAnnouncement ? 'PUT' : 'POST';

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
        if (!confirm(`Are you sure you want to delete "${announcement.title}"?`)) return;

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
                return <Bell className="h-4 w-4 text-gray-500" />;
        }
    };

    const getPriorityBadge = (priority: string) => {
        const variants: { [key: string]: string } = {
            urgent: 'bg-red-100 text-red-800',
            high: 'bg-orange-100 text-orange-800',
            normal: 'bg-blue-100 text-blue-800',
            low: 'bg-gray-100 text-gray-800',
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
                    <Button onClick={() => openForm()}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Announcement
                    </Button>
                </div>

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

                {/* Announcements Table */}
                <Card>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : announcements.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                <Bell className="h-12 w-12 mb-4" />
                                <p>No announcements found</p>
                                <Button variant="link" onClick={() => openForm()}>
                                    Create your first announcement
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Target</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Reads</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {announcements.map((announcement) => (
                                        <TableRow key={announcement.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getPriorityIcon(announcement.priority)}
                                                    <span className="font-medium">{announcement.title}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getPriorityBadge(announcement.priority)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {getTargetLabel(announcement)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={announcement.is_published ? 'default' : 'secondary'}>
                                                    {announcement.is_published ? 'Published' : 'Draft'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="flex items-center gap-1">
                                                    <Eye className="h-4 w-4" />
                                                    {announcement.reads_count || 0}
                                                </span>
                                            </TableCell>
                                            <TableCell>{formatDate(announcement.created_at)}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openForm(announcement)}>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => togglePublish(announcement)}>
                                                            {announcement.is_published ? (
                                                                <>
                                                                    <Clock className="h-4 w-4 mr-2" />
                                                                    Unpublish
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Send className="h-4 w-4 mr-2" />
                                                                    Publish
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => deleteAnnouncement(announcement)}
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
            </div>

            {/* Announcement Form Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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

                        <div>
                            <Label>Content *</Label>
                            <Textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="Write your announcement content..."
                                rows={6}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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

                        <div className="flex items-center gap-2">
                            <Switch
                                checked={formData.publish_now}
                                onCheckedChange={(v) => setFormData({ ...formData, publish_now: v })}
                            />
                            <Label>Publish immediately</Label>
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
        </AdminBaseLayout>
    );
}
