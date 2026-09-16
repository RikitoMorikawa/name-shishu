import type { Listing } from '@/lib/listings'

/** 比較行。**持ち込み・最小枚数・納期・料金を横に並べる**のがこの媒体の本体。
 *  data-* は Filter が DOM を直接絞り込むために使う（行は作り直さない）。 */
export function ShopRow({ l, showWhere = true }: { l: Listing; showWhere?: boolean }) {
  const cell = (label: string, v: string | null) => (
    <div className="cell">
      <i>{label}</i>
      {v ?? <span className="unknown">確認中</span>}
    </div>
  )
  return (
    <a
      className="row"
      href={`/shop/${l.slug}/`}
      data-row=""
      data-kind={l.kind}
      data-mochikomi={l.mochikomi === true ? '1' : '0'}
      data-search={[l.name, l.pref, l.city, l.address].filter(Boolean).join(' ')}
    >
      <div className="name">
        {l.name}
        {showWhere ? <span className="where">{[l.pref, l.city].filter(Boolean).join(' ')}</span> : null}
      </div>
      <div className="cell">
        <i>持ち込み</i>
        {l.mochikomi === true ? <span className="pill pill-ok">可</span>
          : l.mochikomi === false ? '不可'
          : <span className="unknown">確認中</span>}
      </div>
      {cell('最小枚数', l.minLot)}
      {cell('納期', l.lead)}
      {cell('料金', l.priceFrom)}
      <div className="go" aria-hidden>→</div>
    </a>
  )
}

export function RowsHead() {
  return (
    <div className="row head">
      <div>店</div><div>持ち込み</div><div>最小枚数</div><div>納期</div><div>料金の目安</div><div />
    </div>
  )
}
