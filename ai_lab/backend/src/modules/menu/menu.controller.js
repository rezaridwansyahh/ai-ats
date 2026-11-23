import menuService from './menu.service.js';

class MenuController {
  async getAll(req, res) {
    try {
      const menus = await menuService.getAll();
      res.status(200).json({ message: "List all Menus", menus });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const menu = await menuService.getById(req.params.id);
      res.status(200).json({ message: "List Menu by Id", menu });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      const newMenu = await menuService.create(req.body.name);
      res.status(201).json({ message: "added new menu", newMenu });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      const updatedMenu = await menuService.update(req.params.id, req.body.name);
      res.status(200).json({ message: "menu has been updated successfully", updatedMenu });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const deletedMenu = await menuService.delete(req.params.id);
      res.status(200).json({ message: "menu has been deleted successfully", deletedMenu });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

export default new MenuController();