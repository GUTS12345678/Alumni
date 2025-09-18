import React, { useEffect, useState } from 'react';
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
    Download,
    Eye,
    Copy,
    Star,
    FileText,
    Type,
    List,
    CheckSquare,
    ToggleLeft,
    BarChart3,
    Calendar,
    Hash,
    AlignLeft,
    MessageSquare
} from 'lucide-react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';

interface Question {
    id: string;
    question_text: string;
    question_type: 'text' | 'textarea' | 'number' | 'email' | 'date' | 'select' | 'multiple_select' | 'radio' | 'checkbox' | 'rating' | 'boolean';
    category: string;
    is_required: boolean;
    options?: string[];
    is_template: boolean;
    usage_count: number;
    created_by: string;
    created_at: string;
    updated_at: string;
    status: 'active' | 'inactive' | 'archived';
}

interface QuestionStats {
    total_questions: number;
    active_questions: number;
    template_questions: number;
    most_used_type: string;
    categories: { name: string; count: number }[];
}

export default function QuestionsManagement() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [stats, setStats] = useState<QuestionStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [error, setError] = useState<string | null>(null);

    const questionTypes = [
        { value: 'text', label: 'Short Text', icon: Type },
        { value: 'textarea', label: 'Long Text', icon: AlignLeft },
        { value: 'number', label: 'Number', icon: Hash },
        { value: 'email', label: 'Email', icon: MessageSquare },
        { value: 'date', label: 'Date', icon: Calendar },
        { value: 'select', label: 'Dropdown', icon: List },
        { value: 'multiple_select', label: 'Multi-Select', icon: List },
        { value: 'radio', label: 'Radio Buttons', icon: CheckSquare },
        { value: 'checkbox', label: 'Checkboxes', icon: CheckSquare },
        { value: 'rating', label: 'Rating Scale', icon: BarChart3 },
        { value: 'boolean', label: 'Yes/No', icon: ToggleLeft }
    ];

    const fetchQuestions = async () => {
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

            const [questionsResponse, statsResponse] = await Promise.all([
                fetch(`/api/v1/admin/questions?${params.toString()}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                }),
                fetch('/api/v1/admin/questions/stats', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                })
            ]);

            if (!questionsResponse.ok || !statsResponse.ok) {
                if (questionsResponse.status === 401 || statsResponse.status === 401) {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    return;
                }
                throw new Error('Failed to fetch questions');
            }

            const questionsData = await questionsResponse.json();
            const statsData = await statsResponse.json();

            if (questionsData.success) {
                setQuestions(questionsData.data);
            }

            if (statsData.success) {
                setStats(statsData.data);
            }
        } catch (err) {
            console.error('Questions fetch error:', err);
            setError('Failed to load questions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchQuestions();
        }, 300);

        return () => clearTimeout(debounceTimer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, selectedCategory, selectedType, statusFilter]);

    const exportQuestions = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/v1/admin/questions/export', {
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
                a.download = `questions_export_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Export error:', error);
        }
    };

    const toggleTemplate = async (questionId: string, isTemplate: boolean) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/v1/admin/questions/${questionId}/template`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ is_template: !isTemplate }),
            });

            if (response.ok) {
                fetchQuestions();
            }
        } catch (error) {
            console.error('Toggle template error:', error);
        }
    };

    const duplicateQuestion = async (questionId: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/v1/admin/questions/${questionId}/duplicate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                fetchQuestions();
            }
        } catch (error) {
            console.error('Duplicate question error:', error);
        }
    };

    const deleteQuestion = async (questionId: string) => {
        if (!confirm('Are you sure you want to delete this question?')) {
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/v1/admin/questions/${questionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                fetchQuestions();
            }
        } catch (error) {
            console.error('Delete question error:', error);
        }
    };

    const getQuestionTypeInfo = (type: string) => {
        const typeInfo = questionTypes.find(t => t.value === type);
        return typeInfo || { value: type, label: type, icon: FileText };
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'active': { color: 'bg-green-100 text-green-800', label: 'Active' },
            'inactive': { color: 'bg-gray-100 text-gray-800', label: 'Inactive' },
            'archived': { color: 'bg-red-100 text-red-800', label: 'Archived' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;

        return (
            <Badge className={config.color}>
                {config.label}
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

    if (loading) {
        return (
            <AdminBaseLayout title="Questions Management">
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="h-8 w-8 text-maroon-600 animate-spin" />
                        <span className="text-maroon-800 font-medium">Loading questions...</span>
                    </div>
                </div>
            </AdminBaseLayout>
        );
    }

    if (error) {
        return (
            <AdminBaseLayout title="Questions Management">
                <Card className="border-red-200">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-red-600 mb-4">{error}</p>
                            <Button onClick={() => fetchQuestions()} className="bg-maroon-700 hover:bg-maroon-800">
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
        <AdminBaseLayout title="Questions Management">
            <div className="space-y-6">
                {/* Header with Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-maroon-800">Question Bank Management</h2>
                        <p className="text-maroon-600">Manage survey questions and templates</p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={exportQuestions}
                            variant="outline"
                            size="sm"
                            className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>

                        <Button
                            onClick={() => window.location.href = '/admin/questions/create'}
                            className="bg-maroon-700 hover:bg-maroon-800 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Question
                        </Button>
                    </div>
                </div>

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800">Total Questions</CardTitle>
                                <FileText className="h-4 w-4 text-maroon-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-maroon-800">{stats.total_questions}</div>
                                <p className="text-xs text-maroon-600 mt-1">In question bank</p>
                            </CardContent>
                        </Card>

                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800">Active Questions</CardTitle>
                                <CheckSquare className="h-4 w-4 text-maroon-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{stats.active_questions}</div>
                                <p className="text-xs text-maroon-600 mt-1">Available for use</p>
                            </CardContent>
                        </Card>

                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800">Templates</CardTitle>
                                <Star className="h-4 w-4 text-maroon-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">{stats.template_questions}</div>
                                <p className="text-xs text-maroon-600 mt-1">Reusable templates</p>
                            </CardContent>
                        </Card>

                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800">Most Used Type</CardTitle>
                                <BarChart3 className="h-4 w-4 text-maroon-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-600 capitalize">{stats.most_used_type}</div>
                                <p className="text-xs text-maroon-600 mt-1">Popular question type</p>
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
                                    placeholder="Search questions..."
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
                                {questionTypes.map((type) => (
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
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Questions List */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800">Questions</CardTitle>
                        <CardDescription className="text-maroon-600">
                            Showing {questions.length} question{questions.length !== 1 ? 's' : ''}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {questions.length === 0 ? (
                            <div className="text-center py-8">
                                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
                                <p className="text-gray-500 mb-4">
                                    {searchTerm || selectedCategory || selectedType || statusFilter
                                        ? 'Try adjusting your filters'
                                        : 'Create your first question to get started'
                                    }
                                </p>
                                <Button
                                    onClick={() => window.location.href = '/admin/questions/create'}
                                    className="bg-maroon-700 hover:bg-maroon-800 text-white"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Question
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {questions.map((question) => {
                                    const typeInfo = getQuestionTypeInfo(question.question_type);
                                    const TypeIcon = typeInfo.icon;

                                    return (
                                        <div key={question.id} className="border border-beige-200 rounded-lg p-4 hover:bg-beige-50">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <TypeIcon className="h-4 w-4 text-maroon-600" />
                                                        <span className="text-sm text-maroon-600 font-medium">{typeInfo.label}</span>
                                                        {getCategoryBadge(question.category)}
                                                        {getStatusBadge(question.status)}
                                                        {question.is_template && (
                                                            <Badge className="bg-yellow-100 text-yellow-800">
                                                                <Star className="h-3 w-3 mr-1" />
                                                                Template
                                                            </Badge>
                                                        )}
                                                        {question.is_required && (
                                                            <Badge className="bg-red-100 text-red-800">
                                                                Required
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <h3 className="font-medium text-maroon-800 mb-2">
                                                        {question.question_text}
                                                    </h3>

                                                    {question.options && question.options.length > 0 && (
                                                        <div className="mb-2">
                                                            <p className="text-sm text-gray-600 mb-1">Options:</p>
                                                            <div className="flex flex-wrap gap-1">
                                                                {question.options.slice(0, 3).map((option, index) => (
                                                                    <Badge key={index} className="bg-gray-100 text-gray-700 text-xs">
                                                                        {option}
                                                                    </Badge>
                                                                ))}
                                                                {question.options.length > 3 && (
                                                                    <Badge className="bg-gray-100 text-gray-700 text-xs">
                                                                        +{question.options.length - 3} more
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                        <span>Used {question.usage_count} times</span>
                                                        <span>Created by {question.created_by}</span>
                                                        <span>Created {formatDate(question.created_at)}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-2 ml-4">
                                                    <Button
                                                        onClick={() => toggleTemplate(question.id, question.is_template)}
                                                        variant="outline"
                                                        size="sm"
                                                        className={`border-yellow-300 hover:bg-yellow-50 ${question.is_template ? 'text-yellow-800 bg-yellow-50' : 'text-yellow-700'}`}
                                                    >
                                                        <Star className={`h-4 w-4 ${question.is_template ? 'fill-current' : ''}`} />
                                                    </Button>

                                                    <Button
                                                        onClick={() => duplicateQuestion(question.id)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>

                                                    <Button
                                                        onClick={() => window.location.href = `/admin/questions/${question.id}`}
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>

                                                    <Button
                                                        onClick={() => window.location.href = `/admin/questions/${question.id}/edit`}
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>

                                                    <Button
                                                        onClick={() => deleteQuestion(question.id)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-red-300 text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminBaseLayout>
    );
}