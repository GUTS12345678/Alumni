import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Search, Filter, MapPin, Briefcase, GraduationCap, Mail, UserPlus, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AlumniProfile {
    id: number;
    first_name: string;
    last_name: string;
    graduation_year?: number;
    current_job_title?: string;
    current_employer?: string;
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
    alumniProfile?: AlumniProfile;
    connection_status?: string;
}

interface Props {
    alumni: {
        data: User[];
        current_page: number;
        last_page: number;
    };
    filters: {
        search?: string;
        batch?: string;
    };
}

export default function AlumniDirectory({ alumni, filters }: Props) {
    const { flash } = usePage().props as any;
    const [search, setSearch] = useState(filters.search || '');
    const [batch, setBatch] = useState(filters.batch || 'all');

    const handleSearch = () => {
        router.get('/alumni/network', { search, batch: batch === 'all' ? '' : batch }, { preserveState: true });
    };

    const handleConnect = (userId: number) => {
        router.post('/alumni/network/connect', { receiver_id: userId }, {
            preserveScroll: true,
        });
    };

    const getConnectionButton = (user: User) => {
        switch (user.connection_status) {
            case 'pending':
                return (
                    <Button disabled variant="outline" className="border-blue-300 text-blue-700">
                        <UserCheck className="h-4 w-4 mr-2" />
                        Request Sent
                    </Button>
                );
            case 'accepted':
                return (
                    <Button disabled variant="outline" className="border-green-300 text-green-700">
                        <UserCheck className="h-4 w-4 mr-2" />
                        Connected
                    </Button>
                );
            case 'received':
                return (
                    <div className="flex gap-2">
                        <Button
                            onClick={() => router.put(`/alumni/network/${user.id}/accept`)}
                            className="bg-green-700 hover:bg-green-800"
                        >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Accept
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.put(`/alumni/network/${user.id}/reject`)}
                            className="border-red-300 text-red-700"
                        >
                            <UserX className="h-4 w-4 mr-2" />
                            Decline
                        </Button>
                    </div>
                );
            default:
                return (
                    <Button
                        onClick={() => handleConnect(user.id)}
                        className="bg-maroon-700 hover:bg-maroon-800"
                    >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Connect
                    </Button>
                );
        }
    };

    return (
        <AlumniBaseLayout title="Alumni Network">
            <Head title="Alumni Network" />

            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center space-x-3">
                    <Users className="h-8 w-8 text-maroon-600" />
                    <div>
                        <h1 className="text-3xl font-bold text-maroon-800">Alumni Network</h1>
                        <p className="text-gray-600">Connect with fellow alumni</p>
                    </div>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
                        {flash.success}
                    </div>
                )}

                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800">Find Alumni</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4 mb-6">
                            <div className="flex-1">
                                <Input
                                    placeholder="Search by name, company, position..."
                                    className="border-beige-300"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <Select value={batch} onValueChange={setBatch}>
                                <SelectTrigger className="w-48 border-beige-300">
                                    <SelectValue placeholder="All Batches" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Batches</SelectItem>
                                    {/* Add batch options here */}
                                </SelectContent>
                            </Select>
                            <Button className="bg-maroon-700 hover:bg-maroon-800 text-white" onClick={handleSearch}>
                                <Search className="h-4 w-4 mr-2" />
                                Search
                            </Button>
                        </div>

                        {alumni.data.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                    No Alumni Found
                                </h3>
                                <p className="text-gray-500 mb-6">
                                    {filters.search ? 'Try adjusting your search terms' : 'No alumni profiles available'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {alumni.data.map((user) => (
                                    <Card key={user.id} className="border-beige-200 hover:shadow-lg transition-shadow">
                                        <CardContent className="pt-6">
                                            <div className="text-center mb-4">
                                                <div className="w-16 h-16 bg-maroon-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <Users className="h-8 w-8 text-maroon-600" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-maroon-800">
                                                    {user.alumniProfile?.first_name} {user.alumniProfile?.last_name}
                                                </h3>
                                                <p className="text-sm text-gray-600">{user.email}</p>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                {user.alumniProfile?.graduation_year && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <GraduationCap className="h-4 w-4" />
                                                        <span>Class of {user.alumniProfile.graduation_year}</span>
                                                    </div>
                                                )}

                                                {user.alumniProfile?.current_job_title && user.alumniProfile?.current_employer && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Briefcase className="h-4 w-4" />
                                                        <span>{user.alumniProfile.current_job_title} at {user.alumniProfile.current_employer}</span>
                                                    </div>
                                                )}

                                                {(user.alumniProfile?.city || user.alumniProfile?.country) && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <MapPin className="h-4 w-4" />
                                                        <span>
                                                            {user.alumniProfile.city}
                                                            {user.alumniProfile.city && user.alumniProfile.country && ', '}
                                                            {user.alumniProfile.country}
                                                        </span>
                                                    </div>
                                                )}

                                                {user.alumniProfile?.degree_program && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <GraduationCap className="h-4 w-4" />
                                                        <span>{user.alumniProfile.degree_program}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {user.alumniProfile?.skills && user.alumniProfile.skills.length > 0 && (
                                                <div className="mb-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.alumniProfile.skills.slice(0, 3).map((skill, index) => (
                                                            <Badge key={index} variant="outline" className="text-xs">
                                                                {skill}
                                                            </Badge>
                                                        ))}
                                                        {user.alumniProfile.skills.length > 3 && (
                                                            <Badge variant="outline" className="text-xs">
                                                                +{user.alumniProfile.skills.length - 3} more
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex justify-center">
                                                {getConnectionButton(user)}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {alumni.last_page > 1 && (
                            <div className="flex justify-center gap-2 mt-6">
                                {Array.from({ length: alumni.last_page }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page}
                                        variant={page === alumni.current_page ? 'default' : 'outline'}
                                        onClick={() => router.get('/alumni/network', { ...filters, page })}
                                        className={page === alumni.current_page ? 'bg-maroon-700' : ''}
                                    >
                                        {page}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AlumniBaseLayout>
    );
}
