import type { Metadata } from 'next';
import Link from 'next/link';
import { ProductCard } from '@/components/site/ProductCard';
import { ProductSortSelect } from '@/components/site/ProductSortSelect';
import { SiteSidebar } from '@/components/site/SiteSidebar';
import { getCategoryTree, findCategoryBySlug } from '@/lib/categories';
import { getProducts } from '@/lib/products';
import { buildMetadata } from '@/lib/seo';
import type { PublicCategory } from '@/types/catalog';
import styles from './san-pham.module.scss';

export const revalidate = 120;

interface Props {
  searchParams: {
    category?: string;
    tag?: string;
    sort?: string;
    page?: string;
    q?: string;
  };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const title = searchParams.q
    ? `Tìm: ${searchParams.q}`
    : 'Sản phẩm';
  return buildMetadata({ title, path: '/san-pham' });
}

export default async function ProductListPage({ searchParams }: Props) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const sort = searchParams.sort || 'newest';
  const category = searchParams.category;

  const [tree, listing] = await Promise.all([
    getCategoryTree().catch(() => [] as PublicCategory[]),
    getProducts({
      page,
      limit: 12,
      sort,
      category,
      tag: searchParams.tag,
      q: searchParams.q,
    }).catch(() => ({ data: [], meta: { total: 0, page: 1, limit: 12, totalPages: 1 } })),
  ]);

  const activeCat = category ? findCategoryBySlug(tree, category)?.node : null;
  const heading = activeCat?.name || (searchParams.q ? `Kết quả: “${searchParams.q}”` : 'Tất cả sản phẩm');
  const { data: products, meta } = listing;

  // Giữ nguyên filter khi chuyển trang.
  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    if (category) sp.set('category', category);
    if (searchParams.tag) sp.set('tag', searchParams.tag);
    if (searchParams.q) sp.set('q', searchParams.q);
    if (sort !== 'newest') sp.set('sort', sort);
    if (p > 1) sp.set('page', String(p));
    const s = sp.toString();
    return `/san-pham${s ? `?${s}` : ''}`;
  };

  return (
    <div className={`container ${styles.wrap}`}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Trang chủ</Link>
        <span className={styles.sep}>/</span>
        {activeCat ? <Link href="/san-pham">Sản phẩm</Link> : <span>Sản phẩm</span>}
        {activeCat && (
          <>
            <span className={styles.sep}>/</span>
            <span>{activeCat.name}</span>
          </>
        )}
      </nav>

      <div className={styles.layout}>
        <SiteSidebar />

        <div className={styles.main}>
          <div className={styles.toolbar}>
            <h1 className={styles.title}>
              {heading}{' '}
              <span className={styles.resultCount}>({meta.total} sản phẩm)</span>
            </h1>
            <ProductSortSelect current={sort} />
          </div>

          {products.length === 0 ? (
            <div className={styles.empty}>Không có sản phẩm phù hợp.</div>
          ) : (
            <div className={styles.grid}>
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {meta.totalPages > 1 && (
            <div className={styles.pager}>
              <Link
                href={pageHref(page - 1)}
                className={[styles.pageLink, page <= 1 ? styles.pageDisabled : '']
                  .filter(Boolean)
                  .join(' ')}
                aria-label="Trang trước"
              >
                ‹
              </Link>
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={pageHref(p)}
                  className={[styles.pageLink, p === page ? styles.pageActive : '']
                    .filter(Boolean)
                    .join(' ')}
                >
                  {p}
                </Link>
              ))}
              <Link
                href={pageHref(page + 1)}
                className={[
                  styles.pageLink,
                  page >= meta.totalPages ? styles.pageDisabled : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-label="Trang sau"
              >
                ›
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
