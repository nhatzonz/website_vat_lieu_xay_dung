import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';

/** Một dòng trong yêu cầu sắp xếp lại: vị trí mới (+ cha mới nếu kéo sang nhánh khác). */
export class ReorderItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder: number;

  /** null/không gửi = giữ nguyên cha. Gửi số = chuyển sang cha mới. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parentId?: number | null;
}

/** Body PATCH /admin/categories/reorder: cập nhật hàng loạt thứ tự (kéo–thả). */
export class ReorderCategoriesDto {
  @IsArray()
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}
