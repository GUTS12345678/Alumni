import { useState, useCallback, useRef } from 'react';

export type ExportFormat = 'csv' | 'excel' | 'pdf';

export interface ExportOptions {
    /** The API endpoint URL (without query params) */
    url: string;
    /** Query params to append (filters, format, etc.) */
    params?: Record<string, string>;
    /** The base filename for the downloaded file (without extension) */
    filename: string;
    /** The export format */
    format: ExportFormat;
    /** Optional: HTTP method (default: 'GET') */
    method?: 'GET' | 'POST';
    /** Optional: JSON body for POST requests */
    body?: Record<string, unknown>;
    /** Called on success */
    onSuccess?: (format: ExportFormat) => void;
    /** Called on error */
    onError?: (error: string) => void;
}

export interface ExportState {
    /** Whether an export is currently in progress */
    isExporting: boolean;
    /** Current progress (0–100). Uses simulated progress since we can't track server-side PDF generation */
    progress: number;
    /** The format currently being exported */
    currentFormat: ExportFormat | null;
    /** Status message to display */
    statusMessage: string;
}

export function useExport() {
    const [state, setState] = useState<ExportState>({
        isExporting: false,
        progress: 0,
        currentFormat: null,
        statusMessage: '',
    });

    const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const clearProgressInterval = () => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    };

    /**
     * Simulates progress while waiting for the server response.
     * PDF generation takes longer, so we slow it down for PDFs.
     */
    const startSimulatedProgress = (format: ExportFormat) => {
        clearProgressInterval();
        let progress = 0;

        // PDFs are slower — increment more slowly
        const isPdf = format === 'pdf';
        const intervalMs = isPdf ? 300 : 100;
        const maxProgress = 85; // Never reach 100 until download completes
        const increment = isPdf ? 1.5 : 3;

        progressIntervalRef.current = setInterval(() => {
            progress = Math.min(progress + increment + Math.random() * increment, maxProgress);
            setState(prev => ({
                ...prev,
                progress: Math.round(progress),
                statusMessage: progress < 30
                    ? 'Preparing data...'
                    : progress < 60
                        ? (isPdf ? 'Generating PDF document...' : 'Processing export...')
                        : 'Finalizing export...',
            }));
        }, intervalMs);
    };

    const exportData = useCallback(async (options: ExportOptions) => {
        const {
            url,
            params = {},
            filename,
            format,
            method = 'GET',
            body,
            onSuccess,
            onError,
        } = options;

        // Prevent concurrent exports
        if (state.isExporting) return;

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        setState({
            isExporting: true,
            progress: 0,
            currentFormat: format,
            statusMessage: 'Starting export...',
        });

        startSimulatedProgress(format);

        try {
            // Build URL with params
            const queryParams = new URLSearchParams({ ...params, format });
            const fullUrl = `${url}?${queryParams}`;

            // Build headers
            const headers: Record<string, string> = {
                'Accept': 'application/octet-stream',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            };

            // Add Bearer token if available
            const token = localStorage.getItem('auth_token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const fetchOptions: RequestInit = {
                method,
                headers: method === 'POST'
                    ? { ...headers, 'Content-Type': 'application/json' }
                    : headers,
                credentials: 'include',
                signal: abortController.signal,
            };

            if (method === 'POST' && body) {
                fetchOptions.body = JSON.stringify(body);
            }

            const response = await fetch(fullUrl, fetchOptions);

            if (!response.ok) {
                throw new Error(`Export failed with status ${response.status}`);
            }

            const blob = await response.blob();

            // Complete the progress
            clearProgressInterval();
            setState(prev => ({
                ...prev,
                progress: 100,
                statusMessage: 'Download complete!',
            }));

            // Trigger download
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = blobUrl;
            const extension = format === 'excel' ? 'xlsx' : format;
            a.download = `${filename}-${new Date().toISOString().split('T')[0]}.${extension}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);

            onSuccess?.(format);

            // Keep the success state visible briefly
            setTimeout(() => {
                setState({
                    isExporting: false,
                    progress: 0,
                    currentFormat: null,
                    statusMessage: '',
                });
            }, 1500);
        } catch (error) {
            clearProgressInterval();

            if ((error as Error).name === 'AbortError') {
                setState({
                    isExporting: false,
                    progress: 0,
                    currentFormat: null,
                    statusMessage: '',
                });
                return;
            }

            const errorMessage = error instanceof Error ? error.message : 'Export failed. Please try again.';
            onError?.(errorMessage);

            setState({
                isExporting: false,
                progress: 0,
                currentFormat: null,
                statusMessage: '',
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.isExporting]);

    const cancelExport = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        clearProgressInterval();
        setState({
            isExporting: false,
            progress: 0,
            currentFormat: null,
            statusMessage: '',
        });
    }, []);

    return {
        ...state,
        exportData,
        cancelExport,
    };
}
