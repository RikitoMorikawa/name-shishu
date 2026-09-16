import { COL_LABEL, KIND_LABEL, type Col, type Listing } from '@/lib/listings'

/** 比較行。**列は呼ぶ側が決める**（activeCols で「埋まっている項目」だけ渡す）。
 *  data-* は Filter が DOM を直接絞り込むために使う（行は作り直さない）。 */
export function ShopRow({ l, cols, sub }: { l: Listing; cols: Col[]; sub?: 'pref' | 'address' }) {
  const value = (c: Col) => {
    switch (c) {
      case 'kind':
        return <span className={l.kind === 'kakou' ? 'pill pill-kakou' : 'pill pill-shop'}>
          {l.kind === 'kakou' ? '加工屋' : '作業服の店'}
        </span>
      case 'mochikomi':
        return l.mochikomi === true ? <span className="pill pill-ok">可</span>
          : l.mochikomi === false ? '不可'
          : <span className="unknown">確認中</span>
      default:
        return l[c] ?? <span className="unknown">確認中</span>
    }
  }
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
        {sub ? (
          <span className="where">
            {sub === 'pref'
              ? [l.pref, l.city].filter(Boolean).join(' ')
              : l.address ?? '住所は確認中'}
          </span>
        ) : null}
      </div>
      {cols.map((c) => (
        <div className="cell" key={c}>
          <i>{COL_LABEL[c]}</i>
          {value(c)}
        </div>
      ))}
      <div className="go" aria-hidden>→</div>
    </a>
  )
}

export function Rows({ items, cols, sub }: { items: Listing[]; cols: Col[]; sub?: 'pref' | 'address' }) {
  return (
    <div className="rows" data-cols={cols.length}>
      <div className="row head">
        <div>店</div>
        {cols.map((c) => <div key={c}>{COL_LABEL[c]}</div>)}
        <div />
      </div>
      {items.map((l) => <ShopRow key={l.slug} l={l} cols={cols} sub={sub} />)}
    </div>
  )
}

export { KIND_LABEL }
