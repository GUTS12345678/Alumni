/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Centralized API Service Layer
 * 
 * Single source of truth for all API calls.
 * Handles auth, CSRF, error normalization, and 401 redirects.
 */

// Extend Window to track redirect state
declare global {
    interface Window {
        __redirectingToLogin?: boolean;
    }
}

const API_BASE = '/api/v1';

// Token stored from meta tag or cookie
function getCsrfToken(): string {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta?.getAttribute('content') || '';
}

function getAuthToken(): string | null {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
}

export interface ApiResponse<T = any> {
    success: boolean;
    data: T;
    message?: string;
    errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T = any> {
    success: boolean;
    data: {
        data: T[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
}

export class ApiError extends Error {
    status: number;
    errors: Record<string, string[]>;
    data: any;

    constructor(message: string, status: number, errors: Record<string, string[]> = {}, data: any = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.errors = errors;
        this.data = data;
    }

    /** Get the first error message from validation errors */
    get firstError(): string {
        const firstKey = Object.keys(this.errors)[0];
        return firstKey ? this.errors[firstKey][0] : this.message;
    }

    /** Check if this is a validation error (422) */
    get isValidation(): boolean {
        return this.status === 422;
    }

    /** Check if this is an auth error (401) */
    get isUnauthorized(): boolean {
        return this.status === 401;
    }

    /** Check if this is a forbidden error (403) */
    get isForbidden(): boolean {
        return this.status === 403;
    }

    /** Check if this is a not found error (404) */
    get isNotFound(): boolean {
        return this.status === 404;
    }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
    /** Query parameters */
    params?: Record<string, string | number | boolean | undefined | null>;
    /** Request body (auto-serialized to JSON unless FormData) */
    body?: any;
    /** Additional headers */
    headers?: Record<string, string>;
    /** AbortSignal for cancellation */
    signal?: AbortSignal;
    /** Skip the automatic 401 redirect */
    skipAuthRedirect?: boolean;
}

async function request<T = any>(
    method: HttpMethod,
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const { params, body, headers: extraHeaders, signal, skipAuthRedirect } = options;

    // Build URL with query params
    let url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, String(value));
            }
        });
        const qs = searchParams.toString();
        if (qs) url += `?${qs}`;
    }

    // Build headers
    const headers: Record<string, string> = {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': getCsrfToken(),
        ...extraHeaders,
    };

    // Add auth token if available
    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Build fetch options
    const fetchOptions: RequestInit = {
        method,
        headers,
        credentials: 'include',
        signal,
    };

    // Handle body
    if (body !== undefined) {
        if (body instanceof FormData) {
            // Don't set Content-Type for FormData (browser will set boundary)
            delete headers['Content-Type'];
            fetchOptions.body = body;
        } else {
            headers['Content-Type'] = 'application/json';
            fetchOptions.body = JSON.stringify(body);
        }
    }

    fetchOptions.headers = headers;

    // Execute request
    let response: Response;
    try {
        response = await fetch(url, fetchOptions);
    } catch (err: any) {
        if (err.name === 'AbortError') {
            throw err;
        }
        throw new ApiError(
            'Network error. Please check your connection.',
            0,
            {},
            null
        );
    }

    // Handle 401 - redirect to login (only if not already navigating)
    if (response.status === 401 && !skipAuthRedirect) {
        // Avoid multiple redirects from concurrent requests
        if (!window.__redirectingToLogin) {
            window.__redirectingToLogin = true;
            // Small delay so user can see what happened
            setTimeout(() => {
                window.location.href = '/login';
            }, 100);
        }
        throw new ApiError('Session expired. Redirecting to login...', 401);
    }

    // Handle 419 - CSRF mismatch
    if (response.status === 419) {
        window.location.reload();
        throw new ApiError('Session expired. Page will reload.', 419);
    }

    // Parse response
    let data: any;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        data = await response.json();
    } else {
        // For non-JSON responses (file downloads, etc.)
        if (response.ok) {
            return response as any;
        }
        const text = await response.text();
        data = { message: text || response.statusText };
    }

    // Handle 403 with must_change_password flag — redirect to password change page
    if (response.status === 403 && data?.must_change_password) {
        if (data.redirect) {
            window.location.href = data.redirect;
        } else {
            window.location.href = '/force-change-password';
        }
        throw new ApiError('You must change your password before continuing.', 403, {}, data);
    }

    // Handle error responses
    if (!response.ok) {
        throw new ApiError(
            data?.message || `Request failed (${response.status})`,
            response.status,
            data?.errors || {},
            data
        );
    }

    return data as T;
}

// ============================================
// Convenience methods
// ============================================

export const api = {
    get: <T = any>(endpoint: string, params?: Record<string, any>, options?: Omit<RequestOptions, 'params' | 'body'>) =>
        request<T>('GET', endpoint, { ...options, params }),

    post: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'body'>) =>
        request<T>('POST', endpoint, { ...options, body }),

    put: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'body'>) =>
        request<T>('PUT', endpoint, { ...options, body }),

    patch: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'body'>) =>
        request<T>('PATCH', endpoint, { ...options, body }),

    delete: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'body'>) =>
        request<T>('DELETE', endpoint, { ...options, body }),

    /** Upload file(s) via FormData */
    upload: <T = any>(endpoint: string, formData: FormData, options?: Omit<RequestOptions, 'body'>) =>
        request<T>('POST', endpoint, { ...options, body: formData }),
};

// ============================================
// Content API (unified content system)
// ============================================

