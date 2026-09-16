import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { findListing, KIND_LABEL, listings, updatedAt } from '@/lib/listings'

export function generateStaticParams() {
  return listings.map((l) => ({ slug: l.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const l = findListing(slug)
  if (!l) return {}
  // 地域が取れない行は括弧を出さない（「（）」になる。2026-09-16）
  const where = [l.pref, l.city].filter(Boolean).join('')
  return {
    title: where ? `${l.name}（${where}）の持ち込み刺繍・名入れ` : `${l.name}の持ち込み刺繍・名入れ`,
    description: `${where ? where + 'の' : ''}${KIND_LABEL[l.kind]}「${l.name}」。持ち込みの可否・最小枚数・納期・料金の目安をまとめています。`,
  }
}

const orUnknown = (v: string | null) => v ?? <span className="unknown">確認中</span>

export default async function ShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const l = findListing(slug)
  if (!l) notFound()

  // LocalBusiness で出す。**確認できていない項目は書かない**（推測を構造化データに載せない）
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: l.name,
    url: l.url,
    inLanguage: 'ja',
  }
  if (l.tel) jsonLd.telephone = l.tel
  if (l.address) jsonLd.address = { '@type': 'PostalAddress', addressCountry: 'JP', streetAddress: l.address }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h1>{l.name}</h1>
      <p className="lead">
        <span className="tag">{KIND_LABEL[l.kind]}</span>
        {[l.pref, l.city].filter(Boolean).join('')}
      </p>

      <h2>持ち込みで頼めるか</h2>
      <table className="facts">
        <tbody>
          <tr><th>持ち込み</th><td>{l.mochikomi === true ? '受けています' : l.mochikomi === false ? '受けていません' : <span className="unknown">確認中</span>}</td></tr>
          <tr><th>最小枚数</th><td>{orUnknown(l.minLot)}</td></tr>
          <tr><th>納期</th><td>{orUnknown(l.lead)}</td></tr>
          <tr><th>料金の目安</th><td>{orUnknown(l.priceFrom)}</td></tr>
          <tr><th>対応品目</th><td>{l.items.length ? l.items.join('／') : <span className="unknown">確認中</span>}</td></tr>
        </tbody>
      </table>
      <p className="unknown">
        空欄はまだ確認が取れていない項目です。推測では書きません。分かり次第うめていきます。
      </p>

      <h2>連絡先</h2>
      <table className="facts">
        <tbody>
          <tr><th>サイト</th><td><a href={l.url} rel="nofollow noopener" target="_blank">{l.url}</a></td></tr>
          <tr><th>電話</th><td>{orUnknown(l.tel)}</td></tr>
          <tr><th>所在地</th><td>{orUnknown(l.address)}</td></tr>
        </tbody>
      </table>
      {l.note ? <p>{l.note}</p> : null}

      <p className="crumb">
        {l.prefSlug ? <><a href={`/${l.prefSlug}/`}>← {l.pref}の一覧へ</a>　</> : null}
        <a href="/">全国の一覧へ</a>
      </p>
      <p className="unknown">最終更新 {updatedAt}</p>
    </>
  )
}
