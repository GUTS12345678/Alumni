import React from 'react';
import { Head } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Search, Filter, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AlumniDirectory() {
    return (
        <AlumniBaseLayout title="Alumni Network">
            <Head title="Alumni Network" />

            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center space-x-3">
                    <Users className="h-8 w-8 text-maroon-600" />
                    <div>
                        <h1 className="text-3xl font-bold text-maroon-800">Alumni Network</h1>
                        <p className="text-gray-600">Connect with fellow alumni</p>
                    </div>
                </div>

                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800">Find Alumni</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4 mb-6">
                            <div className="flex-1">
                                <Input 
                                    placeholder="Search by name, company, industry..." 
                                    className="border-beige-300"
                                />
                            </div>
                            <Button variant="outline" className="border-maroon-300 text-maroon-700">
                                <Filter className="h-4 w-4 mr-2" />
                                Filters
                            </Button>
                            <Button className="bg-maroon-700 hover:bg-maroon-800 text-white">
                                <Search className="h-4 w-4 mr-2" />
                                Search
                            </Button>
                        </div>

                        <div className="text-center py-12">
                            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                Alumni Directory Coming Soon
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Connect with alumni from your batch and beyond
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AlumniBaseLayout>
    );
}
