import * as menusApi from '../api/menus.api';

export const fetchMenus = async () => {
  const res = await menusApi.getMenus();
  return res.data;
};

export const fetchMenuById = async (id) => {
  const res = await menusApi.getMenuById(id);
  return res.data;
};

export const fetchMenusByModule = async (module_id) => {
  const res = await menusApi.getMenusByModule(module_id);
  return res.data;
};

export const createMenu = async (data) => {
  const res = await menusApi.createMenu(data);
  return res.data;
};

export const updateMenu = async (id, data) => {
  const res = await menusApi.updateMenu(id, data);
  return res.data;
};

export const deleteMenu = async (id) => {
  const res = await menusApi.deleteMenu(id);
  return res.data;
};
