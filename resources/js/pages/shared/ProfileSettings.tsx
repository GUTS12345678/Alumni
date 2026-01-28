import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    User,
    Camera,
    Globe,
    Linkedin,
    Facebook,
    Twitter,
    Instagram,
    Github,
    Save,
    Check,
    Lock,
    Shield,
    Sun,
    Moon,
    Monitor,
    X
} from 'lucide-react';

interface PageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            role: 'super_admin' | 'admin' | 'alumni';
            status: string;
            profile_picture_path?: string | null;
            cover_photo_path?: string | null;
            phone_number?: string | null;
            bio?: string | null;
            location?: string | null;
            website?: string | null;
            social_links?: {
                linkedin?: string;
                facebook?: string;
                twitter?: string;
                instagram?: string;
                github?: string;
            } | null;
        };
    };
}

export default function ProfileSettings({ auth }: PageProps) {
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Determine which layout to use based on user role
    const isAlumni = auth.user.role === 'alumni';
    const BaseLayout = isAlumni ? AlumniBaseLayout : AdminBaseLayout;

    // Profile Settings
    // Helper function to get the correct image URL
    const getImageUrl = (path: string | null | undefined): string | null => {
        if (!path) return null;
        // If path already starts with /storage, use it as is
        if (path.startsWith('/storage')) return path;
        // Otherwise, prepend /storage/
        return `/storage/${path}`;
    };

    const [profileData, setProfileData] = useState({
        name: auth.user.name || '',
        email: auth.user.email || '',
        phoneNumber: auth.user.phone_number || '',
        bio: auth.user.bio || '',
        location: auth.user.location || '',
        website: auth.user.website || '',
        profilePicture: getImageUrl(auth.user.profile_picture_path),
        coverPhoto: getImageUrl(auth.user.cover_photo_path),
    });

    // Social Links
    const [socialLinks, setSocialLinks] = useState({
        linkedin: auth.user.social_links?.linkedin || '',
        facebook: auth.user.social_links?.facebook || '',
        twitter: auth.user.social_links?.twitter || '',
        instagram: auth.user.social_links?.instagram || '',
        github: auth.user.social_links?.github || '',
    });

    // Security Settings
    const [securityData, setSecurityData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleFileUpload = async (file: File, type: 'profile_picture' | 'cover_photo') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        try {
            // Get CSRF token from meta tag
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            // Get auth token from localStorage
            const authToken = localStorage.getItem('auth_token');

            const headers: HeadersInit = {
                'X-Requested-With': 'XMLHttpRequest',
            };

            if (csrfToken) {
                headers['X-CSRF-TOKEN'] = csrfToken;
            }

            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }

            const response = await fetch('/api/v1/profile/upload-image', {
                method: 'POST',
                headers: headers,
                body: formData,
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Upload response:', data); // Debug log
                if (data.success) {
                    // Update local state immediately with the new image URL
                    const imageUrl = data.data.url;
                    console.log('Setting image URL:', imageUrl, 'for type:', type); // Debug log
                    if (type === 'profile_picture') {
                        setProfileData(prev => ({ ...prev, profilePicture: imageUrl }));
                    } else {
                        setProfileData(prev => ({ ...prev, coverPhoto: imageUrl }));
                    }

                    // Show success message
                    alert('Image uploaded successfully!');

                    // Reload the page to update auth object and all components
                    window.location.reload();
                }
            } else {
                const errorData = await response.json();
                console.error('Upload failed:', errorData);
                alert('Failed to upload image: ' + (errorData.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload image. Please try again.');
        }
    };

    const handleDeleteImage = async (type: 'profile_picture' | 'cover_photo') => {
        if (!confirm(`Are you sure you want to remove this ${type === 'profile_picture' ? 'profile picture' : 'cover photo'}?`)) {
            return;
        }

        try {
            // Get CSRF token from meta tag
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            // Get auth token from localStorage
            const authToken = localStorage.getItem('auth_token');

            const headers: HeadersInit = {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json',
            };

            if (csrfToken) {
                headers['X-CSRF-TOKEN'] = csrfToken;
            }

            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }

            const response = await fetch('/api/v1/profile/delete-image', {
                method: 'DELETE',
                headers: headers,
                body: JSON.stringify({ type }),
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Delete response:', data); // Debug log
                if (data.success) {
                    // Update local state
                    if (type === 'profile_picture') {
                        setProfileData(prev => ({ ...prev, profilePicture: null }));
                    } else {
                        setProfileData(prev => ({ ...prev, coverPhoto: null }));
                    }

                    // Show success message
                    alert('Image removed successfully!');

                    // Reload the page to update auth object and all components
                    window.location.reload();
                }
            } else {
                const errorData = await response.json();
                console.error('Delete failed:', errorData);
                alert('Failed to remove image: ' + (errorData.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to remove image. Please try again.');
        }
    };

    const handleSave = async () => {
        setSaving(true);

        // Simulate API call
        setTimeout(() => {
            setSaving(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }, 1000);
    };

    const tabs = [
        { id: 'profile', name: 'Profile', icon: User },
        { id: 'security', name: 'Security', icon: Shield },
        { id: 'preferences', name: 'Preferences', icon: Globe },
    ];

    return (
        <BaseLayout title="Profile Settings" {...(isAlumni ? {} : { user: auth.user })}>
            <Head title="Profile Settings" />

            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-beige-200 dark:border-gray-700 p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile Settings</h1>
                            <p className="text-gray-600 dark:text-gray-300">
                                Manage your personal information and account preferences
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
                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center space-x-3">
                            <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                            <p className="text-green-800 dark:text-green-200 font-medium">Profile updated successfully!</p>
                        </div>
                    )}
                </div>

                {/* Profile Header with Cover Photo */}
                <Card className="overflow-hidden">
                    <div className="relative">
                        {/* Cover Photo */}
                        <div className="h-48 bg-gradient-to-r from-maroon-600 to-maroon-800 relative">
                            {profileData.coverPhoto ? (
                                <img src={profileData.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-white/50 text-center">
                                        <Camera className="h-12 w-12 mx-auto mb-2" />
                                        <p className="text-sm">Add cover photo</p>
                                    </div>
                                </div>
                            )}
                            <div className="absolute bottom-4 right-4 flex gap-3 z-20 pointer-events-none">
                                {profileData.coverPhoto && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDeleteImage('cover_photo');
                                        }}
                                        className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 shadow-lg flex items-center gap-2 font-medium text-sm pointer-events-auto"
                                        title="Remove cover photo"
                                    >
                                        <X className="h-5 w-5 pointer-events-none" />
                                        <span className="pointer-events-none">Remove</span>
                                    </button>
                                )}
                                <label className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg flex items-center gap-2 font-medium text-sm pointer-events-auto">
                                    <Camera className="h-5 w-5 pointer-events-none" />
                                    <span className="pointer-events-none">Upload</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'cover_photo')}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Profile Picture */}
                        <div className="px-6 pb-6">
                            <div className="relative -mt-16 mb-4">
                                <div className="relative inline-block">
                                    <div className="h-32 w-32 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden bg-gray-200 dark:bg-gray-700">
                                        {profileData.profilePicture ? (
                                            <img src={profileData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User className="h-16 w-16 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 flex gap-2 z-20 pointer-events-none">
                                        {profileData.profilePicture && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDeleteImage('profile_picture');
                                                }}
                                                className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700 shadow-lg pointer-events-auto"
                                                title="Remove profile picture"
                                            >
                                                <X className="h-5 w-5 pointer-events-none" />
                                            </button>
                                        )}
                                        <label className="bg-maroon-600 text-white p-3 rounded-full cursor-pointer hover:bg-maroon-700 shadow-lg pointer-events-auto block">
                                            <Camera className="h-5 w-5 pointer-events-none" />
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'profile_picture')}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{profileData.name}</h2>
                                <p className="text-gray-600 dark:text-gray-300">{profileData.email}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Tabs */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-beige-200 dark:border-gray-700 overflow-hidden">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="flex -mb-px">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as 'profile' | 'security' | 'preferences')}
                                        className={`flex items-center justify-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                            ? 'border-maroon-600 text-maroon-600 dark:text-maroon-400'
                                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
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
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="space-y-8">
                                {/* Basic Information */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Full Name</Label>
                                            <Input
                                                value={profileData.name}
                                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Email Address</Label>
                                            <Input
                                                type="email"
                                                value={profileData.email}
                                                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Phone Number</Label>
                                            <Input
                                                type="tel"
                                                value={profileData.phoneNumber}
                                                onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                                                placeholder="+63 912 345 6789"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Location</Label>
                                            <Input
                                                value={profileData.location}
                                                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                                                placeholder="City, Country"
                                            />
                                        </div>

                                        <div className="md:col-span-2 space-y-2">
                                            <Label>Website</Label>
                                            <Input
                                                type="url"
                                                value={profileData.website}
                                                onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                                                placeholder="https://yourwebsite.com"
                                            />
                                        </div>

                                        <div className="md:col-span-2 space-y-2">
                                            <Label>Bio</Label>
                                            <Textarea
                                                value={profileData.bio}
                                                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                                rows={4}
                                                placeholder="Tell us about yourself..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Social Links */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Social Links</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                                                <Linkedin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <Input
                                                value={socialLinks.linkedin}
                                                onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                                                placeholder="https://linkedin.com/in/yourprofile"
                                                className="flex-1"
                                            />
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                                                <Facebook className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <Input
                                                value={socialLinks.facebook}
                                                onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                                                placeholder="https://facebook.com/yourprofile"
                                                className="flex-1"
                                            />
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0 bg-sky-100 dark:bg-sky-900/30 p-2 rounded-lg">
                                                <Twitter className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                                            </div>
                                            <Input
                                                value={socialLinks.twitter}
                                                onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                                                placeholder="https://twitter.com/yourhandle"
                                                className="flex-1"
                                            />
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0 bg-pink-100 dark:bg-pink-900/30 p-2 rounded-lg">
                                                <Instagram className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                                            </div>
                                            <Input
                                                value={socialLinks.instagram}
                                                onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                                                placeholder="https://instagram.com/yourhandle"
                                                className="flex-1"
                                            />
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                                                <Github className="h-5 w-5 text-gray-900 dark:text-gray-100" />
                                            </div>
                                            <Input
                                                value={socialLinks.github}
                                                onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })}
                                                placeholder="https://github.com/yourusername"
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Password</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Current Password</Label>
                                            <Input
                                                type="password"
                                                value={securityData.currentPassword}
                                                onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>New Password</Label>
                                            <Input
                                                type="password"
                                                value={securityData.newPassword}
                                                onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Confirm New Password</Label>
                                            <Input
                                                type="password"
                                                value={securityData.confirmPassword}
                                                onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                                            />
                                        </div>

                                        <Button className="bg-maroon-600 hover:bg-maroon-700">
                                            <Lock className="h-4 w-4 mr-2" />
                                            Update Password
                                        </Button>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Two-Factor Authentication</h3>
                                    <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">2FA Status</p>
                                                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                                        Add an extra layer of security to your account
                                                    </p>
                                                </div>
                                                <Button variant="outline" size="sm">
                                                    Setup 2FA
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {/* Preferences Tab */}
                        {activeTab === 'preferences' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h3>
                                    <div className="space-y-4">
                                        <Label>Theme</Label>
                                        <div className="grid grid-cols-3 gap-4">
                                            <Card className="cursor-pointer hover:border-maroon-600">
                                                <CardContent className="p-4 text-center">
                                                    <div className="h-12 w-12 mx-auto mb-2 bg-white rounded-full flex items-center justify-center border-2">
                                                        <Sun className="h-6 w-6 text-yellow-500" />
                                                    </div>
                                                    <p className="text-sm font-medium">Light</p>
                                                </CardContent>
                                            </Card>

                                            <Card className="cursor-pointer hover:border-maroon-600">
                                                <CardContent className="p-4 text-center">
                                                    <div className="h-12 w-12 mx-auto mb-2 bg-gray-900 rounded-full flex items-center justify-center border-2">
                                                        <Moon className="h-6 w-6 text-blue-300" />
                                                    </div>
                                                    <p className="text-sm font-medium">Dark</p>
                                                </CardContent>
                                            </Card>

                                            <Card className="cursor-pointer hover:border-maroon-600">
                                                <CardContent className="p-4 text-center">
                                                    <div className="h-12 w-12 mx-auto mb-2 bg-gradient-to-br from-white to-gray-900 rounded-full flex items-center justify-center border-2">
                                                        <Monitor className="h-6 w-6 text-gray-600" />
                                                    </div>
                                                    <p className="text-sm font-medium">System</p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Language</h3>
                                    <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white">
                                        <option value="en">English</option>
                                        <option value="fil">Filipino</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </BaseLayout>
    );
}
