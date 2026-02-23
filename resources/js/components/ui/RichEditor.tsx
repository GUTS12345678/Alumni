/**
 * RichEditor – Google-Docs-like rich text editor built on TipTap.
 *
 * Features:
 *  - Bold, italic, underline, strikethrough
 *  - Headings (H1-H3), paragraph
 *  - Bullet list, ordered list
 *  - Blockquote, code block, horizontal rule
 *  - Text alignment (left, center, right, justify)
 *  - Text color & highlight
 *  - Links (with URL input)
 *  - Image upload (POST to /api/v1/content/admin/upload-media)
 *  - File/attachment upload (same endpoint)
 *  - Undo / redo
 *  - Outputs clean HTML via onChange
 */

import React, { useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import axios from 'axios';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    Heading1, Heading2, Heading3, List, ListOrdered,
    Quote, Code, Minus, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Link as LinkIcon, Image as ImageIcon, Paperclip, Undo, Redo,
    Highlighter, Type, Loader2
} from 'lucide-react';

// ── Styles injected once ──────────────────────────────────────────────────────
const editorStyles = `
.tiptap-editor .ProseMirror {
    outline: none;
    min-height: 200px;
    padding: 1rem;
    line-height: 1.7;
}
.tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: #adb5bd;
    pointer-events: none;
    height: 0;
}
.tiptap-editor .ProseMirror h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: .5rem; }
.tiptap-editor .ProseMirror h2 { font-size: 1.4rem; font-weight: 600; margin-bottom: .4rem; }
.tiptap-editor .ProseMirror h3 { font-size: 1.15rem; font-weight: 600; margin-bottom: .3rem; }
.tiptap-editor .ProseMirror ul, .tiptap-editor .ProseMirror ol { padding-left: 1.5rem; }
.tiptap-editor .ProseMirror ul { list-style: disc; }
.tiptap-editor .ProseMirror ol { list-style: decimal; }
.tiptap-editor .ProseMirror blockquote {
    border-left: 3px solid #8b0000;
    padding-left: 1rem;
    color: #666;
    font-style: italic;
}
.tiptap-editor .ProseMirror code {
    background: #f1f3f5;
    border-radius: 3px;
    padding: .1em .35em;
    font-size: .9em;
    font-family: monospace;
}
.tiptap-editor .ProseMirror pre {
    background: #1e1e2e;
    color: #cdd6f4;
    border-radius: 6px;
    padding: 1rem;
    overflow-x: auto;
}
.tiptap-editor .ProseMirror pre code { background: none; color: inherit; padding: 0; }
.tiptap-editor .ProseMirror a { color: #1a73e8; text-decoration: underline; cursor: pointer; }
.tiptap-editor .ProseMirror img { max-width: 100%; border-radius: 6px; margin: .5rem 0; }
.tiptap-editor .ProseMirror hr { border: none; border-top: 2px solid #e9ecef; margin: 1rem 0; }
.tiptap-editor .ProseMirror mark { background: #ffec99; border-radius: 2px; padding: .1em .2em; }
`;

if (typeof document !== 'undefined' && !document.getElementById('tiptap-styles')) {
    const style = document.createElement('style');
    style.id = 'tiptap-styles';
    style.textContent = editorStyles;
    document.head.appendChild(style);
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface UploadedFile {
    name: string;
    url: string;
    type: string;
    size: number;
}

interface RichEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    minHeight?: number;
    /** Called when a file is uploaded (image or attachment). */
    onFileUploaded?: (file: UploadedFile) => void;
    /** Extra attached files shown below editor (returned by onFileUploaded) */
    attachedFiles?: UploadedFile[];
    onRemoveFile?: (url: string) => void;
    className?: string;
    disabled?: boolean;
}

// ── Toolbar button helper ─────────────────────────────────────────────────────
function ToolBtn({
    onClick, active = false, title, disabled = false, children,
}: {
    onClick: () => void; active?: boolean; title: string; disabled?: boolean; children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onClick(); }}
            title={title}
            disabled={disabled}
            className={[
                'p-1.5 rounded transition-colors text-sm',
                active
                    ? 'bg-maroon-700 text-white dark:bg-maroon-600'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
                disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
            ].join(' ')}
        >
            {children}
        </button>
    );
}

