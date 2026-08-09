import InterviewPackService from './interview-pack.service.js';

class InterviewPackController {
  /**
   * POST /api/interview-pack
   * Create a new interview pack. Requires auth (req.user.company_id).
   */
  async create(req, res) {
    try {
      const { company_id, id: userId } = req.user;
      const data = { ...req.body, company_id };
      const result = await InterviewPackService.create(data, userId);
      res.status(201).json({ message: 'Interview pack created', pack: result });
    } catch (err) {
      console.error('InterviewPackController.create:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  /**
   * GET /api/interview-pack
   * List all packs for the authenticated company.
   */
  async getAll(req, res) {
    try {
      const { company_id } = req.user;
      const result = await InterviewPackService.getByCompany(company_id);
      res.json({ message: 'Interview packs fetched', packs: result });
    } catch (err) {
      console.error('InterviewPackController.getAll:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  /**
   * GET /api/interview-pack/:id
   * Get a single pack by id (admin view).
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const result = await InterviewPackService.getById(id);
      res.json({ message: 'Interview pack fetched', pack: result });
    } catch (err) {
      console.error('InterviewPackController.getById:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  /**
   * DELETE /api/interview-pack/:id
   * Delete a pack (admin only).
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await InterviewPackService.delete(id);
      res.json({ message: 'Interview pack deleted', pack: result });
    } catch (err) {
      console.error('InterviewPackController.delete:', err);
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new InterviewPackController();
