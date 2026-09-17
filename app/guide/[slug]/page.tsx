import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { findGuide, guides, type Block } from '@/data/guides'
import { fillStats } from '@/lib/listings'
import { hasPhoto } from '../../Photo'

const SITE = 'https://name-shishu.com'

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const g = findGuide(slug)
  if (!g) return {}
  // **サムネイルがあれば OGP に使う。** 無ければ既定のサイト画像のまま
  const thumb = `/photos/guide-${g.slug}.jpg`
  return {
    title: g.title,
    description: g.excerpt,
    alternates: { canonical: `/guide/${g.slug}/` },
    ...(hasPhoto(thumb)
      ? {
          openGraph: { type: 'article', images: [{ url: thumb, width: 1200, height: 800 }] },
          twitter: { card: 'summary_large_image', images: [thumb] },
        }
      : {}),
  }
}

/** 見出しのアンカー。**目次から飛ぶのと、検索結果から節に直接入るのに要る** */
const headId = (h: string) => 'h' + [...h].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 99991, 7).toString(36)

/** 印（{{total}} など）をいまの数字に置き換える */
const fill = (t: string) => fillStats(t)

/**
 * h2 が来るたびに区切って、節ごとに枠で囲えるようにする。
 * **最初の h2 より前は導入**として、見出しの無い節にまとめる。
 */
function toSections(body: Block[]) {
  const out: { h?: string; blocks: Block[] }[] = []
  for (const b of body) {
    if (b.h) out.push({ h: b.h, blocks: [{ ...b, h: undefined }] })
    else if (!out.length) out.push({ blocks: [b] })
    else out[out.length - 1].blocks.push(b)
  }
  return out
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const g = findGuide(slug)
  if (!g) notFound()

  const sections = toSections(g.body)
  const heads = g.body.filter((b) => b.h).map((b) => b.h!)
  const others = guides.filter((x) => x.slug !== g.slug)
  const thumb = `/photos/guide-${g.slug}.jpg`

  /**
   * 構造化データ。**Article と BreadcrumbList と FAQPage の3つ。**
   * AI 検索は「問いと答えの組」を拾うので、FAQPage が効く。
   * 答えは掲載データで確かめた範囲だけにしてある（推測を構造化データに載せない）。
   */
  const jsonLd: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: g.title,
      description: g.excerpt,
      inLanguage: 'ja',
      datePublished: g.updated,
      dateModified: g.updated,
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE}/guide/${g.slug}/` },
      ...(hasPhoto(thumb) ? { image: [`${SITE}${thumb}`] } : {}),
      author: { '@type': 'Organization', name: 'UMIDAS' },
      publisher: { '@type': 'Organization', name: 'ネーム刺繍ナビ' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ネーム刺繍ナビ', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: '読み物', item: `${SITE}/#guides` },
        { '@type': 'ListItem', position: 3, name: g.title, item: `${SITE}/guide/${g.slug}/` },
      ],
    },
  ]
  if (g.faq?.length) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: g.faq.map((f) => ({
        '@type': 'Question',
        name: fill(f.q),
        acceptedAnswer: { '@type': 'Answer', text: fill(f.a) },
      })),
    })
  }

  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="prose guide">
        <p className="crumb"><a href="/">ネーム刺繍ナビ</a> ／ 読み物</p>
        <h1>{g.title}</h1>
        <p className="lead">{fill(g.lead)}</p>
        <p className="guide-meta">最終更新 {g.updated}</p>

        {hasPhoto(thumb) ? (
          <div className="guide-hero">
            <img src={thumb} alt="" />
          </div>
        ) : null}

        {/* 目次。**節が3つ以上のときだけ出す** ― 2つでは場所を取るだけ */}
        {heads.length >= 3 ? (
          <nav className="guide-toc" aria-label="目次">
            <b>この記事の内容</b>
            <ol>
              {heads.map((h) => (
                <li key={h}><a href={`#${headId(h)}`}>{h}</a></li>
              ))}
            </ol>
          </nav>
        ) : null}

        {/* **節ごとに枠で囲う。** 長い文章は、どこまでが1つの話かが見えないと読み進められない */}
        {sections.map((sec, si) => (
        <section className={`guide-sec${sec.h ? '' : ' is-intro'}`} key={si}>
        {sec.h ? <h2 id={headId(sec.h)}>{sec.h}</h2> : null}
        {sec.blocks.map((b, i) => (
          <div key={i}>
            {b.p ? <p dangerouslySetInnerHTML={{ __html: fill(b.p) }} /> : null}
            {b.ul ? (
              <ul>
                {b.ul.map((li, j) => <li key={j} dangerouslySetInnerHTML={{ __html: fill(li) }} />)}
              </ul>
            ) : null}
            {/* 比較表。**横に溢れるので枠ごと横スクロールにする**（スマホで切れないように） */}
            {b.table ? (
              <div className="table-wrap">
                <table className="guide-table">
                  <thead>
                    <tr>{b.table.head.map((h, j) => <th key={j} dangerouslySetInnerHTML={{ __html: h }} />)}</tr>
                  </thead>
                  <tbody>
                    {b.table.rows.map((r, j) => (
                      <tr key={j}>
                        {r.map((c, k) =>
                          k === 0
                            ? <th key={k} scope="row" dangerouslySetInnerHTML={{ __html: c }} />
                            : <td key={k} dangerouslySetInnerHTML={{ __html: fill(c) }} />,
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            {/* 掲載データから数えた事実。**この媒体にしかない情報なので目立たせる** */}
            {b.stat ? (
              <div className="stat-row">
                {b.stat.map((x, j) => (
                  <div className="stat" key={j}>
                    <b>{fill(x.value)}</b>
                    <span>{fill(x.label)}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {b.point ? <p className="point" dangerouslySetInnerHTML={{ __html: fill(b.point) }} /> : null}
            {b.note ? <div className="callout" dangerouslySetInnerHTML={{ __html: fill(b.note) }} /> : null}
          </div>
        ))}
        </section>
        ))}

        {g.faq?.length ? (
          <section className="faq">
            <h2 id="faq">よくある質問</h2>
            {g.faq.map((f) => (
              <details key={f.q}>
                <summary>{fill(f.q)}</summary>
                <p>{fill(f.a)}</p>
              </details>
            ))}
          </section>
        ) : null}

        <div className="guide-foot">
          <a className="btn" href="/#list">掲載店を条件で比べる</a>
          <a className="btn btn-ghost" href="/#area">地域から探す</a>
        </div>

        {others.length ? (
          <section className="guide-next">
            <h2>ほかの読み物</h2>
            <div className="guide-grid">
              {others.map((x) => (
                <a className={`guide-card tone-${x.tone}`} key={x.slug} href={`/guide/${x.slug}/`}>
                  {hasPhoto(`/photos/guide-${x.slug}.jpg`) ? (
                    <div className="guide-card-photo">
                      <img src={`/photos/guide-${x.slug}.jpg`} alt="" loading="lazy" />
                    </div>
                  ) : null}
                  <div className="guide-card-body">
                    <b>{x.title}</b>
                    <span>{x.excerpt}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </div>
  )
}
