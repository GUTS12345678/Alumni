import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Search,
    RefreshCw,
    Download,
    TrendingUp,
    Users,
    FileText,
    BarChart3,
    PieChart,
    Target,
    CheckCircle,
    Clock,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Eye,
    X,
    User,
    Mail,
    MessageSquare,
    ListChecks,
    ArrowLeft
} from 'lucide-react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import ResponseTrendsChart from '@/components/charts/ResponseTrendsChart';
import EmploymentDistributionChart from '@/components/charts/EmploymentDistributionChart';

interface Survey {
    id: string;
    title: string;
    description: string;
    status: 'draft' | 'active' | 'closed' | 'archived';
    created_at: string;
    responses_count: number;
    completion_rate: number;
    avg_completion_time: number | null;
    target_audience: string[];
}

interface SurveyAnalytics {
    survey: Survey;
    total_responses: number;
    completion_rate: number;
    avg_completion_time: number;
    response_rate_by_date: { date: string; responses: number }[];
    completion_rate_by_batch: { batch: string; completion_rate: number }[];
    employment_status_distribution: { status: string; count: number; percentage: number }[];
    question_analytics: QuestionAnalytic[];
    demographic_insights: DemographicInsight[];
}

interface QuestionAnalytic {
    question_id: string;
    question_text: string;
    question_type: string;
    total_responses: number;
    skip_rate: number;
    response_distribution: Array<{ option: string; count: number; percentage: number }>;
    avg_response_time: number;
}

interface DemographicInsight {
    dimension: string;
    breakdown: { label: string; count: number; percentage: number }[];
}

interface AnalyticsStats {
    total_surveys: number;
    active_surveys: number;
    total_responses: number;
    avg_completion_rate: number;
    most_popular_survey: string;
    recent_activity: { date: string; responses: number }[];
}

interface Question {
    id: number;
    question_text: string;
    question_type: string;
    order: number;
}

interface ResponseAnswer {
    answer_text: string | null;
    answer_json: Record<string, unknown> | null;
    answered_at: string | null;
}

interface IndividualResponse {
    id: number;
    respondent_name: string;
    respondent_email: string;
    status: string;
    started_at: string;
    completed_at: string | null;
    created_at: string;
    answers: Record<number, ResponseAnswer>;
    answered_count: number;
    total_questions: number;
}

interface UserProp {
    id: number;
    email: string;
    role: string;
    status: string;
}

interface Props {
    user: UserProp;
}

type TabType = 'overview' | 'responses' | 'questions';

