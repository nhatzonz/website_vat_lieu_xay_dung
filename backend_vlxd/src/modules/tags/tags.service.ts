import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { uniqueSlug } from '../../common/util/slugify';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Tag } from './tag.entity';

/** Thẻ kèm số sản phẩm đang gắn (cho bảng quản trị). */
export interface TagWithCount extends Tag {
  productCount: number;
}

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tags: Repository<Tag>,
  ) {}

  /** Danh sách thẻ công khai (sắp theo tên). */
  publicList(): Promise<Tag[]> {
    return this.tags.find({ order: { name: 'ASC' } });
  }

  /** Bảng quản trị: kèm số sản phẩm đang gắn mỗi thẻ. */
  async findAll(): Promise<TagWithCount[]> {
    const all = await this.tags.find({ order: { name: 'ASC' } });
    const counts = await this.productCounts();
    return all.map((t) => ({ ...t, productCount: counts.get(t.id) ?? 0 }));
  }

  async findById(id: number): Promise<Tag> {
    const tag = await this.tags.findOne({ where: { id } });
    if (!tag) throw new NotFoundException('Không tìm thấy thẻ');
    return tag;
  }

  async create(dto: CreateTagDto): Promise<Tag> {
    const slug = await uniqueSlug(dto.slug || dto.name, (s) => this.slugExists(s));
    const entity = this.tags.create({ name: dto.name, slug });
    return this.tags.save(entity);
  }

  async update(id: number, dto: UpdateTagDto): Promise<Tag> {
    const tag = await this.findById(id);
    if (dto.name !== undefined) tag.name = dto.name;
    if (dto.slug !== undefined || dto.name !== undefined) {
      const base = dto.slug || dto.name || tag.name;
      tag.slug = await uniqueSlug(base, (s) => this.slugExists(s, id));
    }
    return this.tags.save(tag);
  }

  /** Xóa thẻ (liên kết product_tags tự gỡ theo CASCADE, không mất sản phẩm). */
  async remove(id: number): Promise<void> {
    await this.findById(id);
    await this.tags.delete(id);
  }

  // ---- helpers ----

  private async slugExists(slug: string, exceptId?: number): Promise<boolean> {
    const count = await this.tags.count({
      where: exceptId ? { slug, id: Not(exceptId) } : { slug },
    });
    return count > 0;
  }

  /** Số sản phẩm gắn mỗi thẻ (từ product_tags). Bảng chưa có → tất cả = 0. */
  private async productCounts(): Promise<Map<number, number>> {
    const map = new Map<number, number>();
    try {
      const rows: Array<{ tagId: number | string; cnt: number | string }> =
        await this.tags.manager.query(
          'SELECT tag_id AS tagId, COUNT(*) AS cnt FROM product_tags GROUP BY tag_id',
        );
      for (const r of rows) map.set(Number(r.tagId), Number(r.cnt));
    } catch {
      // product_tags chưa tồn tại → map rỗng.
    }
    return map;
  }
}
