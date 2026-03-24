import jobService from './job.service.js';
import aiService from '../../shared/services/ai.service.js';
import { parseFileToText } from '../../shared/utils/file-parser.js';

class JobController {
  async getAll(req, res) {
    try {
      const jobs = await jobService.getAll();
      res.status(200).json({ message: 'List all Jobs', jobs });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const job = await jobService.getById(req.params.id);
      res.status(200).json({ message: 'Job found', job });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByStatus(req, res) {
    try {
      const jobs = await jobService.getByStatus(req.query.status);
      res.status(200).json({ message: `List of ${req.query.status} Jobs`, jobs });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getWithCandidates(req, res) {
    try {
      const job = await jobService.getWithCandidates(req.params.id);
      res.status(200).json({ message: 'Job with candidates', job });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      const job = await jobService.create(req.body);
      res.status(201).json({ message: 'Job created', job });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      const job = await jobService.update(req.params.id, req.body);
      res.status(200).json({ message: 'Job updated', job });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const job = await jobService.updateStatus(req.params.id, req.body.status);
      res.status(200).json({ message: `Job status updated to ${req.body.status}`, job });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const job = await jobService.delete(req.params.id);
      res.status(200).json({ message: 'Job deleted', job });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async generate(req, res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const formFields = JSON.parse(req.body.fields || '{}');
      let fileText = null;

      if (req.file) {
        fileText = await parseFileToText(req.file);
      }

      for await (const chunk of aiService.generateStream(formFields, fileText)) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
}

export default new JobController();
