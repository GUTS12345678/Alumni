import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import MessagingUI from '@/components/messaging/MessagingUI';
import { useMessaging } from '@/hooks/useMessaging';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { UserSearchResult } from '@/types/messaging';
import { Users, UserPlus, MessageCircle } from 'lucide-react';

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
    const [connectionCount, setConnectionCount] = useState<number>(0);

    useEffect(() => {
        fetch('/alumni/network/connected')
            .then(r => r.json())
            .then(d => setConnectionCount(d.data?.length || 0))
            .catch(() => {});
    }, []);

    const messaging = useMessaging({
        userId: auth.user.id,
        connectionsOnly: true,
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

            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-maroon-100 dark:bg-maroon-900/40 rounded-xl flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-maroon-600 dark:text-maroon-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-maroon-800 dark:text-maroon-200">Messages</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Chat with your {connectionCount} connection{connectionCount !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.visit('/alumni/connections')}
                        className="border-maroon-300 text-maroon-700 hover:bg-maroon-50 dark:border-maroon-700 dark:text-maroon-300"
                    >
                        <Users className="h-3.5 w-3.5 mr-1.5" />
                        Connections
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => router.visit('/alumni/network')}
                        className="bg-maroon-700 hover:bg-maroon-800 text-white"
                    >
                        <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                        Find Alumni
                    </Button>
                </div>
            </div>

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
