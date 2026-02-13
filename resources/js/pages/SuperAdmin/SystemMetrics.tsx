import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    RefreshCw,
    Server,
    Database,
    HardDrive,
    Cpu,
    Activity,
    Users,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import axios from 'axios';

interface SystemMetrics {
    server: {
        memory: {
            current_formatted: string;
            peak_formatted: string;
            limit_formatted: string;
            usage_percentage: number;
        };
        cpu: {
            load_1min: number;
            load_5min: number;
            load_15min: number;
            cores: number;
            note?: string;
        };
        php: {
            version: string;
            max_execution_time: string;
            upload_max_filesize: string;
            post_max_size: string;
            opcache_enabled: boolean;
        };
    };
    database: {
        database_name: string;
        total_size_mb: number;
        top_tables: Array<{ name: string; size_mb: number; rows: number }>;
        connections: {
            max_connections: string;
            current: number;
        };
    };
    application: {
        cache: {
            driver: string;
            available: boolean;
        };
        records: {
            users: number;
            alumni: number;
            surveys: number;
            survey_responses: number;
            jobs: number;
        };
        activity_24h: {
            new_users: number;
            survey_responses: number;
            job_applications: number;
        };
    };
    storage: {
        disk: {
            total_formatted: string;
            used_formatted: string;
            free_formatted: string;
            usage_percentage: number;
        };
        storage_folders: {
            logs: { size_formatted: string };
            framework: { size_formatted: string };
            app: { size_formatted: string };
        };
    };
    timestamp: string;
}

interface User {
    id: number;
    email: string;
    role: string;
    status: string;
}

interface Props {
    auth: {
        user: User;
    };
}

