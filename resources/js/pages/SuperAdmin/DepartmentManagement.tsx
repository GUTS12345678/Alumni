import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import { 
    Building, 
    Plus, 
    Edit, 
    Trash2, 
    Search, 
    Filter,
    MoreVertical,
    CheckCircle,
    XCircle,
    RotateCcw,
    AlertCircle,
    BookOpen,
    Users,
    TrendingUp,
    ArrowRight,
    Eye
} from 'lucide-react';

interface Department {
    id: number;
    name: string;
    code: string;
    description: string | null;
    status: 'active' | 'inactive';
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
    
    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
    
    // Form states
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        status: 'active' as 'active' | 'inactive'
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    // Helper function to get CSRF token
    const getCsrfToken = () => {
        return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    };

    useEffect(() => {
        fetchDepartments();
        fetchStats();
    }, [statusFilter, showDeleted]);

    const fetchDepartments = async () => {
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
    };

    const fetchStats = async () => {
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
    };

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
                body: JSON.stringify(formData)
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
                body: JSON.stringify(formData)
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
        } catch (error: any) {
            console.error('Error deleting department:', error);
            alert(error.message || 'Failed to delete department');
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
        } catch (error: any) {
            console.error('Error restoring department:', error);
            alert(error.message || 'Failed to restore department');
        }
    };

    const openCreateModal = () => {
        resetForm();
        setShowCreateModal(true);
    };

    const openEditModal = (department: Department) => {
        setSelectedDepartment(department);
        setFormData({
            name: department.name,
            code: department.code,
            description: department.description || '',
            status: department.status
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
            status: 'active'
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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Department Management</h1>
                        <p className="mt-1 text-sm text-gray-500">
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
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Departments</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_departments}</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <Building className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Active Departments</p>
                                    <p className="text-2xl font-bold text-green-600 mt-1">{stats.active_departments}</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Courses</p>
                                    <p className="text-2xl font-bold text-purple-600 mt-1">{stats.total_courses}</p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <BookOpen className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Departments with Alumni</p>
                                    <p className="text-2xl font-bold text-maroon-600 mt-1">{stats.departments_with_alumni}</p>
                                </div>
                                <div className="p-3 bg-maroon-100 rounded-lg">
                                    <Users className="h-6 w-6 text-maroon-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
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
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-gray-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent"
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
                            <span className="text-sm text-gray-700">Show Deleted</span>
                        </label>
                    </div>
                </div>

                {/* Departments Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon-600"></div>
                    </div>
                ) : filteredDepartments.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                        <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg mb-2">No departments found</p>
                        <p className="text-gray-500 text-sm">Get started by creating your first department</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDepartments.map((department) => (
                            <div
                                key={department.id}
                                className={`bg-white rounded-lg border-2 ${
                                    department.deleted_at 
                                        ? 'border-red-200 bg-red-50' 
                                        : 'border-gray-200 hover:border-maroon-300'
                                } transition-all duration-200 overflow-hidden group`}
                            >
                                {/* Card Header */}
                                <div className={`p-6 ${
                                    department.deleted_at 
                                        ? 'bg-red-100' 
                                        : department.status === 'active' 
                                        ? 'bg-gradient-to-br from-maroon-600 to-maroon-800' 
                                        : 'bg-gray-600'
                                } text-white`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <Building className="h-8 w-8" />
                                        <div className="flex items-center gap-2">
                                            {department.deleted_at ? (
                                                <span className="px-2 py-1 text-xs font-semibold bg-red-200 text-red-800 rounded">
                                                    Deleted
                                                </span>
                                            ) : (
                                                <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                                    department.status === 'active'
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

                                {/* Card Body */}
                                <div className="p-6">
                                    {department.description && (
                                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
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
                                                <p className="text-xs text-gray-500">Courses</p>
                                                <p className="text-lg font-bold text-gray-900">{department.courses_count}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-purple-100 rounded-lg">
                                                <Users className="h-4 w-4 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Alumni</p>
                                                <p className="text-lg font-bold text-gray-900">{department.alumni_profiles_count}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
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
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">Add New Department</h2>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Department Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent"
                                    placeholder="e.g., College of Engineering"
                                    required
                                />
                                {formErrors.name && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Department Code *
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent"
                                    placeholder="e.g., COE"
                                    required
                                />
                                {formErrors.code && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.code}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent"
                                    rows={3}
                                    placeholder="Brief description of the department..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status *
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent"
                                    required
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">Edit Department</h2>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Department Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent"
                                    required
                                />
                                {formErrors.name && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Department Code *
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent"
                                    required
                                />
                                {formErrors.code && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.code}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status *
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent"
                                    required
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
                    <div className="bg-white rounded-lg max-w-md w-full shadow-2xl">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-red-100 rounded-full">
                                    <AlertCircle className="h-6 w-6 text-red-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Delete Department</h2>
                            </div>

                            <p className="text-gray-600 mb-4">
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
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
