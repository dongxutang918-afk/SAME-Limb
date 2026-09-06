import type {NextConfig} from 'next';
const basePath=process.env.NEXT_PUBLIC_BASE_PATH||'';
// This is a single-page export with fragment navigation. GitHub Pages supplies
// the mount path; assetPrefix and assetUrl() cover generated and public assets.
// Vinext beta.5's exporter requests `/` even when a router basePath is set.
const nextConfig:NextConfig={output:'export',assetPrefix:basePath,trailingSlash:true};
export default nextConfig;
