import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  currentPassword: string;

  /** Mật khẩu mới: tối thiểu 8 ký tự, có cả chữ và số. */
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/[A-Za-z]/, { message: 'Mật khẩu phải có ít nhất một chữ cái' })
  @Matches(/[0-9]/, { message: 'Mật khẩu phải có ít nhất một chữ số' })
  newPassword: string;
}
