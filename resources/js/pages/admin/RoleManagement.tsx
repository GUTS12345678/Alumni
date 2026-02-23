import React, { useState, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Shield,
    Search,
    Plus,
    Edit,
    Trash2,
    Eye,
    Loader2,
    Users,
    Key,
    ChevronRight,
    Crown,
    Lock,
    CheckCircle,
    AlertCircle,
    Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';

// Helper function to get CSRF token
const getCsrfToken = (): string => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
};

interface Permission {
    id: number;
    name: string;
    display_name: string;
    description?: string;
    category: string;
}

interface Role {
    id: number;
    name: string;
    display_name: string;
    description: string;
    is_system_role: boolean;
    is_active: boolean;
    users_count: number;
    permissions: number[];
    permissions_details: { id: number; name: string; display_name: string }[];
    created_at: string;
    updated_at: string;
}

interface Stats {
    total_roles: number;
    total_permissions: number;
    total_users_with_roles: number;
    most_used_role: string;
    permission_categories: { name: string; count: number }[];
}

export default function RoleManagement() {
    const { toast } = useToast();
    const { confirm, confirmState, handleConfirm, handleCancel } = useConfirmDialog();

    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        display_name: '',
        description: '',
    });
    const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // View state
    const [viewingRole, setViewingRole] = useState<Role | null>(null);

    const fetchRoles = useCallback(async () => {
        try {
            const response = await fetch('/api/v1/admin/roles', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setRoles(data.data);
                }
            }
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        }
    }, []);

    const fetchPermissions = useCallback(async () => {
        try {
            const response = await fetch('/api/v1/admin/permissions', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setPermissions(data.data);
                }
            }
        } catch (error) {
            console.error('Failed to fetch permissions:', error);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const response = await fetch('/api/v1/admin/permissions/stats', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setStats(data.data);
                }
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, []);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([fetchRoles(), fetchPermissions(), fetchStats()]);
            setLoading(false);
        };
        load();
    }, [fetchRoles, fetchPermissions, fetchStats]);

    const filteredRoles = roles.filter((role) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            role.name.toLowerCase().includes(s) ||
            role.display_name.toLowerCase().includes(s) ||
            role.description.toLowerCase().includes(s)
        );
    });

    const openForm = (role?: Role) => {
        if (role) {
            setEditingRole(role);
            setFormData({
                name: role.name,
                display_name: role.display_name,
                description: role.description,
            });
            setSelectedPermissions(new Set(role.permissions));
        } else {
            setEditingRole(null);
            setFormData({ name: '', display_name: '', description: '' });
            setSelectedPermissions(new Set());
        }
        setValidationErrors({});
        setShowForm(true);
    };

    const handleDisplayNameChange = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            display_name: value,
            // Auto-generate name only when creating
            ...(!editingRole
                ? {
                    name: value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '_')
                        .replace(/^_+|_+$/g, ''),
                }
                : {}),
        }));
    };

    const togglePermission = (permId: number) => {
        setSelectedPermissions((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(permId)) {
                newSet.delete(permId);
            } else {
                newSet.add(permId);
            }
            return newSet;
        });
    };

    const toggleCategory = (category: string) => {
        const catPerms = permissions.filter((p) => p.category === category).map((p) => p.id);
        const allSelected = catPerms.every((id) => selectedPermissions.has(id));
        setSelectedPermissions((prev) => {
            const newSet = new Set(prev);
            if (allSelected) {
                catPerms.forEach((id) => newSet.delete(id));
            } else {
                catPerms.forEach((id) => newSet.add(id));
            }
            return newSet;
        });
    };

    const groupPermissionsByCategory = (perms: Permission[]) => {
        const grouped: Record<string, Permission[]> = {};
        perms.forEach((p) => {
            if (!grouped[p.category]) grouped[p.category] = [];
            grouped[p.category].push(p);
        });
        return grouped;
    };

    const saveRole = async () => {
        // Validate
        const errors: Record<string, string> = {};
        if (!formData.display_name.trim()) errors.display_name = 'Display name is required';
        if (!formData.name.trim()) errors.name = 'Role name is required';
        else if (!/^[a-z0-9_]+$/.test(formData.name)) errors.name = 'Only lowercase letters, numbers, and underscores';
        if (!formData.description.trim()) errors.description = 'Description is required';
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        setSaving(true);
        try {
            const url = editingRole
                ? `/api/v1/admin/roles/${editingRole.id}`
                : '/api/v1/admin/roles';
            const method = editingRole ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'include',
                body: JSON.stringify({
                    ...formData,
                    permission_ids: Array.from(selectedPermissions),
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast({
                    title: editingRole ? 'Role Updated' : 'Role Created',
                    description: `"${formData.display_name}" has been ${editingRole ? 'updated' : 'created'} successfully.`,
                });
                setShowForm(false);
                fetchRoles();
                fetchStats();
            } else {
                if (response.status === 422 && data.errors) {
                    const fieldErrors: Record<string, string> = {};
                    Object.entries(data.errors).forEach(([key, msgs]) => {
                        fieldErrors[key] = Array.isArray(msgs) ? msgs[0] : String(msgs);
                    });
                    setValidationErrors(fieldErrors);
                }
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to save role.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to save role:', error);
            toast({
                title: 'Error',
                description: 'Failed to save role.',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const deleteRole = async (role: Role) => {
        if (role.is_system_role) {
            toast({
                title: 'Cannot Delete',
                description: 'System roles cannot be deleted.',
                variant: 'destructive',
            });
            return;
        }
        const ok = await confirm({ title: 'Delete Role', message: `Are you sure you want to delete the "${role.display_name}" role? This cannot be undone.`, variant: 'destructive', confirmLabel: 'Delete' });
        if (!ok) return;

        try {
            const response = await fetch(`/api/v1/admin/roles/${role.id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'include',
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast({
                    title: 'Role Deleted',
                    description: `"${role.display_name}" has been deleted.`,
                });
                fetchRoles();
                fetchStats();
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to delete role.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to delete role:', error);
        }
    };

    const getRoleIcon = (role: Role) => {
        if (role.name === 'super_admin') return <Crown className="w-16 h-16 text-yellow-400" />;
        if (role.name === 'admin') return <Shield className="w-16 h-16 text-maroon-400" />;
        if (role.name === 'alumni') return <Users className="w-16 h-16 text-blue-400" />;
        return <Key className="w-16 h-16 text-gray-400" />;
    };

    const getRoleGradient = (role: Role) => {
        if (role.name === 'super_admin') return 'from-yellow-50 to-amber-100';
        if (role.name === 'admin') return 'from-maroon-50 to-maroon-100';
        if (role.name === 'alumni') return 'from-blue-50 to-blue-100';
        return 'from-gray-50 to-gray-100';
    };

    const getRoleBorderColor = (role: Role) => {
        if (role.name === 'super_admin') return 'hover:border-yellow-400';
        if (role.name === 'admin') return 'hover:border-maroon-400';
        if (role.name === 'alumni') return 'hover:border-blue-400';
        return 'hover:border-gray-400';
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <AdminBaseLayout title="Role Management">
            <Head title="Role Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Shield className="h-6 w-6" />
                            Role Management
                        </h1>
                        <p className="text-muted-foreground">
                            Create and manage roles with granular permissions
                        </p>
                    </div>
                    <Button onClick={() => openForm()}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Role
                    </Button>
                </div>

                {/* Statistics */}
                {stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Roles</p>
                                        <p className="text-2xl font-bold">{stats.total_roles}</p>
                                    </div>
                                    <Shield className="h-8 w-8 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Permissions</p>
                                        <p className="text-2xl font-bold text-blue-600">{stats.total_permissions}</p>
                                    </div>
                                    <Key className="h-8 w-8 text-blue-600" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Users</p>
                                        <p className="text-2xl font-bold text-green-600">{stats.total_users_with_roles}</p>
                                    </div>
                                    <Users className="h-8 w-8 text-green-600" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Most Used</p>
                                        <p className="text-2xl font-bold text-maroon-600">{stats.most_used_role}</p>
                                    </div>
                                    <Crown className="h-8 w-8 text-maroon-600" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search roles..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Roles Count */}
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-maroon-800 dark:text-gray-200">
                        {loading ? 'Loading...' : `${filteredRoles.length} Roles`}
                    </h2>
                </div>

                {/* Roles Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredRoles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground bg-white dark:bg-gray-800 rounded-2xl border border-beige-200 dark:border-gray-700">
                        <Shield className="h-16 w-16 mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium">No roles found</h3>
                        <p className="text-sm">Create your first custom role to get started</p>
                        <Button variant="link" onClick={() => openForm()} className="mt-2 text-maroon-600 dark:text-gray-400">
                            Create role
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRoles.map((role) => (
                            <div
                                key={role.id}
                                onClick={() => setViewingRole(role)}
                                className={cn(
                                    'group bg-white dark:bg-gray-800 rounded-2xl border border-beige-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:-translate-y-1',
                                    getRoleBorderColor(role)
                                )}
                            >
                                {/* Icon Header */}
                                <div className={cn('h-48 flex items-center justify-center relative bg-gradient-to-br', getRoleGradient(role))}>
                                    {getRoleIcon(role)}
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        {role.is_system_role && (
                                            <Badge className="bg-amber-100 text-amber-800 text-xs">
                                                <Lock className="h-3 w-3 mr-1" /> System
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <Badge variant={role.is_active ? 'default' : 'secondary'} className="text-xs">
                                            {role.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-5">
                                    <h3 className="text-lg font-bold text-maroon-900 dark:text-gray-100 mb-1 group-hover:text-maroon-700 dark:group-hover:text-gray-300 transition-colors line-clamp-1">
                                        {role.display_name}
                                    </h3>
                                    <p className="text-maroon-600 dark:text-gray-400 text-sm font-medium mb-2 font-mono">
                                        {role.name}
                                    </p>

                                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                                        {role.description || 'No description provided'}
                                    </p>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center">
                                                <Users className="w-3 h-3 mr-1" />
                                                {role.users_count} users
                                            </span>
                                            <span className="flex items-center">
                                                <Key className="w-3 h-3 mr-1" />
                                                {role.permissions.length} perms
                                            </span>
                                        </div>
                                        <span className="flex items-center text-maroon-600 dark:text-gray-400 text-sm font-medium group-hover:text-maroon-800 dark:group-hover:text-gray-200">
                                            View
                                            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </div>
                                </div>

                                {/* Quick Actions Bar */}
                                <div className="border-t border-beige-200 dark:border-gray-700 px-5 py-2 flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openForm(role);
                                        }}
                                        className="h-7 text-xs"
                                    >
                                        <Edit className="h-3 w-3 mr-1" /> Edit
                                    </Button>
                                    {!role.is_system_role && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteRole(role);
                                            }}
                                            className="h-7 text-xs text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-3 w-3 mr-1" /> Delete
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Role Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingRole ? 'Edit Role' : 'Create New Role'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingRole
                                ? 'Update the role details and permissions'
                                : 'Define a new role with specific permissions'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Role Details */}
                        <div className="space-y-4">
                            <div>
                                <Label>
                                    Display Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={formData.display_name}
                                    onChange={(e) => handleDisplayNameChange(e.target.value)}
                                    placeholder="e.g., Content Manager"
                                    className={validationErrors.display_name ? 'border-red-500' : ''}
                                />
                                {validationErrors.display_name && (
                                    <p className="text-red-500 text-xs mt-1">{validationErrors.display_name}</p>
                                )}
                            </div>

                            <div>
                                <Label>
                                    Role Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., content_manager"
                                    disabled={editingRole?.is_system_role}
                                    className={cn(
                                        'font-mono',
                                        validationErrors.name ? 'border-red-500' : ''
                                    )}
                                />
                                {validationErrors.name && (
                                    <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
                                )}
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Lowercase letters, numbers, and underscores only
                                </p>
                            </div>

                            <div>
                                <Label>
                                    Description <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe what this role can do..."
                                    rows={3}
                                    className={validationErrors.description ? 'border-red-500' : ''}
                                />
                                {validationErrors.description && (
                                    <p className="text-red-500 text-xs mt-1">{validationErrors.description}</p>
                                )}
                            </div>
                        </div>

                        {/* Permissions */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <Label className="text-base font-semibold">Permissions</Label>
                                <Badge className="bg-blue-100 text-blue-800">
                                    {selectedPermissions.size} of {permissions.length} selected
                                </Badge>
                            </div>

                            {editingRole?.is_system_role && editingRole?.name === 'super_admin' ? (
                                <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    Super Admin has all permissions and cannot be modified.
                                </div>
                            ) : permissions.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Key className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>No permissions available</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                                    {Object.entries(groupPermissionsByCategory(permissions)).map(
                                        ([category, catPerms]) => {
                                            const catPermIds = catPerms.map((p) => p.id);
                                            const allSelected = catPermIds.every((id) =>
                                                selectedPermissions.has(id)
                                            );

                                            return (
                                                <div
                                                    key={category}
                                                    className="border border-beige-200 dark:border-gray-700 rounded-lg p-4"
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <Shield className="h-4 w-4 text-maroon-600 dark:text-gray-400" />
                                                            <span className="font-semibold text-maroon-800 dark:text-gray-200 text-sm">
                                                                {category}
                                                            </span>
                                                            <Badge variant="secondary" className="text-xs">
                                                                {catPerms.length}
                                                            </Badge>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            onClick={() => toggleCategory(category)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 text-xs"
                                                        >
                                                            {allSelected ? 'Deselect All' : 'Select All'}
                                                        </Button>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {catPerms.map((perm) => {
                                                            const isSelected = selectedPermissions.has(perm.id);
                                                            return (
                                                                <div
                                                                    key={perm.id}
                                                                    onClick={() => togglePermission(perm.id)}
                                                                    className={cn(
                                                                        'border rounded-lg p-3 cursor-pointer transition-colors',
                                                                        isSelected
                                                                            ? 'border-maroon-500 bg-maroon-50 dark:bg-maroon-900/30'
                                                                            : 'border-beige-200 dark:border-gray-700 hover:bg-beige-50 dark:hover:bg-gray-700'
                                                                    )}
                                                                >
                                                                    <div className="flex items-start gap-2">
                                                                        <div className="mt-0.5">
                                                                            {isSelected ? (
                                                                                <CheckCircle className="h-4 w-4 text-maroon-600 dark:text-gray-400" />
                                                                            ) : (
                                                                                <div className="h-4 w-4 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p
                                                                                className={cn(
                                                                                    'font-medium text-sm',
                                                                                    isSelected ? 'text-maroon-800 dark:text-gray-200' : 'text-gray-800 dark:text-gray-200'
                                                                                )}
                                                                            >
                                                                                {perm.display_name}
                                                                            </p>
                                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                                                                                {perm.name}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowForm(false)}>
                            Cancel
                        </Button>
                        <Button onClick={saveRole} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            <Save className="h-4 w-4 mr-2" />
                            {editingRole ? 'Update Role' : 'Create Role'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Role Dialog */}
            <Dialog open={!!viewingRole} onOpenChange={() => setViewingRole(null)}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    {viewingRole && (
                        <>
                            <DialogHeader>
                                <div className="flex items-start gap-4">
                                    <div
                                        className={cn(
                                            'p-3 rounded-lg bg-gradient-to-br',
                                            getRoleGradient(viewingRole)
                                        )}
                                    >
                                        {viewingRole.name === 'super_admin' ? (
                                            <Crown className="h-8 w-8 text-yellow-600" />
                                        ) : viewingRole.name === 'admin' ? (
                                            <Shield className="h-8 w-8 text-maroon-600" />
                                        ) : viewingRole.name === 'alumni' ? (
                                            <Users className="h-8 w-8 text-blue-600" />
                                        ) : (
                                            <Key className="h-8 w-8 text-gray-600" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <DialogTitle className="text-xl">
                                                {viewingRole.display_name}
                                            </DialogTitle>
                                            {viewingRole.is_system_role && (
                                                <Badge className="bg-amber-100 text-amber-800 text-xs">
                                                    <Lock className="h-3 w-3 mr-1" />
                                                    System
                                                </Badge>
                                            )}
                                        </div>
                                        <DialogDescription className="font-mono">
                                            {viewingRole.name}
                                        </DialogDescription>
                                    </div>
                                    <Badge variant={viewingRole.is_active ? 'default' : 'secondary'}>
                                        {viewingRole.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            </DialogHeader>

                            <div className="space-y-6 mt-4">
                                {/* Description */}
                                <div>
                                    <h4 className="font-semibold mb-2">Description</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {viewingRole.description || 'No description provided'}
                                    </p>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Users</p>
                                            <p className="font-semibold">{viewingRole.users_count}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                        <Key className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Permissions</p>
                                            <p className="font-semibold">{viewingRole.permissions.length}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                                            <p className="font-semibold">{formatDate(viewingRole.created_at)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Permissions List */}
                                <div>
                                    <h4 className="font-semibold mb-3">
                                        Assigned Permissions ({viewingRole.permissions_details.length})
                                    </h4>
                                    {viewingRole.permissions_details.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            No permissions assigned to this role.
                                        </p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {viewingRole.permissions_details.map((perm) => (
                                                <Badge
                                                    key={perm.id}
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    <Key className="h-3 w-3 mr-1" />
                                                    {perm.display_name}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <DialogFooter className="mt-6">
                                <Button variant="outline" onClick={() => setViewingRole(null)}>
                                    Close
                                </Button>
                                <Button
                                    onClick={() => {
                                        setViewingRole(null);
                                        openForm(viewingRole);
                                    }}
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Role
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
            <ConfirmDialog open={confirmState.open} title={confirmState.title} message={confirmState.message} confirmLabel={confirmState.confirmLabel} cancelLabel={confirmState.cancelLabel} variant={confirmState.variant} onConfirm={handleConfirm} onCancel={handleCancel} />
        </AdminBaseLayout>
    );
}
