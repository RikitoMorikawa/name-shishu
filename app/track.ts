/**
 * 店に向けたクリックを UMIDAS の管理画面（hp-001 の /api/out）へ送る（2026-10-03）。
 * **媒体の画面には出さない。** 掲載営業で「御社の公式サイトへ N 回送った」と言うための数字。
 *
 * - 送るのは slug・種類・ページのパス・スマホかどうかだけ。Cookie も IP も持たない
 * - sendBeacon は text/plain で送る（application/json だとプリフライトが要り、ページを離れる瞬間に落ちる）
 * - **本番のドメインでだけ送る**（開発中のクリックで数字を汚さない）
 */
export type Ev = 'official' | 'tel' | 'map' | 'pr' | 'fav'

const ENDPOINT = 'https://hp-001.vercel.app/api/out/'  // **末尾のスラッシュが要る**（hp-001 は trailingSlash で、無いと 308 になる）

export function track(ev: Ev, slug: string) {
  try {
    if (location.hostname !== 'name-shishu.com') return
    const device = matchMedia('(pointer: coarse)').matches ? 'mobile' : 'pc'
    const body = JSON.stringify({ ev, slug, page: location.pathname, device })
    navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: 'text/plain' }))
  } catch {
    /* 計測が落ちても画面は止めない */
  }
}
