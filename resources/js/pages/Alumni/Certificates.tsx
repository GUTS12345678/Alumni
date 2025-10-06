import React from 'react';
import { Head } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, FileText, Download } from 'lucide-react';

export default function Certificates() {
    return (
        <AlumniBaseLayout title="Certificates">
            <Head title="Certificates" />

            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center space-x-3">
                    <Award className="h-8 w-8 text-maroon-600" />
                    <div>
                        <h1 className="text-3xl font-bold text-maroon-800">My Certificates</h1>
                        <p className="text-gray-600">Download and manage your certificates</p>
                    </div>
                </div>

                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800 flex items-center">
                            <FileText className="h-5 w-5 mr-2" />
                            Available Certificates
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12">
                            <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                No Certificates Available
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Complete surveys and activities to earn certificates
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AlumniBaseLayout>
    );
}
