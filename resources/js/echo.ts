import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Make Pusher available globally (required by Laravel Echo)
declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: Echo<'reverb'>;
    }
}

window.Pusher = Pusher;

/**
 * Laravel Echo initialization.
 * This module is lazy-loaded — only imported when components need real-time features.
 * This keeps ~100KB of pusher-js out of the initial page load.
 */

let echo: Echo<'reverb'> | null = null;

try {
    const wsScheme = import.meta.env.VITE_REVERB_SCHEME ?? 'https';
    const wsPort = Number(import.meta.env.VITE_REVERB_PORT ?? (wsScheme === 'https' ? 443 : 80));

    echo = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: wsPort,
        wssPort: wsPort,
        forceTLS: wsScheme === 'https',
        enabledTransports: wsScheme === 'https' ? ['wss'] : ['ws', 'wss'],
        authEndpoint: '/broadcasting/auth',
        auth: {
            headers: {
                'X-CSRF-TOKEN': document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                'X-Requested-With': 'XMLHttpRequest',
            },
        },
    });

    window.Echo = echo;
} catch (error) {
    console.warn('Laravel Echo failed to initialize. Real-time features will be unavailable.', error);
    // Create a mock Echo object to prevent errors in components that use it
    window.Echo = null as any;
}

export default echo;
