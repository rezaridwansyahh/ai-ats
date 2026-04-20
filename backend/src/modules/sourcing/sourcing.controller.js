import sourcingService from './sourcing.service.js';

class SourcingController {
  // ─── Sourcing ───

  async getAll(req, res) {
    try {
      const sourcings = await sourcingService.getAll();
      res.status(200).json({ message: 'List all Sourcings', sourcings });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const { sourcing, recruites } = await sourcingService.getById(req.params.id);
      res.status(200).json({ message: 'Sourcing found', sourcing, recruites });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      const sourcing = await sourcingService.create(req.body);
      res.status(201).json({ message: 'Sourcing created', sourcing });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      const sourcing = await sourcingService.update(req.params.id, req.body);
      res.status(200).json({ message: 'Sourcing updated', sourcing });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const sourcing = await sourcingService.delete(req.params.id);
      res.status(200).json({ message: 'Sourcing deleted', sourcing });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async search(req, res) {
    try {
      const result = await sourcingService.search(req.body);
      res.status(202).json({ message: 'Search queued', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  // ─── Sourcing Recruite ───

  async getRecruits(req, res) {
    try {
      const recruites = await sourcingService.getRecruits(req.params.sourcingId);
      res.status(200).json({ message: 'List recruites for sourcing', recruites });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getRecruitById(req, res) {
    try {
      const recruit = await sourcingService.getRecruitById(req.params.sourcingId, req.params.id);
      res.status(200).json({ message: 'Recruit found', recruit });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async createRecruit(req, res) {
    try {
      const recruit = await sourcingService.createRecruit(req.params.sourcingId, req.body);
      res.status(201).json({ message: 'Recruit created', recruit });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async updateRecruit(req, res) {
    try {
      const recruit = await sourcingService.updateRecruit(req.params.sourcingId, req.params.id, req.body);
      res.status(200).json({ message: 'Recruit updated', recruit });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async deleteRecruit(req, res) {
    try {
      const recruit = await sourcingService.deleteRecruit(req.params.sourcingId, req.params.id);
      res.status(200).json({ message: 'Recruit deleted', recruit });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new SourcingController();
