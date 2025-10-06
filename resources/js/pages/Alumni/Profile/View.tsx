import React from 'react';
import { Head } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';

export default function ProfileView() {
    return (
        <AlumniBaseLayout title="My Profile">
            <Head title="My Profile" />
            
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-maroon-800">My Profile</h1>
                <p className="text-maroon-600 mt-2">View your complete profile information</p>
            </div>

            <Card className="border-beige-200 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center text-maroon-800">
                        <User className="h-6 w-6 mr-2" />
                        Profile View
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <p className="text-gray-600 text-lg mb-4">
                            📊 Profile View Page - Coming Soon
                        </p>
                        <p className="text-gray-500">
                            This page will display your complete profile information.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </AlumniBaseLayout>
    );
}
