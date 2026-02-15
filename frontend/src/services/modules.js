import * as modulesApi from '../api/modules.api';

export const fetchModules = async () => {
  const res = await modulesApi.getModules();
  return res.data;
};

export const fetchModuleById = async (id) => {
  const res = await modulesApi.getModuleById(id);
  return res.data;
};

export const fetchModulesByMenu = async (menu_id) => {
  const res = await modulesApi.getModulesByMenu(menu_id);
  return res.data;
};

export const createModule = async (data) => {
  const res = await modulesApi.createModule(data);
  return res.data;
};

export const updateModule = async (id, data) => {
  const res = await modulesApi.updateModule(id, data);
  return res.data;
};

export const deleteModule = async (id) => {
  const res = await modulesApi.deleteModule(id);
  return res.data;
};
