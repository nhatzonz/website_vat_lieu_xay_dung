import { Home } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionHeading } from '@/components/site/SectionHeading';
import { SiteSidebar } from '@/components/site/SiteSidebar';
import { VideoGrid } from '@/components/site/VideoGrid';
import { buildMetadata } from '@/lib/seo';
import { fullAddress, getPublicSettings } from '@/lib/settings';
import { getVideos } from '@/lib/videos';
import type { PublicVideo } from '@/types/catalog';
import styles from './gioi-thieu.module.scss';

export const revalidate = 300;

export function generateMetadata(): Metadata {
  return buildMetadata({ title: 'Giới thiệu', path: '/gioi-thieu' });
}

export default async function AboutPage() {
  const [settings, aboutVideos] = await Promise.all([
    getPublicSettings(),
    getVideos('about').catch(() => [] as PublicVideo[]),
  ]);
  const name = settings.company_name || 'Chúng tôi';
  const phone = settings.hotline;
  const email = settings.email;
  const tax = settings.tax_code;
  const address = fullAddress(settings);

  return (
    <div className={`container ${styles.wrap}`}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/" className={styles.crumbHome}>
          <Home size={15} /> Trang chủ
        </Link>
        <span className={styles.sep}>/</span>
        <span>Giới thiệu</span>
      </nav>

      <div className={styles.layout}>
        <SiteSidebar />

        <div className={styles.main}>
          <h1 className={styles.title}>Giới thiệu</h1>

          <div className={styles.prose}>
            <p>
              <strong>{name}</strong> là đơn vị chuyên cung cấp, thi công hoàn
              thiện các sản phẩm, dịch vụ cho các công trình: trường học, bệnh
              viện, tòa nhà văn phòng, trung tâm thương mại, chung cư, nhà hàng,
              quán cà phê, nhà ở…
            </p>
            <p>
              Với mục tiêu đáp ứng nhu cầu ngày càng đa dạng của quý khách hàng,{' '}
              {name} không ngừng cải tiến, học hỏi và mang đến những sản phẩm
              chất lượng cao, tiến độ giao hàng và thi công đảm bảo, giá thành
              hợp lý nhất trên thị trường Việt Nam.
            </p>
            <p>
              Thế mạnh làm nên thương hiệu {name} chính là sự chuyên môn hóa
              trong từng bộ phận, tinh thần trách nhiệm cao cùng đội ngũ giám sát
              kỹ thuật làm việc nghiêm túc, cẩn thận nhằm tạo nên những sản phẩm
              hoàn thiện đến từng chi tiết nhỏ nhất.
            </p>
            <p>
              Với phương châm “Hợp tác để cùng thành công” và định hướng “Liên
              tục cải tiến”, {name} luôn nỗ lực cả về nhân lực, vật lực, xây dựng
              uy tín thương hiệu và niềm tin với khách hàng.
            </p>
            <p>
              Sự tin tưởng và ủng hộ của khách hàng trong suốt thời gian qua là
              nguồn động viên to lớn trên bước đường phát triển của {name}. Chúng
              tôi xin hứa sẽ không ngừng hoàn thiện, phục vụ khách hàng tốt nhất
              để luôn xứng đáng với niềm tin ấy.
            </p>
          </div>

          {aboutVideos.length > 0 && (
            <section className={styles.videos}>
              <SectionHeading title="Video giới thiệu" />
              <VideoGrid videos={aboutVideos} limit={2} />
            </section>
          )}

          <div className={styles.contact}>
            <p className={styles.contactLead}>Mọi thông tin xin liên hệ:</p>
            <p className={styles.company}>{name}</p>
            {tax && (
              <p>
                Mã số thuế: <strong>{tax}</strong>
              </p>
            )}
            {phone && (
              <p>
                Điện thoại:{' '}
                <a href={`tel:${phone.replace(/\s/g, '')}`}>
                  <strong>{phone}</strong>
                </a>
              </p>
            )}
            {address && <p>Địa chỉ: {address}</p>}
            {email && (
              <p>
                Email: <a href={`mailto:${email}`}>{email}</a>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
