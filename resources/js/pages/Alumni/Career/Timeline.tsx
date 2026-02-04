import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Briefcase, Plus, Calendar, MapPin, Edit, Trash2, Building, Award, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CareerHistory {
    id: number;
    job_title: string;
    company_name: string;
    company_location?: string;
    employment_type?: string;
    job_description?: string;
    start_date: string;
    end_date?: string;
    is_current: boolean;
    industry?: string;
    skills_used?: string[];
    achievements?: string[];
    salary?: number;
    salary_currency?: string;
    duration_formatted?: string;
}

interface Stats {
    total_positions: number;
    current_positions: number;
    total_experience_months: number;
}

interface Props {
    careerHistory: CareerHistory[];
    stats: Stats;
}

export default function CareerTimeline({ careerHistory, stats }: Props) {
    const { flash } = usePage().props as any;
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
    const [skillInput, setSkillInput] = useState('');
    const [achievementInput, setAchievementInput] = useState('');

    const [formData, setFormData] = useState({
        job_title: '',
        company_name: '',
        company_location: '',
        employment_type: 'full_time',
        job_description: '',
        start_date: '',
        end_date: '',
        is_current: false,
        industry: '',
        skills_used: [] as string[],
        achievements: [] as string[],
        salary: '',
        salary_currency: 'PHP',
    });

    const employmentTypes = {
        full_time: 'Full Time',
        part_time: 'Part Time',
        contract: 'Contract',
        freelance: 'Freelance',
        internship: 'Internship',
    };

    const formatExperience = (months: number) => {
        const years = Math.floor(months / 12);
        const remainingMonths = Math.round(months % 12);

        if (years === 0) return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
        if (remainingMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`;
        return `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    };

    const openAddModal = () => {
        setEditingId(null);
        setFormData({
            job_title: '',
            company_name: '',
            company_location: '',
            employment_type: 'full_time',
            job_description: '',
            start_date: '',
            end_date: '',
            is_current: false,
            industry: '',
            skills_used: [],
            achievements: [],
            salary: '',
            salary_currency: 'PHP',
        });
        setShowModal(true);
    };

    const openEditModal = (career: CareerHistory) => {
        setEditingId(career.id);
        setFormData({
            job_title: career.job_title,
            company_name: career.company_name,
            company_location: career.company_location || '',
            employment_type: career.employment_type || 'full_time',
            job_description: career.job_description || '',
            start_date: career.start_date,
            end_date: career.end_date || '',
            is_current: career.is_current,
            industry: career.industry || '',
            skills_used: career.skills_used || [],
            achievements: career.achievements || [],
            salary: career.salary?.toString() || '',
            salary_currency: career.salary_currency || 'PHP',
        });
        setShowModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const data = {
            ...formData,
            salary: formData.salary ? parseFloat(formData.salary) : null,
        };

        if (editingId) {
            router.put(`/alumni/career/${editingId}`, data, {
                onSuccess: () => setShowModal(false),
            });
        } else {
            router.post('/alumni/career', data, {
                onSuccess: () => setShowModal(false),
            });
        }
    };

    const handleDelete = (id: number) => {
        router.delete(`/alumni/career/${id}`, {
            onSuccess: () => {
                setShowDeleteConfirm(null);
            },
            onError: (errors) => {
                console.error('Delete error:', errors);
            },
        });
    };

    const addSkill = () => {
        if (skillInput.trim()) {
            setFormData({
                ...formData,
                skills_used: [...formData.skills_used, skillInput.trim()],
            });
            setSkillInput('');
        }
    };

    const removeSkill = (index: number) => {
        setFormData({
            ...formData,
            skills_used: formData.skills_used.filter((_, i) => i !== index),
        });
    };

    const addAchievement = () => {
        if (achievementInput.trim()) {
            setFormData({
                ...formData,
                achievements: [...formData.achievements, achievementInput.trim()],
            });
            setAchievementInput('');
        }
    };

    const removeAchievement = (index: number) => {
        setFormData({
            ...formData,
            achievements: formData.achievements.filter((_, i) => i !== index),
        });
    };

    return (
        <AlumniBaseLayout title="Career Timeline">
            <Head title="Career Timeline" />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <TrendingUp className="h-8 w-8 text-maroon-600" />
                        <div>
                            <h1 className="text-3xl font-bold text-maroon-800">Career Timeline</h1>
                            <p className="text-gray-600">Track your professional journey</p>
                        </div>
                    </div>
                    <Button
                        onClick={openAddModal}
                        className="bg-maroon-700 hover:bg-maroon-800 text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Position
                    </Button>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                        {flash.error}
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-beige-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Positions</p>
                                    <p className="text-2xl font-bold text-maroon-800">{stats.total_positions}</p>
                                </div>
                                <Briefcase className="h-8 w-8 text-maroon-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-beige-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Current Positions</p>
                                    <p className="text-2xl font-bold text-maroon-800">{stats.current_positions}</p>
                                </div>
                                <Building className="h-8 w-8 text-maroon-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-beige-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Experience</p>
                                    <p className="text-2xl font-bold text-maroon-800">
                                        {formatExperience(stats.total_experience_months)}
                                    </p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-maroon-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Career History */}
                <Card className="border-beige-200 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800 flex items-center">
                            <Briefcase className="h-5 w-5 mr-2" />
                            Employment History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {careerHistory.length === 0 ? (
                            <div className="text-center py-12">
                                <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                    No Career History Yet
                                </h3>
                                <p className="text-gray-500 mb-6">
                                    Add your work experience to build your career timeline
                                </p>
                                <Button
                                    onClick={openAddModal}
                                    className="bg-maroon-700 hover:bg-maroon-800 text-white"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Your First Position
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {careerHistory.map((career, index) => (
                                    <div
                                        key={career.id}
                                        className="relative pl-8 pb-6 border-l-2 border-maroon-200 last:border-0"
                                    >
                                        {/* Timeline dot */}
                                        <div className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full border-2 border-white ${career.is_current ? 'bg-green-500' : 'bg-maroon-600'
                                            }`} />

                                        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                                            {/* Header */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="text-xl font-semibold text-maroon-800">
                                                            {career.job_title}
                                                        </h3>
                                                        {career.is_current && (
                                                            <Badge className="bg-green-100 text-green-800">
                                                                Current
                                                            </Badge>
                                                        )}
                                                        {career.employment_type && (
                                                            <Badge variant="outline" className="border-maroon-300 text-maroon-700">
                                                                {employmentTypes[career.employment_type as keyof typeof employmentTypes]}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-lg text-gray-700 font-medium flex items-center gap-2">
                                                        <Building className="h-4 w-4" />
                                                        {career.company_name}
                                                    </p>
                                                    {career.company_location && (
                                                        <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                                            <MapPin className="h-3 w-3" />
                                                            {career.company_location}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openEditModal(career)}
                                                        className="border-maroon-300 text-maroon-700 hover:bg-maroon-50"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setShowDeleteConfirm(career.id)}
                                                        className="border-red-300 text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Duration */}
                                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                                                <Calendar className="h-4 w-4" />
                                                <span>
                                                    {new Date(career.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                    {' - '}
                                                    {career.is_current ? 'Present' :
                                                        career.end_date ? new Date(career.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present'
                                                    }
                                                </span>
                                                <span className="text-gray-400">•</span>
                                                <span className="font-medium">{career.duration_formatted}</span>
                                            </div>

                                            {/* Industry */}
                                            {career.industry && (
                                                <div className="mb-4">
                                                    <Badge variant="secondary" className="bg-beige-100 text-maroon-800">
                                                        {career.industry}
                                                    </Badge>
                                                </div>
                                            )}

                                            {/* Description */}
                                            {career.job_description && (
                                                <p className="text-gray-700 mb-4 whitespace-pre-line">
                                                    {career.job_description}
                                                </p>
                                            )}

                                            {/* Skills */}
                                            {career.skills_used && career.skills_used.length > 0 && (
                                                <div className="mb-4">
                                                    <p className="text-sm font-semibold text-gray-700 mb-2">Skills:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {career.skills_used.map((skill, idx) => (
                                                            <Badge
                                                                key={idx}
                                                                variant="outline"
                                                                className="border-maroon-200 text-maroon-700"
                                                            >
                                                                {skill}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Achievements */}
                                            {career.achievements && career.achievements.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                        <Award className="h-4 w-4 text-maroon-600" />
                                                        Key Achievements:
                                                    </p>
                                                    <ul className="list-disc list-inside space-y-1">
                                                        {career.achievements.map((achievement, idx) => (
                                                            <li key={idx} className="text-gray-700">
                                                                {achievement}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                            <h2 className="text-2xl font-bold text-maroon-800">
                                {editingId ? 'Edit Position' : 'Add Position'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="job_title">Job Title *</Label>
                                    <Input
                                        id="job_title"
                                        value={formData.job_title}
                                        onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="company_name">Company Name *</Label>
                                    <Input
                                        id="company_name"
                                        value={formData.company_name}
                                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="company_location">Location</Label>
                                    <Input
                                        id="company_location"
                                        value={formData.company_location}
                                        onChange={(e) => setFormData({ ...formData, company_location: e.target.value })}
                                        placeholder="City, Country"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="employment_type">Employment Type</Label>
                                    <select
                                        id="employment_type"
                                        value={formData.employment_type}
                                        onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    >
                                        {Object.entries(employmentTypes).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="industry">Industry</Label>
                                <Input
                                    id="industry"
                                    value={formData.industry}
                                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                    placeholder="e.g., Technology, Finance, Healthcare"
                                />
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="start_date">Start Date *</Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="end_date">End Date</Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        disabled={formData.is_current}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    id="is_current"
                                    type="checkbox"
                                    checked={formData.is_current}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        is_current: e.target.checked,
                                        end_date: e.target.checked ? '' : formData.end_date
                                    })}
                                    className="w-4 h-4 text-maroon-600 border-gray-300 rounded focus:ring-maroon-500"
                                />
                                <Label htmlFor="is_current" className="cursor-pointer">
                                    I currently work here
                                </Label>
                            </div>

                            {/* Description */}
                            <div>
                                <Label htmlFor="job_description">Job Description</Label>
                                <textarea
                                    id="job_description"
                                    value={formData.job_description}
                                    onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    placeholder="Describe your role and responsibilities"
                                />
                            </div>

                            {/* Skills */}
                            <div>
                                <Label>Skills Used</Label>
                                <div className="flex gap-2 mb-2">
                                    <Input
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                        placeholder="Type a skill and press Enter"
                                    />
                                    <Button type="button" onClick={addSkill} variant="outline">Add</Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.skills_used.map((skill, index) => (
                                        <Badge
                                            key={index}
                                            variant="outline"
                                            className="border-maroon-300 text-maroon-700 cursor-pointer hover:bg-red-50"
                                            onClick={() => removeSkill(index)}
                                        >
                                            {skill} ×
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Achievements */}
                            <div>
                                <Label>Key Achievements</Label>
                                <div className="flex gap-2 mb-2">
                                    <Input
                                        value={achievementInput}
                                        onChange={(e) => setAchievementInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAchievement())}
                                        placeholder="Type an achievement and press Enter"
                                    />
                                    <Button type="button" onClick={addAchievement} variant="outline">Add</Button>
                                </div>
                                <ul className="space-y-2">
                                    {formData.achievements.map((achievement, index) => (
                                        <li
                                            key={index}
                                            className="flex items-start gap-2 p-2 bg-gray-50 rounded border border-gray-200 cursor-pointer hover:bg-red-50"
                                            onClick={() => removeAchievement(index)}
                                        >
                                            <Award className="h-4 w-4 text-maroon-600 mt-0.5 flex-shrink-0" />
                                            <span className="flex-1 text-sm">{achievement}</span>
                                            <span className="text-xs text-gray-500">×</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Salary (Optional) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="salary">Salary (Optional)</Label>
                                    <Input
                                        id="salary"
                                        type="number"
                                        step="0.01"
                                        value={formData.salary}
                                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                        placeholder="e.g., 50000"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="salary_currency">Currency</Label>
                                    <Input
                                        id="salary_currency"
                                        value={formData.salary_currency}
                                        onChange={(e) => setFormData({ ...formData, salary_currency: e.target.value })}
                                        placeholder="PHP"
                                        maxLength={3}
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-maroon-700 hover:bg-maroon-800 text-white"
                                >
                                    {editingId ? 'Update Position' : 'Add Position'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-maroon-800 mb-4">Delete Position?</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this position? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowDeleteConfirm(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => handleDelete(showDeleteConfirm)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AlumniBaseLayout>
    );
}
