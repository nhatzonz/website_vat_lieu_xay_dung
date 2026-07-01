import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SupportContact } from './support-contact.entity';
import { CreateSupportContactDto } from './dto/create-support-contact.dto';
import { ReorderSupportContactsDto } from './dto/reorder-support-contacts.dto';
import { UpdateSupportContactDto } from './dto/update-support-contact.dto';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportContact)
    private readonly contacts: Repository<SupportContact>,
  ) {}

  /** Danh sách công khai cho web: chỉ nhân viên đang bật, theo thứ tự hiển thị. */
  publicList(): Promise<SupportContact[]> {
    return this.contacts.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
  }

  /** Danh sách quản trị: toàn bộ nhân viên hỗ trợ. */
  findAll(): Promise<SupportContact[]> {
    return this.contacts.find({
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
  }

  async findById(id: number): Promise<SupportContact> {
    const contact = await this.contacts.findOne({ where: { id } });
    if (!contact) {
      throw new NotFoundException('Không tìm thấy nhân viên hỗ trợ');
    }
    return contact;
  }

  create(dto: CreateSupportContactDto): Promise<SupportContact> {
    const contact = this.contacts.create(dto);
    return this.contacts.save(contact);
  }

  async update(id: number, dto: UpdateSupportContactDto): Promise<SupportContact> {
    const contact = await this.findById(id);
    Object.assign(contact, dto);
    return this.contacts.save(contact);
  }

  async remove(id: number): Promise<void> {
    // Xóa hẳn: bảng nhỏ, không cần soft-delete, không có ảnh đi kèm.
    const result = await this.contacts.delete(id);
    if (!result.affected) {
      throw new NotFoundException('Không tìm thấy nhân viên hỗ trợ');
    }
  }

  /** Cập nhật hàng loạt thứ tự (kéo–thả). */
  async reorder(dto: ReorderSupportContactsDto): Promise<void> {
    if (dto.items.length === 0) return;

    const ids = dto.items.map((i) => i.id);
    const existing = await this.contacts.find({ where: { id: In(ids) } });
    const byId = new Map(existing.map((c) => [c.id, c]));

    for (const item of dto.items) {
      const contact = byId.get(item.id);
      if (!contact) {
        throw new NotFoundException(`Không tìm thấy nhân viên hỗ trợ #${item.id}`);
      }
      contact.sortOrder = item.sortOrder;
    }

    await this.contacts.save([...byId.values()]);
  }
}
