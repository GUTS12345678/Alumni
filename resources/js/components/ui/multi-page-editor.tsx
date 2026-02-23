import React, { useState, useRef } from 'react';
import {
    Plus,
    Trash2,
    GripVertical,
    ImageIcon,
    Upload,
    X,
    ChevronUp,
    ChevronDown,
    AlignLeft,
    AlignRight,
    ImagePlus,
    Type
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ContentPage } from '@/components/ui/page-carousel';

interface MultiPageEditorProps {
    pages: ContentPage[];
    onChange: (pages: ContentPage[]) => void;
    onImageUpload?: (file: File, pageIndex: number) => Promise<string>;
    maxPages?: number;
    className?: string;
    useRichText?: boolean;
}

const layoutOptions = [
    { value: 'text-only', label: 'Text Only', icon: Type },
    { value: 'image-top', label: 'Image Top', icon: ImagePlus },
    { value: 'image-left', label: 'Image Left', icon: AlignLeft },
    { value: 'image-right', label: 'Image Right', icon: AlignRight },
    { value: 'image-full', label: 'Full Image with Overlay', icon: ImageIcon },
];

export function MultiPageEditor({
    pages,
    onChange,
    onImageUpload,
    maxPages = 10,
    className,
}: MultiPageEditorProps) {
    const [expandedPages, setExpandedPages] = useState<number[]>([0]);
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
    const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

    const addPage = () => {
        if (pages.length >= maxPages) return;

        const newPage: ContentPage = {
            title: '',
            content: '',
            image: null,
            layout: 'text-only',
        };

        const newPages = [...pages, newPage];
        onChange(newPages);
        setExpandedPages([...expandedPages, newPages.length - 1]);
    };

    const removePage = (index: number) => {
        const newPages = pages.filter((_, i) => i !== index);
        onChange(newPages);
        setExpandedPages(expandedPages.filter(i => i !== index).map(i => i > index ? i - 1 : i));
    };

    const updatePage = (index: number, updates: Partial<ContentPage>) => {
        const newPages = pages.map((page, i) =>
            i === index ? { ...page, ...updates } : page
        );
        onChange(newPages);
    };

    const movePage = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= pages.length) return;

        const newPages = [...pages];
        [newPages[index], newPages[newIndex]] = [newPages[newIndex], newPages[index]];
        onChange(newPages);

        // Update expanded pages
        setExpandedPages(expandedPages.map(i => {
            if (i === index) return newIndex;
            if (i === newIndex) return index;
            return i;
        }));
    };

    const toggleExpanded = (index: number) => {
        if (expandedPages.includes(index)) {
            setExpandedPages(expandedPages.filter(i => i !== index));
        } else {
            setExpandedPages([...expandedPages, index]);
        }
    };

    const handleImageUpload = async (index: number, file: File) => {
        if (!onImageUpload) return;

        setUploadingIndex(index);
        try {
            const imageUrl = await onImageUpload(file, index);
            updatePage(index, { image: imageUrl });
        } catch (error) {
            console.error('Failed to upload image:', error);
        } finally {
            setUploadingIndex(null);
        }
    };

    const handleFileChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await handleImageUpload(index, file);
        }
    };

    const triggerFileInput = (index: number) => {
        fileInputRefs.current[index]?.click();
    };

    const removeImage = (index: number) => {
        updatePage(index, { image: null });
    };

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Content Pages</Label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPage}
                    disabled={pages.length >= maxPages}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Page ({pages.length}/{maxPages})
                </Button>
            </div>

            {pages.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <ImagePlus className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 mb-4">No pages yet. Add your first page to get started.</p>
                        <Button type="button" onClick={addPage}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Page
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {pages.map((page, index) => (
                        <Card key={index} className="overflow-hidden">
                            {/* Page Header */}
                            <div
                                className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 cursor-pointer"
                                onClick={() => toggleExpanded(index)}
                            >
                                <GripVertical className="h-4 w-4 text-gray-400" />
                                <span className="font-medium text-sm flex-1">
                                    Page {index + 1}
                                    {page.title && `: ${page.title}`}
                                </span>
                                <TooltipProvider>
                                    <div className="flex items-center gap-1">
                                        {index > 0 && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={(e) => { e.stopPropagation(); movePage(index, 'up'); }}
                                                    >
                                                        <ChevronUp className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Move Up</TooltipContent>
                                            </Tooltip>
                                        )}
                                        {index < pages.length - 1 && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={(e) => { e.stopPropagation(); movePage(index, 'down'); }}
                                                    >
                                                        <ChevronDown className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Move Down</TooltipContent>
                                            </Tooltip>
                                        )}
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={(e) => { e.stopPropagation(); removePage(index); }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Remove Page</TooltipContent>
                                        </Tooltip>
                                    </div>
                                </TooltipProvider>
                            </div>

                            {/* Page Content (Expandable) */}
                            {expandedPages.includes(index) && (
                                <CardContent className="p-4 space-y-4">
                                    {/* Layout Selection */}
                                    <div>
                                        <Label className="text-sm mb-2 block">Layout</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {layoutOptions.map((option) => {
                                                const Icon = option.icon;
                                                return (
                                                    <Button
                                                        key={option.value}
                                                        type="button"
                                                        variant={page.layout === option.value ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => updatePage(index, { layout: option.value as ContentPage['layout'] })}
                                                        className={cn(
                                                            page.layout === option.value && "bg-maroon-600 hover:bg-maroon-700"
                                                        )}
                                                    >
                                                        <Icon className="h-4 w-4 mr-1" />
                                                        {option.label}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Page Title */}
                                    <div>
                                        <Label htmlFor={`page-title-${index}`} className="text-sm">
                                            Page Title (Optional)
                                        </Label>
                                        <Input
                                            id={`page-title-${index}`}
                                            value={page.title || ''}
                                            onChange={(e) => updatePage(index, { title: e.target.value })}
                                            placeholder="Enter page title..."
                                            className="mt-1"
                                        />
                                    </div>

                                    {/* Image Upload (if layout supports images) */}
                                    {page.layout !== 'text-only' && (
                                        <div>
                                            <Label className="text-sm">Page Image</Label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                ref={(el) => { fileInputRefs.current[index] = el; }}
                                                onChange={(e) => handleFileChange(index, e)}
                                            />

                                            {page.image ? (
                                                <div className="relative mt-2 inline-block">
                                                    <img
                                                        src={page.image.startsWith('http') || page.image.startsWith('/') ? page.image : `/api/v1/files/${page.image}`}
                                                        alt="Page image"
                                                        className="h-32 w-auto rounded-lg object-cover"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                                        onClick={() => removeImage(index)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="mt-2 w-full border-dashed"
                                                    onClick={() => triggerFileInput(index)}
                                                    disabled={uploadingIndex === index}
                                                >
                                                    {uploadingIndex === index ? (
                                                        <>Uploading...</>
                                                    ) : (
                                                        <>
                                                            <Upload className="h-4 w-4 mr-2" />
                                                            Upload Image
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    {/* Page Content */}
                                    <div>
                                        <Label htmlFor={`page-content-${index}`} className="text-sm">
                                            Content
                                        </Label>
                                        <Textarea
                                            id={`page-content-${index}`}
                                            value={page.content}
                                            onChange={(e) => updatePage(index, { content: e.target.value })}
                                            placeholder="Enter page content... (HTML supported)"
                                            className="mt-1 min-h-[150px]"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            You can use HTML tags for formatting (e.g., &lt;strong&gt;, &lt;ul&gt;, &lt;li&gt;)
                                        </p>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MultiPageEditor;
