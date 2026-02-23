import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
    children: ReactNode;
    /** Custom fallback UI */
    fallback?: ReactNode;
    /** Called when an error is caught */
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary
 * 
 * Catches React render errors and displays a user-friendly fallback UI
 * instead of crashing the entire page.
 * 
 * Usage (in app.tsx or layout):
 *   <ErrorBoundary>
 *     <App {...props} />
 *   </ErrorBoundary>
 * 
 * Usage (around specific sections):
 *   <ErrorBoundary fallback={<div>Something went wrong in this section</div>}>
 *     <RiskyComponent />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
        this.setState({ errorInfo });
        this.props.onError?.(error, errorInfo);
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleReload = (): void => {
        window.location.reload();
    };

    handleGoHome = (): void => {
        window.location.href = '/';
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex min-h-[400px] items-center justify-center p-6">
                    <div className="w-full max-w-md text-center space-y-6">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                Something went wrong
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                An unexpected error occurred. You can try refreshing the page or going back to the dashboard.
                            </p>
                        </div>

                        {this.state.error && (
                            <details className="text-left rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4">
                                <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-300">
                                    Error Details
                                </summary>
                                <pre className="mt-2 overflow-auto rounded bg-gray-100 dark:bg-gray-900 p-3 text-xs text-red-600 dark:text-red-400">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack && (
                                        <>{'\n\nComponent Stack:'}{this.state.errorInfo.componentStack}</>
                                    )}
                                </pre>
                            </details>
                        )}

                        <div className="flex items-center justify-center gap-3">
                            <Button
                                variant="outline"
                                onClick={this.handleGoHome}
                                className="gap-2"
                            >
                                <Home className="h-4 w-4" />
                                Home
                            </Button>
                            <Button
                                onClick={this.handleReload}
                                className="gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Reload Page
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Section Error Boundary - lighter version for wrapping page sections.
 * 
 * Usage:
 *   <SectionErrorBoundary name="Analytics Chart">
 *     <ComplexChart data={data} />
 *   </SectionErrorBoundary>
 */
interface SectionErrorBoundaryProps {
    children: ReactNode;
    name?: string;
}

export function SectionErrorBoundary({ children, name }: SectionErrorBoundaryProps) {
    return (
        <ErrorBoundary
            fallback={
                <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-8">
                    <div className="text-center space-y-2">
                        <AlertTriangle className="mx-auto h-6 w-6 text-amber-500" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {name ? `Failed to load ${name}` : 'This section encountered an error'}
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.location.reload()}
                            className="gap-1"
                        >
                            <RefreshCw className="h-3 w-3" />
                            Reload
                        </Button>
                    </div>
                </div>
            }
        >
            {children}
        </ErrorBoundary>
    );
}

export default ErrorBoundary;
