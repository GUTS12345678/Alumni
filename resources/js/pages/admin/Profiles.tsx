import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    Calendar
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
    }, [fetchProfiles]);

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
                                                <div className="flex items-center space-x-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-maroon-700 hover:text-maroon-800 hover:bg-maroon-50"
                                                        title="View Full Profile"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-blue-700 hover:text-blue-800 hover:bg-blue-50"
                                                        title="Edit Profile"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-green-700 hover:text-green-800 hover:bg-green-50"
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
            </div>
        </AdminBaseLayout>
    );
}