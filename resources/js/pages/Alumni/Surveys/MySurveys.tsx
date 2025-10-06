import React from 'react';
import { Head } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function MySurveys() {
    return (
        <AlumniBaseLayout title="My Surveys">
            <Head title="My Surveys" />
            
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-maroon-800">My Surveys</h1>
                <p className="text-maroon-600 mt-2">View and complete available surveys</p>
            </div>

            <Card className="border-beige-200 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center text-maroon-800">
                        <FileText className="h-6 w-6 mr-2" />
                        Available Surveys
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <p className="text-gray-600 text-lg mb-4">
                            📋 Survey Management Page - Coming Soon
                        </p>
                        <p className="text-gray-500">
                            This page will display all available surveys for you to complete.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </AlumniBaseLayout>
    );
}
