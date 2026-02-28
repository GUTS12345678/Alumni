import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Heavy charting library – only loaded on pages with charts
                    recharts: ['recharts'],
                    // Real-time WebSocket – lazy-loaded, kept separate
                    'vendor-echo': ['pusher-js', 'laravel-echo'],
                    // Rich text editor – only loaded in ContentManagement
                    'vendor-tiptap': [
                        '@tiptap/react',
                        '@tiptap/starter-kit',
                        '@tiptap/extension-image',
                        '@tiptap/extension-link',
                        '@tiptap/extension-underline',
                        '@tiptap/extension-text-align',
                        '@tiptap/extension-placeholder',
                        '@tiptap/extension-color',
                        '@tiptap/extension-text-style',
                        '@tiptap/extension-highlight',
                        '@tiptap/extension-typography',
                    ],
                    // Radix UI primitives – shared across many pages
                    'vendor-radix': [
                        '@radix-ui/react-dialog',
                        '@radix-ui/react-dropdown-menu',
                        '@radix-ui/react-select',
                        '@radix-ui/react-tabs',
                        '@radix-ui/react-tooltip',
                        '@radix-ui/react-scroll-area',
                        '@radix-ui/react-checkbox',
                        '@radix-ui/react-radio-group',
                        '@radix-ui/react-switch',
                        '@radix-ui/react-separator',
                        '@radix-ui/react-label',
                        '@radix-ui/react-slot',
                        '@radix-ui/react-avatar',
                        '@radix-ui/react-progress',
                    ],
                },
            },
        },
    },
    server: {
        host: '0.0.0.0', // Allow external access
        port: 5173,
        strictPort: true,
        cors: true, // Enable CORS
        hmr: {
            host: 'localhost',
        },
    },
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'resources/js'),
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
});
