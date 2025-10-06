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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Users,
    Search,
    Plus,
    Eye,
    Edit,
    Trash2,
    Shield,
    Mail,

    RefreshCw,
    UserCheck,
    UserX,
    Key
} from 'lucide-react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'alumni';
    status: 'active' | 'inactive' | 'pending';
    email_verified_at?: string;
    last_login_at?: string;
    created_at: string;
    updated_at: string;
    profile?: {
        first_name?: string;
        last_name?: string;
        phone?: string;
    };
}

interface UsersResponse {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('admin');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
    const [showAddUserDialog, setShowAddUserDialog] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: '',
        email: '',
        role: 'alumni',
        status: 'active',
    });
    const [addFormData, setAddFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'alumni',
        status: 'active',
    });
    const [saving, setSaving] = useState(false);

    // Helper function to get CSRF token
    const getCsrfToken = () => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') || '' : '';
    };

    // Helper function to get auth headers
    const getAuthHeaders = () => {
        const token = localStorage.getItem('auth_token');
        const csrfToken = getCsrfToken();
        
        return {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken,
        };
    };

    // Debounce search to avoid too many API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1); // Reset to first page on search
            fetchUsers();
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [searchTerm, roleFilter, statusFilter]);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(currentPage === 1);
            setRefreshing(currentPage !== 1);

            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (roleFilter !== 'all') params.append('role', roleFilter);
            if (statusFilter !== 'all') params.append('status', statusFilter);
            params.append('page', currentPage.toString());
            params.append('per_page', '15');

            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const response = await fetch(`/api/v1/admin/users?${params}`, {
                credentials: 'include',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('auth_token');
                    window.location.href = '/login';
                    return;
                }
                throw new Error('Failed to fetch users data');
            }

            const data: { success: boolean; data: UsersResponse } = await response.json();

            if (data.success && data.data) {
                const usersList = Array.isArray(data.data.data) ? data.data.data : [];
                setUsers(usersList);
                setCurrentPage(data.data.current_page || 1);
                setTotalPages(data.data.last_page || 1);
                setTotal(data.data.total || 0);
                setError(null); // Clear any previous errors
            } else {
                throw new Error('Invalid response structure');
            }
        } catch (err) {
            console.error('Users fetch error:', err);
            setError('Failed to load users data');
            // Keep users array empty but don't break the component
            setUsers([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, searchTerm, roleFilter, statusFilter]);

    useEffect(() => {
        // Only fetch when page changes (not search/filters due to debounce above)
        if (currentPage !== 1) {
            fetchUsers();
        }
    }, [currentPage]);

    const handleDelete = async (userId: number) => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            setSaving(true);
            const response = await fetch(`/api/v1/admin/users/${userId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                setShowDeleteDialog(false);
                setSelectedUser(null);
                alert(data.message || 'User deleted successfully!');
                fetchUsers(); // Refresh the list
                setError(null);
            } else if (response.status === 401) {
                localStorage.removeItem('auth_token');
                window.location.href = '/login';
            } else if (response.status === 403) {
                const errorData = await response.json();
                alert(errorData.message || 'You cannot delete this user');
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to delete user');
                alert(errorData.message || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Delete error:', error);
            setError('Failed to delete user');
            alert('Failed to delete user. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleEditSubmit = async () => {
        if (!selectedUser) return;

        try {
            setSaving(true);
            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const response = await fetch(`/api/v1/admin/users/${selectedUser.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: getAuthHeaders(),
                body: JSON.stringify(editFormData),
            });

            if (response.ok) {
                setShowEditDialog(false);
                setSelectedUser(null);
                fetchUsers(); // Refresh the list
                setError(null);
            } else if (response.status === 401) {
                localStorage.removeItem('auth_token');
                window.location.href = '/login';
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to update user');
            }
        } catch (error) {
            console.error('Edit error:', error);
            setError('Failed to update user');
        } finally {
            setSaving(false);
        }
    };

    const handleAddUser = async () => {
        try {
            // Basic validation
            if (!addFormData.name || !addFormData.email || !addFormData.password) {
                alert('Please fill in all required fields');
                return;
            }

            if (addFormData.password.length < 8) {
                alert('Password must be at least 8 characters');
                return;
            }

            setSaving(true);
            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const response = await fetch('/api/v1/admin/users', {
                method: 'POST',
                credentials: 'include',
                headers: getAuthHeaders(),
                body: JSON.stringify(addFormData),
            });

            if (response.ok) {
                const data = await response.json();
                setShowAddUserDialog(false);
                setAddFormData({ name: '', email: '', password: '', role: 'alumni', status: 'active' });
                alert(data.message || 'User created successfully!');
                fetchUsers(); // Refresh the list
                setError(null);
            } else if (response.status === 401) {
                localStorage.removeItem('auth_token');
                window.location.href = '/login';
            } else if (response.status === 422) {
                const errorData = await response.json();
                // Handle validation errors
                if (errorData.errors) {
                    const errorMessages = Object.values(errorData.errors).flat().join('\n');
                    alert('Validation Error:\n' + errorMessages);
                } else {
                    alert(errorData.message || 'Validation error. Please check your input.');
                }
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to create user');
                alert(errorData.message || 'Failed to create user');
            }
        } catch (error) {
            console.error('Add user error:', error);
            setError('Failed to create user');
            alert('Failed to create user. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleResetPassword = async () => {
        if (!selectedUser) return;

        try {
            setSaving(true);
            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const response = await fetch(`/api/v1/admin/users/${selectedUser.id}/reset-password`, {
                method: 'POST',
                credentials: 'include',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                setShowResetPasswordDialog(false);
                setSelectedUser(null);
                alert(data.message || 'Password reset email sent successfully!');
                setError(null);
            } else if (response.status === 401) {
                localStorage.removeItem('auth_token');
                window.location.href = '/login';
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to reset password');
            }
        } catch (error) {
            console.error('Reset password error:', error);
            setError('Failed to reset password');
        } finally {
            setSaving(false);
        }
    };

    const handleStatusToggle = async (userId: number, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const response = await fetch(`/api/v1/admin/users/${userId}/status`, {
                method: 'PATCH',
                credentials: 'include',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                fetchUsers(); // Refresh the list
            } else if (response.status === 401) {
                localStorage.removeItem('auth_token');
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Status toggle error:', error);
        }
    };

    const getRoleBadge = (role: string) => {
        const roleColors = {
            'admin': 'bg-blue-100 text-blue-800',
            'alumni': 'bg-green-100 text-green-800',
        };

        return (
            <Badge className={roleColors[role as keyof typeof roleColors] || roleColors.alumni}>
                {role.replace('_', ' ').toUpperCase()}
            </Badge>
        );
    };

    const getStatusBadge = (status: string) => {
        const statusColors = {
            'active': 'bg-green-100 text-green-800',
            'inactive': 'bg-gray-100 text-gray-800',
            'pending': 'bg-yellow-100 text-yellow-800',
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
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <AdminBaseLayout title="User Management">
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="h-8 w-8 text-maroon-600 animate-spin" />
                        <span className="text-maroon-800 font-medium">Loading users...</span>
                    </div>
                </div>
            </AdminBaseLayout>
        );
    }

    if (error) {
        return (
            <AdminBaseLayout title="User Management">
                <Card className="border-red-200">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-red-600 mb-4">{error}</p>
                            <Button onClick={() => fetchUsers()} className="bg-maroon-700 hover:bg-maroon-800">
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
        <AdminBaseLayout title="User Management">
            <div className="space-y-6">
                {/* Header with Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-maroon-800">Admin Users</h2>
                        <p className="text-maroon-600">Manage admin users and permissions</p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={() => fetchUsers()}
                            variant="outline"
                            size="sm"
                            disabled={refreshing}
                            className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>

                        <Button
                            onClick={() => {
                                setAddFormData({ name: '', email: '', password: '', role: 'alumni', status: 'active' });
                                setShowAddUserDialog(true);
                            }}
                            className="bg-maroon-700 hover:bg-maroon-800 text-white"
                            size="sm"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add User
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 border-beige-300 focus:border-maroon-500 focus:ring-maroon-500"
                                />
                            </div>

                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="border border-beige-300 rounded-md px-3 py-2 text-sm focus:border-maroon-500 focus:ring-maroon-500"
                            >
                                <option value="admin">Admin Only</option>
                                <option value="all">All Roles</option>
                                <option value="alumni">Alumni</option>
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="border border-beige-300 rounded-md px-3 py-2 text-sm focus:border-maroon-500 focus:ring-maroon-500"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* User Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-maroon-800">{total}</div>
                            <p className="text-xs text-maroon-600 mt-1">All registered users</p>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">Active Users</CardTitle>
                            <UserCheck className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {(Array.isArray(users) ? users : []).filter(u => u.status === 'active').length}
                            </div>
                            <p className="text-xs text-maroon-600 mt-1">Currently active</p>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">Admins</CardTitle>
                            <Shield className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {(Array.isArray(users) ? users : []).filter(u => u.role === 'admin').length}
                            </div>
                            <p className="text-xs text-maroon-600 mt-1">Admin users</p>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">Alumni</CardTitle>
                            <Users className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {(Array.isArray(users) ? users : []).filter(u => u.role === 'alumni').length}
                            </div>
                            <p className="text-xs text-maroon-600 mt-1">Alumni users</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Users Table */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800">Admin Users Directory</CardTitle>
                        <CardDescription className="text-maroon-600">
                            Showing {users.length} of {total} admin users
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-beige-50">
                                        <TableHead className="text-maroon-800 font-semibold">User Details</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Role</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Status</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Verification</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Last Activity</TableHead>
                                        <TableHead className="text-maroon-800 font-semibold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id} className="hover:bg-beige-50">
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="font-medium text-maroon-800">
                                                        {user.profile?.first_name && user.profile?.last_name
                                                            ? `${user.profile.first_name} ${user.profile.last_name}`
                                                            : user.name
                                                        }
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Mail className="h-3 w-3 mr-1 text-gray-400" />
                                                        {user.email}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        ID: {user.id}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getRoleBadge(user.role)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    {getStatusBadge(user.status)}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleStatusToggle(user.id, user.status)}
                                                        className="text-xs p-1 h-6"
                                                    >
                                                        {user.status === 'active' ? (
                                                            <UserX className="h-3 w-3 text-red-600" />
                                                        ) : (
                                                            <UserCheck className="h-3 w-3 text-green-600" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-center">
                                                    {user.email_verified_at ? (
                                                        <div className="text-green-600 text-sm">
                                                            ✓ Verified
                                                        </div>
                                                    ) : (
                                                        <div className="text-red-600 text-sm">
                                                            ✗ Unverified
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    {user.last_login_at ? (
                                                        <div className="text-sm">
                                                            {formatDate(user.last_login_at)}
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-gray-500">
                                                            Never logged in
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-gray-500">
                                                        Joined: {formatDate(user.created_at)}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-maroon-700 hover:text-maroon-800 hover:bg-maroon-50"
                                                        title="View Details"
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setShowViewDialog(true);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-blue-700 hover:text-blue-800 hover:bg-blue-50"
                                                        title="Edit User"
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setEditFormData({
                                                                name: user.name,
                                                                email: user.email,
                                                                role: user.role,
                                                                status: user.status,
                                                            });
                                                            setShowEditDialog(true);
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-orange-700 hover:text-orange-800 hover:bg-orange-50"
                                                        title="Reset Password"
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setShowResetPasswordDialog(true);
                                                        }}
                                                    >
                                                        <Key className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-700 hover:text-red-800 hover:bg-red-50"
                                                        title="Delete User"
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setShowDeleteDialog(true);
                                                        }}
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

                {/* View User Dialog */}
                <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-maroon-800">User Details</DialogTitle>
                            <DialogDescription>
                                Complete information about the selected user
                            </DialogDescription>
                        </DialogHeader>
                        {selectedUser && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Name</label>
                                        <p className="text-sm text-gray-900">{selectedUser.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Email</label>
                                        <p className="text-sm text-gray-900">{selectedUser.email}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Role</label>
                                        <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Status</label>
                                        <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
                                    </div>
                                    {selectedUser.profile?.first_name && (
                                        <>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">First Name</label>
                                                <p className="text-sm text-gray-900">{selectedUser.profile.first_name}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700">Last Name</label>
                                                <p className="text-sm text-gray-900">{selectedUser.profile.last_name}</p>
                                            </div>
                                        </>
                                    )}
                                    {selectedUser.profile?.phone && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Phone</label>
                                            <p className="text-sm text-gray-900">{selectedUser.profile.phone}</p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Email Verified</label>
                                        <p className="text-sm text-gray-900">
                                            {selectedUser.email_verified_at ? '✓ Yes' : '✗ No'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Created At</label>
                                        <p className="text-sm text-gray-900">{formatDate(selectedUser.created_at)}</p>
                                    </div>
                                    {selectedUser.last_login_at && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Last Login</label>
                                            <p className="text-sm text-gray-900">{formatDate(selectedUser.last_login_at)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button
                                onClick={() => setShowViewDialog(false)}
                                className="bg-maroon-700 hover:bg-maroon-800"
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit User Dialog */}
                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-maroon-800">Edit User</DialogTitle>
                            <DialogDescription>
                                Update user information
                            </DialogDescription>
                        </DialogHeader>
                        {selectedUser && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 block mb-2">
                                            Name
                                        </label>
                                        <Input
                                            value={editFormData.name}
                                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                            placeholder="Enter name"
                                            className="border-beige-300 focus:border-maroon-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 block mb-2">
                                            Email
                                        </label>
                                        <Input
                                            value={editFormData.email}
                                            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                            placeholder="Enter email"
                                            type="email"
                                            className="border-beige-300 focus:border-maroon-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 block mb-2">
                                            Role
                                        </label>
                                        <select
                                            value={editFormData.role}
                                            onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                                            className="w-full border border-beige-300 rounded-md px-3 py-2 text-sm focus:border-maroon-500 focus:ring-maroon-500"
                                        >
                                            <option value="alumni">Alumni</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 block mb-2">
                                            Status
                                        </label>
                                        <select
                                            value={editFormData.status}
                                            onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                            className="w-full border border-beige-300 rounded-md px-3 py-2 text-sm focus:border-maroon-500 focus:ring-maroon-500"
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="pending">Pending</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setShowEditDialog(false)}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button 
                                className="bg-maroon-700 hover:bg-maroon-800"
                                onClick={handleEditSubmit}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-red-800">Delete User</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete this user? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedUser && (
                            <div className="py-4">
                                <p className="text-sm text-gray-700">
                                    <span className="font-medium">User:</span> {selectedUser.name}
                                </p>
                                <p className="text-sm text-gray-700">
                                    <span className="font-medium">Email:</span> {selectedUser.email}
                                </p>
                            </div>
                        )}
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setShowDeleteDialog(false)}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => selectedUser && handleDelete(selectedUser.id)}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete User'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Reset Password Dialog */}
                <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-orange-800">Reset Password</DialogTitle>
                            <DialogDescription>
                                Send a password reset email to this user
                            </DialogDescription>
                        </DialogHeader>
                        {selectedUser && (
                            <div className="py-4">
                                <p className="text-sm text-gray-700 mb-2">
                                    <span className="font-medium">User:</span> {selectedUser.name}
                                </p>
                                <p className="text-sm text-gray-700">
                                    <span className="font-medium">Email:</span> {selectedUser.email}
                                </p>
                                <p className="text-sm text-gray-600 mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
                                    A password reset link will be sent to the user's email address.
                                </p>
                            </div>
                        )}
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setShowResetPasswordDialog(false)}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                                onClick={handleResetPassword}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    'Send Reset Email'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Add User Dialog */}
                <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-maroon-800">Add New User</DialogTitle>
                            <DialogDescription>
                                Create a new user account
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name *
                                    </label>
                                    <Input
                                        value={addFormData.name}
                                        onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                                        placeholder="Enter full name"
                                        className="border-beige-300"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address *
                                    </label>
                                    <Input
                                        type="email"
                                        value={addFormData.email}
                                        onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                                        placeholder="Enter email address"
                                        className="border-beige-300"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Password *
                                    </label>
                                    <Input
                                        type="password"
                                        value={addFormData.password}
                                        onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                                        placeholder="Enter password (min 8 characters)"
                                        className="border-beige-300"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Minimum 8 characters required</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Role *
                                    </label>
                                    <select
                                        value={addFormData.role}
                                        onChange={(e) => setAddFormData({ ...addFormData, role: e.target.value as 'admin' | 'alumni' })}
                                        className="w-full border border-beige-300 rounded-md px-3 py-2 text-sm"
                                    >
                                        <option value="alumni">Alumni</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status *
                                    </label>
                                    <select
                                        value={addFormData.status}
                                        onChange={(e) => setAddFormData({ ...addFormData, status: e.target.value as 'active' | 'inactive' | 'pending' })}
                                        className="w-full border border-beige-300 rounded-md px-3 py-2 text-sm"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="pending">Pending</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowAddUserDialog(false);
                                    setAddFormData({ name: '', email: '', password: '', role: 'alumni', status: 'active' });
                                }}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button 
                                className="bg-maroon-700 hover:bg-maroon-800"
                                onClick={handleAddUser}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create User'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminBaseLayout>
    );
}