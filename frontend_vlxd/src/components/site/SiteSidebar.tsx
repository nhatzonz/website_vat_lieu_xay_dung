import { getBanners } from '@/lib/banners';
import { getCategoryTree } from '@/lib/categories';
import { getSupportContacts } from '@/lib/support';
import { getVideos } from '@/lib/videos';
import type {
  PublicBanner,
  PublicCategory,
  PublicSupport,
  PublicVideo,
} from '@/types/catalog';
import { CategorySidebar } from './CategorySidebar';
import { SidebarBanners } from './SidebarBanners';
import { SupportBox } from './SupportBox';
import { VideoBox } from './VideoBox';
import styles from './SiteSidebar.module.scss';

/**
 * Cột sidebar dùng chung cho MỌI trang (chủ, sản phẩm, danh mục): danh mục +
 * hỗ trợ trực tuyến + video + banner. Tự fetch dữ liệu để mọi nơi hiển thị giống
 * hệt nhau. Các fetch đều có ISR (revalidate 300s) nên gọi lặp trong cùng
 * request được Next dedupe.
 */
export async function SiteSidebar() {
  const [categories, support, videos, banners] = await Promise.all([
    getCategoryTree().catch(() => [] as PublicCategory[]),
    getSupportContacts().catch(() => [] as PublicSupport[]),
    getVideos('sidebar').catch(() => [] as PublicVideo[]),
    getBanners('sidebar').catch(() => [] as PublicBanner[]),
  ]);

  return (
    <div className={styles.col}>
      <CategorySidebar categories={categories} />
      <SupportBox contacts={support} />
      <SidebarBanners banners={banners} />
      <VideoBox videos={videos} />
    </div>
  );
}
