import InterviewPackService from '../interview-pack/interview-pack.service.js';

class PortalInterviewController {
  /**
   * GET /api/portal-interview/:token
   * Public — no auth required.
   * Returns the interview pack (job info + candidates + rubric) for the interviewer.
   */
  async getByToken(req, res) {
    try {
      const { token } = req.params;
      const result = await InterviewPackService.getByToken(token);
      res.json({ message: 'Interview pack found', pack: result });
    } catch (err) {
      console.error('PortalInterviewController.getByToken:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  /**
   * GET /api/portal-interview/:token/candidate/:packCandidateId/cv
   * Public — no auth required. Token scopes access to only this pack's candidates.
   */
  async downloadCv(req, res) {
    try {
      const { token, packCandidateId } = req.params;
      const { filePath } = await InterviewPackService.getCvPathByToken(token, packCandidateId);
      res.download(filePath);
    } catch (err) {
      console.error('PortalInterviewController.downloadCv:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  /**
   * PUT /api/portal-interview/:token/outcome/:packCandidateId
   * Public — no auth required.
   * Autosave scores/recommendation/strengths/concerns for one candidate.
   * Body: { scores, recommendation, strengths, concerns }
   */
  async saveOutcome(req, res) {
    try {
      const { token, packCandidateId } = req.params;
      const result = await InterviewPackService.saveOutcome(token, packCandidateId, req.body);
      res.json({ message: 'Outcome saved', outcome: result });
    } catch (err) {
      console.error('PortalInterviewController.saveOutcome:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  /**
   * POST /api/portal-interview/:token/submit
   * Public — no auth required.
   * Lock the pack as submitted. Once submitted, no further edits are possible.
   */
  async submit(req, res) {
    try {
      const { token } = req.params;
      const result = await InterviewPackService.submit(token);
      res.json({ message: 'Interview pack submitted successfully', pack: result });
    } catch (err) {
      console.error('PortalInterviewController.submit:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new PortalInterviewController();
