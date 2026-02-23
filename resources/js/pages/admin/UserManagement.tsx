import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    Crown,
    RefreshCw,
    UserCheck,
    UserX,
    Key,
    AlertCircle,
    CheckCircle,
    ArrowUpDown,
    X,
    Download,
    ChevronDown,
    FileText
} from 'lucide-react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import { useCampus } from '@/contexts/CampusContext';
import { useAdminChannel } from '@/hooks/useAdminChannel';
import axios from 'axios';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'super_admin' | 'admin' | 'alumni';
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

interface UserProps {
    id: number;
    email: string;
    role: string;
    status: string;
}

interface Props {
    user: UserProps;
}

export default function UserManagement({ user }: Props) {
    // Campus context for filtering
    const { selectedCampus } = useCampus();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('admin');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('recent');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
    const [showSetPasswordDialog, setShowSetPasswordDialog] = useState(false);
    const [showAddUserDialog, setShowAddUserDialog] = useState(false);
    const [showRoleChangeDialog, setShowRoleChangeDialog] = useState(false);
    const [newRole, setNewRole] = useState<string>('');
    const [roleChangeReason, setRoleChangeReason] = useState('');
    const [requiresConfirmation, setRequiresConfirmation] = useState(false);
    const [manualPassword, setManualPassword] = useState({ password: '', password_confirmation: '' });
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

    // Handler to open edit dialog with user data pre-populated
    const handleEditUser = (targetUser: User) => {
        setSelectedUser(targetUser);
        setEditFormData({
            name: targetUser.name || '',
            email: targetUser.email || '',
            role: targetUser.role || 'alumni',
            status: targetUser.status || 'active',
        });
        setShowEditDialog(true);
    };

    // Safety net: sync edit form when dialog opens with selected user
    useEffect(() => {
        if (showEditDialog && selectedUser) {
            setEditFormData({
                name: selectedUser.name || '',
                email: selectedUser.email || '',
                role: selectedUser.role || 'alumni',
                status: selectedUser.status || 'active',
            });
        }
    }, [showEditDialog, selectedUser]);

    // Email validation state for add user form
    const [addEmailValidation, setAddEmailValidation] = useState<{
        checking: boolean;
        exists: boolean;
        valid: boolean;
        message: string;
    }>({ checking: false, exists: false, valid: false, message: '' });

    // Debounced email validation for add user form
    useEffect(() => {
        const checkEmailExists = async () => {
            if (!addFormData.email) {
                setAddEmailValidation({ checking: false, exists: false, valid: false, message: '' });
                return;
            }

            // Check email format
            if (!/\S+@\S+\.\S+/.test(addFormData.email)) {
                setAddEmailValidation({
                    checking: false,
                    exists: false,
                    valid: false,
                    message: 'Please enter a valid email address'
                });
                return;
            }

            setAddEmailValidation({ checking: true, exists: false, valid: false, message: 'Checking email...' });

            try {
                const response = await axios.post('/api/v1/check-email', {
                    email: addFormData.email
                });

                if (response.data.exists) {
                    setAddEmailValidation({
                        checking: false,
                        exists: true,
                        valid: false,
                        message: 'This email is already registered'
                    });
                } else {
                    setAddEmailValidation({
                        checking: false,
                        exists: false,
                        valid: true,
                        message: 'Email is available'
                    });
                }
            } catch {
                setAddEmailValidation({ checking: false, exists: false, valid: false, message: '' });
            }
        };

        const timer = setTimeout(checkEmailExists, 800);
        return () => clearTimeout(timer);
    }, [addFormData.email]);

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
    }, [searchTerm, roleFilter, statusFilter, sortBy, selectedCampus]);

    // Real-time: refresh user list when profiles change
    useAdminChannel({
        onDashboardUpdate: (data) => {
            if (data.trigger === 'profile_update' || data.trigger === 'new_alumni') {
                fetchUsers();
            }
        },
    });

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(currentPage === 1);
            setRefreshing(currentPage !== 1);

            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (roleFilter !== 'all') params.append('role', roleFilter);
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (sortBy) params.append('sort', sortBy);
            if (selectedCampus?.id) params.append('campus_id', selectedCampus.id.toString());
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

    const handleExport = async (format: 'csv' | 'excel' | 'pdf' = 'csv') => {
        try {
            const params = new URLSearchParams();
            params.append('format', format);
            if (searchTerm) params.append('search', searchTerm);
            if (roleFilter !== 'all') params.append('role', roleFilter);
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (sortBy) params.append('sort', sortBy);
            if (selectedCampus?.id) params.append('campus_id', selectedCampus.id.toString());

            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const response = await fetch(`/api/v1/admin/users/export?${params}`, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/octet-stream',
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                const extension = format === 'excel' ? 'xlsx' : format;
                a.download = `users-${new Date().toISOString().split('T')[0]}.${extension}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                console.error('Export failed:', response.status);
                alert('Failed to export users. Please try again.');
            }
        } catch (err) {
            console.error('Export error:', err);
            alert('An error occurred while exporting. Please try again.');
        }
    };

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

            // Email format validation
            if (!/\S+@\S+\.\S+/.test(addFormData.email)) {
                alert('Please enter a valid email address');
                return;
            }

            // Check if email already exists
            if (addEmailValidation.exists) {
                alert('This email is already registered. Please use a different email.');
                return;
            }

            // Wait for email validation to complete
            if (addEmailValidation.checking) {
                alert('Please wait for email validation to complete');
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
                setAddEmailValidation({ checking: false, exists: false, valid: false, message: '' });
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

    const handleSetPassword = async () => {
        if (!selectedUser) return;

        // Validate passwords
        if (!manualPassword.password) {
            alert('Please enter a password');
            return;
        }
        if (manualPassword.password.length < 8) {
            alert('Password must be at least 8 characters');
            return;
        }
        if (manualPassword.password !== manualPassword.password_confirmation) {
            alert('Passwords do not match');
            return;
        }

        try {
            setSaving(true);
            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const response = await fetch(`/api/v1/admin/users/${selectedUser.id}/set-password`, {
                method: 'POST',
                credentials: 'include',
                headers: getAuthHeaders(),
                body: JSON.stringify(manualPassword),
            });

            if (response.ok) {
                const data = await response.json();
                setShowSetPasswordDialog(false);
                setSelectedUser(null);
                setManualPassword({ password: '', password_confirmation: '' });
                alert(data.message || 'Password updated successfully!');
                setError(null);
            } else if (response.status === 401) {
                localStorage.removeItem('auth_token');
                window.location.href = '/login';
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Failed to set password');
            }
        } catch (error) {
            console.error('Set password error:', error);
            alert('Failed to set password');
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

    const handleRoleChange = async () => {
        if (!selectedUser || !newRole) return;

        try {
            setSaving(true);
            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const payload: { role: string; reason?: string; confirm_super_admin?: boolean } = {
                role: newRole,
                reason: roleChangeReason || undefined,
            };

            // Add confirmation flag for super_admin
            if (newRole === 'super_admin' && requiresConfirmation) {
                payload.confirm_super_admin = true;
            }

            const response = await fetch(`/api/v1/admin/role-management/users/${selectedUser.id}/change-role`, {
                method: 'POST',
                credentials: 'include',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                setShowRoleChangeDialog(false);
                setSelectedUser(null);
                setNewRole('');
                setRoleChangeReason('');
                setRequiresConfirmation(false);
                alert(data.message || 'Role changed successfully!');
                fetchUsers(); // Refresh the list
                setError(null);
            } else if (response.status === 422 && data.requires_confirmation) {
                // Super admin requires confirmation
                setRequiresConfirmation(true);
                alert(data.message);
            } else if (response.status === 401) {
                localStorage.removeItem('auth_token');
                window.location.href = '/login';
            } else {
                setError(data.message || 'Failed to change role');
                alert(data.message || 'Failed to change role');
            }
        } catch (error) {
            console.error('Role change error:', error);
            setError('Failed to change role');
            alert('Failed to change role. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const openRoleChangeDialog = (targetUser: User) => {
        if (targetUser.role === 'super_admin' && user.role !== 'super_admin') {
            alert('Only Super Admins can change roles of other Super Admins');
            return;
        }
        setSelectedUser(targetUser);
        setNewRole(targetUser.role);
        setRoleChangeReason('');
        setRequiresConfirmation(false);
        setShowRoleChangeDialog(true);
    };

    const getRoleBadge = (role: string) => {
        const roleConfig = {
            'super_admin': {
                color: 'bg-purple-100 text-purple-800 border-purple-300',
                icon: <Crown className="h-3 w-3 mr-1" />,
                label: 'SUPER ADMIN'
            },
            'admin': {
                color: 'bg-blue-100 text-blue-800 border-blue-300',
                icon: <Shield className="h-3 w-3 mr-1" />,
                label: 'ADMIN'
            },
            'alumni': {
                color: 'bg-green-100 text-green-800 border-green-300',
                icon: <Users className="h-3 w-3 mr-1" />,
                label: 'ALUMNI'
            },
        };

        const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.alumni;

        return (
            <Badge className={`${config.color} border flex items-center w-fit`}>
                {config.icon}
                {config.label}
            </Badge>
        );
    };

    const getStatusBadge = (status: string) => {
        const statusColors = {
            'active': 'bg-green-100 text-green-800',
            'inactive': 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
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
            <AdminBaseLayout title="User Management" user={user}>
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="h-8 w-8 text-maroon-600 dark:text-gray-400 animate-spin" />
                        <span className="text-maroon-800 dark:text-gray-200 font-medium">Loading users...</span>
                    </div>
                </div>
            </AdminBaseLayout>
        );
    }

    if (error) {
        return (
            <AdminBaseLayout title="User Management" user={user}>
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
        <AdminBaseLayout title="User Management" user={user}>
            <div className="space-y-6">
                {/* Header with Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-maroon-800 dark:text-gray-200">Admin Users</h2>
                        <p className="text-maroon-600 dark:text-gray-400">Manage admin users and permissions</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            onClick={() => fetchUsers()}
                            variant="outline"
                            size="sm"
                            disabled={refreshing}
                            className="border-maroon-300 dark:border-gray-600 text-maroon-700 dark:text-gray-300 hover:bg-maroon-50 dark:hover:bg-maroon-800/30"
                        >
                            <RefreshCw className={`h-4 w-4 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-green-300 text-green-700 hover:bg-green-50"
                                >
                                    <Download className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Export</span>
                                    <ChevronDown className="h-4 w-4 sm:ml-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleExport('csv')}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Export as CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('excel')}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Export as Excel
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Export as PDF
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            onClick={() => {
                                setAddFormData({ name: '', email: '', password: '', role: 'alumni', status: 'active' });
                                setShowAddUserDialog(true);
                            }}
                            className="bg-maroon-700 hover:bg-maroon-800 text-white"
                            size="sm"
                        >
                            <Plus className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Add User</span>
                        </Button>
                    </div>
                </div>

                {/* Search and Filters */}
                <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg text-maroon-800 dark:text-gray-200 flex items-center">
                            <Search className="h-5 w-5 mr-2" />
                            Search & Filter
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4">
                            {/* Search and Sort Row */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        placeholder="Search by name or email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 border-beige-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:border-maroon-500 focus:ring-maroon-500"
                                    />
                                </div>
                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="w-[180px] border-beige-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                                        <ArrowUpDown className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="Sort by..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="name_asc">Name A-Z</SelectItem>
                                        <SelectItem value="name_desc">Name Z-A</SelectItem>
                                        <SelectItem value="recent">Recently Added</SelectItem>
                                        <SelectItem value="last_login">Last Login</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Filter Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="border border-beige-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:border-maroon-500 focus:ring-maroon-500"
                                >
                                    <option value="all">All Roles</option>
                                    <option value="super_admin">Super Admin</option>
                                    <option value="admin">Admin</option>
                                    <option value="alumni">Alumni</option>
                                </select>

                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="border border-beige-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:border-maroon-500 focus:ring-maroon-500"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>

                            {/* Active Filters Display */}
                            {(roleFilter !== 'all' || statusFilter !== 'all') && (
                                <div className="flex flex-wrap gap-2">
                                    {roleFilter !== 'all' && (
                                        <Badge
                                            variant="secondary"
                                            className="bg-maroon-100 text-maroon-800 text-xs flex items-center gap-1"
                                        >
                                            Role: {roleFilter.replace('_', ' ')}
                                            <button
                                                onClick={() => setRoleFilter('all')}
                                                className="ml-1 hover:text-maroon-900"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    )}
                                    {statusFilter !== 'all' && (
                                        <Badge
                                            variant="secondary"
                                            className="bg-maroon-100 text-maroon-800 text-xs flex items-center gap-1"
                                        >
                                            Status: {statusFilter}
                                            <button
                                                onClick={() => setStatusFilter('all')}
                                                className="ml-1 hover:text-maroon-900"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setRoleFilter('all');
                                            setStatusFilter('all');
                                            setSearchTerm('');
                                        }}
                                        className="h-6 text-xs text-maroon-700 dark:text-maroon-300"
                                    >
                                        Clear All Filters
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* User Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800 dark:text-gray-200">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-maroon-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-maroon-800 dark:text-gray-200">{total}</div>
                            <p className="text-xs text-maroon-600 dark:text-gray-400 mt-1">All registered users</p>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800 dark:text-gray-200">Active Users</CardTitle>
                            <UserCheck className="h-4 w-4 text-maroon-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {(Array.isArray(users) ? users : []).filter(u => u.status === 'active').length}
                            </div>
                            <p className="text-xs text-maroon-600 dark:text-gray-400 mt-1">Currently active</p>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800 dark:text-gray-200">Admins</CardTitle>
                            <Shield className="h-4 w-4 text-maroon-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {(Array.isArray(users) ? users : []).filter(u => u.role === 'admin').length}
                            </div>
                            <p className="text-xs text-maroon-600 dark:text-gray-400 mt-1">Admin users</p>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800 dark:text-gray-200">Alumni</CardTitle>
                            <Users className="h-4 w-4 text-maroon-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {(Array.isArray(users) ? users : []).filter(u => u.role === 'alumni').length}
                            </div>
                            <p className="text-xs text-maroon-600 dark:text-gray-400 mt-1">Alumni users</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Users Table */}
                <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800 dark:text-gray-200">Admin Users Directory</CardTitle>
                        <CardDescription className="text-maroon-600 dark:text-gray-400">
                            Showing {users.length} of {total} admin users
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-beige-200 dark:divide-gray-700">
                            {users.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                                    <Users className="h-12 w-12 mb-3 text-gray-300 dark:text-gray-600" />
                                    <p className="text-lg font-medium mb-1">No users found</p>
                                    <p className="text-sm text-center px-4">
                                        {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                                            ? 'Try adjusting your filters or search term'
                                            : 'No users have been added yet'}
                                    </p>
                                </div>
                            ) : (
                                users.map((targetUser) => (
                                    <div key={targetUser.id} className="p-4 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1 min-w-0 flex-1">
                                                <div className="font-medium text-maroon-800 dark:text-gray-200 truncate">
                                                    {targetUser.profile?.first_name && targetUser.profile?.last_name
                                                        ? `${targetUser.profile.first_name} ${targetUser.profile.last_name}`
                                                        : targetUser.name
                                                    }
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{targetUser.email}</div>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                                {getRoleBadge(targetUser.role)}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-sm">
                                            {getStatusBadge(targetUser.status)}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleStatusToggle(targetUser.id, targetUser.status)}
                                                className="text-xs p-1 h-6"
                                            >
                                                {targetUser.status === 'active' ? (
                                                    <UserX className="h-3 w-3 text-red-600" />
                                                ) : (
                                                    <UserCheck className="h-3 w-3 text-green-600" />
                                                )}
                                            </Button>
                                            {targetUser.email_verified_at ? (
                                                <span className="text-green-600 text-xs">✓ Verified</span>
                                            ) : (
                                                <span className="text-red-600 text-xs">✗ Unverified</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {targetUser.last_login_at ? `Last login: ${formatDate(targetUser.last_login_at)}` : 'Never logged in'}
                                            <span className="mx-1">·</span>
                                            Joined: {formatDate(targetUser.created_at)}
                                        </div>
                                        <div className="flex flex-wrap gap-1 pt-1 border-t border-beige-100 dark:border-gray-700">
                                            <Button variant="ghost" size="sm" className="h-7 text-xs text-maroon-700 dark:text-gray-300" title="View" onClick={() => { setSelectedUser(targetUser); setShowViewDialog(true); }}>
                                                <Eye className="h-3.5 w-3.5 mr-1" /> View
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-700" title="Edit" onClick={() => handleEditUser(targetUser)}>
                                                <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                                            </Button>
                                            {user.role === 'super_admin' && (
                                                <Button variant="ghost" size="sm" className="h-7 text-xs text-purple-700" title="Change Role" onClick={() => openRoleChangeDialog(targetUser)}>
                                                    <Crown className="h-3.5 w-3.5 mr-1" /> Role
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm" className="h-7 text-xs text-red-700" title="Delete" onClick={() => { setSelectedUser(targetUser); setShowDeleteDialog(true); }}>
                                                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                                            </Button>
                                        </div>
                                    </div>
                                )))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-beige-50 dark:bg-gray-800/50">
                                        <TableHead className="text-maroon-800 dark:text-gray-200 font-semibold">User Details</TableHead>
                                        <TableHead className="text-maroon-800 dark:text-gray-200 font-semibold">Role</TableHead>
                                        <TableHead className="text-maroon-800 dark:text-gray-200 font-semibold">Status</TableHead>
                                        <TableHead className="text-maroon-800 dark:text-gray-200 font-semibold">Verification</TableHead>
                                        <TableHead className="text-maroon-800 dark:text-gray-200 font-semibold">Last Activity</TableHead>
                                        <TableHead className="text-maroon-800 dark:text-gray-200 font-semibold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-32 text-center">
                                                <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                                                    <Users className="h-12 w-12 mb-3 text-gray-300 dark:text-gray-600" />
                                                    <p className="text-lg font-medium mb-1">No users found</p>
                                                    <p className="text-sm">
                                                        {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                                                            ? 'Try adjusting your filters or search term'
                                                            : 'No users have been added yet'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map((targetUser) => (
                                            <TableRow key={targetUser.id} className="hover:bg-beige-50 dark:hover:bg-gray-800">
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="font-medium text-maroon-800 dark:text-gray-200">
                                                            {targetUser.profile?.first_name && targetUser.profile?.last_name
                                                                ? `${targetUser.profile.first_name} ${targetUser.profile.last_name}`
                                                                : targetUser.name
                                                            }
                                                        </div>
                                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                            <Mail className="h-3 w-3 mr-1 text-gray-400" />
                                                            {targetUser.email}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            ID: {targetUser.id}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getRoleBadge(targetUser.role)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        {getStatusBadge(targetUser.status)}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleStatusToggle(targetUser.id, targetUser.status)}
                                                            className="text-xs p-1 h-6"
                                                        >
                                                            {targetUser.status === 'active' ? (
                                                                <UserX className="h-3 w-3 text-red-600" />
                                                            ) : (
                                                                <UserCheck className="h-3 w-3 text-green-600" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-center">
                                                        {targetUser.email_verified_at ? (
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
                                                        {targetUser.last_login_at ? (
                                                            <div className="text-sm">
                                                                {formatDate(targetUser.last_login_at)}
                                                            </div>
                                                        ) : (
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                Never logged in
                                                            </div>
                                                        )}
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            Joined: {formatDate(targetUser.created_at)}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-maroon-700 dark:text-gray-300 hover:text-maroon-800 hover:bg-maroon-50 dark:hover:bg-maroon-800/30"
                                                            title="View Details"
                                                            onClick={() => {
                                                                setSelectedUser(targetUser);
                                                                setShowViewDialog(true);
                                                            }}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {user.role === 'super_admin' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-purple-700 hover:text-purple-800 hover:bg-purple-50"
                                                                title="Change Role (Super Admin Only)"
                                                                onClick={() => openRoleChangeDialog(targetUser)}
                                                            >
                                                                <Crown className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-blue-700 hover:text-blue-800 hover:bg-blue-50"
                                                            title="Edit User"
                                                            onClick={() => handleEditUser(targetUser)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-orange-700 hover:text-orange-800 hover:bg-orange-50"
                                                            title="Send Reset Email"
                                                            onClick={() => {
                                                                setSelectedUser(targetUser);
                                                                setShowResetPasswordDialog(true);
                                                            }}
                                                        >
                                                            <Mail className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-purple-700 hover:text-purple-800 hover:bg-purple-50"
                                                            title="Set Password Manually"
                                                            onClick={() => {
                                                                setSelectedUser(targetUser);
                                                                setManualPassword({ password: '', password_confirmation: '' });
                                                                setShowSetPasswordDialog(true);
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
                                                                setSelectedUser(targetUser);
                                                                setShowDeleteDialog(true);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-6 py-4 border-t border-beige-200 dark:border-gray-700">
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                    Showing page {currentPage} of {totalPages}
                                </div>
                                <div className="space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="border-maroon-300 dark:border-gray-600 text-maroon-700 dark:text-gray-300 hover:bg-maroon-50 dark:hover:bg-maroon-800/30"
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="border-maroon-300 dark:border-gray-600 text-maroon-700 dark:text-gray-300 hover:bg-maroon-50 dark:hover:bg-maroon-800/30"
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
                    <DialogContent className="sm:max-w-2xl dark:bg-gray-800">
                        <DialogHeader>
                            <DialogTitle className="text-maroon-800 dark:text-gray-200">User Details</DialogTitle>
                            <DialogDescription>
                                Complete information about the selected user
                            </DialogDescription>
                        </DialogHeader>
                        {selectedUser && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                                        <p className="text-sm text-gray-900 dark:text-gray-100">{selectedUser.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                        <p className="text-sm text-gray-900 dark:text-gray-100">{selectedUser.email}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                                        <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                        <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
                                    </div>
                                    {selectedUser.profile?.first_name && (
                                        <>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                                                <p className="text-sm text-gray-900 dark:text-gray-100">{selectedUser.profile.first_name}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                                                <p className="text-sm text-gray-900 dark:text-gray-100">{selectedUser.profile.last_name}</p>
                                            </div>
                                        </>
                                    )}
                                    {selectedUser.profile?.phone && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                                            <p className="text-sm text-gray-900 dark:text-gray-100">{selectedUser.profile.phone}</p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Verified</label>
                                        <p className="text-sm text-gray-900 dark:text-gray-100">
                                            {selectedUser.email_verified_at ? '✓ Yes' : '✗ No'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Created At</label>
                                        <p className="text-sm text-gray-900 dark:text-gray-100">{formatDate(selectedUser.created_at)}</p>
                                    </div>
                                    {selectedUser.last_login_at && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Login</label>
                                            <p className="text-sm text-gray-900 dark:text-gray-100">{formatDate(selectedUser.last_login_at)}</p>
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
                    <DialogContent className="sm:max-w-2xl dark:bg-gray-800">
                        <DialogHeader>
                            <DialogTitle className="text-maroon-800 dark:text-gray-200">Edit User</DialogTitle>
                            <DialogDescription>
                                Update user information
                            </DialogDescription>
                        </DialogHeader>
                        {selectedUser && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                                            Name
                                        </label>
                                        <Input
                                            value={editFormData.name}
                                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                            placeholder="Enter name"
                                            className="border-beige-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:border-maroon-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                                            Email
                                        </label>
                                        <Input
                                            value={editFormData.email}
                                            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                            placeholder="Enter email"
                                            type="email"
                                            className="border-beige-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:border-maroon-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                                            Role
                                        </label>
                                        <select
                                            value={editFormData.role}
                                            onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                                            className="w-full border border-beige-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:border-maroon-500 focus:ring-maroon-500"
                                        >
                                            <option value="alumni">Alumni</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                                            Status
                                        </label>
                                        <select
                                            value={editFormData.status}
                                            onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                            className="w-full border border-beige-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:border-maroon-500 focus:ring-maroon-500"
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
                    <DialogContent className="dark:bg-gray-800">
                        <DialogHeader>
                            <DialogTitle className="text-red-800">Delete User</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete this user? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedUser && (
                            <div className="py-4">
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-medium">User:</span> {selectedUser.name}
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
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
                    <DialogContent className="dark:bg-gray-800">
                        <DialogHeader>
                            <DialogTitle className="text-orange-800">Reset Password</DialogTitle>
                            <DialogDescription>
                                Send a password reset email to this user
                            </DialogDescription>
                        </DialogHeader>
                        {selectedUser && (
                            <div className="py-4">
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                    <span className="font-medium">User:</span> {selectedUser.name}
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-medium">Email:</span> {selectedUser.email}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
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

                {/* Set Password Manually Dialog */}
                <Dialog open={showSetPasswordDialog} onOpenChange={setShowSetPasswordDialog}>
                    <DialogContent className="dark:bg-gray-800">
                        <DialogHeader>
                            <DialogTitle className="text-purple-800 flex items-center gap-2">
                                <Key className="h-5 w-5" />
                                Set Password Manually
                            </DialogTitle>
                            <DialogDescription>
                                Set a new password for this user directly
                            </DialogDescription>
                        </DialogHeader>
                        {selectedUser && (
                            <div className="space-y-4 py-4">
                                <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        <span className="font-medium">User:</span> {selectedUser.name}
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        <span className="font-medium">Email:</span> {selectedUser.email}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        New Password *
                                    </label>
                                    <Input
                                        type="password"
                                        value={manualPassword.password}
                                        onChange={(e) => setManualPassword({ ...manualPassword, password: e.target.value })}
                                        placeholder="Enter new password (min 8 characters)"
                                        className="border-purple-200 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:border-purple-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Confirm Password *
                                    </label>
                                    <Input
                                        type="password"
                                        value={manualPassword.password_confirmation}
                                        onChange={(e) => setManualPassword({ ...manualPassword, password_confirmation: e.target.value })}
                                        placeholder="Confirm new password"
                                        className="border-purple-200 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:border-purple-500"
                                    />
                                </div>

                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                                    <p className="text-sm text-yellow-800 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        Make sure to securely share the new password with the user.
                                    </p>
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowSetPasswordDialog(false);
                                    setManualPassword({ password: '', password_confirmation: '' });
                                }}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={handleSetPassword}
                                disabled={saving || manualPassword.password.length < 8 || manualPassword.password !== manualPassword.password_confirmation}
                            >
                                {saving ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Set Password'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Add User Dialog */}
                <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
                    <DialogContent className="sm:max-w-2xl dark:bg-gray-800">
                        <DialogHeader>
                            <DialogTitle className="text-maroon-800 dark:text-gray-200">Add New User</DialogTitle>
                            <DialogDescription>
                                Create a new user account
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Full Name *
                                    </label>
                                    <Input
                                        value={addFormData.name}
                                        onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                                        placeholder="Enter full name"
                                        className="border-beige-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Email Address *
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type="email"
                                            value={addFormData.email}
                                            onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                                            placeholder="Enter email address"
                                            className={`border-beige-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 pr-10 ${addFormData.email && !addEmailValidation.checking && addEmailValidation.exists
                                                ? 'border-red-400 focus:border-red-500'
                                                : addEmailValidation.valid
                                                    ? 'border-green-400 focus:border-green-500'
                                                    : ''
                                                }`}
                                        />
                                        {/* Email validation indicator */}
                                        {addFormData.email && /\S+@\S+\.\S+/.test(addFormData.email) && (
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                {addEmailValidation.checking ? (
                                                    <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
                                                ) : addEmailValidation.valid ? (
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                ) : addEmailValidation.exists ? (
                                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                                ) : null}
                                            </div>
                                        )}
                                    </div>
                                    {/* Email validation message */}
                                    {addFormData.email && addEmailValidation.message && !addEmailValidation.checking && (
                                        <p className={`text-xs mt-1 flex items-center ${addEmailValidation.valid ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {addEmailValidation.valid ? (
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                            ) : (
                                                <AlertCircle className="h-3 w-3 mr-1" />
                                            )}
                                            {addEmailValidation.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Password *
                                    </label>
                                    <Input
                                        type="password"
                                        value={addFormData.password}
                                        onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                                        placeholder="Enter password (min 8 characters)"
                                        className="border-beige-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum 8 characters required</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Role *
                                    </label>
                                    <select
                                        value={addFormData.role}
                                        onChange={(e) => setAddFormData({ ...addFormData, role: e.target.value as 'admin' | 'alumni' })}
                                        className="w-full border border-beige-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 rounded-md px-3 py-2 text-sm"
                                    >
                                        <option value="alumni">Alumni</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Status *
                                    </label>
                                    <select
                                        value={addFormData.status}
                                        onChange={(e) => setAddFormData({ ...addFormData, status: e.target.value as 'active' | 'inactive' | 'pending' })}
                                        className="w-full border border-beige-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 rounded-md px-3 py-2 text-sm"
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
                                    setAddEmailValidation({ checking: false, exists: false, valid: false, message: '' });
                                }}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-maroon-700 hover:bg-maroon-800"
                                onClick={handleAddUser}
                                disabled={saving || addEmailValidation.checking || addEmailValidation.exists}
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

                {/* Role Change Dialog */}
                <Dialog open={showRoleChangeDialog} onOpenChange={setShowRoleChangeDialog}>
                    <DialogContent className="max-w-md dark:bg-gray-800">
                        <DialogHeader>
                            <DialogTitle className="text-maroon-800 dark:text-gray-200 flex items-center">
                                <Crown className="h-5 w-5 mr-2 text-purple-600" />
                                Change User Role
                            </DialogTitle>
                            <DialogDescription>
                                Change the role for this user. This action will be logged.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedUser && (
                            <div className="space-y-4 py-4">
                                <div className="p-3 bg-beige-50 dark:bg-gray-900 rounded-lg space-y-2">
                                    <div className="font-medium text-maroon-800 dark:text-gray-200">{selectedUser.name}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">{selectedUser.email}</div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Current Role:</span>
                                        {getRoleBadge(selectedUser.role)}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        New Role *
                                    </label>
                                    <select
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value)}
                                        className="w-full border border-beige-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:border-maroon-500 focus:ring-maroon-500"
                                    >
                                        <option value="alumni">Alumni - Regular user access</option>
                                        <option value="admin">Admin - Management access</option>
                                        <option value="super_admin">Super Admin - Full system access</option>
                                    </select>
                                </div>

                                {newRole === 'super_admin' && (
                                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                        <p className="text-sm text-purple-800 font-medium flex items-center">
                                            <Crown className="h-4 w-4 mr-2" />
                                            Super Admin Warning
                                        </p>
                                        <p className="text-xs text-purple-700 mt-1">
                                            This user will have full system access including the ability to manage other admins.
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Reason (Optional)
                                    </label>
                                    <textarea
                                        value={roleChangeReason}
                                        onChange={(e) => setRoleChangeReason(e.target.value)}
                                        placeholder="Why is this role change being made?"
                                        rows={3}
                                        className="w-full border border-beige-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:border-maroon-500 focus:ring-maroon-500"
                                    />
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowRoleChangeDialog(false);
                                    setNewRole('');
                                    setRoleChangeReason('');
                                    setRequiresConfirmation(false);
                                }}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={handleRoleChange}
                                disabled={saving || !newRole}
                            >
                                {saving ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Changing Role...
                                    </>
                                ) : (
                                    <>
                                        <Crown className="h-4 w-4 mr-2" />
                                        {requiresConfirmation ? 'Confirm Change' : 'Change Role'}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminBaseLayout >
    );
}