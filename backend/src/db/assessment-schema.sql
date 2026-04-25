-- ========================================
-- ASSESSMENT MODULE SCHEMA
-- Sistem asesmen terintegrasi dengan ATS
-- Created: 2026-04-22
-- ========================================

-- ========================================
-- 1. MASTER ASSESSMENT (jenis asesmen)
-- ========================================
CREATE TABLE master_assessment (
  assessment_id SERIAL PRIMARY KEY,
  assessment_code VARCHAR(50) UNIQUE NOT NULL, -- 'myralix_battery_a', 'disc', 'bigfive'
  assessment_name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INT, -- durasi total asesmen (opsional)
  config JSONB, -- konfigurasi asesmen (subtests, scoring rules, dll)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE master_assessment IS 'Master data jenis-jenis asesmen yang tersedia';
COMMENT ON COLUMN master_assessment.config IS 'Konfigurasi asesmen dalam format JSONB: {subtests: [...], scoring: {...}}';

-- ========================================
-- 2. APPLICANT ASSESSMENT (detail hasil per asesmen)
-- ========================================
CREATE TABLE core_applicant_assessment (
  applicant_assessment_id SERIAL PRIMARY KEY,
  applicant_id INT REFERENCES master_applicant(applicant_id) ON DELETE CASCADE,
  assessment_id INT REFERENCES master_assessment(assessment_id),

  status VARCHAR(50) DEFAULT 'completed', -- completed, invalid, expired

  -- HASIL LENGKAP (raw data + detail scoring)
  results JSONB NOT NULL, -- semua detail hasil asesmen (cognitive, personality, dll)

  -- HASIL SINGKAT (untuk quick view)
  summary JSONB, -- ringkasan penting (IQ, DISC primary, Big5 summary)

  -- HASIL DESKRIPTIF (narasi/interpretasi)
  narrative_report TEXT, -- laporan naratif lengkap (beberapa paragraf)
  strengths TEXT, -- kekuatan kandidat (bullet points)
  development_areas TEXT, -- area pengembangan (bullet points)
  recommended_roles TEXT, -- rekomendasi posisi yang sesuai (bullet points)

  -- Metadata
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  assessment_date DATE DEFAULT CURRENT_DATE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 1 kandidat bisa ambil 1 jenis asesmen maksimal 1x per hari
  UNIQUE(applicant_id, assessment_id, assessment_date)
);

COMMENT ON TABLE core_applicant_assessment IS 'Detail hasil asesmen per kandidat';
COMMENT ON COLUMN core_applicant_assessment.results IS 'Detail lengkap semua hasil asesmen (cognitive, personality, dll)';
COMMENT ON COLUMN core_applicant_assessment.summary IS 'Ringkasan singkat untuk quick preview';
COMMENT ON COLUMN core_applicant_assessment.narrative_report IS 'Laporan naratif lengkap (profil kandidat)';

CREATE INDEX idx_applicant_assessment ON core_applicant_assessment(applicant_id);
CREATE INDEX idx_assessment_date ON core_applicant_assessment(assessment_date);
CREATE INDEX idx_assessment_type ON core_applicant_assessment(assessment_id);

-- ========================================
-- 3. UPDATE MASTER APPLICANT (tambah field hasil asesmen)
-- ========================================
ALTER TABLE master_applicant
  -- HASIL SINGKAT ASESMEN (agregat dari semua asesmen yang pernah diambil)
  ADD COLUMN IF NOT EXISTS assessment_summary JSONB,

  -- HASIL DESKRIPTIF SINGKAT (1-2 paragraf profil kandidat)
  ADD COLUMN IF NOT EXISTS assessment_profile TEXT,

  -- Link ke asesmen terakhir/utama
  ADD COLUMN IF NOT EXISTS latest_assessment_id INT REFERENCES core_applicant_assessment(applicant_assessment_id),
  ADD COLUMN IF NOT EXISTS latest_assessment_date DATE;

COMMENT ON COLUMN master_applicant.assessment_summary IS 'Ringkasan hasil asesmen terbaru (untuk filtering & quick view)';
COMMENT ON COLUMN master_applicant.assessment_profile IS 'Profil singkat kandidat berdasarkan hasil asesmen (1-2 paragraf)';
COMMENT ON COLUMN master_applicant.latest_assessment_id IS 'Link ke asesmen terakhir yang diambil';

-- Index untuk filter berdasarkan hasil asesmen
CREATE INDEX IF NOT EXISTS idx_applicant_assessment_summary ON master_applicant USING GIN (assessment_summary);

-- ========================================
-- 4. UPDATE CORE JOB SOURCING (link asesmen ke kandidat pipeline)
-- ========================================
ALTER TABLE core_job_sourcing
  ADD COLUMN IF NOT EXISTS applicant_assessment_id INT REFERENCES core_applicant_assessment(applicant_assessment_id),
  ADD COLUMN IF NOT EXISTS assessment_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS assessment_passed BOOLEAN;

COMMENT ON COLUMN core_job_sourcing.applicant_assessment_id IS 'Link ke hasil asesmen kandidat untuk job ini';
COMMENT ON COLUMN core_job_sourcing.assessment_required IS 'Apakah asesmen wajib untuk job ini';
COMMENT ON COLUMN core_job_sourcing.assessment_passed IS 'Status lulus/tidak lulus asesmen';

CREATE INDEX IF NOT EXISTS idx_sourcing_assessment ON core_job_sourcing(applicant_assessment_id);

-- ========================================
-- 5. UPDATE CORE JOB (requirement asesmen per job)
-- ========================================
ALTER TABLE core_job
  ADD COLUMN IF NOT EXISTS required_assessment_id INT REFERENCES master_assessment(assessment_id),
  ADD COLUMN IF NOT EXISTS assessment_passing_score DECIMAL(10, 4); -- minimum score untuk lulus

COMMENT ON COLUMN core_job.required_assessment_id IS 'Jenis asesmen yang wajib untuk posisi ini';
COMMENT ON COLUMN core_job.assessment_passing_score IS 'Minimum score untuk lulus asesmen (0-100)';

-- ========================================
-- SAMPLE DATA
-- ========================================

-- Insert sample assessment types
INSERT INTO master_assessment (assessment_code, assessment_name, description, duration_minutes, config) VALUES
('myralix_battery_a', 'Myralix Battery A - Cognitive + Personality',
 'Tes komprehensif mencakup kemampuan kognitif (GI, PV, KN, PA, KA) dan personality (Big Five, DISC, Holland)',
 110,
 '{
   "subtests": ["GI", "PV", "KN", "PA", "KA", "BigFive", "DISC", "Holland"],
   "scoring": {
     "GI": {"weight": 0.30, "items": 50, "time_limit_seconds": 720},
     "PV": {"weight": 0.175, "items": 25, "time_limit_seconds": 900},
     "KN": {"weight": 0.175, "items": 40, "time_limit_seconds": 1500},
     "PA": {"weight": 0.175, "items": 40, "time_limit_seconds": 1200},
     "KA": {"weight": 0.175, "items": 40, "time_limit_seconds": 480}
   }
 }'::jsonb),

('disc_only', 'DISC Personality Assessment',
 'Tes kepribadian DISC untuk mengidentifikasi gaya kerja dan komunikasi',
 20,
 '{
   "subtests": ["DISC"],
   "groups": 28
 }'::jsonb),

('bigfive_only', 'Big Five Personality Test',
 'Tes kepribadian Big Five (Extraversion, Agreeableness, Conscientiousness, Neuroticism, Openness)',
 15,
 '{
   "subtests": ["BigFive"],
   "items": 44,
   "scale": "likert_5"
 }'::jsonb),

('holland_only', 'Holland RIASEC Career Interest',
 'Tes minat karir berdasarkan model Holland (Realistic, Investigative, Artistic, Social, Enterprising, Conventional)',
 15,
 '{
   "subtests": ["Holland"],
   "categories": ["R", "I", "A", "S", "E", "C"]
 }'::jsonb);

-- ========================================
-- USEFUL QUERIES (untuk reference)
-- ========================================

-- Query: Get all assessment results for a candidate
-- SELECT
--   ma.assessment_name,
--   caa.assessment_date,
--   caa.summary->>'iq' as iq_score,
--   caa.summary->>'disc_primary' as disc_profile,
--   caa.summary->>'overall_score' as overall_score
-- FROM core_applicant_assessment caa
-- JOIN master_assessment ma ON caa.assessment_id = ma.assessment_id
-- WHERE caa.applicant_id = 123
--   AND caa.status = 'completed'
-- ORDER BY caa.assessment_date DESC;

-- Query: Get candidates with assessment for a job
-- SELECT
--   js.sourcing_id,
--   a.full_name,
--   a.assessment_summary->'latest'->>'iq' as iq_score,
--   a.assessment_summary->'latest'->>'disc' as disc_profile,
--   js.assessment_passed
-- FROM core_job_sourcing js
-- JOIN master_applicant a ON js.applicant_id = a.applicant_id
-- WHERE js.job_id = 1
--   AND js.assessment_required = true;

-- Query: Filter candidates by IQ score
-- SELECT
--   applicant_id,
--   full_name,
--   assessment_summary->'latest'->>'iq' as iq_score
-- FROM master_applicant
-- WHERE (assessment_summary->'latest'->>'iq')::int >= 110;

-- Query: Filter candidates by DISC profile
-- SELECT
--   applicant_id,
--   full_name,
--   assessment_summary->'latest'->>'disc' as disc_profile
-- FROM master_applicant
-- WHERE assessment_summary->'latest'->>'disc' LIKE '%Influencer%';
