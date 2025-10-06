import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Edit,
    Trash2,
    Plus,
    ChevronUp,
    ChevronDown,
    Save,
    X,
    Type,
    FileText,
    List,
    Circle,
    CheckSquare,
    Hash,
    Mail,
    Phone,
    Calendar,
    Star
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface Question {
    id: string;
    question_text: string;
    description?: string;
    question_type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'email' | 'phone' | 'date' | 'rating';
    options?: string[];
    is_required: boolean;
    order: number;
    is_active: boolean;
}

interface Props {
    surveyId: string;
    onClose: () => void;
    onQuestionsUpdated: () => void;
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

export default function QuestionsManager({ surveyId, onClose, onQuestionsUpdated }: Props) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchQuestions = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');

            const response = await fetch(`/api/v1/admin/surveys/${surveyId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data.questions) {
                    setQuestions(result.data.questions);
                }
            } else {
                setError('Failed to load questions');
            }
        } catch (err) {
            console.error('Error fetching questions:', err);
            setError('Failed to load questions');
        } finally {
            setLoading(false);
        }
    }, [surveyId]);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    const handleEditQuestion = (question: Question) => {
        setEditingQuestion(question);
        setIsEditModalOpen(true);
    };

    const handleSaveQuestion = async (updatedQuestion: Question) => {
        try {
            const token = localStorage.getItem('auth_token');

            const response = await fetch(`/api/v1/admin/surveys/${surveyId}/questions/${updatedQuestion.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question_text: updatedQuestion.question_text,
                    description: updatedQuestion.description,
                    question_type: updatedQuestion.question_type,
                    options: updatedQuestion.options,
                    is_required: updatedQuestion.is_required,
                    order: updatedQuestion.order,
                }),
            });

            if (response.ok) {
                await fetchQuestions();
                onQuestionsUpdated();
                setIsEditModalOpen(false);
                setEditingQuestion(null);
            } else {
                alert('Failed to update question');
            }
        } catch (error) {
            console.error('Error updating question:', error);
            alert('Failed to update question');
        }
    };

    const handleDeleteQuestion = async (questionId: string) => {
        if (!confirm('Are you sure you want to delete this question?')) {
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');

            const response = await fetch(`/api/v1/admin/surveys/${surveyId}/questions/${questionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                await fetchQuestions();
                onQuestionsUpdated();
            } else {
                alert('Failed to delete question');
            }
        } catch (error) {
            console.error('Error deleting question:', error);
            alert('Failed to delete question');
        }
    };

    const moveQuestion = async (questionId: string, direction: 'up' | 'down') => {
        const currentIndex = questions.findIndex(q => q.id === questionId);
        if (
            (direction === 'up' && currentIndex === 0) ||
            (direction === 'down' && currentIndex === questions.length - 1)
        ) {
            return;
        }

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        const newQuestions = [...questions];
        [newQuestions[currentIndex], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[currentIndex]];

        // Update order values
        newQuestions.forEach((q, index) => {
            q.order = index + 1;
        });

        setQuestions(newQuestions);

        // Save the new order to backend
        try {
            const token = localStorage.getItem('auth_token');

            await fetch(`/api/v1/admin/surveys/${surveyId}/questions/reorder`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    questions: newQuestions.map(q => ({ id: q.id, order: q.order }))
                }),
            });
        } catch (error) {
            console.error('Error reordering questions:', error);
            // Revert on error
            await fetchQuestions();
        }
    };

    const getQuestionTypeInfo = (type: string) => {
        return questionTypes.find(t => t.value === type) || { value: type, label: type, icon: Type };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maroon-600 mx-auto mb-4"></div>
                    <p className="text-maroon-600">Loading questions...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={fetchQuestions} className="bg-maroon-700 hover:bg-maroon-800">
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-maroon-800">
                        {questions.length} Question{questions.length !== 1 ? 's' : ''}
                    </h3>
                    <p className="text-sm text-gray-600">
                        Click on a question to edit it, or use the arrows to reorder
                    </p>
                </div>
                <Button onClick={onClose} variant="outline">
                    <X className="h-4 w-4 mr-2" />
                    Close
                </Button>
            </div>

            {/* Questions List */}
            {questions.length === 0 ? (
                <Card className="border-beige-200">
                    <CardContent className="p-8 text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Yet</h3>
                        <p className="text-gray-600 mb-4">
                            This survey doesn't have any questions yet. You can add questions when creating or editing the survey.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-beige-200">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-maroon-800">Order</TableHead>
                                    <TableHead className="text-maroon-800">Question</TableHead>
                                    <TableHead className="text-maroon-800">Type</TableHead>
                                    <TableHead className="text-maroon-800">Required</TableHead>
                                    <TableHead className="text-maroon-800">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {questions.map((question, index) => {
                                    const typeInfo = getQuestionTypeInfo(question.question_type);
                                    const TypeIcon = typeInfo.icon;

                                    return (
                                        <TableRow key={question.id} className="hover:bg-beige-50">
                                            <TableCell className="font-medium">
                                                <div className="flex items-center space-x-1">
                                                    <span className="text-sm text-gray-600">#{question.order}</span>
                                                    <div className="flex flex-col">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => moveQuestion(question.id, 'up')}
                                                            disabled={index === 0}
                                                            className="h-4 w-4 p-0 hover:bg-gray-200"
                                                        >
                                                            <ChevronUp className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => moveQuestion(question.id, 'down')}
                                                            disabled={index === questions.length - 1}
                                                            className="h-4 w-4 p-0 hover:bg-gray-200"
                                                        >
                                                            <ChevronDown className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-gray-900 line-clamp-2">
                                                        {question.question_text}
                                                    </p>
                                                    {question.description && (
                                                        <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                                                            {question.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <TypeIcon className="h-4 w-4 text-maroon-600" />
                                                    <span className="text-sm">{typeInfo.label}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {question.is_required ? (
                                                    <Badge className="bg-red-100 text-red-800">Required</Badge>
                                                ) : (
                                                    <Badge className="bg-gray-100 text-gray-800">Optional</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditQuestion(question)}
                                                        className="hover:bg-blue-100 text-blue-700"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteQuestion(question.id)}
                                                        className="hover:bg-red-100 text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Edit Question Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Question</DialogTitle>
                    </DialogHeader>

                    {editingQuestion && (
                        <QuestionEditor
                            question={editingQuestion}
                            onSave={handleSaveQuestion}
                            onCancel={() => {
                                setIsEditModalOpen(false);
                                setEditingQuestion(null);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Question Editor Component
interface QuestionEditorProps {
    question: Question;
    onSave: (question: Question) => void;
    onCancel: () => void;
}

function QuestionEditor({ question, onSave, onCancel }: QuestionEditorProps) {
    const [editedQuestion, setEditedQuestion] = useState<Question>({ ...question });

    const updateQuestion = (updates: Partial<Question>) => {
        setEditedQuestion(prev => ({ ...prev, ...updates }));
    };

    const addOption = () => {
        const currentOptions = editedQuestion.options || [];
        updateQuestion({
            options: [...currentOptions, `Option ${currentOptions.length + 1}`]
        });
    };

    const updateOption = (index: number, value: string) => {
        const newOptions = [...(editedQuestion.options || [])];
        newOptions[index] = value;
        updateQuestion({ options: newOptions });
    };

    const removeOption = (index: number) => {
        const newOptions = editedQuestion.options?.filter((_, i) => i !== index);
        updateQuestion({ options: newOptions });
    };

    const hasOptions = ['select', 'radio', 'checkbox'].includes(editedQuestion.question_type);

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Text *
                </label>
                <Input
                    value={editedQuestion.question_text}
                    onChange={(e) => updateQuestion({ question_text: e.target.value })}
                    placeholder="Enter your question..."
                    className="border-beige-300 focus:border-maroon-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                </label>
                <textarea
                    value={editedQuestion.description || ''}
                    onChange={(e) => updateQuestion({ description: e.target.value })}
                    placeholder="Additional instructions or context..."
                    rows={2}
                    className="w-full border border-beige-300 rounded-md px-3 py-2 text-sm focus:border-maroon-500 focus:ring-maroon-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Type
                </label>
                <select
                    value={editedQuestion.question_type}
                    onChange={(e) => updateQuestion({ question_type: e.target.value as Question['question_type'] })}
                    className="w-full border border-beige-300 rounded-md px-3 py-2 text-sm focus:border-maroon-500"
                >
                    {questionTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                            {type.label}
                        </option>
                    ))}
                </select>
            </div>

            {hasOptions && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Options
                    </label>
                    <div className="space-y-2">
                        {(editedQuestion.options || []).map((option, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <Input
                                    value={option}
                                    onChange={(e) => updateOption(index, e.target.value)}
                                    placeholder={`Option ${index + 1}`}
                                    className="flex-1 border-beige-300"
                                />
                                {(editedQuestion.options?.length || 0) > 2 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeOption(index)}
                                        className="text-red-600 hover:bg-red-100"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addOption}
                            className="border-maroon-300 text-maroon-700"
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
                    checked={editedQuestion.is_required}
                    onChange={(e) => updateQuestion({ is_required: e.target.checked })}
                    className="rounded border-beige-300 text-maroon-600"
                />
                <label className="text-sm text-gray-700">
                    Required question
                </label>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    onClick={() => onSave(editedQuestion)}
                    className="bg-maroon-700 hover:bg-maroon-800"
                >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                </Button>
            </div>
        </div>
    );
}