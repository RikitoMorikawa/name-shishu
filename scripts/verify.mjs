#!/usr/bin/env node
// 掲載する住所と電話を、**各社の公式サイトで裏取りする。**
//
//   node scripts/verify.mjs                # 未確認・取れずの行だけ
//   node scripts/verify.mjs --all          # 全件やり直す
//   node scripts/verify.mjs --only 刺繍館  # 社名で絞る
//   node scripts/verify.mjs --apply        # 確認できた値を DB に書き戻す
//   node scripts/verify.mjs --full         # 途中で切らずに全件出す（Places の住所と並べて目で確かめる）
//
// **なぜ要るか。** 新しい店の住所と電話は Google Places API から取っている（hint_addr / hint_tel）。
// Maps Platform の規約は place_id の無期限保存だけを認めていて、
// **社名・住所・電話・写真にはキャッシュの例外が無い**。内部の営業台帳なら問題は小さいが、
// **公開サイトに載せ続けるのは規約に触れる**（2026-09-16 に確認）。
// 同じ住所でも「その会社が自分のサイトに載せている住所」なら Places とは無関係になるので、
// 公式サイトから取り直して出典を移す。
//
// 取れなかった先は `addr_state='unverified'` のままにして、**サイトでは住所を出さない**。
// **取れた先は hint_addr / hint_tel を消す**（Places 由来を持ち続けない。2026-09-29 に掲載 DB へ移したとき）。
import { parseArgs } from 'node:util'
import { db } from '../db/client.mjs'
import { PREFS, cityOf, prefOf } from './address.mjs'

const { values: opts } = parseArgs({
  options: {
    all: { type: 'boolean', default: false },
    only: { type: 'string' },
    apply: { type: 'boolean', default: false },
    limit: { type: 'string' },
    full: { type: 'boolean', default: false },
  },
})

const UA = 'Mozilla/5.0 (compatible; name-shishu-verify/1.0)'
const UA_BROWSER =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const TIMEOUT = 15000
const CONCURRENCY = 5
const MAX_PAGES = 6

// 会社概要・アクセスを優先して辿る。住所と電話はそこにある
const WANTED = /company|about|profile|outline|gaiyou|kaisha|access|shop|store|contact|info|tenpo/i
const WANTED_JA = /会社概要|会社案内|企業情報|店舗|アクセス|所在地|お問い合わせ|問合せ|ご案内/


const dropNoise = (h) => h.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
// 実体参照とゼロ幅文字を戻してから空白を詰める。残すと「14&minus;6」「本町​2-10」のまま掲載される（2026-10-01）
const ENTITY = { nbsp: ' ', minus: '-', amp: '&', ndash: '-', mdash: '-', hyphen: '-', quot: '"', apos: "'", lt: '<', gt: '>' }
const toText = (h) =>
  dropNoise(h).replace(/<[^>]+>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITY[n.toLowerCase()] ?? m)
    .replace(/[​-‍⁠﻿]/g, '')
    .replace(/[\s　]+/g, ' ')
const zen2han = (s) =>
  s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
   .replace(/[−–—ー―]/g, '-')

/** 住所から数字だけを並べた鍵を作る。表記揺れ（丁目/-、全角/半角）を吸収して突き合わせる */
const numKey = (s) => (zen2han(s).match(/\d+/g) ?? []).join('-')

