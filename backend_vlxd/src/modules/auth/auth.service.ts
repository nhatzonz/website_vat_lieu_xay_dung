import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { Admin } from '../admins/admin.entity';
import { AdminsService } from '../admins/admins.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const BCRYPT_ROUNDS = 12;
/** Hash giả (bcrypt cost 12 hợp lệ) để cân bằng thời gian khi username không
 *  tồn tại — chống dò tài khoản qua thời gian phản hồi. */
const DUMMY_HASH = '$2b$12$11/3HHUWDCMupCFdhAYAKOuCnIrXGMzAwl6HOqjRKb1qmSAbuTJPm';

export interface PublicAdmin {
  id: number;
  username: string;
  fullName: string;
  email: string | null;
  role: Admin['role'];
}

export interface AuthResult {
  accessToken: string;
  admin: PublicAdmin;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly adminsService: AdminsService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResult> {
    const admin = await this.adminsService.findByUsernameWithHash(dto.username);

    // Luôn chạy bcrypt.compare (kể cả khi không có user) để thời gian phản hồi
    // không tiết lộ username có tồn tại hay không.
    const hash = admin?.passwordHash ?? DUMMY_HASH;
    const passwordMatches = await bcrypt.compare(dto.password, hash);

    if (!admin || !admin.isActive || !passwordMatches) {
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
    }

    await this.adminsService.updateLastLogin(admin.id);
    return {
      accessToken: await this.signToken(admin),
      admin: this.toPublic(admin),
    };
  }

  async changePassword(adminId: number, dto: ChangePasswordDto): Promise<void> {
    const admin = await this.adminsService.findByIdWithHash(adminId);
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Tài khoản không hợp lệ');
    }

    const ok = await bcrypt.compare(dto.currentPassword, admin.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    }
    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException('Mật khẩu mới phải khác mật khẩu hiện tại');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.adminsService.updatePasswordHash(admin.id, passwordHash);
  }

  async me(adminId: number): Promise<PublicAdmin> {
    const admin = await this.adminsService.getActiveByIdOrFail(adminId);
    return this.toPublic(admin);
  }

  /** Cập nhật hồ sơ của chính admin (họ tên, email) rồi trả lại bản công khai. */
  async updateProfile(
    adminId: number,
    dto: UpdateProfileDto,
  ): Promise<PublicAdmin> {
    await this.adminsService.getActiveByIdOrFail(adminId);
    await this.adminsService.updateProfile(adminId, dto);
    return this.me(adminId);
  }

  private signToken(admin: Admin): Promise<string> {
    const payload: JwtPayload = {
      sub: admin.id,
      username: admin.username,
      role: admin.role,
    };
    return this.jwt.signAsync(payload);
  }

  private toPublic(admin: Admin): PublicAdmin {
    return {
      id: admin.id,
      username: admin.username,
      fullName: admin.fullName,
      email: admin.email,
      role: admin.role,
    };
  }
}
