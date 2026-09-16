import raw from '@/data/listings.json'

export type Listing = {
  slug: string
  kind: 'kakou' | 'shop'   // 加工屋 / 作業服・ユニフォーム店
  name: string
  pref: string | null
  prefSlug: string | null
  city: string | null
  address: string | null
  url: string
  tel: string | null
  // 取材で埋める。**ここが他所に無い情報で、この媒体の中身そのもの。**
  mochikomi: boolean | null
  minLot: string | null
  lead: string | null
  priceFrom: string | null
  items: string[]
  note: string | null
}

const data = raw as { updatedAt: string; listings: Listing[] }

export const updatedAt = data.updatedAt
export const listings = data.listings

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
    const key = l.city ?? 'その他'
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

