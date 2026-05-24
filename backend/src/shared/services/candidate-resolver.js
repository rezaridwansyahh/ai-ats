import getDb from '../../config/postgres.js';
import Participant from '../../modules/assessment/participant/participant.model.js';

export async function resolveParticipantByCandidate(candidate_id, { createIfMissing = false } = {}) {
  const candidateRow = await getDb().query(`
    SELECT c.id            AS candidate_id,
           c.job_id        AS candidate_job_id,
           c.name          AS candidate_name,
           c.last_position AS candidate_position,
           c.education     AS candidate_education,
           a.email         AS applicant_email,
           a.name          AS applicant_name,
           a.last_position AS applicant_position,
           a.education     AS applicant_education
    FROM master_candidate c
    LEFT JOIN master_applicant a ON a.id = c.applicant_id
    WHERE c.id = $1
    LIMIT 1
  `, [candidate_id]);

  const row = candidateRow.rows[0];
  if (!row) throw { status: 404, message: 'Candidate not found' };

  const email = (row.applicant_email || '').trim().toLowerCase();
  if (!email) {
    if (createIfMissing) {
      throw { status: 400, message: 'Cannot generate invitation: candidate has no email on file. Link an applicant with an email first.' };
    }
    return { participant: null, candidateJobId: row.candidate_job_id ?? null };
  }

  let participant = await Participant.getByEmail(email);
  if (!participant && createIfMissing) {
    // Required fields we can't derive get safe placeholders; recruiter can edit later.
    participant = await Participant.create({
      name:       row.applicant_name     || row.candidate_name     || 'Unknown',
      email,
      position:   row.applicant_position || row.candidate_position || '—',
      department: '—',
      education:  row.applicant_education || row.candidate_education || '—',
      date_birth: '1900-01-01',
    });
  }
  return { participant: participant || null, candidateJobId: row.candidate_job_id ?? null };
}
