import React from 'react';
import { Head } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Users, UserPlus, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Mentorship() {
    return (
        <AlumniBaseLayout title="Mentorship Program">
            <Head title="Mentorship Program" />

            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center space-x-3">
                    <Heart className="h-8 w-8 text-maroon-600" />
                    <div>
                        <h1 className="text-3xl font-bold text-maroon-800">Mentorship Program</h1>
                        <p className="text-gray-600">Connect with mentors or become a mentor</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl text-maroon-800 flex items-center">
                                <Users className="h-5 w-5 mr-2" />
                                Find a Mentor
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">
                                <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                <h3 className="text-md font-semibold text-gray-700 mb-2">
                                    Connect with Mentors
                                </h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Find experienced alumni to guide your career
                                </p>
                                <Button variant="outline" className="border-maroon-300 text-maroon-700 hover:bg-maroon-50">
                                    Browse Mentors
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl text-maroon-800 flex items-center">
                                <Heart className="h-5 w-5 mr-2" />
                                Become a Mentor
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">
                                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                <h3 className="text-md font-semibold text-gray-700 mb-2">
                                    Share Your Experience
                                </h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Help other alumni grow in their careers
                                </p>
                                <Button className="bg-maroon-700 hover:bg-maroon-800 text-white">
                                    Sign Up as Mentor
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AlumniBaseLayout>
    );
}
