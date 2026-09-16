'use client'

import { useEffect, useState } from 'react'

export type FacetGroup = { key: string; label: string; options: { value: string; label: string; count: number }[] }

/**
 * 左サイドバーの絞り込み。DOM を直接触って `hidden` を付け外しする。
 * **サーバーが描いた全件の HTML はそのまま残す** ― JS を実行しないクローラーにも
 * 全件を読ませたいので、React 側でカードを作り直さない。
 */
export function Filter({ total, groups }: { total: number; groups: FacetGroup[] }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Record<string, Set<string>>>({})
  const [shown, setShown] = useState(total)
  const [open, setOpen] = useState(false)

  const toggle = (g: string, v: string) =>
    setSel((s) => {
      const cur = new Set(s[g] ?? [])
      cur.has(v) ? cur.delete(v) : cur.add(v)
      return { ...s, [g]: cur }
    })

  const stamp = JSON.stringify(Object.entries(sel).map(([k, v]) => [k, [...v]]))

  useEffect(() => {
    const needle = q.trim().toLowerCase()
    let n = 0
    document.querySelectorAll<HTMLElement>('[data-row]').forEach((el) => {
      const hay = (el.dataset.search ?? '').toLowerCase()
      let ok = !needle || hay.includes(needle)
      if (ok) {
        for (const [g, vals] of Object.entries(sel)) {
          if (!vals.size) continue
          const v = g === 'mochikomi' ? (el.dataset.mochikomi === '1' ? 'yes' : 'no') : (el.dataset[g] ?? '')
          if (!vals.has(v)) { ok = false; break }
        }
      }
      el.hidden = !ok
      if (ok) n++
    })
    // 中身が消えた市区の見出しごと畳む
    document.querySelectorAll<HTMLElement>('[data-group]').forEach((g) => {
      g.hidden = !g.querySelector('[data-row]:not([hidden])')
    })
    setShown(n)
  }, [q, stamp, sel])

  const clear = () => { setQ(''); setSel({}) }
  const active = Object.values(sel).reduce((a, s) => a + s.size, 0) + (q ? 1 : 0)

  return (
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
                  <label>
                    <input
                      type="checkbox"
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
          {active ? <button className="link-btn" onClick={clear}>条件をクリア</button> : null}
        </p>
      </div>
    </aside>
  )
}
