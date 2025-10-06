import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Database,
    Download,
    Upload,
    RefreshCw,
    Calendar,
    FileText,
    HardDrive,
    Clock,
    CheckCircle,
    AlertCircle,
    Trash2,
    Shield
} from 'lucide-react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';

interface BackupFile {
    id: string;
    filename: string;
    size: string;
    created_at: string;
    type: 'full' | 'partial' | 'structure';
    status: 'completed' | 'in_progress' | 'failed';
    download_url?: string;
}

interface SystemInfo {
    database_size: string;
    total_tables: number;
    total_records: number;
    last_backup: string;
    available_space: string;
    backup_directory: string;
}

export default function BackupManagement() {
    const [backups, setBackups] = useState<BackupFile[]>([]);
    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Helper function to get CSRF token from cookie
    const getCsrfToken = () => {
        const csrfCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1];
        return csrfCookie ? decodeURIComponent(csrfCookie) : '';
    };

    const fetchBackupData = async () => {
        try {
            setLoading(true);

            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const [backupsResponse, systemResponse] = await Promise.all([
                fetch('/api/v1/admin/backups', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                }),
                fetch('/api/v1/admin/system/info', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                })
            ]);

            if (!backupsResponse.ok || !systemResponse.ok) {
                if (backupsResponse.status === 401 || systemResponse.status === 401) {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    return;
                }
                throw new Error('Failed to fetch backup data');
            }

            const backupsData = await backupsResponse.json();
            const systemData = await systemResponse.json();

            if (backupsData.success) {
                setBackups(backupsData.data);
            }

            if (systemData.success) {
                setSystemInfo(systemData.data);
            }
        } catch (err) {
            console.error('Backup fetch error:', err);
            setError('Failed to load backup data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBackupData();
    }, []);

    const createBackup = async (type: 'full' | 'partial' | 'structure') => {
        try {
            setCreating(true);
            setError(null);

            const token = localStorage.getItem('auth_token');

            const response = await fetch('/api/v1/admin/backups', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ type }),
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                alert(`✅ Backup created successfully!\n\nFilename: ${result.data.filename}\nSize: ${result.data.size}\nType: ${result.data.type}`);
                fetchBackupData(); // Refresh the backup list
            } else {
                setError(result.message || 'Failed to create backup');
                alert('❌ Failed to create backup: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Create backup error:', error);
            setError('Failed to create backup');
            alert('❌ Failed to create backup. Please check the console for details.');
        } finally {
            setCreating(false);
        }
    };

    const downloadBackup = async (backup: BackupFile) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/v1/admin/backups/download/${backup.filename}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = backup.filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                console.error('Download failed:', response.statusText);
            }
        } catch (error) {
            console.error('Download error:', error);
        }
    };

    const deleteBackup = async (backupId: string) => {
        if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');

            const response = await fetch(`/api/v1/admin/backups/${backupId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                alert('✅ Backup deleted successfully!');
                fetchBackupData(); // Refresh the backup list
            } else {
                alert('❌ Failed to delete backup: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Delete backup error:', error);
            alert('❌ Failed to delete backup. Please check the console for details.');
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
            'in_progress': { color: 'bg-blue-100 text-blue-800', icon: Clock },
            'failed': { color: 'bg-red-100 text-red-800', icon: AlertCircle },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.completed;
        const Icon = config.icon;

        return (
            <Badge className={config.color}>
                <Icon className="h-3 w-3 mr-1" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const getTypeBadge = (type: string) => {
        const typeColors = {
            'full': 'bg-purple-100 text-purple-800',
            'partial': 'bg-orange-100 text-orange-800',
            'structure': 'bg-blue-100 text-blue-800',
        };

        return (
            <Badge className={typeColors[type as keyof typeof typeColors] || typeColors.full}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
            </Badge>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <AdminBaseLayout title="Backup Management">
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="h-8 w-8 text-maroon-600 animate-spin" />
                        <span className="text-maroon-800 font-medium">Loading backup data...</span>
                    </div>
                </div>
            </AdminBaseLayout>
        );
    }

    if (error) {
        return (
            <AdminBaseLayout title="Backup Management">
                <Card className="border-red-200">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-red-600 mb-4">{error}</p>
                            <Button onClick={() => fetchBackupData()} className="bg-maroon-700 hover:bg-maroon-800">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </AdminBaseLayout>
        );
    }

    return (
        <AdminBaseLayout title="Backup Management">
            <div className="space-y-6">
                {/* Header with Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-maroon-800">Database Backup Management</h2>
                        <p className="text-maroon-600">Create, manage, and restore database backups</p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={() => fetchBackupData()}
                            variant="outline"
                            size="sm"
                            className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* System Information */}
                {systemInfo && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800">Database Size</CardTitle>
                                <Database className="h-4 w-4 text-maroon-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-maroon-800">{systemInfo.database_size}</div>
                                <p className="text-xs text-maroon-600 mt-1">Total database size</p>
                            </CardContent>
                        </Card>

                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800">Total Records</CardTitle>
                                <FileText className="h-4 w-4 text-maroon-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">{systemInfo.total_records.toLocaleString()}</div>
                                <p className="text-xs text-maroon-600 mt-1">Across {systemInfo.total_tables} tables</p>
                            </CardContent>
                        </Card>

                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800">Available Space</CardTitle>
                                <HardDrive className="h-4 w-4 text-maroon-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{systemInfo.available_space}</div>
                                <p className="text-xs text-maroon-600 mt-1">Free disk space</p>
                            </CardContent>
                        </Card>

                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800">Last Backup</CardTitle>
                                <Calendar className="h-4 w-4 text-maroon-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-purple-600">
                                    {systemInfo.last_backup || 'Never'}
                                </div>
                                <p className="text-xs text-maroon-600 mt-1">Most recent backup</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Create Backup Actions */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800 flex items-center">
                            <Database className="h-5 w-5 mr-2" />
                            Create New Backup
                        </CardTitle>
                        <CardDescription className="text-maroon-600">
                            Choose the type of backup to create
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="border-purple-200 hover:border-purple-300 transition-colors cursor-pointer">
                                <CardContent className="p-4 text-center">
                                    <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                                    <h3 className="font-medium text-purple-800 mb-2">Full Backup</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Complete database backup with all data and structure
                                    </p>
                                    <Button
                                        onClick={() => createBackup('full')}
                                        disabled={creating}
                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                                    >
                                        {creating ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                                        Create Full Backup
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="border-orange-200 hover:border-orange-300 transition-colors cursor-pointer">
                                <CardContent className="p-4 text-center">
                                    <FileText className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                                    <h3 className="font-medium text-orange-800 mb-2">Data Only</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Backup only the data without structure
                                    </p>
                                    <Button
                                        onClick={() => createBackup('partial')}
                                        disabled={creating}
                                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                                    >
                                        {creating ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                                        Create Data Backup
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="border-blue-200 hover:border-blue-300 transition-colors cursor-pointer">
                                <CardContent className="p-4 text-center">
                                    <Database className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                    <h3 className="font-medium text-blue-800 mb-2">Structure Only</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Backup only database structure and schema
                                    </p>
                                    <Button
                                        onClick={() => createBackup('structure')}
                                        disabled={creating}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {creating ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                                        Create Structure Backup
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </CardContent>
                </Card>

                {/* Backup History */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800">Backup History</CardTitle>
                        <CardDescription className="text-maroon-600">
                            Previous database backups and their status
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {backups.length === 0 ? (
                            <div className="text-center py-8">
                                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No backups found</h3>
                                <p className="text-gray-500">
                                    Create your first backup using the options above
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {backups.map((backup) => (
                                    <div key={backup.id} className="flex items-center justify-between p-4 border border-beige-200 rounded-lg hover:bg-beige-50">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex-shrink-0">
                                                <Database className="h-8 w-8 text-maroon-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-maroon-800">{backup.filename}</h4>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    {getTypeBadge(backup.type)}
                                                    {getStatusBadge(backup.status)}
                                                    <span className="text-sm text-gray-500">{backup.size}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Created: {formatDate(backup.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {backup.status === 'completed' && backup.download_url && (
                                                <Button
                                                    onClick={() => downloadBackup(backup)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Download
                                                </Button>
                                            )}
                                            <Button
                                                onClick={() => deleteBackup(backup.id)}
                                                variant="outline"
                                                size="sm"
                                                className="border-red-300 text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Restore Options */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800 flex items-center">
                            <Upload className="h-5 w-5 mr-2" />
                            Restore Database
                        </CardTitle>
                        <CardDescription className="text-maroon-600">
                            Upload and restore from a backup file
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border-2 border-dashed border-beige-300 rounded-lg p-6 text-center">
                            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Backup File</h3>
                            <p className="text-gray-500 mb-4">
                                Select a backup file to restore your database
                            </p>
                            <Button
                                variant="outline"
                                className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Choose File
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminBaseLayout>
    );
}