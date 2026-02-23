import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
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
}

export default function Messages() {
    const { auth } = usePage<PageProps>().props;

    const messaging = useMessaging({
        userId: auth.user.id,
        connectionsOnly: true, // Alumni can only message connections
    });

    const renderUserBadge = (user: UserSearchResult) => {
        if (user.role === 'admin' || user.role === 'super_admin') {
            return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Admin</Badge>;
        }
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Connected</Badge>;
    };

    return (
        <AlumniBaseLayout title="Messages">
            <Head title="Messages" />
            <MessagingUI
                messaging={messaging}
                userId={auth.user.id}
                searchPlaceholder="Search connected alumni or admins..."
                searchHint={
                    <p className="text-xs text-muted-foreground px-1">
                        You can only message alumni you are connected with.{' '}
                        <a href="/alumni/network" className="text-maroon-600 hover:underline">
                            Find more alumni to connect with
                        </a>
                    </p>
                }
                renderUserBadge={renderUserBadge}
            />
        </AlumniBaseLayout>
    );
}
