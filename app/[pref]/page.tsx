import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Filter } from '../Filter'
import { Cards } from '../ShopCard'
import { ITEM_LABEL, ITEM_ORDER, byCity, byPref, cityId, findPref, itemCounts, prefLabel, updatedAt } from '@/lib/listings'

export function generateStaticParams() {
  return byPref().map((p) => ({ pref: p.prefSlug }))
}

export async function generateMetadata({ params }: { params: Promise<{ pref: string }> }): Promise<Metadata> {
  const { pref } = await params
  const p = findPref(pref)
  if (!p) return {}
  const name = prefLabel(p.pref)
  return {
    title: `${name}で刺繍・名入れを持ち込みで頼める店${p.items.length}件`,
    description: `${name}の刺繍加工屋と作業服・ユニフォーム店を市区町村ごとに掲載。持ち込みの可否・最小枚数・納期・料金の目安を横に並べて比べられます。`,
    alternates: { canonical: `/${p.prefSlug}/` },
  }
}

export default async function PrefPage({ params }: { params: Promise<{ pref: string }> }) {
  const { pref } = await params
  const p = findPref(pref)
  if (!p) notFound()
  const name = prefLabel(p.pref)

  const cities = byCity(p.items)
  const counts = itemCounts(p.items)

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${name}の刺繍・名入れ加工店`,
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
        { '@type': 'ListItem', position: 2, name, item: `https://name-shishu.com/${p.prefSlug}/` },
      ],
    },
  ]

  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <p className="crumb"><a href="/">ネーム刺繍ナビ</a> ／ {name}</p>
      <h1>{name}で刺繍・名入れを頼める店</h1>
      <p className="lead">
        {name}に{p.items.length}件。市区町村ごとに並べています。
      </p>

      <div className="toc">
        {cities.map(([city, items]) => (
          <a key={city} href={`#${cityId(city)}`}>{city} {items.length}</a>
        ))}
      </div>

      <div className="layout">
        <Filter
          total={p.items.length}
          groups={[
            {
              key: 'items', label: '刺繍を入れる対象',
              options: ITEM_ORDER.map((k) => ({ value: k, label: ITEM_LABEL[k], count: counts[k] })),
            },
            {
              key: 'mochikomi', label: '持ち込み',
              options: [{ value: 'yes', label: '受けている店だけ', count: p.items.filter((l) => l.mochikomi === true).length }],
            },
          ]}
        />
        <div>
          {cities.map(([city, items]) => (
            <section key={city} data-group="">
              <h2 id={cityId(city)}>{city}<span className="muted">　{items.length}件</span></h2>
              <Cards items={items} />
            </section>
          ))}
          {/* 「もっと見る」の置き場。中身は Filter が portal で描く */}
          <div id="more-slot" />
        </div>
      </div>

      <div className="callout">
        <b>{name}で載っていない店をご存じですか。</b>
        掲載は無料です。<a href="mailto:contact@umidas.info">contact@umidas.info</a> までお知らせください。
      </div>

      <p className="crumb"><a href="/">← 全国の一覧へ</a></p>
      <p className="muted">最終更新 {updatedAt}</p>
    </div>
  )
}