function Divider() {
    return <span className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-0.5 self-center" />;
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function RichEditor({
    value,
    onChange,
    placeholder = 'Write your content here…',
    minHeight = 220,
    onFileUploaded,
    attachedFiles = [],
    onRemoveFile,
    className = '',
    disabled = false,
}: RichEditorProps) {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = React.useState(false);
    const [linkUrl, setLinkUrl] = React.useState('');
    const [showLinkInput, setShowLinkInput] = React.useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // Disable built-in Link & Underline from StarterKit (v3 includes them)
                // because we add them separately with custom configuration below.
                link: false,
                underline: false,
            }),
            Underline,
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            Typography,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Placeholder.configure({ placeholder }),
            Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
            Image.configure({ inline: false, allowBase64: true }),
        ],
        content: value,
        editable: !disabled,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    // Keep editor content in sync when value prop changes externally
    React.useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value, { emitUpdate: false });
        }
    }, [value, editor]);

    const uploadMedia = useCallback(async (file: File, insertAsImage = false) => {
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('type', file.type.startsWith('image/') ? 'image' : 'attachment');
            const { data } = await axios.post('/api/v1/content/admin/upload-media', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const url: string = data.url;
            if (insertAsImage && editor) {
                editor.chain().focus().setImage({ src: url, alt: file.name }).run();
            }
            onFileUploaded?.({ name: file.name, url, type: file.type, size: file.size });
        } catch (err) {
            console.error('Media upload failed', err);
            alert('Upload failed — please try again.');
        } finally {
            setUploading(false);
        }
    }, [editor, onFileUploaded]);

    const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadMedia(file, true);
        e.target.value = '';
    };

    const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadMedia(file, false);
        e.target.value = '';
    };

    const applyLink = () => {
        if (!editor) return;
        if (linkUrl.trim()) {
            editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl.trim() }).run();
        } else {
            editor.chain().focus().unsetLink().run();
        }
        setLinkUrl('');
        setShowLinkInput(false);
    };

    if (!editor) return null;

    const can = (cmd: () => boolean) => { try { return cmd(); } catch { return false; } };

    return (
        <div className={`border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800 ${className}`}>
            {/* ── Toolbar ── */}
            <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-750">
                {/* History */}
                <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo" disabled={!can(() => editor.can().undo())}>
                    <Undo className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo" disabled={!can(() => editor.can().redo())}>
                    <Redo className="h-3.5 w-3.5" />
                </ToolBtn>
                <Divider />
                {/* Headings */}
                <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
                    <Heading1 className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
                    <Heading2 className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
                    <Heading3 className="h-3.5 w-3.5" />
                </ToolBtn>
                <Divider />
                {/* Inline marks */}
                <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
                    <Bold className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
                    <Italic className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
                    <UnderlineIcon className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
                    <Strikethrough className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
                    <Highlighter className="h-3.5 w-3.5" />
                </ToolBtn>

                {/* Text color */}
                <span title="Text color" className="relative flex items-center">
                    <Type className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300 mr-0.5" />
                    <input
                        type="color"
                        defaultValue="#000000"
                        className="w-4 h-4 cursor-pointer border-0 p-0 bg-transparent opacity-0 absolute inset-0"
                        onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
                        title="Text color"
                    />
                </span>

                <Divider />
                {/* Lists */}
                <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
                    <List className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
                    <ListOrdered className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
                    <Quote className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
                    <Code className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
                    <Minus className="h-3.5 w-3.5" />
                </ToolBtn>
                <Divider />
                {/* Alignment */}
                <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
                    <AlignLeft className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center">
                    <AlignCenter className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">
                    <AlignRight className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
                    <AlignJustify className="h-3.5 w-3.5" />
                </ToolBtn>
                <Divider />
                {/* Link */}
                <ToolBtn onClick={() => setShowLinkInput(!showLinkInput)} active={editor.isActive('link')} title="Insert / edit link">
                    <LinkIcon className="h-3.5 w-3.5" />
                </ToolBtn>
                {/* Image upload */}
                <ToolBtn onClick={() => imageInputRef.current?.click()} title="Insert image" disabled={uploading}>
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                </ToolBtn>
                {/* File attachment */}
                <ToolBtn onClick={() => fileInputRef.current?.click()} title="Attach file" disabled={uploading}>
                    <Paperclip className="h-3.5 w-3.5" />
                </ToolBtn>
            </div>

            {/* ── Link input row ── */}
            {showLinkInput && (
                <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-200 dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20">
                    <input
                        type="url"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') applyLink(); if (e.key === 'Escape') setShowLinkInput(false); }}
                        placeholder="https://example.com"
                        className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
                        autoFocus
                    />
                    <button type="button" onClick={applyLink} className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Apply</button>
                    <button type="button" onClick={() => setShowLinkInput(false)} className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700 dark:text-gray-400">Cancel</button>
                </div>
            )}

            {/* ── Editor content area ── */}
            <div className="tiptap-editor" style={{ minHeight }}>
                <EditorContent editor={editor} />
            </div>

            {/* ── Attached files ── */}
            {attachedFiles.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-600 px-3 py-2 flex flex-wrap gap-2">
                    {attachedFiles.map((f) => (
                        <div key={f.url} className="flex items-center gap-1.5 text-xs bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
                            <Paperclip className="h-3 w-3 text-gray-500" />
                            <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline max-w-[140px] truncate">{f.name}</a>
                            {onRemoveFile && (
                                <button type="button" onClick={() => onRemoveFile(f.url)} className="text-gray-400 hover:text-red-500 ml-0.5">×</button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Hidden file inputs */}
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
            <input ref={fileInputRef} type="file" accept="*/*" className="hidden" onChange={handleFilePick} />
        </div>
    );
}
