import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { VIDEO_POSITIONS, VideoPosition } from '../video-positions';

export class CreateVideoDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  /** Link YouTube (bắt buộc). Service sẽ validate & chuẩn hóa về dạng watch. */
  @IsString()
  @MaxLength(255)
  youtubeUrl: string;

  /** Một hoặc nhiều vị trí hiển thị (SET). Mặc định ['home'] nếu bỏ trống. */
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(VIDEO_POSITIONS, {
    each: true,
    message: `position phải thuộc: ${VIDEO_POSITIONS.join(', ')}`,
  })
  position?: VideoPosition[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
