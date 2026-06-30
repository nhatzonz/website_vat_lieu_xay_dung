import path from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Cho phép .module.scss `@use 'tokens' as *;` mà không cần đường dẫn tương đối dài.
  sassOptions: {
    includePaths: [path.join(process.cwd(), 'src/styles')],
  },
  images: {
    // Ảnh phục vụ qua Cloudinary CDN (f_auto,q_auto, WebP/AVIF).
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;
