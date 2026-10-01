import raw from '@/data/listings.json'
import photosRaw from '@/data/photos.json'
import plansRaw from '@/data/plans.json'
import fs from 'node:fs'
import path from 'node:path'

export type Listing = {
  slug: string
  /** **加工屋か販売店か**（2026-10-01）。読む人は1種類だが出口が2つある ― 服を持っている→加工屋／服から買う→販売店 */
  kind: Kind
  name: string
  pref: string | null
  prefSlug: string | null
  city: string | null
  /** **公式サイトで取れた住所だけ。** Places 由来の住所は載せない（規約にキャッシュの例外が無い） */
  address: string | null
  /** site-only＝台帳に照合先が無く、公式サイトの住所をそのまま採った（2026-09-27） */
  addrState: 'verified' | 'city-only' | 'site-only' | 'unverified' | null
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
  /** 刺繍を入れる対象。**一覧の絞り込み軸。** サイトに2回以上出た品目だけ拾っている */
  items: ItemKey[]
  // **各社ページにだけ出す3つ。比較行には出さない**（横に並べられるのは4〜5列が限界で、
  // 増やすと「確認中」だらけになって比較表として読めなくなる）
  /** 郵送で頼めるか。**地域から探す媒体だが、郵送可なら全国の店が選択肢になる** */
  shipping: boolean | null
  /** 型代・データ代。**料金の実態はここで決まる**（既製書体は0円、ロゴは3,000〜5,000円） */
  dataFee: string | null
  /** 受けられない素材・品物。**持ち込みを断られる最大の理由**（革・撥水・キャップのツバなど） */
  ngMaterial: string | null
  note: string | null
  /** **有料掲載の中身。無料の店は null。** data/plans.json から載せる（2026-09-28） */
  pr: Pr | null
}

/**
 * **有料掲載で載せるもの。** 2プラン（2026-09-30）：
 *   basic＝基本掲載 年6,000円。**掲載のご依頼を受けて載せた店**。中身は基本情報だけで、社名横と一覧に「PR」が付く
 *   full ＝充実掲載 年9,800円。写真・紹介文と、市区・県ページの PR 枠（料金表は 2026-10-01 に外した。prices は残すが画面に出さない）
 * **こちらが自主的に載せた店は無料**（plans に行が無い）。
 * 線引きは「事実は無料・見せ方は有料」。持ち込み・納期などの事実は無料の側で、ここには入れない。
 * **掲載の順番には一切効かせない**（利用規約と ABOUT で「順番は料金によって変わらない」と約束している）。
 */
export type Pr = {
  /** basic＝基本掲載 年6,000円（依頼を受けて載せた店・基本情報だけ）／full＝充実掲載 年9,800円（2026-09-30） */
  kind: 'basic' | 'full'
  since: string
  /** 掲載期限（請求した期間の最終日）。過ぎた行はビルド時に外れる */
  until: string
  intro: string | null
  prices: { item: string; price: string }[]
  photos: { src: string; alt: string }[]
  credit: string | null
}

export type Kind = 'kakou' | 'shop'
/** 種別の呼び名。一覧の印・各社ページ・絞り込みで同じ語を使う */
export const KIND_LABEL: Record<Kind, string> = { kakou: '刺繍の加工屋', shop: '名入れの販売店' }
/** 種別の言い換え。**読む人の状況で書く**（業者の分類語では自分がどちらか分からない） */
export const KIND_HINT: Record<Kind, string> = {
  kakou: '服を持ち込んで、刺繍・名入れだけ頼む',
  shop: '服を選んで、名入れ・刺繍まで込みで注文する',
}

/**
 * 絞り込みの「探し方」。**加工屋／販売店の語ではなく、読む人の手元の状態で選ばせる。**
 * サイドバーの先頭に置く（ここで行く先が2つに分かれるので、品目より先に決める）
 */
export const kindFacet = (items: { kind: Kind }[]) => ({
  key: 'kind',
  label: '探し方',
  options: [
    { value: 'kakou', label: '服を持っている → 刺繍の加工屋', count: items.filter((l) => l.kind === 'kakou').length },
    { value: 'shop', label: '服から買う → 名入れの販売店', count: items.filter((l) => l.kind === 'shop').length },
  ],
})

const data = raw as { updatedAt: string; listings: Listing[] }

// 写真は listings.json とは別に持つ。あちらは DB から毎回作り直されるので、
// 手で足した写真が消えてしまう（2026-09-17）。掲載先から提供されたものだけを載せる。
const photos = photosRaw as Record<string, { src: string; credit: string } | unknown>

export const updatedAt = data.updatedAt
/**
 * 市区名の頭に県コードが残っている行がある（「11さいたま市」）。**正は scripts/export.mjs
 * （掲載 DB から書き出す）** だが、書き出し直すまで画面に出てしまうのでここでも落とす。
 */
const cleanCity = (city: string | null) => (city ? city.replace(/^\d{1,2}(?=[^\d])/, '') : city)

