// app/icon.svg から favicon.ico（16・32・48px）と apple-icon.png（180px）を作り直す。
//   node scripts/icons.mjs
//
// **アイコンを変えるときは icon.svg だけを直してこれを流す。** 3つを手で揃えるとずれる。
// - favicon.ico は背景を透過のまま（タブの地が透ける）
// - apple-icon.png は白地に敷く。**iOS は透過部分を黒で塗る**ので、透過のままだとホーム画面で黒い四角になる
// 手元の Chromium（~/Library/Caches/ms-playwright）を playwright-core で動かす（verify.mjs --browser と同じ）
import { chromium } from 'playwright-core'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'

const root = `${homedir()}/Library/Caches/ms-playwright`
const dir = readdirSync(root).filter((d) => /^chromium_headless_shell-\d+$/.test(d)).sort().pop()
const exe = `${root}/${dir}/chrome-headless-shell-mac-arm64/chrome-headless-shell`
if (!existsSync(exe)) throw new Error(`headless shell が見つからない（${root}）。npx playwright install chromium`)

const svg = readFileSync('app/icon.svg', 'utf8')
const browser = await chromium.launch({ executablePath: exe })
const shot = async (size, bg) => {
  // 明るい地で描く（ダークモード用の色に切り替わらないように）
  const page = await browser.newPage({ viewport: { width: size, height: size }, colorScheme: 'light' })
  await page.setContent(
    `<style>html,body{margin:0;background:${bg}}svg{width:100%;height:100%;display:block}` +
      // 白地に敷くときは周りに 12% の余白を取る（iOS が角を丸めても絵が欠けない）
      `.box{box-sizing:border-box;width:${size}px;height:${size}px;padding:${bg === 'transparent' ? 0 : Math.round(size * 0.12)}px}</style>` +
      `<div class="box">${svg}</div>`,
  )
  const png = await page.screenshot({ omitBackground: bg === 'transparent' })
  await page.close()
  return png
}

const sizes = [16, 32, 48]
const pngs = []
for (const s of sizes) pngs.push(await shot(s, 'transparent'))
const apple = await shot(180, '#ffffff')
await browser.close()

// ICO は PNG をそのまま束ねる形式で書く（Vista 以降・全ブラウザが読める）
const head = Buffer.alloc(6 + 16 * sizes.length)
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4)
let off = head.length
sizes.forEach((s, i) => {
  const e = 6 + 16 * i
  head.writeUInt8(s, e); head.writeUInt8(s, e + 1); head.writeUInt8(0, e + 2); head.writeUInt8(0, e + 3)
  head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6)
  head.writeUInt32LE(pngs[i].length, e + 8); head.writeUInt32LE(off, e + 12)
  off += pngs[i].length
})
writeFileSync('app/favicon.ico', Buffer.concat([head, ...pngs]))
writeFileSync('app/apple-icon.png', apple)
console.log('書き出し: app/favicon.ico（16・32・48）・app/apple-icon.png（180・白地）')
