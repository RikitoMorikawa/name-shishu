/**
 * **地図ピンと足元の縫い目。** ファビコン（app/icon.svg）と同じ形（2026-10-01 に Tシャツから変更）。
 * 業種（縫う）と媒体の役目（地域から探す）を1つに。ピンは currentColor（テーマの緑）、縫い目は黄色
 */
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden focusable="false" className="logo-mark">
      <path
        fill="currentColor" fillRule="evenodd"
        d="M32 4c-10 0-17 7.2-17 16.6C15 32.6 32 50 32 50s17-17.4 17-29.4C49 11.2 42 4 32 4ZM32 13.5a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z"
      />
      <path d="M12 58h40" stroke="#f2b84b" strokeWidth="6" strokeLinecap="round" strokeDasharray="8 8" />
    </svg>
  )
}
