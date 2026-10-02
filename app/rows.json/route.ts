import { listingsByPrefSize } from '@/lib/listings'
import { FIRST } from '@/lib/labels'

/**
 * トップの一覧の **21件目以降**。トップの HTML には先頭 FIRST 件だけ描き、残りは
 * 「もっと見る」か絞り込みを押したときに Filter がここを取りに来る（2026-10-02）。
 * 全件を HTML に入れていた頃はトップが 2.7MB あり、スマホで表示が遅かった。
 * **クローラーには都道府県ページ（`/[pref]/`）が全件を描いて見せている。**
 */
export const dynamic = 'force-static'

export function GET() {
  return Response.json(listingsByPrefSize().slice(FIRST))
}
