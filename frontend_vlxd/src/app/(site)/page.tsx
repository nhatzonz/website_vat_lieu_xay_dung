import { CategoryProductSection } from '@/components/site/CategoryProductSection';
import { CategorySidebar } from '@/components/site/CategorySidebar';
import { HeroSlider } from '@/components/HeroSlider';
import { JsonLd } from '@/components/JsonLd';
import { NewProducts } from '@/components/site/NewProducts';
import { SidebarBanners } from '@/components/site/SidebarBanners';
import { getBanners } from '@/lib/banners';
import { getCategoryTree } from '@/lib/categories';
import { getProductList } from '@/lib/products';
import { env } from '@/lib/env';
import type { PublicBanner, PublicCategory } from '@/types/catalog';
import styles from './home.module.scss';

// ISR: build lại định kỳ (plan: trang chủ revalidate ~120s).
export const revalidate = 120;

/** Số danh mục gốc tối đa hiện khối sản phẩm ở trang chủ. */
const MAX_CATEGORY_SECTIONS = 5;

export default async function HomePage() {
  // Lỗi API không được làm sập trang chủ → fallback rỗng.
  const [sliders, categories, sideBanners, newProducts] = await Promise.all([
    getBanners('home_slider').catch(() => [] as PublicBanner[]),
    getCategoryTree().catch(() => [] as PublicCategory[]),
    getBanners('sidebar').catch(() => [] as PublicBanner[]),
    getProductList({ sort: 'newest', limit: 10, withSpecs: true }),
  ]);

  // Mỗi danh mục gốc → 1 khối sản phẩm (gồm cả nhánh con).
  const roots = categories.slice(0, MAX_CATEGORY_SECTIONS);
  const sections = await Promise.all(
    roots.map(async (category) => ({
      category,
      products: await getProductList({
        category: category.slug,
        limit: 6,
        sort: 'newest',
      }),
    })),
  );

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Website Vật Liệu Xây Dựng',
          url: env.siteUrl,
        }}
      />

      <div className={styles.hero}>
        <HeroSlider banners={sliders} />
      </div>

      <div className={`container ${styles.layout}`}>
        <div className={styles.sideCol}>
          <CategorySidebar categories={categories} />
          <SidebarBanners banners={sideBanners} />
        </div>

        <div className={styles.mainCol}>
          <NewProducts products={newProducts} />
          {sections.map((s) => (
            <CategoryProductSection
              key={s.category.id}
              category={s.category}
              products={s.products}
            />
          ))}
        </div>
      </div>
    </>
  );
}
