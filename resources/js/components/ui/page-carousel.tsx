import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Circle, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ContentPage {
    title?: string;
    content: string;
    image?: string | null;
    layout: 'text-only' | 'image-left' | 'image-right' | 'image-top' | 'image-full';
}

interface PageCarouselProps {
    pages: ContentPage[];
    className?: string;
    imageClassName?: string;
    contentClassName?: string;
    showIndicators?: boolean;
    showArrows?: boolean;
    autoPlay?: boolean;
    autoPlayInterval?: number;
    // Optional callbacks for navigating between items (announcements/jobs)
    onPreviousItem?: () => void;
    onNextItem?: () => void;
    hasPreviousItem?: boolean;
    hasNextItem?: boolean;
    itemLabel?: string; // e.g., "Announcement" or "Job"
}

export function PageCarousel({
    pages,
    className,
    imageClassName,
    contentClassName,
    showIndicators = true,
    showArrows = true,
    autoPlay = false,
    autoPlayInterval = 5000,
    onPreviousItem,
    onNextItem,
    hasPreviousItem = false,
    hasNextItem = false,
    itemLabel = 'Item',
}: PageCarouselProps) {
    const [currentPage, setCurrentPage] = useState(0);

    const isLastPage = currentPage === pages.length - 1;

    React.useEffect(() => {
        if (autoPlay && pages.length > 1) {
            const interval = setInterval(() => {
                setCurrentPage((prev) => (prev + 1) % pages.length);
            }, autoPlayInterval);
            return () => clearInterval(interval);
        }
    }, [autoPlay, autoPlayInterval, pages.length]);

    if (!pages || pages.length === 0) {
        return null;
    }

    const goToPrevious = () => {
        setCurrentPage((prev) => (prev - 1 + pages.length) % pages.length);
    };

    const goToNext = () => {
        setCurrentPage((prev) => (prev + 1) % pages.length);
    };

    const page = pages[currentPage];

    const renderPageContent = () => {
        switch (page.layout) {
            case 'image-full':
                return (
                    <div className="relative w-full">
                        {page.image && (
                            <div className="relative w-full aspect-video overflow-hidden rounded-lg">
                                <img
                                    src={page.image.startsWith('http') || page.image.startsWith('/') ? page.image : `/api/v1/files/${page.image}`}
                                    alt={page.title || 'Page image'}
                                    className={cn("w-full h-full object-cover", imageClassName)}
                                />
                                {/* Overlay content on image */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                    {page.title && (
                                        <h3 className="text-xl font-bold mb-2">{page.title}</h3>
                                    )}
                                    <div
                                        className={cn("prose prose-invert max-w-none", contentClassName)}
                                        dangerouslySetInnerHTML={{ __html: page.content }}
                                    />
                                </div>
                            </div>
                        )}
                        {!page.image && (
                            <div className="p-6">
                                {page.title && (
                                    <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">{page.title}</h3>
                                )}
                                <div
                                    className={cn("prose dark:prose-invert max-w-none", contentClassName)}
                                    dangerouslySetInnerHTML={{ __html: page.content }}
                                />
                            </div>
                        )}
                    </div>
                );

            case 'image-top':
                return (
                    <div className="w-full">
                        {page.image && (
                            <div className="w-full aspect-video overflow-hidden rounded-t-lg">
                                <img
                                    src={page.image.startsWith('http') || page.image.startsWith('/') ? page.image : `/api/v1/files/${page.image}`}
                                    alt={page.title || 'Page image'}
                                    className={cn("w-full h-full object-cover", imageClassName)}
                                />
                            </div>
                        )}
                        <div className="p-6">
                            {page.title && (
                                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">{page.title}</h3>
                            )}
                            <div
                                className={cn("prose dark:prose-invert max-w-none", contentClassName)}
                                dangerouslySetInnerHTML={{ __html: page.content }}
                            />
                        </div>
                    </div>
                );

            case 'image-left':
                return (
                    <div className="flex flex-col md:flex-row gap-6 p-6">
                        {page.image && (
                            <div className="w-full md:w-1/3 flex-shrink-0">
                                <div className="aspect-square overflow-hidden rounded-lg">
                                    <img
                                        src={page.image.startsWith('http') || page.image.startsWith('/') ? page.image : `/api/v1/files/${page.image}`}
                                        alt={page.title || 'Page image'}
                                        className={cn("w-full h-full object-cover", imageClassName)}
                                    />
                                </div>
                            </div>
                        )}
                        <div className="flex-1">
                            {page.title && (
                                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">{page.title}</h3>
                            )}
                            <div
                                className={cn("prose dark:prose-invert max-w-none", contentClassName)}
                                dangerouslySetInnerHTML={{ __html: page.content }}
                            />
                        </div>
                    </div>
                );

            case 'image-right':
                return (
                    <div className="flex flex-col md:flex-row gap-6 p-6">
                        <div className="flex-1 order-2 md:order-1">
                            {page.title && (
                                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">{page.title}</h3>
                            )}
                            <div
                                className={cn("prose dark:prose-invert max-w-none", contentClassName)}
                                dangerouslySetInnerHTML={{ __html: page.content }}
                            />
                        </div>
                        {page.image && (
                            <div className="w-full md:w-1/3 flex-shrink-0 order-1 md:order-2">
                                <div className="aspect-square overflow-hidden rounded-lg">
                                    <img
                                        src={page.image.startsWith('http') || page.image.startsWith('/') ? page.image : `/api/v1/files/${page.image}`}
                                        alt={page.title || 'Page image'}
                                        className={cn("w-full h-full object-cover", imageClassName)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'text-only':
            default:
                return (
                    <div className="p-6">
                        {page.title && (
                            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">{page.title}</h3>
                        )}
                        <div
                            className={cn("prose dark:prose-invert max-w-none", contentClassName)}
                            dangerouslySetInnerHTML={{ __html: page.content }}
                        />
                    </div>
                );
        }
    };

    return (
        <div className={cn("relative", className)}>
            {/* Page Content */}
            <div className="relative overflow-hidden">
                {renderPageContent()}
            </div>

            {/* Navigation Arrows */}
            {showArrows && pages.length > 1 && (
                <>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToPrevious}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 shadow-lg rounded-full h-10 w-10"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 shadow-lg rounded-full h-10 w-10"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </Button>
                </>
            )}

            {/* Page Indicators */}
            {showIndicators && pages.length > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                    {pages.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentPage(index)}
                            className={cn(
                                "transition-all duration-200",
                                index === currentPage
                                    ? "text-maroon-600 dark:text-maroon-400"
                                    : "text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500"
                            )}
                        >
                            <Circle
                                className={cn(
                                    "h-3 w-3",
                                    index === currentPage && "fill-current"
                                )}
                            />
                        </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        {currentPage + 1} / {pages.length}
                    </span>
                </div>
            )}

            {/* Navigation to Next/Previous Item (Announcement/Job) */}
            {(onPreviousItem || onNextItem) && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {onPreviousItem && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                setCurrentPage(0); // Reset to first page
                                onPreviousItem();
                            }}
                            disabled={!hasPreviousItem}
                            className="flex items-center gap-2"
                        >
                            <SkipBack className="h-4 w-4" />
                            Previous {itemLabel}
                        </Button>
                    )}
                    {!onPreviousItem && <div />}
                    {onNextItem && (
                        <Button
                            variant={isLastPage && hasNextItem ? "default" : "outline"}
                            onClick={() => {
                                setCurrentPage(0); // Reset to first page
                                onNextItem();
                            }}
                            disabled={!hasNextItem}
                            className={cn(
                                "flex items-center gap-2",
                                isLastPage && hasNextItem && "bg-maroon-600 hover:bg-maroon-700 text-white animate-pulse"
                            )}
                        >
                            Next {itemLabel}
                            <SkipForward className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

export default PageCarousel;
