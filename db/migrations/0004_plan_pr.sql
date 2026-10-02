-- PR 枠を掲載プランから切り離し、広告オプションにする（2026-10-02・本人決定）。
--   pr_city … 市区ページの PR 枠（年20,000円・税込）を付けた契約
--   pr_pref … 都道府県ページの PR 枠（年50,000円・税込）を付けた契約
-- 充実掲載（年19,000円）だけでは枠に出ない。**10/2 までに旧条件（充実掲載に PR 枠込み）で案内した8社**が
-- 充実掲載で申し込んだときは、契約期間中は両方 1 にする（約束を守る）。
ALTER TABLE plans ADD COLUMN pr_city INTEGER NOT NULL DEFAULT 0;
ALTER TABLE plans ADD COLUMN pr_pref INTEGER NOT NULL DEFAULT 0;
