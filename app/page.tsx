import { Filter } from './Filter'
import { Cards } from './ShopCard'
import { guides } from '@/data/guides'
import { IconGuide, IconMap } from './Icons'
import { byPref, listings, listingsByPrefSize, updatedAt } from '@/lib/listings'

export default function Home() {
  const prefs = byPref()
  const kakou = listings.filter((l) => l.kind === 'kakou').length
  const shop = listings.length - kakou

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
      ],
    },
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h1 className="page-title">持ち込みで刺繍・名入れを頼める店を、地域から探す</h1>

      <section className="guides">
        <h2 className="sec-title"><IconGuide size={20} />どこに頼むか迷ったら</h2>
        <div className="guide-grid">
          {guides.map((g) => (
            <a className={`guide-card tone-${g.tone}`} key={g.slug} href={`/guide/${g.slug}/`}>
              <div className="guide-card-top">
                <IconGuide size={30} />
              </div>
              <div className="guide-card-body">
                <b>{g.title}</b>
                <span>{g.excerpt}</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <div className="layout" id="list">
        <Filter
          total={listings.length}
          groups={[
            {
              key: 'kind', label: '種別',
              options: [
                { value: 'kakou', label: '刺繍・名入れの加工屋', count: kakou },
                { value: 'shop', label: '作業服・ユニフォームの店', count: shop },
              ],
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
        </div>
      </div>

      <h2 className="sec-title"><IconMap size={20} />都道府県から探す</h2>
      <div className="pref-grid">
        {prefs.map((p) => (
          <a className="pref-tile" key={p.prefSlug} href={`/${p.prefSlug}/`}>
            <b>{p.pref}</b>
            <span>{p.items.length}</span>
          </a>
        ))}
      </div>

    </>
  )
}
