-- =====================================================================
--  DATABASE SCHEMA: Website giới thiệu công ty + catalog sản phẩm
--  (Mô phỏng theo ceiling.vn - trần nhôm, lam chắn nắng, vật liệu xây dựng)
--  MySQL 8.0+ / MariaDB 10.4+
--  Charset: utf8mb4 (hỗ trợ tiếng Việt có dấu đầy đủ + emoji)
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS ceiling_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE ceiling_db;


-- =====================================================================
-- 1. NGƯỜI DÙNG QUẢN TRỊ (CMS Admin)
--    Dùng cho trang quản trị: đăng nhập, phân quyền quản lý nội dung.
-- =====================================================================
CREATE TABLE admins (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(50)     NOT NULL,
  password_hash VARCHAR(255)    NOT NULL,           -- LƯU HASH (bcrypt/argon2), KHÔNG lưu plaintext
  full_name     VARCHAR(100)    NOT NULL,
  email         VARCHAR(150)    DEFAULT NULL,
  role          ENUM('super_admin','sales') NOT NULL DEFAULT 'sales',
  is_active     TINYINT      NOT NULL DEFAULT 1,
  last_login_at DATETIME        DEFAULT NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admins_username (username),
  UNIQUE KEY uq_admins_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 2. DANH MỤC SẢN PHẨM (phân cấp cha–con)
--    Ánh xạ: menu "Sản phẩm" -> TRẦN NHÔM, LAM CHẮN NẮNG, SẢN PHẨM KÍNH...
--    parent_id NULL = danh mục gốc. Tự tham chiếu để tạo nhiều cấp.
-- =====================================================================
CREATE TABLE categories (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  parent_id        BIGINT UNSIGNED DEFAULT NULL,
  name             VARCHAR(150)    NOT NULL,
  slug             VARCHAR(180)    NOT NULL,        -- dùng cho URL: /tran-nhom/
  description      TEXT            DEFAULT NULL,
  image            VARCHAR(255)    DEFAULT NULL,
  sort_order       INT             NOT NULL DEFAULT 0,
  is_active        TINYINT      NOT NULL DEFAULT 1,
  -- SEO riêng cho từng danh mục
  meta_title       VARCHAR(255)    DEFAULT NULL,
  meta_description VARCHAR(500)    DEFAULT NULL,
  meta_keywords    VARCHAR(500)    DEFAULT NULL,
  og_image         VARCHAR(255)    DEFAULT NULL,    -- ảnh hiện khi chia sẻ Facebook/Zalo
  canonical_url    VARCHAR(255)    DEFAULT NULL,    -- chống trùng lặp nội dung
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_slug (slug),
  KEY idx_categories_parent (parent_id),
  KEY idx_categories_active_sort (is_active, sort_order),
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id)
    REFERENCES categories (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE categories
  ADD COLUMN deleted_at DATETIME DEFAULT NULL AFTER updated_at,
  ADD KEY idx_categories_deleted (deleted_at);



-- =====================================================================
-- 3. SẢN PHẨM
--    Ánh xạ: mỗi item như "Trần nhôm Clip-in 600x600", giá theo m2,
--    cờ is_new (Sản phẩm mới), is_featured (nổi bật trang chủ).
--    price_type = 'contact' khi giá để "Liên hệ".
-- =====================================================================
CREATE TABLE products (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id       BIGINT UNSIGNED NOT NULL,
  name              VARCHAR(255)    NOT NULL,
  slug              VARCHAR(280)    NOT NULL,
  sku               VARCHAR(100)    DEFAULT NULL,    -- Mã sản phẩm (vd: CLCG-618)
  price             DECIMAL(15,2)   DEFAULT NULL,    -- NULL khi liên hệ
  price_unit        VARCHAR(20)     DEFAULT 'đ/m2',  -- đơn vị tính
  price_type        ENUM('fixed','contact') NOT NULL DEFAULT 'fixed',
  thumbnail         VARCHAR(255)    DEFAULT NULL,    -- ảnh đại diện
  short_description VARCHAR(500)    DEFAULT NULL,
  content           LONGTEXT        DEFAULT NULL,    -- mô tả chi tiết (HTML: header, in đậm, gạch đầu dòng, ảnh)
  -- Tab "Kết quả thử nghiệm": phần text/HTML (có thể chèn ảnh inline). Nhiều video/ảnh -> bảng product_test_media
  test_result          LONGTEXT     DEFAULT NULL,    -- nội dung HTML, có thể chèn ảnh/text/header
  is_new            TINYINT      NOT NULL DEFAULT 0,
  is_featured       TINYINT      NOT NULL DEFAULT 0,
  is_active         TINYINT      NOT NULL DEFAULT 1,
  views             INT UNSIGNED    NOT NULL DEFAULT 0,
  sort_order        INT             NOT NULL DEFAULT 0,
  meta_title        VARCHAR(255)    DEFAULT NULL,
  meta_description  VARCHAR(500)    DEFAULT NULL,
  meta_keywords     VARCHAR(500)    DEFAULT NULL,
  og_image          VARCHAR(255)    DEFAULT NULL,    -- ảnh chia sẻ MXH
  canonical_url     VARCHAR(255)    DEFAULT NULL,    -- chống trùng lặp nội dung
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_slug (slug),
  KEY idx_products_category (category_id),
  KEY idx_products_flags (is_active, is_new, is_featured),
  KEY idx_products_sku (sku),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id)
    REFERENCES categories (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 4. ẢNH SẢN PHẨM (1 sản phẩm có nhiều ảnh - thư viện)
-- =====================================================================
CREATE TABLE product_images (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  image_path VARCHAR(255)    NOT NULL,
  alt_text   VARCHAR(255)    DEFAULT NULL,
  is_primary TINYINT      NOT NULL DEFAULT 0,
  sort_order INT             NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_pimages_product (product_id),
  CONSTRAINT fk_pimages_product FOREIGN KEY (product_id)
    REFERENCES products (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 5. THUỘC TÍNH SẢN PHẨM (mô hình EAV chuẩn - 2 bảng)
--
--  5A. attributes: DANH MỤC THUỘC TÍNH dùng chung, tạo MỘT LẦN.
--      Vd: "Vật liệu", "Chiều dài", "Chiều dày", "Màu sắc"...
--      Khi tạo sản phẩm, form sẽ liệt kê các thuộc tính ở đây;
--      thuộc tính nào có giá trị thì nhập, để trống thì không lưu.
-- =====================================================================
CREATE TABLE attributes (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100)    NOT NULL,    -- vd: "Vật liệu"
  unit       VARCHAR(30)     DEFAULT NULL,-- đơn vị gợi ý, vd "mm" (tùy chọn)
  sort_order INT             NOT NULL DEFAULT 0,
  is_active  TINYINT      NOT NULL DEFAULT 1,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_attributes_name (name),
  KEY idx_attributes_active (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
--  5B. product_attribute_values: GIÁ TRỊ thuộc tính của TỪNG sản phẩm.
--      Mỗi dòng = (sản phẩm) + (thuộc tính) + (giá trị nhập vào).
--      Chỉ tạo dòng cho thuộc tính có nhập giá trị -> không thừa.
-- =====================================================================
CREATE TABLE product_attribute_values (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id    BIGINT UNSIGNED NOT NULL,
  attribute_id  BIGINT UNSIGNED NOT NULL,
  value         VARCHAR(500)    NOT NULL,   -- vd: "Aluminum 3003", "6000mm", "0.6mm"
  PRIMARY KEY (id),
  UNIQUE KEY uq_prod_attr (product_id, attribute_id),  -- 1 SP không lặp cùng 1 thuộc tính
  KEY idx_pav_attribute (attribute_id),
  CONSTRAINT fk_pav_product FOREIGN KEY (product_id)
    REFERENCES products (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pav_attribute FOREIGN KEY (attribute_id)
    REFERENCES attributes (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 5B. MEDIA KẾT QUẢ THỬ NGHIỆM (nhiều video YouTube + nhiều ảnh)
--    1 sản phẩm có nhiều dòng. Cột media_type phân biệt video/ảnh:
--      - 'youtube': media_value = link YouTube
--      - 'image'  : media_value = đường dẫn ảnh đã upload
-- =====================================================================
CREATE TABLE product_test_media (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id  BIGINT UNSIGNED NOT NULL,
  media_type  ENUM('youtube','image') NOT NULL,
  media_value VARCHAR(255)    NOT NULL,   -- link YouTube hoặc đường dẫn ảnh
  caption     VARCHAR(255)    DEFAULT NULL,  -- chú thích tùy chọn
  sort_order  INT             NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_ptmedia_product (product_id, sort_order),
  CONSTRAINT fk_ptmedia_product FOREIGN KEY (product_id)
    REFERENCES products (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 6. TIN TỨC / BÀI VIẾT  (dùng chung cho menu "Tin tức" và "Bảng giá")
--    Cột post_type phân biệt: 'news' = tin tức, 'price_list' = bảng giá.
--    Front-end lọc theo post_type để đổ vào đúng trang.
-- =====================================================================
CREATE TABLE news (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  post_type        ENUM('news','price_list') NOT NULL DEFAULT 'news',
  title            VARCHAR(255)    NOT NULL,
  slug             VARCHAR(280)    NOT NULL,
  thumbnail        VARCHAR(255)    DEFAULT NULL,
  summary          VARCHAR(500)    DEFAULT NULL,
  content          LONGTEXT        DEFAULT NULL,
  author_id        BIGINT UNSIGNED DEFAULT NULL,
  views            INT UNSIGNED    NOT NULL DEFAULT 0,
  is_active        TINYINT      NOT NULL DEFAULT 1,
  published_at     DATETIME        DEFAULT NULL,
  meta_title       VARCHAR(255)    DEFAULT NULL,
  meta_description VARCHAR(500)    DEFAULT NULL,
  meta_keywords    VARCHAR(500)    DEFAULT NULL,
  og_image         VARCHAR(255)    DEFAULT NULL,    -- ảnh chia sẻ MXH
  canonical_url    VARCHAR(255)    DEFAULT NULL,    -- chống trùng lặp nội dung
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_news_slug (slug),
  KEY idx_news_type_active_pub (post_type, is_active, published_at),
  CONSTRAINT fk_news_author FOREIGN KEY (author_id)
    REFERENCES admins (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 7. TRANG NỘI DUNG TĨNH (Giới thiệu, Chính sách bảo mật,
--    Chính sách thanh toán, Tuyển dụng...)
-- =====================================================================
CREATE TABLE pages (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title            VARCHAR(255)    NOT NULL,
  slug             VARCHAR(280)    NOT NULL,        -- vd: gioi-thieu, chinh-sach-bao-mat
  content          LONGTEXT        DEFAULT NULL,
  is_active        TINYINT      NOT NULL DEFAULT 1,
  meta_title       VARCHAR(255)    DEFAULT NULL,
  meta_description VARCHAR(500)    DEFAULT NULL,
  meta_keywords    VARCHAR(500)    DEFAULT NULL,
  og_image         VARCHAR(255)    DEFAULT NULL,    -- ảnh chia sẻ MXH
  canonical_url    VARCHAR(255)    DEFAULT NULL,    -- chống trùng lặp nội dung
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pages_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 8. BANNER / SLIDER trang chủ
-- =====================================================================
CREATE TABLE banners (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title      VARCHAR(150)    DEFAULT NULL,
  image      VARCHAR(255)    NOT NULL,
  link_url   VARCHAR(255)    DEFAULT NULL,
  position   VARCHAR(50)     NOT NULL DEFAULT 'home_slider', -- vị trí hiển thị
  sort_order INT             NOT NULL DEFAULT 0,
  is_active  TINYINT      NOT NULL DEFAULT 1,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_banners_pos (position, is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 9. VIDEO (mục "Video clips" - nhúng YouTube)
--    Cột position: chọn 1 HOẶC NHIỀU vị trí hiển thị cho mỗi video.
--    Kiểu SET cho phép lưu nhiều nhãn cùng lúc, vd: 'home,sidebar'.
-- =====================================================================
CREATE TABLE videos (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title       VARCHAR(200)    DEFAULT NULL,
  youtube_url VARCHAR(255)    NOT NULL,
  position    SET('home','sidebar','about') NOT NULL DEFAULT 'home',
  sort_order  INT             NOT NULL DEFAULT 0,
  is_active   TINYINT      NOT NULL DEFAULT 1,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_videos_active (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 10. HỖ TRỢ TRỰC TUYẾN (Mr Công, Ms Anh... + hotline/Zalo)
-- =====================================================================
CREATE TABLE support_contacts (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100)    NOT NULL,   -- vd: "Mr Công"
  phone      VARCHAR(30)     DEFAULT NULL,
  zalo       VARCHAR(30)     DEFAULT NULL,
  channel    VARCHAR(50)     DEFAULT 'hotline',
  sort_order INT             NOT NULL DEFAULT 0,
  is_active  TINYINT      NOT NULL DEFAULT 1,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 11. FORM LIÊN HỆ (lưu nội dung khách gửi từ trang "Liên hệ")
-- =====================================================================
CREATE TABLE contacts (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name  VARCHAR(150)    NOT NULL,
  email      VARCHAR(150)    DEFAULT NULL,
  phone      VARCHAR(30)     DEFAULT NULL,
  subject    VARCHAR(255)    DEFAULT NULL,
  message    TEXT            DEFAULT NULL,
  status     ENUM('new','read','replied','spam') NOT NULL DEFAULT 'new',
  ip_address VARCHAR(45)     DEFAULT NULL,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_contacts_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 12. CẤU HÌNH WEBSITE (key-value: hotline, email, địa chỉ, social...)
--     Ánh xạ phần footer: tên cty, MST, SĐT, email, địa chỉ VPGD.
-- =====================================================================
CREATE TABLE settings (
  setting_key   VARCHAR(100)  NOT NULL,
  setting_value TEXT          DEFAULT NULL,
  setting_group VARCHAR(50)   DEFAULT 'general',
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 13. THỐNG KÊ TRUY CẬP (bộ đếm: hôm nay, tuần, tháng, tổng)
--     Mỗi ngày 1 dòng -> tổng hợp ra các con số cần hiển thị.
-- =====================================================================
CREATE TABLE visitor_stats (
  stat_date    DATE          NOT NULL,
  visit_count  INT UNSIGNED  NOT NULL DEFAULT 0,
  online_peak  INT UNSIGNED  NOT NULL DEFAULT 0,
  PRIMARY KEY (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 14. TAG / BỘ LỌC SẢN PHẨM  (vấn đề 3)
--     tags: danh sách thẻ dùng chung. product_tags: nối SP <-> tag
--     (nhiều-nhiều). Dùng để lọc sản phẩm theo thẻ ở front-end.
-- =====================================================================
CREATE TABLE tags (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name      VARCHAR(100)    NOT NULL,
  slug      VARCHAR(120)    NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tags_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_tags (
  product_id BIGINT UNSIGNED NOT NULL,
  tag_id     BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (product_id, tag_id),
  KEY idx_ptags_tag (tag_id),
  CONSTRAINT fk_ptags_product FOREIGN KEY (product_id)
    REFERENCES products (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ptags_tag FOREIGN KEY (tag_id)
    REFERENCES tags (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 15. REDIRECTS - CHUYỂN HƯỚNG 301  (vấn đề 4 - SEO)
--     Khi đổi đường dẫn cũ -> mới, lưu vào đây để không mất thứ hạng
--     và tránh lỗi 404. Front-end tra bảng này trước khi trả 404.
-- =====================================================================
CREATE TABLE redirects (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  from_path   VARCHAR(255)    NOT NULL,   -- đường dẫn cũ, vd: /san-pham-cu
  to_path     VARCHAR(255)    NOT NULL,   -- đường dẫn mới, vd: /san-pham-moi
  status_code SMALLINT        NOT NULL DEFAULT 301,  -- 301 vĩnh viễn / 302 tạm thời
  is_active   TINYINT      NOT NULL DEFAULT 1,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_redirects_from (from_path)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- DỮ LIỆU MẪU (seed) - tùy chọn
-- =====================================================================
INSERT INTO settings (setting_key, setting_value, setting_group) VALUES
  ('company_name', 'CÔNG TY CỔ PHẦN CEILING VIỆT NAM', 'company'),
  ('tax_code',     '0109128960', 'company'),
  ('logo',         '', 'company'),                          -- URL Cloudinary (upload qua admin)
  ('favicon',      '', 'company'),                           -- URL Cloudinary (upload qua admin)
  ('logo_public_id',    '', 'company'),                      -- public_id để xóa ảnh cũ khi đổi
  ('favicon_public_id', '', 'company'),
  ('hotline',      '0844 444 933', 'contact'),
  ('email',        'vietnamceiling@gmail.com', 'contact'),
  ('zalo',         '0844444933', 'contact'),
  ('address',      'NO11D - LK37 Khu đất dịch vụ Vạn Phúc - Hà Đông - TP. Hà Nội', 'address'), -- địa chỉ đầy đủ (admin lưu sẽ tự gộp lại)
  -- Địa chỉ chi tiết: chọn theo cây hành chính (Tỉnh→Quận/Huyện→Phường/Xã) + nhập chi tiết; FE gộp thành `address`
  ('addr_detail',   'NO11D - LK37 Khu đất dịch vụ Vạn Phúc', 'address'), -- số nhà, tên đường
  ('addr_ward',     '', 'address'),             -- phường / xã  (chọn qua API địa chỉ)
  ('addr_district', 'Hà Đông', 'address'),      -- quận / huyện
  ('addr_province', 'TP. Hà Nội', 'address'),   -- tỉnh / thành phố
  -- Mã hành chính (không public) để admin load lại đúng lựa chọn khi mở sửa
  ('addr_province_code', '', 'address'),
  ('addr_district_code', '', 'address'),
  ('addr_ward_code',     '', 'address'),
  -- Bản đồ: admin dán 1 link Google Maps (vd https://maps.app.goo.gl/...),
  -- BE giải link → tự sinh map_embed (link nhúng) để FE render iframe
  ('map_link',     '', 'map'),
  ('map_embed',    '', 'map');

-- Liên kết mạng xã hội (hiện ở header/footer)
INSERT INTO settings (setting_key, setting_value, setting_group) VALUES
  ('social_facebook', '', 'social'),
  ('social_youtube',  '', 'social'),
  ('social_tiktok',   '', 'social'),
  ('social_zalo_oa',  '', 'social');

INSERT INTO categories (parent_id, name, slug, sort_order) VALUES
  (NULL, 'Trần nhôm', 'tran-nhom', 1),
  (NULL, 'Lam chắn nắng', 'lam-chan-nang', 2),
  (NULL, 'Sản phẩm kính', 'san-pham-kinh', 3);

-- Danh mục thuộc tính dùng chung (tạo 1 lần, dùng cho mọi sản phẩm)
INSERT INTO attributes (name, unit, sort_order) VALUES
  ('Vật liệu', NULL, 1),
  ('Quy cách', NULL, 2),
  ('Chiều dài', 'mm', 3),
  ('Chiều dày', 'mm', 4),
  ('Màu sắc', NULL, 5);

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- KẾT THÚC SCHEMA
-- =====================================================================
