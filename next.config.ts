import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloud Run 向けに最小構成のスタンドアロンバンドルを生成する
  // .next/standalone/ に server.js と必要ファイルのみが含まれる
  output: "standalone",
  // 複数の lockfile が存在する場合の workspace root 誤検知を防止する
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
