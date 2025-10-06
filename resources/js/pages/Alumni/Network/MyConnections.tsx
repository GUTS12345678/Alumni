import React from 'react';
import { Head } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Users, UserCheck, UserX } from 'lucide-react';

export default function MyConnections() {
    return (
        <AlumniBaseLayout title="My Connections">
            <Head title="My Connections" />

            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center space-x-3">
                    <Users className="h-8 w-8 text-maroon-600" />
                    <div>
                        <h1 className="text-3xl font-bold text-maroon-800">My Connections</h1>
                        <p className="text-gray-600">Manage your alumni connections</p>
                    </div>
                </div>

                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800 flex items-center">
                            <Users className="h-5 w-5 mr-2" />
                            Your Connections
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12">
                            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                No Connections Yet
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Start connecting with other alumni from the directory
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AlumniBaseLayout>
    );
}
