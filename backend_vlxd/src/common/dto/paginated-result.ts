/**
 * Định dạng kết quả phân trang trả về cho frontend.
 * Dùng `success: true` để TransformInterceptor không bọc thêm một lớp nữa.
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class PaginatedResult<T> {
  success = true as const;
  data: T[];
  meta: PaginationMeta;

  constructor(items: T[], total: number, page: number, limit: number) {
    this.data = items;
    this.meta = {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }
}
