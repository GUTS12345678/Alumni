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
    ArrowDown,
    CheckCircle,
    Star,
    MessageCircle,
    BarChart3,
    Award,
    Search,
    MapPin,
    Calendar,
    Clock,
    Building2,
    Mail,
    IdCard,
    Megaphone,
    ChevronRight,
    ChevronLeft,
    ExternalLink,
    X,
    Menu,
    LogIn,
    UserPlus,
    BookOpen,
    Layers
} from 'lucide-react';
import { useState, useEffect } from 'react';
import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { PageCarousel, ContentPage } from '@/components/ui/page-carousel';

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

export default function LandingPage({ stats: initialStats }: LandingPageProps) {
    const [scrollY, setScrollY] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [appearanceSettings, setAppearanceSettings] = useState<{
        logoLight: string | null;
        logoDark: string | null;
        heroBackground: string | null;
    }>({ logoLight: null, logoDark: null, heroBackground: null });

    // Animation states for scroll-triggered sections
    const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
    const [animatedStats, setAnimatedStats] = useState(initialStats ? {
        totalAlumni: initialStats.totalAlumni || 0,
        employmentRate: initialStats.employmentRate || 0,
        activeJobs: initialStats.activeJobs || 0,
        surveysCompleted: initialStats.surveysCompleted || 0,
        batchYears: initialStats.batchYears || 0,
        departments: initialStats.departments || 0,
        courses: initialStats.courses || 0,
        industries: initialStats.industries || 0
    } : {
        totalAlumni: 0,
        employmentRate: 0,
        activeJobs: 0,
        surveysCompleted: 0,
        batchYears: 0,
        departments: 0,
        courses: 0,
        industries: 0
    });
    const [statsAnimated, setStatsAnimated] = useState(!!initialStats?.totalAlumni);

    // Stats state
    const [stats, setStats] = useState(initialStats || {
        totalAlumni: 0,
        employmentRate: 0,
        activeJobs: 0,
        surveysCompleted: 0,
        batchYears: 0,
        departments: 0,
        courses: 0,
        industries: 0
    });

    // Announcements state
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState<number>(0);
    const [announcementScrollIndex, setAnnouncementScrollIndex] = useState(0);

    // Jobs state
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [currentJobIndex, setCurrentJobIndex] = useState<number>(0);
    const [jobScrollIndex, setJobScrollIndex] = useState(0);

    // Alumni search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState<'email' | 'student_id'>('student_id');
    const [searching, setSearching] = useState(false);
    const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
    const [searchError, setSearchError] = useState('');

    // Mobile menu state
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Active section tracking for navigation
    const [activeSection, setActiveSection] = useState('');

    useEffect(() => {
        const handleScroll = () => {
            // Check if scrolling is happening on document element or window
            const scrollPos = document.documentElement.scrollTop || document.body.scrollTop || window.scrollY;
            setScrollY(scrollPos);
        };

        // Listen to scroll on both window and document
        window.addEventListener('scroll', handleScroll, { passive: true });
        document.addEventListener('scroll', handleScroll, { passive: true });
        setIsVisible(true);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Add public-page class to html for proper scrolling
    useEffect(() => {
        document.documentElement.classList.add('public-page');
        return () => {
            document.documentElement.classList.remove('public-page');
        };
    }, []);

    // Intersection Observer for scroll-triggered animations
    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setVisibleSections((prev) => new Set([...prev, entry.target.id]));
                }
            });
        }, observerOptions);

        // Observe all sections
        const sections = document.querySelectorAll('[data-animate]');
        sections.forEach((section) => observer.observe(section));

        return () => observer.disconnect();
    }, []);

    // Track active section for navigation highlighting
    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -80% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && entry.target.id) {
                    setActiveSection(entry.target.id);
                }
            });
        }, observerOptions);

        // Observe navigation target sections
        const sections = document.querySelectorAll('#announcements, #jobs, #search, #features');
        sections.forEach((section) => observer.observe(section));

        return () => observer.disconnect();
    }, []);

    // Smooth scroll handler
    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
        e.preventDefault();
        const target = document.querySelector(targetId);
        if (target) {
            // Use scrollIntoView for more reliable scrolling
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

            // Adjust for fixed navbar after scroll
            setTimeout(() => {
                const navHeight = 80;
                const scrollContainer = document.documentElement.scrollTop > 0 ? document.documentElement : document.body;
                scrollContainer.scrollTop -= navHeight;
            }, 100);

            // Add a subtle flash animation to the target section
            target.classList.add('section-flash');
            setTimeout(() => {
                target.classList.remove('section-flash');
            }, 1000);
        }
    };

    // Scroll to top
    const scrollToTop = () => {
        document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Scroll to bottom
    const scrollToBottom = () => {
        const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
        document.documentElement.scrollTo({ top: scrollHeight, behavior: 'smooth' });
        window.scrollTo({ top: scrollHeight, behavior: 'smooth' });
    };

    // Animate stats counter when visible
    useEffect(() => {
        if (!statsAnimated && stats.totalAlumni > 0) {
            // If hero-stats is visible, animate with counter effect
            if (visibleSections.has('hero-stats')) {
                setStatsAnimated(true);
                const duration = 2000;
                const steps = 60;
                const interval = duration / steps;

                let currentStep = 0;
                const timer = setInterval(() => {
                    currentStep++;
                    const progress = currentStep / steps;
                    const easeOut = 1 - Math.pow(1 - progress, 3);

                    setAnimatedStats({
                        totalAlumni: Math.floor(stats.totalAlumni * easeOut),
                        employmentRate: Math.floor(stats.employmentRate * easeOut),
                        activeJobs: Math.floor(stats.activeJobs * easeOut),
                        surveysCompleted: Math.floor(stats.surveysCompleted * easeOut),
                        batchYears: Math.floor((stats.batchYears || 0) * easeOut),
                        departments: Math.floor((stats.departments || 0) * easeOut),
                        courses: Math.floor((stats.courses || 0) * easeOut),
                        industries: Math.floor((stats.industries || 0) * easeOut)
                    });

                    if (currentStep >= steps) {
                        clearInterval(timer);
                        setAnimatedStats(stats);
                    }
                }, interval);

                return () => clearInterval(timer);
            }
        }
    }, [visibleSections, stats, statsAnimated]);

    // Fallback: if stats loaded but animation never triggered after 3s, show values directly
    useEffect(() => {
        if (stats.totalAlumni > 0 && !statsAnimated) {
            const fallback = setTimeout(() => {
                if (!statsAnimated) {
                    setAnimatedStats(stats);
                    setStatsAnimated(true);
                }
            }, 3000);
            return () => clearTimeout(fallback);
        }
    }, [stats, statsAnimated]);

    // Fetch appearance settings
    useEffect(() => {
        const fetchAppearanceSettings = async () => {
            try {
                const response = await fetch('/api/v1/public/appearance', {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                        setAppearanceSettings({
                            logoLight: data.data.logo_light_path,
                            logoDark: data.data.logo_dark_path,
                            heroBackground: data.data.background_image_path || data.data.hero_background_path || null,
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch appearance settings:', error);
            }
        };

        fetchAppearanceSettings();
    }, []);

    // Fetch public announcements
    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const response = await fetch('/api/v1/public/announcements?limit=6', {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setAnnouncements(data.data);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch announcements:', error);
            } finally {
                setLoadingAnnouncements(false);
            }
        };

        fetchAnnouncements();
    }, []);

    // Fetch public jobs
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const response = await fetch('/api/v1/public/jobs?limit=6', {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setJobs(data.data);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch jobs:', error);
            } finally {
                setLoadingJobs(false);
            }
        };

        fetchJobs();
    }, []);

    // Fetch stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/v1/public/stats', {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setStats(data.data);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            }
        };

        fetchStats();
    }, []);

    // Search alumni
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!searchQuery.trim()) {
            setSearchError('Please enter a search term');
            return;
        }

        setSearching(true);
        setSearchResult(null);
        setSearchError('');

        try {
            const response = await fetch('/api/v1/public/search-alumni', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    search: searchQuery.trim(),
                    search_type: searchType,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSearchResult(data);
            } else {
                setSearchError(data.message || 'Search failed');
            }
        } catch (error) {
            console.error('Search error:', error);
            setSearchError('An error occurred while searching. Please try again.');
        } finally {
            setSearching(false);
        }
    };

    const features = [
        {
            icon: Users,
            title: "Alumni Network",
            description: "Connect with thousands of graduates worldwide and build meaningful professional relationships.",
            color: "from-maroon-500 to-maroon-600"
        },
        {
            icon: Briefcase,
            title: "Career Opportunities",
            description: "Access exclusive job postings and career development resources tailored for alumni.",
            color: "from-maroon-600 to-maroon-700"
        },
        {
            icon: TrendingUp,
            title: "Track Progress",
            description: "Monitor your career journey and celebrate milestones with your alma mater community.",
            color: "from-maroon-500 to-beige-600"
        },
        {
            icon: BarChart3,
            title: "Analytics & Insights",
            description: "Gain valuable insights into employment trends and career trajectories of fellow alumni.",
            color: "from-maroon-600 to-maroon-800"
        },
        {
            icon: MessageCircle,
            title: "Mentorship Programs",
            description: "Connect with experienced mentors or become one to guide the next generation.",
            color: "from-maroon-500 to-maroon-700"
        },
        {
            icon: Award,
            title: "Recognition & Events",
            description: "Participate in exclusive alumni events and receive recognition for your achievements.",
            color: "from-maroon-700 to-maroon-800"
        }
    ];

    const benefits = [
        "Real-time job matching based on your profile",
        "Secure and verified alumni directory",
        "Advanced career analytics dashboard",
        "Mobile-friendly responsive design",
        "Regular employment surveys and feedback",
        "Direct communication with institution"
    ];

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'high':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            default:
                return 'bg-maroon-100 text-maroon-800 border-maroon-200';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-maroon-50 via-beige-50 to-maroon-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-maroon-900 dark:text-gray-100 overflow-x-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-maroon-200 dark:bg-maroon-900/30 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-beige-200 dark:bg-gray-700/30 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-maroon-300 dark:bg-maroon-900/30 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            {/* Navigation */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-lg border-b border-maroon-100 dark:border-gray-700' : 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md'}`}>
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14 sm:h-16 md:h-18">
                        {/* Logo */}
                        <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
                            {appearanceSettings.logoLight || appearanceSettings.logoDark ? (
                                <img
                                    src={`/api/v1/assets/${appearanceSettings.logoLight || appearanceSettings.logoDark}`}
                                    alt="Alumni Tracer Logo"
                                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-lg"
                                />
                            ) : (
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-maroon-600 to-maroon-700 rounded-lg flex items-center justify-center shadow-md">
                                    <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                            )}
                            <div className="hidden xs:block">
                                <h1 className="text-base sm:text-lg md:text-xl font-bold text-maroon-900 dark:text-gray-100 leading-tight">
                                    Alumni Tracer
                                </h1>
                                <p className="text-[10px] sm:text-xs text-maroon-600 dark:text-gray-400 leading-tight hidden sm:block">Stay Connected, Track Your Career</p>
                            </div>
                        </Link>

                        {/* Desktop Navigation - Hidden on mobile/tablet */}
                        <div className="hidden lg:flex items-center space-x-1 xl:space-x-2">
                            {[
                                { id: 'announcements', label: 'Announcements' },
                                { id: 'jobs', label: 'Jobs' },
                                { id: 'search', label: 'Find Me' },
                                { id: 'features', label: 'Features' }
                            ].map((item) => (
                                <a
                                    key={item.id}
                                    href={`#${item.id}`}
                                    onClick={(e) => handleNavClick(e, `#${item.id}`)}
                                    className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activeSection === item.id
                                        ? 'text-maroon-900 dark:text-white bg-maroon-50 dark:bg-gray-700'
                                        : 'text-maroon-600 dark:text-gray-300 hover:text-maroon-900 dark:hover:text-white hover:bg-maroon-50/50 dark:hover:bg-gray-700/50'
                                        }`}
                                >
                                    {item.label}
                                    {activeSection === item.id && (
                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-maroon-600 dark:bg-maroon-400 rounded-full" />
                                    )}
                                </a>
                            ))}
                        </div>

                        {/* Desktop Auth Buttons - Hidden on mobile/tablet */}
                        <div className="hidden lg:flex items-center space-x-2 xl:space-x-3">
                            <AppearanceToggleDropdown />
                            <Link
                                href="/login"
                                className="flex items-center space-x-1.5 px-4 py-2 text-sm font-medium text-maroon-700 dark:text-gray-300 hover:text-maroon-900 dark:hover:text-white hover:bg-maroon-50 dark:hover:bg-gray-700 rounded-lg transition-all"
                            >
                                <LogIn className="w-4 h-4" />
                                <span>Sign In</span>
                            </Link>
                            <Link
                                href="/survey/register"
                                className="flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-700 hover:to-maroon-800 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02]"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span>Get Started</span>
                            </Link>
                        </div>

                        {/* Mobile/Tablet Controls */}
                        <div className="flex lg:hidden items-center space-x-1 sm:space-x-2">
                            <AppearanceToggleDropdown />
                            {/* Quick action buttons for small screens */}
                            <Link
                                href="/login"
                                className="p-2 text-maroon-600 dark:text-gray-300 hover:text-maroon-900 dark:hover:text-white hover:bg-maroon-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Sign In"
                            >
                                <LogIn className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/survey/register"
                                className="hidden sm:flex items-center space-x-1 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-maroon-600 to-maroon-700 rounded-lg shadow-sm"
                            >
                                <span>Register</span>
                            </Link>
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-2 rounded-lg text-maroon-600 dark:text-gray-300 hover:bg-maroon-50 dark:hover:bg-gray-700 transition-colors"
                                aria-label="Toggle menu"
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile/Tablet Menu */}
                    <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="py-3 border-t border-maroon-100 dark:border-gray-700">
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                {[
                                    { id: 'announcements', label: 'Announcements', icon: Megaphone },
                                    { id: 'jobs', label: 'Jobs', icon: Briefcase },
                                    { id: 'search', label: 'Find Me', icon: Search },
                                    { id: 'features', label: 'Features', icon: Star }
                                ].map((item) => (
                                    <a
                                        key={item.id}
                                        href={`#${item.id}`}
                                        onClick={(e) => { handleNavClick(e, `#${item.id}`); setMobileMenuOpen(false); }}
                                        className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeSection === item.id
                                            ? 'bg-maroon-100 dark:bg-gray-700 text-maroon-900 dark:text-white'
                                            : 'text-maroon-700 dark:text-gray-300 hover:bg-maroon-50 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        <span>{item.label}</span>
                                    </a>
                                ))}
                            </div>
                            {/* Mobile auth buttons - only show full register on very small screens */}
                            <div className="sm:hidden pt-2 border-t border-maroon-100 dark:border-gray-700">
                                <Link
                                    href="/survey/register"
                                    className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-maroon-600 to-maroon-700 dark:from-maroon-700 dark:to-maroon-800 rounded-lg"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <UserPlus className="w-4 h-4" />
                                    <span>Get Started</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Scroll to Top/Bottom Buttons */}
            <div className={`fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-40 flex flex-col space-y-2 transition-all duration-300 ${scrollY > 300 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <button
                    onClick={scrollToTop}
                    className="p-2.5 sm:p-3 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-maroon-600 dark:text-gray-300 hover:text-maroon-800 dark:hover:text-white rounded-full shadow-lg hover:shadow-xl border border-maroon-100 dark:border-gray-600 transition-all transform hover:scale-110"
                    title="Scroll to top"
                >
                    <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                    onClick={scrollToBottom}
                    className="p-2.5 sm:p-3 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-maroon-600 dark:text-gray-300 hover:text-maroon-800 dark:hover:text-white rounded-full shadow-lg hover:shadow-xl border border-maroon-100 dark:border-gray-600 transition-all transform hover:scale-110"
                    title="Scroll to bottom"
                >
                    <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
            </div>

            {/* Hero Section */}
            <section className="relative pt-24 md:pt-32 pb-12 md:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
                {/* Hero Background Image - Low contrast alumni-related image */}
                <div className="absolute inset-0 z-0">
                    {appearanceSettings.heroBackground ? (
                        <img
                            src={`/api/v1/assets/${appearanceSettings.heroBackground}`}
                            alt=""
                            className="w-full h-full object-cover opacity-15"
                        />
                    ) : (
                        <img
                            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1920&q=80"
                            alt=""
                            className="w-full h-full object-cover opacity-10"
                        />
                    )}
                    {/* Light overlay to maintain readability with original colors */}
                    <div className="absolute inset-0 bg-gradient-to-br from-maroon-50/95 via-beige-50/90 to-maroon-100/95 dark:from-gray-900/95 dark:via-gray-800/90 dark:to-gray-900/95"></div>
                </div>

                <div className={`relative z-10 max-w-7xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                        <div className="space-y-6 md:space-y-8 text-center lg:text-left">
                            <div className={`inline-flex items-center space-x-2 bg-maroon-100 dark:bg-gray-700 border border-maroon-200 dark:border-gray-600 rounded-full px-4 py-2 ${isVisible ? 'animate-pop-out' : 'opacity-0'}`}>
                                <Globe className="w-4 h-4 text-maroon-600 dark:text-maroon-400" />
                                <span className="text-sm text-maroon-700 dark:text-gray-300">Connecting Alumni Worldwide</span>
                            </div>
                            <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-tight text-maroon-900 dark:text-gray-100 ${isVisible ? 'animate-slide-up animation-delay-100' : 'opacity-0'}`}>
                                Your Career Journey
                                <span className="block bg-gradient-to-r from-maroon-600 to-maroon-800 bg-clip-text text-transparent">
                                    Starts Here
                                </span>
                            </h1>
                            <p className={`text-base md:text-xl text-maroon-600 dark:text-gray-400 leading-relaxed ${isVisible ? 'animate-slide-up animation-delay-200' : 'opacity-0'}`}>
                                Join {stats.totalAlumni > 0 ? stats.totalAlumni.toLocaleString() + '+' : 'thousands of'} successful alumni in our vibrant community. Track your career progress,
                                discover opportunities, and stay connected with your alma mater.
                            </p>
                            <div className={`flex flex-col sm:flex-row gap-4 justify-center lg:justify-start ${isVisible ? 'animate-slide-up animation-delay-300' : 'opacity-0'}`}>
                                <Link
                                    href="/survey/register"
                                    className="group px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-700 hover:to-maroon-800 rounded-xl font-semibold text-white transition-all transform hover:scale-105 shadow-2xl flex items-center justify-center space-x-2"
                                >
                                    <span>Join Now</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <a
                                    href="#search"
                                    className="px-6 md:px-8 py-3 md:py-4 bg-white/60 dark:bg-gray-800/60 hover:bg-white/80 dark:hover:bg-gray-800/80 backdrop-blur-sm border border-maroon-200 dark:border-gray-600 rounded-xl font-semibold text-maroon-900 dark:text-gray-100 transition-all flex items-center justify-center space-x-2"
                                >
                                    <Search className="w-5 h-5" />
                                    <span>Find My Record</span>
                                </a>
                            </div>

                            {/* Stats */}
                            <div id="hero-stats" data-animate className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 pt-6 md:pt-8">
                                {[
                                    { label: 'Registered Alumni', value: animatedStats.totalAlumni.toLocaleString(), icon: Users, suffix: '+' },
                                    { label: 'Employment Rate', value: `${animatedStats.employmentRate}`, icon: TrendingUp, suffix: '%' },
                                    { label: 'Active Jobs', value: animatedStats.activeJobs.toLocaleString(), icon: Briefcase, suffix: '' },
                                    { label: 'Batch Years', value: animatedStats.batchYears.toLocaleString(), icon: GraduationCap, suffix: '' },
                                    { label: 'Departments', value: animatedStats.departments.toLocaleString(), icon: Building2, suffix: '' },
                                    { label: 'Programs', value: animatedStats.courses.toLocaleString(), icon: BookOpen, suffix: '' },
                                    { label: 'Industries', value: animatedStats.industries.toLocaleString(), icon: Layers, suffix: '+' },
                                    { label: 'Surveys Done', value: animatedStats.surveysCompleted.toLocaleString(), icon: BarChart3, suffix: '' }
                                ].map((stat, index) => (
                                    <div
                                        key={index}
                                        className={`text-center p-3 md:p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-maroon-100 dark:border-gray-700 transform transition-all duration-500 hover:scale-105 hover:shadow-lg hover:bg-white/80 dark:hover:bg-gray-800/80 ${visibleSections.has('hero-stats')
                                            ? 'animate-pop-out'
                                            : 'opacity-0'
                                            }`}
                                        style={{ animationDelay: `${index * 80}ms` }}
                                    >
                                        <stat.icon className="w-5 h-5 mx-auto mb-1 text-maroon-500 dark:text-maroon-400" />
                                        <div className="text-lg md:text-2xl font-bold text-maroon-900 dark:text-gray-100 tabular-nums">
                                            {stat.value}{stat.suffix && <span className="text-maroon-500 dark:text-maroon-400">{stat.suffix}</span>}
                                        </div>
                                        <div className="text-[10px] md:text-xs text-maroon-600 dark:text-gray-400 font-medium">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3D Illustration - Hidden on mobile */}
                        <div className={`hidden lg:flex relative lg:h-[600px] items-center justify-center ${isVisible ? 'animate-slide-right animation-delay-400' : 'opacity-0'}`}>
                            <div className="absolute inset-0 bg-gradient-to-r from-maroon-200/20 to-beige-200/20 dark:from-gray-700/20 dark:to-gray-600/20 rounded-3xl blur-3xl"></div>
                            <div className="relative w-full h-full flex items-center justify-center">
                                <div className="w-64 lg:w-80 h-64 lg:h-80 bg-gradient-to-br from-maroon-100/40 to-beige-100/40 dark:from-gray-700/40 dark:to-gray-600/40 rounded-full flex items-center justify-center backdrop-blur-sm border border-maroon-200 dark:border-gray-600 animate-pulse-slow">
                                    <GraduationCap className="w-32 lg:w-40 h-32 lg:h-40 text-maroon-600 dark:text-maroon-400" />
                                </div>
                                {/* Floating Icons */}
                                <div className="absolute top-10 left-10 p-3 lg:p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-maroon-100 dark:border-gray-700 animate-float">
                                    <Users className="w-6 lg:w-8 h-6 lg:h-8 text-maroon-600 dark:text-maroon-400" />
                                </div>
                                <div className="absolute top-20 right-10 p-3 lg:p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-maroon-100 dark:border-gray-700 animate-float animation-delay-2000">
                                    <Briefcase className="w-6 lg:w-8 h-6 lg:h-8 text-maroon-700 dark:text-maroon-400" />
                                </div>
                                <div className="absolute bottom-20 left-20 p-3 lg:p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-maroon-100 dark:border-gray-700 animate-float animation-delay-4000">
                                    <TrendingUp className="w-6 lg:w-8 h-6 lg:h-8 text-maroon-600 dark:text-maroon-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Alumni Search Section */}
            <section id="search" data-animate className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-white/40 dark:bg-gray-800/40">
                <div className={`max-w-4xl mx-auto transition-all duration-700 ${visibleSections.has('search') ? 'animate-slide-up' : 'opacity-0 translate-y-10'}`}>
                    <div className="text-center mb-8 md:mb-12">
                        <div className="inline-flex items-center space-x-2 bg-maroon-100 dark:bg-gray-700 border border-maroon-200 dark:border-gray-600 rounded-full px-4 py-2 mb-4 md:mb-6 animate-bounce-subtle">
                            <Search className="w-4 h-4 text-maroon-600 dark:text-maroon-400" />
                            <span className="text-sm text-maroon-700 dark:text-gray-300">Alumni Database Search</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-maroon-900 dark:text-gray-100">
                            Find Your
                            <span className="block bg-gradient-to-r from-maroon-600 to-maroon-800 bg-clip-text text-transparent">
                                Alumni Record
                            </span>
                        </h2>
                        <p className="text-base md:text-xl text-maroon-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Check if you're already in our alumni database by searching with your email or student ID
                        </p>
                    </div>

                    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-maroon-200 dark:border-gray-700 p-4 md:p-8 shadow-xl">
                        <form onSubmit={handleSearch} className="space-y-4 md:space-y-6">
                            {/* Search Type Toggle */}
                            <div className="flex justify-center space-x-2 md:space-x-4">
                                <button
                                    type="button"
                                    onClick={() => { setSearchType('student_id'); setSearchResult(null); setSearchError(''); }}
                                    className={`flex items-center space-x-2 px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium transition-all text-sm md:text-base ${searchType === 'student_id'
                                        ? 'bg-maroon-600 text-white shadow-lg'
                                        : 'bg-white/60 dark:bg-gray-700/60 text-maroon-600 dark:text-gray-300 border border-maroon-200 dark:border-gray-600 hover:bg-maroon-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <IdCard className="w-5 h-5" />
                                    <span>Student ID</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setSearchType('email'); setSearchResult(null); setSearchError(''); }}
                                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${searchType === 'email'
                                        ? 'bg-maroon-600 text-white shadow-lg'
                                        : 'bg-white/60 dark:bg-gray-700/60 text-maroon-600 dark:text-gray-300 border border-maroon-200 dark:border-gray-600 hover:bg-maroon-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Mail className="w-5 h-5" />
                                    <span>Email</span>
                                </button>
                            </div>

                            {/* Search Input */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    {searchType === 'email' ? (
                                        <Mail className="w-5 h-5 text-maroon-400" />
                                    ) : (
                                        <IdCard className="w-5 h-5 text-maroon-400" />
                                    )}
                                </div>
                                <input
                                    type={searchType === 'email' ? 'email' : 'text'}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={searchType === 'email' ? 'Enter your email address' : 'Enter your student ID (e.g., 2020-00001)'}
                                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-700 border border-maroon-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-maroon-500 focus:border-transparent text-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                                />
                            </div>

                            {/* Search Button */}
                            <button
                                type="submit"
                                disabled={searching}
                                className="w-full py-4 bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-700 hover:to-maroon-800 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                            >
                                {searching ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Searching...</span>
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-5 h-5" />
                                        <span>Search Database</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Search Error */}
                        {searchError && (
                            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 flex items-center space-x-2">
                                <X className="w-5 h-5" />
                                <span>{searchError}</span>
                            </div>
                        )}

                        {/* Search Result */}
                        {searchResult && (
                            <div className={`mt-6 p-6 rounded-xl border ${searchResult.found
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                                }`}>
                                {searchResult.found && searchResult.data ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-green-100 dark:bg-green-800/40 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-green-800 dark:text-green-300">Record Found!</h3>
                                                <p className="text-green-600 dark:text-green-400 text-sm">{searchResult.message}</p>
                                            </div>
                                        </div>
                                        <div className="bg-white/60 dark:bg-gray-700/60 rounded-lg p-4 space-y-2">
                                            <p className="text-gray-700 dark:text-gray-300">
                                                <span className="font-medium">Name:</span> {searchResult.data.name}
                                            </p>
                                            <p className="text-gray-700 dark:text-gray-300">
                                                <span className="font-medium">Course:</span> {searchResult.data.course || 'Not specified'}
                                            </p>
                                            <p className="text-gray-700 dark:text-gray-300">
                                                <span className="font-medium">Graduation Year:</span> {searchResult.data.graduation_year || 'Not specified'}
                                            </p>
                                            {searchResult.data.registered ? (
                                                <div className="flex items-center space-x-2 text-green-600 mt-3">
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span className="text-sm">Account registered - You can sign in!</span>
                                                </div>
                                            ) : (
                                                <div className="mt-4">
                                                    <Link
                                                        href="/survey/register"
                                                        className="inline-flex items-center space-x-2 px-6 py-3 bg-maroon-600 hover:bg-maroon-700 text-white rounded-lg transition-colors"
                                                    >
                                                        <span>Complete Registration</span>
                                                        <ArrowRight className="w-4 h-4" />
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                                            <Search className="w-6 h-6 text-amber-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-amber-800">No Record Found</h3>
                                            <p className="text-amber-600 text-sm">{searchResult.message}</p>
                                            <Link
                                                href="/survey/register"
                                                className="inline-flex items-center space-x-1 text-maroon-600 hover:text-maroon-800 text-sm mt-2"
                                            >
                                                <span>Register as a new alumni</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Announcements Section */}
            <section id="announcements" data-animate className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className={`text-center mb-12 transition-all duration-700 ${visibleSections.has('announcements') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <div className="inline-flex items-center space-x-2 bg-maroon-100 dark:bg-gray-700 border border-maroon-200 dark:border-gray-600 rounded-full px-4 py-2 mb-4 md:mb-6 animate-wiggle">
                            <Megaphone className="w-4 h-4 text-maroon-600 dark:text-maroon-400" />
                            <span className="text-sm text-maroon-700 dark:text-gray-300">Latest Updates</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-maroon-900 dark:text-gray-100">
                            Announcements &
                            <span className="block bg-gradient-to-r from-maroon-600 to-maroon-800 bg-clip-text text-transparent">
                                News
                            </span>
                        </h2>
                        <p className="text-base md:text-xl text-maroon-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Stay updated with the latest news and announcements from your alma mater
                        </p>
                    </div>

                    {loadingAnnouncements ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="w-8 h-8 border-4 border-maroon-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : announcements.length > 0 ? (
                        <div className="relative px-2 md:px-0">
                            {/* Left Arrow - Hidden on mobile */}
                            {announcementScrollIndex > 0 && (
                                <button
                                    onClick={() => setAnnouncementScrollIndex(prev => Math.max(0, prev - 1))}
                                    className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 bg-white dark:bg-gray-800 shadow-lg rounded-full items-center justify-center hover:bg-maroon-50 dark:hover:bg-gray-700 transition-colors border border-maroon-200 dark:border-gray-600"
                                >
                                    <ChevronLeft className="w-6 h-6 text-maroon-600 dark:text-gray-300" />
                                </button>
                            )}

                            {/* Right Arrow - Hidden on mobile */}
                            {announcementScrollIndex < announcements.length - 3 && (
                                <button
                                    onClick={() => setAnnouncementScrollIndex(prev => Math.min(announcements.length - 3, prev + 1))}
                                    className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 bg-white dark:bg-gray-800 shadow-lg rounded-full items-center justify-center hover:bg-maroon-50 dark:hover:bg-gray-700 transition-colors border border-maroon-200 dark:border-gray-600"
                                >
                                    <ChevronRight className="w-6 h-6 text-maroon-600 dark:text-gray-300" />
                                </button>
                            )}

                            {/* Mobile: Scrollable horizontal, Desktop: Transform-based carousel */}
                            <div className="overflow-x-auto md:overflow-hidden scrollbar-hide">
                                <div
                                    className="flex gap-4 md:gap-6 transition-transform duration-500 ease-in-out pb-4 md:pb-0"
                                    style={{ transform: `translateX(-${announcementScrollIndex * (100 / 3 + 2)}%)` }}
                                >
                                    {announcements.map((announcement, index) => (
                                        <div
                                            key={announcement.id}
                                            onClick={() => {
                                                setSelectedAnnouncement(announcement);
                                                setCurrentAnnouncementIndex(index);
                                            }}
                                            className={`flex-shrink-0 w-[85vw] sm:w-[70vw] md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] group bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-maroon-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-500 cursor-pointer hover:scale-[1.02] hover:-translate-y-2 ${visibleSections.has('announcements')
                                                ? 'animate-pop-out'
                                                : 'opacity-0 scale-85 translate-y-8'
                                                }`}
                                            style={{ animationDelay: `${index * 150}ms` }}
                                        >
                                            {announcement.featured_image ? (
                                                <div className="h-40 md:h-48 overflow-hidden">
                                                    <img
                                                        src={announcement.featured_image}
                                                        alt={announcement.title}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-40 md:h-48 bg-gradient-to-br from-maroon-100 to-maroon-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                                                    <Megaphone className="w-12 md:w-16 h-12 md:h-16 text-maroon-400 dark:text-maroon-500" />
                                                </div>
                                            )}
                                            <div className="p-4 md:p-6">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(announcement.priority)}`}>
                                                        {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                                                    </span>
                                                    <span className="text-xs text-maroon-500 dark:text-maroon-400 flex items-center">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {announcement.published_at || announcement.created_at}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-bold text-maroon-900 dark:text-gray-100 mb-2 group-hover:text-maroon-700 dark:group-hover:text-maroon-400 transition-colors line-clamp-2">
                                                    {announcement.title}
                                                </h3>
                                                <p className="text-maroon-600 dark:text-gray-400 text-sm line-clamp-3">
                                                    {announcement.content}
                                                </p>
                                                <div className="mt-4 flex items-center text-maroon-600 text-sm font-medium group-hover:text-maroon-800">
                                                    <span>Read more</span>
                                                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pagination dots */}
                            {announcements.length > 3 && (
                                <div className="flex justify-center gap-2 mt-6">
                                    {Array.from({ length: Math.ceil(announcements.length - 2) }).map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setAnnouncementScrollIndex(idx)}
                                            className={`w-2 h-2 rounded-full transition-all ${idx === announcementScrollIndex
                                                ? 'bg-maroon-600 dark:bg-maroon-400 w-6'
                                                : 'bg-maroon-200 dark:bg-gray-600 hover:bg-maroon-300 dark:hover:bg-gray-500'
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white/40 dark:bg-gray-800/40 rounded-2xl border border-maroon-100 dark:border-gray-700">
                            <Megaphone className="w-16 h-16 text-maroon-300 dark:text-maroon-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-maroon-700 dark:text-gray-300">No Announcements Yet</h3>
                            <p className="text-maroon-500 dark:text-gray-400">Check back later for updates and news</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Job Postings Section */}
            <section id="jobs" data-animate className="py-20 px-4 sm:px-6 lg:px-8 bg-white/40 dark:bg-gray-800/40">
                <div className="max-w-7xl mx-auto">
                    <div className={`text-center mb-12 transition-all duration-700 ${visibleSections.has('jobs') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <div className="inline-flex items-center space-x-2 bg-maroon-100 dark:bg-gray-700 border border-maroon-200 dark:border-gray-600 rounded-full px-4 py-2 mb-6 animate-pulse-badge">
                            <Briefcase className="w-4 h-4 text-maroon-600 dark:text-maroon-400" />
                            <span className="text-sm text-maroon-700 dark:text-gray-300">Career Opportunities</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-maroon-900 dark:text-gray-100">
                            Featured
                            <span className="block bg-gradient-to-r from-maroon-600 to-maroon-800 bg-clip-text text-transparent">
                                Job Postings
                            </span>
                        </h2>
                        <p className="text-base md:text-xl text-maroon-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Explore career opportunities from our partner companies and employers
                        </p>
                    </div>

                    {loadingJobs ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="w-8 h-8 border-4 border-maroon-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : jobs.length > 0 ? (
                        <div className="relative px-2 md:px-0">
                            {/* Left Arrow - Hidden on mobile */}
                            {jobScrollIndex > 0 && (
                                <button
                                    onClick={() => setJobScrollIndex(prev => Math.max(0, prev - 1))}
                                    className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 bg-white dark:bg-gray-800 shadow-lg rounded-full items-center justify-center hover:bg-maroon-50 dark:hover:bg-gray-700 transition-colors border border-maroon-200 dark:border-gray-600"
                                >
                                    <ChevronLeft className="w-6 h-6 text-maroon-600 dark:text-gray-300" />
                                </button>
                            )}

                            {/* Right Arrow - Hidden on mobile */}
                            {jobScrollIndex < jobs.length - 3 && (
                                <button
                                    onClick={() => setJobScrollIndex(prev => Math.min(jobs.length - 3, prev + 1))}
                                    className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 bg-white dark:bg-gray-800 shadow-lg rounded-full items-center justify-center hover:bg-maroon-50 dark:hover:bg-gray-700 transition-colors border border-maroon-200 dark:border-gray-600"
                                >
                                    <ChevronRight className="w-6 h-6 text-maroon-600 dark:text-gray-300" />
                                </button>
                            )}

                            {/* Mobile: Scrollable horizontal, Desktop: Transform-based carousel */}
                            <div className="overflow-x-auto md:overflow-hidden scrollbar-hide">
                                <div
                                    className="flex gap-4 md:gap-6 transition-transform duration-500 ease-in-out pb-4 md:pb-0"
                                    style={{ transform: `translateX(-${jobScrollIndex * (100 / 3 + 2)}%)` }}
                                >
                                    {jobs.map((job, index) => (
                                        <div
                                            key={job.id}
                                            onClick={() => {
                                                setSelectedJob(job);
                                                setCurrentJobIndex(index);
                                            }}
                                            className={`flex-shrink-0 w-[85vw] sm:w-[70vw] md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] group bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-maroon-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-500 cursor-pointer hover:scale-[1.02] hover:-translate-y-2 hover:border-maroon-300 dark:hover:border-maroon-600 ${visibleSections.has('jobs')
                                                ? 'animate-pop-out'
                                                : 'opacity-0 scale-85 translate-y-8'
                                                }`}
                                            style={{ animationDelay: `${index * 150}ms` }}
                                        >
                                            {job.poster_image ? (
                                                <div className="h-40 md:h-48 overflow-hidden relative">
                                                    <img
                                                        src={job.poster_image}
                                                        alt={job.title}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                    />
                                                    {job.is_featured && (
                                                        <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center">
                                                            <Star className="w-3 h-3 mr-1 fill-current" />
                                                            Featured
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="h-40 md:h-48 bg-gradient-to-br from-maroon-100 to-maroon-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center relative">
                                                    {job.company_logo ? (
                                                        <img
                                                            src={job.company_logo}
                                                            alt={job.company_name}
                                                            className="max-w-[100px] md:max-w-[120px] max-h-[60px] md:max-h-[80px] object-contain"
                                                        />
                                                    ) : (
                                                        <Building2 className="w-16 h-16 text-maroon-400" />
                                                    )}
                                                    {job.is_featured && (
                                                        <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center">
                                                            <Star className="w-3 h-3 mr-1 fill-current" />
                                                            Featured
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <div className="p-6">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-xs bg-maroon-100 dark:bg-gray-700 text-maroon-700 dark:text-maroon-400 px-2 py-1 rounded-full">
                                                        {job.job_type_label}
                                                    </span>
                                                    {job.is_remote && (
                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center">
                                                            <Globe className="w-3 h-3 mr-1" />
                                                            Remote
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-xl font-bold text-maroon-900 dark:text-gray-100 mb-1 group-hover:text-maroon-700 dark:group-hover:text-maroon-400 transition-colors line-clamp-1">
                                                    {job.title}
                                                </h3>
                                                <p className="text-maroon-600 dark:text-gray-400 font-medium mb-2">
                                                    {job.company_name}
                                                </p>
                                                <div className="flex items-center text-maroon-500 dark:text-maroon-400 text-sm mb-3">
                                                    <MapPin className="w-4 h-4 mr-1" />
                                                    <span className="line-clamp-1">{job.location}</span>
                                                </div>
                                                {job.salary_range && (
                                                    <p className="text-maroon-700 dark:text-gray-300 font-semibold text-sm mb-3">
                                                        {job.salary_range}
                                                    </p>
                                                )}
                                                <div
                                                    className="text-maroon-600 dark:text-gray-400 text-sm line-clamp-2 mb-4 prose prose-sm max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: job.content }}
                                                />
                                                {job.application_deadline && (
                                                    <div className="flex items-center text-amber-600 text-xs">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        <span>Deadline: {job.application_deadline}</span>
                                                    </div>
                                                )}
                                                <div className="mt-4 flex items-center text-maroon-600 text-sm font-medium group-hover:text-maroon-800">
                                                    <span>View Details</span>
                                                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pagination dots */}
                            {jobs.length > 3 && (
                                <div className="flex justify-center gap-2 mt-6">
                                    {Array.from({ length: Math.ceil(jobs.length - 2) }).map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setJobScrollIndex(idx)}
                                            className={`w-2 h-2 rounded-full transition-all ${idx === jobScrollIndex
                                                ? 'bg-maroon-600 dark:bg-maroon-400 w-6'
                                                : 'bg-maroon-200 dark:bg-gray-600 hover:bg-maroon-300 dark:hover:bg-gray-500'
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white/40 dark:bg-gray-800/40 rounded-2xl border border-maroon-100 dark:border-gray-700">
                            <Briefcase className="w-16 h-16 text-maroon-300 dark:text-maroon-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-maroon-700 dark:text-gray-300">No Job Postings Yet</h3>
                            <p className="text-maroon-500 dark:text-gray-400">Check back later for career opportunities</p>
                        </div>
                    )}

                    {jobs.length > 0 && (
                        <div className="text-center mt-10">
                            <Link
                                href="/login"
                                className="inline-flex items-center space-x-2 px-8 py-4 bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-800 backdrop-blur-sm border border-maroon-200 dark:border-gray-600 rounded-xl font-semibold text-maroon-900 dark:text-gray-100 transition-all"
                            >
                                <span>View All Jobs</span>
                                <ExternalLink className="w-5 h-5" />
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Community Impact Section */}
            <section id="impact" data-animate className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-maroon-800 via-maroon-900 to-maroon-950 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-maroon-400 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto">
                    <div className={`text-center mb-10 md:mb-14 transition-all duration-700 ${visibleSections.has('impact') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <span className="inline-flex items-center space-x-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-4">
                            <BarChart3 className="w-4 h-4 text-maroon-300" />
                            <span className="text-sm text-maroon-200 font-medium">Community Impact</span>
                        </span>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 text-white">
                            Our Growing
                            <span className="block bg-gradient-to-r from-maroon-300 to-beige-300 bg-clip-text text-transparent">
                                Alumni Network
                            </span>
                        </h2>
                        <p className="text-base md:text-lg text-maroon-200 max-w-2xl mx-auto">
                            Real numbers reflecting the strength of our alumni community
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {[
                            { label: 'Registered Alumni', value: animatedStats.totalAlumni, icon: Users, suffix: '+', description: 'Active in our network' },
                            { label: 'Employment Rate', value: animatedStats.employmentRate, icon: TrendingUp, suffix: '%', description: 'Gainfully employed' },
                            { label: 'Batch Years', value: animatedStats.batchYears, icon: GraduationCap, suffix: '', description: 'Generations of graduates' },
                            { label: 'Departments', value: animatedStats.departments, icon: Building2, suffix: '', description: 'Academic departments' },
                            { label: 'Programs Offered', value: animatedStats.courses, icon: BookOpen, suffix: '+', description: 'Degree programs' },
                            { label: 'Industries', value: animatedStats.industries, icon: Layers, suffix: '+', description: 'Sectors represented' },
                            { label: 'Active Job Posts', value: animatedStats.activeJobs, icon: Briefcase, suffix: '', description: 'Career opportunities' },
                            { label: 'Survey Responses', value: animatedStats.surveysCompleted, icon: BarChart3, suffix: '', description: 'Alumni feedback collected' },
                        ].map((stat, index) => (
                            <div
                                key={index}
                                className={`group relative text-center p-5 md:p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/25 hover:bg-white/10 transition-all duration-500 hover:scale-105 ${visibleSections.has('impact')
                                    ? 'animate-pop-out'
                                    : 'opacity-0'
                                    }`}
                                style={{ animationDelay: `${index * 80}ms` }}
                            >
                                <div className="w-10 h-10 bg-gradient-to-br from-maroon-400/30 to-maroon-600/30 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                    <stat.icon className="w-5 h-5 text-maroon-300" />
                                </div>
                                <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tabular-nums mb-1">
                                    {stat.value.toLocaleString()}{stat.suffix && <span className="text-maroon-300 text-lg md:text-xl">{stat.suffix}</span>}
                                </div>
                                <div className="text-sm font-semibold text-maroon-200 mb-0.5">{stat.label}</div>
                                <div className="text-xs text-maroon-400 hidden md:block">{stat.description}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" data-animate className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 relative">
                <div className="max-w-7xl mx-auto">
                    <div className={`text-center mb-8 md:mb-16 transition-all duration-700 ${visibleSections.has('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-maroon-900 dark:text-gray-100">
                            Powerful Features for
                            <span className="block bg-gradient-to-r from-maroon-600 to-maroon-800 bg-clip-text text-transparent">
                                Alumni Success
                            </span>
                        </h2>
                        <p className="text-base md:text-xl text-maroon-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Everything you need to build and maintain a thriving professional network
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className={`group p-5 md:p-8 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-maroon-100 dark:border-gray-700 hover:border-maroon-300 dark:hover:border-maroon-600 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-500 hover:scale-105 hover:-translate-y-2 shadow-lg hover:shadow-2xl ${visibleSections.has('features')
                                    ? 'animate-pop-out'
                                    : 'opacity-0 scale-85 translate-y-12'
                                    }`}
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className={`w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 md:mb-6 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                                    <feature.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                                </div>
                                <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-maroon-900 dark:text-gray-100 group-hover:text-maroon-700 dark:group-hover:text-maroon-400 transition-colors">{feature.title}</h3>
                                <p className="text-sm md:text-base text-maroon-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" data-animate className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-white/40 dark:bg-gray-800/40">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                        <div className={`transition-all duration-700 ${visibleSections.has('benefits') ? 'animate-slide-left' : 'opacity-0 -translate-x-10'}`}>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-maroon-900 dark:text-gray-100">
                                Why Choose
                                <span className="block bg-gradient-to-r from-maroon-600 to-maroon-800 bg-clip-text text-transparent">
                                    Alumni Tracer?
                                </span>
                            </h2>
                            <p className="text-base md:text-xl text-maroon-600 dark:text-gray-400 mb-6 md:mb-8">
                                Our platform is designed with cutting-edge technology to provide the best experience for alumni and institutions.
                            </p>
                            <div className="space-y-3 md:space-y-4">
                                {benefits.map((benefit, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-start space-x-3 group transition-all duration-500 ${visibleSections.has('benefits')
                                            ? 'animate-slide-up'
                                            : 'opacity-0 translate-y-4'
                                            }`}
                                        style={{ animationDelay: `${index * 100 + 200}ms` }}
                                    >
                                        <div className="w-6 h-6 bg-gradient-to-br from-maroon-500 to-maroon-600 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 shadow-md">
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-maroon-700 dark:text-gray-300 group-hover:text-maroon-900 dark:group-hover:text-gray-100 transition-colors font-medium">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={`relative transition-all duration-700 delay-300 ${visibleSections.has('benefits') ? 'animate-slide-right' : 'opacity-0 translate-x-10'}`}>
                            <div className="bg-gradient-to-br from-maroon-100/40 to-beige-100/40 dark:from-gray-800/40 dark:to-gray-700/40 rounded-3xl p-8 backdrop-blur-sm border border-maroon-200 dark:border-gray-600 hover:shadow-2xl transition-shadow duration-500">
                                <div className="space-y-6">
                                    <div className="flex items-center space-x-4 p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-maroon-100 dark:border-gray-700">
                                        <Shield className="w-10 h-10 text-maroon-600 dark:text-maroon-400" />
                                        <div>
                                            <div className="font-semibold text-maroon-900 dark:text-gray-100">Secure & Private</div>
                                            <div className="text-sm text-maroon-600 dark:text-gray-400">Your data is protected with enterprise-grade security</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-maroon-100 dark:border-gray-700">
                                        <Star className="w-10 h-10 text-maroon-600 dark:text-maroon-400" />
                                        <div>
                                            <div className="font-semibold text-maroon-900 dark:text-gray-100">Trusted by Thousands</div>
                                            <div className="text-sm text-maroon-600 dark:text-gray-400">Join a community of successful professionals</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-maroon-100 dark:border-gray-700">
                                        <Globe className="w-10 h-10 text-maroon-600 dark:text-maroon-400" />
                                        <div>
                                            <div className="font-semibold text-maroon-900 dark:text-gray-100">Global Reach</div>
                                            <div className="text-sm text-maroon-600 dark:text-gray-400">Connect with alumni worldwide</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section id="cta" data-animate className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <div className={`bg-gradient-to-br from-maroon-100/60 to-beige-100/60 dark:from-gray-800/60 dark:to-gray-700/60 rounded-3xl p-12 backdrop-blur-sm border border-maroon-200 dark:border-gray-600 transition-all duration-700 hover:shadow-2xl ${visibleSections.has('cta')
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 scale-95'
                        }`}>
                        <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-maroon-900 dark:text-gray-100">
                            Ready to Join Our
                            <span className="block bg-gradient-to-r from-maroon-600 to-maroon-800 bg-clip-text text-transparent">
                                Alumni Community?
                            </span>
                        </h2>
                        <p className="text-xl text-maroon-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                            Start your journey today and unlock exclusive opportunities, connections, and resources.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link
                                href="/survey/register"
                                className="group px-10 py-5 bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-700 hover:to-maroon-800 rounded-xl font-semibold text-lg text-white transition-all transform hover:scale-105 shadow-2xl hover:shadow-maroon-500/50 flex items-center space-x-2"
                            >
                                <span>Create Account</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/login"
                                className="px-10 py-5 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 backdrop-blur-sm border border-maroon-200 dark:border-gray-600 rounded-xl font-semibold text-lg text-maroon-900 dark:text-gray-100 transition-all"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-maroon-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-maroon-600 to-maroon-700 rounded-lg flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-maroon-900 dark:text-gray-100">Alumni Tracer System</span>
                    </div>
                    <p className="text-maroon-600 dark:text-gray-400 mb-4">
                        Stay connected, track your career journey, and contribute to the growth of our alumni community.
                    </p>
                    <p className="text-sm text-maroon-500 dark:text-gray-400">
                        © {new Date().getFullYear()} Alumni Tracer System. All rights reserved.
                    </p>
                </div>
            </footer>

            {/* Announcement Modal */}
            {selectedAnnouncement && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedAnnouncement(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Header with close button */}
                        <div className="flex-shrink-0 relative">
                            {selectedAnnouncement.featured_image && (
                                <div className="h-48 overflow-hidden">
                                    <img
                                        src={selectedAnnouncement.featured_image}
                                        alt={selectedAnnouncement.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <button
                                onClick={() => setSelectedAnnouncement(null)}
                                className="absolute top-3 right-3 p-1.5 bg-white/90 hover:bg-white text-gray-600 hover:text-gray-900 rounded-full shadow-md transition-colors z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Title bar */}
                        <div className="flex-shrink-0 px-6 pt-5 pb-3 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getPriorityColor(selectedAnnouncement.priority)}`}>
                                    {selectedAnnouncement.priority.charAt(0).toUpperCase() + selectedAnnouncement.priority.slice(1)}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {selectedAnnouncement.published_at || selectedAnnouncement.created_at}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{selectedAnnouncement.title}</h2>
                        </div>

                        {/* Scrollable content area */}
                        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
                            {selectedAnnouncement.use_pages && selectedAnnouncement.pages && selectedAnnouncement.pages.length > 0 ? (
                                <PageCarousel
                                    pages={selectedAnnouncement.pages}
                                    className="min-h-[200px]"
                                    showArrows={true}
                                    showIndicators={true}
                                />
                            ) : (
                                <div
                                    className="prose prose-sm prose-maroon max-w-none text-gray-700 dark:text-gray-300 [&>p]:mb-3 [&>ul]:mb-3 [&>ol]:mb-3"
                                    dangerouslySetInnerHTML={{ __html: selectedAnnouncement.full_content }}
                                />
                            )}

                            {/* Gallery images */}
                            {selectedAnnouncement.gallery_images && selectedAnnouncement.gallery_images.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Gallery</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {selectedAnnouncement.gallery_images.map((img, i) => (
                                            <div key={i} className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                                                <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer with navigation */}
                        <div className="flex-shrink-0 px-4 py-3 border-t bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-b-2xl">
                            <div className="flex items-center justify-between gap-3">
                                <button
                                    onClick={() => {
                                        if (currentAnnouncementIndex > 0) {
                                            const prevIndex = currentAnnouncementIndex - 1;
                                            setSelectedAnnouncement(announcements[prevIndex]);
                                            setCurrentAnnouncementIndex(prevIndex);
                                        }
                                    }}
                                    disabled={currentAnnouncementIndex <= 0}
                                    className="flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor- not-allowed text-gray-800 dark:text-gray-100 font-semibold rounded-xl transition-colors text-sm"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    Previous
                                </button>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {currentAnnouncementIndex + 1} of {announcements.length}
                                </span>
                                <button
                                    onClick={() => {
                                        if (currentAnnouncementIndex < announcements.length - 1) {
                                            const nextIndex = currentAnnouncementIndex + 1;
                                            setSelectedAnnouncement(announcements[nextIndex]);
                                            setCurrentAnnouncementIndex(nextIndex);
                                        }
                                    }}
                                    disabled={currentAnnouncementIndex >= announcements.length - 1}
                                    className="flex items-center px-4 py-2 bg-maroon-600 hover:bg-maroon-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm"
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Job Modal */}
            {selectedJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedJob(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Header with image */}
                        <div className="flex-shrink-0 relative">
                            {selectedJob.poster_image && (
                                <div className="h-48 overflow-hidden">
                                    <img
                                        src={selectedJob.poster_image}
                                        alt={selectedJob.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <button
                                onClick={() => setSelectedJob(null)}
                                className="absolute top-3 right-3 p-1.5 bg-white/90 hover:bg-white text-gray-600 hover:text-gray-900 rounded-full shadow-md transition-colors z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Title bar */}
                        <div className="flex-shrink-0 px-6 pt-5 pb-3 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs bg-maroon-100 dark:bg-gray-700 text-maroon-700 dark:text-maroon-400 px-2.5 py-1 rounded-full font-medium">
                                    {selectedJob.job_type_label}
                                </span>
                                <div className="flex items-center gap-2">
                                    {selectedJob.is_featured && (
                                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full flex items-center font-medium">
                                            <Star className="w-3 h-3 mr-1 fill-current" />
                                            Featured
                                        </span>
                                    )}
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{selectedJob.title}</h2>
                            <p className="text-base text-maroon-600 dark:text-maroon-400 font-medium mt-1">{selectedJob.company_name}</p>
                        </div>

                        {/* Scrollable content area */}
                        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
                            {/* Job meta info */}
                            <div className="space-y-2 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                                    <span>{selectedJob.location}</span>
                                    {selectedJob.is_remote && (
                                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                            Remote Available
                                        </span>
                                    )}
                                </div>
                                {selectedJob.salary_range && (
                                    <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                                        <Briefcase className="w-4 h-4 mr-2 flex-shrink-0" />
                                        <span className="font-semibold">{selectedJob.salary_range}</span>
                                    </div>
                                )}
                                {selectedJob.application_deadline && (
                                    <div className="flex items-center text-amber-600 text-sm">
                                        <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                                        <span>Deadline: {selectedJob.application_deadline}</span>
                                    </div>
                                )}
                            </div>

                            {/* Job content - pages or description */}
                            {selectedJob.use_pages && selectedJob.pages && selectedJob.pages.length > 0 ? (
                                <PageCarousel
                                    pages={selectedJob.pages}
                                    className="min-h-[200px]"
                                    showArrows={true}
                                    showIndicators={true}
                                />
                            ) : (
                                <div className="prose prose-sm prose-maroon max-w-none text-gray-700 dark:text-gray-300 [&>p]:mb-3 [&>ul]:mb-3 [&>ol]:mb-3">
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Job Description</h3>
                                    <div dangerouslySetInnerHTML={{ __html: selectedJob.content }} />
                                </div>
                            )}

                            {selectedJob.external_url && (
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <a
                                        href={selectedJob.external_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-maroon-600 hover:bg-maroon-700 text-white font-semibold rounded-lg transition-colors text-sm"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Visit Company Website
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Footer with navigation */}
                        <div className="flex-shrink-0 px-4 py-3 border-t bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-b-2xl">
                            <div className="flex items-center justify-between gap-3">
                                <button
                                    onClick={() => {
                                        if (currentJobIndex > 0) {
                                            const prevIndex = currentJobIndex - 1;
                                            setSelectedJob(jobs[prevIndex]);
                                            setCurrentJobIndex(prevIndex);
                                        }
                                    }}
                                    disabled={currentJobIndex <= 0}
                                    className="flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 dark:text-gray-100 font-semibold rounded-xl transition-colors text-sm"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    Previous
                                </button>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {currentJobIndex + 1} of {jobs.length}
                                </span>
                                <button
                                    onClick={() => {
                                        if (currentJobIndex < jobs.length - 1) {
                                            const nextIndex = currentJobIndex + 1;
                                            setSelectedJob(jobs[nextIndex]);
                                            setCurrentJobIndex(nextIndex);
                                        }
                                    }}
                                    disabled={currentJobIndex >= jobs.length - 1}
                                    className="flex items-center px-4 py-2 bg-maroon-600 hover:bg-maroon-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm"
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.5; }
                }
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                @keyframes wiggle {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-3deg); }
                    75% { transform: rotate(3deg); }
                }
                @keyframes pulse-badge {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(128, 0, 0, 0.4); }
                    50% { transform: scale(1.02); box-shadow: 0 0 0 8px rgba(128, 0, 0, 0); }
                }
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                @keyframes gradient-shift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes scale-in {
                    from { transform: scaleX(0); }
                    to { transform: scaleX(1); }
                }
                @keyframes section-flash {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.95; box-shadow: 0 0 30px rgba(128, 0, 0, 0.1); }
                }
                .animate-blob { animation: blob 7s infinite; }
                .animate-float { animation: float 3s ease-in-out infinite; }
                .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
                .animate-bounce-subtle { animation: bounce-subtle 2s ease-in-out infinite; }
                .animate-wiggle { animation: wiggle 1s ease-in-out infinite; }
                .animate-pulse-badge { animation: pulse-badge 2s ease-in-out infinite; }
                .animate-shimmer {
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                    background-size: 200% 100%;
                    animation: shimmer 2s infinite;
                }
                .animate-gradient {
                    background-size: 200% 200%;
                    animation: gradient-shift 3s ease infinite;
                }
                .animate-spin-slow { animation: spin-slow 8s linear infinite; }
                .animate-scale-in { animation: scale-in 0.3s ease-out; }
                .section-flash { animation: section-flash 1s ease-out; }
                .animation-delay-2000 { animation-delay: 2s; }
                .animation-delay-4000 { animation-delay: 4s; }
                .tabular-nums { font-variant-numeric: tabular-nums; }
                
                /* Smooth scroll behavior */
                html {
                    scroll-behavior: smooth;
                }
                .line-clamp-1 {
                    display: -webkit-box;
                    -webkit-line-clamp: 1;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .line-clamp-3 {
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
}
