/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // Portals are authenticated app surfaces — no marketing image pipeline needed.
  images: {
    unoptimized: true,
  },
  // Never leak build-time server secrets to the client. Only NEXT_PUBLIC_* is exposed.
  // Keycloak client secret, session secret, and gateway URL stay server-only.
  eslint: {
    // Lint is run explicitly in CI via `npm run lint`; don't fail production builds on style.
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
