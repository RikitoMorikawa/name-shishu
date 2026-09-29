// slug と都道府県のローマ字。export.mjs と add.mjs が使う。
import { createHash } from 'node:crypto'

// 都道府県 → URL に使うローマ字
export const PREF_ROMAJI = {
  北海道: 'hokkaido', 青森: 'aomori', 岩手: 'iwate', 宮城: 'miyagi', 秋田: 'akita',
  山形: 'yamagata', 福島: 'fukushima', 茨城: 'ibaraki', 栃木: 'tochigi', 群馬: 'gunma',
  埼玉: 'saitama', 千葉: 'chiba', 東京: 'tokyo', 神奈川: 'kanagawa', 新潟: 'niigata',
  富山: 'toyama', 石川: 'ishikawa', 福井: 'fukui', 山梨: 'yamanashi', 長野: 'nagano',
  岐阜: 'gifu', 静岡: 'shizuoka', 愛知: 'aichi', 三重: 'mie', 滋賀: 'shiga',
  京都: 'kyoto', 大阪: 'osaka', 兵庫: 'hyogo', 奈良: 'nara', 和歌山: 'wakayama',
  鳥取: 'tottori', 島根: 'shimane', 岡山: 'okayama', 広島: 'hiroshima', 山口: 'yamaguchi',
  徳島: 'tokushima', 香川: 'kagawa', 愛媛: 'ehime', 高知: 'kochi', 福岡: 'fukuoka',
  佐賀: 'saga', 長崎: 'nagasaki', 熊本: 'kumamoto', 大分: 'oita', 宮崎: 'miyazaki',
  鹿児島: 'kagoshima', 沖縄: 'okinawa',
}

/** **slug は一度公開したら変えない。** 新しい行にだけ、社名のハッシュから作って振る（add.mjs が使う） */
export const makeSlug = (name, pref) =>
  `${PREF_ROMAJI[pref] ?? 'jp'}-${createHash('sha256').update(String(name)).digest('hex').slice(0, 4)}`

