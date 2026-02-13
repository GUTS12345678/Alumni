import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    History,
    ArrowLeft,
    Building,
    User,
    Clock,
    Edit,
    Plus,
    Archive,
    RotateCcw,
    ArrowRight,
    FileText
} from 'lucide-react';

interface ModifiedBy {
    id: number;
    name: string;
    email: string;
}

interface Version {
    id: number;
    version_number: number;
    action_type: 'created' | 'updated' | 'archived' | 'restored';
    job_title: string;
    company_name: string;
    company_location?: string;
    employment_type?: string;
    job_description?: string;
    start_date: string;
    end_date?: string;
    is_current: boolean;
    industry?: string;
    skills_used?: string[];
    achievements?: string[];
    salary?: number;
    salary_currency?: string;
    changes?: Record<string, { old: unknown; new: unknown }>;
    change_notes?: string;
    created_at: string;
    modified_by?: ModifiedBy;
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
    deleted_at?: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
}

interface Props {
    careerHistory: CareerHistory;
    versions: Version[];
}

export default function CareerVersionsHistory({ careerHistory, versions }: Props) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    const getActionIcon = (actionType: string) => {
        switch (actionType) {
            case 'created':
                return <Plus className="h-4 w-4 text-green-600" />;
            case 'updated':
                return <Edit className="h-4 w-4 text-blue-600" />;
            case 'archived':
                return <Archive className="h-4 w-4 text-amber-600" />;
            case 'restored':
                return <RotateCcw className="h-4 w-4 text-purple-600" />;
            default:
                return <FileText className="h-4 w-4 text-gray-600" />;
        }
    };

    const getActionColor = (actionType: string) => {
        switch (actionType) {
            case 'created':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'updated':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'archived':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'restored':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatFieldName = (field: string) => {
        return field
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    };

    const formatValue = (value: unknown) => {
        if (value === null || value === undefined) return <span className="text-gray-400 italic">None</span>;
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : <span className="text-gray-400 italic">None</span>;
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    };

    return (
        <AdminBaseLayout>
            <Head title={`Version History - ${careerHistory.job_title}`} />

            <div className="max-w-7xl mx-auto space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <History className="h-8 w-8 text-maroon-600" />
                        <div>
                            <h1 className="text-3xl font-bold text-maroon-800">Version History</h1>
                            <p className="text-gray-600">
                                {careerHistory.job_title} at {careerHistory.company_name}
                            </p>
                        </div>
                    </div>
                    <Link href={`/super-admin/career-versions/user/${careerHistory.user.id}`}>
                        <Button variant="outline" className="border-maroon-300 text-maroon-700 hover:bg-maroon-50">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to User
                        </Button>
                    </Link>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
                        {flash.success}
                    </div>
                )}

                {/* Current Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center">
                                <Building className="h-5 w-5 mr-2" />
                                Current Status
                            </span>
                            {careerHistory.deleted_at ? (
                                <Badge className="bg-amber-100 text-amber-800">Archived</Badge>
                            ) : (
                                <Badge className="bg-green-100 text-green-800">Active</Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Position</p>
                                <p className="font-semibold">{careerHistory.job_title}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Company</p>
                                <p className="font-semibold">{careerHistory.company_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">User</p>
                                <p className="font-semibold">{careerHistory.user.name}</p>
                                <p className="text-sm text-gray-500">{careerHistory.user.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Versions</p>
                                <p className="font-semibold">{versions.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Version Timeline */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <History className="h-5 w-5 mr-2" />
                            Change History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {versions.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No version history available</p>
                        ) : (
                            <div className="space-y-6">
                                {versions.map((version) => (
                                    <div
                                        key={version.id}
                                        className="relative pl-8 pb-6 border-l-2 border-gray-200 last:border-0"
                                    >
                                        {/* Timeline dot */}
                                        <div className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow ${version.action_type === 'created' ? 'bg-green-500' :
                                            version.action_type === 'updated' ? 'bg-blue-500' :
                                                version.action_type === 'archived' ? 'bg-amber-500' :
                                                    version.action_type === 'restored' ? 'bg-purple-500' : 'bg-gray-500'
                                            }`} />

                                        <div className={`border rounded-lg p-4 ${getActionColor(version.action_type)}`}>
                                            {/* Version Header */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    {getActionIcon(version.action_type)}
                                                    <Badge className={getActionColor(version.action_type)}>
                                                        Version {version.version_number}: {version.action_type.charAt(0).toUpperCase() + version.action_type.slice(1)}
                                                    </Badge>
                                                </div>
                                                <span className="text-sm text-gray-600 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(version.created_at).toLocaleString()}
                                                </span>
                                            </div>

                                            {/* Modified By */}
                                            {version.modified_by && (
                                                <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    By: {version.modified_by.name} ({version.modified_by.email})
                                                </p>
                                            )}

                                            {/* Change Notes */}
                                            {version.change_notes && (
                                                <p className="text-sm bg-white/50 rounded p-2 mb-3">
                                                    <span className="font-medium">Notes:</span> {version.change_notes}
                                                </p>
                                            )}

                                            {/* Changes (for updates) */}
                                            {version.action_type === 'updated' && version.changes && Object.keys(version.changes).length > 0 && (
                                                <div className="bg-white/50 rounded p-3 mt-3">
                                                    <p className="font-medium text-sm mb-2">Changes Made:</p>
                                                    <div className="space-y-2">
                                                        {Object.entries(version.changes).map(([field, change]) => (
                                                            <div key={field} className="text-sm flex items-start gap-2">
                                                                <span className="font-medium min-w-[120px]">{formatFieldName(field)}:</span>
                                                                <span className="text-red-600 line-through">{formatValue(change.old)}</span>
                                                                <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                                <span className="text-green-600">{formatValue(change.new)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Snapshot Data (for created/archived) */}
                                            {(version.action_type === 'created' || version.action_type === 'archived') && (
                                                <div className="bg-white/50 rounded p-3 mt-3">
                                                    <p className="font-medium text-sm mb-2">
                                                        {version.action_type === 'created' ? 'Initial Data:' : 'Data at Archive:'}
                                                    </p>
                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                        <div><span className="font-medium">Title:</span> {version.job_title}</div>
                                                        <div><span className="font-medium">Company:</span> {version.company_name}</div>
                                                        {version.company_location && (
                                                            <div><span className="font-medium">Location:</span> {version.company_location}</div>
                                                        )}
                                                        {version.employment_type && (
                                                            <div><span className="font-medium">Type:</span> {version.employment_type}</div>
                                                        )}
                                                        <div><span className="font-medium">Start:</span> {new Date(version.start_date).toLocaleDateString()}</div>
                                                        {version.end_date && (
                                                            <div><span className="font-medium">End:</span> {new Date(version.end_date).toLocaleDateString()}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminBaseLayout>
    );
}
