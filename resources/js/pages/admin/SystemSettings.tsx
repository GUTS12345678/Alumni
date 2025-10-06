import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Settings,
    Mail,
    Bell,
    Database,
    Shield,
    Server,
    RefreshCw,
    Save,
    Download,
    Upload,
    Trash2,
    AlertTriangle
} from 'lucide-react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';

interface SystemSetting {
    key: string;
    value: string;
    type: 'text' | 'email' | 'number' | 'boolean' | 'json';
    category: 'general' | 'email' | 'notifications' | 'security' | 'maintenance';
    description: string;
    is_sensitive: boolean;
}

interface SystemStats {
    total_users: number;
    total_alumni: number;
    total_surveys: number;
    database_size: string;
    cache_size: string;
    uptime: string;
    last_backup: string;
}

export default function SystemSettings() {
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('general');
    const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});

    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);

            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const [settingsResponse, statsResponse] = await Promise.all([
                fetch('/api/v1/admin/settings', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                }),
                fetch('/api/v1/admin/system/stats', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                })
            ]);

            if (!settingsResponse.ok || !statsResponse.ok) {
                if (settingsResponse.status === 401 || statsResponse.status === 401) {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    return;
                }
                throw new Error('Failed to fetch system data');
            }

            const settingsData = await settingsResponse.json();
            const statsData = await statsResponse.json();

            if (settingsData.success) {
                setSettings(settingsData.data);
            }

            if (statsData.success) {
                setStats(statsData.data);
            }
        } catch (err) {
            console.error('Settings fetch error:', err);
            setError('Failed to load system settings');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleSettingChange = (key: string, value: string) => {
        setPendingChanges(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const saveSettings = async () => {
        try {
            setSaving(true);

            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/v1/admin/settings', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ settings: pendingChanges }),
            });

            if (response.ok) {
                setPendingChanges({});
                fetchSettings(); // Refresh settings
                // Show success notification
            }
        } catch (error) {
            console.error('Save settings error:', error);
        } finally {
            setSaving(false);
        }
    };

    const clearCache = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/v1/admin/system/cache/clear', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                fetchSettings(); // Refresh stats
                alert('Cache cleared successfully');
            }
        } catch (error) {
            console.error('Clear cache error:', error);
            alert('Failed to clear cache');
        }
    };

    const createBackup = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/v1/admin/system/backup', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    alert(`Backup created successfully: ${data.data.filename} (${data.data.size})`);
                    fetchSettings(); // Refresh stats
                }
            }
        } catch (error) {
            console.error('Backup error:', error);
            alert('Failed to create backup');
        }
    };

    const getSettingsByCategory = (category: string) => {
        return settings.filter(setting => setting.category === category);
    };

    const renderSettingInput = (setting: SystemSetting) => {
        const currentValue = pendingChanges[setting.key] !== undefined
            ? pendingChanges[setting.key]
            : setting.value;

        switch (setting.type) {
            case 'boolean':
                return (
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={currentValue === 'true' || currentValue === '1'}
                            onChange={(e) => handleSettingChange(setting.key, e.target.checked ? '1' : '0')}
                            className="rounded border-beige-300 text-maroon-600 focus:border-maroon-500 focus:ring-maroon-500"
                        />
                        <label className="text-sm text-gray-700">
                            {setting.description}
                        </label>
                    </div>
                );
            case 'number':
                return (
                    <Input
                        type="number"
                        value={currentValue}
                        onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                        className="border-beige-300 focus:border-maroon-500 focus:ring-maroon-500"
                    />
                );
            case 'email':
                return (
                    <Input
                        type="email"
                        value={currentValue}
                        onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                        className="border-beige-300 focus:border-maroon-500 focus:ring-maroon-500"
                    />
                );
            default:
                return (
                    <Input
                        type={setting.is_sensitive ? 'password' : 'text'}
                        value={currentValue}
                        onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                        className="border-beige-300 focus:border-maroon-500 focus:ring-maroon-500"
                    />
                );
        }
    };

    const tabs = [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'email', label: 'Email', icon: Mail },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'maintenance', label: 'Maintenance', icon: Database },
    ];

    if (loading) {
        return (
            <AdminBaseLayout title="System Settings">
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="h-8 w-8 text-maroon-600 animate-spin" />
                        <span className="text-maroon-800 font-medium">Loading system settings...</span>
                    </div>
                </div>
            </AdminBaseLayout>
        );
    }

    if (error) {
        return (
            <AdminBaseLayout title="System Settings">
                <Card className="border-red-200">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-red-600 mb-4">{error}</p>
                            <Button onClick={() => fetchSettings()} className="bg-maroon-700 hover:bg-maroon-800">
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
        <AdminBaseLayout title="System Settings">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-maroon-800">System Settings</h2>
                        <p className="text-maroon-600">Configure application settings and system preferences</p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={saveSettings}
                            disabled={Object.keys(pendingChanges).length === 0 || saving}
                            className="bg-maroon-700 hover:bg-maroon-800 text-white"
                        >
                            <Save className={`h-4 w-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>

                {/* Pending Changes Alert */}
                {Object.keys(pendingChanges).length > 0 && (
                    <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                                <span className="text-orange-800 font-medium">
                                    You have {Object.keys(pendingChanges).length} unsaved changes
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* System Stats */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800">Total Users</CardTitle>
                                <Settings className="h-4 w-4 text-maroon-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-maroon-800">{stats.total_users}</div>
                                <p className="text-xs text-maroon-600 mt-1">All registered users</p>
                            </CardContent>
                        </Card>

                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800">Database Size</CardTitle>
                                <Database className="h-4 w-4 text-maroon-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-maroon-800">{stats.database_size}</div>
                                <p className="text-xs text-maroon-600 mt-1">Storage used</p>
                            </CardContent>
                        </Card>

                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800">System Uptime</CardTitle>
                                <Server className="h-4 w-4 text-maroon-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-maroon-800">{stats.uptime}</div>
                                <p className="text-xs text-maroon-600 mt-1">Server running</p>
                            </CardContent>
                        </Card>

                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800">Last Backup</CardTitle>
                                <Download className="h-4 w-4 text-maroon-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-maroon-800">{stats.last_backup}</div>
                                <p className="text-xs text-maroon-600 mt-1">Database backup</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Settings Tabs */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <div className="flex space-x-1 border-b border-beige-200">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
                                            ${activeTab === tab.id
                                                ? 'bg-maroon-100 text-maroon-800 border-b-2 border-maroon-600'
                                                : 'text-gray-600 hover:text-maroon-600 hover:bg-beige-50'}
                                        `}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-6">
                            {getSettingsByCategory(activeTab).map((setting) => (
                                <div key={setting.key} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-maroon-800">
                                            {setting.key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </label>
                                        {pendingChanges[setting.key] !== undefined && (
                                            <Badge className="bg-orange-100 text-orange-800">
                                                Modified
                                            </Badge>
                                        )}
                                    </div>
                                    {renderSettingInput(setting)}
                                    {setting.description && setting.type !== 'boolean' && (
                                        <p className="text-xs text-gray-600">{setting.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* System Actions */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800 flex items-center">
                            <Server className="h-5 w-5 mr-2" />
                            System Maintenance
                        </CardTitle>
                        <CardDescription className="text-maroon-600">
                            Perform system maintenance tasks and operations
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Button
                                onClick={clearCache}
                                variant="outline"
                                className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Clear Cache
                            </Button>

                            <Button
                                onClick={createBackup}
                                variant="outline"
                                className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Create Backup
                            </Button>

                            <Button
                                variant="outline"
                                className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Restore Backup
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminBaseLayout>
    );
}