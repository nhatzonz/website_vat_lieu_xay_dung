import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  Min,
} from 'class-validator';

export type BulkAction = 'activate' | 'deactivate' | 'delete';

export const BULK_ACTIONS: BulkAction[] = ['activate', 'deactivate', 'delete'];

/** Body PATCH /admin/categories/bulk: thao tác hàng loạt theo danh sách id. */
export class BulkCategoriesDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(1000)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids: number[];

  @IsIn(BULK_ACTIONS, {
    message: `action phải là một trong: ${BULK_ACTIONS.join(', ')}`,
  })
  action: BulkAction;
}
