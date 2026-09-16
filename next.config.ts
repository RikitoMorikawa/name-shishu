import type { NextConfig } from 'next'

// **全ページを静的に出す。** AIクローラーは JS を実行しないので、
// 一覧も各社ページもサーバー側で描き切る。DB にも繋がない（data/listings.json が正）。
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
}

export default nextConfig
