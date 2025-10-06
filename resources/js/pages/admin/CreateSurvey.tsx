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

interface User {
    id: number;
    email: string;
    role: string;
    status: string;
}

interface Props {
    user: User;
}

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
    instructions?: string;
    type: 'registration' | 'follow_up' | 'annual' | 'custom';
    status: 'draft' | 'active' | 'inactive' | 'archived';
    start_date?: string;
    end_date?: string;
    target_batches?: string[];
    target_graduation_years?: string[];
    is_anonymous: boolean;
    allow_multiple_responses: boolean;
    require_authentication: boolean;
    is_registration_survey: boolean;
    email_subject?: string;
    email_body?: string;
    send_reminder_emails: boolean;
    reminder_interval_days?: number;
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

export default function CreateSurvey({ user }: Props) {
    const [surveyData, setSurveyData] = useState<SurveyData>({
        title: '',
        description: '',
        instructions: '',
        type: 'custom',
        status: 'draft',
        is_anonymous: false,
        allow_multiple_responses: false,
        require_authentication: true,
        is_registration_survey: false,
        send_reminder_emails: false,
        reminder_interval_days: 7,
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
                alert('Authentication required. Please login again.');
                window.location.href = '/login';
                return;
            }

            // Prepare the payload with proper API structure
            const payload = {
                title: surveyData.title,
                description: surveyData.description,
                instructions: surveyData.instructions || '',
                type: surveyData.type,
                status: surveyData.status,
                start_date: surveyData.start_date || null,
                end_date: surveyData.end_date || null,
                target_batches: surveyData.target_batches || [],
                target_graduation_years: surveyData.target_graduation_years || [],
                is_anonymous: surveyData.is_anonymous,
                allow_multiple_responses: surveyData.allow_multiple_responses,
                require_authentication: surveyData.require_authentication,
                is_registration_survey: surveyData.is_registration_survey,
                email_subject: surveyData.email_subject || '',
                email_body: surveyData.email_body || '',
                send_reminder_emails: surveyData.send_reminder_emails,
                reminder_interval_days: surveyData.reminder_interval_days || 7,
            };

            console.log('Sending survey payload:', payload);

            const response = await fetch('/api/v1/admin/surveys', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(payload),
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            const result = await response.json();
            console.log('Response data:', result);

            if (response.ok && result.success) {
                // If we have questions, save them separately
                if (surveyData.questions.length > 0) {
                    const surveyId = result.data.id;
                    await saveQuestions(surveyId, token);
                }

                alert('Survey created successfully!');
                window.location.href = '/admin/surveys';
            } else {
                // Handle validation errors
                const errorMessage = result.message || 'Failed to create survey';
                if (result.errors) {
                    const errorDetails = Object.values(result.errors).flat().join('\n');
                    alert(`Error creating survey:\n${errorMessage}\n\nDetails:\n${errorDetails}`);
                } else {
                    alert(`Error creating survey: ${errorMessage}`);
                }
            }
        } catch (error) {
            console.error('Save survey error:', error);

            // Check if it's a network error
            if (error instanceof TypeError && error.message.includes('fetch')) {
                alert('Network error: Unable to connect to the server. Please check your connection and try again.');
            } else {
                const errorMessage = error instanceof Error ? error.message : String(error);
                alert(`An unexpected error occurred while creating the survey: ${errorMessage}. Please try again.`);
            }
        } finally {
            setSaving(false);
        }
    };

    const saveQuestions = async (surveyId: number, token: string) => {
        for (const question of surveyData.questions) {
            try {
                const questionPayload = {
                    question_type: question.type,
                    question_text: question.title,
                    description: question.description || '',
                    is_required: question.required,
                    order: question.order,
                    options: question.options || [],
                };

                console.log(`Saving question ${question.order}:`, questionPayload);

                const questionResponse = await fetch(`/api/v1/admin/surveys/${surveyId}/questions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify(questionPayload),
                });

                if (!questionResponse.ok) {
                    const errorData = await questionResponse.json();
                    console.error(`Question ${question.order} failed:`, errorData);
                } else {
                    const successData = await questionResponse.json();
                    console.log(`Question ${question.order} saved successfully:`, successData);
                }
            } catch (error) {
                console.error('Error saving question:', error);
                // Continue with other questions even if one fails
            }
        }
    };

    const renderQuestionEditor = (question: Question) => {
        const QuestionIcon = questionTypes.find(t => t.value === question.type)?.icon || Type;

        return (
            <Card key={question.id} className="border-beige-200 shadow-sm">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-2 flex-wrap">
                            <QuestionIcon className="h-5 w-5 text-maroon-600 flex-shrink-0" />
                            <span className="text-sm text-gray-600">
                                {questionTypes.find(t => t.value === question.type)?.label}
                            </span>
                            <Badge variant="outline" className="text-xs">
                                Question {question.order}
                            </Badge>
                        </div>
                        <div className="flex items-center space-x-1 justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveQuestion(question.id, 'up')}
                                disabled={question.order === 1}
                                className="text-gray-600 hover:text-maroon-600 p-2"
                                title="Move up"
                            >
                                <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveQuestion(question.id, 'down')}
                                disabled={question.order === surveyData.questions.length}
                                className="text-gray-600 hover:text-maroon-600 p-2"
                                title="Move down"
                            >
                                <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteQuestion(question.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                                title="Delete question"
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
                                            className="flex-1 border-beige-300 focus:border-maroon-500 focus:ring-maroon-500"
                                        />
                                        {question.options!.length > 2 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeOption(question.id, index)}
                                                className="text-red-600 hover:text-red-700 p-2 flex-shrink-0"
                                                title="Remove option"
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
        <AdminBaseLayout title="Create Survey" user={user}>
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
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-8">
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
                                    className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg transition-colors ${isActive
                                        ? 'bg-maroon-100 text-maroon-800'
                                        : isCompleted
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}
                                >
                                    <StepIcon className="h-4 w-4 flex-shrink-0" />
                                    <span className="text-xs sm:text-sm font-medium hidden sm:inline">{step.label}</span>
                                    <span className="text-xs font-medium sm:hidden">{step.label.split(' ')[0]}</span>
                                </button>
                                {index < 3 && (
                                    <div className="w-4 sm:w-8 h-px bg-gray-300 mx-1 sm:mx-2 hidden md:block"></div>
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
                                    className="bg-maroon-700 hover:bg-maroon-800 text-white w-full sm:w-auto"
                                >
                                    <span className="hidden sm:inline">Next: Add Questions</span>
                                    <span className="sm:hidden">Questions →</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Questions Step */}
                {currentStep === 'questions' && (
                    <div className="space-y-6">
                        {/* Question Templates */}
                        <Card className="border-blue-200 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-xl text-maroon-800 flex items-center">
                                    <Star className="h-5 w-5 mr-2 text-yellow-600" />
                                    Quick Templates
                                </CardTitle>
                                <CardDescription className="text-maroon-600">
                                    Common alumni survey questions to get you started quickly
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3">
                                    {[
                                        { title: "Current Employment Status", type: "select", options: ["Employed Full-time", "Employed Part-time", "Self-employed", "Unemployed", "Student", "Retired"] },
                                        { title: "Current Job Title", type: "text" },
                                        { title: "Company/Organization Name", type: "text" },
                                        { title: "Years of Experience", type: "select", options: ["Less than 1 year", "1-3 years", "4-6 years", "7-10 years", "More than 10 years"] },
                                        { title: "How would you rate your current job satisfaction?", type: "rating" },
                                        { title: "Monthly Income Range", type: "select", options: ["Below ₱20,000", "₱20,000 - ₱40,000", "₱40,000 - ₱60,000", "₱60,000 - ₱100,000", "Above ₱100,000"] },
                                        { title: "How did you find your current job?", type: "select", options: ["Job Portals", "Referrals", "Company Website", "Campus Recruitment", "Social Media", "Walk-in"] },
                                        { title: "Skills used in current role", type: "checkbox", options: ["Programming", "Data Analysis", "Project Management", "Communication", "Leadership", "Research"] },
                                        { title: "Additional comments or suggestions", type: "textarea" }
                                    ].map((template, index) => (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            onClick={() => {
                                                const newQuestion: Question = {
                                                    id: `q_${Date.now()}_${index}`,
                                                    type: template.type as Question['type'],
                                                    title: template.title,
                                                    required: false,
                                                    order: surveyData.questions.length + 1,
                                                    options: template.options
                                                };
                                                setSurveyData(prev => ({
                                                    ...prev,
                                                    questions: [...prev.questions, newQuestion]
                                                }));
                                            }}
                                            className="justify-start text-left h-auto p-3 border-blue-300 text-maroon-700 hover:bg-blue-50"
                                        >
                                            <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                                            <span className="truncate">{template.title}</span>
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Custom Question Types */}
                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-xl text-maroon-800">Custom Questions</CardTitle>
                                <CardDescription className="text-maroon-600">
                                    Build your own questions using different input types
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                                    {questionTypes.map((type) => {
                                        const Icon = type.icon;
                                        return (
                                            <Button
                                                key={type.value}
                                                variant="outline"
                                                onClick={() => addQuestion(type.value as Question['type'])}
                                                className="flex flex-col items-center p-3 sm:p-4 h-auto min-h-[80px] sm:min-h-[100px] border-beige-300 text-maroon-700 hover:bg-maroon-50 transition-colors"
                                            >
                                                <Icon className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2 flex-shrink-0" />
                                                <span className="text-xs sm:text-sm text-center leading-tight">{type.label}</span>
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

                        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentStep('basic')}
                                className="border-maroon-300 text-maroon-700 hover:bg-maroon-50 w-full sm:w-auto"
                            >
                                <span className="hidden sm:inline">Previous: Basic Info</span>
                                <span className="sm:hidden">← Basic Info</span>
                            </Button>
                            <Button
                                onClick={() => setCurrentStep('settings')}
                                disabled={surveyData.questions.length === 0}
                                className="bg-maroon-700 hover:bg-maroon-800 text-white w-full sm:w-auto"
                            >
                                <span className="hidden sm:inline">Next: Settings</span>
                                <span className="sm:hidden">Settings →</span>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-maroon-800 mb-2">
                                        Survey Type
                                    </label>
                                    <select
                                        value={surveyData.type}
                                        onChange={(e) => setSurveyData(prev => ({ ...prev, type: e.target.value as SurveyData['type'] }))}
                                        className="w-full border border-beige-300 rounded-md px-3 py-2 text-sm focus:border-maroon-500 focus:ring-maroon-500"
                                    >
                                        <option value="custom">Custom Survey</option>
                                        <option value="registration">Registration Survey</option>
                                        <option value="follow_up">Follow-up Survey</option>
                                        <option value="annual">Annual Survey</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-maroon-800 mb-2">
                                        Initial Status
                                    </label>
                                    <select
                                        value={surveyData.status}
                                        onChange={(e) => setSurveyData(prev => ({ ...prev, status: e.target.value as SurveyData['status'] }))}
                                        className="w-full border border-beige-300 rounded-md px-3 py-2 text-sm focus:border-maroon-500 focus:ring-maroon-500"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-maroon-800 mb-2">
                                    Target Graduation Years (Optional)
                                </label>
                                <Input
                                    value={surveyData.target_graduation_years?.join(', ') || ''}
                                    onChange={(e) => setSurveyData(prev => ({
                                        ...prev,
                                        target_graduation_years: e.target.value.split(',').map(year => year.trim()).filter(year => year)
                                    }))}
                                    placeholder="e.g., 2023, 2024, 2025 (leave empty for all years)"
                                    className="border-beige-300 focus:border-maroon-500 focus:ring-maroon-500"
                                />
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-maroon-800">Survey Settings</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <label className="flex items-start space-x-2 p-2 rounded hover:bg-gray-50">
                                        <input
                                            type="checkbox"
                                            checked={surveyData.is_anonymous}
                                            onChange={(e) => setSurveyData(prev => ({ ...prev, is_anonymous: e.target.checked }))}
                                            className="rounded border-beige-300 text-maroon-600 focus:border-maroon-500 focus:ring-maroon-500 mt-0.5 flex-shrink-0"
                                        />
                                        <span className="text-sm text-gray-700">Anonymous Survey</span>
                                    </label>

                                    <label className="flex items-start space-x-2 p-2 rounded hover:bg-gray-50">
                                        <input
                                            type="checkbox"
                                            checked={surveyData.allow_multiple_responses}
                                            onChange={(e) => setSurveyData(prev => ({ ...prev, allow_multiple_responses: e.target.checked }))}
                                            className="rounded border-beige-300 text-maroon-600 focus:border-maroon-500 focus:ring-maroon-500 mt-0.5 flex-shrink-0"
                                        />
                                        <span className="text-sm text-gray-700">Allow Multiple Responses</span>
                                    </label>

                                    <label className="flex items-start space-x-2 p-2 rounded hover:bg-gray-50">
                                        <input
                                            type="checkbox"
                                            checked={surveyData.require_authentication}
                                            onChange={(e) => setSurveyData(prev => ({ ...prev, require_authentication: e.target.checked }))}
                                            className="rounded border-beige-300 text-maroon-600 focus:border-maroon-500 focus:ring-maroon-500 mt-0.5 flex-shrink-0"
                                        />
                                        <span className="text-sm text-gray-700">Require Authentication</span>
                                    </label>

                                    <label className="flex items-start space-x-2 p-2 rounded hover:bg-gray-50">
                                        <input
                                            type="checkbox"
                                            checked={surveyData.send_reminder_emails}
                                            onChange={(e) => setSurveyData(prev => ({ ...prev, send_reminder_emails: e.target.checked }))}
                                            className="rounded border-beige-300 text-maroon-600 focus:border-maroon-500 focus:ring-maroon-500 mt-0.5 flex-shrink-0"
                                        />
                                        <span className="text-sm text-gray-700">Send Reminder Emails</span>
                                    </label>
                                </div>

                                {surveyData.send_reminder_emails && (
                                    <div>
                                        <label className="block text-sm font-medium text-maroon-800 mb-2">
                                            Reminder Interval (Days)
                                        </label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="30"
                                            value={surveyData.reminder_interval_days || ''}
                                            onChange={(e) => setSurveyData(prev => ({ ...prev, reminder_interval_days: parseInt(e.target.value) || undefined }))}
                                            placeholder="7"
                                            className="w-32 border-beige-300 focus:border-maroon-500 focus:ring-maroon-500"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentStep('questions')}
                                    className="border-maroon-300 text-maroon-700 hover:bg-maroon-50 w-full sm:w-auto"
                                >
                                    <span className="hidden sm:inline">Previous: Questions</span>
                                    <span className="sm:hidden">← Questions</span>
                                </Button>
                                <Button
                                    onClick={() => setCurrentStep('review')}
                                    className="bg-maroon-700 hover:bg-maroon-800 text-white w-full sm:w-auto"
                                >
                                    <span className="hidden sm:inline">Next: Review</span>
                                    <span className="sm:hidden">Review →</span>
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="font-medium text-maroon-800 mb-2">Survey Type</h3>
                                        <p className="text-gray-700 capitalize">{surveyData.type.replace('_', ' ')}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-maroon-800 mb-2">Status</h3>
                                        <p className="text-gray-700 capitalize">{surveyData.status}</p>
                                    </div>
                                </div>

                                {surveyData.target_graduation_years && surveyData.target_graduation_years.length > 0 && (
                                    <div>
                                        <h3 className="font-medium text-maroon-800 mb-2">Target Graduation Years</h3>
                                        <p className="text-gray-700">{surveyData.target_graduation_years.join(', ')}</p>
                                    </div>
                                )}

                                <div>
                                    <h3 className="font-medium text-maroon-800 mb-2">Settings</h3>
                                    <div className="text-sm text-gray-700 space-y-1">
                                        {surveyData.is_anonymous && <p>• Anonymous survey</p>}
                                        {surveyData.allow_multiple_responses && <p>• Allows multiple responses</p>}
                                        {surveyData.require_authentication && <p>• Requires authentication</p>}
                                        {surveyData.send_reminder_emails && <p>• Sends reminder emails every {surveyData.reminder_interval_days} days</p>}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentStep('settings')}
                                        className="border-maroon-300 text-maroon-700 hover:bg-maroon-50 w-full sm:w-auto"
                                    >
                                        <span className="hidden sm:inline">Previous: Settings</span>
                                        <span className="sm:hidden">← Settings</span>
                                    </Button>
                                    <Button
                                        onClick={saveSurvey}
                                        disabled={saving}
                                        className="bg-maroon-700 hover:bg-maroon-800 text-white w-full sm:w-auto"
                                    >
                                        <Save className={`h-4 w-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
                                        <span className="hidden sm:inline">{saving ? 'Creating Survey...' : 'Create Survey'}</span>
                                        <span className="sm:hidden">{saving ? 'Creating...' : 'Create'}</span>
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