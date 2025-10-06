import React from 'react';
import { Head } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Send, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Messages() {
    return (
        <AlumniBaseLayout title="Messages">
            <Head title="Messages" />

            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <MessageCircle className="h-8 w-8 text-maroon-600" />
                        <div>
                            <h1 className="text-3xl font-bold text-maroon-800">Messages</h1>
                            <p className="text-gray-600">Chat with your connections</p>
                        </div>
                    </div>
                    <Button className="bg-maroon-700 hover:bg-maroon-800 text-white">
                        <Send className="h-4 w-4 mr-2" />
                        New Message
                    </Button>
                </div>

                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800 flex items-center">
                            <Inbox className="h-5 w-5 mr-2" />
                            Messages
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12">
                            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                No Messages Yet
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Connect with alumni to start messaging
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AlumniBaseLayout>
    );
}
