'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { IconChevron } from './Icons'

export type Opt = { value: string; label: string; count?: number }

/**
 * 選択肢のドロップダウン。**ネイティブの `<select>` の代わり。**
 * OS ごとに見た目が変わるのと、件数を横に添えられないので自前で持つ。
 *
 * **フォーカスはボタンに置いたまま**、`aria-activedescendant` で「いまどれを見ているか」を
 * 読み上げへ伝える（WAI-ARIA の combobox パターン）。リスト側へフォーカスを移す作りにすると、
 * 閉じたあとの戻し先を自分で管理することになり、Tab の順番が狂いやすい。
 *
 * 対応しているキー: ↑↓ で移動、Enter / Space で決定、Esc で閉じる、Home / End で端へ、Tab で閉じる。
 */
export function Select({
  value, onChange, options, placeholder, disabled, icon, label,
}: {
  value: string
  onChange: (v: string) => void
  options: Opt[]
  placeholder: string
  disabled?: boolean
  icon?: React.ReactNode
  /** 読み上げ用の名前。画面には出さない */
  label: string
}) {
  const [open, setOpen] = useState(false)
  // いま矢印キーで指している位置。**選択中とは別物**（指すだけでは確定しない）
  const [active, setActive] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const id = useId()
  const selected = options.find((o) => o.value === value) ?? null

  // 外を触ったら閉じる。**pointerdown で拾う** ― click だと選択肢の確定より後になる
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  // 指している選択肢を画面内に収める
  useEffect(() => {
    if (!open || active < 0) return
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const openWith = (i: number) => {
    if (disabled) return
    setActive(i)
    setOpen(true)
  }

  const pick = (i: number) => {
    const o = options[i]
    if (!o) return
    onChange(o.value)
    setOpen(false)
    btnRef.current?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    const last = options.length - 1
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        openWith(Math.max(0, options.findIndex((o) => o.value === value)))
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setActive((i) => (i >= last ? 0 : i + 1)); break
      case 'ArrowUp': e.preventDefault(); setActive((i) => (i <= 0 ? last : i - 1)); break
      case 'Home': e.preventDefault(); setActive(0); break
      case 'End': e.preventDefault(); setActive(last); break
      case 'Enter': case ' ': e.preventDefault(); pick(active); break
      case 'Escape': e.preventDefault(); setOpen(false); break
      case 'Tab': setOpen(false); break
    }
  }

  return (
    <div className={`sel${disabled ? ' is-disabled' : ''}`} ref={rootRef}>
      <button
        ref={btnRef}
        type="button"
        className="sel-btn"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open && active >= 0 ? `${id}-opt-${active}` : undefined}
        aria-label={label}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openWith(Math.max(0, options.findIndex((o) => o.value === value))))}
        onKeyDown={onKeyDown}
      >
        {icon}
        <span className={`sel-value${selected ? '' : ' is-placeholder'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <IconChevron size={18} className={`sel-caret${open ? ' is-open' : ''}`} />
      </button>

      {open ? (
        <ul className="sel-list" id={`${id}-list`} role="listbox" aria-label={label} ref={listRef}>
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={o.value === value}
              className={`sel-opt${i === active ? ' is-active' : ''}`}
              // **mousedown で拾う。** click だと外側の pointerdown が先に走って閉じてしまう
              onMouseDown={(e) => { e.preventDefault(); pick(i) }}
              onMouseEnter={() => setActive(i)}
            >
              <span>{o.label}</span>
              {o.count !== undefined ? <em>{o.count}</em> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
