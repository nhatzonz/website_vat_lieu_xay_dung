/**
 * Bóc danh sách URL ảnh (`<img src="...">`) từ một chuỗi HTML — dùng cho nội
 * dung soạn thảo (products.content, products.test_result, news.content...) để
 * dọn ảnh Cloudinary không còn tham chiếu.
 *
 * Chỉ lấy thuộc tính `src`; chấp nhận cả nháy đơn/kép. Trả mảng rỗng nếu không có.
 */
const IMG_SRC_RE = /<img\b[^>]*?\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

export function imageUrlsFromHtml(html?: string | null): string[] {
  if (!html) return [];
  const urls: string[] = [];
  IMG_SRC_RE.lastIndex = 0; // regex dùng cờ /g ở phạm vi module → reset con trỏ
  let match: RegExpExecArray | null;
  while ((match = IMG_SRC_RE.exec(html)) !== null) {
    const url = match[1] ?? match[2];
    if (url) urls.push(url);
  }
  return urls;
}
