/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is enabled by default in Next.js 14
  experimental: {
    turbo: {
      root: __dirname
    }
  }
}

module.exports = nextConfig