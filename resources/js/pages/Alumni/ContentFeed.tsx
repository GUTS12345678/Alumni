import React, { useEffect, useState, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Layers, Briefcase, Megaphone, Calendar, Search,
    MapPin, Building2, ExternalLink, Clock, Eye, Star,
    Loader2, ChevronLeft, ChevronRight, AlertTriangle, XCircle,
    Newspaper, BookOpen, GraduationCap, FileText
} from 'lucide-react';
import axios from 'axios';

interface ContentItem {
    id: number;
    content_type: 'announcement' | 'job' | 'event' | 'news' | 'blog' | 'scholarship' | 'resource';
    title: string;
    slug: string;
    content: string;
    status: string;
    is_published: boolean;
    is_featured: boolean;
    is_read?: boolean;
    priority?: string;
    company_name?: string;
    company_logo?: string;
    job_type?: string;
    work_arrangement?: string;
    location?: string;
    salary_min?: number;
    salary_max?: number;
    category_id?: number;
    category?: { id: number; name: string };
    target_type?: string;
    contact_email?: string;
    external_url?: string;
    application_deadline?: string;
    requirements?: string;
    benefits?: string;
    start_date?: string;
    featured_image?: string;
    created_at: string;
    published_at?: string;
    created_by?: { id: number; name: string };
    content_views_count?: number;
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
    announcement: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    job: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    event: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    news: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
    blog: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    scholarship: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    resource: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const priorityColors: Record<string, string> = {
    low: 'text-gray-500',
    normal: 'text-blue-600',
    high: 'text-orange-600',
    urgent: 'text-red-600',
};

export default function ContentFeed() {
    const [contents, setContents] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

    const fetchContent = useCallback(async () => {
        try {
            setLoading(true);
            const params: Record<string, string | number> = {
                page: currentPage,
                per_page: 12,
            };
            if (typeFilter) params.type = typeFilter;
            if (searchQuery) params.search = searchQuery;

            const response = await axios.get('/api/v1/content', { params });
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
    }, [currentPage, typeFilter, searchQuery]);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    const markAsRead = async (item: ContentItem) => {
        if (item.is_read) return;
        try {
            await axios.post(`/api/v1/content/${item.id}/read`);
            setContents(prev =>
                prev.map(c => c.id === item.id ? { ...c, is_read: true } : c)
            );
        } catch {
            // silent
        }
    };

    const openContent = (item: ContentItem) => {
        setSelectedContent(item);
        markAsRead(item);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const stripHtml = (html: string) => {
        return html.replace(/<[^>]*>/g, '').substring(0, 200);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(searchInput);
        setCurrentPage(1);
    };

    const resolveImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('/')) return path;
        // Department/appearance images via public asset route; everything else via private file route
        if (path.startsWith('departments/') || path.startsWith('appearance/')) {
            return `/api/v1/assets/${path}`;
        }
        return `/api/v1/files/${path}`;
    };

    const filterButtons = [
        { key: '', label: 'All', icon: <Layers className="h-3 w-3 mr-1" /> },
        { key: 'announcement', label: 'Announcements', icon: <Megaphone className="h-3 w-3 mr-1" /> },
        { key: 'job', label: 'Jobs', icon: <Briefcase className="h-3 w-3 mr-1" /> },
        { key: 'event', label: 'Events', icon: <Calendar className="h-3 w-3 mr-1" /> },
        { key: 'news', label: 'News', icon: <Newspaper className="h-3 w-3 mr-1" /> },
        { key: 'blog', label: 'Blog', icon: <BookOpen className="h-3 w-3 mr-1" /> },
        { key: 'scholarship', label: 'Scholarships', icon: <GraduationCap className="h-3 w-3 mr-1" /> },
        { key: 'resource', label: 'Resources', icon: <FileText className="h-3 w-3 mr-1" /> },
    ];

    return (
        <AlumniBaseLayout title="Content Feed">
            <Head title="Content Feed" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Content Feed
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Stay updated with announcements, job opportunities, and events
                    </p>
                </div>

                {/* Filter + Search */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex gap-2 flex-wrap">
                        {filterButtons.map(btn => (
                            <Button
                                key={btn.key}
                                variant={typeFilter === btn.key ? 'default' : 'outline'}
                                size="sm"
                                className="rounded-full"
                                onClick={() => { setTypeFilter(btn.key); setCurrentPage(1); }}
                            >
                                {btn.icon}
                                {btn.label}
                            </Button>
                        ))}
                    </div>
                    <form onSubmit={handleSearch} className="flex gap-2 flex-1 sm:max-w-xs ml-auto">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </form>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-maroon-600" />
                    </div>
                ) : contents.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                        <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">No content found</p>
                        <p className="text-sm mt-2">Check back later for updates</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {contents.map(item => (
                            <Card
                                key={item.id}
                                className={`cursor-pointer hover:shadow-lg transition-all group ${item.is_featured ? 'ring-2 ring-yellow-400/50' : ''
                                    } ${item.content_type === 'announcement' && !item.is_read ? 'border-l-4 border-l-blue-500' : ''}`}
                                onClick={() => openContent(item)}
                            >
                                {item.featured_image && (
                                    <div className="h-40 overflow-hidden rounded-t-lg">
                                        <img
                                            src={resolveImageUrl(item.featured_image)}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                    </div>
                                )}
                                <CardContent className={item.featured_image ? 'pt-4' : 'pt-6'}>
                                    <div className="flex items-start gap-2 mb-2">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[item.content_type]}`}>
                                            {typeIcons[item.content_type]}
                                            {item.content_type}
                                        </span>
                                        {item.is_featured && (
                                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                                        )}
                                        {item.priority && item.priority !== 'normal' && (
                                            <span className={`text-xs font-medium capitalize ${priorityColors[item.priority]}`}>
                                                {item.priority === 'urgent' && <AlertTriangle className="h-3 w-3 inline mr-0.5" />}
                                                {item.priority}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 group-hover:text-maroon-600 transition-colors">
                                        {item.title}
                                    </h3>

                                    {item.content && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                                            {stripHtml(item.content)}
                                        </p>
                                    )}

                                    {/* Type-specific info */}
                                    {item.content_type === 'job' && (
                                        <div className="flex flex-wrap gap-2 mb-3 text-xs text-gray-500 dark:text-gray-400">
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
                                            {item.job_type && (
                                                <Badge variant="secondary" className="text-xs capitalize">
                                                    {item.job_type.replace('_', ' ')}
                                                </Badge>
                                            )}
                                        </div>
                                    )}

                                    {item.content_type === 'event' && item.start_date && (
                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
                                            <Clock className="h-3 w-3" />
                                            {formatDateTime(item.start_date)}
                                            {item.location && (
                                                <span className="flex items-center gap-1 ml-2">
                                                    <MapPin className="h-3 w-3" />
                                                    {item.location}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-700">
                                        <span>{formatDate(item.published_at || item.created_at)}</span>
                                        <div className="flex items-center gap-2">
                                            {item.content_views_count !== undefined && item.content_views_count > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <Eye className="h-3 w-3" />
                                                    {item.content_views_count}
                                                </span>
                                            )}
                                            {item.created_by && (
                                                <span>by {item.created_by.name}</span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Page {currentPage} of {totalPages} ({totalItems} items)
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage <= 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Detail Modal */}
            {selectedContent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${typeColors[selectedContent.content_type]}`}>
                                    {typeIcons[selectedContent.content_type]}
                                    {selectedContent.content_type}
                                </span>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                                    {selectedContent.title}
                                </h2>
                            </div>
                            <button onClick={() => setSelectedContent(null)} className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Featured image */}
                            {selectedContent.featured_image && (
                                <div className="rounded-lg overflow-hidden">
                                    <img
                                        src={resolveImageUrl(selectedContent.featured_image)}
                                        alt={selectedContent.title}
                                        className="w-full max-h-64 object-cover"
                                    />
                                </div>
                            )}

                            {/* Meta info */}
                            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                                <span>{formatDate(selectedContent.published_at || selectedContent.created_at)}</span>
                                {selectedContent.created_by && (
                                    <span>by {selectedContent.created_by.name}</span>
                                )}
                                {selectedContent.priority && selectedContent.priority !== 'normal' && (
                                    <Badge variant="outline" className={`capitalize ${priorityColors[selectedContent.priority]}`}>
                                        {selectedContent.priority}
                                    </Badge>
                                )}
                                {selectedContent.is_featured && (
                                    <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                                        <Star className="h-3 w-3 mr-1 fill-yellow-500" /> Featured
                                    </Badge>
                                )}
                            </div>

                            {/* Content body - rendered as HTML */}
                            {selectedContent.content && (
                                <div
                                    className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                                    dangerouslySetInnerHTML={{ __html: selectedContent.content }}
                                />
                            )}

                            {/* Job-specific details */}
                            {selectedContent.content_type === 'job' && (
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                        <Briefcase className="h-4 w-4" /> Job Details
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        {selectedContent.company_name && (
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400 block text-xs">Company</span>
                                                <span className="font-medium">{selectedContent.company_name}</span>
                                            </div>
                                        )}
                                        {selectedContent.category && (
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400 block text-xs">Category</span>
                                                <span>{selectedContent.category.name}</span>
                                            </div>
                                        )}
                                        {selectedContent.job_type && (
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400 block text-xs">Type</span>
                                                <span className="capitalize">{selectedContent.job_type.replace('_', ' ')}</span>
                                            </div>
                                        )}
                                        {selectedContent.work_arrangement && (
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400 block text-xs">Arrangement</span>
                                                <span className="capitalize">{selectedContent.work_arrangement}</span>
                                            </div>
                                        )}
                                        {selectedContent.location && (
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400 block text-xs">Location</span>
                                                <span>{selectedContent.location}</span>
                                            </div>
                                        )}
                                        {(selectedContent.salary_min || selectedContent.salary_max) && (
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400 block text-xs">Salary</span>
                                                <span>
                                                    {selectedContent.salary_min && `₱${Number(selectedContent.salary_min).toLocaleString()}`}
                                                    {selectedContent.salary_min && selectedContent.salary_max && ' – '}
                                                    {selectedContent.salary_max && `₱${Number(selectedContent.salary_max).toLocaleString()}`}
                                                </span>
                                            </div>
                                        )}
                                        {selectedContent.application_deadline && (
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400 block text-xs">Deadline</span>
                                                <span>{formatDate(selectedContent.application_deadline)}</span>
                                            </div>
                                        )}
                                    </div>
                                    {selectedContent.requirements && (
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400 block text-xs mb-1">Requirements</span>
                                            <p className="text-sm whitespace-pre-wrap">{selectedContent.requirements}</p>
                                        </div>
                                    )}
                                    {selectedContent.benefits && (
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400 block text-xs mb-1">Benefits</span>
                                            <p className="text-sm whitespace-pre-wrap">{selectedContent.benefits}</p>
                                        </div>
                                    )}
                                    <div className="flex gap-2 pt-2">
                                        {selectedContent.external_url && (
                                            <a
                                                href={selectedContent.external_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-sm text-maroon-600 hover:underline"
                                            >
                                                <ExternalLink className="h-3 w-3" /> Apply / View
                                            </a>
                                        )}
                                        {selectedContent.contact_email && (
                                            <a
                                                href={`mailto:${selectedContent.contact_email}`}
                                                className="inline-flex items-center gap-1 text-sm text-maroon-600 hover:underline"
                                            >
                                                Contact
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Event-specific details */}
                            {selectedContent.content_type === 'event' && (
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                        <Calendar className="h-4 w-4" /> Event Details
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        {selectedContent.start_date && (
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400 block text-xs">Date & Time</span>
                                                <span>{formatDateTime(selectedContent.start_date)}</span>
                                            </div>
                                        )}
                                        {selectedContent.location && (
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400 block text-xs">Location</span>
                                                <span>{selectedContent.location}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                            <Button variant="outline" className="w-full" onClick={() => setSelectedContent(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AlumniBaseLayout>
    );
}
