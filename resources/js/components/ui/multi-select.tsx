import React, { useState } from 'react';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { Trash2, X } from 'lucide-react';

interface BulkActionBarProps {
    selectedCount: number;
    onDelete: () => void;
    onClear: () => void;
    isDeleting?: boolean;
    totalCount?: number;
}

export function BulkActionBar({
    selectedCount,
    onDelete,
    onClear,
    isDeleting = false,
    totalCount
}: BulkActionBarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
            <div className="bg-maroon-700 dark:bg-maroon-800 text-white rounded-full shadow-2xl px-6 py-4 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <Checkbox checked={true} className="border-white" />
                    <span className="font-semibold">
                        {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
                        {totalCount && ` of ${totalCount}`}
                    </span>
                </div>

                <div className="h-6 w-px bg-maroon-500"></div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="text-white hover:bg-maroon-600 dark:hover:bg-maroon-700"
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="text-white hover:bg-maroon-600 dark:hover:bg-maroon-700"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

interface SelectAllCheckboxProps {
    checked: boolean;
    indeterminate?: boolean;
    onCheckedChange: (checked: boolean) => void;
    label?: string;
}

export function SelectAllCheckbox({
    checked,
    indeterminate,
    onCheckedChange,
    label = 'Select all'
}: SelectAllCheckboxProps) {
    return (
        <div className="flex items-center space-x-2">
            <Checkbox
                checked={checked}
                onCheckedChange={onCheckedChange}
                className={indeterminate ? 'data-[state=checked]:bg-maroon-600' : ''}
            />
            {label && (
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                    {label}
                </label>
            )}
        </div>
    );
}

interface UseMultiSelectReturn<T> {
    selectedItems: Set<T>;
    isSelected: (id: T) => boolean;
    toggleItem: (id: T) => void;
    toggleAll: (allIds: T[]) => void;
    clearSelection: () => void;
    selectAll: (allIds: T[]) => void;
    selectedCount: number;
    isAllSelected: (allIds: T[]) => boolean;
    isIndeterminate: (allIds: T[]) => boolean;
}

export function useMultiSelect<T = number>(): UseMultiSelectReturn<T> {
    const [selectedItems, setSelectedItems] = useState<Set<T>>(new Set());

    const isSelected = (id: T) => selectedItems.has(id);

    const toggleItem = (id: T) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const selectAll = (allIds: T[]) => {
        setSelectedItems(new Set(allIds));
    };

    const clearSelection = () => {
        setSelectedItems(new Set());
    };

    const toggleAll = (allIds: T[]) => {
        if (selectedItems.size === allIds.length) {
            clearSelection();
        } else {
            selectAll(allIds);
        }
    };

    const isAllSelected = (allIds: T[]) => {
        return allIds.length > 0 && selectedItems.size === allIds.length;
    };

    const isIndeterminate = (allIds: T[]) => {
        return selectedItems.size > 0 && selectedItems.size < allIds.length;
    };

    return {
        selectedItems,
        isSelected,
        toggleItem,
        toggleAll,
        clearSelection,
        selectAll,
        selectedCount: selectedItems.size,
        isAllSelected,
        isIndeterminate,
    };
}
