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
 * Laravel Echo configuration for Reverb WebSocket
 * 
 * This enables real-time features like:
 * - Instant message delivery
 * - Typing indicators
 * - Online presence
 * - Live notifications
 */

let echo: Echo<'reverb'> | null = null;

try {
    echo = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
        wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: '/broadcasting/auth',
    });

    window.Echo = echo;

    console.log('Laravel Echo initialized successfully');
} catch (error) {
    console.warn('Laravel Echo failed to initialize. Real-time features will be unavailable.', error);
    // Create a mock Echo object to prevent errors in components that use it
    window.Echo = null as any;
}

export default echo;