export default function SystemMetrics({ auth }: Props) {
    const user = auth.user;
    const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchMetrics = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const { data } = await axios.get('/api/v1/admin/system-metrics', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (data.success) {
                setMetrics(data.data);
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error('Error fetching metrics:', error);
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                window.location.href = '/login';
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (autoRefresh) {
            interval = setInterval(() => {
                fetchMetrics();
            }, 5000); // Refresh every 5 seconds
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [autoRefresh]);

    const getHealthStatus = (percentage: number) => {
        if (percentage < 50) return { color: 'text-green-600', bg: 'bg-green-100', label: 'Healthy' };
        if (percentage < 75) return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Warning' };
        return { color: 'text-red-600', bg: 'bg-red-100', label: 'Critical' };
    };

    if (loading) {
        return (
            <AdminBaseLayout title="System Metrics" user={user}>
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="h-8 w-8 animate-spin text-maroon-600" />
                </div>
            </AdminBaseLayout>
        );
    }

    if (!metrics) {
        return (
            <AdminBaseLayout title="System Metrics" user={user}>
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">Failed to load system metrics</p>
                </div>
            </AdminBaseLayout>
        );
    }

    const memoryHealth = getHealthStatus(metrics.server.memory.usage_percentage);
    const diskHealth = getHealthStatus(metrics.storage.disk.usage_percentage);

    return (
        <AdminBaseLayout title="System Metrics" user={user}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-maroon-800 dark:text-gray-200">System Resource Metrics</h2>
                        <p className="text-maroon-600 dark:text-gray-400">Monitor server and application performance</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                            {autoRefresh && <span className="ml-2 text-green-600">● Live (5s)</span>}
                        </p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2 mr-2">
                            <input
                                type="checkbox"
                                id="auto-refresh"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="rounded border-maroon-300 dark:border-gray-600 text-maroon-600 focus:ring-maroon-200"
                            />
                            <label htmlFor="auto-refresh" className="text-sm text-maroon-700 dark:text-gray-300">
                                Auto-refresh (5s)
                            </label>
                        </div>

                        <Button
                            onClick={fetchMetrics}
                            variant="outline"
                            size="sm"
                            className="border-maroon-300 dark:border-gray-600 text-maroon-700 dark:text-gray-300 hover:bg-maroon-50 dark:hover:bg-maroon-800/30"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Server Resources */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Memory Usage */}
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                            <Server className="h-4 w-4 text-maroon-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-maroon-800 dark:text-gray-200">
                                {metrics.server.memory.usage_percentage}%
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {metrics.server.memory.current_formatted} / {metrics.server.memory.limit_formatted}
                            </p>
                            <div className="mt-2">
                                <Badge className={`${memoryHealth.bg} ${memoryHealth.color}`}>
                                    {memoryHealth.label}
                                </Badge>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div
                                    className={`h-2 rounded-full ${memoryHealth.label === 'Healthy' ? 'bg-green-600' :
                                        memoryHealth.label === 'Warning' ? 'bg-yellow-600' : 'bg-red-600'
                                        }`}
                                    style={{ width: `${metrics.server.memory.usage_percentage}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* CPU Load */}
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">CPU Load</CardTitle>
                            <Cpu className="h-4 w-4 text-maroon-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-maroon-800 dark:text-gray-200">
                                {metrics.server.cpu.load_1min}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                1min / {metrics.server.cpu.cores} cores
                            </p>
                            <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                <div>5min: {metrics.server.cpu.load_5min}</div>
                                <div>15min: {metrics.server.cpu.load_15min}</div>
                            </div>
                            {metrics.server.cpu.note && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{metrics.server.cpu.note}</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Disk Usage */}
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
                            <HardDrive className="h-4 w-4 text-maroon-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-maroon-800 dark:text-gray-200">
                                {metrics.storage.disk.usage_percentage}%
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {metrics.storage.disk.used_formatted} / {metrics.storage.disk.total_formatted}
                            </p>
                            <div className="mt-2">
                                <Badge className={`${diskHealth.bg} ${diskHealth.color}`}>
                                    {diskHealth.label}
                                </Badge>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div
                                    className={`h-2 rounded-full ${diskHealth.label === 'Healthy' ? 'bg-green-600' :
                                        diskHealth.label === 'Warning' ? 'bg-yellow-600' : 'bg-red-600'
                                        }`}
                                    style={{ width: `${metrics.storage.disk.usage_percentage}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Database Size */}
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Database Size</CardTitle>
                            <Database className="h-4 w-4 text-maroon-600 dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-maroon-800 dark:text-gray-200">
                                {metrics.database.total_size_mb} MB
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {metrics.database.database_name}
                            </p>
                            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                <div>Connections: {metrics.database.connections.current} / {metrics.database.connections.max_connections}</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Application Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Record Counts */}
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Users className="h-5 w-5 mr-2 text-maroon-600 dark:text-gray-400" />
                                Database Records
                            </CardTitle>
                            <CardDescription>Total records in database</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Users:</span>
                                <span className="font-semibold">{metrics.application.records.users.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Alumni:</span>
                                <span className="font-semibold">{metrics.application.records.alumni.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Surveys:</span>
                                <span className="font-semibold">{metrics.application.records.surveys.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Survey Responses:</span>
                                <span className="font-semibold">{metrics.application.records.survey_responses.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Jobs:</span>
                                <span className="font-semibold">{metrics.application.records.jobs.toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 24h Activity */}
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Activity className="h-5 w-5 mr-2 text-maroon-600 dark:text-gray-400" />
                                24h Activity
                            </CardTitle>
                            <CardDescription>Recent system activity</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">New Users:</span>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                    +{metrics.application.activity_24h.new_users}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Survey Responses:</span>
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                    +{metrics.application.activity_24h.survey_responses}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Job Applications:</span>
                                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                    +{metrics.application.activity_24h.job_applications}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* PHP Configuration */}
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Server className="h-5 w-5 mr-2 text-maroon-600 dark:text-gray-400" />
                                PHP Configuration
                            </CardTitle>
                            <CardDescription>Server configuration</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Version:</span>
                                <span className="font-semibold">{metrics.server.php.version}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Max Execution:</span>
                                <span className="font-semibold">{metrics.server.php.max_execution_time}s</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Upload Max:</span>
                                <span className="font-semibold">{metrics.server.php.upload_max_filesize}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Post Max:</span>
                                <span className="font-semibold">{metrics.server.php.post_max_size}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">OPcache:</span>
                                {metrics.server.php.opcache_enabled ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Database Tables */}
                <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Database className="h-5 w-5 mr-2 text-maroon-600 dark:text-gray-400" />
                            Top 10 Database Tables
                        </CardTitle>
                        <CardDescription>Largest tables by size</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b dark:border-gray-700">
                                        <th className="text-left py-2 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Table Name</th>
                                        <th className="text-right py-2 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Size (MB)</th>
                                        <th className="text-right py-2 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Rows</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {metrics.database.top_tables.map((table, index) => (
                                        <tr key={index} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="py-2 px-4 text-sm">{table.name}</td>
                                            <td className="py-2 px-4 text-sm text-right">{table.size_mb}</td>
                                            <td className="py-2 px-4 text-sm text-right">{table.rows.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Storage Folders */}
                <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <HardDrive className="h-5 w-5 mr-2 text-maroon-600 dark:text-gray-400" />
                            Storage Folders
                        </CardTitle>
                        <CardDescription>Application storage usage</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                <div className="text-sm text-gray-600 dark:text-gray-400">Logs</div>
                                <div className="text-lg font-semibold text-maroon-800 dark:text-gray-200 mt-1">
                                    {metrics.storage.storage_folders.logs.size_formatted}
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                <div className="text-sm text-gray-600 dark:text-gray-400">Framework</div>
                                <div className="text-lg font-semibold text-maroon-800 dark:text-gray-200 mt-1">
                                    {metrics.storage.storage_folders.framework.size_formatted}
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                <div className="text-sm text-gray-600 dark:text-gray-400">App</div>
                                <div className="text-lg font-semibold text-maroon-800 dark:text-gray-200 mt-1">
                                    {metrics.storage.storage_folders.app.size_formatted}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminBaseLayout>
    );
}
