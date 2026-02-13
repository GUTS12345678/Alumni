import { useCallback, useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

const prefersDark = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const applyTheme = (appearance: Appearance) => {
    const isDark = appearance === 'dark' || (appearance === 'system' && prefersDark());

    document.documentElement.classList.toggle('dark', isDark);
};

const mediaQuery = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.matchMedia('(prefers-color-scheme: dark)');
};

export function initializeTheme() {
    if (typeof window === 'undefined') return;

    const savedAppearance = (localStorage.getItem('appearance') as Appearance) || 'system';
    applyTheme(savedAppearance);

    // Add system theme change listener (will be managed by useAppearance hook if used)
    const listener = () => {
        const currentAppearance = localStorage.getItem('appearance') as Appearance;
        if (currentAppearance === 'system' || !currentAppearance) {
            applyTheme(currentAppearance || 'system');
        }
    };

    mediaQuery()?.addEventListener('change', listener);

    // Return cleanup function for manual cleanup if needed
    return () => {
        mediaQuery()?.removeEventListener('change', listener);
    };
}

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>(() => {
        // Initialize from localStorage on mount
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('appearance') as Appearance) || 'system';
        }
        return 'system';
    });

    const updateAppearance = useCallback((mode: Appearance) => {
        setAppearance(mode);

        // Store in localStorage for client-side persistence...
        localStorage.setItem('appearance', mode);

        // Store in cookie for SSR...
        setCookie('appearance', mode);

        applyTheme(mode);
    }, []);

    useEffect(() => {
        // Apply theme on mount
        applyTheme(appearance);

        // Set up system theme change listener
        const mq = mediaQuery();
        const listener = () => {
            const currentAppearance = localStorage.getItem('appearance') as Appearance;
            if (currentAppearance === 'system' || !currentAppearance) {
                applyTheme(currentAppearance || 'system');
            }
        };

        mq?.addEventListener('change', listener);

        return () => {
            mq?.removeEventListener('change', listener);
        };
    }, [appearance]);

    return { appearance, updateAppearance } as const;
}
