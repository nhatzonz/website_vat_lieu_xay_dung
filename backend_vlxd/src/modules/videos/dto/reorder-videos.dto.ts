import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';

export class ReorderVideoItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder: number;
}

/** Body PATCH /admin/videos/reorder: cập nhật hàng loạt thứ tự (kéo–thả). */
export class ReorderVideosDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ReorderVideoItemDto)
  items: ReorderVideoItemDto[];
}
