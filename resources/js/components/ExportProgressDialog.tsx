import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { FileDown, FileSpreadsheet, FileText, X, CheckCircle2, Loader2 } from 'lucide-react';
import type { ExportFormat, ExportState } from '@/hooks/useExport';

interface ExportProgressDialogProps extends ExportState {
    onCancel: () => void;
}

const formatIcons: Record<ExportFormat, React.ReactNode> = {
    csv: <FileText className="h-8 w-8 text-green-500" />,
    excel: <FileSpreadsheet className="h-8 w-8 text-emerald-500" />,
    pdf: <FileDown className="h-8 w-8 text-red-500" />,
};

const formatLabels: Record<ExportFormat, string> = {
    csv: 'CSV',
    excel: 'Excel',
    pdf: 'PDF',
};

export function ExportProgressDialog({
    isExporting,
    progress,
    currentFormat,
    statusMessage,
    onCancel,
}: ExportProgressDialogProps) {
    const isComplete = progress >= 100;

    return (
        <Dialog open={isExporting} onOpenChange={(open) => { if (!open && !isComplete) onCancel(); }}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        {currentFormat && formatIcons[currentFormat]}
                        <span>
                            {isComplete
                                ? 'Export Complete!'
                                : `Exporting ${currentFormat ? formatLabels[currentFormat] : ''}...`
                            }
                        </span>
                    </DialogTitle>
                    <DialogDescription>
                        {isComplete
                            ? 'Your file has been downloaded successfully.'
                            : currentFormat === 'pdf'
                                ? 'PDF generation may take a moment. Please wait...'
                                : 'Please wait while your data is being exported.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Progress bar */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-2">
                                {isComplete ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                                {statusMessage}
                            </span>
                            <span className="font-medium tabular-nums">{Math.round(progress)}%</span>
                        </div>
                        <Progress
                            value={progress}
                            className="h-3"
                        />
                    </div>

                    {/* Helpful info for PDF */}
                    {currentFormat === 'pdf' && !isComplete && (
                        <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-3">
                            PDF documents take longer to generate as they require rendering formatted content.
                            Large datasets may take up to 30 seconds.
                        </p>
                    )}
                </div>

                {/* Cancel button (only when not complete) */}
                {!isComplete && (
                    <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={onCancel}>
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
