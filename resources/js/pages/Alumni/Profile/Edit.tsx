import React from 'react';
import { Head } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function ProfileEdit() {
    return (
        <AlumniBaseLayout title="Edit Profile">
            <Head title="Edit Profile" />
            
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-maroon-800">Edit Profile</h1>
                <p className="text-maroon-600 mt-2">Update your personal information</p>
            </div>

            <Card className="border-beige-200 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center text-maroon-800">
                        <Settings className="h-6 w-6 mr-2" />
                        Edit Profile Form
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <p className="text-gray-600 text-lg mb-4">
                            ✏️ Edit Profile Page - Coming Soon
                        </p>
                        <p className="text-gray-500">
                            This page will allow you to update your profile information.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </AlumniBaseLayout>
    );
}
