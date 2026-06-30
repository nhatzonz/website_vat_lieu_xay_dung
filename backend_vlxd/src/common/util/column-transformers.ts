import { ValueTransformer } from 'typeorm';

/**
 * MySQL BIGINT được mysql2 trả về dạng string để tránh tràn số. Với các khóa
 * trong phạm vi an toàn của JS, ép về number cho tiện dùng ở tầng app/JSON.
 */
export const bigintTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null): number | null =>
    value === null || value === undefined ? null : Number(value),
};

/**
 * DECIMAL cũng trả về string. Ép về number (đủ cho giá tiền VND).
 */
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null): number | null =>
    value === null || value === undefined ? null : Number(value),
};

/**
 * TINYINT(1) dùng làm cờ boolean: lưu 0/1, đọc ra true/false ở tầng app.
 * Khi giá trị `undefined` (không set) trả về `undefined` để TypeORM BỎ cột khỏi
 * câu INSERT → DB áp default, tránh chèn NULL vào cột NOT NULL.
 */
export const booleanTransformer: ValueTransformer = {
  to: (value?: boolean | null): number | undefined =>
    value === null || value === undefined ? undefined : value ? 1 : 0,
  from: (value?: number | null): boolean => value === 1,
};
