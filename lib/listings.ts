import raw from '@/data/listings.json'
import photosRaw from '@/data/photos.json'

export type Listing = {
  slug: string
  kind: 'kakou' | 'shop'   // 加工屋 / 作業服・ユニフォーム店
  name: string
  pref: string | null
  prefSlug: string | null
  city: string | null
  /** **公式サイトで取れた住所だけ。** Places 由来の住所は載せない（規約にキャッシュの例外が無い） */
  address: string | null
  addrState: 'verified' | 'city-only' | 'unverified' | null
  url: string
  tel: string | null
  /** 掲載先から提供してもらった写真だけ。各社サイトからの転載は著作権上できない。 */
  photo: string | null
  photoCredit: string | null
  // 取材で埋める。**ここが他所に無い情報で、この媒体の中身そのもの。**
  mochikomi: boolean | null
  minLot: string | null
  lead: string | null
  priceFrom: string | null
  items: string[]
  note: string | null
}

const data = raw as { updatedAt: string; listings: Listing[] }

// 写真は listings.json とは別に持つ。あちらは DB から毎回作り直されるので、
// 手で足した写真が消えてしまう（2026-09-17）。掲載先から提供されたものだけを載せる。
const photos = photosRaw as Record<string, { src: string; credit: string } | unknown>

export const updatedAt = data.updatedAt
export const listings: Listing[] = data.listings.map((l) => {
  const p = photos[l.slug]
  return p && typeof p === 'object' && 'src' in p
    ? { ...l, photo: (p as { src: string }).src, photoCredit: (p as { credit?: string }).credit ?? null }
    : l
})

/** 都道府県ごと。pref が無い行は地域ページに出せないので除く。 */
export function byPref() {
  const map = new Map<string, { pref: string; prefSlug: string; items: Listing[] }>()
  for (const l of listings) {
    if (!l.pref || !l.prefSlug) continue
    const cur = map.get(l.prefSlug) ?? { pref: l.pref, prefSlug: l.prefSlug, items: [] }
    cur.items.push(l)
    map.set(l.prefSlug, cur)
  }
  return [...map.values()].sort((a, b) => b.items.length - a.items.length)
}

export function findPref(prefSlug: string) {
  return byPref().find((p) => p.prefSlug === prefSlug) ?? null
}

export function findListing(slug: string) {
  return listings.find((l) => l.slug === slug) ?? null
}

/** 市区町村ごとにまとめる。市区が取れない行は「その他」に寄せる。 */
export function byCity(items: Listing[]) {
  const map = new Map<string, Listing[]>()
  for (const l of items) {
    const key = l.city ?? '市区を確認中'
    map.set(key, [...(map.get(key) ?? []), l])
  }
  return [...map.entries()].sort((a, b) => b[1].length - a[1].length)
}

export const KIND_LABEL: Record<Listing['kind'], string> = {
  kakou: '刺繍・名入れの加工屋',
  shop: '作業服・ユニフォームの店',
}

/** 同じ市区、無ければ同じ県から近い先を拾う。回遊のため。 */
export function nearby(l: Listing, n = 4) {
  const same = listings.filter((x) => x.slug !== l.slug)
  const inCity = l.city ? same.filter((x) => x.pref === l.pref && x.city === l.city) : []
  const inPref = same.filter((x) => x.pref === l.pref && !inCity.includes(x))
  return [...inCity, ...inPref].slice(0, n)
}

/** 市区名から見出しの id を作る（目次のアンカー用）。 */
export function cityId(city: string) {
  return 'c' + [...city].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 99991, 7).toString(36)
}

/**
 * **列は「埋まっている項目」で決める。**
 * 取材前に「確認中」を4列並べても比較にならないので、1件でも値がある項目だけ出す。
 * 種別と所在地は常に出す（いま確実にある情報で選べるようにするため）。
 */
export type Col = 'kind' | 'mochikomi' | 'minLot' | 'lead' | 'priceFrom'

export const COL_LABEL: Record<Col, string> = {
  kind: '種別', mochikomi: '持ち込み',
  minLot: '最小枚数', lead: '納期', priceFrom: '料金の目安',
}

export function activeCols(items: Listing[]): Col[] {
  const has = (f: (l: Listing) => unknown) => items.some((l) => f(l) !== null && f(l) !== undefined)
  const cols: Col[] = ['kind']
  if (has((l) => l.mochikomi)) cols.push('mochikomi')
  if (has((l) => l.minLot)) cols.push('minLot')
  if (has((l) => l.lead)) cols.push('lead')
  if (has((l) => l.priceFrom)) cols.push('priceFrom')
  return cols
}

/** 全国一覧の並び。**件数の多い都道府県から**（県コード順だと兵庫始まりで不自然）。 */
export function listingsByPrefSize() {
  const order = new Map(byPref().map((p, i) => [p.prefSlug, i]))
  return [...listings].sort((a, b) => {
    const d = (order.get(a.prefSlug ?? '') ?? 99) - (order.get(b.prefSlug ?? '') ?? 99)
    return d !== 0 ? d : a.name.localeCompare(b.name, 'ja')
  })
}

