/**
 * Scroll-Triggered Animation Components
 *
 * Lightweight wrappers using IntersectionObserver + CSS transitions.
 * Elements animate in when they enter the viewport while scrolling.
 * Zero external animation dependencies — pure browser APIs for performance.
 *
 * Usage:
 *   <ScrollFadeIn>          — fade + slide-up on scroll
 *   <ScrollSlideIn>         — slide from left/right/top/bottom
 *   <ScrollScaleIn>         — scale-pop on scroll
 *   <ScrollStaggerContainer + ScrollStaggerItem> — staggered children
 *   <ScrollRevealSection>   — full-width section reveal
 */

import React, { useEffect, useRef, useState } from 'react';

// ──────────────────────────────────────────────
// Shared IntersectionObserver hook
// ──────────────────────────────────────────────

function useInView(options: { threshold?: number; rootMargin?: string; once?: boolean } = {}) {
    const { threshold = 0.15, rootMargin = '-50px 0px', once = true } = options;
    const ref = useRef<HTMLDivElement>(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    if (once) observer.unobserve(el);
                } else if (!once) {
                    setIsInView(false);
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold, rootMargin, once]);

    return { ref, isInView };
}

// ──────────────────────────────────────────────
// Shared config
// ──────────────────────────────────────────────

interface BaseProps {
    children: React.ReactNode;
    className?: string;
    once?: boolean;
    delay?: number;
    duration?: number;
    amount?: number;
    style?: React.CSSProperties;
    as?: string;
}

// ──────────────────────────────────────────────
// 1. ScrollFadeIn – fade + vertical slide
// ──────────────────────────────────────────────

interface ScrollFadeInProps extends BaseProps {
    y?: number;
    x?: number;
}

export function ScrollFadeIn({
    children,
    className,
    once = true,
    delay = 0,
    duration = 0.6,
    amount = 0.15,
    y = 40,
    x = 0,
    style,
}: ScrollFadeInProps) {
    const { ref, isInView } = useInView({ threshold: amount, once });

    return (
        <div
            ref={ref}
            className={className}
            style={{
                ...style,
                opacity: isInView ? 1 : 0,
                transform: isInView ? 'translate3d(0,0,0)' : `translate3d(${x}px,${y}px,0)`,
                transition: `opacity ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
                willChange: 'opacity, transform',
            }}
        >
            {children}
        </div>
    );
}

// ──────────────────────────────────────────────
// 2. ScrollSlideIn – directional slide
// ──────────────────────────────────────────────

type SlideDirection = 'left' | 'right' | 'up' | 'down';

interface ScrollSlideInProps extends BaseProps {
    direction?: SlideDirection;
    /** Offset distance in pixels */
    offset?: number;
}

const slideOffsets: Record<SlideDirection, (px: number) => { x: number; y: number }> = {
    left: (px) => ({ x: -px, y: 0 }),
    right: (px) => ({ x: px, y: 0 }),
    up: (px) => ({ x: 0, y: -px }),
    down: (px) => ({ x: 0, y: px }),
};

export function ScrollSlideIn({
    children,
    className,
    once = true,
    delay = 0,
    duration = 0.6,
    amount = 0.15,
    direction = 'left',
    offset = 60,
    style,
}: ScrollSlideInProps) {
    const { ref, isInView } = useInView({ threshold: amount, once });
    const from = slideOffsets[direction](offset);

    return (
        <div
            ref={ref}
            className={className}
            style={{
                ...style,
                opacity: isInView ? 1 : 0,
                transform: isInView ? 'translate3d(0,0,0)' : `translate3d(${from.x}px,${from.y}px,0)`,
                transition: `opacity ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
                willChange: 'opacity, transform',
            }}
        >
            {children}
        </div>
    );
}

// ──────────────────────────────────────────────
// 3. ScrollScaleIn – scale pop on scroll
// ──────────────────────────────────────────────

interface ScrollScaleInProps extends BaseProps {
    /** Starting scale (< 1 = grow in, > 1 = shrink in). Default: 0.9 */
    from?: number;
}

