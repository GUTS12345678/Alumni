import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export function BackToTop() {
    const [visible, setVisible] = useState(false);
    const scrollerRef = useRef<Element | Window | null>(null);

    useEffect(() => {
        const mainEl = document.querySelector<Element>('main.overflow-y-auto, main[class*="overflow-y-auto"]');
        const appEl = document.getElementById('app');
        const scroller: Element | Window = mainEl ?? appEl ?? window;
        scrollerRef.current = scroller;

        const getScrollTop = () =>
            scroller instanceof Window ? scroller.scrollY : (scroller as Element).scrollTop;

        const onScroll = () => setVisible(getScrollTop() > 300);
        scroller.addEventListener('scroll', onScroll, { passive: true });
        return () => scroller.removeEventListener('scroll', onScroll);
    }, []);

    const scrollToTop = () => {
        if (scrollerRef.current instanceof Window) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            (scrollerRef.current as Element)?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <button
            onClick={scrollToTop}
            aria-label="Back to top"
            className="fixed bottom-6 right-6 z-[9998] flex items-center justify-center w-11 h-11 rounded-full bg-maroon-700 hover:bg-maroon-800 dark:bg-maroon-600 dark:hover:bg-maroon-500 text-white shadow-lg shadow-maroon-900/30 dark:shadow-maroon-950/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-500 focus-visible:ring-offset-2 hover:scale-110 active:scale-90"
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'scale(1) translateY(0)' : 'scale(0.5) translateY(20px)',
                transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                pointerEvents: visible ? 'auto' : 'none',
            }}
        >
            <ArrowUp className="h-5 w-5" />
        </button>
    );
}
