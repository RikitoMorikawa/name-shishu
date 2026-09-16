import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { byCity, byPref, findPref, KIND_LABEL, updatedAt } from '@/lib/listings'

export function generateStaticParams() {
  return byPref().map((p) => ({ pref: p.prefSlug }))
}

export async function generateMetadata({ params }: { params: Promise<{ pref: string }> }): Promise<Metadata> {
  const { pref } = await params
  const p = findPref(pref)
  if (!p) return {}
  return {
    title: `${p.pref}で刺繍・名入れを持ち込みで頼める店${p.items.length}件`,
    description: `${p.pref}にある刺繍の加工屋と作業服・ユニフォームの店を市区町村ごとに掲載。持ち込みの可否・最小枚数・納期・料金の目安を並べています。`,
  }
}

export default async function PrefPage({ params }: { params: Promise<{ pref: string }> }) {
  const { pref } = await params
  const p = findPref(pref)
  if (!p) notFound()

  const cities = byCity(p.items)
  const jsonLd = {
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
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h1>{p.pref}で刺繍・名入れを頼める店</h1>
      <p className="lead">
        {p.pref}に{p.items.length}件。持っている作業着に加工を頼める<b>刺繍の加工屋</b>と、
        服ごと名入れで買える<b>作業服・ユニフォームの店</b>を分けて載せています。
      </p>

      {cities.map(([city, items]) => (
        <section key={city}>
          <h2>{city}（{items.length}件）</h2>
          <div className="card-list">
            {items.map((l) => (
              <a className="card" key={l.slug} href={`/shop/${l.slug}/`}>
                <b>{l.name}</b>
                <span className="tag">{KIND_LABEL[l.kind]}</span>
                <div className="meta">{l.address ?? <span className="unknown">住所は確認中</span>}</div>
                <small>
                  {l.mochikomi === true ? '持ち込み可' : l.mochikomi === false ? '持ち込み不可' : '持ち込みは確認中'}
                  {l.minLot ? ` ／ 最小 ${l.minLot}` : ''}
                  {l.lead ? ` ／ 納期 ${l.lead}` : ''}
                </small>
              </a>
            ))}
          </div>
        </section>
      ))}

      <p className="crumb"><a href="/">← 全国の一覧へ</a></p>
      <p className="unknown">最終更新 {updatedAt}</p>
    </>
  )
}
