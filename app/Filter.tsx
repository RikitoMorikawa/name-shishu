'use client'

import { useEffect, useMemo, useState } from 'react'

/**
 * 一覧の絞り込み。DOM を直接触って `hidden` を付け外しする。
 * **サーバーが描いた全件の HTML はそのまま残す** ― JS を実行しないクローラーにも
 * 全件を読ませたいので、React 側で行を作り直さない。
 */
export function Filter({ total }: { total: number }) {
  const [q, setQ] = useState('')
  const [only, setOnly] = useState<Set<string>>(new Set())
  const [shown, setShown] = useState(total)

  const toggle = (k: string) =>
    setOnly((s) => {
      const n = new Set(s)
      n.has(k) ? n.delete(k) : n.add(k)
      return n
    })

  const keys = useMemo(() => [...only].join(','), [only])

  useEffect(() => {
    const rows = document.querySelectorAll<HTMLElement>('[data-row]')
    const needle = q.trim().toLowerCase()
    let n = 0
    rows.forEach((el) => {
      const hay = (el.dataset.search ?? '').toLowerCase()
      const ok =
        (!needle || hay.includes(needle)) &&
        (!only.has('mochikomi') || el.dataset.mochikomi === '1') &&
        (!only.has('kakou') || el.dataset.kind === 'kakou') &&
        (!only.has('shop') || el.dataset.kind === 'shop')
      el.hidden = !ok
      if (ok) n++
    })
    // 中身が全部消えた市区の見出しも畳む
    document.querySelectorAll<HTMLElement>('[data-group]').forEach((g) => {
      g.hidden = !g.querySelector('[data-row]:not([hidden])')
    })
    setShown(n)
  }, [q, keys, only])

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-inner">
          <input
            className="search"
            type="search"
            placeholder="社名・地名で絞り込む"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="社名・地名で絞り込む"
          />
          <button className="chip" aria-pressed={only.has('mochikomi')} onClick={() => toggle('mochikomi')}>
            持ち込み可だけ
          </button>
          <button className="chip" aria-pressed={only.has('kakou')} onClick={() => toggle('kakou')}>
            加工屋
          </button>
          <button className="chip" aria-pressed={only.has('shop')} onClick={() => toggle('shop')}>
            作業服の店
          </button>
        </div>
      </div>
      <p className="count-line">
        {shown === total ? `${total}件` : `${shown}件 / ${total}件`}
      </p>
    </>
  )
}
