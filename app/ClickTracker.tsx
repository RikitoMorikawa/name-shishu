'use client'

import { useEffect } from 'react'
import { track, type Ev } from './track'

/**
 * `data-ev`・`data-shop` を付けたリンクの押下を拾う（2026-10-03）。
 * 各リンクはサーバー側で描いたままにする（AI クローラーは JS を実行しないので、
 * 公式サイトへの href を書き換えたり経由させたりしない）。中クリック（別タブ）も数える。
 */
export function ClickTracker() {
  useEffect(() => {
    const on = (e: MouseEvent) => {
      if (e.type === 'auxclick' && e.button !== 1) return
      const a = (e.target as Element | null)?.closest?.('[data-ev][data-shop]')
      if (!a) return
      track(a.getAttribute('data-ev') as Ev, a.getAttribute('data-shop')!)
    }
    document.addEventListener('click', on, true)
    document.addEventListener('auxclick', on, true)
    return () => {
      document.removeEventListener('click', on, true)
      document.removeEventListener('auxclick', on, true)
    }
  }, [])
  return null
}
