import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://name-shishu.com'),
  title: {
    default: 'ネーム刺繍ナビ｜持ち込みで社名・ロゴを入れられる加工屋を探す',
    template: '%s｜ネーム刺繍ナビ',
  },
  description:
    '作業着やユニフォームに社名・ロゴを入れたいとき、持ち込みで受けてくれる刺繍の加工屋と、名入れごと頼める作業服店を地域ごとに載せています。最小枚数・納期・料金の目安を横に並べて比べられます。',
  openGraph: { type: 'website', locale: 'ja_JP', siteName: 'ネーム刺繍ナビ' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header className="site-head">
          <div className="wrap">
            <strong><a href="/">ネーム刺繍ナビ</a></strong>
            <span>持ち込みの刺繍・名入れを地域で探す</span>
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer className="site-foot">
          <div className="wrap">
            <p>
              ネーム刺繍ナビは、作業着・ユニフォームへの名入れを頼める先を地域ごとに集めた媒体です。
              運営は森川力人（元・作業服／ユニフォーム商社の営業）。掲載は無料で、掲載先から料金はいただいていません。
            </p>
            <p>
              掲載内容の訂正・掲載のご依頼は <a href="mailto:contact@umidas.info">contact@umidas.info</a> まで。
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
