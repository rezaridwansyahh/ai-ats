import participantService from './participant.service.js';

class ParticipantController {
  async getAll(req, res) {
    try {
      const participants = await participantService.getAll();
      res.status(200).json({ message: 'List all participants', participants });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const participant = await participantService.getById(req.params.id);
      res.status(200).json({ message: 'Participant found', participant });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByEmail(req, res) {
    try {
      const participant = await participantService.getByEmail(req.params.email);
      res.status(200).json({ message: 'Participant found', participant });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      const { name, email, position, department, education, date_birth } = req.body;
      const participant = await participantService.create(name, email, position, department, education, date_birth);
      res.status(201).json({ message: 'Participant created', participant });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async createByEmail(req, res) {
    try {
      const participant = await participantService.createByEmail(req.body);
      res.status(200).json({ message: 'Participant resolved', participant });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      const participant = await participantService.update(req.params.id, req.body);
      res.status(200).json({ message: 'Participant updated', participant });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const participant = await participantService.delete(req.params.id);
      res.status(200).json({ message: 'Participant deleted', participant });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new ParticipantController();
