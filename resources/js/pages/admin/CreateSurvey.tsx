import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Save,
    Eye,
    Trash2,
    Settings,
    Calendar,
    Type,
    List,
    CheckSquare,
    Circle,
    Hash,
    Mail,
    Phone,
    FileText,
    Star,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';

interface Question {
    id: string;
    type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'email' | 'phone' | 'date' | 'rating';
    title: string;
    description?: string;
    required: boolean;
    options?: string[];
    order: number;
}

interface SurveyData {
    title: string;
    description: string;
    start_date?: string;
    end_date?: string;
    target_audience: 'all' | 'specific_batch' | 'employment_status';
    target_criteria?: string;
    is_anonymous: boolean;
    questions: Question[];
}

const questionTypes = [
    { value: 'text', label: 'Short Text', icon: Type },
    { value: 'textarea', label: 'Long Text', icon: FileText },
    { value: 'select', label: 'Dropdown', icon: List },
    { value: 'radio', label: 'Multiple Choice', icon: Circle },
    { value: 'checkbox', label: 'Checkboxes', icon: CheckSquare },
    { value: 'number', label: 'Number', icon: Hash },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'phone', label: 'Phone', icon: Phone },
    { value: 'date', label: 'Date', icon: Calendar },
    { value: 'rating', label: 'Rating', icon: Star },
];

