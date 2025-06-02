const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/cdn-production-opera-website\.operacdn\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'cdn-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
        }
      }
    }
  ],
  buildExcludes: [/middleware-manifest\.json$/],
  publicExcludes: ['!robots.txt'],
  fallbacks: {
    document: '/_offline'
  }
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
    };
    return config;
  },
  images: {
    domains: ['cdn-production-opera-website.operacdn.com'],
  },
};

module.exports = withPWA(nextConfig);