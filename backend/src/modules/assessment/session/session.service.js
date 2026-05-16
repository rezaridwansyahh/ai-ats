import Session from './session.model.js';
import Participant from '../participant/participant.model.js';
import { resolveParticipantByCandidate } from '../../../shared/services/candidate-resolver.js';

const EDITABLE_FIELDS = ['battery', 'participant_id', 'job_id', 'status', 'expired_at', 'notes'];
const VALID_BATTERIES = ['A', 'B', 'C', 'D'];
const VALID_STATUSES = ['invited', 'in_progress', 'completed', 'expired'];

function isExpired(session) {
  if (!session?.expired_at) return false;
  return new Date(session.expired_at).getTime() < Date.now();
}

class SessionService {
  async getAll({ status, battery, job_id } = {}) {
    return await Session.getAll({ status, battery, job_id });
  }

  async getById(id) {
    const session = await Session.getById(id);
    if (!session) throw { status: 404, message: 'Session not found' };
    return session;
  }

  async getByToken(token) {
    if (!token) throw { status: 400, message: 'token is required' };
    const session = await Session.getByToken(token);
    if (!session) throw { status: 404, message: 'Session not found' };

    if (session.status !== 'completed' && session.status !== 'expired' && isExpired(session)) {
      return await Session.update(session.id, { status: 'expired' });
    }
    return session;
  }

  async getByParticipantId(participant_id) {
    if (!participant_id) throw { status: 400, message: 'participant_id is required' };
    return await Session.getByParticipantId(participant_id);
  }

  async getByJobId(job_id) {
    if (!job_id) throw { status: 400, message: 'job_id is required' };
    return await Session.getByJobId(job_id);
  }

  async create({ battery, participant_id, job_id, created_by, expired_at, notes }) {
    if (!battery) throw { status: 400, message: 'battery is required' };
    if (!VALID_BATTERIES.includes(battery)) {
      throw { status: 400, message: `battery must be one of ${VALID_BATTERIES.join(', ')}` };
    }
    if (!expired_at) throw { status: 400, message: 'expired_at is required' };

    if (participant_id) {
      const participant = await Participant.getById(participant_id);
      if (!participant) throw { status: 404, message: 'Participant not found' };
    }

    return await Session.create({ battery, participant_id, job_id, created_by, expired_at, notes });
  }

  async findOrCreateFromCandidate({ candidate_id, job_id, battery, created_by, expired_at }) {
    if (!candidate_id) throw { status: 400, message: 'candidate_id is required' };
    if (!battery)      throw { status: 400, message: 'battery is required' };
    if (!VALID_BATTERIES.includes(battery)) {
      throw { status: 400, message: `battery must be one of ${VALID_BATTERIES.join(', ')}` };
    }

    const { participant, candidateJobId } =
      await resolveParticipantByCandidate(candidate_id, { createIfMissing: true });

    const effectiveJobId = job_id ?? candidateJobId ?? null;

    // Idempotency: return live session if one already exists for this triple.
    const existing = await Session.getByParticipantJobBattery(participant.id, effectiveJobId, battery);
    if (existing) {
      return { session: existing, participant, created: false };
    }

    const ttlMs = 7 * 24 * 60 * 60 * 1000;
    const expiry = expired_at || new Date(Date.now() + ttlMs).toISOString();

    const session = await Session.create({
      battery,
      participant_id: participant.id,
      job_id:         effectiveJobId,
      created_by:     created_by ?? null,
      expired_at:     expiry,
      notes:          null,
    });
    return { session, participant, created: true };
  }

  async getActiveByCandidateJob({ candidate_id, job_id }) {
    if (!candidate_id) throw { status: 400, message: 'candidate_id is required' };

    const { participant, candidateJobId } =
      await resolveParticipantByCandidate(candidate_id, { createIfMissing: false });
    if (!participant) return [];

    const effectiveJobId = job_id ?? candidateJobId ?? null;
    return await Session.getActiveByParticipantJob(participant.id, effectiveJobId);
  }

  async update(id, fields) {
    const session = await Session.getById(id);
    if (!session) throw { status: 404, message: 'Session not found' };

    const allowed = {};
    for (const key of EDITABLE_FIELDS) {
      if (fields[key] !== undefined) allowed[key] = fields[key];
    }

    if (Object.keys(allowed).length === 0) {
      throw { status: 400, message: 'No valid fields to update' };
    }

    if (allowed.battery && !VALID_BATTERIES.includes(allowed.battery)) {
      throw { status: 400, message: `battery must be one of ${VALID_BATTERIES.join(', ')}` };
    }
    if (allowed.status && !VALID_STATUSES.includes(allowed.status)) {
      throw { status: 400, message: `status must be one of ${VALID_STATUSES.join(', ')}` };
    }

    return await Session.update(id, allowed);
  }

  async markCompleted(id) {
    const session = await Session.getById(id);
    if (!session) throw { status: 404, message: 'Session not found' };
    if (session.status === 'completed') throw { status: 409, message: 'Session is already completed' };
    if (session.status === 'expired' || isExpired(session)) {
      throw { status: 410, message: 'Session has expired' };
    }
    return await Session.markCompleted(id);
  }

  async markCompletedByToken(token) {
    const session = await this.getByToken(token);
    if (session.status === 'completed') throw { status: 409, message: 'Session is already completed' };
    if (session.status === 'expired') throw { status: 410, message: 'Session has expired' };
    return await Session.markCompleted(session.id);
  }

  async delete(id) {
    const session = await Session.getById(id);
    if (!session) throw { status: 404, message: 'Session not found' };
    await Session.delete(id);
    return session;
  }
}

export default new SessionService();
