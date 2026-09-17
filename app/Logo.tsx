/** 針と糸。**刺繍そのものではなく「通す」動きを線1本で出す。**
 *  currentColor で塗るので、ヘッダーでもフッターでも色が揃う。 */
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg viewBox="0 0 28 28" width={size} height={size} aria-hidden focusable="false" className="logo-mark">
      {/* 針 */}
      <path d="M20.5 5.2 9.6 16.1l-1.4 3.7 3.7-1.4L22.8 7.5a1.6 1.6 0 0 0-2.3-2.3Z"
        fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      {/* 針穴 */}
      <circle cx="21.6" cy="6.4" r="1" fill="currentColor" />
      {/* 糸 */}
      <path d="M6.5 22.2c2.4 0 2.4-2.6 4.8-2.6s2.4 2.6 4.8 2.6 2.4-2.6 4.8-2.6"
        fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity=".55" />
    </svg>
  )
}
