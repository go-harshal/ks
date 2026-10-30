/** @type {import('next').NextConfig} */
const API_INTERNAL_URL = process.env.API_INTERNAL_URL || 'http://localhost:8001';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: ['*.preview.emergentagent.com', '*.emergentagent.com'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
    ],
  },
  async rewrites() {
    // In dev / preview the Express API is reached through the same origin. In production Nginx does this.
    return [{ source: '/api/:path*', destination: `${API_INTERNAL_URL}/api/:path*` }];
  },
  async headers() {
    return [
      {
        source: '/phobos/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default nextConfig;
