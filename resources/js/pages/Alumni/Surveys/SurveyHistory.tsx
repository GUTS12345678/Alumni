import React from 'react';
import { Head } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, FileText, CheckCircle, Clock } from 'lucide-react';

export default function SurveyHistory() {
    return (
        <AlumniBaseLayout title="Survey History">
            <Head title="Survey History" />

            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center space-x-3">
                    <History className="h-8 w-8 text-maroon-600" />
                    <div>
                        <h1 className="text-3xl font-bold text-maroon-800">Survey History</h1>
                        <p className="text-gray-600">View your completed surveys and responses</p>
                    </div>
                </div>

                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800 flex items-center">
                            <FileText className="h-5 w-5 mr-2" />
                            Completed Surveys
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12">
                            <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                No Survey History Yet
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Your completed surveys will appear here
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AlumniBaseLayout>
    );
}
