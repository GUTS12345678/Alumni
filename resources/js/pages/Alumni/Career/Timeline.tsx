import React from 'react';
import { Head } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Briefcase, Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CareerTimeline() {
    return (
        <AlumniBaseLayout title="Career Timeline">
            <Head title="Career Timeline" />

            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <TrendingUp className="h-8 w-8 text-maroon-600" />
                        <div>
                            <h1 className="text-3xl font-bold text-maroon-800">Career Timeline</h1>
                            <p className="text-gray-600">Track your professional journey</p>
                        </div>
                    </div>
                    <Button className="bg-maroon-700 hover:bg-maroon-800 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Position
                    </Button>
                </div>

                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800 flex items-center">
                            <Briefcase className="h-5 w-5 mr-2" />
                            Employment History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12">
                            <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                No Career History Yet
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Add your work experience to build your career timeline
                            </p>
                            <Button className="bg-maroon-700 hover:bg-maroon-800 text-white">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Position
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AlumniBaseLayout>
    );
}
