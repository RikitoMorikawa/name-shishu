import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Filter } from '../Filter'
import { Rows } from '../ShopRow'
import { activeCols, byCity, byPref, cityId, findPref, updatedAt } from '@/lib/listings'

export function generateStaticParams() {
  return byPref().map((p) => ({ pref: p.prefSlug }))
}

export async function generateMetadata({ params }: { params: Promise<{ pref: string }> }): Promise<Metadata> {
  const { pref } = await params
  const p = findPref(pref)
  if (!p) return {}
  return {
    title: `${p.pref}で刺繍・名入れを持ち込みで頼める店${p.items.length}件`,
    description: `${p.pref}の刺繍加工屋と作業服・ユニフォーム店を市区町村ごとに掲載。持ち込みの可否・最小枚数・納期・料金の目安を横に並べて比べられます。`,
    alternates: { canonical: `/${p.prefSlug}/` },
  }
}

export default async function PrefPage({ params }: { params: Promise<{ pref: string }> }) {
  const { pref } = await params
  const p = findPref(pref)
  if (!p) notFound()

  const cities = byCity(p.items)
  const cols = activeCols(p.items)
  const kakou = p.items.filter((l) => l.kind === 'kakou').length

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${p.pref}の刺繍・名入れ加工店`,
      numberOfItems: p.items.length,
      itemListElement: p.items.map((l, i) => ({
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
        { '@type': 'ListItem', position: 2, name: p.pref, item: `https://name-shishu.com/${p.prefSlug}/` },
      ],
    },
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <p className="crumb"><a href="/">ネーム刺繍ナビ</a> ／ {p.pref}</p>
      <h1>{p.pref}で刺繍・名入れを頼める店</h1>
      <p className="lead">
        持っている作業着に加工を頼める<b>刺繍の加工屋</b>と、服ごと名入れで買える
        <b>作業服・ユニフォームの店</b>を、市区町村ごとに並べています。
      </p>

      <div className="stats">
        <div className="stat"><b>{p.items.length}</b><span>{p.pref}の掲載</span></div>
        <div className="stat"><b>{kakou}</b><span>加工屋</span></div>
        <div className="stat"><b>{p.items.length - kakou}</b><span>作業服の店</span></div>
        <div className="stat"><b>{cities.length}</b><span>市区町村</span></div>
      </div>

      <div className="toc">
        {cities.map(([city, items]) => (
          <a key={city} href={`#${cityId(city)}`}>{city} {items.length}</a>
        ))}
      </div>

      <Filter total={p.items.length} />

      {cities.map(([city, items]) => (
        <section key={city} data-group="">
          <h2 id={cityId(city)}>{city}<span className="muted">　{items.length}件</span></h2>
          <Rows items={items} cols={cols} sub="address" />
        </section>
      ))}

      <div className="callout">
        <b>{p.pref}で載っていない店をご存じですか。</b>
        掲載は無料です。<a href="mailto:contact@umidas.info">contact@umidas.info</a> までお知らせください。
      </div>

      <p className="crumb"><a href="/">← 全国の一覧へ</a></p>
      <p className="muted">最終更新 {updatedAt}</p>
    </>
  )
}
