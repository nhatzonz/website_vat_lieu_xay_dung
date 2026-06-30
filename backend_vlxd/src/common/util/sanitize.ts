import sanitizeHtml from 'sanitize-html';

/**
 * Làm sạch HTML nhận từ trình soạn thảo (TinyMCE/CKEditor) trước khi lưu DB,
 * chống XSS. Cho phép các thẻ định dạng bài viết phổ biến + ảnh + bảng + link.
 *
 * Dùng cho: products.content, products.test_result, news.content, pages.content.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr', 'blockquote', 'pre', 'code',
    'b', 'strong', 'i', 'em', 'u', 's', 'sub', 'sup', 'mark', 'span',
    'ul', 'ol', 'li',
    'a', 'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
    'div', 'iframe',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen'],
    '*': ['style', 'class'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel', 'data'],
  // Chỉ cho nhúng iframe từ YouTube (tab kết quả thử nghiệm, video).
  allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com'],
  // Buộc link ngoài mở tab mới + chống tab-nabbing.
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
};

export function sanitizeContent(html?: string | null): string | null {
  if (html === undefined || html === null) {
    return (html as null) ?? null;
  }
  return sanitizeHtml(html, OPTIONS);
}