export default function CreateSurvey() {
    const [surveyData, setSurveyData] = useState<SurveyData>({
        title: '',
        description: '',
        target_audience: 'all',
        is_anonymous: false,
        questions: []
    });

    const [currentStep, setCurrentStep] = useState<'basic' | 'questions' | 'settings' | 'review'>('basic');
    const [saving, setSaving] = useState(false);

    const addQuestion = (type: Question['type']) => {
        const newQuestion: Question = {
            id: `q_${Date.now()}`,
            type,
            title: '',
            required: false,
            order: surveyData.questions.length + 1,
            options: ['radio', 'select', 'checkbox'].includes(type) ? ['Option 1', 'Option 2'] : undefined
        };

        setSurveyData(prev => ({
            ...prev,
            questions: [...prev.questions, newQuestion]
        }));
    };

    const updateQuestion = (questionId: string, updates: Partial<Question>) => {
        setSurveyData(prev => ({
            ...prev,
            questions: prev.questions.map(q =>
                q.id === questionId ? { ...q, ...updates } : q
            )
        }));
    };

    const deleteQuestion = (questionId: string) => {
        setSurveyData(prev => ({
            ...prev,
            questions: prev.questions.filter(q => q.id !== questionId)
        }));
    };

    const moveQuestion = (questionId: string, direction: 'up' | 'down') => {
        setSurveyData(prev => {
            const questions = [...prev.questions];
            const index = questions.findIndex(q => q.id === questionId);

            if (direction === 'up' && index > 0) {
                [questions[index], questions[index - 1]] = [questions[index - 1], questions[index]];
            } else if (direction === 'down' && index < questions.length - 1) {
                [questions[index], questions[index + 1]] = [questions[index + 1], questions[index]];
            }

            // Update order numbers
            questions.forEach((q, i) => {
                q.order = i + 1;
            });

            return { ...prev, questions };
        });
    };

    const addOption = (questionId: string) => {
        updateQuestion(questionId, {
            options: [...(surveyData.questions.find(q => q.id === questionId)?.options || []), `Option ${(surveyData.questions.find(q => q.id === questionId)?.options?.length || 0) + 1}`]
        });
    };

    const updateOption = (questionId: string, optionIndex: number, value: string) => {
        const question = surveyData.questions.find(q => q.id === questionId);
        if (question?.options) {
            const newOptions = [...question.options];
            newOptions[optionIndex] = value;
            updateQuestion(questionId, { options: newOptions });
        }
    };

    const removeOption = (questionId: string, optionIndex: number) => {
        const question = surveyData.questions.find(q => q.id === questionId);
        if (question?.options && question.options.length > 2) {
            const newOptions = question.options.filter((_, i) => i !== optionIndex);
            updateQuestion(questionId, { options: newOptions });
        }
    };

    const saveSurvey = async () => {
        try {
            setSaving(true);

            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const payload = {
                ...surveyData,
                status: 'draft' // Save as draft initially
            };

            const response = await fetch('/api/v1/admin/surveys', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // Redirect to survey details or surveys list
                    window.location.href = '/admin/surveys';
                }
            }
        } catch (error) {
            console.error('Save survey error:', error);
        } finally {
            setSaving(false);
        }
    };

    const renderQuestionEditor = (question: Question) => {
        const QuestionIcon = questionTypes.find(t => t.value === question.type)?.icon || Type;

        return (
            <Card key={question.id} className="border-beige-200 shadow-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <QuestionIcon className="h-5 w-5 text-maroon-600" />
                            <span className="text-sm text-gray-600">
                                {questionTypes.find(t => t.value === question.type)?.label}
                            </span>
                            <Badge variant="outline" className="text-xs">
                                Question {question.order}
                            </Badge>
                        </div>
                        <div className="flex items-center space-x-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveQuestion(question.id, 'up')}
                                disabled={question.order === 1}
                                className="text-gray-600 hover:text-maroon-600"
                            >
                                <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveQuestion(question.id, 'down')}
                                disabled={question.order === surveyData.questions.length}
                                className="text-gray-600 hover:text-maroon-600"
                            >
                                <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteQuestion(question.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-maroon-800 mb-2">
                            Question Title *
                        </label>
                        <Input
                            value={question.title}
                            onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
                            placeholder="Enter your question..."
                            className="border-beige-300 focus:border-maroon-500 focus:ring-maroon-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-maroon-800 mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            value={question.description || ''}
                            onChange={(e) => updateQuestion(question.id, { description: e.target.value })}
                            placeholder="Additional instructions or context..."
                            rows={2}
                            className="w-full border border-beige-300 rounded-md px-3 py-2 text-sm focus:border-maroon-500 focus:ring-maroon-500"
                        />
                    </div>

                    {question.options && (
                        <div>
                            <label className="block text-sm font-medium text-maroon-800 mb-2">
                                Options
                            </label>
                            <div className="space-y-2">
                                {question.options.map((option, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <Input
                                            value={option}
                                            onChange={(e) => updateOption(question.id, index, e.target.value)}
                                            placeholder={`Option ${index + 1}`}
                                            className="border-beige-300 focus:border-maroon-500 focus:ring-maroon-500"
                                        />
                                        {question.options!.length > 2 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeOption(question.id, index)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addOption(question.id)}
                                    className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Option
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={question.required}
                            onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                            className="rounded border-beige-300 text-maroon-600 focus:border-maroon-500 focus:ring-maroon-500"
                        />
                        <label className="text-sm text-gray-700">
                            Required question
                        </label>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <AdminBaseLayout title="Create Survey">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-maroon-800">Create New Survey</h2>
                        <p className="text-maroon-600">Design and build comprehensive alumni surveys</p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => window.location.href = '/admin/surveys'}
                            className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={saveSurvey}
                            disabled={!surveyData.title || surveyData.questions.length === 0 || saving}
                            className="bg-maroon-700 hover:bg-maroon-800 text-white"
                        >
                            <Save className={`h-4 w-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
                            {saving ? 'Saving...' : 'Save Survey'}
                        </Button>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center space-x-4 mb-8">
                    {[
                        { key: 'basic', label: 'Basic Info', icon: FileText },
                        { key: 'questions', label: 'Questions', icon: List },
                        { key: 'settings', label: 'Settings', icon: Settings },
                        { key: 'review', label: 'Review', icon: Eye }
                    ].map((step, index) => {
                        const StepIcon = step.icon;
                        const isActive = currentStep === step.key;
                        const isCompleted = ['basic', 'questions', 'settings', 'review'].indexOf(currentStep) > index;

                        return (
                            <div key={step.key} className="flex items-center">
                                <button
                                    onClick={() => setCurrentStep(step.key as typeof currentStep)}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${isActive
                                            ? 'bg-maroon-100 text-maroon-800'
                                            : isCompleted
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}
                                >
                                    <StepIcon className="h-4 w-4" />
                                    <span className="text-sm font-medium">{step.label}</span>
                                </button>
                                {index < 3 && (
                                    <div className="w-8 h-px bg-gray-300 mx-2"></div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Basic Information Step */}
                {currentStep === 'basic' && (
                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl text-maroon-800">Basic Survey Information</CardTitle>
                            <CardDescription className="text-maroon-600">
                                Start by providing basic details about your survey
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-maroon-800 mb-2">
                                    Survey Title *
                                </label>
                                <Input
                                    value={surveyData.title}
                                    onChange={(e) => setSurveyData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="e.g., Alumni Career Development Survey 2025"
                                    className="border-beige-300 focus:border-maroon-500 focus:ring-maroon-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-maroon-800 mb-2">
                                    Survey Description
                                </label>
                                <textarea
                                    value={surveyData.description}
                                    onChange={(e) => setSurveyData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Provide a brief description of the survey's purpose and what participants can expect..."
                                    rows={4}
                                    className="w-full border border-beige-300 rounded-md px-3 py-2 text-sm focus:border-maroon-500 focus:ring-maroon-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-maroon-800 mb-2">
                                        Start Date (Optional)
                                    </label>
                                    <Input
                                        type="date"
                                        value={surveyData.start_date || ''}
                                        onChange={(e) => setSurveyData(prev => ({ ...prev, start_date: e.target.value }))}
                                        className="border-beige-300 focus:border-maroon-500 focus:ring-maroon-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-maroon-800 mb-2">
                                        End Date (Optional)
                                    </label>
                                    <Input
                                        type="date"
                                        value={surveyData.end_date || ''}
                                        onChange={(e) => setSurveyData(prev => ({ ...prev, end_date: e.target.value }))}
                                        className="border-beige-300 focus:border-maroon-500 focus:ring-maroon-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    onClick={() => setCurrentStep('questions')}
                                    disabled={!surveyData.title}
                                    className="bg-maroon-700 hover:bg-maroon-800 text-white"
                                >
                                    Next: Add Questions
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Questions Step */}
                {currentStep === 'questions' && (
                    <div className="space-y-6">
                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-xl text-maroon-800">Survey Questions</CardTitle>
                                <CardDescription className="text-maroon-600">
                                    Add questions to collect the information you need from alumni
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                    {questionTypes.map((type) => {
                                        const Icon = type.icon;
                                        return (
                                            <Button
                                                key={type.value}
                                                variant="outline"
                                                onClick={() => addQuestion(type.value as Question['type'])}
                                                className="flex flex-col items-center p-4 h-auto border-beige-300 text-maroon-700 hover:bg-maroon-50"
                                            >
                                                <Icon className="h-6 w-6 mb-2" />
                                                <span className="text-xs">{type.label}</span>
                                            </Button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Questions List */}
                        <div className="space-y-4">
                            {surveyData.questions.map(renderQuestionEditor)}
                        </div>

                        {surveyData.questions.length === 0 && (
                            <Card className="border-dashed border-2 border-beige-300">
                                <CardContent className="p-8 text-center">
                                    <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No questions added yet</h3>
                                    <p className="text-gray-500 mb-4">
                                        Start building your survey by adding questions above
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex justify-between">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentStep('basic')}
                                className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                            >
                                Previous: Basic Info
                            </Button>
                            <Button
                                onClick={() => setCurrentStep('settings')}
                                disabled={surveyData.questions.length === 0}
                                className="bg-maroon-700 hover:bg-maroon-800 text-white"
                            >
                                Next: Settings
                            </Button>
                        </div>
                    </div>
                )}

                {/* Settings Step */}
                {currentStep === 'settings' && (
                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl text-maroon-800">Survey Settings</CardTitle>
                            <CardDescription className="text-maroon-600">
                                Configure targeting and privacy settings for your survey
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-maroon-800 mb-3">
                                    Target Audience
                                </label>
                                <div className="space-y-3">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            name="target_audience"
                                            value="all"
                                            checked={surveyData.target_audience === 'all'}
                                            onChange={(e) => setSurveyData(prev => ({ ...prev, target_audience: e.target.value as SurveyData['target_audience'] }))}
                                            className="text-maroon-600 focus:ring-maroon-500"
                                        />
                                        <span className="text-sm">All Alumni</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            name="target_audience"
                                            value="specific_batch"
                                            checked={surveyData.target_audience === 'specific_batch'}
                                            onChange={(e) => setSurveyData(prev => ({ ...prev, target_audience: e.target.value as SurveyData['target_audience'] }))}
                                            className="text-maroon-600 focus:ring-maroon-500"
                                        />
                                        <span className="text-sm">Specific Graduation Year</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            name="target_audience"
                                            value="employment_status"
                                            checked={surveyData.target_audience === 'employment_status'}
                                            onChange={(e) => setSurveyData(prev => ({ ...prev, target_audience: e.target.value as SurveyData['target_audience'] }))}
                                            className="text-maroon-600 focus:ring-maroon-500"
                                        />
                                        <span className="text-sm">By Employment Status</span>
                                    </label>
                                </div>
                            </div>

                            {surveyData.target_audience !== 'all' && (
                                <div>
                                    <label className="block text-sm font-medium text-maroon-800 mb-2">
                                        Target Criteria
                                    </label>
                                    <Input
                                        value={surveyData.target_criteria || ''}
                                        onChange={(e) => setSurveyData(prev => ({ ...prev, target_criteria: e.target.value }))}
                                        placeholder={
                                            surveyData.target_audience === 'specific_batch'
                                                ? 'e.g., 2023, 2024'
                                                : 'e.g., employed_full_time, unemployed'
                                        }
                                        className="border-beige-300 focus:border-maroon-500 focus:ring-maroon-500"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={surveyData.is_anonymous}
                                        onChange={(e) => setSurveyData(prev => ({ ...prev, is_anonymous: e.target.checked }))}
                                        className="rounded border-beige-300 text-maroon-600 focus:border-maroon-500 focus:ring-maroon-500"
                                    />
                                    <span className="text-sm font-medium text-maroon-800">
                                        Anonymous Survey
                                    </span>
                                </label>
                                <p className="text-xs text-gray-600 mt-1 ml-6">
                                    Responses will not be linked to specific alumni profiles
                                </p>
                            </div>

                            <div className="flex justify-between">
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentStep('questions')}
                                    className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                                >
                                    Previous: Questions
                                </Button>
                                <Button
                                    onClick={() => setCurrentStep('review')}
                                    className="bg-maroon-700 hover:bg-maroon-800 text-white"
                                >
                                    Next: Review
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Review Step */}
                {currentStep === 'review' && (
                    <div className="space-y-6">
                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-xl text-maroon-800">Review Survey</CardTitle>
                                <CardDescription className="text-maroon-600">
                                    Review your survey before saving
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <h3 className="font-medium text-maroon-800 mb-2">Survey Title</h3>
                                    <p className="text-gray-700">{surveyData.title}</p>
                                </div>

                                <div>
                                    <h3 className="font-medium text-maroon-800 mb-2">Description</h3>
                                    <p className="text-gray-700">{surveyData.description}</p>
                                </div>

                                <div>
                                    <h3 className="font-medium text-maroon-800 mb-2">Questions ({surveyData.questions.length})</h3>
                                    <div className="space-y-2">
                                        {surveyData.questions.map((question, index) => (
                                            <div key={question.id} className="flex items-center space-x-2 text-sm">
                                                <Badge variant="outline">{index + 1}</Badge>
                                                <span className="text-gray-700">{question.title}</span>
                                                {question.required && (
                                                    <Badge className="bg-red-100 text-red-800">Required</Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-medium text-maroon-800 mb-2">Target Audience</h3>
                                    <p className="text-gray-700">
                                        {surveyData.target_audience === 'all' && 'All Alumni'}
                                        {surveyData.target_audience === 'specific_batch' && `Specific Batch: ${surveyData.target_criteria}`}
                                        {surveyData.target_audience === 'employment_status' && `Employment Status: ${surveyData.target_criteria}`}
                                    </p>
                                </div>

                                <div className="flex justify-between">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentStep('settings')}
                                        className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                                    >
                                        Previous: Settings
                                    </Button>
                                    <Button
                                        onClick={saveSurvey}
                                        disabled={saving}
                                        className="bg-maroon-700 hover:bg-maroon-800 text-white"
                                    >
                                        <Save className={`h-4 w-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
                                        {saving ? 'Creating Survey...' : 'Create Survey'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AdminBaseLayout>
    );
}