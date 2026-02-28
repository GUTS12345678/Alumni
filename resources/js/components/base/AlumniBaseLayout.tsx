import React, { useState, useEffect } from 'react';
import { BackToTop } from '@/components/ui/back-to-top';
import { Head, router, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { useSessionGuard } from '@/hooks/useSessionGuard';
import {
    LayoutDashboard,
    User,
    Settings,
    ClipboardList,
    History,
    Award,
    TrendingUp,
    Briefcase,
    Users,
    Heart,
    HelpCircle,
    LifeBuoy,
    Menu,
    ChevronLeft,
    ChevronRight,
    LogOut,
    GraduationCap,
    MessageCircle,
    Bell,
    UserCheck,
    Layers,
    MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { CampusSelector } from '@/components/CampusSelector';

interface UserData {
    id: number;
    email: string;
    role: string;
    status: string;
    alumniProfile?: {
        first_name: string;
        last_name: string;
        middle_name?: string;
    };
}

interface AlumniBaseLayoutProps {
    children: React.ReactNode;
    title?: string;
}

const alumniNavigation = [
    {
        section: "My Account",
        items: [
            { name: "Dashboard", href: "/alumni/dashboard", icon: LayoutDashboard },
            { name: "My Profile", href: "/alumni/profile", icon: User },
            { name: "Account Settings", href: "/alumni/settings", icon: Settings }
        ]
    },
    {
        section: "Communication",
        items: [
            { name: "Messages", href: "/alumni/messages", icon: MessageCircle },
            { name: "Content Feed", href: "/alumni/content", icon: Layers }
        ]
    },
    {
        section: "Surveys & Forms",
        items: [
            { name: "Available Surveys", href: "/alumni/surveys", icon: ClipboardList },
            { name: "Survey History", href: "/alumni/surveys/history", icon: History },
            { name: "Certificates", href: "/alumni/certificates", icon: Award }
        ]
    },
    {
        section: "Career & Networking",
        items: [
            { name: "Career Timeline", href: "/alumni/career", icon: TrendingUp },
            { name: "Job Board", href: "/alumni/job-board", icon: Briefcase },
            { name: "Alumni Network", href: "/alumni/network", icon: Users },
            { name: "My Connections", href: "/alumni/connections", icon: UserCheck },
            { name: "Mentorship", href: "/alumni/mentorship", icon: Heart }
        ]
    },
    {
        section: "Resources",
        items: [
            { name: "Support Tickets", href: "/alumni/support", icon: LifeBuoy },
            { name: "Help & Support", href: "/alumni/help", icon: HelpCircle }
        ]
    }
];

// Bottom navigation items for mobile (5 core actions)
const mobileBottomNavItems = [
    { name: "Home", href: "/alumni/dashboard", icon: LayoutDashboard },
    { name: "Network", href: "/alumni/network", icon: Users },
    { name: "Messages", href: "/alumni/messages", icon: MessageCircle },
    { name: "Profile", href: "/alumni/profile", icon: User },
];

const getLogoUrl = (path: string | null): string => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('/')) return path;
    return `/api/v1/assets/${path}`;
};

const getFileUrl = (path: string): string => {
    if (path.startsWith('http') || path.startsWith('/')) return path;
    return `/api/v1/files/${path}`;
};

