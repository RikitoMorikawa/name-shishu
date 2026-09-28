import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Cards } from '../../ShopCard'
import { PrArea } from '../../Pr'
import { cityPages, citySlug, findCity, prOf, prefLabel, updatedAt } from '@/lib/listings'

// **市区町村のページ。「刺繍 足立区」「名入れ 岡山市」の受け口**（2026-09-27）。
// 県ページの中の小見出しだけでは、題名に市区名を含むページが1枚も無かった。
// 件数の少ない市区は作らない（CITY_PAGE_MIN）。

export function generateStaticParams() {
  return cityPages().map((c) => ({ pref: c.prefSlug, city: citySlug(c.city) }))
}

// 日本語の params は環境によって % のまま渡ってくる
const decode = (s: string) => {
  try { return decodeURIComponent(s) } catch { return s }
}

export async function generateMetadata({ params }: { params: Promise<{ pref: string; city: string }> }): Promise<Metadata> {
  const { pref, city } = await params
  const c = findCity(pref, decode(city))
  if (!c) return {}
  const name = prefLabel(c.pref)
  return {
    title: `${c.city}（${name}）の刺繍加工業者${c.items.length}件｜持ち込みで刺繍・名入れを頼める店`,
    description: `${name}${c.city}の刺繍加工・名入れの業者${c.items.length}件。持ち込みの可否・最小枚数・納期・料金の目安を並べて比べられます。`,
    alternates: { canonical: `/${c.prefSlug}/${citySlug(c.city)}/` },
  }
}

export default async function CityPage({ params }: { params: Promise<{ pref: string; city: string }> }) {
  const { pref, city } = await params
  const c = findCity(pref, decode(city))
  if (!c) notFound()
  const name = prefLabel(c.pref)
  const url = `https://name-shishu.com/${c.prefSlug}/${encodeURIComponent(citySlug(c.city))}/`
  // 同じ県のほかの市区。回遊と、隣の市区で探す人のため
  const others = cityPages().filter((x) => x.prefSlug === c.prefSlug && x.city !== c.city)

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${name}${c.city}の刺繍・名入れ加工店`,
      numberOfItems: c.items.length,
      itemListElement: c.items.map((l, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `https://name-shishu.com/shop/${l.slug}/`,
        name: l.name,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ネーム刺繍ナビ', item: 'https://name-shishu.com/' },
        { '@type': 'ListItem', position: 2, name, item: `https://name-shishu.com/${c.prefSlug}/` },
        { '@type': 'ListItem', position: 3, name: c.city, item: url },
      ],
    },
  ]

  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <p className="crumb">
        <a href="/">ネーム刺繍ナビ</a> ／ <a href={`/${c.prefSlug}/`}>{name}</a> ／ {c.city}
      </p>
      <h1>{c.city}で刺繍・名入れを頼める店</h1>
      <p className="lead">
        {name}{c.city}で刺繍加工・名入れを受けている業者（加工屋）{c.items.length}件。持ち込みの可否・最小枚数・納期・料金の目安を並べています。
      </p>

      {/* 有料掲載の枠。一覧とは別の箱で、下の一覧の並びは変えない */}
      <PrArea items={prOf(c.items)} where={c.city} />

      <Cards items={c.items} />

      {others.length > 0 && (
        <section>
          <h2>{name}のほかの市区町村</h2>
          <div className="toc">
            {others.map((x) => (
              <a key={x.city} href={`/${x.prefSlug}/${citySlug(x.city)}/`}>{x.city} {x.items.length}</a>
            ))}
          </div>
        </section>
      )}

      <p className="crumb"><a href={`/${c.prefSlug}/`}>← {name}の一覧へ</a></p>
      <p className="muted">最終更新 {updatedAt}</p>
    </div>
  )
}
