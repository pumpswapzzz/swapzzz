import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  output: 'standalone',
  distDir: '.next',
  webpack(config) {
    if (!config.resolve) return config;
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@/lib': path.join(__dirname, 'lib'),
    };
    return config;
  },
};

export default nextConfig;
