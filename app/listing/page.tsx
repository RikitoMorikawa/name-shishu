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
 * - **料金は載せる（2026-10-02・本人決定で 10/1 の「出さない」を撤回）。** メールにこのページのリンクを添えて読めば分かるようにする。
 *   載せるのは基本・充実・PR 枠だけ。**自主掲載（無料）と刺繍台帳の契約者の扱いは載せない**（無料の段を書くと「他の店は無料」と言うことになる）
 * - 掲載イメージの画像は架空の「サンプル刺繍店」で撮ったもの（public/photos/listing-sample-*.jpg）
 * - **「有料掲載」という言葉は使わない**（2026-09-28）。プラン名と「PR」で足りる
 * - ★は充実掲載だけの項目。基本掲載との差がひと目で分かるようにする
 * - **PR 枠は掲載プランの表の中に「オプション」の行として置く（2026-10-02・本人決定）。** 別の段にしていたのをやめた。
 *   写真と紹介文で出す枠なので、付けられるのは充実掲載だけ
 *   10/2 以降の案内から新料金。**10/2 までに旧条件（充実掲載に PR 枠込み）で案内した8社**は、申し込めば契約期間中その条件を守る
 * - **2026-10-03 本人決定：充実掲載 年24,000円（月2,000円）、PR 枠はエリアで2段。** すべて月1,000円単位
 *   県ページ＝大都市8都府県 年48,000／その他 年24,000、市区ページ＝政令指定都市・東京23区 年24,000／その他 年12,000。
 *   **掲載店が3件未満の市区ページでは PR 枠を売らない**（並ぶ店がいない一覧の上に出しても意味が無い）
 */
// PR 枠の料金。大都市＝掲載数と検索の大半がここに集まる8都府県（2026-10-03 時点で掲載469件中215件）
const PR_PRICES: { page: string; area: string; price: string; month: string }[] = [
  { page: '都道府県ページ', area: '東京・大阪・神奈川・愛知・福岡・埼玉・兵庫・千葉', price: '年48,000円', month: '月あたり4,000円' },
  { page: '都道府県ページ', area: '上記以外の道府県', price: '年24,000円', month: '月あたり2,000円' },
  { page: '市区ページ', area: '政令指定都市・東京23区', price: '年24,000円', month: '月あたり2,000円' },
  { page: '市区ページ', area: '上記以外の市区町村', price: '年12,000円', month: '月あたり1,000円' },
]
type Cell = boolean | string
const ROWS: { label: string; note?: string; basic: Cell; full: Cell; opt?: boolean }[] = [
  { label: '持ち込みの条件をお店から記入', note: '持ち込み・最小枚数・納期・料金の目安・対応品目・郵送・型代・受けられない素材', basic: true, full: true },
  { label: '連絡先・所在地の掲載', basic: true, full: true },
  { label: '社名の横と一覧に「PR」の表示', basic: true, full: true },
  { label: '★ お店の写真', note: '作業場・仕上がりの見本など', basic: false, full: true },
  { label: '★ 紹介文', note: 'お店の言葉で、得意なこと・こだわりを', basic: false, full: true },
  { label: '★ オプション：市区ページの PR 枠', note: '地域の店の一覧の上に、写真と紹介文つきで表示', basic: false, full: '＋年12,000円〜', opt: true },
  { label: '★ オプション：都道府県ページの PR 枠', note: '県全体の店の一覧の上に、写真と紹介文つきで表示', basic: false, full: '＋年24,000円〜', opt: true },
]

const cell = (v: Cell) =>
  typeof v === 'string' ? <span className="plan-opt-price">{v}</span>
    : v ? <span className="plan-yes" aria-label="あり">●</span> : <span className="plan-no" aria-label="なし">―</span>

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
          <tfoot>
            <tr className="plan-price">
              <th scope="row">料金（税込・1年分）</th>
              <td><b>年12,000円</b><span className="plan-note">月あたり1,000円</span></td>
              <td className="plan-full"><b>年24,000円</b><span className="plan-note">月あたり2,000円</span></td>
            </tr>
          </tfoot>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.label} className={r.basic ? undefined : 'plan-star'}>
                <th scope="row">
                  {r.label}
                  {r.note ? <span className="plan-note">{r.note}</span> : null}
                </th>
                <td>{cell(r.basic)}</td>
                <td className="plan-full">{cell(r.full)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">
        ★は充実掲載だけで載せられる項目です。PR 枠は充実掲載に付けられるオプション（別料金）で、1ページに表示できる店の数には限りがあります。
        料金はすべて税込・1年分の前払い（年払い）で、掲載期間は公開日から1年間です。
      </p>

      <h3>PR 枠の料金（充実掲載のオプション）</h3>
      <div className="panel plan-wrap">
        <table className="plan-table">
          <thead>
            <tr>
              <th scope="col">表示するページ</th>
              <th scope="col">地域</th>
              <th scope="col">料金（税込・1年分）</th>
            </tr>
          </thead>
          <tbody>
            {PR_PRICES.map((p) => (
              <tr key={p.page + p.area}>
                <th scope="row">{p.page}</th>
                <td>{p.area}</td>
                <td><b>＋{p.price}</b><span className="plan-note">{p.month}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">
        PR 枠は、掲載店が3件以上ある市区ページと、すべての都道府県ページで承ります。枠が埋まっているページはお待ちいただく場合があります。
      </p>

      <figure className="listing-fig">
        <img src="/photos/listing-sample-shop.jpg" alt="店ページの掲載イメージ。持ち込みの条件の表が基本掲載、写真と紹介文の欄が充実掲載" loading="lazy" decoding="async" />
        <figcaption>店ページの掲載イメージ（青が基本掲載、オレンジが充実掲載で載る部分）</figcaption>
      </figure>

      <figure className="listing-fig">
        <img src="/photos/listing-sample-city.jpg" alt="市区ページの PR 枠の掲載イメージ。店の一覧の上に、写真と紹介文つきのカードで表示される" loading="lazy" decoding="async" />
        <figcaption>市区ページの PR 枠（掲載イメージ）</figcaption>
      </figure>
      <figure className="listing-fig">
        <img src="/photos/listing-sample-pref.jpg" alt="都道府県ページの PR 枠の掲載イメージ。市区の一覧の下、店の一覧の上に表示される" loading="lazy" decoding="async" />
        <figcaption>都道府県ページの PR 枠（掲載イメージ）</figcaption>
      </figure>

      <h2>お約束していること</h2>
      <ul>
        <li><b>一覧の並び順は、掲載プランによって変わりません。</b></li>
        <li>掲載料をいただいた店には「PR」と表示します（ステルスマーケティング規制への対応です）</li>
        <li>写真は<b>お店から提供いただいたものだけ</b>を載せます</li>
        <li><b>掲載内容の誤りの訂正と削除は、いつでも承ります。</b></li>
      </ul>

      <h2>お申し込みの流れ</h2>
      <ol>
        <li>下のフォームの「掲載・訂正のご依頼」からご連絡ください</li>
        <li>ご用意いただくもの（記入する項目・写真・紹介文）をご案内します</li>
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
