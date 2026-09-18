import jwt from 'jsonwebtoken';
import PortalAssessment from './portal-assessment.model.js';
import AssessmentBatteryResult from '../assessment/assessment-battery-result/assessment-battery-result.model.js';
import assessmentBatteryResultService from '../assessment/assessment-battery-result/assessment-battery-result.service.js';
import questionService from '../assessment/question/question.service.js';
import assessmentAnswerService from '../assessment/assessment-answer/assessment-answer.service.js';
import assessmentScoreService from '../assessment/assessment-score/assessment-score.service.js';
import Session from '../assessment/session/session.model.js';
import getDb from '../../config/postgres.js';

const JWT_SECRET = process.env.JWT_SECRET;
const PORTAL_TOKEN_TTL_SECONDS = 4 * 60 * 60; // 4 hours

// Battery code → master_assessment.id (seeded in db/data/assessments.js).
const ASSESSMENT_ID_BY_BATTERY = { A: 1, B: 2, C: 3, D: 4, I: 5, T: 6 };
const ASSESSMENT_CODE_BY_BATTERY = {
  A: 'myralix_battery_a', B: 'myralix_battery_b', C: 'myralix_battery_c', D: 'myralix_battery_d',
  I: 'myralix_insights_discovery', T: 'myralix_thomas_kilmann',
};

// Accept a hash with or without dashes; reject anything else.
function isHashFormat(s) {
  if (typeof s !== 'string') return false;
  return /^[0-9a-fA-F]{32}$/.test(s) || /^[0-9a-fA-F-]{36}$/.test(s);
}

const TERMINAL_STATUSES = ['completed', 'revoked', 'expired'];

async function lazyExpire(session) {
  if (!session) return session;
  if (TERMINAL_STATUSES.includes(session.status)) return session;
  if (!session.expired_at) return session;
  if (new Date(session.expired_at).getTime() >= Date.now()) return session;
  const result = await getDb().query(
    `UPDATE assessment_sessions
        SET status = 'expired', updated_at = NOW()
      WHERE id = $1
      RETURNING status, updated_at`,
    [session.id]
  );
  return { ...session, ...result.rows[0] };
}

class PortalAssessmentService {
  async getByHash(hash) {
    if (!isHashFormat(hash)) {
      throw { status: 404, message: 'Invalid invitation link.' };
    }
    const raw = await PortalAssessment.getByHash(hash);
    if (!raw) throw { status: 404, message: 'Invalid invitation link.' };
    const session = await lazyExpire(raw);

    // Public payload — strip PII (no email, no participant_id). Terminal
    // statuses (expired/revoked/completed) are returned so the frontend can
    // route to a dedicated view instead of falling through to the email gate.
    return {
      battery:    session.battery,
      job_title:  session.job_title,
      status:     session.status,
      expired_at: session.expired_at,
    };
  }

  async verifyEmail(hash, email) {
    if (!isHashFormat(hash)) {
      throw { status: 404, message: 'Invalid invitation link.' };
    }
    if (typeof email !== 'string' || !email.trim()) {
      throw { status: 400, message: 'Email is required.' };
    }

    const raw = await PortalAssessment.getByHash(hash);
    if (!raw) throw { status: 404, message: 'Invalid invitation link.' };
    const session = await lazyExpire(raw);
    if (session.status === 'expired') {
      throw { status: 410, message: 'This invitation has expired.', code: 'expired' };
    }
    if (session.status === 'revoked') {
      throw { status: 410, message: 'This invitation has been revoked by the recruiter.', code: 'revoked' };
    }

    const expected = (session.candidate_email || '').trim().toLowerCase();
    const given    = email.trim().toLowerCase();
    if (!expected || expected !== given) {
      throw { status: 401, message: "Email doesn't match this invitation." };
    }

    const portalToken = jwt.sign(
      { session_id: session.id, scope: 'portal' },
      JWT_SECRET,
      { expiresIn: PORTAL_TOKEN_TTL_SECONDS }
    );

    return {
      portal_token: portalToken,
      session: {
        battery:                session.battery,
        job_title:              session.job_title,
        status:                 session.status,
        candidate_name:       session.candidate_name,
        candidate_email:      session.candidate_email,
        candidate_id:         session.candidate_id,
        candidate_position:   session.candidate_position,
        candidate_education:  session.candidate_education,
      },
    };
  }

