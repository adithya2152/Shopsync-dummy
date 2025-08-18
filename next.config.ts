// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   images: {
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "clnzqekrbcgudfwlwbxt.supabase.co",
//         pathname: "/storage/v1/object/public/**",
//       },
//     ],
//   },
// };

// export default nextConfig;

 import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https" as const,
        hostname: "clnzqekrbcgudfwlwbxt.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  reactStrictMode: false,
  // swcMinify: false,
};

export default withPWA({
  // PWA plugin config
  dest: 'public',
  disable: false, // Enable PWA in development for testing
  register: true,   
  skipWaiting: true,   
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-fonts-stylesheets',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-font-assets',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\/_next\/image\?url=.+$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-image',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\/api\/get_categories/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'api-categories',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
      },
    },
    {
      urlPattern: /\/api\/get_shops/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'api-shops',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
      },
    },
    {
      urlPattern: /\/api\/products/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-products',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 60, // 30 minutes
        },
        networkTimeoutSeconds: 3,
      },
    },
  ],
  fallbacks: {
    document: '/offline',
    image: '',
    audio: '',
    video: '',
    font: ''
  },
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
})(nextConfig);
