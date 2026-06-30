/**
 * Sinh slug thân thiện URL từ chuỗi tiếng Việt:
 *   "Trần nhôm Clip-in 600x600" -> "tran-nhom-clip-in-600x600"
 *
 * Bỏ dấu, đổi đ/Đ -> d, hạ thường, thay ký tự không phải [a-z0-9] bằng "-".
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // bỏ dấu thanh (combining marks)
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // gom ký tự lạ thành 1 gạch
    .replace(/^-+|-+$/g, ''); // bỏ gạch thừa đầu/cuối
}

/**
 * Đảm bảo slug là duy nhất: nếu `base` đã tồn tại (theo hàm `exists`),
 * thêm hậu tố -2, -3... cho tới khi không trùng.
 */
export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || 'item';
  let candidate = root;
  let n = 2;
  while (await exists(candidate)) {
    candidate = `${root}-${n}`;
    n += 1;
  }
  return candidate;
}
