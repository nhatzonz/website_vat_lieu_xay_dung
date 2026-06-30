/**
 * Bóc `public_id` từ một Cloudinary secure_url để có thể gọi destroy() mà không
 * cần lưu riêng public_id trong DB.
 *
 * Ví dụ:
 *   https://res.cloudinary.com/demo/image/upload/v1700000000/vlxd/banners/abc.webp
 *   → "vlxd/banners/abc"
 *
 * Trả null nếu không phải URL Cloudinary (vd admin dán URL ảnh bên ngoài) → khi
 * đó bỏ qua, không xóa nhầm.
 */
export function publicIdFromUrl(url: string | null | undefined): string | null {
  if (!url || !url.includes('res.cloudinary.com')) return null;

  const marker = '/upload/';
  const at = url.indexOf(marker);
  if (at === -1) return null;

  // Phần sau '/upload/', bỏ query/hash.
  const tail = url.slice(at + marker.length).split('?')[0].split('#')[0];
  const parts = tail.split('/').filter(Boolean);

  // Bỏ các segment biến đổi (nếu có) + segment version 'v123…'; public_id là
  // toàn bộ phần còn lại sau version (giữ nguyên thư mục).
  const versionIdx = parts.findIndex((p) => /^v\d+$/.test(p));
  const idParts = versionIdx >= 0 ? parts.slice(versionIdx + 1) : parts;
  if (idParts.length === 0) return null;

  const joined = idParts.join('/');
  const dot = joined.lastIndexOf('.');
  return dot > 0 ? joined.slice(0, dot) : joined;
}
