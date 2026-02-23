import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    History,
    User,
    Briefcase,
    Archive,
    ArrowLeft,
    Calendar,
    Building,
    MapPin,
    Eye,
    RotateCcw,
    Clock
} from 'lucide-react';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface CareerVersion {
    id: number;
    version_number: number;
    action_type: string;
    created_at: string;
}

interface CareerHistory {
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
    deleted_at?: string;
    created_at: string;
    updated_at: string;
    duration_formatted?: string;
    versions: CareerVersion[];
}

interface AlumniUser {
    id: number;
    name: string;
    email: string;
}

interface Props {
    alumniUser: AlumniUser;
    careerHistories: CareerHistory[];
}

export default function CareerVersionsShow({ alumniUser, careerHistories }: Props) {
    const { confirm, confirmState, handleConfirm, handleCancel } = useConfirmDialog();
    const employmentTypes: Record<string, string> = {
        full_time: 'Full Time',
        part_time: 'Part Time',
        contract: 'Contract',
        freelance: 'Freelance',
        internship: 'Internship',
    };

    const handleRestore = async (careerId: number) => {
        const ok = await confirm({ title: 'Restore Career Record', message: 'Are you sure you want to restore this career record?', confirmLabel: 'Restore' });
        if (ok) {
            router.post(`/api/v1/admin/super-admin/career-versions/career/${careerId}/restore`);
        }
    };

    const activePositions = careerHistories.filter(c => !c.deleted_at);
    const archivedPositions = careerHistories.filter(c => c.deleted_at);

    return (
        <AdminBaseLayout>
            <Head title={`Career History - ${alumniUser.name}`} />

            <div className="max-w-7xl mx-auto space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <User className="h-8 w-8 text-maroon-600" />
                        <div>
                            <h1 className="text-3xl font-bold text-maroon-800">{alumniUser.name}</h1>
                            <p className="text-gray-600">{alumniUser.email}</p>
                        </div>
                    </div>
                    <Link href="/super-admin/career-versions">
                        <Button variant="outline" className="border-maroon-300 text-maroon-700 hover:bg-maroon-50">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to List
                        </Button>
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Records</p>
                                    <p className="text-2xl font-bold text-maroon-800">{careerHistories.length}</p>
                                </div>
                                <Briefcase className="h-8 w-8 text-maroon-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Active Positions</p>
                                    <p className="text-2xl font-bold text-green-600">{activePositions.length}</p>
                                </div>
                                <Briefcase className="h-8 w-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Archived</p>
                                    <p className="text-2xl font-bold text-amber-600">{archivedPositions.length}</p>
                                </div>
                                <Archive className="h-8 w-8 text-amber-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Active Positions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-green-700">
                            <Briefcase className="h-5 w-5 mr-2" />
                            Active Positions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activePositions.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No active positions</p>
                        ) : (
                            <div className="space-y-4">
                                {activePositions.map((career) => (
                                    <div
                                        key={career.id}
                                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {career.job_title}
                                                    </h3>
                                                    {career.is_current && (
                                                        <Badge className="bg-green-100 text-green-800">Current</Badge>
                                                    )}
                                                    {career.employment_type && (
                                                        <Badge variant="outline">
                                                            {employmentTypes[career.employment_type] || career.employment_type}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600 mb-1">
                                                    <Building className="h-4 w-4" />
                                                    {career.company_name}
                                                </div>
                                                {career.company_location && (
                                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                                        <MapPin className="h-3 w-3" />
                                                        {career.company_location}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-gray-500 text-sm mt-2">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(career.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                    {' - '}
                                                    {career.is_current ? 'Present' : career.end_date
                                                        ? new Date(career.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                                        : 'Present'}
                                                    {career.duration_formatted && (
                                                        <span className="text-gray-400">({career.duration_formatted})</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs">
                                                    <History className="h-3 w-3 mr-1" />
                                                    {career.versions?.length || 0} versions
                                                </Badge>
                                                <Link href={`/super-admin/career-versions/career/${career.id}`}>
                                                    <Button size="sm" variant="outline">
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        View History
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Archived Positions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-amber-700">
                            <Archive className="h-5 w-5 mr-2" />
                            Archived Positions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {archivedPositions.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No archived positions</p>
                        ) : (
                            <div className="space-y-4">
                                {archivedPositions.map((career) => (
                                    <div
                                        key={career.id}
                                        className="bg-gray-50 border border-gray-200 rounded-lg p-4 opacity-80"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-700">
                                                        {career.job_title}
                                                    </h3>
                                                    <Badge className="bg-gray-200 text-gray-600">Archived</Badge>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600 mb-1">
                                                    <Building className="h-4 w-4" />
                                                    {career.company_name}
                                                </div>
                                                {career.archived_reason && (
                                                    <p className="text-sm text-gray-500 mt-2">
                                                        <span className="font-medium">Reason:</span> {career.archived_reason}
                                                    </p>
                                                )}
                                                {career.deleted_at && (
                                                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        Archived: {new Date(career.deleted_at).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Link href={`/super-admin/career-versions/career/${career.id}`}>
                                                    <Button size="sm" variant="outline">
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        View History
                                                    </Button>
                                                </Link>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleRestore(career.id)}
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    <RotateCcw className="h-4 w-4 mr-1" />
                                                    Restore
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <ConfirmDialog open={confirmState.open} title={confirmState.title} message={confirmState.message} confirmLabel={confirmState.confirmLabel} cancelLabel={confirmState.cancelLabel} variant={confirmState.variant} onConfirm={handleConfirm} onCancel={handleCancel} />
        </AdminBaseLayout>
    );
}
