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
    FileText,
    Search,
    Plus,
    Eye,
    Edit,
    Trash2,
    Download,
    RefreshCw,
    Calendar,
    Users,
    BarChart3,
    Clock
} from 'lucide-react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';

interface Survey {
    id: number;
    title: string;
    description: string;
    status: 'draft' | 'active' | 'closed' | 'archived';
    created_at: string;
    updated_at: string;
    start_date?: string;
    end_date?: string;
    responses_count: number;
    questions_count: number;
    target_audience: string;
}

interface SurveyResponse {
    data: Survey[];
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

export default function SurveyBank({ user }: Props) {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    const fetchSurveys = useCallback(async () => {
        try {
            setLoading(currentPage === 1);
            setRefreshing(currentPage !== 1);

            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            params.append('page', currentPage.toString());
            params.append('per_page', '15');

            const response = await fetch(`/api/v1/admin/surveys?${params}`, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/login';
                    return;
                }
                throw new Error('Failed to fetch surveys data');
            }

            const data: { success: boolean; data: SurveyResponse } = await response.json();

            if (data.success) {
                setSurveys(data.data.data);
                setCurrentPage(data.data.current_page);
                setTotalPages(data.data.last_page);
                setTotal(data.data.total);
            }
        } catch (err) {
            console.error('Surveys fetch error:', err);
            setError('Failed to load surveys data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, searchTerm]);

    useEffect(() => {
        fetchSurveys();
    }, [fetchSurveys]);

    const handleExport = async () => {
        try {
            const response = await fetch('/api/v1/admin/surveys/export', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.csv_content) {
                    const csvContent = atob(data.data.csv_content);
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = 'surveys-data.csv';
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

    const getStatusBadge = (status: string) => {
        const statusColors = {
            'draft': 'bg-gray-100 text-gray-800',
            'active': 'bg-green-100 text-green-800',
            'closed': 'bg-red-100 text-red-800',
            'archived': 'bg-blue-100 text-blue-800',
        };

        return (
            <Badge className={statusColors[status as keyof typeof statusColors] || statusColors.draft}>
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
            <AdminBaseLayout title="Survey Bank" user={user}>
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="h-8 w-8 text-maroon-600 animate-spin" />
                        <span className="text-maroon-800 font-medium">Loading surveys...</span>
                    </div>
                </div>
            </AdminBaseLayout>
        );
    }

    if (error) {
        return (
            <AdminBaseLayout title="Survey Bank" user={user}>
                <Card className="border-red-200">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-red-600 mb-4">{error}</p>
                            <Button onClick={() => fetchSurveys()} className="bg-maroon-700 hover:bg-maroon-800">
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
        <AdminBaseLayout title="Survey Bank" user={user}>
            <div className="space-y-6">
                {/* Header with Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-maroon-800">Survey Management</h2>
                        <p className="text-maroon-600">Create, manage and analyze alumni surveys</p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={() => fetchSurveys()}
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
                            Export Data
                        </Button>

                        <Button
                            className="bg-maroon-700 hover:bg-maroon-800 text-white"
                            size="sm"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            New Survey
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
                                        placeholder="Search surveys by title or description..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 border-beige-300 focus:border-maroon-500 focus:ring-maroon-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Survey Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">Total Surveys</CardTitle>
                            <FileText className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-maroon-800">{total}</div>
                            <p className="text-xs text-maroon-600 mt-1">All surveys created</p>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">Active Surveys</CardTitle>
                            <Clock className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {surveys.filter(s => s.status === 'active').length}
                            </div>
                            <p className="text-xs text-maroon-600 mt-1">Currently accepting responses</p>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">Total Responses</CardTitle>
                            <Users className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-maroon-800">
                                {surveys.reduce((sum, survey) => sum + survey.responses_count, 0)}
                            </div>
                            <p className="text-xs text-maroon-600 mt-1">Across all surveys</p>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">Avg Response Rate</CardTitle>
                            <BarChart3 className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-maroon-800">
                                {surveys.length > 0
                                    ? Math.round(surveys.reduce((sum, survey) => sum + survey.responses_count, 0) / surveys.length)
                                    : 0}
                            </div>
                            <p className="text-xs text-maroon-600 mt-1">Responses per survey</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Surveys Table */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800">Survey Directory</CardTitle>
                        <CardDescription className="text-maroon-600">
                            Showing {surveys.length} of {total} surveys
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-beige-50">
                                        <TableHead className="text-maroon-800 font-semibold">Survey Details</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Status</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Timeline</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Responses</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Questions</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {surveys.map((survey) => (
                                        <TableRow key={survey.id} className="hover:bg-beige-50">
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="font-medium text-maroon-800">
                                                        {survey.title}
                                                    </div>
                                                    <div className="text-sm text-gray-600 max-w-md truncate">
                                                        {survey.description}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        Target: {survey.target_audience}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(survey.status)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="flex items-center text-sm">
                                                        <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                                                        Created: {formatDate(survey.created_at)}
                                                    </div>
                                                    {survey.start_date && (
                                                        <div className="text-xs text-green-600">
                                                            Start: {formatDate(survey.start_date)}
                                                        </div>
                                                    )}
                                                    {survey.end_date && (
                                                        <div className="text-xs text-red-600">
                                                            End: {formatDate(survey.end_date)}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-maroon-800">
                                                        {survey.responses_count}
                                                    </div>
                                                    <div className="text-xs text-gray-600">responses</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-maroon-800">
                                                        {survey.questions_count}
                                                    </div>
                                                    <div className="text-xs text-gray-600">questions</div>
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
                                                        title="Edit Survey"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-700 hover:text-red-800 hover:bg-red-50"
                                                        title="Delete Survey"
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