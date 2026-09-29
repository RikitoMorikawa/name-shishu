-- ネーム刺繍ナビの掲載 DB（Turso `name-shishu`）。2026-09-29 に hp/001 の営業台帳（prospects）から分けた。
--
-- **ここには公開してよいものだけを入れる。** 営業のメモ・理由・メールアドレス・送信履歴は
-- 営業台帳にだけあり、この DB には1列も無い。列を足すときは「サイトに出してよいか」で決める。
-- 例外は hint_addr / hint_tel の2列だけ（下の注記）。
--
-- 分けた理由：営業で見送りにすると掲載まで消えて公開中のページが 404 になった。
-- 営業の判断（決裁者に届くか・連絡経路があるか）と掲載の判断（刺繍を請ける加工屋か）は別物。

CREATE TABLE listings (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  -- **URL の一部。一度公開したら変えない。** 社名の sha256 の先頭4桁（`tokyo-3f2a`）。
  -- 営業台帳の id を使わないのは、連番だと営業リストの規模が推測できるから
  slug        TEXT NOT NULL UNIQUE,
  -- 営業台帳とつなぐ鍵。**Places の規約で無期限に保存してよいのは place_id だけ**。
  -- 分かっていない古い行は NULL
  place_id    TEXT UNIQUE,
  name        TEXT NOT NULL,
  pref        TEXT NOT NULL,              -- 「東京」の形（都府県を付けない）。表示だけ正式名にする
  url         TEXT NOT NULL,              -- 公式サイト（無ければ Instagram など本人が運用しているページ）

  -- **公式サイトで確認できた住所と電話だけ。** Places 由来のものは載せない（規約にキャッシュの例外が無い）
  address     TEXT,
  addr_state  TEXT,                       -- verified / city-only / site-only / unverified
  tel         TEXT,

  -- 比較行の4項目。確認できないものは NULL のまま「確認中」と出す。推測で埋めない
  mochikomi   INTEGER,                    -- 1=受けている / 0=受けていない / NULL=確認中
  min_lot     TEXT,
  lead_time   TEXT,
  price_from  TEXT,
  items       TEXT,                       -- JSON 配列（wear/cap/towel/bag/wappen/flag）
  -- 各社ページにだけ出す3つ
  shipping    INTEGER,
  data_fee    TEXT,
  ng_material TEXT,
  note        TEXT,
  -- **根拠の原文。** 項目名 → 拾った前後の文。人が読み返せない抽出は、間違っていても気づけない
  terms_src   TEXT,

  -- 掲載するか。**非掲載にしても行は消さない**（消すと次の検索でまた拾って同じ調査を繰り返す）
  status      TEXT NOT NULL DEFAULT '掲載',   -- 掲載 / 非掲載
  hide_reason TEXT,

  -- **照合用の一時列。サイトには出さない。** Places の住所と電話で、公式サイトの住所が
  -- 同じ店のものかを突き合わせる（verify.mjs）。裏取りが済んだら消す（規約上、持ち続けない）
  hint_addr   TEXT,
  hint_tel    TEXT,

  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_listings_pref ON listings(pref, name);

-- 有料掲載（年9,800円・税込）。**入金を確かめてから1行足す。** until を過ぎた行はビルド時に外れる。
-- 掲載の順番には一切効かせない（利用規約で「順番は料金によって変わらない」と約束している）
CREATE TABLE plans (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id  INTEGER NOT NULL REFERENCES listings(id),
  since       TEXT NOT NULL,              -- 掲載開始日
  until       TEXT NOT NULL,              -- 掲載期限（請求した期間の最終日）
  amount      INTEGER,                    -- 請求額（税込）
  paid_on     TEXT,                       -- 入金を確かめた日
  intro       TEXT,                       -- 紹介文（掲載先が書いたものを整えて載せる）
  prices      TEXT,                       -- JSON 配列 [{ item, price }]
  credit      TEXT,                       -- 写真のクレジット「写真提供：〇〇」
  memo        TEXT,                       -- 請求書番号など。**サイトには出さない**
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 掲載先から提供してもらった写真だけ。各社サイトや Places からの転載は不可（著作権・規約）。
-- plan_id があれば有料掲載の写真、無ければ一覧の1枚（photos.json の置き換え）
CREATE TABLE photos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id  INTEGER NOT NULL REFERENCES listings(id),
  plan_id     INTEGER REFERENCES plans(id),
  src         TEXT NOT NULL,              -- /photos/<slug>-1.jpg
  alt         TEXT,
  credit      TEXT,
  sort        INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
