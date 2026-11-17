import importService from './employee-import.service.js';

class EmployeeImportController {
  async preview(req, res) {
    try {
      const result = await importService.preview(req.file);
      res.status(200).json({ message: 'Import preview', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async validate(req, res) {
    try {
      const result = await importService.validate(req.file, req.body);
      res.status(200).json({ message: 'Import validated', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async commit(req, res) {
    try {
      const result = await importService.commit(req.file, req.body);
      res.status(201).json({ message: 'Import completed', ...result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new EmployeeImportController();