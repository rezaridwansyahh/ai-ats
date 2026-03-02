import Module from './module.model.js';
import Menu from '../menu/menu.model.js';

class ModuleService {
  async getAll() {
    return await Module.getAll();
  }

  async getById(id) {
    const mod = await Module.getById(id);
    if (!mod) throw { status: 404, message: 'Module not found' };
    return mod;
  }

  async getByMenuId(menu_id) {
    const menu = await Menu.getById(menu_id);
    if (!menu) throw { status: 404, message: 'Menu Not Found' };

    const modules = await Module.getByMenuId(menu_id);
    return { menu, modules };
  }

  async create(name) {
    return await Module.create(name);
  }

  async update(id, name) {
    const updatedModule = await Module.update(id, { name });
    if (!updatedModule) throw { status: 404, message: 'Module not found' };
    return updatedModule;
  }

  async delete(id) {
    const deletedModule = await Module.delete(id);
    if (!deletedModule) throw { status: 404, message: 'Module not found' };
    return deletedModule;
  }
}

export default new ModuleService();
