import type { Metadata } from 'next'
import { listings, updatedAt } from '@/lib/listings'

export const metadata: Metadata = {
  title: 'この媒体について',
  description:
    'ネーム刺繍ナビは、持ち込みで刺繍・名入れを頼める加工屋を地域ごとに集めた媒体です。掲載の順番は料金によって変わりません。',
  alternates: { canonical: '/about/' },
}

export default function About() {
  return (
    <div className="wrap">
    <article className="prose">
      <p className="crumb"><a href="/">ネーム刺繍ナビ</a> ／ この媒体について</p>
      <h1>この媒体について</h1>

      <h2>何を集めているか</h2>
      <p>
        持ち込んだ品に刺繍や名入れを入れてくれる<b>加工屋</b>を、地域ごとに集めています。
        対象は作業着やユニフォームだけでなく、<b>帽子・タオル・カバン・ワッペン</b>など。
        現在 {listings.length}件を掲載しています。
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

      <h2>掲載について</h2>
      <p>
        いま載せている加工屋は、<b>当サイトが公開情報をもとに選んで掲載したもの</b>です。
        掲載のご依頼・条件については個別にご相談ください。
        <b>掲載の順番は料金によって変わりません。</b>
        掲載を希望されない場合は、お知らせいただければ削除します。
      </p>

      <h2>運営</h2>
      <table className="facts">
        <tbody>
          <tr><th>運営</th><td>UMIDAS</td></tr>
          <tr><th>責任者</th><td>森川力斗</td></tr>
          <tr><th>連絡先</th><td><a href="mailto:contact@umidas.info">contact@umidas.info</a></td></tr>
        </tbody>
      </table>

      <p className="muted">最終更新 {updatedAt}</p>
    </article>
    </div>
  )
}
