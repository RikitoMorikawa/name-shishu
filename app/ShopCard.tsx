import type { Listing } from '@/lib/listings'

/** 写真が無い間のプレースホルダ。社名の頭文字を大きく置く。 */
function initial(name: string) {
  // **法人格を先に落とす。** 括弧だけ消すと「（有）オオクボ縫製」が「有」になる（2026-09-17）
  const s = name
    .replace(/[（(]\s*[株有合資名]\s*[)）]|㈱|㈲|株式会社|有限会社|合同会社|合資会社|合名会社/g, '')
    .replace(/[（(）)【】\[\]「」｜|\s　・]/g, '')
  const c = [...s][0] ?? '刺'
  return /[A-Za-z]/.test(c) ? s.slice(0, 2).toUpperCase() : c
}

const MAP_KEY = process.env.NEXT_PUBLIC_MAPS_EMBED_KEY

/** 番地まで書かれている住所か。町名までだと地図が町の中心を指す */
const hasBanchi = (l: Listing) =>
  !!l.address && /\d+\s*[-−ー―]\s*\d+|\d+番/.test(l.address)

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden focusable="false">
    <path d={d} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const PIN = 'M8 14.5S13 10.4 13 6.6A5 5 0 0 0 3 6.6C3 10.4 8 14.5 8 14.5Z M8 8.2a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4Z'
const TEL = 'M5.6 2.5 7 5.2 5.7 6.6a8 8 0 0 0 3.7 3.7l1.4-1.3 2.7 1.4v2.2c0 .6-.5 1-1.1 1C7.6 13.2 2.8 8.4 2.5 2.6c0-.6.4-1.1 1-1.1h2.1Z'

export function ShopCard({ l }: { l: Listing }) {
  // **確認できた条件だけ並べる。**「確認中」を4つ並べても比較にならない
  const terms = [
    l.mochikomi === true ? { k: '持ち込み', v: '可' } : l.mochikomi === false ? { k: '持ち込み', v: '不可' } : null,
    l.minLot ? { k: '最小', v: l.minLot } : null,
    l.lead ? { k: '納期', v: l.lead } : null,
    l.priceFrom ? { k: '料金', v: l.priceFrom } : null,
  ].filter(Boolean) as { k: string; v: string }[]

  return (
    <article
      className="shop-row"
      data-row=""
      data-kind={l.kind}
      data-pref={l.prefSlug ?? ''}
      data-mochikomi={l.mochikomi === true ? '1' : '0'}
      data-search={[l.name, l.pref, l.city, l.address].filter(Boolean).join(' ')}
    >
      <div className={`thumb thumb-${l.kind}`}>
        {l.photo ? (
          <img src={l.photo} alt={`${l.name}の外観`} loading="lazy" />
        ) : MAP_KEY && hasBanchi(l) ? (
          <iframe
            className="thumb-map"
            title=""
            aria-hidden
            tabIndex={-1}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps/embed/v1/place?key=${MAP_KEY}&q=${encodeURIComponent(
              l.address as string,
            )}&language=ja&region=JP&zoom=16`}
          />
        ) : (
          <span className="thumb-initial" aria-hidden>{initial(l.name)}</span>
        )}
      </div>

      <div className="shop-row-body">
        <div className="shop-row-head">
          <span className={l.kind === 'kakou' ? 'pill pill-kakou' : 'pill pill-shop'}>
            {l.kind === 'kakou' ? '刺繍・名入れの加工屋' : '作業服・ユニフォームの店'}
          </span>
          <span className="pill pill-area">{[l.pref, l.city].filter(Boolean).join('・') || '地域を確認中'}</span>
        </div>

        <h3 className="shop-row-name">
          <a href={`/shop/${l.slug}/`}>{l.name}</a>
        </h3>

        {terms.length ? (
          <dl className="terms">
            {terms.map((t) => (
              <div key={t.k}>
                <dt>{t.k}</dt>
                <dd>{t.v}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="terms-empty">持ち込みの条件は確認中です</p>
        )}

        <div className="shop-row-contact">
          <span className="meta"><Icon d={PIN} />{l.address ?? <span className="unknown">住所は確認中</span>}</span>
          {l.tel ? (
            <span className="meta"><Icon d={TEL} /><a href={`tel:${l.tel.replace(/[^0-9+]/g, '')}`}>{l.tel}</a></span>
          ) : null}
        </div>

        <div className="shop-row-actions">
          <a className="btn btn-sm" href={`/shop/${l.slug}/`}>この店の詳細</a>
          <a className="btn btn-sm btn-ghost" href={l.url} rel="nofollow noopener" target="_blank">公式サイト</a>
        </div>
      </div>
    </article>
  )
}

export function Cards({ items }: { items: Listing[] }) {
  return (
    <div className="shop-rows">
      {items.map((l) => <ShopCard key={l.slug} l={l} />)}
    </div>
  )
}
