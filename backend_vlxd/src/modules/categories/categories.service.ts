import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, QueryFailedError, Repository } from 'typeorm';
import { uniqueSlug } from '../../common/util/slugify';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

export interface CategoryNode extends Category {
  children: CategoryNode[];
}

export interface CategoryWithChildren extends Category {
  children: Category[];
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

  /** Danh sách phẳng cho bảng quản trị. */
  findAll(): Promise<Category[]> {
    return this.categories.find({ order: { sortOrder: 'ASC', name: 'ASC' } });
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

    if (dto.parentId !== undefined) {
      const nextParent = dto.parentId ?? null;
      await this.assertParentValid(nextParent, id);
    }

    if (dto.slug !== undefined || dto.name !== undefined) {
      const base = dto.slug || dto.name || category.name;
      category.slug = await uniqueSlug(base, (s) => this.slugExists(s, id));
    }

    Object.assign(category, this.mapDto(dto, false));
    return this.categories.save(category);
  }

  /**
   * Xóa an toàn:
   *  - Còn danh mục con  → 409 (tránh CASCADE xóa nhầm cả cây con).
   *  - Còn sản phẩm liên kết → DB chặn (RESTRICT) → bắt lại thành 409 sạch.
   */
  async remove(id: number): Promise<void> {
    await this.findById(id);

    const childCount = await this.categories.count({
      where: { parentId: id },
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
        throw new ConflictException(
          'Danh mục còn sản phẩm, không thể xóa',
        );
      }
      throw err;
    }
  }

  // ---- helpers ----

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
