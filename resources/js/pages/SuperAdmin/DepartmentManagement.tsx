import React, { useState, useEffect, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import { useCampus } from '@/contexts/CampusContext';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Building,
    Plus,
    Edit,
    Trash2,
    Search,
    Filter,
    CheckCircle,
    RotateCcw,
    AlertCircle,
    BookOpen,
    Users,
    Eye,
    Settings,
    BarChart3,
    ChevronDown,
    RefreshCw,
    Briefcase,
    Activity,
    UserCheck,
    Clock
} from 'lucide-react';

interface Department {
    id: number;
    name: string;
    code: string;
    description: string | null;
    status: 'active' | 'inactive';
    campus_id?: number;
    logo_path?: string | null;
    background_image_path?: string | null;
    primary_color?: string;
    secondary_color?: string;
    courses_count: number;
    alumni_profiles_count: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

interface DepartmentStats {
    total_departments: number;
    active_departments: number;
    inactive_departments: number;
    deleted_departments: number;
    total_courses: number;
    departments_with_alumni: number;
}

interface DepartmentAnalytics {
    department_id: number;
    basic: {
        total_courses: number;
        total_alumni: number;
    };
    employment: {
        total_employed: number;
        employment_rate: number;
        avg_time_to_employment: number | null;
    };
    surveys: {
        total_sent: number;
        total_completed: number;
        response_rate: number;
        last_participation: string | null;
    };
    activity: {
        active_alumni: number;
        active_percentage: number;
        recent_logins_30d: number;
        profile_completion_avg: number;
    };
    growth: {
        new_alumni_6m: number;
        graduation_years: Array<{ year: number; count: number }>;
        total_batches: number;
    };
}

interface PageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            role: 'super_admin' | 'admin' | 'alumni';
            status: string;
        };
    };
}

