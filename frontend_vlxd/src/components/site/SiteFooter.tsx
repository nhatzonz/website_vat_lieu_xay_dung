import { ChevronRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { fullAddress, type PublicSettings } from '@/lib/settings';
import styles from './SiteFooter.module.scss';

const QUICK_LINKS = [
  { href: '/gioi-thieu', label: 'Giới thiệu' },
  { href: '/san-pham', label: 'Sản phẩm' },
  { href: '/tin-tuc', label: 'Tin tức' },
  { href: '/tuyen-dung', label: 'Tuyển dụng' },
  { href: '/chinh-sach-bao-mat', label: 'Chính sách bảo mật' },
  { href: '/chinh-sach-thanh-toan', label: 'Chính sách thanh toán' },
  { href: '/lien-he', label: 'Liên hệ' },
];

export function SiteFooter({ settings }: { settings: PublicSettings }) {
  const address = fullAddress(settings);
  const year = new Date().getFullYear();
  const company = settings.company_name || 'Công ty Vật Liệu Xây Dựng';

  return (
    <footer className={styles.footer}>
      <div className={styles.topLine} />

      <div className={`container ${styles.grid}`}>
        {/* Cột 1: thông tin công ty */}
        <div className={styles.col}>
          <h3 className={styles.headingBrand}>{company}</h3>
          <div className={styles.about}>
            <p className={styles.companyName}>{company}</p>
            {settings.tax_code && (
              <p>
                Giấy chứng nhận Đăng ký doanh nghiệp số{' '}
                <strong>{settings.tax_code}</strong>
              </p>
            )}
            {settings.hotline && (
              <p>
                Điện thoại:{' '}
                <a href={`tel:${settings.hotline.replace(/\s/g, '')}`}>
                  <strong>{settings.hotline}</strong>
                </a>
              </p>
            )}
            {address && <p>VPGD: {address}</p>}
            {settings.email && (
              <p>
                Email: <a href={`mailto:${settings.email}`}>{settings.email}</a>
              </p>
            )}
          </div>
        </div>

        {/* Cột 2: liên kết nhanh */}
        <div className={styles.col}>
          <h3 className={styles.heading}>Liên kết nhanh</h3>
          <ul className={styles.links}>
            {QUICK_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>
                  <ChevronRight size={15} />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Cột 3: bản đồ liên hệ */}
        <div className={styles.col}>
          <h3 className={styles.heading}>Liên hệ</h3>
          {settings.map_embed ? (
            <div className={styles.map}>
              <iframe
                src={settings.map_embed}
                title="Bản đồ"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
              {settings.map_link && (
                <a
                  href={settings.map_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.mapLink}
                >
                  Mở trong Maps <ExternalLink size={13} />
                </a>
              )}
            </div>
          ) : (
            address && <p className={styles.mapFallback}>{address}</p>
          )}
        </div>
      </div>

      <div className={styles.bottom}>
        <div className="container">
          © {year} {company}.
        </div>
      </div>
    </footer>
  );
}
