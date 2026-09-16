import { byPref, listings, updatedAt } from '@/lib/listings'

export default function Home() {
  const prefs = byPref()
  const kakou = listings.filter((l) => l.kind === 'kakou').length
  const shop = listings.filter((l) => l.kind === 'shop').length

  // AI検索と検索エンジンに、何を集めた場所かを構造で渡す
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'ネーム刺繍ナビ',
    description:
      '作業着・ユニフォームへの名入れを、持ち込みで受けてくれる刺繍の加工屋と作業服店を地域ごとに掲載。',
    inLanguage: 'ja',
    dateModified: updatedAt,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h1>作業着に社名を入れたい。どこに頼めばいいか</h1>
      <p className="lead">
        方法は2つあります。<b>いま持っている服に加工を頼む</b>か、<b>服ごと名入れで買う</b>か。
        前者は刺繍の加工屋、後者は作業服・ユニフォームの店です。
        ここでは全国{listings.length}件（加工屋{kakou}件・店{shop}件）を地域ごとに並べています。
      </p>

      <h2>持ち込みは受けてもらえるのか</h2>
      <p>
        受ける店と受けない店があります。断られる理由はたいてい
        「生地が刺繍に向かない」「1枚だけだと段取りのほうが高くつく」のどちらかで、
        店ごとに<b>持ち込みの可否・最小枚数・納期</b>が違います。
        ここが横に並んでいないので探しにくい、というのがこの媒体を作った理由です。
      </p>
      <p className="unknown">
        ※ その3項目は各社に確認して順に埋めています。まだ空欄の先が多くあります。
      </p>

      <h2>地域から探す</h2>
      <div className="card-list">
        {prefs.map((p) => (
          <a className="card" key={p.prefSlug} href={`/${p.prefSlug}/`}>
            <b>{p.pref}</b>
            <span className="meta">{p.items.length}件</span>
          </a>
        ))}
      </div>

      <h2>この媒体について</h2>
      <p>
        掲載は無料で、掲載先から料金はいただいていません。
        載っている情報は各社の公開情報と、こちらから確認した内容です。
        誤りがあれば直しますので <a href="mailto:contact@umidas.info">contact@umidas.info</a> までお知らせください。
      </p>
      <p className="unknown">最終更新 {updatedAt}</p>
    </>
  )
}
