import React, { useState, useEffect } from 'react';
import { Building, GraduationCap, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

interface Department {
    id: number;
    name: string;
    code: string;
}

interface Course {
    id: number;
    name: string;
    code: string;
    department_id: number;
}

interface ProfileUpdatePromptProps {
    legacyDepartment?: string | null;
    onComplete: () => void;
}

export default function ProfileUpdatePrompt({ legacyDepartment, onComplete }: ProfileUpdatePromptProps) {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [departmentId, setDepartmentId] = useState('');
    const [courseId, setCourseId] = useState('');
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ departmentId?: string; courseId?: string }>({});

    // Fetch departments on mount
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                setLoadingDepartments(true);
                const response = await axios.get('/api/v1/admin/departments/active');
                if (response.data.success) {
                    setDepartments(response.data.data || []);
                }
            } catch (error) {
                console.error('Error fetching departments:', error);
                setError('Failed to load departments. Please refresh the page.');
            } finally {
                setLoadingDepartments(false);
            }
        };

        fetchDepartments();
    }, []);

    // Fetch courses when department changes
    useEffect(() => {
        const fetchCourses = async () => {
            if (!departmentId) {
                setCourses([]);
                return;
            }

            try {
                setLoadingCourses(true);
                const response = await axios.get(`/api/v1/admin/departments/${departmentId}/courses`);
                if (response.data.success) {
                    setCourses(response.data.data || []);
                }
            } catch (error) {
                console.error('Error fetching courses:', error);
                setCourses([]);
            } finally {
                setLoadingCourses(false);
            }
        };

        fetchCourses();
    }, [departmentId]);

    const handleDepartmentChange = (value: string) => {
        setDepartmentId(value);
        setCourseId(''); // Reset course when department changes
        setFieldErrors(prev => ({ ...prev, departmentId: undefined }));
    };

    const handleCourseChange = (value: string) => {
        setCourseId(value);
        setFieldErrors(prev => ({ ...prev, courseId: undefined }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        // Validation
        const errors: { departmentId?: string; courseId?: string } = {};
        if (!departmentId) {
            errors.departmentId = 'Please select your department';
        }
        if (!courseId) {
            errors.courseId = 'Please select your course';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setSubmitting(true);

        try {
            const response = await axios.put('/api/v1/profile/update-department-course', {
                department_id: Number(departmentId),
                course_id: Number(courseId)
            }, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });

            if (response.data.success) {
                // Success - call onComplete to refresh and close modal
                onComplete();
            } else {
                setError(response.data.message || 'Failed to update profile. Please try again.');
            }
        } catch (error: any) {
            console.error('Error updating profile:', error);
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else if (error.response?.data?.errors) {
                setFieldErrors(error.response.data.errors);
            } else {
                setError('An error occurred while updating your profile. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-fade-in">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-maroon-600 to-maroon-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <GraduationCap className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-maroon-900 mb-2">
                        Update Your Profile
                    </h2>
                    <p className="text-gray-600 text-lg">
                        We've updated our system! Please confirm your department and course.
                    </p>
                </div>

                {/* Legacy Department Info */}
                {legacyDepartment && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                        <div className="flex items-start space-x-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-blue-900">Previous Department</p>
                                <p className="text-sm text-blue-700 mt-1">
                                    {legacyDepartment}
                                </p>
                                <p className="text-xs text-blue-600 mt-2">
                                    Please select the corresponding department and course from the dropdowns below.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
                        <div className="flex items-start space-x-3">
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-red-900">Error</p>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Department Dropdown */}
                    <div>
                        <label htmlFor="department" className="block text-base font-semibold text-gray-900 mb-2">
                            Department/College <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" />
                            <select
                                id="department"
                                value={departmentId}
                                onChange={(e) => handleDepartmentChange(e.target.value)}
                                disabled={loadingDepartments || submitting}
                                className={`w-full pl-12 pr-4 py-3.5 text-base border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500 bg-white text-gray-900 appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed transition-all ${
                                    fieldErrors.departmentId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                            >
                                <option value="">
                                    {loadingDepartments ? 'Loading departments...' : 'Select your department/college'}
                                </option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name} ({dept.code})
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                        {fieldErrors.departmentId && (
                            <p className="text-sm text-red-600 mt-2 flex items-center">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                {fieldErrors.departmentId}
                            </p>
                        )}
                        {!fieldErrors.departmentId && departments.length === 0 && !loadingDepartments && (
                            <p className="text-sm text-amber-600 mt-2">
                                No departments available. Please contact the administrator.
                            </p>
                        )}
                    </div>

                    {/* Course Dropdown */}
                    <div>
                        <label htmlFor="course" className="block text-base font-semibold text-gray-900 mb-2">
                            Course/Program <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <GraduationCap className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" />
                            <select
                                id="course"
                                value={courseId}
                                onChange={(e) => handleCourseChange(e.target.value)}
                                disabled={!departmentId || loadingCourses || submitting}
                                className={`w-full pl-12 pr-4 py-3.5 text-base border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500 bg-white text-gray-900 appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed transition-all ${
                                    fieldErrors.courseId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                            >
                                <option value="">
                                    {!departmentId
                                        ? 'Please select a department first'
                                        : loadingCourses
                                            ? 'Loading courses...'
                                            : 'Select your course/program'}
                                </option>
                                {courses.map((course) => (
                                    <option key={course.id} value={course.id}>
                                        {course.name} ({course.code})
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                        {fieldErrors.courseId && (
                            <p className="text-sm text-red-600 mt-2 flex items-center">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                {fieldErrors.courseId}
                            </p>
                        )}
                        {!fieldErrors.courseId && departmentId && courses.length === 0 && !loadingCourses && (
                            <p className="text-sm text-amber-600 mt-2">
                                No courses available for this department.
                            </p>
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="bg-gradient-to-r from-maroon-50 to-beige-50 border-2 border-maroon-200 rounded-xl p-4">
                        <div className="flex items-start space-x-3">
                            <CheckCircle className="h-5 w-5 text-maroon-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-maroon-900">Why is this required?</p>
                                <p className="text-sm text-maroon-700 mt-1">
                                    We've restructured our database to better track alumni by department and course. 
                                    This helps us provide more accurate analytics and improves your experience.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={submitting || !departmentId || !courseId}
                        className="w-full bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-700 hover:to-maroon-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 text-lg"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <span>Updating Profile...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-6 w-6" />
                                <span>Update Profile & Continue</span>
                            </>
                        )}
                    </button>

                    {/* Footer Note */}
                    <p className="text-center text-sm text-gray-500">
                        This is a one-time update and won't be shown again.
                    </p>
                </form>
            </div>
        </div>
    );
}
