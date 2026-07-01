import { getBanners } from '@/lib/banners';
import { getCategoryTree } from '@/lib/categories';
import type { PublicBanner, PublicCategory } from '@/types/catalog';
import { CategorySidebar } from './CategorySidebar';
import { SidebarBanners } from './SidebarBanners';
import styles from './SiteSidebar.module.scss';

/**
 * Cột sidebar dùng chung cho MỌI trang (chủ, sản phẩm, danh mục): danh mục +
 * banner. Tự fetch dữ liệu để mọi nơi hiển thị giống hệt nhau. Các fetch đều có
 * ISR (revalidate 300s) nên gọi lặp trong cùng request được Next dedupe.
 */
export async function SiteSidebar() {
  const [categories, banners] = await Promise.all([
    getCategoryTree().catch(() => [] as PublicCategory[]),
    getBanners('sidebar').catch(() => [] as PublicBanner[]),
  ]);

  return (
    <div className={styles.col}>
      <CategorySidebar categories={categories} />
      <SidebarBanners banners={banners} />
    </div>
  );
}
