'use client'

import { useMemo, useState } from 'react'
import { IconMap, IconPin, IconSearch } from './Icons'

export type PrefOption = { slug: string; label: string; count: number; cities: string[] }

/**
 * ヒーローの検索。**静的サイトなので、選んだら県ページへ飛ばすだけ。**
 * 市区町村は県ページ内のアンカーへ送る（市区ごとの独立ページは作っていない）。
 */
export function HeroSearch({ prefs, popular }: { prefs: PrefOption[]; popular: string[] }) {
  const [pref, setPref] = useState('')
  const [city, setCity] = useState('')
  const cities = useMemo(() => prefs.find((p) => p.slug === pref)?.cities ?? [], [pref, prefs])

  const go = () => {
    if (!pref) return
    location.href = city ? `/${pref}/#${city}` : `/${pref}/`
  }

  return (
    <div className="hero-search">
      <div className="hs-row">
        <label className="hs-field">
          <IconPin size={19} />
          <select value={pref} onChange={(e) => { setPref(e.target.value); setCity('') }} aria-label="都道府県を選ぶ">
            <option value="">都道府県を選ぶ</option>
            {prefs.map((p) => (
              <option key={p.slug} value={p.slug}>{p.label}（{p.count}）</option>
            ))}
          </select>
        </label>

        <label className="hs-field">
          <IconMap size={19} />
          <select value={city} onChange={(e) => setCity(e.target.value)} disabled={!pref} aria-label="市区町村を選ぶ">
            <option value="">{pref ? '市区町村を選ぶ（任意）' : '先に都道府県を選ぶ'}</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <button className="hs-go" onClick={go} disabled={!pref}>
          <IconSearch size={19} />店を探す
        </button>
      </div>

      <div className="hs-popular">
        <span className="hs-popular-label"><IconPin size={15} />よく見られている地域</span>
        {popular.map((slug) => {
          const p = prefs.find((x) => x.slug === slug)
          return p ? <a className="hs-chip" key={slug} href={`/${slug}/`}>{p.label}</a> : null
        })}
        <a className="hs-chip hs-chip-more" href="#list">すべての地域 →</a>
      </div>
    </div>
  )
}
