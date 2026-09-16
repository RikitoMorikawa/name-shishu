import type { Listing } from '@/lib/listings'

/** 写真が無い間のプレースホルダ。社名の頭文字を大きく置く。
 *  灰色の空枠を並べるより、**それ自体が意匠として成立する**ようにする。 */
function initial(name: string) {
  const s = name
    .replace(/[（(）)㈱㈲【】\[\]「」\s]/g, '')
    .replace(/^(株式会社|有限会社|合同会社)/, '')
  return [...s][0] ?? '刺'
}

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden focusable="false">
    <path d={d} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const PIN = 'M8 14.5S13 10.4 13 6.6A5 5 0 0 0 3 6.6C3 10.4 8 14.5 8 14.5Z M8 8.2a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4Z'
const CLOCK = 'M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z M8 4.5V8l2.3 1.4'
const YEN = 'M4 3l4 5 4-5 M8 8v5 M5.2 9.6h5.6 M5.2 11.6h5.6'

export function ShopCard({ l, sub }: { l: Listing; sub?: 'pref' | 'address' }) {
  const chips: string[] = []
  if (l.mochikomi === true) chips.push('持ち込み可')
  if (l.minLot) chips.push(l.minLot)
  if (l.lead) chips.push(l.lead)

  const where = sub === 'address' ? l.address : [l.pref, l.city].filter(Boolean).join(' ')

  return (
    <a
      className="shop-card"
      href={`/shop/${l.slug}/`}
      data-row=""
      data-kind={l.kind}
      data-pref={l.prefSlug ?? ''}
      data-mochikomi={l.mochikomi === true ? '1' : '0'}
      data-search={[l.name, l.pref, l.city, l.address].filter(Boolean).join(' ')}
    >
      <div className={`thumb thumb-${l.kind}`}>
        {l.photo ? (
          <img src={l.photo} alt={`${l.name}の外観`} loading="lazy" />
        ) : (
          <span className="thumb-initial" aria-hidden>{initial(l.name)}</span>
        )}
        <span className={`badge badge-${l.kind}`}>{l.kind === 'kakou' ? '加工屋' : '作業服の店'}</span>
      </div>

      <div className="shop-card-body">
        {chips.length ? (
          <div className="chips">
            {chips.map((c) => <span className="chip-tag" key={c}>{c}</span>)}
          </div>
        ) : null}

        <b className="shop-card-name">{l.name}</b>

        <div className="metas">
          <span className="meta"><Icon d={PIN} />{where || <span className="unknown">住所は確認中</span>}</span>
          {l.lead ? <span className="meta"><Icon d={CLOCK} />{l.lead}</span> : null}
          {l.priceFrom ? <span className="meta"><Icon d={YEN} />{l.priceFrom}</span> : null}
        </div>
      </div>
    </a>
  )
}

export function Cards({ items, sub }: { items: Listing[]; sub?: 'pref' | 'address' }) {
  return (
    <div className="card-grid">
      {items.map((l) => <ShopCard key={l.slug} l={l} sub={sub} />)}
    </div>
  )
}
