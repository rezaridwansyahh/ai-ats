import moduleService from './module.service.js';

class ModuleController {
  async getAll(req, res) {
    try {
      const modules = await moduleService.getAll();
      res.status(200).json({ message: "List all Modules", modules });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const mod = await moduleService.getById(req.params.id);
      res.status(200).json({ message: "List Module by Id", module: mod });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getByMenuId(req, res) {
    try {
      const { menu, modules } = await moduleService.getByMenuId(req.params.menu_id);
      res.status(200).json({ message: "List all Modules contain this Menu", menu, modules });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      const newModule = await moduleService.create(req.body.name);
      res.status(201).json({ message: "added new module", newModule });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      const updatedModule = await moduleService.update(req.params.id, req.body.name);
      res.status(200).json({ message: "module has been updated successfully", updatedModule });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const deletedModule = await moduleService.delete(req.params.id);
      res.status(200).json({ message: "module has been deleted successfully", deletedModule });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new ModuleController();
