import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Not, Repository } from 'typeorm';
import { PaginatedResult } from '../../common/dto/paginated-result';
import { imageUrlsFromHtml } from '../../common/util/html-images';
import { sanitizeContent } from '../../common/util/sanitize';
import { uniqueSlug } from '../../common/util/slugify';
import { Attribute } from '../attributes/attribute.entity';
import { Category } from '../categories/category.entity';
import { Tag } from '../tags/tag.entity';
import { publicIdFromUrl } from '../upload/cloudinary-url';
import { UploadService } from '../upload/upload.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductAttributeValueDto } from './dto/product-children.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductAttributeValue } from './entities/product-attribute-value.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductTestMedia } from './entities/product-test-media.entity';
import { Product } from './entities/product.entity';

/** Cột tóm tắt cho danh sách (không kéo content/testResult nặng). */
const LIST_SELECT = [
  'p.id',
  'p.name',
  'p.slug',
  'p.sku',
  'p.price',
  'p.priceUnit',
  'p.priceType',
  'p.thumbnail',
  'p.shortDescription',
  'p.isNew',
  'p.isFeatured',
  'p.isActive',
  'p.views',
  'p.sortOrder',
  'p.createdAt',
  'c.id',
  'c.name',
  'c.slug',
];

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Category) private readonly categories: Repository<Category>,
    @InjectRepository(Tag) private readonly tags: Repository<Tag>,
    @InjectRepository(Attribute) private readonly attributes: Repository<Attribute>,
    private readonly dataSource: DataSource,
    private readonly upload: UploadService,
  ) {}

  // ================= PUBLIC =================

  /** Danh sách công khai (chỉ active), có lọc + phân trang + sắp xếp. */
  async publicList(query: QueryProductDto): Promise<PaginatedResult<Product>> {
    return this.list(query, true);
  }

  /** Chi tiết công khai theo slug: kèm ảnh, thông số, media, thẻ, SP liên quan. */
  async findPublicBySlug(slug: string) {
    const product = await this.products.findOne({
      where: { slug, isActive: true },
      relations: {
        category: true,
        images: true,
        attributeValues: { attribute: true },
        testMedia: true,
        tags: true,
      },
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');

    this.sortChildren(product);

    const related = await this.list(
      {
        page: 1,
        limit: 8,
        skip: 0,
        sort: 'newest',
        category: product.category?.slug,
        excludeId: product.id,
      } as QueryProductDto,
      true,
    );

    return { ...product, related: related.data };
  }

  /** Tăng lượt xem (gọi từ trang chi tiết). */
  async incrementView(slug: string): Promise<void> {
    await this.products
      .createQueryBuilder()
      .update(Product)
      .set({ views: () => 'views + 1' })
      .where('slug = :slug AND is_active = 1', { slug })
      .execute();
  }

  // ================= ADMIN =================

  /** Danh sách quản trị (mọi trạng thái, lọc theo `active` nếu có). */
  adminList(query: QueryProductDto): Promise<PaginatedResult<Product>> {
    return this.list(query, false);
  }

  /** Chi tiết đầy đủ cho form sửa. */
  async findByIdAdmin(id: number): Promise<Product> {
    const product = await this.products.findOne({
      where: { id },
      relations: {
        category: true,
        images: true,
        attributeValues: { attribute: true },
        testMedia: true,
        tags: true,
      },
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    this.sortChildren(product);
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    await this.assertCategory(dto.categoryId);
    const slug = await uniqueSlug(dto.slug || dto.name, (s) => this.slugExists(s));

    const id = await this.dataSource.transaction(async (m) => {
      const product = m.create(Product, this.scalarFields(dto, slug, true));
      const saved = await m.save(product);
      await this.saveChildren(m, saved.id, dto, true);
      return saved.id;
    });

    return this.findByIdAdmin(id);
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const existing = await this.products.findOne({
      where: { id },
      relations: { images: true, testMedia: true },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy sản phẩm');
    if (dto.categoryId !== undefined) await this.assertCategory(dto.categoryId);

    let slug = existing.slug;
    if (dto.slug !== undefined || dto.name !== undefined) {
      slug = await uniqueSlug(dto.slug || dto.name || existing.name, (s) =>
        this.slugExists(s, id),
      );
    }

    // Ảnh Cloudinary bị bỏ sau lần sửa này = tham chiếu cũ trừ tham chiếu mới.
    // (dto khuyết field nào → giữ nguyên field đó, không coi là bỏ ảnh.)
    const oldIds = this.cloudinaryIds(existing);
    const newIds = this.cloudinaryIds(this.mergedImageState(existing, dto));
    const orphans = [...oldIds].filter((pid) => !newIds.has(pid));

    await this.dataSource.transaction(async (m) => {
      await m.update(Product, id, this.scalarFields(dto, slug, false));
      await this.saveChildren(m, id, dto, false);
    });

    // Chỉ dọn sau khi commit thành công để không xóa nhầm khi rollback.
    for (const pid of orphans) await this.upload.destroy(pid);

    return this.findByIdAdmin(id);
  }

  /** Xóa sản phẩm + dọn mọi ảnh Cloudinary (con tự xóa theo CASCADE). */
  async remove(id: number): Promise<void> {
    const product = await this.products.findOne({
      where: { id },
      relations: { images: true, testMedia: true },
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');

    await this.products.delete(id);

    // Gồm cả ảnh nhúng trong content/testResult (dedupe theo public_id).
    for (const pid of this.cloudinaryIds(product)) await this.upload.destroy(pid);
  }

  // ================= helpers =================

  /** Bộ dựng truy vấn danh sách chung cho public + admin. */
  private async list(
    query: QueryProductDto,
    publicOnly: boolean,
  ): Promise<PaginatedResult<Product>> {
    const qb = this.products
      .createQueryBuilder('p')
      .leftJoin('p.category', 'c')
      .select(LIST_SELECT);

    if (publicOnly) {
      qb.andWhere('p.isActive = 1');
    } else if (query.active !== undefined) {
      qb.andWhere('p.isActive = :a', { a: query.active ? 1 : 0 });
    }

    if (query.category) {
      const ids = await this.categoryIdsForSlug(query.category);
      if (!ids) return new PaginatedResult<Product>([], 0, query.page, query.limit);
      qb.andWhere('p.categoryId IN (:...cids)', { cids: ids });
    }

    if (query.tag) {
      qb.innerJoin('p.tags', 't', 't.slug = :tag', { tag: query.tag });
    }

    if (query.isFeatured !== undefined) {
      qb.andWhere('p.isFeatured = :f', { f: query.isFeatured ? 1 : 0 });
    }
    if (query.isNew !== undefined) {
      qb.andWhere('p.isNew = :n', { n: query.isNew ? 1 : 0 });
    }
    if (query.excludeId) {
      qb.andWhere('p.id != :ex', { ex: query.excludeId });
    }
    if (query.q) {
      qb.andWhere('(p.name LIKE :q OR p.sku LIKE :q)', { q: `%${query.q}%` });
    }

    this.applySort(qb, query.sort);
    qb.skip(query.skip).take(query.limit);

    const [items, total] = await qb.getManyAndCount();
    if (query.withSpecs && items.length) {
      await this.attachSpecs(items);
    }
    return new PaginatedResult<Product>(items, total, query.page, query.limit);
  }

  /** Nạp thông số (attributeValues) cho danh sách item bằng 1 truy vấn gộp. */
  private async attachSpecs(items: Product[]): Promise<void> {
    const ids = items.map((i) => i.id);
    const avs = await this.products.manager
      .getRepository(ProductAttributeValue)
      .createQueryBuilder('av')
      .leftJoinAndSelect('av.attribute', 'a')
      .where('av.productId IN (:...ids)', { ids })
      .orderBy('av.productId', 'ASC')
      .addOrderBy('a.sortOrder', 'ASC')
      .getMany();
    const byProduct = new Map<number, ProductAttributeValue[]>();
    for (const av of avs) {
      const arr = byProduct.get(av.productId) ?? [];
      arr.push(av);
      byProduct.set(av.productId, arr);
    }
    for (const it of items) {
      it.attributeValues = byProduct.get(it.id) ?? [];
    }
  }

  private applySort(
    qb: ReturnType<Repository<Product>['createQueryBuilder']>,
    sort: QueryProductDto['sort'],
  ): void {
    switch (sort) {
      case 'oldest':
        qb.orderBy('p.createdAt', 'ASC');
        break;
      case 'price_asc':
        qb.orderBy('p.price', 'ASC');
        break;
      case 'price_desc':
        qb.orderBy('p.price', 'DESC');
        break;
      case 'popular':
        qb.orderBy('p.views', 'DESC');
        break;
      case 'name':
        qb.orderBy('p.name', 'ASC');
        break;
      default:
        // Mặc định: Nổi bật lên đầu, rồi tới thứ tự sắp xếp, rồi mới nhất.
        qb
          .orderBy('p.isFeatured', 'DESC')
          .addOrderBy('p.sortOrder', 'ASC')
          .addOrderBy('p.createdAt', 'DESC');
    }
    qb.addOrderBy('p.id', 'DESC');
  }

  /**
   * Tập `public_id` Cloudinary mà một sản phẩm đang tham chiếu, gộp mọi nguồn
   * ảnh: thumbnail, ogImage, thư viện, media thử nghiệm (ảnh), và ảnh nhúng
   * trong HTML content/testResult. URL ngoài Cloudinary → bỏ qua (id = null).
   */
  private cloudinaryIds(src: {
    thumbnail?: string | null;
    ogImage?: string | null;
    content?: string | null;
    testResult?: string | null;
    images?: { imagePath: string }[] | null;
    testMedia?: { mediaType: string; mediaValue: string }[] | null;
  }): Set<string> {
    const urls: (string | null | undefined)[] = [
      src.thumbnail,
      src.ogImage,
      ...imageUrlsFromHtml(src.content),
      ...imageUrlsFromHtml(src.testResult),
      ...(src.images ?? []).map((i) => i.imagePath),
      ...(src.testMedia ?? [])
        .filter((mm) => mm.mediaType === 'image')
        .map((mm) => mm.mediaValue),
    ];
    const ids = new Set<string>();
    for (const u of urls) {
      const id = publicIdFromUrl(u);
      if (id) ids.add(id);
    }
    return ids;
  }

  /**
   * Trạng thái ảnh sau khi áp `dto` lên sản phẩm hiện có: field nào dto không
   * gửi (`undefined`) thì giữ nguyên giá trị cũ — để so ảnh cũ/mới chuẩn xác
   * với các update từng phần (partial).
   */
  private mergedImageState(existing: Product, dto: UpdateProductDto) {
    return {
      thumbnail: dto.thumbnail !== undefined ? dto.thumbnail : existing.thumbnail,
      ogImage: dto.ogImage !== undefined ? dto.ogImage : existing.ogImage,
      content: dto.content !== undefined ? dto.content : existing.content,
      testResult:
        dto.testResult !== undefined ? dto.testResult : existing.testResult,
      images:
        dto.images !== undefined
          ? dto.images.map((i) => ({ imagePath: i.imagePath }))
          : (existing.images ?? []),
      testMedia:
        dto.testMedia !== undefined
          ? dto.testMedia.map((m) => ({
              mediaType: m.mediaType,
              mediaValue: m.mediaValue,
            }))
          : (existing.testMedia ?? []),
    };
  }

  /** Gom field vô hướng để insert/update (sanitize HTML). */
  private scalarFields(
    dto: CreateProductDto | UpdateProductDto,
    slug: string,
    isCreate: boolean,
  ): Partial<Product> {
    const out: Partial<Product> = {};
    const set = <K extends keyof Product>(k: K, v: Product[K] | undefined) => {
      if (v !== undefined) out[k] = v;
    };

    set('categoryId', dto.categoryId);
    set('name', dto.name);
    out.slug = slug;
    set('sku', (dto.sku ?? null) as never);
    set('price', (dto.price ?? null) as never);
    set('priceUnit', dto.priceUnit);
    set('priceType', dto.priceType);
    set('thumbnail', (dto.thumbnail ?? null) as never);
    set('shortDescription', (dto.shortDescription ?? null) as never);
    if (dto.content !== undefined) out.content = sanitizeContent(dto.content);
    if (dto.testResult !== undefined)
      out.testResult = sanitizeContent(dto.testResult);
    set('isNew', dto.isNew);
    set('isFeatured', dto.isFeatured);
    set('sortOrder', dto.sortOrder);
    set('metaTitle', (dto.metaTitle ?? null) as never);
    set('metaDescription', (dto.metaDescription ?? null) as never);
    set('metaKeywords', (dto.metaKeywords ?? null) as never);
    set('ogImage', (dto.ogImage ?? null) as never);
    set('canonicalUrl', (dto.canonicalUrl ?? null) as never);

    // isActive: khi tạo mặc định true nếu không gửi.
    if (dto.isActive !== undefined) out.isActive = dto.isActive;
    else if (isCreate) out.isActive = true;

    return out;
  }

  /** Ghi ảnh / thông số / media / thẻ. Khi update: xóa cũ rồi ghi lại nếu gửi. */
  private async saveChildren(
    m: EntityManager,
    productId: number,
    dto: CreateProductDto | UpdateProductDto,
    isCreate: boolean,
  ): Promise<void> {
    // Ảnh
    if (dto.images !== undefined) {
      if (!isCreate) await m.delete(ProductImage, { productId });
      const rows = dto.images.map((img, i) =>
        m.create(ProductImage, {
          productId,
          imagePath: img.imagePath,
          altText: img.altText ?? null,
          isPrimary: img.isPrimary ?? false,
          sortOrder: img.sortOrder ?? i,
        }),
      );
      if (rows.length) await m.save(rows);
    }

    // Thông số (chỉ giữ attributeId hợp lệ + value không rỗng)
    if (dto.attributeValues !== undefined) {
      if (!isCreate) await m.delete(ProductAttributeValue, { productId });
      const valid = await this.validAttributeValues(dto.attributeValues);
      const rows = valid.map((v) =>
        m.create(ProductAttributeValue, {
          productId,
          attributeId: v.attributeId,
          value: v.value.trim(),
        }),
      );
      if (rows.length) await m.save(rows);
    }

    // Media kết quả thử nghiệm
    if (dto.testMedia !== undefined) {
      if (!isCreate) await m.delete(ProductTestMedia, { productId });
      const rows = dto.testMedia.map((md, i) =>
        m.create(ProductTestMedia, {
          productId,
          mediaType: md.mediaType,
          mediaValue: md.mediaValue,
          caption: md.caption ?? null,
          sortOrder: md.sortOrder ?? i,
        }),
      );
      if (rows.length) await m.save(rows);
    }

    // Thẻ (quản lý join table product_tags bằng raw để đơn giản & chắc chắn)
    if (dto.tagIds !== undefined) {
      if (!isCreate)
        await m.query('DELETE FROM product_tags WHERE product_id = ?', [productId]);
      const ids = await this.validTagIds(dto.tagIds);
      if (ids.length) {
        const values = ids.map(() => '(?, ?)').join(', ');
        const params = ids.flatMap((tid) => [productId, tid]);
        await m.query(
          `INSERT INTO product_tags (product_id, tag_id) VALUES ${values}`,
          params,
        );
      }
    }
  }

  private async validTagIds(ids: number[]): Promise<number[]> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return [];
    const found = await this.tags.find({
      where: { id: In(unique) },
      select: { id: true },
    });
    return found.map((t) => t.id);
  }

  private async validAttributeValues(
    values: ProductAttributeValueDto[],
  ): Promise<ProductAttributeValueDto[]> {
    const nonEmpty = values.filter((v) => v.value && v.value.trim() !== '');
    if (nonEmpty.length === 0) return [];
    const ids = [...new Set(nonEmpty.map((v) => v.attributeId))];
    const found = await this.attributes.find({
      where: { id: In(ids) },
      select: { id: true },
    });
    const ok = new Set(found.map((a) => a.id));
    // Chống trùng attribute trên cùng 1 sản phẩm (unique constraint DB).
    const seen = new Set<number>();
    return nonEmpty.filter((v) => {
      if (!ok.has(v.attributeId) || seen.has(v.attributeId)) return false;
      seen.add(v.attributeId);
      return true;
    });
  }

  private async assertCategory(categoryId: number): Promise<void> {
    const exists = await this.categories.count({ where: { id: categoryId } });
    if (!exists) throw new BadRequestException('Danh mục không tồn tại');
  }

  private async slugExists(slug: string, exceptId?: number): Promise<boolean> {
    const count = await this.products.count({
      where: exceptId ? { slug, id: Not(exceptId) } : { slug },
    });
    return count > 0;
  }

  /** id danh mục theo slug + toàn bộ danh mục con (để list gồm cả nhánh con). */
  private async categoryIdsForSlug(slug: string): Promise<number[] | null> {
    const root = await this.categories.findOne({
      where: { slug },
      select: { id: true },
    });
    if (!root) return null;
    const all = await this.categories.find({ select: { id: true, parentId: true } });
    const childrenOf = new Map<number, number[]>();
    for (const c of all) {
      if (c.parentId != null) {
        const arr = childrenOf.get(c.parentId) ?? [];
        arr.push(c.id);
        childrenOf.set(c.parentId, arr);
      }
    }
    const ids = [root.id];
    const stack = [root.id];
    while (stack.length) {
      const cur = stack.pop()!;
      for (const ch of childrenOf.get(cur) ?? []) {
        ids.push(ch);
        stack.push(ch);
      }
    }
    return ids;
  }

  private sortChildren(product: Product): void {
    product.images?.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder);
    product.testMedia?.sort((a, b) => a.sortOrder - b.sortOrder);
    product.attributeValues?.sort(
      (a, b) => (a.attribute?.sortOrder ?? 0) - (b.attribute?.sortOrder ?? 0),
    );
  }
}
