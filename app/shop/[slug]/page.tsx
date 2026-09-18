import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Cards } from '../../ShopCard'
import { ITEM_LABEL, ITEM_ORDER, findListing, listings, nearby, updatedAt, prefLabel } from '@/lib/listings'

export function generateStaticParams() {
  return listings.map((l) => ({ slug: l.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const l = findListing(slug)
  if (!l) return {}
  // 地域が取れない行は括弧を出さない（「（）」になる。2026-09-16）
  const where = [l.pref ? prefLabel(l.pref) : null, l.city].filter(Boolean).join('・')
  return {
    title: where ? `${l.name}（${where}）の持ち込み刺繍・名入れ` : `${l.name}の持ち込み刺繍・名入れ`,
    description: `${where ? where + 'の' : ''}刺繍・名入れの加工屋「${l.name}」。持ち込みの可否・最小枚数・納期・料金の目安をまとめています。`,
    alternates: { canonical: `/shop/${l.slug}/` },
  }
}

const orUnknown = (v: string | null) => v ?? <span className="unknown">確認中</span>

// Maps Embed API は無料。**iframe で都度読むので Places のキャッシュ制限には当たらない。**
// キーが無ければ地図を出さない（ビルドが落ちないように）。
const MAP_KEY = process.env.NEXT_PUBLIC_MAPS_EMBED_KEY

export default async function ShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const l = findListing(slug)
  if (!l) notFound()

  const where = [l.pref ? prefLabel(l.pref) : null, l.city].filter(Boolean).join('・')
  // 地図のクエリ。**社名＋住所で引く。** 住所が町名までの先でも、社名があれば店舗を特定できる。
  // 記号（「|」「【】」など）はノイズになるので落とす（2026-09-17）
  const cleanName = l.name
    // **法人格を先に落とす。**「(有)さくら刺繍」の括弧だけ消すと「有 さくら刺繍」になる
    .replace(/[（(]\s*[株有合資名]\s*[)）]|㈱|㈲|株式会社|有限会社|合同会社|合資会社|合名会社/g, ' ')
    .replace(/[｜|【】\[\]（）()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const mapQuery = [cleanName, l.address].filter(Boolean).join(' ')
  const hasBanchi = !!l.address && /\d+\s*[-−ー―]\s*\d+|\d+番/.test(l.address)
  const near = nearby(l)


  // LocalBusiness。**確認できていない項目は書かない**（推測を構造化データに載せない）
  const biz: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: l.name,
    url: l.url,
    inLanguage: 'ja',
  }
  if (l.tel) biz.telephone = l.tel
  if (l.address) biz.address = { '@type': 'PostalAddress', addressCountry: 'JP', streetAddress: l.address }

  const crumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ネーム刺繍ナビ', item: 'https://name-shishu.com/' },
      ...(l.prefSlug && l.pref
        ? [{ '@type': 'ListItem', position: 2, name: prefLabel(l.pref), item: `https://name-shishu.com/${l.prefSlug}/` }]
        : []),
      { '@type': 'ListItem', position: l.prefSlug ? 3 : 2, name: l.name, item: `https://name-shishu.com/shop/${l.slug}/` },
    ],
  }

  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([biz, crumb]) }} />

      <p className="crumb">
        <a href="/">ネーム刺繍ナビ</a>
        {l.prefSlug ? <> ／ <a href={`/${l.prefSlug}/`}>{l.pref ? prefLabel(l.pref) : ''}</a></> : null}
        {l.city ? ` ／ ${l.city}` : ''}
      </p>

      <h1>{l.name}</h1>
      <p className="lead">
        <span className="pill pill-kakou">刺繍・名入れの加工屋</span>
        {ITEM_ORDER.filter((k) => l.items.includes(k)).map((k) => (
          <span className="pill pill-item" key={k}>{ITEM_LABEL[k]}</span>
        ))}
        {where ? <>　{where}</> : null}
      </p>

      <div className="actions">
        <a className="btn" href={l.url} rel="nofollow noopener" target="_blank">公式サイトを見る</a>
        {l.tel ? <a className="btn btn-call" href={`tel:${l.tel.replace(/[^0-9+]/g, '')}`}>{l.tel} に電話</a> : null}
        {l.address ? (
          <a className="btn btn-ghost" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`} rel="noopener" target="_blank">
            地図で見る
          </a>
        ) : null}
      </div>

      <h2>持ち込みで頼めるか</h2>
      <div className="panel">
        <table className="facts">
          <tbody>
            <tr>
              <th>持ち込み</th>
              <td>
                {l.mochikomi === true ? <span className="pill pill-ok">受けています</span>
                  : l.mochikomi === false ? '受けていません'
                  : <span className="unknown">確認中</span>}
              </td>
            </tr>
            <tr><th>最小枚数</th><td>{orUnknown(l.minLot)}</td></tr>
            <tr><th>納期</th><td>{orUnknown(l.lead)}</td></tr>
            <tr><th>料金の目安</th><td>{orUnknown(l.priceFrom)}</td></tr>
            <tr><th>対応品目</th><td>{l.items.length ? l.items.map((k) => ITEM_LABEL[k]).join('／') : <span className="unknown">確認中</span>}</td></tr>
          </tbody>
        </table>
      </div>

      {l.mochikomi === null ? (
        <div className="callout callout--sm">
          <b>この店の条件は確認が取れていません。</b>推測では書きません。
          <a href={l.url} rel="nofollow noopener" target="_blank">公式サイト</a>{l.tel ? 'かお電話' : ''}でご確認ください。
          訂正は <a href="mailto:contact@umidas.info">contact@umidas.info</a> へ。
        </div>
      ) : (
        <p className="muted">
          掲載内容は当サイトが調べたものです。枚数・納期・料金は変わることがあるので、
          ご依頼の前に <a href={l.url} rel="nofollow noopener" target="_blank">公式サイト</a>{l.tel ? 'かお電話' : ''}で最新の条件をご確認ください。
        </p>
      )}

      <h2>連絡先</h2>
      <div className="panel">
        <table className="facts">
          <tbody>
            <tr><th>サイト</th><td><a href={l.url} rel="nofollow noopener" target="_blank">{l.url}</a></td></tr>
            <tr><th>電話</th><td>{l.tel ? <a href={`tel:${l.tel.replace(/[^0-9+]/g, '')}`}>{l.tel}</a> : <span className="unknown">確認中</span>}</td></tr>
            <tr>
              <th>所在地</th>
              <td>
                {l.address ?? (
                  <span className="unknown">
                    確認中 ― <a href={l.url} rel="nofollow noopener" target="_blank">公式サイト</a>でご確認ください
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {l.note ? <p>{l.note}</p> : null}

      {/* 「地図で見る」ボタンと条件を揃える。住所があれば出す。
          番地まであれば寄る（zoom 17）、町名までなら引く（zoom 15） */}
      {MAP_KEY && l.address ? (
        <>
          <h2>場所</h2>
          <div className="map-wrap">
            <iframe
              title={`${l.name}の地図`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              src={`https://www.google.com/maps/embed/v1/place?key=${MAP_KEY}&q=${encodeURIComponent(
                mapQuery,
              )}&language=ja&region=JP&zoom=${hasBanchi ? 17 : 15}`}
            />
          </div>
          <p className="muted">
            外観を見たいときは地図の中でストリートビューに切り替えられます。
          </p>
        </>
      ) : null}

      {near.length ? (
        <>
          <h2>近くの店</h2>
          <Cards items={near} />
        </>
      ) : null}

      <p className="crumb">
        {l.prefSlug ? <><a href={`/${l.prefSlug}/`}>← {l.pref ? prefLabel(l.pref) : ''}の一覧へ</a>　</> : null}
        <a href="/">全国の一覧へ</a>
      </p>
      <p className="muted">最終更新 {updatedAt}</p>
    </div>
  )
}
