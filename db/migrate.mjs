#!/usr/bin/env node
// db/migrations/*.sql を番号順に流す。適用済みは _migrations に記録して二度流さない。
//
//   node db/migrate.mjs            適用
//   node db/migrate.mjs --status   適用状況だけ表示
//
// **1ファイルは1トランザクションで流す**（hp/001 の migrate-run.mjs と同じ作り）。
// 途中で落ちたときにデータだけ変わって記録が残らないと、再実行で二重に流れる。
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { db, ROOT_DIR } from './client.mjs'

const DIR = join(ROOT_DIR, 'db', 'migrations')
const files = readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort()
const client = db()

await client.execute(`CREATE TABLE IF NOT EXISTS _migrations (
  name TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
)`)
const done = new Set((await client.execute('SELECT name FROM _migrations')).rows.map((r) => String(r.name)))

if (process.argv.includes('--status')) {
  for (const f of files) console.log(`  ${done.has(f) ? '適用済み' : '未適用  '}  ${f}`)
  process.exit(0)
}

let applied = 0
for (const f of files) {
  if (done.has(f)) continue
  const statements = readFileSync(join(DIR, f), 'utf8')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s && !s.split('\n').every((l) => l.trim().startsWith('--')))
  try {
    await client.batch([...statements, { sql: 'INSERT INTO _migrations (name) VALUES (?)', args: [f] }], 'write')
    applied++
    console.log(`適用: ${f}`)
  } catch (e) {
    console.error(`\n${f} の適用に失敗しました。**変更はすべて巻き戻っています。**\n  ${e.message}`)
    process.exit(1)
  }
}
console.log(applied ? `${applied}件を適用しました。` : '未適用のマイグレーションはありません。')
