import type { NextConfig } from 'next';
const config: NextConfig = { poweredByHeader: false, distDir: process.env.MSB_BUILD_DIR || '.next', turbopack: { root: process.cwd() } };
export default config;
