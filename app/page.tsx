import { Filter } from './Filter'
import { RowsHead, ShopRow } from './ShopRow'
import { byPref, listings, updatedAt } from '@/lib/listings'

export default function Home() {
  const prefs = byPref()
  const kakou = listings.filter((l) => l.kind === 'kakou').length
  const shop = listings.length - kakou
  const known = listings.filter((l) => l.mochikomi !== null).length

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'ネーム刺繍ナビ',
      description:
        '作業着・ユニフォームへの名入れを、持ち込みで受けてくれる刺繍の加工屋と作業服店を地域ごとに掲載。',
      inLanguage: 'ja',
      dateModified: updatedAt,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: '作業着に社名を入れたいとき、どこに頼めばいいですか',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '方法は2つあります。いま持っている服に加工だけ頼む場合は刺繍の加工屋へ、服ごと名入れで買う場合は作業服・ユニフォームの店へ依頼します。',
          },
        },
        {
          '@type': 'Question',
          name: '持ち込んだ服に刺繍を入れてもらえますか',
          acceptedAnswer: {
            '@type': 'Answer',
            text: '受ける店と受けない店があります。断られる主な理由は、生地が刺繍に向かないことと、1枚だけでは段取りのほうが高くつくことです。店ごとに持ち込みの可否・最小枚数・納期が異なります。',
          },
        },
      ],
    },
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h1>作業着に社名を入れたい。どこに頼めばいいか</h1>
      <p className="lead">
        方法は2つあります。<b>いま持っている服に加工を頼む</b>か、<b>服ごと名入れで買う</b>か。
        前者は刺繍の加工屋、後者は作業服・ユニフォームの店です。
      </p>

      <div className="stats">
        <div className="stat"><b>{listings.length}</b><span>掲載している先</span></div>
        <div className="stat"><b>{kakou}</b><span>刺繍・名入れの加工屋</span></div>
        <div className="stat"><b>{shop}</b><span>作業服・ユニフォームの店</span></div>
        <div className="stat"><b>{prefs.length}</b><span>都道府県</span></div>
      </div>

      <h2>地域から探す</h2>
      <div className="pref-grid">
        {prefs.map((p) => (
          <a className="pref-tile" key={p.prefSlug} href={`/${p.prefSlug}/`}>
            <b>{p.pref}</b>
            <span>{p.items.length}</span>
          </a>
        ))}
      </div>

      <h2>持ち込みは受けてもらえるのか</h2>
      <p>
        受ける店と受けない店があります。断られる理由はたいてい
        <b>「生地が刺繍に向かない」</b>か<b>「1枚だけだと段取りのほうが高くつく」</b>のどちらかです。
        つまり <b>持ち込みの可否・最小枚数・納期</b> は店ごとに違い、
        それが横に並んでいないので探しにくい。ここを並べるために作りました。
      </p>
      <div className="callout">
        <b>確認できているのは {known} / {listings.length} 件です。</b>
        残りは各社に問い合わせて順に埋めています。
        <b>推測では書きません。</b>分からない項目は「確認中」と出しています。
      </div>

      <h2>全国の一覧から探す</h2>
      <Filter total={listings.length} />
      <div className="rows">
        <RowsHead />
        {listings.map((l) => (
          <ShopRow key={l.slug} l={l} />
        ))}
      </div>

      <h2>この媒体について</h2>
      <p>
        掲載は無料で、掲載先から料金はいただいていません。
        運営は森川力人（元・作業服／ユニフォーム商社の営業）。
        誤りがあれば直しますので <a href="mailto:contact@umidas.info">contact@umidas.info</a> までお知らせください。
      </p>
      <p className="muted">最終更新 {updatedAt}</p>
    </>
  )
}
