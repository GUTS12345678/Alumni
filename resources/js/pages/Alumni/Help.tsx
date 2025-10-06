import React from 'react';
import { Head } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, Mail, Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Help() {
    return (
        <AlumniBaseLayout title="Help & Support">
            <Head title="Help & Support" />
            
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-maroon-800">Help & Support</h1>
                <p className="text-maroon-600 mt-2">Get assistance and find answers to your questions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center text-maroon-800">
                            <HelpCircle className="h-6 w-6 mr-2" />
                            Quick Support
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button variant="outline" className="w-full justify-start">
                            <Mail className="h-4 w-4 mr-2" />
                            Email Support: support@alumni.edu
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                            <Phone className="h-4 w-4 mr-2" />
                            Phone: +1 (555) 123-4567
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Live Chat (Coming Soon)
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-maroon-800">Frequently Asked Questions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div>
                                <h4 className="font-semibold text-maroon-800 mb-1">How do I update my profile?</h4>
                                <p className="text-gray-600 text-sm">Navigate to Dashboard → Edit Profile</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-maroon-800 mb-1">How do I complete surveys?</h4>
                                <p className="text-gray-600 text-sm">Go to My Surveys and click on available surveys</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-maroon-800 mb-1">How do I connect with alumni?</h4>
                                <p className="text-gray-600 text-sm">Use the Alumni Network feature to search and connect</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AlumniBaseLayout>
    );
}
