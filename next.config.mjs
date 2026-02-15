/** @type {import('next').NextConfig} */
const nextConfig = {
  // 为支持 Vercel Serverless Functions (API 路由)，在云端部署时禁用 static export
  // 如果需要打包 Android APK，请取消注释下一行
  // output: 'export', 
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
