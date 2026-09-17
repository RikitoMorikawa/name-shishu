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

/** 帽子。キャップ */
export const IconCap = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M4.5 15a7.5 7.5 0 0 1 15 0" />
    <path d="M3 15h18a1 1 0 0 1 0 3H3a1 1 0 0 1 0-3Z" />
    <path d="M12 7.5V15" />
  </svg>
)


/** お気に入り。**塗りは filled で切り替える**（線画のままだと押した実感が出ない） */
export const IconHeart = ({ size = 24, className, filled = false }: P & { filled?: boolean }) => (
  <svg {...base(size, className)} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 20s-7.5-4.7-7.5-10a4.2 4.2 0 0 1 7.5-2.6A4.2 4.2 0 0 1 19.5 10c0 5.3-7.5 10-7.5 10Z" />
  </svg>
)

/** メニュー */
export const IconMenu = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
)

/** 閉じる */
export const IconClose = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
)

/** 服。Tシャツ ― 品目の軸の先頭 */
export const IconTee = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M9 4 4 6.5l1.6 4L8 9.8V20h8V9.8l2.4.7 1.6-4L15 4a3 3 0 0 1-6 0Z" />
  </svg>
)

/** タオル。畳んだ布の重なり */
export const IconTowel = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M5 5.5h11a3 3 0 0 1 3 3v10H8a3 3 0 0 1-3-3v-10Z" />
    <path d="M16 5.5a3 3 0 0 0-3 3v10" />
  </svg>
)

/** バッグ・小物。トートバッグ */
export const IconBag = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M5.5 8h13l-1 11.5h-11L5.5 8Z" />
    <path d="M9 8V6.2a3 3 0 0 1 6 0V8" />
  </svg>
)

/** ワッペン。縁のある盾形 */
export const IconWappen = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M12 3.5 19 6v6.5c0 4-3 6.6-7 8-4-1.4-7-4-7-8V6l7-2.5Z" />
    <path d="M9.5 11.8 11.3 14l3.4-3.8" />
  </svg>
)

/** のれん・旗 */
export const IconFlag = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M6 21V4" />
    <path d="M6 5h12l-2.4 3.7L18 12.5H6" />
  </svg>
)

/** 悩みの吹き出し。相談者の枠に添える */
export const IconAsk = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M4.5 6.5h15v9h-8.5L7 19v-3.5H4.5v-9Z" />
    <path d="M9.9 9.6a2.1 2.1 0 1 1 2.6 2.1v1" />
    <path d="M12.5 14.2v.01" />
  </svg>
)

/** 針と糸。**この媒体の印。** 写真が入るまでの枠に置く */
export const IconThread = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M17.5 3.5 9 12l-1.2 4.2L12 15l8.5-8.5-3-3Z" />
    <path d="M6.5 16.5c-3 1.6-3.4 4-1.5 4 1.6 0 1.6-2.3 0-2.6-2-.4-3 1-3 2.6" />
  </svg>
)

/** 進む */
export const IconArrow = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M5 12h13" />
    <path d="m13 6.5 5.5 5.5L13 17.5" />
  </svg>
)

/** 確認済み */
export const IconCheck = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
)
