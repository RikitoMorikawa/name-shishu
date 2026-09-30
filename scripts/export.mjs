#!/usr/bin/env node
// 掲載 DB から、サイトが読む JSON を書き出す。**ビルドの前に必ずこれを流す。**
//
//   node scripts/export.mjs          # 件数だけ見る
//   node scripts/export.mjs --write  # data/listings.json・plans.json・photos.json を書き出す
//
// サイト（app/）は DB に繋がず、この JSON だけを読んで静的に生成する。
// Vercel に接続情報を置かないので、本番の配信から DB に届く経路が無い。
//
// **hint_addr / hint_tel は書き出さない**（Places 由来。照合のためだけに一時的に持っている）。
// 列を足すときは、それがサイトに出てよいかを先に決める。
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { db, ROOT_DIR } from '../db/client.mjs'
import { cityOf } from './address.mjs'
import { PREF_ROMAJI } from './slug.mjs'

const { values: opts } = parseArgs({ options: { write: { type: 'boolean', default: false } } })

const bool = (v) => (v === null || v === undefined ? null : Number(v) === 1)
const str = (v) => (v ? String(v) : null)

const client = db()
const { rows } = await client.execute(`
  SELECT id, slug, name, pref, url, address, addr_state, tel, mochikomi, min_lot, lead_time, price_from,
         items, shipping, data_fee, ng_material, note
  FROM listings WHERE status = '掲載' ORDER BY pref, name`)

const listings = rows.map((r) => ({
  slug: String(r.slug),
  name: String(r.name),
  pref: String(r.pref),
  prefSlug: PREF_ROMAJI[r.pref] ?? null,
  // 市区も確認できた住所からだけ取る。住所を出していない先で市区だけ漏れないように
  city: cityOf(r.address),
  address: str(r.address),
  addrState: str(r.addr_state),
  url: String(r.url),
  tel: str(r.tel),
  // 一覧の写真は photos.json 側（掲載先から提供されたものだけ）
  photo: null,
  photoCredit: null,
  mochikomi: bool(r.mochikomi),
  minLot: str(r.min_lot),
  lead: str(r.lead_time),
  priceFrom: str(r.price_from),
  items: r.items ? JSON.parse(String(r.items)) : [],
  shipping: bool(r.shipping),
  dataFee: str(r.data_fee),
  ngMaterial: str(r.ng_material),
  note: str(r.note),
}))

const dup = listings.map((l) => l.slug).filter((s, i, a) => a.indexOf(s) !== i)
if (dup.length) {
  console.error(`slug が重複しています: ${[...new Set(dup)].join(', ')}`)
  process.exit(1)
}

// 有料掲載と写真。**slug をキーにした形はそのまま**（lib/listings.ts が読む形）
const slugById = Object.fromEntries(rows.map((r) => [Number(r.id), String(r.slug)]))
const planRows = (await client.execute(`SELECT * FROM plans ORDER BY since`)).rows
const photoRows = (await client.execute(`SELECT * FROM photos ORDER BY listing_id, sort, id`)).rows
const plans = {
  _readme: ['掲載 DB（plans・photos）から scripts/export.mjs が書き出す。**ここを手で直さない**（次の書き出しで消える）。'],
}
for (const p of planRows) {
  const slug = slugById[Number(p.listing_id)]
  if (!slug) continue
  plans[slug] = {
    kind: p.kind === 'basic' ? 'basic' : 'full',
    since: String(p.since),
    until: String(p.until),
    intro: str(p.intro),
    prices: p.prices ? JSON.parse(String(p.prices)) : [],
    photos: photoRows.filter((f) => Number(f.plan_id) === Number(p.id)).map((f) => ({ src: String(f.src), alt: String(f.alt ?? '') })),
    credit: str(p.credit),
  }
}
// **基本掲載の行が1つでもある店は「依頼で載せた店」。** 有料の期限が切れたら無料で残さず非掲載に戻す
// （2026-09-30・本人決定。残すと更新する理由が無くなる）。後から充実掲載に上げた店も同じ扱い。
// 判定はビルドした日（lib/listings.ts）。静的書き出しなので、外すには再ビルドが要る
for (const p of planRows) {
  const slug = slugById[Number(p.listing_id)]
  if (slug && p.kind === 'basic' && plans[slug]) plans[slug].paidOnly = true
}
const photos = { _readme: plans._readme }
for (const f of photoRows) {
  const slug = slugById[Number(f.listing_id)]
  if (!slug || f.plan_id !== null || photos[slug]) continue
  photos[slug] = { src: String(f.src), credit: String(f.credit ?? '') }
}

const byPref = {}
for (const l of listings) byPref[l.pref] = (byPref[l.pref] ?? 0) + 1
console.log(`掲載 ${listings.length}件・${Object.keys(byPref).length}都道府県 ／ 有料掲載 ${planRows.length}件 ／ 写真 ${photoRows.length}枚`)
console.log(Object.entries(byPref).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(' / '))

if (opts.write) {
  const out = (f, o) => writeFileSync(join(ROOT_DIR, 'data', f), JSON.stringify(o, null, 1))
  out('listings.json', { updatedAt: new Date().toISOString().slice(0, 10), listings })
  out('plans.json', plans)
  out('photos.json', photos)
  console.log('書き出し: data/listings.json・plans.json・photos.json')
} else {
  console.log('\n--write を付けると書き出します。')
}
