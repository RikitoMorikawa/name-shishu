import type { MetadataRoute } from 'next'

// **AI のクローラーを止めない。** 引かれることがこの媒体の入口なので、
// GPTBot や PerplexityBot を弾くと AIO の狙いと矛盾する。
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: 'https://name-shishu.com/sitemap.xml',
  }
}
