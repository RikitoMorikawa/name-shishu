import type { Metadata } from 'next'
import { updatedAt } from '@/lib/listings'

export const metadata: Metadata = {
  title: 'プライバシーポリシー',
  description: 'ネーム刺繍ナビにおける個人情報の取り扱いについて。アクセス情報、Google マップの埋め込み、お問い合わせで受け取る情報を記載しています。',
  alternates: { canonical: '/privacy/' },
}

export default function Privacy() {
  return (
    <article className="prose">
      <p className="crumb"><a href="/">ネーム刺繍ナビ</a> ／ プライバシーポリシー</p>
      <h1>プライバシーポリシー</h1>
      <p>ネーム刺繍ナビ（以下「当サイト」）における情報の取り扱いについて定めます。</p>

      <h2>1. 当サイトが集めていない情報</h2>
      <p>
        当サイトは<b>会員登録・ログイン・フォーム送信の仕組みを持っていません</b>。
        <b>Cookie も使用していません。</b>
        アクセス解析ツール（Google Analytics 等）も導入していません。
      </p>

      <h2>2. サーバーの記録</h2>
      <p>
        当サイトは Vercel Inc. のサーバーから配信しており、
        アクセスに伴い <b>IPアドレス・ブラウザの種類・アクセス日時</b>などが自動的に記録されます。
        これは障害対応と不正アクセス防止のためのもので、個人を特定する目的では利用しません。
      </p>

      <h2>3. Google マップの埋め込み</h2>
      <p>
        各店舗のページと一覧に、Google LLC が提供する <b>Google Maps</b> を埋め込んでいます。
        地図が表示される際、<b>お使いの端末から Google に IPアドレスなどの情報が送信されます</b>。
        取り扱いについては{' '}
        <a href="https://policies.google.com/privacy?hl=ja" rel="noopener" target="_blank">
          Google のプライバシーポリシー
        </a>
        をご確認ください。
      </p>

      <h2>4. お問い合わせで受け取る情報</h2>
      <p>
        メールでお問い合わせいただいた場合、<b>メールアドレスと本文に記載された内容</b>を受け取ります。
        これらは<b>お問い合わせへの返信と、掲載内容の訂正・掲載の対応にのみ</b>使用します。
        ご本人の同意なく第三者へ提供することはありません。
      </p>

      <h2>5. 掲載している事業者の情報</h2>
      <p>
        当サイトに掲載している社名・住所・電話番号は、<b>各社が自社のサイトで公開している事業者情報</b>です。
        個人のお客様の情報は扱っていません。
        掲載の削除をご希望の場合は、下記までご連絡ください。速やかに対応いたします。
      </p>

      <h2>6. 変更</h2>
      <p>本ポリシーは予告なく変更することがあります。変更後は当ページに掲載します。</p>

      <h2>7. 連絡先</h2>
      <table className="facts">
        <tbody>
          <tr><th>運営</th><td>UMIDAS</td></tr>
          <tr><th>連絡先</th><td><a href="mailto:contact@umidas.info">contact@umidas.info</a></td></tr>
        </tbody>
      </table>

      <p className="muted">最終更新 {updatedAt}</p>
    </article>
  )
}
