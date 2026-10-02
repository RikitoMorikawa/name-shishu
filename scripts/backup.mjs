#!/usr/bin/env node
// 掲載 DB（Turso `name-shishu`）の**全テーブルを丸ごと** JSON で書き出す。
//
//   node scripts/backup.mjs                 # ../backups/name-shishu/<日時>/ に書く
//   node scripts/backup.mjs --out <dir>     # 書き先を指定
//
// export.mjs（サイト用・掲載中の行と出してよい列だけ）とは別物。こちらは全行・全列。
// **書き先はリポジトリの外。** hint_addr / hint_tel（Places 由来）も入るので、Git にも配信にも乗せない。
// 戻すときは schema.sql の CREATE を流してから <table>.json の rows を INSERT する。
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { db, ROOT_DIR } from '../db/client.mjs'

const { values: opts } = parseArgs({ options: { out: { type: 'string' } } })

const stamp = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '-')
const out = opts.out ?? join(ROOT_DIR, '..', 'backups', 'name-shishu', stamp)
mkdirSync(out, { recursive: true })

const client = db()
const { rows: tables } = await client.execute(
  `SELECT name, sql FROM sqlite_master WHERE type IN ('table', 'index') AND name NOT LIKE 'sqlite_%' AND sql IS NOT NULL ORDER BY type DESC, name`,
)
writeFileSync(join(out, 'schema.sql'), tables.map((t) => `${t.sql};`).join('\n\n') + '\n')

const counts = {}
for (const { name } of tables.filter((t) => /^CREATE TABLE/i.test(String(t.sql)))) {
  const r = await client.execute(`SELECT * FROM "${name}"`)
  // BigInt は JSON にできないので数値に（行数・id の範囲なら精度は落ちない）
  const rows = r.rows.map((row) => Object.fromEntries(r.columns.map((c) => [c, typeof row[c] === 'bigint' ? Number(row[c]) : row[c]])))
  writeFileSync(join(out, `${name}.json`), JSON.stringify({ table: name, columns: r.columns, rows }, null, 1))
  counts[name] = rows.length
}
writeFileSync(join(out, 'manifest.json'), JSON.stringify({ at: new Date().toISOString(), db: 'name-shishu', counts }, null, 1))

console.log(out)
for (const [t, n] of Object.entries(counts)) console.log(`  ${t.padEnd(24)} ${n}`)
