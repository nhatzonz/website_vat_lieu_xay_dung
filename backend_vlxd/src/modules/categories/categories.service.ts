import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, QueryFailedError, Repository } from 'typeorm';
import { uniqueSlug } from '../../common/util/slugify';
import { UploadService } from '../upload/upload.service';
import { Category } from './category.entity';
import { BulkCategoriesDto } from './dto/bulk-categories.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

export interface CategoryNode extends Category {
  children: CategoryNode[];
}

export interface CategoryWithChildren extends Category {
  children: Category[];
}

/** Bản ghi danh mục cho bảng quản trị, kèm số sản phẩm trực tiếp thuộc nó. */
export interface CategoryWithCount extends Category {
  productCount: number;
}

/** Độ sâu tối đa của cây danh mục (gốc = cấp 1). */
const MAX_DEPTH = 4;
/** Mã lỗi MySQL khi xóa vi phạm ràng buộc khóa ngoại (RESTRICT). */
const ER_ROW_IS_REFERENCED = 1451;

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
    private readonly upload: UploadService,
  ) {}

  /**
   * Cây danh mục cho menu/sidebar.
   * - Mặc định chỉ lấy danh mục active; con của danh mục cha bị ẩn cũng bị ẩn
   *   theo (không "trồi" lên thành mục gốc).
   * - includeInactive=true: trả toàn bộ (cho admin xem cấu trúc).
   */
  async tree(includeInactive = false): Promise<CategoryNode[]> {
    const all = await this.categories.find({
      where: includeInactive ? {} : { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return this.buildTree(all);
  }

  /** Danh sách phẳng cho bảng quản trị, kèm số sản phẩm trực tiếp mỗi danh mục. */
  async findAll(): Promise<CategoryWithCount[]> {
    const all = await this.categories.find({
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    const counts = await this.productCounts();
    return all.map((c) => ({ ...c, productCount: counts.get(c.id) ?? 0 }));
  }

  /** Danh mục trong thùng rác (đã xóa mềm), mới xóa lên trước. */
  findTrashed(): Promise<Category[]> {
    return this.categories.find({
      where: { deletedAt: Not(IsNull()) },
      withDeleted: true,
      order: { deletedAt: 'DESC' },
    });
  }

  /**
   * Số sản phẩm trực tiếp theo từng danh mục (category_id). Truy vấn thẳng bảng
   * `products` để không phụ thuộc module sản phẩm (chưa có). Bảng chưa tồn tại
   * thì coi như tất cả bằng 0.
   */
  private async productCounts(): Promise<Map<number, number>> {
    const map = new Map<number, number>();
    try {
      const rows: Array<{ categoryId: number | string; cnt: number | string }> =
        await this.categories.manager.query(
          'SELECT category_id AS categoryId, COUNT(*) AS cnt FROM products GROUP BY category_id',
        );
      for (const r of rows) {
        map.set(Number(r.categoryId), Number(r.cnt));
      }
    } catch {
      // Bảng products chưa tồn tại / chưa seed → bỏ qua, trả map rỗng.
    }
    return map;
  }

  /**
   * Chi tiết công khai theo slug: chỉ danh mục đang active, kèm danh mục con
   * active (sắp theo sort_order) để dựng trang danh sách sản phẩm.
   */
  async findPublicBySlug(slug: string): Promise<CategoryWithChildren> {
    const category = await this.categories.findOne({
      where: { slug, isActive: true },
    });
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }
    const children = await this.categories.find({
      where: { parentId: category.id, isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return { ...category, children };
  }

  async findById(id: number): Promise<Category> {
    const category = await this.categories.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const parentId = dto.parentId ?? null;
    await this.assertParentValid(parentId);

    const slug = await uniqueSlug(dto.slug || dto.name, (s) => this.slugExists(s));
    const entity = this.categories.create({
      isActive: true, // mặc định hiển thị khi tạo mới
      ...this.mapDto(dto),
      slug,
    });
    return this.categories.save(entity);
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findById(id);
    const oldImage = category.image;
    const oldOgImage = category.ogImage;

    if (dto.parentId !== undefined) {
      const nextParent = dto.parentId ?? null;
      await this.assertParentValid(nextParent, id);
    }

    if (dto.slug !== undefined || dto.name !== undefined) {
      const base = dto.slug || dto.name || category.name;
      category.slug = await uniqueSlug(base, (s) => this.slugExists(s, id));
    }

    Object.assign(category, this.mapDto(dto, false));
    const saved = await this.categories.save(category);

    // Đổi/gỡ ảnh → dọn ảnh cũ trên Cloudinary (chỉ khi field được gửi & khác).
    if (dto.image !== undefined && oldImage && oldImage !== saved.image) {
      await this.upload.destroyByUrl(oldImage);
    }
    if (dto.ogImage !== undefined && oldOgImage && oldOgImage !== saved.ogImage) {
      await this.upload.destroyByUrl(oldOgImage);
    }
    return saved;
  }

  /**
   * Xóa MỀM (đưa vào thùng rác). An toàn:
   *  - Còn danh mục con (chưa xóa) → 409 (tránh để con mồ côi cha bị ẩn).
   * Sản phẩm liên kết KHÔNG chặn xóa mềm (vẫn khôi phục được), nhưng danh mục
   * đã xóa mềm bị loại khỏi cây/công khai nên không còn hiển thị sản phẩm.
   */
  async remove(id: number): Promise<void> {
    await this.findById(id);
    await this.assertNoChildren(id);
    await this.categories.softDelete(id);
  }

  /** Khôi phục danh mục từ thùng rác. */
  async restore(id: number): Promise<Category> {
    const category = await this.categories.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }
    if (!category.deletedAt) {
      return category; // chưa bị xóa → không cần làm gì
    }
    await this.categories.restore(id);
    category.deletedAt = null;
    return category;
  }

  /**
   * Xóa VĨNH VIỄN khỏi DB. An toàn:
   *  - Còn danh mục con (kể cả đã xóa mềm) → 409.
   *  - Còn sản phẩm liên kết → DB chặn (RESTRICT) → bắt lại thành 409 sạch.
   */
  async forceRemove(id: number): Promise<void> {
    const category = await this.categories.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    const childCount = await this.categories.count({
      where: { parentId: id },
      withDeleted: true,
    });
    if (childCount > 0) {
      throw new ConflictException(
        'Danh mục còn danh mục con, hãy xóa hoặc chuyển chúng trước',
      );
    }

    try {
      await this.categories.delete(id);
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        (err.driverError as { errno?: number })?.errno === ER_ROW_IS_REFERENCED
      ) {
        throw new ConflictException('Danh mục còn sản phẩm, không thể xóa');
      }
      throw err;
    }

    // Xóa vĩnh viễn thành công → dọn ảnh trên Cloudinary.
    await this.upload.destroyByUrl(category.image);
    await this.upload.destroyByUrl(category.ogImage);
  }

  /**
   * Cập nhật hàng loạt thứ tự (+ cha mới khi kéo sang nhánh khác). Mỗi item
   * được kiểm tra hợp lệ về cha (chống chu trình/độ sâu) trước khi lưu.
   */
  async reorder(dto: ReorderCategoriesDto): Promise<void> {
    if (dto.items.length === 0) return;

    const ids = dto.items.map((i) => i.id);
    const existing = await this.categories.find({ where: { id: In(ids) } });
    const byId = new Map(existing.map((c) => [c.id, c]));

    for (const item of dto.items) {
      const category = byId.get(item.id);
      if (!category) {
        throw new NotFoundException(`Không tìm thấy danh mục #${item.id}`);
      }
      if (item.parentId !== undefined) {
        const nextParent = item.parentId ?? null;
        if (nextParent !== category.parentId) {
          await this.assertParentValid(nextParent, item.id);
          category.parentId = nextParent;
        }
      }
      category.sortOrder = item.sortOrder;
    }

    await this.categories.save([...byId.values()]);
  }

  /** Thao tác hàng loạt: bật/ẩn hiển thị, hoặc xóa mềm nhiều danh mục. */
  async bulk(dto: BulkCategoriesDto): Promise<{ affected: number }> {
    const ids = [...new Set(dto.ids)];
    if (ids.length === 0) return { affected: 0 };

    if (dto.action === 'activate' || dto.action === 'deactivate') {
      const res = await this.categories.update(
        { id: In(ids) },
        { isActive: dto.action === 'activate' },
      );
      return { affected: res.affected ?? 0 };
    }

    // action === 'delete' (xóa mềm). Chặn nếu bất kỳ mục nào còn con NGOÀI tập chọn.
    const blocked = await this.categories.find({
      where: { parentId: In(ids) },
      select: { id: true, parentId: true },
    });
    const offending = blocked.find((c) => !ids.includes(c.parentId as number));
    if (offending) {
      throw new ConflictException(
        'Một số danh mục còn danh mục con ngoài danh sách đã chọn, không thể xóa',
      );
    }
    const res = await this.categories.softDelete({ id: In(ids) });
    return { affected: res.affected ?? 0 };
  }

  // ---- helpers ----

  private async assertNoChildren(id: number): Promise<void> {
    const childCount = await this.categories.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new ConflictException(
        'Danh mục còn danh mục con, hãy xóa hoặc chuyển chúng trước',
      );
    }
  }

  private mapDto(
    dto: CreateCategoryDto | UpdateCategoryDto,
    withSlug = true,
  ): Partial<Category> {
    const out: Partial<Category> = {};
    if (dto.name !== undefined) out.name = dto.name;
    if (withSlug && dto.slug !== undefined) out.slug = dto.slug;
    if (dto.parentId !== undefined) out.parentId = dto.parentId ?? null;
    if (dto.description !== undefined) out.description = dto.description ?? null;
    if (dto.image !== undefined) out.image = dto.image ?? null;
    if (dto.sortOrder !== undefined) out.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) out.isActive = dto.isActive;
    if (dto.metaTitle !== undefined) out.metaTitle = dto.metaTitle ?? null;
    if (dto.metaDescription !== undefined)
      out.metaDescription = dto.metaDescription ?? null;
    if (dto.metaKeywords !== undefined)
      out.metaKeywords = dto.metaKeywords ?? null;
    if (dto.ogImage !== undefined) out.ogImage = dto.ogImage ?? null;
    if (dto.canonicalUrl !== undefined)
      out.canonicalUrl = dto.canonicalUrl ?? null;
    return out;
  }

  private async slugExists(slug: string, exceptId?: number): Promise<boolean> {
    const count = await this.categories.count({
      where: exceptId ? { slug, id: Not(exceptId) } : { slug },
    });
    return count > 0;
  }

  /**
   * Kiểm tra hợp lệ khi đặt cha:
   *  - cha tồn tại;
   *  - không tự làm cha của mình;
   *  - cha KHÔNG nằm trong nhánh con của chính node (chống chu trình);
   *  - không vượt quá độ sâu tối đa.
   * `movingId` = id node đang sửa (bỏ qua khi tạo mới).
   */
  private async assertParentValid(
    parentId: number | null,
    movingId?: number,
  ): Promise<void> {
    if (parentId === null) return;

    if (movingId !== undefined && parentId === movingId) {
      throw new BadRequestException('Danh mục không thể là cha của chính nó');
    }

    const all = await this.categories.find({
      select: { id: true, parentId: true },
    });
    const byId = new Map(all.map((c) => [c.id, c.parentId]));

    if (!byId.has(parentId)) {
      throw new BadRequestException('Danh mục cha không tồn tại');
    }

    // Chống chu trình: đi ngược từ parent lên gốc; nếu gặp lại movingId => vòng lặp.
    let cursor: number | null = parentId;
    let depth = 1; // cha đang ở ít nhất cấp 1
    const seen = new Set<number>();
    while (cursor !== null && cursor !== undefined) {
      if (movingId !== undefined && cursor === movingId) {
        throw new BadRequestException(
          'Không thể chuyển danh mục vào chính nhánh con của nó',
        );
      }
      if (seen.has(cursor)) break; // an toàn nếu dữ liệu cũ đã có chu trình
      seen.add(cursor);
      cursor = byId.get(cursor) ?? null;
      depth += 1;
    }

    if (depth > MAX_DEPTH) {
      throw new BadRequestException(
        `Vượt quá độ sâu tối đa (${MAX_DEPTH} cấp) cho cây danh mục`,
      );
    }
  }

  private buildTree(all: Category[]): CategoryNode[] {
    const byId = new Map<number, CategoryNode>();
    all.forEach((c) => byId.set(c.id, { ...c, children: [] } as CategoryNode));
    const roots: CategoryNode[] = [];
    byId.forEach((node) => {
      if (node.parentId === null) {
        roots.push(node);
      } else if (byId.has(node.parentId)) {
        byId.get(node.parentId)!.children.push(node);
      }
      // parentId trỏ tới node không có trong tập (vd cha bị ẩn) => bỏ qua,
      // không cho con "trồi" lên làm mục gốc.
    });
    return roots;
  }
}
