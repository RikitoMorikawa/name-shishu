import type { MetadataRoute } from 'next'

// output:'export' では明示が要る（無いとビルドが落ちる）
export const dynamic = 'force-static'
import { guides } from '@/data/guides'
import { byPref, listings, updatedAt } from '@/lib/listings'

const BASE = 'https://name-shishu.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(updatedAt)
  return [
    { url: `${BASE}/`, lastModified, priority: 1 },
    { url: `${BASE}/about/`, lastModified, priority: 0.4 },
    ...guides.map((g) => ({ url: `${BASE}/guide/${g.slug}/`, lastModified: new Date(g.updated), priority: 0.7 })),
    { url: `${BASE}/terms/`, lastModified, priority: 0.2 },
    { url: `${BASE}/privacy/`, lastModified, priority: 0.2 },
    ...byPref().map((p) => ({ url: `${BASE}/${p.prefSlug}/`, lastModified, priority: 0.8 })),
    ...listings.map((l) => ({ url: `${BASE}/shop/${l.slug}/`, lastModified, priority: 0.6 })),
  ]
}