  // Candidate fills the participant-data form (image 2) after the email gate. The
  // invitation already created a participant from the applicant record; here we update
  // that bound record with the candidate's own input. Email is NOT updatable — it's the
  // verified invitation key the email gate matches against.
  async updateParticipant({ sessionId, fields }) {
    if (!sessionId) throw { status: 400, message: 'session_id is required' };

    const raw = await Session.getById(sessionId);
    if (!raw) throw { status: 404, message: 'Session not found' };
    const session = await lazyExpire(raw);
    if (session.candidate_id == null) {
      throw { status: 400, message: 'Session is not bound to a candidate.' };
    }
    if (session.status === 'completed') {
      throw { status: 409, message: 'This assessment has already been submitted.' };
    }
    if (session.status === 'revoked') {
      throw { status: 410, message: 'This invitation has been revoked by the recruiter.', code: 'revoked' };
    }
    if (session.status === 'expired') {
      throw { status: 410, message: 'This invitation has expired.', code: 'expired' };
    }

    const ALLOWED = ['name', 'position', 'department', 'education', 'date_birth'];
    const allowed = {};
    for (const k of ALLOWED) {
      if (fields?.[k] !== undefined) allowed[k] = fields[k];
    }
    if (Object.keys(allowed).length === 0) {
      throw { status: 400, message: 'No valid participant fields to update.' };
    }

    return { candidate_id: session.candidate_id };
  }

  // Creates (or returns the existing) result row before any subtest is answered,
  // so assessment_answer/assessment_score saves have a real result_id from the
  // very first question — mirrors assessmentBatteryResultService.startAttempt(),
  // just resolving candidate_id/assessment_id from the portal session instead of
  // the request body (a candidate on this path never sends their own candidate_id).
  async startAttempt({ sessionId }) {
    if (!sessionId) throw { status: 400, message: 'session_id is required' };

    const raw = await Session.getById(sessionId);
    if (!raw) throw { status: 404, message: 'Session not found' };
    const session = await lazyExpire(raw);
    if (!session.candidate_id) throw { status: 400, message: 'Session is not bound to a candidate.' };
    if (session.status === 'completed') {
      throw { status: 409, message: 'This assessment has already been submitted.' };
    }
    if (session.status === 'revoked') {
      throw { status: 410, message: 'This invitation has been revoked by the recruiter.', code: 'revoked' };
    }
    if (session.status === 'expired') {
      throw { status: 410, message: 'This invitation has expired.', code: 'expired' };
    }

    const assessmentId = ASSESSMENT_ID_BY_BATTERY[session.battery];
    if (!assessmentId) throw { status: 400, message: `Unknown battery: ${session.battery}` };

    const result = await assessmentBatteryResultService.startAttempt({
      candidate_id: session.candidate_id,
      assessment_id: assessmentId,
    });
    return { result, session_id: sessionId };
  }

  // Read-only question bank access for the candidate taking the test — the
  // staff-facing /api/question routes are authToken-gated (recruiter JWT) and
  // unreachable from the portal session (a different JWT scope entirely), so
  // this is a portal-authenticated passthrough to the same underlying service.
  async getQuestions({ sessionId }) {
    if (!sessionId) throw { status: 400, message: 'session_id is required' };
    const raw = await Session.getById(sessionId);
    if (!raw) throw { status: 404, message: 'Session not found' };
    const session = await lazyExpire(raw);

    const code = ASSESSMENT_CODE_BY_BATTERY[session.battery];
    if (!code) throw { status: 400, message: `Unknown battery: ${session.battery}` };

    const questions = await questionService.getQuestionsByCode(code);
    return { questions };
  }

