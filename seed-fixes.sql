-- ============================================================
-- Pre-publish data reconciliation for baby-stocks
-- Idempotent: safe to run against an already-seeded database.
-- Run this against the live Supabase project once, then it's
-- also mirrored into supabase-schema.sql for future fresh installs.
-- ============================================================

-- 1. gender (flagship market — missing from the original seed)
INSERT INTO public.markets (slug, title_he, market_type, options, reveal_order)
VALUES (
  'gender',
  'בן או בת?',
  'binary',
  '[{"id":"boy","label_he":"בן","pool":500},{"id":"girl","label_he":"בת","pool":500}]'::JSONB,
  1
)
ON CONFLICT (slug) DO UPDATE SET
  title_he     = EXCLUDED.title_he,
  market_type  = EXCLUDED.market_type,
  options      = EXCLUDED.options,
  reveal_order = EXCLUDED.reveal_order,
  updated_at   = NOW();

-- 4. name — replace placeholder options with the real 9 candidate names
INSERT INTO public.markets (slug, title_he, market_type, options, reveal_order)
VALUES (
  'name',
  'שם',
  'multiple',
  '[{"id":"name1","label_he":"נבו","pool":500},{"id":"name2","label_he":"מיכאל","pool":500},{"id":"name3","label_he":"כרמי","pool":500},{"id":"name4","label_he":"רום","pool":500},{"id":"name5","label_he":"סיני","pool":500},{"id":"name6","label_he":"רפאל","pool":500},{"id":"name7","label_he":"עידו","pool":500},{"id":"name8","label_he":"ארבל","pool":500},{"id":"name9","label_he":"לני","pool":500}]'::JSONB,
  4
)
ON CONFLICT (slug) DO UPDATE SET
  title_he     = EXCLUDED.title_he,
  market_type  = EXCLUDED.market_type,
  options      = EXCLUDED.options,
  reveal_order = EXCLUDED.reveal_order,
  updated_at   = NOW();

-- 10. looks-like — renumbered from 13 to close the gap left by adding gender
INSERT INTO public.markets (slug, title_he, market_type, options, reveal_order)
VALUES (
  'looks-like',
  'דומה יותר ל...',
  'multiple',
  '[{"id":"mom","label_he":"ניץ","pool":500},{"id":"dad","label_he":"עומר","pool":500}]'::JSONB,
  10
)
ON CONFLICT (slug) DO UPDATE SET
  title_he     = EXCLUDED.title_he,
  market_type  = EXCLUDED.market_type,
  options      = EXCLUDED.options,
  reveal_order = EXCLUDED.reveal_order,
  updated_at   = NOW();

-- 11. first-cry — renumbered from 14 to close the gap left by adding gender
INSERT INTO public.markets (slug, title_he, market_type, options, reveal_order)
VALUES (
  'first-cry',
  'מי יבכה ראשון?',
  'multiple',
  '[{"id":"baby","label_he":"התינוק","pool":500},{"id":"mom","label_he":"ניץ","pool":500},{"id":"dad","label_he":"עומר","pool":500},{"id":"grandparents","label_he":"סבא/סבתא","pool":500}]'::JSONB,
  11
)
ON CONFLICT (slug) DO UPDATE SET
  title_he     = EXCLUDED.title_he,
  market_type  = EXCLUDED.market_type,
  options      = EXCLUDED.options,
  reveal_order = EXCLUDED.reveal_order,
  updated_at   = NOW();
