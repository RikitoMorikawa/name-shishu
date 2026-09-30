import { prefLabel, type Listing } from '@/lib/listings'

/**
 * **有料掲載（PR）の表示。** 2プラン（2026-09-30）：
 *   基本掲載 年6,000円 … 依頼を受けて載せた店。社名横と一覧の「PR」だけ（お店から欄・PR 枠は出ない）
 *   充実掲載 年9,800円 … 写真・紹介文・料金表と、地域ページの PR 枠
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
  const hasBody = pr.intro || pr.prices.length || pr.photos.length
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

      {pr.prices.length ? (
        <div className="panel">
          <table className="facts">
            <caption className="pr-caption">料金表（お店の掲載内容）</caption>
            <tbody>
              {pr.prices.map((r) => (
                <tr key={r.item}>
                  <th>{r.item}</th>
                  <td>{r.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <p className="muted pr-note">
        この欄は掲載店から提供された内容です。
        {pr.credit ? <> {pr.credit}。</> : null}
        料金や条件は変わることがあるため、ご依頼の前にお店へご確認ください。
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
