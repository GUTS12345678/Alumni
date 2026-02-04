import React, { useState, useEffect, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    TrendingUp,
    Users,
    GraduationCap,
    ClipboardList,
    Plus,
    BarChart3,
    Shield,
    Key,
    Activity,
    Mail,
    Settings,
    Download,
    Menu,
    ChevronLeft,
    ChevronRight,
    Server,
    BookOpen,
    LogOut,
    User,
    Building,
    Lock,
    UserCircle,
    ChevronDown,
    Palette,
    Briefcase,
    Bell,
    MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { CampusSelector } from '@/components/CampusSelector';

interface User {
    id: number;
    email: string;
    role: string;
    status: string;
    profile_picture_path?: string | null;
}

interface AdminBaseLayoutProps {
    children: React.ReactNode;
    title?: string;
    user?: User;
}

const adminNavigation = [
    {
        section: "Overview",
        items: [
            { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
            { name: "Analytics", href: "/admin/analytics", icon: TrendingUp }
        ]
    },
    {
        section: "Alumni Management",
        items: [
            { name: "Alumni Bank", href: "/admin/alumni", icon: Users },
            { name: "Batch Management", href: "/admin/batches", icon: GraduationCap },
        ]
    },
    {
        section: "Survey System",
        items: [
            { name: "Survey Bank", href: "/admin/surveys", icon: ClipboardList },
            { name: "Create Survey", href: "/admin/surveys/create", icon: Plus },
            { name: "Survey Analytics", href: "/admin/survey-analytics", icon: BarChart3 }
        ]
    },
    {
        section: "Content & Communication",
        items: [
            { name: "Job Board", href: "/admin/job-board", icon: Briefcase },
            { name: "Announcements", href: "/admin/announcements", icon: Bell },
            { name: "Messages", href: "/admin/messages", icon: MessageCircle }
        ]
    },
    {
        section: "User Management",
        items: [
            { name: "Admin Users", href: "/admin/users", icon: Shield },
            { name: "Activity Logs", href: "/admin/activity", icon: Activity }
        ]
    },
    {
        section: "Super Admin",
        items: [
            { name: "Departments", href: "/super-admin/departments", icon: Building },
            { name: "Department Settings", href: "/super-admin/department-settings", icon: Palette },
            { name: "Course Management", href: "/super-admin/courses", icon: BookOpen },
            { name: "Permission Matrix", href: "/super-admin/permissions", icon: Lock },
            { name: "System Metrics", href: "/super-admin/metrics", icon: Server },
            { name: "System Settings", href: "/super-admin/settings", icon: Settings }
        ],
        requiredRole: 'super_admin' // Only show to super admins
    },
    {
        section: "System",
        items: [
            { name: "Email Templates", href: "/admin/email-templates", icon: Mail },
            { name: "Backup & Export", href: "/admin/backup", icon: Download }
        ]
    }
];

export default function AdminBaseLayout({ children, title = "Admin Panel", user }: AdminBaseLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(user || null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [appearanceSettings, setAppearanceSettings] = useState<{
        logoLight: string | null;
        logoDark: string | null;
    }>({ logoLight: null, logoDark: null });

    const checkSessionAuth = useCallback(async () => {
        try {
            const response = await fetch('/api/v1/profile', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    setCurrentUser(data.data);
                    setIsCheckingAuth(false);

                    // Get token for future API calls only if we don't have one
                    const existingToken = localStorage.getItem('auth_token');
                    if (!existingToken) {
                        getTokenForSessionUser();
                    }
                } else {
                    setIsCheckingAuth(false);
                    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
                }
            } else {
                setIsCheckingAuth(false);
                if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        } catch (error) {
            console.error('Session auth check failed:', error);
            setIsCheckingAuth(false);
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
    }, []);

    useEffect(() => {
        // Set user from props
        if (user) {
            setCurrentUser(user);
            setIsCheckingAuth(false);

            // If user is authenticated via session but no token exists, get one
            const token = localStorage.getItem('auth_token');
            if (!token) {
                getTokenForSessionUser();
            }
        } else {
            // If no user is provided initially, check session-based authentication
            checkSessionAuth();
        }
    }, [user, checkSessionAuth]); // Removed currentUser from dependencies to prevent infinite loop

    // Fetch appearance settings
    useEffect(() => {
        const fetchAppearanceSettings = async () => {
            try {
                const response = await fetch('/api/v1/admin/appearance', {
                    credentials: 'include',
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

    // Close mobile menu when resizing to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) { // md breakpoint
                setMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        // Cleanup function to restore scroll when component unmounts
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [mobileMenuOpen]);

    const getTokenForSessionUser = async () => {
        // Don't fetch token if one already exists
        const existingToken = localStorage.getItem('auth_token');
        if (existingToken) {
            return;
        }

        try {
            const response = await fetch('/api/v1/get-token', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data.token) {
                    localStorage.setItem('auth_token', data.data.token);
                }
            }
        } catch (error) {
            console.error('Failed to get token for session user:', error);
        }
    };

    const handleLogout = () => {
        // Create and submit a form (logout is CSRF-exempt)
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/logout';
        document.body.appendChild(form);
        form.submit();
    };

    const isActivePath = (href: string) => {
        if (typeof window === 'undefined') return false;
        return window.location.pathname === href;
    };

    // Desktop Sidebar Content (without header)
    const DesktopSidebarContent = () => (
        <div className="flex flex-col h-screen">
            {/* Logo */}
            <div className={cn(
                "flex items-center px-6 py-4 border-b border-beige-200 dark:border-gray-800 flex-shrink-0",
                sidebarCollapsed && "px-4"
            )}>
                {appearanceSettings.logoLight || appearanceSettings.logoDark ? (
                    <div className="flex items-center">
                        <img
                            src={`/storage/${document.documentElement.classList.contains('dark') && appearanceSettings.logoDark ? appearanceSettings.logoDark : appearanceSettings.logoLight || appearanceSettings.logoDark}`}
                            alt="Logo"
                            className="h-8 w-8 object-contain flex-shrink-0"
                        />
                        {!sidebarCollapsed && (
                            <div className="ml-3">
                                <h1 className="text-lg font-bold text-maroon-800 dark:text-maroon-300">Alumni Tracer</h1>
                                <p className="text-xs text-maroon-600 dark:text-maroon-400">Admin Panel</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center">
                        <GraduationCap className="h-8 w-8 text-maroon-600 dark:text-maroon-400 flex-shrink-0" />
                        {!sidebarCollapsed && (
                            <div className="ml-3">
                                <h1 className="text-lg font-bold text-maroon-800 dark:text-maroon-300">Alumni Tracer</h1>
                                <p className="text-xs text-maroon-600 dark:text-maroon-400">Admin Panel</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-maroon-300 dark:scrollbar-thumb-maroon-700 scrollbar-track-beige-100 dark:scrollbar-track-gray-800">
                {adminNavigation.map((section) => {
                    // Skip Super Admin section if user is not super_admin
                    if (section.requiredRole === 'super_admin' && currentUser?.role !== 'super_admin') {
                        return null;
                    }

                    return (
                        <div key={section.section} className="mb-6">
                            {!sidebarCollapsed && (
                                <h3 className="px-6 mb-2 text-xs font-semibold text-maroon-600 dark:text-maroon-300 uppercase tracking-wider">
                                    {section.section}
                                </h3>
                            )}
                            <nav className="space-y-1">
                                {section.items.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = isActivePath(item.href);

                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center px-6 py-3 text-sm font-medium transition-colors duration-200",
                                                sidebarCollapsed && "px-4 justify-center",
                                                isActive
                                                    ? "bg-maroon-100 dark:bg-maroon-900/30 text-maroon-800 dark:text-maroon-200 border-r-2 border-maroon-600 dark:border-maroon-400"
                                                    : "text-gray-700 dark:text-gray-200 hover:bg-beige-50 dark:hover:bg-gray-800 hover:text-maroon-700 dark:hover:text-maroon-300"
                                            )}
                                            title={sidebarCollapsed ? item.name : undefined}
                                        >
                                            <Icon className={cn("h-5 w-5 flex-shrink-0", !sidebarCollapsed && "mr-3")} />
                                            {!sidebarCollapsed && (
                                                <span className="truncate">{item.name}</span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    );
                })}
            </div>

            {/* User Profile */}
            <div className={cn(
                "border-t border-beige-200 dark:border-gray-800 p-4 flex-shrink-0",
                sidebarCollapsed && "px-2"
            )}>
                {currentUser ? (
                    <div className={cn(
                        "flex items-center",
                        sidebarCollapsed ? "justify-center" : "space-x-3"
                    )}>
                        <div className="h-8 w-8 bg-maroon-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {currentUser.profile_picture_path ? (
                                <img
                                    src={currentUser.profile_picture_path.startsWith('/storage') ? currentUser.profile_picture_path : `/storage/${currentUser.profile_picture_path}`}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User className="h-4 w-4 text-white" />
                            )}
                        </div>
                        {!sidebarCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">
                                    {currentUser.email}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-300 capitalize">
                                    {currentUser.role === 'super_admin' ? 'Super Admin' :
                                        currentUser.role === 'admin' ? 'Administrator' :
                                            currentUser.role}
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={cn(
                        "flex items-center",
                        sidebarCollapsed ? "justify-center" : "space-x-3"
                    )}>
                        <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                            <User className="h-4 w-4 text-gray-500" />
                        </div>
                        {!sidebarCollapsed && (
                            <div className="flex-1 min-w-0">
                                <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                                <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                            </div>
                        )}
                    </div>
                )}
                {!sidebarCollapsed && (
                    <Button
                        onClick={handleLogout}
                        variant="ghost"
                        size="sm"
                        className="w-full mt-3 text-gray-700 hover:text-maroon-700 hover:bg-beige-50 justify-start"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                    </Button>
                )}
            </div>
        </div>
    );

    // Mobile Sidebar Content (navigation only, no header)
    const MobileSidebarContent = () => (
        <div className="py-4">
            {adminNavigation.map((section) => {
                // Skip Super Admin section if user is not super_admin
                if (section.requiredRole === 'super_admin' && currentUser?.role !== 'super_admin') {
                    return null;
                }

                return (
                    <div key={section.section} className="mb-6">
                        <h3 className="px-6 mb-2 text-xs font-semibold text-maroon-600 dark:text-maroon-300 uppercase tracking-wider">
                            {section.section}
                        </h3>
                        <nav className="space-y-1">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = isActivePath(item.href);

                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center px-6 py-3 text-sm font-medium transition-colors duration-200",
                                            isActive
                                                ? "bg-maroon-100 dark:bg-maroon-900/30 text-maroon-800 dark:text-maroon-200 border-r-2 border-maroon-600 dark:border-maroon-400"
                                                : "text-gray-700 dark:text-gray-200 hover:bg-beige-50 dark:hover:bg-gray-800 hover:text-maroon-700 dark:hover:text-maroon-300"
                                        )}
                                        onClick={() => setMobileMenuOpen(false)} // Close mobile menu on navigation
                                    >
                                        <Icon className="h-5 w-5 flex-shrink-0 mr-3" />
                                        <span className="truncate">{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                );
            })}

            {/* Mobile User Profile */}
            <div className="border-t border-beige-200 dark:border-gray-800 p-4 mt-4">
                {currentUser ? (
                    <>
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="h-8 w-8 bg-maroon-600 dark:bg-maroon-700 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {currentUser.profile_picture_path ? (
                                    <img
                                        src={currentUser.profile_picture_path.startsWith('/storage') ? currentUser.profile_picture_path : `/storage/${currentUser.profile_picture_path}`}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="h-4 w-4 text-white" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {currentUser.email}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                    {currentUser.role === 'super_admin' ? 'Super Admin' :
                                        currentUser.role === 'admin' ? 'Administrator' :
                                            currentUser.role}
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handleLogout}
                            variant="ghost"
                            size="sm"
                            className="w-full text-gray-700 dark:text-gray-200 hover:text-maroon-700 dark:hover:text-maroon-300 hover:bg-beige-50 dark:hover:bg-gray-800 justify-start"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </>
                ) : (
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                            <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    // Show loading screen while checking authentication
    if (isCheckingAuth) {
        return (
            <>
                <Head title={title} />
                <div className="min-h-screen bg-gradient-to-br from-beige-50 to-beige-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
                    <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 border-4 border-maroon-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-maroon-800 dark:text-maroon-300 font-medium">Loading...</span>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={title} />

            <div className="md:flex bg-beige-50 dark:bg-gray-950 h-screen w-full overflow-hidden">
                {/* Desktop Sidebar - Fixed Position */}
                <div className={cn(
                    "hidden md:flex md:flex-col bg-white dark:bg-gray-900 border-r border-beige-200 dark:border-gray-800 transition-all duration-300 fixed left-0 top-0 bottom-0 z-20",
                    sidebarCollapsed ? "md:w-16" : "md:w-64"
                )}>
                    <DesktopSidebarContent />

                    {/* Collapse Toggle */}
                    <Button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        variant="ghost"
                        size="sm"
                        className="absolute -right-3 top-4 h-6 w-6 p-0 border border-beige-200 bg-white shadow-sm hover:bg-beige-50 z-30"
                    >
                        {sidebarCollapsed ? (
                            <ChevronRight className="h-3 w-3" />
                        ) : (
                            <ChevronLeft className="h-3 w-3" />
                        )}
                    </Button>
                </div>

                {/* Mobile Sidebar Overlay - Only show on mobile when menu is open */}
                {mobileMenuOpen && (
                    <div className="fixed inset-0 z-[9999] md:hidden">
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        {/* Sidebar */}
                        <div className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-900 shadow-2xl z-[10000]">
                            <div className="flex flex-col h-full">
                                {/* Mobile Header with Close Button */}
                                <div className="flex items-center justify-between p-4 border-b border-beige-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                                    <div className="flex items-center">
                                        {appearanceSettings.logoLight || appearanceSettings.logoDark ? (
                                            <img
                                                src={`/storage/${document.documentElement.classList.contains('dark') && appearanceSettings.logoDark ? appearanceSettings.logoDark : appearanceSettings.logoLight || appearanceSettings.logoDark}`}
                                                alt="Logo"
                                                className="h-8 w-8 object-contain"
                                            />
                                        ) : (
                                            <GraduationCap className="h-8 w-8 text-maroon-600 dark:text-maroon-300" />
                                        )}
                                        <div className="ml-3">
                                            <h1 className="text-lg font-bold text-maroon-800 dark:text-maroon-300">Alumni Tracer</h1>
                                            <p className="text-xs text-maroon-600 dark:text-maroon-400">Admin Panel</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="text-gray-500 dark:text-gray-300 hover:text-maroon-700 dark:hover:text-maroon-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </Button>
                                </div>

                                {/* Mobile Navigation Content */}
                                <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 scrollbar-thin scrollbar-thumb-maroon-300 scrollbar-track-beige-100 dark:scrollbar-track-gray-800">
                                    <MobileSidebarContent />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content - Add margin to account for fixed sidebar */}
                <div className={cn(
                    "flex-1 min-w-0 flex flex-col h-screen transition-all duration-300",
                    sidebarCollapsed ? "md:ml-16" : "md:ml-64"
                )}>
                    {/* Header - Fixed at top */}
                    <header className="bg-white dark:bg-gray-900 border-b border-beige-200 dark:border-gray-800 px-4 py-3 relative z-10 flex-shrink-0">
                        <div className="flex items-center justify-between min-w-0">
                            <div className="flex items-center min-w-0 flex-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="md:hidden text-gray-700 dark:text-gray-200 hover:text-maroon-700 dark:hover:text-maroon-300 hover:bg-beige-50 dark:hover:bg-gray-800 mr-2 flex-shrink-0"
                                    onClick={() => setMobileMenuOpen(true)}
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                                <h1 className="text-lg md:text-xl font-semibold text-maroon-800 dark:text-maroon-300 truncate min-w-0">{title}</h1>
                            </div>

                            <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0 ml-4">
                                {/* Campus Selector */}
                                <CampusSelector variant="compact" showLabel={false} />

                                {/* Theme Toggle */}
                                <AppearanceToggleDropdown />

                                {/* User Profile Dropdown */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="flex items-center space-x-2 hover:bg-beige-50 dark:hover:bg-gray-800">
                                            <div className="h-8 w-8 bg-maroon-600 dark:bg-maroon-700 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {currentUser?.profile_picture_path ? (
                                                    <img
                                                        src={currentUser.profile_picture_path.startsWith('/storage') ? currentUser.profile_picture_path : `/storage/${currentUser.profile_picture_path}`}
                                                        alt="Profile"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <User className="h-4 w-4 text-white" />
                                                )}
                                            </div>
                                            <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-200 truncate max-w-32 md:max-w-48">
                                                {currentUser?.email?.split('@')[0] || 'Admin'}
                                            </span>
                                            <ChevronDown className="hidden sm:block h-4 w-4 text-gray-500 dark:text-gray-400" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel>
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {currentUser?.email?.split('@')[0] || 'Admin'}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {currentUser?.email || ''}
                                                </p>
                                                <p className="text-xs text-maroon-600 dark:text-maroon-400 capitalize">
                                                    {currentUser?.role?.replace('_', ' ') || 'Administrator'}
                                                </p>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link href="/admin/profile" className="flex items-center cursor-pointer">
                                                <UserCircle className="mr-2 h-4 w-4" />
                                                <span>Profile Settings</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>Logout</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </header>

                    {/* Page Content - Scrollable content area */}
                    <main className="bg-beige-50 dark:bg-gray-950 flex-1 overflow-y-auto">
                        <div className="px-4 py-6 max-w-full">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}