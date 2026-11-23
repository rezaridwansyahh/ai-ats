import Menu from './menu.model.js';

class MenuService {
  async getAll() {
    return await Menu.getAll();
  }

  async getById(id) {
    const menu = await Menu.getById(id);
    if (!menu) throw { status: 404, message: 'Menu not found' };
    return menu;
  }

  async create(name) {
    return await Menu.create(name);
  }

  async update(id, name) {
    const updatedMenu = await Menu.update(id, { name });
    if (!updatedMenu) throw { status: 404, message: 'Menu not found' };
    return updatedMenu;
  }

  async delete(id) {
    const deletedMenu = await Menu.delete(id);
    if (!deletedMenu) throw { status: 404, message: 'Menu not found' };
    return deletedMenu;
  }
}

export default new MenuService();