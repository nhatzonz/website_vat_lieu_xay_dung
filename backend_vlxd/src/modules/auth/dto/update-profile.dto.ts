import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

/**
 * Cập nhật hồ sơ của chính admin đang đăng nhập (họ tên, email).
 * Không cho đổi username/role/is_active ở đây — đó là việc quản lý tài khoản.
 * Field bỏ trống = không đổi; email rỗng ('') = xóa email (về null).
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @ValidateIf((o) => o.email !== null && o.email !== undefined)
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(150)
  email?: string | null;
}
