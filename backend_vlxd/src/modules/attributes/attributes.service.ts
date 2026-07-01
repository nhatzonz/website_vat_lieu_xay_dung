import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Attribute } from './attribute.entity';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { ReorderAttributesDto } from './dto/reorder-attributes.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';

@Injectable()
export class AttributesService {
  constructor(
    @InjectRepository(Attribute)
    private readonly attributes: Repository<Attribute>,
  ) {}

  /** Thuộc tính active cho form nhập sản phẩm / hiển thị công khai. */
  publicList(): Promise<Attribute[]> {
    return this.attributes.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  /** Toàn bộ thuộc tính cho bảng quản trị. */
  findAll(): Promise<Attribute[]> {
    return this.attributes.find({ order: { sortOrder: 'ASC', name: 'ASC' } });
  }

  async findById(id: number): Promise<Attribute> {
    const attr = await this.attributes.findOne({ where: { id } });
    if (!attr) throw new NotFoundException('Không tìm thấy thuộc tính');
    return attr;
  }

  async create(dto: CreateAttributeDto): Promise<Attribute> {
    await this.assertNameUnique(dto.name);
    const entity = this.attributes.create({ isActive: true, ...dto });
    return this.attributes.save(entity);
  }

  async update(id: number, dto: UpdateAttributeDto): Promise<Attribute> {
    const attr = await this.findById(id);
    if (dto.name !== undefined && dto.name !== attr.name) {
      await this.assertNameUnique(dto.name, id);
    }
    Object.assign(attr, dto);
    return this.attributes.save(attr);
  }

  /**
   * Xóa an toàn: nếu thuộc tính đã được gán giá trị cho sản phẩm nào đó
   * (product_attribute_values) thì chặn (409) để tránh mất dữ liệu thông số.
   */
  async remove(id: number): Promise<void> {
    await this.findById(id);
    if (await this.isUsed(id)) {
      throw new ConflictException(
        'Thuộc tính đang được dùng ở sản phẩm, không thể xóa',
      );
    }
    await this.attributes.delete(id);
  }

  /** Cập nhật hàng loạt thứ tự (kéo–thả). */
  async reorder(dto: ReorderAttributesDto): Promise<void> {
    if (dto.items.length === 0) return;
    const ids = dto.items.map((i) => i.id);
    const existing = await this.attributes.find({ where: { id: In(ids) } });
    const byId = new Map(existing.map((a) => [a.id, a]));
    for (const item of dto.items) {
      const attr = byId.get(item.id);
      if (!attr) throw new NotFoundException(`Không tìm thấy thuộc tính #${item.id}`);
      attr.sortOrder = item.sortOrder;
    }
    await this.attributes.save([...byId.values()]);
  }

  // ---- helpers ----

  private async assertNameUnique(name: string, exceptId?: number): Promise<void> {
    const count = await this.attributes.count({
      where: exceptId ? { name, id: Not(exceptId) } : { name },
    });
    if (count > 0) {
      throw new ConflictException('Tên thuộc tính đã tồn tại');
    }
  }

  /** Thuộc tính có đang được gán cho sản phẩm nào không. */
  private async isUsed(id: number): Promise<boolean> {
    try {
      const rows: Array<{ cnt: number | string }> =
        await this.attributes.manager.query(
          'SELECT COUNT(*) AS cnt FROM product_attribute_values WHERE attribute_id = ? LIMIT 1',
          [id],
        );
      return Number(rows[0]?.cnt ?? 0) > 0;
    } catch {
      // Bảng chưa tồn tại (chưa làm module sản phẩm) → coi như chưa dùng.
      return false;
    }
  }
}