export function ScrollScaleIn({
    children,
    className,
    once = true,
    delay = 0,
    duration = 0.5,
    amount = 0.15,
    from = 0.9,
    style,
}: ScrollScaleInProps) {
    const { ref, isInView } = useInView({ threshold: amount, once });

    return (
        <div
            ref={ref}
            className={className}
            style={{
                ...style,
                opacity: isInView ? 1 : 0,
                transform: isInView ? 'scale(1)' : `scale(${from})`,
                transition: `opacity ${duration}s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms, transform ${duration}s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms`,
                willChange: 'opacity, transform',
            }}
        >
            {children}
        </div>
    );
}

// ──────────────────────────────────────────────
// 4. ScrollStagger – staggered children
// ──────────────────────────────────────────────

interface ScrollStaggerContainerProps extends BaseProps {
    /** Delay between each child animation in seconds */
    stagger?: number;
}

const StaggerContext = React.createContext<{ isInView: boolean; stagger: number; baseDelay: number }>({
    isInView: false,
    stagger: 0.08,
    baseDelay: 0,
});

export function ScrollStaggerContainer({
    children,
    className,
    once = true,
    delay = 0,
    stagger = 0.08,
    amount = 0.1,
    style,
}: ScrollStaggerContainerProps) {
    const { ref, isInView } = useInView({ threshold: amount, once });

    return (
        <StaggerContext.Provider value={{ isInView, stagger, baseDelay: delay }}>
            <div
                ref={ref}
                className={className}
                style={{
                    ...style,
                    opacity: isInView ? 1 : 0,
                    transition: `opacity 0.3s ease ${delay}ms`,
                }}
            >
                {children}
            </div>
        </StaggerContext.Provider>
    );
}

// Item types for stagger children
type StaggerAnimation = 'fadeUp' | 'fadeDown' | 'fadeLeft' | 'fadeRight' | 'scaleUp' | 'popIn';

const animationConfigs: Record<StaggerAnimation, {
    from: React.CSSProperties;
    to: React.CSSProperties;
    easing: string;
    dur: number;
}> = {
    fadeUp: {
        from: { opacity: 0, transform: 'translate3d(0,30px,0)' },
        to: { opacity: 1, transform: 'translate3d(0,0,0)' },
        easing: 'cubic-bezier(0.16,1,0.3,1)',
        dur: 0.5,
    },
    fadeDown: {
        from: { opacity: 0, transform: 'translate3d(0,-30px,0)' },
        to: { opacity: 1, transform: 'translate3d(0,0,0)' },
        easing: 'cubic-bezier(0.16,1,0.3,1)',
        dur: 0.5,
    },
    fadeLeft: {
        from: { opacity: 0, transform: 'translate3d(-30px,0,0)' },
        to: { opacity: 1, transform: 'translate3d(0,0,0)' },
        easing: 'cubic-bezier(0.16,1,0.3,1)',
        dur: 0.5,
    },
    fadeRight: {
        from: { opacity: 0, transform: 'translate3d(30px,0,0)' },
        to: { opacity: 1, transform: 'translate3d(0,0,0)' },
        easing: 'cubic-bezier(0.16,1,0.3,1)',
        dur: 0.5,
    },
    scaleUp: {
        from: { opacity: 0, transform: 'scale(0.85)' },
        to: { opacity: 1, transform: 'scale(1)' },
        easing: 'cubic-bezier(0.34,1.56,0.64,1)',
        dur: 0.5,
    },
    popIn: {
        from: { opacity: 0, transform: 'scale(0.6) translate3d(0,20px,0)' },
        to: { opacity: 1, transform: 'scale(1) translate3d(0,0,0)' },
        easing: 'cubic-bezier(0.34,1.56,0.64,1)',
        dur: 0.5,
    },
};

interface ScrollStaggerItemProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    /** Which animation variant to use. Default: fadeUp */
    animation?: StaggerAnimation;
    /** Index for stagger delay calculation */
    index?: number;
}

// Auto-index counter
let staggerCounter = 0;

