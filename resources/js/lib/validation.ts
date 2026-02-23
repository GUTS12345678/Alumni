/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Lightweight frontend validation helpers.
 * 
 * Validates form data before sending to server, giving instant feedback.
 * Mirrors common Laravel validation rules.
 * 
 * Usage:
 *   const errors = validate(formData, {
 *     title: [required(), maxLength(255)],
 *     email: [required(), email()],
 *     salary_min: [numeric(), min(0)],
 *     content_type: [required(), oneOf(['announcement', 'job', 'event'])],
 *   });
 * 
 *   if (Object.keys(errors).length > 0) {
 *     setErrors(errors);
 *     return;
 *   }
 */

type ValidationRule = (value: any, field: string, allValues: Record<string, any>) => string | null;

// ============================================
// Core validation function
// ============================================

export function validate(
    values: Record<string, any>,
    rules: Record<string, ValidationRule[]>
): Record<string, string> {
    const errors: Record<string, string> = {};

    for (const [field, fieldRules] of Object.entries(rules)) {
        for (const rule of fieldRules) {
            const error = rule(values[field], field, values);
            if (error) {
                errors[field] = error;
                break; // Stop at first error per field
            }
        }
    }

    return errors;
}

/**
 * Validate and return both boolean result and errors.
 */
export function validateForm(
    values: Record<string, any>,
    rules: Record<string, ValidationRule[]>
): { valid: boolean; errors: Record<string, string> } {
    const errors = validate(values, rules);
    return {
        valid: Object.keys(errors).length === 0,
        errors,
    };
}

// ============================================
// Validation Rules
// ============================================

/** Field is required (non-empty) */
export function required(message?: string): ValidationRule {
    return (value, field) => {
        if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
            return message || `${formatField(field)} is required`;
        }
        return null;
    };
}

/** Conditionally required based on another field's value */
export function requiredIf(otherField: string, otherValue: any, message?: string): ValidationRule {
    return (value, field, allValues) => {
        if (allValues[otherField] === otherValue) {
            return required(message)(value, field, allValues);
        }
        return null;
    };
}

/** Must be a valid email */
export function email(message?: string): ValidationRule {
    return (value, field) => {
        if (!value) return null; // Skip if empty (use required() for that)
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(value)) {
            return message || `${formatField(field)} must be a valid email address`;
        }
        return null;
    };
}

/** Maximum string length */
export function maxLength(max: number, message?: string): ValidationRule {
    return (value, field) => {
        if (!value) return null;
        if (String(value).length > max) {
            return message || `${formatField(field)} must not exceed ${max} characters`;
        }
        return null;
    };
}

/** Minimum string length */
export function minLength(min: number, message?: string): ValidationRule {
    return (value, field) => {
        if (!value) return null;
        if (String(value).length < min) {
            return message || `${formatField(field)} must be at least ${min} characters`;
        }
        return null;
    };
}

/** Must be a number */
export function numeric(message?: string): ValidationRule {
    return (value, field) => {
        if (value === null || value === undefined || value === '') return null;
        if (isNaN(Number(value))) {
            return message || `${formatField(field)} must be a number`;
        }
        return null;
    };
}

/** Minimum numeric value */
export function min(minVal: number, message?: string): ValidationRule {
    return (value, field) => {
        if (value === null || value === undefined || value === '') return null;
        if (Number(value) < minVal) {
            return message || `${formatField(field)} must be at least ${minVal}`;
        }
        return null;
    };
}

/** Maximum numeric value */
export function max(maxVal: number, message?: string): ValidationRule {
    return (value, field) => {
        if (value === null || value === undefined || value === '') return null;
        if (Number(value) > maxVal) {
            return message || `${formatField(field)} must not exceed ${maxVal}`;
        }
        return null;
    };
}

/** Must be one of the given values */
export function oneOf(values: any[], message?: string): ValidationRule {
    return (value, field) => {
        if (!value) return null;
        if (!values.includes(value)) {
            return message || `${formatField(field)} must be one of: ${values.join(', ')}`;
        }
        return null;
    };
}

/** Must be a valid URL */
export function url(message?: string): ValidationRule {
    return (value, field) => {
        if (!value) return null;
        try {
            new URL(value);
            return null;
        } catch {
            return message || `${formatField(field)} must be a valid URL`;
        }
    };
}

/** Must match a regex pattern */
export function pattern(regex: RegExp, message?: string): ValidationRule {
    return (value, field) => {
        if (!value) return null;
        if (!regex.test(String(value))) {
            return message || `${formatField(field)} format is invalid`;
        }
        return null;
    };
}

/** Must be a date string */
export function date(message?: string): ValidationRule {
    return (value, field) => {
        if (!value) return null;
        if (isNaN(Date.parse(value))) {
            return message || `${formatField(field)} must be a valid date`;
        }
        return null;
    };
}

/** Date must be after the given date (or 'now') */
export function after(dateStr: string | 'now', message?: string): ValidationRule {
    return (value, field) => {
        if (!value) return null;
        const compareDate = dateStr === 'now' ? new Date() : new Date(dateStr);
        const valueDate = new Date(value);
        if (valueDate <= compareDate) {
            return message || `${formatField(field)} must be after ${dateStr === 'now' ? 'today' : dateStr}`;
        }
        return null;
    };
}

/** Must be greater than or equal to another field's value */
export function gte(otherField: string, message?: string): ValidationRule {
    return (value, field, allValues) => {
        if (value === null || value === undefined || value === '') return null;
        const otherValue = allValues[otherField];
        if (otherValue !== null && otherValue !== undefined && Number(value) < Number(otherValue)) {
            return message || `${formatField(field)} must be >= ${formatField(otherField)}`;
        }
        return null;
    };
}

/** Must match another field (e.g., password confirmation) */
export function confirmed(confirmField: string, message?: string): ValidationRule {
    return (value, field, allValues) => {
        if (!value) return null;
        if (value !== allValues[confirmField]) {
            return message || `${formatField(field)} must match ${formatField(confirmField)}`;
        }
        return null;
    };
}

// ============================================
// Helpers
// ============================================

/** Convert field_name to Field Name */
function formatField(field: string): string {
    return field
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ============================================
// Pre-built rule sets for common forms
// ============================================

export const contentRules = {
    announcement: {
        title: [required(), maxLength(255)],
        content_type: [required(), oneOf(['announcement', 'job', 'event'])],
        target_type: [required(), oneOf(['all', 'batch', 'department'])],
    },
    job: {
        title: [required(), maxLength(255)],
        content_type: [required(), oneOf(['announcement', 'job', 'event'])],
        company_name: [required(), maxLength(255)],
        category_id: [required()],
        job_type: [required(), oneOf(['full_time', 'part_time', 'contract', 'internship', 'freelance'])],
        work_arrangement: [required(), oneOf(['onsite', 'remote', 'hybrid'])],
        salary_min: [numeric(), min(0)],
        salary_max: [numeric(), min(0), gte('salary_min')],
        contact_email: [email()],
        external_url: [url()],
        company_website: [url()],
    },
    event: {
        title: [required(), maxLength(255)],
        content_type: [required(), oneOf(['announcement', 'job', 'event'])],
    },
};

export const authRules = {
    login: {
        email: [required(), email()],
        password: [required(), minLength(6)],
    },
    register: {
        name: [required(), maxLength(255)],
        email: [required(), email()],
        password: [required(), minLength(8)],
        password_confirmation: [required(), confirmed('password')],
    },
};
