import React from 'react';
import { Head, router, usePage, Link } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Archive, Calendar, MapPin, RotateCcw, Building, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ArchivedCareer {
    id: number;
    job_title: string;
    company_name: string;
    company_location?: string;
    employment_type?: string;
    start_date: string;
    end_date?: string;
    is_current: boolean;
    industry?: string;
    archived_reason?: string;
    deleted_at: string;
    duration_formatted?: string;
}

interface Props {
    archivedCareers: ArchivedCareer[];
}

export default function ArchivedCareers({ archivedCareers }: Props) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    const employmentTypes: Record<string, string> = {
        full_time: 'Full Time',
        part_time: 'Part Time',
        contract: 'Contract',
        freelance: 'Freelance',
        internship: 'Internship',
    };

    const handleRestore = (id: number) => {
        router.post(`/alumni/career/${id}/restore`, {}, {
            onSuccess: () => {
                // Success handled by flash message
            },
        });
    };

    return (
        <AlumniBaseLayout title="Archived Positions">
            <Head title="Archived Positions" />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Archive className="h-8 w-8 text-maroon-600 dark:text-maroon-400" />
                        <div>
                            <h1 className="text-3xl font-bold text-maroon-800 dark:text-maroon-200">Archived Positions</h1>
                            <p className="text-gray-600 dark:text-gray-400">View and restore your archived career history</p>
                        </div>
                    </div>
                    <Link href="/alumni/career">
                        <Button variant="outline" className="border-maroon-300 dark:border-maroon-600 text-maroon-700 dark:text-maroon-300 hover:bg-maroon-50 dark:hover:bg-maroon-900/30">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Timeline
                        </Button>
                    </Link>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-300 px-4 py-3 rounded">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-300 px-4 py-3 rounded">
                        {flash.error}
                    </div>
                )}

                {/* Archived Positions */}
                <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800 dark:text-maroon-200 flex items-center">
                            <Archive className="h-5 w-5 mr-2" />
                            Archived Employment History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {archivedCareers.length === 0 ? (
                            <div className="text-center py-12">
                                <Archive className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    No Archived Positions
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    You haven't archived any career positions yet.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {archivedCareers.map((career) => (
                                    <div
                                        key={career.id}
                                        className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 opacity-75 hover:opacity-100 transition-opacity"
                                    >
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                                                        {career.job_title}
                                                    </h3>
                                                    <Badge className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                                        Archived
                                                    </Badge>
                                                    {career.employment_type && (
                                                        <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                                                            {employmentTypes[career.employment_type] || career.employment_type}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-lg text-gray-600 dark:text-gray-400 font-medium flex items-center gap-2">
                                                    <Building className="h-4 w-4" />
                                                    {career.company_name}
                                                </p>
                                                {career.company_location && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-500 flex items-center gap-2 mt-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {career.company_location}
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => handleRestore(career.id)}
                                                className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white"
                                            >
                                                <RotateCcw className="h-4 w-4 mr-2" />
                                                Restore
                                            </Button>
                                        </div>

                                        {/* Duration */}
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                                            <Calendar className="h-4 w-4" />
                                            <span>
                                                {new Date(career.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                {' - '}
                                                {career.end_date
                                                    ? new Date(career.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                                    : 'Present'
                                                }
                                            </span>
                                            {career.duration_formatted && (
                                                <>
                                                    <span className="text-gray-400 dark:text-gray-500">•</span>
                                                    <span>{career.duration_formatted}</span>
                                                </>
                                            )}
                                        </div>

                                        {/* Archive Info */}
                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                <span className="font-medium">Archived on:</span>{' '}
                                                {new Date(career.deleted_at).toLocaleDateString('en-US', {
                                                    month: 'long',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                            {career.archived_reason && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                    <span className="font-medium">Reason:</span>{' '}
                                                    {career.archived_reason}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Info Note */}
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                        <strong>Note:</strong> Archived positions are not permanently deleted. You can restore them at any time.
                        All changes to your career history are tracked and can be reviewed by administrators for data integrity purposes.
                    </p>
                </div>
            </div>
        </AlumniBaseLayout>
    );
}