export function ScrollStaggerItem({
    children,
    className,
    style,
    animation = 'fadeUp',
    index,
}: ScrollStaggerItemProps) {
    const { isInView, stagger, baseDelay } = React.useContext(StaggerContext);
    const autoIndex = useRef(0);

    useEffect(() => {
        autoIndex.current = staggerCounter++;
        return () => { staggerCounter = 0; };
    }, []);

    const idx = index ?? autoIndex.current;
    const config = animationConfigs[animation];
    const itemDelay = baseDelay + idx * stagger * 1000;
    const currentStyle = isInView ? config.to : config.from;

    return (
        <div
            className={className}
            style={{
                ...style,
                ...currentStyle,
                transition: `opacity ${config.dur}s ${config.easing} ${itemDelay}ms, transform ${config.dur}s ${config.easing} ${itemDelay}ms`,
                willChange: 'opacity, transform',
            }}
        >
            {children}
        </div>
    );
}

// ──────────────────────────────────────────────
// 5. ScrollRevealSection – full-section reveal
//    (hero banners, feature sections, etc.)
// ──────────────────────────────────────────────

interface ScrollRevealSectionProps extends BaseProps {
    animation?: 'fade' | 'slideUp' | 'slideDown' | 'expandY';
}

const sectionAnimations: Record<string, { from: React.CSSProperties; to: React.CSSProperties }> = {
    fade: {
        from: { opacity: 0 },
        to: { opacity: 1 },
    },
    slideUp: {
        from: { opacity: 0, transform: 'translate3d(0,50px,0)' },
        to: { opacity: 1, transform: 'translate3d(0,0,0)' },
    },
    slideDown: {
        from: { opacity: 0, transform: 'translate3d(0,-50px,0)' },
        to: { opacity: 1, transform: 'translate3d(0,0,0)' },
    },
    expandY: {
        from: { opacity: 0, transform: 'scaleY(0.8)', transformOrigin: 'top' },
        to: { opacity: 1, transform: 'scaleY(1)', transformOrigin: 'top' },
    },
};

export function ScrollRevealSection({
    children,
    className,
    once = true,
    delay = 0,
    duration = 0.7,
    amount = 0.1,
    animation = 'slideUp',
    style,
}: ScrollRevealSectionProps) {
    const { ref, isInView } = useInView({ threshold: amount, once });
    const config = sectionAnimations[animation];
    const currentStyle = isInView ? config.to : config.from;

    return (
        <section
            ref={ref as React.RefObject<HTMLElement>}
            className={className}
            style={{
                ...style,
                ...currentStyle,
                transition: `opacity ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
                willChange: 'opacity, transform',
            }}
        >
            {children}
        </section>
    );
}

// ──────────────────────────────────────────────
// 6. ScrollCounter – animated number on scroll
// ──────────────────────────────────────────────

interface ScrollCounterProps {
    value: number;
    className?: string;
    /** Number suffix (e.g. '%', '+', 'k') */
    suffix?: string;
    /** Number prefix (e.g. '₱') */
    prefix?: string;
    /** Duration in seconds. Default: 1.5 */
    duration?: number;
    /** Decimal places. Default: 0 */
    decimals?: number;
}

export function ScrollCounter({
    value,
    className,
    suffix = '',
    prefix = '',
    duration = 1.5,
    decimals = 0,
}: ScrollCounterProps) {
    const ref = React.useRef<HTMLSpanElement>(null);
    const hasAnimated = React.useRef(false);
    const [display, setDisplay] = React.useState(`${prefix}0${suffix}`);

    React.useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;
                    const start = performance.now();
                    const durationMs = duration * 1000;

                    const animate = (now: number) => {
                        const elapsed = now - start;
                        const progress = Math.min(elapsed / durationMs, 1);
                        // ease out cubic
                        const eased = 1 - Math.pow(1 - progress, 3);
                        const current = eased * value;
                        setDisplay(`${prefix}${current.toFixed(decimals)}${suffix}`);
                        if (progress < 1) requestAnimationFrame(animate);
                    };
                    requestAnimationFrame(animate);
                } else if (!entry.isIntersecting) {
                    // Reset when leaving view so it re-animates
                    hasAnimated.current = false;
                    setDisplay(`${prefix}0${suffix}`);
                }
            },
            { threshold: 0.3 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [value, prefix, suffix, duration, decimals]);

    return (
        <span ref={ref} className={className}>
            {display}
        </span>
    );
}