export default function DepartmentManagement({ auth }: PageProps) {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [stats, setStats] = useState<DepartmentStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [showDeleted, setShowDeleted] = useState(false);

    // Analytics states
    const [expandedAnalytics, setExpandedAnalytics] = useState<number | null>(null);
    const [analyticsData, setAnalyticsData] = useState<Record<number, DepartmentAnalytics>>({});
    const [loadingAnalytics, setLoadingAnalytics] = useState<Record<number, boolean>>({});

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

    // Campus context
    const { campuses, selectedCampus } = useCampus();

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        status: 'active' as 'active' | 'inactive',
        campus_id: '' as string
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    // Helper function to get CSRF token
    const getCsrfToken = () => {
        return document.querySelector('meta[name="csrf-token"')?.getAttribute('content') || '';
    };

    // Helper function to get the correct image URL
    const getImageUrl = (path: string | null | undefined): string | undefined => {
        if (!path) return undefined;
        if (path.startsWith('http') || path.startsWith('/')) return path;
        // Department images are served via the public asset route (no auth required)
        return `/api/v1/assets/${path}`;
    };

    const fetchDepartments = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                all: 'true',
                include_deleted: showDeleted ? 'true' : 'false',
                ...(statusFilter !== 'all' && { status: statusFilter })
            });

            const response = await fetch(`/api/v1/admin/super-admin/departments?${params}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to fetch departments');

            const data = await response.json();
            setDepartments(data.data);
        } catch (error) {
            console.error('Error fetching departments:', error);
            alert('Failed to load departments');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, showDeleted]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await fetch('/api/v1/admin/super-admin/departments/statistics', {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to fetch stats');

            const data = await response.json();
            setStats(data.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }, []);

    useEffect(() => {
        fetchDepartments();
        fetchStats();
    }, [fetchDepartments, fetchStats]);

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFormErrors({});

        try {
            const response = await fetch('/api/v1/admin/super-admin/departments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken()
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    ...formData,
                    campus_id: formData.campus_id ? Number(formData.campus_id) : undefined
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    setFormErrors(data.errors);
                } else {
                    throw new Error(data.message || 'Failed to create department');
                }
                return;
            }

            alert('Department created successfully!');
            setShowCreateModal(false);
            resetForm();
            fetchDepartments();
            fetchStats();
        } catch (error) {
            console.error('Error creating department:', error);
            alert('Failed to create department');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDepartment) return;

        setSubmitting(true);
        setFormErrors({});

        try {
            const response = await fetch(`/api/v1/admin/super-admin/departments/${selectedDepartment.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken()
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    ...formData,
                    campus_id: formData.campus_id ? Number(formData.campus_id) : undefined
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    setFormErrors(data.errors);
                } else {
                    throw new Error(data.message || 'Failed to update department');
                }
                return;
            }

            alert('Department updated successfully!');
            setShowEditModal(false);
            resetForm();
            fetchDepartments();
            fetchStats();
        } catch (error) {
            console.error('Error updating department:', error);
            alert('Failed to update department');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedDepartment) return;

        setSubmitting(true);

        try {
            const response = await fetch(`/api/v1/admin/super-admin/departments/${selectedDepartment.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken()
                },
                credentials: 'same-origin'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete department');
            }

            alert('Department deleted successfully!');
            setShowDeleteModal(false);
            setSelectedDepartment(null);
            fetchDepartments();
            fetchStats();
        } catch (error: unknown) {
            console.error('Error deleting department:', error);
            const message = error instanceof Error ? error.message : 'Failed to delete department';
            alert(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRestore = async (department: Department) => {
        try {
            const response = await fetch(`/api/v1/admin/super-admin/departments/${department.id}/restore`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken()
                },
                credentials: 'same-origin'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to restore department');
            }

            alert('Department restored successfully!');
            fetchDepartments();
            fetchStats();
        } catch (error: unknown) {
            console.error('Error restoring department:', error);
            const message = error instanceof Error ? error.message : 'Failed to restore department';
            alert(message);
        }
    };

    const fetchDepartmentAnalytics = async (departmentId: number) => {
        // Don't fetch if already loaded
        if (analyticsData[departmentId]) return;

        setLoadingAnalytics(prev => ({ ...prev, [departmentId]: true }));

        try {
            const response = await fetch(`/api/v1/admin/departments/${departmentId}/analytics`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to fetch analytics');

            const data = await response.json();

            if (data.success) {
                setAnalyticsData(prev => ({ ...prev, [departmentId]: data.data }));
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
            alert('Failed to load analytics data');
        } finally {
            setLoadingAnalytics(prev => ({ ...prev, [departmentId]: false }));
        }
    };

    const toggleAnalytics = (departmentId: number) => {
        if (expandedAnalytics === departmentId) {
            setExpandedAnalytics(null);
        } else {
            setExpandedAnalytics(departmentId);
            fetchDepartmentAnalytics(departmentId);
        }
    };

    const openCreateModal = () => {
        resetForm();
        // Pre-select the currently selected campus from the header selector
        if (selectedCampus) {
            setFormData(prev => ({ ...prev, campus_id: selectedCampus.id.toString() }));
        } else if (campuses.length > 0) {
            setFormData(prev => ({ ...prev, campus_id: campuses[0].id.toString() }));
        }
        setShowCreateModal(true);
    };

    const openEditModal = (department: Department) => {
        setSelectedDepartment(department);
        setFormData({
            name: department.name,
            code: department.code,
            description: department.description || '',
            status: department.status,
            campus_id: department.campus_id?.toString() || '1'
        });
        setShowEditModal(true);
    };

    const openDeleteModal = (department: Department) => {
        setSelectedDepartment(department);
        setShowDeleteModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            description: '',
            status: 'active',
            campus_id: selectedCampus?.id.toString() || (campuses[0]?.id.toString() || '1')
        });
        setFormErrors({});
        setSelectedDepartment(null);
    };

    const filteredDepartments = departments.filter(dept => {
        const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dept.code.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    return (
        <AdminBaseLayout user={auth.user}>
            <Head title="Department Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Department Management</h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Manage colleges and departments across the institution
                        </p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-4 py-2 bg-maroon-600 text-white rounded-lg hover:bg-maroon-700 transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        Add Department
                    </button>
                </div>

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Departments</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.total_departments}</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <Building className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Departments</p>
                                    <p className="text-2xl font-bold text-green-600 mt-1">{stats.active_departments}</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Courses</p>
                                    <p className="text-2xl font-bold text-purple-600 mt-1">{stats.total_courses}</p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <BookOpen className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Departments with Alumni</p>
                                    <p className="text-2xl font-bold text-maroon-600 mt-1">{stats.departments_with_alumni}</p>
                                </div>
                                <div className="p-3 bg-maroon-100 dark:bg-maroon-800/30 rounded-lg">
                                    <Users className="h-6 w-6 text-maroon-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search departments..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-gray-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        {/* Show Deleted Toggle */}
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showDeleted}
                                onChange={(e) => setShowDeleted(e.target.checked)}
                                className="h-4 w-4 text-maroon-600 rounded focus:ring-maroon-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Show Deleted</span>
                        </label>
                    </div>
                </div>

                {/* Departments Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon-600"></div>
                    </div>
                ) : filteredDepartments.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">No departments found</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Get started by creating your first department</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDepartments.map((department) => (
                            <div
                                key={department.id}
                                className={`bg-white dark:bg-gray-800 rounded-lg border-2 ${department.deleted_at
                                    ? 'border-red-200 bg-red-50'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-maroon-300'
                                    } transition-all duration-200 overflow-hidden group`}
                            >
                                {/* Card Header */}
                                <div className="relative overflow-hidden">
                                    <div
                                        className={`p-6 relative ${department.deleted_at ? 'bg-red-100' : 'text-white'}`}
                                        style={!department.deleted_at ? {
                                            background: department.background_image_path
                                                ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${getImageUrl(department.background_image_path)}) center/cover`
                                                : department.primary_color && department.secondary_color
                                                    ? `linear-gradient(135deg, ${department.primary_color} 0%, ${department.secondary_color} 100%)`
                                                    : department.status === 'active'
                                                        ? 'linear-gradient(to bottom right, #7f1d1d, #991b1b)'
                                                        : '#4b5563'
                                        } : {}}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            {department.logo_path ? (
                                                <img
                                                    src={getImageUrl(department.logo_path)}
                                                    alt={`${department.name} logo`}
                                                    className="h-12 w-12 object-contain bg-white/10 rounded-lg p-1"
                                                />
                                            ) : (
                                                <Building className="h-8 w-8" />
                                            )}
                                            <div className="flex items-center gap-2">
                                                {department.deleted_at ? (
                                                    <span className="px-2 py-1 text-xs font-semibold bg-red-200 text-red-800 rounded">
                                                        Deleted
                                                    </span>
                                                ) : (
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded ${department.status === 'active'
                                                        ? 'bg-green-500 bg-opacity-30 text-white'
                                                        : 'bg-gray-500 bg-opacity-30 text-white'
                                                        }`}>
                                                        {department.status === 'active' ? 'Active' : 'Inactive'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold mb-1 line-clamp-2">{department.name}</h3>
                                        <p className="text-sm opacity-90">{department.code}</p>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-6">
                                    {department.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                            {department.description}
                                        </p>
                                    )}

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <BookOpen className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Courses</p>
                                                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{department.courses_count}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-purple-100 rounded-lg">
                                                <Users className="h-4 w-4 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Alumni</p>
                                                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{department.alumni_profiles_count}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Analytics Toggle Button */}
                                    {!department.deleted_at && (
                                        <div className="flex gap-2 mb-2">
                                            <button
                                                onClick={() => toggleAnalytics(department.id)}
                                                className="flex-1 py-2 text-sm font-medium text-maroon-600 dark:text-gray-400 hover:bg-maroon-50 dark:hover:bg-maroon-800/30 rounded-lg transition-colors flex items-center justify-center gap-2"
                                            >
                                                <BarChart3 className="h-4 w-4" />
                                                <span>View Analytics</span>
                                                <ChevronDown className={`h-4 w-4 transition-transform ${expandedAnalytics === department.id ? 'rotate-180' : ''
                                                    }`} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const link = document.createElement('a');
                                                    link.href = `/api/v1/admin/departments/${department.id}/analytics/export`;
                                                    link.download = `department_analytics_${department.code}_${new Date().toISOString().split('T')[0]}.csv`;
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                }}
                                                className="px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-1"
                                                title="Export Analytics"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}

                                    {/* Analytics Expandable Section */}
                                    <AnimatePresence>
                                        {expandedAnalytics === department.id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden mb-4"
                                            >
                                                {loadingAnalytics[department.id] ? (
                                                    <div className="p-6 flex justify-center">
                                                        <RefreshCw className="h-6 w-6 animate-spin text-maroon-600" />
                                                    </div>
                                                ) : analyticsData[department.id] ? (
                                                    <div className="p-4 space-y-4">
                                                        {/* Employment Stats */}
                                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className="p-2 rounded-lg bg-green-100">
                                                                    <Briefcase className="h-4 w-4 text-green-600" />
                                                                </div>
                                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Employment</h4>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-xs text-gray-600 dark:text-gray-400">Employment Rate</span>
                                                                    <span className="text-sm font-bold text-green-600">
                                                                        {analyticsData[department.id].employment.employment_rate}%
                                                                    </span>
                                                                </div>
                                                                {analyticsData[department.id].employment.avg_time_to_employment && (
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-xs text-gray-600 dark:text-gray-400">Avg. Time to Employment</span>
                                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                            {analyticsData[department.id].employment.avg_time_to_employment} days
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Survey Engagement */}
                                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className="p-2 rounded-lg bg-blue-100">
                                                                    <Activity className="h-4 w-4 text-blue-600" />
                                                                </div>
                                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Survey Engagement</h4>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-xs text-gray-600 dark:text-gray-400">Response Rate</span>
                                                                    <span className="text-sm font-bold text-blue-600">
                                                                        {analyticsData[department.id].surveys.response_rate}%
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-xs text-gray-600 dark:text-gray-400">Completed Surveys</span>
                                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                        {analyticsData[department.id].surveys.total_completed}/{analyticsData[department.id].surveys.total_sent}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Alumni Activity */}
                                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className="p-2 rounded-lg bg-purple-100">
                                                                    <UserCheck className="h-4 w-4 text-purple-600" />
                                                                </div>
                                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Alumni Activity</h4>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-xs text-gray-600 dark:text-gray-400">Active Alumni</span>
                                                                    <span className="text-sm font-bold text-purple-600">
                                                                        {analyticsData[department.id].activity.active_percentage}%
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-xs text-gray-600 dark:text-gray-400">Recent Logins (30d)</span>
                                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                        {analyticsData[department.id].activity.recent_logins_30d}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-xs text-gray-600 dark:text-gray-400">Profile Completion</span>
                                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                        {analyticsData[department.id].activity.profile_completion_avg}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Growth Trends */}
                                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className="p-2 rounded-lg bg-orange-100">
                                                                    <Clock className="h-4 w-4 text-orange-600" />
                                                                </div>
                                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Growth Trends</h4>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-xs text-gray-600 dark:text-gray-400">New Alumni (6 months)</span>
                                                                    <span className="text-sm font-bold text-orange-600">
                                                                        {analyticsData[department.id].growth.new_alumni_6m}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-xs text-gray-600 dark:text-gray-400">Total Batches</span>
                                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                        {analyticsData[department.id].growth.total_batches}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="p-6 text-center text-gray-500 text-sm">
                                                        No analytics data available
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        {department.deleted_at ? (
                                            <button
                                                onClick={() => handleRestore(department)}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                                <span className="text-sm font-medium">Restore</span>
                                            </button>
                                        ) : (
                                            <>
                                                <Link
                                                    href={`/super-admin/departments/${department.id}`}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-maroon-600 text-white rounded-lg hover:bg-maroon-700 transition-colors"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    <span className="text-sm font-medium">View</span>
                                                </Link>
                                                <Link
                                                    href={`/super-admin/department-settings?department=${department.id}`}
                                                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                    title="Department Settings"
                                                >
                                                    <Settings className="h-5 w-5" />
                                                </Link>
                                                <button
                                                    onClick={() => openEditModal(department)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(department)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Add New Department</h2>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Department Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                    placeholder="e.g., College of Engineering"
                                    required
                                />
                                {formErrors.name && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Department Code *
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                    placeholder="e.g., COE"
                                    required
                                />
                                {formErrors.code && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.code}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                    rows={3}
                                    placeholder="Brief description of the department..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Status *
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                    required
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Campus *
                                </label>
                                <select
                                    value={formData.campus_id}
                                    onChange={(e) => setFormData({ ...formData, campus_id: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                    required
                                >
                                    <option value="">Select Campus</option>
                                    {campuses.map((campus) => (
                                        <option key={campus.id} value={campus.id.toString()}>
                                            {campus.display_name || campus.name}
                                        </option>
                                    ))}
                                </select>
                                {formErrors.campus_id && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.campus_id}</p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-maroon-600 text-white rounded-lg hover:bg-maroon-700 transition-colors disabled:opacity-50"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Creating...' : 'Create Department'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedDepartment && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Department</h2>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Department Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                    required
                                />
                                {formErrors.name && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Department Code *
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                    required
                                />
                                {formErrors.code && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.code}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Status *
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                    required
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Campus *
                                </label>
                                <select
                                    value={formData.campus_id}
                                    onChange={(e) => setFormData({ ...formData, campus_id: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                    required
                                >
                                    <option value="">Select Campus</option>
                                    {campuses.map((campus) => (
                                        <option key={campus.id} value={campus.id.toString()}>
                                            {campus.display_name || campus.name}
                                        </option>
                                    ))}
                                </select>
                                {formErrors.campus_id && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.campus_id}</p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-maroon-600 text-white rounded-lg hover:bg-maroon-700 transition-colors disabled:opacity-50"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Updating...' : 'Update Department'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedDepartment && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full shadow-2xl">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-red-100 rounded-full">
                                    <AlertCircle className="h-6 w-6 text-red-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Delete Department</h2>
                            </div>

                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Are you sure you want to delete <strong>{selectedDepartment.name}</strong>?
                            </p>

                            {selectedDepartment.alumni_profiles_count > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-yellow-800">
                                        <strong>Warning:</strong> This department has {selectedDepartment.alumni_profiles_count} alumni.
                                        You cannot delete a department with existing alumni.
                                    </p>
                                </div>
                            )}

                            {selectedDepartment.courses_count > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-blue-800">
                                        This department has {selectedDepartment.courses_count} courses. They will also be deleted.
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                    disabled={submitting || selectedDepartment.alumni_profiles_count > 0}
                                >
                                    {submitting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminBaseLayout>
    );
}
