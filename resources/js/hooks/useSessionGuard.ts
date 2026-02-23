import { useEffect, useRef, useCallback } from 'react';

/**
 * Session guard hook that handles:
 * 1. Tab visibility changes (detect when user returns after standby/sleep)
 * 2. Periodic session health checks
 * 3. Graceful redirect to login when session expires
 *
 * Place this in your base layout components so it runs on every page.
 */
export function useSessionGuard({
    /** How often to check session health (ms). Default: 5 minutes */
    checkInterval = 5 * 60 * 1000,
    /** How long the tab must be hidden before we re-check on return (ms). Default: 2 minutes */
    hiddenThreshold = 2 * 60 * 1000,
    /** Whether the guard is enabled. Default: true */
    enabled = true,
} = {}) {
    const lastVisibleRef = useRef<number>(Date.now());
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isCheckingRef = useRef(false);

    const checkSession = useCallback(async () => {
        if (isCheckingRef.current) return;
        isCheckingRef.current = true;

        try {
            const token = document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1];
            const response = await fetch('/api/v1/profile', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': token ? decodeURIComponent(token) : '',
                },
                credentials: 'include',
            });

            if (response.status === 401 || response.status === 419) {
                // Session expired — redirect to login
                window.location.href = '/login';
                return;
            }

            // Session is still valid, update timestamp
            lastVisibleRef.current = Date.now();
        } catch {
            // Network error — don't redirect, user might be offline
            // They'll get redirected on next successful check or page action
        } finally {
            isCheckingRef.current = false;
        }
    }, []);

    useEffect(() => {
        if (!enabled) return;

        // Handle tab visibility changes
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const hiddenDuration = Date.now() - lastVisibleRef.current;

                // If tab was hidden long enough, re-check session
                if (hiddenDuration >= hiddenThreshold) {
                    checkSession();
                }
            } else {
                // Tab going hidden — record timestamp
                lastVisibleRef.current = Date.now();
            }
        };

        // Handle device wake from sleep (online event fires after sleep)
        const handleOnline = () => {
            const hiddenDuration = Date.now() - lastVisibleRef.current;
            if (hiddenDuration >= hiddenThreshold) {
                checkSession();
            }
        };

        // Handle page focus (catches alt-tab returns)
        const handleFocus = () => {
            const hiddenDuration = Date.now() - lastVisibleRef.current;
            if (hiddenDuration >= hiddenThreshold) {
                checkSession();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('online', handleOnline);
        window.addEventListener('focus', handleFocus);

        // Periodic health check
        intervalRef.current = setInterval(() => {
            if (document.visibilityState === 'visible') {
                checkSession();
            }
        }, checkInterval);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('focus', handleFocus);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [enabled, checkInterval, hiddenThreshold, checkSession]);
}
