import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import axios from 'axios';
import {
    BookOpen,
    Plus,
    Search,
    Building,
    Users,
    Clock,
    Edit,
    Trash2,
    RotateCcw,
    CheckCircle,
    XCircle,
    AlertCircle,
} from 'lucide-react';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface Course {
    id: number;
    department_id: number;
    department?: {
        id: number;
        name: string;
        code: string;
    };
    name: string;
    code: string;
    description: string | null;
    majors: string | null;
    duration_years: number;
    status: 'active' | 'inactive';
    alumni_profiles_count: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

interface Department {
    id: number;
    name: string;
    code: string;
    status: 'active' | 'inactive';
}

interface CourseStats {
    total_courses: number;
    active_courses: number;
    inactive_courses: number;
    deleted_courses: number;
    courses_with_alumni: number;
    total_alumni: number;
    total_departments: number;
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

export default function CourseManagement({ auth }: PageProps) {
    const [courses, setCourses] = useState<Course[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const { confirm, confirmState, handleConfirm, handleCancel } = useConfirmDialog();
    const [stats, setStats] = useState<CourseStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [departmentFilter, setDepartmentFilter] = useState<number | 'all'>('all');
    const [showDeleted, setShowDeleted] = useState(false);

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        department_id: '',
        name: '',
        code: '',
        description: '',
        majors: '',
        duration_years: 4,
        status: 'active' as 'active' | 'inactive'
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    // Configure axios to automatically handle CSRF tokens
    axios.defaults.withCredentials = true;
    axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

    // Get CSRF token from meta tag or cookie
    const token = document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (token) {
        axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
    }

    useEffect(() => {
        fetchCourses();
        fetchDepartments();
        fetchStats();
    }, [statusFilter, departmentFilter, showDeleted]);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const params = {
                all: 'true',
                include_deleted: showDeleted ? 'true' : 'false',
                ...(statusFilter !== 'all' && { status: statusFilter }),
                ...(departmentFilter !== 'all' && { department_id: String(departmentFilter) })
            };

            const { data } = await axios.get('/api/v1/admin/super-admin/courses', { params });

            if (data.success) {
                setCourses(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
            alert('Failed to fetch courses. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const { data } = await axios.get('/api/v1/admin/departments/active');
            if (data.success) {
                setDepartments(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const { data } = await axios.get('/api/v1/admin/super-admin/courses/statistics');
            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({});
        setSubmitting(true);

        try {
            const submitData = {
                department_id: Number(formData.department_id),
                name: formData.name,
                code: formData.code,
                description: formData.description || '',
                majors: formData.majors || '',
                duration_years: Number(formData.duration_years) || 4,
                status: formData.status || 'active'
            };

            await axios.post('/api/v1/admin/super-admin/courses', submitData);

            setShowCreateModal(false);
            resetForm();
            fetchCourses();
            fetchStats();
            alert('Course created successfully!');
        } catch (error) {
            console.error('Error creating course:', error);
            if (axios.isAxiosError(error) && error.response?.data?.errors) {
                setFormErrors(error.response.data.errors);
            } else {
                const message = axios.isAxiosError(error) ? error.response?.data?.message : null;
                alert(message || 'Failed to create course. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCourse) return;

        setFormErrors({});
        setSubmitting(true);

        try {
            const submitData = {
                department_id: Number(formData.department_id),
                name: formData.name,
                code: formData.code,
                description: formData.description || '',
                majors: formData.majors || '',
                duration_years: Number(formData.duration_years) || 4,
                status: formData.status || 'active'
            };

            await axios.put(`/api/v1/admin/super-admin/courses/${selectedCourse.id}`, submitData);

            setShowEditModal(false);
            setSelectedCourse(null);
            resetForm();
            fetchCourses();
            fetchStats();
            alert('Course updated successfully!');
        } catch (error) {
            console.error('Error updating course:', error);
            if (axios.isAxiosError(error) && error.response?.data?.errors) {
                setFormErrors(error.response.data.errors);
            } else {
                const message = axios.isAxiosError(error) ? error.response?.data?.message : null;
                alert(message || 'Failed to update course. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedCourse) return;

        setSubmitting(true);

        try {
            await axios.delete(`/api/v1/admin/super-admin/courses/${selectedCourse.id}`);

            setShowDeleteModal(false);
            setSelectedCourse(null);
            fetchCourses();
            fetchStats();
            alert('Course deleted successfully!');
        } catch (error) {
            console.error('Error deleting course:', error);
            const data = axios.isAxiosError(error) ? error.response?.data : null;

            if (data?.requires_reassignment && data?.alternative_courses) {
                setShowDeleteModal(false);

                const courseOptions = data.alternative_courses.length > 0
                    ? '\n\nAvailable courses for reassignment:\n' + data.alternative_courses
                        .map((c: { name: string; code: string }) => `• ${c.name} (${c.code})`)
                        .join('\n')
                    : '\n\nNo active courses available in this department for reassignment.';

                const message = `Cannot delete "${selectedCourse.name}"\n\n${data.message}${courseOptions}\n\nTo delete this course:\n1. Go to Alumni Bank\n2. Filter by this course\n3. Reassign all ${data.alumni_count} alumni to another course\n4. Return here to delete the course`;

                alert(message);
            } else {
                alert(data?.message || 'Failed to delete course. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleRestore = async (courseId: number) => {
        const ok = await confirm({ title: 'Restore Course', message: 'Are you sure you want to restore this course?', confirmLabel: 'Restore' });
        if (!ok) return;

        try {
            await axios.post(`/api/v1/admin/super-admin/courses/${courseId}/restore`);

            fetchCourses();
            fetchStats();
            alert('Course restored successfully!');
        } catch (error) {
            console.error('Error restoring course:', error);
            alert(axios.isAxiosError(error) && error.response?.data?.message || 'Failed to restore course. Please try again.');
        }
    };

    const openCreateModal = () => {
        resetForm();
        setShowCreateModal(true);
    };

    const openEditModal = (course: Course) => {
        setSelectedCourse(course);
        setFormData({
            department_id: String(course.department_id),
            name: course.name,
            code: course.code,
            description: course.description || '',
            majors: course.majors || '',
            duration_years: course.duration_years,
            status: course.status
        });
        setFormErrors({});
        setShowEditModal(true);
    };

    const openDeleteModal = (course: Course) => {
        setSelectedCourse(course);
        setShowDeleteModal(true);
    };

    const resetForm = () => {
        setFormData({
            department_id: '',
            name: '',
            code: '',
            description: '',
            majors: '',
            duration_years: 4,
            status: 'active'
        });
        setFormErrors({});
    };

    const filteredCourses = courses.filter(course => {
        const matchesSearch =
            course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.department?.name.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesSearch;
    });

    return (
        <AdminBaseLayout title="Course Management" user={auth.user}>
            <Head title="Course Management" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="bg-gradient-to-r from-maroon-600 to-maroon-700 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Course Management</h1>
                            <p className="text-maroon-100">Manage academic programs and courses across all departments</p>
                        </div>
                        <BookOpen className="h-16 w-16 opacity-20 hidden sm:block" />
                    </div>
                </div>

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Courses</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{stats.total_courses}</p>
                                </div>
                                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <BookOpen className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Courses</p>
                                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.active_courses}</p>
                                </div>
                                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Alumni</p>
                                    <p className="text-3xl font-bold text-purple-600 mt-2">{stats.total_alumni}</p>
                                    <p className="text-xs text-gray-500 mt-1">across {stats.courses_with_alumni} courses</p>
                                </div>
                                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Users className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Departments</p>
                                    <p className="text-3xl font-bold text-orange-600 mt-2">{stats.total_departments}</p>
                                </div>
                                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <Building className="h-6 w-6 text-orange-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters and Search */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search courses by name, code, or department..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                />
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <select
                                value={departmentFilter}
                                onChange={(e) => setDepartmentFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-gray-100"
                            >
                                <option value="all">All Departments</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.code}</option>
                                ))}
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-gray-100"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>

                            <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                                <input
                                    type="checkbox"
                                    checked={showDeleted}
                                    onChange={(e) => setShowDeleted(e.target.checked)}
                                    className="rounded border-gray-300 dark:border-gray-600 text-maroon-600 focus:ring-maroon-500"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show Deleted</span>
                            </label>

                            <button
                                onClick={openCreateModal}
                                className="flex items-center justify-center gap-2 bg-maroon-600 text-white px-6 py-2.5 rounded-lg hover:bg-maroon-700 transition-colors font-medium shadow-sm"
                            >
                                <Plus className="h-5 w-5" />
                                <span>Add Course</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Courses Grid/List */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon-600 mb-4"></div>
                            <p className="text-gray-500 dark:text-gray-400">Loading courses...</p>
                        </div>
                    ) : filteredCourses.length === 0 ? (
                        <div className="text-center py-16">
                            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No courses found</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">Get started by creating your first course</p>
                            <button
                                onClick={openCreateModal}
                                className="inline-flex items-center gap-2 bg-maroon-600 text-white px-6 py-3 rounded-lg hover:bg-maroon-700 transition-colors font-medium"
                            >
                                <Plus className="h-5 w-5" />
                                Create Course
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                            {filteredCourses.map((course) => (
                                <div
                                    key={course.id}
                                    className={`relative bg-white dark:bg-gray-800 border-2 rounded-xl p-6 transition-all hover:shadow-lg ${course.deleted_at
                                        ? 'border-red-200 bg-red-50'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-maroon-300'
                                        }`}
                                >
                                    {/* Status Badge */}
                                    <div className="absolute top-4 right-4">
                                        {course.deleted_at ? (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                Deleted
                                            </span>
                                        ) : (
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${course.status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {course.status === 'active' ? 'Active' : 'Inactive'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Course Info */}
                                    <div className="pr-20 mb-4">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">{course.name}</h3>
                                        <p className="text-sm font-medium text-maroon-600 mb-2">{course.code}</p>
                                        {course.majors && (
                                            <p className="text-xs text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded">
                                                {course.majors}
                                            </p>
                                        )}
                                    </div>

                                    {/* Department */}
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        <Building className="h-4 w-4" />
                                        <span>{course.department?.name || 'N/A'}</span>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            <span>{course.duration_years} years</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Users className="h-4 w-4" />
                                            <span>{course.alumni_profiles_count} alumni</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        {course.deleted_at ? (
                                            <button
                                                onClick={() => handleRestore(course.id)}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                                Restore
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => openEditModal(course)}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(course)}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create New Course</h2>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <XCircle className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Department <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.department_id}
                                        onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100 ${formErrors.department_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                        required
                                    >
                                        <option value="">Select a department</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name} ({dept.code})
                                            </option>
                                        ))}
                                    </select>
                                    {formErrors.department_id && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.department_id}</p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Course Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100 ${formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                        placeholder="e.g., Bachelor of Science in Computer Science"
                                        required
                                    />
                                    {formErrors.name && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Course Code <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100 ${formErrors.code ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                        placeholder="e.g., BSCS"
                                        required
                                    />
                                    {formErrors.code && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.code}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Duration (Years) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={formData.duration_years}
                                        onChange={(e) => setFormData({ ...formData, duration_years: Number(e.target.value) })}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100 ${formErrors.duration_years ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                        required
                                    />
                                    {formErrors.duration_years && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.duration_years}</p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Majors/Specializations
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.majors}
                                        onChange={(e) => setFormData({ ...formData, majors: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100"
                                        placeholder="e.g., Software Engineering, Data Science"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Comma-separated if multiple</p>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100"
                                        rows={3}
                                        placeholder="Brief description of the course..."
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-6 py-3 bg-maroon-600 text-white font-medium rounded-lg hover:bg-maroon-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Creating...' : 'Create Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedCourse && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Course</h2>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <XCircle className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Department <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.department_id}
                                        onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100 ${formErrors.department_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                        required
                                    >
                                        <option value="">Select a department</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name} ({dept.code})
                                            </option>
                                        ))}
                                    </select>
                                    {formErrors.department_id && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.department_id}</p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Course Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100 ${formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                        required
                                    />
                                    {formErrors.name && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Course Code <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100 ${formErrors.code ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                        required
                                    />
                                    {formErrors.code && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.code}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Duration (Years) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={formData.duration_years}
                                        onChange={(e) => setFormData({ ...formData, duration_years: Number(e.target.value) })}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100 ${formErrors.duration_years ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                        required
                                    />
                                    {formErrors.duration_years && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.duration_years}</p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Majors/Specializations
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.majors}
                                        onChange={(e) => setFormData({ ...formData, majors: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100"
                                        placeholder="e.g., Software Engineering, Data Science"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Comma-separated if multiple</p>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100"
                                        rows={3}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-6 py-3 bg-maroon-600 text-white font-medium rounded-lg hover:bg-maroon-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Updating...' : 'Update Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && selectedCourse && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Delete Course</h2>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                <div className="flex gap-3">
                                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="text-sm font-medium text-yellow-800 mb-1">Warning</h3>
                                        <p className="text-sm text-yellow-700">
                                            This action cannot be undone. The course will be marked as deleted.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm font-medium text-gray-900 mb-2">Course Details:</p>
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Name:</span> {selectedCourse.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Code:</span> {selectedCourse.code}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Alumni Count:</span> {selectedCourse.alumni_profiles_count}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={submitting}
                                className="flex-1 px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Deleting...' : 'Delete Course'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <ConfirmDialog open={confirmState.open} title={confirmState.title} message={confirmState.message} confirmLabel={confirmState.confirmLabel} cancelLabel={confirmState.cancelLabel} variant={confirmState.variant} onConfirm={handleConfirm} onCancel={handleCancel} />
        </AdminBaseLayout>
    );
}
