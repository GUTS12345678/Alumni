import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import {
    Lock,
    Shield,
    User,
    Check,
    X,
    AlertCircle,
    Save,
    Info,
    Users,
    Eye,
    UserPlus,
    Settings,
    CheckCircle,
    XCircle,
    ChevronDown,
    ChevronUp,
    Plus,
    Trash2,
    Edit
} from 'lucide-react';
import axios from 'axios';

interface PageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            role: 'super_admin' | 'admin' | 'alumni';
            status: string;
        };
    };
}

interface Permission {
    id: number;
    name: string;
    display_name: string;
    description: string;
    category: string;
    module: string;
    user_count?: number;
}

interface Role {
    id: number;
    name: string;
    display_name: string;
    description: string;
    is_system_role: boolean;
    permissions: number[];
}

interface UserWithPermission {
    id: number;
    name: string;
    email: string;
    role: string;
    has_through_role: boolean;
    has_custom: boolean;
}

interface RolePermissions {
    [key: string]: boolean;
}

interface PermissionsState {
    [roleId: number]: RolePermissions;
}

export default function PermissionMatrix({ auth }: PageProps) {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [rolePermissions, setRolePermissions] = useState<PermissionsState>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
    const [usersWithPermission, setUsersWithPermission] = useState<UserWithPermission[]>([]);
    const [showUsersModal, setShowUsersModal] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
    const [selectedRole, setSelectedRole] = useState<number | null>(null);
    const [showAddRoleModal, setShowAddRoleModal] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleDisplayName, setNewRoleDisplayName] = useState('');
    const [newRoleDescription, setNewRoleDescription] = useState('');
    const [creatingRole, setCreatingRole] = useState(false);
    const [deleteConfirmRole, setDeleteConfirmRole] = useState<Role | null>(null);

    // Group permissions by category
    const permissionsByCategory = permissions.reduce((acc, permission) => {
        if (!acc[permission.category]) {
            acc[permission.category] = [];
        }
        acc[permission.category].push(permission);
        return acc;
    }, {} as Record<string, Permission[]>);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (roles.length > 0 && selectedRole === null) {
            // Default to first non-super-admin role (admin)
            const defaultRole = roles.find(r => r.name === 'admin') || roles[0];
            setSelectedRole(defaultRole.id);
        }
    }, [roles]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [permsRes, rolesRes] = await Promise.all([
                axios.get('/api/v1/admin/permissions'),
                axios.get('/api/v1/admin/roles')
            ]);

            if (permsRes.data.success) {
                setPermissions(permsRes.data.data);
            }

            if (rolesRes.data.success) {
                const rolesData = rolesRes.data.data;
                setRoles(rolesData);

                // Build role permissions state
                const state: PermissionsState = {};
                rolesData.forEach((role: Role) => {
                    state[role.id] = {};
                    role.permissions.forEach((permId: number) => {
                        state[role.id][permId] = true;
                    });
                });
                setRolePermissions(state);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (roleId: number, permissionId: number) => {
        const role = roles.find(r => r.id === roleId);
        if (role?.is_system_role && role.name === 'super_admin') {
            // Super admin permissions cannot be changed
            return;
        }

        setRolePermissions(prev => ({
            ...prev,
            [roleId]: {
                ...prev[roleId],
                [permissionId]: !(prev[roleId]?.[permissionId] || false)
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save each role's permissions
            for (const role of roles) {
                if (role.is_system_role && role.name === 'super_admin') {
                    continue; // Skip super admin
                }

                const permissionIds = Object.keys(rolePermissions[role.id] || {})
                    .filter(permId => rolePermissions[role.id][permId])
                    .map(Number);

                await axios.put(`/api/v1/admin/roles/${role.id}/permissions`, {
                    permission_ids: permissionIds
                });
            }

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            fetchData(); // Refresh data
        } catch (error) {
            console.error('Error saving permissions:', error);
            alert('Failed to save permissions');
        } finally {
            setSaving(false);
        }
    };

    const viewUsersWithPermission = async (permission: Permission) => {
        setSelectedPermission(permission);
        setShowUsersModal(true);
        setLoadingUsers(true);

        try {
            const response = await axios.get(`/api/v1/admin/permissions/${permission.id}/users`);
            if (response.data.success) {
                setUsersWithPermission(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const getRoleColor = (roleName: string) => {
        switch (roleName) {
            case 'super_admin':
                return 'text-red-600 bg-red-100';
            case 'admin':
                return 'text-blue-600 bg-blue-100';
            case 'alumni':
                return 'text-green-600 bg-green-100';
            default:
                return 'text-purple-600 bg-purple-100';
        }
    };

    const handleAddRole = async () => {
        if (!newRoleDisplayName.trim()) return;
        setCreatingRole(true);
        try {
            const slug = newRoleName.trim() || newRoleDisplayName.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            await axios.post('/api/v1/admin/roles', {
                name: slug,
                display_name: newRoleDisplayName.trim(),
                description: newRoleDescription.trim() || `Custom role: ${newRoleDisplayName.trim()}`,
                permission_ids: []
            });
            setShowAddRoleModal(false);
            setNewRoleName('');
            setNewRoleDisplayName('');
            setNewRoleDescription('');
            fetchData();
        } catch (error: any) {
            const msg = error?.response?.data?.message || 'Failed to create role';
            alert(msg);
        } finally {
            setCreatingRole(false);
        }
    };

    const handleDeleteRole = async (role: Role) => {
        try {
            await axios.delete(`/api/v1/admin/roles/${role.id}`);
            setDeleteConfirmRole(null);
            if (selectedRole === role.id) setSelectedRole(null);
            fetchData();
        } catch (error: any) {
            const msg = error?.response?.data?.message || 'Failed to delete role';
            alert(msg);
        }
    };

    const getRoleIcon = (roleName: string) => {
        switch (roleName) {
            case 'super_admin':
                return <Shield className="h-5 w-5" />;
            case 'admin':
                return <Lock className="h-5 w-5" />;
            case 'alumni':
                return <User className="h-5 w-5" />;
            default:
                return <Users className="h-5 w-5" />;
        }
    };

    const getPermissionRiskLevel = (permissionName: string): 'low' | 'medium' | 'high' => {
        const highRisk = ['delete', 'destroy', 'revoke', 'bulk_delete', 'manage', 'impersonate'];
        const mediumRisk = ['create', 'update', 'edit', 'change', 'send', 'export'];

        const lowerName = permissionName.toLowerCase();

        if (highRisk.some(keyword => lowerName.includes(keyword))) return 'high';
        if (mediumRisk.some(keyword => lowerName.includes(keyword))) return 'medium';
        return 'low';
    };

    const getRiskBadge = (risk: 'low' | 'medium' | 'high') => {
        const styles = {
            low: 'bg-blue-100 text-blue-700 border-blue-200',
            medium: 'bg-amber-100 text-amber-700 border-amber-200',
            high: 'bg-red-100 text-red-700 border-red-200'
        };
        const labels = {
            low: 'viewing',
            medium: 'actions',
            high: 'critical'
        };

        return (
            <span className={`px-2 py-0.5 text-xs font-medium rounded border ${styles[risk]}`}>
                {labels[risk]}
            </span>
        );
    };

    const toggleCategory = (category: string) => {
        setCollapsedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            return newSet;
        });
    };

    const getCategoryStats = (categoryPerms: Permission[], roleId: number) => {
        const total = categoryPerms.length;
        const enabled = categoryPerms.filter(p => rolePermissions[roleId]?.[p.id]).length;
        return { enabled, total };
    };

    if (loading) {
        return (
            <AdminBaseLayout title="Permission Matrix" user={auth.user}>
                <Head title="Permission Matrix" />
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="h-12 w-12 border-4 border-maroon-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading permissions...</p>
                    </div>
                </div>
            </AdminBaseLayout>
        );
    }

    return (
        <AdminBaseLayout title="Permission Matrix" user={auth.user}>
            <Head title="Permission Matrix" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-maroon-600 to-maroon-700 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Permission Matrix</h1>
                            <p className="text-maroon-100">
                                Manage role-based permissions for the system. View users with specific permissions and customize access.
                            </p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center space-x-2 bg-white dark:bg-gray-800 text-maroon-600 px-6 py-3 rounded-lg hover:bg-maroon-50 dark:hover:bg-maroon-800/30 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                        >
                            <Save className="h-5 w-5" />
                            <span className="font-semibold">{saving ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                    </div>

                    {showSuccess && (
                        <div className="mt-4 p-4 bg-green-500 rounded-lg flex items-center space-x-3 shadow-lg animate-fade-in">
                            <CheckCircle className="h-5 w-5 flex-shrink-0" />
                            <p className="font-medium">Permissions updated successfully!</p>
                        </div>
                    )}
                </div>

                {/* Role Selector */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Select Role to Configure</h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{roles.length} role{roles.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {roles.map(role => {
                            const isSelected = selectedRole === role.id;
                            const isLocked = role.is_system_role && role.name === 'super_admin';
                            const permCount = Object.values(rolePermissions[role.id] || {}).filter(Boolean).length;

                            return (
                                <button
                                    key={role.id}
                                    onClick={() => setSelectedRole(role.id)}
                                    disabled={isLocked}
                                    className={`
                                        relative p-5 rounded-xl border-2 transition-all text-left
                                        ${isSelected
                                            ? 'border-maroon-500 bg-maroon-50 dark:bg-maroon-900/30 shadow-lg scale-105'
                                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                                        }
                                        ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                    `}
                                >
                                    {/* System/Custom Badge */}
                                    {!role.is_system_role && (
                                        <span className="absolute top-2 right-2 px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700 border border-purple-200">
                                            Custom
                                        </span>
                                    )}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`p-3 rounded-lg ${getRoleColor(role.name)}`}>
                                            {getRoleIcon(role.name)}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {!role.is_system_role && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmRole(role); }}
                                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded"
                                                    title="Delete role"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                            {isSelected && !isLocked && (
                                                <CheckCircle className="h-6 w-6 text-maroon-600" />
                                            )}
                                            {isLocked && (
                                                <Lock className="h-5 w-5 text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-1">{role.display_name}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {isLocked ? 'Full access (locked)' : `${permCount} of ${permissions.length} permissions`}
                                    </p>
                                </button>
                            );
                        })}

                        {/* Add New Role Card */}
                        <button
                            onClick={() => setShowAddRoleModal(true)}
                            className="p-5 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-maroon-400 dark:hover:border-maroon-500 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-maroon-50/50 dark:hover:bg-maroon-900/20 transition-all text-left cursor-pointer group"
                        >
                            <div className="flex flex-col items-center justify-center h-full min-h-[120px] gap-3">
                                <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-maroon-100 dark:group-hover:bg-maroon-900/40 transition-colors">
                                    <Plus className="h-6 w-6 text-gray-400 group-hover:text-maroon-600 transition-colors" />
                                </div>
                                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 group-hover:text-maroon-600 transition-colors">Add New Role</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Permission Categories */}
                {selectedRole !== null && (
                    <div className="space-y-4">
                        {Object.entries(permissionsByCategory).map(([category, perms]) => {
                            const isCollapsed = collapsedCategories.has(category);
                            const stats = getCategoryStats(perms, selectedRole);
                            const selectedRoleObj = roles.find(r => r.id === selectedRole);
                            const isLocked = selectedRoleObj?.is_system_role && selectedRoleObj.name === 'super_admin';

                            return (
                                <div key={category} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    {/* Category Header */}
                                    <button
                                        onClick={() => toggleCategory(category)}
                                        className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Lock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{category}</h3>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {stats.enabled} of {stats.total} enabled
                                            </span>
                                        </div>
                                        {isCollapsed ? (
                                            <ChevronDown className="h-5 w-5 text-gray-400" />
                                        ) : (
                                            <ChevronUp className="h-5 w-5 text-gray-400" />
                                        )}
                                    </button>

                                    {/* Permissions Grid */}
                                    {!isCollapsed && (
                                        <div className="p-6">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                {perms.map((permission) => {
                                                    const hasPermission = rolePermissions[selectedRole]?.[permission.id] || false;
                                                    const riskLevel = getPermissionRiskLevel(permission.name);

                                                    return (
                                                        <div
                                                            key={permission.id}
                                                            className={`
                                                                relative p-5 rounded-xl border-2 transition-all
                                                                ${hasPermission
                                                                    ? 'border-green-300 bg-green-50/50'
                                                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                                                }
                                                                hover:shadow-md
                                                            `}
                                                        >
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                                                            {permission.display_name}
                                                                        </h4>
                                                                        {hasPermission && (
                                                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                                        {permission.description}
                                                                    </p>
                                                                    <div className="flex items-center gap-2">
                                                                        {getRiskBadge(riskLevel)}
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                            {permission.name}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Toggle Switch */}
                                                                <div className="ml-4 flex flex-col items-end gap-2">
                                                                    <button
                                                                        onClick={() => !isLocked && togglePermission(selectedRole, permission.id)}
                                                                        disabled={isLocked}
                                                                        className={`
                                                                            relative inline-flex h-8 w-14 items-center rounded-full transition-colors
                                                                            ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                                                                            ${hasPermission ? 'bg-blue-600' : 'bg-gray-300'}
                                                                        `}
                                                                    >
                                                                        <span
                                                                            className={`
                                                                                inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform
                                                                                ${hasPermission ? 'translate-x-7' : 'translate-x-1'}
                                                                            `}
                                                                        />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => viewUsersWithPermission(permission)}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 rounded-full text-blue-700 transition-colors font-medium"
                                                                    >
                                                                        <Users className="h-3.5 w-3.5" />
                                                                        <span>View Users</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Info Box */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-start space-x-3">
                        <Info className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-blue-900 mb-2">Important Notes</h3>
                            <ul className="space-y-1 text-sm text-blue-800">
                                <li>• Super Admin permissions are locked and cannot be modified</li>
                                <li>• Click "View Users" to see which users have a specific permission</li>
                                <li>• Changes affect all users with the respective role</li>
                                <li>• Individual user permissions can override role permissions</li>
                                <li>• Color-coded risk levels: <span className="font-semibold">Blue (viewing)</span>, <span className="font-semibold">Amber (actions)</span>, <span className="font-semibold">Red (critical)</span></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Users with Permission Modal */}
            {showUsersModal && selectedPermission && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 dark:from-gray-800 to-white dark:to-gray-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                        Users with "{selectedPermission.display_name}"
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {selectedPermission.description}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowUsersModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="h-7 w-7" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
                            {loadingUsers ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="text-center">
                                        <div className="h-10 w-10 border-4 border-maroon-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                        <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
                                    </div>
                                </div>
                            ) : usersWithPermission.length === 0 ? (
                                <div className="text-center py-16 text-gray-500">
                                    <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                    <p className="text-lg font-medium">No users have this permission</p>
                                    <p className="text-sm mt-1">Assign this permission to a role or user to grant access</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {usersWithPermission.map((user) => (
                                        <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 bg-gradient-to-br from-maroon-600 to-maroon-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{user.name || 'No Name'}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {user.role_name && (
                                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role_name)}`}>
                                                        {user.role_display_name}
                                                    </span>
                                                )}
                                                {user.access_source === 'custom_grant' && (
                                                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 border border-purple-300">
                                                        Custom
                                                    </span>
                                                )}
                                                {user.access_source === 'custom_deny' && (
                                                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 border border-red-300">
                                                        Denied
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-b from-gray-50 dark:from-gray-800 to-white dark:to-gray-800">
                            <button
                                onClick={() => setShowUsersModal(false)}
                                className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add New Role Modal */}
            {showAddRoleModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full border border-gray-200 dark:border-gray-700">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create New Role</h3>
                                <button onClick={() => setShowAddRoleModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add a custom role to assign specific permissions</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name *</label>
                                <input
                                    type="text"
                                    value={newRoleDisplayName}
                                    onChange={(e) => {
                                        setNewRoleDisplayName(e.target.value);
                                        setNewRoleName(e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));
                                    }}
                                    placeholder="e.g. Department Head"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug (auto-generated)</label>
                                <input
                                    type="text"
                                    value={newRoleName}
                                    onChange={(e) => setNewRoleName(e.target.value)}
                                    placeholder="department_head"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea
                                    value={newRoleDescription}
                                    onChange={(e) => setNewRoleDescription(e.target.value)}
                                    placeholder="Brief description of this role's purpose..."
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                            <button
                                onClick={() => setShowAddRoleModal(false)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddRole}
                                disabled={!newRoleDisplayName.trim() || creatingRole}
                                className="px-6 py-2 bg-maroon-600 text-white rounded-lg hover:bg-maroon-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                {creatingRole ? 'Creating...' : 'Create Role'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Role Confirm Modal */}
            {deleteConfirmRole && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-red-100 rounded-full">
                                    <AlertCircle className="h-6 w-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Delete Role</h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Are you sure you want to delete the role <strong>"{deleteConfirmRole.display_name}"</strong>? This action cannot be undone. Any users assigned this role will lose their permissions.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setDeleteConfirmRole(null)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteRole(deleteConfirmRole)}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminBaseLayout>
    );
}
