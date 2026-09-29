#!/usr/bin/env node
// **公式サイトに書いてある「持ち込みの条件」を拾う。** ネーム刺繍ナビの中身そのもの。
//
//   node scripts/scan-terms.mjs                 # 拾って一覧を出す（DBは触らない）
//   node scripts/scan-terms.mjs --only 刺繍館   # 社名で絞る
//   node scripts/scan-terms.mjs --since 2026-09-29   # この日以降に足した行だけ
//   node scripts/scan-terms.mjs --apply         # **空の項目だけ** DB に書き戻す
//   node scripts/scan-terms.mjs --apply --overwrite   # 入っている値も上書きする（手で直した値も消える）
//
// **既定では、入っている値を上書きしない**（2026-09-29）。以前は --apply で全項目を書き換えていて、
// 本文を読んで手で直した値（持ち込み料・プリントの記事を誤読した納期の取り消し）を機械の結果で消していた。
//
// **誤読が一番こわい。** 「持ち込み不可」の店を「可」と出したら、その店にも読者にも迷惑がかかる。
// だから拾うのは確信が持てる言い回しだけにして、**根拠の原文を terms_src に必ず残す**。
// 人が読み返せない抽出は、間違っていても気づけない。
//
// 否定形を先に見る。「持ち込みは承っておりません」を「持ち込み」だけで拾うと逆になる。
import { parseArgs } from 'node:util'
import { db } from '../db/client.mjs'

const { values: opts } = parseArgs({
  options: { only: { type: 'string' }, apply: { type: 'boolean', default: false }, overwrite: { type: 'boolean', default: false }, since: { type: 'string' }, full: { type: 'boolean', default: false }, limit: { type: 'string' } },
})

const UA = 'Mozilla/5.0 (compatible; name-shishu-terms/1.0)'
const UA_BROWSER =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const TIMEOUT = 15000
const CONCURRENCY = 5
const MAX_PAGES = 6

// 料金・持ち込み・注文の流れを優先して辿る
const WANTED = /price|ryokin|kakaku|order|flow|guide|service|mochikomi|bring|faq|question|info|company|about/i
const WANTED_JA = /料金|価格|値段|持ち込み|持込|お持ち込み|注文|ご注文|流れ|サービス|よくある|Q&A|加工|納期/

const dropNoise = (h) => h.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
const toText = (h) =>
  dropNoise(h).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/[\s　]+/g, ' ')
const zen2han = (s) =>
  s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/[−–—ー―]/g, '-')

/** 見つけた箇所の前後を切り出して根拠にする */
const around = (text, idx, len, span = 34) =>
  text.slice(Math.max(0, idx - span), Math.min(text.length, idx + len + span)).trim()

