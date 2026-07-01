import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/JsonLd';
import { ProductCard } from '@/components/site/ProductCard';
import { findCategoryBySlug, getCategoryTree } from '@/lib/categories';
import { getProductList } from '@/lib/products';
import { absoluteUrl, buildMetadata } from '@/lib/seo';
import type { PublicCategory } from '@/types/catalog';

// ISR: cây danh mục đổi không thường xuyên.
export const revalidate = 300;

interface Params {
  params: { slug: string };
}

async function locate(slug: string) {
  const tree = await getCategoryTree().catch(() => [] as PublicCategory[]);
  return findCategoryBySlug(tree, slug);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const found = await locate(params.slug);
  if (!found) {
    return buildMetadata({ title: 'Không tìm thấy danh mục', noIndex: true });
  }
  const c = found.node;
  return buildMetadata({
    title: c.metaTitle || c.name,
    description: c.metaDescription || c.description || undefined,
    keywords: c.metaKeywords || undefined,
    path: c.canonicalUrl || `/danh-muc/${c.slug}`,
    image: c.ogImage || c.image || undefined,
  });
}

export default async function CategoryPage({ params }: Params) {
  const found = await locate(params.slug);
  if (!found) notFound();

  const { node, ancestors } = found;
  const children = node.children ?? [];

  const products = await getProductList({
    category: params.slug,
    limit: 12,
    sort: 'newest',
  });

  const trail = [...ancestors, node];

  return (
    <div className="container py-8">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Trang chủ',
              item: absoluteUrl('/'),
            },
            ...trail.map((c, i) => ({
              '@type': 'ListItem',
              position: i + 2,
              name: c.name,
              item: absoluteUrl(`/danh-muc/${c.slug}`),
            })),
          ],
        }}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:text-blue-600">
              Trang chủ
            </Link>
          </li>
          {trail.map((c, i) => (
            <li key={c.id} className="flex items-center gap-1">
              <span className="text-gray-300">/</span>
              {i === trail.length - 1 ? (
                <span className="font-medium text-gray-700">{c.name}</span>
              ) : (
                <Link
                  href={`/danh-muc/${c.slug}`}
                  className="hover:text-blue-600"
                >
                  {c.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Tiêu đề danh mục */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{node.name}</h1>
        {node.description && (
          <p className="mt-3 max-w-3xl text-gray-600">{node.description}</p>
        )}
      </header>

      {/* Lưới danh mục con */}
      {children.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Danh mục con
          </h2>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {children.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/danh-muc/${child.slug}`}
                  className="group block overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:shadow-md"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-gray-50">
                    {child.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={child.image}
                        alt={child.name}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <span className="text-sm">Chưa có ảnh</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <span className="font-medium text-gray-800 group-hover:text-blue-600">
                      {child.name}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sản phẩm trong danh mục */}
      {products.length > 0 ? (
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Sản phẩm</h2>
            <Link
              href={`/san-pham?category=${node.slug}`}
              className="text-sm font-semibold text-orange-600 hover:underline"
            >
              Xem tất cả →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : (
        children.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-500">
            <p>Sản phẩm trong danh mục này sẽ sớm được cập nhật.</p>
          </div>
        )
      )}
    </div>
  );
}
