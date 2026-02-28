import { Link } from '@inertiajs/react';
import {
    GraduationCap,
    Users,
    Briefcase,
    TrendingUp,
    Shield,
    Globe,
    ArrowRight,
    ArrowUp,
    CheckCircle,
    Search,
    MapPin,
    Calendar,
    Clock,
    Building2,
    Megaphone,
    ChevronRight,
    ChevronLeft,
    ExternalLink,
    X,
    Menu,
    LogIn,
    UserPlus,
    BookOpen,
    Layers,
    Newspaper,
    PartyPopper,
    PenTool,
    FolderOpen,
    BarChart3,
    Star,
    Zap,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { PageCarousel, ContentPage } from '@/components/ui/page-carousel';

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface LandingPageProps {
    stats?: {
        totalAlumni: number;
        employmentRate: number;
        activeJobs: number;
        surveysCompleted: number;
        batchYears: number;
        departments: number;
        courses: number;
        industries: number;
    };
}

interface Announcement {
    id: number;
    title: string;
    content: string;
    full_content: string;
    featured_image: string | null;
    pages?: ContentPage[] | null;
    use_pages?: boolean;
    gallery_images?: string[] | null;
    priority: string;
    published_at: string;
    created_at: string;
}

interface Job {
    id: number;
    title: string;
    slug: string;
    company_name: string;
    company_logo: string | null;
    poster_image: string | null;
    content: string;
    pages?: ContentPage[] | null;
    use_pages?: boolean;
    location: string;
    job_type: string;
    job_type_label: string;
    salary_range: string | null;
    is_remote: boolean;
    is_featured: boolean;
    application_deadline: string | null;
    published_at: string;
    external_url?: string | null;
    description?: string;
}

interface SearchResult {
    found: boolean;
    message: string;
    data: {
        registered: boolean;
        name: string;
        graduation_year: number;
        course: string;
        profile_complete?: boolean;
        can_register?: boolean;
    } | null;
}

interface ContentItem {
    id: number;
    title: string;
    slug: string;
    content_type: string;
    content_type_label: string;
    excerpt: string;
    full_content: string;
    pages?: ContentPage[] | null;
    use_pages?: boolean;
    featured_image: string | null;
    gallery_images?: string[] | null;
    is_featured: boolean;
    location: string | null;
    event_date: string | null;
    external_url: string | null;
    published_at: string;
    created_at: string;
}

// ─── Content type config ─────────────────────────────────────────────────────
const contentTypeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; badge: string }> = {
    event: { icon: PartyPopper, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
    news: { icon: Newspaper, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-900/20', badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300' },
    blog: { icon: PenTool, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20', badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' },
    scholarship: { icon: GraduationCap, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
    resource: { icon: FolderOpen, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
};

// ─── Animated counter ────────────────────────────────────────────────────────
function Counter({ value, suffix = '' }: { value: number; suffix?: string }) {
    const [display, setDisplay] = useState(0);
    const started = useRef(false);
    useEffect(() => {
        if (started.current || value === 0) return;
        started.current = true;
        const steps = 50;
        const duration = 1800;
        let step = 0;
        const timer = setInterval(() => {
            step++;
            const pct = 1 - Math.pow(1 - step / steps, 3);
            setDisplay(Math.floor(value * pct));
            if (step >= steps) { clearInterval(timer); setDisplay(value); }
        }, duration / steps);
        return () => clearInterval(timer);
    }, [value]);
    return <>{display.toLocaleString()}{suffix}</>;
}

// ─── Generic carousel with ARIA + keyboard support ──────────────────────────
function Carousel<T extends { id: number }>({
    items,
    renderCard,
    onSelect,
    label = 'Content',
}: {
    items: T[];
    renderCard: (item: T, index: number) => React.ReactNode;
    onSelect: (item: T, index: number) => void;
    label?: string;
}) {
    const [idx, setIdx] = useState(0);
    const visible = 3;
    const max = Math.max(0, items.length - visible);
    const containerRef = useRef<HTMLDivElement>(null);

    const prev = useCallback(() => setIdx(i => Math.max(0, i - 1)), []);
    const next = useCallback(() => setIdx(i => Math.min(max, i + 1)), [max]);

    // Keyboard navigation
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
            if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
        };
        el.addEventListener('keydown', onKey);
        return () => el.removeEventListener('keydown', onKey);
    }, [prev, next]);

    return (
        <div
            ref={containerRef}
            className="relative"
            role="region"
            aria-roledescription="carousel"
            aria-label={`${label} carousel`}
            tabIndex={0}
        >
            {idx > 0 && (
                <button
                    onClick={prev}
                    aria-label="Previous slide"
                    className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full items-center justify-center shadow-md hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all focus-visible:ring-2 focus-visible:ring-maroon-500 focus-visible:ring-offset-2"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
            )}
            {idx < max && (
                <button
                    onClick={next}
                    aria-label="Next slide"
                    className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full items-center justify-center shadow-md hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all focus-visible:ring-2 focus-visible:ring-maroon-500 focus-visible:ring-offset-2"
                >
                    <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
            )}
            <div className="overflow-x-auto md:overflow-hidden -mx-2 px-2 scrollbar-hide" aria-live="polite">
                <div
                    className="flex gap-5 transition-transform duration-500 ease-out pb-2 md:pb-0"
                    style={{ transform: `translateX(-${idx * (100 / visible + 1.5)}%)` }}
                >
                    {items.map((item, i) => (
                        <div
                            key={item.id}
                            role="group"
                            aria-roledescription="slide"
                            aria-label={`Slide ${i + 1} of ${items.length}`}
                            onClick={() => onSelect(item, i)}
                            className="flex-shrink-0 w-[85vw] sm:w-[65vw] md:w-[calc(33.333%-13px)] cursor-pointer"
                        >
                            {renderCard(item, i)}
                        </div>
                    ))}
                </div>
            </div>
            {items.length > visible && (
                <div className="flex justify-center gap-1.5 mt-6" role="tablist" aria-label={`${label} slides`}>
                    {Array.from({ length: max + 1 }).map((_, i) => (
                        <button
                            key={i}
                            role="tab"
                            aria-selected={i === idx}
                            aria-label={`Go to slide group ${i + 1}`}
                            onClick={() => setIdx(i)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? 'w-7 bg-maroon-600 dark:bg-maroon-400' : 'w-1.5 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Modal with body scroll lock + ARIA ──────────────────────────────────────
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', esc);
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', esc);
        };
    }, [onClose]);
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                onClick={e => e.stopPropagation()}
                className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
                {children}
            </div>
        </div>
    );
}

// ─── Section header ──────────────────────────────────────────────────────────
function SectionHeader({ badge, badgeIcon: Icon, title, highlight, sub }: {
    badge: string; badgeIcon: React.ElementType; title: string; highlight: string; sub: string;
}) {
    return (
        <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 bg-maroon-50 dark:bg-maroon-900/30 border border-maroon-200 dark:border-maroon-700 text-maroon-700 dark:text-maroon-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                <Icon className="w-3.5 h-3.5" /> {badge}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-50 mb-3 tracking-tight">
                {title}{' '}
                <span className="text-maroon-600 dark:text-maroon-400">{highlight}</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">{sub}</p>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── Main Component ──────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export default function LandingPage({ stats: initialStats }: LandingPageProps) {
    const [scrollY, setScrollY] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    // Data states
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [moreContent, setMoreContent] = useState<ContentItem[]>([]);
    const [stats, setStats] = useState(initialStats ?? { totalAlumni: 0, employmentRate: 0, activeJobs: 0, surveysCompleted: 0, batchYears: 0, departments: 0, courses: 0, industries: 0 });
    const [loadingA, setLoadingA] = useState(true);
    const [loadingJ, setLoadingJ] = useState(true);
    const [loadingM, setLoadingM] = useState(true);
    const [statsVisible, setStatsVisible] = useState(false);

    // Modal states
    const [selAnnouncement, setSelAnnouncement] = useState<Announcement | null>(null);
    const [selAnnouncementIdx, setSelAnnouncementIdx] = useState(0);
    const [selJob, setSelJob] = useState<Job | null>(null);
    const [selJobIdx, setSelJobIdx] = useState(0);
    const [selContent, setSelContent] = useState<ContentItem | null>(null);
    const [selContentIdx, setSelContentIdx] = useState(0);

    // More content tab
    const [contentTab, setContentTab] = useState('all');

    // Alumni search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState<'email' | 'student_id'>('student_id');
    const [searching, setSearching] = useState(false);
    const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
    const [searchError, setSearchError] = useState('');

    // ── Scroll tracking (body is the scroll container when html has overflow:hidden)
    useEffect(() => {
        const getScrollY = () =>
            document.body.scrollTop || document.documentElement.scrollTop || window.scrollY;
        const onScroll = () => setScrollY(getScrollY());
        document.body.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            document.body.removeEventListener('scroll', onScroll);
            window.removeEventListener('scroll', onScroll);
        };
    }, []);

    // ── Public page class
    useEffect(() => {
        document.documentElement.classList.add('public-page');
        return () => document.documentElement.classList.remove('public-page');
    }, []);

    // ── Active section observer — matches new section order
    useEffect(() => {
        const obs = new IntersectionObserver(
            entries => entries.forEach(e => { if (e.isIntersecting && e.target.id) setActiveSection(e.target.id); }),
            { rootMargin: '-20% 0px -78% 0px', threshold: 0 }
        );
        document.querySelectorAll('#search,#features,#announcements,#jobs,#more').forEach(el => obs.observe(el));
        return () => obs.disconnect();
    }, []);

    // ── Stats section observer
    useEffect(() => {
        const el = document.getElementById('stats-section');
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.2 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    // ── Data fetching
    useEffect(() => {
        const headers = { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
        fetch('/api/v1/public/appearance', { headers }).then(r => r.json()).then(d => {
            if (d.success && d.data) setLogoUrl(d.data.logo_light_path || d.data.logo_dark_path || null);
        }).catch(() => { });
        fetch('/api/v1/public/announcements?limit=9', { headers }).then(r => r.json()).then(d => { if (d.success) setAnnouncements(d.data); }).catch(() => { }).finally(() => setLoadingA(false));
        fetch('/api/v1/public/jobs?limit=9', { headers }).then(r => r.json()).then(d => { if (d.success) setJobs(d.data); }).catch(() => { }).finally(() => setLoadingJ(false));
        fetch('/api/v1/public/more-content?limit=12', { headers }).then(r => r.json()).then(d => { if (d.success) setMoreContent(d.data); }).catch(() => { }).finally(() => setLoadingM(false));
        fetch('/api/v1/public/stats', { headers }).then(r => r.json()).then(d => { if (d.success) setStats(d.data); }).catch(() => { });
    }, []);

    // ── Filtered content
    const filteredContent = contentTab === 'all' ? moreContent : moreContent.filter(i => i.content_type === contentTab);
    const availableTabs = [
        { key: 'all', label: 'All', icon: Layers },
        { key: 'event', label: 'Events', icon: PartyPopper },
        { key: 'news', label: 'News', icon: Newspaper },
        { key: 'blog', label: 'Blogs', icon: PenTool },
        { key: 'scholarship', label: 'Scholarships', icon: GraduationCap },
        { key: 'resource', label: 'Resources', icon: FolderOpen },
    ].filter(t => t.key === 'all' || moreContent.some(i => i.content_type === t.key));

    // ── Smooth scroll nav
    const navTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setMenuOpen(false);
    };

    // ── Alumni search handler
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) { setSearchError('Please enter a search term'); return; }
        setSearching(true); setSearchResult(null); setSearchError('');
        try {
            const r = await fetch('/api/v1/public/search-alumni', {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ search: searchQuery.trim(), search_type: searchType }),
            });
            const d = await r.json();
            if (d.success) setSearchResult(d);
            else setSearchError(d.message || 'Search failed');
        } catch { setSearchError('An error occurred. Please try again.'); }
        finally { setSearching(false); }
    };

    // ── Priority badge colour
    const priorityColor = (p: string) =>
        p === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : p === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-maroon-100 text-maroon-700 dark:bg-maroon-900/30 dark:text-maroon-400';

    // ── Nav links — ordered to match conversion flow
    const navLinks = [
        { id: 'search', label: 'Find Record' },
        { id: 'features', label: 'Features' },
        { id: 'announcements', label: 'News' },
        { id: 'jobs', label: 'Jobs' },
        { id: 'more', label: 'Explore' },
    ];

    const statItems = [
        { label: 'Alumni Tracked', value: stats.totalAlumni, suffix: '+', icon: Users },
        { label: 'Employment Rate', value: stats.employmentRate, suffix: '%', icon: TrendingUp },
        { label: 'Departments', value: stats.departments, suffix: '', icon: BookOpen },
        { label: 'Industries', value: stats.industries, suffix: '+', icon: Globe },
    ];

    const features = [
        { icon: Search, title: 'Instant Record Lookup', desc: 'Check if your alumni record exists in seconds. Search by student ID or email and get started immediately.' },
        { icon: Briefcase, title: 'Exclusive Job Board', desc: 'Access career opportunities posted specifically for alumni from partner companies and employers.' },
        { icon: Megaphone, title: 'University Announcements', desc: 'Never miss important updates, events, or deadlines from your university — delivered directly to you.' },
        { icon: BarChart3, title: 'Career Analytics', desc: 'See employment trends, salary insights, and career paths of fellow alumni to guide your next move.' },
        { icon: Shield, title: 'Verified & Secure', desc: 'Your personal data is protected with enterprise-grade security. Only verified alumni gain access.' },
        { icon: Globe, title: 'Global Alumni Network', desc: 'Connect with graduates worldwide. Discover alumni in your industry, city, or field of interest.' },
    ];

    // ══════════════════════════════════════════════════════════════════════════
    // ─── RENDER ──────────────────────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════════

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ── 1. NAVBAR ─────────────────────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <header
                className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrollY > 40 ? 'bg-white/95 dark:bg-gray-950/95 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-gray-800' : 'bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm'}`}
                role="banner"
            >
                <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 md:h-16" aria-label="Main navigation">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-500 rounded-lg">
                        {logoUrl ? (
                            <img src={`/api/v1/assets/${logoUrl}`} alt="Alumni Tracer Logo" className="h-8 w-auto object-contain" />
                        ) : (
                            <div className="w-8 h-8 rounded-lg bg-maroon-600 flex items-center justify-center">
                                <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                        )}
                        <span className="font-bold text-base text-gray-900 dark:text-gray-100 hidden sm:block">Alumni Tracer</span>
                    </Link>

                    {/* Desktop nav links */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map(l => (
                            <a
                                key={l.id}
                                href={`#${l.id}`}
                                onClick={e => navTo(e, l.id)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-500 ${activeSection === l.id ? 'bg-maroon-50 dark:bg-maroon-900/30 text-maroon-700 dark:text-maroon-300' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            >
                                {l.label}
                            </a>
                        ))}
                    </div>

                    {/* Desktop actions */}
                    <div className="hidden md:flex items-center gap-2">
                        <AppearanceToggleDropdown />
                        <Link href="/login" className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-500">
                            <LogIn className="w-4 h-4" /> Sign In
                        </Link>
                        <Link href="/survey/register" className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-maroon-600 hover:bg-maroon-700 rounded-lg transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-500 focus-visible:ring-offset-2">
                            <UserPlus className="w-4 h-4" /> Register
                        </Link>
                    </div>

                    {/* Mobile actions */}
                    <div className="flex md:hidden items-center gap-1">
                        <AppearanceToggleDropdown />
                        <Link href="/login" className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" aria-label="Sign in"><LogIn className="w-5 h-5" /></Link>
                        <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>
                            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </nav>

                {/* Mobile menu */}
                <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${menuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-4 py-3 space-y-1 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
                        {navLinks.map(l => (
                            <a key={l.id} href={`#${l.id}`} onClick={e => navTo(e, l.id)}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                {l.label}
                            </a>
                        ))}
                        <Link href="/survey/register" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 px-4 py-2.5 mt-2 text-sm font-semibold text-white bg-maroon-600 rounded-lg">
                            <UserPlus className="w-4 h-4" /> Get Started
                        </Link>
                    </div>
                </div>
            </header>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ── 2. HERO — Redesigned for conversion ───────────────── */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <section className="relative pt-28 md:pt-36 pb-20 md:pb-28 px-4 overflow-hidden bg-gradient-to-b from-maroon-950 via-maroon-900 to-maroon-800" role="banner">
                {/* Subtle dot pattern */}
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} aria-hidden="true" />
                {/* Gradient orbs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
                    <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-maroon-500/20 rounded-full blur-[120px]" />
                    <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] bg-maroon-600/15 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/[0.03] rounded-full blur-[80px]" />
                </div>

                <div className="relative max-w-4xl mx-auto text-center">
                    {/* Live trust badge */}
                    <div className="inline-flex items-center gap-2.5 bg-white/[0.08] backdrop-blur-sm border border-white/[0.12] rounded-full px-4 py-2 text-sm text-maroon-100 mb-8">
                        <span className="relative flex h-2 w-2" aria-hidden="true">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                        </span>
                        Trusted by {stats.totalAlumni > 0 ? stats.totalAlumni.toLocaleString() + '+' : ''} alumni across {stats.departments > 0 ? stats.departments : 'multiple'} departments
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-extrabold text-white leading-[1.1] tracking-tight mb-6">
                        Your Alumni Network,{' '}
                        <span className="bg-gradient-to-r from-maroon-200 via-white to-maroon-200 bg-clip-text text-transparent">
                            Rebuilt for the Future
                        </span>
                    </h1>

                    <p className="text-maroon-200/90 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light">
                        Discover job opportunities, receive university announcements, access scholarships, and reconnect with your community — all on one platform.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row justify-center gap-3 mb-12">
                        <Link
                            href="/survey/register"
                            className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-maroon-800 font-semibold rounded-xl hover:bg-maroon-50 transition-all shadow-lg shadow-black/20 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-maroon-900"
                        >
                            Join the Network <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                        <a
                            href="#search"
                            onClick={e => navTo(e, 'search')}
                            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/[0.08] backdrop-blur-sm text-white font-semibold rounded-xl border border-white/[0.15] hover:bg-white/[0.14] transition-all text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                            <Search className="w-4 h-4" /> Find Your Record
                        </a>
                    </div>

                    {/* Trust indicators */}
                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-maroon-300/80 text-sm">
                        <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Verified & Secure</span>
                        <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> Free to Join</span>
                        <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Takes 2 Minutes</span>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ── 3. STATS BAR — Social proof strip ─────────────────── */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <section id="stats-section" className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800" aria-label="Platform statistics">
                <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x divide-gray-200 dark:divide-gray-700">
                    {statItems.map(({ label, value, suffix, icon: Icon }) => (
                        <div key={label} className="flex flex-col items-center text-center px-4">
                            <div className="w-11 h-11 mb-3 rounded-xl bg-maroon-50 dark:bg-maroon-900/30 flex items-center justify-center">
                                <Icon className="w-5 h-5 text-maroon-600 dark:text-maroon-400" />
                            </div>
                            <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-50 tabular-nums tracking-tight">
                                {statsVisible ? <Counter value={value} suffix={suffix} /> : `0${suffix}`}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ── 4. ALUMNI SEARCH — Moved up for immediate utility ── */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <section id="search" className="py-20 md:py-24 px-4" aria-label="Alumni record search">
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
                        {/* Left — pitch */}
                        <div>
                            <span className="inline-flex items-center gap-1.5 bg-maroon-50 dark:bg-maroon-900/30 border border-maroon-200 dark:border-maroon-700 text-maroon-700 dark:text-maroon-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                                <Search className="w-3.5 h-3.5" /> Quick Lookup
                            </span>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-50 mb-4 tracking-tight">
                                Already in{' '}<span className="text-maroon-600 dark:text-maroon-400">Our Records?</span>
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                                Before registering, check if your record already exists in our alumni database. Search by student ID or email — it takes just 5 seconds.
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 dark:text-gray-500">
                                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Instant results</span>
                                <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-500" /> Private & secure</span>
                            </div>
                        </div>

                        {/* Right — search form */}
                        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                            {/* Type toggle */}
                            <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-5" role="tablist" aria-label="Search type">
                                {(['student_id', 'email'] as const).map(t => (
                                    <button
                                        key={t}
                                        role="tab"
                                        aria-selected={searchType === t}
                                        onClick={() => { setSearchType(t); setSearchQuery(''); setSearchResult(null); setSearchError(''); }}
                                        className={`flex-1 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-500 focus-visible:ring-inset ${searchType === t ? 'bg-maroon-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                    >
                                        {t === 'student_id' ? 'Student ID' : 'Email Address'}
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={handleSearch} className="flex gap-2">
                                <label htmlFor="alumni-search-input" className="sr-only">
                                    {searchType === 'student_id' ? 'Enter your student ID' : 'Enter your email address'}
                                </label>
                                <input
                                    id="alumni-search-input"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder={searchType === 'student_id' ? 'e.g. 2019-00123' : 'your@email.com'}
                                    type={searchType === 'email' ? 'email' : 'text'}
                                    autoComplete={searchType === 'email' ? 'email' : 'off'}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500 dark:focus:ring-maroon-400 transition-shadow"
                                />
                                <button
                                    type="submit"
                                    disabled={searching}
                                    className="px-5 py-2.5 bg-maroon-600 hover:bg-maroon-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-500 focus-visible:ring-offset-2"
                                >
                                    {searching ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
                                    {searching ? 'Searching…' : 'Search'}
                                </button>
                            </form>

                            {/* Error state */}
                            {searchError && (
                                <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400" role="alert">
                                    <X className="w-4 h-4 flex-shrink-0" /> {searchError}
                                </div>
                            )}

                            {/* Result state */}
                            {searchResult && (
                                <div className={`mt-4 p-4 rounded-xl border ${searchResult.found ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`} role="status">
                                    {searchResult.found && searchResult.data ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">Record Found!</p>
                                                    <p className="text-xs text-emerald-600 dark:text-emerald-400">{searchResult.message}</p>
                                                </div>
                                            </div>
                                            <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 text-sm space-y-1.5">
                                                <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Name:</span> {searchResult.data.name}</p>
                                                <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Course:</span> {searchResult.data.course || '—'}</p>
                                                <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Graduation Year:</span> {searchResult.data.graduation_year || '—'}</p>
                                            </div>
                                            {!searchResult.data.registered ? (
                                                <Link href="/survey/register" className="group inline-flex items-center gap-2 px-5 py-2.5 bg-maroon-600 hover:bg-maroon-700 text-white font-semibold rounded-xl text-sm transition-colors w-full justify-center">
                                                    Complete Your Registration <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                                </Link>
                                            ) : (
                                                <Link href="/login" className="group inline-flex items-center gap-2 px-5 py-2.5 bg-maroon-600 hover:bg-maroon-700 text-white font-semibold rounded-xl text-sm transition-colors w-full justify-center">
                                                    Sign In to Your Account <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                                </Link>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3">
                                                <Search className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">No Record Found</p>
                                                    <p className="text-xs text-amber-600 dark:text-amber-400">{searchResult.message}</p>
                                                </div>
                                            </div>
                                            <Link href="/survey/register" className="group inline-flex items-center gap-2 px-5 py-2.5 bg-maroon-600 hover:bg-maroon-700 text-white font-semibold rounded-xl text-sm transition-colors w-full justify-center">
                                                Register as New Alumni <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ── 5. FEATURES — Moved up (value props before content) ─ */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <section id="features" className="py-20 md:py-24 px-4 bg-gray-50 dark:bg-gray-900/50" aria-label="Platform features">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader
                        badge="Platform Benefits"
                        badgeIcon={Zap}
                        title="Everything You Need,"
                        highlight="In One Place"
                        sub="A modern platform built to keep you informed, connected, and ahead in your career."
                    />

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map(({ icon: Icon, title, desc }, i) => (
                            <div key={i} className="group p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-maroon-200 dark:hover:border-maroon-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                                <div className="w-11 h-11 rounded-xl bg-maroon-50 dark:bg-maroon-900/30 flex items-center justify-center mb-4 group-hover:bg-maroon-100 dark:group-hover:bg-maroon-900/50 transition-colors">
                                    <Icon className="w-5 h-5 text-maroon-600 dark:text-maroon-400" />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Inline CTA */}
                    <div className="text-center mt-12">
                        <Link
                            href="/survey/register"
                            className="group inline-flex items-center gap-2 px-6 py-3 bg-maroon-600 hover:bg-maroon-700 text-white font-semibold rounded-xl transition-colors text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-500 focus-visible:ring-offset-2"
                        >
                            Create Your Free Account <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ── 6. ANNOUNCEMENTS ──────────────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <section id="announcements" className="py-20 md:py-24 px-4" aria-label="Announcements">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader
                        badge="Latest Updates"
                        badgeIcon={Megaphone}
                        title="Announcements &"
                        highlight="News"
                        sub="Don't miss important updates, events, and deadlines from your alma mater."
                    />

                    {loadingA ? <LoadingCards /> : announcements.length > 0 ? (
                        <>
                            <Carousel
                                items={announcements}
                                label="Announcements"
                                onSelect={(item, i) => { setSelAnnouncement(item); setSelAnnouncementIdx(i); }}
                                renderCard={(a) => (
                                    <article className="group h-full flex flex-col bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden hover:border-maroon-200 dark:hover:border-maroon-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                                        {a.featured_image ? (
                                            <div className="h-44 overflow-hidden">
                                                <img src={a.featured_image} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            </div>
                                        ) : (
                                            <div className="h-44 bg-gradient-to-br from-maroon-50 to-maroon-100 dark:from-maroon-900/20 dark:to-maroon-800/20 flex items-center justify-center">
                                                <Megaphone className="w-12 h-12 text-maroon-300 dark:text-maroon-600" />
                                            </div>
                                        )}
                                        <div className="flex-1 p-5 flex flex-col">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${priorityColor(a.priority)}`}>
                                                    {a.priority.charAt(0).toUpperCase() + a.priority.slice(1)}
                                                </span>
                                                <time className="text-[11px] text-gray-400 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />{a.published_at || a.created_at}
                                                </time>
                                            </div>
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-2 group-hover:text-maroon-600 dark:group-hover:text-maroon-400 transition-colors">{a.title}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 flex-1">{a.content}</p>
                                            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-maroon-600 dark:text-maroon-400 group-hover:gap-2 transition-all">
                                                Read more <ChevronRight className="w-3.5 h-3.5" />
                                            </span>
                                        </div>
                                    </article>
                                )}
                            />
                            {/* Inline conversion nudge */}
                            <div className="mt-8 text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Get notified about new announcements</p>
                                <Link href="/survey/register" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-maroon-600 dark:text-maroon-400 hover:text-maroon-700 dark:hover:text-maroon-300 transition-colors">
                                    Register for updates <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                        </>
                    ) : (
                        <EmptyState icon={Megaphone} message="No announcements yet. Check back later for the latest updates." />
                    )}
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ── 7. JOBS ──────────────────────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <section id="jobs" className="py-20 md:py-24 px-4 bg-gray-50 dark:bg-gray-900/50" aria-label="Job postings">
                <div className="max-w-6xl mx-auto">
                    <SectionHeader
                        badge="Career Opportunities"
                        badgeIcon={Briefcase}
                        title="Latest"
                        highlight="Job Postings"
                        sub="Exclusive career opportunities curated for alumni from partner companies and employers."
                    />

                    {loadingJ ? <LoadingCards /> : jobs.length > 0 ? (
                        <>
                            <Carousel
                                items={jobs}
                                label="Jobs"
                                onSelect={(item, i) => { setSelJob(item); setSelJobIdx(i); }}
                                renderCard={(j) => (
                                    <article className="group h-full flex flex-col bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden hover:border-maroon-200 dark:hover:border-maroon-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                                        {j.poster_image ? (
                                            <div className="h-44 overflow-hidden relative">
                                                <img src={j.poster_image} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                {j.is_featured && <span className="absolute top-2.5 right-2.5 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Star className="w-2.5 h-2.5 fill-current" /> Featured</span>}
                                            </div>
                                        ) : (
                                            <div className="h-44 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center relative">
                                                {j.company_logo
                                                    ? <img src={j.company_logo} alt={j.company_name} loading="lazy" className="max-h-16 object-contain" />
                                                    : <Building2 className="w-10 h-10 text-gray-300 dark:text-gray-600" />}
                                                {j.is_featured && <span className="absolute top-2.5 right-2.5 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Star className="w-2.5 h-2.5 fill-current" /> Featured</span>}
                                            </div>
                                        )}
                                        <div className="flex-1 p-5 flex flex-col">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <span className="text-[11px] bg-maroon-50 dark:bg-maroon-900/30 text-maroon-700 dark:text-maroon-300 px-2 py-0.5 rounded-full font-semibold">{j.job_type_label}</span>
                                                {j.is_remote && <span className="text-[11px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">Remote</span>}
                                            </div>
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-maroon-600 dark:group-hover:text-maroon-400 transition-colors">{j.title}</h3>
                                            <p className="text-sm text-maroon-600 dark:text-maroon-400 font-medium mt-0.5">{j.company_name}</p>
                                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1.5">
                                                <MapPin className="w-3 h-3 flex-shrink-0" /><span className="line-clamp-1">{j.location}</span>
                                            </div>
                                            {j.salary_range && <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-1.5">{j.salary_range}</p>}
                                            {j.application_deadline && (
                                                <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 mt-2">
                                                    <Clock className="w-3 h-3" /> Deadline: {j.application_deadline}
                                                </div>
                                            )}
                                            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-maroon-600 dark:text-maroon-400 group-hover:gap-2 transition-all">
                                                View details <ChevronRight className="w-3.5 h-3.5" />
                                            </span>
                                        </div>
                                    </article>
                                )}
                            />
                            {/* Inline conversion nudge */}
                            <div className="mt-8 text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Want access to all job listings?</p>
                                <Link href="/survey/register" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-maroon-600 dark:text-maroon-400 hover:text-maroon-700 dark:hover:text-maroon-300 transition-colors">
                                    Sign up for free access <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                        </>
                    ) : (
                        <EmptyState icon={Briefcase} message="No job postings yet. Check back later for career opportunities." />
                    )}
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ── 8. MORE CONTENT ───────────────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {(!loadingM && moreContent.length > 0) && (
                <section id="more" className="py-20 md:py-24 px-4" aria-label="More content">
                    <div className="max-w-6xl mx-auto">
                        <SectionHeader
                            badge="Explore More"
                            badgeIcon={Layers}
                            title="Events, Blogs &"
                            highlight="Resources"
                            sub="Discover upcoming events, read insightful stories, explore scholarships and helpful resources."
                        />

                        {/* Tabs */}
                        <div className="flex flex-wrap justify-center gap-2 mb-10" role="tablist" aria-label="Content type filter">
                            {availableTabs.map(t => {
                                const Icon = t.icon;
                                return (
                                    <button
                                        key={t.key}
                                        role="tab"
                                        aria-selected={contentTab === t.key}
                                        onClick={() => setContentTab(t.key)}
                                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-500 ${contentTab === t.key ? 'bg-maroon-600 text-white border-maroon-600 shadow-sm' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-maroon-300 dark:hover:border-maroon-600'}`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />{t.label}
                                    </button>
                                );
                            })}
                        </div>

                        {filteredContent.length > 0 ? (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" role="tabpanel">
                                {filteredContent.map((item, i) => {
                                    const cfg = contentTypeConfig[item.content_type] ?? contentTypeConfig.resource;
                                    const TypeIcon = cfg.icon;
                                    return (
                                        <article
                                            key={item.id}
                                            onClick={() => { setSelContent(item); setSelContentIdx(i); }}
                                            className="group flex flex-col bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden hover:border-maroon-200 dark:hover:border-maroon-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                                        >
                                            {item.featured_image ? (
                                                <div className="h-44 overflow-hidden">
                                                    <img src={item.featured_image} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                </div>
                                            ) : (
                                                <div className={`h-44 ${cfg.bg} flex items-center justify-center`}>
                                                    <TypeIcon className={`w-12 h-12 ${cfg.color} opacity-40`} />
                                                </div>
                                            )}
                                            <div className="flex-1 p-5 flex flex-col">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                                                        <TypeIcon className="w-3 h-3" />{item.content_type_label}
                                                    </span>
                                                    {item.event_date ? (
                                                        <time className="text-[11px] text-purple-600 dark:text-purple-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{item.event_date}</time>
                                                    ) : (
                                                        <time className="text-[11px] text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{item.published_at || item.created_at}</time>
                                                    )}
                                                </div>
                                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-2 group-hover:text-maroon-600 dark:group-hover:text-maroon-400 transition-colors">{item.title}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 flex-1">{item.excerpt}</p>
                                                {item.location && (
                                                    <div className="mt-2 flex items-center gap-1 text-[11px] text-gray-400">
                                                        <MapPin className="w-3 h-3 flex-shrink-0" />{item.location}
                                                    </div>
                                                )}
                                                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-maroon-600 dark:text-maroon-400 group-hover:gap-2 transition-all">
                                                    Read more <ChevronRight className="w-3.5 h-3.5" />
                                                </span>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        ) : (
                            <EmptyState icon={Layers} message="No content in this category yet." />
                        )}
                    </div>
                </section>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ── 9. CTA — Redesigned with social proof ─────────────── */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <section className="relative py-20 md:py-24 px-4 overflow-hidden bg-gradient-to-b from-maroon-950 via-maroon-900 to-maroon-800" aria-label="Call to action">
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} aria-hidden="true" />
                <div className="relative max-w-2xl mx-auto text-center">
                    {/* Social proof counter */}
                    <div className="inline-flex items-center gap-2 bg-white/[0.08] border border-white/[0.12] rounded-full px-4 py-1.5 text-sm text-maroon-200 mb-6">
                        <Users className="w-3.5 h-3.5" /> {stats.totalAlumni > 0 ? `${stats.totalAlumni.toLocaleString()}+ alumni have joined` : 'Alumni are joining every day'}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Your Network Is Waiting</h2>
                    <p className="text-maroon-200/80 mb-10 text-lg leading-relaxed">
                        Join thousands of alumni who are already discovering opportunities, staying informed, and building connections that matter.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-3">
                        <Link
                            href="/survey/register"
                            className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-maroon-700 font-semibold rounded-xl hover:bg-maroon-50 transition-all shadow-lg shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-maroon-900"
                        >
                            Create Free Account <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                        <Link
                            href="/login"
                            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-white/25 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                            <LogIn className="w-4 h-4" /> Sign In
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ── 10. FOOTER — Richer with navigation ───────────────── */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <footer className="py-10 px-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950" role="contentinfo">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-maroon-600 flex items-center justify-center">
                                <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Alumni Tracer System</span>
                        </div>
                        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400" aria-label="Footer navigation">
                            <a href="#search" onClick={e => navTo(e, 'search')} className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">Find Record</a>
                            <a href="#features" onClick={e => navTo(e, 'features')} className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">Features</a>
                            <a href="#jobs" onClick={e => navTo(e, 'jobs')} className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">Jobs</a>
                            <Link href="/login" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">Sign In</Link>
                            <Link href="/survey/register" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">Register</Link>
                        </nav>
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-xs text-gray-400">© {new Date().getFullYear()} Alumni Tracer System. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            {/* ── Scroll to top ─────────────────────────────────────── */}
            {scrollY > 400 && (
                <button
                    onClick={() => {
                        document.body.scrollTo({ top: 0, behavior: 'smooth' });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    aria-label="Scroll to top"
                    className="fixed right-5 bottom-5 z-40 w-10 h-10 bg-maroon-600 hover:bg-maroon-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-500 focus-visible:ring-offset-2"
                >
                    <ArrowUp className="w-4 h-4" />
                </button>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ══════════════ MODALS ═════════════════════════════════════ */}
            {/* ═══════════════════════════════════════════════════════════ */}

            {/* Announcement modal */}
            {selAnnouncement && (
                <Modal onClose={() => setSelAnnouncement(null)}>
                    <ModalHeader image={selAnnouncement.featured_image} onClose={() => setSelAnnouncement(null)}>
                        <div className="flex items-center justify-between mb-1">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${priorityColor(selAnnouncement.priority)}`}>
                                {selAnnouncement.priority.charAt(0).toUpperCase() + selAnnouncement.priority.slice(1)}
                            </span>
                            <time className="text-xs text-gray-400">{selAnnouncement.published_at || selAnnouncement.created_at}</time>
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">{selAnnouncement.title}</h2>
                    </ModalHeader>
                    <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                        {selAnnouncement.use_pages && selAnnouncement.pages?.length ? (
                            <PageCarousel pages={selAnnouncement.pages} showArrows showIndicators />
                        ) : (
                            <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: selAnnouncement.full_content }} />
                        )}
                        {selAnnouncement.gallery_images?.length ? (
                            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <p className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Gallery</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {selAnnouncement.gallery_images.map((src, i) => (
                                        <div key={i} className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"><img src={src} alt="" loading="lazy" className="w-full h-full object-cover" /></div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                    <ModalNav
                        current={selAnnouncementIdx} total={announcements.length}
                        onPrev={() => { const i = selAnnouncementIdx - 1; setSelAnnouncement(announcements[i]); setSelAnnouncementIdx(i); }}
                        onNext={() => { const i = selAnnouncementIdx + 1; setSelAnnouncement(announcements[i]); setSelAnnouncementIdx(i); }}
                    />
                </Modal>
            )}

            {/* Job modal */}
            {selJob && (
                <Modal onClose={() => setSelJob(null)}>
                    <ModalHeader image={selJob.poster_image} onClose={() => setSelJob(null)}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-semibold bg-maroon-100 text-maroon-700 dark:bg-maroon-900/40 dark:text-maroon-300 px-2 py-0.5 rounded-full">{selJob.job_type_label}</span>
                            {selJob.is_featured && <span className="text-[11px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1"><Star className="w-2.5 h-2.5 fill-current" /> Featured</span>}
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">{selJob.title}</h2>
                        <p className="text-sm text-maroon-600 dark:text-maroon-400 font-medium">{selJob.company_name}</p>
                    </ModalHeader>
                    <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                        <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{selJob.location}{selJob.is_remote && ' · Remote'}</span>
                            {selJob.salary_range && <span className="font-semibold text-gray-700 dark:text-gray-200">{selJob.salary_range}</span>}
                            {selJob.application_deadline && <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400"><Clock className="w-4 h-4" /> Deadline: {selJob.application_deadline}</span>}
                        </div>
                        {selJob.use_pages && selJob.pages?.length ? (
                            <PageCarousel pages={selJob.pages} showArrows showIndicators />
                        ) : (
                            <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: selJob.content }} />
                        )}
                        {selJob.external_url && (
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <a href={selJob.external_url} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-maroon-600 hover:bg-maroon-700 text-white font-semibold rounded-lg text-sm transition-colors">
                                    <ExternalLink className="w-4 h-4" /> Visit Company Website
                                </a>
                            </div>
                        )}
                    </div>
                    <ModalNav
                        current={selJobIdx} total={jobs.length}
                        onPrev={() => { const i = selJobIdx - 1; setSelJob(jobs[i]); setSelJobIdx(i); }}
                        onNext={() => { const i = selJobIdx + 1; setSelJob(jobs[i]); setSelJobIdx(i); }}
                    />
                </Modal>
            )}

            {/* Content modal */}
            {selContent && (
                <Modal onClose={() => setSelContent(null)}>
                    {(() => {
                        const cfg = contentTypeConfig[selContent.content_type] ?? contentTypeConfig.resource;
                        const TypeIcon = cfg.icon;
                        return (
                            <>
                                <ModalHeader image={selContent.featured_image} onClose={() => setSelContent(null)}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                                            <TypeIcon className="w-3 h-3" />{selContent.content_type_label}
                                        </span>
                                        <time className="text-xs text-gray-400">{selContent.published_at || selContent.created_at}</time>
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">{selContent.title}</h2>
                                    {(selContent.event_date || selContent.location) && (
                                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            {selContent.event_date && <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400"><Calendar className="w-3.5 h-3.5" />{selContent.event_date}</span>}
                                            {selContent.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{selContent.location}</span>}
                                        </div>
                                    )}
                                </ModalHeader>
                                <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                                    {selContent.use_pages && selContent.pages?.length ? (
                                        <PageCarousel pages={selContent.pages} showArrows showIndicators />
                                    ) : (
                                        <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: selContent.full_content }} />
                                    )}
                                    {selContent.gallery_images?.length ? (
                                        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                                            <p className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Gallery</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {selContent.gallery_images.map((src, i) => (
                                                    <div key={i} className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"><img src={src} alt="" loading="lazy" className="w-full h-full object-cover" /></div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                    {selContent.external_url && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                            <a href={selContent.external_url} target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-maroon-600 hover:bg-maroon-700 text-white font-semibold rounded-lg text-sm transition-colors">
                                                <ExternalLink className="w-4 h-4" /> Visit Link
                                            </a>
                                        </div>
                                    )}
                                </div>
                                <ModalNav
                                    current={selContentIdx} total={filteredContent.length}
                                    onPrev={() => { const i = selContentIdx - 1; setSelContent(filteredContent[i]); setSelContentIdx(i); }}
                                    onNext={() => { const i = selContentIdx + 1; setSelContent(filteredContent[i]); setSelContentIdx(i); }}
                                />
                            </>
                        );
                    })()}
                </Modal>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── Shared Sub-Components ───────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function ModalHeader({ image, onClose, children }: { image: string | null | undefined; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="flex-shrink-0">
            {image && (
                <div className="h-48 overflow-hidden">
                    <img src={image} alt="" loading="lazy" className="w-full h-full object-cover" />
                </div>
            )}
            <button
                onClick={onClose}
                aria-label="Close dialog"
                className="absolute top-3 right-3 w-8 h-8 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full flex items-center justify-center shadow transition-colors z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-500"
            >
                <X className="w-4 h-4" />
            </button>
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">{children}</div>
        </div>
    );
}

function ModalNav({ current, total, onPrev, onNext }: { current: number; total: number; onPrev: () => void; onNext: () => void }) {
    return (
        <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 rounded-b-2xl">
            <button
                onClick={onPrev}
                disabled={current <= 0}
                aria-label="Previous item"
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-500"
            >
                <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className="text-xs text-gray-400 tabular-nums">{current + 1} / {total}</span>
            <button
                onClick={onNext}
                disabled={current >= total - 1}
                aria-label="Next item"
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium bg-maroon-600 text-white rounded-xl disabled:opacity-40 hover:bg-maroon-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-500 focus-visible:ring-offset-2"
            >
                Next <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}

function LoadingCards() {
    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                    <div className="h-44 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse" />
                    <div className="p-5 space-y-3">
                        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full w-1/3 animate-pulse" />
                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full w-3/4 animate-pulse" />
                        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
                        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full w-4/5 animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
    return (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Icon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">{message}</p>
        </div>
    );
}
