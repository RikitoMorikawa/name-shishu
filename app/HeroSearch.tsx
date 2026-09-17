'use client'

import { useMemo, useState } from 'react'
import { IconMap, IconPin, IconSearch } from './Icons'
import { Select } from './Select'

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
        <Select
          label="都道府県を選ぶ"
          placeholder="都道府県を選ぶ"
          icon={<IconPin size={19} />}
          value={pref}
          onChange={(v) => { setPref(v); setCity('') }}
          options={prefs.map((p) => ({ value: p.slug, label: p.label, count: p.count }))}
        />

        {/* **市区が1件も取れていない県がある**（住所を公式サイトで裏取りできていない）。
            そこで空のリストを開かせると壊れて見えるので、選べないことを文で出す */}
        <Select
          label="市区町村を選ぶ"
          placeholder={!pref ? '先に都道府県を選ぶ' : cities.length ? '市区町村を選ぶ（任意）' : '市区の情報は確認中'}
          icon={<IconMap size={19} />}
          disabled={!pref || cities.length === 0}
          value={city}
          onChange={setCity}
          options={cities.map((c) => ({ value: c, label: c }))}
        />

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
