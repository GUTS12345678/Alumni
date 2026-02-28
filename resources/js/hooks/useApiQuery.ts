/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * useApiQuery - React hook for API calls with loading, error, polling, and refresh.
 * 
 * Replaces the repeated fetch() pattern across all pages:
 *   const [data, setData] = useState(null);
 *   const [loading, setLoading] = useState(true);
 *   const [error, setError] = useState(null);
 *   useEffect(() => { fetch(...) }, [deps]);
 * 
 * Usage:
 *   const { data, loading, error, refresh } = useApiQuery(
 *     () => api.get('/admin/dashboard', { campus_id: campusId }),
 *     [campusId]
 *   );
 * 
 *   // With auto-polling every 60 seconds:
 *   const { data } = useApiQuery(
 *     () => dashboardApi.getStats({ campus_id: campusId }),
 *     [campusId],
 *     { pollingInterval: 60000 }
 *   );
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError } from '@/lib/api';

interface UseApiQueryOptions {
    /** Skip the initial fetch (useful for conditional queries) */
    enabled?: boolean;
    /** Auto-poll interval in milliseconds (0 = disabled) */
    pollingInterval?: number;
    /** Keep previous data while refetching */
    keepPreviousData?: boolean;
    /** Called on successful fetch */
    onSuccess?: (data: any) => void;
    /** Called on error */
    onError?: (error: ApiError | Error) => void;
}

interface UseApiQueryResult<T> {
    /** The fetched data */
    data: T | null;
    /** Whether the initial load is in progress */
    loading: boolean;
    /** Whether a refetch is in progress (data may still be populated) */
    refreshing: boolean;
    /** Error object if the request failed */
    error: ApiError | Error | null;
    /** Error message string */
    errorMessage: string | null;
    /** Manually trigger a refetch */
    refresh: () => Promise<void>;
    /** Clear error state */
    clearError: () => void;
    /** Time of last successful fetch */
    lastUpdated: Date | null;
}

export function useApiQuery<T = any>(
    fetcher: () => Promise<any>,
    deps: any[] = [],
    options: UseApiQueryOptions = {}
): UseApiQueryResult<T> {
    const {
        enabled = true,
        pollingInterval = 0,
        keepPreviousData = true,
        onSuccess,
        onError,
    } = options;

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<ApiError | Error | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const mountedRef = useRef(true);
    const abortRef = useRef<AbortController | null>(null);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (!enabled) return;

        // Cancel any in-flight request
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        if (isRefresh) {
            setRefreshing(true);
        } else {
            if (!keepPreviousData) setData(null);
            setLoading(true);
        }
        setError(null);

        try {
            const response = await fetcher();
            if (!mountedRef.current) return;

            // Handle standard Laravel API response format
            const result = response?.data !== undefined ? response.data : response;
            setData(result as T);
            setLastUpdated(new Date());
            onSuccess?.(result);
        } catch (err: any) {
            if (!mountedRef.current) return;
            if (err.name === 'AbortError') return;

            const apiError = err instanceof ApiError ? err : new Error(err.message || 'Unknown error');
            setError(apiError);
            onError?.(apiError);
        } finally {
            if (mountedRef.current) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    }, [enabled, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

    // Initial fetch + re-fetch on deps change
    useEffect(() => {
        fetchData(false);

        return () => {
            abortRef.current?.abort();
        };
    }, [fetchData]);

    // Polling (pauses when tab is hidden to reduce server load)
    useEffect(() => {
        if (!pollingInterval || pollingInterval <= 0 || !enabled) return;

        const interval = setInterval(() => {
            // Only poll when the tab is visible
            if (document.visibilityState === 'visible') {
                fetchData(true);
            }
        }, pollingInterval);

        return () => clearInterval(interval);
    }, [pollingInterval, enabled, fetchData]);

    // Cleanup on unmount
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            abortRef.current?.abort();
        };
    }, []);

    const refresh = useCallback(async () => {
        await fetchData(true);
    }, [fetchData]);

    const clearError = useCallback(() => setError(null), []);

    return {
        data,
        loading,
        refreshing,
        error,
        errorMessage: error?.message || null,
        refresh,
        clearError,
        lastUpdated,
    };
}

/**
 * useApiMutation - Hook for create/update/delete operations.
 * 
 * Usage:
 *   const { mutate, loading, error } = useApiMutation(
 *     (data) => contentApi.create(data),
 *     { onSuccess: () => queryRefresh() }
 *   );
 * 
 *   // In handler:
 *   await mutate({ title: 'Test', content_type: 'announcement' });
 */

interface UseApiMutationOptions<TResult = any> {
    onSuccess?: (data: TResult) => void;
    onError?: (error: ApiError | Error) => void;
    /** Success message (passed to onSuccess if you want toast) */
    successMessage?: string;
}

interface UseApiMutationResult<TInput = any, TResult = any> {
    mutate: (input: TInput) => Promise<TResult | null>;
    loading: boolean;
    error: ApiError | Error | null;
    errorMessage: string | null;
    validationErrors: Record<string, string[]>;
    reset: () => void;
}

export function useApiMutation<TInput = any, TResult = any>(
    mutationFn: (input: TInput) => Promise<any>,
    options: UseApiMutationOptions<TResult> = {}
): UseApiMutationResult<TInput, TResult> {
    const { onSuccess, onError } = options;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<ApiError | Error | null>(null);

    const mutate = useCallback(async (input: TInput): Promise<TResult | null> => {
        setLoading(true);
        setError(null);

        try {
            const response = await mutationFn(input);
            const result = response?.data !== undefined ? response.data : response;
            onSuccess?.(result);
            return result as TResult;
        } catch (err: any) {
            const apiError = err instanceof ApiError ? err : new Error(err.message || 'Unknown error');
            setError(apiError);
            onError?.(apiError);
            return null;
        } finally {
            setLoading(false);
        }
    }, [mutationFn, onSuccess, onError]);

    const reset = useCallback(() => {
        setError(null);
        setLoading(false);
    }, []);

    const validationErrors = error instanceof ApiError ? error.errors : {};

    return {
        mutate,
        loading,
        error,
        errorMessage: error?.message || null,
        validationErrors,
        reset,
    };
}
