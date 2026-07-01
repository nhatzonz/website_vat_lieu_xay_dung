import { CategorySidebar } from '@/components/site/CategorySidebar';
import { HeroSlider } from '@/components/HeroSlider';
import { JsonLd } from '@/components/JsonLd';
import { NewProducts } from '@/components/site/NewProducts';
import { SidebarBanners } from '@/components/site/SidebarBanners';
import { getBanners } from '@/lib/banners';
import { getCategoryTree } from '@/lib/categories';
import { env } from '@/lib/env';
import type { PublicBanner, PublicCategory } from '@/types/catalog';
import styles from './home.module.scss';

// ISR: build lại định kỳ (plan: trang chủ revalidate ~120s).
export const revalidate = 120;

export default async function HomePage() {
  // Lỗi API không được làm sập trang chủ → fallback rỗng.
  const [sliders, categories, sideBanners] = await Promise.all([
    getBanners('home_slider').catch(() => [] as PublicBanner[]),
    getCategoryTree().catch(() => [] as PublicCategory[]),
    getBanners('sidebar').catch(() => [] as PublicBanner[]),
  ]);

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
        <NewProducts />
      </div>
    </>
  );
}
