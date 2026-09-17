import { Filter } from './Filter'
import { Cards } from './ShopCard'
import { guides } from '@/data/guides'
import { HeroSearch } from './HeroSearch'
import { Photo, hasPhoto } from './Photo'
import {
  IconArrow, IconBag, IconCap, IconFlag, IconGuide,
  IconMap, IconTee, IconTowel, IconWappen,
} from './Icons'
import {
  ITEM_LABEL, ITEM_ORDER, byPref, itemCounts, listings, listingsByPrefSize,
  prefLabel, prefOptions, updatedAt, type ItemKey,
} from '@/lib/listings'

/** 品目の帯。**データの軸そのもの** ― 押すと下の一覧がその品目に絞られる */
const ITEM_ICON: Record<ItemKey, (p: { size?: number }) => React.ReactElement> = {
  wear: IconTee, cap: IconCap, towel: IconTowel, bag: IconBag, wappen: IconWappen, flag: IconFlag,
}
const ITEM_LEAD: Record<ItemKey, string> = {
  wear: '作業着・ユニフォーム・Tシャツ',
  cap: 'キャップ・ニット帽',
  towel: 'タオル・ハンカチ',
  bag: 'トート・エコバッグ',
  wappen: 'ワッペン・エンブレム',
  flag: 'のれん・旗・幕',
}

/** よくある入口。**媒体の言葉ではなく、探している人の言葉で書く** */
/**
 * 人物イラストは**ソコスト**（https://soco-st.com/）。商用可・クレジット不要・
 * 色変更とトリミング可。**直リンクは規約で禁止**なので public/illust/ に落としてある。
 */
const WORRIES = [
  // **素材ごとに人物の占有率が違う。** 枠(104x92)に max- でフィットさせるため、横長素材は
  // 幅基準で1点だけ大きく見える。その場合だけ scale で見た目の大きさを揃える
  { q: '手持ちの作業着に社名を入れたい', a: '持ち込みを受けている店だけに絞れます', href: '#list', img: '/illust/worry-1.svg', scale: 1 },
  { q: '1枚からでも対応してくれる店を探したい', a: '最小枚数が分かっている店は条件を出しています', href: '#list', img: '/illust/worry-2.svg', scale: 1 },
  { q: '近くの刺繍屋さんをすぐに見つけたい', a: '都道府県・市区町村から辿れます', href: '#area', img: '/illust/worry-3.svg', scale: 1 },
]

