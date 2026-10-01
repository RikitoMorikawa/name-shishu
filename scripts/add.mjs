#!/usr/bin/env node
// 掲載 DB に店を足す。hp/001 の places.mjs が出す「追記用」の JSON をそのまま渡せる。
//
//   node scripts/add.mjs --json <path> --dry-run   # 足す行と、既にある行を見るだけ
//   node scripts/add.mjs --json <path>             # 足す
//
// 1行の形：{ name, area, site_url, tel, place_id?, kind? }（places.mjs の出力に place_id を足したもの）
// kind は 'kakou'（刺繍の加工屋・既定）か 'shop'（名入れの販売店）。2026-10-01 に足した
//
// **精査を済ませてから渡す。** Places の結果には手芸店・教室・チェーンが混ざる。
// 刺繍・名入れを請ける加工屋かどうかは、サイトを読んで人が決める（hp/001 の .claude/docs/sales.md）。
//
// area（Places の住所）と tel は hint_addr / hint_tel に入れる。**サイトには出さない。**
// 足したら `node scripts/verify.mjs --apply` で公式サイトの住所を取り直す。取れたら hint は消える。
//
// 営業台帳（hp/001 の prospects）とは別物で、ここに足しても営業の対象にはならない。
// 2つは place_id でつながるだけ。
import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { db } from '../db/client.mjs'
import { prefOf } from './address.mjs'
import { makeSlug } from './slug.mjs'

const { values: opts } = parseArgs({
  options: { json: { type: 'string' }, 'dry-run': { type: 'boolean', default: false } },
})
if (!opts.json) {
  console.error('--json <path> を渡してください。')
  process.exit(1)
}
const input = JSON.parse(readFileSync(opts.json, 'utf8'))

const norm = (s) =>
  String(s).normalize('NFKC').replace(/[\s()（）【】「」・･]/g, '')
    .replace(/株式会社|有限会社|合同会社|\(株\)|\(有\)/g, '').toLowerCase()

const client = db()
const have = (await client.execute('SELECT slug, place_id, name FROM listings')).rows
const havePid = new Set(have.map((r) => r.place_id).filter(Boolean))
const haveName = new Set(have.map((r) => norm(r.name)))
const haveSlug = new Set(have.map((r) => String(r.slug)))

const add = [], skip = []
for (const x of input) {
  const prefFull = prefOf(x.area)
  const pref = prefFull ? prefFull.replace(/[都府県]$/, '') : null
  const why =
    !x.site_url ? 'サイトが無い' :
    !pref ? '住所から都道府県が取れない' :
    (x.place_id && havePid.has(x.place_id)) ? '既にある（place_id）' :
    haveName.has(norm(x.name)) ? '既にある（社名）' : null
  if (why) { skip.push(`${x.name}（${why}）`); continue }
  const slug = makeSlug(x.name, pref)
  if (haveSlug.has(slug)) { skip.push(`${x.name}（slug ${slug} が衝突。slug.mjs の桁を伸ばす）`); continue }
  haveSlug.add(slug); haveName.add(norm(x.name)); if (x.place_id) havePid.add(x.place_id)
  const kind = x.kind === 'shop' ? 'shop' : 'kakou'
  add.push({ slug, kind, place_id: x.place_id ?? null, name: x.name, pref, url: x.site_url.replace(/\?utm_[^#]*$/, ''), hint_addr: x.area ?? null, hint_tel: x.tel ?? null })
}

console.log(`${opts['dry-run'] ? '[dry-run] ' : ''}足す ${add.length}件 / 足さない ${skip.length}件`)
for (const a of add) console.log(`  + ${a.slug}  ${a.kind === 'shop' ? '［販売店］' : ''}${a.name}`)
for (const s of skip) console.log(`  - ${s}`)

if (!opts['dry-run'] && add.length) {
  await client.batch(
    add.map((a) => ({
      sql: `INSERT INTO listings (slug, kind, place_id, name, pref, url, hint_addr, hint_tel) VALUES (?,?,?,?,?,?,?,?)`,
      args: [a.slug, a.kind, a.place_id, a.name, a.pref, a.url, a.hint_addr, a.hint_tel],
    })),
    'write',
  )
  console.log(`\n${add.length}件を足しました。次は node scripts/verify.mjs --apply と node scripts/scan-terms.mjs。`)
}
