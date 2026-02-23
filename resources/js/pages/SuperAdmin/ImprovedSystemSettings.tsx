import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Globe,
    Mail,
    Shield,
    Palette,
    Save,
    Check,
    Power,
    Server,
    Image as ImageIcon,
    Upload,
    X,
    Moon,
    Sun,
    Monitor,
    Type,
    Paintbrush
} from 'lucide-react';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface PageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            role: 'super_admin' | 'admin' | 'alumni';
            status: string;
        };
    };
    appearance?: {
        logo_light_path: string | null;
        logo_dark_path: string | null;
        favicon_path: string | null;
        background_image_path: string | null;
        primary_color: string;
        secondary_color: string;
        accent_color: string;
        enable_dark_mode: boolean;
        default_theme: string;
        font_family: string;
        custom_css: string | null;
    };
}

export default function SystemSettings({ auth, appearance }: PageProps) {
    const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'email' | 'security' | 'maintenance'>('general');
    const [saving, setSaving] = useState(false);
    const { confirm, confirmState, handleConfirm, handleCancel } = useConfirmDialog();
    const [showSuccess, setShowSuccess] = useState(false);

    // Get CSRF token from meta tag
    const getCsrfToken = () => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        return token || '';
    };

    // Apply theme to document
    const applyTheme = (theme: string) => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else if (theme === 'light') {
            root.classList.remove('dark');
        } else if (theme === 'system') {
            // Check system preference
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
    };

    // Load current settings from API
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/v1/admin/appearance', {
                    credentials: 'include',
                });

                if (response.ok) {
                    const data = await response.json();
                    const settings = data.data;

                    if (settings) {
                        setAppearanceSettings({
                            logoLight: settings.logo_light_path || null,
                            logoDark: settings.logo_dark_path || null,
                            favicon: settings.favicon_path || null,
                            backgroundImage: settings.background_image_path || null,
                            primaryColor: settings.primary_color || '#7C2529',
                            secondaryColor: settings.secondary_color || '#B89968',
                            accentColor: settings.accent_color || '#D4AF37',
                            enableDarkMode: settings.enable_dark_mode ?? true,
                            defaultTheme: settings.default_theme || 'light',
                            fontFamily: settings.font_family || 'Inter',
                            customCss: settings.custom_css || '',
                        });

                        // Apply the theme immediately
                        applyTheme(settings.default_theme || 'light');
                    }
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        };

        fetchSettings();
    }, []);

    // General Settings
    const [generalSettings, setGeneralSettings] = useState({
        siteName: 'Alumni Tracer System',
        siteDescription: 'Official Alumni Tracking and Engagement Platform',
        siteUrl: 'https://akndev.tech',
        contactEmail: 'admin@alumnitracer.edu',
        timezone: 'Asia/Manila',
        dateFormat: 'YYYY-MM-DD',
        itemsPerPage: 25,
    });

    // Appearance Settings
    const [appearanceSettings, setAppearanceSettings] = useState({
        logoLight: appearance?.logo_light_path || null,
        logoDark: appearance?.logo_dark_path || null,
        favicon: appearance?.favicon_path || null,
        backgroundImage: appearance?.background_image_path || null,
        primaryColor: appearance?.primary_color || '#7C2529',
        secondaryColor: appearance?.secondary_color || '#B89968',
        accentColor: appearance?.accent_color || '#D4AF37',
        enableDarkMode: appearance?.enable_dark_mode ?? true,
        defaultTheme: appearance?.default_theme || 'light',
        fontFamily: appearance?.font_family || 'Inter',
        customCss: appearance?.custom_css || '',
    });

    // Email Settings
    const [emailSettings, setEmailSettings] = useState({
        smtpHost: 'smtp.gmail.com',
        smtpPort: '587',
        smtpUsername: 'noreply@alumnitracer.edu',
        smtpPassword: '',
        smtpEncryption: 'tls',
        fromName: 'Alumni Tracer System',
        fromEmail: 'noreply@alumnitracer.edu',
    });

    // Security Settings
    const [securitySettings, setSecuritySettings] = useState({
        sessionTimeout: 120,
        passwordMinLength: 8,
        requireSpecialChar: true,
        requireNumbers: true,
        require2FA: false,
        maxLoginAttempts: 5,
        lockoutDuration: 30,
    });

    // Maintenance Settings
    const [maintenanceSettings, setMaintenanceSettings] = useState({
        maintenanceMode: false,
        maintenanceMessage: 'System is currently under maintenance. Please check back later.',
        allowedIPs: '',
        autoBackup: true,
        backupFrequency: 'daily',
    });

    const handleFileUpload = async (file: File, type: 'logo_light' | 'logo_dark' | 'favicon' | 'background') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        try {
            const response = await fetch('/api/v1/admin/appearance/upload', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: formData,
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                const uploadedData = data.data;

                // Update appearance settings with new path and URL
                setAppearanceSettings(prev => ({
                    ...prev,
                    [type === 'logo_light' ? 'logoLight' :
                        type === 'logo_dark' ? 'logoDark' :
                            type === 'favicon' ? 'favicon' : 'backgroundImage']: uploadedData.path
                }));

                alert('Image uploaded successfully!');
            } else {
                alert('Failed to upload image. Please try again.');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error uploading image. Please check file size and format.');
        }
    };

    const handleDeleteImage = async (type: 'logo_light' | 'logo_dark' | 'favicon' | 'background') => {
        const pathKey = type === 'logo_light' ? 'logoLight' :
            type === 'logo_dark' ? 'logoDark' :
                type === 'favicon' ? 'favicon' : 'backgroundImage';

        const path = appearanceSettings[pathKey];
        if (!path) return;

        const ok = await confirm({ title: 'Delete Image', message: 'Are you sure you want to delete this image?', variant: 'destructive', confirmLabel: 'Delete' });
        if (!ok) return;

        try {
            const response = await fetch('/api/v1/admin/appearance/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'include',
                body: JSON.stringify({ path, type }),
            });

            if (response.ok) {
                setAppearanceSettings(prev => ({
                    ...prev,
                    [pathKey]: null
                }));
                alert('Image deleted successfully!');
            } else {
                alert('Failed to delete image.');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Error deleting image.');
        }
    };

    const handleSave = async () => {
        setSaving(true);

        try {
            // Save appearance settings to API
            const response = await fetch('/api/v1/admin/appearance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'include',
                body: JSON.stringify({
                    logo_light_path: appearanceSettings.logoLight,
                    logo_dark_path: appearanceSettings.logoDark,
                    favicon_path: appearanceSettings.favicon,
                    background_image_path: appearanceSettings.backgroundImage,
                    primary_color: appearanceSettings.primaryColor,
                    secondary_color: appearanceSettings.secondaryColor,
                    accent_color: appearanceSettings.accentColor,
                    enable_dark_mode: appearanceSettings.enableDarkMode,
                    default_theme: appearanceSettings.defaultTheme,
                    font_family: appearanceSettings.fontFamily,
                    custom_css: appearanceSettings.customCss,
                }),
            });

            if (response.ok) {
                // Apply theme immediately without reload
                applyTheme(appearanceSettings.defaultTheme);

                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            } else {
                alert('Failed to save settings. Please try again.');
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('Error saving settings. Please check your connection and try again.');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'general', name: 'General', icon: Globe },
        { id: 'appearance', name: 'Appearance', icon: Palette },
        { id: 'email', name: 'Email', icon: Mail },
        { id: 'security', name: 'Security', icon: Shield },
        { id: 'maintenance', name: 'Maintenance', icon: Server },
    ];

    const fontOptions = [
        'Inter',
        'Roboto',
        'Open Sans',
        'Lato',
        'Montserrat',
        'Poppins',
        'Source Sans Pro',
        'Ubuntu'
    ];

    return (
        <AdminBaseLayout title="System Settings" user={auth.user}>
            <Head title="System Settings" />

            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-beige-200 dark:border-gray-800 p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">System Settings</h1>
                            <p className="text-gray-600 dark:text-gray-300">
                                Configure system-wide settings, appearance, and preferences
                            </p>
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-maroon-600 hover:bg-maroon-700 text-white"
                        >
                            <Save className={`h-5 w-5 mr-2 ${saving ? 'animate-spin' : ''}`} />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>

                    {showSuccess && (
                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg flex items-center space-x-3">
                            <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                            <p className="text-green-800 dark:text-green-300 font-medium">Settings saved successfully!</p>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-beige-200 dark:border-gray-800 overflow-hidden">
                    <div className="border-b border-gray-200 dark:border-gray-800">
                        <nav className="flex -mb-px overflow-x-auto">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                        className={`flex items-center justify-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === tab.id
                                            ? 'border-maroon-600 text-maroon-600 dark:border-maroon-400 dark:text-maroon-300'
                                            : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span>{tab.name}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* General Settings */}
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">General Settings</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Site Name</Label>
                                            <Input
                                                value={generalSettings.siteName}
                                                onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Site URL</Label>
                                            <Input
                                                type="url"
                                                value={generalSettings.siteUrl}
                                                onChange={(e) => setGeneralSettings({ ...generalSettings, siteUrl: e.target.value })}
                                            />
                                        </div>

                                        <div className="md:col-span-2 space-y-2">
                                            <Label>Site Description</Label>
                                            <Textarea
                                                value={generalSettings.siteDescription}
                                                onChange={(e) => setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })}
                                                rows={3}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Contact Email</Label>
                                            <Input
                                                type="email"
                                                value={generalSettings.contactEmail}
                                                onChange={(e) => setGeneralSettings({ ...generalSettings, contactEmail: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Timezone</Label>
                                            <select
                                                value={generalSettings.timezone}
                                                onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="Asia/Manila">Asia/Manila (UTC+8)</option>
                                                <option value="America/New_York">America/New York (UTC-5)</option>
                                                <option value="Europe/London">Europe/London (UTC+0)</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Date Format</Label>
                                            <select
                                                value={generalSettings.dateFormat}
                                                onChange={(e) => setGeneralSettings({ ...generalSettings, dateFormat: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Items Per Page</Label>
                                            <select
                                                value={generalSettings.itemsPerPage}
                                                onChange={(e) => setGeneralSettings({ ...generalSettings, itemsPerPage: Number(e.target.value) })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value={10}>10</option>
                                                <option value={25}>25</option>
                                                <option value={50}>50</option>
                                                <option value={100}>100</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Appearance Settings */}
                        {activeTab === 'appearance' && (
                            <div className="space-y-8">
                                {/* Logos & Icons */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center">
                                        <ImageIcon className="h-5 w-5 mr-2 text-gray-700 dark:text-gray-200" />
                                        Logos & Icons
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-sm">Light Mode Logo</CardTitle>
                                                <CardDescription>Displayed in light theme</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                {appearanceSettings.logoLight ? (
                                                    <div className="relative">
                                                        <img src={`/api/v1/assets/${appearanceSettings.logoLight}`} alt="Light Logo" className="w-full h-32 object-contain bg-gray-50 rounded-lg" />
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="absolute top-2 right-2"
                                                            onClick={() => handleDeleteImage('logo_light')}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <Upload className="h-8 w-8 text-gray-400 dark:text-gray-400 mb-2" />
                                                        <span className="text-sm text-gray-500 dark:text-gray-300 font-medium">Upload Logo</span>
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo_light')}
                                                        />
                                                    </label>
                                                )}
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-sm">Dark Mode Logo</CardTitle>
                                                <CardDescription>Displayed in dark theme</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                {appearanceSettings.logoDark ? (
                                                    <div className="relative">
                                                        <img src={`/api/v1/assets/${appearanceSettings.logoDark}`} alt="Dark Logo" className="w-full h-32 object-contain bg-gray-800 rounded-lg" />
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="absolute top-2 right-2"
                                                            onClick={() => handleDeleteImage('logo_dark')}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <Upload className="h-8 w-8 text-gray-400 dark:text-gray-300 mb-2" />
                                                        <span className="text-sm text-gray-500 dark:text-gray-200 font-medium">Upload Logo</span>
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo_dark')}
                                                        />
                                                    </label>
                                                )}
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-sm">Favicon</CardTitle>
                                                <CardDescription>Browser tab icon</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                {appearanceSettings.favicon ? (
                                                    <div className="relative">
                                                        <img src={`/api/v1/assets/${appearanceSettings.favicon}`} alt="Favicon" className="w-full h-32 object-contain bg-gray-50 rounded-lg" />
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="absolute top-2 right-2"
                                                            onClick={() => handleDeleteImage('favicon')}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <Upload className="h-8 w-8 text-gray-400 dark:text-gray-300 mb-2" />
                                                        <span className="text-sm text-gray-500 dark:text-gray-200 font-medium">Upload Favicon</span>
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/x-icon,image/png"
                                                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'favicon')}
                                                        />
                                                    </label>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>

                                {/* Color Theme */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center">
                                        <Paintbrush className="h-5 w-5 mr-2 text-gray-700 dark:text-gray-200" />
                                        Color Theme
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <Label>Primary Color</Label>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="color"
                                                    value={appearanceSettings.primaryColor}
                                                    onChange={(e) => setAppearanceSettings({ ...appearanceSettings, primaryColor: e.target.value })}
                                                    className="h-10 w-20 rounded cursor-pointer"
                                                />
                                                <Input
                                                    value={appearanceSettings.primaryColor}
                                                    onChange={(e) => setAppearanceSettings({ ...appearanceSettings, primaryColor: e.target.value })}
                                                    className="flex-1"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Secondary Color</Label>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="color"
                                                    value={appearanceSettings.secondaryColor}
                                                    onChange={(e) => setAppearanceSettings({ ...appearanceSettings, secondaryColor: e.target.value })}
                                                    className="h-10 w-20 rounded cursor-pointer"
                                                />
                                                <Input
                                                    value={appearanceSettings.secondaryColor}
                                                    onChange={(e) => setAppearanceSettings({ ...appearanceSettings, secondaryColor: e.target.value })}
                                                    className="flex-1"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Accent Color</Label>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="color"
                                                    value={appearanceSettings.accentColor}
                                                    onChange={(e) => setAppearanceSettings({ ...appearanceSettings, accentColor: e.target.value })}
                                                    className="h-10 w-20 rounded cursor-pointer"
                                                />
                                                <Input
                                                    value={appearanceSettings.accentColor}
                                                    onChange={(e) => setAppearanceSettings({ ...appearanceSettings, accentColor: e.target.value })}
                                                    className="flex-1"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Theme & Font */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center">
                                        <Type className="h-5 w-5 mr-2 text-gray-700 dark:text-gray-200" />
                                        Theme & Typography
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <Label>Default Theme</Label>
                                            <div className="grid grid-cols-3 gap-3">
                                                <button
                                                    onClick={() => {
                                                        setAppearanceSettings({ ...appearanceSettings, defaultTheme: 'light' });
                                                        applyTheme('light');
                                                    }}
                                                    className={`p-4 border-2 rounded-lg transition-all ${appearanceSettings.defaultTheme === 'light'
                                                        ? 'border-maroon-600 bg-maroon-50 dark:bg-maroon-900/30 text-maroon-800 dark:text-maroon-200'
                                                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200'
                                                        }`}
                                                >
                                                    <Sun className="h-6 w-6 mx-auto mb-2" />
                                                    <span className="text-sm font-medium">Light</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setAppearanceSettings({ ...appearanceSettings, defaultTheme: 'dark' });
                                                        applyTheme('dark');
                                                    }}
                                                    className={`p-4 border-2 rounded-lg transition-all ${appearanceSettings.defaultTheme === 'dark'
                                                        ? 'border-maroon-600 bg-maroon-50 dark:bg-maroon-900/30 text-maroon-800 dark:text-maroon-200'
                                                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200'
                                                        }`}
                                                >
                                                    <Moon className="h-6 w-6 mx-auto mb-2" />
                                                    <span className="text-sm font-medium">Dark</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setAppearanceSettings({ ...appearanceSettings, defaultTheme: 'system' });
                                                        applyTheme('system');
                                                    }}
                                                    className={`p-4 border-2 rounded-lg transition-all ${appearanceSettings.defaultTheme === 'system'
                                                        ? 'border-maroon-600 bg-maroon-50 dark:bg-maroon-900/30 text-maroon-800 dark:text-maroon-200'
                                                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200'
                                                        }`}
                                                >
                                                    <Monitor className="h-6 w-6 mx-auto mb-2" />
                                                    <span className="text-sm font-medium">System</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Font Family</Label>
                                            <select
                                                value={appearanceSettings.fontFamily}
                                                onChange={(e) => setAppearanceSettings({ ...appearanceSettings, fontFamily: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                                            >
                                                {fontOptions.map(font => (
                                                    <option key={font} value={font}>{font}</option>
                                                ))}
                                            </select>
                                            <p className="text-xs text-gray-500 dark:text-gray-300">System-wide font family</p>
                                        </div>

                                        <div className="md:col-span-2">
                                            <Label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={appearanceSettings.enableDarkMode}
                                                    onChange={(e) => setAppearanceSettings({ ...appearanceSettings, enableDarkMode: e.target.checked })}
                                                    className="h-4 w-4 text-maroon-600 dark:text-maroon-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-maroon-500 dark:focus:ring-maroon-600 cursor-pointer"
                                                />
                                                <span className="text-gray-900 dark:text-gray-50">Enable dark mode feature for users</span>
                                            </Label>
                                        </div>
                                    </div>
                                </div>

                                {/* Custom CSS */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">Custom CSS</h3>
                                    <Textarea
                                        value={appearanceSettings.customCss}
                                        onChange={(e) => setAppearanceSettings({ ...appearanceSettings, customCss: e.target.value })}
                                        rows={10}
                                        placeholder="/* Add your custom CSS here */"
                                        className="font-mono text-sm"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-300 mt-2">
                                        Advanced: Add custom CSS to override default styles
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Email Settings - Keep existing */}
                        {activeTab === 'email' && (
                            <div className="space-y-6">
                                {/* Keep the existing email settings UI from the original file */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">SMTP Configuration</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>SMTP Host</Label>
                                            <Input
                                                value={emailSettings.smtpHost}
                                                onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>SMTP Port</Label>
                                            <Input
                                                value={emailSettings.smtpPort}
                                                onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>SMTP Username</Label>
                                            <Input
                                                value={emailSettings.smtpUsername}
                                                onChange={(e) => setEmailSettings({ ...emailSettings, smtpUsername: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>SMTP Password</Label>
                                            <Input
                                                type="password"
                                                value={emailSettings.smtpPassword}
                                                onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Encryption</Label>
                                            <select
                                                value={emailSettings.smtpEncryption}
                                                onChange={(e) => setEmailSettings({ ...emailSettings, smtpEncryption: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="tls">TLS</option>
                                                <option value="ssl">SSL</option>
                                                <option value="none">None</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>From Name</Label>
                                            <Input
                                                value={emailSettings.fromName}
                                                onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                                            />
                                        </div>

                                        <div className="md:col-span-2 space-y-2">
                                            <Label>From Email</Label>
                                            <Input
                                                type="email"
                                                value={emailSettings.fromEmail}
                                                onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                    <CardContent className="p-4">
                                        <div className="flex items-start space-x-3">
                                            <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Test Email Configuration</p>
                                                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                                    After saving, you can send a test email to verify your SMTP settings.
                                                </p>
                                                <Button variant="outline" size="sm" className="mt-3">
                                                    Send Test Email
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Security Settings - Keep existing */}
                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">Security Configuration</h3>
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label>Session Timeout (minutes)</Label>
                                                <Input
                                                    type="number"
                                                    value={securitySettings.sessionTimeout}
                                                    onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: Number(e.target.value) })}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Password Minimum Length</Label>
                                                <Input
                                                    type="number"
                                                    value={securitySettings.passwordMinLength}
                                                    onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: Number(e.target.value) })}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Max Login Attempts</Label>
                                                <Input
                                                    type="number"
                                                    value={securitySettings.maxLoginAttempts}
                                                    onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: Number(e.target.value) })}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Lockout Duration (minutes)</Label>
                                                <Input
                                                    type="number"
                                                    value={securitySettings.lockoutDuration}
                                                    onChange={(e) => setSecuritySettings({ ...securitySettings, lockoutDuration: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="flex items-center space-x-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={securitySettings.requireSpecialChar}
                                                    onChange={(e) => setSecuritySettings({ ...securitySettings, requireSpecialChar: e.target.checked })}
                                                    className="h-4 w-4 text-maroon-600 rounded focus:ring-maroon-500"
                                                />
                                                <span className="text-sm">Require special characters in passwords</span>
                                            </Label>

                                            <Label className="flex items-center space-x-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={securitySettings.requireNumbers}
                                                    onChange={(e) => setSecuritySettings({ ...securitySettings, requireNumbers: e.target.checked })}
                                                    className="h-4 w-4 text-maroon-600 rounded focus:ring-maroon-500"
                                                />
                                                <span className="text-sm">Require numbers in passwords</span>
                                            </Label>

                                            <Label className="flex items-center space-x-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={securitySettings.require2FA}
                                                    onChange={(e) => setSecuritySettings({ ...securitySettings, require2FA: e.target.checked })}
                                                    className="h-4 w-4 text-maroon-600 rounded focus:ring-maroon-500"
                                                />
                                                <span className="text-sm">Require Two-Factor Authentication (2FA)</span>
                                            </Label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Maintenance Settings - Keep existing */}
                        {activeTab === 'maintenance' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">Maintenance Mode</h3>
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <Power className={`h-6 w-6 ${maintenanceSettings.maintenanceMode ? 'text-red-600' : 'text-green-600'}`} />
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">Maintenance Mode</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                                        {maintenanceSettings.maintenanceMode ? 'System is in maintenance mode' : 'System is operational'}
                                                    </p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={maintenanceSettings.maintenanceMode}
                                                    onChange={(e) => setMaintenanceSettings({ ...maintenanceSettings, maintenanceMode: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-maroon-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-maroon-600"></div>
                                            </label>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Maintenance Message</Label>
                                            <Textarea
                                                value={maintenanceSettings.maintenanceMessage}
                                                onChange={(e) => setMaintenanceSettings({ ...maintenanceSettings, maintenanceMessage: e.target.value })}
                                                rows={3}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Allowed IP Addresses (comma-separated)</Label>
                                            <Input
                                                value={maintenanceSettings.allowedIPs}
                                                onChange={(e) => setMaintenanceSettings({ ...maintenanceSettings, allowedIPs: e.target.value })}
                                                placeholder="e.g., 192.168.1.1, 10.0.0.1"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-300">These IPs will have access during maintenance mode</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">Automatic Backup</h3>
                                    <div className="space-y-4">
                                        <Label className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={maintenanceSettings.autoBackup}
                                                onChange={(e) => setMaintenanceSettings({ ...maintenanceSettings, autoBackup: e.target.checked })}
                                                className="h-4 w-4 text-maroon-600 rounded focus:ring-maroon-500"
                                            />
                                            <span className="text-sm">Enable automatic database backups</span>
                                        </Label>

                                        <div className="space-y-2">
                                            <Label>Backup Frequency</Label>
                                            <select
                                                value={maintenanceSettings.backupFrequency}
                                                onChange={(e) => setMaintenanceSettings({ ...maintenanceSettings, backupFrequency: e.target.value })}
                                                disabled={!maintenanceSettings.autoBackup}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white disabled:opacity-50"
                                            >
                                                <option value="hourly">Hourly</option>
                                                <option value="daily">Daily</option>
                                                <option value="weekly">Weekly</option>
                                                <option value="monthly">Monthly</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <ConfirmDialog open={confirmState.open} title={confirmState.title} message={confirmState.message} confirmLabel={confirmState.confirmLabel} cancelLabel={confirmState.cancelLabel} variant={confirmState.variant} onConfirm={handleConfirm} onCancel={handleCancel} />
        </AdminBaseLayout>
    );
}
