import React, { useState, useEffect, useCallback } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    TrendingUp,
    Users,
    GraduationCap,
    UserCheck,
    ClipboardList,
    Plus,
    MessageSquare,
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
    LogOut,
    User
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
    id: number;
    email: string;
    role: string;
    status: string;
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
            { name: "Profile Reviews", href: "/admin/profiles", icon: UserCheck }
        ]
    },
    {
        section: "Survey System",
        items: [
            { name: "Survey Bank", href: "/admin/surveys", icon: ClipboardList },
            { name: "Create Survey", href: "/admin/surveys/create", icon: Plus },
            { name: "Question Bank", href: "/admin/questions", icon: MessageSquare },
            { name: "Survey Analytics", href: "/admin/survey-analytics", icon: BarChart3 }
        ]
    },
    {
        section: "User Management",
        items: [
            { name: "Admin Users", href: "/admin/users", icon: Shield },
            { name: "Permissions", href: "/admin/permissions", icon: Key },
            { name: "Activity Logs", href: "/admin/activity", icon: Activity }
        ]
    },
    {
        section: "System",
        items: [
            { name: "Email Templates", href: "/admin/email-templates", icon: Mail },
            { name: "Settings", href: "/admin/settings", icon: Settings },
            { name: "Backup & Export", href: "/admin/backup", icon: Download }
        ]
    }
];

export default function AdminBaseLayout({ children, title = "Admin Panel", user }: AdminBaseLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(user || null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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
        router.post('/logout');
    };

    const isActivePath = (href: string) => {
        if (typeof window === 'undefined') return false;
        return window.location.pathname === href;
    };

    // Desktop Sidebar Content (without header)
    const DesktopSidebarContent = () => (
        <div className="flex flex-col max-h-screen">
            {/* Logo */}
            <div className={cn(
                "flex items-center px-6 py-4 border-b border-beige-200",
                sidebarCollapsed && "px-4"
            )}>
                <GraduationCap className="h-8 w-8 text-maroon-600 flex-shrink-0" />
                {!sidebarCollapsed && (
                    <div className="ml-3">
                        <h1 className="text-lg font-bold text-maroon-800">Alumni Tracer</h1>
                        <p className="text-xs text-maroon-600">Admin Panel</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-maroon-300 scrollbar-track-beige-100">
                {adminNavigation.map((section) => (
                    <div key={section.section} className="mb-6">
                        {!sidebarCollapsed && (
                            <h3 className="px-6 mb-2 text-xs font-semibold text-maroon-600 uppercase tracking-wider">
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
                                                ? "bg-maroon-100 text-maroon-800 border-r-2 border-maroon-600"
                                                : "text-gray-700 hover:bg-beige-50 hover:text-maroon-700"
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
                ))}
            </div>

            {/* User Profile */}
            <div className={cn(
                "border-t border-beige-200 p-4 mt-auto",
                sidebarCollapsed && "px-2"
            )}>
                <div className={cn(
                    "flex items-center",
                    sidebarCollapsed ? "justify-center" : "space-x-3"
                )}>
                    <div className="h-8 w-8 bg-maroon-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-white" />
                    </div>
                    {!sidebarCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {currentUser?.email || 'Admin User'}
                            </p>
                            <p className="text-xs text-gray-500">Administrator</p>
                        </div>
                    )}
                </div>
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
            {adminNavigation.map((section) => (
                <div key={section.section} className="mb-6">
                    <h3 className="px-6 mb-2 text-xs font-semibold text-maroon-600 uppercase tracking-wider">
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
                                            ? "bg-maroon-100 text-maroon-800 border-r-2 border-maroon-600"
                                            : "text-gray-700 hover:bg-beige-50 hover:text-maroon-700"
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
            ))}

            {/* Mobile User Profile */}
            <div className="border-t border-beige-200 p-4 mt-4">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="h-8 w-8 bg-maroon-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {currentUser?.email || 'Admin User'}
                        </p>
                        <p className="text-xs text-gray-500">Administrator</p>
                    </div>
                </div>
                <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="sm"
                    className="w-full text-gray-700 hover:text-maroon-700 hover:bg-beige-50 justify-start"
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                </Button>
            </div>
        </div>
    );

    // Show loading screen while checking authentication
    if (isCheckingAuth) {
        return (
            <>
                <Head title={title} />
                <div className="min-h-screen bg-gradient-to-br from-beige-50 to-beige-100 flex items-center justify-center">
                    <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 border-4 border-maroon-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-maroon-800 font-medium">Loading...</span>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={title} />

            <div className="md:flex bg-beige-50 min-h-screen">
                {/* Desktop Sidebar */}
                <div className={cn(
                    "hidden md:flex md:flex-col bg-white border-r border-beige-200 transition-all duration-300 self-start sticky top-0",
                    sidebarCollapsed ? "md:w-16" : "md:w-64"
                )}>
                    <div className="relative">
                        <DesktopSidebarContent />

                        {/* Collapse Toggle */}
                        <Button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            variant="ghost"
                            size="sm"
                            className="absolute -right-3 top-4 h-6 w-6 p-0 border border-beige-200 bg-white shadow-sm hover:bg-beige-50"
                        >
                            {sidebarCollapsed ? (
                                <ChevronRight className="h-3 w-3" />
                            ) : (
                                <ChevronLeft className="h-3 w-3" />
                            )}
                        </Button>
                    </div>
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
                        <div className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-2xl z-[10000]">
                            <div className="flex flex-col h-full">
                                {/* Mobile Header with Close Button */}
                                <div className="flex items-center justify-between p-4 border-b border-beige-200 bg-white">
                                    <div className="flex items-center">
                                        <GraduationCap className="h-8 w-8 text-maroon-600" />
                                        <div className="ml-3">
                                            <h1 className="text-lg font-bold text-maroon-800">Alumni Tracer</h1>
                                            <p className="text-xs text-maroon-600">Admin Panel</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="text-gray-500 hover:text-maroon-700 hover:bg-gray-100"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </Button>
                                </div>

                                {/* Mobile Navigation Content */}
                                <div className="flex-1 overflow-y-auto bg-white scrollbar-thin scrollbar-thumb-maroon-300 scrollbar-track-beige-100">
                                    <MobileSidebarContent />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1 w-full">
                    {/* Header */}
                    <header className="bg-white border-b border-beige-200 px-4 py-3 relative z-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center min-w-0 flex-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="md:hidden text-gray-700 hover:text-maroon-700 hover:bg-beige-50 mr-2 flex-shrink-0"
                                    onClick={() => setMobileMenuOpen(true)}
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                                <h1 className="text-lg md:text-xl font-semibold text-maroon-800 truncate">{title}</h1>
                            </div>

                            <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
                                <span className="hidden sm:block text-sm text-gray-600 truncate max-w-32 md:max-w-none">
                                    Welcome, {currentUser?.email?.split('@')[0] || 'Admin'}
                                </span>
                                {/* Mobile User Avatar */}
                                <div className="sm:hidden h-8 w-8 bg-maroon-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User className="h-4 w-4 text-white" />
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Page Content */}
                    <main className="bg-beige-50">
                        <div className="container mx-auto px-4 pt-4 pb-4 max-w-full">
                            <div className="w-full">
                                {children}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}