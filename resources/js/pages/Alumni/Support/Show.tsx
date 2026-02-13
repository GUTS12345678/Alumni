import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Ticket,
    ArrowLeft,
    Clock,
    User,
    Send,
    CheckCircle,
    XCircle,
    MessageCircle
} from 'lucide-react';

interface Reply {
    id: number;
    message: string;
    is_admin_reply: boolean;
    created_at: string;
    user: {
        id: number;
        name: string;
    };
}

interface AssignedAdmin {
    id: number;
    name: string;
    email: string;
}

interface SupportTicket {
    id: number;
    ticket_number: string;
    category: string;
    subject: string;
    message: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: string;
    created_at: string;
    updated_at: string;
    resolved_at?: string;
    replies: Reply[];
    assigned_admin?: AssignedAdmin;
}

interface Props {
    ticket: SupportTicket;
}

export default function SupportShow({ ticket }: Props) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
    const [replyMessage, setReplyMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyMessage.trim()) return;

        setIsSubmitting(true);
        router.post(`/alumni/support/${ticket.ticket_number}/reply`, {
            message: replyMessage,
        }, {
            onSuccess: () => setReplyMessage(''),
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleClose = () => {
        if (confirm('Are you sure you want to close this ticket?')) {
            router.post(`/alumni/support/${ticket.ticket_number}/close`);
        }
    };

    const canReply = ticket.status !== 'closed';
    const canClose = ['open', 'in_progress', 'resolved'].includes(ticket.status);

    return (
        <AlumniBaseLayout title={`Ticket #${ticket.ticket_number}`}>
            <Head title={`Ticket #${ticket.ticket_number}`} />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Ticket className="h-8 w-8 text-maroon-600 dark:text-maroon-400" />
                        <div>
                            <h1 className="text-2xl font-bold text-maroon-800 dark:text-maroon-200">
                                Ticket #{ticket.ticket_number}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">{ticket.subject}</p>
                        </div>
                    </div>
                    <Link href="/alumni/support">
                        <Button variant="outline" className="border-maroon-300 dark:border-maroon-600 text-maroon-700 dark:text-maroon-300 hover:bg-maroon-50 dark:hover:bg-maroon-900/30">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Tickets
                        </Button>
                    </Link>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                        {flash.error}
                    </div>
                )}

                {/* Ticket Info */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Ticket Details</CardTitle>
                            <div className="flex items-center gap-2">
                                {getStatusBadge(ticket.status)}
                                <Badge variant="outline">{getCategoryLabel(ticket.category)}</Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Submitted</p>
                                <p className="font-medium">
                                    {new Date(ticket.created_at).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                                <p className="font-medium">
                                    {new Date(ticket.updated_at).toLocaleString()}
                                </p>
                            </div>
                            {ticket.assigned_admin && (
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Assigned To</p>
                                    <p className="font-medium">{ticket.assigned_admin.name}</p>
                                </div>
                            )}
                            {ticket.resolved_at && (
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Resolved On</p>
                                    <p className="font-medium">
                                        {new Date(ticket.resolved_at).toLocaleString()}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Original Message */}
                        <div className="bg-beige-50 dark:bg-gray-800 rounded-lg p-4 border border-beige-200 dark:border-gray-700">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Original Request
                            </p>
                            <p className="whitespace-pre-wrap">{ticket.message}</p>
                        </div>

                        {/* Actions */}
                        {canClose && (
                            <div className="mt-4 flex justify-end">
                                <Button
                                    variant="outline"
                                    onClick={handleClose}
                                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Close Ticket
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Conversation */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                            <MessageCircle className="h-5 w-5 mr-2" />
                            Conversation ({ticket.replies.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {ticket.replies.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                                <p>No replies yet. We'll respond as soon as possible.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {ticket.replies.map((reply) => (
                                    <div
                                        key={reply.id}
                                        className={`p-4 rounded-lg ${reply.is_admin_reply
                                            ? 'bg-maroon-50 dark:bg-maroon-900/30 border border-maroon-200 dark:border-maroon-700 ml-4'
                                            : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mr-4'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                            <span className="font-medium">
                                                {reply.user.name}
                                                {reply.is_admin_reply && (
                                                    <Badge className="ml-2 bg-maroon-100 text-maroon-800 dark:bg-maroon-900/50 dark:text-maroon-300 dark:border-maroon-700" variant="outline">
                                                        Staff
                                                    </Badge>
                                                )}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                                                {new Date(reply.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                                            {reply.message}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Reply Form */}
                        {canReply ? (
                            <form onSubmit={handleReply} className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Add a Reply
                                </label>
                                <textarea
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-maroon-500 focus:border-maroon-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                    placeholder="Type your reply here..."
                                    required
                                />
                                <div className="flex justify-end mt-3">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || !replyMessage.trim()}
                                        className="bg-maroon-700 hover:bg-maroon-800 dark:bg-maroon-600 dark:hover:bg-maroon-700 text-white"
                                    >
                                        {isSubmitting ? (
                                            'Sending...'
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4 mr-2" />
                                                Send Reply
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
                                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                                <p>This ticket is closed. Please create a new ticket if you need further assistance.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AlumniBaseLayout>
    );
}
