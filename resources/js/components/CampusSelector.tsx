import React from 'react';
import { useCampus, Campus } from '@/contexts/CampusContext';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Building2, MapPin, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CampusSelectorProps {
    showLabel?: boolean;
    className?: string;
    variant?: 'default' | 'compact' | 'minimal';
    disabled?: boolean;
    onChange?: (campus: Campus) => void;
}

export const CampusSelector: React.FC<CampusSelectorProps> = ({
    showLabel = true,
    className,
    variant = 'default',
    disabled = false,
    onChange
}) => {
    const {
        selectedCampus,
        campuses,
        setSelectedCampus,
        canSwitchCampus,
        isLoading
    } = useCampus();

    // Handle campus change
    const handleCampusChange = (value: string) => {
        if (value === 'all') {
            setSelectedCampus(null); // null means "All Campuses"
            onChange?.(null as any);
        } else {
            const campus = campuses.find(c => c.id.toString() === value);
            if (campus) {
                setSelectedCampus(campus);
                onChange?.(campus);
            }
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
                <Loader2 className="h-4 w-4 animate-spin" />
                {variant !== 'minimal' && <span className="text-sm">Loading...</span>}
            </div>
        );
    }

    // Non-switchable user view (alumni/staff locked to their campus)
    if (!canSwitchCampus && selectedCampus) {
        if (variant === 'minimal') {
            return (
                <Badge variant="outline" className={cn("font-normal", className)}>
                    <Building2 className="h-3 w-3 mr-1" />
                    {selectedCampus.code}
                </Badge>
            );
        }

        return (
            <div className={cn("flex items-center gap-2", className)}>
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                    {showLabel && variant === 'default' && (
                        <span className="text-xs text-muted-foreground">Campus</span>
                    )}
                    <span className="text-sm font-medium">{selectedCampus.display_name}</span>
                </div>
            </div>
        );
    }

    // Admin/SuperAdmin switchable view
    if (variant === 'minimal') {
        return (
            <Select
                value={selectedCampus?.id.toString() || 'all'}
                onValueChange={handleCampusChange}
                disabled={disabled}
            >
                <SelectTrigger className={cn("w-[130px] h-8", className)}>
                    <SelectValue placeholder="Campus" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">
                        <span className="font-semibold text-primary">All Campuses</span>
                    </SelectItem>
                    {campuses.map((campus) => (
                        <SelectItem key={campus.id} value={campus.id.toString()}>
                            {campus.code}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    }

    if (variant === 'compact') {
        return (
            <Select
                value={selectedCampus?.id.toString() || 'all'}
                onValueChange={handleCampusChange}
                disabled={disabled}
            >
                <SelectTrigger className={cn("w-[200px]", className)}>
                    <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <SelectValue placeholder="Select campus" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-primary">All Campuses</span>
                        </div>
                    </SelectItem>
                    {campuses.map((campus) => (
                        <SelectItem key={campus.id} value={campus.id.toString()}>
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{campus.code}</span>
                                <span className="text-muted-foreground">-</span>
                                <span>{campus.name.replace('EARIST ', '')}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    }

    // Default variant
    return (
        <div className={cn("flex items-center gap-2", className)}>
            {showLabel && (
                <span className="text-sm text-muted-foreground">Campus:</span>
            )}
            <Select
                value={selectedCampus?.id.toString() || 'all'}
                onValueChange={handleCampusChange}
                disabled={disabled}
            >
                <SelectTrigger className="w-[240px]">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Select campus" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">
                        <div className="flex flex-col items-start">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-primary">All Campuses</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span>Combined view of all campus data</span>
                            </div>
                        </div>
                    </SelectItem>
                    {campuses.map((campus) => (
                        <SelectItem key={campus.id} value={campus.id.toString()}>
                            <div className="flex flex-col items-start">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{campus.display_name}</span>
                                </div>
                                {campus.address && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <MapPin className="h-3 w-3" />
                                        <span>{campus.address}</span>
                                    </div>
                                )}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

// Standalone campus badge for display purposes
interface CampusBadgeProps {
    campus?: Campus | null;
    campusId?: number;
    showIcon?: boolean;
    className?: string;
}

export const CampusBadge: React.FC<CampusBadgeProps> = ({
    campus,
    campusId,
    showIcon = true,
    className
}) => {
    const { getCampusById } = useCampus();

    const displayCampus = campus || (campusId ? getCampusById(campusId) : null);

    if (!displayCampus) {
        return null;
    }

    return (
        <Badge variant="outline" className={cn("font-normal", className)}>
            {showIcon && <Building2 className="h-3 w-3 mr-1" />}
            {displayCampus.code}
        </Badge>
    );
};

export default CampusSelector;
