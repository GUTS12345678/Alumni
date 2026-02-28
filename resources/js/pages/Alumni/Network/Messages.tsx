import { useEffect } from 'react';
import { router } from '@inertiajs/react';

// This page is deprecated — redirect to the real messaging page
export default function Messages() {
    useEffect(() => {
        router.visit('/alumni/messages', { replace: true });
    }, []);
    return null;
}
