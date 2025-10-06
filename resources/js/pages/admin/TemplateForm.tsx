import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Save,
    X,
    Plus,
    Mail,
    Eye,
    Code,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';

interface TemplateFormProps {
    mode: 'create' | 'edit';
    templateId?: string;
}

interface TemplateData {
    name: string;
    subject: string;
    body: string;
    category: string;
    type: 'notification' | 'reminder' | 'announcement' | 'survey' | 'system';
    status: 'active' | 'inactive' | 'draft';
    variables: string[];
}

export default function TemplateForm({ mode, templateId }: TemplateFormProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [newVariable, setNewVariable] = useState('');

    const [formData, setFormData] = useState<TemplateData>({
        name: '',
        subject: '',
        body: '',
        category: '',
        type: 'notification',
        status: 'draft',
        variables: []
    });

    const templateTypes = [
        { value: 'notification', label: 'Notification' },
        { value: 'reminder', label: 'Reminder' },
        { value: 'announcement', label: 'Announcement' },
        { value: 'survey', label: 'Survey' },
        { value: 'system', label: 'System' },
    ];

    const commonCategories = [
        'Onboarding',
        'Surveys',
        'Events',
        'Account',
        'Newsletter',
        'Career',
        'Notifications',
        'Reminders',
        'Announcements'
    ];

    const commonVariables = [
        'first_name',
        'last_name',
        'email',
        'survey_title',
        'survey_link',
        'event_name',
        'event_date',
        'event_location',
        'company_name',
        'job_title',
        'deadline_date',
        'verification_link',
        'reset_link'
    ];

    useEffect(() => {
        if (mode === 'edit' && templateId) {
            fetchTemplate();
        }
    }, [mode, templateId]);

    const fetchTemplate = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');

            if (!token) {
                router.visit('/login');
                return;
            }

            const response = await fetch(`/api/v1/admin/email-templates/${templateId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');
                    router.visit('/login');
                    return;
                }
                throw new Error('Failed to fetch template');
            }

            const data = await response.json();
            if (data.success && data.data) {
                setFormData({
                    name: data.data.name || '',
                    subject: data.data.subject || '',
                    body: data.data.body || '',
                    category: data.data.category || '',
                    type: data.data.type || 'notification',
                    status: data.data.status || 'draft',
                    variables: data.data.variables || []
                });
            }
        } catch (err) {
            console.error('Template fetch error:', err);
            setError('Failed to load template');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.subject || !formData.body) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const token = localStorage.getItem('auth_token');
            if (!token) {
                router.visit('/login');
                return;
            }

            const url = mode === 'create' 
                ? '/api/v1/admin/email-templates'
                : `/api/v1/admin/email-templates/${templateId}`;

            const method = mode === 'create' ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');
                    router.visit('/login');
                    return;
                }
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save template');
            }

            const data = await response.json();
            if (data.success) {
                router.visit('/admin/email-templates', {
                    onSuccess: () => {
                        // Show success message
                    }
                });
            }
        } catch (err: any) {
            console.error('Save template error:', err);
            setError(err.message || 'Failed to save template');
        } finally {
            setSaving(false);
        }
    };

    const handleAddVariable = () => {
        if (newVariable && !formData.variables.includes(newVariable)) {
            setFormData({
                ...formData,
                variables: [...formData.variables, newVariable]
            });
            setNewVariable('');
        }
    };

    const handleRemoveVariable = (variable: string) => {
        setFormData({
            ...formData,
            variables: formData.variables.filter(v => v !== variable)
        });
    };

    const insertVariableIntoBody = (variable: string) => {
        const variablePlaceholder = `{{${variable}}}`;
        setFormData({
            ...formData,
            body: formData.body + variablePlaceholder
        });
    };

    const insertVariableIntoSubject = (variable: string) => {
        const variablePlaceholder = `{{${variable}}}`;
        setFormData({
            ...formData,
            subject: formData.subject + variablePlaceholder
        });
    };

    if (loading) {
        return (
            <AdminBaseLayout title={mode === 'create' ? 'Create Email Template' : 'Edit Email Template'}>
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="h-8 w-8 text-maroon-600 animate-spin" />
                        <span className="text-maroon-800 font-medium">Loading template...</span>
                    </div>
                </div>
            </AdminBaseLayout>
        );
    }

    return (
        <AdminBaseLayout title={mode === 'create' ? 'Create Email Template' : 'Edit Email Template'}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button
                            onClick={() => router.visit('/admin/email-templates')}
                            variant="outline"
                            size="sm"
                            className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Templates
                        </Button>
                        <div>
                            <h2 className="text-2xl font-bold text-maroon-800">
                                {mode === 'create' ? 'Create New Template' : 'Edit Template'}
                            </h2>
                            <p className="text-maroon-600">
                                {mode === 'create' 
                                    ? 'Design a new email template'
                                    : 'Update template details and content'
                                }
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={() => setShowPreview(!showPreview)}
                            variant="outline"
                            size="sm"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                            {showPreview ? <Code className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                            {showPreview ? 'Edit' : 'Preview'}
                        </Button>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2 text-red-800">
                                <AlertCircle className="h-5 w-5" />
                                <p>{error}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Form */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Basic Information */}
                            <Card className="border-beige-200 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-xl text-maroon-800">Basic Information</CardTitle>
                                    <CardDescription className="text-maroon-600">
                                        General template details and identification
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="name" className="text-maroon-800">
                                            Template Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., Welcome Email"
                                            required
                                            className="border-beige-300 focus:border-maroon-400 focus:ring-maroon-200"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="category" className="text-maroon-800">
                                            Category <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="flex space-x-2">
                                            <select
                                                id="category"
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                required
                                                className="flex-1 px-3 py-2 border border-beige-300 rounded-md focus:border-maroon-400 focus:ring-maroon-200"
                                            >
                                                <option value="">Select a category</option>
                                                {commonCategories.map((cat) => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                            <Input
                                                placeholder="Or type custom..."
                                                value={!commonCategories.includes(formData.category) ? formData.category : ''}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="flex-1 border-beige-300 focus:border-maroon-400 focus:ring-maroon-200"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="type" className="text-maroon-800">
                                                Type <span className="text-red-500">*</span>
                                            </Label>
                                            <select
                                                id="type"
                                                value={formData.type}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                                required
                                                className="w-full px-3 py-2 border border-beige-300 rounded-md focus:border-maroon-400 focus:ring-maroon-200"
                                            >
                                                {templateTypes.map((type) => (
                                                    <option key={type.value} value={type.value}>
                                                        {type.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <Label htmlFor="status" className="text-maroon-800">
                                                Status <span className="text-red-500">*</span>
                                            </Label>
                                            <select
                                                id="status"
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                                required
                                                className="w-full px-3 py-2 border border-beige-300 rounded-md focus:border-maroon-400 focus:ring-maroon-200"
                                            >
                                                <option value="draft">Draft</option>
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Email Content */}
                            <Card className="border-beige-200 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-xl text-maroon-800">Email Content</CardTitle>
                                    <CardDescription className="text-maroon-600">
                                        {showPreview ? 'Preview how the email will look' : 'Subject line and email body'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {!showPreview ? (
                                        <>
                                            <div>
                                                <Label htmlFor="subject" className="text-maroon-800">
                                                    Subject Line <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="subject"
                                                    value={formData.subject}
                                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                    placeholder="e.g., Welcome to Alumni Tracer System"
                                                    required
                                                    className="border-beige-300 focus:border-maroon-400 focus:ring-maroon-200"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Use variables like {'{{first_name}}'} for personalization
                                                </p>
                                            </div>

                                            <div>
                                                <Label htmlFor="body" className="text-maroon-800">
                                                    Email Body <span className="text-red-500">*</span>
                                                </Label>
                                                <textarea
                                                    id="body"
                                                    value={formData.body}
                                                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                                    placeholder="Enter your email HTML content here..."
                                                    required
                                                    rows={15}
                                                    className="w-full px-3 py-2 border border-beige-300 rounded-md focus:border-maroon-400 focus:ring-maroon-200 font-mono text-sm"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    HTML content is supported. Use variables for dynamic content.
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <Label className="text-maroon-800">Subject Preview:</Label>
                                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                                                    <Mail className="inline h-4 w-4 mr-2 text-gray-600" />
                                                    <span className="font-medium">{formData.subject || 'No subject'}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-maroon-800">Body Preview:</Label>
                                                <div
                                                    className="p-4 bg-white border border-gray-200 rounded-md min-h-[400px]"
                                                    dangerouslySetInnerHTML={{ __html: formData.body || '<p class="text-gray-400">No content</p>' }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Actions */}
                            <Card className="border-beige-200 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-lg text-maroon-800">Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="w-full bg-maroon-700 hover:bg-maroon-800 text-white"
                                    >
                                        {saving ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                {mode === 'create' ? 'Create Template' : 'Update Template'}
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        type="button"
                                        onClick={() => router.visit('/admin/email-templates')}
                                        variant="outline"
                                        className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Variables */}
                            <Card className="border-beige-200 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-lg text-maroon-800">Template Variables</CardTitle>
                                    <CardDescription className="text-maroon-600 text-xs">
                                        Add variables to personalize emails
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label className="text-maroon-800 text-sm">Add Variable</Label>
                                        <div className="flex space-x-2">
                                            <Input
                                                value={newVariable}
                                                onChange={(e) => setNewVariable(e.target.value)}
                                                placeholder="e.g., first_name"
                                                className="border-beige-300 focus:border-maroon-400 focus:ring-maroon-200 text-sm"
                                            />
                                            <Button
                                                type="button"
                                                onClick={handleAddVariable}
                                                size="sm"
                                                className="bg-maroon-700 hover:bg-maroon-800"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-maroon-800 text-sm">Common Variables</Label>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {commonVariables.map((variable) => (
                                                <Badge
                                                    key={variable}
                                                    onClick={() => {
                                                        if (!formData.variables.includes(variable)) {
                                                            setFormData({
                                                                ...formData,
                                                                variables: [...formData.variables, variable]
                                                            });
                                                        }
                                                    }}
                                                    className="bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200 text-xs"
                                                >
                                                    + {variable}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {formData.variables.length > 0 && (
                                        <div>
                                            <Label className="text-maroon-800 text-sm">Active Variables</Label>
                                            <div className="space-y-1 mt-2">
                                                {formData.variables.map((variable) => (
                                                    <div
                                                        key={variable}
                                                        className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded text-xs"
                                                    >
                                                        <code className="text-green-800">{'{{' + variable + '}}'}</code>
                                                        <div className="flex items-center space-x-1">
                                                            <Button
                                                                type="button"
                                                                onClick={() => insertVariableIntoSubject(variable)}
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-6 px-2 text-blue-700 hover:bg-blue-100"
                                                                title="Insert into subject"
                                                            >
                                                                S
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                onClick={() => insertVariableIntoBody(variable)}
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-6 px-2 text-purple-700 hover:bg-purple-100"
                                                                title="Insert into body"
                                                            >
                                                                B
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                onClick={() => handleRemoveVariable(variable)}
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-6 px-2 text-red-700 hover:bg-red-100"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </AdminBaseLayout>
    );
}
