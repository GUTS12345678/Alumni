/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * useRealtime - Hook for subscribing to Laravel Echo broadcast events.
 * 
 * Wraps window.Echo with React lifecycle management and cleanup.
 * Falls back gracefully when Echo is unavailable.
 * 
 * Usage:
 *   // Listen for announcements on the user's private channel
 *   useRealtime(`user.${userId}`, {
 *     '.announcement.published': (data) => {
 *       toast({ title: 'New Announcement', description: data.title });
 *       refreshData();
 *     },
 *     '.content.updated': (data) => refreshData(),
 *   });
 * 
 *   // Listen on a specific conversation channel
 *   useRealtime(`conversation.${conversationId}`, {
 *     '.message.sent': (msg) => appendMessage(msg),
 *   }, { channelType: 'private' });
 */

import { useEffect, useRef } from 'react';

type EventHandler = (data: any) => void;
type EventMap = Record<string, EventHandler>;

interface UseRealtimeOptions {
    /** Channel type: 'private' (default) or 'presence' */
    channelType?: 'private' | 'presence';
    /** Only subscribe when true (default: true) */
    enabled?: boolean;
}

export function useRealtime(
    channelName: string,
    events: EventMap,
    options: UseRealtimeOptions = {}
): void {
    const { channelType = 'private', enabled = true } = options;
    const eventsRef = useRef(events);
    eventsRef.current = events;

    useEffect(() => {
        if (!enabled || !channelName) return;

        const echo = (window as any).Echo;
        if (!echo) {
            console.warn('[useRealtime] Laravel Echo not available. Real-time features disabled.');
            return;
        }

        let channel: any;
        try {
            channel = channelType === 'presence'
                ? echo.join(channelName)
                : echo.private(channelName);
        } catch (err) {
            console.warn(`[useRealtime] Failed to join channel "${channelName}":`, err);
            return;
        }

        // Bind all event listeners
        const eventNames = Object.keys(eventsRef.current);
        for (const eventName of eventNames) {
            channel.listen(eventName, (data: any) => {
                eventsRef.current[eventName]?.(data);
            });
        }

        // Cleanup: leave channel on unmount
        return () => {
            try {
                echo.leave(channelName);
            } catch {
                // Ignore cleanup errors
            }
        };
    }, [channelName, channelType, enabled]);
}

/**
 * useUserChannel - Subscribe to the authenticated user's private channel.
 * 
 * This is the primary channel for receiving personalized notifications:
 * - New announcements targeted to the user
 * - Content updates
 * - Survey invitations
 * - System notifications
 * 
 * Usage:
 *   useUserChannel(userId, {
 *     onAnnouncement: (data) => { ... },
 *     onContentUpdate: (data) => { ... },
 *     onNotification: (data) => { ... },
 *   });
 */
interface UserChannelHandlers {
    onAnnouncement?: (data: any) => void;
    onContentUpdate?: (data: any) => void;
    onProfileUpdate?: (data: any) => void;
    onSurveyResponse?: (data: any) => void;
    onNotification?: (data: any) => void;
}

export function useUserChannel(
    userId: number | undefined,
    handlers: UserChannelHandlers
): void {
    const events: EventMap = {};

    if (handlers.onAnnouncement) {
        events['.announcement.published'] = handlers.onAnnouncement;
    }
    if (handlers.onContentUpdate) {
        events['.content.updated'] = handlers.onContentUpdate;
    }
    if (handlers.onProfileUpdate) {
        events['.profile.updated'] = handlers.onProfileUpdate;
    }
    if (handlers.onSurveyResponse) {
        events['.survey.response.submitted'] = handlers.onSurveyResponse;
    }
    if (handlers.onNotification) {
        events['.notification'] = handlers.onNotification;
    }

    useRealtime(
        userId ? `user.${userId}` : '',
        events,
        { enabled: !!userId }
    );
}

export default useRealtime;