export default function Home() {
  const prefs = byPref()
  const counts = itemCounts(listings)
  const top = prefs.slice(0, 5)
  // タイルに出していない残りの地域。件数も足して「その他」の中身を示す
  const rest = prefs.slice(5)
  const restCount = rest.reduce((n, p) => n + p.items.length, 0)

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'ネーム刺繍ナビ',
      description:
        '持ち込みで刺繍・名入れを受けてくれる加工屋を地域ごとに掲載。服・帽子・タオル・カバン・ワッペンに対応。',
      inLanguage: 'ja',
      dateModified: updatedAt,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: '持ち込んだ品に刺繍や名入れを頼めますか',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '刺繍・名入れの加工屋が受けています。対象は作業着やユニフォームだけでなく、帽子・タオル・カバン・ワッペンなど幅広く、店によって扱える品目と生地が異なります。持ち込みの可否・最小枚数・納期は店ごとに違います。',
          },
        },
        {
          '@type': 'Question',
          name: '1枚だけでも刺繍を入れてもらえますか',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '店によります。最小枚数を公表している店は、ネーム刺繍ナビの一覧に「最小」として条件を出しています。公表していない店は「確認中」と表示し、推測では書いていません。',
          },
        },
      ],
    },
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── ヒーロー。**全幅の写真の上に、見出しと検索** ─────────────── */}
      <section className="hero">
        <div className="hero-photo">
          <Photo src="/photos/hero.jpg" alt="刺繍を入れた帽子とトートバッグ、作業着と刺繍糸" />
        </div>
        <div className="wrap hero-inner">
          <div className="hero-main">
            <h1>
              持ち込みで<br />
              刺繍・名入れを頼める店を、<br />
              <em>地域</em>から探す
            </h1>
            {/* **件数の言い方に気をつける。** {listings.length}件すべてが持ち込み可では
                ないので、「持ち込みOKの◯件」とは書かない（確認できたのは一部） */}
            <p className="hero-sub">
              作業着・ユニフォーム・Tシャツ・バッグなど、<br />
              刺繍・名入れの加工店{listings.length}件を都道府県・市区町村から。<br />
              持ち込みの可否は、確認できた店から順に出しています。
            </p>
          </div>
          <HeroSearch prefs={prefOptions()} popular={top.map((p) => p.prefSlug)} />
          <p className="hand hero-hand" aria-hidden>
            <span>いつもの一着が、</span>
            <span>もっと特別に。</span>
          </p>
        </div>
      </section>

      {/* ── 品目の帯。押すと下の一覧が絞られる ───────────────────── */}
      <nav className="items-bar" aria-label="刺繍を入れる対象から探す">
        <div className="wrap">
          {ITEM_ORDER.map((k) => {
            const Icon = ITEM_ICON[k]
            return (
              <a className="item-cell" key={k} href="#list" data-jump-item={k}>
                <Icon size={34} />
                <b>{ITEM_LABEL[k]}に</b>
                <span>{ITEM_LEAD[k]}</span>
                <em>{counts[k]}件</em>
              </a>
            )
          })}
        </div>
      </nav>

      {/* ── 悩み ──────────────────────────────────────── */}
      <section className="worry">
        <div className="wrap">
          <h2 className="mid-title">こんなお悩みはありませんか？</h2>
          <div className="worry-grid">
            {WORRIES.map((w) => (
              <a className="worry-card" key={w.q} href={w.href}>
                <span className="worry-face" aria-hidden>
                  <img src={w.img} alt="" loading="lazy" style={w.scale === 1 ? undefined : { transform: `scale(${w.scale})` }} />
                </span>
                <span className="worry-body">
                  <b>{w.q}</b>
                  <span>{w.a}</span>
                </span>
              </a>
            ))}
          </div>
          <p className="hand worry-hand">その想い、<br />ネーム刺繍ナビが<br />お手伝いします。</p>
        </div>
      </section>

      {/* ── エリアから探す ───────────────────────────────── */}
      <section className="area" id="area">
        <div className="wrap">
          <h2 className="mid-title">エリアから探す</h2>
          <p className="mid-lead">お住まいの地域から、持ち込み対応の刺繍・名入れ店を探せます。</p>
          <p className="script area-script" aria-hidden>Find Your Local Partner</p>
          <div className="area-grid">
            {top.map((p) => (
              <a className="area-tile" key={p.prefSlug} href={`/${p.prefSlug}/`}>
                <Photo src={`/photos/area-${p.prefSlug}.jpg`} alt="" />
                <span className="area-name">
                  <b>{prefLabel(p.pref)}</b>
                  <em>{p.items.length}件</em>
                </span>
              </a>
            ))}
            {/* **残りが何県あるかを見せる。**「その他」だけだと自分の地域があるか分からない */}
            <a className="area-tile area-more" href="#all-pref">
              <span className="more-face">
                <b>+{rest.length}</b>
                <em>地域</em>
              </span>
              <span className="area-name">
                <b>その他のエリア</b>
                <em>{restCount}件</em>
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* ── 全件。**この媒体の中身そのもの。** 絞り込みは DOM を隠すだけ ────── */}
      <div className="wrap" id="list">
        <h2 className="sec-title"><IconGuide size={20} />掲載店を条件で比べる</h2>
        <p className="lead">
          持ち込み・最小枚数・納期・料金の目安を横に並べています。
          <b>確認できていない項目は「確認中」と出し、推測では書きません。</b>
        </p>
        <div className="layout">
          <Filter
            total={listings.length}
            groups={[
              {
                key: 'items', label: '刺繍を入れる対象',
                options: ITEM_ORDER.map((k) => ({ value: k, label: ITEM_LABEL[k], count: counts[k] })),
              },
              {
                key: 'mochikomi', label: '持ち込み',
                options: [{ value: 'yes', label: '受けている店だけ', count: listings.filter((l) => l.mochikomi === true).length }],
              },
              {
                key: 'pref', label: '地域',
                options: prefs.map((p) => ({ value: p.prefSlug, label: p.pref, count: p.items.length })),
              },
            ]}
          />
          <div>
            <Cards items={listingsByPrefSize()} />
            {/* 「もっと見る」の置き場。**中身は Filter が portal で描く**（状態を1か所に持つため）。
                静的HTMLでは空のまま ― JS を実行しないクローラーには全件がそのまま見える */}
            <div id="more-slot" />
          </div>
        </div>

        <h2 className="sec-title" id="all-pref"><IconMap size={20} />都道府県から探す</h2>
        <div className="pref-grid">
          {prefs.map((p) => (
            <a className="pref-tile" key={p.prefSlug} href={`/${p.prefSlug}/`}>
              <b>{prefLabel(p.pref)}</b>
              <span>{p.items.length}</span>
            </a>
          ))}
        </div>
      </div>

      {/* ── ABOUT ────────────────────────────────────── */}
      <section className="about-band" id="about">
        <div className="wrap">
          <div className="about-photo">
            <Photo src="/photos/about.jpg" alt="" label="ネーム刺繍" />
          </div>
          <div className="about-text">
            <p className="eyebrow">ABOUT</p>
            <h2>持ち込みの刺繍・名入れで<br />もっと身近に、もっと自由に。</h2>
            {/* **改行で語の間に空きが入る。** 1文は1行で書く */}
            <p>ネーム刺繍ナビは、作業着やユニフォーム、Tシャツ、バッグなどお持ち込みの製品に刺繍・名入れを対応してくれるお店を、地域から探せる情報サイトです。</p>
            <p>あなたの「この一着に、名前を入れたい」という想いに、ぴったりのお店がきっと見つかります。</p>
            <a className="btn" href="#contact">お問い合わせ<IconArrow size={18} /></a>
          </div>
          <p className="script about-script" aria-hidden>Good Work<br />Better Tomorrow</p>
        </div>
      </section>

      {/* ── 読み物 ────────────────────────────────────── */}
      <section className="guides" id="guides">
        <div className="wrap">
          <h2 className="sec-title"><IconGuide size={20} />どこに頼むか迷ったら</h2>
          <div className="guide-grid">
            {guides.map((g) => (
              <a className={`guide-card tone-${g.tone}`} key={g.slug} href={`/guide/${g.slug}/`}>
                {/* サムネイルがあれば写真、無ければ今までどおり色面にアイコン */}
                {hasPhoto(`/photos/guide-${g.slug}.jpg`) ? (
                  <div className="guide-card-photo">
                    <img src={`/photos/guide-${g.slug}.jpg`} alt="" loading="lazy" />
                  </div>
                ) : (
                  <div className="guide-card-top">
                    <IconGuide size={30} />
                  </div>
                )}
                <div className="guide-card-body">
                  <b>{g.title}</b>
                  <span>{g.excerpt}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

    </>
  )
}
