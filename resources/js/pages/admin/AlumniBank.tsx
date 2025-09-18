import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';
import {
    Users,
    Search,
    Download,
    Filter,
    RefreshCw,
    Eye,
    Mail,
    Phone,
    Building,
    GraduationCap
} from 'lucide-react';
import AdminBaseLayout from '../../components/base/AdminBaseLayout';

interface User {
    id: number;
    email: string;
    role: string;
    status: string;
}

interface Props {
    user: User;
}

interface AlumniProfile {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    degree_program: string;
    graduation_year: number;
    employment_status: string;
    current_employer?: string;
    current_job_title?: string;
    created_at: string;
}

interface AlumniResponse {
    data: AlumniProfile[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export default function AlumniBank({ user }: Props) {
    const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAlumniCallback = React.useCallback(async () => {
        try {
            setLoading(currentPage === 1);
            setRefreshing(currentPage !== 1);

            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            params.append('page', currentPage.toString());
            params.append('per_page', '15');

            const response = await fetch(`/api/v1/admin/alumni?${params}`, {
                credentials: 'include', // Include session cookies
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/login';
                    return;
                }
                throw new Error('Failed to fetch alumni data');
            }

            const data: { success: boolean; data: AlumniResponse } = await response.json();

            if (data.success) {
                setAlumni(data.data.data);
                setCurrentPage(data.data.current_page);
                setTotalPages(data.data.last_page);
                setTotal(data.data.total);
            }
        } catch (err) {
            console.error('Alumni fetch error:', err);
            setError('Failed to load alumni data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, searchTerm]);

    useEffect(() => {
        fetchAlumniCallback();
    }, [fetchAlumniCallback]);



    const handleExport = async () => {
        try {
            const response = await fetch('/api/v1/admin/alumni/export', {
                credentials: 'include', // Include session cookies
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.csv_content) {
                    // Decode base64 CSV content
                    const csvContent = atob(data.data.csv_content);
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = 'alumni-data.csv';
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

    const getEmploymentStatusBadge = (status: string) => {
        const statusColors = {
            'employed': 'bg-green-100 text-green-800',
            'unemployed': 'bg-red-100 text-red-800',
            'self-employed': 'bg-blue-100 text-blue-800',
            'pursuing_education': 'bg-purple-100 text-purple-800',
            'not_specified': 'bg-gray-100 text-gray-800',
        };

        return (
            <Badge className={statusColors[status as keyof typeof statusColors] || statusColors.not_specified}>
                {status.replace('_', ' ').toUpperCase()}
            </Badge>
        );
    };

    if (loading) {
        return (
            <AdminBaseLayout title="Alumni Bank" user={user}>
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="h-8 w-8 text-maroon-600 animate-spin" />
                        <span className="text-maroon-800 font-medium">Loading alumni data...</span>
                    </div>
                </div>
            </AdminBaseLayout>
        );
    }

    if (error) {
        return (
            <AdminBaseLayout title="Alumni Bank" user={user}>
                <Card className="border-red-200">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-red-600 mb-4">{error}</p>
                            <Button onClick={() => fetchAlumniCallback()} className="bg-maroon-700 hover:bg-maroon-800">
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
        <AdminBaseLayout title="Alumni Bank" user={user}>
            <div className="space-y-6">
                {/* Header with Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-maroon-800">Alumni Management</h2>
                        <p className="text-maroon-600">Manage and view all registered alumni profiles</p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={() => fetchAlumniCallback()}
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
                            Export CSV
                        </Button>
                    </div>
                </div>

                {/* Search and Filters */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg text-maroon-800 flex items-center">
                            <Search className="h-5 w-5 mr-2" />
                            Search & Filter
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        placeholder="Search by name, email, or company..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 border-beige-300 focus:border-maroon-500 focus:ring-maroon-500"
                                    />
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                More Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Alumni Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">Total Alumni</CardTitle>
                            <Users className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-maroon-800">{total}</div>
                            <p className="text-xs text-maroon-600 mt-1">Registered profiles</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Alumni Table */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800">Alumni Directory</CardTitle>
                        <CardDescription className="text-maroon-600">
                            Showing {alumni.length} of {total} alumni
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-beige-50">
                                        <TableHead className="text-maroon-800 font-semibold">Name</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Contact</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Education</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Employment</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Status</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {alumni.map((alumnus) => (
                                        <TableRow key={alumnus.id} className="hover:bg-beige-50">
                                            <TableCell>
                                                <div className="font-medium text-maroon-800">
                                                    {alumnus.first_name} {alumnus.last_name}
                                                </div>
                                                <div className="text-sm text-gray-600">ID: {alumnus.id}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="flex items-center text-sm">
                                                        <Mail className="h-3 w-3 mr-1 text-gray-400" />
                                                        {alumnus.email}
                                                    </div>
                                                    {alumnus.phone && (
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <Phone className="h-3 w-3 mr-1 text-gray-400" />
                                                            {alumnus.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="flex items-center text-sm font-medium">
                                                        <GraduationCap className="h-3 w-3 mr-1 text-gray-400" />
                                                        {alumnus.degree_program}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        Class of {alumnus.graduation_year}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    {alumnus.current_job_title && (
                                                        <div className="text-sm font-medium">
                                                            {alumnus.current_job_title}
                                                        </div>
                                                    )}
                                                    {alumnus.current_employer && (
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <Building className="h-3 w-3 mr-1 text-gray-400" />
                                                            {alumnus.current_employer}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getEmploymentStatusBadge(alumnus.employment_status)}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-maroon-700 hover:text-maroon-800 hover:bg-maroon-50"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
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