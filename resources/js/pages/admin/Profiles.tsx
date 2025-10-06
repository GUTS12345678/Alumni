import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import {
    User,
    Search,
    Eye,
    Edit,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    GraduationCap,
    RefreshCw,
    Filter,
    Download,
    Calendar,
    X
} from 'lucide-react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';

interface AlumniProfile {
    id: number;
    user: {
        id: number;
        email: string;
        name: string;
    };
    first_name: string;
    last_name: string;
    student_id: string;
    birth_date?: string;
    gender: string;
    phone?: string;
    city?: string;
    country?: string;
    degree_program: string;
    graduation_year: number;
    employment_status: string;
    current_job_title?: string;
    current_employer?: string;
    current_salary?: number;
    gpa?: number;
    profile_completed: boolean;
    created_at: string;
    batch?: {
        id: number;
        name: string;
        graduation_year: number;
    };
}

interface ProfilesResponse {
    data: AlumniProfile[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export default function Profiles() {
    const [profiles, setProfiles] = useState<AlumniProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [employmentFilter, setEmploymentFilter] = useState<string>('all');
    const [batchFilter, setBatchFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    // Modal states
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<AlumniProfile | null>(null);
    interface EditFormData {
        id?: number;
        first_name?: string;
        last_name?: string;
        student_id?: string;
        gender?: string;
        birth_date?: string | null;
        phone?: string | null;
        city?: string | null;
        country?: string | null;
        degree_program?: string;
        graduation_year?: number;
        gpa?: number | null;
        batch_id?: number | null;
        employment_status?: string | null;
        current_job_title?: string | null;
        current_employer?: string | null;
        current_salary?: number | null;
    }
    const [editFormData, setEditFormData] = useState<EditFormData>({});
    const [updating, setUpdating] = useState(false);
    const [batches, setBatches] = useState<Array<{ id: number, name: string }>>([]);

    const fetchBatches = useCallback(async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            const response = await axios.get('/api/v1/admin/batches', {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            if (response.data.success) {
                setBatches(response.data.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching batches:', error);
        }
    }, []);

    const fetchProfiles = useCallback(async () => {
        try {
            setLoading(currentPage === 1);
            setRefreshing(currentPage !== 1);

            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (employmentFilter !== 'all') params.append('employment_status', employmentFilter);
            if (batchFilter !== 'all') params.append('batch_id', batchFilter);
            params.append('page', currentPage.toString());
            params.append('per_page', '15');

            const response = await fetch(`/api/v1/admin/alumni?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('auth_token');
                    localStorage.removeUser('user');
                    window.location.href = '/login';
                    return;
                }
                throw new Error('Failed to fetch profiles data');
            }

            const data: { success: boolean; data: ProfilesResponse } = await response.json();

            if (data.success) {
                setProfiles(data.data.data);
                setCurrentPage(data.data.current_page);
                setTotalPages(data.data.last_page);
                setTotal(data.data.total);
            }
        } catch (err) {
            console.error('Profiles fetch error:', err);
            setError('Failed to load profiles data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, searchTerm, employmentFilter, batchFilter]);

    useEffect(() => {
        fetchProfiles();
        fetchBatches();
    }, [fetchProfiles, fetchBatches]);

    const getEmploymentStatusBadge = (status: string) => {
        const statusColors = {
            'employed_full_time': 'bg-green-100 text-green-800',
            'employed_part_time': 'bg-blue-100 text-blue-800',
            'self_employed': 'bg-purple-100 text-purple-800',
            'unemployed': 'bg-red-100 text-red-800',
            'student': 'bg-orange-100 text-orange-800',
            'not_looking': 'bg-gray-100 text-gray-800',
        };

        const displayNames = {
            'employed_full_time': 'Full-time',
            'employed_part_time': 'Part-time',
            'self_employed': 'Self-employed',
            'unemployed': 'Unemployed',
            'student': 'Student',
            'not_looking': 'Not looking',
        };

        return (
            <Badge className={statusColors[status as keyof typeof statusColors] || statusColors.unemployed}>
                {displayNames[status as keyof typeof displayNames] || status}
            </Badge>
        );
    };

    const getProfileCompletionBadge = (completed: boolean) => {
        return (
            <Badge className={completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {completed ? 'Complete' : 'Incomplete'}
            </Badge>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleExport = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (employmentFilter !== 'all') params.append('employment_status', employmentFilter);
            if (batchFilter !== 'all') params.append('batch_id', batchFilter);

            const response = await fetch(`/api/v1/admin/alumni/export?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.csv_content) {
                    const blob = new Blob([atob(data.data.csv_content)], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = 'alumni-profiles.csv';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                }
            }
        } catch (error) {
            console.error('Export error:', error);
        }
    };

    // Profile action handlers
    const handleViewProfile = (profile: AlumniProfile) => {
        setSelectedProfile(profile);
        setViewModalOpen(true);
    };

    const handleEditProfile = (profile: AlumniProfile) => {
        setSelectedProfile(profile);
        setEditFormData({
            first_name: profile.first_name,
            last_name: profile.last_name,
            student_id: profile.student_id,
            birth_date: profile.birth_date,
            gender: profile.gender,
            phone: profile.phone,
            city: profile.city,
            country: profile.country,
            degree_program: profile.degree_program,
            graduation_year: profile.graduation_year,
            employment_status: profile.employment_status,
            current_job_title: profile.current_job_title,
            current_employer: profile.current_employer,
            current_salary: profile.current_salary,
            gpa: profile.gpa,
            batch_id: profile.batch?.id || null
        });
        setEditModalOpen(true);
    };

    const handleSendEmail = (profile: AlumniProfile) => {
        const subject = encodeURIComponent('Alumni Tracer - Contact from Admin');
        const body = encodeURIComponent(`Dear ${profile.first_name} ${profile.last_name},\n\n`);
        window.location.href = `mailto:${profile.user.email}?subject=${subject}&body=${body}`;
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProfile) return;

        setUpdating(true);
        try {
            await axios.get('/sanctum/csrf-cookie');
            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const response = await axios.put(`/api/v1/admin/profiles/${selectedProfile.id}`, editFormData, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            if (response.data.success) {
                // Update the profile in the local state
                setProfiles(profiles.map(p =>
                    p.id === selectedProfile.id
                        ? { ...p, ...response.data.data }
                        : p
                ));
                setEditModalOpen(false);
                setEditFormData({});
                alert('Profile updated successfully!');
                // Refresh the data to ensure consistency
                fetchProfiles();
            } else {
                alert('Failed to update profile: ' + response.data.message);
            }
        } catch (error: unknown) {
            console.error('Error updating profile:', error);
            const axiosError = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
            if (axiosError.response?.data?.errors) {
                const errors = Object.values(axiosError.response.data.errors).flat();
                alert('Validation errors: ' + errors.join(', '));
            } else if (axiosError.response?.data?.message) {
                alert('Error: ' + axiosError.response.data.message);
            } else {
                alert('Failed to update profile. Please try again.');
            }
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <AdminBaseLayout title="Alumni Profiles">
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="h-8 w-8 text-maroon-600 animate-spin" />
                        <span className="text-maroon-800 font-medium">Loading profiles...</span>
                    </div>
                </div>
            </AdminBaseLayout>
        );
    }

    if (error) {
        return (
            <AdminBaseLayout title="Alumni Profiles">
                <Card className="border-red-200">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-red-600 mb-4">{error}</p>
                            <Button onClick={() => fetchProfiles()} className="bg-maroon-700 hover:bg-maroon-800">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </AdminBaseLayout>
        );
    }

    return (
        <AdminBaseLayout title="Alumni Profiles">
            <div className="space-y-6">
                {/* Header with Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-maroon-800">Alumni Profiles</h2>
                        <p className="text-maroon-600">Detailed view and management of alumni profiles</p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={() => fetchProfiles()}
                            variant="outline"
                            size="sm"
                            disabled={refreshing}
                            className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>

                        <Button
                            onClick={handleExport}
                            variant="outline"
                            size="sm"
                            className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Search and Filters */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg text-maroon-800 flex items-center">
                            <Filter className="h-5 w-5 mr-2" />
                            Search & Filter Profiles
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search by name, email, or student ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 border-beige-300 focus:border-maroon-500 focus:ring-maroon-500"
                                />
                            </div>

                            <select
                                value={employmentFilter}
                                onChange={(e) => setEmploymentFilter(e.target.value)}
                                className="border border-beige-300 rounded-md px-3 py-2 text-sm focus:border-maroon-500 focus:ring-maroon-500"
                            >
                                <option value="all">All Employment Status</option>
                                <option value="employed_full_time">Full-time Employed</option>
                                <option value="employed_part_time">Part-time Employed</option>
                                <option value="self_employed">Self-employed</option>
                                <option value="unemployed">Unemployed</option>
                                <option value="student">Student</option>
                                <option value="not_looking">Not Looking</option>
                            </select>

                            <select
                                value={batchFilter}
                                onChange={(e) => setBatchFilter(e.target.value)}
                                className="border border-beige-300 rounded-md px-3 py-2 text-sm focus:border-maroon-500 focus:ring-maroon-500"
                            >
                                <option value="all">All Graduation Years</option>
                                <option value="2024">Class of 2024</option>
                                <option value="2023">Class of 2023</option>
                                <option value="2022">Class of 2022</option>
                                <option value="2021">Class of 2021</option>
                                <option value="2020">Class of 2020</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Profile Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">Total Profiles</CardTitle>
                            <User className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-maroon-800">{total}</div>
                            <p className="text-xs text-maroon-600 mt-1">Alumni registered</p>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">Employed</CardTitle>
                            <Briefcase className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {profiles.filter(p => p.employment_status.includes('employed')).length}
                            </div>
                            <p className="text-xs text-maroon-600 mt-1">Full/Part-time jobs</p>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">Complete Profiles</CardTitle>
                            <GraduationCap className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {profiles.filter(p => p.profile_completed).length}
                            </div>
                            <p className="text-xs text-maroon-600 mt-1">Fully completed</p>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">Recent</CardTitle>
                            <Calendar className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">
                                {profiles.filter(p => {
                                    const createdDate = new Date(p.created_at);
                                    const thirtyDaysAgo = new Date();
                                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                                    return createdDate >= thirtyDaysAgo;
                                }).length}
                            </div>
                            <p className="text-xs text-maroon-600 mt-1">Last 30 days</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Profiles Table */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800">Alumni Profile Directory</CardTitle>
                        <CardDescription className="text-maroon-600">
                            Showing {profiles.length} of {total} profiles
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-beige-50">
                                        <TableHead className="text-maroon-800 font-semibold">Personal Info</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Contact</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Academic</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Employment</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Profile Status</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {profiles.map((profile) => (
                                        <TableRow key={profile.id} className="hover:bg-beige-50">
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="font-medium text-maroon-800">
                                                        {profile.first_name} {profile.last_name}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        ID: {profile.student_id}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {profile.gender} • {profile.birth_date ? new Date(profile.birth_date).getFullYear() : 'N/A'}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="flex items-center text-sm">
                                                        <Mail className="h-3 w-3 mr-1 text-gray-400" />
                                                        {profile.user.email}
                                                    </div>
                                                    {profile.phone && (
                                                        <div className="flex items-center text-sm">
                                                            <Phone className="h-3 w-3 mr-1 text-gray-400" />
                                                            {profile.phone}
                                                        </div>
                                                    )}
                                                    {profile.city && (
                                                        <div className="flex items-center text-sm">
                                                            <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                                                            {profile.city}, {profile.country}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="font-medium text-sm">
                                                        {profile.degree_program}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        Class of {profile.graduation_year}
                                                    </div>
                                                    {profile.gpa && (
                                                        <div className="text-xs text-gray-500">
                                                            GPA: {profile.gpa}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-2">
                                                    {getEmploymentStatusBadge(profile.employment_status)}
                                                    {profile.current_job_title && (
                                                        <div className="text-sm">
                                                            <div className="font-medium">{profile.current_job_title}</div>
                                                            <div className="text-gray-600">{profile.current_employer}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-2">
                                                    {getProfileCompletionBadge(profile.profile_completed)}
                                                    <div className="text-xs text-gray-500">
                                                        Created: {formatDate(profile.created_at)}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-end space-x-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewProfile(profile)}
                                                        className="text-maroon-700 hover:text-maroon-800 hover:bg-maroon-50 h-8 w-8 p-0 rounded-full transition-colors"
                                                        title="View Full Profile"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditProfile(profile)}
                                                        className="text-blue-700 hover:text-blue-800 hover:bg-blue-50 h-8 w-8 p-0 rounded-full transition-colors"
                                                        title="Edit Profile"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleSendEmail(profile)}
                                                        className="text-green-700 hover:text-green-800 hover:bg-green-50 h-8 w-8 p-0 rounded-full transition-colors"
                                                        title="Send Email"
                                                    >
                                                        <Mail className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-beige-200">
                                <div className="text-sm text-gray-700">
                                    Showing page {currentPage} of {totalPages}
                                </div>
                                <div className="space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* View Profile Modal */}
                <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
                        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                            <DialogHeader className="relative">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setViewModalOpen(false)}
                                    className="absolute right-0 top-0 h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                                <DialogTitle className="text-xl text-maroon-800 pr-10 flex items-center">
                                    <User className="h-5 w-5 mr-2" />
                                    Alumni Profile Details
                                </DialogTitle>
                                <DialogDescription className="text-gray-600 mt-1">
                                    Complete profile information for {selectedProfile?.first_name} {selectedProfile?.last_name}
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        <div className="px-6 py-4">

                            {selectedProfile && (
                                <div className="space-y-6">
                                    {/* Personal Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card className="border-beige-200">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-lg text-maroon-800 flex items-center">
                                                    <User className="h-5 w-5 mr-2" />
                                                    Personal Information
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                                                    <p className="text-sm text-gray-900">
                                                        {selectedProfile.first_name} {selectedProfile.last_name}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600">Student ID</label>
                                                    <p className="text-sm text-gray-900">{selectedProfile.student_id}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600">Gender</label>
                                                    <p className="text-sm text-gray-900">{selectedProfile.gender}</p>
                                                </div>
                                                {selectedProfile.birth_date && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Birth Date</label>
                                                        <p className="text-sm text-gray-900">
                                                            {new Date(selectedProfile.birth_date).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        <Card className="border-beige-200">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-lg text-maroon-800 flex items-center">
                                                    <Mail className="h-5 w-5 mr-2" />
                                                    Contact Information
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600">Email</label>
                                                    <p className="text-sm text-gray-900 flex items-center">
                                                        <Mail className="h-3 w-3 mr-1" />
                                                        {selectedProfile.user.email}
                                                    </p>
                                                </div>
                                                {selectedProfile.phone && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Phone</label>
                                                        <p className="text-sm text-gray-900 flex items-center">
                                                            <Phone className="h-3 w-3 mr-1" />
                                                            {selectedProfile.phone}
                                                        </p>
                                                    </div>
                                                )}
                                                {selectedProfile.city && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Location</label>
                                                        <p className="text-sm text-gray-900 flex items-center">
                                                            <MapPin className="h-3 w-3 mr-1" />
                                                            {selectedProfile.city}, {selectedProfile.country}
                                                        </p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Academic Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card className="border-beige-200">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-lg text-maroon-800 flex items-center">
                                                    <GraduationCap className="h-5 w-5 mr-2" />
                                                    Academic Details
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600">Degree Program</label>
                                                    <p className="text-sm text-gray-900">{selectedProfile.degree_program}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600">Graduation Year</label>
                                                    <p className="text-sm text-gray-900">Class of {selectedProfile.graduation_year}</p>
                                                </div>
                                                {selectedProfile.gpa && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">GPA</label>
                                                        <p className="text-sm text-gray-900">{selectedProfile.gpa}</p>
                                                    </div>
                                                )}
                                                {selectedProfile.batch && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Batch</label>
                                                        <p className="text-sm text-gray-900">{selectedProfile.batch.name}</p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        <Card className="border-beige-200">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-lg text-maroon-800 flex items-center">
                                                    <Briefcase className="h-5 w-5 mr-2" />
                                                    Employment Information
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600">Employment Status</label>
                                                    <div className="mt-1">
                                                        {getEmploymentStatusBadge(selectedProfile.employment_status)}
                                                    </div>
                                                </div>
                                                {selectedProfile.current_job_title && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Job Title</label>
                                                        <p className="text-sm text-gray-900">{selectedProfile.current_job_title}</p>
                                                    </div>
                                                )}
                                                {selectedProfile.current_employer && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Current Employer</label>
                                                        <p className="text-sm text-gray-900">{selectedProfile.current_employer}</p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Profile Status */}
                                    <Card className="border-beige-200">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg text-maroon-800">Profile Status</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-600">Completion Status</p>
                                                    <div className="mt-1">
                                                        {getProfileCompletionBadge(selectedProfile.profile_completed)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-600">Registration Date</p>
                                                    <p className="text-sm text-gray-900">{formatDate(selectedProfile.created_at)}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                                        <div className="flex flex-1 gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => handleSendEmail(selectedProfile)}
                                                className="flex-1 border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
                                            >
                                                <Mail className="h-4 w-4 mr-2" />
                                                Send Email
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setViewModalOpen(false);
                                                    handleEditProfile(selectedProfile);
                                                }}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit Profile
                                            </Button>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={() => setViewModalOpen(false)}
                                            className="sm:w-auto border-gray-300 text-gray-600 hover:bg-gray-50"
                                        >
                                            Close
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Edit Profile Modal */}
                <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
                        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                            <DialogHeader className="relative">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditModalOpen(false)}
                                    className="absolute right-0 top-0 h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                                <DialogTitle className="text-xl text-maroon-800 pr-10 flex items-center">
                                    <Edit className="h-5 w-5 mr-2" />
                                    Edit Alumni Profile
                                </DialogTitle>
                                <DialogDescription className="text-gray-600 mt-1">
                                    Update profile information for {selectedProfile?.first_name} {selectedProfile?.last_name}
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        <div className="px-6 py-4">

                            {selectedProfile && (
                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    {/* Personal Information */}
                                    <Card className="border-beige-200">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg text-maroon-800">Personal Information</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">First Name</label>
                                                    <Input
                                                        name="first_name"
                                                        value={editFormData.first_name}
                                                        onChange={(e) => setEditFormData((prev: EditFormData) => ({
                                                            ...prev,
                                                            first_name: e.target.value
                                                        }))}
                                                        className="mt-1"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Last Name</label>
                                                    <Input
                                                        name="last_name"
                                                        value={editFormData.last_name}
                                                        onChange={(e) => setEditFormData((prev: EditFormData) => ({
                                                            ...prev,
                                                            last_name: e.target.value
                                                        }))}
                                                        className="mt-1"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Student ID</label>
                                                    <Input
                                                        name="student_id"
                                                        value={editFormData.student_id}
                                                        onChange={(e) => setEditFormData((prev: EditFormData) => ({
                                                            ...prev,
                                                            student_id: e.target.value
                                                        }))}
                                                        className="mt-1"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Gender</label>
                                                    <Select
                                                        value={editFormData.gender}
                                                        onValueChange={(value) => setEditFormData((prev: EditFormData) => ({
                                                            ...prev,
                                                            gender: value
                                                        }))}
                                                    >
                                                        <SelectTrigger className="mt-1">
                                                            <SelectValue placeholder="Select gender" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Male">Male</SelectItem>
                                                            <SelectItem value="Female">Female</SelectItem>
                                                            <SelectItem value="Other">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Birth Date</label>
                                                    <Input
                                                        type="date"
                                                        name="birth_date"
                                                        value={editFormData.birth_date || ''}
                                                        onChange={(e) => setEditFormData((prev: EditFormData) => ({
                                                            ...prev,
                                                            birth_date: e.target.value
                                                        }))}
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Phone</label>
                                                    <Input
                                                        name="phone"
                                                        value={editFormData.phone || ''}
                                                        onChange={(e) => setEditFormData((prev: EditFormData) => ({
                                                            ...prev,
                                                            phone: e.target.value
                                                        }))}
                                                        className="mt-1"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Location Information */}
                                    <Card className="border-beige-200">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg text-maroon-800">Location Information</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">City</label>
                                                    <Input
                                                        name="city"
                                                        value={editFormData.city || ''}
                                                        onChange={(e) => setEditFormData((prev: EditFormData) => ({
                                                            ...prev,
                                                            city: e.target.value
                                                        }))}
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Country</label>
                                                    <Input
                                                        name="country"
                                                        value={editFormData.country || ''}
                                                        onChange={(e) => setEditFormData((prev: EditFormData) => ({
                                                            ...prev,
                                                            country: e.target.value
                                                        }))}
                                                        className="mt-1"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Academic Information */}
                                    <Card className="border-beige-200">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg text-maroon-800">Academic Information</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Degree Program</label>
                                                    <Input
                                                        name="degree_program"
                                                        value={editFormData.degree_program}
                                                        onChange={(e) => setEditFormData((prev: EditFormData) => ({
                                                            ...prev,
                                                            degree_program: e.target.value
                                                        }))}
                                                        className="mt-1"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Graduation Year</label>
                                                    <Input
                                                        type="number"
                                                        name="graduation_year"
                                                        value={editFormData.graduation_year}
                                                        onChange={(e) => setEditFormData((prev: EditFormData) => ({
                                                            ...prev,
                                                            graduation_year: parseInt(e.target.value)
                                                        }))}
                                                        className="mt-1"
                                                        min="1900"
                                                        max={new Date().getFullYear()}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">GPA</label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        name="gpa"
                                                        value={editFormData.gpa || ''}
                                                        onChange={(e) => setEditFormData((prev: EditFormData) => ({
                                                            ...prev,
                                                            gpa: e.target.value ? parseFloat(e.target.value) : null
                                                        }))}
                                                        className="mt-1"
                                                        min="0"
                                                        max="4"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Batch</label>
                                                    <Select
                                                        value={editFormData.batch_id?.toString() || 'none'}
                                                        onValueChange={(value) => setEditFormData((prev: EditFormData) => ({
                                                            ...prev,
                                                            batch_id: value === 'none' ? null : parseInt(value)
                                                        }))}
                                                    >
                                                        <SelectTrigger className="mt-1">
                                                            <SelectValue placeholder="Select batch" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">No Batch</SelectItem>
                                                            {batches.map((batch) => (
                                                                <SelectItem key={batch.id} value={batch.id.toString()}>
                                                                    {batch.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Employment Information */}
                                    <Card className="border-beige-200">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg text-maroon-800">Employment Information</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Employment Status</label>
                                                <Select
                                                    value={editFormData.employment_status || ''}
                                                    onValueChange={(value) => setEditFormData((prev: EditFormData) => ({
                                                        ...prev,
                                                        employment_status: value
                                                    }))}
                                                >
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder="Select employment status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Employed">Employed</SelectItem>
                                                        <SelectItem value="Self-employed">Self-employed</SelectItem>
                                                        <SelectItem value="Unemployed">Unemployed</SelectItem>
                                                        <SelectItem value="Student">Student</SelectItem>
                                                        <SelectItem value="Retired">Retired</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Current Job Title</label>
                                                    <Input
                                                        name="current_job_title"
                                                        value={editFormData.current_job_title || ''}
                                                        onChange={(e) => setEditFormData((prev: EditFormData) => ({
                                                            ...prev,
                                                            current_job_title: e.target.value
                                                        }))}
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Current Employer</label>
                                                    <Input
                                                        name="current_employer"
                                                        value={editFormData.current_employer || ''}
                                                        onChange={(e) => setEditFormData((prev: EditFormData) => ({
                                                            ...prev,
                                                            current_employer: e.target.value
                                                        }))}
                                                        className="mt-1"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-gray-200">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setEditModalOpen(false)}
                                            disabled={updating}
                                            className="sm:w-auto border-gray-300 text-gray-600 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="bg-maroon-700 hover:bg-maroon-800 text-white sm:ml-auto min-w-[140px]"
                                            disabled={updating}
                                        >
                                            {updating ? (
                                                <>
                                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Update Profile
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminBaseLayout>
    );
}
