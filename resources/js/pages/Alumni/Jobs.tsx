import React from 'react';
import { Head } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Search, MapPin, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Jobs() {
    return (
        <AlumniBaseLayout title="Job Board">
            <Head title="Job Board" />

            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center space-x-3">
                    <Briefcase className="h-8 w-8 text-maroon-600" />
                    <div>
                        <h1 className="text-3xl font-bold text-maroon-800">Job Board</h1>
                        <p className="text-gray-600">Find opportunities shared by alumni</p>
                    </div>
                </div>

                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800">Search Jobs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4 mb-6">
                            <div className="flex-1">
                                <Input 
                                    placeholder="Search job titles, companies..." 
                                    className="border-beige-300"
                                />
                            </div>
                            <Button className="bg-maroon-700 hover:bg-maroon-800 text-white">
                                <Search className="h-4 w-4 mr-2" />
                                Search
                            </Button>
                        </div>

                        <div className="text-center py-12">
                            <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                No Job Postings Available
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Check back later for new opportunities
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AlumniBaseLayout>
    );
}
