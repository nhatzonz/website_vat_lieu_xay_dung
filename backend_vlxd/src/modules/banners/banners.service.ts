import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { UploadService } from '../upload/upload.service';
import { Banner } from './banner.entity';
import { BannerPosition } from './banner-positions';
import { CreateBannerDto } from './dto/create-banner.dto';
import { ReorderBannersDto } from './dto/reorder-banners.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner)
    private readonly banners: Repository<Banner>,
    private readonly upload: UploadService,
  ) {}

  /** Danh sách công khai cho web: chỉ banner active, lọc theo vị trí nếu có. */
  publicList(position?: BannerPosition): Promise<Banner[]> {
    const where: FindOptionsWhere<Banner> = { isActive: true };
    if (position) where.position = position;
    return this.banners.find({
      where,
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
  }

  /** Danh sách quản trị: toàn bộ banner, lọc theo vị trí nếu có. */
  findAll(position?: BannerPosition): Promise<Banner[]> {
    const where: FindOptionsWhere<Banner> = {};
    if (position) where.position = position;
    return this.banners.find({
      where,
      order: { position: 'ASC', sortOrder: 'ASC', id: 'ASC' },
    });
  }

  async findById(id: number): Promise<Banner> {
    const banner = await this.banners.findOne({ where: { id } });
    if (!banner) {
      throw new NotFoundException('Không tìm thấy banner');
    }
    return banner;
  }

  create(dto: CreateBannerDto): Promise<Banner> {
    const banner = this.banners.create(dto);
    return this.banners.save(banner);
  }

  async update(id: number, dto: UpdateBannerDto): Promise<Banner> {
    const banner = await this.findById(id);
    const oldImage = banner.image;

    Object.assign(banner, dto);
    const saved = await this.banners.save(banner);

    // Đổi sang ảnh khác → dọn ảnh cũ trên Cloudinary.
    if (dto.image && dto.image !== oldImage) {
      await this.upload.destroyByUrl(oldImage);
    }
    return saved;
  }

  async remove(id: number): Promise<void> {
    const banner = await this.findById(id);
    await this.banners.delete(id);
    // Xóa hẳn → dọn ảnh trên Cloudinary.
    await this.upload.destroyByUrl(banner.image);
  }

  /** Cập nhật hàng loạt thứ tự (kéo–thả trong cùng một vị trí). */
  async reorder(dto: ReorderBannersDto): Promise<void> {
    if (dto.items.length === 0) return;

    const ids = dto.items.map((i) => i.id);
    const existing = await this.banners.find({ where: { id: In(ids) } });
    const byId = new Map(existing.map((b) => [b.id, b]));

    for (const item of dto.items) {
      const banner = byId.get(item.id);
      if (!banner) {
        throw new NotFoundException(`Không tìm thấy banner #${item.id}`);
      }
      banner.sortOrder = item.sortOrder;
    }

    await this.banners.save([...byId.values()]);
  }
}
