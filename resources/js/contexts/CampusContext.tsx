import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';

// Campus interface
export interface Campus {
    id: number;
    name: string;
    code: 'MAIN' | 'CAV' | 'ALL';
    display_name: string;
    address: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// Context type definition
interface CampusContextType {
    selectedCampus: Campus | null;
    campuses: Campus[];
    setSelectedCampus: (campus: Campus | null) => void; // Allow null for "All Campuses"
    isLoading: boolean;
    fetchError: boolean;
    canSwitchCampus: boolean;
    refreshCampuses: () => Promise<void>;
    getCampusById: (id: number) => Campus | undefined;
    getCampusByCode: (code: string) => Campus | undefined;
}

// Create context
const CampusContext = createContext<CampusContextType | undefined>(undefined);

// Storage key for persisting selected campus
const CAMPUS_STORAGE_KEY = 'selected_campus_id';

// Provider props
interface CampusProviderProps {
    children: ReactNode;
    userCampusId?: number;
    userRole?: string;
}

export const CampusProvider: React.FC<CampusProviderProps> = ({
    children,
    userCampusId,
    userRole
}) => {
    const [selectedCampus, setSelectedCampusState] = useState<Campus | null>(null);
    const [campuses, setCampuses] = useState<Campus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [canSwitchCampus, setCanSwitchCampus] = useState(false);

    // Fetch campuses on mount
    const fetchCampuses = useCallback(async () => {
        try {
            setIsLoading(true);
            setFetchError(false);
            const response = await axios.get('/api/v1/campuses');

            if (response.data.success) {
                const campusData = response.data.data || response.data.campuses || [];
                setCampuses(campusData);

                // Determine if user can switch campuses (admin/superadmin)
                const adminRoles = ['admin', 'superadmin', 'super_admin'];
                const userCanSwitch = userRole ? adminRoles.includes(userRole.toLowerCase()) : false;
                setCanSwitchCampus(userCanSwitch);

                // Set initial campus
                if (campusData.length > 0) {
                    // Check if there's a stored preference (for admins)
                    const storedCampusId = localStorage.getItem(CAMPUS_STORAGE_KEY);
                    let initialCampus: Campus | null = null;

                    if (userCanSwitch && storedCampusId) {
                        if (storedCampusId === 'all') {
                            // Admin selected "All Campuses"
                            initialCampus = null;
                        } else {
                            // Admin with specific campus preference
                            initialCampus = campusData.find((c: Campus) => c.id === parseInt(storedCampusId));
                        }
                    }

                    if (initialCampus === undefined) {
                        // If stored campus not found, continue with fallback logic
                        if (userCampusId) {
                            // Use user's assigned campus
                            initialCampus = campusData.find((c: Campus) => c.id === userCampusId);
                        }

                        if (!initialCampus) {
                            // Default to first campus (Main) for non-admins
                            initialCampus = userCanSwitch ? null : campusData[0];
                        }
                    }

                    setSelectedCampusState(initialCampus);
                }
            }
        } catch (error) {
            console.error('Failed to fetch campuses:', error);
            // Don't silently set a hardcoded campus — leave empty and let the UI handle it.
            // A retry will be triggered on next mount or manual refresh.
            setCampuses([]);
            setSelectedCampusState(null);
            setFetchError(true);
        } finally {
            setIsLoading(false);
        }
    }, [userCampusId, userRole]);

    useEffect(() => {
        fetchCampuses();
    }, [fetchCampuses]);

    // Handle campus selection
    const setSelectedCampus = useCallback((campus: Campus | null) => {
        setSelectedCampusState(campus);

        // Persist selection for admins
        if (canSwitchCampus) {
            if (campus) {
                localStorage.setItem(CAMPUS_STORAGE_KEY, campus.id.toString());
            } else {
                localStorage.setItem(CAMPUS_STORAGE_KEY, 'all');
            }
        }

        // Dispatch event for components that need to react to campus changes
        window.dispatchEvent(new CustomEvent('campus-changed', { detail: campus }));
    }, [canSwitchCampus]);

    // Refresh campuses
    const refreshCampuses = useCallback(async () => {
        await fetchCampuses();
    }, [fetchCampuses]);

    // Get campus by ID
    const getCampusById = useCallback((id: number): Campus | undefined => {
        return campuses.find(c => c.id === id);
    }, [campuses]);

    // Get campus by code
    const getCampusByCode = useCallback((code: string): Campus | undefined => {
        return campuses.find(c => c.code === code);
    }, [campuses]);

    const contextValue: CampusContextType = {
        selectedCampus,
        campuses,
        setSelectedCampus,
        isLoading,
        fetchError,
        canSwitchCampus,
        refreshCampuses,
        getCampusById,
        getCampusByCode,
    };

    return (
        <CampusContext.Provider value={contextValue}>
            {children}
        </CampusContext.Provider>
    );
};

// Hook to use campus context
export const useCampus = (): CampusContextType => {
    const context = useContext(CampusContext);
    if (context === undefined) {
        throw new Error('useCampus must be used within a CampusProvider');
    }
    return context;
};

// Export context for advanced usage
export { CampusContext };
