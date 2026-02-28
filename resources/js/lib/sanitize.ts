/**
 * Sanitize HTML content to prevent XSS attacks.
 * Removes script tags, iframe tags, and inline event handlers.
 */
export function sanitizeHtml(html: string): string {
    if (!html) return '';
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}
