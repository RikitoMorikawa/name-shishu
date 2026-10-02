import { PrGallery } from './PrGallery'
import { prefLabel, type Listing } from '@/lib/listings'

/**
 * **有料掲載（PR）の表示。** 2プラン＋PR 枠（2026-10-02 改定・税込・年払い）：
 *   基本掲載 年12,000円 … 依頼を受けて載せた店。社名横と一覧の「PR」だけ（お店から欄は出ない）
 *   充実掲載 年19,000円 … 写真・紹介文（店ページの「お店から」欄）
 *   PR 枠（広告オプション）… 市区ページ 年20,000円／都道府県ページ 年50,000円。地域ページの一覧の上
 * **料金表は出さない（2026-10-01）。** 商品や内容で値段が変わり、表に収まらない。plans.prices の列は残すが画面には出さない
 * **お金をもらって載せた店は、中身が基本情報だけでも「PR」を付ける**（ステマ規制）。
 *
 * - **必ず「PR」と書く。** 掲載先がお金を払って載せた内容なので、ステマ規制で表示が要る。
 *   **「有料掲載」という言葉は画面に出さない**（2026-09-28・本人の指定）。表示は「PR」だけで足りる
 * - **一覧の順番には効かせない。** PR 枠は一覧とは別の場所に置き、一覧の並びはそのまま
 *   （利用規約と ABOUT で「掲載の順番は料金によって変わらない」と約束している）
 * - 掲載先から申告された事実（納期・郵送など）は listings の項目に入れる。ここに出すのは掲載先の言葉と写真だけ
 */

export function PrPill() {
  return <span className="pill pill-pr">PR</span>
}

/**
 * 店ページの「お店から」欄。無料の店では何も出さない。
 * - **店ページの先頭（ボタンの直下）に置く**（2026-10-02 本人決定）。お金を払って載せた写真と言葉なので、条件の表より先に見せる
 * - PC は写真（左）と紹介文（右・枠つき）を横に並べる。1枚目を大きく、右のサムネイルを押すと切り替わる（PrGallery）
 * - 紹介文は**店の人の言葉だと分かる枠**に入れる（引用の見た目）。本文の説明文と混ざらないように
 */
export function PrSection({ l }: { l: Listing }) {
  const pr = l.pr
  if (!pr) return null
  const hasBody = pr.intro || pr.photos.length
  if (!hasBody) return null
  const main = pr.photos[0]
  return (
    <section className="pr-section" aria-label="お店からのご紹介">
      <h2>
        お店から <PrPill />
      </h2>

      <div className={`pr-body${main && pr.intro ? ' pr-body--two' : ''}`}>
        {main ? <PrGallery photos={pr.photos} name={l.name} /> : null}

        {pr.intro ? (
          <figure className="pr-voice">
            <figcaption className="pr-voice-head">
              <span className="pr-voice-mark" aria-hidden>“</span>
              {l.name}より
            </figcaption>
            <blockquote className="pr-intro">{pr.intro}</blockquote>
          </figure>
        ) : null}
      </div>

      {/* 注記の文は外した（2026-10-02 本人。見出しの「PR」と、連絡先の下の「詳細は公式サイトに」で足りる）。
          写真のクレジットだけは要るので、あるときだけ出す */}
      {pr.credit ? <p className="muted pr-note">{pr.credit}</p> : null}
    </section>
  )
}

/**
 * 市区・県ページの PR 枠。**一覧の上に、一覧とは別の箱として置く。**
 * 無料の店の並び順は変えない。PR の店は下の一覧にもいつもどおりの位置で出る。
 * - **件数の上限は無し。カードは小さめで PC は1段5件、段の余りは空白のまま**（2026-10-02 本人決定）。点線の空き枠カードも試したが出さない
 */
export function PrArea({ items, where }: { items: Listing[]; where: string }) {
  if (!items.length) return null
  return (
    <section className="pr-area" aria-label={`${where}のPR`}>
      <p className="pr-area-head">
        <PrPill /> {where}の掲載店から
      </p>
      <div className="pr-area-list">
        {items.map((l) => (
          <a key={l.slug} className="pr-card" href={`/shop/${l.slug}/`}>
            {l.pr?.photos[0] ? (
              <img src={l.pr.photos[0].src} alt={l.pr.photos[0].alt || `${l.name}の写真`} loading="lazy" decoding="async" />
            ) : null}
            <span className="pr-card-body">
              <b>{l.name}</b>
              <span className="muted">{[l.pref ? prefLabel(l.pref) : null, l.city].filter(Boolean).join('・')}</span>
              {l.pr?.intro ? <span className="pr-card-intro">{clip(l.pr.intro, 70)}</span> : null}
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}

const clip = (s: string, n: number) => ([...s].length > n ? [...s].slice(0, n).join('') + '…' : s)

/**
 * **充実掲載でない店の「お店から」欄。** 写真・紹介文の空き枠を★付きで見せ、掲載のご案内へ送る。
 * 2026-10-01 本人決定：目立たせたほうが店が載せたくなる。最初は1行だけにしていたのを、空き枠を出す形に変えた。
 * - **「有料」「無料」とは書かない**（9/28・9/30 の決めごと）。「まだ載せていません」とだけ言う
 * - 店を探す人が読んでも困らないよう、枠は灰色の点線で控えめにし、店の方への案内は末尾の1か所にまとめる
 */
export function PrEmpty({ l }: { l: Listing }) {
  if (l.pr?.kind === 'full') return null
  const slots = [
    { label: '★ お店の写真', hint: '作業場・仕上がりの見本' },
    { label: '★ 紹介文', hint: '得意なこと・こだわり' },
  ]
  return (
    <section className="pr-empty" aria-label="お店からのご紹介">
      <h2>お店から</h2>
      <div className="pr-empty-slots">
        {slots.map((x) => (
          <div key={x.label} className="pr-empty-slot">
            <b>{x.label}</b>
            <span>{x.hint}</span>
          </div>
        ))}
      </div>
      {/* 店の方への案内はこの1行のリンクだけ（2026-10-01。緑の帯とボタンは目立ちすぎたので外した） */}
      <p className="pr-empty-note">
        この店はまだ、写真・紹介文を載せていません。<a className="pr-empty-link" href="/listing/">掲載のご案内を見る</a>
      </p>
    </section>
  )
}
