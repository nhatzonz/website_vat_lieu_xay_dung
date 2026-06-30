import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware site-wide. Hiện chỉ pass-through.
 *
 * TODO (SEO): khi có module `redirects` ở backend, tra đường dẫn cũ ->
 * trả NextResponse.redirect(newUrl, 301) để tránh 404 khi đổi URL.
 * Nên cache kết quả (vd KV / fetch revalidate) vì middleware chạy mọi request.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // Bỏ qua tài nguyên tĩnh và nội bộ Next để middleware nhẹ.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
