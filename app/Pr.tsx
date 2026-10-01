import { prefLabel, type Listing } from '@/lib/listings'

/**
 * **有料掲載（PR）の表示。** 2プラン（2026-09-30）：
 *   基本掲載 年6,000円 … 依頼を受けて載せた店。社名横と一覧の「PR」だけ（お店から欄・PR 枠は出ない）
 *   充実掲載 年9,800円 … 写真・紹介文と、地域ページの PR 枠
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

/** 店ページの「お店から」欄。無料の店では何も出さない */
export function PrSection({ l }: { l: Listing }) {
  const pr = l.pr
  if (!pr) return null
  const hasBody = pr.intro || pr.photos.length
  if (!hasBody) return null
  return (
    <section className="pr-section" aria-label="お店からのご紹介">
      <h2>
        お店から <PrPill />
      </h2>

      {pr.photos.length ? (
        <div className="pr-photos">
          {pr.photos.map((p) => (
            <img key={p.src} src={p.src} alt={p.alt || `${l.name}の写真`} loading="lazy" decoding="async" />
          ))}
        </div>
      ) : null}

      {pr.intro ? <p className="pr-intro">{pr.intro}</p> : null}


      <p className="muted pr-note">
        この欄は掲載店から提供された内容です。
        {pr.credit ? <> {pr.credit}。</> : null}
        条件は変わることがあるため、ご依頼の前にお店へご確認ください。
      </p>
    </section>
  )
}

/**
 * 市区・県ページの PR 枠。**一覧の上に、一覧とは別の箱として置く。**
 * 無料の店の並び順は変えない。PR の店は下の一覧にもいつもどおりの位置で出る。
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