  // Passthrough saves for per-question answers / per-subtest scores — same
  // reasoning as getQuestions above. result_id comes from the client, which
  // already holds it from startAttempt(); the portal JWT (verified by
  // requirePortalAuth before this is ever called) is what proves this
  // candidate legitimately owns that attempt.
  async saveAnswer({ result_id, question_id, answer, is_correct, score_earned }) {
    return await assessmentAnswerService.upsert({ result_id, question_id, answer, is_correct, score_earned });
  }

  // Resume support — lets a Test component rehydrate its in-progress state (which
  // atomic subtests are already scored, which questions already have an answer)
  // after a refresh/reload, instead of always starting the current subtest over.
  // Resolves result_id from the session itself (candidate_id + assessment_id),
  // never from client input, since this is a read the candidate can't spoof.
  async getProgress({ sessionId }) {
    if (!sessionId) throw { status: 400, message: 'session_id is required' };
    const raw = await Session.getById(sessionId);
    if (!raw) throw { status: 404, message: 'Session not found' };
    const session = await lazyExpire(raw);
    if (!session.candidate_id) return { result_id: null, answers: [], scores: [] };

    const assessmentId = ASSESSMENT_ID_BY_BATTERY[session.battery];
    if (!assessmentId) throw { status: 400, message: `Unknown battery: ${session.battery}` };

    const result = await AssessmentBatteryResult.getByParticipantAndAssessment(session.candidate_id, assessmentId);
    if (!result) return { result_id: null, answers: [], scores: [] };

    const [answers, scores] = await Promise.all([
      assessmentAnswerService.getByResultId(result.id),
      assessmentScoreService.getByResultId(result.id),
    ]);
    return { result_id: result.id, answers, scores };
  }

  async saveSubtestScore({ result_id, subtest_id, score }) {
    return await assessmentScoreService.upsert({ result_id, subtest_id, score });
  }

  async submit({ sessionId, results, summary }) {
    if (!sessionId)               throw { status: 400, message: 'session_id is required' };
    if (!results?.by_subtest)     throw { status: 400, message: 'results.by_subtest is required' };

    const raw = await Session.getById(sessionId);
    if (!raw) throw { status: 404, message: 'Session not found' };
    const session = await lazyExpire(raw);
    if (!session.candidate_id)    throw { status: 400, message: 'Session is not bound to a candidate.' };    
    // One-time attempt: an already-completed invitation can't be re-submitted.
    if (session.status === 'completed') {
      throw { status: 409, message: 'This assessment has already been submitted. Re-takes are not allowed.' };
    }
    if (session.status === 'revoked') {
      throw { status: 410, message: 'This invitation has been revoked by the recruiter.', code: 'revoked' };
    }
    if (session.status === 'expired') {
      throw { status: 410, message: 'This invitation has expired.', code: 'expired' };
    }

    const assessmentId = ASSESSMENT_ID_BY_BATTERY[session.battery];
    if (!assessmentId)            throw { status: 400, message: `Unknown battery: ${session.battery}` };

    const client = await getDb().connect();
    try {
      await client.query('BEGIN');

      // A draft row may already exist from startAttempt() — update it in place
      // instead of inserting a second row, which would hit the
      // UNIQUE (candidate_id, assessment_id) constraint.
      const existing = await AssessmentBatteryResult.getForUpdate(client, session.candidate_id, assessmentId);
      const row = existing
        ? await AssessmentBatteryResult.update(client, existing.id, {
            status: 'completed',
            results,
            summary,
            started_at: existing.started_at || null,
            completed_at: new Date().toISOString(),
          })
        : await AssessmentBatteryResult.create(client, {
            candidate_id: session.candidate_id,
            assessment_id:  assessmentId,
            status:         'completed',
            results,
            summary,
            started_at:     null,
            completed_at:   new Date().toISOString(),
          });

      // Flip session lifecycle — recruiter Take tab depends on this.
      await client.query(
        `UPDATE assessment_sessions
            SET status = 'completed',
                submitted_at = NOW(),
                updated_at   = NOW()
          WHERE id = $1`,
        [sessionId]
      );

      await client.query('COMMIT');
      return { result: row, session_id: sessionId };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export default new PortalAssessmentService();
