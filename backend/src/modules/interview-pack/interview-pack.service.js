import interviewPackModel from './interview-pack.model.js';
import getDb from '../../config/postgres.js';
import fs from 'fs';
import path from 'path';

/**
 * Build the competencies array from a rubric object.
 * Rubric shape:
 *   { fixed_criteria: { skills: { weight }, ... }, custom_criteria: [{ description, weight }] }
 */
function buildCompetencies(rubric) {
  const competencies = [];

  const fixedMap = {
    skills:             'Skills',
    experience:         'Experience',
    career_trajectory:  'Career Trajectory',
    education:          'Education',
  };

  const fixed = rubric?.fixed_criteria || {};
  for (const [key, label] of Object.entries(fixedMap)) {
    if (fixed[key] != null) {
      competencies.push({
        name:   label,
        weight: Number(fixed[key].weight) || 0,
        type:   'fixed',
      });
    }
  }

  const custom = rubric?.custom_criteria || [];
  for (const c of custom) {
    if (c && c.description) {
      competencies.push({
        name:   c.description,
        weight: Number(c.weight) || 0,
        type:   'custom',
      });
    }
  }

  return competencies;
}

/**
 * Compute weighted total from scores + rubric competencies.
 * scores = { "Skills": 5, "Experience": 6, ... }  (1–7 scale)
 */
function computeWeightedTotal(scores, competencies) {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const c of competencies) {
    const score = scores[c.name];
    if (score != null) {
      weightedSum += Number(score) * Number(c.weight);
      totalWeight += Number(c.weight);
    }
  }
  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : null;
}

/**
 * Fetch core_job rubric column directly (minimal query).
 */
async function fetchJobRubric(job_id) {
  const result = await getDb().query(
    `SELECT rubric FROM core_job WHERE id = $1`,
    [job_id]
  );
  return result.rows[0]?.rubric || null;
}

class InterviewPackService {
  /**
   * Create a new interview pack for a job.
   */
  async create(data, userId) {
    const {
      company_id,
      job_id,
      title,
      batch_code,
      interviewer_name,
      window_start,
      window_end,
      applicant_ids,
      candidates,   // optional: array of { applicant_id, interview_date, interview_time }
      rubric_snapshot: providedRubric,
      questions_snapshot,
    } = data;

    if (!job_id) throw { status: 400, message: 'job_id is required' };
    if (!interviewer_name || !interviewer_name.trim()) {
      throw { status: 400, message: 'interviewer_name is required' };
    }

    // Resolve candidate list
    const rawCandidates = candidates || (applicant_ids || []).map((id) => ({ applicant_id: id }));
    if (!Array.isArray(rawCandidates) || rawCandidates.length === 0) {
      throw { status: 400, message: 'At least one applicant is required' };
    }
    if (rawCandidates.length > 10) {
      throw { status: 400, message: 'Maximum 10 candidates per interview pack' };
    }
    for (const c of rawCandidates) {
      if (!c.applicant_id) throw { status: 400, message: 'Each candidate entry must have applicant_id' };
    }

    // Resolve rubric
    let rubric = providedRubric;
    if (!rubric) {
      rubric = await fetchJobRubric(job_id);
    }
    if (!rubric) {
      throw { status: 400, message: 'No rubric found for this job. Please configure the job rubric first.' };
    }

    // Build competencies list and attach to snapshot
    const competencies = buildCompetencies(rubric);
    const rubric_snapshot = { ...rubric, competencies };

    const pack = await interviewPackModel.create({
      company_id: company_id || null,
      job_id,
      title:            title || 'Interview Round',
      batch_code:       batch_code || null,
      interviewer_name: interviewer_name.trim(),
      window_start:     window_start || null,
      window_end:       window_end || null,
      rubric_snapshot,
      questions_snapshot: questions_snapshot || [],
      created_by:       userId || null,
    });

    // Stamp each candidate's CURRENT round onto their pack entry, so a
    // future round's pack link is never confused with a past round's —
    // needed for the Result tab's per-round dropdown.
    const roundRows = await getDb().query(
      `SELECT mc.applicant_id, ci.current_round_id
         FROM master_candidate mc
         JOIN candidate_interview ci ON ci.candidate_id = mc.id
        WHERE mc.job_id = $1 AND mc.applicant_id = ANY($2::int[])`,
      [job_id, rawCandidates.map((c) => c.applicant_id)]
    );
    const roundByApplicant = new Map(roundRows.rows.map((r) => [r.applicant_id, r.current_round_id]));

    const candidateRows = rawCandidates.map((c, i) => ({
      applicant_id:   c.applicant_id,
      round_id:       roundByApplicant.get(c.applicant_id) || null,
      sort_order:     c.sort_order ?? i,
      interview_date: c.interview_date || null,
      interview_time: c.interview_time || null,
    }));

    await interviewPackModel.addCandidates(pack.id, candidateRows);

    return {
      ...pack,
      portal_link: `/portal/interview/${pack.token}`,
    };
  }

  /**
   * Get a single pack by id (admin view).
   */
  async getById(id) {
    if (!id) throw { status: 400, message: 'id is required' };
    const pack = await interviewPackModel.getById(id);
    if (!pack) throw { status: 404, message: 'Interview pack not found' };
    return pack;
  }

