// 掲載 DB（Turso `name-shishu`）のクライアント。scripts/ から使う。**サイト（app/）からは使わない。**
//
// サイトはビルド時に data/*.json を読むだけで、DB には繋がない。Vercel に接続情報を置かないので、
// 本番の配信から DB に届く経路が無い。書き出しは `node scripts/export.mjs`。
//
// 接続情報は .env.local（.gitignore 済み）。
//   LISTINGS_DATABASE_URL=libsql://name-shishu-rikitomorikawa.aws-ap-northeast-1.turso.io
//   LISTINGS_AUTH_TOKEN=...（turso db tokens create name-shishu）
import dns from 'node:dns'
import { readFileSync, existsSync } from 'node:fs'
import { createClient } from '@libsql/client'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// **IPv4 で出る。** 回線が IPv6 を持っていると Node が IPv6 を先に選び、
// 公式サイトの取得がほぼ全部落ちた（2026-09-29 に 290件中283件）。
dns.setDefaultResultOrder('ipv4first')

export const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..')

function loadEnv() {
  const p = join(ROOT_DIR, '.env.local')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}

let client
export function db() {
  if (client) return client
  loadEnv()
  const url = process.env.LISTINGS_DATABASE_URL
  if (!url) {
    console.error('LISTINGS_DATABASE_URL が未設定です。.env.local を用意してください（db/client.mjs の冒頭）。')
    process.exit(1)
  }
  client = createClient({ url, authToken: process.env.LISTINGS_AUTH_TOKEN })
  return client
}
