import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Edit,
    Trash2,
    Mail,
    Calendar,
    User,
    Tag,
    FileText,
    Send,
    Copy,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Clock,
    AlertTriangle,
    Eye,
    Code
} from 'lucide-react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';

interface TemplateViewProps {
    templateId: string;
}

interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    category: string;
    type: 'notification' | 'reminder' | 'announcement' | 'survey' | 'system';
    status: 'active' | 'inactive' | 'draft';
    variables: string[];
    usage_count: number;
    last_sent_at: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
    creator?: {
        name: string;
        email: string;
    };
}

export default function TemplateView({ templateId }: TemplateViewProps) {
    const [template, setTemplate] = useState<EmailTemplate | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showHtml, setShowHtml] = useState(false);

    useEffect(() => {
        fetchTemplate();
    }, [templateId]);

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
                if (response.status === 404) {
                    setError('Template not found');
                    return;
                }
                throw new Error('Failed to fetch template');
            }

            const data = await response.json();
            if (data.success && data.data) {
                setTemplate(data.data);
            }
        } catch (err) {
            console.error('Template fetch error:', err);
            setError('Failed to load template');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this email template? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/v1/admin/email-templates/${templateId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                router.visit('/admin/email-templates');
            }
        } catch (error) {
            console.error('Delete template error:', error);
        }
    };

    const handleDuplicate = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/v1/admin/email-templates/${templateId}/duplicate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    router.visit(`/admin/email-templates/${data.data.id}/edit`);
                }
            }
        } catch (error) {
            console.error('Duplicate template error:', error);
        }
    };

    const handleSendTest = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/v1/admin/email-templates/${templateId}/test`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                alert('Test email sent successfully!');
            }
        } catch (error) {
            console.error('Send test email error:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'active': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
            'inactive': { color: 'bg-gray-100 text-gray-800', icon: Clock },
            'draft': { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
        const Icon = config.icon;

        return (
            <Badge className={config.color}>
                <Icon className="h-3 w-3 mr-1" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const getTypeBadge = (type: string) => {
        const typeColors: Record<string, string> = {
            'notification': 'bg-blue-100 text-blue-800',
            'reminder': 'bg-orange-100 text-orange-800',
            'announcement': 'bg-purple-100 text-purple-800',
            'survey': 'bg-green-100 text-green-800',
            'system': 'bg-red-100 text-red-800',
        };

        return (
            <Badge className={typeColors[type] || 'bg-gray-100 text-gray-800'}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
            </Badge>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <AdminBaseLayout title="View Email Template">
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="h-8 w-8 text-maroon-600 animate-spin" />
                        <span className="text-maroon-800 font-medium">Loading template...</span>
                    </div>
                </div>
            </AdminBaseLayout>
        );
    }

    if (error || !template) {
        return (
            <AdminBaseLayout title="View Email Template">
                <Card className="border-red-200">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <p className="text-red-600 mb-4">{error || 'Template not found'}</p>
                            <Button
                                onClick={() => router.visit('/admin/email-templates')}
                                className="bg-maroon-700 hover:bg-maroon-800"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Templates
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </AdminBaseLayout>
        );
    }

    return (
        <AdminBaseLayout title="View Email Template">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center space-x-4">
                        <Button
                            onClick={() => router.visit('/admin/email-templates')}
                            variant="outline"
                            size="sm"
                            className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <div className="flex items-center space-x-2 mb-1">
                                <Mail className="h-6 w-6 text-maroon-600" />
                                <h2 className="text-2xl font-bold text-maroon-800">{template.name}</h2>
                            </div>
                            <div className="flex items-center space-x-2">
                                {getTypeBadge(template.type)}
                                {getStatusBadge(template.status)}
                                <Badge className="bg-beige-200 text-maroon-800">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {template.category}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={handleSendTest}
                            variant="outline"
                            size="sm"
                            className="border-green-300 text-green-700 hover:bg-green-50"
                        >
                            <Send className="h-4 w-4 mr-2" />
                            Send Test
                        </Button>

                        <Button
                            onClick={handleDuplicate}
                            variant="outline"
                            size="sm"
                            className="border-purple-300 text-purple-700 hover:bg-purple-50"
                        >
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                        </Button>

                        <Button
                            onClick={() => router.visit(`/admin/email-templates/${templateId}/edit`)}
                            variant="outline"
                            size="sm"
                            className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Button>

                        <Button
                            onClick={handleDelete}
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Subject */}
                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-xl text-maroon-800">Email Subject</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-lg font-medium text-blue-900">{template.subject}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Body */}
                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl text-maroon-800">Email Body</CardTitle>
                                    <CardDescription className="text-maroon-600">
                                        {showHtml ? 'HTML Source Code' : 'Rendered Preview'}
                                    </CardDescription>
                                </div>
                                <Button
                                    onClick={() => setShowHtml(!showHtml)}
                                    variant="outline"
                                    size="sm"
                                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                >
                                    {showHtml ? <Eye className="h-4 w-4 mr-2" /> : <Code className="h-4 w-4 mr-2" />}
                                    {showHtml ? 'Preview' : 'HTML'}
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {showHtml ? (
                                    <pre className="p-4 bg-gray-50 border border-gray-200 rounded-lg overflow-x-auto">
                                        <code className="text-sm text-gray-800">{template.body}</code>
                                    </pre>
                                ) : (
                                    <div
                                        className="p-6 bg-white border border-gray-200 rounded-lg min-h-[400px]"
                                        dangerouslySetInnerHTML={{ __html: template.body }}
                                    />
                                )}
                            </CardContent>
                        </Card>

                        {/* Variables */}
                        {template.variables.length > 0 && (
                            <Card className="border-beige-200 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-xl text-maroon-800">Template Variables</CardTitle>
                                    <CardDescription className="text-maroon-600">
                                        Dynamic placeholders used in this template
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {template.variables.map((variable, index) => (
                                            <Badge key={index} className="bg-green-100 text-green-800 text-sm px-3 py-1">
                                                <code>{'{{' + variable + '}}'}</code>
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Usage Statistics */}
                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-lg text-maroon-800">Usage Statistics</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <Send className="h-5 w-5 text-blue-600" />
                                        <span className="text-sm text-blue-900">Times Sent</span>
                                    </div>
                                    <span className="text-xl font-bold text-blue-700">
                                        {template.usage_count.toLocaleString()}
                                    </span>
                                </div>

                                {template.last_sent_at && (
                                    <div className="p-3 bg-purple-50 rounded-lg">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <Clock className="h-4 w-4 text-purple-600" />
                                            <span className="text-sm font-medium text-purple-900">Last Sent</span>
                                        </div>
                                        <p className="text-xs text-purple-700 ml-6">
                                            {formatDate(template.last_sent_at)}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Metadata */}
                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-lg text-maroon-800">Template Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex items-start space-x-2">
                                    <User className="h-4 w-4 text-maroon-600 mt-0.5" />
                                    <div>
                                        <p className="text-gray-600">Created By</p>
                                        <p className="font-medium text-maroon-800">
                                            {template.creator?.name || template.created_by}
                                        </p>
                                        {template.creator?.email && (
                                            <p className="text-xs text-gray-500">{template.creator.email}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start space-x-2">
                                    <Calendar className="h-4 w-4 text-maroon-600 mt-0.5" />
                                    <div>
                                        <p className="text-gray-600">Created</p>
                                        <p className="font-medium text-maroon-800">
                                            {formatDate(template.created_at)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-2">
                                    <Calendar className="h-4 w-4 text-maroon-600 mt-0.5" />
                                    <div>
                                        <p className="text-gray-600">Last Updated</p>
                                        <p className="font-medium text-maroon-800">
                                            {formatDate(template.updated_at)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-2">
                                    <FileText className="h-4 w-4 text-maroon-600 mt-0.5" />
                                    <div>
                                        <p className="text-gray-600">Template ID</p>
                                        <p className="font-mono text-xs text-maroon-800">{template.id}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-lg text-maroon-800">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button
                                    onClick={() => router.visit(`/admin/email-templates/${templateId}/edit`)}
                                    className="w-full bg-maroon-700 hover:bg-maroon-800 text-white"
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Template
                                </Button>

                                <Button
                                    onClick={handleSendTest}
                                    variant="outline"
                                    className="w-full border-green-300 text-green-700 hover:bg-green-50"
                                >
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Test Email
                                </Button>

                                <Button
                                    onClick={handleDuplicate}
                                    variant="outline"
                                    className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                                >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicate Template
                                </Button>

                                <Button
                                    onClick={handleDelete}
                                    variant="outline"
                                    className="w-full border-red-300 text-red-700 hover:bg-red-50"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Template
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminBaseLayout>
    );
}
