/**
 * **ブラウザ側からも読む表示用の定数。** lib/listings.ts は fs とデータ本体を読むので
 * クライアントに混ぜられない。カードを後から描く（`/rows.json` → Filter）ときに要る分だけここに置く。
 */

export type Kind = 'kakou' | 'shop'
/** 種別の呼び名。一覧の印・各社ページ・絞り込みで同じ語を使う */
export const KIND_LABEL: Record<Kind, string> = { kakou: '刺繍の加工屋', shop: '名入れの販売店' }

/** 刺繍を入れる対象。刺繍屋は服だけでなく帽子・タオル・カバンまで扱う ― そこが軸になる */
export type ItemKey = 'wear' | 'cap' | 'towel' | 'bag' | 'wappen' | 'flag'

export const ITEM_LABEL: Record<ItemKey, string> = {
  wear: '服',
  cap: '帽子',
  towel: 'タオル',
  bag: 'バッグ',
  wappen: 'ワッペン',
  flag: 'のれん・旗',
}
export const ITEM_ORDER: ItemKey[] = ['wear', 'cap', 'towel', 'bag', 'wappen', 'flag']

/**
 * 表示用の都道府県名。**データは「東京」までしか持っていない**（正は掲載 DB と
 * scripts/export.mjs 側）。検索は「東京都 刺繍」の形で来るので、画面には正式名で出す。
 * **slug は変えない** ― 配布済みの URL が変わる。
 */
export function prefLabel(pref: string) {
  if (pref === '北海道') return pref
  if (pref === '東京') return '東京都'
  if (pref === '大阪' || pref === '京都') return pref + '府'
  return pref + '県'
}

/**
 * トップの一覧で**最初の HTML に入れる件数**。残りは `/rows.json` に出し、
 * 「もっと見る」か絞り込みを押したときに取りに行く（2026-10-02）。
 * Filter の「もっと見る」1回分（PAGE）と揃える。
 */
export const FIRST = 20
