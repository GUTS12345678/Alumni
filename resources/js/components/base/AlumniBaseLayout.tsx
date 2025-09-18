import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
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
    FileText,
    HelpCircle,
    Menu,
    ChevronLeft,
    ChevronRight,
    LogOut,
    GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
    id: number;
    email: string;
    role: string;
    status: string;
}

interface AlumniBaseLayoutProps {
    children: React.ReactNode;
    title?: string;
    user?: User;
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
        section: "Surveys & Forms",
        items: [
            { name: "Available Surveys", href: "/alumni/surveys", icon: ClipboardList },
            { name: "Survey History", href: "/alumni/survey-history", icon: History },
            { name: "Certificates", href: "/alumni/certificates", icon: Award }
        ]
    },
    {
        section: "Career & Networking",
        items: [
            { name: "Career Timeline", href: "/alumni/career", icon: TrendingUp },
            { name: "Job Board", href: "/alumni/jobs", icon: Briefcase },
            { name: "Alumni Network", href: "/alumni/network", icon: Users },
            { name: "Mentorship", href: "/alumni/mentorship", icon: Heart }
        ]
    },
    {
        section: "Resources",
        items: [
            { name: "Documents", href: "/alumni/documents", icon: FileText },
            { name: "Help & Support", href: "/alumni/help", icon: HelpCircle }
        ]
    }
];

export default function AlumniBaseLayout({ children, title = "Alumni Portal", user }: AlumniBaseLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const [currentUser, setCurrentUser] = useState<User | null>(user || null);

    useEffect(() => {
        // Get user info from localStorage if not provided
        if (!currentUser) {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setCurrentUser(JSON.parse(storedUser));
            }
        }

        // Check if user is alumni
        const userData = currentUser || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null);
        if (!userData || userData.role !== 'alumni') {
            window.location.href = '/login';
            return;
        }
    }, [currentUser]);

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (token) {
                await fetch('/api/v1/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    };

    const isActivePath = (href: string) => {
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
                        <h1 className="text-lg font-bold text-maroon-800">Alumni Portal</h1>
                        <p className="text-xs text-maroon-600">Welcome back!</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4">
                {alumniNavigation.map((section) => (
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
                                    <a
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
                                    </a>
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
                                {currentUser?.email || 'Alumni User'}
                            </p>
                            <p className="text-xs text-gray-500">Alumni Member</p>
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

                {/* Mobile Sidebar - Simplified */}

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
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                                <h1 className="ml-2 text-xl font-semibold text-maroon-800">{title}</h1>
                            </div>

                            <div className="flex items-center space-x-4">
                                <span className="hidden sm:block text-sm text-gray-600">
                                    Welcome, {currentUser?.email?.split('@')[0] || 'Alumni'}
                                </span>
                            </div>
                        </div>
                    </header>

                    {/* Page Content */}
                    <main className="flex-1 overflow-auto bg-beige-50">
                        <div className="container mx-auto px-4 py-6">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}