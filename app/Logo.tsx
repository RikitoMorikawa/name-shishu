/** Tシャツに針を通す形。**業種（着るもの）と行為（刺す）を1つに。** currentColor で塗る */
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden focusable="false" className="logo-mark">
      <path
        d="M12 5.5 7 7.8v4.4l2.6-.9V26h12.8V11.3l2.6.9V7.8L20 5.5a4 4 0 0 1-8 0Z"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"
      />
      <path d="M13 19.5h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".5" />
    </svg>
  )
}
