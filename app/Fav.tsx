'use client'

import { useEffect, useState } from 'react'
import { IconHeart } from './Icons'

/**
 * お気に入り。**この端末のブラウザにだけ残る**（DB に繋がない媒体なので、
 * 会員登録も持たない）。端末を変えると消えるので、その旨はお気に入りページに書く。
 */
const KEY = 'ns-fav'

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

function write(list: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* プライベートモードでは保存できない。押した見た目だけ変える */
  }
  // 同じ画面のヘッダーと他のカードへ知らせる（storage イベントは別タブにしか飛ばない）
  window.dispatchEvent(new CustomEvent('ns-fav-change', { detail: list }))
}

/** 保存済みの slug を購読する */
export function useFavs() {
  const [list, setList] = useState<string[] | null>(null)
  useEffect(() => {
    setList(read())
    const on = () => setList(read())
    window.addEventListener('ns-fav-change', on)
    window.addEventListener('storage', on)
    return () => {
      window.removeEventListener('ns-fav-change', on)
      window.removeEventListener('storage', on)
    }
  }, [])
  return list
}

export function FavButton({ slug, name }: { slug: string; name: string }) {
  const list = useFavs()
  // **サーバー側の描画と揃える。** 読み込む前は必ず「未登録」で描く（hydration のずれ防止）
  const on = !!list?.includes(slug)

  return (
    <button
      type="button"
      className={`fav${on ? ' is-on' : ''}`}
      aria-pressed={on}
      aria-label={`${name}をお気に入り${on ? 'から外す' : 'に入れる'}`}
      onClick={(e) => {
        e.preventDefault()
        const cur = read()
        write(on ? cur.filter((s) => s !== slug) : [...cur, slug])
      }}
    >
      <IconHeart size={19} filled={on} />
    </button>
  )
}

/** ヘッダーに出す件数。0 のときは何も出さない */
export function FavCount() {
  const list = useFavs()
  if (!list?.length) return null
  return <span className="fav-count">{list.length}</span>
}
