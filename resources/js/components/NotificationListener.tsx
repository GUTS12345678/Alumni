import React, { useCallback, useState } from 'react';
import { useUserChannel } from '@/hooks/useRealtime';
import { useToast } from '@/hooks/use-toast';
import { Bell, Megaphone, Briefcase, Calendar } from 'lucide-react';

interface NotificationItem {
    id: string;
    type: 'announcement' | 'job' | 'event' | 'system';
    title: string;
    message?: string;
    timestamp: Date;
}

/**
 * NotificationListener - Global component that listens for real-time 
 * broadcast events and shows toast notifications.
 * 
 * Place this in the root layout or app wrapper. It subscribes to the
 * user's private channel and reacts to broadcast events.
 * 
 * Usage (in layout):
 *   <NotificationListener>
 *     {children}
 *   </NotificationListener>
 */
export function NotificationListener({ children, userId }: { children: React.ReactNode; userId?: number }) {
    const { toast } = useToast();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_notifications, setNotifications] = useState<NotificationItem[]>([]);

    const addNotification = useCallback((item: Omit<NotificationItem, 'id' | 'timestamp'>) => {
        const notification: NotificationItem = {
            ...item,
            id: Date.now().toString(),
            timestamp: new Date(),
        };
        setNotifications((prev) => [notification, ...prev].slice(0, 50));
    }, []);

    // Subscribe to the user's private channel for real-time events
    useUserChannel(userId ? Number(userId) : undefined, {
        onAnnouncement: (data) => {
            addNotification({
                type: 'announcement',
                title: data.title || 'New Announcement',
                message: data.message,
            });
            toast({
                title: 'New Announcement',
                description: data.title || 'A new announcement has been published.',
                variant: 'default',
            });
        },
        onContentUpdate: (data) => {
            addNotification({
                type: data.content_type || 'system',
                title: data.title || 'Content Updated',
                message: data.message,
            });
        },
        onNotification: (data) => {
            addNotification({
                type: 'system',
                title: data.title || 'Notification',
                message: data.message,
            });
            toast({
                title: data.title || 'Notification',
                description: data.message,
            });
        },
    });

    return <>{children}</>;
}

/**
 * NotificationBell - A notification bell icon with unread count badge.
 * Can be placed in the top navbar of any layout.
 * 
 * Usage:
 *   <NotificationBell />
 */
export function NotificationBell() {
    const [unreadCount] = useState(0);
    const [open, setOpen] = useState(false);

    return (
        <button
            onClick={() => setOpen(!open)}
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Notifications"
        >
            <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
        </button>
    );
}

/**
 * Get the icon component for a notification type.
 */
export function getNotificationIcon(type: NotificationItem['type']) {
    switch (type) {
        case 'announcement':
            return <Megaphone className="h-4 w-4 text-blue-500" />;
        case 'job':
            return <Briefcase className="h-4 w-4 text-green-500" />;
        case 'event':
            return <Calendar className="h-4 w-4 text-purple-500" />;
        default:
            return <Bell className="h-4 w-4 text-gray-500" />;
    }
}

export default NotificationListener;
