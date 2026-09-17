import { Filter } from './Filter'
import { Cards } from './ShopCard'
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
      ],
    },
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h1>作業着に社名を入れたい。どこに頼めばいいか</h1>
      <p className="lead">
        <b>いま持っている服に加工を頼む</b>なら刺繍の加工屋、<b>服ごと名入れで買う</b>なら作業服・ユニフォームの店。
        全国{listings.length}件（加工屋{kakou}・店{shop}）を地域から探せます。
      </p>

      <div className="layout">
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

      <h2>都道府県から探す</h2>
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
