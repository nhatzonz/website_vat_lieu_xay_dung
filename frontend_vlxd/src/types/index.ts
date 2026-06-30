/**
 * Kiểu dữ liệu dùng chung phía frontend.
 * Bổ sung interface cho từng entity (Product, Category, News...) khi có schema DB.
 */

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}
