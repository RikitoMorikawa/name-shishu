#!/usr/bin/env node
// **中身が変わったページだけ**を IndexNow で Bing などへ知らせる（2026-09-29）。
//
//   node scripts/indexnow.mjs            # 送る URL を数えるだけ
//   node scripts/indexnow.mjs --send     # 送る（送ったら .indexnow-state.json を更新する）
//   node scripts/indexnow.mjs --send --all   # 変わっていなくても全部送る（普段は使わない）
//
// **順番は build → push → デプロイ完了 → これ。** 送った URL を Bing がすぐ取りに来るので、
// 本番がまだ古い版だと古い中身を読まれる。送る前に鍵ファイルが本番で開けるかも確かめる。
//
// なぜ IndexNow か：Google の URL 検査は1日10件だが、IndexNow は上限が実質無い。
// Bing は ChatGPT と Copilot が引くインデックスなので、AIO を売り物にしている以上ここを速く埋めたい。
// **Google は IndexNow を使わない**ので、Google は今までどおりサイトマップと URL 検査。
//
// 「変わった」の判定：out/ の各ページの**本文**（script・style・タグを落とした文字）のハッシュを
// 前回送ったときと比べる。ビルドのたびに変わる JS のファイル名で全ページ送り直さないため。
// 変わっていないのに毎回全部送ると、Bing から見て信用の低い送り方になる。
//
// 鍵は public/<key>.txt。**秘密ではない**（誰でも読める場所に置くことで、このドメインの持ち主だと示す仕組み）。
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import dns from 'node:dns'

dns.setDefaultResultOrder('ipv4first')

const ROOT = join(import.meta.dirname, '..')
const HOST = 'name-shishu.com'
const STATE = join(ROOT, '.indexnow-state.json')
const { values: opts } = parseArgs({
  options: { send: { type: 'boolean', default: false }, all: { type: 'boolean', default: false } },
})

const keyFile = readdirSync(join(ROOT, 'public')).find((f) => /^[0-9a-f]{32}\.txt$/.test(f))
if (!keyFile) {
  console.error('public/ に鍵ファイル（32桁の16進.txt）がありません。')
  process.exit(1)
}
const key = readFileSync(join(ROOT, 'public', keyFile), 'utf8').trim()
const keyLocation = `https://${HOST}/${keyFile}`

const sitemap = join(ROOT, 'out', 'sitemap.xml')
if (!existsSync(sitemap)) {
  console.error('out/sitemap.xml がありません。先に npm run build を流してください。')
  process.exit(1)
}
const urls = [...readFileSync(sitemap, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])

/** 本文のハッシュ。ビルドごとに変わる JS・CSS のファイル名や埋め込みデータは落とす */
function bodyHash(url) {
  const path = decodeURIComponent(new URL(url).pathname)
  const file = join(ROOT, 'out', path, 'index.html')
  if (!existsSync(file)) return null
  const text = readFileSync(file, 'utf8')
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<link[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
  return createHash('sha256').update(text).digest('hex').slice(0, 16)
}

const prev = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : {}
const now = {}
const changed = []
for (const u of urls) {
  const h = bodyHash(u)
  if (!h) continue
  now[u] = h
  if (opts.all || prev[u] !== h) changed.push(u)
}
const gone = Object.keys(prev).filter((u) => !(u in now))

console.log(`サイトマップ ${urls.length} URL ／ 送る ${changed.length}（新規 ${changed.filter((u) => !(u in prev)).length}・本文が変わった ${changed.filter((u) => u in prev).length}）`)
// 消えたページも知らせる（Bing が 404 を取りに来て外す）
if (gone.length) console.log(`サイトマップから消えた ${gone.length}（これも送る）`)

if (!opts.send) {
  console.log('\n--send を付けると送ります（build → push → デプロイ完了のあとに）。')
  process.exit(0)
}
const list = [...changed, ...gone]
if (!list.length) {
  console.log('送るものはありません。')
  process.exit(0)
}

// 鍵ファイルが本番で開けないと 403 になる（デプロイ前に流したとき）
const live = await fetch(keyLocation, { signal: AbortSignal.timeout(15000) }).then((r) => (r.ok ? r.text() : null)).catch(() => null)
if (live?.trim() !== key) {
  console.error(`鍵ファイルが本番で開けません（${keyLocation}）。デプロイが終わってから流してください。`)
  process.exit(1)
}

// 1回の上限は 10,000 URL
for (let i = 0; i < list.length; i += 10000) {
  const urlList = list.slice(i, i + 10000)
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key, keyLocation, urlList }),
    signal: AbortSignal.timeout(30000),
  })
  // 200 = 受け付け／202 = 受け付けたが鍵の確認待ち。どちらも成功
  console.log(`IndexNow: HTTP ${res.status}（${urlList.length} URL）`)
  if (res.status !== 200 && res.status !== 202) {
    console.error(await res.text().catch(() => ''))
    console.error('送れなかったので .indexnow-state.json は更新しません。')
    process.exit(1)
  }
}
writeFileSync(STATE, JSON.stringify(now, null, 1))
console.log('.indexnow-state.json を更新しました（コミットしておく）。')
