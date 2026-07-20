/**
 * seed-technical-support.js
 *
 * Creates:
 *  1. A "Technical Support" job in core_job (company_id = 1)
 *  2. A dummy core_job_sourcing record (platform = seek)
 *  3. master_applicant + master_candidate rows from parsed-results.json
 *
 * Idempotent — safe to re-run (uses ON CONFLICT DO NOTHING / DO UPDATE).
 *
 * Run:
 *   cd backend && node scripts/seed-technical-support.js
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_URL   = 'postgresql://postgres:postgres123@localhost:5432/myralix';
const PARSED   = path.join(__dirname, 'parsed-results.json');
const COMPANY_ID = 1;

const pool = new pg.Pool({ connectionString: DB_URL });

async function main() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ── 1. Job ────────────────────────────────────────────────────────────────
    // Check if already exists first (no unique constraint on job_title)
    const existingJob = await client.query(
      `SELECT id FROM core_job WHERE job_title = 'Technical Support' AND company_id = $1 ORDER BY id LIMIT 1`,
      [COMPANY_ID]
    );

    const jobRes = existingJob.rows.length === 0 ? await client.query(`
      INSERT INTO core_job (
        company_id, job_title, job_desc, job_location,
        work_option, work_type,
        pay_type, currency, pay_min, pay_max, pay_display,
        qualifications,
        required_skills, preferred_skills, benefits,
        status, sla_start_date, sla_end_date
      ) VALUES (
        $1, 'Technical Support',
        'Responsible for providing technical assistance and support to end-users experiencing hardware, software, or network issues. Diagnoses and resolves technical problems, escalates complex issues to senior teams, and maintains accurate records of support activities.',
        'Jakarta',
        'On-site', 'Full-time',
        'Monthly', 'IDR', 5000000, 9000000, 'Hide',
        'Minimum D3/S1 in Information Technology or related field. 1-3 years experience in IT support or helpdesk environment.',
        $2, $3, $4,
        'Active', NOW(), NOW() + INTERVAL '6 months'
      )
      RETURNING id
    `, [
      COMPANY_ID,
      JSON.stringify(['Windows OS', 'Networking', 'Active Directory', 'Troubleshooting', 'Hardware Maintenance']),
      JSON.stringify(['ITIL', 'Linux', 'VMware', 'PowerShell']),
      JSON.stringify(['BPJS Kesehatan & Ketenagakerjaan', 'THR', 'Overtime Pay', 'Performance Bonus']),
    ]) : { rows: [] };

    let jobId;
    if (jobRes.rows.length > 0) {
      jobId = jobRes.rows[0].id;
      console.log(`✓ Created job id=${jobId}`);
    } else {
      jobId = existingJob.rows[0].id;
      console.log(`ℹ Job already exists id=${jobId}`);
    }

    // ── 2. Job Post (required by core_job_sourcing FK) ───────────────────────
    const jpRes = await client.query(`
      INSERT INTO job_post (job_id, type, platform)
      VALUES ($1, 'Internal', 'seek')
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [jobId]);

    let jobPostId;
    if (jpRes.rows.length > 0) {
      jobPostId = jpRes.rows[0].id;
    } else {
      const existing = await client.query(
        `SELECT id FROM job_post WHERE job_id = $1 AND platform = 'seek' LIMIT 1`,
        [jobId]
      );
      jobPostId = existing.rows[0]?.id || null;
    }
    console.log(`✓ Job post id=${jobPostId}`);

    // ── 3. Sourcing record ────────────────────────────────────────────────────
    const srcRes = await client.query(`
      INSERT INTO core_job_sourcing (
        job_post_id, job_title, platform, platform_job_id, status
      ) VALUES (
        $1, 'Technical Support', 'seek', 'SEED-TECH-001', 'Active'
      )
      ON CONFLICT (platform, account_id, platform_job_id) DO NOTHING
      RETURNING id
    `, [jobPostId]);

    let sourcingId;
    if (srcRes.rows.length > 0) {
      sourcingId = srcRes.rows[0].id;
      console.log(`✓ Created sourcing id=${sourcingId}`);
    } else {
      const existing = await client.query(
        `SELECT id FROM core_job_sourcing WHERE platform_job_id = 'SEED-TECH-001' LIMIT 1`
      );
      sourcingId = existing.rows[0].id;
      console.log(`ℹ Sourcing already exists id=${sourcingId}`);
    }

    // ── 4. Link job to IT Dev template (master_template_stage id=2) ──────────
    await client.query(`
      INSERT INTO core_job_template (job_id, template_stage_id)
      VALUES ($1, 2)
      ON CONFLICT (job_id) DO UPDATE SET template_stage_id = 2, updated_at = NOW()
    `, [jobId]);
    console.log(`✓ Linked job ${jobId} → Template IT Dev (id=2)`);

    // job_stage id=6 = 'AI CV Screening' from Template IT Dev
    const SCREENING_STAGE_ID = 6;

    // ── 5. Load parsed results ────────────────────────────────────────────────
    if (!fs.existsSync(PARSED)) {
      throw new Error(`parsed-results.json not found at: ${PARSED}`);
    }
    const allRecords = JSON.parse(fs.readFileSync(PARSED, 'utf-8'));
    const records    = allRecords.filter((r) => r._status === 'ok' && r.name?.trim());
    console.log(`\nLoading ${records.length} parsed candidates…`);

    let inserted = 0;
    let skipped  = 0;

    for (const rec of records) {
      const name         = rec.name?.trim() || 'Unknown';
      const email        = rec.email?.trim() || null;
      const phone        = rec.phone?.trim() || null;
      const lastPosition = rec.job_position?.current?.trim() || 'IT Support';
      const education    = rec.education?.[0]
        ? `${rec.education[0].degree || ''} - ${rec.education[0].school || ''}`.trim().replace(/^-\s*/, '')
        : '';

      const information = {
        email,
        phone,
        skills:     rec.skills     || [],
        education:  rec.education  || [],
        experience: rec.experience || {},
        job_position: rec.job_position || {},
        source_file: rec._file,
      };

      // ── Applicant ──
      const appRes = await client.query(`
        INSERT INTO master_applicant (
          job_sourcing_id, company_id, name, email,
          last_position, address, education, information, date
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, NOW()
        )
        ON CONFLICT (name, job_sourcing_id) DO UPDATE
          SET email        = EXCLUDED.email,
              last_position = EXCLUDED.last_position,
              information  = EXCLUDED.information
        RETURNING id
      `, [
        sourcingId, COMPANY_ID, name, email,
        lastPosition, 'Jakarta', education, JSON.stringify(information),
      ]);

      const applicantId = appRes.rows[0].id;

      // ── Candidate ──
      const candRes = await client.query(`
        INSERT INTO master_candidate (
          job_id, applicant_id, name, last_position,
          address, education, information, date, latest_stage
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, NOW(), $8
        )
        ON CONFLICT (name, job_id) DO UPDATE
          SET applicant_id  = EXCLUDED.applicant_id,
              last_position  = EXCLUDED.last_position,
              information    = EXCLUDED.information,
              latest_stage   = EXCLUDED.latest_stage
        RETURNING id, (xmax = 0) AS is_insert
      `, [
        jobId, applicantId, name, lastPosition,
        'Jakarta', education, JSON.stringify(information), SCREENING_STAGE_ID,
      ]);

      if (candRes.rows[0].is_insert) inserted++;
      else skipped++;
    }

    await client.query('COMMIT');
    console.log(`\n✅ Done.`);
    console.log(`   Inserted: ${inserted} candidates`);
    console.log(`   Updated:  ${skipped} (already existed)`);
    console.log(`   Job ID:   ${jobId}`);
    console.log(`   Sourcing: ${sourcingId}`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
