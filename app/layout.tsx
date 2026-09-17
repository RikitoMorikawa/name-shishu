import type { Metadata } from 'next'
import { Caveat, Klee_One } from 'next/font/google'
import { ContactForm } from './ContactForm'
import { Photo } from './Photo'
import { HeaderNav } from './HeaderNav'
import { Logo } from './Logo'
import { listings, updatedAt } from '@/lib/listings'
import './globals.css'

/**
 * 手書きの一言に使う2書体。**本文には使わない**（読みにくくなる）。
 * 日本語の Klee One は容量が大きいので preload しない ― 遅れて差し替わっても、
 * 出るのは添え書きだけなので読みに影響しない。
 */
const klee = Klee_One({ weight: '600', preload: false, display: 'swap', variable: '--font-hand' })
const caveat = Caveat({ subsets: ['latin'], weight: '600', display: 'swap', variable: '--font-script' })

export const metadata: Metadata = {
  metadataBase: new URL('https://name-shishu.com'),
  title: {
    default: 'ネーム刺繍ナビ｜持ち込みの刺繍・名入れを地域から探す',
    template: '%s｜ネーム刺繍ナビ',
  },
  description:
    '服・帽子・タオル・カバン・ワッペンに刺繍や名入れを頼みたいとき、持ち込みで受けてくれる加工屋を地域ごとに掲載。持ち込みの可否・最小枚数・納期・料金の目安を並べて比べられます。',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: 'ネーム刺繍ナビ',
    images: [{ url: '/ogp.svg', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', images: ['/ogp.svg'] },
  alternates: { canonical: '/' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${klee.variable} ${caveat.variable}`}>
      <body>
        <header className="site-head">
          <div className="wrap">
            <a className="brand" href="/">
              <Logo />
              <span className="brand-text">
                <span className="mark">ネーム刺繍<em>ナビ</em></span>
                <span className="tag-line">持ち込みの刺繍・名入れを地域から探す</span>
              </span>
            </a>
            <HeaderNav />
          </div>
        </header>

        <main>{children}</main>

        {/* **フッターは全ページ共通。** 問い合わせもここに置く ―
            読み物や各社ページから戻らずに連絡できるようにするため */}
        {/* **フッターは全ページ共通。** 順番は リンク → 帯 → 問い合わせ → 運営表記。
            問い合わせを最後に近づけて、読み終えた流れのまま連絡できるようにする */}
        {/* **フッターは全ページ共通。** 帯で本文を締め、その下にフッターの中身を並べる。
            順番は 帯 → 媒体の名乗りとリンク → 問い合わせ → 運営表記 */}
        <footer className="site-foot" id="contact">
          <section className="band">
            <div className="band-strip">
              {[1, 2, 3, 4].map((i) => (
                <Photo key={i} src={`/photos/band-${i}.jpg`} alt="" />
              ))}
            </div>
            <p className="hand band-copy">その一着に、名前を込めて。</p>
          </section>

          <div className="wrap foot-top">
            <div className="foot-brand">
              <a className="brand" href="/">
                <Logo size={26} />
                <span className="mark">ネーム刺繍<em>ナビ</em></span>
              </a>
              <p className="foot-lead">
                持ち込みで刺繍・名入れを頼める店を、地域から探せる媒体です。
                現在{listings.length}件を掲載しています。
              </p>
            </div>
            <nav className="foot-links">
              <a href="/about/">この媒体について</a>
              <a href="/terms/">利用規約</a>
              <a href="/privacy/">プライバシーポリシー</a>
              <a href="/#list">掲載店を探す</a>
              <a href="/favorites/">お気に入り</a>
            </nav>
          </div>

          <div className="wrap foot-contact">
            <h2>お問い合わせ</h2>
            <ContactForm />
          </div>

          <div className="wrap foot-bottom">
            <p>最終更新 {updatedAt}</p>
            <p>運営 UMIDAS</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
