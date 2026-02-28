import React, { useEffect, useState, useRef, useCallback } from 'react';
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
    AlertCircle, ArrowLeft, Loader2, CheckCircle, Send, ClipboardList
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props { surveyId: number; }

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
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [survey, setSurvey] = useState<Survey | null>(null);
    const [response, setResponse] = useState<SurveyResponse | null>(null);
    const [answers, setAnswers] = useState<Record<number, Answer>>({});
    const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({});
    const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});

    const startSurvey = useCallback(async () => {
        try {
            const res = await fetch(`/api/v1/surveys/${surveyId}/start`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            const data = await res.json();

            if (res.ok) {
                setResponse(data.data.response);
            } else if (res.status === 409) {
                setError(data.message || 'You have already responded to this survey.');
                setTimeout(() => router.visit('/alumni/surveys/history'), 3000);
            } else {
                setError(data.message || 'Unable to start survey.');
            }
        } catch {
            setError('Failed to start survey.');
        }
    }, [surveyId]);

    const fetchSurvey = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await fetch(`/api/v1/surveys/${surveyId}/take`, {
                credentials: 'include',
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            const data = await res.json();

            if (!res.ok) { setError(data.message || 'Failed to load survey'); return; }

            setSurvey(data.data.survey);

            if (data.data.existing_response?.status === 'draft') {
                setResponse(data.data.existing_response);
                // Pre-populate existing answers if available
                if (data.data.existing_answers) {
                    const existing: Record<number, Answer> = {};
                    for (const a of data.data.existing_answers) {
                        existing[a.question_id] = {
                            answer_text: a.answer_text || undefined,
                            answer_value: a.answer_value || undefined,
                            selected_options: a.selected_options || undefined,
                        };
                    }
                    setAnswers(existing);
                }
            } else {
                await startSurvey();
            }
        } catch {
            setError('Failed to load survey. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [surveyId, startSurvey]);

    useEffect(() => { fetchSurvey(); }, [fetchSurvey]);

    const updateAnswer = (qId: number, field: string, value: string | number | string[]) => {
        setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], [field]: value } }));
        if (fieldErrors[qId]) setFieldErrors(prev => { const n = { ...prev }; delete n[qId]; return n; });
    };

    const handleSubmit = async () => {
        if (!response || !survey) return;

        // Validate required questions
        const errs: Record<number, string> = {};
        for (const q of survey.questions) {
            if (!q.is_required) continue;
            const a = answers[q.id];
            if (!a || (!a.answer_text && a.answer_value === undefined && (!a.selected_options || a.selected_options.length === 0))) {
                errs[q.id] = 'This question is required';
            }
        }

        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs);
            // Scroll to first error
            const firstErrId = Object.keys(errs)[0];
            const el = questionRefs.current[Number(firstErrId)];
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setError(`Please answer all required questions (${Object.keys(errs).length} remaining)`);
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            // Save all answers
            for (const q of survey.questions) {
                const a = answers[q.id];
                if (!a) continue;

                await fetch(`/api/v1/survey-responses/${response.id}/answer`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    body: JSON.stringify({ question_id: q.id, ...a }),
                });
            }

            // Submit survey
            const res = await fetch(`/api/v1/survey-responses/${response.id}/submit`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            const data = await res.json();

            if (res.ok) {
                setSuccess('Survey submitted successfully! Redirecting...');
                setTimeout(() => router.visit('/alumni/surveys/history'), 2000);
            } else {
                setError(data.message || 'Failed to submit survey');
            }
        } catch {
            setError('Failed to submit survey. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Question renderers ───────────────────────────────────────────────

    const renderQuestionInput = (question: Question) => {
        const answer = answers[question.id] || {};

        switch (question.question_type) {
            case 'text': case 'email': case 'phone': case 'number':
                return (
                    <Input
                        type={question.question_type}
                        value={answer.answer_text || ''}
                        onChange={e => updateAnswer(question.id, 'answer_text', e.target.value)}
                        placeholder={question.placeholder || ''}
                        className="border-gray-200 dark:border-gray-600 focus:ring-maroon-500 focus:border-maroon-500"
                    />
                );

            case 'textarea':
                return (
                    <Textarea
                        value={answer.answer_text || ''}
                        onChange={e => updateAnswer(question.id, 'answer_text', e.target.value)}
                        placeholder={question.placeholder || ''}
                        rows={3}
                        className="border-gray-200 dark:border-gray-600 focus:ring-maroon-500"
                    />
                );

            case 'date':
                return (
                    <Input
                        type="date"
                        value={answer.answer_text || ''}
                        onChange={e => updateAnswer(question.id, 'answer_text', e.target.value)}
                        className="border-gray-200 dark:border-gray-600 focus:ring-maroon-500 max-w-xs"
                    />
                );

            case 'single_choice': case 'dropdown':
                return (
                    <RadioGroup
                        value={answer.answer_text || ''}
                        onValueChange={v => updateAnswer(question.id, 'answer_text', v)}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                    >
                        {question.options?.map((option, idx) => (
                            <label
                                key={idx}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                                    answer.answer_text === option
                                        ? 'bg-maroon-50 dark:bg-maroon-900/30 border-maroon-300 dark:border-maroon-600 text-maroon-800 dark:text-maroon-200'
                                        : 'border-gray-200 dark:border-gray-600 hover:border-maroon-200 dark:hover:border-maroon-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                            >
                                <RadioGroupItem value={option} id={`${question.id}-${idx}`} />
                                <Label htmlFor={`${question.id}-${idx}`} className="cursor-pointer flex-1 text-sm">{option}</Label>
                            </label>
                        ))}
                    </RadioGroup>
                );

            case 'multiple_choice': case 'checkbox':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {question.options?.map((option, idx) => {
                            const isChecked = answer.selected_options?.includes(option) || false;
                            return (
                                <label
                                    key={idx}
                                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                                        isChecked
                                            ? 'bg-maroon-50 dark:bg-maroon-900/30 border-maroon-300 dark:border-maroon-600'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-maroon-200 dark:hover:border-maroon-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={checked => {
                                            const current = answer.selected_options || [];
                                            updateAnswer(question.id, 'selected_options',
                                                checked ? [...current, option] : current.filter(o => o !== option));
                                        }}
                                        id={`${question.id}-${idx}`}
                                    />
                                    <Label htmlFor={`${question.id}-${idx}`} className="cursor-pointer flex-1 text-sm">{option}</Label>
                                </label>
                            );
                        })}
                    </div>
                );

            case 'rating': {
                const min = question.rating_min || 1;
                const max = question.rating_max || 5;
                return (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(value => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => updateAnswer(question.id, 'answer_value', value)}
                                    className={`w-10 h-10 rounded-lg font-semibold text-sm transition-all ${
                                        answer.answer_value === value
                                            ? 'bg-maroon-700 text-white shadow-md scale-110'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-maroon-100 dark:hover:bg-maroon-900/30'
                                    }`}
                                >
                                    {value}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{question.rating_min_label || 'Low'}</span>
                            <span>{question.rating_max_label || 'High'}</span>
                        </div>
                    </div>
                );
            }

            case 'boolean':
                return (
                    <RadioGroup
                        value={answer.answer_text || ''}
                        onValueChange={v => updateAnswer(question.id, 'answer_text', v)}
                        className="flex gap-3"
                    >
                        {['Yes', 'No'].map(opt => (
                            <label
                                key={opt}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border cursor-pointer transition-all ${
                                    answer.answer_text?.toLowerCase() === opt.toLowerCase()
                                        ? 'bg-maroon-50 dark:bg-maroon-900/30 border-maroon-300 dark:border-maroon-600'
                                        : 'border-gray-200 dark:border-gray-600 hover:border-maroon-200 dark:hover:border-maroon-700'
                                }`}
                            >
                                <RadioGroupItem value={opt.toLowerCase()} id={`${question.id}-${opt}`} />
                                <Label htmlFor={`${question.id}-${opt}`} className="cursor-pointer">{opt}</Label>
                            </label>
                        ))}
                    </RadioGroup>
                );

            default:
                return (
                    <Input
                        type="text"
                        value={answer.answer_text || ''}
                        onChange={e => updateAnswer(question.id, 'answer_text', e.target.value)}
                        className="border-gray-200 dark:border-gray-600 focus:ring-maroon-500"
                    />
                );
        }
    };

    // ── Loading / Error states ───────────────────────────────────────────

    if (loading) {
        return (
            <AlumniBaseLayout title="Take Survey">
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-8 w-8 text-maroon-600 animate-spin" />
                        <span className="text-maroon-800 dark:text-maroon-200 font-medium">Loading survey...</span>
                    </div>
                </div>
            </AlumniBaseLayout>
        );
    }

    if (error && !survey) {
        return (
            <AlumniBaseLayout title="Take Survey">
                <Button variant="ghost" onClick={() => router.visit('/alumni/surveys')} className="text-maroon-700 hover:text-maroon-800 mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />Back to Surveys
                </Button>
                <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 dark:text-red-300">{error}</AlertDescription>
                </Alert>
            </AlumniBaseLayout>
        );
    }

    if (!survey) return null;

    const answeredCount = survey.questions.filter(q => {
        const a = answers[q.id];
        return a && (a.answer_text || a.answer_value !== undefined || (a.selected_options && a.selected_options.length > 0));
    }).length;
    const progress = (answeredCount / survey.questions.length) * 100;

    return (
        <AlumniBaseLayout title={survey.title}>
            <Head title={`Take Survey: ${survey.title}`} />

            {/* Header */}
            <div className="mb-6">
                <Button variant="ghost" onClick={() => router.visit('/alumni/surveys')} className="text-maroon-700 hover:text-maroon-800 dark:text-maroon-300 mb-3">
                    <ArrowLeft className="h-4 w-4 mr-2" />Back to Surveys
                </Button>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-br from-maroon-600 to-maroon-700 rounded-xl">
                        <ClipboardList className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-maroon-800 dark:text-maroon-200">{survey.title}</h1>
                        {survey.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{survey.description}</p>}
                    </div>
                </div>
            </div>

            {/* Progress bar — sticky */}
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 -mx-4 px-4 py-3 mb-6 sm:-mx-6 sm:px-6">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1.5">
                    <span>{answeredCount} of {survey.questions.length} answered</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            {/* Alerts */}
            {success && (
                <Alert className="mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-300">{success}</AlertDescription>
                </Alert>
            )}
            {error && (
                <Alert className="mb-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 dark:text-red-300">{error}</AlertDescription>
                </Alert>
            )}

            {/* All questions */}
            <div className="space-y-4">
                {survey.questions.map((question, idx) => {
                    const hasError = !!fieldErrors[question.id];
                    const a = answers[question.id];
                    const isAnswered = a && (a.answer_text || a.answer_value !== undefined || (a.selected_options && a.selected_options.length > 0));

                    return (
                        <div
                            key={question.id}
                            ref={el => { questionRefs.current[question.id] = el; }}
                        >
                            <Card className={`border transition-all ${
                                hasError
                                    ? 'border-red-300 dark:border-red-700 shadow-red-100 dark:shadow-none'
                                    : isAnswered
                                        ? 'border-green-200 dark:border-green-800'
                                        : 'border-gray-200 dark:border-gray-700'
                            }`}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start gap-3">
                                        <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${
                                            isAnswered
                                                ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                                                : hasError
                                                    ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                        }`}>
                                            {isAnswered ? <CheckCircle className="h-3.5 w-3.5" /> : idx + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-base text-gray-900 dark:text-gray-100">
                                                {question.question_text}
                                                {question.is_required && <span className="text-red-500 ml-1">*</span>}
                                            </CardTitle>
                                            {question.description && (
                                                <CardDescription className="mt-1 text-sm">{question.description}</CardDescription>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    {renderQuestionInput(question)}
                                    {question.help_text && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-2">{question.help_text}</p>
                                    )}
                                    {hasError && (
                                        <p className="text-xs text-red-500 dark:text-red-400 mt-2 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />{fieldErrors[question.id]}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    );
                })}
            </div>

            {/* Submit */}
            <div className="mt-8 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6">
                <Button variant="outline" onClick={() => router.visit('/alumni/surveys')} className="border-gray-300 dark:border-gray-600">
                    <ArrowLeft className="h-4 w-4 mr-2" />Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-green-600 hover:bg-green-700 text-white px-8"
                >
                    {submitting ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</>
                    ) : (
                        <><Send className="h-4 w-4 mr-2" />Submit Survey</>
                    )}
                </Button>
            </div>
        </AlumniBaseLayout>
    );
}
