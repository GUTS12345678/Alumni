import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
    Users,
    Search,
    Download,
    Upload,
    Filter,
    RefreshCw,
    Eye,
    Mail,
    Phone,
    Building,
    GraduationCap,
    MoreVertical,
    Edit,
    Trash2,
    MessageCircle,
    ArrowUpDown,
    ChevronDown,
    FileText,
    Plus,
    AlertCircle,
    CheckCircle2,
    XCircle,
    FileSpreadsheet,
    ArrowRight,
    ArrowLeft,
    Info,
    School,
    Award,
    Heart,
    Briefcase as BriefcaseIcon
} from 'lucide-react';
import AdminBaseLayout from '../../components/base/AdminBaseLayout';
import { useMultiSelect, BulkActionBar, SelectAllCheckbox } from '../../components/ui/multi-select';
import { useCampus } from '@/contexts/CampusContext';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface User {
    id: number;
    email: string;
    role: string;
    status: string;
}

interface Props {
    user: User;
}

interface AlumniProfile {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    degree_program: string;
    graduation_year: number;
    employment_status: string;
    current_employer?: string;
    current_job_title?: string;
    created_at: string;
    import_source?: string | null;
    imported_at?: string | null;
    user?: { id: number; email: string };
    batch?: { id: number; name: string; graduation_year: number };
    campus?: { id: number; name: string; code: string };
}

interface AlumniResponse {
    data: AlumniProfile[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export default function AlumniBank({ user }: Props) {
    const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const { confirm, confirmState, handleConfirm, handleCancel } = useConfirmDialog();
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    // Modal states
    const [selectedAlumni, setSelectedAlumni] = useState<AlumniProfile | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState<Partial<AlumniProfile & { email: string }>>({});
    const [updating, setUpdating] = useState(false);

    // Add Alumni modal state
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [addStep, setAddStep] = useState(0);

    const initialAddFormData = {
        // Personal Information
        first_name: '',
        last_name: '',
        maiden_name: '',
        email: '',
        student_id: '',
        age: '',
        gender: '',
        place_of_birth: '',
        civil_status: '',
        spouse_name: '',
        number_of_children: '',
        current_address: '',
        phone: '',
        mobile_no: '',

        // School Information
        campus_id: '',
        department_id: '',
        course_id: '',
        degree_program: '',
        major: '',
        graduation_year: new Date().getFullYear(),
        enrollment_year: '',
        honors_awards: '',

        // Employment
        presently_employed: '',
        employment_location: '',
        not_employed_reason: '',
        current_employer: '',
        company_address: '',
        current_job_title: '',
        date_hired: '',
        years_of_service: '',
        job_aligned_to_course: '',
        average_monthly_income: '',
        employment_status: '',
        job_level_position: '',
        major_line_of_business: '',

        // Achievements / About Me
        achievements: '',
        about_me: '',
    };
    const [addFormData, setAddFormData] = useState(initialAddFormData);

    // Cascading selects for Add Alumni
    const [addCampuses, setAddCampuses] = useState<Array<{ id: number; name: string; code: string }>>([]);
    const [addDepartments, setAddDepartments] = useState<Array<{ id: number; name: string; code: string }>>([]);
    const [addCourses, setAddCourses] = useState<Array<{ id: number; name: string; code: string }>>([]);
    const [loadingAddDepts, setLoadingAddDepts] = useState(false);
    const [loadingAddCourses, setLoadingAddCourses] = useState(false);

    // Fetch campuses for Add Alumni form
    useEffect(() => {
        if (!addModalOpen) return;
        const fetchCampuses = async () => {
            try {
                const res = await fetch('/api/v1/campuses', { headers: { 'Accept': 'application/json' } });
                const data = await res.json();
                if (data.success) setAddCampuses(data.data || []);
            } catch { /* ignore */ }
        };
        fetchCampuses();
    }, [addModalOpen]);

    // Fetch departments when campus changes
    useEffect(() => {
        if (!addFormData.campus_id) { setAddDepartments([]); setAddCourses([]); return; }
        const fetchDepts = async () => {
            setLoadingAddDepts(true);
            try {
                const res = await fetch(`/api/v1/admin/departments/active?campus_id=${addFormData.campus_id}`, { headers: { 'Accept': 'application/json' } });
                const data = await res.json();
                if (data.success) setAddDepartments(data.data || []);
            } catch { /* ignore */ }
            setLoadingAddDepts(false);
        };
        fetchDepts();
    }, [addFormData.campus_id]);

    // Fetch courses when department changes
    useEffect(() => {
        if (!addFormData.department_id) { setAddCourses([]); return; }
        const fetchCourses = async () => {
            setLoadingAddCourses(true);
            try {
                const res = await fetch(`/api/v1/admin/departments/${addFormData.department_id}/courses`, { headers: { 'Accept': 'application/json' } });
                const data = await res.json();
                if (data.success) setAddCourses(data.data || []);
            } catch { /* ignore */ }
            setLoadingAddCourses(false);
        };
        fetchCourses();
    }, [addFormData.department_id]);

    // Import Alumni modal state
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importStep, setImportStep] = useState<'upload' | 'configure' | 'preview' | 'importing' | 'results'>('upload');
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importDragOver, setImportDragOver] = useState(false);
    const [importPreviewData, setImportPreviewData] = useState<any>(null);
    const [importLoading, setImportLoading] = useState(false);
    const [importConfig, setImportConfig] = useState({
        campus_id: '',
        batch_id: '',
        department_id: '',
        duplicate_action: 'skip' as 'skip' | 'update',
    });
    const [importResults, setImportResults] = useState<any>(null);

    // Safety net: sync editFormData when modal opens with a selected alumni
    useEffect(() => {
        if (editModalOpen && selectedAlumni) {
            setEditFormData({
                id: selectedAlumni.id,
                first_name: selectedAlumni.first_name || '',
                last_name: selectedAlumni.last_name || '',
                email: selectedAlumni.user?.email || selectedAlumni.email || '',
                phone: selectedAlumni.phone || '',
                degree_program: selectedAlumni.degree_program || '',
                employment_status: selectedAlumni.employment_status || '',
                current_employer: selectedAlumni.current_employer || '',
                current_job_title: selectedAlumni.current_job_title || '',
                graduation_year: selectedAlumni.graduation_year,
            });
        }
    }, [editModalOpen, selectedAlumni]);

