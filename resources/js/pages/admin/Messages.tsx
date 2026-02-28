import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import MessagingUI from '@/components/messaging/MessagingUI';
import { useMessaging } from '@/hooks/useMessaging';
import { Badge } from '@/components/ui/badge';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { UserSearchResult } from '@/types/messaging';

interface PageProps extends InertiaPageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            profile_picture?: string;
        };
    };
    [key: string]: unknown;
}

export default function Messages() {
    const { auth } = usePage<PageProps>().props;

    const messaging = useMessaging({
        userId: auth.user.id,
        connectionsOnly: false, // Admin can message anyone
    });

    const renderUserBadge = (user: UserSearchResult) => {
        if (user.role) {
            return <Badge variant="secondary">{user.role}</Badge>;
        }
        return null;
    };

    return (
        <AdminBaseLayout title="Messages">
            <Head title="Messages - Admin" />
            <MessagingUI
                messaging={messaging}
                userId={auth.user.id}
                searchPlaceholder="Search by name or email..."
                renderUserBadge={renderUserBadge}
            />
        </AdminBaseLayout>
    );
}
