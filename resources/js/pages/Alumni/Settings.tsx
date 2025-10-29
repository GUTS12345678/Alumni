import React, { useState, FormEvent } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon, Lock, Bell, Eye, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';

interface Settings {
    email_notifications: boolean;
    survey_reminders: boolean;
    network_updates: boolean;
    profile_visibility: boolean;
    show_employment_status: boolean;
    allow_connection_requests: boolean;
}

interface Props {
    settings: Settings;
    user: {
        email: string;
        role: string;
    };
}

export default function Settings({ settings, user }: Props) {
    const { flash } = usePage().props as any;
    
    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState<any>({});

    // Notification settings state
    const [notificationSettings, setNotificationSettings] = useState({
        email_notifications: settings.email_notifications,
        survey_reminders: settings.survey_reminders,
        network_updates: settings.network_updates,
    });
    const [notificationSaving, setNotificationSaving] = useState(false);

    // Privacy settings state
    const [privacySettings, setPrivacySettings] = useState({
        profile_visibility: settings.profile_visibility,
        show_employment_status: settings.show_employment_status,
        allow_connection_requests: settings.allow_connection_requests,
    });
    const [privacySaving, setPrivacySaving] = useState(false);

    // Success/error messages
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Handle flash messages
    React.useEffect(() => {
        if (flash?.success) {
            setSuccess(flash.success);
            setTimeout(() => setSuccess(null), 5000);
        }
        if (flash?.error) {
            setError(flash.error);
            setTimeout(() => setError(null), 5000);
        }
    }, [flash]);

    // Handle password update
    const handlePasswordSubmit = (e: FormEvent) => {
        e.preventDefault();
        setPasswordSaving(true);
        setPasswordErrors({});
        setError(null);

        router.put('/alumni/settings/password', passwordForm, {
            preserveScroll: true,
            onSuccess: () => {
                setPasswordForm({
                    current_password: '',
                    new_password: '',
                    new_password_confirmation: '',
                });
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
            onError: (errors) => {
                setPasswordErrors(errors);
                if (errors.current_password) {
                    setError(errors.current_password as string);
                }
            },
            onFinish: () => setPasswordSaving(false)
        });
    };

    // Handle notification settings update
    const handleNotificationUpdate = () => {
        setNotificationSaving(true);
        setError(null);

        router.put('/alumni/settings/notifications', notificationSettings, {
            preserveScroll: true,
            onSuccess: () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
            onError: (errors) => {
                setError('Failed to update notification settings');
            },
            onFinish: () => setNotificationSaving(false)
        });
    };

    // Handle privacy settings update
    const handlePrivacyUpdate = () => {
        setPrivacySaving(true);
        setError(null);

        router.put('/alumni/settings/privacy', privacySettings, {
            preserveScroll: true,
            onSuccess: () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
            onError: (errors) => {
                setError('Failed to update privacy settings');
            },
            onFinish: () => setPrivacySaving(false)
        });
    };
    return (
        <AlumniBaseLayout title="Account Settings">
            <Head title="Account Settings" />

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center space-x-3">
                    <SettingsIcon className="h-8 w-8 text-maroon-600" />
                    <div>
                        <h1 className="text-3xl font-bold text-maroon-800">Account Settings</h1>
                        <p className="text-gray-600">Manage your account preferences</p>
                    </div>
                </div>

                {/* Success Message */}
                {success && (
                    <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">{success}</AlertDescription>
                    </Alert>
                )}

                {/* Error Message */}
                {error && (
                    <Alert className="bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                )}

                {/* Account Info */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800">Account Information</CardTitle>
                        <CardDescription>Your account details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input 
                                value={user.email} 
                                disabled
                                className="bg-gray-50 border-beige-300"
                            />
                            <p className="text-sm text-gray-500">Contact an administrator to change your email address</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Password Settings */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800 flex items-center">
                            <Lock className="h-5 w-5 mr-2" />
                            Password & Security
                        </CardTitle>
                        <CardDescription>
                            Change your password and security settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input 
                                    id="current-password" 
                                    type="password"
                                    value={passwordForm.current_password}
                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                                    className={`border-beige-300 ${passwordErrors.current_password ? 'border-red-500' : ''}`}
                                    disabled={passwordSaving}
                                    required
                                />
                                {passwordErrors.current_password && (
                                    <p className="text-sm text-red-600">{passwordErrors.current_password}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input 
                                    id="new-password" 
                                    type="password"
                                    value={passwordForm.new_password}
                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                                    className={`border-beige-300 ${passwordErrors.new_password ? 'border-red-500' : ''}`}
                                    disabled={passwordSaving}
                                    minLength={8}
                                    required
                                />
                                {passwordErrors.new_password && (
                                    <p className="text-sm text-red-600">{passwordErrors.new_password}</p>
                                )}
                                <p className="text-sm text-gray-500">Must be at least 8 characters long</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input 
                                    id="confirm-password" 
                                    type="password"
                                    value={passwordForm.new_password_confirmation}
                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password_confirmation: e.target.value }))}
                                    className={`border-beige-300 ${passwordErrors.new_password_confirmation ? 'border-red-500' : ''}`}
                                    disabled={passwordSaving}
                                    required
                                />
                                {passwordErrors.new_password_confirmation && (
                                    <p className="text-sm text-red-600">{passwordErrors.new_password_confirmation}</p>
                                )}
                            </div>
                            <Button 
                                type="submit"
                                className="bg-maroon-700 hover:bg-maroon-800 text-white"
                                disabled={passwordSaving}
                            >
                                {passwordSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Updating Password...
                                    </>
                                ) : (
                                    'Update Password'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800 flex items-center">
                            <Bell className="h-5 w-5 mr-2" />
                            Notifications
                        </CardTitle>
                        <CardDescription>
                            Control your notification preferences
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between py-3 border-b border-beige-200">
                            <div className="space-y-0.5 flex-1">
                                <Label htmlFor="email-notifications" className="text-base cursor-pointer">Email Notifications</Label>
                                <p className="text-sm text-gray-500">
                                    Receive email updates about surveys and announcements
                                </p>
                            </div>
                            <Switch 
                                id="email-notifications"
                                checked={notificationSettings.email_notifications}
                                onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, email_notifications: checked }))}
                                disabled={notificationSaving}
                            />
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-beige-200">
                            <div className="space-y-0.5 flex-1">
                                <Label htmlFor="survey-reminders" className="text-base cursor-pointer">Survey Reminders</Label>
                                <p className="text-sm text-gray-500">
                                    Get reminded about pending surveys
                                </p>
                            </div>
                            <Switch 
                                id="survey-reminders"
                                checked={notificationSettings.survey_reminders}
                                onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, survey_reminders: checked }))}
                                disabled={notificationSaving}
                            />
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <div className="space-y-0.5 flex-1">
                                <Label htmlFor="network-updates" className="text-base cursor-pointer">Network Updates</Label>
                                <p className="text-sm text-gray-500">
                                    Notifications about connection requests and messages
                                </p>
                            </div>
                            <Switch 
                                id="network-updates"
                                checked={notificationSettings.network_updates}
                                onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, network_updates: checked }))}
                                disabled={notificationSaving}
                            />
                        </div>
                        <Button 
                            onClick={handleNotificationUpdate}
                            className="bg-maroon-700 hover:bg-maroon-800 text-white"
                            disabled={notificationSaving}
                        >
                            {notificationSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Notification Settings'
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Privacy Settings */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800 flex items-center">
                            <Eye className="h-5 w-5 mr-2" />
                            Privacy
                        </CardTitle>
                        <CardDescription>
                            Manage your privacy preferences
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between py-3 border-b border-beige-200">
                            <div className="space-y-0.5 flex-1">
                                <Label htmlFor="profile-visibility" className="text-base cursor-pointer">Profile Visibility</Label>
                                <p className="text-sm text-gray-500">
                                    Allow other alumni to see your profile
                                </p>
                            </div>
                            <Switch 
                                id="profile-visibility"
                                checked={privacySettings.profile_visibility}
                                onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, profile_visibility: checked }))}
                                disabled={privacySaving}
                            />
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-beige-200">
                            <div className="space-y-0.5 flex-1">
                                <Label htmlFor="show-employment" className="text-base cursor-pointer">Show Employment Status</Label>
                                <p className="text-sm text-gray-500">
                                    Display your current employment information
                                </p>
                            </div>
                            <Switch 
                                id="show-employment"
                                checked={privacySettings.show_employment_status}
                                onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, show_employment_status: checked }))}
                                disabled={privacySaving}
                            />
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <div className="space-y-0.5 flex-1">
                                <Label htmlFor="connection-requests" className="text-base cursor-pointer">Allow Connection Requests</Label>
                                <p className="text-sm text-gray-500">
                                    Let other alumni send you connection requests
                                </p>
                            </div>
                            <Switch 
                                id="connection-requests"
                                checked={privacySettings.allow_connection_requests}
                                onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, allow_connection_requests: checked }))}
                                disabled={privacySaving}
                            />
                        </div>
                        <Button 
                            onClick={handlePrivacyUpdate}
                            className="bg-maroon-700 hover:bg-maroon-800 text-white"
                            disabled={privacySaving}
                        >
                            {privacySaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Privacy Settings'
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </AlumniBaseLayout>
    );
}
