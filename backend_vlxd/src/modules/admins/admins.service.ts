import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './admin.entity';

/**
 * Sở hữu mọi thao tác với bảng `admins`. Tách khỏi AuthService để Auth chỉ
 * lo việc xác thực/JWT, còn truy xuất tài khoản nằm gọn ở đây.
 */
@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(Admin)
    private readonly admins: Repository<Admin>,
  ) {}

  /** Lấy admin kèm password_hash (chỉ dùng cho luồng xác thực). */
  findByUsernameWithHash(username: string): Promise<Admin | null> {
    return this.admins
      .createQueryBuilder('a')
      .addSelect('a.passwordHash')
      .where('a.username = :username', { username })
      .getOne();
  }

  /** Lấy admin theo id (không kèm hash). */
  findById(id: number): Promise<Admin | null> {
    return this.admins.findOne({ where: { id } });
  }

  /** Lấy admin theo id kèm hash (cho đổi mật khẩu). */
  findByIdWithHash(id: number): Promise<Admin | null> {
    return this.admins
      .createQueryBuilder('a')
      .addSelect('a.passwordHash')
      .where('a.id = :id', { id })
      .getOne();
  }

  async getActiveByIdOrFail(id: number): Promise<Admin> {
    const admin = await this.findById(id);
    if (!admin || !admin.isActive) {
      throw new NotFoundException('Tài khoản không hợp lệ');
    }
    return admin;
  }

  updateLastLogin(id: number): Promise<unknown> {
    return this.admins.update(id, { lastLoginAt: new Date() });
  }

  updatePasswordHash(id: number, passwordHash: string): Promise<unknown> {
    return this.admins.update(id, { passwordHash });
  }

  /** Cập nhật hồ sơ (chỉ các field được truyền). */
  updateProfile(
    id: number,
    data: { fullName?: string; email?: string | null },
  ): Promise<unknown> {
    const patch: Partial<Admin> = {};
    if (data.fullName !== undefined) patch.fullName = data.fullName;
    if (data.email !== undefined) patch.email = data.email;
    return this.admins.update(id, patch);
  }
}
