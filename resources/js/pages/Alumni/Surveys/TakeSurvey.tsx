import React, { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Loader2,
    CheckCircle,
    Send
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
    surveyId: number;
}

interface Question {
    id: number;
    question_text: string;
    description: string | null;
    question_type: string;
    options: string[] | null;
    is_required: boolean;
    order: number;
    rating_min?: number;
    rating_max?: number;
    rating_min_label?: string;
    rating_max_label?: string;
    placeholder?: string;
    help_text?: string;
}

interface Survey {
    id: number;
    title: string;
    description: string | null;
    questions: Question[];
}

interface SurveyResponse {
    id: number;
    response_token: string;
    status: string;
}

interface Answer {
    answer_text?: string;
    answer_value?: number;
    selected_options?: string[];
}

export default function TakeSurvey({ surveyId }: Props) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [survey, setSurvey] = useState<Survey | null>(null);
    const [response, setResponse] = useState<SurveyResponse | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, Answer>>({});

    useEffect(() => {
        fetchSurvey();
    }, [surveyId]);

    const fetchSurvey = async () => {
        try {
            setLoading(true);
            setError(null);

            await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
            await new Promise(resolve => setTimeout(resolve, 100));

            const res = await fetch(`/api/v1/surveys/${surveyId}/take`, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || 'Failed to load survey');
                return;
            }

            setSurvey(data.data.survey);

            if (data.data.existing_response && data.data.existing_response.status === 'draft') {
                setResponse(data.data.existing_response);
            } else {
                await startSurvey();
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Failed to load survey. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const startSurvey = async () => {
        try {
            await fetch('/sanctum/csrf-cookie', { credentials: 'include' });

            const res = await fetch(`/api/v1/surveys/${surveyId}/start`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            const data = await res.json();

            if (res.ok) {
                setResponse(data.data.response);
            } else if (res.status === 409) {
                // User has already responded to this survey
                setError(
                    data.message ||
                    'You have already responded to this survey. You can view your response in the Survey History section.'
                );
                // Redirect to history after showing the message
                setTimeout(() => {
                    router.visit('/alumni/surveys/history');
                }, 3000);
            } else {
                setError(data.message || 'Unable to start survey. Please try again.');
            }
        } catch (err) {
            console.error('Start survey error:', err);
            setError('Failed to start survey. Please check your connection and try again.');
        }
    };

    const handleSaveAnswer = async (questionId: number, answer: Answer) => {
        if (!response) return;

        try {
            setSaving(true);
            setError(null);

            await fetch('/sanctum/csrf-cookie', { credentials: 'include' });

            const res = await fetch(`/api/v1/survey-responses/${response.id}/answer`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    question_id: questionId,
                    ...answer
                })
            });

            const data = await res.json();

            if (res.ok) {
                setAnswers(prev => ({ ...prev, [questionId]: answer }));
                setSuccess('Answer saved');
                setTimeout(() => setSuccess(null), 2000);
            } else {
                setError(data.message || 'Failed to save answer');
            }
        } catch (err) {
            console.error('Save answer error:', err);
            setError('Failed to save answer. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleNext = async () => {
        if (!survey) return;

        const currentQuestion = survey.questions[currentQuestionIndex];
        const currentAnswer = answers[currentQuestion.id];

        if (currentQuestion.is_required && !currentAnswer) {
            setError('This question is required. Please provide an answer.');
            return;
        }

        if (currentAnswer) {
            await handleSaveAnswer(currentQuestion.id, currentAnswer);
        }

        if (currentQuestionIndex < survey.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setError(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
            setError(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleSubmit = async () => {
        if (!response || !survey) return;

        const missingRequired = survey.questions.filter(
            q => q.is_required && !answers[q.id]
        );

        if (missingRequired.length > 0) {
            setError(`Please answer all required questions (${missingRequired.length} remaining)`);
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            await fetch('/sanctum/csrf-cookie', { credentials: 'include' });

            const res = await fetch(`/api/v1/survey-responses/${response.id}/submit`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess('Survey submitted successfully! Redirecting...');
                setTimeout(() => {
                    router.visit('/alumni/surveys/history');
                }, 2000);
            } else {
                setError(data.message || 'Failed to submit survey');
            }
        } catch (err) {
            console.error('Submit error:', err);
            setError('Failed to submit survey. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const updateAnswer = (questionId: number, field: string, value: string | number | string[]) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                [field]: value
            }
        }));
    };

    const renderQuestionInput = (question: Question) => {
        const answer = answers[question.id] || {};

        switch (question.question_type) {
            case 'text':
            case 'email':
            case 'phone':
            case 'number':
                return (
                    <Input
                        type={question.question_type}
                        value={answer.answer_text || ''}
                        onChange={(e) => updateAnswer(question.id, 'answer_text', e.target.value)}
                        placeholder={question.placeholder || ''}
                        className="border-beige-300 focus:ring-maroon-500"
                    />
                );

            case 'textarea':
                return (
                    <Textarea
                        value={answer.answer_text || ''}
                        onChange={(e) => updateAnswer(question.id, 'answer_text', e.target.value)}
                        placeholder={question.placeholder || ''}
                        rows={4}
                        className="border-beige-300 focus:ring-maroon-500"
                    />
                );

            case 'date':
                return (
                    <Input
                        type="date"
                        value={answer.answer_text || ''}
                        onChange={(e) => updateAnswer(question.id, 'answer_text', e.target.value)}
                        className="border-beige-300 focus:ring-maroon-500"
                    />
                );

            case 'single_choice':
            case 'dropdown':
                return (
                    <RadioGroup
                        value={answer.answer_text || ''}
                        onValueChange={(value) => updateAnswer(question.id, 'answer_text', value)}
                    >
                        {question.options?.map((option, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                                <RadioGroupItem value={option} id={`${question.id}-${idx}`} />
                                <Label htmlFor={`${question.id}-${idx}`} className="cursor-pointer">
                                    {option}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                );

            case 'multiple_choice':
            case 'checkbox':
                return (
                    <div className="space-y-2">
                        {question.options?.map((option, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                                <Checkbox
                                    checked={answer.selected_options?.includes(option) || false}
                                    onCheckedChange={(checked) => {
                                        const current = answer.selected_options || [];
                                        const updated = checked
                                            ? [...current, option]
                                            : current.filter(o => o !== option);
                                        updateAnswer(question.id, 'selected_options', updated);
                                    }}
                                    id={`${question.id}-${idx}`}
                                />
                                <Label htmlFor={`${question.id}-${idx}`} className="cursor-pointer">
                                    {option}
                                </Label>
                            </div>
                        ))}
                    </div>
                );

            case 'rating':
                const min = question.rating_min || 1;
                const max = question.rating_max || 5;
                return (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-4">
                            {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((value) => (
                                <Button
                                    key={value}
                                    type="button"
                                    variant={answer.answer_value === value ? 'default' : 'outline'}
                                    onClick={() => updateAnswer(question.id, 'answer_value', value)}
                                    className={answer.answer_value === value
                                        ? 'bg-maroon-700 hover:bg-maroon-800'
                                        : 'border-beige-300 hover:border-maroon-500'}
                                >
                                    {value}
                                </Button>
                            ))}
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>{question.rating_min_label || 'Low'}</span>
                            <span>{question.rating_max_label || 'High'}</span>
                        </div>
                    </div>
                );

            case 'boolean':
                return (
                    <RadioGroup
                        value={answer.answer_text || ''}
                        onValueChange={(value) => updateAnswer(question.id, 'answer_text', value)}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id={`${question.id}-yes`} />
                            <Label htmlFor={`${question.id}-yes`} className="cursor-pointer">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id={`${question.id}-no`} />
                            <Label htmlFor={`${question.id}-no`} className="cursor-pointer">No</Label>
                        </div>
                    </RadioGroup>
                );

            default:
                return (
                    <Input
                        type="text"
                        value={answer.answer_text || ''}
                        onChange={(e) => updateAnswer(question.id, 'answer_text', e.target.value)}
                        className="border-beige-300 focus:ring-maroon-500"
                    />
                );
        }
    };

    if (loading) {
        return (
            <AlumniBaseLayout title="Take Survey">
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex items-center space-x-2">
                        <Loader2 className="h-8 w-8 text-maroon-600 animate-spin" />
                        <span className="text-maroon-800 font-medium">Loading survey...</span>
                    </div>
                </div>
            </AlumniBaseLayout>
        );
    }

    if (error && !survey) {
        return (
            <AlumniBaseLayout title="Take Survey">
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.visit('/alumni/surveys')}
                        className="text-maroon-700 hover:text-maroon-800 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Surveys
                    </Button>
                </div>

                <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
            </AlumniBaseLayout>
        );
    }

    if (!survey) return null;

    const currentQuestion = survey.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / survey.questions.length) * 100;
    const isLastQuestion = currentQuestionIndex === survey.questions.length - 1;

    return (
        <AlumniBaseLayout title={survey.title}>
            <Head title={`Take Survey: ${survey.title}`} />

            <div className="mb-8">
                <Button
                    variant="ghost"
                    onClick={() => router.visit('/alumni/surveys')}
                    className="text-maroon-700 hover:text-maroon-800 mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Surveys
                </Button>

                <h1 className="text-3xl font-bold text-maroon-800">{survey.title}</h1>
                {survey.description && (
                    <p className="text-gray-600 mt-2">{survey.description}</p>
                )}
            </div>

            <Card className="mb-6 border-beige-200">
                <CardContent className="pt-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Question {currentQuestionIndex + 1} of {survey.questions.length}</span>
                            <span>{Math.round(progress)}% Complete</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                </CardContent>
            </Card>

            {success && (
                <Alert className="mb-6 bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
            )}

            {error && (
                <Alert className="mb-6 bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
            )}

            <Card className="border-beige-200 shadow-lg">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <CardTitle className="text-xl text-maroon-800 flex items-start">
                                <span className="mr-2">Q{currentQuestionIndex + 1}.</span>
                                <span className="flex-1">
                                    {currentQuestion.question_text}
                                    {currentQuestion.is_required && (
                                        <span className="text-red-500 ml-1">*</span>
                                    )}
                                </span>
                            </CardTitle>
                            {currentQuestion.description && (
                                <CardDescription className="mt-2">
                                    {currentQuestion.description}
                                </CardDescription>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {renderQuestionInput(currentQuestion)}

                    {currentQuestion.help_text && (
                        <p className="text-sm text-gray-500 italic">{currentQuestion.help_text}</p>
                    )}

                    <div className="flex items-center justify-between pt-6 border-t border-beige-200">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handlePrevious}
                            disabled={currentQuestionIndex === 0 || saving || submitting}
                            className="border-gray-300"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Previous
                        </Button>

                        <div className="flex gap-2">
                            {!isLastQuestion ? (
                                <Button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={saving || submitting}
                                    className="bg-maroon-700 hover:bg-maroon-800"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            Next
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={saving || submitting}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Submit Survey
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </AlumniBaseLayout>
    );
}