async function fetchText(url, ua = UA) {
  const res = await fetch(url, { headers: { 'User-Agent': ua }, redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT) })
  if (!res.ok) {
    if ((res.status === 403 || res.status === 406) && ua === UA) return fetchText(url, UA_BROWSER)
    throw new Error(`HTTP ${res.status}`)
  }
  const ct = res.headers.get('content-type') || ''
  if (ct && !/text\/html|application\/xhtml/i.test(ct)) throw new Error('HTML ではない')
  const buf = new Uint8Array(await res.arrayBuffer())
  const head = new TextDecoder('latin1').decode(buf.subarray(0, 4096))
  const m = (ct.match(/charset=([\w-]+)/i) || head.match(/charset=["']?([\w-]+)/i) || [])[1]
  let enc = (m || 'utf-8').toLowerCase()
  if (enc === 'shift-jis' || enc === 'x-sjis' || enc === 'ms_kanji') enc = 'shift_jis'
  if (enc === 'euc_jp') enc = 'euc-jp'
  try { return new TextDecoder(enc).decode(buf) } catch { return new TextDecoder('utf-8').decode(buf) }
}

function pickLinks(html, base) {
  const out = []
  for (const m of dropNoise(html).matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = m[1].trim()
    const label = m[2].replace(/<[^>]+>/g, '').trim()
    if (/^(mailto|tel|javascript):/i.test(href)) continue
    let u
    try { u = new URL(href, base) } catch { continue }
    if (u.host !== new URL(base).host) continue
    let path = u.pathname
    try { path = decodeURIComponent(u.pathname) } catch { /* そのまま */ }
    if (WANTED.test(u.pathname) || WANTED_JA.test(label) || WANTED_JA.test(path)) out.push(u.href.split('#')[0])
  }
  return [...new Set(out)]
}

// ── 持ち込み。**否定と留保を先に見る** ──────────────────────
// 「持ち込みの直接刺しゅうは素材や位置によってお断り」を「可」と読んだ（2026-09-17）。
// 単語の距離を12文字に切っていたせいなので、句点までを見る。
const NG_MOCHIKOMI =
  /(?:お)?持ち?込み?[^。．！!？?]{0,40}(?:不可|お断り|承っておりません|受け付けており?ません|お受けでき?ません|ご遠慮|でき(?:ない|ません))/
// 留保つきの言い回し。**肯定とも否定とも取れないので、判定しないで原文だけ残す。**
// **活用形を取りこぼすと、留保つきの否定が「不可」になる**（2026-09-18 に3件そうなった）。
// 「お断りすることもございます」「納品できない場合がある」――どちらも留保であって不可ではない。
const HOLD =
  /(?:場合(?:が|も)(?:ござい)?(?:あります|ある|あり)|(?:する)?こと(?:が|も)(?:ござい)?(?:あります|ある|あり)|によって(?:は)?|状況により|ご相談(?:ください|下さい)|お受けでき(?:ない|ません)ことが|できないことが)/
// **メニュー名・見出しを否定として読まない。** 「刺繍できる物・できない物」はページのメニュー項目で、
// 持ち込みの可否を言っていない（2026-09-18・札幌ヨシダネーム）。
const MENU_LIKE = /(?:できる物|出来る物|できるもの・|可・不可|一覧|menu|メニュ[-ー])/i
// **限定つきの否定を、全体の否定として読まない**（2026-09-18 に追加）。
// 「キャップ・ビーニー等の持ち込みはお断り」「シルクスクリーンプリントの場合、お持込みは受け付けておりません」
// 「DTFは持ち込み商品への加工は承ることができません」「毎年3月に新規の方が持ち込み大至急…お断り」
// ―― どれも**断っているのは一部**で、一般の持ち込みの可否はどこにも書かれていない。
// **この形で、不可としていた9件のうち8件が誤っていた**（うち5件は実際には受けている店だった）。
// 持ち込みで受けてくれる店を探す媒体で「受けていません」と出すのは、その店にいちばん実害が出る。
const LIMIT =
  // **「のみ」は入れない。** 「お持込みのボディへの加工のみは承っておりません」は
  // 対象を絞っているのではなく全体の否定で、入れると正しい不可まで消える（2026-09-18・オリジナル工房）。
  /(?:の場合|等(?:の|は)|など(?:の|は)|一部|限定|に限(?:り|る)|以外|特殊|高級|替えの利かない|リストバンド|キャップ|ビ[-ー]ニ[-ー]|革|シルクスクリ[-ー]ン|DTF|転写|トランパック|大至急|毎年)/
const OK_MOCHIKOMI =
  /(?:お)?持ち?込み?(?:品|商品|大歓迎|歓迎|OK|ＯＫ|可能|可)|(?:お)?持ち?込み?(?:の)?(?:商品|生地|衣類|ウェア)?(?:へ|に)(?:の)?(?:刺繍|加工)|他店(?:で)?(?:ご)?購入/

// ── 最小枚数 ────────────────────────────────────
const MINLOT = [
  /([1１一])\s*(枚|点|個|本)\s*(?:から|より|〜|~|でも)/,
  /最小(?:ロット|枚数|単位)[：:\s]*([0-9０-９]+)\s*(枚|点|個)/,
  /([0-9０-９]+)\s*(枚|点)\s*(?:以上|から)(?:の)?(?:ご)?(?:注文|受付)/,
]
// 最小枚数の周りに出たら採用しない語。**否定文の中の数字を拾うと意味が逆になる**（2026-09-18）。
const LOT_NG = /(?:お断り|でき(?:ない|ません)|受け付けており?ません|承っており?ません|不可|割に合わ|ご遠慮)/
// **プリント専用の文脈**。媒体の軸は刺繍・名入れなので、プリントの最小枚数は載せない。
const PRINT_ONLY = /(?:プリント|転写|シルクスクリ[-ー]ン|インクジェット)/
// **刺繍の話だと認めてよい語。「ネーム」は入れない** ―― 「プリントネーム製造」という
// 商品名があり、それで除外をすり抜けた（2026-09-18・飯田服飾工業）。
const IS_SHISHU = /(?:刺繍|刺しゅう|刺しゆう)/
// **数量の下限ではないもの。** 「ロット割引は20枚以上で10％引き」は割引の区切りであって下限ではなく、
// 「取り寄せは1枚から」は商品の取り寄せの話（2026-09-18 に両方とも取りこぼした）。
const NOT_A_FLOOR = /(?:割引|引き|お得|キャンペ[-ー]ン|取り?寄せ|送料)/

// ── 納期 ────────────────────────────────────────
const LEAD = [
  /(即日|当日)(?:仕上げ|対応|お渡し|発送)/,
  /最短\s*([0-9０-９]+)\s*(営業日|日|週間)/,
  /(?:納期|仕上がり)(?:は|：|:)?\s*(?:約)?\s*([0-9０-９]+)\s*(?:[-〜~]\s*([0-9０-９]+))?\s*(営業日|日|週間)/,
]
// ── 料金 ────────────────────────────────────────
const PRICE = [
  /([0-9０-９,，]+)\s*円\s*(?:\/|／)?\s*1?\s*文字/,
  /1\s*文字\s*(?:あたり|につき)?\s*([0-9０-９,，]+)\s*円/,
  /(?:ネーム|名入れ|刺繍)(?:代|料金|加工)?\s*[：:]?\s*([0-9０-９,，]+)\s*円\s*[〜~]/,
]

// ── 刺繍を入れる対象（品目）。**一覧の絞り込み軸になる。**
// 1回出ただけでは採らない。**2回以上**か、列挙（「・」で並ぶ）の中にあるものだけ拾う。
const ITEMS = [
  { key: 'wear', label: '服', re: /Tシャツ|ポロシャツ|作業着|作業服|ユニフォーム|ジャンパー|ブルゾン|つなぎ|白衣|エプロン|スウェット|パーカー|シャツ/g },
  { key: 'cap', label: '帽子', re: /キャップ|帽子|ニット帽|ハット/g },
  { key: 'towel', label: 'タオル', re: /タオル|ハンカチ|手ぬぐい/g },
  { key: 'bag', label: 'バッグ', re: /バッグ|カバン|鞄|トート|リュック|ポーチ|巾着/g },
  { key: 'wappen', label: 'ワッペン', re: /ワッペン|エンブレム|アップリケ|パッチ/g },
  { key: 'flag', label: 'のれん・旗', re: /のれん|暖簾|のぼり|幕|旗|横断幕/g },
]

function scanItems(text) {
  const found = []
  for (const it of ITEMS) {
    const m = text.match(it.re)
    if (m && m.length >= 2) found.push(it.key)
  }
  return found
}

function scan(text) {
  const t = zen2han(text)
  const out = { mochikomi: null, minLot: null, leadTime: null, priceFrom: null, items: [], src: {} }

  const ng = t.match(NG_MOCHIKOMI)
  const ok = t.match(OK_MOCHIKOMI)
  // **否定が「全体の否定」かどうかを先に決める。** 限定つき（対象を絞っている）なら全体の否定ではない。
  const ngCtx = ng ? around(t, ng.index, ng[0].length, 70) : ''
  const ngIsWhole = !!ng && !HOLD.test(ngCtx) && !LIMIT.test(ngCtx) && !MENU_LIKE.test(ngCtx)
  if (ngIsWhole) {
    // 限定も留保も無い否定だけが「不可」。ここへ来るのは「お持込みのボディへの加工のみは承っておりません」型
    out.mochikomi = 0
    out.src.mochikomi = around(t, ng.index, ng[0].length)
  } else if (ok) {
    // **限定つきの否定があっても、別の場所に明確な肯定があれば「可」。**
    // GOTODA2 は「リストバンド（刺繍）持ち込み不可」と「持ち込み対応で1点から高品質刺繍可能」が
    // 同じサイトにあり、否定を先に見たせいで「不可」と出していた（2026-09-18）。
    const ctx = around(t, ok.index, ok[0].length, 60)
    out.mochikomi = HOLD.test(ctx) ? null : 1
    out.src.mochikomi = (out.mochikomi === null ? '【留保あり・要確認】' : '') + around(t, ok.index, ok[0].length)
  } else if (ng) {
    // 限定つきの否定しか無い＝**断っているのは一部で、一般の可否は書かれていない。**
    out.mochikomi = null
    out.src.mochikomi = '【一部のみ不可・一般の可否は未記載】' + around(t, ng.index, ng[0].length)
  }

  for (const re of MINLOT) {
    const m = t.match(re)
    if (!m) continue
    const ctx = around(t, m.index, m[0].length, 60)
    // **否定文から数字を拾わない**（2026-09-18 に追加）。愛知シシュウの
    // 「1枚のみは割に合わない高額となるため、お断りし」を「1枚から」と読んでいた ―― **意味が逆。**
    if (LOT_NG.test(ctx)) {
      out.src.minLot = '【否定文なので採用しない】' + around(t, m.index, m[0].length)
      break
    }
    // **プリントの話を刺繍の最小枚数にしない。** 「シルクプリント 1枚からプリント加工可能」を
    // 拾っていた（飯田服飾・Factory ant・アクセル）。媒体の軸は刺繍・名入れ。
    if (PRINT_ONLY.test(ctx) && !IS_SHISHU.test(ctx)) {
      out.src.minLot = '【プリントの話なので採用しない】' + around(t, m.index, m[0].length)
      break
    }
    // **数量の下限ではない文脈を外す。** 「取り寄せは1枚から」は商品の取り寄せの話。
    if (NOT_A_FLOOR.test(ctx) && !/([2-9０-９][0-9０-９]*)\s*(?:枚|点|個)\s*以上(?:から|の)?(?:ご)?(?:注文|受付)/.test(ctx)) {
      out.src.minLot = '【下限の話ではないので採用しない】' + around(t, m.index, m[0].length)
      break
    }
    // **条件つきの下限を見落とさない。** フェリーチェ山手の「5枚以上から承ります（追加時は1枚からOK）」を
    // 「1枚から」と読んでいた。同じ文に別の下限があるなら判定しない。
    // ただし**割引の区切りは下限ではない** ―― 「ロット割引は20枚以上で10％引き」で
    // 正しい「1枚から」を消してしまった（2026-09-18・東ネーム刺しゅう店）。
    if (/([2-9０-９][0-9０-９]*)\s*(?:枚|点|個)\s*(?:以上|から)/.test(ctx) && !NOT_A_FLOOR.test(ctx)) {
      out.src.minLot = '【同じ文に別の下限があるので採用しない】' + around(t, m.index, m[0].length)
      break
    }
    out.minLot = /^[1１一]$/.test(m[1]) ? `1${m[2]}から` : `${m[1]}${m[2]}から`
    out.src.minLot = around(t, m.index, m[0].length)
    break
  }
  for (const re of LEAD) {
    const m = t.match(re)
    if (!m) continue
    const ctx = around(t, m.index, m[0].length, 60)
    if (HOLD.test(ctx) || /(?:でき(?:ない|ません)|お約束|保証(?:は|でき))/.test(ctx)) {
      out.src.leadTime = '【留保あり・採用しない】' + around(t, m.index, m[0].length)
      break
    }
    out.leadTime = m[1] === '即日' || m[1] === '当日' ? '即日対応' : `${m[1]}${m[3] ?? m[2] ?? '日'}`
    out.src.leadTime = around(t, m.index, m[0].length)
    break
  }
  for (const re of PRICE) {
    const m = t.match(re)
    if (!m) continue
    const yen = m[1].replace(/[,，]/g, '')
    if (Number(yen) > 100000) continue // 桁が大きいものは刺繍代ではない
    out.priceFrom = /文字/.test(m[0]) ? `1文字 ${Number(yen).toLocaleString()}円〜` : `${Number(yen).toLocaleString()}円〜`
    out.src.priceFrom = around(t, m.index, m[0].length)
    break
  }
  out.items = scanItems(t)
  return out
}

const client = db()
const where = ["status = '掲載'"]
const args = []
if (opts.only) { where.push('name LIKE ?'); args.push(`%${opts.only}%`) }
// 足したばかりの行だけ見るとき（例 --since 2026-09-29）。created_at は UTC
if (opts.since) { where.push('created_at >= ?'); args.push(opts.since) }
const { rows } = await client.execute({
  sql: `SELECT id, name, url AS site_url, mochikomi, min_lot, lead_time, price_from, items, terms_src
        FROM listings WHERE ${where.join(' AND ')} ORDER BY pref, name` + (opts.limit ? ` LIMIT ${Number(opts.limit)}` : ''),
  args,
})
console.log(`${rows.length} 社のサイトから持ち込みの条件を拾います（並列 ${CONCURRENCY}・最大${MAX_PAGES}ページ）\n`)

async function work(row) {
  const pages = [row.site_url]
  const seen = new Set()
  let text = ''
  for (let i = 0; i < pages.length && seen.size < MAX_PAGES; i++) {
    const url = pages[i]
    if (seen.has(url)) continue
    seen.add(url)
    let html
    try { html = await fetchText(url) } catch { continue }
    text += ' ' + toText(html)
    if (i === 0) pages.push(...pickLinks(html, url).slice(0, MAX_PAGES - 1))
  }
  return { id: row.id, name: row.name, ...scan(text) }
}

const results = []
for (let i = 0; i < rows.length; i += CONCURRENCY) {
  results.push(...(await Promise.all(rows.slice(i, i + CONCURRENCY).map(work))))
  process.stderr.write(`\r  ${Math.min(i + CONCURRENCY, rows.length)}/${rows.length}`)
}
process.stderr.write('\n\n')

const n = (f) => results.filter(f).length
console.log(`持ち込み 可 ${n((r) => r.mochikomi === 1)} / 不可 ${n((r) => r.mochikomi === 0)} / 不明 ${n((r) => r.mochikomi === null)}`)
console.log(`最小枚数 ${n((r) => r.minLot)} ／ 納期 ${n((r) => r.leadTime)} ／ 料金 ${n((r) => r.priceFrom)}`)
const ic = {}
for (const r of results) for (const k of r.items ?? []) ic[k] = (ic[k] ?? 0) + 1
console.log('品目 ' + ITEMS.map((i) => `${i.label}:${ic[i.key] ?? 0}`).join(' / ') + '\n')

console.log('── 拾えた例（根拠つき。**目で確かめること**）')
for (const r of results.filter((x) => x.mochikomi !== null || x.minLot || x.leadTime || x.priceFrom).slice(0, opts.full ? Infinity : 12)) {
  const bits = [
    r.mochikomi === 1 ? '持込可' : r.mochikomi === 0 ? '持込不可' : null,
    r.minLot, r.leadTime, r.priceFrom,
  ].filter(Boolean)
  console.log(`\n  ${r.name}  【${bits.join(' / ')}】`)
  for (const [k, v] of Object.entries(r.src)) console.log(`     ${k}: …${v}…`)
}

if (opts.apply) {
  let n = 0
  for (const r of results) {
    const prev = rows.find((x) => x.id === r.id)
    const has = (v) => v !== null && v !== undefined && v !== ''
    // **入っている値は残す**（--overwrite のときだけ上書き）。根拠の原文も、残した項目のぶんは前のものを残す
    const src = { ...(prev.terms_src ? JSON.parse(String(prev.terms_src)) : {}) }
    // **根拠が「【」で始まる項目は、人が「採用しない」と決めた印。** 空でも埋めない（--overwrite でも）。
    // 空にしただけだと「まだ調べていない」と区別できず、次の --apply で同じ誤読が戻った
    // （みさとマークの「即日対応」＝プリントタオルの記事。2026-09-29）
    const rejected = (key) => key && String(src[key] ?? '').startsWith('【')
    const keep = (col, key) => rejected(key) || (!opts.overwrite && has(prev[col]))
    const put = (col, key, v) => {
      if (keep(col, key)) return prev[col]
      if (key) { if (r.src[key]) src[key] = r.src[key]; else if (opts.overwrite) delete src[key] }
      return v
    }
    const next = {
      mochikomi: put('mochikomi', 'mochikomi', r.mochikomi),
      min_lot: put('min_lot', 'minLot', r.minLot),
      lead_time: put('lead_time', 'leadTime', r.leadTime),
      price_from: put('price_from', 'priceFrom', r.priceFrom),
      items: put('items', null, r.items?.length ? JSON.stringify(r.items) : null),
    }
    await client.execute({
      sql: `UPDATE listings SET mochikomi = ?, min_lot = ?, lead_time = ?, price_from = ?, items = ?, terms_src = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [next.mochikomi, next.min_lot, next.lead_time, next.price_from, next.items,
             Object.keys(src).length ? JSON.stringify(src) : null, r.id],
    })
    n++
  }
  console.log(`\n${n}社に書き戻しました（${opts.overwrite ? '上書きあり' : '空の項目だけ'}）。`)
} else {
  console.log('\n--apply を付けると DB に書き戻します（空の項目だけ）。')
}
