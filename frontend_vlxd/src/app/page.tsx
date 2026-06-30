import { HeroSlider } from '@/components/HeroSlider';
import { JsonLd } from '@/components/JsonLd';
import { getBanners } from '@/lib/banners';
import { env } from '@/lib/env';
import type { PublicBanner } from '@/types/catalog';

// ISR: build lại định kỳ (plan: trang chủ revalidate ~120s).
export const revalidate = 120;

export default async function HomePage() {
  // Lỗi API không được làm sập trang chủ → fallback rỗng.
  const sliders = await getBanners('home_slider').catch(
    () => [] as PublicBanner[],
  );

  return (
    <div className="container py-10">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Website Vật Liệu Xây Dựng',
          url: env.siteUrl,
        }}
      />

      <HeroSlider banners={sliders} />

      <h1 className="mt-8 text-3xl font-bold">Website Vật Liệu Xây Dựng</h1>
      <p className="mt-4 text-gray-600">
        Base frontend đã sẵn sàng. Bắt đầu dựng Header/Footer và các trang theo
        plan.
      </p>
    </div>
  );
}
