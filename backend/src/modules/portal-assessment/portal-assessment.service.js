import jwt from 'jsonwebtoken';
import PortalAssessment from './portal-assessment.model.js';
import AssessmentBatteryResult from '../assessment/assessment-battery-result/assessment-battery-result.model.js';
import Session from '../assessment/session/session.model.js';
import getDb from '../../config/postgres.js';

const JWT_SECRET = process.env.JWT_SECRET;
const PORTAL_TOKEN_TTL_SECONDS = 4 * 60 * 60; // 4 hours

// Battery code → master_assessment.id (seeded in db/data/assessments.js).
const ASSESSMENT_ID_BY_BATTERY = { A: 1, B: 2, C: 3, D: 4 };

// Accept a hash with or without dashes; reject anything else.
function isHashFormat(s) {
  if (typeof s !== 'string') return false;
  return /^[0-9a-fA-F]{32}$/.test(s) || /^[0-9a-fA-F-]{36}$/.test(s);
}

class PortalAssessmentService {
  async getByHash(hash) {
    if (!isHashFormat(hash)) {
      throw { status: 404, message: 'Invalid invitation link.' };
    }
    const session = await PortalAssessment.getByHash(hash);
    if (!session) throw { status: 404, message: 'Invalid invitation link.' };

    if (session.expired_at && new Date(session.expired_at) < new Date()) {
      throw { status: 410, message: 'This invitation has expired.' };
    }

    // Public payload — strip PII (no email, no participant_id).
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

    const session = await PortalAssessment.getByHash(hash);
    if (!session) throw { status: 404, message: 'Invalid invitation link.' };
    if (session.expired_at && new Date(session.expired_at) < new Date()) {
      throw { status: 410, message: 'This invitation has expired.' };
    }

    const expected = (session.participant_email || '').trim().toLowerCase();
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
        participant_name:       session.participant_name,
        participant_email:      session.participant_email,
        participant_id:         session.participant_id,
        participant_position:   session.participant_position,
        participant_department: session.participant_department,
        participant_education:  session.participant_education,
        participant_date_birth: session.participant_date_birth,
      },
    };
  }

  async submit({ sessionId, results, summary }) {
    if (!sessionId)               throw { status: 400, message: 'session_id is required' };
    if (!results?.by_subtest)     throw { status: 400, message: 'results.by_subtest is required' };

    const session = await Session.getById(sessionId);
    if (!session) throw { status: 404, message: 'Session not found' };
    if (!session.participant_id)  throw { status: 400, message: 'Session is not bound to a participant.' };
    // One-time attempt: an already-completed invitation can't be re-submitted.
    if (session.status === 'completed') {
      throw { status: 409, message: 'This assessment has already been submitted. Re-takes are not allowed.' };
    }

    const assessmentId = ASSESSMENT_ID_BY_BATTERY[session.battery];
    if (!assessmentId)            throw { status: 400, message: `Unknown battery: ${session.battery}` };

    const client = await getDb().connect();
    try {
      await client.query('BEGIN');

      const row = await AssessmentBatteryResult.create(client, {
        participant_id: session.participant_id,
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
