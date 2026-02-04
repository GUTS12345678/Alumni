import { useMemo, useCallback } from 'react';
import { useCampus, Campus } from '@/contexts/CampusContext';

/**
 * Generic interface for items with campus_id
 */
interface CampusAwareItem {
    campus_id?: number | null;
    is_multi_campus?: boolean;
}

/**
 * Hook to filter data by the currently selected campus
 * 
 * @param data - Array of items to filter
 * @param options - Filter options
 * @returns Filtered array based on selected campus
 * 
 * @example
 * // Basic usage
 * const filteredAlumni = useCampusFilter(alumni);
 * 
 * @example
 * // Include multi-campus items (like surveys visible to all)
 * const filteredSurveys = useCampusFilter(surveys, { includeMultiCampus: true });
 * 
 * @example
 * // Custom campus ID field
 * const filteredItems = useCampusFilter(items, { campusIdField: 'applicant_campus_id' });
 */
export function useCampusFilter<T extends Record<string, any>>(
    data: T[] | undefined | null,
    options: {
        includeMultiCampus?: boolean;
        campusIdField?: string;
        disabled?: boolean;
    } = {}
): T[] {
    const { selectedCampus } = useCampus();
    const {
        includeMultiCampus = false,
        campusIdField = 'campus_id',
        disabled = false
    } = options;

    return useMemo(() => {
        // Return empty array if no data
        if (!data) return [];

        // Return all data if filtering is disabled
        if (disabled) return data;

        // Return all data if no campus is selected
        if (!selectedCampus) return data;

        return data.filter((item) => {
            const itemCampusId = item[campusIdField];

            // Include items with matching campus_id
            if (itemCampusId === selectedCampus.id) {
                return true;
            }

            // Include multi-campus items if option is enabled
            if (includeMultiCampus && item.is_multi_campus === true) {
                return true;
            }

            // Include items with null campus_id if multi-campus is enabled
            // (null campus means "all campuses" in some cases)
            if (includeMultiCampus && itemCampusId === null) {
                return true;
            }

            return false;
        });
    }, [data, selectedCampus, includeMultiCampus, campusIdField, disabled]);
}

/**
 * Hook to get campus-filtered query parameters
 * 
 * @returns Object with campus_id parameter for API calls
 * 
 * @example
 * const { campusParams } = useCampusParams();
 * const response = await axios.get('/api/alumni', { params: campusParams });
 */
export function useCampusParams() {
    const { selectedCampus, isLoading } = useCampus();

    const campusParams = useMemo(() => {
        if (!selectedCampus) return {};
        return { campus_id: selectedCampus.id };
    }, [selectedCampus]);

    const appendCampusToUrl = useCallback((url: string): string => {
        if (!selectedCampus) return url;

        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}campus_id=${selectedCampus.id}`;
    }, [selectedCampus]);

    return {
        campusParams,
        campusId: selectedCampus?.id,
        campusCode: selectedCampus?.code,
        appendCampusToUrl,
        isLoading,
    };
}

/**
 * Hook to check if an item belongs to the current campus
 * 
 * @example
 * const { belongsToCampus, isMultiCampusVisible } = useCampusBelonging();
 * 
 * if (belongsToCampus(alumni)) {
 *   // Show alumni
 * }
 */
export function useCampusBelonging() {
    const { selectedCampus } = useCampus();

    const belongsToCampus = useCallback((item: CampusAwareItem | null | undefined): boolean => {
        if (!item) return false;
        if (!selectedCampus) return true; // No campus filter active

        return item.campus_id === selectedCampus.id;
    }, [selectedCampus]);

    const isMultiCampusVisible = useCallback((item: CampusAwareItem | null | undefined): boolean => {
        if (!item) return false;
        if (!selectedCampus) return true;

        // Visible if belongs to campus OR is multi-campus
        return item.campus_id === selectedCampus.id ||
            item.is_multi_campus === true ||
            item.campus_id === null;
    }, [selectedCampus]);

    return {
        belongsToCampus,
        isMultiCampusVisible,
        currentCampusId: selectedCampus?.id,
    };
}

/**
 * Hook for campus-aware form handling
 * 
 * @example
 * const { defaultCampusId, shouldIncludeCampusField } = useCampusForm();
 * 
 * const formData = {
 *   ...otherFields,
 *   campus_id: defaultCampusId,
 * };
 */
export function useCampusForm() {
    const { selectedCampus, canSwitchCampus, campuses } = useCampus();

    // Default campus ID for new records
    const defaultCampusId = selectedCampus?.id || 1;

    // Whether to show campus selection in forms
    // Only admins who can switch campuses should see campus selection
    const shouldShowCampusSelector = canSwitchCampus && campuses.length > 1;

    // Get campus options for select fields
    const campusOptions = useMemo(() => {
        return campuses.map(campus => ({
            value: campus.id.toString(),
            label: campus.display_name,
        }));
    }, [campuses]);

    return {
        defaultCampusId,
        shouldShowCampusSelector,
        campusOptions,
        selectedCampus,
        campuses,
    };
}

/**
 * Hook to listen for campus changes
 * 
 * @param callback - Function to call when campus changes
 * 
 * @example
 * useCampusChange((campus) => {
 *   // Refetch data for new campus
 *   fetchData(campus.id);
 * });
 */
export function useCampusChange(callback: (campus: Campus) => void) {
    const { selectedCampus } = useCampus();

    useMemo(() => {
        if (selectedCampus) {
            callback(selectedCampus);
        }
    }, [selectedCampus, callback]);
}

// Default export for convenience
export default useCampusFilter;