export default function AlumniBaseLayout({ children, title = "Alumni Portal" }: AlumniBaseLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [appearanceSettings, setAppearanceSettings] = useState<{
        logoLight: string | null;
        logoDark: string | null;
    }>({ logoLight: null, logoDark: null });

    // Guard against stale sessions after standby/sleep
    useSessionGuard();

    // Get user from Inertia's shared props
    const { auth } = usePage<{ auth: { user: UserData } }>().props;
    const currentUser = auth?.user;

    // Fetch appearance settings
    useEffect(() => {
        const fetchAppearanceSettings = async () => {
            try {
                const response = await fetch('/api/v1/public/appearance', {
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

    const handleLogout = () => {
        // Create and submit a form (logout is CSRF-exempt)
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/logout';
        document.body.appendChild(form);
        form.submit();
    };

    const isActivePath = (href: string) => {
        return window.location.pathname === href;
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-screen">
            {/* Logo */}
            <div className={cn(
                "flex items-center px-6 py-4 border-b border-beige-200 dark:border-gray-700 flex-shrink-0",
                sidebarCollapsed && "px-4"
            )}>
                {appearanceSettings.logoLight || appearanceSettings.logoDark ? (
                    <div className="flex items-center">
                        <img
                            src={getLogoUrl(document.documentElement.classList.contains('dark') && appearanceSettings.logoDark ? appearanceSettings.logoDark : appearanceSettings.logoLight || appearanceSettings.logoDark)}
                            alt="Logo"
                            className="h-8 w-8 object-contain flex-shrink-0"
                        />
                        {!sidebarCollapsed && (
                            <div className="ml-3">
                                <h1 className="text-lg font-bold text-maroon-800 dark:text-maroon-200">Alumni Tracer</h1>
                                <p className="text-xs text-maroon-600 dark:text-maroon-400">Alumni Portal</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center">
                        <GraduationCap className="h-8 w-8 text-maroon-600 dark:text-maroon-400 flex-shrink-0" />
                        {!sidebarCollapsed && (
                            <div className="ml-3">
                                <h1 className="text-lg font-bold text-maroon-800 dark:text-maroon-200">Alumni Tracer</h1>
                                <p className="text-xs text-maroon-600 dark:text-maroon-400">Alumni Portal</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4 scrollbar-none">
                {alumniNavigation.map((section) => (
                    <div key={section.section} className="mb-6">
                        {!sidebarCollapsed && (
                            <h3 className="px-6 mb-2 text-xs font-semibold text-maroon-600 dark:text-maroon-400 uppercase tracking-wider">
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
                                                ? "bg-maroon-100 dark:bg-maroon-900/50 text-maroon-800 dark:text-maroon-200 border-r-2 border-maroon-600"
                                                : "text-gray-700 dark:text-gray-300 hover:bg-beige-50 dark:hover:bg-gray-800 hover:text-maroon-700 dark:hover:text-maroon-300"
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
                "border-t border-beige-200 dark:border-gray-700 p-4 flex-shrink-0",
                sidebarCollapsed && "px-2"
            )}>
                <div className={cn(
                    "flex items-center",
                    sidebarCollapsed ? "justify-center" : "space-x-3"
                )}>
                    <div className="h-8 w-8 bg-maroon-600 dark:bg-maroon-700 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {currentUser?.profile_picture_path ? (
                            <img
                                src={getFileUrl(currentUser.profile_picture_path)}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <User className="h-4 w-4 text-white" />
                        )}
                    </div>
                    {!sidebarCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {currentUser?.alumniProfile?.first_name && currentUser?.alumniProfile?.last_name
                                    ? `${currentUser.alumniProfile.first_name} ${currentUser.alumniProfile.last_name}`
                                    : currentUser?.email?.split('@')[0] || 'Alumni User'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Alumni Member</p>
                        </div>
                    )}
                </div>
                {!sidebarCollapsed && (
                    <Button
                        onClick={handleLogout}
                        variant="ghost"
                        size="sm"
                        className="w-full mt-3 text-gray-700 dark:text-gray-300 hover:text-maroon-700 dark:hover:text-maroon-300 hover:bg-beige-50 dark:hover:bg-gray-800 justify-start"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <>
            <Head title={title} />

            <div className="flex min-h-screen md:h-screen bg-beige-50 dark:bg-gray-900 overflow-x-hidden md:overflow-hidden">
                {/* Desktop Sidebar - Fixed Position */}
                <div className={cn(
                    "hidden md:flex md:flex-col bg-white dark:bg-gray-900 border-r border-beige-200 dark:border-gray-700 transition-all duration-300 fixed left-0 top-0 bottom-0 z-20",
                    sidebarCollapsed ? "md:w-16" : "md:w-64"
                )}>
                    <SidebarContent />

                    {/* Collapse Toggle */}
                    <Button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        variant="ghost"
                        size="sm"
                        className="absolute -right-3 top-4 h-6 w-6 p-0 border border-beige-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:bg-beige-50 dark:hover:bg-gray-700 z-30"
                    >
                        {sidebarCollapsed ? (
                            <ChevronRight className="h-3 w-3" />
                        ) : (
                            <ChevronLeft className="h-3 w-3" />
                        )}
                    </Button>
                </div>

                {/* Mobile Sidebar Overlay */}
                {mobileMenuOpen && (
                    <div
                        className="fixed inset-0 bg-gray-900/20 dark:bg-gray-900/50 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                )}

                {/* Mobile Sidebar */}
                <div className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 transform transition-transform duration-300 ease-in-out md:hidden",
                    mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <SidebarContent />
                </div>

                {/* Main Content - Add margin for fixed sidebar */}
                <div className={cn(
                    "flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 transition-all duration-300",
                    sidebarCollapsed ? "md:ml-16" : "md:ml-64"
                )}>
                    {/* Header */}
                    <header className="bg-white dark:bg-gray-900 border-b border-beige-200 dark:border-gray-700 px-4 py-3 flex-shrink-0 shadow-sm dark:shadow-gray-950/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <h1 className="ml-1 text-xl font-semibold text-maroon-800 dark:text-maroon-200">{title}</h1>
                            </div>

                            <div className="flex items-center space-x-4">
                                {/* Campus Badge */}
                                <CampusSelector variant="minimal" />
                                <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
                                    Welcome, {currentUser?.alumniProfile?.first_name || currentUser?.email?.split('@')[0] || 'Alumni'}
                                </span>
                                <AppearanceToggleDropdown />
                            </div>
                        </div>
                    </header>

                    {/* Page Content - Scrollable */}
                    <main className="flex-1 overflow-y-auto bg-beige-50 dark:bg-gray-950 scrollbar-none">
                        <div className="container mx-auto px-4 pt-6 pb-24 md:pb-8 max-w-7xl min-h-full animate-fade-in-up">
                            {children}
                        </div>
                        <BackToTop />
                    </main>
                </div>

                {/* Mobile Bottom Navigation Bar */}
                <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-gray-900 border-t border-beige-200 dark:border-gray-700 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.3)]">
                    <div className="flex items-center justify-around h-16 px-1 max-w-md mx-auto">
                        {mobileBottomNavItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = isActivePath(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex flex-col items-center justify-center flex-1 h-full pt-1 pb-1 relative transition-colors duration-200",
                                        isActive
                                            ? "text-maroon-700 dark:text-maroon-300"
                                            : "text-gray-400 dark:text-gray-500 active:text-maroon-600 dark:active:text-maroon-400"
                                    )}
                                >
                                    {/* Active indicator dot */}
                                    {isActive && (
                                        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-maroon-600 dark:bg-maroon-400 rounded-b-full" />
                                    )}
                                    <Icon className={cn(
                                        "h-5 w-5 mb-0.5",
                                        isActive ? "stroke-[2.5]" : "stroke-[1.5]"
                                    )} />
                                    <span className={cn(
                                        "text-[10px] leading-tight",
                                        isActive ? "font-semibold" : "font-medium"
                                    )}>
                                        {item.name}
                                    </span>
                                </Link>
                            );
                        })}
                        {/* More button — opens sidebar */}
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(true)}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 h-full pt-1 pb-1 transition-colors duration-200",
                                mobileMenuOpen
                                    ? "text-maroon-700 dark:text-maroon-300"
                                    : "text-gray-400 dark:text-gray-500 active:text-maroon-600 dark:active:text-maroon-400"
                            )}
                        >
                            <MoreHorizontal className="h-5 w-5 mb-0.5 stroke-[1.5]" />
                            <span className="text-[10px] leading-tight font-medium">More</span>
                        </button>
                    </div>
                    {/* iOS safe area padding */}
                    <div className="h-[env(safe-area-inset-bottom)]" />
                </nav>
            </div>
        </>
    );
}