export default function SurveyAnalytics({ user }: Props) {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [selectedSurvey, setSelectedSurvey] = useState<string>('');
    const [analytics, setAnalytics] = useState<SurveyAnalytics | null>(null);
    const [stats, setStats] = useState<AnalyticsStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState('all');
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    // Individual responses state
    const [responses, setResponses] = useState<IndividualResponse[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [responsesLoading, setResponsesLoading] = useState(false);
    const [responsesPage, setResponsesPage] = useState(1);
    const [responsesTotalPages, setResponsesTotalPages] = useState(1);
    const [responsesTotal, setResponsesTotal] = useState(0);
    const [responseSearch, setResponseSearch] = useState('');
    const [selectedResponse, setSelectedResponse] = useState<IndividualResponse | null>(null);
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [withAnswersOnly, setWithAnswersOnly] = useState(true); // Default to showing only responses with answers
    const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress'>('all');

    const getCsrfToken = () => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') || '' : '';
    };

    const [autoRefresh, setAutoRefresh] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchSurveys = async () => {
        try {
            setLoading(true);

            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const [surveysResponse, statsResponse] = await Promise.all([
                fetch('/api/v1/admin/surveys', {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                }),
                fetch('/api/v1/admin/analytics/overview', {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                })
            ]);

            if (!surveysResponse.ok || !statsResponse.ok) {
                if (surveysResponse.status === 401 || statsResponse.status === 401) {
                    localStorage.removeItem('auth_token');
                    window.location.href = '/login';
                    return;
                }
                throw new Error('Failed to fetch surveys');
            }

            const surveysData = await surveysResponse.json();
            const statsData = await statsResponse.json();

            if (surveysData.success) {
                const surveysList = Array.isArray(surveysData.data)
                    ? surveysData.data
                    : (surveysData.data?.data || []);
                setSurveys(surveysList);
            }

            if (statsData.success) {
                setStats(statsData.data);
            }

            setLastUpdated(new Date());
        } catch (err) {
            console.error('Surveys fetch error:', err);
            setError('Failed to load surveys');
        } finally {
            setLoading(false);
        }
    };

    const fetchSurveyAnalytics = useCallback(async (surveyId: string) => {
        try {
            setAnalyticsLoading(true);

            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const response = await fetch(`/api/v1/admin/analytics/surveys/${surveyId}?days=${dateRange}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('auth_token');
                    window.location.href = '/login';
                    return;
                }
                throw new Error('Failed to fetch survey analytics');
            }

            const data = await response.json();
            if (data.success) {
                setAnalytics(data.data);
                setLastUpdated(new Date());
            }
        } catch (err) {
            console.error('Analytics fetch error:', err);
            setError('Failed to load survey analytics');
        } finally {
            setAnalyticsLoading(false);
        }
    }, [dateRange]);

    const fetchSurveyResponses = useCallback(async (surveyId: string, page: number = 1, search: string = '') => {
        try {
            setResponsesLoading(true);

            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const params = new URLSearchParams({
                days: dateRange,
                page: page.toString(),
                per_page: '15',
                search: search,
                with_answers: withAnswersOnly ? 'true' : 'false',
                status: statusFilter
            });

            const response = await fetch(`/api/v1/admin/analytics/surveys/${surveyId}/responses?${params}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch responses');
            }

            const data = await response.json();
            if (data.success) {
                setResponses(data.data.responses);
                setQuestions(data.data.questions);
                setResponsesPage(data.data.pagination.current_page);
                setResponsesTotalPages(data.data.pagination.last_page);
                setResponsesTotal(data.data.pagination.total);
            }
        } catch (err) {
            console.error('Responses fetch error:', err);
        } finally {
            setResponsesLoading(false);
        }
    }, [dateRange, withAnswersOnly, statusFilter]);

    useEffect(() => {
        fetchSurveys();
    }, []);

    useEffect(() => {
        if (selectedSurvey) {
            fetchSurveyAnalytics(selectedSurvey);
            if (activeTab === 'responses') {
                fetchSurveyResponses(selectedSurvey, 1, responseSearch);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSurvey, fetchSurveyAnalytics, dateRange]);

    useEffect(() => {
        if (selectedSurvey && activeTab === 'responses') {
            fetchSurveyResponses(selectedSurvey, responsesPage, responseSearch);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, responsesPage, withAnswersOnly, statusFilter, selectedSurvey]);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (autoRefresh) {
            interval = setInterval(() => {
                if (selectedSurvey) {
                    fetchSurveyAnalytics(selectedSurvey);
                } else {
                    fetchSurveys();
                }
            }, 30000);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [autoRefresh, selectedSurvey, fetchSurveyAnalytics]);

    const handleResponseSearch = () => {
        if (selectedSurvey) {
            setResponsesPage(1);
            fetchSurveyResponses(selectedSurvey, 1, responseSearch);
        }
    };

    const viewResponseDetails = (response: IndividualResponse) => {
        setSelectedResponse(response);
        setShowResponseModal(true);
    };

    const exportAnalytics = async (format: 'csv' | 'excel' | 'pdf' = 'excel') => {
        if (!selectedSurvey) return;

        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const response = await fetch(`/api/v1/admin/analytics/surveys/${selectedSurvey}/export?format=${format}`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/octet-stream',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'same-origin',
                body: JSON.stringify({ days: dateRange }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                const extension = format === 'excel' ? 'xlsx' : format;
                a.download = `survey_analytics_${selectedSurvey}_${new Date().toISOString().split('T')[0]}.${extension}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                alert('Failed to export analytics. Please try again.');
            }
        } catch (err) {
            console.error('Export error:', err);
            alert('An error occurred while exporting. Please try again.');
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'draft': { color: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200', icon: Clock },
            'active': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
            'closed': { color: 'bg-blue-100 text-blue-800', icon: Target },
            'archived': { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
            'completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
            'in_progress': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
        const Icon = config.icon;

        return (
            <Badge className={config.color}>
                <Icon className="h-3 w-3 mr-1" />
                {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
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

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTime = (minutes: number | null | undefined) => {
        if (!minutes || isNaN(minutes) || minutes === 0) {
            return 'N/A';
        }
        if (minutes < 60) {
            return `${Math.round(minutes)}m`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return `${hours}h ${mins}m`;
    };

    const filteredSurveys = (Array.isArray(surveys) ? surveys : []).filter(survey => {
        const statusMatch = survey.status === 'active' || survey.status === 'closed';
        const searchMatch = !searchTerm ||
            survey.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            survey.description?.toLowerCase().includes(searchTerm.toLowerCase());
        return statusMatch && searchMatch;
    });

    const getQuestionTypeBadge = (type: string) => {
        const typeColors: Record<string, string> = {
            'text': 'bg-blue-100 text-blue-800',
            'email': 'bg-purple-100 text-purple-800',
            'phone': 'bg-green-100 text-green-800',
            'number': 'bg-orange-100 text-orange-800',
            'date': 'bg-pink-100 text-pink-800',
            'radio': 'bg-yellow-100 text-yellow-800',
            'checkbox': 'bg-indigo-100 text-indigo-800',
            'select': 'bg-cyan-100 text-cyan-800',
            'textarea': 'bg-teal-100 text-teal-800',
        };
        return typeColors[type] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
    };

    // Response Details Modal
    const ResponseModal = () => {
        if (!showResponseModal || !selectedResponse) return null;

        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                    {/* Modal Header */}
                    <div className="bg-gradient-to-r from-maroon-700 to-maroon-800 text-white px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold">Response Details</h2>
                                <p className="text-maroon-200 text-sm">
                                    Submitted on {formatDateTime(selectedResponse.created_at)}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowResponseModal(false)}
                                className="p-2 hover:bg-maroon-600 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Respondent Info */}
                    <div className="bg-beige-50 dark:bg-gray-900 px-6 py-4 border-b border-beige-200 dark:border-gray-700">
                        <div className="flex items-center gap-6">
                            <div className="bg-maroon-100 dark:bg-maroon-800/30 p-3 rounded-full">
                                <User className="h-8 w-8 text-maroon-700 dark:text-maroon-300" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-maroon-800 dark:text-gray-200">
                                    {selectedResponse.respondent_name}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Mail className="h-4 w-4" />
                                        {selectedResponse.respondent_email}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MessageSquare className="h-4 w-4" />
                                        {selectedResponse.answered_count} / {selectedResponse.total_questions} answered
                                    </span>
                                </div>
                            </div>
                            {getStatusBadge(selectedResponse.status)}
                        </div>
                    </div>

                    {/* Answers */}
                    <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
                        <div className="space-y-4">
                            {questions.map((question, index) => {
                                const answer = selectedResponse.answers[question.id];
                                const hasAnswer = answer && (answer.answer_text || answer.answer_json);

                                return (
                                    <div
                                        key={question.id}
                                        className={`p-4 rounded-lg border ${hasAnswer ? 'bg-white dark:bg-gray-800 border-beige-200 dark:border-gray-700' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-maroon-700 text-white text-xs font-bold px-2 py-1 rounded">
                                                    Q{index + 1}
                                                </span>
                                                <h4 className="font-medium text-gray-800 dark:text-gray-200">
                                                    {question.question_text}
                                                </h4>
                                            </div>
                                            <Badge className={getQuestionTypeBadge(question.question_type)}>
                                                {question.question_type}
                                            </Badge>
                                        </div>
                                        <div className="ml-9">
                                            {hasAnswer ? (
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                    <p className="text-gray-800 dark:text-gray-200">
                                                        {answer.answer_text || JSON.stringify(answer.answer_json)}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                                    <p className="text-gray-500 dark:text-gray-400 italic">No answer provided</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <AdminBaseLayout title="Survey Analytics" user={user}>
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="h-8 w-8 text-maroon-600 dark:text-maroon-400 animate-spin" />
                        <span className="text-maroon-800 dark:text-gray-200 font-medium">Loading analytics...</span>
                    </div>
                </div>
            </AdminBaseLayout>
        );
    }

    if (error) {
        return (
            <AdminBaseLayout title="Survey Analytics" user={user}>
                <Card className="border-red-200">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-red-600 mb-4">{error}</p>
                            <Button onClick={() => fetchSurveys()} className="bg-maroon-700 hover:bg-maroon-800">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </AdminBaseLayout>
        );
    }

    return (
        <AdminBaseLayout title="Survey Analytics" user={user}>
            <ResponseModal />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        {selectedSurvey ? (
                            <button
                                onClick={() => {
                                    setSelectedSurvey('');
                                    setAnalytics(null);
                                    setActiveTab('overview');
                                }}
                                className="flex items-center text-maroon-600 dark:text-maroon-400 hover:text-maroon-800 dark:hover:text-maroon-300 mb-2"
                            >
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Back to all surveys
                            </button>
                        ) : null}
                        <h2 className="text-2xl font-bold text-maroon-800 dark:text-gray-200">
                            {selectedSurvey && analytics ? analytics.survey.title : 'Survey Analytics'}
                        </h2>
                        <p className="text-maroon-600 dark:text-gray-400">
                            {selectedSurvey ? 'View detailed analytics and responses' : 'Detailed insights and response analytics'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                            {autoRefresh && <span className="ml-2 text-green-600">● Live</span>}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="auto-refresh"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="rounded border-maroon-300 dark:border-gray-600 text-maroon-600 dark:text-maroon-400 focus:ring-maroon-200"
                            />
                            <label htmlFor="auto-refresh" className="text-sm text-maroon-700 dark:text-gray-300">
                                Auto-refresh
                            </label>
                        </div>

                        {selectedSurvey && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-green-300 text-green-700 hover:bg-green-50"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Export
                                        <ChevronDown className="h-4 w-4 ml-2" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => exportAnalytics('csv')}>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Export as CSV
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => exportAnalytics('excel')}>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Export as Excel
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => exportAnalytics('pdf')}>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Export as PDF
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        <Button
                            onClick={() => selectedSurvey ? fetchSurveyAnalytics(selectedSurvey) : fetchSurveys()}
                            variant="outline"
                            size="sm"
                            className="border-maroon-300 dark:border-gray-600 text-maroon-700 dark:text-gray-300 hover:bg-maroon-50 dark:hover:bg-maroon-800/30"
                            disabled={loading || analyticsLoading}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${(loading || analyticsLoading) ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Overview Statistics - Show when no survey selected */}
                {!selectedSurvey && stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg bg-gradient-to-br from-white to-beige-50 dark:from-gray-800 dark:to-gray-900">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800 dark:text-gray-200">Total Surveys</CardTitle>
                                <FileText className="h-5 w-5 text-maroon-600 dark:text-maroon-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-maroon-800 dark:text-gray-200">{stats.total_surveys ?? 0}</div>
                                <p className="text-sm text-maroon-600 dark:text-gray-400 mt-1">{stats.active_surveys ?? 0} currently active</p>
                            </CardContent>
                        </Card>

                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800 dark:text-gray-200">Total Responses</CardTitle>
                                <Users className="h-5 w-5 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-blue-600">{(stats.total_responses ?? 0).toLocaleString()}</div>
                                <p className="text-sm text-maroon-600 dark:text-gray-400 mt-1">Across all surveys</p>
                            </CardContent>
                        </Card>

                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-gray-900">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800 dark:text-gray-200">Avg Completion Rate</CardTitle>
                                <Target className="h-5 w-5 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-600">{(stats.avg_completion_rate ?? 0).toFixed(1)}%</div>
                                <p className="text-sm text-maroon-600 dark:text-gray-400 mt-1">Overall completion rate</p>
                            </CardContent>
                        </Card>

                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-gray-900">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800 dark:text-gray-200">Most Popular</CardTitle>
                                <TrendingUp className="h-5 w-5 text-purple-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-purple-600 truncate">{stats.most_popular_survey || 'N/A'}</div>
                                <p className="text-sm text-maroon-600 dark:text-gray-400 mt-1">Highest response rate</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Survey Selection - Show when no survey selected */}
                {!selectedSurvey && (
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl text-maroon-800 dark:text-gray-200">Select Survey for Analysis</CardTitle>
                            <CardDescription className="text-maroon-600 dark:text-gray-400">
                                Choose a survey to view detailed analytics and individual responses
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search surveys..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 border-beige-300 dark:border-gray-600 focus:border-maroon-400 focus:ring-maroon-200 dark:bg-gray-700 dark:text-gray-100"
                                    />
                                </div>

                                <select
                                    value={dateRange}
                                    onChange={(e) => setDateRange(e.target.value)}
                                    className="px-3 py-2 border border-beige-300 dark:border-gray-600 rounded-md focus:border-maroon-400 focus:ring-maroon-200 dark:bg-gray-700 dark:text-gray-100"
                                >
                                    <option value="all">All time</option>
                                    <option value="365">Last year</option>
                                    <option value="90">Last 90 days</option>
                                    <option value="30">Last 30 days</option>
                                    <option value="7">Last 7 days</option>
                                </select>
                            </div>

                            {filteredSurveys.length === 0 ? (
                                <div className="text-center py-12">
                                    <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No surveys found</h3>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        {searchTerm ? 'Try adjusting your search' : 'Create surveys to see analytics'}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredSurveys.map((survey) => (
                                        <Card
                                            key={survey.id}
                                            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-2 ${selectedSurvey === survey.id
                                                ? 'border-maroon-400 bg-maroon-50 dark:bg-maroon-900/30'
                                                : 'border-beige-200 dark:border-gray-700 hover:border-maroon-300'
                                                }`}
                                            onClick={() => setSelectedSurvey(survey.id)}
                                        >
                                            <CardContent className="p-5">
                                                <div className="flex items-start justify-between mb-3">
                                                    <h3 className="font-semibold text-maroon-800 dark:text-gray-200 line-clamp-2">{survey.title}</h3>
                                                    {getStatusBadge(survey.status)}
                                                </div>

                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{survey.description}</p>

                                                <div className="grid grid-cols-3 gap-2 text-center">
                                                    <div className="bg-blue-50 rounded-lg p-2">
                                                        <div className="text-lg font-bold text-blue-600">{survey.responses_count}</div>
                                                        <div className="text-xs text-gray-600">Responses</div>
                                                    </div>
                                                    <div className="bg-green-50 rounded-lg p-2">
                                                        <div className="text-lg font-bold text-green-600">{survey.completion_rate}%</div>
                                                        <div className="text-xs text-gray-600">Complete</div>
                                                    </div>
                                                    <div className="bg-purple-50 rounded-lg p-2">
                                                        <div className="text-lg font-bold text-purple-600">{formatTime(survey.avg_completion_time)}</div>
                                                        <div className="text-xs text-gray-600">Avg Time</div>
                                                    </div>
                                                </div>

                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-beige-100 dark:border-gray-700">
                                                    Created {formatDate(survey.created_at)}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Selected Survey Analytics */}
                {selectedSurvey && analytics && (
                    <div className="space-y-6">
                        {/* Tabs */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-beige-200 dark:border-gray-700 p-1 flex flex-wrap gap-1">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'overview'
                                    ? 'bg-maroon-700 text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-maroon-700 hover:bg-maroon-50 dark:hover:bg-maroon-800/30'
                                    }`}
                            >
                                <BarChart3 className="h-4 w-4 inline mr-2" />
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('responses')}
                                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'responses'
                                    ? 'bg-maroon-700 text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-maroon-700 hover:bg-maroon-50 dark:hover:bg-maroon-800/30'
                                    }`}
                            >
                                <Users className="h-4 w-4 inline mr-2" />
                                Individual Responses ({analytics.total_responses})
                            </button>
                            <button
                                onClick={() => setActiveTab('questions')}
                                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'questions'
                                    ? 'bg-maroon-700 text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-maroon-700 hover:bg-maroon-50 dark:hover:bg-maroon-800/30'
                                    }`}
                            >
                                <ListChecks className="h-4 w-4 inline mr-2" />
                                Question Analysis
                            </button>
                        </div>

                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Key Metrics */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
                                        <CardContent className="p-6 text-center">
                                            <Users className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                                            <div className="text-4xl font-bold text-blue-800">{analytics.total_responses}</div>
                                            <p className="text-sm text-blue-600 mt-1">Total Responses</p>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg bg-gradient-to-br from-green-50 to-white dark:from-gray-800 dark:to-gray-900">
                                        <CardContent className="p-6 text-center">
                                            <Target className="h-10 w-10 text-green-600 mx-auto mb-3" />
                                            <div className="text-4xl font-bold text-green-800">{analytics.completion_rate}%</div>
                                            <p className="text-sm text-green-600 mt-1">Completion Rate</p>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg bg-gradient-to-br from-purple-50 to-white dark:from-gray-800 dark:to-gray-900">
                                        <CardContent className="p-6 text-center">
                                            <Clock className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                                            <div className="text-4xl font-bold text-purple-800">{formatTime(analytics.avg_completion_time)}</div>
                                            <p className="text-sm text-purple-600 mt-1">Avg Completion Time</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Response Trends Chart */}
                                {analytics.response_rate_by_date.length > 0 && (
                                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                                        <CardHeader>
                                            <CardTitle className="text-xl text-maroon-800 dark:text-gray-200 flex items-center">
                                                <TrendingUp className="h-5 w-5 mr-2" />
                                                Response Trends
                                            </CardTitle>
                                            <CardDescription>Daily response activity over time</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <ResponseTrendsChart
                                                data={analytics.response_rate_by_date}
                                                height={350}
                                                showArea={analytics.response_rate_by_date.length > 10}
                                            />
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Employment Distribution */}
                                {analytics.employment_status_distribution.length > 0 && (
                                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                                        <CardHeader>
                                            <CardTitle className="text-xl text-maroon-800 dark:text-gray-200 flex items-center">
                                                <PieChart className="h-5 w-5 mr-2" />
                                                Employment Status Distribution
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <EmploymentDistributionChart
                                                data={analytics.employment_status_distribution}
                                                height={400}
                                                chartType="pie"
                                            />
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}

                        {/* Individual Responses Tab */}
                        {activeTab === 'responses' && (
                            <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                                <CardHeader>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div>
                                                <CardTitle className="text-xl text-maroon-800 dark:text-gray-200">Individual Responses</CardTitle>
                                                <CardDescription>View each respondent's answers ({responsesTotal} matching)</CardDescription>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                    <Input
                                                        placeholder="Search responses..."
                                                        value={responseSearch}
                                                        onChange={(e) => setResponseSearch(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleResponseSearch()}
                                                        className="pl-10 w-full sm:w-64 border-beige-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                                    />
                                                </div>
                                                <Button
                                                    onClick={handleResponseSearch}
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-maroon-300 dark:border-gray-600"
                                                >
                                                    Search
                                                </Button>
                                            </div>
                                        </div>
                                        {/* Filter Controls */}
                                        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-beige-200 dark:border-gray-700">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                                                <select
                                                    value={statusFilter}
                                                    onChange={(e) => {
                                                        setStatusFilter(e.target.value as 'all' | 'completed' | 'in_progress');
                                                        setResponsesPage(1);
                                                    }}
                                                    className="text-sm border border-beige-300 dark:border-gray-600 rounded-md px-2 py-1 focus:ring-maroon-500 focus:border-maroon-500 dark:bg-gray-700 dark:text-gray-100"
                                                >
                                                    <option value="all">All</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="in_progress">In Progress</option>
                                                </select>
                                            </div>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={withAnswersOnly}
                                                    onChange={(e) => {
                                                        setWithAnswersOnly(e.target.checked);
                                                        setResponsesPage(1);
                                                    }}
                                                    className="w-4 h-4 text-maroon-600 border-beige-300 rounded focus:ring-maroon-500"
                                                />
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Show only responses with answers</span>
                                            </label>
                                            {withAnswersOnly && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                                    Hiding empty sessions
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {responsesLoading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <RefreshCw className="h-8 w-8 text-maroon-600 dark:text-maroon-400 animate-spin" />
                                            <span className="ml-2 text-maroon-700 dark:text-gray-300">Loading responses...</span>
                                        </div>
                                    ) : responses.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No responses found</h3>
                                            <p className="text-gray-500 dark:text-gray-400">
                                                {responseSearch
                                                    ? 'Try adjusting your search'
                                                    : withAnswersOnly
                                                        ? 'No responses with answers. Try unchecking "Show only responses with answers".'
                                                        : 'No responses yet for this survey'}
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Response Table */}
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="bg-beige-50 dark:bg-gray-800/50 border-b border-beige-200 dark:border-gray-700">
                                                            <th className="text-left px-4 py-3 text-sm font-semibold text-maroon-800 dark:text-gray-200">Respondent</th>
                                                            <th className="text-left px-4 py-3 text-sm font-semibold text-maroon-800 dark:text-gray-200">Email</th>
                                                            <th className="text-center px-4 py-3 text-sm font-semibold text-maroon-800 dark:text-gray-200">Progress</th>
                                                            <th className="text-center px-4 py-3 text-sm font-semibold text-maroon-800 dark:text-gray-200">Status</th>
                                                            <th className="text-left px-4 py-3 text-sm font-semibold text-maroon-800 dark:text-gray-200">Submitted</th>
                                                            <th className="text-center px-4 py-3 text-sm font-semibold text-maroon-800 dark:text-gray-200">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-beige-100 dark:divide-gray-700">
                                                        {responses.map((response) => (
                                                            <tr key={response.id} className="hover:bg-beige-50 dark:hover:bg-gray-800 transition-colors">
                                                                <td className="px-4 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="bg-maroon-100 dark:bg-maroon-800/30 p-2 rounded-full">
                                                                            <User className="h-4 w-4 text-maroon-700 dark:text-maroon-300" />
                                                                        </div>
                                                                        <span className="font-medium text-gray-800 dark:text-gray-200">{response.respondent_name}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-4 text-gray-600 dark:text-gray-400">{response.respondent_email}</td>
                                                                <td className="px-4 py-4">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                                                            <div
                                                                                className="bg-maroon-600 h-2 rounded-full transition-all"
                                                                                style={{ width: `${(response.answered_count / response.total_questions) * 100}%` }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                                                            {response.answered_count}/{response.total_questions}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-4 text-center">
                                                                    {getStatusBadge(response.status)}
                                                                </td>
                                                                <td className="px-4 py-4 text-gray-600 dark:text-gray-400 text-sm">
                                                                    {formatDateTime(response.created_at)}
                                                                </td>
                                                                <td className="px-4 py-4 text-center">
                                                                    <Button
                                                                        onClick={() => viewResponseDetails(response)}
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="border-maroon-300 dark:border-gray-600 text-maroon-700 dark:text-gray-300 hover:bg-maroon-50 dark:hover:bg-maroon-800/30"
                                                                    >
                                                                        <Eye className="h-4 w-4 mr-1" />
                                                                        View
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Pagination */}
                                            {responsesTotalPages > 1 && (
                                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-beige-200 dark:border-gray-700">
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        Showing {((responsesPage - 1) * 15) + 1} - {Math.min(responsesPage * 15, responsesTotal)} of {responsesTotal} responses
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            onClick={() => setResponsesPage(p => Math.max(1, p - 1))}
                                                            disabled={responsesPage === 1}
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-beige-300 dark:border-gray-600"
                                                        >
                                                            <ChevronLeft className="h-4 w-4" />
                                                            Previous
                                                        </Button>
                                                        <span className="px-3 py-1 bg-maroon-100 dark:bg-maroon-800/30 text-maroon-800 dark:text-gray-200 rounded-md font-medium">
                                                            {responsesPage} / {responsesTotalPages}
                                                        </span>
                                                        <Button
                                                            onClick={() => setResponsesPage(p => Math.min(responsesTotalPages, p + 1))}
                                                            disabled={responsesPage === responsesTotalPages}
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-beige-300 dark:border-gray-600"
                                                        >
                                                            Next
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Question Analysis Tab */}
                        {activeTab === 'questions' && (
                            <div className="space-y-6">
                                {/* Question Summary Stats */}
                                {analytics.question_analytics.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
                                            <CardContent className="p-5 text-center">
                                                <ListChecks className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                                <div className="text-3xl font-bold text-blue-800 dark:text-blue-200">{analytics.question_analytics.length}</div>
                                                <p className="text-sm text-blue-600 dark:text-blue-400">Total Questions</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg bg-gradient-to-br from-green-50 to-white dark:from-gray-800 dark:to-gray-900">
                                            <CardContent className="p-5 text-center">
                                                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                                <div className="text-3xl font-bold text-green-800 dark:text-green-200">
                                                    {analytics.question_analytics.filter(q => q.response_distribution.length > 0).length}
                                                </div>
                                                <p className="text-sm text-green-600 dark:text-green-400">With Distribution Data</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="border-beige-200 dark:border-gray-700 shadow-lg bg-gradient-to-br from-orange-50 to-white dark:from-gray-800 dark:to-gray-900">
                                            <CardContent className="p-5 text-center">
                                                <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                                                <div className="text-3xl font-bold text-orange-800 dark:text-orange-200">
                                                    {(analytics.question_analytics.reduce((sum, q) => sum + (q.skip_rate ?? 0), 0) / Math.max(analytics.question_analytics.length, 1)).toFixed(1)}%
                                                </div>
                                                <p className="text-sm text-orange-600 dark:text-orange-400">Avg Skip Rate</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="text-xl text-maroon-800 dark:text-gray-200">Question Performance</CardTitle>
                                        <CardDescription>Response rates, answer distributions, and statistics by question</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {analytics.question_analytics.length === 0 ? (
                                            <div className="text-center py-12">
                                                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                                <p className="text-gray-600 dark:text-gray-400">No question analytics available</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                {analytics.question_analytics.map((question, index) => (
                                                    <div
                                                        key={index}
                                                        className="bg-white dark:bg-gray-800 border border-beige-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition-shadow"
                                                    >
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="flex items-start gap-3">
                                                                <span className="bg-maroon-700 text-white text-sm font-bold px-3 py-1 rounded-lg shrink-0">
                                                                    Q{index + 1}
                                                                </span>
                                                                <h4 className="font-medium text-gray-800 dark:text-gray-200 text-lg">{question.question_text}</h4>
                                                            </div>
                                                            <Badge className={getQuestionTypeBadge(question.question_type)}>
                                                                {question.question_type}
                                                            </Badge>
                                                        </div>

                                                        {/* Stats Row */}
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                                                            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-center">
                                                                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{question.total_responses ?? 0}</div>
                                                                <p className="text-xs text-blue-700 dark:text-blue-300">Responses</p>
                                                            </div>
                                                            <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3 text-center">
                                                                <div className="text-xl font-bold text-orange-600 dark:text-orange-400">{(question.skip_rate ?? 0).toFixed(1)}%</div>
                                                                <p className="text-xs text-orange-700 dark:text-orange-300">Skip Rate</p>
                                                            </div>
                                                            <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 text-center hidden sm:block">
                                                                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{formatTime(question.avg_response_time)}</div>
                                                                <p className="text-xs text-purple-700 dark:text-purple-300">Avg Time</p>
                                                            </div>
                                                        </div>

                                                        {/* Response Distribution Chart */}
                                                        {question.response_distribution && question.response_distribution.length > 0 && (
                                                            <div className="border-t border-beige-200 dark:border-gray-700 pt-4">
                                                                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                                                    <BarChart3 className="h-4 w-4" />
                                                                    Answer Distribution
                                                                    <span className="text-xs font-normal text-gray-400">
                                                                        ({question.response_distribution.reduce((s, d) => s + d.count, 0)} total answers)
                                                                    </span>
                                                                </h5>
                                                                <div className="space-y-2">
                                                                    {question.response_distribution.map((dist, dIdx) => {
                                                                        const barColors = [
                                                                            'bg-maroon-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500',
                                                                            'bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
                                                                            'bg-teal-500', 'bg-orange-500'
                                                                        ];
                                                                        const barColor = barColors[dIdx % barColors.length];
                                                                        return (
                                                                            <div key={dIdx} className="flex items-center gap-3 group">
                                                                                <span className="text-sm text-gray-700 dark:text-gray-300 w-40 truncate shrink-0" title={dist.option}>
                                                                                    {dist.option}
                                                                                </span>
                                                                                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-6 overflow-hidden relative">
                                                                                    <div
                                                                                        className={`${barColor} h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                                                                                        style={{ width: `${Math.max(dist.percentage, 3)}%` }}
                                                                                    >
                                                                                        {dist.percentage > 15 && (
                                                                                            <span className="text-[10px] font-bold text-white">{dist.percentage}%</span>
                                                                                        )}
                                                                                    </div>
                                                                                    {dist.percentage <= 15 && (
                                                                                        <span className="absolute left-auto text-[10px] font-bold text-gray-600 dark:text-gray-400 ml-2" style={{ left: `${Math.max(dist.percentage, 3)}%` }}>
                                                                                            {dist.percentage}%
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 w-8 text-right shrink-0">{dist.count}</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                                {['text', 'textarea'].includes(question.question_type) && (
                                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 italic">
                                                                        Showing top {question.response_distribution.length} most common answers
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                )}

                {analyticsLoading && !analytics && (
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardContent className="p-8">
                            <div className="flex items-center justify-center">
                                <RefreshCw className="h-8 w-8 text-maroon-600 dark:text-maroon-400 animate-spin mr-3" />
                                <span className="text-maroon-800 dark:text-gray-200 font-medium">Loading analytics...</span>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminBaseLayout>
    );
}
