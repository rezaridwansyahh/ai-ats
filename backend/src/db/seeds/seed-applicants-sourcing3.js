// Ad hoc dummy-data seeder — adds a handful of applicants to job_sourcing_id = 3
// (not part of the main reset flow in seed.js / run-script.js).
//
// Run with:
//   cd backend && node src/db/seeds/seed-applicants-sourcing3.js
//
// Safe to re-run — each run inserts a fresh batch (master_applicant.id is
// SERIAL, so no collision with existing rows).

import '../../config/env.js';
import getDb from '../../config/postgres.js';

const JOB_SOURCING_ID = 3;

// Same "Layer 1 facet" shape as src/db/data/applicants.js — matches what
// ai.service.extractFacets() would have produced from a real CV.
const dummyApplicants = [
  {
    name: 'Maya Kusuma', email: 'maya.kusuma@example.com', last_position: 'Sales Manager',
    address: 'Jakarta, Indonesia', education: "Bachelor's in Business Administration",
    information: {
      job_position: { current: 'Sales Manager', category: 'Sales' },
      skills: ['B2B Sales', 'Negotiation', 'CRM', 'Team Leadership', 'Salesforce'],
      education: [{ school: 'Universitas Indonesia', degree: "Bachelor's in Business Administration", year: 2016, tier: 'top' }],
      experience: {
        years_total: 8,
        positions: [
          { title: 'Sales Manager', company: 'Unilever Indonesia', years: 4 },
          { title: 'Senior Sales Executive', company: 'Nestle Indonesia', years: 4 },
        ],
      },
    },
    date: '2026-08-20 09:15:00',
    qa: {
      'Gaji bulanan yang diinginkan': { answer: 'Rp 18 Jt', meets_requirement: true },
      'Pengalaman memimpin tim sales': { answer: '5 tahun', meets_requirement: true },
      'Bersedia melakukan perjalanan dinas': { answer: 'Ya', meets_requirement: true },
    },
  },
  {
    name: 'Rangga Prasetyo', email: 'rangga.prasetyo@example.com', last_position: 'Area Sales Manager',
    address: 'Surabaya, Indonesia', education: "Bachelor's in Marketing",
    information: {
      job_position: { current: 'Area Sales Manager', category: 'Sales' },
      skills: ['Channel Sales', 'Distribution', 'Forecasting', 'Team Leadership'],
      education: [{ school: 'Universitas Airlangga', degree: "Bachelor's in Marketing", year: 2014, tier: 'top' }],
      experience: {
        years_total: 10,
        positions: [
          { title: 'Area Sales Manager', company: 'Indofood', years: 5 },
          { title: 'Sales Supervisor', company: 'Mayora', years: 5 },
        ],
      },
    },
    date: '2026-08-21 11:40:00',
    qa: {
      'Gaji bulanan yang diinginkan': { answer: 'Rp 22 Jt', meets_requirement: false },
      'Pengalaman memimpin tim sales': { answer: '8 tahun', meets_requirement: true },
      'Bersedia melakukan perjalanan dinas': { answer: 'Ya', meets_requirement: true },
    },
  },
  {
    name: 'Sari Wulandari', email: 'sari.wulandari@example.com', last_position: 'Key Account Manager',
    address: 'Bandung, Indonesia', education: "Bachelor's in Business Administration",
    information: {
      job_position: { current: 'Key Account Manager', category: 'Sales' },
      skills: ['Account Management', 'B2B Sales', 'Negotiation', 'CRM'],
      education: [{ school: 'Universitas Padjadjaran', degree: "Bachelor's in Business Administration", year: 2018, tier: 'mid' }],
      experience: {
        years_total: 6,
        positions: [
          { title: 'Key Account Manager', company: 'Danone Indonesia', years: 3 },
          { title: 'Sales Executive', company: 'Wings Group', years: 3 },
        ],
      },
    },
    date: '2026-08-22 14:05:00',
    qa: null, // no scraped screening Q&A for this one — exercises the 0/0 empty state
  },
  {
    name: 'Doni Firmansyah', email: 'doni.firmansyah@example.com', last_position: 'Regional Sales Manager',
    address: 'Medan, Indonesia', education: "Bachelor's in Economics",
    information: {
      job_position: { current: 'Regional Sales Manager', category: 'Sales' },
      skills: ['B2B Sales', 'Team Leadership', 'Forecasting', 'Distribution'],
      education: [{ school: 'Universitas Sumatera Utara', degree: "Bachelor's in Economics", year: 2012, tier: 'mid' }],
      experience: {
        years_total: 12,
        positions: [
          { title: 'Regional Sales Manager', company: 'Coca-Cola Amatil Indonesia', years: 6 },
          { title: 'Area Sales Manager', company: 'Sinar Sosro', years: 6 },
        ],
      },
    },
    date: '2026-08-23 10:30:00',
    qa: {
      'Gaji bulanan yang diinginkan': { answer: 'Rp 25 Jt', meets_requirement: true },
      'Pengalaman memimpin tim sales': { answer: '10 tahun', meets_requirement: true },
      'Bersedia ditempatkan di luar kota': { answer: 'Ya', meets_requirement: true },
      'Bersedia melakukan perjalanan dinas': { answer: 'Ya', meets_requirement: true },
    },
  },
];

async function run() {
  const db = getDb();

  // Derive company_id the same way seed.js does: sourcing → account → company,
  // falling back to matching the sourcing's job_title to core_job.
  const sourcingRes = await db.query(
    `SELECT cjs.id, cjs.job_title, cjs.account_id, mja.company_id AS account_company_id
     FROM core_job_sourcing cjs
     LEFT JOIN master_job_account mja ON mja.id = cjs.account_id
     WHERE cjs.id = $1`,
    [JOB_SOURCING_ID]
  );
  const sourcing = sourcingRes.rows[0];
  if (!sourcing) {
    throw new Error(`core_job_sourcing id ${JOB_SOURCING_ID} not found — nothing to seed against`);
  }

  let company_id = sourcing.account_company_id ?? null;
  if (!company_id) {
    const byTitle = await db.query(
      `SELECT company_id FROM core_job WHERE job_title = $1 LIMIT 1`,
      [sourcing.job_title]
    );
    company_id = byTitle.rows[0]?.company_id ?? null;
  }

  console.log(`Seeding ${dummyApplicants.length} applicants into job_sourcing_id=${JOB_SOURCING_ID} ("${sourcing.job_title}"), company_id=${company_id}`);

  await db.query('BEGIN');
  try {
    for (const a of dummyApplicants) {
      const applicantRes = await db.query(
        `INSERT INTO master_applicant (company_id, name, email, last_position, address, education, information, date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [company_id, a.name, a.email, a.last_position, a.address, a.education, JSON.stringify(a.information), a.date]
      );
      const applicantId = applicantRes.rows[0].id;

      await db.query(
        `INSERT INTO mapping_applicant_sourcing (applicant_id, job_sourcing_id, information)
         VALUES ($1, $2, $3)`,
        [applicantId, JOB_SOURCING_ID, a.qa ? JSON.stringify(a.qa) : null]
      );

      console.log(`  + ${a.name} (applicant_id=${applicantId})`);
    }
    await db.query('COMMIT');
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }

  console.log('Done.');
}

run()
  .then(() => getDb().end())
  .catch(async (err) => {
    console.error('Seed failed:', err.message);
    await getDb().end().catch(() => {});
    process.exit(1);
  });
