import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
    AlertTriangle
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
    avg_completion_time: number;
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
    response_distribution: Record<string, unknown>;
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

export default function SurveyAnalytics() {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [selectedSurvey, setSelectedSurvey] = useState<string>('');
    const [analytics, setAnalytics] = useState<SurveyAnalytics | null>(null);
    const [stats, setStats] = useState<AnalyticsStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState('30'); // days
    const [error, setError] = useState<string | null>(null);

    // Helper function to get CSRF token
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
                // Extract array from paginated response
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

    useEffect(() => {
        fetchSurveys();
    }, []);

    useEffect(() => {
        if (selectedSurvey) {
            fetchSurveyAnalytics(selectedSurvey);
        }
    }, [selectedSurvey, fetchSurveyAnalytics]);

    // Auto-refresh effect
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (autoRefresh) {
            interval = setInterval(() => {
                if (selectedSurvey) {
                    fetchSurveyAnalytics(selectedSurvey);
                } else {
                    fetchSurveys();
                }
            }, 30000); // Refresh every 30 seconds
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [autoRefresh, selectedSurvey, fetchSurveyAnalytics]);

    const exportAnalytics = async () => {
        if (!selectedSurvey) return;

        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const response = await fetch(`/api/v1/admin/analytics/surveys/${selectedSurvey}/export`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
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
                a.download = `survey_analytics_${selectedSurvey}_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Export error:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            'draft': { color: 'bg-gray-100 text-gray-800', icon: Clock },
            'active': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
            'closed': { color: 'bg-blue-100 text-blue-800', icon: Target },
            'archived': { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (minutes: number) => {
        if (minutes < 60) {
            return `${Math.round(minutes)}m`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return `${hours}h ${mins}m`;
    };

    const filteredSurveys = (Array.isArray(surveys) ? surveys : []).filter(survey => {
        // Filter by status (show active and closed surveys only)
        const statusMatch = survey.status === 'active' || survey.status === 'closed';
        // Filter by search term
        const searchMatch = !searchTerm || 
            survey.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            survey.description?.toLowerCase().includes(searchTerm.toLowerCase());
        return statusMatch && searchMatch;
    });

    if (loading) {
        return (
            <AdminBaseLayout title="Survey Analytics">
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="h-8 w-8 text-maroon-600 animate-spin" />
                        <span className="text-maroon-800 font-medium">Loading analytics...</span>
                    </div>
                </div>
            </AdminBaseLayout>
        );
    }

    if (error) {
        return (
            <AdminBaseLayout title="Survey Analytics">
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
        <AdminBaseLayout title="Survey Analytics">
            <div className="space-y-6">
                {/* Header with Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-maroon-800">Survey Analytics</h2>
                        <p className="text-maroon-600">Detailed insights and response analytics</p>
                        <p className="text-xs text-gray-500 mt-1">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                            {autoRefresh && <span className="ml-2 text-green-600">● Live</span>}
                        </p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2 mr-2">
                            <input
                                type="checkbox"
                                id="auto-refresh"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="rounded border-maroon-300 text-maroon-600 focus:ring-maroon-200"
                            />
                            <label htmlFor="auto-refresh" className="text-sm text-maroon-700">
                                Auto-refresh (30s)
                            </label>
                        </div>

                        {selectedSurvey && (
                            <Button
                                onClick={exportAnalytics}
                                variant="outline"
                                size="sm"
                                className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export Report
                            </Button>
                        )}

                        <Button
                            onClick={() => selectedSurvey ? fetchSurveyAnalytics(selectedSurvey) : fetchSurveys()}
                            variant="outline"
                            size="sm"
                            className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                            disabled={loading || analyticsLoading}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${(loading || analyticsLoading) ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Overview Statistics */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800">Total Surveys</CardTitle>
                                <FileText className="h-4 w-4 text-maroon-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-maroon-800">{stats.total_surveys}</div>
                                <p className="text-xs text-maroon-600 mt-1">{stats.active_surveys} currently active</p>
                            </CardContent>
                        </Card>

                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800">Total Responses</CardTitle>
                                <Users className="h-4 w-4 text-maroon-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">{stats.total_responses.toLocaleString()}</div>
                                <p className="text-xs text-maroon-600 mt-1">Across all surveys</p>
                            </CardContent>
                        </Card>

                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800">Avg Completion Rate</CardTitle>
                                <Target className="h-4 w-4 text-maroon-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{stats.avg_completion_rate.toFixed(1)}%</div>
                                <p className="text-xs text-maroon-600 mt-1">Overall completion rate</p>
                            </CardContent>
                        </Card>

                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-maroon-800">Most Popular</CardTitle>
                                <TrendingUp className="h-4 w-4 text-maroon-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-purple-600 truncate">{stats.most_popular_survey}</div>
                                <p className="text-xs text-maroon-600 mt-1">Highest response rate</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Survey Selection */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800">Select Survey for Analysis</CardTitle>
                        <CardDescription className="text-maroon-600">
                            Choose a survey to view detailed analytics
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search surveys..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 border-beige-300 focus:border-maroon-400 focus:ring-maroon-200"
                                />
                            </div>

                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="px-3 py-2 border border-beige-300 rounded-md focus:border-maroon-400 focus:ring-maroon-200"
                            >
                                <option value="7">Last 7 days</option>
                                <option value="30">Last 30 days</option>
                                <option value="90">Last 90 days</option>
                                <option value="365">Last year</option>
                                <option value="all">All time</option>
                            </select>
                        </div>

                        {filteredSurveys.length === 0 ? (
                            <div className="text-center py-8">
                                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No surveys found</h3>
                                <p className="text-gray-500">
                                    {searchTerm ? 'Try adjusting your search' : 'Create surveys to see analytics'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredSurveys.map((survey) => (
                                    <Card
                                        key={survey.id}
                                        className={`cursor-pointer transition-all hover:shadow-md border-2 ${selectedSurvey === survey.id
                                            ? 'border-maroon-400 bg-maroon-50'
                                            : 'border-beige-200 hover:border-maroon-200'
                                            }`}
                                        onClick={() => setSelectedSurvey(survey.id)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="font-medium text-maroon-800 truncate">{survey.title}</h3>
                                                {getStatusBadge(survey.status)}
                                            </div>

                                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{survey.description}</p>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">Responses:</span>
                                                    <span className="font-medium text-blue-600">{survey.responses_count}</span>
                                                </div>

                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">Completion Rate:</span>
                                                    <span className="font-medium text-green-600">{survey.completion_rate}%</span>
                                                </div>

                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">Avg Time:</span>
                                                    <span className="font-medium text-purple-600">{formatTime(survey.avg_completion_time)}</span>
                                                </div>

                                                <div className="text-xs text-gray-500 mt-2">
                                                    Created {formatDate(survey.created_at)}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Analytics Dashboard */}
                {selectedSurvey && analytics && (
                    <div className="space-y-6">
                        {/* Survey Overview */}
                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-xl text-maroon-800">{analytics.survey.title} - Analytics</CardTitle>
                                <CardDescription className="text-maroon-600">
                                    Detailed insights for the selected survey
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                                        <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                        <div className="text-2xl font-bold text-blue-800">{analytics.total_responses}</div>
                                        <p className="text-sm text-blue-600">Total Responses</p>
                                    </div>

                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                        <div className="text-2xl font-bold text-green-800">{analytics.completion_rate}%</div>
                                        <p className="text-sm text-green-600">Completion Rate</p>
                                    </div>

                                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                                        <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                                        <div className="text-2xl font-bold text-purple-800">{formatTime(analytics.avg_completion_time)}</div>
                                        <p className="text-sm text-purple-600">Avg Completion Time</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Response Trends */}
                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-xl text-maroon-800 flex items-center">
                                    <TrendingUp className="h-5 w-5 mr-2" />
                                    Response Trends
                                </CardTitle>
                                <CardDescription className="text-maroon-600">
                                    Daily response activity over time
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4 flex justify-end">
                                    <div className="flex items-center space-x-2">
                                        <label className="text-sm text-gray-600">Chart Type:</label>
                                        <select
                                            className="text-sm border border-beige-300 rounded px-2 py-1"
                                            value={analytics.response_rate_by_date.length > 10 ? 'area' : 'line'}
                                            onChange={() => {
                                                // Could add state to control chart type
                                            }}
                                        >
                                            <option value="line">Line Chart</option>
                                            <option value="area">Area Chart</option>
                                        </select>
                                    </div>
                                </div>

                                <ResponseTrendsChart
                                    data={analytics.response_rate_by_date}
                                    height={350}
                                    showArea={analytics.response_rate_by_date.length > 10}
                                />

                                {analytics.response_rate_by_date.length > 0 && (
                                    <div className="mt-4 p-3 bg-beige-50 rounded-lg">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            <div className="text-center">
                                                <div className="font-medium text-maroon-700">Peak Day</div>
                                                <div className="text-gray-600">
                                                    {analytics.response_rate_by_date.reduce((max, curr) =>
                                                        curr.responses > max.responses ? curr : max
                                                    ).date}
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <div className="font-medium text-maroon-700">Total Days</div>
                                                <div className="text-gray-600">
                                                    {analytics.response_rate_by_date.length} days
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <div className="font-medium text-maroon-700">Avg per Day</div>
                                                <div className="text-gray-600">
                                                    {Math.round(analytics.response_rate_by_date.reduce((sum, curr) => sum + curr.responses, 0) / analytics.response_rate_by_date.length)} responses
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Employment Status Distribution */}
                        {analytics.employment_status_distribution.length > 0 && (
                            <Card className="border-beige-200 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-xl text-maroon-800 flex items-center">
                                        <PieChart className="h-5 w-5 mr-2" />
                                        Employment Status Distribution
                                    </CardTitle>
                                    <CardDescription className="text-maroon-600">
                                        Breakdown of employment status from survey responses
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="mb-4">
                                        <EmploymentDistributionChart
                                            data={analytics.employment_status_distribution}
                                            height={400}
                                            chartType="pie"
                                        />
                                    </div>

                                    {/* Summary stats below the chart */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-beige-200">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-maroon-800">
                                                {analytics.employment_status_distribution.length}
                                            </div>
                                            <div className="text-sm text-gray-600">Categories</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {analytics.employment_status_distribution.reduce((sum, item) => sum + item.count, 0)}
                                            </div>
                                            <div className="text-sm text-gray-600">Total Responses</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">
                                                {analytics.employment_status_distribution.length > 0
                                                    ? analytics.employment_status_distribution.reduce((max, item) => item.count > max.count ? item : max).status.slice(0, 12)
                                                    : 'N/A'
                                                }
                                            </div>
                                            <div className="text-sm text-gray-600">Most Common</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Question Analytics */}
                        <Card className="border-beige-200 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-xl text-maroon-800">Question Performance</CardTitle>
                                <CardDescription className="text-maroon-600">
                                    Response rates and completion times by question
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {analytics.question_analytics.length === 0 ? (
                                    <div className="text-center py-8">
                                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">No question analytics available</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {analytics.question_analytics.map((question, index) => (
                                            <div key={index} className="border border-beige-200 rounded-lg p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="font-medium text-maroon-800 flex-1">{question.question_text}</h4>
                                                    <Badge className="bg-blue-100 text-blue-800 ml-2">
                                                        {question.question_type}
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                                    <div className="text-center">
                                                        <div className="text-lg font-bold text-green-600">{question.total_responses}</div>
                                                        <p className="text-xs text-gray-600">Responses</p>
                                                    </div>

                                                    <div className="text-center">
                                                        <div className="text-lg font-bold text-red-600">{question.skip_rate.toFixed(1)}%</div>
                                                        <p className="text-xs text-gray-600">Skip Rate</p>
                                                    </div>

                                                    <div className="text-center">
                                                        <div className="text-lg font-bold text-purple-600">{formatTime(question.avg_response_time)}</div>
                                                        <p className="text-xs text-gray-600">Avg Time</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {analyticsLoading && (
                    <Card className="border-beige-200 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-center">
                                <RefreshCw className="h-8 w-8 text-maroon-600 animate-spin mr-2" />
                                <span className="text-maroon-800 font-medium">Loading analytics...</span>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminBaseLayout>
    );
}