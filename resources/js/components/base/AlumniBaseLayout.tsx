import React, { useState, useEffect } from 'react';
import { Head, router, Link, usePage } from '@inertiajs/react';
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

export default function AlumniBaseLayout({ children, title = "Alumni Portal" }: AlumniBaseLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    // Get user from Inertia's shared props
    const { auth } = usePage<{ auth: { user: UserData } }>().props;
    const currentUser = auth?.user;

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
                "flex items-center px-6 py-4 border-b border-beige-200 flex-shrink-0",
                sidebarCollapsed && "px-4"
            )}>
                <GraduationCap className="h-8 w-8 text-maroon-600 flex-shrink-0" />
                {!sidebarCollapsed && (
                    <div className="ml-3">
                        <h1 className="text-lg font-bold text-maroon-800">Alumni Tracer</h1>
                        <p className="text-xs text-maroon-600">Alumni Portal</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-maroon-300 scrollbar-track-beige-100">
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
                "border-t border-beige-200 p-4 flex-shrink-0",
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
                                {currentUser?.alumniProfile?.first_name && currentUser?.alumniProfile?.last_name 
                                    ? `${currentUser.alumniProfile.first_name} ${currentUser.alumniProfile.last_name}`
                                    : currentUser?.email?.split('@')[0] || 'Alumni User'}
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

            <div className="flex h-screen bg-beige-50 overflow-hidden">
                {/* Desktop Sidebar - Fixed Position */}
                <div className={cn(
                    "hidden md:flex md:flex-col bg-white border-r border-beige-200 transition-all duration-300 fixed left-0 top-0 bottom-0 z-20",
                    sidebarCollapsed ? "md:w-16" : "md:w-64"
                )}>
                    <SidebarContent />

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

                {/* Mobile Sidebar Overlay */}
                {mobileMenuOpen && (
                    <div
                        className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                )}

                {/* Mobile Sidebar */}
                <div className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out md:hidden",
                    mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <SidebarContent />
                </div>

                {/* Main Content - Add margin for fixed sidebar */}
                <div className={cn(
                    "flex-1 flex flex-col min-w-0 bg-white h-screen transition-all duration-300",
                    sidebarCollapsed ? "md:ml-16" : "md:ml-64"
                )}>
                    {/* Header */}
                    <header className="bg-white border-b border-beige-200 px-4 py-3 flex-shrink-0 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="md:hidden text-gray-700 hover:text-maroon-700 hover:bg-beige-50"
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                                <h1 className="ml-2 text-xl font-semibold text-maroon-800">{title}</h1>
                            </div>

                            <div className="flex items-center space-x-4">
                                <span className="hidden sm:block text-sm text-gray-600">
                                    Welcome, {currentUser?.alumniProfile?.first_name || currentUser?.email?.split('@')[0] || 'Alumni'}
                                </span>
                            </div>
                        </div>
                    </header>

                    {/* Page Content - Scrollable */}
                    <main className="flex-1 overflow-y-auto bg-beige-50">
                        <div className="container mx-auto px-4 py-6 max-w-7xl">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}