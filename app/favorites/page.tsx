import type { Metadata } from 'next'
import { FavList, type FavItem } from './FavList'
import { ITEM_LABEL, ITEM_ORDER, listings } from '@/lib/listings'

export const metadata: Metadata = {
  title: 'お気に入り',
  description: 'ネーム刺繍ナビで印を付けた店の一覧です。',
  alternates: { canonical: '/favorites/' },
  // **検索結果に出す意味が無いページ。** 中身は端末ごとに違う
  robots: { index: false, follow: true },
}

/**
 * お気に入り。**保存先はブラウザだけ**（この媒体は DB に繋がない）。
 * 全件を JSON で渡し、どれを出すかはクライアントで決める。
 */
export default function Favorites() {
  const items: FavItem[] = listings.map((l) => ({
    slug: l.slug,
    name: l.name,
    pref: l.pref,
    city: l.city,
    tags: [
      l.mochikomi === true ? '持ち込みOK' : null,
      l.minLot ? l.minLot : null,
      l.lead ? `納期${l.lead}` : null,
      ...ITEM_ORDER.filter((k) => l.items.includes(k)).slice(0, 3).map((k) => ITEM_LABEL[k]),
    ].filter(Boolean) as string[],
  }))

  return (
    <div className="wrap">
      <p className="crumb"><a href="/">ネーム刺繍ナビ</a> ／ お気に入り</p>
      <h1>お気に入り</h1>
      <p className="lead">
        印を付けた店です。<b>この端末のブラウザにだけ残ります</b> ―
        会員登録の仕組みを持たないので、別の端末には引き継がれません。
      </p>
      <FavList items={items} />
    </div>
  )
}
