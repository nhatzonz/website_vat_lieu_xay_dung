import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class SettingItemDto {
  @IsString()
  @MaxLength(100)
  key: string;

  /** Giá trị; null/để trống = xóa giá trị (về rỗng). Group do catalog quản lý. */
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  value?: string | null;
}

/**
 * Cập nhật nhiều cấu hình một lần: { items: [{ key, value }, ...] }.
 * Key không nằm trong catalog sẽ bị từ chối ở service.
 */
export class UpdateSettingsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SettingItemDto)
  items: SettingItemDto[];
}
