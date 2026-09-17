'use client'

import { useEffect, useState } from 'react'
import { FavCount } from './Fav'
import { IconClose, IconHeart, IconMenu, IconPin } from './Icons'

const LINKS = [
  { href: '/#list', label: '掲載店を条件で探す' },
  { href: '/#area', label: '地域から探す' },
  { href: '/#guides', label: 'どこに頼むか迷ったら' },
  { href: '/favorites/', label: 'お気に入り' },
  { href: '/about/', label: 'この媒体について' },
  { href: 'mailto:contact@umidas.info', label: '掲載・訂正のご依頼' },
]

export function HeaderNav() {
  const [open, setOpen] = useState(false)

  // 開いている間は背面を止める。戻し忘れると一覧がスクロールできなくなる
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <nav className="head-nav">
        <a href="/#list">
          <IconPin size={18} />
          <span>店を探す</span>
        </a>
        <a href="/favorites/" className="head-fav">
          <IconHeart size={18} />
          <span>お気に入り</span>
          <FavCount />
        </a>
        <button
          type="button"
          className="head-menu"
          aria-label="メニューを開く"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <IconMenu size={22} />
        </button>
      </nav>

      {open ? (
        <div className="drawer" role="dialog" aria-label="メニュー" onClick={() => setOpen(false)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="drawer-close" aria-label="閉じる" onClick={() => setOpen(false)}>
              <IconClose size={22} />
            </button>
            <ul>
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  )
}
