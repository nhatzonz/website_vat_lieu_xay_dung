import { CategoryProductSection } from '@/components/site/CategoryProductSection';
import { HeroSlider } from '@/components/HeroSlider';
import { JsonLd } from '@/components/JsonLd';
import { NewProducts } from '@/components/site/NewProducts';
import { SectionHeading } from '@/components/site/SectionHeading';
import { SiteSidebar } from '@/components/site/SiteSidebar';
import { VideoGrid } from '@/components/site/VideoGrid';
import { getBanners } from '@/lib/banners';
import { getCategoryTree } from '@/lib/categories';
import { getProductList } from '@/lib/products';
import { getVideos } from '@/lib/videos';
import { env } from '@/lib/env';
import type {
  PublicBanner,
  PublicCategory,
  PublicVideo,
} from '@/types/catalog';
import styles from './home.module.scss';

// ISR: build lại định kỳ (plan: trang chủ revalidate ~120s).
export const revalidate = 120;

/** Số danh mục gốc tối đa hiện khối sản phẩm ở trang chủ. */
const MAX_CATEGORY_SECTIONS = 5;

export default async function HomePage() {
  // Lỗi API không được làm sập trang chủ → fallback rỗng.
  const [sliders, categories, newProducts, homeVideos] = await Promise.all([
    getBanners('home_slider').catch(() => [] as PublicBanner[]),
    getCategoryTree().catch(() => [] as PublicCategory[]),
    getProductList({ sort: 'newest', limit: 10, withSpecs: true }),
    getVideos('home').catch(() => [] as PublicVideo[]),
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
        <SiteSidebar />

        <div className={styles.mainCol}>
          <NewProducts products={newProducts} />

          {homeVideos.length > 0 && (
            <section>
              <SectionHeading title="Video clips" />
              {/* Giới hạn 3 video, mỗi ô 16:9 gọn → không chiếm quá nhiều diện tích. */}
              <VideoGrid videos={homeVideos} limit={3} />
            </section>
          )}

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
