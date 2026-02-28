import React, { useState, useEffect, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import { useCampus } from '@/contexts/CampusContext';
import {
    Building,
    Plus,
    Edit,
    Trash2,
    Search,
    ArrowLeft,
    CheckCircle,
    XCircle,
    AlertCircle,
    Users,
    BookOpen,
    GraduationCap,
    Clock,
    Download,
    ChevronDown,
    FileText
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useExport } from '@/hooks/useExport';
import { ExportProgressDialog } from '@/components/ExportProgressDialog';

interface Course {
    id: number;
    department_id: number;
    name: string;
    code: string;
    description: string | null;
    majors: string | null;
    duration_years: number;
    status: 'active' | 'inactive';
    campus_id?: number;
    alumni_profiles_count: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

interface Department {
    id: number;
    name: string;
    code: string;
    description: string | null;
    status: 'active' | 'inactive';
    courses_count: number;
    alumni_count: number;
    created_at: string;
    updated_at: string;
}

interface AlumniProfile {
    id: number;
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    student_id: string;
    course?: {
        id: number;
        name: string;
        code: string;
    };
    graduation_year: number;
    employment_status: string;
}

interface Employer {
    name: string;
    count: number;
}

interface SalaryRange {
    range: string;
    count: number;
}

interface CareerField {
    field: string;
    count: number;
    percentage: number;
}

interface Analytics {
    department: {
        total_alumni: number;
    };
    employment: {
        employment_rate: number;
        avg_time_to_employment_days: number | null;
        top_employers?: Employer[];
    };
    engagement: {
        willing_to_mentor_rate: number;
        willing_to_mentor: number;
    };
    compensation: {
        salary_distribution: SalaryRange[];
    };
    career_fields: {
        distribution: CareerField[];
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
    departmentId: string;
}

export default function DepartmentDashboard({ auth, departmentId }: PageProps) {
    const [department, setDepartment] = useState<Department | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [showEditCourseModal, setShowEditCourseModal] = useState(false);
    const [showDeleteCourseModal, setShowDeleteCourseModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

    // Campus context
    const { campuses, selectedCampus } = useCampus();

    const { exportData, cancelExport, ...exportState } = useExport();

    // Course form states
    const [courseFormData, setCourseFormData] = useState({
        name: '',
        code: '',
        description: '',
        majors: '',
        duration_years: 4,
        status: 'active' as 'active' | 'inactive',
        campus_id: '' as string
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const getCsrfToken = () => {
        return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    };

    const getXsrfToken = () => {
        const cookies = document.cookie.split(';');
        const xsrfCookie = cookies.find(cookie => cookie.trim().startsWith('XSRF-TOKEN='));
        if (xsrfCookie) {
            return decodeURIComponent(xsrfCookie.split('=')[1]);
        }
        return '';
    };

    const fetchDepartmentData = useCallback(async () => {
        try {
            const response = await fetch(`/api/v1/admin/super-admin/departments/${departmentId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setDepartment(data.data);
                }
            }
        } catch (error) {
            console.error('Error fetching department:', error);
        }
    }, [departmentId]);

    const fetchCourses = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/v1/admin/super-admin/courses?department_id=${departmentId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'same-origin'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setCourses(data.data || []);
                }
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    }, [departmentId]);

    const fetchAlumni = useCallback(async () => {
        try {
            const response = await fetch(`/api/v1/admin/departments/${departmentId}/alumni`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setAlumni(data.data || []);
                }
            }
        } catch (error) {
            console.error('Error fetching alumni:', error);
        }
    }, [departmentId]);

    const fetchAnalytics = useCallback(async () => {
        try {
            const response = await fetch(`/api/v1/admin/departments/${departmentId}/analytics`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setAnalytics(data.data);
                }
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    }, [departmentId]);

    useEffect(() => {
        fetchDepartmentData();
        fetchCourses();
        fetchAlumni();
        fetchAnalytics();
    }, [fetchDepartmentData, fetchCourses, fetchAlumni, fetchAnalytics]);

    const handleExportAnalytics = async (format: 'csv' | 'excel' | 'pdf' = 'csv') => {
        if (!departmentId) return;

        exportData({
            url: `/api/v1/admin/departments/${departmentId}/analytics/export`,
            filename: `department_analytics_${department?.code || departmentId}`,
            format,
            onError: () => alert('Failed to export analytics. Please try again.'),
        });
    };

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({});
        setSubmitting(true);

        try {
            const xsrfToken = getXsrfToken();
            const csrfToken = getCsrfToken();

            const response = await fetch('/api/v1/admin/super-admin/courses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-XSRF-TOKEN': xsrfToken
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    ...courseFormData,
                    department_id: Number(departmentId),
                    campus_id: courseFormData.campus_id ? Number(courseFormData.campus_id) : undefined,
                    _token: csrfToken
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    setFormErrors(data.errors);
                } else {
                    alert(data.message || 'Failed to create course');
                }
                return;
            }

            setShowCourseModal(false);
            resetCourseForm();
            fetchCourses();
            fetchDepartmentData();
            alert('Course created successfully!');
        } catch (error) {
            console.error('Error creating course:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCourse) return;

        setFormErrors({});
        setSubmitting(true);

        try {
            const response = await fetch(`/api/v1/admin/super-admin/courses/${selectedCourse.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken()
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    ...courseFormData,
                    department_id: Number(departmentId),
                    campus_id: courseFormData.campus_id ? Number(courseFormData.campus_id) : undefined
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    setFormErrors(data.errors);
                } else {
                    alert(data.message || 'Failed to update course');
                }
                return;
            }

            setShowEditCourseModal(false);
            setSelectedCourse(null);
            resetCourseForm();
            fetchCourses();
            alert('Course updated successfully!');
        } catch (error) {
            console.error('Error updating course:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteCourse = async () => {
        if (!selectedCourse) return;

        setSubmitting(true);

        try {
            const response = await fetch(`/api/v1/admin/super-admin/courses/${selectedCourse.id}`, {
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
                alert(data.message || 'Failed to delete course');
                return;
            }

            setShowDeleteCourseModal(false);
            setSelectedCourse(null);
            fetchCourses();
            fetchDepartmentData();
            alert('Course deleted successfully!');
        } catch (error) {
            console.error('Error deleting course:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const openCreateCourseModal = () => {
        resetCourseForm();
        // Pre-select the currently selected campus from the header selector
        if (selectedCampus) {
            setCourseFormData(prev => ({ ...prev, campus_id: selectedCampus.id.toString() }));
        } else if (campuses.length > 0) {
            setCourseFormData(prev => ({ ...prev, campus_id: campuses[0].id.toString() }));
        }
        setShowCourseModal(true);
    };

    const openEditCourseModal = (course: Course) => {
        setSelectedCourse(course);
        setCourseFormData({
            name: course.name,
            code: course.code,
            description: course.description || '',
            majors: course.majors || '',
            duration_years: course.duration_years,
            status: course.status,
            campus_id: course.campus_id?.toString() || '1'
        });
        setFormErrors({});
        setShowEditCourseModal(true);
    };

    const openDeleteCourseModal = (course: Course) => {
        setSelectedCourse(course);
        setShowDeleteCourseModal(true);
    };

    const resetCourseForm = () => {
        setCourseFormData({
            name: '',
            code: '',
            description: '',
            majors: '',
            duration_years: 4,
            status: 'active',
            campus_id: selectedCampus?.id.toString() || (campuses[0]?.id.toString() || '1')
        });
        setFormErrors({});
    };

    const filteredAlumni = alumni.filter(alum => {
        const fullName = `${alum.first_name} ${alum.last_name}`.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        return fullName.includes(searchLower) ||
            alum.student_id.toLowerCase().includes(searchLower) ||
            alum.email.toLowerCase().includes(searchLower);
    });

    if (!department) {
        return (
            <AdminBaseLayout title="Loading..." user={auth.user}>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon-600"></div>
                </div>
            </AdminBaseLayout>
        );
    }

    return (
        <AdminBaseLayout title={department.name} user={auth.user}>
            <Head title={department.name} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/super-admin/departments"
                            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-maroon-600"
                        >
                            <ArrowLeft className="h-5 w-5 mr-1" />
                            Back to Departments
                        </Link>
                    </div>
                </div>

                {/* Department Header */}
                <div className="bg-gradient-to-r from-maroon-600 to-maroon-800 rounded-lg shadow-lg p-4 md:p-8 text-white">
                    <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3">
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                <Building className="h-10 w-10" />
                                <h1 className="text-3xl font-bold">{department.name}</h1>
                            </div>
                            <p className="text-maroon-100 text-lg">Department Code: {department.code}</p>
                            {department.description && (
                                <p className="text-maroon-100 mt-3 max-w-3xl">{department.description}</p>
                            )}
                        </div>
                        <div className={`px-4 py-2 rounded-lg ${department.status === 'active'
                            ? 'bg-green-500 bg-opacity-20 text-green-100'
                            : 'bg-gray-500 bg-opacity-20 text-gray-100'
                            }`}>
                            {department.status === 'active' ? 'Active' : 'Inactive'}
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-beige-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Courses</p>
                                <p className="text-3xl font-bold text-blue-600 mt-2">{courses.length}</p>
                            </div>
                            <BookOpen className="h-12 w-12 text-blue-600 opacity-20" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-beige-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Courses</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">
                                    {courses.filter(c => c.status === 'active' && !c.deleted_at).length}
                                </p>
                            </div>
                            <CheckCircle className="h-12 w-12 text-green-600 opacity-20" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-beige-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Alumni</p>
                                <p className="text-3xl font-bold text-purple-600 mt-2">{alumni.length}</p>
                            </div>
                            <GraduationCap className="h-12 w-12 text-purple-600 opacity-20" />
                        </div>
                    </div>
                </div>

                {/* Enhanced Analytics Section */}
                {analytics && analytics.department && analytics.department.total_alumni > 0 && (
                    <div className="space-y-6">
                        {/* Analytics Header with Export */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-beige-200 dark:border-gray-700 p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Department Analytics</h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Comprehensive insights for {department?.name}</p>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="inline-flex items-center px-4 py-2 bg-maroon-600 text-white text-sm font-medium rounded-lg hover:bg-maroon-700 focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:ring-offset-2 transition-colors border-0"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Export Analytics
                                            <ChevronDown className="w-4 h-4 ml-2" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleExportAnalytics('csv')}>
                                            <FileText className="w-4 h-4 mr-2" />
                                            Export as CSV
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleExportAnalytics('excel')}>
                                            <FileText className="w-4 h-4 mr-2" />
                                            Export as Excel
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleExportAnalytics('pdf')}>
                                            <FileText className="w-4 h-4 mr-2" />
                                            Export as PDF
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        {/* Employment Metrics */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-beige-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Employment Metrics</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                    <p className="text-sm font-medium text-green-800">Employment Rate</p>
                                    <p className="text-3xl font-bold text-green-600 mt-2">
                                        {analytics.employment?.employment_rate ?? 0}%
                                    </p>
                                    <p className="text-xs text-green-600 mt-1">
                                        {Math.round(((analytics.employment?.employment_rate ?? 0) / 100) * analytics.department.total_alumni)} employed
                                    </p>
                                </div>

                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <p className="text-sm font-medium text-blue-800">Avg. Time to Employment</p>
                                    <p className="text-3xl font-bold text-blue-600 mt-2">
                                        {analytics.employment?.avg_time_to_employment_days
                                            ? `${Math.round(analytics.employment.avg_time_to_employment_days)}`
                                            : 'N/A'}
                                    </p>
                                    <p className="text-xs text-blue-600 mt-1">
                                        {analytics.employment?.avg_time_to_employment_days ? 'days after graduation' : 'No data yet'}
                                    </p>
                                </div>

                                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                    <p className="text-sm font-medium text-purple-800">Willing to Mentor</p>
                                    <p className="text-3xl font-bold text-purple-600 mt-2">
                                        {analytics.engagement?.willing_to_mentor_rate ?? 0}%
                                    </p>
                                    <p className="text-xs text-purple-600 mt-1">
                                        {analytics.engagement?.willing_to_mentor ?? 0} alumni ready to help
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Top Employers */}
                        {analytics.employment?.top_employers && analytics.employment.top_employers.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-beige-200 dark:border-gray-700 p-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Top Employers</h3>
                                <div className="space-y-3">
                                    {analytics.employment.top_employers.map((employer, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-maroon-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                                    {index + 1}
                                                </div>
                                                <span className="font-medium text-gray-900 dark:text-gray-100">{employer.name}</span>
                                            </div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{employer.count} alumni</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Salary Distribution */}
                        {analytics.compensation?.salary_distribution?.some(s => s.count > 0) && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-beige-200 dark:border-gray-700 p-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Salary Distribution (Monthly)</h3>
                                <div className="space-y-2">
                                    {analytics.compensation.salary_distribution
                                        .filter(salary => salary.count > 0)
                                        .map((salary, index) => {
                                            const maxCount = Math.max(...analytics.compensation.salary_distribution.map(s => s.count));
                                            const percentage = (salary.count / maxCount) * 100;
                                            return (
                                                <div key={index}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">{salary.range}</span>
                                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{salary.count} alumni</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-maroon-600 h-2 rounded-full transition-all duration-300"
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}

                        {/* Career Fields */}
                        {analytics.career_fields?.distribution && analytics.career_fields.distribution.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-beige-200 dark:border-gray-700 p-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Career Field Distribution</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {analytics.career_fields.distribution.map((field, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{field.field}</span>
                                            <span className="text-sm text-maroon-600 font-bold">{field.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Courses Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-beige-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                            <BookOpen className="h-6 w-6 mr-2 text-maroon-600" />
                            Courses
                        </h2>
                        <button
                            onClick={openCreateCourseModal}
                            className="flex items-center space-x-2 bg-maroon-600 text-white px-4 py-2 rounded-lg hover:bg-maroon-700 transition-colors"
                        >
                            <Plus className="h-5 w-5" />
                            <span>Add Course</span>
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maroon-600"></div>
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="text-center py-12">
                            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">No courses found in this department</p>
                            <button
                                onClick={openCreateCourseModal}
                                className="mt-4 text-maroon-600 hover:text-maroon-700 font-medium"
                            >
                                Add your first course
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Course
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Duration
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Alumni
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {courses.map((course) => (
                                        <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{course.name}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Code: {course.code}</p>
                                                    {course.description && (
                                                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{course.description}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <Clock className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm text-gray-900 dark:text-gray-100">{course.duration_years} years</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <Users className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm text-gray-900 dark:text-gray-100">{course.alumni_profiles_count}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {course.status === 'active' ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        <XCircle className="h-3 w-3 mr-1" />
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => openEditCourseModal(course)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="Edit Course"
                                                    >
                                                        <Edit className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteCourseModal(course)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Delete Course"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Alumni Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-beige-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                            <GraduationCap className="h-6 w-6 mr-2 text-maroon-600" />
                            Alumni ({alumni.length})
                        </h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search alumni..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                            />
                        </div>
                    </div>

                    {filteredAlumni.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">
                                {searchTerm ? 'No alumni found matching your search' : 'No alumni in this department yet'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Student
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Course
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Graduation Year
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Employment Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredAlumni.map((alum) => (
                                        <tr key={alum.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {alum.first_name} {alum.last_name}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{alum.student_id}</p>
                                                    <p className="text-xs text-gray-400">{alum.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm text-gray-900 dark:text-gray-100">{alum.course?.name || 'N/A'}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{alum.course?.code || ''}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-900 dark:text-gray-100">{alum.graduation_year}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-900 dark:text-gray-100 capitalize">
                                                    {alum.employment_status?.replace(/_/g, ' ') || 'Not specified'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Course Modal */}
            {showCourseModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Add New Course</h2>
                            <button
                                onClick={() => setShowCourseModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCourse} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Course Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={courseFormData.name}
                                    onChange={(e) => setCourseFormData({ ...courseFormData, name: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100 ${formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                    placeholder="e.g., BS Computer Science"
                                    required
                                />
                                {formErrors.name && (
                                    <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Course Code <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={courseFormData.code}
                                    onChange={(e) => setCourseFormData({ ...courseFormData, code: e.target.value.toUpperCase() })}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100 ${formErrors.code ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                    placeholder="e.g., BSCS"
                                    required
                                />
                                {formErrors.code && (
                                    <p className="text-red-500 text-xs mt-1">{formErrors.code}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Major/Specialization
                                </label>
                                <textarea
                                    value={courseFormData.majors}
                                    onChange={(e) => setCourseFormData({ ...courseFormData, majors: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500"
                                    rows={2}
                                    placeholder="e.g., Computer Science, Information Technology, Software Engineering (comma-separated)"
                                />
                                <p className="text-xs text-gray-500 mt-1">Optional: List available majors or specializations for this course</p>
                                {formErrors.majors && (
                                    <p className="text-red-500 text-xs mt-1">{formErrors.majors}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Duration (Years) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={courseFormData.duration_years}
                                    onChange={(e) => setCourseFormData({ ...courseFormData, duration_years: Number(e.target.value) })}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100 ${formErrors.duration_years ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                    required
                                />
                                {formErrors.duration_years && (
                                    <p className="text-red-500 text-xs mt-1">{formErrors.duration_years}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={courseFormData.description}
                                    onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100"
                                    rows={3}
                                    placeholder="Course description..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                <select
                                    value={courseFormData.status}
                                    onChange={(e) => setCourseFormData({ ...courseFormData, status: e.target.value as 'active' | 'inactive' })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Campus *</label>
                                <select
                                    value={courseFormData.campus_id}
                                    onChange={(e) => setCourseFormData({ ...courseFormData, campus_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100"
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
                                    <p className="text-red-500 text-xs mt-1">{formErrors.campus_id}</p>
                                )}
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCourseModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-maroon-600 text-white rounded-lg hover:bg-maroon-700 disabled:opacity-50"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Creating...' : 'Add Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Course Modal */}
            {showEditCourseModal && selectedCourse && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Edit Course</h2>
                            <button
                                onClick={() => setShowEditCourseModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleEditCourse} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Course Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={courseFormData.name}
                                    onChange={(e) => setCourseFormData({ ...courseFormData, name: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100 ${formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                    required
                                />
                                {formErrors.name && (
                                    <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Course Code <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={courseFormData.code}
                                    onChange={(e) => setCourseFormData({ ...courseFormData, code: e.target.value.toUpperCase() })}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100 ${formErrors.code ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                    required
                                />
                                {formErrors.code && (
                                    <p className="text-red-500 text-xs mt-1">{formErrors.code}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Major/Specialization
                                </label>
                                <textarea
                                    value={courseFormData.majors}
                                    onChange={(e) => setCourseFormData({ ...courseFormData, majors: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100"
                                    rows={2}
                                    placeholder="e.g., Computer Science, Information Technology, Software Engineering (comma-separated)"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Optional: List available majors or specializations for this course</p>
                                {formErrors.majors && (
                                    <p className="text-red-500 text-xs mt-1">{formErrors.majors}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Duration (Years) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={courseFormData.duration_years}
                                    onChange={(e) => setCourseFormData({ ...courseFormData, duration_years: Number(e.target.value) })}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100 ${formErrors.duration_years ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                    required
                                />
                                {formErrors.duration_years && (
                                    <p className="text-red-500 text-xs mt-1">{formErrors.duration_years}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={courseFormData.description}
                                    onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                <select
                                    value={courseFormData.status}
                                    onChange={(e) => setCourseFormData({ ...courseFormData, status: e.target.value as 'active' | 'inactive' })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Campus *</label>
                                <select
                                    value={courseFormData.campus_id}
                                    onChange={(e) => setCourseFormData({ ...courseFormData, campus_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:bg-gray-700 dark:text-gray-100"
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
                                    <p className="text-red-500 text-xs mt-1">{formErrors.campus_id}</p>
                                )}
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditCourseModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-maroon-600 text-white rounded-lg hover:bg-maroon-700 disabled:opacity-50"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Updating...' : 'Update Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Course Modal */}
            {showDeleteCourseModal && selectedCourse && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Delete Course</h2>
                            <button
                                onClick={() => setShowDeleteCourseModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-yellow-800">
                                            Are you sure you want to delete this course?
                                        </p>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            Course: <strong>{selectedCourse.name}</strong> ({selectedCourse.code})
                                        </p>
                                        {selectedCourse.alumni_profiles_count > 0 && (
                                            <p className="text-sm text-red-700 mt-2">
                                                ⚠️ This course has <strong>{selectedCourse.alumni_profiles_count} alumni</strong> associated with it.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={() => setShowDeleteCourseModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteCourse}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                disabled={submitting}
                            >
                                {submitting ? 'Deleting...' : 'Delete Course'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <ExportProgressDialog {...exportState} onCancel={cancelExport} />
        </AdminBaseLayout>
    );
}
