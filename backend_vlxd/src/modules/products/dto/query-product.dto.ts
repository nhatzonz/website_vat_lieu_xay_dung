import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export const PRODUCT_SORTS = [
  'newest',
  'oldest',
  'price_asc',
  'price_desc',
  'popular',
  'name',
  'manual',
] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

/** Ép '1'/'true' → true, '0'/'false' → false, còn lại → undefined. */
const toBool = ({ value }: { value: unknown }): boolean | undefined => {
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  return undefined;
};

/** Query lọc sản phẩm cho cả public list và admin list. */
export class QueryProductDto extends PaginationQueryDto {
  /** Lọc theo slug danh mục (gồm cả danh mục con). */
  @IsOptional()
  @IsString()
  category?: string;

  /** Lọc theo slug thẻ. */
  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @Transform(toBool)
  isFeatured?: boolean;

  @IsOptional()
  @Transform(toBool)
  isNew?: boolean;

  /** Chỉ admin: lọc theo trạng thái hiển thị. */
  @IsOptional()
  @Transform(toBool)
  active?: boolean;

  /** Tìm theo tên/SKU. */
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(PRODUCT_SORTS)
  sort?: ProductSort = 'newest';

  /** Loại trừ 1 sản phẩm khỏi kết quả (dùng khi lấy "sản phẩm liên quan"). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  excludeId?: number;

  /** Kèm thông số (attributeValues) cho mỗi item — cho card "Sản phẩm mới". */
  @IsOptional()
  @Transform(toBool)
  withSpecs?: boolean;
}
