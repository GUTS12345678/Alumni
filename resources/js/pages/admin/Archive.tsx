import React, { useState, useEffect, useCallback } from 'react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import {
    Archive, RotateCcw, Trash2, Search, ChevronLeft, ChevronRight,
    CheckSquare, Square, Users, FileText, ClipboardList, GraduationCap, Building, BookOpen,
    Briefcase, MessageCircle, History, AlertTriangle, X, ArrowUpDown
} from 'lucide-react';
import axios from 'axios';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface ArchiveItem {
    id: number;
    type: string;
    type_label: string;
    title: string;
    subtitle: string;
    meta: string;
    deleted_at: string;
    deleted_ago: string;
    created_at: string | null;
    campus: string | null;
}

interface ArchiveMeta {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

interface TypeCount {
    label: string;
    count: number;
}

const typeIcons: Record<string, React.ElementType> = {
    users: Users,
    announcements: FileText,
    surveys: ClipboardList,
    batches: GraduationCap,
    departments: Building,
    courses: BookOpen,
    job_postings: Briefcase,
    messages: MessageCircle,
    career_history: History,
    alumni_profiles: GraduationCap,
};

const typeColors: Record<string, string> = {
    users: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    announcements: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    surveys: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    batches: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    departments: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    courses: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    job_postings: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    messages: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    career_history: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    alumni_profiles: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
};

export default function ArchivePage({ user }: { user: { id: number; email: string; role: string; status: string;[key: string]: unknown } }) {
    const [items, setItems] = useState<ArchiveItem[]>([]);
    const { confirm, confirmState, handleConfirm, handleCancel } = useConfirmDialog();
    const [meta, setMeta] = useState<ArchiveMeta>({ total: 0, per_page: 20, current_page: 1, last_page: 1 });
    const [counts, setCounts] = useState<Record<string, TypeCount>>({});
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState('all');
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('deleted_at');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState<{ type: string; id: number; title: string } | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchArchive = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const response = await axios.get('/api/v1/admin/archive', {
                params: {
                    type: selectedType,
                    search,
                    sort_by: sortBy,
                    sort_dir: sortDir,
                    page,
                    per_page: 20,
                },
            });
            setItems(response.data.data);
            setMeta(response.data.meta);
            setCounts(response.data.counts);
        } catch (error) {
            console.error('Failed to fetch archive:', error);
            showToast('Failed to load archive data', 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedType, search, sortBy, sortDir]);

