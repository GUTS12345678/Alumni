import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Edit,
    Trash2,
    RefreshCw,
    Shield,
    Users,
    Key,
    Crown,
    AlertCircle
} from 'lucide-react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import { router } from '@inertiajs/react';

interface Permission {
    id: string;
    name: string;
    display_name: string;
    description: string;
    category: string;
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

interface Props {
    roleId: string;
}

export default function RoleView({ roleId }: Props) {
    const [role, setRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRole = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const response = await fetch(`/api/v1/admin/roles/${roleId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.status === 401) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch role details');
            }

            const data = await response.json();
            if (data.success) {
                setRole(data.data);
            } else {
                throw new Error(data.message || 'Failed to load role');
            }
        } catch (err) {
            console.error('Role fetch error:', err);
            setError(err instanceof Error ? err.message : 'Failed to load role details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRole();
    }, [roleId]);

    const handleEdit = () => {
        router.visit(`/admin/roles/${roleId}/edit`);
    };

    const handleDelete = async () => {
        if (!role) return;

        if (role.is_default) {
            alert('Cannot delete default system roles');
            return;
        }

        if (!confirm(`Are you sure you want to delete the "${role.display_name}" role? This action cannot be undone.`)) {
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
                router.visit('/admin/permissions');
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to delete role');
            }
        } catch (error) {
            console.error('Delete role error:', error);
            alert('Failed to delete role');
        }
    };

    const handleBack = () => {
        router.visit('/admin/permissions');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const groupPermissionsByCategory = (permissions: Permission[]) => {
        const grouped: { [key: string]: Permission[] } = {};
        
        permissions.forEach(permission => {
            if (!grouped[permission.category]) {
                grouped[permission.category] = [];
            }
            grouped[permission.category].push(permission);
        });
        
        return grouped;
    };

    if (loading) {
        return (
            <AdminBaseLayout title="View Role">
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="h-8 w-8 text-maroon-600 animate-spin" />
                        <span className="text-maroon-800 font-medium">Loading role details...</span>
                    </div>
                </div>
            </AdminBaseLayout>
        );
    }

    if (error || !role) {
        return (
            <AdminBaseLayout title="View Role">
                <Card className="border-red-200">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                            <p className="text-red-600 mb-4">{error || 'Role not found'}</p>
                            <div className="flex justify-center space-x-2">
                                <Button onClick={() => fetchRole()} className="bg-maroon-700 hover:bg-maroon-800">
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Retry
                                </Button>
                                <Button onClick={handleBack} variant="outline">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Permissions
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </AdminBaseLayout>
        );
    }

    const permissionsByCategory = groupPermissionsByCategory(role.permissions);

    return (
        <AdminBaseLayout title={`Role: ${role.display_name}`}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center space-x-4">
                        <Button
                            onClick={handleBack}
                            variant="outline"
                            className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <div className="flex items-center space-x-2">
                                <h2 className="text-2xl font-bold text-maroon-800">{role.display_name}</h2>
                                {role.is_default && (
                                    <Badge className="bg-blue-100 text-blue-800">
                                        <Crown className="h-3 w-3 mr-1" />
                                        Default Role
                                    </Badge>
                                )}
                            </div>
                            <p className="text-maroon-600 mt-1">{role.description}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={handleEdit}
                            className="bg-maroon-700 hover:bg-maroon-800 text-white"
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Role
                        </Button>
                        {!role.is_default && (
                            <Button
                                onClick={handleDelete}
                                variant="outline"
                                className="border-red-300 text-red-700 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        )}
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">Total Permissions</CardTitle>
                            <Key className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{role.permissions.length}</div>
                            <p className="text-xs text-maroon-600 mt-1">Assigned permissions</p>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">Users with Role</CardTitle>
                            <Users className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{role.users_count}</div>
                            <p className="text-xs text-maroon-600 mt-1">Active users</p>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800">Categories</CardTitle>
                            <Shield className="h-4 w-4 text-maroon-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">
                                {Object.keys(permissionsByCategory).length}
                            </div>
                            <p className="text-xs text-maroon-600 mt-1">Permission groups</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Role Details */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800">Role Information</CardTitle>
                        <CardDescription className="text-maroon-600">
                            Basic details about this role
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Role Name</dt>
                                <dd className="mt-1 text-sm text-gray-900">{role.name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Display Name</dt>
                                <dd className="mt-1 text-sm text-gray-900">{role.display_name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Guard</dt>
                                <dd className="mt-1 text-sm text-gray-900">{role.guard_name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Type</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {role.is_default ? 'System Default' : 'Custom'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Created</dt>
                                <dd className="mt-1 text-sm text-gray-900">{formatDate(role.created_at)}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                                <dd className="mt-1 text-sm text-gray-900">{formatDate(role.updated_at)}</dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                {/* Permissions by Category */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800">Permissions</CardTitle>
                        <CardDescription className="text-maroon-600">
                            {role.permissions.length} permissions assigned to this role
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {role.permissions.length === 0 ? (
                            <div className="text-center py-8">
                                <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Permissions</h3>
                                <p className="text-gray-500 mb-4">This role has no permissions assigned</p>
                                <Button
                                    onClick={handleEdit}
                                    className="bg-maroon-700 hover:bg-maroon-800 text-white"
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Add Permissions
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                                    <div key={category}>
                                        <h3 className="font-semibold text-maroon-800 mb-3 flex items-center">
                                            <Shield className="h-4 w-4 mr-2" />
                                            {category}
                                            <Badge className="ml-2 bg-gray-100 text-gray-700">
                                                {permissions.length}
                                            </Badge>
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {permissions.map((permission) => (
                                                <div
                                                    key={permission.id}
                                                    className="border border-beige-200 rounded-lg p-3 hover:bg-beige-50"
                                                >
                                                    <div className="flex items-start space-x-2">
                                                        <Key className="h-4 w-4 text-maroon-600 mt-0.5 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm text-maroon-800">
                                                                {permission.display_name}
                                                            </p>
                                                            <p className="text-xs text-gray-600 mt-1">
                                                                {permission.description}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {permission.name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminBaseLayout>
    );
}
