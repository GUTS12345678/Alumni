import React, { useEffect, useState, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Building2,
    Plus,
    Edit,
    Eye,
    Users,
    GraduationCap,
    BookOpen,
    Briefcase,
    MapPin,
    Phone,
    Mail,
    RefreshCw,
    BarChart3,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Loader2
} from 'lucide-react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';

interface Campus {
    id: number;
    name: string;
    code: string;
    display_name: string;
    address: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface CampusStatistics {
    total_users: number;
    total_alumni: number;
    total_departments: number;
    total_courses: number;
    total_batches: number;
    employment_rate: number;
    active_surveys: number;
    response_rate: number;
}

interface CampusWithStats extends Campus {
    statistics?: CampusStatistics;
}

interface CampusComparison {
    campus_id: number;
    campus_name: string;
    campus_code: string;
    total_alumni: number;
    employed_count: number;
    employment_rate: number;
}

interface User {
    id: number;
    email: string;
    role: string;
    status: string;
}

interface Props {
    user: User;
}

const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function CampusManagement({ user }: Props) {
    const { toast } = useToast();
    const [campuses, setCampuses] = useState<CampusWithStats[]>([]);
    const [comparison, setComparison] = useState<CampusComparison[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [selectedCampus, setSelectedCampus] = useState<CampusWithStats | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        display_name: '',
        address: '',
        contact_email: '',
        contact_phone: '',
        is_active: true,
    });

