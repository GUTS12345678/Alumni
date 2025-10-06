import React from 'react';
import { Head } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon, User, Lock, Bell, Mail, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function Settings() {
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

                {/* Profile Settings */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800 flex items-center">
                            <User className="h-5 w-5 mr-2" />
                            Profile Settings
                        </CardTitle>
                        <CardDescription>
                            Update your personal information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input 
                                id="email" 
                                type="email" 
                                placeholder="your.email@example.com"
                                className="border-beige-300"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input 
                                id="phone" 
                                type="tel" 
                                placeholder="+1 (555) 123-4567"
                                className="border-beige-300"
                            />
                        </div>
                        <Button className="bg-maroon-700 hover:bg-maroon-800 text-white">
                            Save Changes
                        </Button>
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
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input 
                                id="current-password" 
                                type="password"
                                className="border-beige-300"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input 
                                id="new-password" 
                                type="password"
                                className="border-beige-300"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input 
                                id="confirm-password" 
                                type="password"
                                className="border-beige-300"
                            />
                        </div>
                        <Button className="bg-maroon-700 hover:bg-maroon-800 text-white">
                            Update Password
                        </Button>
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
                            <div className="space-y-0.5">
                                <Label className="text-base">Email Notifications</Label>
                                <p className="text-sm text-gray-500">
                                    Receive email updates about surveys and announcements
                                </p>
                            </div>
                            <input type="checkbox" className="h-5 w-5 text-maroon-600 rounded border-gray-300 focus:ring-maroon-500" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-beige-200">
                            <div className="space-y-0.5">
                                <Label className="text-base">Survey Reminders</Label>
                                <p className="text-sm text-gray-500">
                                    Get reminded about pending surveys
                                </p>
                            </div>
                            <input type="checkbox" className="h-5 w-5 text-maroon-600 rounded border-gray-300 focus:ring-maroon-500" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <div className="space-y-0.5">
                                <Label className="text-base">Network Updates</Label>
                                <p className="text-sm text-gray-500">
                                    Notifications about connection requests and messages
                                </p>
                            </div>
                            <input type="checkbox" className="h-5 w-5 text-maroon-600 rounded border-gray-300 focus:ring-maroon-500" defaultChecked />
                        </div>
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
                            <div className="space-y-0.5">
                                <Label className="text-base">Profile Visibility</Label>
                                <p className="text-sm text-gray-500">
                                    Allow other alumni to see your profile
                                </p>
                            </div>
                            <input type="checkbox" className="h-5 w-5 text-maroon-600 rounded border-gray-300 focus:ring-maroon-500" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-beige-200">
                            <div className="space-y-0.5">
                                <Label className="text-base">Show Employment Status</Label>
                                <p className="text-sm text-gray-500">
                                    Display your current employment information
                                </p>
                            </div>
                            <input type="checkbox" className="h-5 w-5 text-maroon-600 rounded border-gray-300 focus:ring-maroon-500" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <div className="space-y-0.5">
                                <Label className="text-base">Allow Connection Requests</Label>
                                <p className="text-sm text-gray-500">
                                    Let other alumni send you connection requests
                                </p>
                            </div>
                            <input type="checkbox" className="h-5 w-5 text-maroon-600 rounded border-gray-300 focus:ring-maroon-500" defaultChecked />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AlumniBaseLayout>
    );
}
