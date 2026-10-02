'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export type FacetGroup = { key: string; label: string; options: { value: string; label: string; count: number }[] }

/** 一度に出す件数。**「もっと見る」で増える** */
const PAGE = 20

/**
 * 左サイドバーの絞り込みと、一覧の件数制限。DOM を直接触って `hidden` を付け外しする。
 * **サーバーが描いた全件の HTML はそのまま残す** ― JS を実行しないクローラーにも
 * 全件を読ませたいので、React 側でカードを作り直さない。
 *
 * **「もっと見る」もここが持つ。** 表示する行を決める場所を2か所に分けると、
 * 絞り込みと件数制限が互いを打ち消す。ボタンは一覧の下の `#more-slot` へ portal で出す。
 */
export function Filter({ total, groups }: { total: number; groups: FacetGroup[] }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Record<string, Set<string>>>({})
  const [shown, setShown] = useState(total)
  const [open, setOpen] = useState(false)
  const [limit, setLimit] = useState(PAGE)
  // ボタンの出し先。**マウントしてからでないと掴めない**（静的HTMLには出ない）
  const [slot, setSlot] = useState<Element | null>(null)
  useEffect(() => { setSlot(document.getElementById('more-slot')) }, [])

  const toggle = (g: string, v: string) =>
    setSel((s) => {
      const cur = new Set(s[g] ?? [])
      cur.has(v) ? cur.delete(v) : cur.add(v)
      return { ...s, [g]: cur }
    })

  const stamp = JSON.stringify(Object.entries(sel).map(([k, v]) => [k, [...v]]))

  // 条件を変えたら件数制限は最初に戻す。前の「もっと見る」が残ると件数が合わない
  useEffect(() => { setLimit(PAGE) }, [q, stamp])

  useEffect(() => {
    const needle = q.trim().toLowerCase()
    let n = 0
    document.querySelectorAll<HTMLElement>('[data-row]').forEach((el) => {
      const hay = (el.dataset.search ?? '').toLowerCase()
      let ok = !needle || hay.includes(needle)
      if (ok) {
        for (const [g, vals] of Object.entries(sel)) {
          if (!vals.size) continue
          if (g === 'items') {
            // 品目は**どれかに当てはまれば通す**（服と帽子の両方を選んだら「服または帽子」）
            const has = (el.dataset.items ?? '').split(' ')
            if (![...vals].some((v) => has.includes(v))) { ok = false; break }
            continue
          }
          const v = g === 'mochikomi' ? (el.dataset.mochikomi === '1' ? 'yes' : 'no') : (el.dataset[g] ?? '')
          if (!vals.has(v)) { ok = false; break }
        }
      }
      if (ok) n++
      // **条件に合っていても、先頭 limit 件までしか出さない。**
      // 消さずに hidden にするだけなので、全件の HTML はそのまま残る
      el.hidden = !ok || n > limit
    })
    // 中身が消えた市区の見出しごと畳む
    document.querySelectorAll<HTMLElement>('[data-group]').forEach((g) => {
      g.hidden = !g.querySelector('[data-row]:not([hidden])')
    })
    setShown(n)
  }, [q, stamp, sel, limit])

  // 品目の帯（トップ上部）から飛んできたら、その品目だけに絞る。
  // **帯とサイドバーで同じ状態を持たない** ― 絞り込みの正はここ1つ
  useEffect(() => {
    const on = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.('[data-jump-item]')
      const v = el?.getAttribute('data-jump-item')
      if (!v) return
      setQ('')
      setSel({ items: new Set([v]) })
    }
    document.addEventListener('click', on)
    return () => document.removeEventListener('click', on)
  }, [])

  const clear = () => { setQ(''); setSel({}) }
  const rest = Math.max(0, shown - limit)
  const active = Object.values(sel).reduce((a, s) => a + s.size, 0) + (q ? 1 : 0)

  return (
    <>
    {slot && rest > 0
      ? createPortal(
          <button type="button" className="more-btn" onClick={() => setLimit((v) => v + PAGE)}>
            もっと見る<em>あと{rest}件</em>
          </button>,
          slot,
        )
      : null}
    <aside className={`sidebar${open ? ' is-open' : ''}`}>
      <button className="sidebar-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        絞り込み{active ? `（${active}）` : ''}
      </button>

      <div className="sidebar-inner">
        <div className="facet">
          <input
            className="search"
            type="search"
            placeholder="社名・地名で探す"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="社名・地名で探す"
          />
        </div>

        {groups.map((g) => (
          <div className="facet" key={g.key}>
            <h3 className="facet-title">{g.label}</h3>
            <ul className="facet-list">
              {g.options.map((o) => (
                <li key={o.value}>
                  {/* 0件の条件は押しても空になるだけなので無効にする */}
                  <label className={o.count === 0 ? 'is-empty' : undefined}>
                    <input
                      type="checkbox"
                      disabled={o.count === 0}
                      checked={sel[g.key]?.has(o.value) ?? false}
                      onChange={() => toggle(g.key, o.value)}
                    />
                    <span>{o.label}</span>
                    <em>{o.count}</em>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <p className="facet-result">
          <b>{shown}</b> / {total}件
          {/* **数字が2つあると食い違って見える。** 条件に合う件数と、いま出している件数を分けて書く */}
          {rest > 0 ? <span className="facet-shown">うち{limit}件を表示中</span> : null}
          {active ? <button className="link-btn" onClick={clear}>条件をクリア</button> : null}
        </p>
      </div>
    </aside>
    </>
  )
}