  /**
   * Get all packs for a company (admin list view).
   */
  async getByCompany(company_id) {
    if (!company_id) throw { status: 400, message: 'company_id is required' };
    return await interviewPackModel.getByCompany(company_id);
  }

  /**
   * Get a pack by its token (portal access — no auth).
   * Throws 404 if not found, 410 if already submitted.
   */
  async getByToken(token) {
    if (!token) throw { status: 400, message: 'token is required' };
    const pack = await interviewPackModel.getByToken(token);
    if (!pack) throw { status: 404, message: 'Interview pack not found' };
    if (pack.status === 'submitted') {
      throw { status: 410, message: 'This interview pack has already been submitted' };
    }
    return pack;
  }

  /**
   * Resolve the CV file path for one candidate, scoped to the pack's token.
   */
  async getCvPathByToken(token, packCandidateId) {
    if (!token) throw { status: 400, message: 'token is required' };
    const row = await interviewPackModel.getCvByToken(token, packCandidateId);
    if (!row) throw { status: 404, message: 'Candidate not found in this interview pack' };
    if (!row.attachment) throw { status: 404, message: 'No CV available for this candidate' };

    const filePath = path.resolve(row.attachment);
    if (!fs.existsSync(filePath)) throw { status: 404, message: 'CV file not found on server' };

    return { filePath, name: row.name };
  }

  /**
   * Autosave an outcome for one candidate.
   * Works even if pack is open; checks token to locate the pack.
   */
  async saveOutcome(token, pack_candidate_id, outcomeData) {
    if (!token) throw { status: 400, message: 'token is required' };
    if (!pack_candidate_id) throw { status: 400, message: 'pack_candidate_id is required' };

    const pack = await interviewPackModel.getByToken(token);
    if (!pack) throw { status: 404, message: 'Interview pack not found' };
    if (pack.status !== 'open') {
      throw { status: 409, message: 'This interview pack is already submitted and cannot be modified' };
    }

    // Verify that pack_candidate_id belongs to this pack
    const candidateRow = (pack.candidates || []).find(
      (c) => c.pack_candidate_id === Number(pack_candidate_id)
    );
    if (!candidateRow) {
      throw { status: 404, message: 'Candidate not found in this interview pack' };
    }

    const { scores, recommendation, strengths, concerns, question_notes } = outcomeData || {};

    // Sanitize question_notes: only string values, capped at 500 chars each.
    // Never trust the client-side cap alone — enforce it server-side too.
    const cleanNotes = {};
    if (question_notes && typeof question_notes === 'object') {
      for (const [qId, text] of Object.entries(question_notes)) {
        if (typeof text === 'string') cleanNotes[qId] = text.slice(0, 500);
      }
    }

    // Compute weighted total
    const competencies = pack.rubric_snapshot?.competencies || [];
    const weighted_total = scores ? computeWeightedTotal(scores, competencies) : null;

    const outcome = await interviewPackModel.upsertOutcome({
      pack_id:           pack.id,
      pack_candidate_id: Number(pack_candidate_id),
      scores:            scores || {},
      weighted_total,
      recommendation:    recommendation || null,
      strengths:         strengths || null,
      concerns:          concerns || null,
      question_notes:    cleanNotes,
    });

    return outcome;
  }

  /**
   * Submit the pack — locks it as submitted.
   * Also updates candidate_interview.status → 'interviewed' for each scored candidate,
   * so the Result / Decide tabs unlock on the admin candidate detail page.
   */
  async submit(token) {
    if (!token) throw { status: 400, message: 'token is required' };

    const pack = await interviewPackModel.getByToken(token);
    if (!pack) throw { status: 404, message: 'Interview pack not found' };
    if (pack.status === 'submitted') {
      throw { status: 409, message: 'This interview pack is already submitted' };
    }

    const submitted = await interviewPackModel.submit(token);
    if (!submitted) throw { status: 500, message: 'Failed to submit interview pack' };

    // Promote candidate_interview status to 'result' for every scored candidate.
    // Only advances status — never goes backwards (keeps result / done / cancelled intact).
    const scoredCandidates = (pack.candidates || []).filter((c) => c.outcome_id != null);
    if (scoredCandidates.length > 0) {
      const db = getDb();
      for (const c of scoredCandidates) {
        await db.query(
          `UPDATE candidate_interview ci
              SET status     = 'result',
                  updated_at = NOW()
             FROM master_candidate mc
            WHERE ci.candidate_id = mc.id
              AND mc.applicant_id  = $1
              AND ci.job_id        = $2
              AND ci.status NOT IN ('result', 'done', 'cancelled')`,
          [c.applicant_id, pack.job_id]
        );
      }
    }

    return submitted;
  }

  /**
   * Delete a pack (admin only).
   */
  async delete(id) {
    if (!id) throw { status: 400, message: 'id is required' };
    const deleted = await interviewPackModel.delete(id);
    if (!deleted) throw { status: 404, message: 'Interview pack not found' };
    return deleted;
  }
}

export default new InterviewPackService();
