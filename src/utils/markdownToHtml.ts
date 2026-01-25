import DOMPurify from 'dompurify';

/**
 * Converts markdown content to sanitized HTML
 * Used by: BlogPost.tsx, StepReview.tsx, BlogPreviewModal.tsx
 */
export function markdownToHtml(content: string): string {
  let html = content
    // Headers
    .replace(/^### (.*$)/gm, '</p><h3 class="text-lg font-semibold mt-6 mb-2">$1</h3><p class="mb-4">')
    .replace(/^## (.*$)/gm, '</p><h2 class="text-xl font-bold mt-8 mb-3">$1</h2><p class="mb-4">')
    .replace(/^# (.*$)/gm, '</p><h1 class="text-2xl font-bold mt-8 mb-4">$1</h1><p class="mb-4">')
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Lists - no explicit bullet character, let CSS handle it
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li class="list-decimal">$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/\n/g, '<br/>');

  // Wrap consecutive <li> elements in <ul>
  html = html.replace(/(<li[^>]*>.*?<\/li>(<br\/>)?)+/g, '<ul class="list-disc ml-6 mb-4 space-y-1">$&</ul>');
  
  // Clean up stray <br/> inside lists
  html = html.replace(/<ul([^>]*)>(.*?)<\/ul>/g, (match, attrs, inner) => {
    return `<ul${attrs}>${inner.replace(/<br\/>/g, '')}</ul>`;
  });
  
  html = `<p class="mb-4">${html}</p>`;
  // Clean up empty paragraphs
  html = html.replace(/<p class="mb-4"><\/p>/g, '');
  
  return DOMPurify.sanitize(html, { ADD_ATTR: ['id'] });
}

/**
 * Adds IDs to headings for anchor links (table of contents)
 */
export function addHeadingIds(html: string): string {
  return html.replace(/<h([2-3])([^>]*)>([^<]+)<\/h[2-3]>/gi, (match, level, attrs, text) => {
    const id = text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
  });
}

/**
 * Extracts headings from HTML for table of contents
 */
export function extractHeadings(html: string): { id: string; text: string; level: number }[] {
  const headingRegex = /<h([2-3])[^>]*>([^<]+)<\/h[2-3]>/gi;
  const headings: { id: string; text: string; level: number }[] = [];
  let match;
  
  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1]);
    const text = match[2].trim();
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    headings.push({ id, text, level });
  }
  
  return headings;
}
