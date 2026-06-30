import type { Metadata } from 'next';
import { ToastProvider } from '@/components/admin/ui/Toast';
import { apiGet } from '@/lib/api';
import '@/styles/admin.scss';

/**
 * Lấy favicon từ cấu hình site (server-side) làm icon tab trình duyệt cho khu
 * admin. Chỉ nhận URL tuyệt đối (https) — tránh giá trị seed cũ dạng đường dẫn
 * cục bộ không tồn tại. Khu quản trị không được lập chỉ mục.
 */
export async function generateMetadata(): Promise<Metadata> {
  let favicon = '';
  try {
    const s = await apiGet<Record<string, string>>('/public/settings', {
      revalidate: 300,
    });
    if (s.favicon?.startsWith('http')) favicon = s.favicon;
  } catch {
    // API lỗi → dùng favicon mặc định.
  }
  return {
    title: 'Quản trị',
    robots: { index: false, follow: false },
    ...(favicon ? { icons: { icon: favicon } } : {}),
  };
}

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ToastProvider>{children}</ToastProvider>;
}
