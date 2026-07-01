'use client';

import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GalleryUploadField } from '@/components/admin/GalleryUploadField';
import { InlineImageField } from '@/components/admin/InlineImageField';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { Button } from '@/components/admin/ui/Button';
import { SearchableSelect } from '@/components/admin/ui/SearchableSelect';
import { SelectField, Switch, TextArea, TextField } from '@/components/admin/ui/Field';
import { Spinner } from '@/components/admin/ui/Spinner';
import { useToast } from '@/components/admin/ui/Toast';
import { adminApi, AdminApiError } from '@/lib/admin-api';
import { flattenTree } from '@/lib/category-tree';
import type {
  Attribute,
  Category,
  Product,
  ProductImageItem,
  ProductInput,
  ProductTestMediaItem,
  Tag,
} from '@/types/admin';
import styles from '../product-form.module.scss';

export default function ProductFormPage() {
  const router = useRouter();
  const toast = useToast();
  const params = useParams<{ id: string }>();
  const isNew = params.id === 'new';
  const productId = isNew ? null : Number(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSeo, setShowSeo] = useState(false);

  const [cats, setCats] = useState<Category[]>([]);
  const [attrs, setAttrs] = useState<Attribute[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [priceType, setPriceType] = useState<'fixed' | 'contact'>('fixed');
  const [price, setPrice] = useState('');
  const [priceUnit, setPriceUnit] = useState('đ/m2');
  const [shortDescription, setShortDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [images, setImages] = useState<ProductImageItem[]>([]);
  const [attrValues, setAttrValues] = useState<Record<number, string>>({});
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [content, setContent] = useState('');
  const [testResult, setTestResult] = useState('');
  const [testMedia, setTestMedia] = useState<ProductTestMediaItem[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isNewFlag, setIsNewFlag] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState('0');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, a, t] = await Promise.all([
        adminApi.get<Category[]>('/admin/categories'),
        adminApi.get<Attribute[]>('/admin/attributes'),
        adminApi.get<Tag[]>('/admin/tags'),
      ]);
      setCats(c);
      setAttrs(a.filter((x) => x.isActive));
      setTags(t);

      if (!isNew && productId) {
        const p = await adminApi.get<Product>(`/admin/products/${productId}`);
        setName(p.name);
        setSlug(p.slug);
        setSku(p.sku ?? '');
        setCategoryId(p.category?.id ?? null);
        setPriceType(p.priceType);
        setPrice(p.price != null ? String(p.price) : '');
        setPriceUnit(p.priceUnit || 'đ/m2');
        setShortDescription(p.shortDescription ?? '');
        setThumbnail(p.thumbnail ?? '');
        setImages(p.images ?? []);
        setAttrValues(
          Object.fromEntries((p.attributeValues ?? []).map((v) => [v.attributeId, v.value])),
        );
        setTagIds((p.tags ?? []).map((tg) => tg.id));
        setContent(p.content ?? '');
        setTestResult(p.testResult ?? '');
        setTestMedia(p.testMedia ?? []);
        setIsActive(p.isActive);
        setIsNewFlag(p.isNew);
        setIsFeatured(p.isFeatured);
        setSortOrder(String(p.sortOrder));
        setMetaTitle(p.metaTitle ?? '');
        setMetaDescription(p.metaDescription ?? '');
        setMetaKeywords(p.metaKeywords ?? '');
        setOgImage(p.ogImage ?? '');
        setCanonicalUrl(p.canonicalUrl ?? '');
      }
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Không tải được dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, [isNew, productId]);

  useEffect(() => {
    load();
  }, [load]);

  const catOptions = useMemo(
    () =>
      flattenTree(cats).map((r) => ({
        value: r.category.id,
        label: `${'— '.repeat(r.depth)}${r.category.name}`,
      })),
    [cats],
  );

  function toggleTag(id: number) {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function updateMedia(i: number, patch: Partial<ProductTestMediaItem>) {
    setTestMedia((prev) => prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  }

  function buildPayload(): ProductInput {
    const primary = images.find((i) => i.isPrimary) ?? images[0];
    return {
      categoryId: categoryId as number,
      name: name.trim(),
      slug: slug.trim() || undefined,
      sku: sku.trim() || undefined,
      priceType,
      price: priceType === 'contact' ? null : Number(price) || 0,
      priceUnit: priceUnit.trim() || undefined,
      shortDescription: shortDescription.trim() || undefined,
      thumbnail: thumbnail.trim() || primary?.imagePath || undefined,
      content: content || undefined,
      testResult: testResult || undefined,
      isActive,
      isNew: isNewFlag,
      isFeatured,
      sortOrder: Number(sortOrder) || 0,
      metaTitle: metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
      metaKeywords: metaKeywords.trim() || undefined,
      ogImage: ogImage.trim() || undefined,
      canonicalUrl: canonicalUrl.trim() || undefined,
      images: images.map((img, i) => ({
        imagePath: img.imagePath,
        altText: img.altText ?? undefined,
        isPrimary: img.isPrimary ?? false,
        sortOrder: i,
      })),
      attributeValues: Object.entries(attrValues)
        .filter(([, v]) => v && v.trim() !== '')
        .map(([attributeId, value]) => ({ attributeId: Number(attributeId), value: value.trim() })),
      testMedia: testMedia
        .filter((m) => m.mediaValue.trim() !== '')
        .map((m, i) => ({
          mediaType: m.mediaType,
          mediaValue: m.mediaValue.trim(),
          caption: m.caption?.trim() || undefined,
          sortOrder: i,
        })),
      tagIds,
    };
  }

  async function submit() {
    setError(null);
    if (!name.trim()) return setError('Vui lòng nhập tên sản phẩm.');
    if (!categoryId) return setError('Vui lòng chọn danh mục.');

    setSaving(true);
    try {
      const payload = buildPayload();
      if (isNew) {
        await adminApi.post('/admin/products', payload);
        toast.success('Đã thêm sản phẩm.');
      } else {
        await adminApi.put(`/admin/products/${productId}`, payload);
        toast.success('Đã cập nhật sản phẩm.');
      }
      router.push('/admin/products');
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Lưu sản phẩm thất bại.');
      setSaving(false);
    }
  }

  if (loading) return <Spinner label="Đang tải..." />;

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => router.push('/admin/products')}
          title="Quay lại"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className={styles.title}>{isNew ? 'Thêm sản phẩm' : 'Sửa sản phẩm'}</h1>
      </div>

      {error && <div className={styles.alert}>{error}</div>}

      <div className={styles.grid}>
        {/* Cột chính */}
        <div className={styles.col}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Thông tin cơ bản</h2>
            <div className={styles.row}>
              <TextField
                id="p-name"
                label="Tên sản phẩm *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <TextField
                id="p-slug"
                label="Slug"
                hint="Để trống sẽ tự sinh."
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            <div className={styles.row}>
              <TextField
                id="p-sku"
                label="Mã SKU"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
              <SearchableSelect
                id="p-cat"
                label="Danh mục *"
                value={categoryId}
                options={catOptions}
                onChange={setCategoryId}
              />
            </div>
            <div className={styles.row}>
              <SelectField
                id="p-ptype"
                label="Kiểu giá"
                value={priceType}
                onChange={(e) => setPriceType(e.target.value as 'fixed' | 'contact')}
              >
                <option value="fixed">Giá cố định</option>
                <option value="contact">Liên hệ</option>
              </SelectField>
              {priceType === 'fixed' && (
                <div className={styles.row}>
                  <TextField
                    id="p-price"
                    label="Giá"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                  <TextField
                    id="p-punit"
                    label="Đơn vị"
                    value={priceUnit}
                    onChange={(e) => setPriceUnit(e.target.value)}
                  />
                </div>
              )}
            </div>
            <TextArea
              id="p-short"
              label="Mô tả ngắn"
              rows={2}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
            />
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Thư viện ảnh</h2>
            <GalleryUploadField value={images} onChange={setImages} />
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Thông số kỹ thuật</h2>
            {attrs.length === 0 ? (
              <p className={styles.muted}>
                Chưa có thuộc tính nào. Tạo ở mục “Thuộc tính”.
              </p>
            ) : (
              attrs.map((a) => (
                <div key={a.id} className={styles.attrRow}>
                  <span className={styles.attrLabel}>
                    {a.name}
                    {a.unit && <span className={styles.attrUnit}> ({a.unit})</span>}
                  </span>
                  <TextField
                    id={`attr-${a.id}`}
                    value={attrValues[a.id] ?? ''}
                    placeholder="Để trống nếu không có"
                    onChange={(e) =>
                      setAttrValues((prev) => ({ ...prev, [a.id]: e.target.value }))
                    }
                  />
                </div>
              ))
            )}
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Mô tả chi tiết</h2>
            <RichTextEditor
              value={content}
              onChange={setContent}
              hint="Định dạng chữ, chèn ảnh/liên kết trực tiếp. Nội dung được làm sạch chống XSS khi lưu."
              placeholder="Nhập mô tả chi tiết sản phẩm…"
            />
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Kết quả thử nghiệm</h2>
            <RichTextEditor
              value={testResult}
              onChange={setTestResult}
              label="Nội dung"
              placeholder="Nhập nội dung kết quả thử nghiệm…"
            />
            {testMedia.map((m, i) => (
              <div key={i} className={styles.mediaRow}>
                <SelectField
                  id={`tm-type-${i}`}
                  value={m.mediaType}
                  onChange={(e) =>
                    updateMedia(i, { mediaType: e.target.value as 'youtube' | 'image' })
                  }
                >
                  <option value="youtube">YouTube</option>
                  <option value="image">Ảnh (URL)</option>
                </SelectField>
                <TextField
                  id={`tm-val-${i}`}
                  placeholder={m.mediaType === 'youtube' ? 'Link YouTube' : 'URL ảnh'}
                  value={m.mediaValue}
                  onChange={(e) => updateMedia(i, { mediaValue: e.target.value })}
                />
                <TextField
                  id={`tm-cap-${i}`}
                  placeholder="Chú thích (tùy chọn)"
                  value={m.caption ?? ''}
                  onChange={(e) => updateMedia(i, { caption: e.target.value })}
                />
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => setTestMedia((prev) => prev.filter((_, idx) => idx !== i))}
                  title="Xóa"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<Plus size={15} />}
              className={styles.addRow}
              onClick={() =>
                setTestMedia((prev) => [...prev, { mediaType: 'youtube', mediaValue: '' }])
              }
            >
              Nhúng video YouTube
            </Button>
          </section>
        </div>

        {/* Cột phụ */}
        <div className={styles.col}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Hiển thị</h2>
            <div className={styles.switches}>
              <Switch checked={isActive} onChange={setIsActive} label="Hiển thị sản phẩm" />
              <Switch checked={isNewFlag} onChange={setIsNewFlag} label="Sản phẩm mới" />
              <Switch checked={isFeatured} onChange={setIsFeatured} label="Nổi bật (trang chủ)" />
            </div>
            <TextField
              id="p-sort"
              label="Thứ tự sắp xếp"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Ảnh đại diện</h2>
            <InlineImageField
              label=""
              kind="product"
              value={thumbnail}
              hint="Để trống sẽ dùng ảnh chính trong thư viện."
              onChange={setThumbnail}
            />
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Thẻ</h2>
            {tags.length === 0 ? (
              <p className={styles.muted}>Chưa có thẻ nào.</p>
            ) : (
              <div className={styles.chips}>
                {tags.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={[styles.chip, tagIds.includes(t.id) ? styles.chipOn : '']
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => toggleTag(t.id)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className={styles.card}>
            <button
              type="button"
              className={styles.seoToggle}
              onClick={() => setShowSeo((s) => !s)}
            >
              {showSeo ? '▾' : '▸'} Tùy chọn SEO
            </button>
            {showSeo && (
              <>
                <TextField
                  id="p-mtitle"
                  label="Meta title"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                />
                <TextArea
                  id="p-mdesc"
                  label="Meta description"
                  rows={2}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                />
                <TextField
                  id="p-mkw"
                  label="Meta keywords"
                  value={metaKeywords}
                  onChange={(e) => setMetaKeywords(e.target.value)}
                />
                <InlineImageField
                  label="OG image"
                  kind="og"
                  value={ogImage}
                  onChange={setOgImage}
                />
                <TextField
                  id="p-canon"
                  label="Canonical URL"
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                />
              </>
            )}
          </section>
        </div>
      </div>

      <div className={styles.saveBar}>
        <Button
          variant="secondary"
          onClick={() => router.push('/admin/products')}
          disabled={saving}
        >
          Hủy
        </Button>
        <Button loading={saving} onClick={submit}>
          {isNew ? 'Thêm sản phẩm' : 'Lưu thay đổi'}
        </Button>
      </div>
    </div>
  );
}
