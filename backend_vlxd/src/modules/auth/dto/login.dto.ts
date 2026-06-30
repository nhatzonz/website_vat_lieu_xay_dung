import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Đăng nhập: chỉ kiểm tra không rỗng + trần độ dài (72 = giới hạn bcrypt).
 * KHÔNG áp chính sách độ mạnh ở đây — tránh lộ policy và chặn nhầm tài khoản
 * có mật khẩu cũ. Sai thông tin luôn trả 401 đồng nhất.
 */
export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password: string;
}