// 有料掲載。**期限はビルドした日で判定する**（静的書き出しなので、期限切れを外すには再ビルドが要る）
const plans = plansRaw as Record<string, unknown>
const today = new Date().toISOString().slice(0, 10)
function planOf(slug: string): Pr | null {
  const p = plans[slug] as Partial<Pr> | undefined
  if (!p || typeof p !== 'object' || !p.until || p.until < today) return null
  return {
    kind: p.kind === 'basic' ? 'basic' : 'full',
    since: p.since ?? '',
    until: p.until,
    intro: p.intro ?? null,
    prices: Array.isArray(p.prices) ? p.prices : [],
    // **実物が public/ に無い写真は外す**（書き間違いで壊れた画像を出さない）
    photos: (Array.isArray(p.photos) ? p.photos : []).filter((ph) =>
      fs.existsSync(path.join(process.cwd(), 'public', String(ph.src).replace(/^\//, ''))),
    ),
    credit: p.credit ?? null,
  }
}

/**
 * **依頼で載せた店（基本掲載の履歴がある店）は、有料の期限が切れたら出さない**（2026-09-30）。
 * 無料で残すと更新する理由が無くなる。こちらが自主的に載せた店は plans に basic の行が無いので対象外
 */
const lapsed = (slug: string) => {
  const p = plans[slug] as { paidOnly?: boolean } | undefined
  return !!p?.paidOnly && !planOf(slug)
}

export const listings: Listing[] = data.listings.filter((l) => !lapsed(l.slug)).map((l) => {
  const p = photos[l.slug]
  const pr = planOf(l.slug)
  const base = { ...l, kind: (l.kind === 'shop' ? 'shop' : 'kakou') as Kind, city: cleanCity(l.city), pr }
  // 写真は有料掲載の1枚目を優先する。photos.json は 9/28 以前の差し替え口として残してある
  if (pr?.photos[0]) return { ...base, photo: pr.photos[0].src, photoCredit: pr.credit }
  return p && typeof p === 'object' && 'src' in p
    ? { ...base, photo: (p as { src: string }).src, photoCredit: (p as { credit?: string }).credit ?? null }
    : base
})

/** その地域の充実掲載の店。**一覧とは別の PR 枠に出す**（一覧の順番は変えない）。基本掲載は枠に出さない */
export const prOf = (items: Listing[]) =>
  items.filter((l) => l.pr?.kind === 'full').sort((a, b) => a.name.localeCompare(b.name, 'ja'))

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
 * 都道府県の並び。**東京を先頭に、あとは掲載件数の多い順。**
 * 件数だけで並べると大阪が先に来るが、刺繍・名入れを探す人がいちばん多いのは東京。
 * ヒーローの選択肢・エリアのタイル・一覧の並びが、すべてこの順に従う。
 */
const PREF_HEAD = ['tokyo']
const prefRank = (slug: string) => {
  const i = PREF_HEAD.indexOf(slug)
  return i < 0 ? PREF_HEAD.length : i
}

/** 都道府県ごと。pref が無い行は地域ページに出せないので除く。 */
export function byPref() {
  const map = new Map<string, { pref: string; prefSlug: string; items: Listing[] }>()
  for (const l of listings) {
    if (!l.pref || !l.prefSlug) continue
    const cur = map.get(l.prefSlug) ?? { pref: l.pref, prefSlug: l.prefSlug, items: [] }
    cur.items.push(l)
    map.set(l.prefSlug, cur)
  }
  return [...map.values()].sort(
    (a, b) => prefRank(a.prefSlug) - prefRank(b.prefSlug) || b.items.length - a.items.length,
  )
}

export function findPref(prefSlug: string) {
  return byPref().find((p) => p.prefSlug === prefSlug) ?? null
}

export function findListing(slug: string) {
  return listings.find((l) => l.slug === slug) ?? null
}

/**
 * 市区が取れない行のまとまり。**「その他」ではなく、公式サイトで住所を確かめられていない店。**
 * 市区は確認できた住所からしか取らない（Places の住所は載せられない）ので、住所が無ければ市区も無い。
 * 「市区を確認中」だと市区という区分があるように読めた（2026-10-01）
 */
export const NO_CITY = '住所を確認中'

/** 市区町村ごとにまとめる。**住所を確認中の店は件数に関わらず最後**（大阪では10件で先頭に来ていた） */
export function byCity(items: Listing[]) {
  const map = new Map<string, Listing[]>()
  for (const l of items) {
    const key = l.city ?? NO_CITY
    map.set(key, [...(map.get(key) ?? []), l])
  }
  // 市区の中も「写真 > 地図 > 頭文字」で揃える（byRichness は下で定義している）
  return [...map.entries()]
    .map(([city, xs]) => [city, byRichness(xs)] as [string, Listing[]])
    .sort((a, b) => Number(a[0] === NO_CITY) - Number(b[0] === NO_CITY) || b[1].length - a[1].length)
}

/**
 * 市区町村のページを作る最小件数。**「刺繍 足立区」のような検索の受け口**（2026-09-27）。
 * 1件だけの市区はページにしない ― 店ページと中身が同じで、薄いページとして扱われる。
 * 1件の市区は店ページの題名（「〇〇（東京都・足立区）の…」）が受ける。
 */
export const CITY_PAGE_MIN = 2

/** URL に使う市区名。**日本語のまま**（検索語が URL にも入る。ローマ字の対応表を持たずに済む） */
export const citySlug = (city: string) => city

/** 市区町村ページを持つ市区の一覧（県の並び → 件数の多い順） */
export function cityPages() {
  return byPref().flatMap((p) =>
    byCity(p.items)
      .filter(([city, items]) => city !== NO_CITY && items.length >= CITY_PAGE_MIN)
      .map(([city, items]) => ({ pref: p.pref, prefSlug: p.prefSlug, city, items })),
  )
}

export function findCity(prefSlug: string, city: string) {
  return cityPages().find((c) => c.prefSlug === prefSlug && c.city === city) ?? null
}

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

/** 品目ごとの件数 */
export function itemCounts(items: Listing[]) {
  const n = {} as Record<ItemKey, number>
  for (const k of ITEM_ORDER) n[k] = 0
  for (const l of items) for (const k of l.items) if (k in n) n[k]++
  return n
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

/**
 * 行の見え方の順位。**地図が出る > 頭文字だけ。**
 * 空っぽの枠が先頭に並ぶと、一覧全体が用意できていないように見える。
 * 地図は住所が取れている行にだけ出る（ShopCard の判定と揃えてある）。
 * **写真では並べ替えない**（2026-09-28）。写真は有料掲載の中身なので、写真で上に来ると
 * 「掲載の順番は料金によって変わらない」という約束が崩れる。住所は無料の事実なので効かせてよい。
 */
const richness = (l: Listing) => (l.address ? 1 : 0)

/** 同じ見え方どうしは社名順。**並びが日によって変わらないようにする** */
export function byRichness(items: Listing[]) {
  return [...items].sort((a, b) => richness(b) - richness(a) || a.name.localeCompare(b.name, 'ja'))
}

/** 全国一覧の並び。**都道府県の順を保ったまま、県の中で見え方の順に並べる。** */
export function listingsByPrefSize() {
  const order = new Map(byPref().map((p, i) => [p.prefSlug, i]))
  return [...listings].sort((a, b) => {
    const d = (order.get(a.prefSlug ?? '') ?? 99) - (order.get(b.prefSlug ?? '') ?? 99)
    return d !== 0 ? d : richness(b) - richness(a) || a.name.localeCompare(b.name, 'ja')
  })
}

/**
 * 写真の枠を出すか。**1枚も提供されていない間は枠ごと出さない。**
 * 頭文字だけの枠は面積を食うわりに情報がなく、1画面に入る件数が半分になる。
 * 掲載先から1枚でも届けば自動で枠が戻る（無い社は頭文字で埋まる）。
 */
export const hasAnyPhoto = listings.some((l) => !!l.photo)

/** ヒーローの検索に渡す、県ごとの市区一覧（件数の多い順） */
export function prefOptions() {
  return byPref().map((p) => ({
    slug: p.prefSlug,
    label: prefLabel(p.pref),
    count: p.items.length,
    cities: byCity(p.items).map(([c]) => c).filter((c) => c !== NO_CITY),
  }))
}


/**
 * 読み物に載せる数字。**掲載データから毎回数え直す。**
 * 記事に書き置くと、掲載が増えたときに古い数字が残る（誰も気づかない）。
 * ここに無い事実は記事に書かない ― この媒体が確かめた範囲を超えないため。
 */
export function guideStats() {
  const n = (f: (l: Listing) => boolean) => listings.filter(f).length
  // 「1枚から」「1個から」「1点から」はどれも1点から受けるという意味
  const fromOne = (l: Listing) => !!l.minLot && /^1[枚個点]/.test(l.minLot)
  const counts = itemCounts(listings)
  return {
    total: listings.length,
    prefs: byPref().length,
    mochikomiYes: n((l) => l.mochikomi === true),
    mochikomiNo: n((l) => l.mochikomi === false),
    mochikomiUnknown: n((l) => l.mochikomi === null || l.mochikomi === undefined),
    minLotKnown: n((l) => !!l.minLot),
    minLotOne: n(fromOne),
    leadKnown: n((l) => !!l.lead),
    priceKnown: n((l) => !!l.priceFrom),
    itemWear: counts.wear,
    itemCap: counts.cap,
    itemTowel: counts.towel,
    itemBag: counts.bag,
    itemWappen: counts.wappen,
    itemFlag: counts.flag,
  }
}

/** 記事の本文に書いた `{{total}}` のような印を、いまの数字に置き換える */
export function fillStats(text: string) {
  const s = guideStats() as Record<string, number>
  return text.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in s ? String(s[k]) : m))
}
