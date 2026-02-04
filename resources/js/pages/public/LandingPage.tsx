import { Link } from '@inertiajs/react';
import {
    GraduationCap,
    Users,
    Briefcase,
    TrendingUp,
    Shield,
    Globe,
    ArrowRight,
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
    ExternalLink,
    X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import AppearanceToggleDropdown from '@/components/appearance-dropdown';

interface LandingPageProps {
    stats?: {
        totalAlumni: number;
        employmentRate: number;
        activeJobs: number;
        surveysCompleted: number;
    };
}

interface Announcement {
    id: number;
    title: string;
    content: string;
    full_content: string;
    featured_image: string | null;
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
    description: string;
    location: string;
    job_type: string;
    job_type_label: string;
    salary_range: string | null;
    is_remote: boolean;
    is_featured: boolean;
    application_deadline: string | null;
    published_at: string;
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
    }>({ logoLight: null, logoDark: null });

    // Animation states for scroll-triggered sections
    const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
    const [animatedStats, setAnimatedStats] = useState({
        totalAlumni: 0,
        employmentRate: 0,
        activeJobs: 0,
        surveysCompleted: 0
    });
    const [statsAnimated, setStatsAnimated] = useState(false);

    // Stats state
    const [stats, setStats] = useState(initialStats || {
        totalAlumni: 0,
        employmentRate: 0,
        activeJobs: 0,
        surveysCompleted: 0
    });

    // Announcements state
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

    // Jobs state
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);

    // Alumni search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState<'email' | 'student_id'>('student_id');
    const [searching, setSearching] = useState(false);
    const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
    const [searchError, setSearchError] = useState('');

    // Active section tracking for navigation
    const [activeSection, setActiveSection] = useState('');

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        setIsVisible(true);
        return () => window.removeEventListener('scroll', handleScroll);
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
            const navHeight = 80; // Height of fixed navbar
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });

            // Add a subtle flash animation to the target section
            target.classList.add('section-flash');
            setTimeout(() => {
                target.classList.remove('section-flash');
            }, 1000);
        }
    };

    // Animate stats counter when visible
    useEffect(() => {
        if (visibleSections.has('hero-stats') && !statsAnimated && stats.totalAlumni > 0) {
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
                    surveysCompleted: Math.floor(stats.surveysCompleted * easeOut)
                });

                if (currentStep >= steps) {
                    clearInterval(timer);
                    setAnimatedStats(stats);
                }
            }, interval);

            return () => clearInterval(timer);
        }
    }, [visibleSections, stats, statsAnimated]);

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
        <div className="min-h-screen bg-gradient-to-br from-maroon-50 via-beige-50 to-maroon-100 text-maroon-900 overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-maroon-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-beige-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-maroon-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            {/* Navigation */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-white/95 backdrop-blur-lg shadow-lg' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center space-x-3">
                            {appearanceSettings.logoLight || appearanceSettings.logoDark ? (
                                <img
                                    src={`/storage/${appearanceSettings.logoLight || appearanceSettings.logoDark}`}
                                    alt="Alumni Tracer Logo"
                                    className="w-12 h-12 object-contain rounded-xl transform hover:rotate-12 transition-transform"
                                />
                            ) : (
                                <div className="w-12 h-12 bg-gradient-to-br from-maroon-600 to-maroon-700 rounded-xl flex items-center justify-center transform hover:rotate-12 transition-transform">
                                    <GraduationCap className="w-7 h-7 text-white" />
                                </div>
                            )}
                            <div>
                                <h1 className="text-2xl font-bold text-maroon-900">
                                    Alumni Tracer
                                </h1>
                                <p className="text-xs text-maroon-600">Stay Connected, Track Your Career</p>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center space-x-6">
                            <a
                                href="#announcements"
                                onClick={(e) => handleNavClick(e, '#announcements')}
                                className={`relative px-3 py-2 transition-all duration-300 ${activeSection === 'announcements'
                                        ? 'text-maroon-900 font-semibold'
                                        : 'text-maroon-600 hover:text-maroon-900'
                                    }`}
                            >
                                Announcements
                                {activeSection === 'announcements' && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-maroon-600 animate-scale-in" />
                                )}
                            </a>
                            <a
                                href="#jobs"
                                onClick={(e) => handleNavClick(e, '#jobs')}
                                className={`relative px-3 py-2 transition-all duration-300 ${activeSection === 'jobs'
                                        ? 'text-maroon-900 font-semibold'
                                        : 'text-maroon-600 hover:text-maroon-900'
                                    }`}
                            >
                                Jobs
                                {activeSection === 'jobs' && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-maroon-600 animate-scale-in" />
                                )}
                            </a>
                            <a
                                href="#search"
                                onClick={(e) => handleNavClick(e, '#search')}
                                className={`relative px-3 py-2 transition-all duration-300 ${activeSection === 'search'
                                        ? 'text-maroon-900 font-semibold'
                                        : 'text-maroon-600 hover:text-maroon-900'
                                    }`}
                            >
                                Find Me
                                {activeSection === 'search' && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-maroon-600 animate-scale-in" />
                                )}
                            </a>
                            <a
                                href="#features"
                                onClick={(e) => handleNavClick(e, '#features')}
                                className={`relative px-3 py-2 transition-all duration-300 ${activeSection === 'features'
                                        ? 'text-maroon-900 font-semibold'
                                        : 'text-maroon-600 hover:text-maroon-900'
                                    }`}
                            >
                                Features
                                {activeSection === 'features' && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-maroon-600 animate-scale-in" />
                                )}
                            </a>
                        </div>
                        <div className="flex items-center space-x-4">
                            <AppearanceToggleDropdown />
                            <Link
                                href="/login"
                                className="px-6 py-2.5 text-maroon-600 hover:text-maroon-900 transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/survey/register"
                                className="px-6 py-2.5 bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-700 hover:to-maroon-800 rounded-lg font-semibold text-white transition-all transform hover:scale-105 shadow-lg"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className={`max-w-7xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div className="inline-flex items-center space-x-2 bg-maroon-100 border border-maroon-200 rounded-full px-4 py-2">
                                <Globe className="w-4 h-4 text-maroon-600" />
                                <span className="text-sm text-maroon-700">Connecting Alumni Worldwide</span>
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-maroon-900">
                                Your Career Journey
                                <span className="block bg-gradient-to-r from-maroon-600 to-maroon-800 bg-clip-text text-transparent">
                                    Starts Here
                                </span>
                            </h1>
                            <p className="text-xl text-maroon-600 leading-relaxed">
                                Join thousands of successful alumni in our vibrant community. Track your career progress,
                                discover opportunities, and stay connected with your alma mater.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link
                                    href="/survey/register"
                                    className="group px-8 py-4 bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-700 hover:to-maroon-800 rounded-xl font-semibold text-white transition-all transform hover:scale-105 shadow-2xl flex items-center space-x-2"
                                >
                                    <span>Join Now</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <a
                                    href="#search"
                                    className="px-8 py-4 bg-white/60 hover:bg-white/80 backdrop-blur-sm border border-maroon-200 rounded-xl font-semibold text-maroon-900 transition-all flex items-center space-x-2"
                                >
                                    <Search className="w-5 h-5" />
                                    <span>Find My Record</span>
                                </a>
                            </div>

                            {/* Stats */}
                            <div id="hero-stats" data-animate className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
                                {[
                                    { label: 'Alumni', value: animatedStats.totalAlumni.toLocaleString(), icon: Users },
                                    { label: 'Employment', value: `${animatedStats.employmentRate}%`, icon: TrendingUp },
                                    { label: 'Active Jobs', value: animatedStats.activeJobs.toLocaleString(), icon: Briefcase },
                                    { label: 'Surveys', value: animatedStats.surveysCompleted.toLocaleString(), icon: BarChart3 }
                                ].map((stat, index) => (
                                    <div
                                        key={index}
                                        className={`text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-maroon-100 transform transition-all duration-500 hover:scale-105 hover:shadow-lg hover:bg-white/80 ${visibleSections.has('hero-stats')
                                            ? 'opacity-100 translate-y-0'
                                            : 'opacity-0 translate-y-4'
                                            }`}
                                        style={{ transitionDelay: `${index * 100}ms` }}
                                    >
                                        <stat.icon className="w-6 h-6 mx-auto mb-2 text-maroon-600 animate-bounce-subtle" />
                                        <div className="text-2xl font-bold text-maroon-900 tabular-nums">{stat.value}</div>
                                        <div className="text-sm text-maroon-600">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3D Illustration */}
                        <div className="relative lg:h-[600px] flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-r from-maroon-200/20 to-beige-200/20 rounded-3xl blur-3xl"></div>
                            <div className="relative w-full h-full flex items-center justify-center">
                                <div className="w-80 h-80 bg-gradient-to-br from-maroon-100/40 to-beige-100/40 rounded-full flex items-center justify-center backdrop-blur-sm border border-maroon-200 animate-pulse-slow">
                                    <GraduationCap className="w-40 h-40 text-maroon-600" />
                                </div>
                                {/* Floating Icons */}
                                <div className="absolute top-10 left-10 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-maroon-100 animate-float">
                                    <Users className="w-8 h-8 text-maroon-600" />
                                </div>
                                <div className="absolute top-20 right-10 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-maroon-100 animate-float animation-delay-2000">
                                    <Briefcase className="w-8 h-8 text-maroon-700" />
                                </div>
                                <div className="absolute bottom-20 left-20 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-maroon-100 animate-float animation-delay-4000">
                                    <TrendingUp className="w-8 h-8 text-maroon-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Alumni Search Section */}
            <section id="search" data-animate className="py-20 px-4 sm:px-6 lg:px-8 bg-white/40">
                <div className={`max-w-4xl mx-auto transition-all duration-700 ${visibleSections.has('search') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center space-x-2 bg-maroon-100 border border-maroon-200 rounded-full px-4 py-2 mb-6 animate-bounce-subtle">
                            <Search className="w-4 h-4 text-maroon-600" />
                            <span className="text-sm text-maroon-700">Alumni Database Search</span>
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-maroon-900">
                            Find Your
                            <span className="block bg-gradient-to-r from-maroon-600 to-maroon-800 bg-clip-text text-transparent">
                                Alumni Record
                            </span>
                        </h2>
                        <p className="text-xl text-maroon-600 max-w-2xl mx-auto">
                            Check if you're already in our alumni database by searching with your email or student ID
                        </p>
                    </div>

                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-maroon-200 p-8 shadow-xl">
                        <form onSubmit={handleSearch} className="space-y-6">
                            {/* Search Type Toggle */}
                            <div className="flex justify-center space-x-4">
                                <button
                                    type="button"
                                    onClick={() => { setSearchType('student_id'); setSearchResult(null); setSearchError(''); }}
                                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${searchType === 'student_id'
                                        ? 'bg-maroon-600 text-white shadow-lg'
                                        : 'bg-white/60 text-maroon-600 border border-maroon-200 hover:bg-maroon-50'
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
                                        : 'bg-white/60 text-maroon-600 border border-maroon-200 hover:bg-maroon-50'
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
                                    className="w-full pl-12 pr-4 py-4 bg-white border border-maroon-200 rounded-xl focus:ring-2 focus:ring-maroon-500 focus:border-transparent text-lg"
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
                            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center space-x-2">
                                <X className="w-5 h-5" />
                                <span>{searchError}</span>
                            </div>
                        )}

                        {/* Search Result */}
                        {searchResult && (
                            <div className={`mt-6 p-6 rounded-xl border ${searchResult.found
                                ? 'bg-green-50 border-green-200'
                                : 'bg-amber-50 border-amber-200'
                                }`}>
                                {searchResult.found && searchResult.data ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-6 h-6 text-green-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-green-800">Record Found!</h3>
                                                <p className="text-green-600 text-sm">{searchResult.message}</p>
                                            </div>
                                        </div>
                                        <div className="bg-white/60 rounded-lg p-4 space-y-2">
                                            <p className="text-gray-700">
                                                <span className="font-medium">Name:</span> {searchResult.data.name}
                                            </p>
                                            <p className="text-gray-700">
                                                <span className="font-medium">Course:</span> {searchResult.data.course || 'Not specified'}
                                            </p>
                                            <p className="text-gray-700">
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
                        <div className="inline-flex items-center space-x-2 bg-maroon-100 border border-maroon-200 rounded-full px-4 py-2 mb-6 animate-wiggle">
                            <Megaphone className="w-4 h-4 text-maroon-600" />
                            <span className="text-sm text-maroon-700">Latest Updates</span>
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-maroon-900">
                            Announcements &
                            <span className="block bg-gradient-to-r from-maroon-600 to-maroon-800 bg-clip-text text-transparent">
                                News
                            </span>
                        </h2>
                        <p className="text-xl text-maroon-600 max-w-2xl mx-auto">
                            Stay updated with the latest news and announcements from your alma mater
                        </p>
                    </div>

                    {loadingAnnouncements ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="w-8 h-8 border-4 border-maroon-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : announcements.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {announcements.map((announcement, index) => (
                                <div
                                    key={announcement.id}
                                    onClick={() => setSelectedAnnouncement(announcement)}
                                    className={`group bg-white/60 backdrop-blur-sm rounded-2xl border border-maroon-100 overflow-hidden hover:shadow-xl transition-all duration-500 cursor-pointer hover:scale-[1.02] hover:-translate-y-2 ${visibleSections.has('announcements')
                                        ? 'opacity-100 translate-y-0'
                                        : 'opacity-0 translate-y-8'
                                        }`}
                                    style={{ transitionDelay: `${index * 150}ms` }}
                                >
                                    {announcement.featured_image ? (
                                        <div className="h-48 overflow-hidden">
                                            <img
                                                src={announcement.featured_image}
                                                alt={announcement.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-48 bg-gradient-to-br from-maroon-100 to-maroon-200 flex items-center justify-center">
                                            <Megaphone className="w-16 h-16 text-maroon-400" />
                                        </div>
                                    )}
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(announcement.priority)}`}>
                                                {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                                            </span>
                                            <span className="text-xs text-maroon-500 flex items-center">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {announcement.published_at || announcement.created_at}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-maroon-900 mb-2 group-hover:text-maroon-700 transition-colors line-clamp-2">
                                            {announcement.title}
                                        </h3>
                                        <p className="text-maroon-600 text-sm line-clamp-3">
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
                    ) : (
                        <div className="text-center py-12 bg-white/40 rounded-2xl border border-maroon-100">
                            <Megaphone className="w-16 h-16 text-maroon-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-maroon-700">No Announcements Yet</h3>
                            <p className="text-maroon-500">Check back later for updates and news</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Job Postings Section */}
            <section id="jobs" data-animate className="py-20 px-4 sm:px-6 lg:px-8 bg-white/40">
                <div className="max-w-7xl mx-auto">
                    <div className={`text-center mb-12 transition-all duration-700 ${visibleSections.has('jobs') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <div className="inline-flex items-center space-x-2 bg-maroon-100 border border-maroon-200 rounded-full px-4 py-2 mb-6 animate-pulse-badge">
                            <Briefcase className="w-4 h-4 text-maroon-600" />
                            <span className="text-sm text-maroon-700">Career Opportunities</span>
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-maroon-900">
                            Featured
                            <span className="block bg-gradient-to-r from-maroon-600 to-maroon-800 bg-clip-text text-transparent">
                                Job Postings
                            </span>
                        </h2>
                        <p className="text-xl text-maroon-600 max-w-2xl mx-auto">
                            Explore career opportunities from our partner companies and employers
                        </p>
                    </div>

                    {loadingJobs ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="w-8 h-8 border-4 border-maroon-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : jobs.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {jobs.map((job, index) => (
                                <div
                                    key={job.id}
                                    onClick={() => setSelectedJob(job)}
                                    className={`group bg-white/60 backdrop-blur-sm rounded-2xl border border-maroon-100 overflow-hidden hover:shadow-xl transition-all duration-500 cursor-pointer hover:scale-[1.02] hover:-translate-y-2 hover:border-maroon-300 ${visibleSections.has('jobs')
                                        ? 'opacity-100 translate-y-0'
                                        : 'opacity-0 translate-y-8'
                                        }`}
                                    style={{ transitionDelay: `${index * 150}ms` }}
                                >
                                    {job.poster_image ? (
                                        <div className="h-48 overflow-hidden relative">
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
                                        <div className="h-48 bg-gradient-to-br from-maroon-100 to-maroon-200 flex items-center justify-center relative">
                                            {job.company_logo ? (
                                                <img
                                                    src={job.company_logo}
                                                    alt={job.company_name}
                                                    className="max-w-[120px] max-h-[80px] object-contain"
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
                                            <span className="text-xs bg-maroon-100 text-maroon-700 px-2 py-1 rounded-full">
                                                {job.job_type_label}
                                            </span>
                                            {job.is_remote && (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center">
                                                    <Globe className="w-3 h-3 mr-1" />
                                                    Remote
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold text-maroon-900 mb-1 group-hover:text-maroon-700 transition-colors line-clamp-1">
                                            {job.title}
                                        </h3>
                                        <p className="text-maroon-600 font-medium mb-2">
                                            {job.company_name}
                                        </p>
                                        <div className="flex items-center text-maroon-500 text-sm mb-3">
                                            <MapPin className="w-4 h-4 mr-1" />
                                            <span className="line-clamp-1">{job.location}</span>
                                        </div>
                                        {job.salary_range && (
                                            <p className="text-maroon-700 font-semibold text-sm mb-3">
                                                {job.salary_range}
                                            </p>
                                        )}
                                        <p className="text-maroon-600 text-sm line-clamp-2 mb-4">
                                            {job.description}
                                        </p>
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
                    ) : (
                        <div className="text-center py-12 bg-white/40 rounded-2xl border border-maroon-100">
                            <Briefcase className="w-16 h-16 text-maroon-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-maroon-700">No Job Postings Yet</h3>
                            <p className="text-maroon-500">Check back later for career opportunities</p>
                        </div>
                    )}

                    {jobs.length > 0 && (
                        <div className="text-center mt-10">
                            <Link
                                href="/login"
                                className="inline-flex items-center space-x-2 px-8 py-4 bg-white/60 hover:bg-white backdrop-blur-sm border border-maroon-200 rounded-xl font-semibold text-maroon-900 transition-all"
                            >
                                <span>View All Jobs</span>
                                <ExternalLink className="w-5 h-5" />
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Features Section */}
            <section id="features" data-animate className="py-20 px-4 sm:px-6 lg:px-8 relative">
                <div className="max-w-7xl mx-auto">
                    <div className={`text-center mb-16 transition-all duration-700 ${visibleSections.has('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-maroon-900">
                            Powerful Features for
                            <span className="block bg-gradient-to-r from-maroon-600 to-maroon-800 bg-clip-text text-transparent">
                                Alumni Success
                            </span>
                        </h2>
                        <p className="text-xl text-maroon-600 max-w-2xl mx-auto">
                            Everything you need to build and maintain a thriving professional network
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className={`group p-8 bg-white/60 backdrop-blur-sm rounded-2xl border border-maroon-100 hover:border-maroon-300 hover:bg-white/80 transition-all duration-500 hover:scale-105 hover:-translate-y-2 shadow-lg hover:shadow-2xl ${visibleSections.has('features')
                                    ? 'opacity-100 translate-y-0'
                                    : 'opacity-0 translate-y-12'
                                    }`}
                                style={{ transitionDelay: `${index * 100}ms` }}
                            >
                                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-maroon-900 group-hover:text-maroon-700 transition-colors">{feature.title}</h3>
                                <p className="text-maroon-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" data-animate className="py-20 px-4 sm:px-6 lg:px-8 bg-white/40">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className={`transition-all duration-700 ${visibleSections.has('benefits') ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-maroon-900">
                                Why Choose
                                <span className="block bg-gradient-to-r from-maroon-600 to-maroon-800 bg-clip-text text-transparent">
                                    Alumni Tracer?
                                </span>
                            </h2>
                            <p className="text-xl text-maroon-600 mb-8">
                                Our platform is designed with cutting-edge technology to provide the best experience for alumni and institutions.
                            </p>
                            <div className="space-y-4">
                                {benefits.map((benefit, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-start space-x-3 group transition-all duration-500 ${visibleSections.has('benefits')
                                            ? 'opacity-100 translate-x-0'
                                            : 'opacity-0 -translate-x-4'
                                            }`}
                                        style={{ transitionDelay: `${index * 100}ms` }}
                                    >
                                        <div className="w-6 h-6 bg-gradient-to-br from-maroon-500 to-maroon-600 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 shadow-md">
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-maroon-700 group-hover:text-maroon-900 transition-colors font-medium">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={`relative transition-all duration-700 delay-300 ${visibleSections.has('benefits') ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
                            <div className="bg-gradient-to-br from-maroon-100/40 to-beige-100/40 rounded-3xl p-8 backdrop-blur-sm border border-maroon-200 hover:shadow-2xl transition-shadow duration-500">
                                <div className="space-y-6">
                                    <div className="flex items-center space-x-4 p-4 bg-white/60 rounded-xl border border-maroon-100">
                                        <Shield className="w-10 h-10 text-maroon-600" />
                                        <div>
                                            <div className="font-semibold text-maroon-900">Secure & Private</div>
                                            <div className="text-sm text-maroon-600">Your data is protected with enterprise-grade security</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 p-4 bg-white/60 rounded-xl border border-maroon-100">
                                        <Star className="w-10 h-10 text-maroon-600" />
                                        <div>
                                            <div className="font-semibold text-maroon-900">Trusted by Thousands</div>
                                            <div className="text-sm text-maroon-600">Join a community of successful professionals</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 p-4 bg-white/60 rounded-xl border border-maroon-100">
                                        <Globe className="w-10 h-10 text-maroon-600" />
                                        <div>
                                            <div className="font-semibold text-maroon-900">Global Reach</div>
                                            <div className="text-sm text-maroon-600">Connect with alumni worldwide</div>
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
                    <div className={`bg-gradient-to-br from-maroon-100/60 to-beige-100/60 rounded-3xl p-12 backdrop-blur-sm border border-maroon-200 transition-all duration-700 hover:shadow-2xl ${visibleSections.has('cta')
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 scale-95'
                        }`}>
                        <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-maroon-900">
                            Ready to Join Our
                            <span className="block bg-gradient-to-r from-maroon-600 to-maroon-800 bg-clip-text text-transparent">
                                Alumni Community?
                            </span>
                        </h2>
                        <p className="text-xl text-maroon-700 mb-8 max-w-2xl mx-auto">
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
                                className="px-10 py-5 bg-white/80 hover:bg-white backdrop-blur-sm border border-maroon-200 rounded-xl font-semibold text-lg text-maroon-900 transition-all"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-maroon-200">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-maroon-600 to-maroon-700 rounded-lg flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-maroon-900">Alumni Tracer System</span>
                    </div>
                    <p className="text-maroon-600 mb-4">
                        Stay connected, track your career journey, and contribute to the growth of our alumni community.
                    </p>
                    <p className="text-sm text-maroon-500">
                        © {new Date().getFullYear()} Alumni Tracer System. All rights reserved.
                    </p>
                </div>
            </footer>

            {/* Announcement Modal */}
            {selectedAnnouncement && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                        {selectedAnnouncement.featured_image && (
                            <div className="h-64 overflow-hidden">
                                <img
                                    src={selectedAnnouncement.featured_image}
                                    alt={selectedAnnouncement.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <div className="flex items-center justify-between mb-4">
                                <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(selectedAnnouncement.priority)}`}>
                                    {selectedAnnouncement.priority.charAt(0).toUpperCase() + selectedAnnouncement.priority.slice(1)}
                                </span>
                                <span className="text-sm text-gray-500">
                                    {selectedAnnouncement.published_at || selectedAnnouncement.created_at}
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedAnnouncement.title}</h2>
                            <div
                                className="prose prose-maroon max-w-none text-gray-700"
                                dangerouslySetInnerHTML={{ __html: selectedAnnouncement.full_content }}
                            />
                        </div>
                        <div className="p-4 border-t bg-gray-50">
                            <button
                                onClick={() => setSelectedAnnouncement(null)}
                                className="w-full py-3 bg-maroon-600 hover:bg-maroon-700 text-white font-semibold rounded-xl transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Job Modal */}
            {selectedJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                        {selectedJob.poster_image && (
                            <div className="h-64 overflow-hidden">
                                <img
                                    src={selectedJob.poster_image}
                                    alt={selectedJob.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm bg-maroon-100 text-maroon-700 px-3 py-1 rounded-full">
                                    {selectedJob.job_type_label}
                                </span>
                                {selectedJob.is_featured && (
                                    <span className="text-sm bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full flex items-center">
                                        <Star className="w-4 h-4 mr-1 fill-current" />
                                        Featured
                                    </span>
                                )}
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedJob.title}</h2>
                            <p className="text-lg text-maroon-600 font-medium mb-4">{selectedJob.company_name}</p>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center text-gray-600">
                                    <MapPin className="w-5 h-5 mr-2" />
                                    <span>{selectedJob.location}</span>
                                    {selectedJob.is_remote && (
                                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                            Remote Available
                                        </span>
                                    )}
                                </div>
                                {selectedJob.salary_range && (
                                    <div className="flex items-center text-gray-600">
                                        <Briefcase className="w-5 h-5 mr-2" />
                                        <span className="font-semibold">{selectedJob.salary_range}</span>
                                    </div>
                                )}
                                {selectedJob.application_deadline && (
                                    <div className="flex items-center text-amber-600">
                                        <Clock className="w-5 h-5 mr-2" />
                                        <span>Application Deadline: {selectedJob.application_deadline}</span>
                                    </div>
                                )}
                            </div>

                            <div className="prose prose-maroon max-w-none text-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Job Description</h3>
                                <p>{selectedJob.description}</p>
                            </div>

                            <div className="mt-6 p-4 bg-maroon-50 rounded-xl border border-maroon-100">
                                <p className="text-sm text-maroon-700">
                                    <strong>Note:</strong> Sign in or register to view full job details and apply.
                                </p>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex gap-3">
                            <button
                                onClick={() => setSelectedJob(null)}
                                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition-colors"
                            >
                                Close
                            </button>
                            <Link
                                href="/login"
                                className="flex-1 py-3 bg-maroon-600 hover:bg-maroon-700 text-white font-semibold rounded-xl transition-colors text-center"
                            >
                                Sign In to Apply
                            </Link>
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
