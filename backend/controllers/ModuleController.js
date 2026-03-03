import Menu from '../model/MenuModel.js';
import Module from '../model/ModuleModel.js';

class ModuleController {
  static async getAll(req, res){
    try {
      const modules = await Module.getAll();

      res.status(200).json({ 
        message: "List all Modules",
        modules
      });
    } catch(err){
      res.status(500).json({ message: err.message });
    }
  }

  static async getById(req, res){
    const { id } = req.params;
    
    try {
      const module = await Module.getById(id);    
      
      if(!module){
        return res.status(404).json({ message: "Module not found"});
      }

      res.status(200).json({
        message: "List Module by Id",
        module
        });
    } catch(err){
      res.status(500).json({ message: err.message});
    }
  }

  static async getByMenuId(req, res) {
    const { menu_id } = req.params;
    
    try {
      const menu = await Menu.getById(menu_id);

      if (!menu) {
        return res.status(404).json({ message: 'Menu Not Found' });
      }

      const modules = await Module.getByMenuId(menu_id);

      res.status(200).json({ 
        message: "List all Modules contain this Menu",
        menu,
        modules 
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  static async create(req, res){
    const { name } = req.body;
    
    try{
      const newModule = await Module.create( name );

      res.status(201).json({ 
        message: "added new module",
        newModule
      });
    }catch(err){
      res.status(500).json({ message: err.message });
    }
  }

  static async update(req, res){
    const { id } = req.params;
    const { name } = req.body;
    try{
      const updatedModule = await Module.update(id, { name });
      if(!updatedModule){
        return res.status(404).json({ message: "Module not found"});
      }
      res.status(200).json({ 
        message: "module has been updated successfully",
        updatedModule
      });
    }catch(err){
      res.status(500).json({ message: err.message });
    }
  }

  static async delete(req, res){
    const { id } = req.params;
    try{
      const deletedModule = await Module.delete(id);
      if(!deletedModule){
        return res.status(404).json({ message: "Module not found"});
      }
      res.status(200).json({ 
        message: "module has been deleted successfully",
        deletedModule 
      });
    }catch(err){
      res.status(500).json({ message: err.message });
    }
  }

}

export default ModuleController;