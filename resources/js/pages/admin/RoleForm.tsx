import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Save,
    RefreshCw,
    Shield,
    Key,
    AlertCircle,
    CheckCircle
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
    id?: string;
    name: string;
    display_name: string;
    description: string;
    guard_name: string;
    permissions: Permission[];
    is_default?: boolean;
}

interface Props {
    roleId?: string;
    mode: 'create' | 'edit';
}

export default function RoleForm({ roleId, mode }: Props) {
    const [formData, setFormData] = useState<Role>({
        name: '',
        display_name: '',
        description: '',
        guard_name: 'web',
        permissions: []
    });
    const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
    const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(mode === 'edit');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

    useEffect(() => {
        fetchPermissions();
        if (mode === 'edit' && roleId) {
            fetchRole();
        }
    }, [mode, roleId]);

    const fetchPermissions = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const response = await fetch('/api/v1/admin/permissions', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setAvailablePermissions(data.data);
                }
            }
        } catch (err) {
            console.error('Permissions fetch error:', err);
        }
    };

    const fetchRole = async () => {
        if (!roleId) return;

        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');
            
            const response = await fetch(`/api/v1/admin/roles/${roleId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setFormData(data.data);
                    setSelectedPermissions(new Set(data.data.permissions.map((p: Permission) => p.id)));
                }
            }
        } catch (err) {
            console.error('Role fetch error:', err);
            setError('Failed to load role details');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof Role, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear validation error for this field
        if (validationErrors[field]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }

        // Auto-generate name from display_name
        if (field === 'display_name' && mode === 'create') {
            const generatedName = value.toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '');
            setFormData(prev => ({ ...prev, name: generatedName }));
        }
    };

    const togglePermission = (permissionId: string) => {
        setSelectedPermissions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(permissionId)) {
                newSet.delete(permissionId);
            } else {
                newSet.add(permissionId);
            }
            return newSet;
        });
    };

    const toggleCategory = (category: string) => {
        const categoryPermissions = availablePermissions
            .filter(p => p.category === category)
            .map(p => p.id);
        
        const allSelected = categoryPermissions.every(id => selectedPermissions.has(id));
        
        setSelectedPermissions(prev => {
            const newSet = new Set(prev);
            if (allSelected) {
                categoryPermissions.forEach(id => newSet.delete(id));
            } else {
                categoryPermissions.forEach(id => newSet.add(id));
            }
            return newSet;
        });
    };

    const validateForm = (): boolean => {
        const errors: {[key: string]: string} = {};

        if (!formData.display_name.trim()) {
            errors.display_name = 'Display name is required';
        }

        if (!formData.name.trim()) {
            errors.name = 'Role name is required';
        } else if (!/^[a-z0-9_]+$/.test(formData.name)) {
            errors.name = 'Role name must contain only lowercase letters, numbers, and underscores';
        }

        if (!formData.description.trim()) {
            errors.description = 'Description is required';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const token = localStorage.getItem('auth_token');
            const url = mode === 'create' 
                ? '/api/v1/admin/roles'
                : `/api/v1/admin/roles/${roleId}`;
            
            const method = mode === 'create' ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    display_name: formData.display_name,
                    description: formData.description,
                    guard_name: formData.guard_name,
                    permission_ids: Array.from(selectedPermissions)
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                router.visit('/admin/permissions');
            } else {
                if (response.status === 422 && data.errors) {
                    setValidationErrors(data.errors);
                    setError('Please fix the validation errors below');
                } else {
                    setError(data.message || 'Failed to save role');
                }
            }
        } catch (err) {
            console.error('Save role error:', err);
            setError('Failed to save role. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        router.visit('/admin/permissions');
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
            <AdminBaseLayout title={mode === 'create' ? 'Create Role' : 'Edit Role'}>
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="h-8 w-8 text-maroon-600 animate-spin" />
                        <span className="text-maroon-800 font-medium">Loading...</span>
                    </div>
                </div>
            </AdminBaseLayout>
        );
    }

    const permissionsByCategory = groupPermissionsByCategory(availablePermissions);

    return (
        <AdminBaseLayout title={mode === 'create' ? 'Create Role' : 'Edit Role'}>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center space-x-4">
                        <Button
                            type="button"
                            onClick={handleBack}
                            variant="outline"
                            className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h2 className="text-2xl font-bold text-maroon-800">
                                {mode === 'create' ? 'Create New Role' : 'Edit Role'}
                            </h2>
                            <p className="text-maroon-600">
                                {mode === 'create' 
                                    ? 'Define a new role with specific permissions' 
                                    : 'Update role details and permissions'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            type="submit"
                            disabled={saving}
                            className="bg-maroon-700 hover:bg-maroon-800 text-white"
                        >
                            {saving ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {mode === 'create' ? 'Create Role' : 'Save Changes'}
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                                <p className="text-red-600 font-medium">{error}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Role Details Form */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800">Role Information</CardTitle>
                        <CardDescription className="text-maroon-600">
                            Basic details about the role
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Display Name <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="text"
                                value={formData.display_name}
                                onChange={(e) => handleInputChange('display_name', e.target.value)}
                                placeholder="e.g., Content Manager"
                                className={`border-beige-300 focus:border-maroon-400 focus:ring-maroon-200 ${
                                    validationErrors.display_name ? 'border-red-500' : ''
                                }`}
                            />
                            {validationErrors.display_name && (
                                <p className="text-red-500 text-sm mt-1">{validationErrors.display_name}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                                User-friendly name that will be displayed in the UI
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Role Name <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="e.g., content_manager"
                                className={`border-beige-300 focus:border-maroon-400 focus:ring-maroon-200 ${
                                    validationErrors.name ? 'border-red-500' : ''
                                }`}
                                disabled={mode === 'edit' && formData.is_default}
                            />
                            {validationErrors.name && (
                                <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                                Technical identifier (lowercase, underscores only)
                                {mode === 'edit' && formData.is_default && ' - Cannot modify default role names'}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                rows={3}
                                placeholder="Describe what this role can do..."
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                    validationErrors.description 
                                        ? 'border-red-500' 
                                        : 'border-beige-300 focus:border-maroon-400 focus:ring-maroon-200'
                                }`}
                            />
                            {validationErrors.description && (
                                <p className="text-red-500 text-sm mt-1">{validationErrors.description}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Guard
                            </label>
                            <Input
                                type="text"
                                value={formData.guard_name}
                                onChange={(e) => handleInputChange('guard_name', e.target.value)}
                                className="border-beige-300 focus:border-maroon-400 focus:ring-maroon-200"
                                disabled
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Authentication guard (usually 'web')
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Permissions Selection */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800 flex items-center justify-between">
                            <span>Permissions</span>
                            <Badge className="bg-blue-100 text-blue-800">
                                {selectedPermissions.size} of {availablePermissions.length} selected
                            </Badge>
                        </CardTitle>
                        <CardDescription className="text-maroon-600">
                            Select the permissions this role should have
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {availablePermissions.length === 0 ? (
                            <div className="text-center py-8">
                                <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No permissions available</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {Object.entries(permissionsByCategory).map(([category, permissions]) => {
                                    const categoryPermissionIds = permissions.map(p => p.id);
                                    const allSelected = categoryPermissionIds.every(id => selectedPermissions.has(id));
                                    const someSelected = categoryPermissionIds.some(id => selectedPermissions.has(id));

                                    return (
                                        <div key={category} className="border border-beige-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-2">
                                                    <Shield className="h-5 w-5 text-maroon-600" />
                                                    <h3 className="font-semibold text-maroon-800">{category}</h3>
                                                    <Badge className="bg-gray-100 text-gray-700">
                                                        {permissions.length}
                                                    </Badge>
                                                </div>
                                                <Button
                                                    type="button"
                                                    onClick={() => toggleCategory(category)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                                                >
                                                    {allSelected ? (
                                                        <>Deselect All</>
                                                    ) : (
                                                        <>Select All</>
                                                    )}
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {permissions.map((permission) => {
                                                    const isSelected = selectedPermissions.has(permission.id);
                                                    return (
                                                        <div
                                                            key={permission.id}
                                                            onClick={() => togglePermission(permission.id)}
                                                            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                                                isSelected
                                                                    ? 'border-maroon-500 bg-maroon-50'
                                                                    : 'border-beige-200 hover:bg-beige-50'
                                                            }`}
                                                        >
                                                            <div className="flex items-start space-x-2">
                                                                <div className="mt-0.5">
                                                                    {isSelected ? (
                                                                        <CheckCircle className="h-5 w-5 text-maroon-600" />
                                                                    ) : (
                                                                        <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`font-medium text-sm ${
                                                                        isSelected ? 'text-maroon-800' : 'text-gray-800'
                                                                    }`}>
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
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Form Actions */}
                <Card className="border-beige-200 shadow-lg">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                            <Button
                                type="button"
                                onClick={handleBack}
                                variant="outline"
                                className="border-gray-300 text-gray-700"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={saving}
                                className="bg-maroon-700 hover:bg-maroon-800 text-white"
                            >
                                {saving ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        {mode === 'create' ? 'Create Role' : 'Save Changes'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </AdminBaseLayout>
    );
}
