import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Ticket,
    Plus,
    Eye,
    Clock,
    CheckCircle,
    AlertCircle,
    MessageCircle,
    ArrowLeft
} from 'lucide-react';

interface SupportTicket {
    id: number;
    ticket_number: string;
    category: string;
    subject: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: string;
    created_at: string;
    updated_at: string;
    replies?: { id: number }[];
}

interface PaginatedTickets {
    data: SupportTicket[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Props {
    tickets: PaginatedTickets;
}

export default function SupportIndex({ tickets }: Props) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open':
                return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700">Open</Badge>;
            case 'in_progress':
                return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700">In Progress</Badge>;
            case 'resolved':
                return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700">Resolved</Badge>;
            case 'closed':
                return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600">Closed</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            general: 'General Inquiry',
            technical: 'Technical Issue',
            account: 'Account Problem',
            employment: 'Employment/Career',
            alumni_association: 'Alumni Association',
            other: 'Other',
        };
        return labels[category] || category;
    };

    return (
        <AlumniBaseLayout title="My Support Tickets">
            <Head title="My Support Tickets" />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Ticket className="h-8 w-8 text-maroon-600 dark:text-maroon-400" />
                        <div>
                            <h1 className="text-3xl font-bold text-maroon-800 dark:text-maroon-200">My Support Tickets</h1>
                            <p className="text-gray-600 dark:text-gray-400">Track your support requests and communications</p>
                        </div>
                    </div>
                    <Link href="/alumni/help">
                        <Button className="bg-maroon-700 hover:bg-maroon-800 dark:bg-maroon-600 dark:hover:bg-maroon-700 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            New Request
                        </Button>
                    </Link>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
                        {flash.success}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Tickets</p>
                                    <p className="text-2xl font-bold text-maroon-800 dark:text-maroon-200">{tickets.total}</p>
                                </div>
                                <Ticket className="h-8 w-8 text-maroon-600 dark:text-maroon-400" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Open</p>
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {tickets.data.filter(t => t.status === 'open').length}
                                    </p>
                                </div>
                                <AlertCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                        {tickets.data.filter(t => t.status === 'in_progress').length}
                                    </p>
                                </div>
                                <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {tickets.data.filter(t => ['resolved', 'closed'].includes(t.status)).length}
                                    </p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tickets List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <MessageCircle className="h-5 w-5 mr-2" />
                            Support History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {tickets.data.length === 0 ? (
                            <div className="text-center py-12">
                                <Ticket className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    No Support Tickets
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">
                                    You haven't submitted any support requests yet.
                                </p>
                                <Link href="/alumni/help">
                                    <Button className="bg-maroon-700 hover:bg-maroon-800 dark:bg-maroon-600 dark:hover:bg-maroon-700 text-white">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Your First Request
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {tickets.data.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="font-mono text-sm text-maroon-600 dark:text-maroon-400">
                                                        #{ticket.ticket_number}
                                                    </span>
                                                    {getStatusBadge(ticket.status)}
                                                    <Badge variant="outline">{getCategoryLabel(ticket.category)}</Badge>
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                                    {ticket.subject}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Submitted: {new Date(ticket.created_at).toLocaleDateString()}
                                                    {ticket.updated_at !== ticket.created_at && (
                                                        <span> · Updated: {new Date(ticket.updated_at).toLocaleDateString()}</span>
                                                    )}
                                                </p>
                                            </div>
                                            <Link href={`/alumni/support/${ticket.ticket_number}`}>
                                                <Button size="sm" variant="outline" className="border-maroon-300 dark:border-maroon-600 text-maroon-700 dark:text-maroon-300 hover:bg-maroon-50 dark:hover:bg-maroon-900/30">
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Back Link */}
                <div className="flex justify-center">
                    <Link href="/alumni/help" className="text-maroon-600 dark:text-maroon-400 hover:text-maroon-800 dark:hover:text-maroon-300 flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Help & Support
                    </Link>
                </div>
            </div>
        </AlumniBaseLayout>
    );
}
