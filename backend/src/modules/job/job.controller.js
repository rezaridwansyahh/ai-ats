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
    const { id } = req.body;

    try {
      const form = await jobService.getById(id);

      const requires = [
        "job_title", 
        "job_location", 
        "work_option", 
        "work_type", 
        "company",
        "seniority_level"
      ];

      const missing = [];

      for(const require of requires) {
        if(!form[require]) {
          missing.push(require);
        }
      }

      if(missing.length > 0) {
        return res.status(400).json({ message: "Column missing", missing });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let fileText = null;

      if (req.file) {
        fileText = await parseFileToText(req.file);
      }

      const aiContext = {
        company_id: req.user?.company_id ?? null,
        user_id:    req.user?.user_id    ?? null,
      };
      for await (const chunk of aiService.generateStream(form, fileText, aiContext)) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err) {
      if(!res.headersSent) {
        return res.status(err.status || 500).json({ message: err.message });
      }

      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
}

export default new JobController();
