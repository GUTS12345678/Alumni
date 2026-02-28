import '../css/app.css';
// Laravel Echo is lazy-loaded when needed (see NotificationListener / useRealtime)
// This avoids loading ~100KB of pusher-js on every page

import axios from 'axios';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { CampusProvider } from './contexts/CampusContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationListener } from './components/NotificationListener';

// ── Axios global setup ─────────────────────────────────────────────
// Always send credentials (session cookies) and the CSRF meta token
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';

// Read CSRF token from meta tag and send as header on every mutating request
const csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
if (csrfToken) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
}

// On 419, refresh the CSRF cookie then retry the original request once
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 419 && !error.config?._csrfRetried) {
            error.config._csrfRetried = true;
            await axios.get('/sanctum/csrf-cookie');
            // After refreshing, read XSRF-TOKEN from cookies (the meta tag is stale)
            const xsrfCookie = document.cookie
                .split('; ')
                .find(row => row.startsWith('XSRF-TOKEN='));
            if (xsrfCookie) {
                const tokenValue = decodeURIComponent(xsrfCookie.split('=')[1]);
                axios.defaults.headers.common['X-XSRF-TOKEN'] = tokenValue;
                error.config.headers['X-XSRF-TOKEN'] = tokenValue;
            }
            // Also re-read meta tag in case it was updated by a full page load
            const metaToken = document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (metaToken) {
                axios.defaults.headers.common['X-CSRF-TOKEN'] = metaToken;
                error.config.headers['X-CSRF-TOKEN'] = metaToken;
            }
            return axios(error.config);
        }
        return Promise.reject(error);
    }
);

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Initialize theme BEFORE app renders to prevent flash
initializeTheme();

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // Get user info from page props for campus context
        const pageProps = props.initialPage.props as any;
        const user = pageProps?.auth?.user;

        root.render(
            <ErrorBoundary>
                <CampusProvider
                    userCampusId={user?.campus_id}
                    userRole={user?.role}
                >
                    <NotificationListener userId={user?.id}>
                        <App {...props} />
                    </NotificationListener>
                </CampusProvider>
            </ErrorBoundary>
        );
    },
    progress: {
        color: '#4B5563',
    },
}).then(() => {
    // Handle CSRF token mismatch errors globally
    document.addEventListener('inertia:error', (event: any) => {
        const response = event.detail.response;

        // Handle 419 CSRF token mismatch — only reload if not navigating away
        // (e.g., after login the page is already navigating to /dashboard)
        if (response?.status === 419) {
            event.preventDefault();
            // The axios interceptor already retries with a fresh CSRF token.
            // Only reload as a last resort if the user is still on the same page.
            setTimeout(() => {
                // If we're still on the same URL after 500ms, reload to get a fresh token
                const currentUrl = window.location.href;
                setTimeout(() => {
                    if (window.location.href === currentUrl) {
                        window.location.reload();
                    }
                }, 500);
            }, 0);
        }
    });
});
