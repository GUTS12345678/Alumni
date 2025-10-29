import React, { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    History,
    CheckCircle,
    Clock,
    Calendar,
    FileText,
    Eye,
    Download,
    Filter,
    BarChart3,
    XCircle,
    Printer
} from 'lucide-react';

interface SurveyAnswer {
    id: number;
    survey_question_id: number;
    question: {
        id: number;
        question_text: string;
        question_type: string;
        is_required: boolean;
        order: number;
    };
    answer_text: string | null;
    answer_value: number | null;
}

interface SurveyResponse {
    id: number;
    response_token: string;
    respondent_email: string;
    status: 'draft' | 'completed';
    started_at: string;
    completed_at: string | null;
    time_taken_minutes: number | null;
    survey: {
        id: number;
        title: string;
        description: string;
        type: string;
        is_anonymous: boolean;
    };
    answers: SurveyAnswer[];
    total_questions: number;
    answered_questions: number;
    completion_percentage: number;
}

interface ResponseStats {
    total: number;
    completed: number;
    draft: number;
}

export default function SurveyHistory() {
    const [responses, setResponses] = useState<SurveyResponse[]>([]);
    const [stats, setStats] = useState<ResponseStats>({ total: 0, completed: 0, draft: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'draft'>('all');
    const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    useEffect(() => {
        fetchResponses();
    }, []);

    const fetchResponses = async () => {
        try {
            // Get CSRF cookie first
            await fetch('/sanctum/csrf-cookie', {
                credentials: 'include',
            });

            const response = await fetch('/api/v1/my-responses', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch survey responses');
            }

            const data = await response.json();
            if (data.success) {
                setResponses(data.data.responses);
                setStats(data.data.stats);
            }
        } catch (err) {
            console.error('Survey responses fetch error:', err);
            setError('Failed to load survey history');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        if (status === 'completed') {
            return (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                </Badge>
            );
        }
        return (
            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                <Clock className="h-3 w-3 mr-1" />
                Draft
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

    const formatDuration = (minutes: number | null) => {
        if (!minutes) return 'N/A';
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const getFilteredResponses = () => {
        if (filterStatus === 'all') return responses;
        return responses.filter(r => r.status === filterStatus);
    };

    const handleViewDetails = (response: SurveyResponse) => {
        setSelectedResponse(response);
        setShowDetailsModal(true);
    };

    const handleDownloadPDF = async (response: SurveyResponse) => {
        try {
            // Get CSRF cookie first
            await fetch('/sanctum/csrf-cookie', {
                credentials: 'include',
            });

            const apiResponse = await fetch(`/api/v1/survey-response/${response.response_token}/download`, {
                headers: {
                    'Accept': 'text/html',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });

            if (!apiResponse.ok) {
                const error = await apiResponse.json();
                throw new Error(error.message || 'Failed to download response');
            }

            // Get the HTML content
            const htmlContent = await apiResponse.text();

            // Create a blob and download it
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${response.survey.title.replace(/[^a-z0-9]/gi, '_')}_Response_${new Date().toISOString().split('T')[0]}.html`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (err) {
            console.error('Download error:', err);
            setError(err instanceof Error ? err.message : 'Failed to download response. Please try again.');
            setTimeout(() => setError(null), 5000);
        }
    };

    const handlePrintResponse = () => {
        if (!selectedResponse) return;
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            setError('Please allow popups to print');
            return;
        }

        // Generate print-friendly HTML
        const printHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${selectedResponse.survey.title} - Survey Response</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: 'Segoe UI', Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        padding: 30px;
                        max-width: 900px;
                        margin: 0 auto;
                    }
                    .header {
                        background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
                        color: white;
                        padding: 30px;
                        margin-bottom: 30px;
                        border-radius: 8px;
                    }
                    .header h1 { font-size: 28px; margin-bottom: 10px; }
                    .header p { font-size: 14px; opacity: 0.9; margin: 5px 0; }
                    .info-section {
                        background-color: #fef3c7;
                        padding: 20px;
                        margin-bottom: 30px;
                        border-radius: 8px;
                        border-left: 4px solid #7f1d1d;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                        border-bottom: 1px solid #e5e7eb;
                    }
                    .info-row:last-child { border-bottom: none; }
                    .info-label { font-weight: 600; color: #7f1d1d; }
                    .info-value { color: #374151; }
                    .question-container {
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #e5e7eb;
                    }
                    .question-container:last-child { border-bottom: none; }
                    .question-number {
                        display: inline-block;
                        background: #7f1d1d;
                        color: white;
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        text-align: center;
                        line-height: 30px;
                        font-weight: bold;
                        margin-right: 10px;
                    }
                    .question-text {
                        font-size: 16px;
                        font-weight: 600;
                        color: #1f2937;
                        margin-bottom: 12px;
                    }
                    .required-mark { color: #dc2626; }
                    .answer-box {
                        background-color: #f9fafb;
                        padding: 15px;
                        border-radius: 6px;
                        border-left: 3px solid #7f1d1d;
                        margin-left: 40px;
                    }
                    .answer-text { color: #374151; white-space: pre-wrap; }
                    .no-answer {
                        color: #9ca3af;
                        font-style: italic;
                        margin-left: 40px;
                    }
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 2px solid #e5e7eb;
                        text-align: center;
                        color: #6b7280;
                        font-size: 12px;
                    }
                    @media print {
                        body { padding: 20px; }
                        .header { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                        .info-section { print-color-adjust: exact; -webkit-print-color-adjust: exact; page-break-inside: avoid; }
                        .question-container { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${selectedResponse.survey.title}</h1>
                    <p>${selectedResponse.survey.description || ''}</p>
                    <p style="margin-top: 10px; font-size: 12px;">Response Token: ${selectedResponse.response_token}</p>
                </div>

                <div class="info-section">
                    <div class="info-row">
                        <span class="info-label">Survey Type:</span>
                        <span class="info-value">${selectedResponse.survey.type.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Status:</span>
                        <span class="info-value">${selectedResponse.status.toUpperCase()}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Started:</span>
                        <span class="info-value">${new Date(selectedResponse.started_at).toLocaleString()}</span>
                    </div>
                    ${selectedResponse.completed_at ? `
                    <div class="info-row">
                        <span class="info-label">Completed:</span>
                        <span class="info-value">${new Date(selectedResponse.completed_at).toLocaleString()}</span>
                    </div>` : ''}
                    <div class="info-row">
                        <span class="info-label">Questions Answered:</span>
                        <span class="info-value">${selectedResponse.answered_questions} / ${selectedResponse.total_questions}</span>
                    </div>
                </div>

                ${selectedResponse.answers.length === 0 ? 
                    '<p style="text-align: center; color: #9ca3af; padding: 40px;">No answers recorded yet.</p>' :
                    selectedResponse.answers.map((answer, index) => `
                        <div class="question-container">
                            <div class="question-text">
                                <span class="question-number">${index + 1}</span>
                                ${answer.question.question_text}
                                ${answer.question.is_required ? '<span class="required-mark">*</span>' : ''}
                            </div>
                            ${answer.answer_text ? `
                                <div class="answer-box">
                                    <div class="answer-text">${answer.answer_text}</div>
                                </div>
                            ` : answer.answer_value !== null ? `
                                <div class="answer-box">
                                    <div class="answer-text"><strong>Rating:</strong> ${answer.answer_value}/5</div>
                                </div>
                            ` : '<div class="no-answer">No answer provided</div>'}
                        </div>
                    `).join('')
                }

                <div class="footer">
                    <p>Generated on ${new Date().toLocaleString()}</p>
                    <p>Alumni Tracer System - Survey Response Report</p>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(printHTML);
        printWindow.document.close();
    };

    const filteredResponses = getFilteredResponses();

    if (loading) {
        return (
            <AlumniBaseLayout title="Survey History">
                <div className="flex items-center justify-center py-12">
                    <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 border-4 border-maroon-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-maroon-800 font-medium">Loading survey history...</span>
                    </div>
                </div>
            </AlumniBaseLayout>
        );
    }

    return (
        <AlumniBaseLayout title="Survey History">
            <Head title="Survey History" />
            
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-maroon-800">Survey History</h1>
                <p className="text-maroon-600 mt-2">View your completed surveys and responses</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="border-beige-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Responses</p>
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
                                <p className="text-sm text-gray-600">Completed</p>
                                <p className="text-2xl font-bold text-green-800">{stats.completed}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-beige-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Drafts</p>
                                <p className="text-2xl font-bold text-orange-800">{stats.draft}</p>
                            </div>
                            <Clock className="h-8 w-8 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center space-x-2 mb-6">
                <Filter className="h-5 w-5 text-maroon-600" />
                <Button
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilterStatus('all')}
                    className={filterStatus === 'all' ? 'bg-maroon-700 hover:bg-maroon-800' : 'border-maroon-300 text-maroon-700'}
                >
                    All ({stats.total})
                </Button>
                <Button
                    variant={filterStatus === 'completed' ? 'default' : 'outline'}
                    onClick={() => setFilterStatus('completed')}
                    className={filterStatus === 'completed' ? 'bg-maroon-700 hover:bg-maroon-800' : 'border-maroon-300 text-maroon-700'}
                >
                    Completed ({stats.completed})
                </Button>
                <Button
                    variant={filterStatus === 'draft' ? 'default' : 'outline'}
                    onClick={() => setFilterStatus('draft')}
                    className={filterStatus === 'draft' ? 'bg-maroon-700 hover:bg-maroon-800' : 'border-maroon-300 text-maroon-700'}
                >
                    Drafts ({stats.draft})
                </Button>
            </div>

            {/* Error Message */}
            {error && (
                <Card className="border-red-200 mb-6">
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-2 text-red-600">
                            <XCircle className="h-5 w-5" />
                            <p>{error}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Responses List */}
            {filteredResponses.length === 0 ? (
                <Card className="border-beige-200 shadow-lg">
                    <CardContent className="py-12">
                        <div className="text-center">
                            <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                {filterStatus === 'all' ? 'No Survey History Yet' : `No ${filterStatus} surveys found`}
                            </h3>
                            <p className="text-gray-500">
                                {filterStatus === 'all' 
                                    ? 'Your completed surveys will appear here.'
                                    : `You have no ${filterStatus} survey responses.`}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredResponses.map((response) => (
                        <Card key={response.id} className="border-beige-200 shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <CardTitle className="text-xl text-maroon-800">
                                                {response.survey.title}
                                            </CardTitle>
                                            {getSurveyTypeBadge(response.survey.type)}
                                            {response.survey.is_anonymous && (
                                                <Badge variant="outline" className="bg-gray-100 text-gray-700">
                                                    Anonymous
                                                </Badge>
                                            )}
                                        </div>
                                        <CardDescription className="text-gray-600">
                                            {response.survey.description}
                                        </CardDescription>
                                    </div>
                                    <div>
                                        {getStatusBadge(response.status)}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Response Info */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div className="flex items-center space-x-2">
                                            <FileText className="h-4 w-4 text-maroon-600" />
                                            <span className="text-gray-600">
                                                {response.answered_questions}/{response.total_questions} answered
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Clock className="h-4 w-4 text-maroon-600" />
                                            <span className="text-gray-600">
                                                {formatDuration(response.time_taken_minutes)}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Calendar className="h-4 w-4 text-maroon-600" />
                                            <span className="text-gray-600">
                                                Started: {new Date(response.started_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {response.completed_at && (
                                            <div className="flex items-center space-x-2">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                <span className="text-gray-600">
                                                    Completed: {new Date(response.completed_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Completion Progress for Drafts */}
                                    {response.status === 'draft' && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Completion</span>
                                                <span className="font-medium text-maroon-700">
                                                    {response.completion_percentage}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-orange-500 h-2 rounded-full"
                                                    style={{ width: `${response.completion_percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex items-center space-x-2 pt-2">
                                        <Button
                                            onClick={() => handleViewDetails(response)}
                                            variant="default"
                                            className="bg-maroon-700 hover:bg-maroon-800 text-white"
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Details
                                        </Button>

                                        {response.status === 'completed' && (
                                            <Button
                                                onClick={() => handleDownloadPDF(response)}
                                                variant="outline"
                                                className="border-maroon-300 text-maroon-700"
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                Download PDF
                                            </Button>
                                        )}

                                        {response.status === 'draft' && (
                                            <Button
                                                onClick={() => router.visit(`/alumni/surveys/${response.survey.id}/take?response_token=${response.response_token}`)}
                                                variant="outline"
                                                className="border-blue-300 text-blue-700"
                                            >
                                                <FileText className="h-4 w-4 mr-2" />
                                                Continue
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedResponse && (
                <div 
                    className="fixed inset-0 bg-gray-900/20 backdrop-blur-[2px] flex items-center justify-center p-4 z-50"
                    onClick={() => setShowDetailsModal(false)}
                >
                    <Card 
                        className="max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-gray-300 bg-white"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <CardHeader className="border-b border-beige-200">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-2xl text-maroon-800">
                                        {selectedResponse.survey.title}
                                    </CardTitle>
                                    <CardDescription className="mt-2">
                                        Response Token: {selectedResponse.response_token}
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowDetailsModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <XCircle className="h-6 w-6" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-6">
                                {selectedResponse.answers.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No answers recorded yet.</p>
                                ) : (
                                    selectedResponse.answers.map((answer, index) => (
                                        <div key={answer.id} className="border-b border-gray-200 pb-4 last:border-0">
                                            <p className="font-medium text-gray-800 mb-2">
                                                {index + 1}. {answer.question.question_text}
                                                {answer.question.is_required && (
                                                    <span className="text-red-500 ml-1">*</span>
                                                )}
                                            </p>
                                            <div className="pl-4">
                                                {answer.answer_text && (
                                                    <p className="text-gray-700 bg-beige-50 p-3 rounded">
                                                        {answer.answer_text}
                                                    </p>
                                                )}
                                                {answer.answer_value !== null && (
                                                    <p className="text-gray-700 font-semibold">
                                                        Rating: {answer.answer_value}/5
                                                    </p>
                                                )}
                                                {!answer.answer_text && answer.answer_value === null && (
                                                    <p className="text-gray-400 italic">No answer provided</p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Modal Action Buttons */}
                            <div className="flex items-center justify-end space-x-2 pt-6 mt-6 border-t border-beige-200">
                                <Button
                                    onClick={handlePrintResponse}
                                    variant="outline"
                                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                >
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print
                                </Button>
                                {selectedResponse.status === 'completed' && (
                                    <Button
                                        onClick={() => handleDownloadPDF(selectedResponse)}
                                        variant="outline"
                                        className="border-green-300 text-green-700 hover:bg-green-50"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download HTML
                                    </Button>
                                )}
                                <Button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="bg-maroon-700 hover:bg-maroon-800"
                                >
                                    Close
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </AlumniBaseLayout>
    );
}
