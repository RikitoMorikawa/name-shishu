-- 有料掲載を2プランに分ける（2026-09-30・本人決定）。
--   basic … 基本掲載 年6,000円（税込）。**掲載のご依頼を受けて載せる店**。中身は listings の基本情報だけ
--   full  … 充実掲載 年9,800円（税込）。写真・紹介文・料金表・市区/県ページの PR 枠（基本情報も含む）
-- こちらが自主的に載せた店は無料のまま（plans に行を持たない）。どちらのプランも「PR」は付ける。
ALTER TABLE plans ADD COLUMN kind TEXT NOT NULL DEFAULT 'full' CHECK (kind IN ('basic', 'full'));
