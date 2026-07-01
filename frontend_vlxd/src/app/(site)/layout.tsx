import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { FloatingContact } from '@/components/site/FloatingContact';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteTopBar } from '@/components/site/SiteTopBar';
import { getPublicSettings } from '@/lib/settings';

/**
 * Favicon cho khu khách: lấy từ Cấu hình (settings.favicon). Chỉ nhận URL tuyệt
 * đối (https) để tránh giá trị seed cũ dạng đường dẫn cục bộ không tồn tại.
 */
export async function generateMetadata(): Promise<Metadata> {
  const s = await getPublicSettings();
  const favicon = s.favicon?.startsWith('http') ? s.favicon : '';
  return favicon ? { icons: { icon: favicon } } : {};
}

/**
 * Layout khu khách (public): thanh liên hệ + header + nội dung + footer + nút
 * liên hệ nổi. Cấu hình site (logo, hotline…) lấy 1 lần ở server rồi truyền
 * xuống, tránh mỗi component tự gọi API.
 */
export default async function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const settings = await getPublicSettings();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <SiteTopBar hotline={settings.hotline} email={settings.email} />
      <SiteHeader logo={settings.logo} companyName={settings.company_name} />
      <main style={{ flex: 1 }}>{children}</main>
      <SiteFooter settings={settings} />
      <FloatingContact hotline={settings.hotline} zalo={settings.zalo} />
    </div>
  );
}
