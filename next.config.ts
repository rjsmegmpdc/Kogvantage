import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3', 'duckdb'],
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // For data pack uploads
    },
  },
};

export default nextConfig;
