import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
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
    GraduationCap,
    MoreVertical,
    Edit,
    Trash2,
    MessageCircle
} from 'lucide-react';
import AdminBaseLayout from '../../components/base/AdminBaseLayout';
import { useMultiSelect, BulkActionBar, SelectAllCheckbox } from '../../components/ui/multi-select';

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

    // Modal states
    const [selectedAlumni, setSelectedAlumni] = useState<AlumniProfile | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState<Partial<AlumniProfile>>({});
    const [updating, setUpdating] = useState(false);

    // Filter states
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterYear, setFilterYear] = useState<string>('');
    const [filtersOpen, setFiltersOpen] = useState(false);

    // Multi-select state
    const multiSelect = useMultiSelect<number>();
    const [isDeleting, setIsDeleting] = useState(false); const fetchAlumniCallback = React.useCallback(async () => {
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
            if (filterStatus) params.append('employment_status', filterStatus);
            if (filterYear) params.append('graduation_year', filterYear);
            params.append('page', currentPage.toString());
            params.append('per_page', '15');

            const response = await fetch(`/api/v1/admin/alumni?${params}`, {
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
    }, [currentPage, searchTerm, filterStatus, filterYear]);

    useEffect(() => {
        fetchAlumniCallback();
    }, [fetchAlumniCallback]);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1); // Reset to first page when searching/filtering
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [searchTerm, filterStatus, filterYear]);

    // Alumni action handlers
    const handleViewAlumni = (alumni: AlumniProfile) => {
        setSelectedAlumni(alumni);
        setViewModalOpen(true);
    };

    const handleContactAlumni = (alumni: AlumniProfile) => {
        // Open email client with alumni email
        window.location.href = `mailto:${alumni.email}?subject=Alumni Tracer - Contact`;
    };

    const handleEditAlumni = (alumni: AlumniProfile) => {
        setSelectedAlumni(alumni);
        setEditFormData({
            id: alumni.id,
            first_name: alumni.first_name,
            last_name: alumni.last_name,
            email: alumni.email,
            phone: alumni.phone,
            degree_program: alumni.degree_program,
            employment_status: alumni.employment_status,
            current_employer: alumni.current_employer,
            current_job_title: alumni.current_job_title,
            graduation_year: alumni.graduation_year
        });
        setEditModalOpen(true);
    };

    const handleUpdateAlumni = async () => {
        if (!editFormData.id) return;

        setUpdating(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            const response = await fetch(`/api/v1/admin/alumni/${editFormData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || ''
                },
                body: JSON.stringify(editFormData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Update the alumni in the local state
                setAlumni((prevAlumni: AlumniProfile[]) =>
                    prevAlumni.map((alumni: AlumniProfile) =>
                        alumni.id === editFormData.id
                            ? { ...alumni, ...data.data }
                            : alumni
                    )
                );
                setEditModalOpen(false);
                setEditFormData({});
                setSelectedAlumni(null);
                alert('Alumni profile updated successfully!');
                fetchAlumniCallback();
            } else {
                alert('Failed to update alumni profile: ' + (data.message || 'Unknown error'));
            }
        } catch (error: unknown) {
            console.error('Error updating alumni:', error);
            alert('Failed to update alumni profile. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteAlumni = async (alumni: AlumniProfile) => {
        if (!confirm(`Are you sure you want to delete ${alumni.first_name} ${alumni.last_name}?`)) {
            return;
        }

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            const response = await fetch(`/api/v1/admin/alumni/${alumni.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || ''
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Remove from local state
                setAlumni((prevAlumni: AlumniProfile[]) =>
                    prevAlumni.filter((a: AlumniProfile) => a.id !== alumni.id)
                );
                alert('Alumni deleted successfully');
                fetchAlumniCallback();
            } else {
                alert('Failed to delete alumni: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete alumni. Please try again.');
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${multiSelect.selectedCount} alumni?`)) {
            return;
        }

        setIsDeleting(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/v1/admin/alumni/bulk-delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    ids: Array.from(multiSelect.selectedItems)
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                multiSelect.clearSelection();
                fetchAlumniCallback();
                alert(`Successfully deleted ${data.deleted_count} alumni`);
            } else {
                throw new Error(data.message || 'Failed to delete');
            }
        } catch (error) {
            console.error('Bulk delete error:', error);
            alert('Failed to delete alumni. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleExport = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            // Add current filters to export
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (filterStatus) params.append('employment_status', filterStatus);
            if (filterYear) params.append('graduation_year', filterYear);

            const response = await fetch(`/api/v1/admin/alumni/export?${params}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.content) {
                    // Decode base64 CSV content
                    const csvContent = atob(data.data.content);
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = data.data.filename || 'alumni-export.csv';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    alert(`Successfully exported ${data.data.total_records} alumni records!`);
                } else {
                    throw new Error('Invalid response format');
                }
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export alumni data. Please try again.');
        }
    };

    const getEmploymentStatusBadge = (status: string) => {
        const statusColors = {
            'employed': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
            'unemployed': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
            'self-employed': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
            'pursuing_education': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
            'not_specified': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
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
                        <RefreshCw className="h-8 w-8 text-maroon-600 dark:text-maroon-400 animate-spin" />
                        <span className="text-maroon-800 dark:text-maroon-200 font-medium">Loading alumni data...</span>
                    </div>
                </div>
            </AdminBaseLayout>
        );
    }

    if (error) {
        return (
            <AdminBaseLayout title="Alumni Bank" user={user}>
                <Card className="border-red-200 dark:border-red-800">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
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
                        <h2 className="text-2xl font-bold text-maroon-800 dark:text-maroon-200">Alumni Management</h2>
                        <p className="text-maroon-600 dark:text-maroon-400">Manage and view all registered alumni profiles</p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={() => fetchAlumniCallback()}
                            variant="outline"
                            size="sm"
                            disabled={refreshing}
                            className="border-maroon-300 dark:border-maroon-700 text-maroon-700 dark:text-maroon-300 hover:bg-maroon-50 dark:hover:bg-maroon-900/30"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>

                        <Button
                            onClick={handleExport}
                            variant="outline"
                            size="sm"
                            className="border-maroon-300 dark:border-maroon-700 text-maroon-700 dark:text-maroon-300 hover:bg-maroon-50 dark:hover:bg-maroon-900/30"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                </div>

                {/* Search and Filters */}
                <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg text-maroon-800 dark:text-maroon-200 flex items-center">
                            <Search className="h-5 w-5 mr-2" />
                            Search & Filter
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                                    <Input
                                        placeholder="Search by name, email, or company..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 border-beige-300 dark:border-gray-700 focus:border-maroon-500 focus:ring-maroon-500"
                                    />
                                </div>
                                {/* Active Filters Display */}
                                {(filterStatus || filterYear) && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {filterStatus && (
                                            <Badge
                                                variant="secondary"
                                                className="bg-maroon-100 text-maroon-800 text-xs"
                                            >
                                                Status: {filterStatus.replace('_', ' ')}
                                                <button
                                                    onClick={() => setFilterStatus('')}
                                                    className="ml-1 hover:text-maroon-900"
                                                >
                                                    ×
                                                </button>
                                            </Badge>
                                        )}
                                        {filterYear && (
                                            <Badge
                                                variant="secondary"
                                                className="bg-maroon-100 text-maroon-800 text-xs"
                                            >
                                                Year: {filterYear}
                                                <button
                                                    onClick={() => setFilterYear('')}
                                                    className="ml-1 hover:text-maroon-900"
                                                >
                                                    ×
                                                </button>
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                            <DropdownMenu open={filtersOpen} onOpenChange={setFiltersOpen}>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="border-maroon-300 dark:border-maroon-700 text-maroon-700 dark:text-maroon-300 hover:bg-maroon-50 dark:hover:bg-maroon-900/30"
                                    >
                                        <Filter className="h-4 w-4 mr-2" />
                                        More Filters
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuItem onClick={() => setFilterStatus('employed')}>
                                        Filter by: Employed
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterStatus('unemployed')}>
                                        Filter by: Unemployed
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterStatus('self-employed')}>
                                        Filter by: Self-employed
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterStatus('pursuing_education')}>
                                        Filter by: Pursuing Education
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterYear('2024')}>
                                        Filter by: Class of 2024
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterYear('2023')}>
                                        Filter by: Class of 2023
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterYear('2022')}>
                                        Filter by: Class of 2022
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setFilterStatus('');
                                            setFilterYear('');
                                        }}
                                        className="text-red-600"
                                    >
                                        Clear All Filters
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardContent>
                </Card>

                {/* Alumni Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800 dark:text-maroon-200">Total Alumni</CardTitle>
                            <Users className="h-4 w-4 text-maroon-600 dark:text-maroon-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-maroon-800 dark:text-maroon-200">{total}</div>
                            <p className="text-xs text-maroon-600 dark:text-maroon-400 mt-1">Registered profiles</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Alumni Table */}
                <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800 dark:text-maroon-200">Alumni Directory</CardTitle>
                        <CardDescription className="text-maroon-600 dark:text-maroon-400">
                            Showing {alumni.length} of {total} alumni
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-beige-50 dark:bg-gray-800/50">
                                        <TableHead className="w-12">
                                            <SelectAllCheckbox
                                                checked={multiSelect.isAllSelected(alumni.map(a => a.id))}
                                                indeterminate={multiSelect.isIndeterminate(alumni.map(a => a.id))}
                                                onCheckedChange={() => multiSelect.toggleAll(alumni.map(a => a.id))}
                                                label=""
                                            />
                                        </TableHead>
                                        <TableHead className="text-maroon-800 dark:text-maroon-200 font-semibold">Name</TableHead>
                                        <TableHead className="text-maroon-800 dark:text-maroon-200 font-semibold">Contact</TableHead>
                                        <TableHead className="text-maroon-800 dark:text-maroon-200 font-semibold">Education</TableHead>
                                        <TableHead className="text-maroon-800 dark:text-maroon-200 font-semibold">Employment</TableHead>
                                        <TableHead className="text-maroon-800 dark:text-maroon-200 font-semibold">Status</TableHead>
                                        <TableHead className="text-maroon-800 dark:text-maroon-200 font-semibold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {alumni.map((alumnus) => (
                                        <TableRow key={alumnus.id} className="hover:bg-beige-50 dark:hover:bg-gray-800/50">
                                            <TableCell>
                                                <Checkbox
                                                    checked={multiSelect.isSelected(alumnus.id)}
                                                    onCheckedChange={() => multiSelect.toggleItem(alumnus.id)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-maroon-800 dark:text-maroon-200">
                                                    {alumnus.first_name} {alumnus.last_name}
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">ID: {alumnus.id}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="flex items-center text-sm dark:text-gray-300">
                                                        <Mail className="h-3 w-3 mr-1 text-gray-400 dark:text-gray-500" />
                                                        {alumnus.email}
                                                    </div>
                                                    {alumnus.phone && (
                                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                            <Phone className="h-3 w-3 mr-1 text-gray-400 dark:text-gray-500" />
                                                            {alumnus.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="flex items-center text-sm font-medium dark:text-gray-200">
                                                        <GraduationCap className="h-3 w-3 mr-1 text-gray-400 dark:text-gray-500" />
                                                        {alumnus.degree_program}
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        Class of {alumnus.graduation_year}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    {alumnus.current_job_title && (
                                                        <div className="text-sm font-medium dark:text-gray-200">
                                                            {alumnus.current_job_title}
                                                        </div>
                                                    )}
                                                    {alumnus.current_employer && (
                                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                            <Building className="h-3 w-3 mr-1 text-gray-400 dark:text-gray-500" />
                                                            {alumnus.current_employer}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getEmploymentStatusBadge(alumnus.employment_status)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewAlumni(alumnus)}
                                                        className="text-maroon-700 dark:text-maroon-300 hover:text-maroon-800 dark:hover:text-maroon-200 hover:bg-maroon-50 dark:hover:bg-maroon-900/30"
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-gray-700 dark:text-gray-300 hover:text-maroon-800 dark:hover:text-maroon-200 hover:bg-maroon-50 dark:hover:bg-maroon-900/30"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => handleContactAlumni(alumnus)}
                                                                className="text-blue-700 focus:text-blue-800"
                                                            >
                                                                <MessageCircle className="h-4 w-4 mr-2" />
                                                                Contact
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleEditAlumni(alumnus)}
                                                                className="text-green-700 focus:text-green-800"
                                                            >
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeleteAlumni(alumnus)}
                                                                className="text-red-700 focus:text-red-800"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-beige-200 dark:border-gray-700">
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                    Showing page {currentPage} of {totalPages}
                                </div>
                                <div className="space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="border-maroon-300 dark:border-maroon-700 text-maroon-700 dark:text-maroon-300 hover:bg-maroon-50 dark:hover:bg-maroon-900/30"
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="border-maroon-300 dark:border-maroon-700 text-maroon-700 dark:text-maroon-300 hover:bg-maroon-50 dark:hover:bg-maroon-900/30"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Alumni Detail Modal */}
            <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-maroon-800 dark:text-maroon-200">
                            Alumni Profile Details
                        </DialogTitle>
                        <DialogDescription className="dark:text-gray-400">
                            Detailed information about the selected alumni
                        </DialogDescription>
                    </DialogHeader>

                    {selectedAlumni && (
                        <div className="space-y-6">
                            {/* Personal Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="border-beige-200 dark:border-gray-700">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg text-maroon-800 dark:text-maroon-200 flex items-center">
                                            <Users className="h-5 w-5 mr-2" />
                                            Personal Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Full Name</label>
                                            <p className="text-sm text-gray-900 dark:text-gray-200">
                                                {selectedAlumni.first_name} {selectedAlumni.last_name}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                                            <p className="text-sm text-gray-900 dark:text-gray-200 flex items-center">
                                                <Mail className="h-3 w-3 mr-1" />
                                                {selectedAlumni.email}
                                            </p>
                                        </div>
                                        {selectedAlumni.phone && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
                                                <p className="text-sm text-gray-900 dark:text-gray-200 flex items-center">
                                                    <Phone className="h-3 w-3 mr-1" />
                                                    {selectedAlumni.phone}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="border-beige-200">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg text-maroon-800 flex items-center">
                                            <GraduationCap className="h-5 w-5 mr-2" />
                                            Education
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Degree Program</label>
                                            <p className="text-sm text-gray-900">{selectedAlumni.degree_program}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Graduation Year</label>
                                            <p className="text-sm text-gray-900">Class of {selectedAlumni.graduation_year}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Employment Information */}
                            <Card className="border-beige-200">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg text-maroon-800 flex items-center">
                                        <Building className="h-5 w-5 mr-2" />
                                        Employment Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Employment Status</label>
                                            <div className="mt-1">
                                                {getEmploymentStatusBadge(selectedAlumni.employment_status)}
                                            </div>
                                        </div>
                                        {selectedAlumni.current_job_title && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600">Job Title</label>
                                                <p className="text-sm text-gray-900">{selectedAlumni.current_job_title}</p>
                                            </div>
                                        )}
                                    </div>
                                    {selectedAlumni.current_employer && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Current Employer</label>
                                            <p className="text-sm text-gray-900">{selectedAlumni.current_employer}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-2 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => handleContactAlumni(selectedAlumni)}
                                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                >
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Contact Alumni
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        handleEditAlumni(selectedAlumni);
                                        setViewModalOpen(false);
                                    }}
                                    className="border-green-300 text-green-700 hover:bg-green-50"
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Profile
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

            {/* Edit Alumni Modal */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-maroon-800">
                            Edit Alumni Profile
                        </DialogTitle>
                        <DialogDescription>
                            Update the selected alumni's information
                        </DialogDescription>
                    </DialogHeader>

                    {editFormData && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">First Name</label>
                                    <Input
                                        value={editFormData.first_name || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Last Name</label>
                                    <Input
                                        value={editFormData.last_name || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Email</label>
                                <Input
                                    type="email"
                                    value={editFormData.email || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Phone</label>
                                <Input
                                    value={editFormData.phone || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Degree Program</label>
                                <Input
                                    value={editFormData.degree_program || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, degree_program: e.target.value })}
                                    className="mt-1"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Graduation Year</label>
                                    <Input
                                        type="number"
                                        value={editFormData.graduation_year || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, graduation_year: parseInt(e.target.value) })}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Employment Status</label>
                                    <select
                                        value={editFormData.employment_status || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, employment_status: e.target.value })}
                                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-maroon-500 focus:ring-maroon-500"
                                    >
                                        <option value="">Select Status</option>
                                        <option value="employed_full_time">Employed (Full-Time)</option>
                                        <option value="employed_part_time">Employed (Part-Time)</option>
                                        <option value="self_employed">Self-Employed</option>
                                        <option value="unemployed_seeking">Unemployed (Seeking)</option>
                                        <option value="unemployed_not_seeking">Unemployed (Not Seeking)</option>
                                        <option value="continuing_education">Continuing Education</option>
                                        <option value="military_service">Military Service</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Current Employer</label>
                                    <Input
                                        value={editFormData.current_employer || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, current_employer: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Job Title</label>
                                    <Input
                                        value={editFormData.current_job_title || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, current_job_title: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => setEditModalOpen(false)}
                                    disabled={updating}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleUpdateAlumni}
                                    disabled={updating}
                                    className="bg-maroon-700 hover:bg-maroon-800"
                                >
                                    {updating ? 'Updating...' : 'Update Alumni'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <BulkActionBar
                selectedCount={multiSelect.selectedCount}
                onDelete={handleBulkDelete}
                onClear={multiSelect.clearSelection}
                isDeleting={isDeleting}
                totalCount={total}
            />
        </AdminBaseLayout>
    );
}