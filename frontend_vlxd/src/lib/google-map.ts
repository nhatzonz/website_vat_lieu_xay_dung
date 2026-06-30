/**
 * Chuẩn hóa nội dung Google Maps mà admin dán vào thành `src` dùng được cho
 * <iframe>. Chấp nhận: cả đoạn <iframe ...>, link nhúng, hoặc link/địa chỉ thường.
 *
 * Lưu ý: link chia sẻ rút gọn (maps.app.goo.gl/...) KHÔNG nhúng được — muốn hiện
 * bản đồ hãy dùng "Chia sẻ → Nhúng bản đồ" của Google Maps.
 */
export function toEmbedSrc(input: string | null | undefined): string | null {
  const v = (input ?? '').trim();
  if (!v) return null;

  // 1) Dán cả đoạn <iframe ... src="..."> → bóc lấy src.
  const iframeSrc = v.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  if (iframeSrc) return iframeSrc[1];

  // 2) Đã là link nhúng sẵn.
  if (/\/maps\/embed/i.test(v) || /[?&]output=embed/i.test(v)) return v;

  // 3) Link/địa chỉ thường → thử nhúng theo query (best-effort).
  return `https://www.google.com/maps?q=${encodeURIComponent(v)}&output=embed`;
}
