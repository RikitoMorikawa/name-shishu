import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { findGuide, guides } from '@/data/guides'
import { hasPhoto } from '../../Photo'

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const g = findGuide(slug)
  if (!g) return {}
  // **サムネイルがあれば OGP に使う。** 無ければ既定のサイト画像のまま
  const thumb = `/photos/guide-${g.slug}.jpg`
  return {
    title: g.title,
    description: g.excerpt,
    alternates: { canonical: `/guide/${g.slug}/` },
    ...(hasPhoto(thumb)
      ? {
          openGraph: { type: 'article', images: [{ url: thumb, width: 1200, height: 800 }] },
          twitter: { card: 'summary_large_image', images: [thumb] },
        }
      : {}),
  }
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const g = findGuide(slug)
  if (!g) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: g.title,
    description: g.excerpt,
    inLanguage: 'ja',
    dateModified: g.updated,
    ...(hasPhoto(`/photos/guide-${g.slug}.jpg`)
      ? { image: [`https://name-shishu.com/photos/guide-${g.slug}.jpg`] }
      : {}),
    author: { '@type': 'Organization', name: 'UMIDAS' },
    publisher: { '@type': 'Organization', name: 'ネーム刺繍ナビ' },
  }

  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="prose">
        <p className="crumb"><a href="/">ネーム刺繍ナビ</a> ／ 読み物</p>
        <h1>{g.title}</h1>
        <p className="lead">{g.lead}</p>
        {/* 見出し画像。**無い記事は枠ごと出さない** ― 空の枠は本文より先に目に入る */}
        {hasPhoto(`/photos/guide-${g.slug}.jpg`) ? (
          <div className="guide-hero">
            <img src={`/photos/guide-${g.slug}.jpg`} alt="" />
          </div>
        ) : null}

        {g.body.map((b, i) => (
          <div key={i}>
            {b.h ? <h2>{b.h}</h2> : null}
            {b.p ? <p dangerouslySetInnerHTML={{ __html: b.p }} /> : null}
            {b.ul ? (
              <ul>
                {b.ul.map((li, j) => <li key={j} dangerouslySetInnerHTML={{ __html: li }} />)}
              </ul>
            ) : null}
            {b.note ? <div className="callout">{b.note}</div> : null}
          </div>
        ))}

        <div className="guide-foot">
          <a className="btn" href="/#list">店を探す</a>
        </div>
        <p className="muted">最終更新 {g.updated}</p>
      </article>
    </div>
  )
}
