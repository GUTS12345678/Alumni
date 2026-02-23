import { useState, useCallback, useRef } from 'react';

export interface ConfirmOptions {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'destructive';
}

interface ConfirmState extends ConfirmOptions {
    open: boolean;
}

const defaultState: ConfirmState = {
    open: false,
    title: 'Confirm',
    message: '',
    confirmLabel: 'Continue',
    cancelLabel: 'Cancel',
    variant: 'default',
};

/**
 * Hook to show a confirmation dialog that replaces native browser confirm().
 *
 * Usage:
 * ```tsx
 * const { confirm, ConfirmDialog } = useConfirmDialog();
 *
 * const handleDelete = async () => {
 *   const ok = await confirm({
 *     title: 'Delete Item',
 *     message: 'Are you sure you want to delete this?',
 *     variant: 'destructive',
 *   });
 *   if (!ok) return;
 *   // proceed
 * };
 *
 * return <>{...}<ConfirmDialog /></>;
 * ```
 */
export function useConfirmDialog() {
    const [state, setState] = useState<ConfirmState>(defaultState);
    const resolveRef = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise<boolean>((resolve) => {
            resolveRef.current = resolve;
            setState({
                open: true,
                title: options.title ?? 'Confirm',
                message: options.message,
                confirmLabel: options.confirmLabel ?? 'Continue',
                cancelLabel: options.cancelLabel ?? 'Cancel',
                variant: options.variant ?? 'default',
            });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        setState((s) => ({ ...s, open: false }));
        resolveRef.current?.(true);
        resolveRef.current = null;
    }, []);

    const handleCancel = useCallback(() => {
        setState((s) => ({ ...s, open: false }));
        resolveRef.current?.(false);
        resolveRef.current = null;
    }, []);

    return {
        confirm,
        confirmState: state,
        handleConfirm,
        handleCancel,
    };
}
