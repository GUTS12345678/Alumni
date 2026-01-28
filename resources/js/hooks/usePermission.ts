import { usePage } from '@inertiajs/react';

export interface PermissionHook {
    hasPermission: (permission: string) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    hasAllPermissions: (permissions: string[]) => boolean;
    isSuperAdmin: boolean;
    isAdmin: boolean;
    isAlumni: boolean;
}

interface PageProps {
    auth?: {
        user?: {
            role?: string;
            permissions?: string[];
        };
    };
}

export function usePermission(): PermissionHook {
    const { auth } = usePage().props as PageProps;
    const user = auth?.user;

    const isSuperAdmin = user?.role === 'super_admin';
    const isAdmin = user?.role === 'admin' || isSuperAdmin;
    const isAlumni = user?.role === 'alumni';

    const hasPermission = (permission: string): boolean => {
        // Super admin has all permissions
        if (isSuperAdmin) {
            return true;
        }

        // Check user permissions array (should be loaded from backend)
        return user?.permissions?.includes(permission) || false;
    };

    const hasAnyPermission = (permissions: string[]): boolean => {
        return permissions.some(p => hasPermission(p));
    };

    const hasAllPermissions = (permissions: string[]): boolean => {
        return permissions.every(p => hasPermission(p));
    };

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isSuperAdmin,
        isAdmin,
        isAlumni
    };
}
