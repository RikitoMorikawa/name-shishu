'use client'

import { useState } from 'react'

/**
 * 店ページ「お店から」の写真。**右のサムネイルを押すとメインが切り替わる**（2026-10-02 本人）。
 * 写真が1枚ならサムネイルは出さない。サムネイルには全部の写真を並べ、いまメインの1枚に枠を付ける
 */
export function PrGallery({ photos, name }: { photos: { src: string; alt: string }[]; name: string }) {
  const [i, setI] = useState(0)
  const main = photos[i] ?? photos[0]
  if (!main) return null
  const alt = (p: { alt: string }) => p.alt || `${name}の写真`
  return (
    <div className={`pr-gallery${photos.length > 1 ? ' pr-gallery--sub' : ''}`}>
      <img className="pr-gallery-main" src={main.src} alt={alt(main)} decoding="async" />
      {photos.length > 1 ? (
        <div className="pr-gallery-sub" role="group" aria-label="写真を切り替える">
          {photos.map((p, k) => (
            <button
              key={p.src}
              type="button"
              className={`pr-thumb${k === i ? ' is-on' : ''}`}
              aria-pressed={k === i}
              aria-label={`${k + 1}枚目を大きく表示`}
              onClick={() => setI(k)}
            >
              <img src={p.src} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
