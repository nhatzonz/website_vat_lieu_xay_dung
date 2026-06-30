/**
 * Tập trung đọc biến môi trường, có giá trị mặc định an toàn cho dev.
 * SITE_URL bỏ dấu "/" cuối để ghép canonical/og:url không bị "//".
 */
function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export const env = {
  siteUrl: stripTrailingSlash(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  ),
  apiBaseUrl: stripTrailingSlash(
    process.env.API_BASE_URL ?? 'http://localhost:4000/api',
  ),
  publicApiBaseUrl: stripTrailingSlash(
    process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api',
  ),
};
