import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    History,
    Search,
    User,
    Briefcase,
    Archive,
    Eye,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

interface UserWithCareer {
    id: number;
    name: string;
    email: string;
    active_positions: number;
    archived_positions: number;
    career_history: Array<{
        id: number;
        job_title: string;
        company_name: string;
        deleted_at: string | null;
    }>;
}

interface PaginatedUsers {
    data: UserWithCareer[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    users: PaginatedUsers;
    filters: {
        search: string;
    };
}

export default function CareerVersionsIndex({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = () => {
        router.get('/super-admin/career-versions', { search }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <AdminBaseLayout>
            <Head title="Career History Versions" />

            <div className="max-w-7xl mx-auto space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <History className="h-8 w-8 text-maroon-600" />
                        <div>
                            <h1 className="text-3xl font-bold text-maroon-800">Career History Versions</h1>
                            <p className="text-gray-600">View and manage alumni career history versions and archives</p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Search by name or email..."
                                    className="pl-10"
                                />
                            </div>
                            <Button
                                onClick={handleSearch}
                                className="bg-maroon-700 hover:bg-maroon-800 text-white"
                            >
                                Search
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Users with Career Data</p>
                                    <p className="text-2xl font-bold text-maroon-800">{users.total}</p>
                                </div>
                                <User className="h-8 w-8 text-maroon-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Active Positions</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {users.data.reduce((sum, u) => sum + u.active_positions, 0)}
                                    </p>
                                </div>
                                <Briefcase className="h-8 w-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Archived Positions</p>
                                    <p className="text-2xl font-bold text-amber-600">
                                        {users.data.reduce((sum, u) => sum + u.archived_positions, 0)}
                                    </p>
                                </div>
                                <Archive className="h-8 w-8 text-amber-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Users List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <User className="h-5 w-5 mr-2" />
                            Alumni with Career History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {users.data.length === 0 ? (
                            <div className="text-center py-12">
                                <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                    No Users Found
                                </h3>
                                <p className="text-gray-500">
                                    {search
                                        ? 'No users match your search criteria.'
                                        : 'No alumni have added career history yet.'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Active Positions</th>
                                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Archived</th>
                                                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.data.map((user) => (
                                                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-4 px-4">
                                                        <div>
                                                            <p className="font-medium text-gray-900">{user.name}</p>
                                                            <p className="text-sm text-gray-500">{user.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <Badge className="bg-green-100 text-green-800">
                                                            {user.active_positions}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <Badge className="bg-amber-100 text-amber-800">
                                                            {user.archived_positions}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <Link href={`/super-admin/career-versions/user/${user.id}`}>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                                                            >
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                View History
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {users.last_page > 1 && (
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                                        <p className="text-sm text-gray-600">
                                            Showing page {users.current_page} of {users.last_page}
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={users.current_page === 1}
                                                onClick={() => router.get('/super-admin/career-versions', {
                                                    search,
                                                    page: users.current_page - 1
                                                })}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                                Previous
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={users.current_page === users.last_page}
                                                onClick={() => router.get('/super-admin/career-versions', {
                                                    search,
                                                    page: users.current_page + 1
                                                })}
                                            >
                                                Next
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminBaseLayout>
    );
}
