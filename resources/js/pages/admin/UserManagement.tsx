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
    role: 'admin' | 'alumni' | 'super_admin';
    status: 'active' | 'inactive' | 'suspended';
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
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

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

            const response = await fetch(`/api/v1/admin/users?${params}`, {
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
                throw new Error('Failed to fetch users data');
            }

            const data: { success: boolean; data: UsersResponse } = await response.json();

            if (data.success) {
                setUsers(data.data.data);
                setCurrentPage(data.data.current_page);
                setTotalPages(data.data.last_page);
                setTotal(data.data.total);
            }
        } catch (err) {
            console.error('Users fetch error:', err);
            setError('Failed to load users data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, searchTerm, roleFilter, statusFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleStatusToggle = async (userId: number, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

            const response = await fetch(`/api/v1/admin/users/${userId}/status`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                fetchUsers(); // Refresh the list
            }
        } catch (error) {
            console.error('Status toggle error:', error);
        }
    };

    const getRoleBadge = (role: string) => {
        const roleColors = {
            'super_admin': 'bg-purple-100 text-purple-800',
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
            'suspended': 'bg-red-100 text-red-800',
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
                        <h2 className="text-2xl font-bold text-maroon-800">User Management</h2>
                        <p className="text-maroon-600">Manage system users, roles, and permissions</p>
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
                                <option value="all">All Roles</option>
                                <option value="super_admin">Super Admin</option>
                                <option value="admin">Admin</option>
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
                                <option value="suspended">Suspended</option>
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
                                {users.filter(u => u.status === 'active').length}
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
                                {users.filter(u => u.role === 'admin' || u.role === 'super_admin').length}
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
                                {users.filter(u => u.role === 'alumni').length}
                            </div>
                            <p className="text-xs text-maroon-600 mt-1">Alumni users</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Users Table */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800">Users Directory</CardTitle>
                        <CardDescription className="text-maroon-600">
                            Showing {users.length} of {total} users
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
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-blue-700 hover:text-blue-800 hover:bg-blue-50"
                                                        title="Edit User"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-orange-700 hover:text-orange-800 hover:bg-orange-50"
                                                        title="Reset Password"
                                                    >
                                                        <Key className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-700 hover:text-red-800 hover:bg-red-50"
                                                        title="Delete User"
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