import type { Metadata } from 'next';
import { env } from '@/lib/env';
import './globals.css';

/**
 * Layout gốc. metadataBase giúp Next tự ghép URL tuyệt đối cho og:image,
 * canonical... Các trang con override title/description qua generateMetadata().
 */
export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: 'Website Vật Liệu Xây Dựng',
    template: '%s | Vật Liệu Xây Dựng',
  },
  description: 'Cung cấp vật liệu xây dựng chất lượng cao.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      {/* Khung Header/Footer đặt ở layout của từng nhóm route:
          - app/(site)/layout.tsx: giao diện khách (public)
          - app/admin/layout.tsx: khu quản trị */}
      <body>{children}</body>
    </html>
  );
}
