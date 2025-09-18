import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    Plus,
    Edit,
    Trash2,
    RefreshCw,
    Shield,
    Users,
    Settings,
    Key,
    Crown,
    Eye,
    CheckCircle,
    XCircle
} from 'lucide-react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';

interface Permission {
    id: string;
    name: string;
    display_name: string;
    description: string;
    category: string;
    guard_name: string;
    created_at: string;
    updated_at: string;
}

interface Role {
    id: string;
    name: string;
    display_name: string;
    description: string;
    guard_name: string;
    permissions: Permission[];
    users_count: number;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

interface User {
    id: string;
    name: string;
    email: string;
    roles: Role[];
    permissions: Permission[];
    last_login_at: string;
    is_active: boolean;
    created_at: string;
}

interface PermissionStats {
    total_roles: number;
    total_permissions: number;
    total_users_with_roles: number;
    most_used_role: string;
    permission_categories: { name: string; count: number }[];
}

export default function PermissionsManagement() {
    const [activeTab, setActiveTab] = useState<'roles' | 'permissions' | 'users'>('roles');
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<PermissionStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);

            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const [rolesResponse, permissionsResponse, usersResponse, statsResponse] = await Promise.all([
                fetch('/api/v1/admin/roles', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                }),
                fetch('/api/v1/admin/permissions', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                }),
                fetch('/api/v1/admin/users/with-roles', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                }),
                fetch('/api/v1/admin/permissions/stats', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                })
            ]);

            if (!rolesResponse.ok || !permissionsResponse.ok || !usersResponse.ok || !statsResponse.ok) {
                if (rolesResponse.status === 401 || permissionsResponse.status === 401 ||
                    usersResponse.status === 401 || statsResponse.status === 401) {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    return;
                }
                throw new Error('Failed to fetch permissions data');
            }

            const [rolesData, permissionsData, usersData, statsData] = await Promise.all([
                rolesResponse.json(),
                permissionsResponse.json(),
                usersResponse.json(),
                statsResponse.json()
            ]);

            if (rolesData.success) setRoles(rolesData.data);
            if (permissionsData.success) setPermissions(permissionsData.data);
            if (usersData.success) setUsers(usersData.data);
            if (statsData.success) setStats(statsData.data);

        } catch (err) {
            console.error('Permissions fetch error:', err);
            setError('Failed to load permissions data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // const assignRole = async (userId: string, roleId: string) => {
    //     try {
    //         const token = localStorage.getItem('auth_token');
    //         const response = await fetch(`/api/v1/admin/users/${userId}/roles`, {
    //             method: 'POST',
    //             headers: {
    //                 'Authorization': `Bearer ${token}`,
    //                 'Accept': 'application/json',
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({ role_ids: [roleId] }),
    //         });

    //         if (response.ok) {
    //             fetchData();
    //         }
    //     } catch (error) {
    //         console.error('Assign role error:', error);
    //     }
    // };

    const removeRole = async (userId: string, roleId: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/v1/admin/users/${userId}/roles/${roleId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                fetchData();
            }
        } catch (error) {
            console.error('Remove role error:', error);
        }
    };

    const deleteRole = async (roleId: string) => {
        if (!confirm('Are you sure you want to delete this role?')) {
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/v1/admin/roles/${roleId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                fetchData();
            }
        } catch (error) {
            console.error('Delete role error:', error);
        }
    };

    const getRoleBadge = (role: Role) => {
        if (role.is_default) {
            return <Badge className="bg-blue-100 text-blue-800"><Crown className="h-3 w-3 mr-1" />Default</Badge>;
        }
        return <Badge className="bg-purple-100 text-purple-800">Custom</Badge>;
    };

    const getStatusBadge = (isActive: boolean) => {
        return isActive
            ? <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>
            : <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Inactive</Badge>;
    };

    const getCategoryBadge = (category: string) => {
        const categoryColors = [
            'bg-blue-100 text-blue-800',
            'bg-purple-100 text-purple-800',
            'bg-orange-100 text-orange-800',
            'bg-teal-100 text-teal-800',
            'bg-pink-100 text-pink-800',
        ];

        const colorIndex = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % categoryColors.length;

        return (
            <Badge className={categoryColors[colorIndex]}>
                {category}
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

    const filterRoles = (roles: Role[]) => {
        return roles.filter(role =>
            role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            role.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            role.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const filterPermissions = (permissions: Permission[]) => {
        return permissions.filter(permission => {
            const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                permission.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                permission.description.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory = !selectedCategory || permission.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    };

    const filterUsers = (users: User[]) => {
        return users.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    if (loading) {
        return (
            <AdminBaseLayout title="Permissions Management">
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="h-8 w-8 text-maroon-600 animate-spin" />
                        <span className="text-maroon-800 font-medium">Loading permissions...</span>
                    </div>
                </div>
            </AdminBaseLayout>
        );
    }

    if (error) {
        return (
            <AdminBaseLayout title="Permissions Management">
                <Card className="border-red-200">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-red-600 mb-4">{error}</p>
                            <Button onClick={() => fetchData()} className="bg-maroon-700 hover:bg-maroon-800">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </AdminBaseLayout>
        );
    }

    const categories = stats?.permission_categories || [];

    return (
        <AdminBaseLayout title="Permissions Management">
            <div className="space-y-6">
                {/* Header with Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-maroon-800">Permissions & Roles</h2>
                        <p className="text-maroon-600">Manage user roles and permissions</p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={() => window.location.href = '/admin/roles/create'}
                            className="bg-maroon-700 hover:bg-maroon-800 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Role
                        </Button>
                    </div>
                </div>

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800">Total Roles</CardTitle>
                                <Shield className="h-4 w-4 text-maroon-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-maroon-800">{stats.total_roles}</div>
                                <p className="text-xs text-maroon-600 mt-1">Configured roles</p>
                            </CardContent>
                        </Card>

                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800">Permissions</CardTitle>
                                <Key className="h-4 w-4 text-maroon-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">{stats.total_permissions}</div>
                                <p className="text-xs text-maroon-600 mt-1">Available permissions</p>
                            </CardContent>
                        </Card>

                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800">Users with Roles</CardTitle>
                                <Users className="h-4 w-4 text-maroon-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{stats.total_users_with_roles}</div>
                                <p className="text-xs text-maroon-600 mt-1">Assigned users</p>
                            </CardContent>
                        </Card>

                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800">Most Used Role</CardTitle>
                                <Crown className="h-4 w-4 text-maroon-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-purple-600 truncate">{stats.most_used_role}</div>
                                <p className="text-xs text-maroon-600 mt-1">Popular role</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Navigation Tabs */}
                <div className="border-b border-beige-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('roles')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'roles'
                                    ? 'border-maroon-500 text-maroon-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <Shield className="h-4 w-4 inline mr-2" />
                            Roles
                        </button>
                        <button
                            onClick={() => setActiveTab('permissions')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'permissions'
                                    ? 'border-maroon-500 text-maroon-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <Key className="h-4 w-4 inline mr-2" />
                            Permissions
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'users'
                                    ? 'border-maroon-500 text-maroon-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <Users className="h-4 w-4 inline mr-2" />
                            User Assignments
                        </button>
                    </nav>
                </div>

                {/* Search and Filters */}
                <Card className="border-beige-200 shadow-lg">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder={`Search ${activeTab}...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 border-beige-300 focus:border-maroon-400 focus:ring-maroon-200"
                                />
                            </div>

                            {activeTab === 'permissions' && (
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="px-3 py-2 border border-beige-300 rounded-md focus:border-maroon-400 focus:ring-maroon-200"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((category) => (
                                        <option key={category.name} value={category.name}>
                                            {category.name} ({category.count})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Content based on active tab */}
                {activeTab === 'roles' && (
                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl text-maroon-800">Roles</CardTitle>
                            <CardDescription className="text-maroon-600">
                                Manage user roles and their permissions
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {filterRoles(roles).length === 0 ? (
                                <div className="text-center py-8">
                                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No roles found</h3>
                                    <p className="text-gray-500 mb-4">
                                        {searchTerm ? 'Try adjusting your search' : 'Create your first role to get started'}
                                    </p>
                                    <Button
                                        onClick={() => window.location.href = '/admin/roles/create'}
                                        className="bg-maroon-700 hover:bg-maroon-800 text-white"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Role
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filterRoles(roles).map((role) => (
                                        <div key={role.id} className="border border-beige-200 rounded-lg p-4 hover:bg-beige-50">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <h3 className="font-medium text-maroon-800">{role.display_name}</h3>
                                                        {getRoleBadge(role)}
                                                    </div>

                                                    <p className="text-sm text-gray-600 mb-2">{role.description}</p>

                                                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                                                        <span>{role.permissions.length} permissions</span>
                                                        <span>{role.users_count} users</span>
                                                        <span>Created {formatDate(role.created_at)}</span>
                                                    </div>

                                                    <div className="flex flex-wrap gap-1">
                                                        {role.permissions.slice(0, 5).map((permission) => (
                                                            <Badge key={permission.id} className="bg-gray-100 text-gray-700 text-xs">
                                                                {permission.display_name}
                                                            </Badge>
                                                        ))}
                                                        {role.permissions.length > 5 && (
                                                            <Badge className="bg-gray-100 text-gray-700 text-xs">
                                                                +{role.permissions.length - 5} more
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-2 ml-4">
                                                    <Button
                                                        onClick={() => window.location.href = `/admin/roles/${role.id}`}
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>

                                                    <Button
                                                        onClick={() => window.location.href = `/admin/roles/${role.id}/edit`}
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>

                                                    {!role.is_default && (
                                                        <Button
                                                            onClick={() => deleteRole(role.id)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-red-300 text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'permissions' && (
                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl text-maroon-800">Permissions</CardTitle>
                            <CardDescription className="text-maroon-600">
                                Available system permissions
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {filterPermissions(permissions).length === 0 ? (
                                <div className="text-center py-8">
                                    <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No permissions found</h3>
                                    <p className="text-gray-500">
                                        Try adjusting your search or category filter
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filterPermissions(permissions).map((permission) => (
                                        <div key={permission.id} className="border border-beige-200 rounded-lg p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <Key className="h-4 w-4 text-maroon-600" />
                                                        <h3 className="font-medium text-maroon-800">{permission.display_name}</h3>
                                                        {getCategoryBadge(permission.category)}
                                                    </div>

                                                    <p className="text-sm text-gray-600 mb-2">{permission.description}</p>

                                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                        <span>Name: {permission.name}</span>
                                                        <span>Guard: {permission.guard_name}</span>
                                                        <span>Created {formatDate(permission.created_at)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'users' && (
                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl text-maroon-800">User Role Assignments</CardTitle>
                            <CardDescription className="text-maroon-600">
                                Manage user role assignments
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {filterUsers(users).length === 0 ? (
                                <div className="text-center py-8">
                                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                                    <p className="text-gray-500">
                                        Try adjusting your search
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filterUsers(users).map((user) => (
                                        <div key={user.id} className="border border-beige-200 rounded-lg p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <h3 className="font-medium text-maroon-800">{user.name}</h3>
                                                        {getStatusBadge(user.is_active)}
                                                    </div>

                                                    <p className="text-sm text-gray-600 mb-2">{user.email}</p>

                                                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                                                        <span>{user.roles.length} roles</span>
                                                        <span>{user.permissions.length} direct permissions</span>
                                                        {user.last_login_at && (
                                                            <span>Last login: {formatDate(user.last_login_at)}</span>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap gap-1 mb-2">
                                                        {user.roles.map((role) => (
                                                            <div key={role.id} className="flex items-center space-x-1">
                                                                <Badge className="bg-purple-100 text-purple-800">
                                                                    {role.display_name}
                                                                </Badge>
                                                                <Button
                                                                    onClick={() => removeRole(user.id, role.id)}
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0 border-red-300 text-red-700 hover:bg-red-50"
                                                                >
                                                                    <XCircle className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-2 ml-4">
                                                    <Button
                                                        onClick={() => window.location.href = `/admin/users/${user.id}/roles`}
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                                                    >
                                                        <Settings className="h-4 w-4 mr-2" />
                                                        Manage Roles
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminBaseLayout>
    );
}