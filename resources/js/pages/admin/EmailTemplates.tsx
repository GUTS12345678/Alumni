import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    Plus,
    Edit,
    Trash2,
    RefreshCw,
    Mail,
    FileText,
    Send,
    Copy,
    Eye,
    Users,
    CheckCircle,
    Clock,
    AlertTriangle,
    Download
} from 'lucide-react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';

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
}

interface EmailStats {
    total_templates: number;
    active_templates: number;
    total_sent: number;
    most_used_template: string;
    categories: { name: string; count: number }[];
    recent_activity: { date: string; sent_count: number }[];
}

export default function EmailTemplatesManagement() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [stats, setStats] = useState<EmailStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
    const [error, setError] = useState<string | null>(null);

    const templateTypes = [
        { value: 'notification', label: 'Notification', color: 'bg-blue-100 text-blue-800' },
        { value: 'reminder', label: 'Reminder', color: 'bg-orange-100 text-orange-800' },
        { value: 'announcement', label: 'Announcement', color: 'bg-purple-100 text-purple-800' },
        { value: 'survey', label: 'Survey', color: 'bg-green-100 text-green-800' },
        { value: 'system', label: 'System', color: 'bg-red-100 text-red-800' },
    ];

    const fetchTemplates = async () => {
        try {
            setLoading(true);

            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (selectedCategory) params.append('category', selectedCategory);
            if (selectedType) params.append('type', selectedType);
            if (statusFilter) params.append('status', statusFilter);

            const [templatesResponse, statsResponse] = await Promise.all([
                fetch(`/api/v1/admin/email-templates?${params.toString()}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                }),
                fetch('/api/v1/admin/email-templates/stats', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                })
            ]);

            if (!templatesResponse.ok || !statsResponse.ok) {
                if (templatesResponse.status === 401 || statsResponse.status === 401) {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    return;
                }
                throw new Error('Failed to fetch email templates');
            }

            const templatesData = await templatesResponse.json();
            const statsData = await statsResponse.json();

            if (templatesData.success) {
                setTemplates(templatesData.data);
            }

            if (statsData.success) {
                setStats(statsData.data);
            }
        } catch (err) {
            console.error('Templates fetch error:', err);
            setError('Failed to load email templates');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchTemplates();
        }, 300);

        return () => clearTimeout(debounceTimer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, selectedCategory, selectedType, statusFilter]);

    const exportTemplates = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/v1/admin/email-templates/export', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    search: searchTerm,
                    category: selectedCategory,
                    type: selectedType,
                    status: statusFilter
                }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `email_templates_export_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Export error:', error);
        }
    };

    const duplicateTemplate = async (templateId: string) => {
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
                fetchTemplates();
            }
        } catch (error) {
            console.error('Duplicate template error:', error);
        }
    };

    const deleteTemplate = async (templateId: string) => {
        if (!confirm('Are you sure you want to delete this email template?')) {
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
                fetchTemplates();
            }
        } catch (error) {
            console.error('Delete template error:', error);
        }
    };

    const sendTestEmail = async (templateId: string) => {
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
        const typeInfo = templateTypes.find(t => t.value === type);
        return (
            <Badge className={typeInfo?.color || 'bg-gray-100 text-gray-800'}>
                {typeInfo?.label || type}
            </Badge>
        );
    };

    const getCategoryBadge = (category: string) => {
        const categoryColors = [
            'bg-blue-100 text-blue-800',
            'bg-purple-100 text-purple-800',
            'bg-orange-100 text-orange-800',
            'bg-teal-100 text-teal-800',
            'bg-pink-100 text-pink-800',
        ];

        const colorIndex = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % categoryColors.length;

        return (
            <Badge className={categoryColors[colorIndex]}>
                {category}
            </Badge>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    if (loading) {
        return (
            <AdminBaseLayout title="Email Templates">
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="h-8 w-8 text-maroon-600 animate-spin" />
                        <span className="text-maroon-800 font-medium">Loading email templates...</span>
                    </div>
                </div>
            </AdminBaseLayout>
        );
    }

    if (error) {
        return (
            <AdminBaseLayout title="Email Templates">
                <Card className="border-red-200">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-red-600 mb-4">{error}</p>
                            <Button onClick={() => fetchTemplates()} className="bg-maroon-700 hover:bg-maroon-800">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </AdminBaseLayout>
        );
    }

    const categories = stats?.categories || [];

    return (
        <AdminBaseLayout title="Email Templates">
            <div className="space-y-6">
                {/* Header with Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-maroon-800">Email Templates</h2>
                        <p className="text-maroon-600">Manage system email templates and communications</p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={exportTemplates}
                            variant="outline"
                            size="sm"
                            className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>

                        <Button
                            onClick={() => router.visit('/admin/email-templates/create')}
                            className="bg-maroon-700 hover:bg-maroon-800 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Template
                        </Button>
                    </div>
                </div>

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800">Total Templates</CardTitle>
                                <Mail className="h-4 w-4 text-maroon-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-maroon-800">{stats.total_templates}</div>
                                <p className="text-xs text-maroon-600 mt-1">{stats.active_templates} active</p>
                            </CardContent>
                        </Card>

                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800">Total Sent</CardTitle>
                                <Send className="h-4 w-4 text-maroon-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">{stats.total_sent.toLocaleString()}</div>
                                <p className="text-xs text-maroon-600 mt-1">Emails sent</p>
                            </CardContent>
                        </Card>

                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800">Categories</CardTitle>
                                <FileText className="h-4 w-4 text-maroon-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{categories.length}</div>
                                <p className="text-xs text-maroon-600 mt-1">Template categories</p>
                            </CardContent>
                        </Card>

                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800">Most Used</CardTitle>
                                <Users className="h-4 w-4 text-maroon-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-purple-600 truncate">{stats.most_used_template}</div>
                                <p className="text-xs text-maroon-600 mt-1">Popular template</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filters */}
                <Card className="border-beige-200 shadow-lg">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search templates..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 border-beige-300 focus:border-maroon-400 focus:ring-maroon-200"
                                />
                            </div>

                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-3 py-2 border border-beige-300 rounded-md focus:border-maroon-400 focus:ring-maroon-200"
                            >
                                <option value="">All Categories</option>
                                {categories.map((category) => (
                                    <option key={category.name} value={category.name}>
                                        {category.name} ({category.count})
                                    </option>
                                ))}
                            </select>

                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="px-3 py-2 border border-beige-300 rounded-md focus:border-maroon-400 focus:ring-maroon-200"
                            >
                                <option value="">All Types</option>
                                {templateTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border border-beige-300 rounded-md focus:border-maroon-400 focus:ring-maroon-200"
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Templates List */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800">Email Templates</CardTitle>
                        <CardDescription className="text-maroon-600">
                            Showing {templates.length} template{templates.length !== 1 ? 's' : ''}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {templates.length === 0 ? (
                            <div className="text-center py-8">
                                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                                <p className="text-gray-500 mb-4">
                                    {searchTerm || selectedCategory || selectedType || statusFilter
                                        ? 'Try adjusting your filters'
                                        : 'Create your first email template to get started'
                                    }
                                </p>
                                <Button
                                    onClick={() => router.visit('/admin/email-templates/create')}
                                    className="bg-maroon-700 hover:bg-maroon-800 text-white"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Template
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {templates.map((template) => (
                                    <div key={template.id} className="border border-beige-200 rounded-lg p-4 hover:bg-beige-50">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <Mail className="h-4 w-4 text-maroon-600" />
                                                    <h3 className="font-medium text-maroon-800">{template.name}</h3>
                                                    {getTypeBadge(template.type)}
                                                    {getCategoryBadge(template.category)}
                                                    {getStatusBadge(template.status)}
                                                </div>

                                                <div className="mb-2">
                                                    <p className="text-sm font-medium text-gray-700 mb-1">
                                                        Subject: {template.subject}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {truncateText(template.body.replace(/<[^>]*>/g, ''), 150)}
                                                    </p>
                                                </div>

                                                {template.variables.length > 0 && (
                                                    <div className="mb-2">
                                                        <p className="text-sm text-gray-600 mb-1">Variables:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {template.variables.slice(0, 5).map((variable, index) => (
                                                                <Badge key={index} className="bg-gray-100 text-gray-700 text-xs">
                                                                    {variable}
                                                                </Badge>
                                                            ))}
                                                            {template.variables.length > 5 && (
                                                                <Badge className="bg-gray-100 text-gray-700 text-xs">
                                                                    +{template.variables.length - 5} more
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                    <span>Used {template.usage_count} times</span>
                                                    {template.last_sent_at && (
                                                        <span>Last sent: {formatDate(template.last_sent_at)}</span>
                                                    )}
                                                    <span>Created by {template.created_by}</span>
                                                    <span>Created {formatDate(template.created_at)}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2 ml-4">
                                                <Button
                                                    onClick={() => router.visit(`/admin/email-templates/${template.id}`)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    onClick={() => sendTestEmail(template.id)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-green-300 text-green-700 hover:bg-green-50"
                                                >
                                                    <Send className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    onClick={() => duplicateTemplate(template.id)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    onClick={() => router.visit(`/admin/email-templates/${template.id}/edit`)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    onClick={() => deleteTemplate(template.id)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-red-300 text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Preview Modal */}
                {previewTemplate && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                            <div className="flex items-center justify-between p-6 border-b">
                                <h3 className="text-lg font-semibold text-maroon-800">
                                    Template Preview: {previewTemplate.name}
                                </h3>
                                <Button
                                    onClick={() => setPreviewTemplate(null)}
                                    variant="outline"
                                    size="sm"
                                >
                                    ✕
                                </Button>
                            </div>
                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Subject:</label>
                                        <p className="text-maroon-800 font-medium">{previewTemplate.subject}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Body:</label>
                                        <div
                                            className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[300px]"
                                            dangerouslySetInnerHTML={{ __html: previewTemplate.body }}
                                        />
                                    </div>
                                    {previewTemplate.variables.length > 0 && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Available Variables:</label>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {previewTemplate.variables.map((variable, index) => (
                                                    <Badge key={index} className="bg-blue-100 text-blue-800">
                                                        {variable}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminBaseLayout>
    );
}