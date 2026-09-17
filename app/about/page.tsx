import type { Metadata } from 'next'
import { listings, updatedAt } from '@/lib/listings'

export const metadata: Metadata = {
  title: 'この媒体について',
  description:
    'ネーム刺繍ナビは、作業着・ユニフォームへの名入れを頼める先を地域ごとに集めた媒体です。掲載は無料で、掲載先から料金はいただいていません。',
  alternates: { canonical: '/about/' },
}

export default function About() {
  const kakou = listings.filter((l) => l.kind === 'kakou').length
  return (
    <article className="prose">
      <p className="crumb"><a href="/">ネーム刺繍ナビ</a> ／ この媒体について</p>
      <h1>この媒体について</h1>

      <h2>何を集めているか</h2>
      <p>
        作業着やユニフォームに社名・ロゴを入れたいときに頼める先を、地域ごとに集めています。
        <b>いま持っている服に加工を頼む</b>なら刺繍の加工屋、<b>服ごと名入れで買う</b>なら作業服・ユニフォームの店。
        現在 {listings.length}件（加工屋{kakou}・店{listings.length - kakou}）を掲載しています。
      </p>

      <h2>なぜ作ったか</h2>
      <p>
        店ごとに<b>持ち込みの可否・最小枚数・納期・料金</b>が違うのに、それが横に並んでいる場所がありませんでした。
        地図アプリでは「近いかどうか」しか分からず、各社のサイトを1つずつ開いて確かめるしかない。
        そこを並べるために作りました。
      </p>

      <h2>載せている情報の出どころ</h2>
      <ul>
        <li><b>社名・住所・電話</b>は、各社が自社のサイトで公開しているものです</li>
        <li><b>持ち込みの条件</b>も、各社のサイトに書かれている内容です</li>
        <li><b>分からない項目は「確認中」と出します。</b>推測では書きません</li>
        <li><b>写真は掲載先から提供されたものだけ</b>を載せます。各社サイトからの転載はしません</li>
      </ul>
      <p>
        誤りを見つけた場合、また掲載を希望・辞退される場合は、
        <a href="mailto:contact@umidas.info">contact@umidas.info</a> までお知らせください。すぐに反映します。
      </p>

      <h2>掲載料について</h2>
      <p>
        <b>掲載は無料です。掲載先から料金はいただいていません。</b>
        掲載の順番も料金では変わりません。
      </p>

      <h2>運営</h2>
      <table className="facts">
        <tbody>
          <tr><th>運営</th><td>UMIDAS</td></tr>
          <tr><th>責任者</th><td>森川力人（元・作業服／ユニフォーム商社の営業）</td></tr>
          <tr><th>連絡先</th><td><a href="mailto:contact@umidas.info">contact@umidas.info</a></td></tr>
        </tbody>
      </table>

      <p className="muted">最終更新 {updatedAt}</p>
    </article>
  )
}
