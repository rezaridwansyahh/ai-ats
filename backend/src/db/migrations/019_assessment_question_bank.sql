-- Normalizes hardcoded per-battery question banks (frontend/src/components/assessment-{a,b,c,d}/data/*.js)
-- into real rows, plus persists candidate answers and per-subtest scores (previously discarded/only
-- aggregated into core_applicant_assessment.results JSONB).

CREATE TYPE question_type_enum AS ENUM (
  'mc', 'input', 'likert', 'forced_choice_pair', 'forced_choice_quad',
  'scenario_mc', 'yes_no', 'trichotomous_rated'
);

-- One row per atomic, independently-timed testable unit (e.g. GI and KA are separate
-- rows even though both are commonly labeled "tk" — group_key carries that label).
CREATE TABLE assessment_subtest (
  id SERIAL PRIMARY KEY,
  assessment_id INT NOT NULL REFERENCES master_assessment(id),
  subtest_key   VARCHAR(20) NOT NULL,
  group_key     VARCHAR(20),
  name          VARCHAR(255) NOT NULL,
  weight        NUMERIC,
  time_limit_seconds INT,
  order_index   INT NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (assessment_id, subtest_key)
);

CREATE TABLE assessment_question (
  id SERIAL PRIMARY KEY,
  subtest_id    INT NOT NULL REFERENCES assessment_subtest(id),
  question_type question_type_enum NOT NULL,
  order_index   INT NOT NULL,
  content       JSONB NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (subtest_id, order_index)
);

CREATE TABLE assessment_answer (
  id           SERIAL PRIMARY KEY,
  result_id    INT NOT NULL REFERENCES core_applicant_assessment(id) ON DELETE CASCADE,
  question_id  INT NOT NULL REFERENCES assessment_question(id),
  answer       JSONB NOT NULL,
  is_correct   BOOLEAN,
  score_earned NUMERIC,
  answered_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (result_id, question_id)
);

-- One row per (attempt, subtest) — written once, when the candidate finishes that
-- subtest, from the same client-side scoring pass that also feeds
-- core_applicant_assessment.results.by_subtest at final submit.
CREATE TABLE assessment_score (
  id          SERIAL PRIMARY KEY,
  result_id   INT NOT NULL REFERENCES core_applicant_assessment(id) ON DELETE CASCADE,
  subtest_id  INT NOT NULL REFERENCES assessment_subtest(id),
  score       JSONB NOT NULL,
  computed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (result_id, subtest_id)
);
