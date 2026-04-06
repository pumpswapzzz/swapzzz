/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',     // This is important for Vercel
  distDir: '.next',         // Explicitly set output directory
};

export default nextConfig;
