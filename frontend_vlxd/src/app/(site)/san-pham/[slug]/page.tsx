import { ChevronRight, Eye, Home, MessageCircle, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/JsonLd';
import { ProductCard, formatProductPrice } from '@/components/site/ProductCard';
import { ProductGallery } from '@/components/site/ProductGallery';
import { ProductTabs } from '@/components/site/ProductTabs';
import { SiteSidebar } from '@/components/site/SiteSidebar';
import { ViewTracker } from '@/components/site/ViewTracker';
import { getProductBySlug } from '@/lib/products';
import { absoluteUrl, buildMetadata } from '@/lib/seo';
import { getPublicSettings } from '@/lib/settings';
import type { PublicProduct } from '@/types/catalog';
import styles from './product-detail.module.scss';

export const revalidate = 120;

interface Props {
  params: { slug: string };
}

async function load(slug: string): Promise<PublicProduct | null> {
  return getProductBySlug(slug).catch(() => null);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await load(params.slug);
  if (!p) return buildMetadata({ title: 'Không tìm thấy sản phẩm', noIndex: true });
  return buildMetadata({
    title: p.metaTitle || p.name,
    description: p.metaDescription || p.shortDescription || undefined,
    keywords: p.metaKeywords || undefined,
    path: p.canonicalUrl || `/san-pham/${p.slug}`,
    image: p.ogImage || p.thumbnail || p.images?.[0]?.imagePath || undefined,
  });
}

export default async function ProductDetailPage({ params }: Props) {
  const [p, settings] = await Promise.all([
    load(params.slug),
    getPublicSettings(),
  ]);
  if (!p) notFound();

  const priceText = formatProductPrice(p);
  const isContact = p.priceType === 'contact' || p.price === null;

  // Nút liên hệ: Zalo (từ cấu hình) + gọi hotline.
  const zalo = settings.zalo || settings.social_zalo_oa || '';
  const zaloHref = zalo
    ? zalo.startsWith('http')
      ? zalo
      : `https://zalo.me/${zalo.replace(/\s/g, '')}`
    : null;
  const hotline = settings.hotline || '';
  const telHref = hotline ? `tel:${hotline.replace(/\s/g, '')}` : null;

  return (
    <>
      <ViewTracker slug={p.slug} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: p.name,
          sku: p.sku || undefined,
          image: p.images?.map((i) => i.imagePath) ?? (p.thumbnail ? [p.thumbnail] : []),
          description: p.shortDescription || undefined,
          category: p.category?.name,
          offers:
            p.priceType === 'fixed' && p.price != null
              ? {
                  '@type': 'Offer',
                  price: p.price,
                  priceCurrency: 'VND',
                  availability: 'https://schema.org/InStock',
                  url: absoluteUrl(`/san-pham/${p.slug}`),
                }
              : undefined,
        }}
      />

      {/* Thanh breadcrumb */}
      <div className={styles.crumbBar}>
        <nav className={`container ${styles.crumb}`} aria-label="Breadcrumb">
          <Link href="/" className={styles.crumbHome}>
            <Home size={15} />
            Trang chủ
          </Link>
          {p.category && (
            <>
              <ChevronRight size={14} className={styles.crumbSep} />
              <Link href={`/san-pham?category=${p.category.slug}`}>{p.category.name}</Link>
            </>
          )}
          <ChevronRight size={14} className={styles.crumbSep} />
          <span className={styles.crumbCurrent}>{p.name}</span>
        </nav>
      </div>

      <div className={`container ${styles.layout}`}>
        <SiteSidebar />

        <div className={styles.content}>
          <div className={styles.top}>
            <ProductGallery images={p.images} fallback={p.thumbnail} name={p.name} />

            <div className={styles.info}>
              <h1 className={styles.name}>{p.name}</h1>

              {p.sku && (
                <div className={styles.line}>
                  <span className={styles.label}>Mã sản phẩm:</span> {p.sku}
                </div>
              )}
              <div className={styles.line}>
                <span className={styles.label}>Giá bán:</span>{' '}
                <span className={[styles.price, isContact ? styles.contact : ''].join(' ')}>
                  {priceText}
                </span>
              </div>
              <div className={styles.line}>
                <span className={styles.label}>Lượt xem:</span>{' '}
                <span className={styles.views}>
                  <Eye size={14} /> {p.views}
                </span>
              </div>

              {p.attributeValues.length > 0 && (
                <ul className={styles.specs}>
                  {p.attributeValues.map((v) => (
                    <li key={v.attributeId}>
                      <span className={styles.specName}>
                        {v.attribute?.name}
                        {v.attribute?.unit ? ` (${v.attribute.unit})` : ''}:
                      </span>{' '}
                      {v.value}
                    </li>
                  ))}
                </ul>
              )}

              {p.shortDescription && (
                <p className={styles.short}>{p.shortDescription}</p>
              )}

              <div className={styles.cta}>
                {zaloHref ? (
                  <a
                    href={zaloHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.order} ${styles.pulse}`}
                  >
                    <MessageCircle size={18} /> Liên hệ Zalo
                  </a>
                ) : (
                  <Link href="/lien-he" className={styles.order}>
                    <MessageCircle size={18} /> Liên hệ
                  </Link>
                )}
                {telHref && (
                  <a href={telHref} className={styles.call}>
                    <Phone size={18} /> Gọi tư vấn
                  </a>
                )}
              </div>

              {p.tags.length > 0 && (
                <div className={styles.tags}>
                  {p.tags.map((t) => (
                    <Link key={t.id} href={`/san-pham?tag=${t.slug}`} className={styles.tag}>
                      #{t.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <ProductTabs
            content={p.content}
            testResult={p.testResult}
            testMedia={p.testMedia}
            images={p.images}
          />

          {p.related.length > 0 && (
            <section className={styles.block}>
              <h2 className={styles.sectionTitle}>Sản phẩm liên quan</h2>
              <div className={styles.relatedGrid}>
                {p.related.map((rp) => (
                  <ProductCard key={rp.id} product={rp} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
