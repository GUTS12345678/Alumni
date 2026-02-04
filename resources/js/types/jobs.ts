// Job Board Types

export interface JobCategory {
    id: number;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    color?: string;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;

    // Computed
    jobs_count?: number;
    job_postings_count?: number;
}

export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'temporary';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'executive' | 'any';
export type JobStatus = 'draft' | 'published' | 'closed' | 'expired';
export type WorkArrangement = 'onsite' | 'remote' | 'hybrid';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship';
export type SalaryPeriod = 'hourly' | 'monthly' | 'yearly';

export interface JobPosting {
    id: number;

    // Basic Info
    title: string;
    slug: string;
    company_name: string;
    company_logo?: string;
    company_website?: string;
    description: string;

    // Category & Type
    category_id?: number;
    job_type: JobType;
    employment_type?: EmploymentType;
    experience_level: ExperienceLevel;
    work_arrangement?: WorkArrangement;

    // Location
    location: string;
    is_remote: boolean;

    // Contact Information
    contact_person?: string;
    contact_email?: string;
    contact_phone?: string;

    // External Application
    application_url?: string;
    external_url?: string;
    application_instructions?: string;

    // Salary Info
    salary_range?: string;
    salary_min?: number;
    salary_max?: number;
    salary_currency?: string;
    salary_period?: SalaryPeriod;
    is_salary_visible?: boolean;

    // Additional Info
    benefits?: string;
    requirements?: string;
    qualifications?: string;

    // Dates
    application_deadline?: string;
    start_date?: string;
    expires_at?: string;

    // Status & Tracking
    status: JobStatus;
    is_featured: boolean;
    featured_until?: string;
    views: number;
    views_count?: number;

    // Admin tracking
    created_by: number;
    published_at?: string;

    // Timestamps
    created_at: string;
    updated_at: string;

    // Relationships
    category?: JobCategory;
    creator?: {
        id: number;
        name: string;
    };
}

// Form Types
export interface JobFormData {
    title: string;
    company_name: string;
    company_logo?: string;
    company_website?: string;
    description: string;
    category_id?: number | string;
    job_type?: JobType;
    employment_type?: EmploymentType;
    experience_level?: ExperienceLevel;
    work_arrangement?: WorkArrangement;
    location: string;
    is_remote?: boolean;
    contact_person?: string;
    contact_email?: string;
    contact_phone?: string;
    application_url?: string;
    external_url?: string;
    application_instructions?: string;
    salary_range?: string;
    salary_min?: number;
    salary_max?: number;
    salary_currency?: string;
    salary_period?: SalaryPeriod;
    is_salary_visible?: boolean;
    benefits?: string;
    requirements?: string;
    qualifications?: string;
    application_deadline?: string;
    start_date?: string;
    expires_at?: string;
    status?: JobStatus;
    is_featured?: boolean;
}

export interface CreateJobForm {
    title: string;
    company_name: string;
    company_logo?: File;
    description: string;
    category_id?: number;
    job_type: JobType;
    experience_level: ExperienceLevel;
    location: string;
    is_remote: boolean;
    contact_person?: string;
    contact_email?: string;
    contact_phone?: string;
    application_url?: string;
    application_instructions?: string;
    salary_range?: string;
    benefits?: string;
    requirements?: string;
    qualifications?: string;
    application_deadline?: string;
    start_date?: string;
    status: JobStatus;
    is_featured: boolean;
}

export interface JobFilters {
    search?: string;
    category_id?: number;
    job_type?: JobType;
    experience_level?: ExperienceLevel;
    is_remote?: boolean;
    status?: JobStatus;
}

export interface CreateCategoryForm {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    is_active: boolean;
}

// API Response Types
export interface PaginatedJobsResponse {
    data: JobPosting[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface JobAnalytics {
    total_jobs: number;
    active_jobs: number;
    total_views: number;
    jobs_by_category: {
        category: string;
        count: number;
    }[];
    jobs_by_status: {
        status: JobStatus;
        count: number;
    }[];
    recent_jobs: JobPosting[];
}

// Labels and Display Helpers
export const JOB_TYPE_LABELS: Record<JobType, string> = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    contract: 'Contract',
    internship: 'Internship',
    temporary: 'Temporary',
};

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
    entry: 'Entry Level',
    mid: 'Mid Level',
    senior: 'Senior Level',
    executive: 'Executive',
    any: 'Any Experience',
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
    draft: 'Draft',
    published: 'Published',
    closed: 'Closed',
    expired: 'Expired',
};

export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    published: 'bg-green-100 text-green-800',
    closed: 'bg-red-100 text-red-800',
    expired: 'bg-yellow-100 text-yellow-800',
};
