import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
}).then(() => {
    // Handle CSRF token mismatch errors globally
    document.addEventListener('inertia:error', (event: any) => {
        const response = event.detail.response;
        
        // Handle 419 CSRF token mismatch
        if (response?.status === 419) {
            event.preventDefault();
            
            if (confirm('Your session has expired. The page will now reload.')) {
                window.location.reload();
            } else {
                window.location.reload();
            }
        }
    });
});

// This will set light / dark mode on load...
initializeTheme();
