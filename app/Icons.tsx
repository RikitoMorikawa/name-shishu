/**
 * アイコン一式。**絵文字は使わない** ― OS とブラウザで見た目が変わり、統一感が崩れる。
 * すべて 24x24 の線画で、currentColor で塗る。太さは 1.7 で揃える。
 */
type P = { size?: number; className?: string }
const base = (size: number, className?: string) => ({
  viewBox: '0 0 24 24',
  width: size,
  height: size,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: 'false' as const,
  className,
})

/** 加工屋。ミシンの針と押さえ */
export const IconKakou = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M4 5h9a4 4 0 0 1 4 4v3" />
    <path d="M17 12v4" />
    <path d="M14 19h6" />
    <path d="M7 5v6" />
    <path d="M4.5 16.5h5" />
  </svg>
)

/** 作業服の店。ハンガーに掛かった服 */
export const IconShop = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M12 6.5a1.6 1.6 0 1 1 1.6-1.6" />
    <path d="M12 6.5 4.5 12v1.5h15V12L12 6.5Z" />
    <path d="M6 13.5V19h12v-5.5" />
  </svg>
)

/** 持ち込み。手に提げた袋 */
export const IconBring = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M6 8h12l-1 11H7L6 8Z" />
    <path d="M9.5 8V6a2.5 2.5 0 0 1 5 0v2" />
  </svg>
)

/** 枚数。重なった布 */
export const IconLot = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M4 8.5 12 5l8 3.5-8 3.5-8-3.5Z" />
    <path d="m4 13 8 3.5L20 13" />
    <path d="m4 17 8 3.5L20 17" />
  </svg>
)

/** 納期。時計 */
export const IconClock = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 7.5V12l3 1.8" />
  </svg>
)

/** 料金。円 */
export const IconYen = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}>
    <path d="m7 5 5 6.5L17 5" />
    <path d="M12 11.5V19" />
    <path d="M8 13.5h8" />
    <path d="M8 16.5h8" />
  </svg>
)

/** 場所 */
export const IconPin = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.4" />
  </svg>
)

/** 電話 */
export const IconTel = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M8 3.5 10.2 8 8 10.2a11.5 11.5 0 0 0 5.8 5.8L16 13.8 20.5 16v3.2c0 .9-.7 1.6-1.6 1.5C10.6 20.2 3.8 13.4 3.3 5.1A1.5 1.5 0 0 1 4.8 3.5H8Z" />
  </svg>
)

/** 読み物 */
export const IconGuide = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M5 4.5h9l5 5V19a.5.5 0 0 1-.5.5h-13A.5.5 0 0 1 5 19V4.5Z" />
    <path d="M13.5 4.5V10H19" />
    <path d="M8.5 13.5h7M8.5 16.5h5" />
  </svg>
)

/** 探す */
export const IconSearch = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </svg>
)

/** 地域 */
export const IconMap = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}>
    <path d="m4 6.5 5-2 6 2.5 5-2v13l-5 2-6-2.5-5 2v-13Z" />
    <path d="M9 4.5v13M15 7v13" />
  </svg>
)
