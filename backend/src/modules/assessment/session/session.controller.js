import sessionService from './session.service.js';

class SessionController {
  async getAll(req, res) {
    try {
      const { status, battery, job_id } = req.query;
      const sessions = await sessionService.getAll({ status, battery, job_id });
      res.status(200).json({ message: 'List all sessions', sessions });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const session = await sessionService.getById(req.params.id);
      res.status(200).json({ message: 'Session found', session });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByToken(req, res) {
    try {
      const session = await sessionService.getByToken(req.params.token);
      res.status(200).json({ message: 'Session found', session });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByParticipantId(req, res) {
    try {
      const sessions = await sessionService.getByParticipantId(req.params.participant_id);
      res.status(200).json({ message: 'Sessions for participant', sessions });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByJobId(req, res) {
    try {
      const sessions = await sessionService.getByJobId(req.params.job_id);
      res.status(200).json({ message: 'Sessions for job', sessions });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getActiveByCandidateJob(req, res) {
    try {
      const { candidate_id, job_id } = req.query;
      const sessions = await sessionService.getActiveByCandidateJob({
        candidate_id: candidate_id != null ? Number(candidate_id) : null,
        job_id:       job_id != null && job_id !== '' ? Number(job_id) : null,
      });
      res.status(200).json({ message: 'Active sessions for candidate', sessions });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async findOrCreateFromCandidate(req, res) {
    try {
      const { candidate_id, job_id, battery, expired_at } = req.body;
      const created_by = req.user?.id ?? req.body.created_by;
      const result = await sessionService.findOrCreateFromCandidate({
        candidate_id, job_id, battery, created_by, expired_at,
      });
      res.status(result.created ? 201 : 200).json({
        message: result.created ? 'Session created' : 'Existing session returned',
        session: result.session,
        participant: result.participant,
        created: result.created,
      });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      const { battery, participant_id, job_id, expired_at, notes } = req.body;
      const created_by = req.user?.id ?? req.body.created_by;
      const session = await sessionService.create({
        battery,
        participant_id,
        job_id,
        created_by,
        expired_at,
        notes,
      });
      res.status(201).json({ message: 'Session created', session });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      const session = await sessionService.update(req.params.id, req.body);
      res.status(200).json({ message: 'Session updated', session });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async markCompleted(req, res) {
    try {
      const session = await sessionService.markCompleted(req.params.id);
      res.status(200).json({ message: 'Session marked completed', session });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async markCompletedByToken(req, res) {
    try {
      const session = await sessionService.markCompletedByToken(req.params.token);
      res.status(200).json({ message: 'Session marked completed', session });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const session = await sessionService.delete(req.params.id);
      res.status(200).json({ message: 'Session deleted', session });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new SessionController();
