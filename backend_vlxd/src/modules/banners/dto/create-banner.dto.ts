import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { BANNER_POSITIONS, BannerPosition } from '../banner-positions';

export class CreateBannerDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  /** URL ảnh (bắt buộc) — thường là secure_url trả về từ /admin/upload. */
  @IsString()
  @MaxLength(255)
  image: string;

  /** Link khi bấm vào banner. Cho phép cả đường dẫn nội bộ (vd /danh-muc/x). */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  linkUrl?: string;

  @IsOptional()
  @IsIn(BANNER_POSITIONS, {
    message: `position phải là một trong: ${BANNER_POSITIONS.join(', ')}`,
  })
  position?: BannerPosition;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
