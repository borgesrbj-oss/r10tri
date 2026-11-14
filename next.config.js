/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: process.env.NEXT_OUTPUT_MODE || undefined,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  outputFileTracingRoot: __dirname,
  turbopack: { root: __dirname },
  images: { unoptimized: true },
  // Origens extras do servidor local devem ser configuradas explicitamente.
  allowedDevOrigins: ['127.0.0.1', ...(process.env.DEV_ALLOWED_ORIGINS || '').split(',').map((host) => host.trim()).filter(Boolean)],
};

const fs = require('fs');
const userConfigPath = path.join(__dirname, 'next.config.user.json');
const userConfigAllowedKeys = { skipTrailingSlashRedirect: 'boolean', trailingSlash: 'boolean' };
if (fs.existsSync(userConfigPath)) {
  const userConfig = JSON.parse(fs.readFileSync(userConfigPath, 'utf8'));
  for (const key of Object.keys(userConfig)) {
    if (typeof userConfig[key] !== userConfigAllowedKeys[key]) {
      throw new Error(`next.config.user.json: unsupported override "${key}". Supported boolean keys: skipTrailingSlashRedirect, trailingSlash.`);
    }
    nextConfig[key] = userConfig[key];
  }
}

module.exports = nextConfig;

