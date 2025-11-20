import React, { useState } from 'react';
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
    Info
} from 'lucide-react';

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
    id: string;
    name: string;
    description: string;
    category: string;
}

interface RolePermissions {
    [key: string]: boolean;
}

interface PermissionsState {
    super_admin: RolePermissions;
    admin: RolePermissions;
    alumni: RolePermissions;
}

const permissionCategories = [
    {
        category: 'User Management',
        permissions: [
            { id: 'users.view', name: 'View Users', description: 'Can view user list and details' },
            { id: 'users.create', name: 'Create Users', description: 'Can create new users' },
            { id: 'users.edit', name: 'Edit Users', description: 'Can edit user information' },
            { id: 'users.delete', name: 'Delete Users', description: 'Can delete users' },
        ]
    },
    {
        category: 'Alumni Management',
        permissions: [
            { id: 'alumni.view', name: 'View Alumni', description: 'Can view alumni profiles' },
            { id: 'alumni.edit', name: 'Edit Alumni', description: 'Can edit alumni profiles' },
            { id: 'alumni.approve', name: 'Approve Alumni', description: 'Can approve pending alumni registrations' },
            { id: 'alumni.export', name: 'Export Alumni Data', description: 'Can export alumni data' },
        ]
    },
    {
        category: 'Survey Management',
        permissions: [
            { id: 'surveys.view', name: 'View Surveys', description: 'Can view all surveys' },
            { id: 'surveys.create', name: 'Create Surveys', description: 'Can create new surveys' },
            { id: 'surveys.edit', name: 'Edit Surveys', description: 'Can edit existing surveys' },
            { id: 'surveys.delete', name: 'Delete Surveys', description: 'Can delete surveys' },
            { id: 'surveys.publish', name: 'Publish Surveys', description: 'Can publish surveys' },
            { id: 'surveys.analytics', name: 'View Analytics', description: 'Can view survey analytics' },
        ]
    },
    {
        category: 'Department & Course Management',
        permissions: [
            { id: 'departments.view', name: 'View Departments', description: 'Can view departments' },
            { id: 'departments.manage', name: 'Manage Departments', description: 'Can create, edit, delete departments' },
            { id: 'courses.view', name: 'View Courses', description: 'Can view courses' },
            { id: 'courses.manage', name: 'Manage Courses', description: 'Can create, edit, delete courses' },
        ]
    },
    {
        category: 'System Administration',
        permissions: [
            { id: 'system.settings', name: 'System Settings', description: 'Can modify system settings' },
            { id: 'system.backup', name: 'Backup & Restore', description: 'Can create and restore backups' },
            { id: 'system.logs', name: 'View Activity Logs', description: 'Can view system activity logs' },
            { id: 'system.maintenance', name: 'Maintenance Mode', description: 'Can enable/disable maintenance mode' },
        ]
    },
    {
        category: 'Permissions & Roles',
        permissions: [
            { id: 'roles.view', name: 'View Roles', description: 'Can view roles and permissions' },
            { id: 'roles.manage', name: 'Manage Roles', description: 'Can create and edit roles' },
            { id: 'permissions.assign', name: 'Assign Permissions', description: 'Can assign permissions to roles' },
        ]
    }
];