    // Sort state
    const [sortBy, setSortBy] = useState<string>(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('sort') || 'name_asc';
    });

    // Filter states - initialize from URL params if present
    const [filterStatus, setFilterStatus] = useState<string>(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('employment_status') || '';
    });
    const [filterYear, setFilterYear] = useState<string>(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('graduation_year') || '';
    });
    const [filterJobTitle, setFilterJobTitle] = useState<string>(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('job_title') || '';
    });
    const [filterEmployer, setFilterEmployer] = useState<string>(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('employer') || '';
    });
    const [filterCareerField, setFilterCareerField] = useState<string>(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('career_field') || '';
    });
    const [filtersOpen, setFiltersOpen] = useState(() => {
        // Auto-open filters panel if any filter is pre-set from URL
        const params = new URLSearchParams(window.location.search);
        return !!(params.get('graduation_year') || params.get('employment_status') ||
            params.get('job_title') || params.get('employer') || params.get('career_field'));
    });
    const [batchName, setBatchName] = useState<string>(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('batch_name') || '';
    });

    // Batch/graduation years for filter
    const [availableYears, setAvailableYears] = useState<number[]>([]);

    // Multi-select state
    const multiSelect = useMultiSelect<number>();
    const [isDeleting, setIsDeleting] = useState(false);

    // Campus filter
    const { selectedCampus } = useCampus();

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300); // 300ms delay

        return () => clearTimeout(timer);
    }, [searchTerm]); const fetchAlumniCallback = React.useCallback(async () => {
        try {
            setLoading(currentPage === 1);
            setRefreshing(currentPage !== 1);

            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const params = new URLSearchParams();
            if (selectedCampus?.id) params.append('campus_id', selectedCampus.id.toString());
            if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
            if (filterStatus) params.append('employment_status', filterStatus);
            if (filterYear) params.append('graduation_year', filterYear);
            if (filterJobTitle) params.append('job_title', filterJobTitle);
            if (filterEmployer) params.append('employer', filterEmployer);
            if (filterCareerField) params.append('career_field', filterCareerField);
            if (sortBy) params.append('sort', sortBy);
            params.append('page', currentPage.toString());
            params.append('per_page', '15');

            const response = await fetch(`/api/v1/admin/alumni?${params}`, {
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
                throw new Error('Failed to fetch alumni data');
            }

            const data: { success: boolean; data: AlumniResponse } = await response.json();

            if (data.success) {
                setAlumni(data.data.data);
                setCurrentPage(data.data.current_page);
                setTotalPages(data.data.last_page);
                setTotal(data.data.total);
            }
        } catch (err) {
            console.error('Alumni fetch error:', err);
            setError('Failed to load alumni data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, debouncedSearchTerm, filterStatus, filterYear, filterJobTitle, filterEmployer, filterCareerField, sortBy, selectedCampus]);

    // Re-fetch when campus changes
    useEffect(() => {
        if (selectedCampus) {
            setCurrentPage(1); // Reset to page 1 when campus changes
        }
    }, [selectedCampus]);

    // Fetch available graduation years/batches
    const fetchAvailableYears = React.useCallback(async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            const response = await fetch('/api/v1/admin/batches?per_page=100', {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data?.data) {
                    // Extract unique graduation years and sort descending
                    const years = data.data.data
                        .map((batch: { graduation_year: number }) => batch.graduation_year)
                        .filter((year: number) => year != null)
                        .sort((a: number, b: number) => b - a);
                    setAvailableYears([...new Set(years)] as number[]);
                }
            }
        } catch (err) {
            console.error('Failed to fetch batches:', err);
        }
    }, []);

    useEffect(() => {
        fetchAlumniCallback();
    }, [fetchAlumniCallback]);

    useEffect(() => {
        fetchAvailableYears();
    }, [fetchAvailableYears]);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1); // Reset to first page when searching/filtering
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [searchTerm, filterStatus, filterYear]);

    // Alumni action handlers
    const handleViewAlumni = (alumni: AlumniProfile) => {
        setSelectedAlumni(alumni);
        setViewModalOpen(true);
    };

    // Helper to get email (lives under user relation, not directly on profile)
    const getAlumniEmail = (a: AlumniProfile) => a.user?.email || a.email || '';

    const handleContactAlumni = (alumni: AlumniProfile) => {
        const email = getAlumniEmail(alumni);
        if (email) window.location.href = `mailto:${email}?subject=Alumni Tracer - Contact`;
    };

    const handleEditAlumni = (alumni: AlumniProfile) => {
        const data = {
            id: alumni.id,
            first_name: alumni.first_name || '',
            last_name: alumni.last_name || '',
            email: alumni.user?.email || alumni.email || '',
            phone: alumni.phone || '',
            degree_program: alumni.degree_program || '',
            employment_status: alumni.employment_status || '',
            current_employer: alumni.current_employer || '',
            current_job_title: alumni.current_job_title || '',
            graduation_year: alumni.graduation_year,
        };
        setSelectedAlumni(alumni);
        setEditFormData(data);
        setEditModalOpen(true);
    };

    const handleUpdateAlumni = async () => {
        if (!editFormData.id) return;

        setUpdating(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            const response = await fetch(`/api/v1/admin/alumni/${editFormData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || ''
                },
                body: JSON.stringify(editFormData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Update the alumni in the local state
                setAlumni((prevAlumni: AlumniProfile[]) =>
                    prevAlumni.map((alumni: AlumniProfile) =>
                        alumni.id === editFormData.id
                            ? { ...alumni, ...data.data }
                            : alumni
                    )
                );
                setEditModalOpen(false);
                setEditFormData({});
                setSelectedAlumni(null);
                alert('Alumni profile updated successfully!');
                fetchAlumniCallback();
            } else {
                alert('Failed to update alumni profile: ' + (data.message || 'Unknown error'));
            }
        } catch (error: unknown) {
            console.error('Error updating alumni:', error);
            alert('Failed to update alumni profile. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    const handleCreateAlumni = async () => {
        if (!addFormData.first_name || !addFormData.last_name || !addFormData.email) {
            alert('First name, last name, and email are required.');
            return;
        }

        setCreating(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            // Build payload, excluding empty strings
            const payload: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(addFormData)) {
                if (value !== '' && value !== null && value !== undefined) {
                    payload[key] = value;
                }
            }

            const response = await fetch('/api/v1/admin/alumni', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || ''
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setAddModalOpen(false);
                setAddFormData(initialAddFormData);
                setAddStep(0);
                alert(data.message || 'Alumni created successfully!');
                fetchAlumniCallback();
            } else {
                const errorMsg = data.errors
                    ? Object.values(data.errors).flat().join('\n')
                    : data.message || 'Unknown error';
                alert('Failed to create alumni: ' + errorMsg);
            }
        } catch (error: unknown) {
            console.error('Error creating alumni:', error);
            alert('Failed to create alumni. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteAlumni = async (alumni: AlumniProfile) => {
        const ok = await confirm({ title: 'Delete Alumni', message: `Are you sure you want to delete ${alumni.first_name} ${alumni.last_name}?`, variant: 'destructive', confirmLabel: 'Delete' });
        if (!ok) {
            return;
        }

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            const response = await fetch(`/api/v1/admin/alumni/${alumni.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || ''
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Remove from local state
                setAlumni((prevAlumni: AlumniProfile[]) =>
                    prevAlumni.filter((a: AlumniProfile) => a.id !== alumni.id)
                );
                alert('Alumni deleted successfully');
                fetchAlumniCallback();
            } else {
                alert('Failed to delete alumni: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete alumni. Please try again.');
        }
    };

    const handleBulkDelete = async () => {
        const ok = await confirm({ title: 'Delete Alumni', message: `Are you sure you want to delete ${multiSelect.selectedCount} alumni?`, variant: 'destructive', confirmLabel: 'Delete' });
        if (!ok) {
            return;
        }

        setIsDeleting(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch('/api/v1/admin/alumni/bulk-delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    ids: Array.from(multiSelect.selectedItems)
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                multiSelect.clearSelection();
                fetchAlumniCallback();
                alert(`Successfully deleted ${data.deleted_count} alumni`);
            } else {
                throw new Error(data.message || 'Failed to delete');
            }
        } catch (error) {
            console.error('Bulk delete error:', error);
            alert('Failed to delete alumni. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleExport = async (format: 'csv' | 'excel' | 'pdf' = 'csv') => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            // Add current filters to export
            const params = new URLSearchParams();
            if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
            if (filterStatus) params.append('employment_status', filterStatus);
            if (filterYear) params.append('graduation_year', filterYear);
            if (filterJobTitle) params.append('job_title', filterJobTitle);
            if (filterEmployer) params.append('employer', filterEmployer);
            if (filterCareerField) params.append('career_field', filterCareerField);
            params.append('format', format);

            const response = await fetch(`/api/v1/admin/alumni/export?${params}`, {
                headers: {
                    'Accept': 'application/octet-stream',
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                const extension = format === 'excel' ? 'xlsx' : format;
                a.download = `alumni-export-${new Date().toISOString().split('T')[0]}.${extension}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                alert(`Successfully exported ${format.toUpperCase()} file!`);
            } else {
                alert('Failed to export alumni data. Please try again.');
            }
        } catch (error) {
            console.error('CSV export error:', error);
            alert('Failed to export alumni data. Please try again.');
        }
    };

    // ========== IMPORT HANDLERS ==========
    const handleImportFileSelect = (file: File) => {
        const validExtensions = ['.xlsx', '.xls', '.csv'];
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (!validExtensions.includes(ext)) {
            alert('Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be under 10MB.');
            return;
        }
        setImportFile(file);
    };

    const handleImportPreview = async () => {
        if (!importFile) return;
        setImportLoading(true);

        try {
            const token = localStorage.getItem('auth_token');
            if (!token) { window.location.href = '/login'; return; }

            const formData = new FormData();
            formData.append('file', importFile);

            const response = await fetch('/api/v1/admin/alumni/import/preview', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                setImportPreviewData(data.data);
                // Auto-select department if detected
                if (data.data.detected_department?.id) {
                    setImportConfig(prev => ({ ...prev, department_id: data.data.detected_department.id.toString() }));
                }
                setImportStep('configure');
            } else {
                alert(data.message || 'Failed to parse the file.');
            }
        } catch (error) {
            console.error('Import preview error:', error);
            alert('Failed to process the file. Please check the format and try again.');
        } finally {
            setImportLoading(false);
        }
    };

    const handleImportExecute = async () => {
        if (!importFile) return;
        if (!importConfig.campus_id) { alert('Please select a campus.'); return; }

        setImportStep('importing');
        setImportLoading(true);

        try {
            const token = localStorage.getItem('auth_token');
            if (!token) { window.location.href = '/login'; return; }

            const formData = new FormData();
            formData.append('file', importFile);
            formData.append('campus_id', importConfig.campus_id);
            if (importConfig.batch_id) formData.append('batch_id', importConfig.batch_id);
            if (importConfig.department_id) formData.append('department_id', importConfig.department_id);
            formData.append('duplicate_action', importConfig.duplicate_action);

            const response = await fetch('/api/v1/admin/alumni/import', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                setImportResults(data.data);
                setImportStep('results');
                // Refresh the alumni list
                fetchAlumniCallback();
            } else {
                alert(data.message || 'Import failed.');
                setImportStep('preview');
            }
        } catch (error) {
            console.error('Import error:', error);
            alert('Import failed. Please try again.');
            setImportStep('preview');
        } finally {
            setImportLoading(false);
        }
    };

    const resetImportState = () => {
        setImportStep('upload');
        setImportFile(null);
        setImportPreviewData(null);
        setImportConfig({ campus_id: '', batch_id: '', department_id: '', duplicate_action: 'skip' });
        setImportResults(null);
        setImportLoading(false);
        setImportDragOver(false);
    };

    const handleImportModalClose = (open: boolean) => {
        if (!open) {
            resetImportState();
        }
        setImportModalOpen(open);
    };

    const handleDownloadTemplate = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) { window.location.href = '/login'; return; }

            const response = await fetch('/api/v1/admin/alumni/import/template', {
                headers: {
                    'Accept': 'application/octet-stream',
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = '2025 Alumni Directory Template.xlsx';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert('Template not available. Please contact support.');
            }
        } catch (error) {
            console.error('Template download error:', error);
            alert('Failed to download template.');
        }
    };
    // ========== END IMPORT HANDLERS ==========

    const getEmploymentStatusBadge = (status: string | null | undefined) => {
        const safeStatus = status ?? 'not_specified';
        const statusColors = {
            'employed': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
            'unemployed': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
            'self-employed': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
            'pursuing_education': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
            'not_specified': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        };

        return (
            <Badge className={statusColors[safeStatus as keyof typeof statusColors] || statusColors.not_specified}>
                {safeStatus.replace('_', ' ').toUpperCase()}
            </Badge>
        );
    };

    if (loading) {
        return (
            <AdminBaseLayout title="Alumni Bank" user={user}>
                <div className="flex items-center justify-center min-h-96">
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="h-8 w-8 text-maroon-600 dark:text-maroon-400 animate-spin" />
                        <span className="text-maroon-800 dark:text-maroon-200 font-medium">Loading alumni data...</span>
                    </div>
                </div>
            </AdminBaseLayout>
        );
    }

    if (error) {
        return (
            <AdminBaseLayout title="Alumni Bank" user={user}>
                <Card className="border-red-200 dark:border-red-800">
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                            <Button onClick={() => fetchAlumniCallback()} className="bg-maroon-700 hover:bg-maroon-800">
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
        <AdminBaseLayout title="Alumni Bank" user={user}>
            <div className="space-y-6">
                {/* Batch Filter Banner - shown when viewing a specific batch */}
                {batchName && filterYear && (
                    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    <div>
                                        <p className="font-medium text-blue-800 dark:text-blue-200">
                                            Viewing Batch: {batchName}
                                        </p>
                                        <p className="text-sm text-blue-600 dark:text-blue-400">
                                            Graduation Year: {filterYear}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setFilterYear('');
                                        setBatchName('');
                                        // Clear URL params
                                        window.history.replaceState({}, '', '/admin/alumni');
                                    }}
                                    className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                >
                                    Clear Filter
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Header with Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-maroon-800 dark:text-maroon-200">Alumni Management</h2>
                        <p className="text-maroon-600 dark:text-maroon-400">Manage and view all registered alumni profiles</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            onClick={() => fetchAlumniCallback()}
                            variant="outline"
                            size="sm"
                            disabled={refreshing}
                            className="border-maroon-300 dark:border-maroon-700 text-maroon-700 dark:text-maroon-300 hover:bg-maroon-50 dark:hover:bg-maroon-900/30"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>

                        <Button
                            onClick={() => setAddModalOpen(true)}
                            size="sm"
                            className="bg-maroon-700 hover:bg-maroon-800 text-white"
                        >
                            <Plus className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Add Alumni</span>
                        </Button>

                        <Button
                            onClick={() => setImportModalOpen(true)}
                            variant="outline"
                            size="sm"
                            className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30"
                        >
                            <Upload className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Import</span>
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-maroon-300 dark:border-maroon-700 text-maroon-700 dark:text-maroon-300 hover:bg-maroon-50 dark:hover:bg-maroon-900/30"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                    <ChevronDown className="h-4 w-4 ml-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleExport('csv')}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Export as CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('excel')}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Export as Excel
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Export as PDF
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Search and Filters */}
                <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg text-maroon-800 dark:text-maroon-200 flex items-center">
                            <Search className="h-5 w-5 mr-2" />
                            Search & Filter
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                                    <Input
                                        placeholder="Search by name, email, or company..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 border-beige-300 dark:border-gray-700 focus:border-maroon-500 focus:ring-maroon-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="w-[180px] border-beige-300 dark:border-gray-700">
                                        <ArrowUpDown className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="Sort by..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="name_asc">Name A-Z</SelectItem>
                                        <SelectItem value="name_desc">Name Z-A</SelectItem>
                                        <SelectItem value="grad_year_desc">Grad Year (Newest)</SelectItem>
                                        <SelectItem value="grad_year_asc">Grad Year (Oldest)</SelectItem>
                                        <SelectItem value="recent">Recently Updated</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4">
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                                <Input
                                    placeholder="Filter by job title..."
                                    value={filterJobTitle}
                                    onChange={(e) => setFilterJobTitle(e.target.value)}
                                    className="w-full sm:w-48 border-beige-300 dark:border-gray-700 focus:border-maroon-500 focus:ring-maroon-500"
                                />
                                <Input
                                    placeholder="Filter by employer..."
                                    value={filterEmployer}
                                    onChange={(e) => setFilterEmployer(e.target.value)}
                                    className="w-full sm:w-48 border-beige-300 dark:border-gray-700 focus:border-maroon-500 focus:ring-maroon-500"
                                />
                                <Input
                                    placeholder="Filter by career field..."
                                    value={filterCareerField}
                                    onChange={(e) => setFilterCareerField(e.target.value)}
                                    className="w-full sm:w-48 border-beige-300 dark:border-gray-700 focus:border-maroon-500 focus:ring-maroon-500"
                                />
                            </div>
                        </div>
                        {/* Active Filters Display */}
                        {(filterStatus || filterYear || filterJobTitle || filterEmployer || filterCareerField) && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {filterStatus && (
                                    <Badge
                                        variant="secondary"
                                        className="bg-maroon-100 text-maroon-800 text-xs"
                                    >
                                        Status: {filterStatus?.replace('_', ' ')}
                                        <button
                                            onClick={() => setFilterStatus('')}
                                            className="ml-1 hover:text-maroon-900"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                )}
                                {filterYear && (
                                    <Badge
                                        variant="secondary"
                                        className="bg-maroon-100 text-maroon-800 text-xs"
                                    >
                                        Year: {filterYear}
                                        <button
                                            onClick={() => setFilterYear('')}
                                            className="ml-1 hover:text-maroon-900"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                )}
                                {filterJobTitle && (
                                    <Badge
                                        variant="secondary"
                                        className="bg-maroon-100 text-maroon-800 text-xs"
                                    >
                                        Job Title: {filterJobTitle}
                                        <button
                                            onClick={() => setFilterJobTitle('')}
                                            className="ml-1 hover:text-maroon-900"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                )}
                                {filterEmployer && (
                                    <Badge
                                        variant="secondary"
                                        className="bg-maroon-100 text-maroon-800 text-xs"
                                    >
                                        Employer: {filterEmployer}
                                        <button
                                            onClick={() => setFilterEmployer('')}
                                            className="ml-1 hover:text-maroon-900"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                )}
                                {filterCareerField && (
                                    <Badge
                                        variant="secondary"
                                        className="bg-maroon-100 text-maroon-800 text-xs"
                                    >
                                        Career Field: {filterCareerField}
                                        <button
                                            onClick={() => setFilterCareerField('')}
                                            className="ml-1 hover:text-maroon-900"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                )}
                            </div>
                        )}
                        <div className="flex justify-end mt-4">
                            <DropdownMenu open={filtersOpen} onOpenChange={setFiltersOpen}>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="border-maroon-300 dark:border-maroon-700 text-maroon-700 dark:text-maroon-300 hover:bg-maroon-50 dark:hover:bg-maroon-900/30"
                                    >
                                        <Filter className="h-4 w-4 mr-2" />
                                        More Filters
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuItem onClick={() => setFilterStatus('employed')}>
                                        Filter by: Employed
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterStatus('unemployed')}>
                                        Filter by: Unemployed
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterStatus('self-employed')}>
                                        Filter by: Self-employed
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterStatus('pursuing_education')}>
                                        Filter by: Pursuing Education
                                    </DropdownMenuItem>
                                    {availableYears.map((year) => (
                                        <DropdownMenuItem key={year} onClick={() => setFilterYear(year.toString())}>
                                            Filter by: Class of {year}
                                        </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setFilterStatus('');
                                            setFilterYear('');
                                            setFilterJobTitle('');
                                            setFilterEmployer('');
                                            setFilterCareerField('');
                                        }}
                                        className="text-red-600"
                                    >
                                        Clear All Filters
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardContent>
                </Card>

                {/* Alumni Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-maroon-800 dark:text-maroon-200">Total Alumni</CardTitle>
                            <Users className="h-4 w-4 text-maroon-600 dark:text-maroon-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-maroon-800 dark:text-maroon-200">{total}</div>
                            <p className="text-xs text-maroon-600 dark:text-maroon-400 mt-1">Registered profiles</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Alumni Table */}
                <Card className="border-beige-200 dark:border-gray-700 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl text-maroon-800 dark:text-maroon-200">Alumni Directory</CardTitle>
                        <CardDescription className="text-maroon-600 dark:text-maroon-400">
                            Showing {alumni.length} of {total} alumni
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-beige-100 dark:divide-gray-700">
                            {alumni.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                                    <Users className="h-12 w-12 mb-3 text-gray-300 dark:text-gray-600" />
                                    <p className="text-lg font-medium mb-1">No alumni found</p>
                                    <p className="text-sm text-center px-4">
                                        {debouncedSearchTerm || filterStatus || filterYear || filterJobTitle || filterEmployer || filterCareerField
                                            ? 'Try adjusting your filters or search term'
                                            : 'No alumni profiles have been added yet'}
                                    </p>
                                </div>
                            ) : (
                                alumni.map((alumnus) => (
                                    <div key={alumnus.id} className="p-4 hover:bg-beige-50 dark:hover:bg-gray-800/50">
                                        <div className="flex items-start gap-3">
                                            <Checkbox
                                                checked={multiSelect.isSelected(alumnus.id)}
                                                onCheckedChange={() => multiSelect.toggleItem(alumnus.id)}
                                                className="mt-1"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div>
                                                        <div className="font-medium text-maroon-800 dark:text-maroon-200 flex items-center gap-1.5">
                                                            {alumnus.first_name} {alumnus.last_name}
                                                            {alumnus.import_source && (
                                                                <Badge variant="secondary" className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-1.5 py-0">Imported</Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">ID: {alumnus.id}</div>
                                                    </div>
                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        {getEmploymentStatusBadge(alumnus.employment_status)}
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-700 dark:text-gray-300">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => handleViewAlumni(alumnus)}>
                                                                    <Eye className="h-4 w-4 mr-2" />View
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleContactAlumni(alumnus)} className="text-blue-700">
                                                                    <MessageCircle className="h-4 w-4 mr-2" />Contact
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleEditAlumni(alumnus)} className="text-green-700">
                                                                    <Edit className="h-4 w-4 mr-2" />Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleDeleteAlumni(alumnus)} className="text-red-700">
                                                                    <Trash2 className="h-4 w-4 mr-2" />Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                                <div className="mt-2 grid grid-cols-1 gap-1.5 text-sm">
                                                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                                                        <GraduationCap className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-gray-400" />
                                                        <span className="truncate">{alumnus.degree_program} &middot; Class of {alumnus.graduation_year}</span>
                                                    </div>
                                                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                                                        <Mail className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-gray-400" />
                                                        <span className="truncate">{getAlumniEmail(alumnus)}</span>
                                                    </div>
                                                    {alumnus.phone && (
                                                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                                                            <Phone className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-gray-400" />
                                                            {alumnus.phone}
                                                        </div>
                                                    )}
                                                    {alumnus.current_job_title && (
                                                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                                                            <Building className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-gray-400" />
                                                            <span className="truncate">{alumnus.current_job_title}{alumnus.current_employer ? ` at ${alumnus.current_employer}` : ''}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-beige-50 dark:bg-gray-800/50">
                                        <TableHead className="w-12">
                                            <SelectAllCheckbox
                                                checked={multiSelect.isAllSelected(alumni.map(a => a.id))}
                                                indeterminate={multiSelect.isIndeterminate(alumni.map(a => a.id))}
                                                onCheckedChange={() => multiSelect.toggleAll(alumni.map(a => a.id))}
                                                label=""
                                            />
                                        </TableHead>
                                        <TableHead className="text-maroon-800 dark:text-maroon-200 font-semibold">Name</TableHead>
                                        <TableHead className="text-maroon-800 dark:text-maroon-200 font-semibold">Contact</TableHead>
                                        <TableHead className="text-maroon-800 dark:text-maroon-200 font-semibold">Education</TableHead>
                                        <TableHead className="text-maroon-800 dark:text-maroon-200 font-semibold">Employment</TableHead>
                                        <TableHead className="text-maroon-800 dark:text-maroon-200 font-semibold">Status</TableHead>
                                        <TableHead className="text-maroon-800 dark:text-maroon-200 font-semibold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {alumni.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-32 text-center">
                                                <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                                                    <Users className="h-12 w-12 mb-3 text-gray-300 dark:text-gray-600" />
                                                    <p className="text-lg font-medium mb-1">No alumni found</p>
                                                    <p className="text-sm">
                                                        {debouncedSearchTerm || filterStatus || filterYear || filterJobTitle || filterEmployer || filterCareerField
                                                            ? 'Try adjusting your filters or search term'
                                                            : 'No alumni profiles have been added yet'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        alumni.map((alumnus) => (
                                            <TableRow key={alumnus.id} className="hover:bg-beige-50 dark:hover:bg-gray-800/50">
                                                <TableCell>
                                                    <Checkbox
                                                        checked={multiSelect.isSelected(alumnus.id)}
                                                        onCheckedChange={() => multiSelect.toggleItem(alumnus.id)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-maroon-800 dark:text-maroon-200 flex items-center gap-1.5">
                                                        {alumnus.first_name} {alumnus.last_name}
                                                        {alumnus.import_source && (
                                                            <Badge variant="secondary" className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-1.5 py-0">Imported</Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">ID: {alumnus.id}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center text-sm dark:text-gray-300">
                                                            <Mail className="h-3 w-3 mr-1 text-gray-400 dark:text-gray-500" />
                                                            {getAlumniEmail(alumnus)}
                                                        </div>
                                                        {alumnus.phone && (
                                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                                <Phone className="h-3 w-3 mr-1 text-gray-400 dark:text-gray-500" />
                                                                {alumnus.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center text-sm font-medium dark:text-gray-200">
                                                            <GraduationCap className="h-3 w-3 mr-1 text-gray-400 dark:text-gray-500" />
                                                            {alumnus.degree_program}
                                                        </div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            Class of {alumnus.graduation_year}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        {alumnus.current_job_title && (
                                                            <div className="text-sm font-medium dark:text-gray-200">
                                                                {alumnus.current_job_title}
                                                            </div>
                                                        )}
                                                        {alumnus.current_employer && (
                                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                                <Building className="h-3 w-3 mr-1 text-gray-400 dark:text-gray-500" />
                                                                {alumnus.current_employer}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getEmploymentStatusBadge(alumnus.employment_status)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewAlumni(alumnus)}
                                                            className="text-maroon-700 dark:text-maroon-300 hover:text-maroon-800 dark:hover:text-maroon-200 hover:bg-maroon-50 dark:hover:bg-maroon-900/30"
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>

                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-gray-700 dark:text-gray-300 hover:text-maroon-800 dark:hover:text-maroon-200 hover:bg-maroon-50 dark:hover:bg-maroon-900/30"
                                                                >
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onClick={() => handleContactAlumni(alumnus)}
                                                                    className="text-blue-700 focus:text-blue-800"
                                                                >
                                                                    <MessageCircle className="h-4 w-4 mr-2" />
                                                                    Contact
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => handleEditAlumni(alumnus)}
                                                                    className="text-green-700 focus:text-green-800"
                                                                >
                                                                    <Edit className="h-4 w-4 mr-2" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDeleteAlumni(alumnus)}
                                                                    className="text-red-700 focus:text-red-800"
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-6 py-4 border-t border-beige-200 dark:border-gray-700">
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                    Page {currentPage} of {totalPages}
                                </div>
                                <div className="space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="border-maroon-300 dark:border-maroon-700 text-maroon-700 dark:text-maroon-300 hover:bg-maroon-50 dark:hover:bg-maroon-900/30"
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="border-maroon-300 dark:border-maroon-700 text-maroon-700 dark:text-maroon-300 hover:bg-maroon-50 dark:hover:bg-maroon-900/30"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Alumni Detail Modal */}
            <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-maroon-800 dark:text-maroon-200">
                            Alumni Profile Details
                        </DialogTitle>
                        <DialogDescription className="dark:text-gray-400">
                            Detailed information about the selected alumni
                        </DialogDescription>
                    </DialogHeader>

                    {selectedAlumni && (
                        <div className="space-y-6">
                            {/* Personal Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="border-beige-200 dark:border-gray-700">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg text-maroon-800 dark:text-maroon-200 flex items-center">
                                            <Users className="h-5 w-5 mr-2" />
                                            Personal Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Full Name</label>
                                            <p className="text-sm text-gray-900 dark:text-gray-200">
                                                {selectedAlumni.first_name} {selectedAlumni.last_name}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                                            <p className="text-sm text-gray-900 dark:text-gray-200 flex items-center">
                                                <Mail className="h-3 w-3 mr-1" />
                                                {getAlumniEmail(selectedAlumni)}
                                            </p>
                                        </div>
                                        {selectedAlumni.phone && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
                                                <p className="text-sm text-gray-900 dark:text-gray-200 flex items-center">
                                                    <Phone className="h-3 w-3 mr-1" />
                                                    {selectedAlumni.phone}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="border-beige-200">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg text-maroon-800 flex items-center">
                                            <GraduationCap className="h-5 w-5 mr-2" />
                                            Education
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Degree Program</label>
                                            <p className="text-sm text-gray-900">{selectedAlumni.degree_program}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Graduation Year</label>
                                            <p className="text-sm text-gray-900">Class of {selectedAlumni.graduation_year}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Employment Information */}
                            <Card className="border-beige-200">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg text-maroon-800 flex items-center">
                                        <Building className="h-5 w-5 mr-2" />
                                        Employment Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Employment Status</label>
                                            <div className="mt-1">
                                                {getEmploymentStatusBadge(selectedAlumni.employment_status)}
                                            </div>
                                        </div>
                                        {selectedAlumni.current_job_title && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600">Job Title</label>
                                                <p className="text-sm text-gray-900">{selectedAlumni.current_job_title}</p>
                                            </div>
                                        )}
                                    </div>
                                    {selectedAlumni.current_employer && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Current Employer</label>
                                            <p className="text-sm text-gray-900">{selectedAlumni.current_employer}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-2 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => handleContactAlumni(selectedAlumni)}
                                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                >
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Contact Alumni
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        handleEditAlumni(selectedAlumni);
                                        setViewModalOpen(false);
                                    }}
                                    className="border-green-300 text-green-700 hover:bg-green-50"
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Profile
                                </Button>
                                <Button
                                    onClick={() => setViewModalOpen(false)}
                                    className="bg-maroon-700 hover:bg-maroon-800"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Alumni Modal */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-maroon-800">
                            Edit Alumni Profile
                        </DialogTitle>
                        <DialogDescription>
                            Update the selected alumni's information
                        </DialogDescription>
                    </DialogHeader>

                    {editFormData && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">First Name</label>
                                    <Input
                                        value={editFormData.first_name || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Last Name</label>
                                    <Input
                                        value={editFormData.last_name || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Email</label>
                                <Input
                                    type="email"
                                    value={editFormData.email || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Phone</label>
                                <Input
                                    value={editFormData.phone || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Degree Program</label>
                                <Input
                                    value={editFormData.degree_program || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, degree_program: e.target.value })}
                                    className="mt-1"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Graduation Year</label>
                                    <Input
                                        type="number"
                                        value={editFormData.graduation_year || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, graduation_year: parseInt(e.target.value) })}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Employment Status</label>
                                    <select
                                        value={editFormData.employment_status || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, employment_status: e.target.value })}
                                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-maroon-500 focus:ring-maroon-500"
                                    >
                                        <option value="">Select Status</option>
                                        <option value="employed_full_time">Employed (Full-Time)</option>
                                        <option value="employed_part_time">Employed (Part-Time)</option>
                                        <option value="self_employed">Self-Employed</option>
                                        <option value="unemployed_seeking">Unemployed (Seeking)</option>
                                        <option value="unemployed_not_seeking">Unemployed (Not Seeking)</option>
                                        <option value="continuing_education">Continuing Education</option>
                                        <option value="military_service">Military Service</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Current Employer</label>
                                    <Input
                                        value={editFormData.current_employer || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, current_employer: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Job Title</label>
                                    <Input
                                        value={editFormData.current_job_title || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, current_job_title: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => setEditModalOpen(false)}
                                    disabled={updating}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleUpdateAlumni}
                                    disabled={updating}
                                    className="bg-maroon-700 hover:bg-maroon-800"
                                >
                                    {updating ? 'Updating...' : 'Update Alumni'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Add Alumni Dialog */}
            <Dialog open={addModalOpen} onOpenChange={(open) => { setAddModalOpen(open); if (!open) { setAddStep(0); setAddFormData(initialAddFormData); } }}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-maroon-800 flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            Add New Alumni
                        </DialogTitle>
                        <DialogDescription>
                            Create a new alumni profile with a user account. A default password will be set.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Step Indicators */}
                    <div className="flex items-center justify-center gap-2 my-3">
                        {['Personal Info', 'School Info', 'Employment', 'Additional'].map((label, i) => (
                            <React.Fragment key={label}>
                                <button
                                    onClick={() => setAddStep(i)}
                                    className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors cursor-pointer ${addStep === i ? 'bg-maroon-600 text-white' :
                                            addStep > i ? 'bg-green-500 text-white' :
                                                'bg-gray-200 text-gray-500'
                                        }`}
                                >
                                    {addStep > i ? '✓' : i + 1}
                                </button>
                                {i < 3 && <div className={`w-8 h-0.5 ${addStep > i ? 'bg-green-500' : 'bg-gray-200'}`} />}
                            </React.Fragment>
                        ))}
                    </div>
                    <p className="text-center text-sm text-gray-500 mb-2">
                        {['Personal Information', 'School Information', 'Employment', 'Achievements & About'][addStep]}
                    </p>

                    {/* Step 0: Personal Information */}
                    {addStep === 0 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>First Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={addFormData.first_name}
                                        onChange={(e) => setAddFormData({ ...addFormData, first_name: e.target.value })}
                                        placeholder="Enter first name"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label>Last Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={addFormData.last_name}
                                        onChange={(e) => setAddFormData({ ...addFormData, last_name: e.target.value })}
                                        placeholder="Enter last name"
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Maiden Name / Pre-Marital Name</Label>
                                    <Input
                                        value={addFormData.maiden_name}
                                        onChange={(e) => setAddFormData({ ...addFormData, maiden_name: e.target.value })}
                                        placeholder="For married females"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label>Student ID</Label>
                                    <Input
                                        value={addFormData.student_id}
                                        onChange={(e) => setAddFormData({ ...addFormData, student_id: e.target.value })}
                                        placeholder="e.g. 2020-12345"
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Email <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="email"
                                        value={addFormData.email}
                                        onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                                        placeholder="Enter email address"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label>Age</Label>
                                    <Input
                                        type="number"
                                        value={addFormData.age}
                                        onChange={(e) => setAddFormData({ ...addFormData, age: e.target.value })}
                                        placeholder="e.g. 25"
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Gender</Label>
                                    <RadioGroup
                                        value={addFormData.gender}
                                        onValueChange={(val) => setAddFormData({ ...addFormData, gender: val })}
                                        className="flex gap-4 mt-2"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="Male" id="add-male" />
                                            <Label htmlFor="add-male" className="font-normal">Male</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="Female" id="add-female" />
                                            <Label htmlFor="add-female" className="font-normal">Female</Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                                <div>
                                    <Label>Civil Status</Label>
                                    <select
                                        value={addFormData.civil_status}
                                        onChange={(e) => setAddFormData({ ...addFormData, civil_status: e.target.value })}
                                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500"
                                    >
                                        <option value="">Select</option>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Separated">Separated</option>
                                        <option value="Widowed">Widowed</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Place of Birth</Label>
                                    <Input
                                        value={addFormData.place_of_birth}
                                        onChange={(e) => setAddFormData({ ...addFormData, place_of_birth: e.target.value })}
                                        placeholder="City, Province"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label>Spouse Name</Label>
                                    <Input
                                        value={addFormData.spouse_name}
                                        onChange={(e) => setAddFormData({ ...addFormData, spouse_name: e.target.value })}
                                        placeholder="If married"
                                        className="mt-1"
                                        disabled={addFormData.civil_status !== 'Married'}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label>No. of Children</Label>
                                    <Input
                                        type="number"
                                        value={addFormData.number_of_children}
                                        onChange={(e) => setAddFormData({ ...addFormData, number_of_children: e.target.value })}
                                        placeholder="0"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label>Tel. No.</Label>
                                    <Input
                                        value={addFormData.phone}
                                        onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                                        placeholder="Landline number"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label>Mobile No.</Label>
                                    <Input
                                        value={addFormData.mobile_no}
                                        onChange={(e) => setAddFormData({ ...addFormData, mobile_no: e.target.value })}
                                        placeholder="09XX XXX XXXX"
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Residence / Mailing Address</Label>
                                <Textarea
                                    value={addFormData.current_address}
                                    onChange={(e) => setAddFormData({ ...addFormData, current_address: e.target.value })}
                                    placeholder="Full address"
                                    className="mt-1"
                                    rows={2}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 1: School Information */}
                    {addStep === 1 && (
                        <div className="space-y-4">
                            <div>
                                <Label>Campus / College <span className="text-red-500">*</span></Label>
                                <select
                                    value={addFormData.campus_id}
                                    onChange={(e) => setAddFormData({ ...addFormData, campus_id: e.target.value, department_id: '', course_id: '' })}
                                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500"
                                >
                                    <option value="">Select Campus</option>
                                    {addCampuses.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <Label>Department</Label>
                                <select
                                    value={addFormData.department_id}
                                    onChange={(e) => setAddFormData({ ...addFormData, department_id: e.target.value, course_id: '' })}
                                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500"
                                    disabled={!addFormData.campus_id || loadingAddDepts}
                                >
                                    <option value="">{loadingAddDepts ? 'Loading...' : 'Select Department'}</option>
                                    {addDepartments.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <Label>Course (includes Major)</Label>
                                <select
                                    value={addFormData.course_id}
                                    onChange={(e) => {
                                        const selectedCourse = addCourses.find(c => c.id === parseInt(e.target.value));
                                        setAddFormData({
                                            ...addFormData,
                                            course_id: e.target.value,
                                            degree_program: selectedCourse?.name || addFormData.degree_program
                                        });
                                    }}
                                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500"
                                    disabled={!addFormData.department_id || loadingAddCourses}
                                >
                                    <option value="">{loadingAddCourses ? 'Loading...' : 'Select Course'}</option>
                                    {addCourses.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Degree Program</Label>
                                    <Input
                                        value={addFormData.degree_program}
                                        onChange={(e) => setAddFormData({ ...addFormData, degree_program: e.target.value })}
                                        placeholder="e.g. BS Information Technology"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label>Major</Label>
                                    <Input
                                        value={addFormData.major}
                                        onChange={(e) => setAddFormData({ ...addFormData, major: e.target.value })}
                                        placeholder="Specialization"
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Year Graduated</Label>
                                    <Input
                                        type="number"
                                        value={addFormData.graduation_year}
                                        onChange={(e) => setAddFormData({ ...addFormData, graduation_year: parseInt(e.target.value) || new Date().getFullYear() })}
                                        min="1978"
                                        max="2030"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label>Year Enrolled</Label>
                                    <Input
                                        type="number"
                                        value={addFormData.enrollment_year}
                                        onChange={(e) => setAddFormData({ ...addFormData, enrollment_year: e.target.value })}
                                        min="1970"
                                        max="2030"
                                        placeholder="e.g. 2016"
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Honor / Awards Received</Label>
                                <Textarea
                                    value={addFormData.honors_awards}
                                    onChange={(e) => setAddFormData({ ...addFormData, honors_awards: e.target.value })}
                                    placeholder="Cum Laude, Magna Cum Laude, etc."
                                    className="mt-1"
                                    rows={2}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Employment */}
                    {addStep === 2 && (
                        <div className="space-y-4">
                            <div>
                                <Label>Are you presently employed?</Label>
                                <RadioGroup
                                    value={addFormData.presently_employed}
                                    onValueChange={(val) => setAddFormData({ ...addFormData, presently_employed: val })}
                                    className="flex gap-4 mt-2"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Yes" id="add-employed-yes" />
                                        <Label htmlFor="add-employed-yes" className="font-normal">Yes</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="No" id="add-employed-no" />
                                        <Label htmlFor="add-employed-no" className="font-normal">No</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {addFormData.presently_employed === 'Yes' && (
                                <>
                                    <div>
                                        <Label>Where are you employed?</Label>
                                        <RadioGroup
                                            value={addFormData.employment_location}
                                            onValueChange={(val) => setAddFormData({ ...addFormData, employment_location: val })}
                                            className="flex gap-4 mt-2"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="Local" id="add-loc-local" />
                                                <Label htmlFor="add-loc-local" className="font-normal">Local</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="Abroad/Foreign" id="add-loc-abroad" />
                                                <Label htmlFor="add-loc-abroad" className="font-normal">Abroad / Foreign</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Name of Agency / Company</Label>
                                            <Input
                                                value={addFormData.current_employer}
                                                onChange={(e) => setAddFormData({ ...addFormData, current_employer: e.target.value })}
                                                placeholder="Company name"
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label>Address of Company</Label>
                                            <Input
                                                value={addFormData.company_address}
                                                onChange={(e) => setAddFormData({ ...addFormData, company_address: e.target.value })}
                                                placeholder="Company address"
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Present Position / Job Title</Label>
                                            <Input
                                                value={addFormData.current_job_title}
                                                onChange={(e) => setAddFormData({ ...addFormData, current_job_title: e.target.value })}
                                                placeholder="Job title"
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label>Date Hired</Label>
                                            <Input
                                                type="date"
                                                value={addFormData.date_hired}
                                                onChange={(e) => setAddFormData({ ...addFormData, date_hired: e.target.value })}
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Years of Service</Label>
                                            <Input
                                                type="number"
                                                value={addFormData.years_of_service}
                                                onChange={(e) => setAddFormData({ ...addFormData, years_of_service: e.target.value })}
                                                placeholder="e.g. 3"
                                                className="mt-1"
                                                step="0.5"
                                            />
                                        </div>
                                        <div>
                                            <Label>Job aligned to course?</Label>
                                            <RadioGroup
                                                value={addFormData.job_aligned_to_course}
                                                onValueChange={(val) => setAddFormData({ ...addFormData, job_aligned_to_course: val })}
                                                className="flex gap-4 mt-2"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="Yes" id="add-aligned-yes" />
                                                    <Label htmlFor="add-aligned-yes" className="font-normal">Yes</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="No" id="add-aligned-no" />
                                                    <Label htmlFor="add-aligned-no" className="font-normal">No</Label>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Average Monthly Income</Label>
                                        <select
                                            value={addFormData.average_monthly_income}
                                            onChange={(e) => setAddFormData({ ...addFormData, average_monthly_income: e.target.value })}
                                            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500"
                                        >
                                            <option value="">Select</option>
                                            <option value="Below 5,000.00">Below 5,000.00</option>
                                            <option value="5,001.00 to 10,000.00">5,001.00 to 10,000.00</option>
                                            <option value="15,001.00 to 20,000.00">15,001.00 to 20,000.00</option>
                                            <option value="20,001.00 to 25,000.00">20,001.00 to 25,000.00</option>
                                            <option value="25,001.00 & up">25,001.00 & up</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Employment Status</Label>
                                            <select
                                                value={addFormData.employment_status}
                                                onChange={(e) => setAddFormData({ ...addFormData, employment_status: e.target.value })}
                                                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500"
                                            >
                                                <option value="">Select Status</option>
                                                <option value="Permanent">Permanent</option>
                                                <option value="Temporary/Provisional">Temporary / Provisional</option>
                                                <option value="Contractual">Contractual</option>
                                                <option value="Casual">Casual</option>
                                                <option value="Job Order">Job Order</option>
                                                <option value="Self-Employed">Self-Employed</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label>Job Level Position</Label>
                                            <select
                                                value={addFormData.job_level_position}
                                                onChange={(e) => setAddFormData({ ...addFormData, job_level_position: e.target.value })}
                                                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500"
                                            >
                                                <option value="">Select Level</option>
                                                <option value="Clerical">Clerical</option>
                                                <option value="Supervisory">Supervisory</option>
                                                <option value="Technical">Technical</option>
                                                <option value="Managerial">Managerial</option>
                                                <option value="Professional">Professional</option>
                                                <option value="Self-Employed">Self-Employed</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Major Line of Business</Label>
                                        <select
                                            value={addFormData.major_line_of_business}
                                            onChange={(e) => setAddFormData({ ...addFormData, major_line_of_business: e.target.value })}
                                            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500"
                                        >
                                            <option value="">Select</option>
                                            <option value="Education">Education</option>
                                            <option value="Business">Business</option>
                                            <option value="Manufacturing">Manufacturing</option>
                                            <option value="Hotel/Restaurant">Hotel / Restaurant</option>
                                            <option value="Government">Government</option>
                                            <option value="Information Tech./Arts">Information Tech. / Arts</option>
                                            <option value="Construction/Builder">Construction / Builder</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {addFormData.presently_employed === 'No' && (
                                <div>
                                    <Label>Reason(s) for not being employed</Label>
                                    <Textarea
                                        value={addFormData.not_employed_reason}
                                        onChange={(e) => setAddFormData({ ...addFormData, not_employed_reason: e.target.value })}
                                        placeholder="Please state the reason(s)"
                                        className="mt-1"
                                        rows={3}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Achievements & About */}
                    {addStep === 3 && (
                        <div className="space-y-4">
                            <div>
                                <Label>Achievement / Award Received</Label>
                                <Textarea
                                    value={addFormData.achievements}
                                    onChange={(e) => setAddFormData({ ...addFormData, achievements: e.target.value })}
                                    placeholder="List achievements and awards"
                                    className="mt-1"
                                    rows={4}
                                />
                            </div>

                            <div>
                                <Label>What I Want My EARIST Family to Know About Me</Label>
                                <Textarea
                                    value={addFormData.about_me}
                                    onChange={(e) => setAddFormData({ ...addFormData, about_me: e.target.value })}
                                    placeholder="Share your story with the EARIST community"
                                    className="mt-1"
                                    rows={4}
                                />
                            </div>

                            {/* Summary */}
                            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Ready to Create</h4>
                                <div className="text-sm text-green-700 space-y-1">
                                    <p><strong>Name:</strong> {addFormData.first_name} {addFormData.last_name}</p>
                                    <p><strong>Email:</strong> {addFormData.email}</p>
                                    {addFormData.student_id && <p><strong>Student ID:</strong> {addFormData.student_id}</p>}
                                    {addFormData.degree_program && <p><strong>Program:</strong> {addFormData.degree_program}</p>}
                                    {addFormData.graduation_year && <p><strong>Year Graduated:</strong> {addFormData.graduation_year}</p>}
                                    <p className="text-xs mt-2 text-green-600">A default password (<code>alumni{new Date().getFullYear()}</code>) will be set. The user will be prompted to change it on first login.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => addStep > 0 ? setAddStep(addStep - 1) : setAddModalOpen(false)}
                            disabled={creating}
                        >
                            {addStep > 0 ? (
                                <><ArrowLeft className="h-4 w-4 mr-1" /> Back</>
                            ) : 'Cancel'}
                        </Button>
                        <div className="flex gap-2">
                            {addStep < 3 ? (
                                <Button
                                    onClick={() => setAddStep(addStep + 1)}
                                    className="bg-maroon-700 hover:bg-maroon-800"
                                    disabled={addStep === 0 && (!addFormData.first_name || !addFormData.last_name || !addFormData.email)}
                                >
                                    Next <ArrowRight className="h-4 w-4 ml-1" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleCreateAlumni}
                                    disabled={creating || !addFormData.first_name || !addFormData.last_name || !addFormData.email}
                                    className="bg-maroon-700 hover:bg-maroon-800"
                                >
                                    {creating ? 'Creating...' : 'Create Alumni'}
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <BulkActionBar
                selectedCount={multiSelect.selectedCount}
                onDelete={handleBulkDelete}
                onClear={multiSelect.clearSelection}
                isDeleting={isDeleting}
                totalCount={total}
            />
            <ConfirmDialog open={confirmState.open} title={confirmState.title} message={confirmState.message} confirmLabel={confirmState.confirmLabel} cancelLabel={confirmState.cancelLabel} variant={confirmState.variant} onConfirm={handleConfirm} onCancel={handleCancel} />

            {/* Import Alumni Dialog */}
            <Dialog open={importModalOpen} onOpenChange={handleImportModalClose}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-maroon-800 dark:text-maroon-200 flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5" />
                            Import Alumni from Excel
                        </DialogTitle>
                        <DialogDescription className="text-maroon-600 dark:text-maroon-400">
                            {importStep === 'upload' && 'Upload an Excel file with alumni records to bulk-create accounts.'}
                            {importStep === 'configure' && 'Configure import settings before processing.'}
                            {importStep === 'preview' && 'Review the data before importing.'}
                            {importStep === 'importing' && 'Importing alumni records...'}
                            {importStep === 'results' && 'Import completed. Review the results below.'}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Step Progress */}
                    <div className="flex items-center justify-center gap-2 my-4">
                        {['upload', 'configure', 'preview', 'results'].map((step, i) => (
                            <React.Fragment key={step}>
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors ${importStep === step ? 'bg-maroon-600 text-white' :
                                    ['upload', 'configure', 'preview', 'importing', 'results'].indexOf(importStep) > i ? 'bg-green-500 text-white' :
                                        'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                    }`}>
                                    {['upload', 'configure', 'preview', 'importing', 'results'].indexOf(importStep) > i ? '✓' : i + 1}
                                </div>
                                {i < 3 && <div className={`w-12 h-0.5 ${['upload', 'configure', 'preview', 'importing', 'results'].indexOf(importStep) > i ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Step 1: Upload */}
                    {importStep === 'upload' && (
                        <div className="space-y-4">
                            <div
                                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${importDragOver
                                    ? 'border-maroon-500 bg-maroon-50 dark:bg-maroon-900/20'
                                    : importFile
                                        ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-maroon-400'
                                    }`}
                                onDragOver={(e) => { e.preventDefault(); setImportDragOver(true); }}
                                onDragLeave={() => setImportDragOver(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setImportDragOver(false);
                                    const file = e.dataTransfer.files[0];
                                    if (file) handleImportFileSelect(file);
                                }}
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = '.xlsx,.xls,.csv';
                                    input.onchange = (e) => {
                                        const file = (e.target as HTMLInputElement).files?.[0];
                                        if (file) handleImportFileSelect(file);
                                    };
                                    input.click();
                                }}
                            >
                                {importFile ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                                        <p className="font-medium text-green-700 dark:text-green-400">{importFile.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {(importFile.size / 1024).toFixed(1)} KB — Click or drop to change
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <Upload className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                                        <p className="font-medium text-gray-700 dark:text-gray-300">
                                            Drag & drop your Excel file here
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            or click to browse — Accepts .xlsx, .xls, .csv (max 10MB)
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDownloadTemplate}
                                    className="text-maroon-700 dark:text-maroon-300"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Template
                                </Button>

                                <Button
                                    onClick={handleImportPreview}
                                    disabled={!importFile || importLoading}
                                    className="bg-maroon-700 hover:bg-maroon-800 text-white"
                                >
                                    {importLoading ? (
                                        <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                                    ) : (
                                        <><ArrowRight className="h-4 w-4 mr-2" />Next: Configure</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Configure */}
                    {importStep === 'configure' && importPreviewData && (
                        <div className="space-y-4">
                            {/* Detected Info */}
                            {importPreviewData.detected_department && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2">
                                    <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium text-blue-800 dark:text-blue-200">
                                            Detected department: {importPreviewData.detected_department.name}
                                        </p>
                                        {importPreviewData.header_text && (
                                            <p className="text-blue-600 dark:text-blue-400 mt-1">
                                                From header: "{importPreviewData.header_text}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    <strong>{importPreviewData.total_rows}</strong> rows found in file • <strong>{importPreviewData.duplicates_found}</strong> possible duplicates
                                </p>
                            </div>

                            {/* Warnings */}
                            {importPreviewData.warnings?.length > 0 && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                    <p className="font-medium text-amber-800 dark:text-amber-200 text-sm mb-1 flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" /> Warnings
                                    </p>
                                    <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
                                        {importPreviewData.warnings.map((w: string, i: number) => (
                                            <li key={i}>{w}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Config Form */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Campus <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={importConfig.campus_id}
                                        onChange={(e) => setImportConfig(prev => ({ ...prev, campus_id: e.target.value }))}
                                        className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500"
                                    >
                                        <option value="">Select Campus</option>
                                        <option value="1">EARIST Main Campus</option>
                                        <option value="2">EARIST Cavite Campus</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Department
                                    </label>
                                    <select
                                        value={importConfig.department_id}
                                        onChange={(e) => setImportConfig(prev => ({ ...prev, department_id: e.target.value }))}
                                        className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500"
                                    >
                                        <option value="">Auto-detect from header</option>
                                        {importPreviewData.available_departments?.map((d: any) => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Batch / Graduation Year
                                    </label>
                                    <select
                                        value={importConfig.batch_id}
                                        onChange={(e) => setImportConfig(prev => ({ ...prev, batch_id: e.target.value }))}
                                        className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500"
                                    >
                                        <option value="">Auto-detect / None</option>
                                        {importPreviewData.available_batches?.map((b: any) => (
                                            <option key={b.id} value={b.id}>{b.name} ({b.graduation_year})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Duplicate Action
                                    </label>
                                    <select
                                        value={importConfig.duplicate_action}
                                        onChange={(e) => setImportConfig(prev => ({ ...prev, duplicate_action: e.target.value as 'skip' | 'update' }))}
                                        className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500"
                                    >
                                        <option value="skip">Skip duplicates</option>
                                        <option value="update">Update existing (fill empty fields only)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Preview Table */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data Preview (first rows)</h4>
                                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <table className="min-w-full text-xs">
                                        <thead className="bg-gray-50 dark:bg-gray-800">
                                            <tr>
                                                <th className="px-2 py-1.5 text-left font-medium text-gray-600 dark:text-gray-400">Name</th>
                                                <th className="px-2 py-1.5 text-left font-medium text-gray-600 dark:text-gray-400">Student No.</th>
                                                <th className="px-2 py-1.5 text-left font-medium text-gray-600 dark:text-gray-400">Degree</th>
                                                <th className="px-2 py-1.5 text-left font-medium text-gray-600 dark:text-gray-400">Email</th>
                                                <th className="px-2 py-1.5 text-left font-medium text-gray-600 dark:text-gray-400">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {importPreviewData.preview_rows?.map((row: any, i: number) => (
                                                <tr key={i} className={row.is_duplicate ? 'bg-amber-50 dark:bg-amber-900/10' : ''}>
                                                    <td className="px-2 py-1.5 text-gray-800 dark:text-gray-200">
                                                        {row.first_name} {row.last_name}
                                                        {row.suffix ? ` ${row.suffix}` : ''}
                                                    </td>
                                                    <td className="px-2 py-1.5 text-gray-600 dark:text-gray-400">{row.student_id || '—'}</td>
                                                    <td className="px-2 py-1.5 text-gray-600 dark:text-gray-400">{row.degree_program || '—'}</td>
                                                    <td className="px-2 py-1.5 text-gray-600 dark:text-gray-400">{row.email || '—'}</td>
                                                    <td className="px-2 py-1.5">
                                                        {row.is_duplicate ? (
                                                            <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800">Duplicate</Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800">New</Badge>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Account info notice */}
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                                <p className="font-medium flex items-center gap-1 mb-1">
                                    <Info className="h-4 w-4" /> Account Creation Details
                                </p>
                                <ul className="list-disc list-inside space-y-0.5 text-blue-700 dark:text-blue-300 ml-1">
                                    <li>Login: Student ID (or email if no Student ID)</li>
                                    <li>Default password: lowercase last name (no spaces)</li>
                                    <li>Alumni will be required to change password on first login</li>
                                </ul>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <Button variant="outline" onClick={() => setImportStep('upload')}>
                                    <ArrowLeft className="h-4 w-4 mr-2" />Back
                                </Button>
                                <Button
                                    onClick={handleImportExecute}
                                    disabled={!importConfig.campus_id || importLoading}
                                    className="bg-maroon-700 hover:bg-maroon-800 text-white"
                                >
                                    {importLoading ? (
                                        <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Importing...</>
                                    ) : (
                                        <><Upload className="h-4 w-4 mr-2" />Import {importPreviewData.total_rows} Alumni</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Importing Progress */}
                    {importStep === 'importing' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <RefreshCw className="h-16 w-16 text-maroon-600 dark:text-maroon-400 animate-spin mb-4" />
                            <p className="text-lg font-medium text-maroon-800 dark:text-maroon-200">Importing Alumni Records...</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">This may take a moment. Please don't close this window.</p>
                        </div>
                    )}

                    {/* Step 4: Results */}
                    {importStep === 'results' && importResults && (
                        <div className="space-y-4">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">{importResults.imported}</div>
                                    <div className="text-xs text-green-600 dark:text-green-500">Imported</div>
                                </div>
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{importResults.skipped}</div>
                                    <div className="text-xs text-amber-600 dark:text-amber-500">Skipped</div>
                                </div>
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{importResults.updated || 0}</div>
                                    <div className="text-xs text-blue-600 dark:text-blue-500">Updated</div>
                                </div>
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-red-700 dark:text-red-400">{importResults.errors?.length || 0}</div>
                                    <div className="text-xs text-red-600 dark:text-red-500">Errors</div>
                                </div>
                            </div>

                            {/* Success message */}
                            {importResults.imported > 0 && (
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-green-800 dark:text-green-200">
                                        <p className="font-medium">Successfully imported {importResults.imported} alumni!</p>
                                        <p className="mt-1 text-green-700 dark:text-green-300">
                                            Accounts created with Student ID login and last-name password. Alumni will be prompted to change their password on first login.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Errors list */}
                            {importResults.errors?.length > 0 && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <p className="font-medium text-red-800 dark:text-red-200 text-sm mb-2 flex items-center gap-1">
                                        <XCircle className="h-4 w-4" /> Errors ({importResults.errors.length})
                                    </p>
                                    <div className="max-h-40 overflow-y-auto space-y-1">
                                        {importResults.errors.map((err: any, i: number) => (
                                            <p key={i} className="text-xs text-red-700 dark:text-red-300">
                                                Row {err.row}: {err.error}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={() => handleImportModalClose(false)}
                                    className="bg-maroon-700 hover:bg-maroon-800 text-white"
                                >
                                    Done
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AdminBaseLayout>
    );
}