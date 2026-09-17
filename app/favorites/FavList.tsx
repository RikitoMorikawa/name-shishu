'use client'

import { useFavs, FavButton } from '../Fav'
import { IconHeart, IconPin } from '../Icons'

export type FavItem = { slug: string; name: string; pref: string | null; city: string | null; tags: string[] }

export function FavList({ items }: { items: FavItem[] }) {
  const favs = useFavs()

  // 読み込む前は何も出さない。「0件です」を一瞬出すと、消えたように見える
  if (favs === null) return <p className="muted">読み込んでいます…</p>

  const list = favs.map((s) => items.find((i) => i.slug === s)).filter(Boolean) as FavItem[]

  if (!list.length) {
    return (
      <p className="fav-empty">
        <IconHeart size={22} />
        まだありません。気になる店の<b>ハート</b>を押すと、ここに並びます。
      </p>
    )
  }

  return (
    <div className="fav-list">
      {list.map((l) => (
        <article className="fav-row" key={l.slug}>
          <div>
            <h2><a href={`/shop/${l.slug}/`}>{l.name}</a></h2>
            <p className="pick-area"><IconPin size={14} />{[l.pref, l.city].filter(Boolean).join(' ') || '地域を確認中'}</p>
            <div className="pick-tags">
              {l.tags.map((t) => <span className="tag" key={t}>{t}</span>)}
            </div>
          </div>
          <FavButton slug={l.slug} name={l.name} />
        </article>
      ))}
    </div>
  )
}
