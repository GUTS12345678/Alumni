import React, { useState, useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Building,
    Camera,
    Save,
    Check,
    Palette,
    Image as ImageIcon,
    AlertCircle,
    RefreshCw,
    X,
    ChevronDown
} from 'lucide-react';
import axios from 'axios';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface Department {
    id: number;
    name: string;
    code: string;
    description?: string;
    logo_path?: string | null;
    background_image_path?: string | null;
    primary_color: string;
    secondary_color: string;
    custom_css?: string | null;
    status: string;
}

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
}

export default function DepartmentSettings({ auth }: PageProps) {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
    const { confirm, confirmState, handleConfirm, handleCancel } = useConfirmDialog();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingBackground, setUploadingBackground] = useState(false);

    // Helper function to get the correct image URL
    const getImageUrl = (path: string | null | undefined): string | null => {
        if (!path) return null;
        if (path.startsWith('http') || path.startsWith('/')) return path;
        // Department images are served via the public asset route (no auth required)
        return `/api/v1/assets/${path}`;
    };

    const fetchDepartments = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/v1/admin/departments/active');
            if (response.data.success) {
                const depts = response.data.data;
                setDepartments(depts);

                // Check if there's a department ID in the URL query parameter
                const urlParams = new URLSearchParams(window.location.search);
                const departmentId = urlParams.get('department');

                if (departmentId && !selectedDepartment) {
                    // Fetch details for the specified department
                    fetchDepartmentDetails(Number(departmentId));
                } else if (depts.length > 0 && !selectedDepartment) {
                    // Fetch full details for the first department
                    fetchDepartmentDetails(depts[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedDepartment]);

    useEffect(() => {
        fetchDepartments();
    }, [fetchDepartments]);

    const fetchDepartmentDetails = async (id: number) => {
        try {
            const response = await axios.get(`/api/v1/admin/departments/${id}`);
            if (response.data.success) {
                setSelectedDepartment(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching department details:', error);
        }
    };

    const handleDepartmentSelect = (dept: Department) => {
        fetchDepartmentDetails(dept.id);
    };

    const handleFileUpload = async (file: File, type: 'logo' | 'background') => {
        if (!selectedDepartment) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        formData.append('department_id', selectedDepartment.id.toString());

        try {
            if (type === 'logo') {
                setUploadingLogo(true);
            } else {
                setUploadingBackground(true);
            }

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

            const response = await fetch('/api/v1/admin/departments/upload-image', {
                method: 'POST',
                headers: headers,
                body: formData,
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Upload response:', data); // Debug log
                if (data.success) {
                    // Update selected department with new image URL
                    const imageUrl = data.data.url;
                    console.log('Setting image URL:', imageUrl, 'for type:', type); // Debug log
                    setSelectedDepartment(prev => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            [type === 'logo' ? 'logo_path' : 'background_image_path']: imageUrl
                        };
                    });

                    // Show success message
                    alert('Image uploaded successfully!');
                    setShowSuccess(true);
                    setTimeout(() => setShowSuccess(false), 3000);

                    // Reload to refresh department data
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
        } finally {
            setUploadingLogo(false);
            setUploadingBackground(false);
        }
    };

    const handleDeleteImage = async (type: 'logo' | 'background') => {
        if (!selectedDepartment) return;

        const ok = await confirm({ title: 'Remove Image', message: `Are you sure you want to remove this ${type === 'logo' ? 'logo' : 'background image'}?`, variant: 'destructive', confirmLabel: 'Remove' });
        if (!ok) {
            return;
        }

        try {
            if (type === 'logo') {
                setUploadingLogo(true);
            } else {
                setUploadingBackground(true);
            }

            // Update department to clear the image path
            const response = await axios.put(`/api/v1/admin/departments/${selectedDepartment.id}`, {
                name: selectedDepartment.name,
                code: selectedDepartment.code,
                description: selectedDepartment.description,
                status: selectedDepartment.status,
                primary_color: selectedDepartment.primary_color,
                secondary_color: selectedDepartment.secondary_color,
                custom_css: selectedDepartment.custom_css,
                [type === 'logo' ? 'logo_path' : 'background_image_path']: null,
            });

            if (response.data.success) {
                setSelectedDepartment(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        [type === 'logo' ? 'logo_path' : 'background_image_path']: null
                    };
                });

                alert('Image removed successfully!');
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);

                // Reload to refresh all department data
                window.location.reload();
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            alert('Failed to remove image. Please try again.');
        } finally {
            setUploadingLogo(false);
            setUploadingBackground(false);
        }
    };

    const handleSave = async () => {
        if (!selectedDepartment) return;

        try {
            setSaving(true);
            const response = await axios.put(`/api/v1/admin/departments/${selectedDepartment.id}`, {
                name: selectedDepartment.name,
                code: selectedDepartment.code,
                description: selectedDepartment.description,
                primary_color: selectedDepartment.primary_color,
                secondary_color: selectedDepartment.secondary_color,
                custom_css: selectedDepartment.custom_css,
            });

            if (response.data.success) {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
                fetchDepartments();
            }
        } catch (error) {
            console.error('Error saving department:', error);
            alert('Failed to save changes. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminBaseLayout title="Department Settings" user={auth.user}>
                <Head title="Department Settings" />
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <RefreshCw className="h-12 w-12 text-maroon-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Loading departments...</p>
                    </div>
                </div>
            </AdminBaseLayout>
        );
    }

    return (
        <AdminBaseLayout title="Department Settings" user={auth.user}>
            <Head title="Department Settings" />

            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-beige-200 p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Department Settings</h1>
                            <p className="text-gray-600">
                                Customize department branding, colors, and visual identity
                            </p>
                        </div>
                        {selectedDepartment && (
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-maroon-600 hover:bg-maroon-700 text-white"
                            >
                                <Save className={`h-5 w-5 mr-2 ${saving ? 'animate-spin' : ''}`} />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        )}
                    </div>

                    {showSuccess && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
                            <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                            <p className="text-green-800 font-medium">Department settings updated successfully!</p>
                        </div>
                    )}
                </div>

                {/* Department Selector */}
                <Card>
                    <CardContent className="p-4">
                        <Label htmlFor="department-select" className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Select Department
                        </Label>
                        <div className="relative">
                            <select
                                id="department-select"
                                value={selectedDepartment?.id || ''}
                                onChange={(e) => {
                                    const dept = departments.find(d => d.id === Number(e.target.value));
                                    if (dept) handleDepartmentSelect(dept);
                                }}
                                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent appearance-none bg-white text-gray-900 font-medium"
                            >
                                <option value="" disabled>Choose a department...</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name} ({dept.code})
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content */}
                <div className="space-y-6">
                    {!selectedDepartment ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No Department Selected
                                </h3>
                                <p className="text-gray-600">
                                    Select a department from the list to customize its settings
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Background Image Section */}
                            <Card className="overflow-hidden">
                                <div className="relative">
                                    {/* Background Image */}
                                    <div className="h-48 relative"
                                        style={{
                                            background: selectedDepartment.background_image_path
                                                ? `url(${getImageUrl(selectedDepartment.background_image_path)}) center/cover`
                                                : `linear-gradient(135deg, ${selectedDepartment.primary_color} 0%, ${selectedDepartment.secondary_color} 100%)`
                                        }}
                                    >
                                        {!selectedDepartment.background_image_path && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="text-white/70 text-center">
                                                    <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                                                    <p className="text-sm">Add department background</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute bottom-4 right-4 flex gap-3 z-20 pointer-events-none">
                                            {selectedDepartment.background_image_path && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleDeleteImage('background');
                                                    }}
                                                    disabled={uploadingBackground}
                                                    className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 shadow-lg disabled:opacity-50 flex items-center gap-2 font-medium text-sm transition-colors pointer-events-auto"
                                                    title="Remove background"
                                                >
                                                    <X className="h-5 w-5 pointer-events-none" />
                                                    <span className="pointer-events-none">Remove</span>
                                                </button>
                                            )}
                                            <label className="bg-white text-gray-900 px-4 py-3 rounded-lg cursor-pointer hover:bg-gray-100 shadow-lg flex items-center gap-2 font-medium text-sm transition-colors pointer-events-auto">
                                                <Camera className="h-5 w-5 pointer-events-none" />
                                                <span className="pointer-events-none">Upload</span>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    disabled={uploadingBackground}
                                                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'background')}
                                                />
                                            </label>
                                        </div>
                                        {uploadingBackground && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <RefreshCw className="h-8 w-8 text-white animate-spin" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Department Logo */}
                                    <div className="px-6 pb-6">
                                        <div className="relative -mt-16 mb-4">
                                            <div className="relative inline-block">
                                                <div className="h-32 w-32 rounded-xl border-4 border-white overflow-hidden bg-white shadow-lg">
                                                    {selectedDepartment.logo_path ? (
                                                        <img
                                                            src={getImageUrl(selectedDepartment.logo_path) || ''}
                                                            alt={selectedDepartment.name}
                                                            className="w-full h-full object-contain p-2"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                            <Building className="h-12 w-12 text-gray-400" />
                                                        </div>
                                                    )}
                                                    {uploadingLogo && (
                                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                            <RefreshCw className="h-8 w-8 text-white animate-spin" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="absolute -bottom-2 -right-2 flex gap-2 z-20 pointer-events-none">
                                                    {selectedDepartment.logo_path && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleDeleteImage('logo');
                                                            }}
                                                            disabled={uploadingLogo}
                                                            className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700 shadow-lg disabled:opacity-50 transition-colors pointer-events-auto"
                                                            title="Remove logo"
                                                        >
                                                            <X className="h-5 w-5 pointer-events-none" />
                                                        </button>
                                                    )}
                                                    <label className="bg-maroon-600 text-white p-3 rounded-full cursor-pointer hover:bg-maroon-700 shadow-lg transition-colors pointer-events-auto block">
                                                        <Camera className="h-5 w-5 pointer-events-none" />
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*"
                                                            disabled={uploadingLogo}
                                                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo')}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">{selectedDepartment.name}</h2>
                                            <p className="text-gray-600">{selectedDepartment.code}</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Basic Information */}
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Department Name</Label>
                                                <Input
                                                    value={selectedDepartment.name}
                                                    onChange={(e) => setSelectedDepartment({
                                                        ...selectedDepartment,
                                                        name: e.target.value
                                                    })}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Department Code</Label>
                                                <Input
                                                    value={selectedDepartment.code}
                                                    onChange={(e) => setSelectedDepartment({
                                                        ...selectedDepartment,
                                                        code: e.target.value
                                                    })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Textarea
                                                value={selectedDepartment.description || ''}
                                                onChange={(e) => setSelectedDepartment({
                                                    ...selectedDepartment,
                                                    description: e.target.value
                                                })}
                                                rows={4}
                                                placeholder="Enter department description..."
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Brand Colors */}
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Palette className="h-5 w-5" />
                                        Brand Colors
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Primary Color</Label>
                                            <div className="flex items-center gap-3">
                                                <Input
                                                    type="color"
                                                    value={selectedDepartment.primary_color}
                                                    onChange={(e) => setSelectedDepartment({
                                                        ...selectedDepartment,
                                                        primary_color: e.target.value
                                                    })}
                                                    className="w-20 h-12 cursor-pointer"
                                                />
                                                <Input
                                                    type="text"
                                                    value={selectedDepartment.primary_color}
                                                    onChange={(e) => setSelectedDepartment({
                                                        ...selectedDepartment,
                                                        primary_color: e.target.value
                                                    })}
                                                    className="flex-1 font-mono"
                                                    placeholder="#7C2529"
                                                />
                                            </div>
                                            <p className="text-sm text-gray-500">Used for main branding elements</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Secondary Color</Label>
                                            <div className="flex items-center gap-3">
                                                <Input
                                                    type="color"
                                                    value={selectedDepartment.secondary_color}
                                                    onChange={(e) => setSelectedDepartment({
                                                        ...selectedDepartment,
                                                        secondary_color: e.target.value
                                                    })}
                                                    className="w-20 h-12 cursor-pointer"
                                                />
                                                <Input
                                                    type="text"
                                                    value={selectedDepartment.secondary_color}
                                                    onChange={(e) => setSelectedDepartment({
                                                        ...selectedDepartment,
                                                        secondary_color: e.target.value
                                                    })}
                                                    className="flex-1 font-mono"
                                                    placeholder="#B89968"
                                                />
                                            </div>
                                            <p className="text-sm text-gray-500">Used for accents and highlights</p>
                                        </div>
                                    </div>

                                    {/* Color Preview */}
                                    <div className="mt-6 p-6 rounded-lg border-2 border-gray-200"
                                        style={{
                                            background: `linear-gradient(135deg, ${selectedDepartment.primary_color} 0%, ${selectedDepartment.secondary_color} 100%)`
                                        }}
                                    >
                                        <div className="text-center text-white">
                                            <h4 className="text-xl font-bold mb-2">{selectedDepartment.name}</h4>
                                            <p className="text-white/90">Color Preview</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Custom CSS */}
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">Custom CSS (Advanced)</h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Add custom CSS styling for this department's pages
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 text-amber-600 text-xs">
                                            <AlertCircle className="h-4 w-4" />
                                            <span>Advanced Users Only</span>
                                        </div>
                                    </div>
                                    <Textarea
                                        value={selectedDepartment.custom_css || ''}
                                        onChange={(e) => setSelectedDepartment({
                                            ...selectedDepartment,
                                            custom_css: e.target.value
                                        })}
                                        rows={8}
                                        className="font-mono text-sm"
                                        placeholder=".department-header { background: linear-gradient(...); }"
                                    />
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </div>
            <ConfirmDialog open={confirmState.open} title={confirmState.title} message={confirmState.message} confirmLabel={confirmState.confirmLabel} cancelLabel={confirmState.cancelLabel} variant={confirmState.variant} onConfirm={handleConfirm} onCancel={handleCancel} />
        </AdminBaseLayout>
    );
}