    const fetchCampuses = useCallback(async () => {
        try {
            setError(null);

            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            // Fetch campuses
            const response = await fetch('/api/v1/campuses', {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('auth_token');
                    window.location.href = '/login';
                    return;
                }
                throw new Error('Failed to fetch campuses');
            }

            const data = await response.json();

            if (data.success) {
                // Fetch statistics for each campus
                const campusesWithStats = await Promise.all(
                    data.data.map(async (campus: Campus) => {
                        try {
                            const statsResponse = await fetch(`/api/v1/campuses/${campus.id}/statistics`, {
                                headers: {
                                    'Accept': 'application/json',
                                    'Authorization': `Bearer ${token}`,
                                    'X-Requested-With': 'XMLHttpRequest',
                                },
                            });
                            if (statsResponse.ok) {
                                const statsData = await statsResponse.json();
                                return { ...campus, statistics: statsData.data?.statistics };
                            }
                            return campus;
                        } catch {
                            return campus;
                        }
                    })
                );
                setCampuses(campusesWithStats);
            }

            // Fetch comparison data
            const comparisonResponse = await fetch('/api/v1/campuses/comparison', {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (comparisonResponse.ok) {
                const comparisonData = await comparisonResponse.json();
                if (comparisonData.success) {
                    setComparison(comparisonData.data);
                }
            }
        } catch (err) {
            console.error('Campus fetch error:', err);
            setError('Failed to load campus data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchCampuses();
    }, [fetchCampuses]);

    const handleViewCampus = (campus: CampusWithStats) => {
        setSelectedCampus(campus);
        setViewModalOpen(true);
    };

    const handleEditCampus = (campus: CampusWithStats) => {
        setSelectedCampus(campus);
        setFormData({
            name: campus.name,
            code: campus.code,
            display_name: campus.display_name,
            address: campus.address || '',
            contact_email: campus.contact_email || '',
            contact_phone: campus.contact_phone || '',
            is_active: campus.is_active,
        });
        setEditModalOpen(true);
    };

    const handleAddCampus = () => {
        setFormData({
            name: '',
            code: '',
            display_name: '',
            address: '',
            contact_email: '',
            contact_phone: '',
            is_active: true,
        });
        setAddModalOpen(true);
    };

    const handleSaveCampus = async (isEdit: boolean) => {
        try {
            setSaving(true);
            const token = localStorage.getItem('auth_token');

            const url = isEdit
                ? `/api/v1/campuses/${selectedCampus?.id}`
                : '/api/v1/campuses';

            const response = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save campus');
            }

            toast({
                title: "Success",
                description: isEdit ? "Campus updated successfully" : "Campus created successfully",
            });

            setEditModalOpen(false);
            setAddModalOpen(false);
            fetchCampuses();
        } catch (err) {
            toast({
                title: "Error",
                description: err instanceof Error ? err.message : 'Failed to save campus',
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    // Calculate totals
    const totals = campuses.reduce((acc, campus) => ({
        totalAlumni: acc.totalAlumni + (campus.statistics?.total_alumni || 0),
        totalDepartments: acc.totalDepartments + (campus.statistics?.total_departments || 0),
        totalCourses: acc.totalCourses + (campus.statistics?.total_courses || 0),
        totalBatches: acc.totalBatches + (campus.statistics?.total_batches || 0),
    }), { totalAlumni: 0, totalDepartments: 0, totalCourses: 0, totalBatches: 0 });

    // Prepare chart data
    const alumniDistribution = campuses.map(campus => ({
        name: campus.code,
        value: campus.statistics?.total_alumni || 0,
    }));

    const employmentComparison = comparison.map(c => ({
        name: c.campus_code,
        employed: c.employed_count,
        total: c.total_alumni,
        rate: c.employment_rate,
    }));

    if (loading) {
        return (
            <AdminBaseLayout user={user}>
                <Head title="Campus Management" />
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AdminBaseLayout>
        );
    }

    return (
        <AdminBaseLayout user={user}>
            <Head title="Campus Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Building2 className="h-6 w-6" />
                            Campus Management
                        </h1>
                        <p className="text-muted-foreground">
                            Manage campuses, view statistics, and compare performance
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => fetchCampuses()}
                            disabled={refreshing}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button onClick={handleAddCampus}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Campus
                        </Button>
                    </div>
                </div>

                {error && (
                    <Card className="border-destructive">
                        <CardContent className="p-4 flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            {error}
                        </CardContent>
                    </Card>
                )}

                {/* Summary Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Campuses
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                {campuses.length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Alumni
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-500" />
                                {totals.totalAlumni.toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Departments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-green-500" />
                                {totals.totalDepartments}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Courses
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold flex items-center gap-2">
                                <GraduationCap className="h-5 w-5 text-orange-500" />
                                {totals.totalCourses}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Batches
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-purple-500" />
                                {totals.totalBatches}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Alumni Distribution Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Alumni Distribution by Campus</CardTitle>
                            <CardDescription>Number of alumni per campus</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={alumniDistribution}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({ name, value }) => `${name}: ${value}`}
                                        >
                                            {alumniDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Employment Comparison Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Employment Rate Comparison</CardTitle>
                            <CardDescription>Employment statistics across campuses</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={employmentComparison}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="employed" name="Employed" fill="#0088FE" />
                                        <Bar dataKey="total" name="Total Alumni" fill="#00C49F" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Campus Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {campuses.map((campus) => (
                        <Card key={campus.id} className={!campus.is_active ? 'opacity-60' : ''}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Building2 className="h-5 w-5" />
                                            {campus.display_name}
                                            <Badge variant={campus.is_active ? 'default' : 'secondary'}>
                                                {campus.code}
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            {campus.name}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => handleViewCampus(campus)}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleEditCampus(campus)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Contact Info */}
                                <div className="space-y-2 mb-4 text-sm">
                                    {campus.address && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <MapPin className="h-4 w-4" />
                                            {campus.address}
                                        </div>
                                    )}
                                    {campus.contact_email && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Mail className="h-4 w-4" />
                                            {campus.contact_email}
                                        </div>
                                    )}
                                    {campus.contact_phone && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Phone className="h-4 w-4" />
                                            {campus.contact_phone}
                                        </div>
                                    )}
                                </div>

                                {/* Statistics Grid */}
                                {campus.statistics && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                                            <div className="text-lg font-bold text-blue-600">
                                                {campus.statistics.total_alumni.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Alumni</div>
                                        </div>
                                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                                            <div className="text-lg font-bold text-green-600">
                                                {campus.statistics.total_departments}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Departments</div>
                                        </div>
                                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                                            <div className="text-lg font-bold text-orange-600">
                                                {campus.statistics.total_courses}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Courses</div>
                                        </div>
                                        <div className="bg-muted/50 rounded-lg p-3 text-center">
                                            <div className="text-lg font-bold text-purple-600">
                                                {campus.statistics.total_batches}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Batches</div>
                                        </div>
                                    </div>
                                )}

                                {/* Employment Rate Progress */}
                                {campus.statistics && (
                                    <div className="mt-4">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-muted-foreground">Employment Rate</span>
                                            <span className="font-medium">{campus.statistics.employment_rate.toFixed(1)}%</span>
                                        </div>
                                        <Progress value={campus.statistics.employment_rate} className="h-2" />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Campus Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Campuses</CardTitle>
                        <CardDescription>Detailed view of all campus data</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Campus</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead className="text-center">Alumni</TableHead>
                                    <TableHead className="text-center">Departments</TableHead>
                                    <TableHead className="text-center">Courses</TableHead>
                                    <TableHead className="text-center">Batches</TableHead>
                                    <TableHead className="text-center">Employment Rate</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {campuses.map((campus) => (
                                    <TableRow key={campus.id}>
                                        <TableCell className="font-medium">{campus.display_name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{campus.code}</Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {campus.statistics?.total_alumni.toLocaleString() || 0}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {campus.statistics?.total_departments || 0}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {campus.statistics?.total_courses || 0}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {campus.statistics?.total_batches || 0}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={
                                                (campus.statistics?.employment_rate || 0) >= 70 ? 'default' :
                                                    (campus.statistics?.employment_rate || 0) >= 50 ? 'secondary' : 'destructive'
                                            }>
                                                {campus.statistics?.employment_rate.toFixed(1) || 0}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {campus.is_active ? (
                                                <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleViewCampus(campus)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleEditCampus(campus)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* View Modal */}
                <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                {selectedCampus?.display_name}
                            </DialogTitle>
                            <DialogDescription>
                                Campus details and statistics
                            </DialogDescription>
                        </DialogHeader>
                        {selectedCampus && (
                            <div className="space-y-6">
                                {/* Campus Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">Full Name</Label>
                                        <p className="font-medium">{selectedCampus.name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Campus Code</Label>
                                        <p className="font-medium">
                                            <Badge>{selectedCampus.code}</Badge>
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Address</Label>
                                        <p className="font-medium">{selectedCampus.address || 'Not specified'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Status</Label>
                                        <p className="font-medium">
                                            <Badge variant={selectedCampus.is_active ? 'default' : 'destructive'}>
                                                {selectedCampus.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Contact Email</Label>
                                        <p className="font-medium">{selectedCampus.contact_email || 'Not specified'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Contact Phone</Label>
                                        <p className="font-medium">{selectedCampus.contact_phone || 'Not specified'}</p>
                                    </div>
                                </div>

                                {/* Statistics */}
                                {selectedCampus.statistics && (
                                    <div>
                                        <Label className="text-muted-foreground mb-3 block">Statistics</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 text-center">
                                                <Users className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                                                <div className="text-xl font-bold">{selectedCampus.statistics.total_alumni}</div>
                                                <div className="text-xs text-muted-foreground">Total Alumni</div>
                                            </div>
                                            <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 text-center">
                                                <BookOpen className="h-6 w-6 text-green-500 mx-auto mb-1" />
                                                <div className="text-xl font-bold">{selectedCampus.statistics.total_departments}</div>
                                                <div className="text-xs text-muted-foreground">Departments</div>
                                            </div>
                                            <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-4 text-center">
                                                <GraduationCap className="h-6 w-6 text-orange-500 mx-auto mb-1" />
                                                <div className="text-xl font-bold">{selectedCampus.statistics.total_courses}</div>
                                                <div className="text-xs text-muted-foreground">Courses</div>
                                            </div>
                                            <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-4 text-center">
                                                <Briefcase className="h-6 w-6 text-purple-500 mx-auto mb-1" />
                                                <div className="text-xl font-bold">{selectedCampus.statistics.employment_rate.toFixed(1)}%</div>
                                                <div className="text-xs text-muted-foreground">Employment Rate</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Edit/Add Modal */}
                <Dialog open={editModalOpen || addModalOpen} onOpenChange={(open) => {
                    if (!open) {
                        setEditModalOpen(false);
                        setAddModalOpen(false);
                    }
                }}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editModalOpen ? 'Edit Campus' : 'Add New Campus'}
                            </DialogTitle>
                            <DialogDescription>
                                {editModalOpen ? 'Update campus information' : 'Enter the details for the new campus'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="EARIST Cavite Campus"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="code">Code *</Label>
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="CAV"
                                        maxLength={10}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="display_name">Display Name *</Label>
                                <Input
                                    id="display_name"
                                    value={formData.display_name}
                                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                                    placeholder="Cavite Campus"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Campus address"
                                    rows={2}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contact_email">Contact Email</Label>
                                    <Input
                                        id="contact_email"
                                        type="email"
                                        value={formData.contact_email}
                                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                        placeholder="email@campus.edu"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contact_phone">Contact Phone</Label>
                                    <Input
                                        id="contact_phone"
                                        value={formData.contact_phone}
                                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                        placeholder="+63 XXX XXX XXXX"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                />
                                <Label htmlFor="is_active">Active</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setEditModalOpen(false);
                                    setAddModalOpen(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => handleSaveCampus(editModalOpen)}
                                disabled={saving || !formData.name || !formData.code || !formData.display_name}
                            >
                                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {editModalOpen ? 'Update Campus' : 'Create Campus'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminBaseLayout>
    );
}
