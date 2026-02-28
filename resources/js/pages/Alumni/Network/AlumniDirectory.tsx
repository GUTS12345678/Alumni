import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { ScrollFadeIn } from '@/components/scroll-animations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Users,
    Search,
    MapPin,
    GraduationCap,
    UserPlus,
    UserCheck,
    UserX,
    MessageCircle,
    Clock,
    Eye,
    ChevronLeft,
    ChevronRight,
    Mail,
    Building2,
} from 'lucide-react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';

interface AlumniProfile {
    id: number;
    first_name: string;
    last_name: string;
    graduation_year?: number;
    current_job_title?: string;
    current_employer?: string;
    employment_status?: string;
    city?: string;
    country?: string;
    degree_program?: string;
    major?: string;
    skills?: string[];
}

interface User {
    id: number;
    name: string;
    email: string;
    profile_picture_path?: string;
    alumni_profile?: AlumniProfile;
    connection_status?: string;
    connection_id?: number;
}

interface Props {
    alumni: {
        data: User[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        search?: string;
        batch?: string;
    };
}

interface PageProps extends InertiaPageProps {
    flash?: { success?: string; error?: string };
    [key: string]: unknown;
}

export default function AlumniDirectory({ alumni, filters }: Props) {
    const { flash } = usePage<PageProps>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [batch, setBatch] = useState(filters.batch || 'all');

    const handleSearch = () => {
        router.get('/alumni/network', { search, batch: batch === 'all' ? '' : batch }, { preserveState: true });
    };

    const handleConnect = (userId: number) => {
        router.post('/alumni/network/connect', { receiver_id: userId }, { preserveScroll: true });
    };

    const handleStartConversation = async (userId: number) => {
        try {
            const response = await fetch('/api/v1/messaging/conversations', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ type: 'direct', participant_ids: [userId] }),
            });
            if (response.ok) {
                router.visit('/alumni/messages');
            } else {
                router.visit('/alumni/messages', { preserveState: false });
            }
        } catch {
            router.visit('/alumni/messages');
        }
    };

    const handleViewProfile = (userId: number) => {
        router.visit(`/alumni/network/profile/${userId}`);
    };

    const getDisplayName = (user: User) => {
        if (user.alumni_profile) {
            return `${user.alumni_profile.first_name} ${user.alumni_profile.last_name}`.trim() || user.name;
        }
        return user.name || user.email.split('@')[0];
    };

    const getInitials = (user: User) => {
        const name = getDisplayName(user);
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case 'accepted':
                return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs"><UserCheck className="h-3 w-3 mr-1" /> Connected</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
            case 'received':
                return <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs"><Clock className="h-3 w-3 mr-1" /> Wants to Connect</Badge>;
            default:
                return null;
        }
    };

    const getEmploymentLabel = (status?: string) => {
        const labels: Record<string, { text: string; color: string }> = {
            employed_full_time: { text: 'Full-time', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
            employed_part_time: { text: 'Part-time', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
            self_employed: { text: 'Self-employed', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
            freelance: { text: 'Freelancer', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
            unemployed: { text: 'Open to Work', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
            student: { text: 'Student', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
        };
        if (!status) return null;
        return labels[status] || null;
    };

    return (
        <AlumniBaseLayout title="Alumni Network">
            <Head title="Alumni Network" />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <ScrollFadeIn>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <div className="h-12 w-12 bg-maroon-100 dark:bg-maroon-900/40 rounded-xl flex items-center justify-center">
                                <Users className="h-6 w-6 text-maroon-600 dark:text-maroon-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-maroon-800 dark:text-maroon-200">Alumni Network</h1>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    Discover and connect with {alumni.total || 0} fellow alumni
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => router.visit('/alumni/connections')}
                            variant="outline"
                            className="border-maroon-300 text-maroon-700 hover:bg-maroon-50 dark:border-maroon-700 dark:text-maroon-300"
                        >
                            <UserCheck className="h-4 w-4 mr-2" />
                            My Connections
                        </Button>
                    </div>
                </ScrollFadeIn>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg dark:bg-green-900/20 dark:border-green-800 dark:text-green-300">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                        {flash.error}
                    </div>
                )}

                {/* Search & Filter Bar */}
                <ScrollFadeIn delay={100}>
                    <Card className="border-beige-200 dark:border-gray-700 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search by name, company, position..."
                                        className="pl-10 border-beige-300 dark:border-gray-600"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                                <Select value={batch} onValueChange={setBatch}>
                                    <SelectTrigger className="w-full sm:w-48 border-beige-300 dark:border-gray-600">
                                        <SelectValue placeholder="All Batches" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Batches</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button className="bg-maroon-700 hover:bg-maroon-800 text-white" onClick={handleSearch}>
                                    <Search className="h-4 w-4 mr-2" />
                                    Search
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </ScrollFadeIn>

                {/* Results */}
                <ScrollFadeIn delay={200}>
                    {alumni.data.length === 0 ? (
                        <Card className="border-beige-200 dark:border-gray-700 shadow-sm">
                            <CardContent className="py-16">
                                <div className="text-center">
                                    <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Alumni Found</h3>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        {filters.search ? 'Try adjusting your search terms or filters' : 'No alumni profiles available yet'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {alumni.data.map((user) => {
                                const profile = user.alumni_profile;
                                const empLabel = getEmploymentLabel(profile?.employment_status);
                                return (
                                <Card
                                    key={user.id}
                                    className="border-beige-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 group overflow-hidden"
                                >
                                    {/* Card Header Accent */}
                                    <div className="h-2 bg-gradient-to-r from-maroon-600 to-maroon-800" />
                                    <CardContent className="p-5">
                                        {/* Avatar + Name + Status Badge */}
                                        <div className="flex items-start gap-4 mb-3">
                                            <Avatar
                                                className="h-16 w-16 flex-shrink-0 cursor-pointer ring-2 ring-beige-200 dark:ring-gray-700 group-hover:ring-maroon-300 transition-all"
                                                onClick={() => handleViewProfile(user.id)}
                                            >
                                                <AvatarImage src={user.profile_picture_path ? `/api/v1/files/${user.profile_picture_path}` : undefined} />
                                                <AvatarFallback className="bg-maroon-100 text-maroon-700 dark:bg-maroon-900 dark:text-maroon-300 font-bold text-lg">
                                                    {getInitials(user)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <h3
                                                    className="text-base font-bold text-maroon-800 dark:text-maroon-200 truncate cursor-pointer hover:underline"
                                                    onClick={() => handleViewProfile(user.id)}
                                                >
                                                    {getDisplayName(user)}
                                                </h3>
                                                {profile?.current_job_title && (
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate mt-0.5 font-medium">
                                                        {profile.current_job_title}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                    {getStatusBadge(user.connection_status)}
                                                    {empLabel && (
                                                        <Badge className={`${empLabel.color} text-[10px] px-1.5 py-0 border-0`}>
                                                            {empLabel.text}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Info Details */}
                                        <div className="space-y-1.5 mb-3 bg-beige-50/50 dark:bg-gray-800/30 rounded-lg px-3 py-2.5">
                                            {profile?.current_employer && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-maroon-500" />
                                                    <span className="truncate">{profile.current_employer}</span>
                                                </div>
                                            )}
                                            {profile?.degree_program && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <GraduationCap className="h-3.5 w-3.5 flex-shrink-0 text-maroon-500" />
                                                    <span className="truncate">
                                                        {profile.degree_program}
                                                        {profile.graduation_year ? ` • ${profile.graduation_year}` : ''}
                                                    </span>
                                                </div>
                                            )}
                                            {(profile?.city || profile?.country) && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-maroon-500" />
                                                    <span className="truncate">
                                                        {[profile.city, profile.country].filter(Boolean).join(', ')}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500">
                                                <Mail className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                                                <span className="truncate">{user.email}</span>
                                            </div>
                                        </div>

                                        {/* Skills */}
                                        {profile?.skills && profile.skills.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-3">
                                                {profile.skills.slice(0, 3).map((skill, index) => (
                                                    <Badge key={index} variant="outline" className="text-[10px] px-1.5 py-0 border-maroon-200 text-maroon-600 dark:border-maroon-800 dark:text-maroon-400">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                                {profile.skills.length > 3 && (
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-gray-200 text-gray-500">
                                                        +{profile.skills.length - 3} more
                                                    </Badge>
                                                )}
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 pt-3 border-t border-beige-100 dark:border-gray-700">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleViewProfile(user.id)}
                                                className="flex-1 text-maroon-700 border-maroon-200 hover:bg-maroon-50 dark:text-maroon-300 dark:border-maroon-800 dark:hover:bg-maroon-900/30"
                                            >
                                                <Eye className="h-3.5 w-3.5 mr-1.5" />
                                                Profile
                                            </Button>
                                            {user.connection_status === 'accepted' ? (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleStartConversation(user.id)}
                                                    className="flex-1 bg-maroon-700 hover:bg-maroon-800 text-white"
                                                >
                                                    <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                                                    Message
                                                </Button>
                                            ) : user.connection_status === 'pending' ? (
                                                <Button size="sm" disabled variant="outline" className="flex-1 border-yellow-300 text-yellow-700">
                                                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                                                    Pending
                                                </Button>
                                            ) : user.connection_status === 'received' && user.connection_id ? (
                                                <div className="flex gap-1 flex-1">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => router.put(`/alumni/network/${user.connection_id}/accept`, {}, { preserveScroll: true })}
                                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                                                    >
                                                        <UserCheck className="h-3.5 w-3.5 mr-1" /> Accept
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => router.put(`/alumni/network/${user.connection_id}/reject`, {}, { preserveScroll: true })}
                                                        className="border-red-300 text-red-700"
                                                    >
                                                        <UserX className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleConnect(user.id)}
                                                    className="flex-1 bg-maroon-700 hover:bg-maroon-800 text-white"
                                                >
                                                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                                                    Connect
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {alumni.last_page > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={alumni.current_page === 1}
                                onClick={() => router.get('/alumni/network', { ...filters, page: alumni.current_page - 1 })}
                                className="border-beige-300 dark:border-gray-600"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {Array.from({ length: alumni.last_page }, (_, i) => i + 1)
                                .filter(page => {
                                    return page === 1 || page === alumni.last_page ||
                                        Math.abs(page - alumni.current_page) <= 1;
                                })
                                .reduce<(number | string)[]>((acc, page, i, arr) => {
                                    if (i > 0 && page - (arr[i - 1] as number) > 1) {
                                        acc.push('...');
                                    }
                                    acc.push(page);
                                    return acc;
                                }, [])
                                .map((item, i) =>
                                    typeof item === 'string' ? (
                                        <span key={`ellipsis-${i}`} className="px-2 text-gray-400">...</span>
                                    ) : (
                                        <Button
                                            key={item}
                                            variant={item === alumni.current_page ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => router.get('/alumni/network', { ...filters, page: item })}
                                            className={item === alumni.current_page ? 'bg-maroon-700 hover:bg-maroon-800 text-white' : 'border-beige-300 dark:border-gray-600'}
                                        >
                                            {item}
                                        </Button>
                                    )
                                )}
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={alumni.current_page === alumni.last_page}
                                onClick={() => router.get('/alumni/network', { ...filters, page: alumni.current_page + 1 })}
                                className="border-beige-300 dark:border-gray-600"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </ScrollFadeIn>
            </div>
        </AlumniBaseLayout>
    );
}
