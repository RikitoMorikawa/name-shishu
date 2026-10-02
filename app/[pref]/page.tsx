import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Filter } from '../Filter'
import { Cards } from '../ShopCard'
import { PrArea } from '../Pr'
import { CITY_PAGE_MIN, NO_CITY, ITEM_LABEL, ITEM_ORDER, kindFacet, byCity, byPref, cityId, citySlug, findPref, itemCounts, prOf, prefLabel, updatedAt } from '@/lib/listings'

export function generateStaticParams() {
  return byPref().map((p) => ({ pref: p.prefSlug }))
}

export async function generateMetadata({ params }: { params: Promise<{ pref: string }> }): Promise<Metadata> {
  const { pref } = await params
  const p = findPref(pref)
  if (!p) return {}
  const name = prefLabel(p.pref)
  // 説明文に掲載の多い市区を3つまで入れる（「刺繍 足立区」で検索されたときに説明文でも当たるように）。
  // 掲載は加工屋と販売店の2種類（2026-10-01〜。9/17〜9/30 は加工屋だけだった）。題名の「刺繍加工業者」は検索語なので残す
  const top = byCity(p.items).map(([c]) => c).filter((c) => c !== NO_CITY).slice(0, 3)
  return {
    // **「刺繍加工業者」「刺繍業者」の語を題名に持つ**（2026-09-27）。本文が「加工屋」だけで、
    // 「埼玉 刺繍業者」では出るのに「埼玉 刺繍加工業者」では上位に来なかった。「持ち込み」は核なので残す
    title: `${name}の刺繍加工業者${p.items.length}件｜持ち込みで刺繍・名入れを頼める店`,
    description: `${name}の刺繍加工・名入れの業者を${top.length ? top.join('・') + 'など' : ''}市区町村ごとに掲載。持ち込みの可否・最小枚数・納期・料金の目安を横に並べて比べられます。`,
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
        {name}で刺繍・名入れを受けている{p.items.length}件を、市区町村ごとに並べています。
        服を持ち込むなら<b>刺繍の加工屋</b>（{p.items.filter((l) => l.kind === 'kakou').length}件）、
        服から選ぶなら<b>名入れの販売店</b>（{p.items.filter((l) => l.kind === 'shop').length}件）が行き先です。
      </p>

      <div className="toc">
        {cities.map(([city, items]) => (
          <a key={city} href={`#${cityId(city)}`}>{city} {items.length}</a>
        ))}
      </div>

      {/* 有料掲載の枠。一覧とは別の箱で、下の一覧の並びは変えない */}
      <PrArea items={prOf(p.items, 'pref')} where={name} />

      <div className="layout">
        <Filter
          total={p.items.length}
          groups={[
              kindFacet(p.items),
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
              <h2 id={cityId(city)}>
                {/* 市区ページがある市区は見出しから飛べるようにする（検索の受け口へ内部リンクを通す） */}
                {city !== NO_CITY && items.length >= CITY_PAGE_MIN
                  ? <a href={`/${p.prefSlug}/${citySlug(city)}/`}>{city}</a>
                  : city}
                <span className="muted">　{items.length}件</span>
              </h2>
              <Cards items={items} />
            </section>
          ))}
          {/* 「もっと見る」の置き場。中身は Filter が portal で描く */}
          <div id="more-slot" />
        </div>
      </div>

      <div className="callout">
        <b>{name}で載っていない店をご存じですか。</b>
        <a href="mailto:contact@umidas.info">contact@umidas.info</a> までお知らせください。
      </div>

      <p className="crumb"><a href="/">← 全国の一覧へ</a></p>
      <p className="muted">最終更新 {updatedAt}</p>
    </div>
  )
}
