import React, { useState } from 'react';
import { Head, router, usePage, Link } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    HelpCircle,
    Mail,
    Phone,
    MessageCircle,
    Building2,
    Clock,
    MapPin,
    Send,
    Headphones,
    Users,
    FileQuestion,
    ExternalLink,
    Ticket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface SupportTicket {
    category: string;
    subject: string;
    message: string;
}

export default function Help() {
    const { auth, flash } = usePage().props as any;
    const [showTicketForm, setShowTicketForm] = useState(false);
    const [ticketData, setTicketData] = useState<SupportTicket>({
        category: 'general',
        subject: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmitTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post('/alumni/support/ticket', ticketData, {
            onSuccess: () => {
                setShowTicketForm(false);
                setTicketData({ category: 'general', subject: '', message: '' });
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const supportCategories = [
        { value: 'general', label: 'General Inquiry' },
        { value: 'technical', label: 'Technical Issue' },
        { value: 'account', label: 'Account Problem' },
        { value: 'employment', label: 'Employment/Career' },
        { value: 'alumni_association', label: 'Alumni Association' },
        { value: 'other', label: 'Other' },
    ];

    return (
        <AlumniBaseLayout title="Help & Support">
            <Head title="Help & Support" />

            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-maroon-800 dark:text-maroon-200">Help & Support</h1>
                        <p className="text-maroon-600 dark:text-maroon-400 mt-2">Get assistance, contact the Alumni Association, or submit a support request</p>
                    </div>
                    <Link href="/alumni/support">
                        <Button variant="outline" className="border-maroon-300 dark:border-maroon-600 text-maroon-700 dark:text-maroon-300 hover:bg-maroon-50 dark:hover:bg-maroon-900/30">
                            <Ticket className="h-4 w-4 mr-2" />
                            My Tickets
                        </Button>
                    </Link>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-300 px-4 py-3 rounded">
                        {flash.success}
                    </div>
                )}

                {/* Alumni Association Contact Card - Prominent */}
                <Card className="border-maroon-200 dark:border-maroon-700 bg-gradient-to-br from-maroon-50 to-beige-50 dark:from-maroon-950/30 dark:to-gray-800 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center text-maroon-800 dark:text-maroon-200 text-xl">
                            <Building2 className="h-6 w-6 mr-3" />
                            EARIST Alumni Association
                        </CardTitle>
                        <CardDescription className="text-maroon-600 dark:text-maroon-400">
                            Connect with the Alumni Association for membership, events, and alumni-related concerns
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Mail className="h-5 w-5 text-maroon-600 dark:text-maroon-400 mt-1" />
                                    <div>
                                        <p className="font-semibold text-maroon-800 dark:text-maroon-200">Email</p>
                                        <a
                                            href="mailto:alumni@earist.edu.ph"
                                            className="text-maroon-600 dark:text-maroon-400 hover:underline"
                                        >
                                            alumni@earist.edu.ph
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="h-5 w-5 text-maroon-600 dark:text-maroon-400 mt-1" />
                                    <div>
                                        <p className="font-semibold text-maroon-800 dark:text-maroon-200">Phone</p>
                                        <p className="text-gray-600 dark:text-gray-400">(02) 8735-6161 local 215</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-maroon-600 dark:text-maroon-400 mt-1" />
                                    <div>
                                        <p className="font-semibold text-maroon-800 dark:text-maroon-200">Office Location</p>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Alumni Relations Office<br />
                                            2nd Floor, Admin Building<br />
                                            EARIST Main Campus
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Clock className="h-5 w-5 text-maroon-600 dark:text-maroon-400 mt-1" />
                                    <div>
                                        <p className="font-semibold text-maroon-800 dark:text-maroon-200">Office Hours</p>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Monday - Friday: 8:00 AM - 5:00 PM<br />
                                            Saturday: 8:00 AM - 12:00 PM<br />
                                            Sunday: Closed
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Users className="h-5 w-5 text-maroon-600 dark:text-maroon-400 mt-1" />
                                    <div>
                                        <p className="font-semibold text-maroon-800 dark:text-maroon-200">Social Media</p>
                                        <div className="flex gap-2 mt-2">
                                            <a
                                                href="https://facebook.com/EARISTAlumniAssociation"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                            >
                                                Facebook <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-maroon-200 dark:border-maroon-700">
                            <Button
                                onClick={() => {
                                    setTicketData({ ...ticketData, category: 'alumni_association' });
                                    setShowTicketForm(true);
                                }}
                                className="bg-maroon-700 hover:bg-maroon-800 dark:bg-maroon-600 dark:hover:bg-maroon-700 text-white"
                            >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Contact Alumni Association
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Quick Support */}
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center text-maroon-800 dark:text-maroon-200">
                                <Headphones className="h-6 w-6 mr-2" />
                                Technical Support
                            </CardTitle>
                            <CardDescription>
                                Having issues with the system? Get help here
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button
                                variant="outline"
                                className="w-full justify-start border-maroon-200 dark:border-maroon-700 hover:bg-maroon-50 dark:hover:bg-maroon-900/30"
                                onClick={() => window.location.href = 'mailto:support@earist-alumni.edu.ph'}
                            >
                                <Mail className="h-4 w-4 mr-2 text-maroon-600 dark:text-maroon-400" />
                                support@earist-alumni.edu.ph
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start border-maroon-200 dark:border-maroon-700 hover:bg-maroon-50 dark:hover:bg-maroon-900/30"
                                onClick={() => {
                                    setTicketData({ ...ticketData, category: 'technical' });
                                    setShowTicketForm(true);
                                }}
                            >
                                <Send className="h-4 w-4 mr-2 text-maroon-600 dark:text-maroon-400" />
                                Submit Support Ticket
                            </Button>
                        </CardContent>
                    </Card>

                    {/* FAQ */}
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center text-maroon-800 dark:text-maroon-200">
                                <FileQuestion className="h-6 w-6 mr-2" />
                                Frequently Asked Questions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="p-3 bg-beige-50 dark:bg-gray-800 rounded-lg">
                                    <h4 className="font-semibold text-maroon-800 dark:text-maroon-200 mb-1">How do I update my profile?</h4>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">Navigate to Dashboard → Edit Profile to update your personal information.</p>
                                </div>
                                <div className="p-3 bg-beige-50 dark:bg-gray-800 rounded-lg">
                                    <h4 className="font-semibold text-maroon-800 dark:text-maroon-200 mb-1">How do I complete surveys?</h4>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">Go to My Surveys and click on available surveys to participate.</p>
                                </div>
                                <div className="p-3 bg-beige-50 dark:bg-gray-800 rounded-lg">
                                    <h4 className="font-semibold text-maroon-800 dark:text-maroon-200 mb-1">How do I add my career history?</h4>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">Visit Career Timeline to add and manage your employment history.</p>
                                </div>
                                <div className="p-3 bg-beige-50 dark:bg-gray-800 rounded-lg">
                                    <h4 className="font-semibold text-maroon-800 dark:text-maroon-200 mb-1">How do I become a member of the Alumni Association?</h4>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">Contact the Alumni Association office or use the contact form above.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Support Ticket Form Modal */}
                {showTicketForm && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
                                <h2 className="text-xl font-bold text-maroon-800 dark:text-maroon-200">Submit Support Request</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">We'll get back to you as soon as possible</p>
                            </div>

                            <form onSubmit={handleSubmitTicket} className="p-6 space-y-4">
                                <div>
                                    <Label htmlFor="category">Category</Label>
                                    <select
                                        id="category"
                                        value={ticketData.category}
                                        onChange={(e) => setTicketData({ ...ticketData, category: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                    >
                                        {supportCategories.map((cat) => (
                                            <option key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <Label htmlFor="subject">Subject *</Label>
                                    <Input
                                        id="subject"
                                        value={ticketData.subject}
                                        onChange={(e) => setTicketData({ ...ticketData, subject: e.target.value })}
                                        placeholder="Brief description of your request"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="message">Message *</Label>
                                    <textarea
                                        id="message"
                                        value={ticketData.message}
                                        onChange={(e) => setTicketData({ ...ticketData, message: e.target.value })}
                                        rows={5}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        placeholder="Please provide details about your request or concern..."
                                        required
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowTicketForm(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-maroon-700 hover:bg-maroon-800 dark:bg-maroon-600 dark:hover:bg-maroon-700 text-white"
                                    >
                                        {isSubmitting ? (
                                            <>Submitting...</>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4 mr-2" />
                                                Submit Request
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AlumniBaseLayout>
    );
}
