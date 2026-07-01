import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { SUPPORT_CHANNELS, SupportChannel } from '../support-channels';

export class CreateSupportContactDto {
  /** Tên nhân viên tư vấn (bắt buộc). */
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  /** Số/link Zalo. */
  @IsOptional()
  @IsString()
  @MaxLength(30)
  zalo?: string;

  @IsOptional()
  @IsIn(SUPPORT_CHANNELS, {
    message: `channel phải là một trong: ${SUPPORT_CHANNELS.join(', ')}`,
  })
  channel?: SupportChannel;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
