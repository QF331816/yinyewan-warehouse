import type { NextConfig } from "next";

// 静态导出：整站编译成纯 HTML/CSS/JS，可直接放 GitHub Pages。
// basePath 由环境变量传入（GitHub Pages 项目地址带仓库名，例如 /yinyewan-warehouse）。
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: basePath || undefined,
  images: { unoptimized: true },
  devIndicators: false,
};

export default nextConfig;


