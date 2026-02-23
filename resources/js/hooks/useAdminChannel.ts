/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * useAdminChannel - Hook for subscribing to admin-specific broadcast channels.
 * 
 * Listens on 'admin.dashboard' and 'admin.content' private channels
 * to trigger instant data refreshes when content changes occur.
 * 
 * Usage:
 *   useAdminChannel({
 *     onDashboardUpdate: () => refreshStats(),
 *     onContentChange: (data) => {
 *       if (data.content_type === 'job') refreshJobs();
 *     },
 *     onSurveyResponse: (data) => refreshSurveys(),
 *   });
 */

import { useEffect, useRef } from 'react';

interface AdminChannelHandlers {
    /** Fired when dashboard stats should be refreshed */
    onDashboardUpdate?: (data: { trigger: string; timestamp: string }) => void;
    /** Fired when any content item is created/updated/deleted */
    onContentChange?: (data: {
        content_type: string;
        action: string;
        content_id: number | null;
        title: string | null;
        timestamp: string;
    }) => void;
    /** Fired when a survey response is submitted */
    onSurveyResponse?: (data: {
        survey_id: number;
        survey_title: string;
        respondent_id: number;
        respondent_name: string;
        timestamp: string;
    }) => void;
}

export function useAdminChannel(handlers: AdminChannelHandlers): void {
    const handlersRef = useRef(handlers);
    handlersRef.current = handlers;

    useEffect(() => {
        const echo = (window as any).Echo;
        if (!echo) return;

        let dashboardChannel: any;
        let contentChannel: any;

        try {
            // Subscribe to admin.dashboard for stat refresh triggers
            if (handlersRef.current.onDashboardUpdate || handlersRef.current.onSurveyResponse) {
                dashboardChannel = echo.private('admin.dashboard');

                dashboardChannel.listen('.dashboard.updated', (data: any) => {
                    handlersRef.current.onDashboardUpdate?.(data);
                });

                dashboardChannel.listen('.survey.response.submitted', (data: any) => {
                    handlersRef.current.onSurveyResponse?.(data);
                });

                dashboardChannel.listen('.profile.updated', (data: any) => {
                    handlersRef.current.onDashboardUpdate?.({
                        trigger: 'profile_update',
                        timestamp: data.timestamp,
                    });
                });
            }

            // Subscribe to admin.content for content CRUD events
            if (handlersRef.current.onContentChange) {
                contentChannel = echo.private('admin.content');

                contentChannel.listen('.content.changed', (data: any) => {
                    handlersRef.current.onContentChange?.(data);
                });

                contentChannel.listen('.survey.response.submitted', (data: any) => {
                    handlersRef.current.onSurveyResponse?.(data);
                });
            }
        } catch (err) {
            console.warn('[useAdminChannel] Failed to subscribe to admin channels:', err);
        }

        return () => {
            try {
                if (dashboardChannel) echo.leave('admin.dashboard');
                if (contentChannel) echo.leave('admin.content');
            } catch {
                // Ignore cleanup errors
            }
        };
    }, []);
}

export default useAdminChannel;
