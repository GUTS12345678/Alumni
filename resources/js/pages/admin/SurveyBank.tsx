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
    Clock,
    X,
    List
} from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import QuestionsManager from '@/components/QuestionsManager';

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

    // Modal states
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [questionsModalOpen, setQuestionsModalOpen] = useState(false);
    const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
    const [editSurveyForm, setEditSurveyForm] = useState<{
        title: string;
        description: string;
        target_audience: string;
        status: 'draft' | 'active' | 'closed' | 'archived';
        start_date: string;
        end_date: string;
    }>({
        title: '',
        description: '',
        target_audience: '',
        status: 'draft',
        start_date: '',
        end_date: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchSurveys = useCallback(async () => {
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

            const response = await axios.get(`/api/v1/admin/surveys?${params}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            if (response.data.success) {
                setSurveys(response.data.data.data);
                setCurrentPage(response.data.data.current_page);
                setTotalPages(response.data.data.last_page);
                setTotal(response.data.data.total);
                setError(null);
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

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage !== 1) {
                setCurrentPage(1);
            } else {
                fetchSurveys();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleExport = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const response = await axios.get('/api/v1/admin/surveys/export', {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            if (response.data.success && response.data.data.csv_content) {
                const csvContent = atob(response.data.data.csv_content);
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `surveys-export-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                alert('Surveys data exported successfully!');
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export surveys data. Please try again.');
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

    // Action handlers
    const handleNewSurvey = () => {
        window.location.href = '/admin/surveys/create';
    };

    const handleViewSurvey = (survey: Survey) => {
        setSelectedSurvey(survey);
        setViewModalOpen(true);
    };

    const handleEditSurvey = (survey: Survey) => {
        setSelectedSurvey(survey);
        setEditSurveyForm({
            title: survey.title,
            description: survey.description,
            target_audience: survey.target_audience,
            status: survey.status,
            start_date: survey.start_date || '',
            end_date: survey.end_date || ''
        });
        setEditModalOpen(true);
    };

    const handleDeleteSurvey = (survey: Survey) => {
        setSelectedSurvey(survey);
        setDeleteModalOpen(true);
    };



    const handleUpdateSurvey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSurvey) return;

        setSubmitting(true);

        try {
            await axios.get('/sanctum/csrf-cookie');
            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const response = await axios.put(`/api/v1/admin/surveys/${selectedSurvey.id}`, editSurveyForm, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            if (response.data.success) {
                setEditModalOpen(false);
                fetchSurveys();
                alert('Survey updated successfully!');
            }
        } catch (error: unknown) {
            console.error('Error updating survey:', error);
            const axiosError = error as { response?: { data?: { message?: string } } };
            alert('Error: ' + (axiosError.response?.data?.message || 'Failed to update survey'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedSurvey) return;

        setSubmitting(true);

        try {
            await axios.get('/sanctum/csrf-cookie');
            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const response = await axios.delete(`/api/v1/admin/surveys/${selectedSurvey.id}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            if (response.data.success) {
                setDeleteModalOpen(false);
                fetchSurveys();
                alert('Survey deleted successfully!');
            }
        } catch (error: unknown) {
            console.error('Error deleting survey:', error);
            const axiosError = error as { response?: { data?: { message?: string } } };
            alert('Error: ' + (axiosError.response?.data?.message || 'Failed to delete survey'));
        } finally {
            setSubmitting(false);
        }
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
                            onClick={handleNewSurvey}
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
                                                        onClick={() => handleViewSurvey(survey)}
                                                        className="text-maroon-700 hover:text-maroon-800 hover:bg-maroon-50"
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditSurvey(survey)}
                                                        className="text-blue-700 hover:text-blue-800 hover:bg-blue-50"
                                                        title="Edit Survey"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteSurvey(survey)}
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



                {/* View Survey Modal */}
                <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader className="relative">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewModalOpen(false)}
                                className="absolute right-0 top-0 h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            <DialogTitle className="text-xl text-maroon-800 pr-8 flex items-center">
                                <FileText className="h-5 w-5 mr-2" />
                                Survey Details
                            </DialogTitle>
                            <DialogDescription>
                                {selectedSurvey?.title}
                            </DialogDescription>
                        </DialogHeader>

                        {selectedSurvey && (
                            <div className="space-y-6">
                                {/* Survey Information */}
                                <Card className="border-beige-200">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-maroon-800">Survey Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-600">Title</label>
                                                <p className="text-sm text-gray-900 mt-1">{selectedSurvey.title}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-600">Status</label>
                                                <div className="mt-1">
                                                    {getStatusBadge(selectedSurvey.status)}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Description</label>
                                            <p className="text-sm text-gray-900 mt-1">{selectedSurvey.description}</p>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Target Audience</label>
                                            <p className="text-sm text-gray-900 mt-1">{selectedSurvey.target_audience}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-600">Created</label>
                                                <p className="text-sm text-gray-900 mt-1">{formatDate(selectedSurvey.created_at)}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-600">Last Updated</label>
                                                <p className="text-sm text-gray-900 mt-1">{formatDate(selectedSurvey.updated_at)}</p>
                                            </div>
                                        </div>

                                        {(selectedSurvey.start_date || selectedSurvey.end_date) && (
                                            <div className="grid grid-cols-2 gap-4">
                                                {selectedSurvey.start_date && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Start Date</label>
                                                        <p className="text-sm text-gray-900 mt-1">{formatDate(selectedSurvey.start_date)}</p>
                                                    </div>
                                                )}
                                                {selectedSurvey.end_date && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">End Date</label>
                                                        <p className="text-sm text-gray-900 mt-1">{formatDate(selectedSurvey.end_date)}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Statistics */}
                                <div className="grid grid-cols-2 gap-4">
                                    <Card className="border-beige-200">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg text-maroon-800 flex items-center">
                                                <Users className="h-5 w-5 mr-2" />
                                                Responses
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-3xl font-bold text-maroon-800">
                                                {selectedSurvey.responses_count}
                                            </div>
                                            <p className="text-sm text-gray-600">Total responses received</p>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-beige-200">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg text-maroon-800 flex items-center">
                                                <BarChart3 className="h-5 w-5 mr-2" />
                                                Questions
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-3xl font-bold text-maroon-800">
                                                {selectedSurvey.questions_count}
                                            </div>
                                            <p className="text-sm text-gray-600">Questions in this survey</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end space-x-2 pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setViewModalOpen(false);
                                            setQuestionsModalOpen(true);
                                        }}
                                        className="border-green-300 text-green-700 hover:bg-green-50"
                                    >
                                        <List className="h-4 w-4 mr-2" />
                                        Manage Questions
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setViewModalOpen(false);
                                            handleEditSurvey(selectedSurvey);
                                        }}
                                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Survey
                                    </Button>
                                    <Button
                                        onClick={() => setViewModalOpen(false)}
                                        className="bg-maroon-700 hover:bg-maroon-800"
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Edit Survey Modal */}
                <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader className="relative">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditModalOpen(false)}
                                className="absolute right-0 top-0 h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            <DialogTitle className="text-xl text-maroon-800 pr-8">
                                Edit Survey
                            </DialogTitle>
                            <DialogDescription>
                                Update survey information and settings
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleUpdateSurvey} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Survey Title *</label>
                                    <Input
                                        value={editSurveyForm.title}
                                        onChange={(e) => setEditSurveyForm(prev => ({
                                            ...prev,
                                            title: e.target.value
                                        }))}
                                        placeholder="Enter survey title"
                                        className="mt-1"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Description *</label>
                                    <Textarea
                                        value={editSurveyForm.description}
                                        onChange={(e) => setEditSurveyForm(prev => ({
                                            ...prev,
                                            description: e.target.value
                                        }))}
                                        placeholder="Describe the purpose and scope of this survey"
                                        className="mt-1"
                                        rows={3}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Target Audience *</label>
                                    <Input
                                        value={editSurveyForm.target_audience}
                                        onChange={(e) => setEditSurveyForm(prev => ({
                                            ...prev,
                                            target_audience: e.target.value
                                        }))}
                                        placeholder="e.g., All Alumni, Class of 2023, Computer Science graduates"
                                        className="mt-1"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Status</label>
                                    <Select
                                        value={editSurveyForm.status}
                                        onValueChange={(value: 'draft' | 'active' | 'closed' | 'archived') =>
                                            setEditSurveyForm(prev => ({ ...prev, status: value }))
                                        }
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Start Date</label>
                                        <Input
                                            type="date"
                                            value={editSurveyForm.start_date}
                                            onChange={(e) => setEditSurveyForm(prev => ({
                                                ...prev,
                                                start_date: e.target.value
                                            }))}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">End Date</label>
                                        <Input
                                            type="date"
                                            value={editSurveyForm.end_date}
                                            onChange={(e) => setEditSurveyForm(prev => ({
                                                ...prev,
                                                end_date: e.target.value
                                            }))}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditModalOpen(false)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-maroon-700 hover:bg-maroon-800"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Update Survey
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}
                <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl text-red-800">
                                Delete Survey
                            </DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete this survey? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedSurvey && (
                            <div className="space-y-4">
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="font-medium text-red-800">{selectedSurvey.title}</div>
                                    <div className="text-sm text-red-600 mt-1">
                                        {selectedSurvey.responses_count} responses • {selectedSurvey.questions_count} questions
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-2 pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={() => setDeleteModalOpen(false)}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleConfirmDelete}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete Survey
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Questions Management Modal */}
                <Dialog open={questionsModalOpen} onOpenChange={setQuestionsModalOpen}>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-xl text-maroon-800 flex items-center">
                                <List className="h-5 w-5 mr-2" />
                                Manage Questions: {selectedSurvey?.title}
                            </DialogTitle>
                            <DialogDescription>
                                Edit, reorder, and manage questions for this survey
                            </DialogDescription>
                        </DialogHeader>

                        {selectedSurvey && (
                            <QuestionsManager
                                surveyId={selectedSurvey.id.toString()}
                                onClose={() => setQuestionsModalOpen(false)}
                                onQuestionsUpdated={() => {
                                    // Refresh surveys list to update question count
                                    fetchSurveys();
                                }}
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AdminBaseLayout>
    );
}