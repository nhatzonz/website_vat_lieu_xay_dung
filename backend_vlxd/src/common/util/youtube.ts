/**
 * Tiện ích xử lý link YouTube. Chấp nhận nhiều dạng URL và rút ra videoId
 * (11 ký tự) để chuẩn hóa lưu trữ + cho phép FE nhúng iframe/thumbnail dễ dàng.
 */

const YOUTUBE_ID = /^[\w-]{11}$/;

/**
 * Rút videoId từ mọi dạng link phổ biến:
 *  - https://www.youtube.com/watch?v=ID
 *  - https://youtu.be/ID
 *  - https://www.youtube.com/embed/ID
 *  - https://www.youtube.com/shorts/ID
 *  - hoặc chính là ID (11 ký tự).
 * Trả về null nếu không nhận ra.
 */
export function extractYoutubeId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (YOUTUBE_ID.test(value)) return value;

  const patterns = [
    /[?&]v=([\w-]{11})/, // watch?v=ID
    /youtu\.be\/([\w-]{11})/, // youtu.be/ID
    /\/embed\/([\w-]{11})/, // /embed/ID
    /\/shorts\/([\w-]{11})/, // /shorts/ID
  ];
  for (const re of patterns) {
    const m = value.match(re);
    if (m) return m[1];
  }
  return null;
}

/** URL watch chuẩn để lưu DB (thống nhất, FE parse lại dễ). */
export function canonicalYoutubeUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}