async function fetchText(url, ua = UA) {
  const res = await fetch(url, {
    headers: { 'User-Agent': ua },
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT),
  })
  if (!res.ok) {
    if ((res.status === 403 || res.status === 406) && ua === UA) return fetchText(url, UA_BROWSER)
    throw new Error(`HTTP ${res.status}`)
  }
  const ct = res.headers.get('content-type') || ''
  if (ct && !/text\/html|application\/xhtml/i.test(ct)) throw new Error(`HTML ではない`)
  const buf = new Uint8Array(await res.arrayBuffer())
  const head = new TextDecoder('latin1').decode(buf.subarray(0, 4096))
  const m = (ct.match(/charset=([\w-]+)/i) || head.match(/charset=["']?([\w-]+)/i) || [])[1]
  let enc = (m || 'utf-8').toLowerCase()
  if (enc === 'shift-jis' || enc === 'x-sjis' || enc === 'ms_kanji') enc = 'shift_jis'
  if (enc === 'euc_jp') enc = 'euc-jp'
  let html
  try { html = new TextDecoder(enc).decode(buf) } catch { html = new TextDecoder('utf-8').decode(buf) }
  return { html, finalUrl: res.url || url }
}

function pickLinks(html, base) {
  const out = []
  for (const m of dropNoise(html).matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = m[1].trim()
    const label = m[2].replace(/<[^>]+>/g, '').trim()
    if (/^(mailto|tel|javascript):/i.test(href)) continue
    let u
    try { u = new URL(href, base) } catch { continue }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') continue
    // www の有無は同じサイトとみなす（トップが www 無しへ転送する先で、会社概要を1つも辿れていなかった）
    const bare = (h) => h.replace(/^www\./, '')
    if (bare(u.host) !== bare(new URL(base).host)) continue
    if (WANTED.test(u.pathname) || WANTED_JA.test(label) || WANTED_JA.test(decodeURIComponent(u.pathname))) {
      out.push(u.href.split('#')[0])
    }
  }
  return [...new Set(out)]
}

/** ページから住所と電話の候補を拾う。JSON-LD があればそれを最優先する */
function extract(html) {
  const addrs = [], tels = []

  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (o) => {
        if (!o || typeof o !== 'object') return
        if (Array.isArray(o)) return o.forEach(walk)
        if (o.address && typeof o.address === 'object') {
          const a = o.address
          const s = [a.addressRegion, a.addressLocality, a.streetAddress].filter(Boolean).join('')
          if (s) addrs.push({ v: s, src: 'jsonld' })
        }
        if (typeof o.telephone === 'string') tels.push({ v: o.telephone, src: 'jsonld' })
        Object.values(o).forEach(walk)
      }
      walk(JSON.parse(m[1]))
    } catch { /* 壊れた JSON-LD は読み飛ばす */ }
  }

  const text = toText(html)
  // 〒つき、または都道府県から始まる住所
  for (const m of text.matchAll(new RegExp(`〒?\\s*\\d{3}[-−]?\\d{4}\\s*((?:${PREFS})[^ 　]{4,40})`, 'g'))) {
    addrs.push({ v: m[1], src: 'zip' })
  }
  for (const m of text.matchAll(new RegExp(`((?:${PREFS})[^ 　]{4,40})`, 'g'))) {
    if (/\d/.test(m[1])) addrs.push({ v: m[1], src: 'text' })
  }
  // tel: リンクと本文の電話番号
  for (const m of html.matchAll(/href=["']tel:([+\d\-()\s]{9,20})["']/gi)) {
    tels.push({ v: m[1].replace(/[^\d+]/g, ''), src: 'tel-link' })
  }
  for (const m of zen2han(text).matchAll(/0\d{1,4}-\d{1,4}-\d{3,4}/g)) {
    tels.push({ v: m[0], src: 'text' })
  }
  return { addrs, tels }
}

const client = db()
const where = ["status = '掲載'"]
const args = []
// **既定は未確認と取れずだけ。** 確認済みの行まで流すと、サイトが一時的に落ちていたとき空で上書きする
if (!opts.all && !opts.only) where.push("(addr_state IS NULL OR addr_state = 'unverified')")
if (opts.only) { where.push('name LIKE ?'); args.push(`%${opts.only}%`) }
// 照合に使う Places の住所・電話は hint_* にある。**area / tel / site_url の名前で受けて、下の判定はそのまま**
const { rows } = await client.execute({
  sql: `SELECT id, name, pref, hint_addr AS area, url AS site_url, hint_tel AS tel,
               address AS addr_verified, addr_state, tel AS tel_verified
        FROM listings WHERE ${where.join(' AND ')} ORDER BY pref, name` + (opts.limit ? ` LIMIT ${Number(opts.limit)}` : ''),
  args,
})

console.log(`${rows.length} 社を公式サイトで裏取りします（並列 ${CONCURRENCY}）\n`)

async function verify(row) {
  const out = { id: row.id, name: row.name, addr: null, tel: null, state: 'unverified', note: '' }
  const placesAddr = zen2han(String(row.area ?? '')).replace(/^\s*〒?\s*\d{3}\s*-?\s*\d{4}\s*/, '')
  const placesKey = numKey(placesAddr)
  const placesCity = cityOf(placesAddr)

  let pages = [row.site_url]
  const seen = new Set()
  const found = { addrs: [], tels: [] }

  for (let i = 0; i < pages.length && seen.size < MAX_PAGES; i++) {
    const url = pages[i]
    if (seen.has(url)) continue
    seen.add(url)
    let html
    let finalUrl = url
    try { ({ html, finalUrl } = await fetchText(url)) } catch (e) { out.note ||= String(e.message).slice(0, 40); continue }
    const got = extract(html)
    found.addrs.push(...got.addrs)
    found.tels.push(...got.tels)
    // リンクは転送後の URL を起点に解決する（http→https・www の付け外し）
    if (i === 0) pages.push(...pickLinks(html, finalUrl).slice(0, MAX_PAGES - 1))
    if (found.addrs.length && found.tels.length) break
  }

  // 住所：Places の番地と数字が一致するものを最優先。無ければ市区が一致するもの
  // **都道府県から始まる住所だけを使う。** JSON-LD に「中央区11丁目」のような欠けた住所が入っている先がある。
  // 後ろに電話番号や「(地図)」が続く先があるので、区切りで切る
  const rank = { zip: 0, jsonld: 1, text: 2 }
  const sorted = found.addrs
    .map((a) => ({ ...a, v: a.v.split(/[，,、(（]|TEL|Tel|電話/)[0] }))
    .filter((a) => prefOf(a.v) && a.v.startsWith(prefOf(a.v)))
    .sort((a, b) => rank[a.src] - rank[b.src])
  const byKey = sorted.find((a) => placesKey && numKey(a.v).includes(placesKey))
  const byCity = sorted.find((a) => placesCity && a.v.includes(placesCity))
  // Places と突き合わせられなくても、**公式サイトが自分で載せている住所なら出典として足りる**
  // （2026-09-27）。area が空・市区名だけの古い行はこれが無いと永久に埋まらない。
  // 取引先や配送先の住所を拾わないよう、都道府県が台帳と同じものだけにする
  // **台帳に市区があって食い違う先は採らない**（本社と工場が別の先で、持ち込み先でない住所を出すことになる）
  const samePref = placesCity
    ? null
    : sorted.find((a) => prefOf(a.v)?.startsWith(String(row.pref)) && cityOf(a.v))
  const hit = byKey ?? byCity ?? samePref ?? null
  if (hit) {
    out.addr = hit.v.replace(/\s+/g, '')
    out.state = byKey ? 'verified' : byCity ? 'city-only' : 'site-only'
    out.note = byKey ? `番地まで一致(${hit.src})` : byCity ? `市区まで一致(${hit.src})` : `サイトの住所(${hit.src})`
  } else if (found.addrs.length) {
    out.note = `住所は拾えたが Places と一致しない`
  } else if (!out.note) {
    out.note = '住所が見つからない'
  }

  // 電話：Places の番号と数字が一致するか
  const pt = String(row.tel ?? '').replace(/[^\d]/g, '')
  const th = found.tels.find((t) => pt && t.v.replace(/[^\d]/g, '') === pt)
  if (th) out.tel = row.tel
  else if (found.tels.length) out.tel = found.tels.find((t) => t.src === 'tel-link')?.v ?? null

  return out
}

const SHOW = opts.full ? Infinity : 14
const results = []
for (let i = 0; i < rows.length; i += CONCURRENCY) {
  const batch = rows.slice(i, i + CONCURRENCY)
  results.push(...(await Promise.all(batch.map(verify))))
  process.stderr.write(`\r  ${Math.min(i + CONCURRENCY, rows.length)}/${rows.length}`)
}
process.stderr.write('\n\n')

const ok = results.filter((r) => r.state === 'verified')
const city = results.filter((r) => r.state === 'city-only' || r.state === 'site-only')
const ng = results.filter((r) => r.state === 'unverified')
console.log(`番地まで一致 ${ok.length} / 市区まで・サイトの住所 ${city.length} / 取れず ${ng.length}`)
console.log(`電話も確認できた ${results.filter((r) => r.tel).length}\n`)
for (const r of [...ok, ...city].slice(0, SHOW)) {
  console.log(`  ${r.state === 'verified' ? '◎' : r.state === 'city-only' ? '○' : '△'} ${r.name}`)
  console.log(`     ${r.addr}   [${r.note}]${opts.full ? `  Places: ${rows.find((x) => x.id === r.id)?.pref} ${rows.find((x) => x.id === r.id)?.area ?? ''}` : ''}`)
}
if (ok.length + city.length > SHOW) console.log(`  … ほか ${ok.length + city.length - SHOW}件\n`)
for (const r of ng.slice(0, opts.full ? Infinity : 25)) console.log(`  × ${r.name} — ${r.note}`)
if (!opts.full && ng.length > 25) console.log(`  … ほか ${ng.length - 25}件`)

if (opts.apply) {
  for (const r of results) {
    // 前に取れていた住所を、今回取れなかったことで消さない（--all のとき）
    const prev = rows.find((x) => x.id === r.id)
    if (!r.addr && prev?.addr_verified) continue
    const done = r.state !== 'unverified'
    await client.execute({
      // 裏取りできたら Places 由来の hint を消す（照合のためだけに一時的に持っていた）
      sql: `UPDATE listings SET address = ?, addr_state = ?, tel = ?,
              hint_addr = CASE WHEN ? THEN NULL ELSE hint_addr END,
              hint_tel = CASE WHEN ? THEN NULL ELSE hint_tel END,
              updated_at = datetime('now') WHERE id = ?`,
      // **電話も、前に取れていた番号を今回取れなかったことで消さない**（住所と同じ扱い）。
      // 住所だけ守っていて、サイトが一時的に読めなかった松田ネーム刺繍店の電話が空になった（2026-09-29）
      args: [r.addr, r.state, r.tel ?? prev?.tel_verified ?? null, done ? 1 : 0, done ? 1 : 0, r.id],
    })
  }
  console.log(`\n${results.length}社に書き戻しました。`)
} else {
  console.log('\n--apply を付けると DB に書き戻します。')
}