export const contentApi = {
    // Alumni/public
    list: (params?: Record<string, any>) =>
        api.get<PaginatedResponse>('/content', params),

    show: (id: number) =>
        api.get<ApiResponse>(`/content/${id}`),

    featured: (params?: Record<string, any>) =>
        api.get<ApiResponse>('/content/featured', params),

    recent: (params?: Record<string, any>) =>
        api.get<ApiResponse>('/content/recent', params),

    unreadCount: () =>
        api.get<ApiResponse>('/content/unread-count'),

    markAsRead: (id: number) =>
        api.post<ApiResponse>(`/content/${id}/read`),

    categories: () =>
        api.get<ApiResponse>('/content/categories'),

    // Admin
    adminList: (params?: Record<string, any>) =>
        api.get<PaginatedResponse>('/content/admin/list', params),

    create: (data: Record<string, any>) =>
        api.post<ApiResponse>('/content/admin/create', data),

    update: (id: number, data: Record<string, any>) =>
        api.put<ApiResponse>(`/content/admin/${id}`, data),

    destroy: (id: number) =>
        api.delete<ApiResponse>(`/content/admin/${id}`),

    statistics: () =>
        api.get<ApiResponse>('/content/admin/statistics'),

    exportContent: (params?: Record<string, any>) =>
        api.get('/content/admin/export', params),

    batchYears: () =>
        api.get<ApiResponse>('/content/admin/batch-years'),

    bulkStatus: (contentIds: number[], status: string) =>
        api.post<ApiResponse>('/content/admin/bulk-status', { content_ids: contentIds, status }),

    // Categories
    createCategory: (data: Record<string, any>) =>
        api.post<ApiResponse>('/content/admin/categories', data),

    updateCategory: (id: number, data: Record<string, any>) =>
        api.put<ApiResponse>(`/content/admin/categories/${id}`, data),

    deleteCategory: (id: number) =>
        api.delete<ApiResponse>(`/content/admin/categories/${id}`),
};

// ============================================
// Dashboard API
// ============================================

export const dashboardApi = {
    getStats: (params?: Record<string, any>) =>
        api.get<ApiResponse>('/admin/dashboard', params),

    refreshCache: () =>
        api.post<ApiResponse>('/admin/dashboard/refresh-cache'),

    clearAllCaches: () =>
        api.post<ApiResponse>('/admin/cache/clear-all'),

    cacheHealth: () =>
        api.get<ApiResponse>('/admin/cache/health'),
};

// ============================================
// Auth API
// ============================================

export const authApi = {
    login: (credentials: { email: string; password: string }) =>
        api.post<ApiResponse>('/login', credentials),

    register: (data: Record<string, any>) =>
        api.post<ApiResponse>('/register', data),

    logout: () =>
        api.post<ApiResponse>('/logout'),

    profile: () =>
        api.get<ApiResponse>('/profile'),

    updateProfile: (data: Record<string, any>) =>
        api.post<ApiResponse>('/profile', data),

    checkEmail: (email: string) =>
        api.post<ApiResponse>('/check-email', { email }),

    checkStudentId: (student_id: string) =>
        api.post<ApiResponse>('/check-student-id', { student_id }),
};

// ============================================
// Alumni API
// ============================================

export const alumniApi = {
    list: (params?: Record<string, any>) =>
        api.get<PaginatedResponse>('/admin/alumni', params),

    show: (id: number) =>
        api.get<ApiResponse>(`/admin/alumni/${id}`),

    update: (id: number, data: Record<string, any>) =>
        api.put<ApiResponse>(`/admin/alumni/${id}`, data),

    destroy: (id: number) =>
        api.delete<ApiResponse>(`/admin/alumni/${id}`),

    stats: () =>
        api.get<ApiResponse>('/admin/alumni/stats'),

    exportAlumni: (params?: Record<string, any>) =>
        api.get('/admin/alumni/export', params),
};

// ============================================
// Survey API
// ============================================

export const surveyApi = {
    list: (params?: Record<string, any>) =>
        api.get<PaginatedResponse>('/admin/surveys', params),

    show: (id: number) =>
        api.get<ApiResponse>(`/admin/surveys/${id}`),

    create: (data: Record<string, any>) =>
        api.post<ApiResponse>('/admin/surveys', data),

    update: (id: number, data: Record<string, any>) =>
        api.put<ApiResponse>(`/admin/surveys/${id}`, data),

    destroy: (id: number) =>
        api.delete<ApiResponse>(`/admin/surveys/${id}`),

    duplicate: (id: number) =>
        api.post<ApiResponse>(`/admin/surveys/${id}/duplicate`),

    responses: (surveyId: number, params?: Record<string, any>) =>
        api.get<ApiResponse>(`/admin/surveys/${surveyId}/responses`, params),

    exportResponses: (surveyId: number) =>
        api.get(`/admin/surveys/${surveyId}/export`),
};

// ============================================
// Messaging API
// ============================================

export const messagingApi = {
    conversations: () =>
        api.get<ApiResponse>('/messaging/conversations'),

    conversation: (id: number) =>
        api.get<ApiResponse>(`/messaging/conversations/${id}`),

    createConversation: (data: Record<string, any>) =>
        api.post<ApiResponse>('/messaging/conversations', data),

    sendMessage: (conversationId: number, data: Record<string, any>) =>
        api.post<ApiResponse>(`/messaging/conversations/${conversationId}/messages`, data),

    markRead: (conversationId: number) =>
        api.post<ApiResponse>(`/messaging/conversations/${conversationId}/read`),

    unreadCount: () =>
        api.get<ApiResponse>('/messaging/unread-count'),

    searchUsers: (query: string) =>
        api.get<ApiResponse>('/messaging/users/search', { query }),
};

export default api;
