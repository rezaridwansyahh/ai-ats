-- Migration 011: Interview Rounds
-- Adds explicit round tracking to the Interview stage so a candidate can be
-- sent through the interview process more than once ("Interview Again")
-- without losing the previous round's schedule + scorecard history.
--
-- Model:
--   candidate_interview (1) --> interview_round (N)
--                                     |
--                        +------------+------------+
--                        |                         |
--                 interview_schedule (N)   interview_scorecard (0..1, unique per round)
--
-- candidate_interview.current_round_id always points at the ACTIVE round.
-- candidate_interview.round is a denormalized counter (matches the active
-- round's round_number) so simple reads don't need a join.
--
-- Status vocabulary for candidate_interview.status is redefined:
--   setup     -> stage entered, no schedule yet for the current round
--   scheduled -> a schedule exists for the current round, not yet confirmed
--                (also used when an outcome of 'reschedule' loops back here)
--   ongoing   -> the current round's schedule has been CONFIRMED
--   result    -> an outcome (interviewed / no_show) was recorded for the
--                current round's schedule
--   done      -> scorecard submitted (is_draft = false) for the current round
--   cancelled -> manual override, unchanged
--
-- Created: 08 Aug 2026

BEGIN;

-- ── interview_round ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interview_round (
  id            SERIAL PRIMARY KEY,
  interview_id  INTEGER NOT NULL REFERENCES candidate_interview(id) ON DELETE CASCADE,
  round_number  INTEGER NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'setup',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (interview_id, round_number)
);
CREATE INDEX IF NOT EXISTS idx_interview_round_interview ON interview_round(interview_id);

-- ── candidate_interview: round pointer ──────────────────────────────────
ALTER TABLE candidate_interview ADD COLUMN IF NOT EXISTS round INTEGER NOT NULL DEFAULT 1;
ALTER TABLE candidate_interview ADD COLUMN IF NOT EXISTS current_round_id INTEGER REFERENCES interview_round(id);

-- ── interview_schedule / interview_scorecard: child of round ───────────
-- interview_id is KEPT (denormalized) so existing "all sessions for this
-- interview" queries keep working as a natural history view; round_id is
-- ADDED so "current round only" reads can filter precisely.
ALTER TABLE interview_schedule  ADD COLUMN IF NOT EXISTS round_id INTEGER REFERENCES interview_round(id);
ALTER TABLE interview_scorecard ADD COLUMN IF NOT EXISTS round_id INTEGER REFERENCES interview_round(id);

-- Old UNIQUE(interview_id) on interview_scorecard blocked ever having a
-- second scorecard for the same interview (i.e. blocked round history).
-- Relax it to UNIQUE(round_id) — one scorecard per round instead of one
-- scorecard ever.
ALTER TABLE interview_scorecard DROP CONSTRAINT IF EXISTS interview_scorecard_interview_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS uq_scorecard_round ON interview_scorecard(round_id);

-- ── Backfill: give every existing candidate_interview a round 1 ────────
INSERT INTO interview_round (interview_id, round_number, status)
SELECT ci.id, 1,
  CASE
    WHEN ci.status = 'ongoing'                        THEN 'setup'
    WHEN ci.status = 'reschedule'                      THEN 'scheduled'
    WHEN ci.status IN ('interviewed', 'no_show')       THEN 'result'
    ELSE ci.status
  END
FROM candidate_interview ci
WHERE NOT EXISTS (
  SELECT 1 FROM interview_round ir WHERE ir.interview_id = ci.id
);

UPDATE candidate_interview ci
SET current_round_id = ir.id
FROM interview_round ir
WHERE ir.interview_id = ci.id AND ir.round_number = 1
  AND ci.current_round_id IS NULL;

UPDATE interview_schedule s
SET round_id = ci.current_round_id
FROM candidate_interview ci
WHERE s.interview_id = ci.id AND s.round_id IS NULL;

UPDATE interview_scorecard sc
SET round_id = ci.current_round_id
FROM candidate_interview ci
WHERE sc.interview_id = ci.id AND sc.round_id IS NULL;

-- ── Rewrite candidate_interview.status into the new vocabulary ─────────
UPDATE candidate_interview
SET status = CASE
  WHEN status = 'ongoing'                  THEN 'setup'
  WHEN status = 'reschedule'                THEN 'scheduled'
  WHEN status IN ('interviewed', 'no_show') THEN 'result'
  ELSE status
END;

COMMIT;
