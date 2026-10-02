import type { Metadata } from 'next'
import { updatedAt } from '@/lib/listings'

export const metadata: Metadata = {
  title: '掲載のご案内',
  description:
    'ネーム刺繍ナビへの掲載をご希望の店の方へ。持ち込みの条件などの基本情報をお店から載せられる「基本掲載」と、写真・紹介文まで載せられる「充実掲載」、地域ページの一覧の上に表示する「PR 枠」があります。',
  alternates: { canonical: '/listing/' },
}

/**
 * **掲載を考えている店の方に向けたページ。** 店を探している人には見せる必要が無いので、
 * 入口は店ページの下の1行（「この店の方へ」）とフッターのリンクだけ。
 *
 * - **2段だけ並べる（2026-10-01・本人決定）。** 無料の段は書かない ―― 書くと「他の店は無料」と言うことになる
 * - **料金は出さない（同日）。** 問い合わせを受けてから個別に案内する
 * - **「有料掲載」という言葉は使わない**（2026-09-28）。プラン名と「PR」で足りる
 * - ★は充実掲載だけの項目。基本掲載との差がひと目で分かるようにする
 * - **PR 枠はプランの表から外し、広告オプションとして別の段にした（2026-10-02・本人決定）。**
 *   11月からは掲載プランと別料金（市区ページ・都道府県ページ）。料金はここにも出さない。
 *   10月に充実掲載を申し込んだ店は、契約期間中は PR 枠込みのまま
 */
const ROWS: { label: string; note?: string; basic: boolean; full: boolean }[] = [
  { label: '持ち込みの条件をお店から記入', note: '持ち込み・最小枚数・納期・料金の目安・対応品目・郵送・型代・受けられない素材', basic: true, full: true },
  { label: '連絡先・所在地の掲載', basic: true, full: true },
  { label: '社名の横と一覧に「PR」の表示', basic: true, full: true },
  { label: '★ お店の写真', note: '作業場・仕上がりの見本など', basic: false, full: true },
  { label: '★ 紹介文', note: 'お店の言葉で、得意なこと・こだわりを', basic: false, full: true },
]

export default function Listing() {
  return (
    <div className="wrap">
    <article className="prose">
      <p className="crumb"><a href="/">ネーム刺繍ナビ</a> ／ 掲載のご案内</p>
      <h1>掲載のご案内</h1>
      <p>
        ネーム刺繍ナビは、持ち込みで刺繍・名入れを頼める店を地域から探すための媒体です。
        店を探している方は、<b>持ち込みできるか・何枚から・何日で</b>を見比べて依頼先を決めています。
        その条件を、<b>お店ご自身の言葉で載せられる</b>のが掲載プランです。
      </p>

      <h2>掲載プラン</h2>
      <div className="panel plan-wrap">
        <table className="plan-table">
          <thead>
            <tr>
              <th scope="col"><span className="sr-only">載せられるもの</span></th>
              <th scope="col">基本掲載</th>
              <th scope="col" className="plan-full">充実掲載</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.label} className={r.basic ? undefined : 'plan-star'}>
                <th scope="row">
                  {r.label}
                  {r.note ? <span className="plan-note">{r.note}</span> : null}
                </th>
                <td>{r.basic ? <span className="plan-yes" aria-label="あり">●</span> : <span className="plan-no" aria-label="なし">―</span>}</td>
                <td className="plan-full">{r.full ? <span className="plan-yes" aria-label="あり">●</span> : <span className="plan-no" aria-label="なし">―</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">★は充実掲載だけで載せられる項目です。料金・掲載期間は、お問い合わせいただいた方に個別にご案内します。</p>

      <h2>PR 枠（広告オプション）</h2>
      <p>
        市区ページ・都道府県ページの<b>店の一覧の上に、写真と紹介文つきで表示する枠</b>です。
        その地域で依頼先を探している方の目に最初に入ります。掲載プランとは別にお申し込みいただけます。
      </p>
      <ul>
        <li><b>市区ページ</b>と<b>都道府県ページ</b>の2種類があります</li>
        <li>1ページに表示できる店の数には限りがあります</li>
        <li>枠には「PR」と表示します。<b>下の一覧の並び順は変わりません</b></li>
      </ul>

      <h2>お約束していること</h2>
      <ul>
        <li><b>一覧の並び順は、掲載プランによって変わりません。</b>店を探す方が公平に比べられるようにするためです</li>
        <li>掲載料をいただいた店には「PR」と表示します（ステルスマーケティング規制への対応です）</li>
        <li>写真は<b>お店から提供いただいたものだけ</b>を載せます</li>
        <li><b>掲載内容の誤りの訂正と削除は、いつでも承ります。</b></li>
      </ul>

      <h2>お申し込みの流れ</h2>
      <ol>
        <li>下のフォームの「掲載・訂正のご依頼」からご連絡ください</li>
        <li>料金・期間と、ご用意いただくもの（記入する項目・写真・紹介文）をご案内します</li>
        <li>請求書をお送りし、ご入金を確認してから掲載します</li>
      </ol>

      <p className="plan-cta">
        <a className="btn" href="#contact-listing">掲載について問い合わせる</a>
      </p>

      <p className="muted">最終更新 {updatedAt}</p>
    </article>
    </div>
  )
}
