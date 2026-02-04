import React, { useEffect, useState, useCallback } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Bell,
    BellRing,
    Search,
    Calendar,
    User,
    ChevronRight,
    AlertCircle,
    AlertTriangle,
    Info,
    Loader2,
    CheckCircle,
    Circle
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
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { cn } from '@/lib/utils';
import { PageProps as InertiaPageProps } from '@inertiajs/core';

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
    is_read: number;
    created_at: string;
    created_by: {
        id: number;
        name: string;
    };
}

interface PageProps extends InertiaPageProps {
    auth: {
        user: {
            id: number;
            name: string;
        };
    };
}

export default function Announcements() {
    const { auth } = usePage<PageProps>().props;
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchAnnouncements = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filter === 'unread') {
                params.append('unread_only', 'true');
            }

            const response = await fetch(`/api/v1/announcements?${params.toString()}`, {
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
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchAnnouncements();
        fetchUnreadCount();

        // Set up real-time listener
        if (window.Echo && auth.user) {
            window.Echo.private('announcements.all')
                .listen('.announcement.published', (e: { announcement: Announcement }) => {
                    setAnnouncements(prev => [e.announcement, ...prev]);
                    setUnreadCount(prev => prev + 1);
                });
        }

        return () => {
            if (window.Echo) {
                window.Echo.leave('announcements.all');
            }
        };
    }, [auth.user, fetchAnnouncements]);

    const fetchUnreadCount = async () => {
        try {
            const response = await fetch('/api/v1/announcements/unread-count', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.data.unread_count);
            }
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    const viewAnnouncement = async (announcement: Announcement) => {
        setSelectedAnnouncement(announcement);

        if (!announcement.is_read) {
            try {
                await fetch(`/api/v1/announcements/${announcement.id}/read`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': getCsrfToken(),
                    },
                    credentials: 'include',
                });

                // Update local state
                setAnnouncements(prev =>
                    prev.map(a =>
                        a.id === announcement.id ? { ...a, is_read: 1 } : a
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (error) {
                console.error('Failed to mark as read:', error);
            }
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return <AlertCircle className="h-5 w-5 text-red-500" />;
            case 'high':
                return <AlertTriangle className="h-5 w-5 text-orange-500" />;
            case 'normal':
                return <Info className="h-5 w-5 text-blue-500" />;
            default:
                return <Bell className="h-5 w-5 text-gray-500" />;
        }
    };

    const getPriorityBadge = (priority: string) => {
        const variants: { [key: string]: string } = {
            urgent: 'bg-red-100 text-red-800 border-red-200',
            high: 'bg-orange-100 text-orange-800 border-orange-200',
            normal: 'bg-blue-100 text-blue-800 border-blue-200',
            low: 'bg-gray-100 text-gray-800 border-gray-200',
        };

        return (
            <Badge className={cn('capitalize', variants[priority] || variants.low)}>
                {priority}
            </Badge>
        );
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const filteredAnnouncements = announcements.filter(announcement => {
        if (searchQuery) {
            const search = searchQuery.toLowerCase();
            return (
                announcement.title.toLowerCase().includes(search) ||
                announcement.content.toLowerCase().includes(search)
            );
        }
        return true;
    });

    return (
        <AlumniBaseLayout title="Announcements">
            <Head title="Announcements" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <BellRing className="h-6 w-6" />
                            Announcements
                            {unreadCount > 0 && (
                                <Badge variant="destructive">{unreadCount} new</Badge>
                            )}
                        </h1>
                        <p className="text-muted-foreground">
                            Stay updated with the latest news and announcements
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search announcements..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 w-64"
                            />
                        </div>
                        <Select value={filter} onValueChange={(v: 'all' | 'unread') => setFilter(v)}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="unread">Unread</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Announcements List */}
                <Card>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredAnnouncements.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                <Bell className="h-12 w-12 mb-4" />
                                <p className="text-lg font-medium">No announcements</p>
                                <p className="text-sm">
                                    {filter === 'unread'
                                        ? "You've read all announcements"
                                        : 'There are no announcements yet'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {filteredAnnouncements.map((announcement) => (
                                    <div
                                        key={announcement.id}
                                        onClick={() => viewAnnouncement(announcement)}
                                        className={cn(
                                            'flex items-start gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors',
                                            !announcement.is_read && 'bg-primary/5'
                                        )}
                                    >
                                        <div className="pt-1">
                                            {getPriorityIcon(announcement.priority)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <h3 className={cn(
                                                        'font-medium truncate',
                                                        !announcement.is_read && 'font-semibold'
                                                    )}>
                                                        {announcement.title}
                                                    </h3>
                                                    {!announcement.is_read && (
                                                        <Circle className="h-2 w-2 fill-primary text-primary" />
                                                    )}
                                                </div>
                                                {getPriorityBadge(announcement.priority)}
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                                {announcement.content}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {announcement.created_by?.name || 'Admin'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(announcement.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Announcement Detail Dialog */}
            <Dialog open={!!selectedAnnouncement} onOpenChange={() => setSelectedAnnouncement(null)}>
                <DialogContent className="sm:max-w-2xl">
                    {selectedAnnouncement && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-2 mb-2">
                                    {getPriorityIcon(selectedAnnouncement.priority)}
                                    {getPriorityBadge(selectedAnnouncement.priority)}
                                </div>
                                <DialogTitle className="text-xl">
                                    {selectedAnnouncement.title}
                                </DialogTitle>
                                <DialogDescription>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="flex items-center gap-1">
                                            <User className="h-4 w-4" />
                                            {selectedAnnouncement.created_by?.name || 'Admin'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            {formatDate(selectedAnnouncement.created_at)}
                                        </span>
                                    </div>
                                </DialogDescription>
                            </DialogHeader>
                            <Separator />
                            <ScrollArea className="max-h-96">
                                <div className="prose prose-sm max-w-none">
                                    <p className="whitespace-pre-wrap">
                                        {selectedAnnouncement.content}
                                    </p>
                                </div>
                            </ScrollArea>
                            <div className="flex items-center justify-between pt-4 border-t">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    Read
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedAnnouncement(null)}
                                >
                                    Close
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </AlumniBaseLayout>
    );
}
