/**
 * Chuẩn hóa chuỗi tìm kiếm tiếng Việt: bỏ dấu, thường hóa, bỏ khoảng trắng &
 * gạch nối. Dùng cho cả giá trị người dùng gõ (JS) lẫn cột trong SQL (viFoldExpr)
 * để tìm kiếm "không dấu, không space".
 *
 * Ví dụ: "Trần nhôm Clip-in" → "trannhomclipin"; gõ "tran nhom" cũng khớp.
 */
export function normalizeSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // bỏ dấu tổ hợp (á→a, ắ→a, ơ→o...)
    .replace(/đ/g, 'd')
    .replace(/[\s-]/g, ''); // bỏ khoảng trắng & gạch nối
}

// Bản đồ fold dấu cho SQL (LOWER trước nên chỉ cần chữ thường).
const VI_FOLD: Record<string, string> = {
  a: 'áàảãạăắằẳẵặâấầẩẫậ',
  e: 'éèẻẽẹêếềểễệ',
  i: 'íìỉĩị',
  o: 'óòỏõọôốồổỗộơớờởỡợ',
  u: 'úùủũụưứừửữự',
  y: 'ýỳỷỹỵ',
  d: 'đ',
};

/**
 * Sinh biểu thức SQL fold dấu + bỏ space/gạch cho 1 cột, để so khớp với chuỗi
 * đã qua normalizeSearch(). Kết quả là chuỗi REPLACE lồng nhau (an toàn: toàn ký
 * tự hằng, không nhận input người dùng).
 */
export function viFoldExpr(col: string): string {
  let e = `LOWER(${col})`;
  for (const [base, chars] of Object.entries(VI_FOLD)) {
    for (const ch of chars) e = `REPLACE(${e}, '${ch}', '${base}')`;
  }
  e = `REPLACE(${e}, ' ', '')`;
  e = `REPLACE(${e}, '-', '')`;
  return e;
}
