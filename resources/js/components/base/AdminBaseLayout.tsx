import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        // Set user from props
        if (user && !currentUser) {
            setCurrentUser(user);
        }

        // If no user is provided, redirect to login
        if (!user && !currentUser) {
            window.location.href = '/login';
        }
    }, [user, currentUser]);

    const handleLogout = () => {
        router.post('/logout');
    };

    const isActivePath = (href: string) => {
        if (typeof window === 'undefined') return false;
        return window.location.pathname === href;
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
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
            <div className="flex-1 overflow-y-auto py-4">
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
                "border-t border-beige-200 p-4",
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

    return (
        <>
            <Head title={title} />

            <div className="flex h-screen bg-beige-50">
                {/* Desktop Sidebar */}
                <div className={cn(
                    "hidden md:flex md:flex-col bg-white border-r border-beige-200 transition-all duration-300",
                    sidebarCollapsed ? "md:w-16" : "md:w-64"
                )}>
                    <div className="relative flex-1">
                        <SidebarContent />

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

                {/* Mobile Sidebar Overlay */}
                {mobileMenuOpen && (
                    <div className="fixed inset-0 z-50 md:hidden">
                        <div
                            className="fixed inset-0 bg-black bg-opacity-50"
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <div className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
                            <SidebarContent />
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Header */}
                    <header className="bg-white border-b border-beige-200 px-4 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="md:hidden text-gray-700 hover:text-maroon-700 hover:bg-beige-50"
                                    onClick={() => setMobileMenuOpen(true)}
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                                <h1 className="ml-2 text-xl font-semibold text-maroon-800">{title}</h1>
                            </div>

                            <div className="flex items-center space-x-4">
                                <span className="hidden sm:block text-sm text-gray-600">
                                    Welcome, {currentUser?.email?.split('@')[0] || 'Admin'}
                                </span>
                            </div>
                        </div>
                    </header>

                    {/* Page Content */}
                    <main className="flex-1 overflow-auto bg-beige-50">
                        <div className="container mx-auto px-4 py-6 max-w-full">
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