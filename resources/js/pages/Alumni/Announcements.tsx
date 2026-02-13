import React, { useEffect, useState, useCallback } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PageCarousel, ContentPage } from '@/components/ui/page-carousel';
import {
    Bell,
    Search,
    Calendar,
    User,
    ChevronRight,
    ChevronLeft,
    AlertCircle,
    AlertTriangle,
    Info,
    Loader2,
    CheckCircle,
    Circle,
    Megaphone
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
    pages?: ContentPage[];
    use_pages?: boolean;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    target_type: 'all' | 'batch' | 'department';
    is_read: number;
    created_at: string;
    featured_image?: string | null;
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
    const [currentIndex, setCurrentIndex] = useState<number>(0);
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

    const viewAnnouncement = async (announcement: Announcement, index?: number) => {
        setSelectedAnnouncement(announcement);
        if (index !== undefined) {
            setCurrentIndex(index);
        } else {
            const idx = filteredAnnouncements.findIndex(a => a.id === announcement.id);
            setCurrentIndex(idx >= 0 ? idx : 0);
        }

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

    const navigatePrevious = () => {
        if (currentIndex > 0) {
            const prevAnnouncement = filteredAnnouncements[currentIndex - 1];
            viewAnnouncement(prevAnnouncement, currentIndex - 1);
        }
    };

    const navigateNext = () => {
        if (currentIndex < filteredAnnouncements.length - 1) {
            const nextAnnouncement = filteredAnnouncements[currentIndex + 1];
            viewAnnouncement(nextAnnouncement, currentIndex + 1);
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
            urgent: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
            high: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-700',
            normal: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700',
            low: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
        };

        return (
            <Badge className={cn('capitalize', variants[priority] || variants.low)}>
                {priority}
            </Badge>
        );
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'border-red-300 text-red-700 bg-red-50 dark:border-red-700 dark:text-red-300 dark:bg-red-900/30';
            case 'high':
                return 'border-orange-300 text-orange-700 bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:bg-orange-900/30';
            case 'normal':
                return 'border-blue-300 text-blue-700 bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:bg-blue-900/30';
            default:
                return 'border-gray-300 text-gray-700 bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:bg-gray-800';
        }
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
                        <h1 className="text-2xl font-bold flex items-center gap-2 text-maroon-800 dark:text-maroon-200">
                            <Megaphone className="h-6 w-6 text-maroon-600 dark:text-maroon-400" />
                            Announcements
                            {unreadCount > 0 && (
                                <Badge variant="destructive">{unreadCount} new</Badge>
                            )}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Stay updated with the latest news and announcements
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search announcements..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 w-full sm:w-64 dark:bg-gray-800 dark:border-gray-700"
                            />
                        </div>
                        <Select value={filter} onValueChange={(v: 'all' | 'unread') => setFilter(v)}>
                            <SelectTrigger className="w-full sm:w-32 dark:bg-gray-800 dark:border-gray-700">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="unread">Unread</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Announcements Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-maroon-600 dark:text-maroon-400" />
                    </div>
                ) : filteredAnnouncements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-beige-200 dark:border-gray-700">
                        <Megaphone className="h-16 w-16 mb-4 text-gray-300 dark:text-gray-600" />
                        <p className="text-lg font-medium">No announcements</p>
                        <p className="text-sm">
                            {filter === 'unread'
                                ? "You've read all announcements"
                                : 'There are no announcements yet'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {filteredAnnouncements.map((announcement, index) => (
                            <div
                                key={announcement.id}
                                onClick={() => viewAnnouncement(announcement, index)}
                                className={cn(
                                    'group bg-white dark:bg-gray-800 rounded-2xl border overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:-translate-y-1',
                                    !announcement.is_read
                                        ? 'border-maroon-300 dark:border-maroon-600 ring-2 ring-maroon-100 dark:ring-maroon-900'
                                        : 'border-beige-200 dark:border-gray-700'
                                )}
                            >
                                {/* Image or Placeholder */}
                                {announcement.featured_image ? (
                                    <div className="h-48 overflow-hidden">
                                        <img
                                            src={announcement.featured_image}
                                            alt={announcement.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-48 bg-gradient-to-br from-maroon-100 to-maroon-200 dark:from-maroon-900/50 dark:to-maroon-800/30 flex items-center justify-center">
                                        <Megaphone className="w-16 h-16 text-maroon-400 dark:text-maroon-500" />
                                    </div>
                                )}

                                <div className="p-6">
                                    {/* Priority and Date */}
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={cn('text-xs px-2 py-1 rounded-full border', getPriorityColor(announcement.priority))}>
                                            {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {!announcement.is_read && (
                                                <span className="flex items-center text-xs text-maroon-600 dark:text-maroon-400 font-medium">
                                                    <Circle className="h-2 w-2 fill-current mr-1" />
                                                    New
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {formatDate(announcement.created_at).split(',')[0]}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h3 className={cn(
                                        'text-xl text-maroon-900 dark:text-maroon-100 mb-2 group-hover:text-maroon-700 dark:group-hover:text-maroon-300 transition-colors line-clamp-2',
                                        !announcement.is_read ? 'font-bold' : 'font-semibold'
                                    )}>
                                        {announcement.title}
                                    </h3>

                                    {/* Content Preview */}
                                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">
                                        {announcement.content.replace(/<[^>]*>/g, '')}
                                    </p>

                                    {/* Footer */}
                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                            <User className="h-3 w-3 mr-1" />
                                            {announcement.created_by?.name || 'Admin'}
                                        </span>
                                        <span className="flex items-center text-maroon-600 dark:text-maroon-400 text-sm font-medium group-hover:text-maroon-800 dark:group-hover:text-maroon-300">
                                            Read more
                                            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Announcement Detail Dialog */}
            <Dialog open={!!selectedAnnouncement} onOpenChange={() => setSelectedAnnouncement(null)}>
                <DialogContent className="sm:max-w-2xl dark:bg-gray-800 dark:border-gray-700">
                    {selectedAnnouncement && (
                        <>
                            {/* Featured Image in Dialog */}
                            {selectedAnnouncement.featured_image && (
                                <div className="-m-6 mb-4">
                                    <img
                                        src={selectedAnnouncement.featured_image}
                                        alt={selectedAnnouncement.title}
                                        className="w-full h-48 object-cover rounded-t-lg"
                                    />
                                </div>
                            )}
                            <DialogHeader>
                                <div className="flex items-center gap-2 mb-2">
                                    {getPriorityIcon(selectedAnnouncement.priority)}
                                    {getPriorityBadge(selectedAnnouncement.priority)}
                                </div>
                                <DialogTitle className="text-xl text-maroon-800 dark:text-maroon-200">
                                    {selectedAnnouncement.title}
                                </DialogTitle>
                                <DialogDescription>
                                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
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
                            <Separator className="dark:bg-gray-700" />
                            <ScrollArea className="max-h-96">
                                {selectedAnnouncement.use_pages && selectedAnnouncement.pages && selectedAnnouncement.pages.length > 0 ? (
                                    <PageCarousel
                                        pages={selectedAnnouncement.pages}
                                        className="min-h-[200px]"
                                        onPreviousItem={navigatePrevious}
                                        onNextItem={navigateNext}
                                        hasPreviousItem={currentIndex > 0}
                                        hasNextItem={currentIndex < filteredAnnouncements.length - 1}
                                        itemLabel="Announcement"
                                    />
                                ) : (
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                                        <div
                                            className="whitespace-pre-wrap"
                                            dangerouslySetInnerHTML={{ __html: selectedAnnouncement.content }}
                                        />
                                    </div>
                                )}
                            </ScrollArea>
                            <div className="flex items-center justify-between pt-4 border-t border-beige-200 dark:border-gray-700">
                                <Button
                                    variant="outline"
                                    onClick={navigatePrevious}
                                    disabled={currentIndex <= 0}
                                    className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Previous
                                </Button>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {currentIndex + 1} of {filteredAnnouncements.length}
                                    </span>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Read
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={navigateNext}
                                    disabled={currentIndex >= filteredAnnouncements.length - 1}
                                    className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </AlumniBaseLayout>
    );
}
