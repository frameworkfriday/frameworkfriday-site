-- ============================================================
-- 014_ds_graduate_onboarding_rewrite.sql
-- ============================================================
-- Rewrites the onboarding checklist to reflect the DS Graduate
-- → Forum Transition journey (D-1 of the L1 DS Graduate evolution).
--
-- Supersedes migration 013 (remove comms channel item) — that
-- migration only patched the old list. This migration replaces
-- ALL items, making 013's partial delete a no-op if 013 runs
-- first (idempotent by design: we delete everything regardless).
--
-- Changes:
--   1. Adds `path` column to onboarding_items (nullable text).
--      NULL = visible to all paths.
--      'ds-graduate' = DS Graduate path only.
--      'internal' = Internal Participant path only.
--   2. Clears all existing onboarding_progress (FK dependency).
--   3. Clears all existing onboarding_items.
--   4. Seeds new items: shared, ds-graduate, and internal paths.
-- ============================================================


-- ── Step 1: Add path column ──────────────────────────────────

alter table onboarding_items
  add column if not exists path text default null;

comment on column onboarding_items.path is
  'Participant path this item applies to. NULL = all paths. '
  'Values: ''ds-graduate'', ''internal''.';


-- ── Step 2: Clear existing progress (FK constraint) ─────────

delete from onboarding_progress;


-- ── Step 3: Clear existing onboarding items ─────────────────

delete from onboarding_items;


-- ── Step 4: Seed new items ───────────────────────────────────
--
-- Position numbering is path-scoped:
--   Shared items anchor the journey start and end.
--   DS Graduate items fill positions 2-5 (between shared items).
--   Internal items fill positions 2-3 (between shared items).
--
-- path = NULL  → visible to everyone
-- path = 'ds-graduate' → DS graduates only
-- path = 'internal'    → internal participants only
-- ─────────────────────────────────────────────────────────────

insert into onboarding_items
  (title, description, action_url, action_label, position, is_required, path)
values

  -- ── SHARED: Step 1 — Welcome & Orientation ──────────────────
  (
    'Welcome to Forum',
    'Watch the Forum intro video to understand what Forum is, how it works, and what to expect from your first session.',
    null,
    'Watch intro video',
    1,
    true,
    null
  ),

  -- ── DS GRADUATE: Step 2 — Tool setup ────────────────────────
  (
    'Set up your tools',
    'Install Claude Code and make sure you have a GitHub account. These are the two tools your Friday OS instance runs on.',
    null,
    'Setup guide',
    2,
    true,
    'ds-graduate'
  ),

  -- ── DS GRADUATE: Step 3 — Clone starter repo ────────────────
  (
    'Clone your Friday OS Starter Repo',
    'Clone the Friday OS template repo to your GitHub account. This becomes your personal Company OS instance — where all your Forum work lives.',
    null,
    'Clone repo',
    3,
    true,
    'ds-graduate'
  ),

  -- ── DS GRADUATE: Step 4 — Import DS work ────────────────────
  (
    'Import your Decision Sprint work',
    'Use /ds-import inside Claude Code to bring your Decision Sprint artifacts (blueprints, decisions, context) into your Friday OS instance.',
    null,
    'Run /ds-import',
    4,
    true,
    'ds-graduate'
  ),

  -- ── DS GRADUATE: Step 5 — First workflow build ──────────────
  (
    'Build your first workflow',
    'Use /workflow-strategist to take one blueprint from your Decision Sprint and turn it into a working implementation. This is Forum in action.',
    null,
    'Run /workflow-strategist',
    5,
    true,
    'ds-graduate'
  ),

  -- ── INTERNAL: Step 2 — Explore Forum HQ ─────────────────────
  (
    'Get familiar with Forum HQ',
    'Explore the dashboard, announcements, and resources sections. These are the primary surfaces you''ll use as an internal participant.',
    null,
    'Explore dashboard',
    2,
    true,
    'internal'
  ),

  -- ── INTERNAL: Step 3 — Review cohort journey ────────────────
  (
    'Review this cohort''s journey',
    'Read through what Decision Sprint graduates bring into Forum and where they''re headed. Understanding their context makes you a better contributor in sessions.',
    null,
    'Read cohort overview',
    3,
    true,
    'internal'
  ),

  -- ── SHARED: Final step — Meet your Forum group ──────────────
  (
    'Meet your Forum group',
    'Attend or prepare for your first Forum session. Review the session brief if one has been posted, and come ready to introduce yourself.',
    null,
    'View upcoming session',
    6,
    true,
    null
  );
