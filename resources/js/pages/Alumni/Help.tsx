import React from 'react';
import { Head, router } from '@inertiajs/react';
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
    Headphones,
    Users,
    FileQuestion,
    ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Help() {
    return (
        <AlumniBaseLayout title="Help & Support">
            <Head title="Help & Support" />

            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-maroon-800 dark:text-maroon-200">Help & Support</h1>
                        <p className="text-maroon-600 dark:text-maroon-400 mt-2">Get assistance or contact the Alumni Association</p>
                    </div>
                </div>

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
                                onClick={() => router.visit('/alumni/messages')}
                                className="bg-maroon-700 hover:bg-maroon-800 dark:bg-maroon-600 dark:hover:bg-maroon-700 text-white"
                            >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Message Admin / Alumni Association
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
                                onClick={() => router.visit('/alumni/messages')}
                            >
                                <MessageCircle className="h-4 w-4 mr-2 text-maroon-600 dark:text-maroon-400" />
                                Message an Admin
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

            </div>
        </AlumniBaseLayout>
    );
}
