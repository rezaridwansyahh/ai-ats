import SourceService from './source.service.js';

class SourceController {
  async upload(req, res) {
    try {
      if (!req.file) return res.status(400).json({ message: 'A PDF file is required.' });
      const result = await SourceService.upload({
        company_id: req.user.company_id,
        uploaded_by: req.user.id,
        filePath: req.file.path,
        originalName: req.file.originalname,
      });
      res.status(201).json({ message: 'Document indexed', source: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message || 'Failed to upload document.' });
    }
  }

  async list(req, res) {
    try {
      const sources = await SourceService.list(req.user.company_id);
      res.status(200).json({ message: 'Documents fetched', sources });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async remove(req, res) {
    try {
      await SourceService.remove(req.params.id, req.user.company_id);
      res.status(200).json({ message: 'Document removed' });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new SourceController();