export default function PermissionMatrix({ auth }: PageProps) {
    // Default permissions for each role
    const [permissions, setPermissions] = useState<PermissionsState>({
        super_admin: {
            // Super Admin has all permissions
            ...Object.fromEntries(
                permissionCategories.flatMap(cat => 
                    cat.permissions.map(p => [p.id, true])
                )
            )
        } as RolePermissions,
        admin: {
            // Admin has most permissions except critical system ones
            'users.view': true,
            'users.create': true,
            'users.edit': true,
            'alumni.view': true,
            'alumni.edit': true,
            'alumni.approve': true,
            'alumni.export': true,
            'surveys.view': true,
            'surveys.create': true,
            'surveys.edit': true,
            'surveys.delete': true,
            'surveys.publish': true,
            'surveys.analytics': true,
            'departments.view': true,
            'courses.view': true,
            'system.logs': true,
            'roles.view': true,
        } as RolePermissions,
        alumni: {
            // Alumni has minimal permissions
            'alumni.view': true,
            'surveys.view': true,
        } as RolePermissions
    });

    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const togglePermission = (role: 'super_admin' | 'admin' | 'alumni', permissionId: string) => {
        if (role === 'super_admin') {
            // Super admin permissions cannot be changed
            return;
        }

        setPermissions(prev => ({
            ...prev,
            [role]: {
                ...prev[role],
                [permissionId]: !(prev[role][permissionId] || false)
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        
        // Simulate API call
        setTimeout(() => {
            setSaving(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }, 1000);
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'super_admin':
                return 'text-red-600 bg-red-100';
            case 'admin':
                return 'text-blue-600 bg-blue-100';
            case 'alumni':
                return 'text-green-600 bg-green-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'super_admin':
                return <Shield className="h-5 w-5" />;
            case 'admin':
                return <Lock className="h-5 w-5" />;
            case 'alumni':
                return <User className="h-5 w-5" />;
            default:
                return <User className="h-5 w-5" />;
        }
    };

    return (
        <AdminBaseLayout title="Permission Matrix" user={auth.user}>
            <Head title="Permission Matrix" />

            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-beige-200 p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Permission Matrix</h1>
                            <p className="text-gray-600">
                                Manage role-based permissions for the system. Control what each user role can access and modify.
                            </p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center space-x-2 bg-maroon-600 text-white px-6 py-3 rounded-lg hover:bg-maroon-700 transition-colors disabled:opacity-50"
                        >
                            <Save className="h-5 w-5" />
                            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                    </div>

                    {showSuccess && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
                            <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                            <p className="text-green-800 font-medium">Permissions updated successfully!</p>
                        </div>
                    )}
                </div>

                {/* Role Legend */}
                <div className="bg-white rounded-lg shadow-sm border border-beige-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Roles</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <Shield className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Super Admin</h3>
                                <p className="text-sm text-gray-600">Full system access (locked)</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Lock className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Admin</h3>
                                <p className="text-sm text-gray-600">Manage users & content</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <User className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Alumni</h3>
                                <p className="text-sm text-gray-600">Limited access</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Permission Matrix */}
                {permissionCategories.map((category) => (
                    <div key={category.category} className="bg-white rounded-lg shadow-sm border border-beige-200 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">{category.category}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                                            Permission
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <div className="flex items-center justify-center space-x-2">
                                                <Shield className="h-4 w-4 text-red-600" />
                                                <span>Super Admin</span>
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <div className="flex items-center justify-center space-x-2">
                                                <Lock className="h-4 w-4 text-blue-600" />
                                                <span>Admin</span>
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <div className="flex items-center justify-center space-x-2">
                                                <User className="h-4 w-4 text-green-600" />
                                                <span>Alumni</span>
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {category.permissions.map((permission) => (
                                        <tr key={permission.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                                                    <p className="text-sm text-gray-500">{permission.description}</p>
                                                </div>
                                            </td>
                                            {['super_admin', 'admin', 'alumni'].map((role) => {
                                                const hasPermission = permissions[role as keyof typeof permissions][permission.id] || false;
                                                const isLocked = role === 'super_admin';

                                                return (
                                                    <td key={role} className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => !isLocked && togglePermission(role as any, permission.id)}
                                                            disabled={isLocked}
                                                            className={`inline-flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                                                                hasPermission
                                                                    ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                            } ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                                            title={isLocked ? 'Super Admin permissions cannot be changed' : hasPermission ? 'Click to revoke' : 'Click to grant'}
                                                        >
                                                            {hasPermission ? (
                                                                <Check className="h-6 w-6" />
                                                            ) : (
                                                                <X className="h-6 w-6" />
                                                            )}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-start space-x-3">
                        <Info className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-blue-900 mb-2">Important Notes</h3>
                            <ul className="space-y-1 text-sm text-blue-800">
                                <li>• Super Admin permissions are locked and cannot be modified for security reasons</li>
                                <li>• Changes to permissions will affect all users with the respective roles</li>
                                <li>• Be cautious when modifying Admin permissions as it may affect system operations</li>
                                <li>• Alumni role should have minimal permissions for security best practices</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AdminBaseLayout>
    );
}
