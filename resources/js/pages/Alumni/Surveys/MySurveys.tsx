import React, { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    FileText,
    Clock,
    CheckCircle,
    AlertCircle,
    PlayCircle,
    RotateCcw,
    Calendar,
    BarChart3
} from 'lucide-react';

interface Survey {
    id: number;
    title: string;
    description: string;
    type: string;
    is_anonymous: boolean;
    is_registration_survey: boolean;
    start_date: string;
    end_date: string;
    estimated_time: number;
    total_questions: number;
    status: 'not_started' | 'in_progress' | 'completed' | 'draft';
    response_token: string | null;
    completed_at: string | null;
    progress: number;
    can_retake: boolean;
}

interface SurveyStats {
    total: number;
    not_started: number;
    in_progress: number;
    completed: number;
}

export default function MySurveys() {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [stats, setStats] = useState<SurveyStats>({ total: 0, not_started: 0, in_progress: 0, completed: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'available' | 'in_progress' | 'completed'>('all');

    useEffect(() => {
        fetchSurveys();
    }, []);

    const fetchSurveys = async () => {
        try {
            // Get CSRF cookie first
            await fetch('/sanctum/csrf-cookie', {
                credentials: 'include',
            });

            const response = await fetch('/api/v1/my-surveys', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch surveys');
            }

            const data = await response.json();
            if (data.success) {
                setSurveys(data.data.surveys);
                setStats(data.data.stats);
            }
        } catch (err) {
            console.error('Surveys fetch error:', err);
            setError('Failed to load surveys');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusMap = {
            not_started: { label: 'Not Started', className: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertCircle },
            in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
            completed: { label: 'Completed', className: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
            draft: { label: 'Draft', className: 'bg-orange-100 text-orange-800 border-orange-200', icon: FileText },
        };

        const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.not_started;
        const Icon = statusInfo.icon;

        return (
            <Badge className={statusInfo.className}>
                <Icon className="h-3 w-3 mr-1" />
                {statusInfo.label}
            </Badge>
        );
    };

    const getSurveyTypeBadge = (type: string) => {
        const typeMap: Record<string, { label: string; className: string }> = {
            registration: { label: 'Registration', className: 'bg-purple-100 text-purple-800' },
            feedback: { label: 'Feedback', className: 'bg-indigo-100 text-indigo-800' },
            employment: { label: 'Employment', className: 'bg-teal-100 text-teal-800' },
            follow_up: { label: 'Follow-up', className: 'bg-cyan-100 text-cyan-800' },
        };

        const typeInfo = typeMap[type] || { label: type, className: 'bg-gray-100 text-gray-800' };
        return <Badge variant="outline" className={typeInfo.className}>{typeInfo.label}</Badge>;
    };

    const handleStartSurvey = (survey: Survey) => {
        // Navigate to survey taking page
        router.visit(`/alumni/surveys/${survey.id}/take`);
    };

    const handleContinueSurvey = (survey: Survey) => {
        // Continue with existing response token
        router.visit(`/alumni/surveys/${survey.id}/take?response_token=${survey.response_token}`);
    };

    const handleRetakeSurvey = (survey: Survey) => {
        // Start new response for retake
        router.visit(`/alumni/surveys/${survey.id}/take?retake=true`);
    };

    const getFilteredSurveys = () => {
        switch (activeTab) {
            case 'available':
                return surveys.filter(s => s.status === 'not_started');
            case 'in_progress':
                return surveys.filter(s => s.status === 'in_progress' || s.status === 'draft');
            case 'completed':
                return surveys.filter(s => s.status === 'completed');
            default:
                return surveys;
        }
    };

    const filteredSurveys = getFilteredSurveys();

    if (loading) {
        return (
            <AlumniBaseLayout title="My Surveys">
                <div className="flex items-center justify-center py-12">
                    <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 border-4 border-maroon-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-maroon-800 font-medium">Loading surveys...</span>
                    </div>
                </div>
            </AlumniBaseLayout>
        );
    }

    return (
        <AlumniBaseLayout title="My Surveys">
            <Head title="My Surveys" />
            
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-maroon-800">My Surveys</h1>
                <p className="text-maroon-600 mt-2">View and complete available surveys</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-beige-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Surveys</p>
                                <p className="text-2xl font-bold text-maroon-800">{stats.total}</p>
                            </div>
                            <BarChart3 className="h-8 w-8 text-maroon-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-beige-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Not Started</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.not_started}</p>
                            </div>
                            <AlertCircle className="h-8 w-8 text-gray-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-beige-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">In Progress</p>
                                <p className="text-2xl font-bold text-blue-800">{stats.in_progress}</p>
                            </div>
                            <Clock className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-beige-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Completed</p>
                                <p className="text-2xl font-bold text-green-800">{stats.completed}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-2 mb-6">
                <Button
                    variant={activeTab === 'all' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('all')}
                    className={activeTab === 'all' ? 'bg-maroon-700 hover:bg-maroon-800' : 'border-maroon-300 text-maroon-700'}
                >
                    All ({stats.total})
                </Button>
                <Button
                    variant={activeTab === 'available' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('available')}
                    className={activeTab === 'available' ? 'bg-maroon-700 hover:bg-maroon-800' : 'border-maroon-300 text-maroon-700'}
                >
                    Available ({stats.not_started})
                </Button>
                <Button
                    variant={activeTab === 'in_progress' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('in_progress')}
                    className={activeTab === 'in_progress' ? 'bg-maroon-700 hover:bg-maroon-800' : 'border-maroon-300 text-maroon-700'}
                >
                    In Progress ({stats.in_progress})
                </Button>
                <Button
                    variant={activeTab === 'completed' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('completed')}
                    className={activeTab === 'completed' ? 'bg-maroon-700 hover:bg-maroon-800' : 'border-maroon-300 text-maroon-700'}
                >
                    Completed ({stats.completed})
                </Button>
            </div>

            {/* Surveys List */}
            {error && (
                <Card className="border-red-200 mb-6">
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-2 text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            <p>{error}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {filteredSurveys.length === 0 ? (
                <Card className="border-beige-200 shadow-lg">
                    <CardContent className="py-12">
                        <div className="text-center">
                            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                No surveys found
                            </h3>
                            <p className="text-gray-500">
                                {activeTab === 'all' 
                                    ? 'There are no surveys available at the moment.'
                                    : `You have no ${activeTab.replace('_', ' ')} surveys.`}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredSurveys.map((survey) => (
                        <Card key={survey.id} className="border-beige-200 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <CardTitle className="text-xl text-maroon-800">{survey.title}</CardTitle>
                                            {getSurveyTypeBadge(survey.type)}
                                            {survey.is_anonymous && (
                                                <Badge variant="outline" className="bg-gray-100 text-gray-700">
                                                    Anonymous
                                                </Badge>
                                            )}
                                        </div>
                                        <CardDescription className="text-gray-600">
                                            {survey.description}
                                        </CardDescription>
                                    </div>
                                    <div>
                                        {getStatusBadge(survey.status)}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Survey Info */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div className="flex items-center space-x-2">
                                            <FileText className="h-4 w-4 text-maroon-600" />
                                            <span className="text-gray-600">{survey.total_questions} questions</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Clock className="h-4 w-4 text-maroon-600" />
                                            <span className="text-gray-600">~{survey.estimated_time} min</span>
                                        </div>
                                        {survey.end_date && (
                                            <div className="flex items-center space-x-2">
                                                <Calendar className="h-4 w-4 text-maroon-600" />
                                                <span className="text-gray-600">
                                                    Due: {new Date(survey.end_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                        {survey.completed_at && (
                                            <div className="flex items-center space-x-2">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                <span className="text-gray-600">
                                                    Completed: {new Date(survey.completed_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Progress Bar for In Progress */}
                                    {(survey.status === 'in_progress' || survey.status === 'draft') && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Progress</span>
                                                <span className="font-medium text-maroon-700">{survey.progress}%</span>
                                            </div>
                                            <Progress value={survey.progress} className="h-2" />
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex items-center space-x-2 pt-2">
                                        {survey.status === 'not_started' && (
                                            <Button
                                                onClick={() => handleStartSurvey(survey)}
                                                className="bg-maroon-700 hover:bg-maroon-800 text-white"
                                            >
                                                <PlayCircle className="h-4 w-4 mr-2" />
                                                Start Survey
                                            </Button>
                                        )}

                                        {(survey.status === 'in_progress' || survey.status === 'draft') && (
                                            <Button
                                                onClick={() => handleContinueSurvey(survey)}
                                                className="bg-blue-700 hover:bg-blue-800 text-white"
                                            >
                                                <PlayCircle className="h-4 w-4 mr-2" />
                                                Continue Survey
                                            </Button>
                                        )}

                                        {survey.status === 'completed' && (
                                            <>
                                                <Button
                                                    onClick={() => router.visit('/alumni/surveys/history')}
                                                    variant="outline"
                                                    className="border-maroon-300 text-maroon-700"
                                                >
                                                    <FileText className="h-4 w-4 mr-2" />
                                                    View Responses
                                                </Button>
                                                {survey.can_retake && (
                                                    <Button
                                                        onClick={() => handleRetakeSurvey(survey)}
                                                        variant="outline"
                                                        className="border-blue-300 text-blue-700"
                                                    >
                                                        <RotateCcw className="h-4 w-4 mr-2" />
                                                        Retake
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </AlumniBaseLayout>
    );
}
