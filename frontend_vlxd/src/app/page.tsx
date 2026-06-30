import { JsonLd } from '@/components/JsonLd';
import { env } from '@/lib/env';

// ISR: build lại định kỳ (plan: trang chủ revalidate ~120s).
export const revalidate = 120;

export default function HomePage() {
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
      <h1 className="text-3xl font-bold">Website Vật Liệu Xây Dựng</h1>
      <p className="mt-4 text-gray-600">
        Base frontend đã sẵn sàng. Bắt đầu dựng Header/Footer và các trang theo
        plan.
      </p>
    </div>
  );
}
