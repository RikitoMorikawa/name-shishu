import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://name-shishu.com'),
  title: {
    default: 'ネーム刺繍ナビ｜持ち込みで社名・ロゴを入れられる加工屋を探す',
    template: '%s｜ネーム刺繍ナビ',
  },
  description:
    '作業着やユニフォームに社名・ロゴを入れたいとき、持ち込みで受けてくれる刺繍の加工屋と、名入れごと頼める作業服店を地域ごとに掲載。持ち込みの可否・最小枚数・納期・料金の目安を横に並べて比べられます。',
  openGraph: { type: 'website', locale: 'ja_JP', siteName: 'ネーム刺繍ナビ' },
  alternates: { canonical: '/' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header className="site-head">
          <div className="wrap">
            <a className="brand" href="/">
              <span className="mark">ネーム刺繍<em>ナビ</em></span>
              <span className="tag-line">持ち込みの刺繍・名入れを地域で探す</span>
            </a>
          </div>
        </header>

        <main className="wrap">{children}</main>

        <footer className="site-foot">
          <div className="wrap">
            <nav className="foot-links">
              <a href="/about/">この媒体について</a>
              <a href="/terms/">利用規約</a>
              <a href="/privacy/">プライバシーポリシー</a>
              <a href="mailto:contact@umidas.info">掲載・訂正のご依頼</a>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  )
}