    useEffect(() => {
        const timer = setTimeout(() => fetchArchive(1), 300);
        return () => clearTimeout(timer);
    }, [fetchArchive]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleRestore = async (type: string, id: number) => {
        setActionLoading(`restore-${type}-${id}`);
        try {
            await axios.post(`/api/v1/admin/archive/${type}/${id}/restore`);
            showToast('Item restored successfully', 'success');
            setSelectedItems(prev => {
                const next = new Set(prev);
                next.delete(`${type}-${id}`);
                return next;
            });
            fetchArchive(meta.current_page);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            showToast(err.response?.data?.message || 'Failed to restore item', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleForceDelete = async (type: string, id: number) => {
        setActionLoading(`delete-${type}-${id}`);
        try {
            await axios.delete(`/api/v1/admin/archive/${type}/${id}`);
            showToast('Item permanently deleted', 'success');
            setSelectedItems(prev => {
                const next = new Set(prev);
                next.delete(`${type}-${id}`);
                return next;
            });
            setShowConfirmDelete(null);
            fetchArchive(meta.current_page);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            showToast(err.response?.data?.message || 'Failed to delete item', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleBulkRestore = async () => {
        if (selectedItems.size === 0) return;
        setActionLoading('bulk-restore');
        try {
            const itemsArr = Array.from(selectedItems).map(key => {
                const [type, id] = key.split('-');
                return { type, id: parseInt(id) };
            });
            await axios.post('/api/v1/admin/archive/bulk-restore', { items: itemsArr });
            showToast(`${itemsArr.length} item(s) restored`, 'success');
            setSelectedItems(new Set());
            fetchArchive(1);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            showToast(err.response?.data?.message || 'Bulk restore failed', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedItems.size === 0) return;
        const ok = await confirm({ title: 'Delete Permanently', message: `Permanently delete ${selectedItems.size} item(s)? This cannot be undone.`, variant: 'destructive', confirmLabel: 'Delete' });
        if (!ok) return;
        setActionLoading('bulk-delete');
        try {
            const itemsArr = Array.from(selectedItems).map(key => {
                const [type, id] = key.split('-');
                return { type, id: parseInt(id) };
            });
            await axios.post('/api/v1/admin/archive/bulk-delete', { items: itemsArr });
            showToast(`${itemsArr.length} item(s) permanently deleted`, 'success');
            setSelectedItems(new Set());
            fetchArchive(1);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            showToast(err.response?.data?.message || 'Bulk delete failed', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleClearAll = async () => {
        const ok = await confirm({
            title: 'Clear All Archive',
            message: `Permanently delete all ${totalArchived} archived item(s) across all categories? This action is irreversible.`,
            variant: 'destructive',
            confirmLabel: 'Delete All',
        });
        if (!ok) return;
        setActionLoading('clear-all');
        try {
            await axios.delete('/api/v1/admin/archive/clear-all');
            showToast(`All archived items permanently deleted`, 'success');
            setSelectedItems(new Set());
            fetchArchive(1);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            showToast(err.response?.data?.message || 'Failed to clear archive', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const toggleSelect = (type: string, id: number) => {
        const key = `${type}-${id}`;
        setSelectedItems(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedItems.size === items.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(items.map(i => `${i.type}-${i.id}`)));
        }
    };

    const toggleSort = (field: string) => {
        if (sortBy === field) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortDir('desc');
        }
    };

    const totalArchived = Object.values(counts).reduce((sum, c) => sum + c.count, 0);

    return (
        <AdminBaseLayout title="Archive" user={user}>
            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                {/* Toast */}
                {toast && (
                    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white transition-all ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                        <span className="text-sm font-medium">{toast.message}</span>
                        <button onClick={() => setToast(null)} className="hover:opacity-75"><X className="w-4 h-4" /></button>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-maroon-800 dark:text-gray-200 flex items-center gap-2">
                            <Archive className="w-7 h-7" />
                            Archive
                        </h1>
                        <p className="text-maroon-600 dark:text-gray-400 mt-1">
                            {totalArchived} archived item{totalArchived !== 1 ? 's' : ''} across {Object.keys(counts).length} categories
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {totalArchived > 0 && (
                            <button
                                onClick={handleClearAll}
                                disabled={actionLoading === 'clear-all'}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                <Trash2 className="w-4 h-4" />
                                {actionLoading === 'clear-all' ? 'Clearing...' : `Clear All (${totalArchived})`}
                            </button>
                        )}
                        <button
                            onClick={() => fetchArchive(meta.current_page)}
                            className="px-3 py-2 text-sm border border-beige-300 dark:border-gray-600 rounded-lg text-maroon-700 dark:text-gray-300 hover:bg-maroon-50 dark:hover:bg-maroon-800/30 transition-colors"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Type Filter Tabs */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedType('all')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedType === 'all'
                            ? 'bg-maroon-600 text-white'
                            : 'bg-white dark:bg-gray-800 border border-beige-200 dark:border-gray-700 text-maroon-700 dark:text-gray-300 hover:bg-maroon-50 dark:hover:bg-gray-700'
                            }`}
                    >
                        All ({totalArchived})
                    </button>
                    {Object.entries(counts).map(([type, info]) => {
                        if (info.count === 0) return null;
                        const Icon = typeIcons[type] || Archive;
                        return (
                            <button
                                key={type}
                                onClick={() => setSelectedType(type)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${selectedType === type
                                    ? 'bg-maroon-600 text-white'
                                    : 'bg-white dark:bg-gray-800 border border-beige-200 dark:border-gray-700 text-maroon-700 dark:text-gray-300 hover:bg-maroon-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {info.label} ({info.count})
                            </button>
                        );
                    })}
                </div>

                {/* Search & Sort Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search archived items..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-beige-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-maroon-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-maroon-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => toggleSort('deleted_at')}
                            className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg border transition-colors ${sortBy === 'deleted_at'
                                ? 'bg-maroon-50 dark:bg-maroon-900/30 border-maroon-300 dark:border-maroon-700 text-maroon-700 dark:text-maroon-400'
                                : 'border-beige-200 dark:border-gray-700 text-maroon-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            Date {sortBy === 'deleted_at' && (sortDir === 'desc' ? '↓' : '↑')}
                        </button>
                        <button
                            onClick={() => toggleSort('title')}
                            className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg border transition-colors ${sortBy === 'title'
                                ? 'bg-maroon-50 dark:bg-maroon-900/30 border-maroon-300 dark:border-maroon-700 text-maroon-700 dark:text-maroon-400'
                                : 'border-beige-200 dark:border-gray-700 text-maroon-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            Name {sortBy === 'title' && (sortDir === 'desc' ? '↓' : '↑')}
                        </button>
                        <button
                            onClick={() => toggleSort('type')}
                            className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg border transition-colors ${sortBy === 'type'
                                ? 'bg-maroon-50 dark:bg-maroon-900/30 border-maroon-300 dark:border-maroon-700 text-maroon-700 dark:text-maroon-400'
                                : 'border-beige-200 dark:border-gray-700 text-maroon-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            Type {sortBy === 'type' && (sortDir === 'desc' ? '↓' : '↑')}
                        </button>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedItems.size > 0 && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-maroon-50 dark:bg-maroon-900/30 border border-maroon-200 dark:border-maroon-800 rounded-lg">
                        <span className="text-sm font-medium text-maroon-800 dark:text-gray-200">
                            {selectedItems.size} selected
                        </span>
                        <button
                            onClick={handleBulkRestore}
                            disabled={actionLoading === 'bulk-restore'}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Restore All
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            disabled={actionLoading === 'bulk-delete'}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete All
                        </button>
                        <button
                            onClick={() => setSelectedItems(new Set())}
                            className="text-sm text-maroon-600 dark:text-gray-400 hover:underline ml-auto"
                        >
                            Clear selection
                        </button>
                    </div>
                )}

                {/* Items List */}
                <div className="bg-white dark:bg-gray-800 border border-beige-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maroon-600 dark:border-maroon-400" />
                            <span className="ml-3 text-maroon-600 dark:text-gray-400">Loading archive...</span>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Archive className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                            <h3 className="text-lg font-semibold text-maroon-800 dark:text-gray-200">No archived items</h3>
                            <p className="text-maroon-600 dark:text-gray-400 mt-1 max-w-md">
                                {search
                                    ? `No results found for "${search}". Try a different search term.`
                                    : 'Items that are deleted will appear here. You can restore or permanently delete them.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Table Header */}
                            <div className="hidden md:grid grid-cols-[40px_1fr_150px_150px_140px] gap-3 px-4 py-3 bg-beige-50 dark:bg-gray-800/50 border-b border-beige-200 dark:border-gray-700 text-xs font-semibold text-maroon-700 dark:text-gray-300 uppercase tracking-wider">
                                <div className="flex items-center">
                                    <button onClick={toggleSelectAll} className="p-0.5">
                                        {selectedItems.size === items.length
                                            ? <CheckSquare className="w-4 h-4 text-maroon-600 dark:text-maroon-400" />
                                            : <Square className="w-4 h-4 text-gray-400" />}
                                    </button>
                                </div>
                                <div>Item</div>
                                <div>Type</div>
                                <div>Deleted</div>
                                <div className="text-right">Actions</div>
                            </div>

                            {/* Items */}
                            {items.map((item) => {
                                const key = `${item.type}-${item.id}`;
                                const isSelected = selectedItems.has(key);
                                const Icon = typeIcons[item.type] || Archive;
                                const colorClass = typeColors[item.type] || typeColors.career_history;

                                return (
                                    <div
                                        key={key}
                                        className={`grid grid-cols-1 md:grid-cols-[40px_1fr_150px_150px_140px] gap-2 md:gap-3 px-4 py-3 border-b border-beige-100 dark:border-gray-700/50 hover:bg-beige-50 dark:hover:bg-gray-700/50 transition-colors ${isSelected ? 'bg-maroon-50/50 dark:bg-maroon-900/20' : ''}`}
                                    >
                                        {/* Checkbox */}
                                        <div className="hidden md:flex items-center">
                                            <button onClick={() => toggleSelect(item.type, item.id)} className="p-0.5">
                                                {isSelected
                                                    ? <CheckSquare className="w-4 h-4 text-maroon-600 dark:text-maroon-400" />
                                                    : <Square className="w-4 h-4 text-gray-400" />}
                                            </button>
                                        </div>

                                        {/* Item Info */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            <button
                                                onClick={() => toggleSelect(item.type, item.id)}
                                                className="md:hidden p-0.5 flex-shrink-0"
                                            >
                                                {isSelected
                                                    ? <CheckSquare className="w-4 h-4 text-maroon-600 dark:text-maroon-400" />
                                                    : <Square className="w-4 h-4 text-gray-400" />}
                                            </button>
                                            <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${colorClass}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-medium text-maroon-800 dark:text-gray-200 truncate">{item.title}</div>
                                                {item.subtitle && (
                                                    <div className="text-xs text-maroon-500 dark:text-gray-400 truncate">{item.subtitle}</div>
                                                )}
                                                {item.campus && (
                                                    <div className="text-xs text-maroon-400 dark:text-gray-500">{item.campus}</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Type Badge - shown inline on mobile */}
                                        <div className="flex items-center md:justify-start pl-12 md:pl-0">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
                                                <Icon className="w-3 h-3 md:hidden" />
                                                {item.type_label}
                                            </span>
                                        </div>

                                        {/* Deleted date */}
                                        <div className="flex items-center text-sm text-maroon-500 dark:text-gray-400 pl-12 md:pl-0">
                                            {item.deleted_ago}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center justify-end gap-1 pl-12 md:pl-0">
                                            <button
                                                onClick={() => handleRestore(item.type, item.id)}
                                                disabled={actionLoading === `restore-${item.type}-${item.id}`}
                                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg transition-colors disabled:opacity-50"
                                                title="Restore"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5" />
                                                <span className="hidden sm:inline">Restore</span>
                                            </button>
                                            <button
                                                onClick={() => setShowConfirmDelete({ type: item.type, id: item.id, title: item.title })}
                                                disabled={actionLoading === `delete-${item.type}-${item.id}`}
                                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors disabled:opacity-50"
                                                title="Delete permanently"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span className="hidden sm:inline">Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>

                {/* Pagination */}
                {meta.last_page > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
                        <span className="text-sm text-maroon-600 dark:text-gray-400">
                            Showing {(meta.current_page - 1) * meta.per_page + 1}-{Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchArchive(meta.current_page - 1)}
                                disabled={meta.current_page <= 1}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-beige-200 dark:border-gray-600 rounded-lg text-maroon-700 dark:text-gray-300 hover:bg-maroon-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </button>
                            <span className="px-3 py-1.5 text-sm font-medium text-maroon-800 dark:text-gray-200 bg-maroon-50 dark:bg-maroon-900/30 rounded-lg">
                                {meta.current_page} / {meta.last_page}
                            </span>
                            <button
                                onClick={() => fetchArchive(meta.current_page + 1)}
                                disabled={meta.current_page >= meta.last_page}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-beige-200 dark:border-gray-600 rounded-lg text-maroon-700 dark:text-gray-300 hover:bg-maroon-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Confirm Delete Modal */}
                {showConfirmDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowConfirmDelete(null)}>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-maroon-800 dark:text-gray-200">Permanent Delete</h3>
                                    <p className="text-sm text-maroon-600 dark:text-gray-400">This cannot be undone</p>
                                </div>
                            </div>
                            <p className="text-sm text-maroon-700 dark:text-gray-300 mb-6">
                                Are you sure you want to permanently delete <strong>"{showConfirmDelete.title}"</strong>? This action is irreversible.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowConfirmDelete(null)}
                                    className="px-4 py-2 text-sm border border-beige-200 dark:border-gray-600 rounded-lg text-maroon-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleForceDelete(showConfirmDelete.type, showConfirmDelete.id)}
                                    disabled={actionLoading === `delete-${showConfirmDelete.type}-${showConfirmDelete.id}`}
                                    className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {actionLoading ? 'Deleting...' : 'Delete Permanently'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <ConfirmDialog open={confirmState.open} title={confirmState.title} message={confirmState.message} confirmLabel={confirmState.confirmLabel} cancelLabel={confirmState.cancelLabel} variant={confirmState.variant} onConfirm={handleConfirm} onCancel={handleCancel} />
        </AdminBaseLayout>
    );
}
