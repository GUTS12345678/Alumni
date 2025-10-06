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
    GraduationCap,
    Search,
    Plus,
    Eye,
    Edit,
    Trash2,
    Users,
    Calendar,
    RefreshCw,
    BarChart3
} from 'lucide-react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';

interface Batch {
    id: number;
    name: string;
    graduation_year: number;
    description: string;
    status: 'active' | 'inactive' | 'archived';
    created_at: string;
    updated_at: string;
    alumni_count?: number;
}

interface BatchesResponse {
    data: Batch[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface User {
    id: number;
    email: string;
    role: string;
    status: string;
}

interface Props {
    user: User;
}

export default function Batches({ user }: Props) {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    const fetchBatches = useCallback(async () => {
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
            params.append('page', currentPage.toString());
            params.append('per_page', '15');

            const response = await fetch(`/api/v1/admin/batches?${params}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('auth_token');
                    window.location.href = '/login';
                    return;
                }
                throw new Error('Failed to fetch batches data');
            }

            const data: { success: boolean; data: BatchesResponse } = await response.json();

            if (data.success && data.data && data.data.data) {
                setBatches(data.data.data);
                setCurrentPage(data.data.current_page);
                setTotalPages(data.data.last_page);
                setTotal(data.data.total);
            } else {
                setError('Invalid response format from server');
            }
        } catch (err) {
            console.error('Batches fetch error:', err);
            setError('Failed to load batches data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, searchTerm]);

    useEffect(() => {
        fetchBatches();
    }, [fetchBatches]);

    const getStatusBadge = (status: string) => {
        const statusColors = {
            'active': 'bg-green-100 text-green-800',
            'inactive': 'bg-gray-100 text-gray-800',
            'archived': 'bg-blue-100 text-blue-800',
        };

        return (
            <Badge className={statusColors[status as keyof typeof statusColors] || statusColors.active}>
                {status.toUpperCase()}
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

    if (loading) {
        return (
            <AdminBaseLayout title="Batch Management" user={user}>
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="h-8 w-8 text-maroon-600 animate-spin" />
                        <span className="text-maroon-800 font-medium">Loading batches...</span>
                    </div>
                </div>
            </AdminBaseLayout>
        );
    }

    if (error) {
        return (
            <AdminBaseLayout title="Batch Management" user={user}>
                <Card className="border-red-200">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-red-600 mb-4">{error}</p>
                            <Button onClick={() => fetchBatches()} className="bg-maroon-700 hover:bg-maroon-800">
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
        <AdminBaseLayout title="Batch Management" user={user}>
            <div className="space-y-6">
                {/* Header with Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-maroon-800">Batch Management</h2>
                        <p className="text-maroon-600">Manage graduation year cohorts and alumni batches</p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={() => fetchBatches()}
                            variant="outline"
                            size="sm"
                            disabled={refreshing}
                            className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>

                        <Button
                            className="bg-maroon-700 hover:bg-maroon-800 text-white"
                            size="sm"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Batch
                        </Button>
                    </div>
                </div>

                {/* Search Bar */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg text-maroon-800 flex items-center">
                            <Search className="h-5 w-5 mr-2" />
                            Search Batches
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search by batch name or graduation year..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 border-beige-300 focus:border-maroon-500 focus:ring-maroon-500"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Batch Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">Total Batches</CardTitle>
                            <GraduationCap className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-maroon-800">{total}</div>
                            <p className="text-xs text-maroon-600 mt-1">All graduation cohorts</p>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">Active Batches</CardTitle>
                            <Users className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {batches.filter(b => b.status === 'active').length}
                            </div>
                            <p className="text-xs text-maroon-600 mt-1">Currently active</p>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">Latest Year</CardTitle>
                            <Calendar className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {Math.max(...batches.map(b => b.graduation_year), 0)}
                            </div>
                            <p className="text-xs text-maroon-600 mt-1">Most recent graduation</p>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">Total Alumni</CardTitle>
                            <BarChart3 className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">
                                {batches.reduce((sum, batch) => sum + (batch.alumni_count || 0), 0)}
                            </div>
                            <p className="text-xs text-maroon-600 mt-1">Across all batches</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Batches Table */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800">Graduation Batches</CardTitle>
                        <CardDescription className="text-maroon-600">
                            Showing {batches.length} of {total} batches
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-beige-50">
                                        <TableHead className="text-maroon-800 font-semibold">Batch Details</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Graduation Year</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Alumni Count</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Status</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Created</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {batches.map((batch) => (
                                        <TableRow key={batch.id} className="hover:bg-beige-50">
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="font-medium text-maroon-800">
                                                        {batch.name}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        {batch.description}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        ID: {batch.id}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Calendar className="h-4 w-4 text-maroon-600" />
                                                    <span className="font-medium text-maroon-800">
                                                        {batch.graduation_year}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Users className="h-4 w-4 text-blue-600" />
                                                    <span className="font-medium text-blue-800">
                                                        {batch.alumni_count || 0}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(batch.status)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {formatDate(batch.created_at)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-maroon-700 hover:text-maroon-800 hover:bg-maroon-50"
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-blue-700 hover:text-blue-800 hover:bg-blue-50"
                                                        title="Edit Batch"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-green-700 hover:text-green-800 hover:bg-green-50"
                                                        title="View Alumni"
                                                        onClick={() => window.location.href = `/admin/alumni?batch_id=${batch.id}`}
                                                    >
                                                        <Users className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-700 hover:text-red-800 hover:bg-red-50"
                                                        title="Delete Batch"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
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